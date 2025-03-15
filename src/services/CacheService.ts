import { storageService } from './StorageService';

interface CacheConfig {
  key: string;
  ttl: number; // en minutos
  version?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0
  };

  /**
   * Obtiene un valor cacheado
   */
  public async get<T>(config: CacheConfig): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(config);
      const cachedData = storageService.getSecureItem<T>(cacheKey);

      if (cachedData) {
        this.stats.hits++;
        return cachedData;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Almacena un valor en caché
   */
  public async set<T>(config: CacheConfig, data: T): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(config);
      storageService.setSecureItem(cacheKey, data, config.ttl);
      this.stats.size++;
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  /**
   * Invalida una entrada de caché
   */
  public invalidate(config: CacheConfig): void {
    try {
      const cacheKey = this.generateCacheKey(config);
      storageService.removeItem(cacheKey);
      this.stats.size = Math.max(0, this.stats.size - 1);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Obtiene estadísticas de uso del caché
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  private generateCacheKey(config: CacheConfig): string {
    return `cache:${config.key}:${config.version || 'v1'}`;
  }
}

// Exportar instancia singleton
export const cacheService = new CacheService();