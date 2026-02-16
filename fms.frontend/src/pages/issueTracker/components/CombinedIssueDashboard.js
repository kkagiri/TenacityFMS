/**
 * File: CombinedIssueDashboard.js
 * Purpose: Unified Issue Tracker dashboard combining stats, filters, charts, and data grids
 * Dependencies: DevExtreme, issueTrackerService, Redux, StatCard
 * Last Modified: 2026-02-10
 *
 * Key Features:
 * - Consolidated statistics cards (Overview, Priority, User-specific, Performance)
 * - Full filter panel (Vehicle, Site, Category, Date range)
 * - Quick action buttons for common filters
 * - 4 charts (Issues by Week, Category, Vehicle, Site)
 * - TabPanel with 3 data grids (Assigned, Opened by Me, Recently Closed)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    DataGrid,
    Column,
    Paging,
    Pager,
    FilterRow,
    FilterPanel,
    HeaderFilter,
    Sorting,
    Scrolling,
    Selection,
    Summary,
    TotalItem
} from 'devextreme-react/data-grid';
import {
    Chart,
    Series,
    CommonSeriesSettings,
    Label,
    Legend,
    Tooltip,
    ArgumentAxis,
    ValueAxis
} from 'devextreme-react/chart';
import {
    PieChart,
    Series as PieSeries,
    Label as PieLabel,
    Legend as PieLegend,
    Connector,
    Tooltip as PieTooltip
} from 'devextreme-react/pie-chart';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
// Tab selection handled by local state and buttons
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';
import { StatCard } from './shared';
import FollowedIssuesTicker from './FollowedIssuesTicker';
import IssueActivityHeatmap from './IssueActivityHeatmap';
import './CombinedIssueDashboard.scss';

/**
 * Format time duration for display
 */
const formatTime = (hours) => {
    if (!hours || hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
};

/**
 * Main Combined Issue Dashboard Component
 */
const CombinedIssueDashboard = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState(null);
    const [allIssues, setAllIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for filters
    const [filters, setFilters] = useState({
        vehicleId: null,
        siteId: null,
        categoryId: null,
        weeksBack: null,
        startDate: null,
        endDate: null,
        // Quick filter states
        priorityFilter: null,
        statusFilter: null
    });

    // State for dropdown options
    const [vehicles, setVehicles] = useState([]);
    const [sites, setSites] = useState([]);
    const [categories, setCategories] = useState([]);

    // State for tab selection (replacing TabPanel)
    const [selectedTab, setSelectedTab] = useState('assigned');

    // State for followed issues ticker visibility
    const [showFollowedIssues, setShowFollowedIssues] = useState(true);

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

            const dashboardFilters = {
                vehicleId: filters.vehicleId,
                siteId: filters.siteId,
                categoryId: filters.categoryId,
                weeksBack: filters.weeksBack,
                startDate: filters.startDate,
                endDate: filters.endDate
            };

            const [dashboardResponse, issuesResponse] = await Promise.all([
                issueTrackerService.getUserDashboard(dashboardFilters),
                issueTrackerService.getIssues()
            ]);

            if (dashboardResponse?.isSuccess) {
                setDashboardData(dashboardResponse.data);
            } else {
                setError(dashboardResponse?.message || 'Failed to load dashboard data');
                notify({
                    message: dashboardResponse?.message || 'Failed to load dashboard',
                    type: 'error',
                    displayTime: 4000
                });
            }

            const normalizedIssues = Array.isArray(issuesResponse)
                ? issuesResponse
                : (Array.isArray(issuesResponse?.data) ? issuesResponse.data : []);
            setAllIssues(normalizedIssues);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
            notify({ message: 'Failed to load dashboard', type: 'error', displayTime: 4000 });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = useCallback((field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            vehicleId: null,
            siteId: null,
            categoryId: null,
            weeksBack: null,
            startDate: null,
            endDate: null,
            priorityFilter: null,
            statusFilter: null
        });
    }, []);

    // Quick filter handlers
    const handlePriorityFilter = useCallback((priority) => {
        setFilters((prev) => ({
            ...prev,
            priorityFilter: prev.priorityFilter === priority ? null : priority
        }));
    }, []);

    const handleStatusFilter = useCallback((status) => {
        setFilters((prev) => ({
            ...prev,
            statusFilter: prev.statusFilter === status ? null : status
        }));
    }, []);

    // Cell renderers
    const renderPriorityCell = (cellData) => {
        const priority = cellData.value;
        const colors = {
            Critical: 'tw-bg-red-100 tw-text-red-700',
            High: 'tw-bg-orange-100 tw-text-orange-700',
            Medium: 'tw-bg-yellow-100 tw-text-yellow-700',
            Low: 'tw-bg-green-100 tw-text-green-700'
        };

        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colors[priority] || 'tw-bg-gray-100 tw-text-gray-700'
                    }`}
            >
                {priority || 'N/A'}
            </span>
        );
    };

    const renderStatusCell = (cellData) => {
        const status = cellData.value;
        const colors = {
            Open: 'tw-bg-blue-100 tw-text-blue-700',
            'In Progress': 'tw-bg-yellow-100 tw-text-yellow-700',
            Resolved: 'tw-bg-green-100 tw-text-green-700',
            Closed: 'tw-bg-gray-100 tw-text-gray-700'
        };

        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${colors[status] || 'tw-bg-gray-100 tw-text-gray-700'
                    }`}
            >
                {status || 'N/A'}
            </span>
        );
    };

    // Extract stats from dashboard data with safe defaults
    // Using Number() to ensure numeric values and fallback to 0
    // Field names match backend UserIssuesDashboardDto
    const safeNumber = (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    const normalizedAllIssues = useMemo(() => {
        return Array.isArray(allIssues) ? allIssues : [];
    }, [allIssues]);

    const getIssueDate = (issue) => {
        const value = issue?.openDate || issue?.createdDate || issue?.createdAt || issue?.dateCreated;
        return value ? new Date(value) : null;
    };

    const getIssueDueDate = (issue) => {
        return issue?.dueDate ? new Date(issue.dueDate) : null;
    };

    const getIssueClosingDate = (issue) => {
        return issue?.closingDate ? new Date(issue.closingDate) : null;
    };

    const getIssueStatus = (issue) => {
        return (issue?.statusName || issue?.status || '').toString().trim();
    };

    const getIssuePriority = (issue) => {
        return (issue?.priorityName || issue?.priority || '').toString().trim();
    };

    const isSameDay = (dateA, dateB) => {
        return (
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate()
        );
    };

    const matchesIssueFilters = (issue) => {
        if (!issue) return false;

        const issueDate = getIssueDate(issue);
        const issueDueDate = getIssueDueDate(issue);
        const issueStatus = getIssueStatus(issue);
        const issuePriority = getIssuePriority(issue);

        if (filters.vehicleId && Number(issue.vehicleId) !== Number(filters.vehicleId)) {
            return false;
        }

        if (filters.siteId && Number(issue.siteId) !== Number(filters.siteId)) {
            return false;
        }

        if (filters.categoryId && Number(issue.issueCategoryId) !== Number(filters.categoryId)) {
            return false;
        }

        if (filters.weeksBack && issueDate) {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() - (Number(filters.weeksBack) * 7));
            if (issueDate < minDate) {
                return false;
            }
        }

        if (filters.startDate && issueDate && issueDate < new Date(filters.startDate)) {
            return false;
        }

        if (filters.endDate && issueDate && issueDate > new Date(filters.endDate)) {
            return false;
        }

        if (filters.priorityFilter && issuePriority.toLowerCase() !== String(filters.priorityFilter).toLowerCase()) {
            return false;
        }

        if (filters.statusFilter && issueStatus.toLowerCase() !== String(filters.statusFilter).toLowerCase()) {
            return false;
        }

        if (filters.unassignedOnly) {
            const hasAssignee = Boolean(issue?.assignToId) || Boolean(issue?.assignToUserName);
            if (hasAssignee) {
                return false;
            }
        }

        if (filters.overdueOnly) {
            const statusLower = issueStatus.toLowerCase();
            const isClosed = statusLower === 'closed' || statusLower === 'resolved';
            const isOverdue = issueDueDate && issueDueDate < new Date() && !isClosed;
            if (!isOverdue) {
                return false;
            }
        }

        return true;
    };

    const filteredAllIssues = useMemo(() => {
        return normalizedAllIssues.filter(matchesIssueFilters);
    }, [normalizedAllIssues, filters]);

    const stats = {
        // Overview stats (aligned with tickets page dataset)
        totalIssues: filteredAllIssues.length,
        openCount: filteredAllIssues.filter((issue) => getIssueStatus(issue).toLowerCase() === 'open').length,
        inProgressCount: filteredAllIssues.filter((issue) => getIssueStatus(issue).toLowerCase() === 'in progress').length,
        resolvedToday: filteredAllIssues.filter((issue) => {
            const status = getIssueStatus(issue).toLowerCase();
            const closingDate = getIssueClosingDate(issue);
            return (status === 'resolved' || status === 'closed') && closingDate && isSameDay(closingDate, new Date());
        }).length,

        // Priority & Alerts
        criticalCount: filteredAllIssues.filter((issue) => getIssuePriority(issue).toLowerCase() === 'critical').length,
        highCount: filteredAllIssues.filter((issue) => getIssuePriority(issue).toLowerCase() === 'high').length,
        overdueIssues: filteredAllIssues.filter((issue) => {
            const dueDate = getIssueDueDate(issue);
            const status = getIssueStatus(issue).toLowerCase();
            return dueDate && dueDate < new Date() && status !== 'closed' && status !== 'resolved';
        }).length,
        unassignedIssues: filteredAllIssues.filter((issue) => !issue?.assignToId && !issue?.assignToUserName).length,

        // User-specific (Assigned to Me)
        totalAssigned: safeNumber(dashboardData?.totalAssignedIssues),
        closedByMe: safeNumber(dashboardData?.closedIssues),
        awaitingResponse: 0, // Not available in backend

        // Opened by Me
        totalOpenedByMe: safeNumber(dashboardData?.totalOpenedByMe),
        openedByMeOpen: safeNumber(dashboardData?.openedByMeOpen),
        openedByMeResolved: 0, // Not distinguished from closed in backend
        openedByMeClosed: safeNumber(dashboardData?.openedByMeClosed),

        // Performance (not available in backend - would need enhancement)
        averageResolutionTime: 0,
        gpsGeneratedIssues: 0,
        createdToday: filteredAllIssues.filter((issue) => {
            const issueDate = getIssueDate(issue);
            return issueDate ? isSameDay(issueDate, new Date()) : false;
        }).length
    };

    // Get the data source based on selected tab
    const getTabDataSource = () => {
        switch (selectedTab) {
            case 'assigned':
                return (dashboardData?.assignedIssues || []).filter(matchesIssueFilters);
            case 'opened':
                return (dashboardData?.openedByMeIssues || []).filter(matchesIssueFilters);
            case 'closed':
                return (dashboardData?.recentlyClosedIssues || []).filter(matchesIssueFilters);
            default:
                return [];
        }
    };

    // Tab configuration
    const tabConfig = [
        { id: 'assigned', label: 'Assigned to Me', icon: 'fa-light fa-user-check', count: stats.totalAssigned },
        { id: 'opened', label: 'Opened by Me', icon: 'fa-light fa-user-pen', count: stats.totalOpenedByMe },
        { id: 'closed', label: 'Recently Closed', icon: 'fa-light fa-check-circle', count: safeNumber((dashboardData?.recentlyClosedIssues || []).length) }
    ];

    // Loading state
    if (loading && !dashboardData) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
                <LoadIndicator visible={true} />
                <span className="tw-ml-3 tw-text-gray-600">Loading your dashboard...</span>
            </div>
        );
    }

    // Error state
    if (error && !dashboardData) {
        return (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-96">
                <i className="fa-light fa-exclamation-circle tw-text-4xl tw-text-red-500 tw-mb-4"></i>
                <p className="tw-text-gray-600">{error}</p>
                <Button text="Retry" type="default" onClick={loadDashboardData} className="tw-mt-4" />
            </div>
        );
    }

    return (
        <div className="combined-issue-dashboard tw-p-6 tw-bg-gray-50 tw-min-h-screen">
            {/* Header */}
            <div className="tw-mb-6 tw-flex tw-items-start tw-justify-between">
                <div>
                    <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                        <i className="fa-light fa-chart-user tw-mr-2"></i>
                        Issue Dashboard
                    </h1>
                    <p className="tw-text-gray-500 tw-mt-1">
                        Welcome back, {user?.firstName || user?.userName || 'User'}! Here's an overview
                        of your issues.
                    </p>
                </div>
                <div className="tw-flex tw-gap-2">
                    <Button
                        icon={showFollowedIssues ? 'fa-light fa-bell-on' : 'fa-light fa-bell'}
                        hint={showFollowedIssues ? 'Hide Followed Issues' : 'Show Followed Issues'}
                        type={showFollowedIssues ? 'success' : 'normal'}
                        stylingMode="outlined"
                        onClick={() => setShowFollowedIssues(!showFollowedIssues)}
                    />
                    <Button
                        text="Create Issue"
                        icon="fa-light fa-plus"
                        type="default"
                        stylingMode="contained"
                        className="tw-bg-blue-600 hover:tw-bg-blue-700"
                        onClick={() => navigate('/issue-tracker/create')}
                    />
                </div>
            </div>

            {/* Followed Issues Ticker */}
            {showFollowedIssues && (
                <div className="tw-mb-6">
                    <FollowedIssuesTicker
                        maxItems={8}
                        refreshInterval={60000}
                        showHeader={true}
                    />
                </div>
            )}

            {/* Filters Section */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-mb-6">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700">
                        <i className="fa-light fa-filter tw-mr-2"></i>Filters
                    </h3>
                    <Button
                        text="Clear All Filters"
                        icon="clear"
                        type="default"
                        stylingMode="text"
                        onClick={handleClearFilters}
                    />
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4">
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            Vehicle
                        </label>
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
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            Site
                        </label>
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
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            Category
                        </label>
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
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            Weeks Back
                        </label>
                        <SelectBox
                            dataSource={[
                                { value: null, text: 'All Time' },
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
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            Start Date
                        </label>
                        <DateBox
                            value={filters.startDate}
                            onValueChanged={(e) => handleFilterChange('startDate', e.value)}
                            showClearButton={true}
                            placeholder="From..."
                        />
                    </div>

                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
                            End Date
                        </label>
                        <DateBox
                            value={filters.endDate}
                            onValueChanged={(e) => handleFilterChange('endDate', e.value)}
                            showClearButton={true}
                            placeholder="To..."
                        />
                    </div>
                </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-6">
                <Button
                    text="Critical Issues"
                    icon="fa-light fa-exclamation-triangle"
                    type={filters.priorityFilter === 'Critical' ? 'danger' : 'normal'}
                    stylingMode={filters.priorityFilter === 'Critical' ? 'contained' : 'outlined'}
                    onClick={() => handlePriorityFilter('Critical')}
                />

                <Button
                    text="Open Issues"
                    icon="fa-light fa-folder-open"
                    type={filters.statusFilter === 'Open' ? 'default' : 'normal'}
                    stylingMode={filters.statusFilter === 'Open' ? 'contained' : 'outlined'}
                    onClick={() => handleStatusFilter('Open')}
                />

                <Button
                    text="In Progress"
                    icon="fa-light fa-spinner"
                    type={filters.statusFilter === 'In Progress' ? 'default' : 'normal'}
                    stylingMode={filters.statusFilter === 'In Progress' ? 'contained' : 'outlined'}
                    onClick={() => handleStatusFilter('In Progress')}
                />

                <Button
                    text="Unassigned"
                    icon="fa-light fa-user-slash"
                    type="normal"
                    stylingMode="outlined"
                    onClick={() => handleFilterChange('unassignedOnly', true)}
                />

                {stats.overdueIssues > 0 && (
                    <Button
                        text={`${stats.overdueIssues} Overdue`}
                        icon="fa-light fa-clock"
                        type="danger"
                        stylingMode="outlined"
                        onClick={() => handleFilterChange('overdueOnly', true)}
                    />
                )}
            </div>

            {/* Row 1: Overview Stats */}
            <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                    <i className="fa-light fa-chart-simple tw-mr-2"></i>Overview
                </h3>
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
                    <StatCard
                        title="Total Issues"
                        value={stats.totalIssues}
                        icon="fa-light fa-clipboard-list"
                        color="blue"
                        subtitle="All issues in system"
                    />
                    <StatCard
                        title="Open Issues"
                        value={stats.openCount}
                        icon="fa-light fa-folder-open"
                        color="orange"
                        subtitle="Requires attention"
                        onClick={() => handleStatusFilter('Open')}
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.inProgressCount}
                        icon="fa-light fa-spinner"
                        color="yellow"
                        subtitle="Being worked on"
                        onClick={() => handleStatusFilter('In Progress')}
                    />
                    <StatCard
                        title="Resolved Today"
                        value={stats.resolvedToday}
                        icon="fa-light fa-check-circle"
                        color="green"
                        subtitle="Completed today"
                    />
                </div>
            </div>

            {/* Row 2: Priority & Alerts */}
            <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                    <i className="fa-light fa-bell tw-mr-2"></i>Priority & Alerts
                </h3>
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
                    <StatCard
                        title="Critical"
                        value={stats.criticalCount}
                        icon="fa-light fa-exclamation-triangle"
                        color="red"
                        subtitle="Immediate attention"
                        onClick={() => handlePriorityFilter('Critical')}
                    />
                    <StatCard
                        title="High Priority"
                        value={stats.highCount}
                        icon="fa-light fa-chevron-up"
                        color="orange"
                        subtitle="High importance"
                        onClick={() => handlePriorityFilter('High')}
                    />
                    <StatCard
                        title="Overdue"
                        value={stats.overdueIssues}
                        icon="fa-light fa-clock"
                        color="red"
                        subtitle="Past due date"
                    />
                    <StatCard
                        title="Unassigned"
                        value={stats.unassignedIssues}
                        icon="fa-light fa-user-slash"
                        color="gray"
                        subtitle="Needs assignment"
                    />
                </div>
            </div>

            {/* Row 3: User-specific Stats */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
                {/* Assigned to Me */}
                <div>
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-user-check tw-mr-2"></i>Assigned to Me
                    </h3>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-4">
                        <StatCard
                            title="Total Assigned"
                            value={stats.totalAssigned}
                            icon="fa-light fa-clipboard-list"
                            color="blue"
                        />
                        <StatCard
                            title="My Closed"
                            value={stats.closedByMe}
                            icon="fa-light fa-check-circle"
                            color="green"
                        />
                        <StatCard
                            title="Awaiting Response"
                            value={stats.awaitingResponse}
                            icon="fa-light fa-hourglass-half"
                            color="purple"
                        />
                    </div>
                </div>

                {/* Opened by Me */}
                <div>
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-user-pen tw-mr-2"></i>Opened by Me
                    </h3>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-4">
                        <StatCard
                            title="Total Opened"
                            value={stats.totalOpenedByMe}
                            icon="fa-light fa-file-plus"
                            color="blue"
                        />
                        <StatCard
                            title="Still Open"
                            value={stats.openedByMeOpen}
                            icon="fa-light fa-folder-open"
                            color="yellow"
                        />
                        <StatCard
                            title="Resolved"
                            value={stats.openedByMeResolved}
                            icon="fa-light fa-check"
                            color="teal"
                        />
                    </div>
                </div>
            </div>

            {/* Row 4: Performance Metrics */}
            <div className="tw-mb-6">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                    <i className="fa-light fa-gauge-high tw-mr-2"></i>Performance Metrics
                </h3>
                <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
                    <StatCard
                        title="Avg Resolution Time"
                        value={formatTime(stats.averageResolutionTime)}
                        icon="fa-light fa-stopwatch"
                        color="purple"
                        subtitle="Time to resolve"
                    />
                    <StatCard
                        title="GPS Auto-Created"
                        value={stats.gpsGeneratedIssues}
                        icon="fa-light fa-satellite-dish"
                        color="blue"
                        subtitle="From GPS monitoring"
                    />
                    <StatCard
                        title="Created Today"
                        value={stats.createdToday}
                        icon="fa-light fa-plus-circle"
                        color="indigo"
                        subtitle="New issues today"
                    />
                    <StatCard
                        title="Opened by Me (Closed)"
                        value={stats.openedByMeClosed}
                        icon="fa-light fa-check-double"
                        color="green"
                        subtitle="My issues closed"
                    />
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4 tw-mb-6">
                <IssueActivityHeatmap
                    dates={allIssues.map((issue) => issue.openDate).filter(Boolean)}
                    weeks={52}
                    title={`${allIssues.length} issues in the last year`}
                    colorScheme="green"
                    showSummary={true}
                />
            </div>

            {/* Charts Section */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
                {/* Issues by Week Chart */}
                <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">
                        <i className="fa-light fa-chart-bar tw-mr-2"></i>Issues by Week
                    </h3>
                    {dashboardData?.issuesByWeek?.length > 0 ? (
                        <Chart dataSource={dashboardData.issuesByWeek} height={300}>
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
                            <PieTooltip
                                enabled={true}
                                customizeTooltip={(arg) => ({
                                    text: `${arg.argumentText}: ${arg.value} (${arg.percentText})`
                                })}
                            />
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

            {/* Issue Lists - Button Tab Selector (Similar to TransactionHub) */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
                {/* Tab Header with Button Selector */}
                <div className="tw-border-b tw-border-gray-200 tw-p-4">
                    <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-gap-4">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700">
                            <i className="fa-light fa-list-ul tw-mr-2"></i>Issue Lists
                        </h3>
                        {/* Tab Buttons */}
                        <div className="issue-dashboard__tab-buttons tw-flex tw-flex-wrap tw-gap-1">
                            {tabConfig.map((tab) => (
                                <Button
                                    key={tab.id}
                                    text={`${tab.label} (${tab.count})`}
                                    icon={tab.icon}
                                    type={selectedTab === tab.id ? 'default' : 'normal'}
                                    stylingMode={selectedTab === tab.id ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedTab(tab.id)}
                                    className={`issue-dashboard__tab-btn ${selectedTab === tab.id ? 'issue-dashboard__tab-btn--active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* DataGrid Content */}
                <div className="tw-p-4">
                    <DataGrid
                        dataSource={getTabDataSource()}
                        keyExpr="id"
                        showBorders={true}
                        showColumnLines={true}
                        showRowLines={true}
                        allowColumnResizing={true}
                        columnAutoWidth={true}
                        rowAlternationEnabled={true}
                        height={450}
                    >
                        <FilterPanel visible={true} />
                        <FilterRow visible={true} />
                        <HeaderFilter visible={true} />
                        <Sorting mode="multiple" />
                        <Scrolling mode="virtual" />
                        <Selection mode="multiple" />
                        <Paging enabled={true} defaultPageSize={20} />
                        <Pager
                            visible={true}
                            allowedPageSizes={[10, 20, 50, 100]}
                            displayMode="full"
                            showPageSizeSelector={true}
                            showInfo={true}
                            showNavigationButtons={true}
                        />

                        <Column dataField="id" caption="ID" width={70} defaultSortOrder="desc" />
                        <Column dataField="problemTitle" caption="Title" minWidth={200} />
                        <Column
                            dataField="priorityName"
                            caption="Priority"
                            width={100}
                            cellRender={renderPriorityCell}
                        />
                        <Column
                            dataField="statusName"
                            caption="Status"
                            width={120}
                            cellRender={renderStatusCell}
                        />
                        <Column dataField="categoryName" caption="Tags" width={150} />

                        {/* Columns with visibility based on selected tab */}
                        <Column
                            dataField="vehicleNumber"
                            caption="Vehicle"
                            width={120}
                            visible={selectedTab === 'assigned' || selectedTab === 'closed'}
                        />
                        <Column
                            dataField="siteName"
                            caption="Site"
                            width={150}
                            visible={selectedTab === 'assigned'}
                        />
                        <Column
                            dataField="assignToUserName"
                            caption="Assigned To"
                            width={150}
                            visible={selectedTab === 'opened'}
                        />
                        <Column
                            dataField="openbyUserName"
                            caption="Opened By"
                            width={150}
                            visible={selectedTab === 'closed'}
                        />
                        <Column
                            dataField="openDate"
                            caption="Opened"
                            width={110}
                            dataType="date"
                            format="shortDate"
                        />
                        <Column
                            dataField="dueDate"
                            caption="Due Date"
                            width={110}
                            dataType="date"
                            format="shortDate"
                            visible={selectedTab === 'assigned'}
                        />
                        <Column
                            dataField="closingDate"
                            caption="Closed"
                            width={110}
                            dataType="date"
                            format="shortDate"
                            visible={selectedTab === 'opened' || selectedTab === 'closed'}
                        />

                        <Summary>
                            <TotalItem
                                column="id"
                                summaryType="count"
                                displayFormat="Total Issues: {0}"
                            />
                        </Summary>
                    </DataGrid>
                </div>
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

export default CombinedIssueDashboard;
