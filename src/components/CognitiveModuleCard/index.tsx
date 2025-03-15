import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { CognitiveModule } from '../../types';

interface CognitiveModuleCardProps {
  module: CognitiveModule;
}

const CognitiveModuleCard: React.FC<CognitiveModuleCardProps> = ({ module }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-4">
        {module.icon}
        <h3 className="ml-3 text-lg font-semibold text-gray-800 dark:text-white">{module.title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{module.description}</p>
      <div className="space-y-2 mb-4">
        {module.exercises.map((exercise) => (
          <div key={exercise.id} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <ChevronRight className="h-4 w-4 mr-1" />
            <span>{exercise.name}</span>
            <span className="ml-auto">Nivel {exercise.level}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{module.exercises.length} ejercicios disponibles</span>
        <button className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-300">
          Comenzar
        </button>
      </div>
    </div>
  );
}

export default CognitiveModuleCard;