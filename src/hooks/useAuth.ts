import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { AppError, ErrorType } from '../utils/errorHandling'; // Importar utilidades de manejo de errores


/**
 * Hook personalizado para acceder al contexto de autenticación
 * y proporcionar funciones auxiliares para la verificación de permisos
 */
export const useAuth = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    // Usar nuestro sistema de manejo de errores
    throw new AppError({
      message: 'useAuth debe ser usado dentro de un AuthProvider',
      type: ErrorType.UNEXPECTED,
      details: { component: 'useAuth' }
    });
  }


  /**
   * Verifica si el usuario tiene un rol específico
   * @param role El rol requerido para la verificación
   * @returns boolean indicando si el usuario tiene el rol especificado
   */
  const hasRole = (role: UserRole): boolean => {
    return auth.userRole === role;
  };

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   * @param roles Array de roles permitidos
   * @returns boolean indicando si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!auth.userRole) return false;
    return roles.includes(auth.userRole);
  };

  /**
   * Verifica si el usuario tiene permisos para acceder a una funcionalidad específica
   * @param requiredRole Rol mínimo requerido para la funcionalidad
   * @returns boolean indicando si el usuario tiene los permisos necesarios
   */
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!auth.userRole) return false;
    
    // Define jerarquía de roles (admin > doctor > patient)
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 3,
      [UserRole.DOCTOR]: 2,
      [UserRole.PATIENT]: 1
    };
    
    return roleHierarchy[auth.userRole] >= roleHierarchy[requiredRole];
  };

  /**
   * Verifica si el usuario está autenticado y tiene un rol específico
   * @param role El rol requerido para la verificación
   * @returns boolean indicando si el usuario está autenticado y tiene el rol especificado
   */
  const isAuthenticated = (role?: UserRole): boolean => {
    if (!auth.isAuthenticated) return false;
    if (!role) return true;
    return hasRole(role);
  };

  return {
    ...auth,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAuthenticated
  };
};

export default useAuth;