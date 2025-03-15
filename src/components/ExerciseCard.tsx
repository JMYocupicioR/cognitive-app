import React from 'react';

interface ExerciseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  exercises: number;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ title, description, icon, exercises }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="ml-3 text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{exercises} ejercicios disponibles</span>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-300">
          Comenzar
        </button>
      </div>
    </div>
  );
}

export default ExerciseCard;