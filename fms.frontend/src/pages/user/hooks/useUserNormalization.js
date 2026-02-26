/**
 * File: useUserNormalization.js
 * Purpose: Extracts and normalizes role/department/status data from raw user objects
 * Dependencies: React, useMemo
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - useUserNormalization(users, allRoles, allDepartments): Returns normalizedUsers + roleOptions + departmentOptions
 *   These helpers are extracted from userPage.js to keep the main component lean.
 */
import { useMemo } from 'react';

// ── Role extraction helpers ──────────────────────────────────────────────────

export const getRoleName = (roleValue) => {
  if (!roleValue) return null;
  if (typeof roleValue === 'string') return roleValue;
  if (typeof roleValue === 'object') {
    return (
      roleValue.name     ||
      roleValue.Name     ||
      roleValue.roleName ||
      roleValue.RoleName ||
      roleValue.value    ||
      roleValue.Value    ||
      null
    );
  }
  return null;
};

export const normalizeRoleKey = (roleValue) => {
  const name = getRoleName(roleValue);
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length === 0 ? null : trimmed.toLowerCase();
};

export const extractRoleNames = (roleValue) => {
  const name = getRoleName(roleValue);
  if (typeof name !== 'string') return [];
  return name.split(',').map((s) => s.trim()).filter(Boolean);
};

export const getPrimaryRoleName = (user) => {
  const sources = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(Array.isArray(user?.Roles) ? user.Roles : []),
    user?.roleName,
    user?.RoleName,
    user?.role,
    user?.Role,
  ];
  for (const src of sources) {
    const names = extractRoleNames(src);
    if (names.length > 0) return names[0];
  }
  return '';
};

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param {Array}  users            - Raw users from Redux state
 * @param {Array}  allRoles         - All available roles
 * @param {Array}  allDepartments   - All departments
 * @returns {{ normalizedUsers, roleOptions, createRoleOptions, departmentOptions, statusOptions }}
 */
const useUserNormalization = (users, allRoles, allDepartments) => {
  const normalizedUsers = useMemo(() => {
    return (users || []).map((user) => {
      const sources = [
        ...(Array.isArray(user.roles) ? user.roles : []),
        ...(Array.isArray(user.Roles) ? user.Roles : []),
        user.roleName,
        user.RoleName,
        user.role,
        user.Role,
      ];

      const lookup = new Map();
      sources.forEach((src) => {
        extractRoleNames(src).forEach((name) => {
          const key = normalizeRoleKey(name);
          if (key && !lookup.has(key)) lookup.set(key, name);
        });
      });

      const roleNames   = Array.from(lookup.values());
      const roleKeys    = Array.from(lookup.keys());
      const roleDisplay = roleNames.length > 0 ? roleNames.join(', ') : 'Unassigned';

      return {
        ...user,
        roleNames,
        roleKeys,
        roleDisplay,
        departmentDisplay: user.departmentName || 'Unassigned',
        statusDisplay:     user.isDeleted ? 'Inactive' : 'Active',
      };
    });
  }, [users]);

  const roleOptions = useMemo(() => {
    const lookup = new Map();

    if (Array.isArray(allRoles)) {
      allRoles.forEach((role) => {
        extractRoleNames(role).forEach((name) => {
          const key = normalizeRoleKey(name);
          if (key && !lookup.has(key)) lookup.set(key, name);
        });
      });
    }

    normalizedUsers.forEach((user) => {
      (user.roleNames || []).forEach((name) => {
        const key = normalizeRoleKey(name);
        if (key && !lookup.has(key)) lookup.set(key, name);
      });
    });

    return [
      { value: 'all', text: 'All Roles' },
      ...Array.from(lookup.entries()).map(([k, v]) => ({ value: k, text: v })),
      { value: 'unassigned', text: 'Unassigned' },
    ];
  }, [allRoles, normalizedUsers]);

  const createRoleOptions = useMemo(
    () =>
      roleOptions
        .filter((r) => r.value !== 'all' && r.value !== 'unassigned')
        .map((r) => ({ value: r.text, text: r.text })),
    [roleOptions]
  );

  const departmentOptions = useMemo(() => {
    const items = (allDepartments || []).map((d) => ({
      value: String(d.departmentId),
      text:  d.name,
    }));
    return [
      { value: 'all',  text: 'All Departments' },
      { value: 'none', text: 'Unassigned' },
      ...items,
    ];
  }, [allDepartments]);

  const statusOptions = useMemo(() => [
    { value: 'all',      text: 'All Status' },
    { value: 'active',   text: 'Active' },
    { value: 'inactive', text: 'Inactive' },
  ], []);

  return {
    normalizedUsers,
    roleOptions,
    createRoleOptions,
    departmentOptions,
    statusOptions,
  };
};

export default useUserNormalization;
