import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, fetchUserActivities } from '../../redux/actions/userActions';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Sorting,
    Selection
} from 'devextreme-react/data-grid';
import SelectBox from 'devextreme-react/select-box';
import TextBox from 'devextreme-react/text-box';
import DateBox from 'devextreme-react/date-box';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import './userActivitiesPage.scss';

const UserActivitiesPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(state => state.user.selectedUserDetails);
    const activities = useSelector(state => state.user.userActivities);

    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [controllerFilter, setControllerFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [filteredActivities, setFilteredActivities] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            // Check if user data and activities for this ID are already in the store
            const userInStore = user && user.id === id;
            // Check if activities is an array and contains data for the current user
            const activitiesInStore = Array.isArray(activities) && activities.length > 0 && activities.every(activity => activity.userId === id || activity.userId === undefined);

            if (userInStore && activitiesInStore) {
                console.log(`Data for user ${id} and activities already in store. Skipping fetch.`);
                setLoading(false);
            } else {
                console.log(`Data for user ${id} or activities not in store or incomplete. Fetching...`);
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

    useEffect(() => {
        if (!activities || activities.length === 0) {
            setFilteredActivities([]);
            return;
        }

        // Apply filters
        let result = [...activities];

        // Filter out monitoring GET requests //Cursor
        result = result.filter(activity => {
            const isMonitoringGet = activity.action === 'GET' &&
                (activity.controller === 'User' || activity.controller === 'UserActivities');
            return !isMonitoringGet;
        });

        // Search term filter
        if (searchText) {
            result = result.filter(
                (activity) =>
                    activity.action?.toLowerCase().includes(searchText.toLowerCase()) ||
                    (activity.controller && activity.controller.toLowerCase().includes(searchText.toLowerCase())) ||
                    (activity.actionName && activity.actionName.toLowerCase().includes(searchText.toLowerCase())) ||
                    (activity.parameters && activity.parameters.toLowerCase().includes(searchText.toLowerCase())),
            );
        }

        // Action filter
        if (actionFilter !== 'all') {
            result = result.filter((activity) => activity.action === actionFilter);
        }

        // Controller filter
        if (controllerFilter !== 'all') {
            result = result.filter((activity) => activity.controller === controllerFilter);
        }

        // Date filter
        const now = new Date();
        if (dateFilter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            result = result.filter((activity) => new Date(activity.timestamp) >= today);
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            result = result.filter((activity) => new Date(activity.timestamp) >= weekAgo);
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            result = result.filter((activity) => new Date(activity.timestamp) >= monthAgo);
        }

        setFilteredActivities(result);
    }, [activities, searchText, actionFilter, controllerFilter, dateFilter]);

    const goBack = () => {
        navigate(`/users/${id}`);
    };

    // Get unique actions for filter
    const getUniqueActions = () => {
        if (!activities || activities.length === 0) return [{ value: 'all', text: 'All Actions' }];

        try {
            const uniqueValues = [...new Set(activities
                .filter(activity => activity.action)
                .map(activity => activity.action))];
            return [
                { value: 'all', text: 'All Actions' },
                ...uniqueValues.map(value => ({ value, text: value }))
            ];
        } catch (error) {
            console.error("Error getting unique actions:", error);
            return [{ value: 'all', text: 'All Actions' }];
        }
    };

    // Get unique controllers for filter
    const getUniqueControllers = () => {
        if (!activities || activities.length === 0) return [{ value: 'all', text: 'All Controllers' }];

        try {
            const uniqueValues = [...new Set(activities
                .filter(activity => activity.controller)
                .map(activity => activity.controller))];

            return [
                { value: 'all', text: 'All Controllers' },
                ...uniqueValues.map(value => ({ value, text: value }))
            ];
        } catch (error) {
            console.error("Error getting unique controllers:", error);
            return [{ value: 'all', text: 'All Controllers' }];
        }
    };

    const dateFilterOptions = [
        { value: 'all', text: 'All Time' },
        { value: 'today', text: 'Today' },
        { value: 'week', text: 'Last 7 Days' },
        { value: 'month', text: 'Last 30 Days' }
    ];

    if (loading) {
        return <LoadPanel visible={true} />;
    }

    if (!user) {
        return (
            <div className="user-not-found">
                <h2>User Not Found</h2>
                <p>The requested user could not be found.</p>
                <Button text="Back to Users" onClick={() => navigate('/users')} />
            </div>
        );
    }

    return (
        <div className="user-activities-container">
            <div className="header-container">
                <div className="back-button">
                    <Button
                        icon="chevronleft"
                        stylingMode="text"
                        onClick={goBack}
                    />
                    <h2>User Activities</h2>
                </div>
            </div>

            <div className="activities-card">
                <div className="activities-header">
                    <h3>Activity Log for {user.userName}</h3>
                </div>

                <div className="filter-container">
                    <div className="search-box">
                        <TextBox
                            placeholder="Search activities..."
                            mode="search"
                            value={searchText}
                            onValueChanged={e => setSearchText(e.value)}
                            stylingMode="filled"
                            width="100%"
                        />
                    </div>

                    <div className="filter-boxes">
                        <SelectBox
                            items={getUniqueActions()}
                            displayExpr="text"
                            valueExpr="value"
                            value={actionFilter}
                            onValueChanged={e => setActionFilter(e.value)}
                            placeholder="Filter by action"
                            width={180}
                        />

                        <SelectBox
                            items={getUniqueControllers()}
                            displayExpr="text"
                            valueExpr="value"
                            value={controllerFilter}
                            onValueChanged={e => setControllerFilter(e.value)}
                            placeholder="Filter by controller"
                            width={180}
                        />

                        <SelectBox
                            items={dateFilterOptions}
                            displayExpr="text"
                            valueExpr="value"
                            value={dateFilter}
                            onValueChanged={e => setDateFilter(e.value)}
                            placeholder="Filter by date"
                            width={180}
                        />
                    </div>
                </div>

                <div className="activities-grid">
                    <DataGrid
                        dataSource={filteredActivities}
                        showBorders={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={true}
                        hoverStateEnabled={true}
                        noDataText="No activities found matching the current filters"
                    >
                        <Selection mode="single" />
                        <SearchPanel visible={false} />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Sorting mode="multiple" />
                        <Paging defaultPageSize={20} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 20, 50, 100]}
                            showInfo={true}
                        />

                        <Column dataField="action" caption="Action" />
                        <Column dataField="controller" caption="Controller" />
                        <Column dataField="actionName" caption="Action Name" />
                        <Column dataField="parameters" caption="Parameters" width={200} cellRender={(data) => (
                            <div className="parameters-cell">
                                {data.value || 'N/A'}
                            </div>
                        )} />
                        <Column dataField="ipAddress" caption="IP Address" />
                        <Column
                            dataField="timestamp"
                            caption="Timestamp"
                            dataType="datetime"
                            format="yyyy-MM-dd HH:mm:ss"
                            sortOrder="desc"
                            calculateCellValue={(data) => {
                                // Convert UTC to local time //Cursor
                                return data.timestamp ? new Date(data.timestamp) : null;
                            }}
                        />
                    </DataGrid>
                </div>
            </div>
        </div>
    );
};

export default UserActivitiesPage;