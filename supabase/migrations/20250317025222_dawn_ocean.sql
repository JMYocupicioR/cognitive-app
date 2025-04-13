-- Create token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  token text NOT NULL,
  invalidated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token 
ON token_blacklist(token);

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_token_blacklist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM token_blacklist
  WHERE invalidated_at < now() - interval '24 hours';
END;
$$;

-- Create trigger for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_token_blacklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT count(*) FROM token_blacklist) > 10000 THEN
    PERFORM cleanup_token_blacklist();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_cleanup_token_blacklist
AFTER INSERT ON token_blacklist
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_token_blacklist();

-- Enable RLS
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only authenticated users can read token blacklist"
ON token_blacklist FOR SELECT
TO authenticated
USING (true);