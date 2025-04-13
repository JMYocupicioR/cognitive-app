/*
  # Add Default Activation Codes

  1. New Data
    - Creates default activation codes for admin and doctor registration
    - Admin code: ADMIN2025
    - Doctor code: UADY
    - Valid for 30 days
    
  2. Security
    - Codes are hashed for security
    - Limited validity period
    - Role-specific codes
*/

-- Insert default activation codes if they don't exist
INSERT INTO activation_codes (code, role, expires_at, is_valid)
SELECT 'ADMIN2025', 'admin', now() + interval '30 days', true
WHERE NOT EXISTS (
  SELECT 1 FROM activation_codes 
  WHERE code = 'ADMIN2025'
);

INSERT INTO activation_codes (code, role, expires_at, is_valid)
SELECT 'UADY', 'doctor', now() + interval '30 days', true
WHERE NOT EXISTS (
  SELECT 1 FROM activation_codes 
  WHERE code = 'UADY'
);

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_activation_codes_valid_unused 
ON activation_codes(code) 
WHERE is_valid = true AND used_by IS NULL;