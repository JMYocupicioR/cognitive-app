/*
  # Update Authentication Policies

  1. Policies
    - Update RLS policies for better security
    - Add missing policies for public access
    - Fix policy conditions
    - Check for existing policies before creation
*/

-- Enable RLS on all tables
DO $$ 
BEGIN
  ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS activation_codes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS doctor_profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS doctor_patients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS treatment_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS security_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS security_reports ENABLE ROW LEVEL SECURITY;
END $$;

-- Drop existing policies to recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Doctors can read their patients profiles" ON profiles;
  DROP POLICY IF EXISTS "Anyone can read valid activation codes" ON activation_codes;
  DROP POLICY IF EXISTS "Doctor profiles are viewable by everyone" ON doctor_profiles;
  DROP POLICY IF EXISTS "Doctors can update own profile" ON doctor_profiles;
  DROP POLICY IF EXISTS "Patients can view own treatment plans" ON treatment_plans;
  DROP POLICY IF EXISTS "Doctors can manage treatment plans" ON treatment_plans;
  DROP POLICY IF EXISTS "Users can manage own sessions" ON sessions;
END $$;

-- Create new policies
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors can read their patients profiles') THEN
    CREATE POLICY "Doctors can read their patients profiles" 
    ON profiles FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM doctor_patients
        WHERE doctor_patients.doctor_id = auth.uid()
        AND doctor_patients.patient_id = profiles.id
      )
      OR 
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'doctor'
      )
    );
  END IF;

  -- Activation codes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read valid activation codes') THEN
    CREATE POLICY "Anyone can read valid activation codes"
    ON activation_codes FOR SELECT
    USING (
      is_valid = true 
      AND used_by IS NULL 
      AND expires_at > now()
    );
  END IF;

  -- Doctor profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctor profiles are viewable by everyone') THEN
    CREATE POLICY "Doctor profiles are viewable by everyone"
    ON doctor_profiles FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors can update own profile') THEN
    CREATE POLICY "Doctors can update own profile"
    ON doctor_profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
  END IF;

  -- Treatment plans policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients can view own treatment plans') THEN
    CREATE POLICY "Patients can view own treatment plans"
    ON treatment_plans FOR SELECT
    USING (patient_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Doctors can manage treatment plans') THEN
    CREATE POLICY "Doctors can manage treatment plans"
    ON treatment_plans FOR ALL
    USING (doctor_id = auth.uid());
  END IF;

  -- Sessions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own sessions') THEN
    CREATE POLICY "Users can manage own sessions"
    ON sessions FOR ALL
    USING (user_id = auth.uid());
  END IF;

END $$;