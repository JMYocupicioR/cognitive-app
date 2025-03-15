import React from 'react';
import { Activity, Brain, Clock, Eye, Zap, MessageSquare } from 'lucide-react';
import type { CognitiveModule } from '../types';

export const cognitiveModules: CognitiveModule[] = [
  {
    id: 'attention',
    title: 'Atención',
    description: 'Entrena tu atención sostenida, selectiva, dividida y alternante',
    icon: <Activity className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />,
    exercises: [
      { id: 'sustained', name: 'Atención Sostenida', level: 1 },
      { id: 'selective', name: 'Atención Selectiva', level: 1 },
      { id: 'divided', name: 'Atención Dividida', level: 1 },
      { id: 'alternating', name: 'Atención Alternante', level: 1 }
    ],
    baselineScore: 65
  },
  {
    id: 'memory',
    title: 'Memoria de Trabajo',
    description: 'Mejora tu capacidad de retención y manipulación de información',
    icon: <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
    exercises: [
      { id: 'digit-span', name: 'Secuencias Numéricas', level: 1 },
      { id: 'n-back', name: 'N-Back Task', level: 1 },
      { id: 'spatial', name: 'Memoria Espacial', level: 1 }
    ],
    baselineScore: 70
  },
  {
    id: 'processing',
    title: 'Velocidad de Procesamiento',
    description: 'Optimiza tu tiempo de reacción en tareas visuales y auditivas',
    icon: <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
    exercises: [
      { id: 'reaction-time', name: 'Tiempo de Reacción', level: 1 },
      { id: 'pattern-speed', name: 'Patrones Rápidos', level: 1 }
    ],
    baselineScore: 55
  },
  {
    id: 'executive',
    title: 'Funciones Ejecutivas',
    description: 'Desarrolla tu planificación y resolución de problemas',
    icon: <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
    exercises: [
      { id: 'planning', name: 'Planificación', level: 1 },
      { id: 'problem-solving', name: 'Resolución de Problemas', level: 1 },
      { id: 'inhibition', name: 'Control de Impulsos', level: 1 }
    ],
    baselineScore: 60
  },
  {
    id: 'language',
    title: 'Lenguaje',
    description: 'Mejora tu comprensión y expresión verbal',
    icon: <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />,
    exercises: [
      { id: 'comprehension', name: 'Comprensión', level: 1 },
      { id: 'fluency', name: 'Fluidez Verbal', level: 1 },
      { id: 'naming', name: 'Denominación', level: 1 }
    ],
    baselineScore: 75
  },
  {
    id: 'visuospatial',
    title: 'Habilidades Visoespaciales',
    description: 'Entrena tu orientación espacial y memoria visual',
    icon: <Eye className="h-8 w-8 text-red-600 dark:text-red-400" />,
    exercises: [
      { id: 'spatial-orientation', name: 'Orientación Espacial', level: 1 },
      { id: 'visual-memory', name: 'Memoria Visual', level: 1 },
      { id: 'pattern-recognition', name: 'Reconocimiento de Patrones', level: 1 }
    ],
    baselineScore: 65
  }
];