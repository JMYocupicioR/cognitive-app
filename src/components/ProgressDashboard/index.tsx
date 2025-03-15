import React from 'react';
import type { CognitiveModule } from '../../types';

interface ProgressDashboardProps {
  modules: CognitiveModule[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ modules }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <div key={module.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {module.icon}
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{module.title}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{module.baselineScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                style={{ width: `${module.baselineScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Nivel actual: {Math.floor(module.baselineScore / 33) + 1}</span>
              <span>Próximo nivel: {Math.min(Math.floor(module.baselineScore / 33) + 2, 3)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Recomendaciones</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full mr-2" />
            Continúa practicando ejercicios de atención selectiva para mejorar tu rendimiento
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2" />
            ¡Excelente progreso en memoria de trabajo! Intenta aumentar la dificultad
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mr-2" />
            Considera dedicar más tiempo a los ejercicios de velocidad de procesamiento
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ProgressDashboard;