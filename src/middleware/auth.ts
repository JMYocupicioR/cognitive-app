import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { storageService } from '../services/StorageService';
import { z } from 'zod';
import { validationSchemas } from '../utils/validation/schemas';

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
  clientIp?: string;
  tokenContext?: {
    refreshed: boolean;
    expiresAt: number;
  };
}

// Constants
const TOKEN_EXPIRY_THRESHOLD = 15 * 60; // 15 minutes in seconds
const TOKEN_HEADER = 'Authorization';
const NEW_TOKEN_HEADER = 'X-New-Token';
const IP_HEADERS = ['X-Forwarded-For', 'X-Real-IP', 'CF-Connecting-IP'];
const ALLOWED_ORIGINS = ['https://cognitivapp.com', 'http://localhost:3000'];
const MAX_TOKEN_REFRESH_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 300; // 5 minutes
const MAX_REQUESTS = 100;

// Error types
class AuthError extends Error {
  constructor(
    message: string,
    public code: number,
    public logDetails?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Validation schemas
const tokenSchema = z.string().regex(/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/);
const ipSchema = z.string().ip();
const originSchema = z.string().url();

/**
 * Extract and validate client IP
 */
function getClientIp(req: Request): string {
  for (const header of IP_HEADERS) {
    const value = req.get(header);
    if (value) {
      const ip = value.split(',')[0].trim();
      try {
        return ipSchema.parse(ip);
      } catch {
        continue;
      }
    }
  }
  return ipSchema.parse(req.ip || '0.0.0.0');
}

/**
 * Validate request origin
 */
function validateOrigin(req: Request): boolean {
  const origin = req.get('Origin');
  if (!origin) return false;
  
  try {
    const parsedOrigin = originSchema.parse(origin);
    return ALLOWED_ORIGINS.includes(parsedOrigin);
  } catch {
    return false;
  }
}

/**
 * Validate token structure locally
 */
function validateTokenStructure(token: string): boolean {
  try {
    return tokenSchema.parse(token) !== null;
  } catch {
    return false;
  }
}

/**
 * Check rate limits
 */
async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  try {
    const { data: isAllowed } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_max_requests: MAX_REQUESTS,
      p_window_seconds: RATE_LIMIT_WINDOW
    });
    return isAllowed;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
}

/**
 * Validate session status
 */
async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('is_valid, last_activity, metadata')
      .eq('id', sessionId)
      .single();

    if (error || !data) return false;

    // Check if session is valid and not too old
    const lastActivity = new Date(data.last_activity);
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    
    // Check for session blocks/revocations
    const isBlocked = data.metadata?.blocked || data.metadata?.revoked;
    
    return data.is_valid && 
           !isBlocked && 
           (Date.now() - lastActivity.getTime()) < maxInactivity;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Update session timestamp and metadata
 */
async function updateSessionTimestamp(
  sessionId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('sessions')
      .update({
        last_activity: new Date().toISOString(),
        ...(metadata && { metadata: metadata })
      })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error updating session:', error);
  }
}

/**
 * Log security events
 */
async function logSecurityEvent(
  eventType: string,
  ipAddress: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await supabase.rpc('log_security_event', {
      p_user_id: details.userId,
      p_ip_address: ipAddress,
      p_event_type: eventType,
      p_details: {
        ...details,
        userAgent: details.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request origin
    if (!validateOrigin(req)) {
      throw new AuthError('Invalid origin', 403);
    }

    // Extract and validate client IP
    req.clientIp = getClientIp(req);

    // Check rate limits
    const isWithinLimits = await checkRateLimit(req.clientIp, 'auth');
    if (!isWithinLimits) {
      throw new AuthError('Rate limit exceeded', 429);
    }

    // Extract and validate token
    const authHeader = req.header(TOKEN_HEADER);
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!validateTokenStructure(token)) {
      throw new AuthError('Invalid token format', 401);
    }

    // Verify token and get user
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
    
    if (verifyError || !user) {
      await logSecurityEvent('TOKEN_INVALID', req.clientIp, { 
        error: verifyError?.message,
        userAgent: req.get('User-Agent')
      });
      throw new AuthError('Invalid token', 401);
    }

    // Get session with consistent token context
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      await logSecurityEvent('SESSION_INVALID', req.clientIp, { 
        error: sessionError?.message,
        userAgent: req.get('User-Agent')
      });
      throw new AuthError('Invalid session', 403);
    }

    // Validate session status
    const isSessionValid = await validateSession(session.id);
    if (!isSessionValid) {
      await logSecurityEvent('SESSION_EXPIRED', req.clientIp, { 
        sessionId: session.id,
        userAgent: req.get('User-Agent')
      });
      throw new AuthError('Session expired', 403);
    }

    // Update session activity
    await updateSessionTimestamp(session.id, {
      lastIp: req.clientIp,
      lastUserAgent: req.get('User-Agent')
    });

    // Handle token refresh if needed
    const tokenExp = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    if (tokenExp && (tokenExp - now) < TOKEN_EXPIRY_THRESHOLD) {
      const { data: { session: newSession }, error: renewError } = await supabase.auth.refreshSession();
      
      if (!renewError && newSession) {
        res.setHeader(NEW_TOKEN_HEADER, newSession.access_token);
        req.tokenContext = {
          refreshed: true,
          expiresAt: newSession.expires_at!
        };
        
        await logSecurityEvent('TOKEN_RENEWED', req.clientIp, { 
          sessionId: session.id,
          userAgent: req.get('User-Agent')
        });
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

    await logSecurityEvent('AUTH_SUCCESS', req.clientIp, { 
      userId: user.id,
      userAgent: req.get('User-Agent')
    });
    
    next();

  } catch (error) {
    if (error instanceof AuthError) {
      await logSecurityEvent('AUTH_ERROR', req.clientIp || 'unknown', {
        code: error.code,
        message: error.message,
        details: error.logDetails,
        userAgent: req.get('User-Agent')
      });
      return res.status(error.code).json({ error: 'Authentication failed' });
    }

    await logSecurityEvent('AUTH_ERROR', req.clientIp || 'unknown', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent: req.get('User-Agent')
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthError('User not authenticated', 401);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthError('Insufficient permissions', 403, {
          userRole: req.user.role,
          requiredRoles: allowedRoles
        });
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.code).json({ error: 'Authorization failed' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};