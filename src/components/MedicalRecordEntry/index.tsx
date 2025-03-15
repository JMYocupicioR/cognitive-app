import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  AlertCircle, 
  Pill, 
  Calendar, 
  ClipboardList, 
  Stethoscope, 
  Activity,
  FileText
} from 'lucide-react';

interface MedicalRecordEntryProps {
  isEditing?: boolean;
  onSave?: (data: any) => void;
}

const MedicalRecordEntry: React.FC<MedicalRecordEntryProps> = ({ isEditing = false, onSave }) => {
  const currentDate = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Información del Médico */}
      <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <User className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Información del Médico
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo:</p>
            <p className="text-gray-900 dark:text-white">Dr. Carlos Yocupicio Ramírez</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cédula Profesional:</p>
            <p className="text-gray-900 dark:text-white">12345678</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad:</p>
            <p className="text-gray-900 dark:text-white">Neurología Cognitiva</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Contacto:</p>
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-gray-900 dark:text-white">
                <Phone className="h-4 w-4 mr-1 text-gray-500" />
                +52 (644) 123-4567
              </span>
              <span className="flex items-center text-gray-900 dark:text-white">
                <Mail className="h-4 w-4 mr-1 text-gray-500" />
                dr.yocupicio@hospital.com
              </span>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Institución:</p>
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              <p className="text-gray-900 dark:text-white">Hospital General de Cajeme</p>
            </div>
          </div>
        </div>
      </section>

      {/* Información del Paciente */}
      <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <User className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Información del Paciente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo:</p>
            <p className="text-gray-900 dark:text-white">Juan Pérez García</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de nacimiento:</p>
            <p className="text-gray-900 dark:text-white">15 de marzo de 1980 (43 años)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de expediente:</p>
            <p className="text-gray-900 dark:text-white">EXP-2024-001234</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Seguro médico:</p>
            <p className="text-gray-900 dark:text-white">IMSS - 12345678901</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Contacto de emergencia:</p>
            <p className="text-gray-900 dark:text-white">María García (Esposa) - +52 (644) 987-6543</p>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Alergias:</p>
            </div>
            <ul className="list-disc list-inside text-gray-900 dark:text-white">
              <li>Penicilina</li>
              <li>Sulfas</li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center mb-2">
              <Pill className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Medicamentos actuales:</p>
            </div>
            <ul className="list-disc list-inside text-gray-900 dark:text-white">
              <li>Enalapril 10mg (1-0-0)</li>
              <li>Metformina 850mg (1-0-1)</li>
              <li>Atorvastatina 20mg (0-0-1)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Detalles de la Consulta */}
      <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <Calendar className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Detalles de la Consulta
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha y hora:</p>
            <p className="text-gray-900 dark:text-white">{currentDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo de consulta:</p>
            <p className="text-gray-900 dark:text-white">
              Paciente acude a seguimiento de rehabilitación cognitiva por deterioro cognitivo leve.
              Refiere mejoría en memoria a corto plazo pero persistencia de dificultades en atención.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Signos vitales:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Presión arterial</span>
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">120/80 mmHg</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Frecuencia cardíaca</span>
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">76 lpm</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Temperatura</span>
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">36.5°C</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Saturación O2</span>
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">98%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exploración y Diagnóstico */}
      <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <Stethoscope className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Exploración y Diagnóstico
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Exploración física:</p>
            <p className="text-gray-900 dark:text-white">
              Paciente consciente, orientado en tiempo, espacio y persona. 
              Funciones mentales superiores conservadas. 
              Pares craneales sin alteraciones. 
              Fuerza y sensibilidad conservadas en las 4 extremidades.
              Marcha normal.
              Sin signos meníngeos.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Evaluación cognitiva:</p>
            <ul className="list-disc list-inside text-gray-900 dark:text-white ml-4">
              <li>MoCA: 24/30 (previo 22/30)</li>
              <li>Test del reloj: 8/10</li>
              <li>Fluencia verbal: 12 palabras/minuto</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnóstico:</p>
            <p className="text-gray-900 dark:text-white">
              Deterioro cognitivo leve de dominio múltiple, predominio amnésico
              CIE-10: F06.7
            </p>
          </div>
        </div>
      </section>

      {/* Plan de Tratamiento */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <ClipboardList className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Plan de Tratamiento
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Indicaciones:</p>
            <ul className="list-disc list-inside text-gray-900 dark:text-white ml-4">
              <li>Continuar con programa de rehabilitación cognitiva en plataforma</li>
              <li>Aumentar frecuencia de ejercicios de atención a 30 minutos diarios</li>
              <li>Mantener actividad física moderada 30 minutos al día</li>
              <li>Continuar con estimulación cognitiva en casa</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Medicamentos:</p>
            <ul className="list-disc list-inside text-gray-900 dark:text-white ml-4">
              <li>Memantina 10mg cada 12 horas</li>
              <li>Donepezilo 10mg cada 24 horas</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Próxima cita:</p>
            <p className="text-gray-900 dark:text-white">En 1 mes (15 de abril de 2024)</p>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="text-center">
              <div className="border-t-2 border-gray-900 dark:border-white pt-2">
                <p className="text-gray-900 dark:text-white font-medium">Dr. Carlos Yocupicio Ramírez</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cédula Profesional: 12345678</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Neurología Cognitiva</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MedicalRecordEntry;