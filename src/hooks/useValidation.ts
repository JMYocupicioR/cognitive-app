import { useState, useCallback } from 'react';
import { ValidationService } from '../utils/validation/ValidationService';
import type { z } from 'zod';
import type { composedSchemas } from '../utils/validation/schemas';

interface ValidationState<T> {
  data: Partial<T>;
  errors: Record<string, string>;
  isValid: boolean;
}

export function useValidation<T extends keyof typeof composedSchemas>(
  schemaName: T,
  initialData: Partial<z.infer<typeof composedSchemas[T]>> = {}
) {
  const [state, setState] = useState<ValidationState<z.infer<typeof composedSchemas[T]>>>({
    data: initialData,
    errors: {},
    isValid: false,
  });

  const validateField = useCallback((
    fieldName: keyof z.infer<typeof composedSchemas[T]>,
    value: unknown
  ) => {
    const result = ValidationService.validateField(fieldName as any, value);
    
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldName]: result.success ? result.data : value,
      },
      errors: {
        ...prev.errors,
        [fieldName]: result.error || '',
      },
      isValid: Object.values(prev.errors).every(error => !error),
    }));

    return result.success;
  }, []);

  const validateAll = useCallback(() => {
    const result = ValidationService.validateObject(schemaName, state.data);
    
    if (!result.success && result.errors) {
      setState(prev => ({
        ...prev,
        errors: result.errors!,
        isValid: false,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
    return true;
  }, [schemaName, state.data]);

  const setFieldValue = useCallback((
    fieldName: keyof z.infer<typeof composedSchemas[T]>,
    value: unknown
  ) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldName]: value,
      },
    }));
    validateField(fieldName, value);
  }, [validateField]);

  return {
    data: state.data,
    errors: state.errors,
    isValid: state.isValid,
    validateField,
    validateAll,
    setFieldValue,
  };
}