import { securityAuditService } from '../services/SecurityAuditService';

/**
 * Tipos de errores comunes en la aplicación
 */
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  API = 'API_ERROR',
  UNEXPECTED = 'UNEXPECTED_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR'
}

/**
 * Error personalizado para la aplicación
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: Record<string, any>;
  isSilent: boolean;

  constructor({
    message,
    type = ErrorType.UNEXPECTED,
    statusCode,
    details,
    isSilent = false
  }: {
    message: string;
    type?: ErrorType;
    statusCode?: number;
    details?: Record<string, any>;
    isSilent?: boolean;
  }) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.isSilent = isSilent;
    
    // Capturar stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Maneja un error, realizando las acciones apropiadas según su tipo
 */
export function handleError(error: unknown, context?: string): AppError {
  // Convertir a AppError si no lo es ya
  const appError = convertToAppError(error, context);
  
  // Registrar el error
  logError(appError);
  
  // Si no es silencioso, mostrar al usuario
  if (!appError.isSilent) {
    displayErrorToUser(appError);
  }
  
  return appError;
}

/**
 * Convierte cualquier error a un AppError
 */
export function convertToAppError(error: unknown, context?: string): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  let type = ErrorType.UNEXPECTED;
  let message = 'Ha ocurrido un error inesperado';
  let statusCode: number | undefined;
  let details: Record<string, any> | undefined;
  
  if (error instanceof Error) {
    message = error.message;
    
    // Determinar tipo de error basado en el mensaje o propiedades
    if (error.name === 'NetworkError' || message.includes('network')) {
      type = ErrorType.NETWORK;
    } else if (error.name === 'AuthenticationError' || message.includes('authentication') || message.includes('login')) {
      type = ErrorType.AUTHENTICATION;
    } else if (error.name === 'AuthorizationError' || message.includes('permission') || message.includes('authorized')) {
      type = ErrorType.AUTHORIZATION;
    } else if (error.name === 'ValidationError' || message.includes('validation') || message.includes('invalid')) {
      type = ErrorType.VALIDATION;
    }
    
    // Capturar stack trace
    details = { stack: error.stack };
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    const errorObj = error as Record<string, any>;
    message = errorObj.message || message;
    statusCode = errorObj.status || errorObj.statusCode;
    details = { ...errorObj };
  }
  
  if (context) {
    details = { ...details, context };
  }
  
  return new AppError({
    message,
    type,
    statusCode,
    details
  });
}

/**
 * Registra un error en los sistemas de monitoreo
 */
export function logError(error: AppError): void {
  // Determinar severidad basada en tipo de error
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  switch (error.type) {
    case ErrorType.NETWORK:
      severity = 'low';
      break;
    case ErrorType.VALIDATION:
      severity = 'low';
      break;
    case ErrorType.AUTHENTICATION:
      severity = 'medium';
      break;
    case ErrorType.AUTHORIZATION:
      severity = 'high';
      break;
    case ErrorType.API:
      severity = 'medium';
      break;
    case ErrorType.UNEXPECTED:
      severity = 'high';
      break;
    case ErrorType.NOT_FOUND:
      severity = 'low';
      break;
  }
  
  // Registrar en el servicio de auditoría de seguridad
  securityAuditService.logSecurityEvent(
    'APPLICATION_ERROR',
    {
      errorType: error.type,
      message: error.message,
      stack: error.stack,
      details: error.details,
      statusCode: error.statusCode
    },
    severity
  );
  
  // Registrar en la consola para desarrollo
  if (import.meta.env.DEV) {
    console.error(`[${error.type}]`, error.message, error);
  }
}

/**
 * Muestra un error al usuario de forma apropiada
 */
export function displayErrorToUser(error: AppError): void {
  // Determinar mensaje amigable según tipo de error
  let userMessage = 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
  
  switch (error.type) {
    case ErrorType.NETWORK:
      userMessage = 'Parece que hay un problema de conexión. Por favor verifica tu conexión a internet e intenta nuevamente.';
      break;
    case ErrorType.AUTHENTICATION:
      userMessage = 'Tu sesión ha expirado o las credenciales son inválidas. Por favor inicia sesión nuevamente.';
      break;
    case ErrorType.AUTHORIZATION:
      userMessage = 'No tienes permisos para realizar esta acción.';
      break;
    case ErrorType.VALIDATION:
      userMessage = 'Hay un problema con los datos ingresados. Por favor verifica la información e intenta nuevamente.';
      break;
    case ErrorType.NOT_FOUND:
      userMessage = 'El recurso solicitado no fue encontrado.';
      break;
  }
  
  // En una aplicación real, aquí implementaríamos la lógica para mostrar toast, modal, etc.
  // Por ahora, solo lo registramos para desarrollo
  if (import.meta.env.DEV) {
    console.info('User error notification:', userMessage);
  }
  
  // Disparar evento personalizado para que los componentes puedan reaccionar
  window.dispatchEvent(new CustomEvent('app:error', { 
    detail: { 
      message: userMessage,
      type: error.type,
      original: error
    } 
  }));
}

/**
 * Función asíncrona segura que captura errores
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void,
  context?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const appError = handleError(error, context);
    if (errorHandler) {
      errorHandler(appError);
    }
    return null;
  }
}