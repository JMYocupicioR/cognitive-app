export interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
  checksum: string;
  isEncrypted: boolean;
}

export interface StorageStats {
  totalItems: number;
  totalSize: number;
  expiredItems: number;
  encryptedItems: number;
  oldestItem: Date | null;
  newestItem: Date | null;
}

export interface StorageLog {
  timestamp: number;
  action: 'read' | 'write' | 'delete' | 'error';
  key: string;
  details?: string;
}