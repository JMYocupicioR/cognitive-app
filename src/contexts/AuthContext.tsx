import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { 
  BaseUser, 
  UserRole, 
  RegisterFormData,
  Patient,
  Doctor,
  Admin,
  ActivationCodeResponse
} from '../types';
import type { Database } from '../types/database';

interface AuthState {
  user: BaseUser | null;
  session: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  verifyActivationCode: (code: string) => Promise<ActivationCodeResponse>;
  updateProfile: (data: Partial<BaseUser>) => Promise<void>;
  error: AuthError | null;
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
  });
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session.user);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        handleAuthChange(session.user);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          userRole: null,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthChange = async (authUser: User) => {
    try {
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
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error as AuthError);
    }
  };

  const verifyActivationCode = async (code: string): Promise<ActivationCodeResponse> => {
    try {
      // Get client IP address for rate limiting and logging
      const { data: ipData } = await supabase.functions.invoke('get-client-ip');
      const clientIp = ipData?.ip || 'unknown';

      // Check rate limit first
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
        'check_rate_limit',
        { 
          p_ip_address: clientIp,
          p_endpoint: 'verify_activation_code',
          p_max_requests: 5,
          p_window_seconds: 300 
        }
      );

      if (rateLimitError) throw rateLimitError;
      if (!rateLimitOk) {
        throw new Error('Has excedido el límite de intentos. Por favor, espera 5 minutos.');
      }

      // Verify the activation code
      const { data, error } = await supabase.rpc('verify_activation_code', { p_code: code });

      if (error) throw error;

      // Log the verification attempt
      await supabase.rpc('log_security_event', {
        p_user_id: state.user?.id,
        p_ip_address: clientIp,
        p_event_type: 'CODE_ACTIVATION',
        p_details: {
          code,
          success: !!data?.is_valid,
          role: data?.role
        }
      });

      if (!data || !data.is_valid) {
        return {
          isValid: false,
          role: null,
          error: 'Código de activación inválido o expirado'
        };
      }

      return {
        isValid: true,
        role: data.role as UserRole,
        error: null
      };
    } catch (error) {
      console.error('Error verifying activation code:', error);
      return {
        isValid: false,
        role: null,
        error: error instanceof Error ? error.message : 'Error al verificar el código'
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          // Send another confirmation email
          await supabase.auth.resend({
            type: 'signup',
            email,
          });
          throw new Error('Por favor verifica tu correo electrónico. Se ha enviado un nuevo enlace de confirmación.');
        }
        throw error;
      }

      if (!data.user) throw new Error('No user returned from authentication');

    } catch (error) {
      console.error('Error in login:', error);
      setError(error as AuthError);
      throw error;
    }
  };

  const register = async (formData: RegisterFormData) => {
    try {
      // Verify activation code if provided
      if (formData.activationCode) {
        const codeVerification = await verifyActivationCode(formData.activationCode);
        if (!codeVerification.isValid) {
          throw new Error(codeVerification.error || 'Código de activación inválido');
        }
        formData.role = codeVerification.role;
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role || UserRole.PATIENT
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from registration');

      // If activation code was used, mark it as used
      if (formData.activationCode) {
        const { error: updateError } = await supabase
          .from('activation_codes')
          .update({
            used_by: authData.user.id,
            used_at: new Date().toISOString(),
            is_valid: false
          })
          .eq('code', formData.activationCode);

        if (updateError) {
          console.error('Error updating activation code:', updateError);
        }
      }

    } catch (error) {
      console.error('Error in registration:', error);
      setError(error as AuthError);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        userRole: null,
      }));
    } catch (error) {
      console.error('Error in logout:', error);
      setError(error as AuthError);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<BaseUser>) => {
    try {
      if (!state.user?.id) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error as AuthError);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        ...state,
        login, 
        register, 
        logout,
        verifyActivationCode,
        updateProfile,
        error,
      }}
    >
      {!state.isLoading && children}
    </AuthContext.Provider>
  );
}