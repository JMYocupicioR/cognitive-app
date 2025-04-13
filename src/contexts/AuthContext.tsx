import React, { createContext, useEffect, useState, useCallback, useContext } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { BaseUser, UserRole, AuthContextType, AuthState } from '../types';
import { securityAuditService } from '../services/SecurityAuditService';
import { AppError, ErrorType, handleError, tryCatch } from '../utils/errorHandling';

// Constantes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos en ms
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas en ms
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 2000; // Delay base en ms

// Valor inicial para el estado de autenticación
const initialAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  userRole: null,
  error: null
};

// Crear el contexto de autenticación
export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialAuthState);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);

  // Inicializar estado de autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      await tryCatch(async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw new AppError({
          message: error.message,
          type: ErrorType.AUTHENTICATION,
          details: { supabaseError: error }
        });
        
        if (session) {
          await handleAuthChange(session.user);
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }, 
      (error) => {
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error instanceof AuthError ? error : new AuthError(error.message)
        }));
      }, 
      'initializeAuth');
    };

    initializeAuth();

    // Configurar listener para cambios de estado de autenticación
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

  // Limpiar error después de un tiempo
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Monitorear actividad del usuario
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => setLastActivity(Date.now());

    events.forEach(event => window.addEventListener(event, updateActivity));
    return () => events.forEach(event => window.removeEventListener(event, updateActivity));
  }, []);

  // Verificar expiración de sesión
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

  // Función para refrescar la sesión
  const refreshSession = useCallback(async () => {
    await tryCatch(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).getTime() : 0;
      const now = Date.now();
      
      if (expiresAt - now < TOKEN_REFRESH_THRESHOLD) {
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        
        if (error) throw new AppError({
          message: error.message,
          type: ErrorType.AUTHENTICATION,
          details: { supabaseError: error }
        });

        if (newSession) {
          await handleAuthChange(newSession.user);
          setRetryCount(0);
        }
      }
    }, 
    (error) => {
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
    }, 
    'refreshSession');
  }, [retryCount]);

  // Auto-refrescar token
  useEffect(() => {
    const interval = setInterval(refreshSession, TOKEN_REFRESH_THRESHOLD);
    return () => clearInterval(interval);
  }, [refreshSession]);

  // Manejar cambio de estado de autenticación
  const handleAuthChange = useCallback(async (authUser: User) => {
    await tryCatch(async () => {
      setState(prev => ({ ...prev, isLoading: true }));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw new AppError({
        message: profileError.message,
        type: ErrorType.API,
        details: { supabaseError: profileError }
      });

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
    }, 
    (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof AuthError ? error : new AuthError(error.message),
        isLoading: false
      }));
    }, 
    'handleAuthChange');
  }, []);

  // Función de inicio de sesión
  const login = async (email: string, password: string) => {
    await tryCatch(async () => {
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
        throw new AppError({
          message: error.message,
          type: ErrorType.AUTHENTICATION,
          details: { supabaseError: error }
        });
      }

      if (session) {
        await handleAuthChange(session.user);
      }
    }, 
    (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof AuthError ? error : new AuthError(error.message),
        isLoading: false
      }));
      throw error;
    }, 
    'login');
  };

  // Función de registro
  const register = async (data: any) => {
    await tryCatch(async () => {
      setState(prev => ({ ...prev, error: null, isLoading: true }));

      // Verificar código de activación si se proporciona
      if (data.activationCode) {
        const { data: verificationResult, error: verificationError } = await supabase
          .rpc('verify_activation_code', { p_code: data.activationCode });

        if (verificationError || !verificationResult) {
          throw new AppError({
            message: 'Código de activación inválido',
            type: ErrorType.VALIDATION,
            details: { verificationError }
          });
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
        throw new AppError({
          message: signUpError.message,
          type: ErrorType.AUTHENTICATION,
          details: { supabaseError: signUpError }
        });
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
    }, 
    (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof AuthError ? error : new AuthError(error.message),
        isLoading: false
      }));
      throw error;
    }, 
    'register');
    
    setState(prev => ({ ...prev, isLoading: false }));
  };

  // Función de cierre de sesión
  const logout = async () => {
    await tryCatch(async () => {
      setState(prev => ({ ...prev, error: null, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw new AppError({
        message: error.message,
        type: ErrorType.AUTHENTICATION,
        details: { supabaseError: error }
      });

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
    }, 
    (error) => {
      setState(prev => ({
        ...prev,
        error: error instanceof AuthError ? error : new AuthError(error.message),
        isLoading: false
      }));
      throw error;
    }, 
    'logout');
  };

  // Función para limpiar errores
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

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new AppError({
      message: 'useAuth debe ser usado dentro de un AuthProvider',
      type: ErrorType.UNEXPECTED,
      details: { component: 'useAuth' }
    });
  }

  return auth;
}