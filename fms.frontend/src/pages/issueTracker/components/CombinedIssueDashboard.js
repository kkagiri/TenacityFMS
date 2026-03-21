/**
 * File: CombinedIssueDashboard.js
 * Purpose: Fluent/M365-style Issue Dashboard â€” orchestrates sub-sections
 * Dependencies: issueTrackerService, Redux, sub-components
 * Last Modified: 2026-02-23
 *
 * Sub-components:
 * - DashboardFilterSection  : filter card + quick pills
 * - DashboardStatCards      : overview / priority / user / performance stats
 * - DashboardCharts         : heatmap + 4 charts
 * - DashboardIssueGrid      : tabbed data grid
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoadIndicator from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';
import FollowedIssuesTicker from './FollowedIssuesTicker';
import DashboardFilterSection from './DashboardFilterSection';
import DashboardStatCards from './DashboardStatCards';
import DashboardCharts from './DashboardCharts';
import DashboardIssueGrid from './DashboardIssueGrid';
import ModuleDashboard from '../../../components/dashboard/ModuleDashboard';
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
            priorityFilter: prev.priorityFilter === priority ? null : priority,
            statusFilter: null,
            unassignedOnly: false,
            overdueOnly: false
        }));
    }, []);

    const handleStatusFilter = useCallback((status) => {
        setFilters((prev) => ({
            ...prev,
            statusFilter: prev.statusFilter === status ? null : status,
            priorityFilter: null,
            unassignedOnly: false,
            overdueOnly: false
        }));
    }, []);

    const handleOverdueFilter = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            overdueOnly: !prev.overdueOnly,
            priorityFilter: null,
            statusFilter: null,
            unassignedOnly: false
        }));
    }, []);

    const handleUnassignedFilter = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            unassignedOnly: !prev.unassignedOnly,
            priorityFilter: null,
            statusFilter: null,
            overdueOnly: false
        }));
    }, []);

    const handleResolvedTodayFilter = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            statusFilter: prev.statusFilter === 'Resolved' ? null : 'Resolved',
            priorityFilter: null,
            unassignedOnly: false,
            overdueOnly: false
        }));
    }, []);

    const handleClearQuickFilters = useCallback(() => {
        setFilters((prev) => ({
            ...prev,
            priorityFilter: null,
            statusFilter: null,
            unassignedOnly: false,
            overdueOnly: false
        }));
    }, []);

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

    // â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (loading && !dashboardData) {
        return (
            <div className="fms-dashboard-loading">
                <LoadIndicator visible={true} />
                <span>Loading your dashboardâ€¦</span>
            </div>
        );
    }

    // â”€â”€ Error state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (error && !dashboardData) {
        return (
            <div className="fms-dashboard-error">
                <i className="fa-light fa-circle-exclamation"></i>
                <p>{error}</p>
                <Button text="Retry" type="default" onClick={loadDashboardData} />
            </div>
        );
    }

    return (
        <div className="fms-dashboard">
            {/* â”€â”€ Page Header â”€â”€ */}
            <div className="fms-page-hd">
                <div>
                    <h1>Issue Dashboard</h1>
                    <p>Welcome back, {user?.firstName || user?.userName || 'User'}! Here's an overview of your issues.</p>
                </div>
                <div className="fms-btn-grp">
                    <button
                        className={`fms-btn ${showFollowedIssues ? 'fms-btn--active-blue' : ''}`}
                        onClick={() => setShowFollowedIssues(!showFollowedIssues)}
                    >
                        <i className={`fa-light ${showFollowedIssues ? 'fa-bell-on' : 'fa-bell'}`}></i>
                        Followed Issues
                    </button>
                    <button
                        className="fms-btn fms-btn--primary"
                        onClick={() => navigate('/issue-tracker/create')}
                    >
                        <i className="fa-light fa-plus"></i>
                        Create Issue
                    </button>
                </div>
            </div>

            {/* ── Followed Issues Ticker ── */}
            {showFollowedIssues && (
                <FollowedIssuesTicker
                    maxItems={8}
                    refreshInterval={60000}
                    onHide={() => setShowFollowedIssues(false)}
                />
            )}

            {/* â”€â”€ Filters + Quick Pills â”€â”€ */}
            <DashboardFilterSection
                filters={filters}
                vehicles={vehicles}
                sites={sites}
                categories={categories}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
            />

            {/* Standardized Widget Dashboard */}
            <div className=”fms-dashboard-section” style={{ marginBottom: 24 }}>
                <ModuleDashboard
                    moduleId=”issue_tracker”
                    title=”Issue Tracker Dashboard”
                    icon=”fa-solid fa-bug”
                    subtitle=”Widget-based issue analytics — add, resize, and rearrange widgets”
                />
            </div>

            {/* â”€â”€ Stat Cards (all sections) â”€â”€ */}
            <DashboardStatCards
                stats={stats}
                formatTime={formatTime}
                onPriorityFilter={handlePriorityFilter}
                onStatusFilter={handleStatusFilter}                onOverdueFilter={handleOverdueFilter}
                onUnassignedFilter={handleUnassignedFilter}
                onResolvedTodayFilter={handleResolvedTodayFilter}
                onClearQuickFilters={handleClearQuickFilters}
                onTabSwitch={setSelectedTab}            />

            {/* â”€â”€ Charts â”€â”€ */}
            <DashboardCharts dashboardData={dashboardData} allIssues={normalizedAllIssues} />

            {/* â”€â”€ Issue Data Grid â”€â”€ */}
            <DashboardIssueGrid
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                tabConfig={tabConfig}
                getTabDataSource={getTabDataSource}
                navigate={navigate}
            />

            {/* â”€â”€ Updating overlay â”€â”€ */}
            {loading && dashboardData && (
                <div className="fms-updating-overlay">
                    <div className="fms-updating-overlay__box">
                        <LoadIndicator visible={true} />
                        <span>Updatingâ€¦</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombinedIssueDashboard;
