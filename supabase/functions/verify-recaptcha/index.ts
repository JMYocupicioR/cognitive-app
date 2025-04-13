import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const MAX_AGE = 60000; // 1 minuto
const ALLOWED_DOMAINS = ['localhost', 'cognitivapp.com'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

serve(async (req) => {
  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            'Allow': 'POST'
          } 
        }
      );
    }

    // Validar origen
    const origin = req.headers.get('Origin');
    if (origin && !ALLOWED_DOMAINS.some(domain => origin.includes(domain))) {
      return new Response(
        JSON.stringify({ error: 'Origen no permitido' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar cuerpo de la petición
    const { token, action, timestamp } = await req.json();
    
    if (!token || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Token y timestamp son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar edad del token
    if (Date.now() - timestamp > MAX_AGE) {
      return new Response(
        JSON.stringify({ error: 'Token expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar con Google reCAPTCHA con reintentos
    let lastError;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY!,
            response: token,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Registrar verificación
        const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
        await supabase.from('security_logs').insert({
          event_type: 'RECAPTCHA_VERIFICATION',
          details: {
            success: data.success,
            action: action || 'unspecified',
            score: data.score,
            timestamp: new Date().toISOString(),
            hostname: data.hostname,
            retryCount: i
          },
          severity: data.success ? 'low' : 'medium'
        });

        return new Response(
          JSON.stringify(data),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block'
            }
          }
        );
      } catch (error) {
        lastError = error;
        if (i < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
      }
    }

    throw lastError || new Error('Verificación fallida después de reintentos');

  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});