/**
 * File: userPage.js
 * Purpose: Admin user management page with filterable list/card views, permission-aware actions, and user/department management popups
 * Dependencies: React, Redux, React Router, DevExtreme components, userActions, usePermissions
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - UserPage(): Renders user directory with search/filter controls and list/card display toggle
 * - handleCreateUser(): Creates users from popup form
 * - handleSaveDepartment(): Creates/updates departments from management popup
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    Selection
} from 'devextreme-react/data-grid';
import Tabs, { Item as TabItem } from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import Popup from 'devextreme-react/popup';
import LoadPanel from 'devextreme-react/load-panel';
import Form, {
    SimpleItem,
    GroupItem,
    RequiredRule
} from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import {
    fetchUsers,
    createUser,
    updateUser,
    fetchAllRoles,
    fetchAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../../redux/actions/userActions';
import { usePermissions } from '../../hooks/usePermissions';
import './userPage.scss';

// Custom styles for tabs
const styles = {
    tabs: {
        marginBottom: "15px",
    },
    tabItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    }
}; //Cursor

const getRoleName = (roleValue) => {
    if (!roleValue) return null;
    if (typeof roleValue === 'string') return roleValue;
    if (typeof roleValue === 'object') {
        return (
            roleValue.name ||
            roleValue.Name ||
            roleValue.roleName ||
            roleValue.RoleName ||
            roleValue.value ||
            roleValue.Value ||
            null
        );
    }
    return null;
};

const normalizeRoleKey = (roleValue) => {
    const roleName = getRoleName(roleValue);
    if (typeof roleName !== 'string') {
        return null;
    }

    const trimmedRoleName = roleName.trim();
    if (trimmedRoleName.length === 0) {
        return null;
    }

    return trimmedRoleName.toLowerCase();
};

const extractRoleNames = (roleValue) => {
    const roleName = getRoleName(roleValue);
    if (typeof roleName !== 'string') {
        return [];
    }

    return roleName
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
};

const getPrimaryRoleName = (user) => {
    const roleSources = [
        ...(Array.isArray(user?.roles) ? user.roles : []),
        ...(Array.isArray(user?.Roles) ? user.Roles : []),
        user?.roleName,
        user?.RoleName,
        user?.role,
        user?.Role
    ];

    for (const roleSource of roleSources) {
        const roleNames = extractRoleNames(roleSource);
        if (roleNames.length > 0) {
            return roleNames[0];
        }
    }

    return '';
};

const UserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const users = useSelector((state) => state.user.users);
    const allRoles = useSelector((state) => state.user.allRoles);
    const allDepartments = useSelector((state) => state.user.allDepartments);
    const { hasPermission, hasRole } = usePermissions();

    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [isCreatePopupVisible, setCreatePopupVisible] = useState(false);
    const [loadingVisible, setLoadingVisible] = useState(false);
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [formDataState, setFormDataState] = useState({
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleName: '',
        departmentId: null
    });

    // Manage Departments state
    const [isDepartmentPopupVisible, setDepartmentPopupVisible] = useState(false);
    const [departmentFormData, setDepartmentFormData] = useState({
        departmentId: null,
        name: '',
        description: ''
    });
    const [isDepartmentFormVisible, setDepartmentFormVisible] = useState(false);
    const [departmentSaving, setDepartmentSaving] = useState(false);
    const [departmentEditTab, setDepartmentEditTab] = useState(0); // 0 = Details, 1 = Users
    const [selectedUsersForDepartment, setSelectedUsersForDepartment] = useState([]); // Track selected users for assignment

    const formData = useRef({
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleName: '',
        departmentId: null
    });

    const loadData = useCallback(async () => {
        setLoadingVisible(true);
        try {
            await dispatch(fetchUsers());
            await dispatch(fetchAllRoles());
            await dispatch(fetchAllDepartments());
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setLoadingVisible(false);
        }
    }, [dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const canManageUsers =
        hasPermission('_Manage_Users') || hasRole('Admin') || hasRole('SuperAdmin');
    const canAddUser = canManageUsers;
    const canAddDepartment =
        canManageUsers || hasPermission('_Create_Department');

    const normalizedUsers = useMemo(() => {
        return (users || []).map((user) => {
            const roleSources = [
                ...(Array.isArray(user.roles) ? user.roles : []),
                ...(Array.isArray(user.Roles) ? user.Roles : []),
                user.roleName,
                user.RoleName,
                user.role,
                user.Role
            ];

            const roleLookup = new Map();

            roleSources.forEach((roleSource) => {
                extractRoleNames(roleSource).forEach((roleName) => {
                    const roleKey = normalizeRoleKey(roleName);
                    if (roleKey && !roleLookup.has(roleKey)) {
                        roleLookup.set(roleKey, roleName);
                    }
                });
            });

            const roleNames = Array.from(roleLookup.values());
            const roleKeys = Array.from(roleLookup.keys());

            const roleDisplay = roleNames.length > 0 ? roleNames.join(', ') : 'Unassigned';
            const departmentDisplay = user.departmentName || 'Unassigned';
            const statusDisplay = user.isDeleted ? 'Inactive' : 'Active';

            return {
                ...user,
                roleNames,
                roleKeys,
                roleDisplay,
                departmentDisplay,
                statusDisplay
            };
        });
    }, [users]);

    const roleOptions = useMemo(() => {
        const roleLookup = new Map();

        if (Array.isArray(allRoles)) {
            allRoles.forEach((role) => {
                extractRoleNames(role).forEach((roleName) => {
                    const roleKey = normalizeRoleKey(roleName);
                    if (roleKey && !roleLookup.has(roleKey)) {
                        roleLookup.set(roleKey, roleName);
                    }
                });
            });
        }

        normalizedUsers.forEach((user) => {
            (user.roleNames || []).forEach((roleName) => {
                const roleKey = normalizeRoleKey(roleName);
                if (roleKey && !roleLookup.has(roleKey)) {
                    roleLookup.set(roleKey, roleName);
                }
            });
        });

        return [
            { value: 'all', text: 'All Roles' },
            ...Array.from(roleLookup.entries()).map(([roleKey, roleName]) => ({
                value: roleKey,
                text: roleName
            })),
            { value: 'unassigned', text: 'Unassigned' }
        ];
    }, [allRoles, normalizedUsers]);

    const createRoleOptions = useMemo(() => (
        roleOptions
            .filter((role) => role.value !== 'all' && role.value !== 'unassigned')
            .map((role) => ({ value: role.text, text: role.text }))
    ), [roleOptions]);

    const departmentOptions = useMemo(() => {
        const items = (allDepartments || []).map((d) => ({
            value: String(d.departmentId),
            text: d.name
        }));
        return [{ value: 'all', text: 'All Departments' }, { value: 'none', text: 'Unassigned' }, ...items];
    }, [allDepartments]);

    const statusOptions = useMemo(() => ([
        { value: 'all', text: 'All Status' },
        { value: 'active', text: 'Active' },
        { value: 'inactive', text: 'Inactive' }
    ]), []);

    const filteredUsers = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return normalizedUsers.filter((user) => {
            const matchesSearch =
                query.length === 0 ||
                user.userName?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query);

            const normalizedSelectedRole = normalizeRoleKey(selectedRole);

            const matchesRole =
                selectedRole === 'all' ||
                (selectedRole === 'unassigned' && (!user.roleKeys || user.roleKeys.length === 0)) ||
                (Array.isArray(user.roleKeys) && normalizedSelectedRole !== null && user.roleKeys.includes(normalizedSelectedRole));

            const matchesDepartment =
                selectedDepartment === 'all' ||
                (selectedDepartment === 'none' && !user.departmentId) ||
                String(user.departmentId) === selectedDepartment;

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && !user.isDeleted) ||
                (selectedStatus === 'inactive' && user.isDeleted);

            return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
        });
    }, [normalizedUsers, searchText, selectedRole, selectedDepartment, selectedStatus]);

    const handleSearchChange = (e) => {
        setSearchText(e.value);
    };

    const handleClearSearch = () => {
        setSearchText('');
    };

    const handleOpenCreatePopup = async () => {
        // Reset form data to ensure empty form
        const initialFormData = {
            userName: '',
            email: '',
            password: '',
            confirmPassword: '',
            roleName: '',
            departmentId: null
        };
        formData.current = initialFormData;
        setFormDataState(initialFormData);

        // Ensure roles are loaded before opening popup
        if (!allRoles || allRoles.length === 0) {
            try {
                await dispatch(fetchAllRoles());
            } catch (error) {
                notify('Error loading roles', 'error', 3000);
            }
        }
        // Ensure departments are loaded before opening popup
        if (!allDepartments || allDepartments.length === 0) {
            try {
                await dispatch(fetchAllDepartments());
            } catch (error) {
                notify('Error loading departments', 'error', 3000);
            }
        }
        setCreatePopupVisible(true);
    };

    const handleCreateUser = async () => {
        try {
            setCreateUserLoading(true);

            // Check if passwords match
            if (formDataState.password !== formDataState.confirmPassword) {
                notify('Passwords do not match', 'error', 3000);
                return;
            }

            // Check required fields
            if (!formDataState.userName || !formDataState.email || !formDataState.password || !formDataState.roleName) {
                notify('Please fill in all required fields', 'error', 3000);
                return;
            }

            // Map frontend field names to backend expected names
            const userData = {
                Email: formDataState.email,
                Username: formDataState.userName,
                Password: formDataState.password,
                RoleName: formDataState.roleName,
                DepartmentId: formDataState.departmentId
            };

            await dispatch(createUser(userData));

            // Reset form data
            const resetData = {
                userName: '',
                email: '',
                password: '',
                confirmPassword: '',
                roleName: '',
                departmentId: null
            };
            formData.current = resetData;
            setFormDataState(resetData);

            // Close popup
            setCreatePopupVisible(false);

            // Show success message
            notify('User created successfully', 'success', 3000);
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setCreateUserLoading(false);
        }
    };

    const handleViewDetails = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

    const handleRowClick = (e) => {
        navigate(`/admin/users/${e.data.id}`);
    };

    const renderStatusCell = (data) => {
        const statusClass = data.value ? 'status-badge inactive' : 'status-badge active';
        return <div className={statusClass}>{data.value ? 'Inactive' : 'Active'}</div>;
    };

    const renderActionCell = (data) => {
        return (
            <div className="action-buttons">
                <Button
                    icon="eye"
                    stylingMode="text"
                    onClick={() => handleViewDetails(data.data.id)}
                    hint="View Details"
                />
            </div>
        );
    };

    // Department management handlers
    const handleOpenDepartmentForm = (department = null) => {
        if (department) {
            setDepartmentFormData({
                departmentId: department.departmentId,
                name: department.name || '',
                description: department.description || ''
            });
            // Initialize selected users with current department users
            const currentDeptUsers = users.filter(u => u.departmentId === department.departmentId && !u.isDeleted);
            setSelectedUsersForDepartment(currentDeptUsers.map(u => u.id));
        } else {
            setDepartmentFormData({
                departmentId: null,
                name: '',
                description: ''
            });
            setSelectedUsersForDepartment([]);
        }
        setDepartmentEditTab(0); // Reset to Details tab
        setDepartmentFormVisible(true);
    };

    // Get users in the currently selected department
    const getUsersInDepartment = () => {
        if (!departmentFormData.departmentId) return [];
        return users.filter(u => u.departmentId === departmentFormData.departmentId && !u.isDeleted);
    };

    // Get all available users (not deleted) for assignment
    const getAvailableUsers = () => {
        return users.filter(u => !u.isDeleted).map(u => ({
            ...u,
            currentDepartmentName: u.departmentId
                ? allDepartments.find(d => d.departmentId === u.departmentId)?.name || 'Unknown'
                : 'None'
        }));
    };

    // Handle user selection change in the Users tab
    const handleUserSelectionChanged = (e) => {
        setSelectedUsersForDepartment(e.selectedRowKeys);
    };

    // Assign selected users to the department
    const handleAssignUsersToDepartment = async () => {
        if (!departmentFormData.departmentId) {
            notify('Please save the department first before assigning users', 'warning', 3000);
            return;
        }

        setDepartmentSaving(true);
        try {
            const currentDeptUserIds = getUsersInDepartment().map(u => u.id);

            // Users to add to this department (newly selected)
            const usersToAdd = selectedUsersForDepartment.filter(id => !currentDeptUserIds.includes(id));

            // Users to remove from this department (previously in dept, now unselected)
            const usersToRemove = currentDeptUserIds.filter(id => !selectedUsersForDepartment.includes(id));

            // Update users being added to this department
            for (const userId of usersToAdd) {
                const user = users.find(u => u.id === userId);
                if (user) {
                    // Send complete user object with updated departmentId
                    const updateData = {
                        userName: user.userName,
                        email: user.email,
                        roleName: getPrimaryRoleName(user),
                        departmentId: departmentFormData.departmentId
                    };
                    await dispatch(updateUser(userId, updateData));
                }
            }

            // Remove users from this department (set departmentId to null)
            for (const userId of usersToRemove) {
                const user = users.find(u => u.id === userId);
                if (user) {
                    // Send complete user object with departmentId set to null
                    const updateData = {
                        userName: user.userName,
                        email: user.email,
                        roleName: getPrimaryRoleName(user),
                        departmentId: null
                    };
                    await dispatch(updateUser(userId, updateData));
                }
            }

            if (usersToAdd.length > 0 || usersToRemove.length > 0) {
                notify(
                    `Updated: ${usersToAdd.length} user(s) added, ${usersToRemove.length} user(s) removed`,
                    'success',
                    3000
                );
                // Refresh users to get updated data
                await dispatch(fetchUsers());
                // Update selected users after refresh
                if (departmentFormData.departmentId) {
                    const updatedDeptUsers = users.filter(u =>
                        selectedUsersForDepartment.includes(u.id) ||
                        (usersToAdd.includes(u.id) && !usersToRemove.includes(u.id))
                    );
                    setSelectedUsersForDepartment(updatedDeptUsers.map(u => u.id));
                }
            } else {
                notify('No changes to save', 'info', 2000);
            }
        } catch (error) {
            notify(error.message || 'Failed to update user assignments', 'error', 3000);
        } finally {
            setDepartmentSaving(false);
        }
    };

    const handleSaveDepartment = async () => {
        if (!departmentFormData.name.trim()) {
            notify('Department name is required', 'warning', 3000);
            return;
        }

        setDepartmentSaving(true);
        try {
            if (departmentFormData.departmentId) {
                // Update existing department
                await dispatch(updateDepartment(departmentFormData.departmentId, {
                    departmentId: departmentFormData.departmentId,
                    name: departmentFormData.name,
                    description: departmentFormData.description
                }));
                notify('Department updated successfully', 'success', 3000);
            } else {
                // Create new department
                await dispatch(createDepartment({
                    name: departmentFormData.name,
                    description: departmentFormData.description
                }));
                notify('Department created successfully', 'success', 3000);
            }
            setDepartmentFormVisible(false);
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setDepartmentSaving(false);
        }
    };

    const handleDeleteDepartment = async (department) => {
        // Get count of users in this department
        const usersInDepartment = users.filter(u => u.departmentId === department.departmentId && !u.isDeleted);

        if (usersInDepartment.length > 0) {
            notify(
                `Cannot delete '${department.name}'. It has ${usersInDepartment.length} active user(s). Please reassign users first.`,
                'error',
                5000
            );
            return;
        }

        try {
            await dispatch(deleteDepartment(department.departmentId));
            notify('Department deleted successfully', 'success', 3000);
        } catch (error) {
            notify(error.message, 'error', 3000);
        }
    };

    const renderDepartmentActions = (data) => {
        if (!canAddDepartment) {
            return null;
        }

        return (
            <div className="tw-flex tw-gap-2">
                <Button
                    icon="edit"
                    stylingMode="text"
                    onClick={() => handleOpenDepartmentForm(data.data)}
                    hint="Edit Department"
                />
                <Button
                    icon="trash"
                    stylingMode="text"
                    onClick={() => handleDeleteDepartment(data.data)}
                    hint="Delete Department"
                />
            </div>
        );
    };

    return (
        <div className="user-management-container">
            <div className="header-container">
                <div className="title-container">
                    <h2>User Management</h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Showing {filteredUsers.length} of {normalizedUsers.length} users
                    </p>
                </div>
                <div className="actions-container">
                    {canAddDepartment && (
                        <Button
                            text="Add Department"
                            type="normal"
                            icon="folder"
                            onClick={() => setDepartmentPopupVisible(true)}
                        />
                    )}
                    {canAddUser && (
                        <Button
                            text="Add User"
                            type="default"
                            icon="user"
                            onClick={handleOpenCreatePopup}
                        />
                    )}
                    <Button
                        icon="refresh"
                        stylingMode="text"
                        onClick={loadData}
                    />
                </div>
            </div>

            <div className="user-toolbar-card tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-5 tw-gap-3">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500 tw-mb-1 tw-block">
                            Search User
                        </label>
                        <TextBox
                            placeholder="Search by username or email"
                            mode="search"
                            value={searchText}
                            onValueChanged={handleSearchChange}
                            stylingMode="filled"
                            buttons={[
                                {
                                    name: 'clear',
                                    location: 'after',
                                    onClick: handleClearSearch,
                                    icon: 'close'
                                }
                            ]}
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500 tw-mb-1 tw-block">
                            Role
                        </label>
                        <SelectBox
                            dataSource={roleOptions}
                            valueExpr="value"
                            displayExpr="text"
                            value={selectedRole}
                            onValueChanged={(e) => setSelectedRole(e.value)}
                            stylingMode="filled"
                            searchEnabled={true}
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500 tw-mb-1 tw-block">
                            Department
                        </label>
                        <SelectBox
                            dataSource={departmentOptions}
                            valueExpr="value"
                            displayExpr="text"
                            value={selectedDepartment}
                            onValueChanged={(e) => setSelectedDepartment(e.value)}
                            stylingMode="filled"
                            searchEnabled={true}
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500 tw-mb-1 tw-block">
                            Status
                        </label>
                        <SelectBox
                            dataSource={statusOptions}
                            valueExpr="value"
                            displayExpr="text"
                            value={selectedStatus}
                            onValueChanged={(e) => setSelectedStatus(e.value)}
                            stylingMode="filled"
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-500 tw-mb-1 tw-block">
                            View
                        </label>
                        <div className="tw-flex tw-gap-2">
                            <Button
                                text="List"
                                icon="fa-light fa-list"
                                stylingMode={viewMode === 'list' ? 'contained' : 'outlined'}
                                type={viewMode === 'list' ? 'default' : 'normal'}
                                onClick={() => setViewMode('list')}
                            />
                            <Button
                                text="Cards"
                                icon="fa-light fa-table-cells"
                                stylingMode={viewMode === 'cards' ? 'contained' : 'outlined'}
                                type={viewMode === 'cards' ? 'default' : 'normal'}
                                onClick={() => setViewMode('cards')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-container">
                {viewMode === 'list' ? (
                    <DataGrid
                        dataSource={filteredUsers}
                        keyExpr="id"
                        showBorders={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        rowAlternationEnabled={true}
                        hoverStateEnabled={true}
                        loadPanel={{ enabled: loadingVisible }}
                        onRowClick={handleRowClick}
                    >
                        <Selection mode="single" />
                        <SearchPanel visible={false} />
                        <Paging defaultPageSize={10} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 20, 50]}
                            showInfo={true}
                        />

                        <Column dataField="userName" caption="Username" />
                        <Column dataField="email" caption="Email" />
                        <Column
                            dataField="departmentDisplay"
                            caption="Department"
                            allowFiltering={true}
                        />
                        <Column
                            dataField="isDeleted"
                            caption="Status"
                            cellRender={renderStatusCell}
                            dataType="boolean"
                        />
                        <Column
                            type="buttons"
                            caption="Actions"
                            cellRender={renderActionCell}
                            width={110}
                        />
                    </DataGrid>
                ) : (
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm tw-flex tw-flex-col tw-gap-3"
                            >
                                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                                    <div>
                                        <h4 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-m-0">
                                            {user.userName}
                                        </h4>
                                        <p className="tw-text-sm tw-text-gray-600 tw-m-0">{user.email}</p>
                                    </div>
                                    <span className={`status-badge ${user.isDeleted ? 'inactive' : 'active'}`}>
                                        {user.isDeleted ? 'Inactive' : 'Active'}
                                    </span>
                                </div>
                                <div className="tw-text-sm tw-text-gray-700">
                                    <span className="tw-font-semibold">Department:</span> {user.departmentDisplay}
                                </div>
                                <div className="tw-mt-auto">
                                    <Button
                                        text="View Details"
                                        icon="fa-light fa-eye"
                                        type="default"
                                        stylingMode="outlined"
                                        onClick={() => handleViewDetails(user.id)}
                                    />
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="tw-col-span-full tw-text-center tw-py-12 tw-text-gray-500">
                                No users match the selected filters.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create User Popup */}
            <Popup
                visible={isCreatePopupVisible}
                onHiding={() => setCreatePopupVisible(false)}
                title="Create New User"
                showCloseButton={true}
                width="90%"
                maxWidth={450}
                minWidth={320}
                height="auto"
                dragEnabled={false}
                resizeEnabled={false}
                contentComponent={() => (
                    <div style={{
                        position: 'relative',
                        padding: '24px 20px 16px 20px',
                        minHeight: '420px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <LoadPanel
                            visible={createUserLoading}
                            showIndicator={true}
                            showPane={true}
                            text="Creating user..."
                            position={{ my: 'center', at: 'center', of: '.dx-popup-content' }}
                        />
                        <div style={{ flex: 1 }}>
                            <Form
                                formData={formDataState}
                                onFieldDataChanged={e => {
                                    const newData = { ...formDataState, [e.dataField]: e.value };
                                    setFormDataState(newData);
                                    formData.current = newData;
                                }}
                                labelMode="floating"
                                disabled={createUserLoading}
                                colCount={1}
                                width="100%"
                            >
                                <GroupItem>
                                    <SimpleItem
                                        dataField="userName"
                                        editorType="dxTextBox"
                                        editorOptions={{
                                            stylingMode: "filled"
                                        }}
                                        label={{ text: "Username" }}
                                    >
                                        <RequiredRule message="Username is required" />
                                    </SimpleItem>

                                    <SimpleItem
                                        dataField="email"
                                        editorType="dxTextBox"
                                        editorOptions={{
                                            stylingMode: "filled"
                                        }}
                                        label={{ text: "Email" }}
                                    >
                                        <RequiredRule message="Email is required" />
                                    </SimpleItem>

                                    <SimpleItem
                                        dataField="password"
                                        editorType="dxTextBox"
                                        editorOptions={{
                                            stylingMode: "filled",
                                            mode: "password"
                                        }}
                                        label={{ text: "Password" }}
                                    >
                                        <RequiredRule message="Password is required" />
                                    </SimpleItem>

                                    <SimpleItem
                                        dataField="confirmPassword"
                                        editorType="dxTextBox"
                                        editorOptions={{
                                            stylingMode: "filled",
                                            mode: "password"
                                        }}
                                        label={{ text: "Confirm Password" }}
                                    >
                                        <RequiredRule message="Password confirmation is required" />
                                    </SimpleItem>

                                    <SimpleItem
                                        dataField="roleName"
                                        editorType="dxSelectBox"
                                        editorOptions={{
                                            stylingMode: "filled",
                                            dataSource: createRoleOptions,
                                            displayExpr: "text",
                                            valueExpr: "value",
                                            searchEnabled: true,
                                            placeholder: "Select a role",
                                            width: "100%"
                                        }}
                                        label={{ text: "Role" }}
                                    >
                                        <RequiredRule message="Role is required" />
                                    </SimpleItem>

                                    <SimpleItem
                                        dataField="departmentId"
                                        editorType="dxSelectBox"
                                        editorOptions={{
                                            stylingMode: "filled",
                                            dataSource: allDepartments || [],
                                            displayExpr: "name",
                                            valueExpr: "departmentId",
                                            searchEnabled: true,
                                            placeholder: "Select a department",
                                            showClearButton: true,
                                            width: "100%"
                                        }}
                                        label={{ text: "Department" }}
                                    />
                                </GroupItem>
                            </Form>
                        </div>

                        <div className="create-user-form-buttons">
                            <Button
                                text="Cancel"
                                stylingMode="outlined"
                                onClick={() => setCreatePopupVisible(false)}
                                disabled={createUserLoading}
                                elementAttr={{ class: 'cancel-button' }}
                            />
                            <Button
                                text={createUserLoading ? "Creating..." : "Create User"}
                                type="default"
                                icon={createUserLoading ? "loading" : "user"}
                                onClick={handleCreateUser}
                                disabled={createUserLoading}
                                elementAttr={{ class: 'create-button' }}
                            />
                        </div>
                    </div>
                )}
            />

            {/* Manage Departments Popup */}
            <Popup
                visible={isDepartmentPopupVisible}
                onHiding={() => {
                    setDepartmentPopupVisible(false);
                    setDepartmentFormVisible(false);
                }}
                title="Manage Departments"
                showCloseButton={true}
                width={700}
                height={500}
                contentRender={() => (
                    <div className="tw-flex tw-flex-col tw-h-full tw-p-4">
                        {!isDepartmentFormVisible ? (
                            <>
                                <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4">
                                    {canAddDepartment && (
                                        <Button
                                            text="Add Department"
                                            type="default"
                                            icon="plus"
                                            onClick={() => handleOpenDepartmentForm()}
                                        />
                                    )}
                                </div>
                                <DataGrid
                                    dataSource={allDepartments || []}
                                    showBorders={true}
                                    columnAutoWidth={true}
                                    rowAlternationEnabled={true}
                                    height="100%"
                                >
                                    <Column dataField="name" caption="Name" />
                                    <Column dataField="description" caption="Description" />
                                    <Column
                                        caption="Actions"
                                        width={120}
                                        cellRender={renderDepartmentActions}
                                        alignment="center"
                                    />
                                    <Paging enabled={true} pageSize={10} />
                                    <SearchPanel visible={true} placeholder="Search departments..." />
                                </DataGrid>
                            </>
                        ) : (
                            <div className="tw-flex tw-flex-col tw-h-full">
                                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                                    <Button
                                        icon="back"
                                        stylingMode="text"
                                        onClick={() => setDepartmentFormVisible(false)}
                                        hint="Back to list"
                                    />
                                    <h4 className="tw-text-lg tw-font-semibold tw-m-0">
                                        {departmentFormData.departmentId ? 'Edit Department' : 'Add Department'}
                                    </h4>
                                    <div style={{ width: 40 }}></div>
                                </div>

                                {/* Tabs for Create and Edit Mode */}
                                <Tabs
                                    selectedIndex={departmentEditTab}
                                    onItemClick={(e) => setDepartmentEditTab(e.itemIndex)}
                                    style={styles.tabs}
                                >
                                    <TabItem
                                        text="Details"
                                        icon="fa-light fa-edit"
                                        render={() => (
                                            <div style={styles.tabItem}>
                                                <i className="fa-light fa-edit"></i>
                                                <span>Details</span>
                                            </div>
                                        )}
                                    />
                                    <TabItem
                                        text={`Users (${departmentFormData.departmentId ? getUsersInDepartment().length : 0})`}
                                        icon="fa-light fa-users"
                                        render={() => (
                                            <div style={styles.tabItem}>
                                                <i className="fa-light fa-users"></i>
                                                <span>Users ({departmentFormData.departmentId ? getUsersInDepartment().length : 0})</span>
                                            </div>
                                        )}
                                    />
                                </Tabs>

                                {/* Tab Content */}
                                {departmentEditTab === 0 && (
                                    <div className="tw-flex tw-flex-col tw-flex-1">
                                        <Form
                                            formData={departmentFormData}
                                            labelMode="floating"
                                            onFieldDataChanged={(e) => {
                                                setDepartmentFormData(prev => ({
                                                    ...prev,
                                                    [e.dataField]: e.value
                                                }));
                                            }}
                                        >
                                            <SimpleItem
                                                dataField="name"
                                                editorType="dxTextBox"
                                                editorOptions={{
                                                    stylingMode: "filled",
                                                    placeholder: "Enter department name"
                                                }}
                                                label={{ text: "Department Name" }}
                                            >
                                                <RequiredRule message="Department name is required" />
                                            </SimpleItem>
                                            <SimpleItem
                                                dataField="description"
                                                editorType="dxTextArea"
                                                editorOptions={{
                                                    stylingMode: "filled",
                                                    placeholder: "Enter description (optional)",
                                                    height: 100
                                                }}
                                                label={{ text: "Description" }}
                                            />
                                        </Form>
                                        <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                                            <Button
                                                text="Cancel"
                                                stylingMode="outlined"
                                                onClick={() => setDepartmentFormVisible(false)}
                                                disabled={departmentSaving}
                                            />
                                            <Button
                                                text={departmentSaving ? "Saving..." : "Save"}
                                                type="default"
                                                onClick={handleSaveDepartment}
                                                disabled={departmentSaving}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Users Tab */}
                                {departmentEditTab === 1 && (
                                    <div className="tw-flex tw-flex-col tw-flex-1">
                                        {!departmentFormData.departmentId ? (
                                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
                                                <i className="fa-light fa-info-circle tw-text-4xl tw-mb-2"></i>
                                                <p>Please save the department first before assigning users</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="tw-mb-2 tw-text-sm tw-text-gray-600">
                                                    <i className="fa-light fa-info-circle tw-mr-1"></i>
                                                    Select users to assign to this department. Users can only belong to one department.
                                                </div>
                                                <DataGrid
                                                    dataSource={getAvailableUsers()}
                                                    keyExpr="id"
                                                    showBorders={true}
                                                    columnAutoWidth={true}
                                                    rowAlternationEnabled={true}
                                                    height="calc(100% - 80px)"
                                                    selectedRowKeys={selectedUsersForDepartment}
                                                    onSelectionChanged={handleUserSelectionChanged}
                                                    noDataText="No users available"
                                                >
                                                    <Selection mode="multiple" showCheckBoxesMode="always" />
                                                    <Column dataField="userName" caption="Username" />
                                                    <Column dataField="email" caption="Email" />
                                                    <Column
                                                        dataField="currentDepartmentName"
                                                        caption="Current Department"
                                                        cellRender={(data) => (
                                                            <span className={data.value !== 'None' && data.data.departmentId !== departmentFormData.departmentId ? 'tw-text-orange-600' : ''}>
                                                                {data.value}
                                                                {data.value !== 'None' && data.data.departmentId !== departmentFormData.departmentId && (
                                                                    <i className="fa-light fa-exclamation-triangle tw-ml-1" title="Will be reassigned from current department"></i>
                                                                )}
                                                            </span>
                                                        )}
                                                    />
                                                    <Paging enabled={true} pageSize={10} />
                                                    <SearchPanel visible={true} placeholder="Search users..." />
                                                </DataGrid>
                                                <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                                                    <Button
                                                        text="Cancel"
                                                        stylingMode="outlined"
                                                        onClick={() => setDepartmentFormVisible(false)}
                                                        disabled={departmentSaving}
                                                    />
                                                    <Button
                                                        text={departmentSaving ? "Saving..." : "Save Assignments"}
                                                        type="default"
                                                        onClick={handleAssignUsersToDepartment}
                                                        disabled={departmentSaving}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default UserPage;
