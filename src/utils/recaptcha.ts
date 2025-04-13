import { supabase } from '../lib/supabase';

interface VerifyRecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  error?: string[];
}

const MIN_SCORE = 0.5;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const tokenCache = new Map<string, {
  timestamp: number;
  result: boolean;
}>();

export async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    // Check cache
    const cached = tokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    // Verify with backend
    const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      body: { 
        token,
        timestamp: Date.now()
      }
    });

    if (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }

    const response = data as VerifyRecaptchaResponse;
    
    if (!response.success) {
      console.error('reCAPTCHA verification failed:', response.error);
      return false;
    }

    const result = response.score >= MIN_SCORE;

    // Cache result
    tokenCache.set(token, {
      timestamp: Date.now(),
      result
    });

    // Log verification
    await supabase.from('security_logs').insert({
      event_type: 'RECAPTCHA_VERIFICATION',
      details: {
        success: result,
        score: response.score,
        hostname: response.hostname,
        timestamp: new Date().toISOString()
      },
      severity: result ? 'low' : 'medium'
    });

    return result;
  } catch (error) {
    console.error('Error in reCAPTCHA verification:', error);
    return false;
  }
}

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      tokenCache.delete(token);
    }
  }
}, CACHE_TTL);