/**
 * File: usePermissions.js
 * Purpose: Hook for checking user roles and permissions in mobile app.
 *          Permissions are fetched from GET /Permission/me after login and stored in auth.myPermissions.
 *          This replaces the old approach of decoding permissions from the JWT token.
 * Dependencies: Redux auth state, jwtUtils (for role checks and user info only)
 * Last Modified: 2026-02-07
 */

import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  hasRole as jwtHasRole,
  getUserInfoFromToken,
} from "../utils/jwtUtils";

/**
 * Custom hook for handling user permissions from Redux state.
 * Permissions are fetched via GET /Permission/me and stored in auth.myPermissions.
 */
export const usePermissions = () => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const myPermissions = useSelector((state) => state.auth.myPermissions);
  const permissionsLoaded = useSelector((state) => state.auth.permissionsLoaded);

  // Permissions come from Redux (fetched from GET /Permission/me)
  const permissions = useMemo(() => {
    return myPermissions || [];
  }, [myPermissions]);

  // Build a lowercase Set for fast lookups
  const permissionSet = useMemo(() => {
    return new Set((permissions || []).map(p => p.toLowerCase()));
  }, [permissions]);

  // Memoize user info extraction from token
  const tokenUserInfo = useMemo(() => {
    if (!token) return null;
    return getUserInfoFromToken(token);
  }, [token]);

  // Permission checking functions using Redux-stored permissions
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

  // Check if user is admin (Admin or SuperAdmin role)
  const isAdmin = useMemo(() => {
    if (token && (jwtHasRole(token, "Admin") || jwtHasRole(token, "SuperAdmin"))) {
      return true;
    }

    const roleCandidates = [
      user?.roleName,
      user?.role,
      ...(Array.isArray(user?.roles)
        ? user.roles
        : user?.roles
          ? [user.roles]
          : []),
    ];

    return roleCandidates.some((role) => {
      if (!role || typeof role !== "string") return false;
      const normalized = role.toLowerCase();
      return (
        normalized === "admin" ||
        normalized === "superadmin" ||
        normalized === "super admin" ||
        normalized === "superadministrator" ||
        normalized === "super administrator" ||
        normalized === "administrator"
      );
    });
  }, [token, user]);

  // Check if user can edit vehicles (has _Edit_Vehicle permission)
  const canEditVehicle = useMemo(() => {
    return permissionSet.has('_edit_vehicle');
  }, [permissionSet]);

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
    permissionsLoaded,
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
