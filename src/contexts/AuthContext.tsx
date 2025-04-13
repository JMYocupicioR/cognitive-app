import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { BaseUser, UserRole, RegisterFormData } from '../types';
import { securityAuditService } from '../services/SecurityAuditService';

// Constants
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 2000; // Base delay in ms

interface AuthState {
  user: BaseUser | null;
  session: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  error: AuthError | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    userRole: null,
    error: null
  });
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          await handleAuthChange(session.user);
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleAuthChange(session.user);
      } else if (event === 'SIGNED_OUT') {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          userRole: null,
          isLoading: false
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Clear error after timeout
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Monitor user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => setLastActivity(Date.now());

    events.forEach(event => window.addEventListener(event, updateActivity));
    return () => events.forEach(event => window.removeEventListener(event, updateActivity));
  }, []);

  // Check session expiry
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity > SESSION_EXPIRY) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const expiresAt = new Date(session.expires_at!).getTime();
      const now = Date.now();
      
      if (expiresAt - now < TOKEN_REFRESH_THRESHOLD) {
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;

        if (newSession) {
          await handleAuthChange(newSession.user);
          setRetryCount(0);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refreshSession();
        }, delay);
      } else {
        setState(prev => ({
          ...prev,
          error: new AuthError('Unable to refresh session. Please log in again.'),
          isLoading: false
        }));
      }
    }
  }, [retryCount]);

  // Auto refresh token
  useEffect(() => {
    const interval = setInterval(refreshSession, TOKEN_REFRESH_THRESHOLD);
    return () => clearInterval(interval);
  }, [refreshSession]);

  const handleAuthChange = useCallback(async (authUser: User) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        const baseUser: BaseUser = {
          id: profile.id,
          email: authUser.email!,
          name: profile.name,
          phone: profile.phone || '',
          role: profile.role as UserRole,
          createdAt: new Date(profile.created_at),
          lastLogin: new Date(authUser.last_sign_in_at || Date.now()),
        };

        setState(prev => ({
          ...prev,
          user: baseUser,
          session: authUser,
          isAuthenticated: true,
          userRole: profile.role as UserRole,
          error: null,
          isLoading: false
        }));

        await securityAuditService.logSecurityEvent(
          'AUTH_SUCCESS',
          {
            userId: baseUser.id,
            role: baseUser.role,
            deviceInfo: navigator.userAgent
          },
          'low'
        );
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        isLoading: false
      }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));

      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await securityAuditService.logSecurityEvent(
          'AUTH_FAILED',
          {
            email,
            reason: error.message,
            deviceInfo: navigator.userAgent
          },
          'medium'
        );
        throw error;
      }

      if (session) {
        await handleAuthChange(session.user);
      }

    } catch (error) {
      console.error('Error in login:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        isLoading: false
      }));
      throw error;
    }
  };

  const register = async (data: RegisterFormData) => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));

      if (data.activationCode) {
        const { data: verificationResult } = await supabase
          .rpc('verify_activation_code', { p_code: data.activationCode });

        if (!verificationResult) {
          throw new Error('Código de activación inválido');
        }
      }

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role || 'patient',
          },
        },
      });

      if (signUpError) {
        await securityAuditService.logSecurityEvent(
          'REGISTRATION_FAILED',
          {
            email: data.email,
            reason: signUpError.message
          },
          'medium'
        );
        throw signUpError;
      }

      if (user) {
        await securityAuditService.logSecurityEvent(
          'REGISTRATION_SUCCESS',
          {
            email: data.email,
            role: data.role || 'patient'
          },
          'low'
        );
      }

    } catch (error) {
      console.error('Error in registration:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        isLoading: false
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        userRole: null,
        isLoading: false
      }));

      await securityAuditService.logSecurityEvent(
        'LOGOUT',
        { userId: state.user?.id },
        'low'
      );

    } catch (error) {
      console.error('Error in logout:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        isLoading: false
      }));
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        ...state,
        login, 
        logout,
        register,
        clearError,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}