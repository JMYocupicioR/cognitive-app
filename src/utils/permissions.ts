import type { UserRole } from '../types';

// Define role hierarchy
export const roleHierarchy: Record<UserRole, number> = {
  'admin': 3,
  'doctor': 2,
  'patient': 1
};

// Permission checking utilities
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const hasAnyRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.some(role => hasRole(userRole, role));
};

// Cache for permission checks
const permissionCache = new Map<string, boolean>();

export const checkPermission = (
  userRole: UserRole,
  requiredRole: UserRole,
  cacheKey?: string
): boolean => {
  if (cacheKey && permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!;
  }

  const hasPermission = hasRole(userRole, requiredRole);

  if (cacheKey) {
    permissionCache.set(cacheKey, hasPermission);
  }

  return hasPermission;
};

// Clear permission cache
export const clearPermissionCache = (): void => {
  permissionCache.clear();
};