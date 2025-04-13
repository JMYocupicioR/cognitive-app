import { supabase } from '../../lib/supabase';

interface VerifyRecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  error?: string[];
}

const MIN_SCORE = 0.7;
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

    const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      body: { 
        token,
        timestamp: Date.now()
      }
    });

    if (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }

    const response = data as VerifyRecaptchaResponse;
    
    const result = response.success && response.score >= MIN_SCORE;

    // Cache result
    tokenCache.set(token, {
      timestamp: Date.now(),
      result
    });

    return result;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}