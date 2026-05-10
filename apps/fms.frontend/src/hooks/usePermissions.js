/**
 * File: usePermissions.js
 * Purpose: Custom hook for checking user permissions from Redux state.
 *          Permissions are fetched from GET /Permission/me after login and stored in auth.myPermissions.
 *          This replaces the old approach of decoding permissions from the JWT token.
 * Dependencies: react-redux, jwtUtils (for getUserInfoFromToken and hasRole only)
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - hasPermission(perm): Check if user has a single permission (case-insensitive)
 * - hasAnyPermission([perms]): OR-logic check across multiple permissions
 * - hasAllPermissions([perms]): AND-logic check across multiple permissions
 * - hasRole(role): Check if user has a specific role (from JWT)
 */
import { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  hasRole as jwtHasRole,
  getUserInfoFromToken
} from '../utils/jwtUtils';

export const usePermissions = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  const myPermissions = useSelector(state => state.auth.myPermissions);
  const permissionsLoaded = useSelector(state => state.auth.permissionsLoaded);

  // Permissions come from Redux (fetched from GET /Permission/me)
  const permissions = useMemo(() => {
    const reduxPermissions = Array.isArray(myPermissions) ? myPermissions : [];
    const userPermissions = Array.isArray(user?.permissions)
      ? user.permissions
      : Array.isArray(user?.Permissions)
        ? user.Permissions
        : [];

    const merged = [...new Set([...reduxPermissions, ...userPermissions])];

    return merged;
  }, [myPermissions, user, permissionsLoaded]);

  // Build a lowercase Set for fast lookups
  const permissionSet = useMemo(() => {
    return new Set((permissions || []).map(p => p.toLowerCase()));
  }, [permissions]);

  // User info still comes from JWT (identity claims are still in the token)
  const userInfo = useMemo(() => {
    if (!token) return null;
    return getUserInfoFromToken(token);
  }, [token]);

  // Permission checking functions
  const checkPermission = useCallback((permission) => {
    if (!permission) return false;
    return permissionSet.has(permission.toLowerCase());
  }, [permissionSet]);

  const checkAnyPermission = useCallback((requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return false;
    return requiredPermissions.some(perm => permissionSet.has(perm.toLowerCase()));
  }, [permissionSet]);

  const checkAllPermissions = useCallback((requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return false;
    return requiredPermissions.every(perm => permissionSet.has(perm.toLowerCase()));
  }, [permissionSet]);

  const checkRole = useCallback((role) => {
    if (!token) return false;
    return jwtHasRole(token, role);
  }, [token]);

  return {
    permissions,
    permissionsLoaded,
    userInfo,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
    isAuthenticated: !!token
  };
};
