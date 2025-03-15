import { lazy } from 'react';

// Componentes pesados que requieren lazy loading
export const LazyMedicalRecordEntry = lazy(() => 
  import('../components/MedicalRecordEntry').then(module => ({
    default: module.default,
    __chunkSize: '120KB' // Para documentación y monitoreo
  }))
);

export const LazyProgressDashboard = lazy(() => 
  import('../components/ProgressDashboard').then(module => ({
    default: module.default,
    __chunkSize: '105KB'
  }))
);

export const LazyRegisterForm = lazy(() => 
  import('../components/RegisterForm').then(module => ({
    default: module.default,
    __chunkSize: '115KB'
  }))
);