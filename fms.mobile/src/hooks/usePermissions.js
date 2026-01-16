/**
 * File: usePermissions.js
 * Purpose: Hook for checking user roles and permissions in mobile app
 * Uses JWT token to extract permissions (same pattern as web frontend)
 * Dependencies: Redux auth state, jwtUtils
 * Last Modified: 2026-01-16
 */

import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getPermissionsFromToken,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole as jwtHasRole,
  getUserInfoFromToken,
} from "../utils/jwtUtils";

/**
 * Custom hook for handling user permissions from JWT token
 * This mirrors the web usePermissions hook pattern
 */
export const usePermissions = () => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  // Memoize permissions extraction to avoid recalculating on every render
  const permissions = useMemo(() => {
    if (!token) return [];
    return getPermissionsFromToken(token);
  }, [token]);

  // Memoize user info extraction from token
  const tokenUserInfo = useMemo(() => {
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
    return jwtHasRole(token, role);
  };

  // Check if user is admin (Admin or SuperAdmin role)
  const isAdmin = useMemo(() => {
    if (!token) return false;
    return jwtHasRole(token, "Admin") || jwtHasRole(token, "SuperAdmin");
  }, [token]);

  // Check if user can edit vehicles (has _Edit_Vehicle permission)
  const canEditVehicle = useMemo(() => {
    if (!token) return false;
    return hasPermission(token, "_Edit_Vehicle");
  }, [token]);

  // Get combined user info (from token + redux state)
  const userInfo = useMemo(() => {
    if (!user && !tokenUserInfo) return null;

    return {
      id: user?.userId || user?.id || tokenUserInfo?.id,
      username: user?.userName || user?.username || tokenUserInfo?.username,
      email: user?.email || tokenUserInfo?.email,
      roleName: user?.roleName || user?.role,
      siteId: user?.defaultSiteId || user?.siteId,
      siteName: user?.defaultSiteName || user?.siteName,
    };
  }, [user, tokenUserInfo]);

  return {
    permissions,
    userInfo,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasRole: checkRole,
    isAdmin,
    canEditVehicle,
    isAuthenticated: !!token,
  };
};

export default usePermissions;
