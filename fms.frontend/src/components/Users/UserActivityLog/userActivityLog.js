import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox, SelectBox } from 'devextreme-react';
import { DataGrid } from 'devextreme-react/data-grid';
import { fetchUserActivities } from '../../../redux/actions/userActions';
import './userActivityLog.scss';

const UserActivityLog = ({ userId }) => {
    const dispatch = useDispatch();
    const activities = useSelector(state => state.user.activities);

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
        endDate: new Date(),
        module: '',
        userId: userId
    });

    const moduleOptions = [
        { id: '', text: 'All Modules' },
        { id: 'USER', text: 'User Management' },
        { id: 'ROLE', text: 'Role Management' },
        { id: 'PERMISSION', text: 'Permission Management' },
        // Add more modules as needed
    ];

    useEffect(() => {
        handleSearch();
    }, [userId]);

    const handleSearch = () => {
        dispatch(fetchUserActivities(filters));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const groupActivitiesByDate = () => {
        return activities.reduce((groups, activity) => {
            const date = new Date(activity.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(activity);
            return groups;
        }, {});
    };

    return (
        <div className="user-activity-log">
            <div className="activity-filters">
                <div className="filter-group">
                    <DateBox
                        label="Start Date"
                        value={filters.startDate}
                        type="date"
                        onValueChanged={e => handleFilterChange('startDate', e.value)}
                    />
                    <DateBox
                        label="End Date"
                        value={filters.endDate}
                        type="date"
                        onValueChanged={e => handleFilterChange('endDate', e.value)}
                    />
                    <SelectBox
                        items={moduleOptions}
                        valueExpr="id"
                        displayExpr="text"
                        placeholder="Select Module"
                        value={filters.module}
                        onValueChanged={e => handleFilterChange('module', e.value)}
                    />
                    <button
                        className="search-button"
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="activity-timeline">
                {Object.entries(groupActivitiesByDate()).map(([date, dayActivities]) => (
                    <div key={date} className="activity-day">
                        <div className="day-header">
                            {date}
                        </div>
                        <DataGrid
                            dataSource={dayActivities}
                            showBorders={true}
                            showColumnLines={true}
                            showRowLines={true}
                            rowAlternationEnabled={true}
                        >
                            <Column dataField="timestamp"
                                caption="Time"
                                dataType="datetime"
                                format="shortTime"
                            />
                            <Column dataField="module" caption="Module" />
                            <Column dataField="action" caption="Action" />
                            <Column dataField="description" caption="Description" />
                            <Column dataField="ipAddress" caption="IP Address" />
                        </DataGrid>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserActivityLog;