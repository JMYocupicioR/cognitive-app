import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';

// Define the validation schema using Zod
const patientInfoSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  age: z.string()
    .refine(val => !isNaN(Number(val)), { message: 'La edad debe ser un número' })
    .refine(val => Number(val) > 0 && Number(val) < 120, { message: 'La edad debe estar entre 1 y 120 años' }),
  gender: z.enum(['male', 'female', 'other'], { 
    errorMap: () => ({ message: 'Por favor seleccione un género' }) 
  }),
  chiefComplaint: z.string().min(5, { message: 'Por favor proporcione un motivo de consulta detallado' }),
  relevantHistory: z.string().optional(),
  currentMedications: z.string().optional()
});

// Infer the TypeScript type from the schema
type PatientInfoFormData = z.infer<typeof patientInfoSchema>;

interface PatientInfoFormProps {
  onSubmit: (data: PatientInfoFormData) => void;
  initialData?: PatientInfoFormData;
  isLoading?: boolean;
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({ 
  onSubmit, 
  initialData,
  isLoading = false
}) => {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<PatientInfoFormData>({
    resolver: zodResolver(patientInfoSchema),
    defaultValues: initialData || {
      name: '',
      age: '',
      gender: undefined,
      chiefComplaint: '',
      relevantHistory: '',
      currentMedications: ''
    }
  });

  const onFormSubmit = (data: PatientInfoFormData) => {
    onSubmit(data);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-6">Información del Paciente</h2>
      
      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              aria-invalid={errors.name ? 'true' : 'false'}
              className={`w-full p-2 border rounded ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600" role="alert">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{errors.name.message}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Edad <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                type="number"
                {...register('age')}
                aria-invalid={errors.age ? 'true' : 'false'}
                className={`w-full p-2 border rounded ${
                  errors.age ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.age && (
                <div className="mt-1 flex items-center text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>{errors.age.message}</span>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Género <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                {...register('gender')}
                aria-invalid={errors.gender ? 'true' : 'false'}
                className={`w-full p-2 border rounded ${
                  errors.gender ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Seleccionar</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
              {errors.gender && (
                <div className="mt-1 flex items-center text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>{errors.gender.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de consulta principal <span className="text-red-500">*</span>
          </label>
          <textarea
            id="chiefComplaint"
            {...register('chiefComplaint')}
            aria-invalid={errors.chiefComplaint ? 'true' : 'false'}
            className={`w-full p-2 border rounded ${
              errors.chiefComplaint ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            rows={3}
            disabled={isLoading}
          ></textarea>
          {errors.chiefComplaint && (
            <div className="mt-1 flex items-center text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{errors.chiefComplaint.message}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="relevantHistory" className="block text-sm font-medium text-gray-700 mb-1">
              Antecedentes relevantes
            </label>
            <textarea
              id="relevantHistory"
              {...register('relevantHistory')}
              className="w-full p-2 border rounded border-gray-300"
              rows={4}
              disabled={isLoading}
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700 mb-1">
              Medicamentos actuales
            </label>
            <textarea
              id="currentMedications"
              {...register('currentMedications')}
              className="w-full p-2 border rounded border-gray-300"
              rows={4}
              disabled={isLoading}
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientInfoForm;