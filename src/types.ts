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
  category: string;
  description: string;
  duration: number; // en minutos
  instructions: string;
  difficulty: number;
  status: ExerciseStatus;
  requiredTools?: string[];
}

export interface CognitiveModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  exercises: Exercise[];
  baselineScore: number;
  category: string;
  recommendedFrequency?: number;
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
  doctorId: string;
  diagnosis?: string;
  treatmentPlan?: TreatmentPlan;
  progress: Progress[];
  activationCode: string;
  medicalHistory?: MedicalHistory;
}

export interface Doctor extends BaseUser {
  specialization: string;
  license: string;
  patients: string[]; // Array de IDs de pacientes
  activationCode: string;
  hospital?: string;
}

export interface Admin extends BaseUser {
  permissions: string[];
}

// Interfaces de tratamiento y progreso
export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  startDate: Date;
  endDate?: Date;
  objectives: string[];
  recommendedExercises: RecommendedExercise[];
  notes: string;
  status: 'active' | 'completed' | 'suspended';
}

export interface RecommendedExercise {
  exerciseId: string;
  frequency: number; // veces por semana
  duration: number; // minutos por sesión
  difficulty: number;
  adaptiveProgression: boolean;
}

export interface Progress {
  id: string;
  patientId: string;
  exerciseId: string;
  date: Date;
  score: number;
  duration: number;
  difficulty: number;
  mistakes: number;
  notes?: string;
}

export interface MedicalHistory {
  diagnosis: string[];
  medications: Medication[];
  observations: string[];
  lastUpdate: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

// Interfaces de autenticación
export interface AuthResponse {
  user: BaseUser;
  token: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
  activationCode?: string;
}

// Interfaces de análisis y reportes
export interface ProgressReport {
  patientId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  exercises: ExerciseProgress[];
  overallProgress: number;
  recommendations: string[];
}

export interface ExerciseProgress {
  exerciseId: string;
  attempts: number;
  averageScore: number;
  timeSpent: number;
  progressTrend: number;
}

export interface ActivationCodeResponse {
  isValid: boolean;
  role: UserRole | null;
  error: string | null;
}