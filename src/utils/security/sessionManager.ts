import { supabase } from '../../lib/supabase';
import { createToken, verifyToken } from './tokenManager';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(userId: string, deviceInfo: any): Promise<string> {
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      device_info: deviceInfo,
      expires_at: new Date(Date.now() + SESSION_TTL).toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return createToken({ 
    session_id: session.id,
    user_id: userId 
  });
}

export async function validateSession(sessionId: string, token: string): Promise<boolean> {
  const isValidToken = await verifyToken(token);
  if (!isValidToken) return false;

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  return !!(
    session &&
    session.is_valid &&
    new Date(session.expires_at) > new Date() &&
    new Date(session.last_activity) > new Date(Date.now() - SESSION_TTL)
  );
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .update({ 
      last_activity: new Date().toISOString() 
    })
    .eq('id', sessionId);
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await supabase
    .from('sessions')
    .update({ 
      is_valid: false,
      invalidated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}