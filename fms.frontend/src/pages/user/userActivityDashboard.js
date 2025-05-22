import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllUserActivities, fetchUsers } from '../../redux/actions/userActions';
import { Button } from 'devextreme-react/button';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    SearchPanel,
    Selection,
    Sorting,
    Summary,
    GroupItem,
    TotalItem
} from 'devextreme-react/data-grid';
import Tabs from 'devextreme-react/tabs';
import SelectBox from 'devextreme-react/select-box';
import TextBox from 'devextreme-react/text-box';
import Chart, {
    Series,
    ArgumentAxis,
    ValueAxis,
    Legend,
    CommonSeriesSettings,
    Tooltip,
    Label,
    Title
} from 'devextreme-react/chart';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import './userActivityDashboard.scss';

// Custom styles for the tabs
const styles = {
    tabs: {
        marginBottom: "15px",
    },
    tabItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    contentContainer: {
        width: "100%",
    }
};

const UserActivityDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const allActivities = useSelector(state => state.user.allActivities);
    const users = useSelector(state => state.user.users);

    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [userFilter, setUserFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [filteredActivities, setFilteredActivities] = useState([]);

    // Activity summary stats
    const [activityStats, setActivityStats] = useState({
        userStats: [],
        actionStats: [],
        timeStats: []
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await dispatch(fetchUsers());
                await dispatch(fetchAllUserActivities());
            } catch (error) {
                notify(error.message, 'error', 3000);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [dispatch]);

    useEffect(() => {
        if (!allActivities || allActivities.length === 0 || !users || users.length === 0) {
            setFilteredActivities([]);
            return;
        }

        // Apply filters
        let result = [...allActivities];

        // Search term filter
        if (searchText) {
            result = result.filter(
                (activity) =>
                    activity.action?.toLowerCase().includes(searchText.toLowerCase()) ||
                    (activity.controller && activity.controller.toLowerCase().includes(searchText.toLowerCase())) ||
                    (getUserName(activity.userId) || '').toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // User filter
        if (userFilter !== 'all') {
            result = result.filter((activity) => activity.userId === userFilter);
        }

        // Action filter
        if (actionFilter !== 'all') {
            result = result.filter((activity) => activity.action === actionFilter);
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

        // Generate statistics for charts
        generateActivityStats(result);

    }, [allActivities, users, searchText, userFilter, actionFilter, dateFilter]);

    const generateActivityStats = (activities) => {
        // User activity counts
        const userCounts = {};
        users.forEach(user => {
            userCounts[user.id] = 0;
        });

        activities.forEach(activity => {
            if (userCounts[activity.userId] !== undefined) {
                userCounts[activity.userId]++;
            }
        });

        const userStats = Object.keys(userCounts)
            .map(userId => ({
                user: getUserName(userId) || 'Unknown',
                count: userCounts[userId]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Actions count
        const actionCounts = {};
        activities.forEach(activity => {
            if (!actionCounts[activity.action]) {
                actionCounts[activity.action] = 0;
            }
            actionCounts[activity.action]++;
        });

        const actionStats = Object.keys(actionCounts)
            .map(action => ({
                action,
                count: actionCounts[action]
            }))
            .sort((a, b) => b.count - a.count);

        // Time-based stats (last 7 days)
        const timeStats = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);

            const count = activities.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate >= date && activityDate < nextDate;
            }).length;

            timeStats.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count
            });
        }

        setActivityStats({
            userStats,
            actionStats,
            timeStats
        });
    };

    // Get username by id
    const getUserName = (userId) => {
        try {
            if (!userId) return "Unknown";
            const user = users.find(u => u.id === userId);
            return user ? user.userName : "Unknown";
        } catch (error) {
            console.error("Error getting username:", error);
            return "Unknown";
        }
    };

    // Tab data
    const tabData = [
        { text: "All Activities", icon: "fas fa-list" },
        { text: "By User", icon: "fas fa-user" },
        { text: "Analytics", icon: "fas fa-chart-bar" }
    ];

    // Custom tab item renderer
    const renderTabItem = (item) => {
        return (
            <div style={styles.tabItem}>
                <i className={item.icon}></i>
                <span>{item.text}</span>
            </div>
        );
    };

    const handleTabChange = (e) => {
        setSelectedTab(e.itemIndex);
    };

    // Get unique users for filter
    const getUserFilterOptions = () => {
        if (!users || users.length === 0) return [{ value: 'all', text: 'All Users' }];

        return [
            { value: 'all', text: 'All Users' },
            ...users.map(user => ({ value: user.id, text: user.userName }))
        ];
    };

    // Get unique actions for filter
    const getUniqueActions = () => {
        if (!allActivities || allActivities.length === 0) return [{ value: 'all', text: 'All Actions' }];

        const uniqueValues = [...new Set(allActivities.map(activity => activity.action))];
        return [
            { value: 'all', text: 'All Actions' },
            ...uniqueValues.map(value => ({ value, text: value }))
        ];
    };

    const dateFilterOptions = [
        { value: 'all', text: 'All Time' },
        { value: 'today', text: 'Today' },
        { value: 'week', text: 'Last 7 Days' },
        { value: 'month', text: 'Last 30 Days' }
    ];

    const renderActivityUserCell = (data) => {
        try {
            if (!data || !data.value) return "Unknown";
            const user = users.find(u => u.id === data.value);
            return user ? user.userName : "Unknown";
        } catch (error) {
            console.error("Error rendering user cell:", error);
            return "Unknown";
        }
    };

    const customizeTooltip = (arg) => {
        return {
            text: `${arg.valueText} activities`
        };
    };

    if (loading) {
        return <LoadPanel visible={true} />;
    }

    return (
        <div className="activity-dashboard-container">
            <div className="header-container">
                <h2>Activity Tracker</h2>
            </div>

            <div className="tabs-container">
                <Tabs
                    dataSource={tabData}
                    selectedIndex={selectedTab}
                    onItemClick={handleTabChange}
                    width="100%"
                    style={styles.tabs}
                    itemRender={renderTabItem}
                    repaintChangesOnly={true}
                    noDataText=""
                />
            </div>

            <div style={styles.contentContainer}>
                {selectedTab === 0 && (
                    <div className="activities-card">
                        <div className="activities-header">
                            <h3>System Activity Log</h3>
                            <p>Track and monitor all user activities across the system</p>
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
                                    items={getUserFilterOptions()}
                                    displayExpr="text"
                                    valueExpr="value"
                                    value={userFilter}
                                    onValueChanged={e => setUserFilter(e.value)}
                                    placeholder="Filter by user"
                                    width={180}
                                />

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
                            {filteredActivities.length === 0 && !loading ? (
                                <div className="no-data-message">
                                    <p>No activities found. Activities will appear here when users interact with the system.</p>
                                </div>
                            ) : (
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

                                    <Column
                                        dataField="userId"
                                        caption="User"
                                        cellRender={renderActivityUserCell}
                                    />
                                    <Column dataField="action" caption="Action" />
                                    <Column dataField="controller" caption="Controller" />
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
                                            return data.timestamp ? new Date(data.timestamp) : null;
                                        }}
                                    />

                                    <Summary>
                                        <TotalItem
                                            column="userId"
                                            summaryType="count"
                                            displayFormat="{0} activities"
                                        />
                                    </Summary>
                                </DataGrid>
                            )}
                        </div>
                    </div>
                )}

                {selectedTab === 1 && (
                    <div className="activities-card">
                        <div className="activities-header">
                            <h3>User Activity Summary</h3>
                            <p>View activity statistics grouped by user</p>
                        </div>

                        <div className="activities-grid">
                            <DataGrid
                                dataSource={users}
                                showBorders={true}
                                columnAutoWidth={true}
                            >
                                <Selection mode="single" />
                                <SearchPanel visible={true} width={240} />
                                <FilterRow visible={true} />
                                <HeaderFilter visible={true} />
                                <Sorting mode="multiple" />
                                <Paging defaultPageSize={10} />
                                <Pager
                                    showPageSizeSelector={true}
                                    allowedPageSizes={[10, 20, 50]}
                                    showInfo={true}
                                />

                                <Column dataField="userName" caption="User" />
                                <Column dataField="email" caption="Email" />
                                <Column
                                    caption="Total Activities"
                                    calculateCellValue={(data) => {
                                        return allActivities.filter(activity => activity.userId === data.id).length;
                                    }}
                                    sortOrder="desc"
                                />
                                <Column
                                    caption="Last Activity"
                                    calculateCellValue={(data) => {
                                        const userActivities = allActivities.filter(activity => activity.userId === data.id);
                                        if (userActivities.length === 0) return 'N/A';

                                        const lastActivity = userActivities.sort(
                                            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                                        )[0];

                                        return new Date(lastActivity.timestamp).toLocaleString();
                                    }}
                                />
                                <Column
                                    caption="Most Common Action"
                                    calculateCellValue={(data) => {
                                        const userActivities = allActivities.filter(activity => activity.userId === data.id);
                                        if (userActivities.length === 0) return 'N/A';

                                        const actionCounts = {};
                                        userActivities.forEach(activity => {
                                            if (!actionCounts[activity.action]) {
                                                actionCounts[activity.action] = 0;
                                            }
                                            actionCounts[activity.action]++;
                                        });

                                        const mostCommon = Object.keys(actionCounts).reduce((a, b) =>
                                            actionCounts[a] > actionCounts[b] ? a : b, Object.keys(actionCounts)[0]);

                                        return mostCommon || 'N/A';
                                    }}
                                />
                                <Column
                                    dataField="id"
                                    caption="Actions"
                                    cellRender={(data) => (
                                        <Button
                                            text="View Activities"
                                            stylingMode="outlined"
                                            onClick={() => navigate(`/users/${data.value}/activities`)}
                                        />
                                    )}
                                />
                            </DataGrid>
                        </div>
                    </div>
                )}

                {selectedTab === 2 && (
                    <div className="analytics-container">
                        <div className="chart-row">
                            <div className="chart-card">
                                <h3>Activity by User</h3>
                                <Chart
                                    dataSource={activityStats.userStats}
                                    palette="Harmony Light"
                                    title=""
                                >
                                    <CommonSeriesSettings
                                        argumentField="user"
                                        valueField="count"
                                        type="bar"
                                    />
                                    <Series />
                                    <ArgumentAxis>
                                        <Label overlappingBehavior="rotate" />
                                    </ArgumentAxis>
                                    <ValueAxis>
                                        <Title text="Activities" />
                                    </ValueAxis>
                                    <Legend visible={false} />
                                    <Tooltip
                                        enabled={true}
                                        customizeTooltip={customizeTooltip}
                                    />
                                </Chart>
                            </div>

                            <div className="chart-card">
                                <h3>Activity by Action Type</h3>
                                <Chart
                                    dataSource={activityStats.actionStats}
                                    palette="Soft Pastel"
                                    title=""
                                >
                                    <CommonSeriesSettings
                                        argumentField="action"
                                        valueField="count"
                                        type="pie"
                                    />
                                    <Series />
                                    <Legend
                                        visible={true}
                                        verticalAlignment="bottom"
                                        horizontalAlignment="center"
                                    />
                                    <Tooltip
                                        enabled={true}
                                        customizeTooltip={customizeTooltip}
                                    />
                                </Chart>
                            </div>
                        </div>

                        <div className="chart-card full-width">
                            <h3>Activity Over Time (Last 7 Days)</h3>
                            <Chart
                                dataSource={activityStats.timeStats}
                                palette="Soft Blue"
                                title=""
                            >
                                <CommonSeriesSettings
                                    argumentField="date"
                                    valueField="count"
                                    type="line"
                                />
                                <Series />
                                <ArgumentAxis>
                                    <Label />
                                </ArgumentAxis>
                                <ValueAxis>
                                    <Title text="Activities" />
                                </ValueAxis>
                                <Legend visible={false} />
                                <Tooltip
                                    enabled={true}
                                    customizeTooltip={customizeTooltip}
                                />
                            </Chart>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserActivityDashboard;