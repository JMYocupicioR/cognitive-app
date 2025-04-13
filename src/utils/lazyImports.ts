import { lazy } from 'react';

/**
 * Importaciones lazy para optimizar el rendimiento de la carga de la aplicación.
 * Estos componentes solo se cargarán cuando sean necesarios.
 */

// Páginas principales
export const LazyDashboard = lazy(() => 
  import('../pages/Dashboard').then(module => ({
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

export const LazyMedicalRecordPage = lazy(() => 
  import('../pages/MedicalRecordPage').then(module => ({
    default: module.default
  }))
);

export const LazyRegisterPage = lazy(() => 
  import('../pages/RegisterPage').then(module => ({
    default: module.default
  }))
);

export const LazyVerifyEmailPage = lazy(() => 
  import('../pages/VerifyEmailPage').then(module => ({
    default: module.default
  }))
);

export const LazyUnauthorizedPage = lazy(() => 
  import('../pages/UnauthorizedPage').then(module => ({
    default: module.default
  }))
);

// Componentes complejos que pueden beneficiarse de lazy loading
export const LazyProgressDashboard = lazy(() => 
  import('../components/ProgressDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyMedicalRecordEntry = lazy(() => 
  import('../components/MedicalRecordEntry').then(module => ({
    default: module.default
  }))
);

// Manejador de errores para importaciones lazy
export const handleLazyImportError = (error: Error): void => {
  console.error('Error loading lazy component:', error);
  // Aquí se podría implementar lógica adicional como enviar el error a un servicio de monitoreo
};