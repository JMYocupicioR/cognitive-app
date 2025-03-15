import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import { LazyMedicalRecordEntry, LazyProgressDashboard, LazyRegisterForm } from './utils/lazyImports';

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/register" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyRegisterForm />
                  </Suspense>
                } 
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected routes */}
              <Route
                path="/medical-records"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.DOCTOR, UserRole.ADMIN]}>
                    <Suspense fallback={<LoadingFallback />}>
                      <LazyMedicalRecordEntry />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Default route */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </GoogleReCaptchaProvider>
  );
}

export default App;