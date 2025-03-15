import { useState, useEffect } from 'react';
import { cacheService } from '../services/CacheService';

interface UseCacheOptions {
  key: string;
  ttl: number;
  version?: string;
}

export function useCache<T>(
  options: UseCacheOptions,
  fetchData: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener del caché
        const cachedData = await cacheService.get<T>({
          key: options.key,
          ttl: options.ttl,
          version: options.version
        });

        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Si no está en caché, obtener datos frescos
        const freshData = await fetchData();
        
        // Guardar en caché
        await cacheService.set({
          key: options.key,
          ttl: options.ttl,
          version: options.version
        }, freshData);

        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error loading data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [options.key, options.ttl, options.version]);

  return { data, loading, error };
}