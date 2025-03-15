import { useCallback, useRef } from 'react';
import { useCache } from './useCache';
import debounce from 'lodash.debounce';

interface QueryOptimizerOptions {
  cacheKey: string;
  cacheTTL: number;
  debounceMs?: number;
  batchSize?: number;
}

export function useQueryOptimizer<T>(
  queryFn: (...args: any[]) => Promise<T>,
  options: QueryOptimizerOptions
) {
  const batchRef = useRef<any[]>([]);
  const { data: cachedData } = useCache<T>(
    {
      key: options.cacheKey,
      ttl: options.cacheTTL
    },
    queryFn
  );

  // Función para procesar lotes de consultas
  const processBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    const batch = [...batchRef.current];
    batchRef.current = [];

    try {
      const results = await Promise.all(
        batch.map(args => queryFn(...args))
      );
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }, [queryFn]);

  // Debounce el procesamiento de lotes
  const debouncedProcessBatch = debounce(
    processBatch,
    options.debounceMs || 300
  );

  // Función optimizada para ejecutar consultas
  const optimizedQuery = useCallback(async (...args: any[]) => {
    // Si hay datos en caché, usarlos primero
    if (cachedData) {
      return cachedData;
    }

    // Agregar consulta al lote
    batchRef.current.push(args);

    // Si alcanzamos el tamaño del lote, procesar inmediatamente
    if (batchRef.current.length >= (options.batchSize || 10)) {
      return processBatch();
    }

    // Si no, debounce el procesamiento
    return debouncedProcessBatch();
  }, [cachedData, processBatch, debouncedProcessBatch, options.batchSize]);

  return {
    query: optimizedQuery,
    cachedData
  };
}