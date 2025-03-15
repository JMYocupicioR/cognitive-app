import CryptoJS from 'crypto-js';

interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  checksum: string;
  isEncrypted: boolean;
}

interface StorageStats {
  totalItems: number;
  totalSize: number;
  expiredItems: number;
  encryptedItems: number;
  oldestItem: Date | null;
  newestItem: Date | null;
}

interface StorageLog {
  timestamp: number;
  action: 'read' | 'write' | 'delete' | 'error';
  key: string;
  details?: string;
}

class StorageService {
  private readonly SECRET_KEY: string;
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly logs: StorageLog[] = [];
  private readonly SENSITIVE_KEYS = ['auth', 'token', 'password', 'personal'];

  constructor(secretKey: string = 'your-secret-key') {
    this.SECRET_KEY = secretKey;
    this.clearExpiredItems();
    this.validateIntegrity();
  }

  /**
   * Stores an item in localStorage with optional encryption and TTL
   */
  public setSecureItem<T>(
    key: string,
    value: T,
    ttlInMinutes?: number,
    forceEncryption: boolean = false
  ): void {
    try {
      this.checkStorageQuota();

      const shouldEncrypt = forceEncryption || this.shouldEncryptKey(key);
      const timestamp = Date.now();
      const ttl = ttlInMinutes ? ttlInMinutes * 60 * 1000 : 0;

      let processedValue = value;
      if (shouldEncrypt) {
        processedValue = this.encrypt(JSON.stringify(value)) as unknown as T;
      }

      const item: StorageItem<T> = {
        value: processedValue,
        timestamp,
        ttl,
        checksum: this.generateChecksum(processedValue),
        isEncrypted: shouldEncrypt,
      };

      localStorage.setItem(key, JSON.stringify(item));
      this.logOperation('write', key);

    } catch (error) {
      this.logOperation('error', key, error instanceof Error ? error.message : 'Unknown error');
      throw new Error(`Failed to store item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieves an item from localStorage with automatic decryption
   */
  public getSecureItem<T>(key: string): T | null {
    try {
      const rawItem = localStorage.getItem(key);
      if (!rawItem) return null;

      const item: StorageItem<T> = JSON.parse(rawItem);

      // Check expiration
      if (this.isExpired(item)) {
        this.removeItem(key);
        return null;
      }

      // Validate integrity
      if (!this.validateItemIntegrity(item)) {
        this.logOperation('error', key, 'Data integrity check failed');
        this.removeItem(key);
        throw new Error('Data integrity check failed');
      }

      let value = item.value;
      if (item.isEncrypted) {
        value = JSON.parse(this.decrypt(value as unknown as string)) as T;
      }

      this.logOperation('read', key);
      return value;

    } catch (error) {
      this.logOperation('error', key, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Removes an item from localStorage
   */
  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      this.logOperation('delete', key);
    } catch (error) {
      this.logOperation('error', key, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Clears all expired items from localStorage
   */
  public clearExpiredItems(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      try {
        const rawItem = localStorage.getItem(key);
        if (!rawItem) continue;

        const item: StorageItem<unknown> = JSON.parse(rawItem);
        if (this.isExpired(item)) {
          this.removeItem(key);
        }
      } catch (error) {
        this.logOperation('error', key, 'Failed to clear expired item');
      }
    }
  }

  /**
   * Validates the integrity of all stored items
   */
  public validateIntegrity(): boolean {
    let isValid = true;
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      try {
        const rawItem = localStorage.getItem(key);
        if (!rawItem) continue;

        const item: StorageItem<unknown> = JSON.parse(rawItem);
        if (!this.validateItemIntegrity(item)) {
          this.logOperation('error', key, 'Integrity validation failed');
          this.removeItem(key);
          isValid = false;
        }
      } catch (error) {
        this.logOperation('error', key, 'Failed to validate item integrity');
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Returns storage statistics
   */
  public getStorageStats(): StorageStats {
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    let expiredItems = 0;
    let encryptedItems = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const key of keys) {
      try {
        const rawItem = localStorage.getItem(key);
        if (!rawItem) continue;

        totalSize += rawItem.length * 2; // Approximate size in bytes
        const item: StorageItem<unknown> = JSON.parse(rawItem);

        if (this.isExpired(item)) expiredItems++;
        if (item.isEncrypted) encryptedItems++;

        oldestTimestamp = Math.min(oldestTimestamp, item.timestamp);
        newestTimestamp = Math.max(newestTimestamp, item.timestamp);
      } catch (error) {
        console.error(`Error calculating stats for key ${key}:`, error);
      }
    }

    return {
      totalItems: keys.length,
      totalSize,
      expiredItems,
      encryptedItems,
      oldestItem: keys.length ? new Date(oldestTimestamp) : null,
      newestItem: keys.length ? new Date(newestTimestamp) : null,
    };
  }

  /**
   * Returns recent storage operation logs
   */
  public getLogs(): StorageLog[] {
    return [...this.logs];
  }

  private encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.SECRET_KEY).toString();
  }

  private decrypt(value: string): string {
    const bytes = CryptoJS.AES.decrypt(value, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private generateChecksum(value: unknown): string {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return CryptoJS.SHA256(stringValue).toString();
  }

  private validateItemIntegrity<T>(item: StorageItem<T>): boolean {
    const currentChecksum = this.generateChecksum(item.value);
    return currentChecksum === item.checksum;
  }

  private isExpired<T>(item: StorageItem<T>): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  private shouldEncryptKey(key: string): boolean {
    return this.SENSITIVE_KEYS.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );
  }

  private checkStorageQuota(): void {
    const stats = this.getStorageStats();
    if (stats.totalSize > this.MAX_STORAGE_SIZE) {
      throw new Error('Storage quota exceeded');
    }
  }

  private logOperation(action: StorageLog['action'], key: string, details?: string): void {
    const log: StorageLog = {
      timestamp: Date.now(),
      action,
      key,
      details,
    };

    this.logs.push(log);
    if (this.logs.length > 1000) {
      this.logs.shift(); // Keep only last 1000 logs
    }
  }
}

// Create and export singleton instance
export const storageService = new StorageService(import.meta.env.VITE_STORAGE_SECRET_KEY);