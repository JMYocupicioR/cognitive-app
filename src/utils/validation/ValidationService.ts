import { z } from 'zod';
import { validationSchemas, composedSchemas } from './schemas';
import { sanitizers, normalizers } from './sanitizers';

export class ValidationService {
  /**
   * Valida y sanitiza un valor usando un esquema Zod
   */
  public static validate<T>(schema: z.ZodType<T>, value: unknown): {
    success: boolean;
    data?: T;
    error?: string;
  } {
    try {
      const result = schema.parse(value);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0].message,
        };
      }
      return {
        success: false,
        error: 'Error de validación',
      };
    }
  }

  /**
   * Sanitiza un valor según su tipo
   */
  public static sanitize(value: string, type: keyof typeof sanitizers): string {
    return sanitizers[type](value);
  }

  /**
   * Normaliza un valor según su tipo
   */
  public static normalize(value: string, type: keyof typeof normalizers): string {
    return normalizers[type](value);
  }

  /**
   * Valida un objeto completo usando un esquema compuesto
   */
  public static validateObject<T extends keyof typeof composedSchemas>(
    schemaName: T,
    data: unknown
  ): {
    success: boolean;
    data?: z.infer<typeof composedSchemas[T]>;
    errors?: Record<string, string>;
  } {
    try {
      const schema = composedSchemas[schemaName];
      const result = schema.parse(data);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return {
          success: false,
          errors,
        };
      }
      return {
        success: false,
        errors: { _error: 'Error de validación' },
      };
    }
  }

  /**
   * Valida un campo individual
   */
  public static validateField<T extends keyof typeof validationSchemas>(
    fieldName: T,
    value: unknown
  ): {
    success: boolean;
    data?: z.infer<typeof validationSchemas[T]>;
    error?: string;
  } {
    return this.validate(validationSchemas[fieldName], value);
  }
}