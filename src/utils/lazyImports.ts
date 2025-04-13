import { lazy } from 'react';

// Properly configure lazy imports with chunk names and explicit file paths
export const LazyMedicalRecordEntry = lazy(() => 
  import('../components/MedicalRecordEntry').then(module => ({
    default: module.default
  }))
);

export const LazyProgressDashboard = lazy(() => 
  import('../components/ProgressDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyRegisterForm = lazy(() => 
  import('../pages/RegisterPage').then(module => ({
    default: module.default
  }))
);

export const LazyExercisesPage = lazy(() => 
  import('../pages/ExercisesPage').then(module => ({
    default: module.default
  }))
);

export const LazyProfilePage = lazy(() => 
  import('../pages/ProfilePage').then(module => ({
    default: module.default
  }))
);