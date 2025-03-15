export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          role: 'patient' | 'doctor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          role?: 'patient' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          role?: 'patient' | 'doctor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      activation_codes: {
        Row: {
          id: string
          code: string
          role: 'patient' | 'doctor' | 'admin'
          created_by: string | null
          used_by: string | null
          created_at: string
          expires_at: string
          used_at: string | null
          is_valid: boolean
        }
        Insert: {
          id?: string
          code: string
          role: 'patient' | 'doctor' | 'admin'
          created_by?: string | null
          used_by?: string | null
          created_at?: string
          expires_at: string
          used_at?: string | null
          is_valid?: boolean
        }
        Update: {
          id?: string
          code?: string
          role?: 'patient' | 'doctor' | 'admin'
          created_by?: string | null
          used_by?: string | null
          created_at?: string
          expires_at?: string
          used_at?: string | null
          is_valid?: boolean
        }
      }
      doctor_profiles: {
        Row: {
          id: string
          specialization: string
          license: string
          hospital: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          specialization: string
          license: string
          hospital?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          specialization?: string
          license?: string
          hospital?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctor_patients: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          created_at?: string
        }
      }
      treatment_plans: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          status: 'active' | 'completed' | 'suspended'
          objectives: Json
          notes: string | null
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          status?: 'active' | 'completed' | 'suspended'
          objectives: Json
          notes?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          status?: 'active' | 'completed' | 'suspended'
          objectives?: Json
          notes?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      verify_activation_code: {
        Args: {
          p_code: string
        }
        Returns: boolean
      }
    }
  }
}