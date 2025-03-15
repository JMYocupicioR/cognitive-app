/*
  # Initial Schema Setup for CognitivApp

  1. New Tables
    - Extended user profiles
    - Activation codes
    - User roles
    - Doctor-patient relationships
    - Treatment plans
    - Progress tracking
    
  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Set up authentication triggers
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE treatment_status AS ENUM ('active', 'completed', 'suspended');

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'patient',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activation codes table
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  role user_role NOT NULL,
  created_by uuid REFERENCES profiles(id),
  used_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  is_valid boolean DEFAULT true
);

-- Create doctor profiles table
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialization text NOT NULL,
  license text NOT NULL UNIQUE,
  hospital text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctor-patient relationships table
CREATE TABLE IF NOT EXISTS doctor_patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, patient_id)
);

-- Create treatment plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  status treatment_status DEFAULT 'active',
  objectives jsonb,
  notes text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Doctors can read their patients' profiles
CREATE POLICY "Doctors can read their patients profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patients
      WHERE doctor_id = auth.uid()
      AND patient_id = profiles.id
    )
  );

-- Activation codes policies
CREATE POLICY "Admins can create activation codes"
  ON activation_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can read valid activation codes"
  ON activation_codes FOR SELECT
  TO authenticated
  USING (
    is_valid = true
    AND (used_by IS NULL OR used_by = auth.uid())
  );

-- Doctor-patient relationship policies
CREATE POLICY "Doctors can manage their patient relationships"
  ON doctor_patients FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid());

-- Treatment plans policies
CREATE POLICY "Doctors can manage their patients' treatment plans"
  ON treatment_plans FOR ALL
  TO authenticated
  USING (doctor_id = auth.uid());

CREATE POLICY "Patients can read their treatment plans"
  ON treatment_plans FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Create functions
CREATE OR REPLACE FUNCTION verify_activation_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM activation_codes
    WHERE code = p_code
    AND is_valid = true
    AND used_by IS NULL
    AND expires_at > now()
  );
END;
$$;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at
    BEFORE UPDATE ON treatment_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();