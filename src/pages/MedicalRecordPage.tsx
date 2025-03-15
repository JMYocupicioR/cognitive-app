import React from 'react';
import { FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import MedicalRecordEntry from '../components/MedicalRecordEntry';

const MedicalRecordPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expediente Médico
            </h1>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200">
            Nueva Nota
          </button>
        </div>
        <MedicalRecordEntry />
      </main>
    </div>
  );
};

export default MedicalRecordPage;