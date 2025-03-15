import { createClient } from '@supabase/supabase-js';
import { storageService } from './StorageService';
import type { Database } from '../types/database';

interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  eventType: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AnomalyDetectionConfig {
  maxLoginAttempts: number;
  timeWindowMinutes: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  allowedCountries: string[];
}

interface SecurityReport {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalEvents: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
  topIpAddresses: { ip: string; count: number }[];
  anomalies: AuditLog[];
}

class SecurityAuditService {
  private supabase;
  private config: AnomalyDetectionConfig;

  constructor() {
    this.supabase = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    this.config = {
      maxLoginAttempts: 5,
      timeWindowMinutes: 15,
      workingHoursStart: 8, // 8 AM
      workingHoursEnd: 20,  // 8 PM
      allowedCountries: ['MX'], // México
    };
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
      const { data: ipData } = await this.supabase.functions.invoke('get-client-ip');
      const clientIp = ipData?.ip || 'unknown';

      const { error } = await this.supabase.rpc('log_security_event', {
        p_user_id: details.userId,
        p_ip_address: clientIp,
        p_event_type: eventType,
        p_details: {
          ...details,
          severity,
          timestamp: new Date().toISOString(),
        }
      });

      if (error) throw error;

      // Store critical events locally for faster access
      if (severity === 'critical') {
        storageService.setSecureItem(
          `security_event_${Date.now()}`,
          { eventType, details, severity },
          60 // TTL: 1 hour
        );
      }

      // Check for anomalies after logging
      await this.detectAnomalies(eventType, clientIp, details);

    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  }

  /**
   * Detects security anomalies
   */
  private async detectAnomalies(
    eventType: string,
    ipAddress: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      // Check login attempts
      if (eventType === 'AUTH_FAILED') {
        const { count } = await this.getRecentLoginAttempts(ipAddress);
        if (count >= this.config.maxLoginAttempts) {
          await this.logSecurityEvent('BRUTE_FORCE_ATTEMPT', {
            ipAddress,
            attemptCount: count,
            userId: details.userId
          }, 'critical');
        }
      }

      // Check access time
      const hour = new Date().getHours();
      if (hour < this.config.workingHoursStart || hour >= this.config.workingHoursEnd) {
        await this.logSecurityEvent('OFF_HOURS_ACCESS', {
          ipAddress,
          hour,
          userId: details.userId
        }, 'medium');
      }

      // Check location (using IP geolocation)
      const location = await this.getIpLocation(ipAddress);
      if (location && !this.config.allowedCountries.includes(location.country)) {
        await this.logSecurityEvent('UNAUTHORIZED_LOCATION', {
          ipAddress,
          country: location.country,
          userId: details.userId
        }, 'high');
      }

    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }

  /**
   * Generates security reports
   */
  public async generateReport(period: SecurityReport['period']): Promise<SecurityReport> {
    const endDate = new Date();
    const startDate = this.getReportStartDate(period);

    const { data: events, error } = await this.supabase
      .from('security_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const report: SecurityReport = {
      period,
      startDate,
      endDate,
      totalEvents: events.length,
      successfulLogins: events.filter(e => e.event_type === 'AUTH_SUCCESS').length,
      failedLogins: events.filter(e => e.event_type === 'AUTH_FAILED').length,
      suspiciousActivities: events.filter(e => 
        e.details.severity === 'high' || e.details.severity === 'critical'
      ).length,
      topIpAddresses: this.getTopIpAddresses(events),
      anomalies: events
        .filter(e => e.details.severity === 'high' || e.details.severity === 'critical')
        .map(e => ({
          id: e.id,
          timestamp: new Date(e.created_at),
          userId: e.user_id,
          ipAddress: e.ip_address,
          eventType: e.event_type,
          details: e.details,
          severity: e.details.severity
        }))
    };

    // Store report for historical tracking
    await this.storeReport(report);

    return report;
  }

  /**
   * Gets recent login attempts for an IP address
   */
  private async getRecentLoginAttempts(ipAddress: string): Promise<{ count: number }> {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - this.config.timeWindowMinutes);

    const { count } = await this.supabase
      .from('security_logs')
      .select('*', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .eq('event_type', 'AUTH_FAILED')
      .gte('created_at', timeWindow.toISOString());

    return { count: count || 0 };
  }

  /**
   * Gets location information for an IP address
   */
  private async getIpLocation(ipAddress: string): Promise<{ country: string } | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      const data = await response.json();
      return { country: data.country };
    } catch (error) {
      console.error('Error getting IP location:', error);
      return null;
    }
  }

  /**
   * Gets start date for report period
   */
  private getReportStartDate(period: SecurityReport['period']): Date {
    const date = new Date();
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() - 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() - 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date;
  }

  /**
   * Gets top IP addresses by event count
   */
  private getTopIpAddresses(events: any[]): { ip: string; count: number }[] {
    const ipCounts = events.reduce((acc, event) => {
      const ip = event.ip_address;
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Stores security report
   */
  private async storeReport(report: SecurityReport): Promise<void> {
    const { error } = await this.supabase
      .from('security_reports')
      .insert({
        period: report.period,
        start_date: report.startDate.toISOString(),
        end_date: report.endDate.toISOString(),
        report_data: report
      });

    if (error) throw error;
  }
}

// Export singleton instance
export const securityAuditService = new SecurityAuditService();