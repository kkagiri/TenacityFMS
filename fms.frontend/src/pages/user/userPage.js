/**
 * File: userPage.js
 * Purpose: Admin user management page â€” M365 redesign shell (V2)
 * Dependencies: React, Redux, React Router, usePermissions, sub-components, custom hooks
 * Last Modified: 2026-02-25
 *
 * Key Functions/Components:
 * - UserPage(): Thin shell â€” mounts header, tabs, filter bar, list/card view, and popups
 *   All logic is delegated to useUserNormalization, useUserFilters, useDepartmentManagement
 */
import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import {
    fetchUsers,
    fetchAllRoles,
    fetchAllDepartments,
} from '../../redux/actions/userActions';
import { usePermissions } from '../../hooks/usePermissions';

// Hooks
import useUserNormalization from './hooks/useUserNormalization';
import useUserFilters from './hooks/useUserFilters';
import useDepartmentManagement from './hooks/useDepartmentManagement';

// Components
import UserFilterBar from './components/UserFilterBar';
import UserListView from './components/UserListView';
import UserCardView from './components/UserCardView';
import DepartmentTab from './components/DepartmentTab';
import CreateUserPanel from './components/CreateUserPanel';
import UserDetailPanel from './components/UserDetailPanel';

import './userPage.scss';

// â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
    { key: 'all', label: 'All Users', icon: 'fa-light fa-users' },
    { key: 'active', label: 'Active', icon: 'fa-light fa-circle-check' },
    { key: 'inactive', label: 'Inactive', icon: 'fa-light fa-circle-xmark' },
    { key: 'departments', label: 'Departments', icon: 'fa-light fa-building' },
];

// â”€â”€ REMOVED: getRoleName, normalizeRoleKey, extractRoleNames, getPrimaryRoleName
// These helpers have been extracted to hooks/useUserNormalization.js

const UserPage = () => {
    const dispatch = useDispatch();

    // â”€â”€ Redux state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const rawUsers = useSelector((state) => state.user.users);
    const allRoles = useSelector((state) => state.user.allRoles);
    const allDepartments = useSelector((state) => state.user.allDepartments);
    const loading = useSelector((state) => state.user.loading);
    const { hasPermission } = usePermissions();

    // â”€â”€ Permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const canManageUsers = hasPermission('_Manage_Users');
    const canAddDepartment = canManageUsers || hasPermission('_Create_Department');

    // â”€â”€ Popup visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [isCreatePopupVisible, setCreatePopupVisible] = React.useState(false);
    const [isDetailPanelVisible, setDetailPanelVisible] = React.useState(false);
    const [detailUserId, setDetailUserId] = React.useState(null);
    const [detailInitialTab, setDetailInitialTab] = React.useState('general');

    // â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { normalizedUsers, roleOptions, departmentOptions, statusOptions } =
        useUserNormalization(rawUsers, allRoles, allDepartments);

    const filters = useUserFilters(normalizedUsers);

    const deptHook = useDepartmentManagement(dispatch, normalizedUsers, allDepartments);

    // â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadData = useCallback(async () => {
        try {
            await Promise.all([
                dispatch(fetchUsers()),
                dispatch(fetchAllRoles()),
                dispatch(fetchAllDepartments()),
            ]);
        } catch (error) {
            notify(error.message || 'Failed to load data', 'error', 3000);
        }
    }, [dispatch]);

    useEffect(() => { loadData(); }, [loadData]);

    // â”€â”€ Navigation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleEditUser = useCallback((userId) => {
        setDetailUserId(userId);
        setDetailInitialTab('general');
        setDetailPanelVisible(true);
    }, []);

    const handleManageSites = useCallback((user) => {
        const id = user?.id || user?.Id;
        setDetailUserId(id);
        setDetailInitialTab('sites');
        setDetailPanelVisible(true);
    }, []);

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { filteredUsers, activeTab, setActiveTab, counts } = filters;
    const isDeptTab = activeTab === 'departments';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--m365-bg-surface, #faf9f8)' }}>
            <LoadPanel visible={loading} showIndicator showPane text="Loading usersâ€¦" />

            {/* Page header */}
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-users m365-page-header__icon" />
                    <h2 className="m365-page-header__title">
                        Users
                        <span className="m365-page-header__count">{normalizedUsers.length}</span>
                    </h2>
                </div>
                <div className="m365-page-header__actions">
                    {canManageUsers && (
                        <button className="m365-btn m365-btn--primary" onClick={() => setCreatePopupVisible(true)}>
                            <i className="fa-light fa-user-plus" />
                            Add User
                        </button>
                    )}
                    {canAddDepartment && (
                        <button className="m365-btn m365-btn--ghost" onClick={() => deptHook.setDeptPopupVisible(true)}>
                            <i className="fa-light fa-building-circle-arrow-right" />
                            Departments
                        </button>
                    )}
                    <button className="m365-btn m365-btn--ghost" onClick={loadData} title="Refresh">
                        <i className="fa-light fa-rotate-right" />
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="m365-stats-row">
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">{normalizedUsers.length}</span>
                    <span className="m365-stat-item__label">Total users</span>
                </div>
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">{counts.active || 0}</span>
                    <span className="m365-stat-item__label">Active</span>
                </div>
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">{counts.inactive || 0}</span>
                    <span className="m365-stat-item__label">Inactive</span>
                </div>
                <div className="m365-stat-item">
                    <span className="m365-stat-item__value">{(allDepartments || []).length}</span>
                    <span className="m365-stat-item__label">Departments</span>
                </div>
            </div>

            {/* Tab bar */}
            <div className="m365-tabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`m365-tab${activeTab === tab.key ? ' m365-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <i className={tab.icon} />
                        {tab.label}
                        {counts[tab.key] !== undefined && (
                            <span style={{
                                marginLeft: 4,
                                fontSize: 11,
                                background: activeTab === tab.key ? 'var(--m365-primary-tint)' : 'var(--m365-bg-hover)',
                                color: activeTab === tab.key ? 'var(--m365-primary)' : 'var(--m365-text-secondary)',
                                padding: '1px 6px',
                                borderRadius: 9,
                                fontWeight: 600,
                            }}>
                                {counts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Filter bar (hidden on Departments tab) */}
            {!isDeptTab && (
                <UserFilterBar
                    searchText={filters.searchText}
                    setSearchText={filters.setSearchText}
                    selectedRole={filters.selectedRole}
                    setSelectedRole={filters.setSelectedRole}
                    selectedDepartment={filters.selectedDepartment}
                    setSelectedDepartment={filters.setSelectedDepartment}
                    selectedStatus={filters.selectedStatus}
                    setSelectedStatus={filters.setSelectedStatus}
                    viewMode={filters.viewMode}
                    setViewMode={filters.setViewMode}
                    roleOptions={roleOptions}
                    departmentOptions={departmentOptions}
                    statusOptions={statusOptions}
                    hasActiveFilters={filters.hasActiveFilters}
                    handleClearFilters={filters.handleClearFilters}
                />
            )}

            {/* Content area */}
            {isDeptTab ? (
                <DepartmentTab
                    departments={allDepartments || []}
                    canManage={canAddDepartment}
                    deptHook={deptHook}
                />
            ) : (
                <div className="m365-list-area">
                    {filters.viewMode === 'list' ? (
                        <UserListView
                            users={filteredUsers}
                            loading={!!loading}
                            onViewDetails={handleEditUser}
                            onEditUser={handleEditUser}
                            onManageSites={handleManageSites}
                            canManageUsers={canManageUsers}
                        />
                    ) : (
                        <UserCardView
                            users={filteredUsers}
                            onViewDetails={handleEditUser}
                            onEditUser={handleEditUser}
                            onManageSites={handleManageSites}
                            canManageUsers={canManageUsers}
                        />
                    )}
                </div>
            )}

            {/* Create User Panel */}
            <CreateUserPanel
                visible={isCreatePopupVisible}
                onHide={() => setCreatePopupVisible(false)}
                onSuccess={loadData}
                roleOptions={roleOptions}
                departments={allDepartments || []}
            />

            {/* User Detail Panel */}
            <UserDetailPanel
                visible={isDetailPanelVisible}
                onHide={() => setDetailPanelVisible(false)}
                userId={detailUserId}
                initialTab={detailInitialTab}
                allUsers={normalizedUsers}
                roleOptions={roleOptions}
                departments={allDepartments || []}
                onUserChanged={loadData}
            />
        </div>
    );
};

export default UserPage;
