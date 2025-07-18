import React, { useEffect, useState, useRef } from 'react';
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
import Popup from 'devextreme-react/popup';
import ScrollView from 'devextreme-react/scroll-view';
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
    softDeleteUser,
    restoreUser,
    fetchAllUserActivities,
    fetchAllSites,
    fetchUserSiteCounts //Cursor
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

    const [selectedTab, setSelectedTab] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [isCreatePopupVisible, setCreatePopupVisible] = useState(false);
    const [loadingVisible, setLoadingVisible] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [userSiteCounts, setUserSiteCounts] = useState({}); //Cursor

    const formData = useRef({
        userName: '',
        email: '',
        password: ''
    });

    const gridRef = useRef(null);
    const activeGridRef = useRef(null); //Cursor

    useEffect(() => {
        loadData();
    }, []);

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
                    const counts = await dispatch(fetchUserSiteCounts());
                    setUserSiteCounts(counts);
                } catch (error) {
                    console.error('Error fetching user site counts:', error);
                    // Fallback to empty counts
                    const emptyCounts = {};
                    users.forEach(user => {
                        emptyCounts[user.id] = 0;
                    });
                    setUserSiteCounts(emptyCounts);
                }
            }
        };

        calculateSiteCounts();
    }, [users, dispatch]);

    const loadData = async () => {
        setLoadingVisible(true);
        try {
            await dispatch(fetchUsers());
            await dispatch(fetchAllUserActivities());
            await dispatch(fetchAllSites()); //Cursor
        } catch (error) {
            notify(error.message, 'error', 3000);
        } finally {
            setLoadingVisible(false);
        }
    };

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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const result = e.validationGroup.validate();
            if (result.isValid) {
                await dispatch(createUser(formData.current));
                setCreatePopupVisible(false);
                notify('User created successfully', 'success', 3000);
                // Reset form data
                formData.current = {
                    userName: '',
                    email: '',
                    password: ''
                };
            }
        } catch (error) {
            notify(error.message, 'error', 3000);
        }
    };

    const handleViewDetails = (userId) => {
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
        const count = userSiteCounts[data.data.id] || 0; //Cursor
        return <div className="site-badge">{count} sites</div>;
    };

    return (
        <div className="user-management-container">
            <div className="header-container">
                <div className="title-container">
                    <h2>User Management</h2>
                </div>
                <div className="actions-container">
                    <Button
                        text="Add User"
                        type="default"
                        icon="user"
                        onClick={() => setCreatePopupVisible(true)}
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
                width={400}
                height="auto"
            >
                <ScrollView>
                    <Form
                        formData={formData.current}
                        onFieldDataChanged={e => {
                            formData.current[e.dataField] = e.value;
                        }}
                        labelMode="floating"
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
                        </GroupItem>

                        <ButtonItem
                            horizontalAlignment="right"
                            buttonOptions={{
                                text: "Create User",
                                type: "default",
                                useSubmitBehavior: true,
                                onClick: handleCreateUser
                            }}
                        />
                    </Form>
                </ScrollView>
            </Popup>
        </div>
    );
};

export default UserPage;
