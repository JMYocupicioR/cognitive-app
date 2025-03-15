import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { storageService } from '../services/StorageService';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
  token?: string;
}

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  session_id: string;
  exp: number;
  iat: number;
}

// Constants
const TOKEN_EXPIRY_THRESHOLD = 15 * 60; // 15 minutes in seconds
const TOKEN_HEADER = 'Authorization';
const NEW_TOKEN_HEADER = 'X-New-Token';

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from header
    const authHeader = req.header(TOKEN_HEADER);
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify token and extract session ID
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
    
    if (verifyError || !user) {
      await logAuthEvent('TOKEN_INVALID', req.ip, { error: verifyError?.message });
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get session details
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      await logAuthEvent('SESSION_INVALID', req.ip, { error: sessionError?.message });
      return res.status(403).json({ error: 'Invalid session' });
    }

    // Check if session is active
    const isSessionValid = await validateSession(session.id);
    if (!isSessionValid) {
      await logAuthEvent('SESSION_EXPIRED', req.ip, { sessionId: session.id });
      return res.status(403).json({ error: 'Session expired' });
    }

    // Update last access timestamp
    await updateSessionTimestamp(session.id);

    // Check token expiration and handle renewal if needed
    const tokenExp = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    if (tokenExp && (tokenExp - now) < TOKEN_EXPIRY_THRESHOLD) {
      const { data: { session: newSession }, error: renewError } = await supabase.auth.refreshSession();
      
      if (!renewError && newSession) {
        // Set new token in response header
        res.setHeader(NEW_TOKEN_HEADER, newSession.access_token);
        await logAuthEvent('TOKEN_RENEWED', req.ip, { sessionId: session.id });
      }
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: user.role,
      sessionId: session.id
    };
    req.token = token;

    await logAuthEvent('AUTH_SUCCESS', req.ip, { userId: user.id });
    next();

  } catch (error) {
    await logAuthEvent('AUTH_ERROR', req.ip, { error: error instanceof Error ? error.message : 'Unknown error' });
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Validate session in database
 */
async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('is_valid, last_activity')
      .eq('id', sessionId)
      .single();

    if (error || !data) return false;

    // Check if session is valid and not too old
    const lastActivity = new Date(data.last_activity);
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    
    return data.is_valid && (Date.now() - lastActivity.getTime()) < maxInactivity;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Update session last activity timestamp
 */
async function updateSessionTimestamp(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating session timestamp:', error);
  }
}

/**
 * Log authentication events
 */
async function logAuthEvent(
  eventType: string,
  ipAddress: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_user_id: details.userId,
      p_ip_address: ipAddress,
      p_event_type: eventType,
      p_details: details
    });
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
}