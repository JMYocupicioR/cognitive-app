/*
  # Security Reports and Logs Enhancement

  1. New Tables
    - security_reports: Stores security analysis reports
    - Enhanced security_logs with additional fields
    
  2. Functions
    - Generate security reports
    - Detect login anomalies
    
  3. Indexes
    - Optimized queries for security analysis
*/

-- Create security reports table
CREATE TABLE IF NOT EXISTS security_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  report_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to security_logs
ALTER TABLE security_logs
ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS location jsonb,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create function to generate security report
CREATE OR REPLACE FUNCTION generate_security_report(
  p_period text,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'period', p_period,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'total_events', COUNT(*),
    'successful_logins', COUNT(*) FILTER (WHERE event_type = 'AUTH_SUCCESS'),
    'failed_logins', COUNT(*) FILTER (WHERE event_type = 'AUTH_FAILED'),
    'suspicious_activities', COUNT(*) FILTER (
      WHERE (details->>'severity')::text IN ('high', 'critical')
    ),
    'events_by_severity', (
      SELECT jsonb_object_agg(severity, count)
      FROM (
        SELECT 
          COALESCE(details->>'severity', 'low') as severity,
          COUNT(*) as count
        FROM security_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY severity
      ) sev
    ),
    'top_ip_addresses', (
      SELECT jsonb_agg(ip_data)
      FROM (
        SELECT jsonb_build_object(
          'ip', ip_address,
          'count', COUNT(*),
          'last_seen', MAX(created_at)
        ) as ip_data
        FROM security_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY ip_address
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) ips
    ),
    'anomalies', (
      SELECT jsonb_agg(anomaly)
      FROM (
        SELECT jsonb_build_object(
          'id', id,
          'event_type', event_type,
          'timestamp', created_at,
          'details', details
        ) as anomaly
        FROM security_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (details->>'severity')::text IN ('high', 'critical')
        ORDER BY created_at DESC
      ) anomalies
    )
  ) INTO v_report
  FROM security_logs
  WHERE created_at BETWEEN p_start_date AND p_end_date;

  RETURN v_report;
END;
$$;

-- Function to detect login anomalies
CREATE OR REPLACE FUNCTION detect_login_anomalies(
  p_user_id uuid,
  p_ip_address text
)
RETURNS TABLE (
  is_suspicious boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failed_attempts int;
  v_unusual_time boolean;
  v_unusual_location boolean;
BEGIN
  -- Check recent failed attempts
  SELECT COUNT(*)
  INTO v_failed_attempts
  FROM security_logs
  WHERE ip_address = p_ip_address
  AND event_type = 'AUTH_FAILED'
  AND created_at > now() - interval '15 minutes';

  -- Check if access is during unusual hours (outside 8 AM - 8 PM)
  v_unusual_time := EXTRACT(HOUR FROM now()) < 8 OR EXTRACT(HOUR FROM now()) >= 20;

  -- Check if location is unusual (simplified)
  SELECT EXISTS (
    SELECT 1
    FROM security_logs
    WHERE user_id = p_user_id
    AND ip_address != p_ip_address
    AND created_at > now() - interval '24 hours'
  ) INTO v_unusual_location;

  RETURN QUERY
  SELECT
    CASE
      WHEN v_failed_attempts >= 5 THEN true
      WHEN v_unusual_time AND v_unusual_location THEN true
      ELSE false
    END,
    CASE
      WHEN v_failed_attempts >= 5 THEN 'Multiple failed login attempts'
      WHEN v_unusual_time AND v_unusual_location THEN 'Unusual access pattern'
      ELSE 'No anomalies detected'
    END;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_logs_severity 
  ON security_logs ((details->>'severity'));
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type_date 
  ON security_logs (event_type, created_at);

-- Enable RLS
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can access security reports"
  ON security_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to auto-generate reports
CREATE OR REPLACE FUNCTION auto_generate_reports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate daily report if none exists for today
  IF NOT EXISTS (
    SELECT 1 FROM security_reports
    WHERE period = 'daily'
    AND date_trunc('day', end_date) = date_trunc('day', now())
  ) THEN
    INSERT INTO security_reports (period, start_date, end_date, report_data)
    SELECT
      'daily',
      date_trunc('day', now()) - interval '1 day',
      date_trunc('day', now()),
      generate_security_report(
        'daily',
        date_trunc('day', now()) - interval '1 day',
        date_trunc('day', now())
      );
  END IF;

  -- Generate weekly report on Sundays
  IF EXTRACT(DOW FROM now()) = 0 AND NOT EXISTS (
    SELECT 1 FROM security_reports
    WHERE period = 'weekly'
    AND date_trunc('week', end_date) = date_trunc('week', now())
  ) THEN
    INSERT INTO security_reports (period, start_date, end_date, report_data)
    SELECT
      'weekly',
      date_trunc('week', now()) - interval '1 week',
      date_trunc('week', now()),
      generate_security_report(
        'weekly',
        date_trunc('week', now()) - interval '1 week',
        date_trunc('week', now())
      );
  END IF;

  -- Generate monthly report on first day of month
  IF EXTRACT(DAY FROM now()) = 1 AND NOT EXISTS (
    SELECT 1 FROM security_reports
    WHERE period = 'monthly'
    AND date_trunc('month', end_date) = date_trunc('month', now())
  ) THEN
    INSERT INTO security_reports (period, start_date, end_date, report_data)
    SELECT
      'monthly',
      date_trunc('month', now()) - interval '1 month',
      date_trunc('month', now()),
      generate_security_report(
        'monthly',
        date_trunc('month', now()) - interval '1 month',
        date_trunc('month', now())
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating reports
CREATE TRIGGER trigger_auto_generate_reports
  AFTER INSERT ON security_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_reports();