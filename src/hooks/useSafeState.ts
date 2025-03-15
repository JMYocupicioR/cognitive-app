import { useState, useCallback } from 'react';
import { sanitizeInput } from '../utils/security';
import type { allowedDataTypes } from '../utils/security';

export function useSafeState<T extends string>(
  initialValue: T,
  type: keyof typeof allowedDataTypes
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);

  const setSafeValue = useCallback((newValue: T) => {
    const sanitized = sanitizeInput(newValue, type);
    if (sanitized !== null) {
      setValue(sanitized as T);
    }
  }, [type]);

  return [value, setSafeValue];
}