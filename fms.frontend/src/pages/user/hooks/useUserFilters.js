/**
 * File: useUserFilters.js
 * Purpose: Manages filter state (search, role, department, status, viewMode) and filtered list
 * Dependencies: React, useUserNormalization (normalizeRoleKey)
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - useUserFilters(normalizedUsers): Returns filter state, setters, filteredUsers
 */
import { useState, useMemo } from 'react';
import { normalizeRoleKey } from './useUserNormalization';

/**
 * @param {Array} normalizedUsers  - Users already processed by useUserNormalization
 * @returns filter state + filteredUsers + helpers
 */
const useUserFilters = (normalizedUsers = []) => {
  const [searchText,          setSearchText]          = useState('');
  const [selectedRole,        setSelectedRole]        = useState('all');
  const [selectedDepartment,  setSelectedDepartment]  = useState('all');
  const [selectedStatus,      setSelectedStatus]      = useState('all');
  const [viewMode,            setViewMode]            = useState('list'); // 'list' | 'cards'
  const [activeTab,           setActiveTab]           = useState('all'); // 'all' | 'active' | 'inactive' | 'departments'

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return normalizedUsers.filter((user) => {
      // Tab filter takes precedence over status dropdown when tab is set
      const tabStatus = activeTab === 'active'   ? false
                      : activeTab === 'inactive' ? true
                      : null; // null = no tab filter active

      const matchesSearch =
        query.length === 0 ||
        user.userName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query);

      const normalizedSelectedRole = normalizeRoleKey(selectedRole);
      const matchesRole =
        selectedRole === 'all' ||
        (selectedRole === 'unassigned' && (!user.roleKeys || user.roleKeys.length === 0)) ||
        (Array.isArray(user.roleKeys) &&
          normalizedSelectedRole !== null &&
          user.roleKeys.includes(normalizedSelectedRole));

      const matchesDepartment =
        selectedDepartment === 'all' ||
        (selectedDepartment === 'none' && !user.departmentId) ||
        String(user.departmentId) === selectedDepartment;

      // Tab overrides status dropdown when a specific tab is active
      const matchesStatus =
        tabStatus !== null
          ? user.isDeleted === tabStatus
          : selectedStatus === 'all' ||
            (selectedStatus === 'active'   && !user.isDeleted) ||
            (selectedStatus === 'inactive' &&  user.isDeleted);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [normalizedUsers, searchText, selectedRole, selectedDepartment, selectedStatus, activeTab]);

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedRole('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    selectedRole !== 'all' ||
    selectedDepartment !== 'all' ||
    selectedStatus !== 'all';

  // Tab counts
  const counts = useMemo(() => ({
    all:      normalizedUsers.length,
    active:   normalizedUsers.filter((u) => !u.isDeleted).length,
    inactive: normalizedUsers.filter((u) =>  u.isDeleted).length,
  }), [normalizedUsers]);

  return {
    // State
    searchText,          setSearchText,
    selectedRole,        setSelectedRole,
    selectedDepartment,  setSelectedDepartment,
    selectedStatus,      setSelectedStatus,
    viewMode,            setViewMode,
    activeTab,           setActiveTab,

    // Derived
    filteredUsers,
    hasActiveFilters,
    counts,

    // Actions
    handleClearFilters,
  };
};

export default useUserFilters;
