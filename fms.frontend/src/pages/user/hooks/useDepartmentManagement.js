/**
 * File: useDepartmentManagement.js
 * Purpose: Encapsulates all department CRUD logic, user assignment, and popup state
 * Dependencies: React, Redux (userActions), devextreme notify
 * Last Modified: 2026-02-25
 *
 * Key Functions:
 * - useDepartmentManagement(dispatch, users, allDepartments): Returns department state + handlers
 */
import { useState, useCallback } from 'react';
import notify from 'devextreme/ui/notify';
import {
  fetchUsers,
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateUser,
} from '../../../redux/actions/userActions';
import { getPrimaryRoleName } from './useUserNormalization';

const EMPTY_DEPT_FORM = {
  departmentId: null,
  name: '',
  code: '',
  description: '',
  isActive: true,
};

/**
 * @param {Function} dispatch         - Redux dispatch
 * @param {Array}    users            - Normalized users from Redux
 * @param {Array}    allDepartments   - All departments from Redux
 */
const useDepartmentManagement = (dispatch, users, allDepartments) => {
  const [isDeptFormVisible, setDeptFormVisible] = useState(false);
  const [deptFormData, setDeptFormData] = useState(EMPTY_DEPT_FORM);
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptEditTab, setDeptEditTab] = useState(0); // 0 = Details, 1 = Users
  const [selectedUsersForDept, setSelectedUsersForDept] = useState([]);

  // ── Open form ──────────────────────────────────────────────────────────────
  const handleOpenDeptForm = useCallback((department = null) => {
    if (department) {
      setDeptFormData({
        departmentId: department.departmentId,
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        isActive: department.isActive ?? true,
      });
      const deptUsers = (users || []).filter(
        (u) => u.departmentId === department.departmentId && !u.isDeleted
      );
      setSelectedUsersForDept(deptUsers.map((u) => u.id));
    } else {
      setDeptFormData(EMPTY_DEPT_FORM);
      setSelectedUsersForDept([]);
    }
    setDeptEditTab(0);
    setDeptFormVisible(true);
  }, [users]);

  // ── Save department ────────────────────────────────────────────────────────
  const handleSaveDepartment = useCallback(async () => {
    if (!deptFormData.name.trim()) {
      notify('Department name is required', 'warning', 3000);
      return;
    }

    setDeptSaving(true);
    try {
      if (deptFormData.departmentId) {
        await dispatch(updateDepartment(deptFormData.departmentId, {
          departmentId: deptFormData.departmentId,
          name: deptFormData.name,
          code: deptFormData.code || null,
          description: deptFormData.description,
          isActive: deptFormData.isActive ?? true,
        }));
        await dispatch(fetchAllDepartments(true));
        setDeptFormVisible(false);
        setDeptFormData(EMPTY_DEPT_FORM);
        setSelectedUsersForDept([]);
        setDeptEditTab(0);
        notify('Department updated successfully', 'success', 3000);
      } else {
        await dispatch(createDepartment({
          name: deptFormData.name,
          code: deptFormData.code || null,
          description: deptFormData.description,
          isActive: deptFormData.isActive ?? true,
        }));
        await dispatch(fetchAllDepartments(true));
        setDeptFormVisible(false);
        setDeptFormData(EMPTY_DEPT_FORM);
        setSelectedUsersForDept([]);
        setDeptEditTab(0);
        notify('Department created successfully', 'success', 3000);
      }
    } catch (error) {
      notify(error.message || 'Failed to save department', 'error', 3000);
    } finally {
      setDeptSaving(false);
    }
  }, [dispatch, deptFormData]);

  // ── Delete department ──────────────────────────────────────────────────────
  const handleDeleteDepartment = useCallback(async (department) => {
    const deptUsers = (users || []).filter(
      (u) => u.departmentId === department.departmentId && !u.isDeleted
    );

    if (deptUsers.length > 0) {
      notify(
        `Cannot delete '${department.name}'. It has ${deptUsers.length} active user(s). Please reassign users first.`,
        'error',
        5000
      );
      return;
    }

    try {
      await dispatch(deleteDepartment(department.departmentId));
      await dispatch(fetchAllDepartments(true));
      notify('Department deleted successfully', 'success', 3000);
    } catch (error) {
      notify(error.message || 'Failed to delete department', 'error', 3000);
    }
  }, [dispatch, users]);

  // ── Assign users ──────────────────────────────────────────────────────────
  const handleAssignUsers = useCallback(async () => {
    if (!deptFormData.departmentId) {
      notify('Please save the department first before assigning users', 'warning', 3000);
      return;
    }

    const currentDeptUserIds = (users || [])
      .filter((u) => u.departmentId === deptFormData.departmentId && !u.isDeleted)
      .map((u) => u.id);

    const toAdd = selectedUsersForDept.filter((id) => !currentDeptUserIds.includes(id));
    const toRemove = currentDeptUserIds.filter((id) => !selectedUsersForDept.includes(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      notify('No changes to save', 'info', 2000);
      return;
    }

    setDeptSaving(true);
    try {
      for (const userId of toAdd) {
        const user = (users || []).find((u) => u.id === userId);
        if (user) {
          await dispatch(updateUser(userId, {
            userName: user.userName,
            email: user.email,
            roleName: getPrimaryRoleName(user),
            departmentId: deptFormData.departmentId,
          }));
        }
      }

      for (const userId of toRemove) {
        const user = (users || []).find((u) => u.id === userId);
        if (user) {
          await dispatch(updateUser(userId, {
            userName: user.userName,
            email: user.email,
            roleName: getPrimaryRoleName(user),
            departmentId: null,
          }));
        }
      }

      notify(
        `Updated: ${toAdd.length} user(s) added, ${toRemove.length} user(s) removed`,
        'success',
        3000
      );
      await dispatch(fetchUsers());
    } catch (error) {
      notify(error.message || 'Failed to update user assignments', 'error', 3000);
    } finally {
      setDeptSaving(false);
    }
  }, [dispatch, users, deptFormData, selectedUsersForDept]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getUsersInDept = useCallback(() => {
    if (!deptFormData.departmentId) return [];
    return (users || []).filter(
      (u) => u.departmentId === deptFormData.departmentId && !u.isDeleted
    );
  }, [users, deptFormData.departmentId]);

  const getAvailableUsers = useCallback(() =>
    (users || [])
      .filter((u) => !u.isDeleted)
      .map((u) => ({
        ...u,
        currentDepartmentName: u.departmentId
          ? (allDepartments || []).find((d) => d.departmentId === u.departmentId)?.name || 'Unknown'
          : 'None',
      })),
    [users, allDepartments]);

  const getDeptUserCount = useCallback((deptId) =>
    (users || []).filter((u) => u.departmentId === deptId && !u.isDeleted).length,
    [users]);

  return {
    // State
    isDeptFormVisible, setDeptFormVisible,
    deptFormData, setDeptFormData,
    deptSaving,
    deptEditTab, setDeptEditTab,
    selectedUsersForDept, setSelectedUsersForDept,

    // Actions
    handleOpenDeptForm,
    handleSaveDepartment,
    handleDeleteDepartment,
    handleAssignUsers,

    // Helpers
    getUsersInDept,
    getAvailableUsers,
    getDeptUserCount,
  };
};

export default useDepartmentManagement;
