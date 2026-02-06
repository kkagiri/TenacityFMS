import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Selection,
    StateStoring,
    Toolbar,
    Item
} from 'devextreme-react/data-grid';
import Tabs, { Item as TabItem } from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import Popup from 'devextreme-react/popup';
import ScrollView from 'devextreme-react/scroll-view';
import LoadPanel from 'devextreme-react/load-panel';
import Form, {
    SimpleItem,
    GroupItem,
    ButtonItem,
    RequiredRule
} from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import {
    fetchUsers,
    createUser,
    updateUser,
    softDeleteUser,
    restoreUser,
    fetchAllUserActivities,
    fetchAllSites,
    fetchUserSiteCounts, //Cursor
    fetchAllRoles,
    fetchAllDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../../redux/actions/userActions';
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

const UserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const users = useSelector((state) => state.user.users);
    const allActivities = useSelector((state) => state.user.allActivities);
    const allSites = useSelector((state) => state.user.allSites); //Cursor
    const allRoles = useSelector((state) => state.user.allRoles);
    const allDepartments = useSelector((state) => state.user.allDepartments);

    const [selectedTab, setSelectedTab] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [isCreatePopupVisible, setCreatePopupVisible] = useState(false);
    const [loadingVisible, setLoadingVisible] = useState(false);
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [userSiteCounts, setUserSiteCounts] = useState({}); //Cursor
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

    const gridRef = useRef(null);
    const activeGridRef = useRef(null); //Cursor

    const loadData = useCallback(async () => {
        setLoadingVisible(true);
        try {
            await dispatch(fetchUsers());
            await dispatch(fetchAllUserActivities());
            await dispatch(fetchAllSites()); //Cursor
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

    useEffect(() => {
        // Filter active users
        if (users && users.length > 0) {
            const filtered = users.filter(user => !user.isDeleted);
            console.log(`Setting activeUsers: ${filtered.length} active users found`);
            setActiveUsers(filtered);
        }
    }, [users]);

    // Calculate user site counts //Cursor
    useEffect(() => {
        const calculateSiteCounts = async () => {
            if (users && users.length > 0) {
                try {
                    console.log('userPage: Starting to fetch user site counts...');
                    const counts = await dispatch(fetchUserSiteCounts());
                    console.log('userPage: Received site counts:', counts);
                    setUserSiteCounts(counts);
                    console.log('userPage: Set userSiteCounts state');
                } catch (error) {
                    console.error('Error fetching user site counts:', error);
                    // Fallback to empty counts
                    const emptyCounts = {};
                    users.forEach(user => {
                        emptyCounts[user.id] = 0;
                    });
                    setUserSiteCounts(emptyCounts);
                    console.log('userPage: Set empty site counts as fallback');
                }
            }
        };

        calculateSiteCounts();
    }, [users, dispatch]);

    // Tab data
    const tabData = [
        { text: "All Users", icon: "fa-light fa-users" },
        { text: "Active Users", icon: "fa-light fa-check-circle" }
    ]; //Cursor

    // Custom tab item renderer
    const renderTabItem = (item) => {
        return (
            <div style={styles.tabItem}>
                <i className={item.icon}></i>
                <span>{item.text}</span>
            </div>
        );
    }; //Cursor

    const handleSearchChange = (e) => {
        setSearchText(e.value);
        // Apply search to the currently active grid
        const currentGrid = selectedTab === 0 ? gridRef.current : activeGridRef.current;
        if (currentGrid && currentGrid.instance) {
            currentGrid.instance.searchByText(e.value);
        }
    };

    const handleClearSearch = () => {
        setSearchText('');
        // Clear search from the currently active grid
        const currentGrid = selectedTab === 0 ? gridRef.current : activeGridRef.current;
        if (currentGrid && currentGrid.instance) {
            currentGrid.instance.searchByText('');
            currentGrid.instance.clearFilter();
        }
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
    }; const handleViewDetails = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

    const handleViewActivities = (userId) => {
        navigate(`/admin/users/${userId}/activities`);
    };

    const handleManageSites = (userId) => {
        navigate(`/admin/users/${userId}/sites`);
    };

    const handleStatusChange = async (user) => {
        try {
            if (user.isDeleted) {
                await dispatch(restoreUser(user.id));
                notify('User restored successfully', 'success', 3000);
            } else {
                await dispatch(softDeleteUser(user.id));
                notify('User deactivated successfully', 'success', 3000);
            }
        } catch (error) {
            notify(error.message, 'error', 3000);
        }
    };

    const handleRowClick = (e) => {
        navigate(`/admin/users/${e.data.id}`);
    };

    // Handle tab change and ensure proper highlighting //Cursor
    const handleTabChange = (e) => {
        const newIndex = e.itemIndex;
        console.log(`Tab clicked: ${newIndex}, switching from ${selectedTab}`);
        setSelectedTab(newIndex);

        // Clear search when switching tabs
        setSearchText('');

        // Apply search to newly selected grid after a brief delay
        setTimeout(() => {
            const currentGrid = newIndex === 0 ? gridRef.current : activeGridRef.current;
            if (currentGrid && currentGrid.instance) {
                currentGrid.instance.searchByText('');
                currentGrid.instance.clearFilter();
            }
        }, 100);
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
                <Button
                    icon="clock"
                    stylingMode="text"
                    onClick={() => handleViewActivities(data.data.id)}
                    hint="View Activities"
                />
                <Button
                    icon="map"
                    stylingMode="text"
                    onClick={() => handleManageSites(data.data.id)}
                    hint="Manage Sites"
                />
                <Button
                    icon={data.data.isDeleted ? "refresh" : "remove"}
                    stylingMode="text"
                    onClick={() => handleStatusChange(data.data)}
                    hint={data.data.isDeleted ? "Restore User" : "Deactivate User"}
                />
            </div>
        );
    };

    const renderActivityUserCell = (data) => {
        const user = users.find(u => u.id === data.value);
        return user ? user.userName : 'Unknown';
    };

    const renderSiteCountCell = (data) => {
        const userId = data.data.id;
        const count = userSiteCounts[userId] || 0; //Cursor
        console.log(`renderSiteCountCell: userId=${userId}, count=${count}, userSiteCounts:`, userSiteCounts);
        return <div className="site-badge">{count} sites</div>;
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
                        roleName: user.roleName || (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : ''),
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
                        roleName: user.roleName || (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : ''),
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
                </div>
                <div className="actions-container">
                    <Button
                        text="Manage Departments"
                        type="normal"
                        icon="folder"
                        onClick={() => setDepartmentPopupVisible(true)}
                    />
                    <Button
                        text="Add User"
                        type="default"
                        icon="user"
                        onClick={handleOpenCreatePopup}
                    />
                    <Button
                        icon="refresh"
                        stylingMode="text"
                        onClick={loadData}
                    />
                </div>
            </div>

            <div className="search-container">
                <div className="search-box-wrapper">
                    <TextBox
                        placeholder="Search users..."
                        mode="search"
                        value={searchText}
                        onValueChanged={handleSearchChange}
                        stylingMode="filled"
                        width={400}
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
            </div>

            <div className="tabs-container">
                <Tabs
                    dataSource={tabData}
                    selectedIndex={selectedTab}
                    onItemClick={handleTabChange}
                    width="100%"
                    style={styles.tabs}
                    itemRender={renderTabItem}
                />
            </div>

            <div className="grid-container">
                {selectedTab === 0 && (
                    <DataGrid
                        ref={gridRef}
                        dataSource={users}
                        showBorders={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        rowAlternationEnabled={true}
                        hoverStateEnabled={true}
                        loadPanel={{ enabled: loadingVisible }}
                        onRowClick={handleRowClick}
                    >
                        <StateStoring enabled={true} type="localStorage" storageKey="usersGrid" />
                        <Selection mode="single" />
                        <SearchPanel visible={false} />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Paging defaultPageSize={10} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 20, 50]}
                            showInfo={true}
                        />

                        <Column dataField="userName" caption="Username" />
                        <Column dataField="email" caption="Email" />
                        <Column
                            dataField="departmentName"
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
                            dataField="recentActivity"
                            caption="Recent Activity"
                            calculateCellValue={(data) => {
                                if (data.id && allActivities.length > 0) {
                                    // Filter out monitoring GET requests //Cursor
                                    const userActivities = allActivities.filter(a => {
                                        const isMonitoringGet = a.action === 'GET' &&
                                            (a.controller === 'User' || a.controller === 'UserActivities');
                                        return a.userId === data.id && !isMonitoringGet;
                                    });

                                    if (userActivities.length) {
                                        const recent = userActivities.sort((a, b) =>
                                            new Date(b.timestamp) - new Date(a.timestamp)
                                        )[0];
                                        // Convert UTC to local time //Cursor
                                        const localTime = new Date(recent.timestamp).toLocaleString();
                                        return recent.action + ' - ' + localTime;
                                    }
                                }
                                return 'No recent activity';
                            }}
                        />
                        <Column
                            dataField="siteCount"
                            caption="Sites"
                            cellRender={renderSiteCountCell}
                        />
                        <Column
                            type="buttons"
                            caption="Actions"
                            cellRender={renderActionCell}
                            width={150}
                        />
                    </DataGrid>
                )}

                {selectedTab === 1 && (
                    <DataGrid
                        ref={activeGridRef}
                        dataSource={activeUsers}
                        showBorders={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        rowAlternationEnabled={true}
                        loadPanel={{ enabled: loadingVisible }}
                        onRowClick={handleRowClick}
                    >
                        <StateStoring enabled={true} type="localStorage" storageKey="activeUsersGrid" />
                        <Selection mode="single" />
                        <SearchPanel visible={false} />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Paging defaultPageSize={10} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 20, 50]}
                            showInfo={true}
                        />

                        <Column dataField="userName" caption="Username" />
                        <Column dataField="email" caption="Email" />
                        <Column
                            dataField="departmentName"
                            caption="Department"
                            allowFiltering={true}
                        />
                        <Column
                            dataField="recentActivity"
                            caption="Recent Activity"
                            calculateCellValue={(data) => {
                                if (data.id && allActivities.length > 0) {
                                    // Filter out monitoring GET requests //Cursor
                                    const userActivities = allActivities.filter(a => {
                                        const isMonitoringGet = a.action === 'GET' &&
                                            (a.controller === 'User' || a.controller === 'UserActivities');
                                        return a.userId === data.id && !isMonitoringGet;
                                    });

                                    if (userActivities.length) {
                                        const recent = userActivities.sort((a, b) =>
                                            new Date(b.timestamp) - new Date(a.timestamp)
                                        )[0];
                                        // Convert UTC to local time //Cursor
                                        const localTime = new Date(recent.timestamp).toLocaleString();
                                        return recent.action + ' - ' + localTime;
                                    }
                                }
                                return 'No recent activity';
                            }}
                        />
                        <Column
                            dataField="siteCount"
                            caption="Sites"
                            cellRender={renderSiteCountCell}
                        />
                        <Column
                            type="buttons"
                            caption="Actions"
                            cellRender={renderActionCell}
                            width={150}
                        />
                    </DataGrid>
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
                                            dataSource: allRoles || [],
                                            displayExpr: "name",
                                            valueExpr: "name",
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
                                    <Button
                                        text="Add Department"
                                        type="default"
                                        icon="plus"
                                        onClick={() => handleOpenDepartmentForm()}
                                    />
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
