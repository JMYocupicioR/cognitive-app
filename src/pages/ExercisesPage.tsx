import React, { useState } from 'react';
import { Search, SlidersHorizontal, Clock, Trophy, Star, BarChart } from 'lucide-react';
import Navbar from '../components/Navbar';
import { cognitiveModules } from '../config/cognitiveModules';
import type { CognitiveModule } from '../types';

const ExercisesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  const filteredModules = cognitiveModules.filter(module => {
    if (selectedModule !== 'all' && module.id !== selectedModule) return false;
    
    const moduleMatches = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const exerciseMatches = module.exercises.some(exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedLevel === 'all' || exercise.level === selectedLevel)
    );

    return moduleMatches || exerciseMatches;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ejercicios Cognitivos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explora nuestra colección completa de ejercicios diseñados para mejorar tus habilidades cognitivas
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ejercicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos los módulos</option>
                {cognitiveModules.map(module => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos los niveles</option>
                <option value="1">Nivel 1</option>
                <option value="2">Nivel 2</option>
                <option value="3">Nivel 3</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Cabecera del Módulo */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  {module.icon}
                  <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">{module.title}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{module.description}</p>
              </div>

              {/* Lista de Ejercicios */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {module.exercises.map((exercise) => (
                  <div key={exercise.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {[...Array(exercise.level)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" />
                          ))}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{exercise.name}</span>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm">
                        Comenzar
                      </button>
                    </div>
                    
                    {/* Estadísticas del Ejercicio */}
                    <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>5-10 min</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        <span>Mejor: 95%</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart className="h-4 w-4 mr-1" />
                        <span>Progreso: 75%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ExercisesPage;