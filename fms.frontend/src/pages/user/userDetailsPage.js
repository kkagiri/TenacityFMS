import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, fetchUserActivities } from '../../redux/actions/userActions';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    Column,
    Paging,
    Pager,
    Sorting
} from 'devextreme-react/data-grid';
import Toolbar, { Item as ToolbarItem } from 'devextreme-react/toolbar';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import './userDetailsPage.scss';

const UserDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(state => state.user.selectedUserDetails);
    const activities = useSelector(state => state.user.userActivities);
    const userSites = useSelector(state => state.user.userSites);
    console.log('user', user);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const userInStore = user && user.id === id;

            if (userInStore) {
                console.log(`Data for user ${id} already in store. Skipping fetch.`);
                setLoading(false);
            } else {
                console.log(`Data for user ${id} not in store or incomplete. Fetching...`);
                setLoading(true);
                try {
                    await dispatch(fetchUserById(id));
                    await dispatch(fetchUserActivities(id));
                } catch (error) {
                    notify(error.message, 'error', 3000);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadData();
    }, [dispatch, id]);

    const goBack = () => {
        navigate('/admin/users');
    };

    const handleEditUser = () => {
        navigate(`/users/${id}/edit`);
    };

    const handleManageSites = () => {
        navigate(`/users/${id}/sites`);
    };

    const handleViewAllActivities = () => {
        navigate(`/users/${id}/activities`);
    };

    const renderStatusBadge = () => {
        if (!user) return null;

        const statusClass = user.isDeleted ? 'status-badge inactive' : 'status-badge active';
        return <div className={statusClass}>{user.isDeleted ? 'Inactive' : 'Active'}</div>;
    };

    if (loading) {
        return <LoadPanel visible={true} />;
    }

    if (!user) {
        return (
            <div className="user-not-found">
                <h2>User Not Found</h2>
                <p>The requested user could not be found.</p>
                <Button text="Back to Users" onClick={goBack} />
            </div>
        );
    }

    return (
        <div className="user-details-container">
            <Toolbar className="user-details-toolbar">
                <ToolbarItem location="before">
                    <Button
                        icon="chevronleft"
                        stylingMode="text"
                        onClick={goBack}
                    />
                </ToolbarItem>
                <ToolbarItem location="before" locateInMenu="never">
                    <div className="toolbar-title-container">
                        <h2 className="toolbar-title">User Details</h2>
                    </div>
                </ToolbarItem>
                <ToolbarItem location="after" locateInMenu="auto" widget="dxButton" options={{ text: "Edit User", icon: "edit", stylingMode: "contained", type: "default", onClick: handleEditUser }} />
                <ToolbarItem location="after" locateInMenu="auto" widget="dxButton" options={{ text: "Manage Sites", icon: "map", stylingMode: "contained", type: "default", onClick: handleManageSites }} />
                <ToolbarItem location="after" locateInMenu="auto" widget="dxButton" options={{ text: "View All Activities", icon: "clock", stylingMode: "contained", type: "default", onClick: handleViewAllActivities }} />
            </Toolbar>

            <div className="user-details-content">
                <div className="user-info-card">
                    <div className="info-header">
                        <h3>User Information</h3>
                    </div>
                    <div className="info-content">
                        <div className="info-item">
                            <div className="label">Username</div>
                            <div className="value">{user.userName}</div>
                        </div>
                        <div className="info-item">
                            <div className="label">Email</div>
                            <div className="value">{user.email}</div>
                        </div>
                        <div className="info-item">
                            <div className="label">Phone Number</div>
                            <div className="value">{user.phoneNumber || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="label">Status</div>
                            <div className="value">{renderStatusBadge()}</div>
                        </div>
                        <div className="info-item">
                            <div className="label">Assigned Sites</div>
                            <div className="value">{userSites.length || 0}</div>
                        </div>
                    </div>
                </div>

                <div className="user-activity-card">
                    <div className="activity-header">
                        <h3>Recent Activities</h3>
                    </div>
                    <div className="activity-content">
                        <DataGrid
                            dataSource={activities.slice(0, 5)}
                            showBorders={true}
                            columnAutoWidth={true}
                            wordWrapEnabled={true}
                            height={300}
                        >
                            <Sorting mode="single" />
                            <Column dataField="action" caption="Action" />
                            <Column dataField="controller" caption="Controller" />
                            <Column
                                dataField="timestamp"
                                caption="Timestamp"
                                dataType="datetime"
                                format="yyyy-MM-dd HH:mm:ss"
                                sortOrder="desc"
                                calculateCellValue={(data) => {
                                    return data.timestamp ? new Date(data.timestamp) : null;
                                }}
                            />
                            <Column dataField="ipAddress" caption="IP Address" />
                        </DataGrid>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsPage;