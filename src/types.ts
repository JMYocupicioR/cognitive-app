// Enums
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

export enum ExerciseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Interfaces básicas
export interface Exercise {
  id: string;
  name: string;
  level: number;
  description?: string;
  instructions?: string;
  category?: string;
  status?: ExerciseStatus;
}

export interface CognitiveModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  exercises: Exercise[];
  baselineScore: number;
}

// Interfaces de usuario
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export interface Patient extends BaseUser {
  doctorId?: string;
  diagnosis?: string;
  treatmentPlan?: TreatmentPlan;
  activationCode?: string;
}

export interface Doctor extends BaseUser {
  specialization?: string;
  license?: string;
  patients?: string[]; // Array de IDs de pacientes
  hospital?: string;
}

export interface Admin extends BaseUser {
  permissions?: string[];
}

// Interfaces de tratamiento y progreso
export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  startDate: Date;
  endDate?: Date;
  objectives: string[];
  notes?: string;
  status: 'active' | 'completed' | 'suspended';
}

// Interfaces de autenticación
export interface AuthState {
  user: BaseUser | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
  activationCode?: string;
  birthDate?: string;
  gender?: string;
}