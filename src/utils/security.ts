import DOMPurify from 'dompurify';
import xss from 'xss';
import { z } from 'zod';

// Tipos de datos permitidos
export const allowedDataTypes = {
  text: /^[\p{L}\p{N}\s.,!?@#$%&*()-_+=[\]{}|;:"'<>\/]+$/u,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[\d\s-()]{8,20}$/,
  url: /^https?:\/\/[\w\-.]+(:\d+)?([\/\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
  number: /^\d+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
};

// Configuración de DOMPurify
const purifyConfig = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'title'],
  ALLOW_DATA_ATTR: false,
  ADD_TAGS: ['custom-tag'],
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
};

// Configuración de XSS
const xssOptions = {
  whiteList: {
    ...DOMPurify.sanitize('', { RETURN_DOM_FRAGMENT: true }),
    a: ['href', 'title', 'target'],
    img: ['src', 'alt'],
    custom: ['data-safe'],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitiza contenido HTML
 */
export function sanitizeHtml(html: string): string {
  // Primera capa: DOMPurify
  const purified = DOMPurify.sanitize(html, purifyConfig);
  
  // Segunda capa: XSS
  return xss(purified, xssOptions);
}

/**
 * Escapa caracteres especiales
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Valida y sanitiza datos de entrada
 */
export function sanitizeInput(
  value: string,
  type: keyof typeof allowedDataTypes
): string | null {
  if (!value) return null;

  // Trim y normalización básica
  value = value.trim().normalize();

  // Validar formato
  if (!allowedDataTypes[type].test(value)) {
    return null;
  }

  // Sanitización específica por tipo
  switch (type) {
    case 'text':
      return escapeHtml(value);
    case 'email':
      return value.toLowerCase();
    case 'phone':
      return value.replace(/[^\d+]/g, '');
    case 'url':
      try {
        const url = new URL(value);
        return url.toString();
      } catch {
        return null;
      }
    default:
      return value;
  }
}

/**
 * Esquemas de validación Zod
 */
export const validationSchemas = {
  text: z.string()
    .min(1)
    .max(1000)
    .regex(allowedDataTypes.text, 'Caracteres no permitidos'),
  
  email: z.string()
    .email('Email inválido')
    .regex(allowedDataTypes.email, 'Formato de email inválido'),
  
  phone: z.string()
    .regex(allowedDataTypes.phone, 'Formato de teléfono inválido'),
  
  url: z.string()
    .url('URL inválida')
    .regex(allowedDataTypes.url, 'Formato de URL inválido'),
  
  safeHtml: z.string()
    .transform(html => sanitizeHtml(html))
    .refine(html => !!html, 'Contenido HTML inválido'),
};

/**
 * Hook personalizado para sanitización de formularios
 */
export function useSanitizedForm<T extends Record<string, any>>(
  initialData: T
): [T, (key: keyof T, value: string) => void] {
  const [data, setData] = React.useState<T>(initialData);

  const updateField = (key: keyof T, value: string) => {
    // Determinar tipo de dato basado en el campo
    const fieldType = getFieldType(key);
    
    // Sanitizar valor
    const sanitizedValue = sanitizeInput(value, fieldType);

    // Actualizar estado si el valor es válido
    if (sanitizedValue !== null) {
      setData(prev => ({
        ...prev,
        [key]: sanitizedValue
      }));
    }
  };

  return [data, updateField];
}

/**
 * Determina el tipo de campo basado en su nombre
 */
function getFieldType(fieldName: string): keyof typeof allowedDataTypes {
  if (fieldName.includes('email')) return 'email';
  if (fieldName.includes('phone')) return 'phone';
  if (fieldName.includes('url')) return 'url';
  if (fieldName.includes('number')) return 'number';
  if (fieldName.includes('date')) return 'date';
  return 'text';
}