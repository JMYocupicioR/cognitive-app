import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import LoadingSpinner from '../LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';

interface PageLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  showNavbar?: boolean;
  showFooter?: boolean;
  isLoading?: boolean;
  className?: string;
  pageTitle?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  requireAuth = true,
  showNavbar = true,
  showFooter = true,
  isLoading = false,
  className = '',
  pageTitle
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [contentReady, setContentReady] = useState(!requireAuth);

  // Establecer el título de la página si se proporciona
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | CognitivApp`;
    } else {
      document.title = 'CognitivApp';
    }
  }, [pageTitle]);

  // Verificar autenticación
  useEffect(() => {
    if (requireAuth && !authLoading) {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: location.pathname } });
      } else {
        setContentReady(true);
      }
    }
  }, [requireAuth, isAuthenticated, authLoading, navigate]);

  // Mostrar spinner de carga mientras se verifica la autenticación
  if ((requireAuth && authLoading) || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      {showNavbar && <Navbar />}
      
      <main className={`flex-grow ${className}`}>
        {contentReady ? children : (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </main>
      
      {showFooter && (
        <footer className="bg-white dark:bg-gray-800 py-4 text-center text-sm text-gray-600 dark:text-gray-400 shadow-inner">
          &copy; {new Date().getFullYear()} CognitivApp. Todos los derechos reservados.
        </footer>
      )}
    </div>
  );
};

export default PageLayout;