import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial');

export const emailSchema = z.string()
  .email('Correo electrónico inválido')
  .min(5, 'El correo electrónico es demasiado corto')
  .max(254, 'El correo electrónico es demasiado largo');

export const phoneSchema = z.string()
  .min(10, 'El teléfono debe tener al menos 10 dígitos')
  .max(15, 'El teléfono no puede exceder 15 dígitos')
  .regex(/^[+]?[\d\s-]+$/, 'Número de teléfono inválido');

export const activationCodeSchema = z.string()
  .min(6, 'El código de activación debe tener al menos 6 caracteres')
  .max(8, 'El código de activación no puede exceder 8 caracteres')
  .regex(/^[A-Za-z0-9]+$/, 'El código de activación solo puede contener letras y números');