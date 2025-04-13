/*
  # Fix Rate Limiting Function

  1. Functions
    - Simplified rate limit check function
    - Removed unnecessary parameters
    - Added proper error handling
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer, integer);

-- Create new rate limit check function
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint 
ON rate_limits(ip_address, endpoint);