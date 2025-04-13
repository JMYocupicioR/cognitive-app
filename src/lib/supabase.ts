import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Verificar y obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Crear cliente de Supabase con configuración mejorada
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-application-name': 'cognitivapp',
        'x-client-info': 'supabase-js/2.x'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Manejador para cambios en el estado de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Actualizar estado de autenticación en localStorage
    const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null;
    
    // Guardar información relevante del usuario y la sesión
    localStorage.setItem('auth.status', 'authenticated');
    localStorage.setItem('auth.expires_at', expiresAt ? expiresAt.toISOString() : '');
    localStorage.setItem('auth.last_activity', new Date().toISOString());
    
    // Evento personalizado para notificar cambios en la autenticación
    window.dispatchEvent(new CustomEvent('supabase.auth.stateChange', { 
      detail: { event, session } 
    }));
  } else if (event === 'SIGNED_OUT') {
    // Limpiar información de autenticación
    localStorage.removeItem('auth.status');
    localStorage.removeItem('auth.expires_at');
    localStorage.removeItem('auth.last_activity');
    
    // Evento personalizado para notificar cierre de sesión
    window.dispatchEvent(new CustomEvent('supabase.auth.stateChange', { 
      detail: { event, session: null } 
    }));
  }
});

// Función auxiliar para verificar si la sesión ha expirado
export const hasSessionExpired = (): boolean => {
  const expiresAt = localStorage.getItem('auth.expires_at');
  if (!expiresAt) return true;
  
  const expiryDate = new Date(expiresAt);
  return new Date() > expiryDate;
};

// Función auxiliar para verificar si hay una sesión activa
export const hasActiveSession = async (): Promise<boolean> => {
  if (hasSessionExpired()) return false;
  
  try {
    const { data, error } = await supabase.auth.getSession();
    return !error && !!data.session;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
};