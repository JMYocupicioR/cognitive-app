import { SignJWT, jwtVerify } from 'jose';
import { supabase } from '../../lib/supabase';

const SECRET = new TextEncoder().encode(import.meta.env.VITE_JWT_SECRET);

export async function createToken(payload: Record<string, any>): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET);
  
  return jwt;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    // Check if token is blacklisted
    const { data: blacklisted } = await supabase
      .from('token_blacklist')
      .select('token')
      .eq('token', token)
      .single();

    return !blacklisted && !!payload;
  } catch {
    return false;
  }
}

export async function invalidateToken(token: string): Promise<void> {
  await supabase
    .from('token_blacklist')
    .insert({ token, invalidated_at: new Date().toISOString() });
}