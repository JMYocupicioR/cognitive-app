import DOMPurify from 'dompurify';
import xss from 'xss';

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

export const sanitizers = {
  /**
   * Sanitiza texto plano
   */
  text: (value: string): string => {
    return value
      .trim()
      .normalize()
      .replace(/[<>]/g, '');
  },

  /**
   * Sanitiza HTML
   */
  html: (value: string): string => {
    const purified = DOMPurify.sanitize(value, purifyConfig);
    return xss(purified, xssOptions);
  },

  /**
   * Sanitiza URLs
   */
  url: (value: string): string => {
    try {
      const url = new URL(value);
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitiza números
   */
  number: (value: string): number => {
    const num = Number(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  },

  /**
   * Sanitiza teléfonos
   */
  phone: (value: string): string => {
    return value.replace(/[^\d+()-\s]/g, '');
  },

  /**
   * Sanitiza emails
   */
  email: (value: string): string => {
    return value.toLowerCase().trim();
  },
} as const;

export const normalizers = {
  /**
   * Normaliza strings
   */
  string: (value: string): string => {
    return value
      .trim()
      .normalize('NFKC')
      .replace(/\s+/g, ' ');
  },

  /**
   * Normaliza nombres
   */
  name: (value: string): string => {
    return value
      .trim()
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, '');
  },

  /**
   * Normaliza slugs
   */
  slug: (value: string): string => {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },
} as const;