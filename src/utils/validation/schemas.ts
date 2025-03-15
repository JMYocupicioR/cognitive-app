import { z } from 'zod';

// Patrones de validación comunes
const patterns = {
  name: /^[\p{L}\s'-]+$/u,
  phone: /^\+?[\d\s-()]{8,20}$/,
  password: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/,
  url: /^https?:\/\/[\w\-.]+(:\d+)?([\/\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
  code: /^[A-Za-z0-9]{4,8}$/,
} as const;

// Mensajes de error personalizados
const errorMessages = {
  required: 'Este campo es requerido',
  invalid: 'El valor ingresado no es válido',
  tooShort: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
  tooLong: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
  pattern: (field: string) => `Formato de ${field} inválido`,
  email: 'Correo electrónico inválido',
  phone: 'Formato de teléfono inválido (ej: +1-234-567-8900)',
  password: 'La contraseña debe contener al menos una mayúscula, un número y un carácter especial',
  url: 'URL inválida',
  date: 'Fecha inválida',
  number: 'Debe ser un número válido',
  min: (field: string, min: number) => `${field} debe ser mayor o igual a ${min}`,
  max: (field: string, max: number) => `${field} debe ser menor o igual a ${max}`,
} as const;

// Esquemas base
export const baseSchemas = {
  string: z.string({
    required_error: errorMessages.required,
    invalid_type_error: errorMessages.invalid,
  }),

  number: z.number({
    required_error: errorMessages.required,
    invalid_type_error: errorMessages.number,
  }),

  boolean: z.boolean(),

  date: z.date({
    required_error: errorMessages.required,
    invalid_type_error: errorMessages.date,
  }),
} as const;

// Esquemas de validación específicos
export const validationSchemas = {
  name: baseSchemas.string
    .min(2, errorMessages.tooShort('El nombre', 2))
    .max(50, errorMessages.tooLong('El nombre', 50))
    .regex(patterns.name, errorMessages.pattern('nombre'))
    .transform(val => val.trim()),

  email: baseSchemas.string
    .email(errorMessages.email)
    .min(5, errorMessages.tooShort('El email', 5))
    .max(254, errorMessages.tooLong('El email', 254))
    .transform(val => val.toLowerCase().trim()),

  phone: baseSchemas.string
    .regex(patterns.phone, errorMessages.phone)
    .transform(val => val.replace(/[^\d+]/g, '')),

  password: baseSchemas.string
    .min(8, errorMessages.tooShort('La contraseña', 8))
    .regex(patterns.password, errorMessages.password),

  url: baseSchemas.string
    .url(errorMessages.url)
    .regex(patterns.url, errorMessages.pattern('URL')),

  code: baseSchemas.string
    .regex(patterns.code, 'Código inválido')
    .transform(val => val.toUpperCase()),

  age: baseSchemas.number
    .int()
    .min(0, errorMessages.min('La edad', 0))
    .max(150, errorMessages.max('La edad', 150)),

  date: baseSchemas.date,

  boolean: baseSchemas.boolean,
} as const;

// Esquemas compuestos
export const composedSchemas = {
  user: z.object({
    name: validationSchemas.name,
    email: validationSchemas.email,
    phone: validationSchemas.phone.optional(),
    age: validationSchemas.age.optional(),
  }),

  credentials: z.object({
    email: validationSchemas.email,
    password: validationSchemas.password,
  }),

  profile: z.object({
    name: validationSchemas.name,
    email: validationSchemas.email,
    phone: validationSchemas.phone.optional(),
    birthDate: validationSchemas.date.optional(),
    website: validationSchemas.url.optional(),
  }),
} as const;