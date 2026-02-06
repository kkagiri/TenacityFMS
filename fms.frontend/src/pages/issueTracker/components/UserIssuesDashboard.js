/**
 * File: UserIssuesDashboard.js
 * Purpose: User-specific issue dashboard showing assigned/opened issues with statistics
 * Dependencies: DevExtreme, issueTrackerService, Redux
 * Last Modified: 2025-02-02
 *
 * Key Components:
 * - UserIssuesDashboard: Main dashboard with statistics cards, charts, and issue lists
 * - StatCard: Reusable statistic card component
 * - IssuesByPeriodChart: Bar chart showing issues by week
 * - IssuesByCategoryChart: Pie chart showing issues by category
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter, Sorting, Scrolling } from 'devextreme-react/data-grid';
import { Chart, Series, CommonSeriesSettings, Label, Legend, Tooltip, ArgumentAxis, ValueAxis } from 'devextreme-react/chart';
import { PieChart, Series as PieSeries, Label as PieLabel, Legend as PieLegend, Connector, Tooltip as PieTooltip } from 'devextreme-react/pie-chart';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { TabPanel, Item } from 'devextreme-react/tab-panel';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';
import './UserIssuesDashboard.scss';

/**
 * Statistic Card Component
 */
const StatCard = ({ title, value, icon, colorClass, subText, onClick }) => (
    <div
        className={`tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-border-l-4 ${colorClass} tw-cursor-pointer hover:tw-shadow-lg tw-transition-shadow`}
        onClick={onClick}
    >
        <div className="tw-flex tw-items-center tw-justify-between">
            <div>
                <p className="tw-text-gray-500 tw-text-sm tw-font-medium">{title}</p>
                <p className="tw-text-2xl tw-font-bold tw-text-gray-800">{value}</p>
                {subText && <p className="tw-text-xs tw-text-gray-400 tw-mt-1">{subText}</p>}
            </div>
            <div className={`tw-text-3xl tw-opacity-50 ${colorClass.replace('tw-border-', 'tw-text-')}`}>
                <i className={`fa-light ${icon}`}></i>
            </div>
        </div>
    </div>
);

/**
 * Main User Issues Dashboard Component
 */
const UserIssuesDashboard = () => {
    const user = useSelector((state) => state.auth.user);

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for filters
    const [filters, setFilters] = useState({
        vehicleId: null,
        siteId: null,
        categoryId: null,
        weeksBack: 4,
        startDate: null,
        endDate: null
    });

    // State for dropdown options
    const [vehicles, setVehicles] = useState([]);
    const [sites, setSites] = useState([]);
    const [categories, setCategories] = useState([]);

    // Load initial filter options
    useEffect(() => {
        loadFilterOptions();
    }, []);

    // Load dashboard data when filters change
    useEffect(() => {
        loadDashboardData();
    }, [filters]);

    const loadFilterOptions = async () => {
        try {
            const [vehiclesRes, sitesRes, categoriesRes] = await Promise.all([
                issueTrackerService.getVehicles(),
                issueTrackerService.getSites(),
                issueTrackerService.getCategories()
            ]);

            setVehicles(vehiclesRes || []);
            setSites(sitesRes || []);
            setCategories(categoriesRes || []);
        } catch (err) {
            console.error('Error loading filter options:', err);
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await issueTrackerService.getUserDashboard(filters);

            if (response.isSuccess) {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Failed to load dashboard data');
                notify({ message: response.message || 'Failed to load dashboard', type: 'error', displayTime: 4000 });
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
            notify({ message: 'Failed to load dashboard', type: 'error', displayTime: 4000 });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            vehicleId: null,
            siteId: null,
            categoryId: null,
            weeksBack: 4,
            startDate: null,
            endDate: null
        });
    }, []);

    const renderPriorityCell = (cellData) => {
        const priority = cellData.value;
        const colors = {
            'Critical': 'tw-bg-red-100 tw-text-red-700',
            'High': 'tw-bg-orange-100 tw-text-orange-700',
            'Medium': 'tw-bg-yellow-100 tw-text-yellow-700',
            'Low': 'tw-bg-green-100 tw-text-green-700'
        };

        return (
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colors[priority] || 'tw-bg-gray-100 tw-text-gray-700'}`}>
                {priority || 'N/A'}
            </span>
        );
    };

    const renderStatusCell = (cellData) => {
        const status = cellData.value;
        const colors = {
            'Open': 'tw-bg-blue-100 tw-text-blue-700',
            'In Progress': 'tw-bg-yellow-100 tw-text-yellow-700',
            'Resolved': 'tw-bg-green-100 tw-text-green-700',
            'Closed': 'tw-bg-gray-100 tw-text-gray-700'
        };

        return (
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colors[status] || 'tw-bg-gray-100 tw-text-gray-700'}`}>
                {status || 'N/A'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && !dashboardData) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
                <LoadIndicator visible={true} />
                <span className="tw-ml-3 tw-text-gray-600">Loading your dashboard...</span>
            </div>
        );
    }

    if (error && !dashboardData) {
        return (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-96">
                <i className="fa-light fa-exclamation-circle tw-text-4xl tw-text-red-500 tw-mb-4"></i>
                <p className="tw-text-gray-600">{error}</p>
                <Button
                    text="Retry"
                    type="default"
                    onClick={loadDashboardData}
                    className="tw-mt-4"
                />
            </div>
        );
    }

    const assigned = {
        total: dashboardData?.totalAssignedIssues || 0,
        open: dashboardData?.openIssues || 0,
        closed: dashboardData?.closedIssues || 0,
        inProgress: dashboardData?.inProgressIssues || 0,
        highPriority: dashboardData?.highPriorityIssues || 0,
        overdue: dashboardData?.overdueIssues || 0
    };

    const opened = {
        total: dashboardData?.totalOpenedByMe || 0,
        open: dashboardData?.openedByMeOpen || 0,
        resolved: dashboardData?.openedByMeResolved || 0,
        closed: dashboardData?.openedByMeClosed || 0,
        awaitingResponse: dashboardData?.openedByMeAwaitingResponse || 0
    };

    return (
        <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
            {/* Header */}
            <div className="tw-mb-6">
                <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                    <i className="fa-light fa-chart-user tw-mr-2"></i>
                    My Issues Dashboard
                </h1>
                <p className="tw-text-gray-500 tw-mt-1">
                    Welcome back, {user?.firstName || user?.userName || 'User'}! Here's an overview of your issues.
                </p>
            </div>

            {/* Filters Section */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-mb-6">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700">
                        <i className="fa-light fa-filter tw-mr-2"></i>Filters
                    </h3>
                    <Button
                        text="Clear Filters"
                        icon="clear"
                        type="default"
                        stylingMode="text"
                        onClick={handleClearFilters}
                    />
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4">
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Vehicle</label>
                        <SelectBox
                            dataSource={vehicles}
                            displayExpr="hyoungNo"
                            valueExpr="vehicleId"
                            value={filters.vehicleId}
                            onValueChanged={(e) => handleFilterChange('vehicleId', e.value)}
                            showClearButton={true}
                            placeholder="All Vehicles"
                            searchEnabled={true}
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Site</label>
                        <SelectBox
                            dataSource={sites}
                            displayExpr="name"
                            valueExpr="siteId"
                            value={filters.siteId}
                            onValueChanged={(e) => handleFilterChange('siteId', e.value)}
                            showClearButton={true}
                            placeholder="All Sites"
                            searchEnabled={true}
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Category</label>
                        <SelectBox
                            dataSource={categories}
                            displayExpr="name"
                            valueExpr="issueCategoryId"
                            value={filters.categoryId}
                            onValueChanged={(e) => handleFilterChange('categoryId', e.value)}
                            showClearButton={true}
                            placeholder="All Categories"
                            searchEnabled={true}
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Weeks Back</label>
                        <SelectBox
                            dataSource={[
                                { value: 1, text: 'Last Week' },
                                { value: 2, text: 'Last 2 Weeks' },
                                { value: 4, text: 'Last 4 Weeks' },
                                { value: 8, text: 'Last 8 Weeks' },
                                { value: 12, text: 'Last 12 Weeks' }
                            ]}
                            displayExpr="text"
                            valueExpr="value"
                            value={filters.weeksBack}
                            onValueChanged={(e) => handleFilterChange('weeksBack', e.value)}
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">Start Date</label>
                        <DateBox
                            value={filters.startDate}
                            onValueChanged={(e) => handleFilterChange('startDate', e.value)}
                            showClearButton={true}
                            placeholder="From..."
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">End Date</label>
                        <DateBox
                            value={filters.endDate}
                            onValueChanged={(e) => handleFilterChange('endDate', e.value)}
                            showClearButton={true}
                            placeholder="To..."
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards - Assigned to Me */}
            <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                    <i className="fa-light fa-user-check tw-mr-2"></i>Assigned to Me
                </h3>
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4">
                    <StatCard
                        title="Total Assigned"
                        value={assigned.total || 0}
                        icon="fa-clipboard-list"
                        colorClass="tw-border-blue-500"
                    />
                    <StatCard
                        title="Open"
                        value={assigned.open || 0}
                        icon="fa-folder-open"
                        colorClass="tw-border-yellow-500"
                    />
                    <StatCard
                        title="In Progress"
                        value={assigned.inProgress || 0}
                        icon="fa-spinner"
                        colorClass="tw-border-indigo-500"
                    />
                    <StatCard
                        title="Closed"
                        value={assigned.closed || 0}
                        icon="fa-check-circle"
                        colorClass="tw-border-green-500"
                    />
                    <StatCard
                        title="High Priority"
                        value={assigned.highPriority || 0}
                        icon="fa-exclamation-triangle"
                        colorClass="tw-border-orange-500"
                    />
                    <StatCard
                        title="Overdue"
                        value={assigned.overdue || 0}
                        icon="fa-clock"
                        colorClass="tw-border-red-500"
                    />
                </div>
            </div>

            {/* Stats Cards - Opened by Me */}
            <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                    <i className="fa-light fa-user-pen tw-mr-2"></i>Opened by Me
                </h3>
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-5 tw-gap-4">
                    <StatCard
                        title="Total Opened"
                        value={opened.total || 0}
                        icon="fa-file-plus"
                        colorClass="tw-border-blue-500"
                    />
                    <StatCard
                        title="Still Open"
                        value={opened.open || 0}
                        icon="fa-folder-open"
                        colorClass="tw-border-yellow-500"
                    />
                    <StatCard
                        title="Resolved"
                        value={opened.resolved || 0}
                        icon="fa-check"
                        colorClass="tw-border-teal-500"
                    />
                    <StatCard
                        title="Closed"
                        value={opened.closed || 0}
                        icon="fa-check-circle"
                        colorClass="tw-border-green-500"
                    />
                    <StatCard
                        title="Awaiting Response"
                        value={opened.awaitingResponse || 0}
                        icon="fa-hourglass-half"
                        colorClass="tw-border-purple-500"
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
                {/* Issues by Week Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-chart-bar tw-mr-2"></i>Issues by Week
                    </h3>
                    {dashboardData?.issuesByWeek?.length > 0 ? (
                        <Chart
                            dataSource={dashboardData.issuesByWeek}
                            height={300}
                        >
                            <ArgumentAxis>
                                <Label rotationAngle={-45} displayMode="rotate" />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="period" type="bar" />
                            <Series valueField="openedCount" name="Opened" color="#3B82F6" />
                            <Series valueField="closedCount" name="Closed" color="#10B981" />
                            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64 tw-text-gray-500">
                            <span>No data available for the selected period</span>
                        </div>
                    )}
                </div>

                {/* Issues by Category Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-chart-pie tw-mr-2"></i>Issues by Category
                    </h3>
                    {dashboardData?.issuesByCategory?.length > 0 ? (
                        <PieChart
                            dataSource={dashboardData.issuesByCategory}
                            height={300}
                            palette="Material"
                        >
                            <PieSeries argumentField="categoryName" valueField="totalCount">
                                <PieLabel visible={true} position="columns">
                                    <Connector visible={true} width={0.5} />
                                </PieLabel>
                            </PieSeries>
                            <PieLegend verticalAlignment="bottom" horizontalAlignment="center" />
                            <PieTooltip enabled={true} customizeTooltip={(arg) => ({ text: `${arg.argumentText}: ${arg.value} (${arg.percentText})` })} />
                        </PieChart>
                    ) : (
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64 tw-text-gray-500">
                            <span>No category data available</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Charts */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
                {/* Issues by Vehicle Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-truck tw-mr-2"></i>Top Vehicles by Issues
                    </h3>
                    {dashboardData?.issuesByVehicle?.length > 0 ? (
                        <Chart
                            dataSource={dashboardData.issuesByVehicle.slice(0, 10)}
                            height={300}
                            rotated={true}
                        >
                            <ArgumentAxis>
                                <Label />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="vehicleName" type="bar" />
                            <Series valueField="totalCount" name="Issues" color="#8B5CF6" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64 tw-text-gray-500">
                            <span>No vehicle data available</span>
                        </div>
                    )}
                </div>

                {/* Issues by Site Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-building tw-mr-2"></i>Top Sites by Issues
                    </h3>
                    {dashboardData?.issuesBySite?.length > 0 ? (
                        <Chart
                            dataSource={dashboardData.issuesBySite.slice(0, 10)}
                            height={300}
                            rotated={true}
                        >
                            <ArgumentAxis>
                                <Label />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="siteName" type="bar" />
                            <Series valueField="totalCount" name="Issues" color="#F59E0B" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64 tw-text-gray-500">
                            <span>No site data available</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Lists Tab Panel */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                <TabPanel>
                    <Item title="Assigned to Me" icon="user">
                        <div className="tw-p-4">
                            <DataGrid
                                dataSource={dashboardData?.assignedIssues || []}
                                showBorders={true}
                                columnAutoWidth={true}
                                rowAlternationEnabled={true}
                                height={400}
                            >
                                <Paging defaultPageSize={10} />
                                <FilterRow visible={true} />
                                <HeaderFilter visible={true} />
                                <Sorting mode="multiple" />
                                <Scrolling mode="virtual" />

                                <Column dataField="issueTrackerId" caption="ID" width={60} />
                                <Column dataField="title" caption="Title" minWidth={200} />
                                <Column dataField="priorityName" caption="Priority" width={100} cellRender={renderPriorityCell} />
                                <Column dataField="statusName" caption="Status" width={120} cellRender={renderStatusCell} />
                                <Column dataField="categoryName" caption="Category" width={150} />
                                <Column dataField="vehicleName" caption="Vehicle" width={120} />
                                <Column dataField="siteName" caption="Site" width={150} />
                                <Column dataField="openDate" caption="Opened" width={110} dataType="date" format="shortDate" />
                                <Column dataField="dueDate" caption="Due Date" width={110} dataType="date" format="shortDate" />
                            </DataGrid>
                        </div>
                    </Item>

                    <Item title="Opened by Me" icon="edit">
                        <div className="tw-p-4">
                            <DataGrid
                                dataSource={dashboardData?.openedByMeIssues || []}
                                showBorders={true}
                                columnAutoWidth={true}
                                rowAlternationEnabled={true}
                                height={400}
                            >
                                <Paging defaultPageSize={10} />
                                <FilterRow visible={true} />
                                <HeaderFilter visible={true} />
                                <Sorting mode="multiple" />
                                <Scrolling mode="virtual" />

                                <Column dataField="issueTrackerId" caption="ID" width={60} />
                                <Column dataField="title" caption="Title" minWidth={200} />
                                <Column dataField="priorityName" caption="Priority" width={100} cellRender={renderPriorityCell} />
                                <Column dataField="statusName" caption="Status" width={120} cellRender={renderStatusCell} />
                                <Column dataField="categoryName" caption="Category" width={150} />
                                <Column dataField="assignedToName" caption="Assigned To" width={150} />
                                <Column dataField="openDate" caption="Opened" width={110} dataType="date" format="shortDate" />
                                <Column dataField="closedDate" caption="Closed" width={110} dataType="date" format="shortDate" />
                            </DataGrid>
                        </div>
                    </Item>

                    <Item title="Recently Closed" icon="check">
                        <div className="tw-p-4">
                            <DataGrid
                                dataSource={dashboardData?.recentlyClosedIssues || []}
                                showBorders={true}
                                columnAutoWidth={true}
                                rowAlternationEnabled={true}
                                height={400}
                            >
                                <Paging defaultPageSize={10} />
                                <FilterRow visible={true} />
                                <HeaderFilter visible={true} />
                                <Sorting mode="multiple" />
                                <Scrolling mode="virtual" />

                                <Column dataField="issueTrackerId" caption="ID" width={60} />
                                <Column dataField="title" caption="Title" minWidth={200} />
                                <Column dataField="priorityName" caption="Priority" width={100} cellRender={renderPriorityCell} />
                                <Column dataField="categoryName" caption="Category" width={150} />
                                <Column dataField="vehicleName" caption="Vehicle" width={120} />
                                <Column dataField="openDate" caption="Opened" width={110} dataType="date" format="shortDate" />
                                <Column dataField="closedDate" caption="Closed" width={110} dataType="date" format="shortDate" />
                                <Column dataField="closedByName" caption="Closed By" width={150} />
                            </DataGrid>
                        </div>
                    </Item>
                </TabPanel>
            </div>

            {/* Loading Overlay */}
            {loading && dashboardData && (
                <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-20 tw-flex tw-items-center tw-justify-center tw-z-50">
                    <div className="tw-bg-white tw-rounded-lg tw-p-4 tw-shadow-lg tw-flex tw-items-center">
                        <LoadIndicator visible={true} />
                        <span className="tw-ml-3 tw-text-gray-600">Updating...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserIssuesDashboard;
