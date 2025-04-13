import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorFallback from './components/ErrorFallback';
import LoadingSpinner from './components/LoadingSpinner';
import { UserRole } from './types';
import { 
  LazyMedicalRecordEntry, 
  LazyProgressDashboard, 
  LazyRegisterForm,
  LazyExercisesPage,
  LazyProfilePage 
} from './utils/lazyImports';

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error('Application error:', error)}
    >
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'body',
          nonce: undefined
        }}
        language="es"
        useEnterprise={false}
        useRecaptchaNet={false}
        container={{
          parameters: {
            badge: 'bottomright',
            size: 'invisible'
          }
        }}
      >
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<LazyRegisterForm />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <LazyProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/exercises"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
                      <LazyExercisesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/medical-records"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.DOCTOR, UserRole.ADMIN]}>
                      <LazyMedicalRecordEntry />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </GoogleReCaptchaProvider>
    </ErrorBoundary>
  );
}

export default App;