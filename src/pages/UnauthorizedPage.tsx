import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
        </div>
        
        <div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Acceso No Autorizado
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No tienes los permisos necesarios para acceder a esta página.
            {userRole && ` Tu rol actual es: ${userRole}`}
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;