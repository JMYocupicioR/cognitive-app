import React from 'react';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CognitiveModuleCard from '../components/CognitiveModuleCard';
import ProgressDashboard from '../components/ProgressDashboard';
import { cognitiveModules } from '../config/cognitiveModules';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            ¡Bienvenido a tu programa de rehabilitación cognitiva del Dr. Yocupicio!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Entrena y mejora tus habilidades cognitivas con ejercicios personalizados, 
            respaldados científicamente y adaptados a tu nivel de progreso.
          </p>
        </div>

        {/* Cognitive Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cognitiveModules.map((module) => (
            <CognitiveModuleCard
              key={module.id}
              module={module}
            />
          ))}
        </div>

        {/* Progress Dashboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tu Progreso</h2>
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <ProgressDashboard modules={cognitiveModules} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;