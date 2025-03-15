/*
  # Rate Limiting and Security Features

  1. New Tables
    - `rate_limits`: Tracks API request counts for rate limiting
    - `security_logs`: Logs security events like failed login attempts
  
  2. Functions
    - `check_rate_limit`: Verifies if a request is within rate limits
    - `log_security_event`: Records security-related events
    - `cleanup_old_records`: Removes expired rate limits and old logs
    
  3. Security
    - RLS policies for admin-only access
    - Automatic cleanup of old records
*/

-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  first_request_at timestamptz DEFAULT now(),
  last_request_at timestamptz DEFAULT now(),
  UNIQUE(ip_address, endpoint)
);

-- Create security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  event_type text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address text,
  p_endpoint text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_first_request timestamptz;
BEGIN
  -- Clean up old rate limits first
  DELETE FROM rate_limits
  WHERE last_request_at < now() - make_interval(secs := p_window_seconds);

  -- Get or create rate limit record
  INSERT INTO rate_limits (ip_address, endpoint)
  VALUES (p_ip_address, p_endpoint)
  ON CONFLICT (ip_address, endpoint) DO UPDATE
  SET request_count = rate_limits.request_count + 1,
      last_request_at = now()
  RETURNING request_count, first_request_at INTO v_count, v_first_request;

  -- Check if within window
  IF now() - v_first_request > make_interval(secs := p_window_seconds) THEN
    -- Reset counter if window expired
    UPDATE rate_limits
    SET request_count = 1,
        first_request_at = now(),
        last_request_at = now()
    WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint;
    RETURN true;
  END IF;

  -- Check if under limit
  RETURN v_count <= p_max_requests;
END;
$$;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_ip_address text,
  p_event_type text,
  p_details jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old logs first (keep last 30 days)
  DELETE FROM security_logs
  WHERE created_at < now() - interval '30 days';

  -- Insert new log entry
  INSERT INTO security_logs (user_id, ip_address, event_type, details)
  VALUES (p_user_id, p_ip_address, p_event_type, p_details);
END;
$$;

-- Create cleanup function for manual execution
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean rate limits older than 1 day
  DELETE FROM rate_limits
  WHERE last_request_at < now() - interval '1 day';

  -- Clean security logs older than 30 days
  DELETE FROM security_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view rate limits"
  ON rate_limits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can view security logs"
  ON security_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX idx_rate_limits_last_request ON rate_limits(last_request_at);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);