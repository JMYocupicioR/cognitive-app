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
  lastCleared?: Date;
}

class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0
  };

  private cachePrefix = 'cache:';
  private maxCacheSize = 50; // Número máximo de entradas en caché

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
      // Verificar si necesitamos limpiar el caché por tamaño
      this.checkCacheSize();
      
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
   * Limpia todo el caché
   */
  public clearAll(): void {
    try {
      // Obtener todas las keys de localStorage
      const allKeys = Object.keys(localStorage);
      
      // Filtrar solo las que son de caché
      const cacheKeys = allKeys.filter(key => key.startsWith(this.cachePrefix));
      
      // Eliminar todas las entradas de caché
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Actualizar estadísticas
      this.stats.size = 0;
      this.stats.lastCleared = new Date();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Obtiene estadísticas de uso del caché
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Verifica si el caché está por encima del tamaño máximo y limpia
   * las entradas más antiguas si es necesario
   */
  private checkCacheSize(): void {
    if (this.stats.size >= this.maxCacheSize) {
      // Obtener todas las claves de caché
      const allKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.cachePrefix));
      
      if (allKeys.length <= this.maxCacheSize) {
        // Actualizar el contador si no coincide con la realidad
        this.stats.size = allKeys.length;
        return;
      }
      
      // Obtener metadatos para ordenar por antigüedad
      const keyMetadata = allKeys.map(key => {
        const timestamp = storageService.getMetadata(key)?.timestamp || 0;
        return { key, timestamp };
      });
      
      // Ordenar por antigüedad (más antiguos primero)
      keyMetadata.sort((a, b) => a.timestamp - b.timestamp);
      
      // Eliminar el 20% más antiguo
      const keysToRemove = keyMetadata.slice(0, Math.ceil(this.maxCacheSize * 0.2));
      keysToRemove.forEach(({ key }) => {
        localStorage.removeItem(key);
      });
      
      // Actualizar contador
      this.stats.size -= keysToRemove.length;
    }
  }

  private generateCacheKey(config: CacheConfig): string {
    return `${this.cachePrefix}${config.key}:${config.version || 'v1'}`;
  }
}

// Exportar instancia singleton
export const cacheService = new CacheService();