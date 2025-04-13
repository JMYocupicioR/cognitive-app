import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MedicalRecordPage from './pages/MedicalRecordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ErrorFallback from './components/ErrorFallback';
import LoadingSpinner from './components/LoadingSpinner';
import PageLayout from './components/common/PageLayout';
import type { UserRole } from './types';

// Lazy imports
const LazyExercisesPage = React.lazy(() => import('./pages/ExercisesPage'));
const LazyProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const LoadingFallback = () => (
  <PageLayout isLoading={true} requireAuth={false} showNavbar={false} showFooter={false}>
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  </PageLayout>
);

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error('Application error:', error)}
    >
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'head',
        }}
        language="es"
      >
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/" 
                  element={
                    <PageLayout requireAuth={false} showNavbar={false} showFooter={true}>
                      <LandingPage />
                    </PageLayout>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <PageLayout requireAuth={false} showNavbar={false} showFooter={false}>
                      <LoginPage />
                    </PageLayout>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PageLayout requireAuth={false} showNavbar={false} showFooter={false}>
                      <RegisterPage />
                    </PageLayout>
                  } 
                />
                <Route 
                  path="/verify-email" 
                  element={
                    <PageLayout requireAuth={false} showNavbar={false} showFooter={false}>
                      <VerifyEmailPage />
                    </PageLayout>
                  } 
                />
                <Route 
                  path="/unauthorized" 
                  element={
                    <PageLayout requireAuth={false} showNavbar={false} showFooter={false}>
                      <UnauthorizedPage />
                    </PageLayout>
                  } 
                />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PageLayout requireAuth={true} pageTitle="Panel Principal">
                      <Dashboard />
                    </PageLayout>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PageLayout requireAuth={true} pageTitle="Perfil">
                      <LazyProfilePage />
                    </PageLayout>
                  }
                />

                <Route
                  path="/exercises"
                  element={
                    <PageLayout requireAuth={true} pageTitle="Ejercicios">
                      <LazyExercisesPage />
                    </PageLayout>
                  }
                />

                <Route
                  path="/medical-records"
                  element={
                    <PageLayout requireAuth={true} pageTitle="Expediente Médico">
                      <MedicalRecordPage />
                    </PageLayout>
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