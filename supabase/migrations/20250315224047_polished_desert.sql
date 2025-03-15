/*
  # Session Management System

  1. Tables
    - sessions: Stores user session information
    - Includes session validation and cleanup functions
    
  2. Security
    - Enable RLS
    - Add policies for session access
    - Functions for session management
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  device_info jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Invalidate expired sessions
  UPDATE sessions
  SET is_valid = false
  WHERE expires_at < now()
  OR last_activity < now() - interval '24 hours';

  -- Delete very old sessions (older than 30 days)
  DELETE FROM sessions
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to validate and update session
CREATE OR REPLACE FUNCTION validate_session(
  p_session_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_valid boolean;
BEGIN
  -- Check if session exists and is valid
  SELECT 
    s.is_valid AND s.expires_at > now()
    AND s.last_activity > now() - interval '24 hours'
  INTO v_is_valid
  FROM sessions s
  WHERE s.id = p_session_id
  AND s.user_id = p_user_id;

  IF v_is_valid THEN
    -- Update last activity
    UPDATE sessions
    SET last_activity = now()
    WHERE id = p_session_id;
  END IF;

  RETURN COALESCE(v_is_valid, false);
END;
$$;

-- Function to create new session
CREATE OR REPLACE FUNCTION create_session(
  p_user_id uuid,
  p_device_info jsonb DEFAULT '{}'::jsonb,
  p_duration interval DEFAULT interval '7 days'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Generate new session ID
  v_session_id := gen_random_uuid();

  -- Create session record
  INSERT INTO sessions (
    id,
    user_id,
    expires_at,
    device_info
  )
  VALUES (
    v_session_id,
    p_user_id,
    now() + p_duration,
    p_device_info
  );

  -- Log session creation
  PERFORM log_security_event(
    p_user_id,
    current_setting('request.headers')::jsonb->>'x-real-ip',
    'SESSION_CREATED',
    jsonb_build_object(
      'session_id', v_session_id,
      'device_info', p_device_info
    )
  );

  RETURN v_session_id;
END;
$$;

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_valid ON sessions(is_valid) WHERE is_valid = true;

-- Create function to periodically cleanup sessions
CREATE OR REPLACE FUNCTION auto_cleanup_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run cleanup if enough time has passed since last cleanup
  IF NOT EXISTS (
    SELECT 1 FROM sessions 
    WHERE last_activity > now() - interval '1 hour'
    AND metadata->>'last_cleanup' IS NOT NULL
  ) THEN
    PERFORM cleanup_expired_sessions();
    
    -- Mark cleanup timestamp
    UPDATE sessions 
    SET metadata = jsonb_set(
      metadata, 
      '{last_cleanup}', 
      to_jsonb(now()::text)
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-cleanup on session activity
CREATE TRIGGER trigger_auto_cleanup_sessions
  AFTER INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_sessions();