import { createClient } from '@supabase/supabase-js';
import { storageService } from './StorageService';
import type { Database } from '../types/database';

interface AuditLog {
  id?: string;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  eventType: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
}

class SecurityAuditService {
  private supabase;
  private offlineQueue: AuditLog[] = [];
  private isOnline: boolean = navigator.onLine;
  private readonly MAX_OFFLINE_LOGS = 100;
  private readonly CACHE_KEY = 'security_audit_offline_logs';

  constructor() {
    // Inicializar cliente Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } else {
      console.error('Missing Supabase environment variables');
    }
    
    // Configurar eventos de conectividad
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Cargar logs offline almacenados
    this.loadOfflineLogs();
    
    // Intentar enviar logs pendientes si estamos online
    if (this.isOnline) {
      this.processPendingLogs();
    }
  }

  /**
   * Logs a security event
   */
  public async logSecurityEvent(
    eventType: string,
    details: Record<string, any>,
    severity: AuditLog['severity'] = 'low'
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        timestamp: new Date(),
        userId: details.userId,
        eventType,
        details: {
          ...details,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        severity
      };

      // Si estamos online, intentamos enviar directamente
      if (this.isOnline && this.supabase) {
        await this.sendLogToServer(auditLog);
      } else {
        // Si estamos offline o falló el envío, guardamos localmente
        this.queueOfflineLog(auditLog);
      }

      // Almacenar eventos críticos localmente independientemente
      if (severity === 'critical' || severity === 'high') {
        this.storeLogLocally(auditLog);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
      this.queueOfflineLog({
        timestamp: new Date(),
        eventType: 'LOG_ERROR',
        details: { originalEvent: eventType, error: String(error) },
        severity: 'medium'
      });
    }
  }

  /**
   * Procesa logs pendientes cuando recuperamos conexión
   */
  private async processPendingLogs(): Promise<void> {
    if (!this.isOnline || !this.supabase || this.offlineQueue.length === 0) {
      return;
    }

    const logsToProcess = [...this.offlineQueue];
    this.offlineQueue = [];
    
    // Enviar logs en lotes de 10
    const batches = [];
    for (let i = 0; i < logsToProcess.length; i += 10) {
      batches.push(logsToProcess.slice(i, i + 10));
    }
    
    for (const batch of batches) {
      try {
        await Promise.all(batch.map(log => this.sendLogToServer(log)));
      } catch (error) {
        console.error('Error processing security log batch:', error);
        // Devolver los logs fallidos a la cola
        this.offlineQueue.push(...batch);
        break;
      }
    }
    
    // Actualizar la caché de logs pendientes
    this.saveOfflineLogs();
  }

  /**
   * Envía un log al servidor
   */
  private async sendLogToServer(log: AuditLog): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await this.supabase.from('security_logs').insert({
      user_id: log.userId,
      ip_address: log.ipAddress || null,
      event_type: log.eventType,
      details: {
        ...log.details,
        severity: log.severity
      }
    });

    if (error) throw error;
  }

  /**
   * Añade un log a la cola de logs offline
   */
  private queueOfflineLog(log: AuditLog): void {
    this.offlineQueue.push(log);
    
    // Limitar tamaño de la cola
    if (this.offlineQueue.length > this.MAX_OFFLINE_LOGS) {
      this.offlineQueue = this.offlineQueue.slice(-this.MAX_OFFLINE_LOGS);
    }
    
    this.saveOfflineLogs();
  }

  /**
   * Guarda un log importante localmente
   */
  private storeLogLocally(log: AuditLog): void {
    const key = `security_log_${Date.now()}`;
    storageService.setSecureItem(key, log, 1440); // TTL: 24 horas
  }

  /**
   * Guarda los logs offline en localStorage
   */
  private saveOfflineLogs(): void {
    try {
      storageService.setSecureItem(this.CACHE_KEY, this.offlineQueue, 1440); // TTL: 24 horas
    } catch (error) {
      console.error('Error saving offline logs:', error);
    }
  }

  /**
   * Carga los logs offline desde localStorage
   */
  private loadOfflineLogs(): void {
    try {
      const savedLogs = storageService.getSecureItem<AuditLog[]>(this.CACHE_KEY);
      if (savedLogs && Array.isArray(savedLogs)) {
        this.offlineQueue = savedLogs;
      }
    } catch (error) {
      console.error('Error loading offline logs:', error);
    }
  }

  /**
   * Manejador para evento online
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.processPendingLogs();
  }

  /**
   * Manejador para evento offline
   */
  private handleOffline(): void {
    this.isOnline = false;
  }
}

// Exportar singleton instance
export const securityAuditService = new SecurityAuditService();