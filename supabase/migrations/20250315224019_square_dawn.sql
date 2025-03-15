/*
  # Activation Code Verification System

  1. Functions
    - verify_activation_code: Checks if a code is valid and returns its role
    - update_activation_code_status: Marks a code as used
    - log_activation_attempt: Records verification attempts
    
  2. Indexes
    - For activation codes lookup optimization
    - For security logs querying
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS verify_activation_code(text);

-- Create new verify_activation_code function with updated return type
CREATE OR REPLACE FUNCTION verify_activation_code(p_code text)
RETURNS TABLE (
  is_valid boolean,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.is_valid AND ac.used_by IS NULL AND ac.expires_at > now(),
    ac.role
  FROM activation_codes ac
  WHERE ac.code = p_code;
END;
$$;

-- Function to update activation code status
CREATE OR REPLACE FUNCTION update_activation_code_status(
  p_code text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE activation_codes
  SET 
    used_by = p_user_id,
    used_at = now(),
    is_valid = false
  WHERE code = p_code
    AND is_valid = true
    AND used_by IS NULL
    AND expires_at > now();
    
  RETURN FOUND;
END;
$$;

-- Function to log activation attempts
CREATE OR REPLACE FUNCTION log_activation_attempt(
  p_code text,
  p_user_id uuid,
  p_ip_address text,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_logs (
    user_id,
    ip_address,
    event_type,
    details
  )
  VALUES (
    p_user_id,
    p_ip_address,
    'CODE_ACTIVATION',
    jsonb_build_object(
      'code', p_code,
      'success', p_success,
      'timestamp', now()
    )
  );
END;
$$;

-- Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_activation_codes_code 
  ON activation_codes(code) 
  WHERE is_valid AND used_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
  ON security_logs(event_type, created_at);