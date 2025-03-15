import { useState, useCallback } from 'react';
import { storageService } from '../services/StorageService';

export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  ttlInMinutes?: number,
  forceEncryption: boolean = false
) {
  // Initialize state with stored value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storageService.getSecureItem<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading from storage: ${error}`);
      return initialValue;
    }
  });

  // Return wrapped version of storage service's setValue
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storageService.setSecureItem(key, valueToStore, ttlInMinutes, forceEncryption);
    } catch (error) {
      console.error(`Error writing to storage: ${error}`);
    }
  }, [key, ttlInMinutes, forceEncryption, storedValue]);

  // Return wrapped version of storage service's removeValue
  const removeValue = useCallback(() => {
    try {
      storageService.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing from storage: ${error}`);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}