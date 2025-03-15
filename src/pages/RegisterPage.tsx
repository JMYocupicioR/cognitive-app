import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import debounce from 'lodash.debounce';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Password strength regex patterns
const containsUppercase = /[A-Z]/;
const containsNumber = /[0-9]/;
const containsSpecialChar = /[^A-Za-z0-9]/;

// Phone regex pattern
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

// Activation code regex
const activationCodeRegex = /^[A-Za-z0-9]{6,8}$/;

const registerSchema = z.object({
  name: z.string()
    .min(4, 'El nombre debe tener al menos 4 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .email('Correo electrónico inválido')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Formato de correo inválido'),
  phone: z.string()
    .regex(phoneRegex, 'Formato de teléfono inválido (ej: +1-234-567-8900)'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(containsUppercase, 'Debe contener al menos una mayúscula')
    .regex(containsNumber, 'Debe contener al menos un número')
    .regex(containsSpecialChar, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
  activationCode: z.string()
    .regex(activationCodeRegex, 'Código de activación inválido')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormSchema = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(Date.now());
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    getValues,
    setValue,
    watch,
  } = useForm<RegisterFormSchema>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      Object.entries(parsedData).forEach(([key, value]) => {
        setValue(key as keyof RegisterFormSchema, value as string);
      });
    }
  }, [setValue]);

  // Save form data to localStorage on change
  const watchAllFields = watch();
  useEffect(() => {
    const saveFormData = debounce(() => {
      localStorage.setItem('registerFormData', JSON.stringify(watchAllFields));
    }, 500);

    saveFormData();
    return () => saveFormData.cancel();
  }, [watchAllFields]);

  // Password strength calculation
  const password = watch('password');
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (containsUppercase.test(password)) strength += 25;
    if (containsNumber.test(password)) strength += 25;
    if (containsSpecialChar.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password || '');

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    if (now - lastAttemptTime > 60000) { // Reset after 1 minute
      setRateLimitCount(0);
      setLastAttemptTime(now);
      return true;
    }
    if (rateLimitCount >= 3) {
      return false;
    }
    setRateLimitCount(prev => prev + 1);
    return true;
  };

  const onSubmit = async (data: RegisterFormSchema) => {
    try {
      if (!checkRateLimit()) {
        throw new Error('Has excedido el límite de intentos. Por favor, espera un minuto.');
      }

      setIsSubmitting(true);

      // Verify reCAPTCHA
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA no está disponible');
      }
      const token = await executeRecaptcha('register');

      if (!token) {
        throw new Error('Verificación reCAPTCHA fallida');
      }

      // Normalize form data
      const formData = {
        ...data,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.replace(/[^\d+]/g, ''),
      };

      await registerUser(formData);
      localStorage.removeItem('registerFormData');
      navigate('/verify-email');
    } catch (error) {
      console.error('Error en registro:', error);
      if (error instanceof Error) {
        if (error.message.includes('email already exists')) {
          setError('email', { message: 'Este correo electrónico ya está registrado' });
        } else {
          setError('root', { message: error.message });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Brain className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Crear cuenta en CognitivApp
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Únete a nuestro programa de rehabilitación cognitiva
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {errors.root.message}
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre completo */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre completo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  aria-label="Nombre completo"
                  aria-describedby="name-error"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                  placeholder="Juan Pérez"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="name-error">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Correo electrónico */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  aria-label="Correo electrónico"
                  aria-describedby="email-error"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="email-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  aria-label="Teléfono"
                  aria-describedby="phone-error"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                  placeholder="+52-123-456-7890"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="phone-error">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  aria-label="Contraseña"
                  aria-describedby="password-error password-strength"
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2" id="password-strength">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength >= 75 ? 'bg-green-500' :
                        passwordStrength >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Fuerza de la contraseña: {
                      passwordStrength >= 75 ? 'Fuerte' :
                      passwordStrength >= 50 ? 'Media' :
                      'Débil'
                    }
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="password-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar Contraseña
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  aria-label="Confirmar contraseña"
                  aria-describedby="confirm-password-error"
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="confirm-password-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Código de activación */}
            <div>
              <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código de activación (opcional)
              </label>
              <input
                {...register('activationCode')}
                type="text"
                id="activationCode"
                aria-label="Código de activación"
                aria-describedby="activation-code-error"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.activationCode ? 'border-red-300' : 'border-gray-300'
                } dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm`}
                placeholder="ABC123"
              />
              {errors.activationCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" id="activation-code-error">
                  {errors.activationCode.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || rateLimitCount >= 3}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </button>
          </div>

          {rateLimitCount >= 3 && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              Has excedido el límite de intentos. Por favor, espera un minuto.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;