import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getPermissionsFromToken,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  getUserInfoFromToken
} from '../utils/jwtUtils';

/**
 * Custom hook for handling user permissions from JWT token
 * This replaces the need for separate API calls to fetch permissions
 */
export const usePermissions = () => {
  const token = useSelector(state => state.auth.token);

  // Memoize permissions extraction to avoid recalculating on every render
  const permissions = useMemo(() => {
    if (!token) return [];
    return getPermissionsFromToken(token);
  }, [token]);

  // Memoize user info extraction
  const userInfo = useMemo(() => {
    if (!token) return null;
    return getUserInfoFromToken(token);
  }, [token]);

  // Permission checking functions
  const checkPermission = (permission) => {
    if (!token) return false;
    return hasPermission(token, permission);
  };

  const checkAnyPermission = (requiredPermissions) => {
    if (!token) return false;
    return hasAnyPermission(token, requiredPermissions);
  };

  const checkAllPermissions = (requiredPermissions) => {
    if (!token) return false;
    return hasAllPermissions(token, requiredPermissions);
  };

  const checkRole = (role) => {
    if (!token) return false;
    return hasRole(token, role);
  };

  return {
    permissions,
    userInfo,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
    isAuthenticated: !!token
  };
};
