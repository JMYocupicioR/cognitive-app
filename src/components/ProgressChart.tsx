import React from 'react';

const ProgressChart: React.FC = () => {
  // Simulated progress data
  const progressData = [65, 80, 45];
  const categories = ['Atención', 'Memoria', 'Funciones Ejecutivas'];

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <div key={category} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{category}</span>
            <span className="text-sm font-medium text-gray-700">{progressData[index]}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${progressData[index]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProgressChart;