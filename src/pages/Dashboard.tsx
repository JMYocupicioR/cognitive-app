import React from 'react';
import { Trophy, Brain, Clock, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import CognitiveModuleCard from '../components/CognitiveModuleCard';
import ProgressDashboard from '../components/ProgressDashboard';
import { cognitiveModules } from '../config/cognitiveModules';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <Brain className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                ¡Bienvenido{user?.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Entrena y mejora tus habilidades cognitivas con ejercicios personalizados, 
                respaldados científicamente y adaptados a tu nivel de progreso.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ejercicios Completados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">75% del objetivo semanal</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12h 30m</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-2 bg-green-600 dark:bg-green-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">60% más que la semana pasada</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nivel Promedio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.2</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <Star key={level} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                ))}
                <Star className="h-5 w-5 text-yellow-400" fill="currentColor" style={{ opacity: '0.2' }} />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Excelente progreso</p>
            </div>
          </div>
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