/**
 * File: DepartmentTab.js
 * Purpose: Tab content for Departments — lists all departments with cards and management actions
 * Dependencies: React, DepartmentCard, useDepartmentManagement hook, DepartmentFormPopup
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - DepartmentTab(props): Shows department cards grid + Add Dept button + form popup
 */
import React from 'react';
import DepartmentCard from './DepartmentCard';
import DepartmentFormPopup from './DepartmentFormPopup';

/**
 * @param {object}   props
 * @param {Array}    props.departments             - allDepartments from Redux
 * @param {boolean}  props.canManage               - Whether user can edit/delete departments
 * @param {object}   props.deptHook                - useDepartmentManagement return value
 */
const DepartmentTab = ({ departments = [], canManage = false, deptHook }) => {
  const {
    isDeptFormVisible,
    setDeptFormVisible,
    deptFormData,
    setDeptFormData,
    deptSaving,
    deptEditTab,
    setDeptEditTab,
    selectedUsersForDept,
    setSelectedUsersForDept,
    handleOpenDeptForm,
    handleSaveDepartment,
    handleDeleteDepartment,
    handleAssignUsers,
    getUsersInDept,
    getAvailableUsers,
    getDeptUserCount,
  } = deptHook;

  return (
    <div className="m365-list-area">
      {/* Actions bar */}
      {canManage && (
        <div style={{ marginBottom: 16 }}>
          <button
            className="m365-btn m365-btn--primary"
            onClick={() => handleOpenDeptForm(null)}
          >
            <i className="fa-light fa-plus" />
            Add Department
          </button>
        </div>
      )}

      {/* Department cards */}
      {departments.length === 0 ? (
        <div className="m365-empty">
          <i className="fa-light fa-building m365-empty__icon" />
          <p className="m365-empty__title">No departments yet</p>
          <p className="m365-empty__subtitle">
            {canManage ? 'Click "Add Department" to create the first one.' : 'No departments have been created.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.departmentId}
              department={dept}
              userCount={getDeptUserCount(dept.departmentId)}
              onEdit={handleOpenDeptForm}
              onDelete={handleDeleteDepartment}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {/* Department form popup */}
      <DepartmentFormPopup
        visible={isDeptFormVisible}
        onHide={() => setDeptFormVisible(false)}
        formData={deptFormData}
        onFormDataChange={setDeptFormData}
        saving={deptSaving}
        activeTab={deptEditTab}
        onTabChange={setDeptEditTab}
        onSave={handleSaveDepartment}
        onAssignUsers={handleAssignUsers}
        usersInDept={getUsersInDept()}
        availableUsers={getAvailableUsers()}
        selectedUserIds={selectedUsersForDept}
        onSelectionChange={setSelectedUsersForDept}
      />
    </div>
  );
};

export default DepartmentTab;
