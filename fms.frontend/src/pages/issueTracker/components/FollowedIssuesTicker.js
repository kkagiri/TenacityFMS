/**
 * File: FollowedIssuesTicker.js
 * Purpose: Dashboard widget displaying followed issues with recent activity summary
 * Dependencies: React, DevExtreme, issueTrackerService
 * Last Modified: 2026-02-05
 *
 * Key Features:
 * - Shows issues the user is following
 * - Displays recent activity count and last activity
 * - Click to navigate to issue detail
 * - Auto-refresh on interval
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import issueTrackerService from '../../../services/issueTrackerService';

const STATUS_COLORS = {
    Open: 'tw-bg-blue-100 tw-text-blue-800',
    'In Progress': 'tw-bg-yellow-100 tw-text-yellow-800',
    Pending: 'tw-bg-orange-100 tw-text-orange-800',
    Resolved: 'tw-bg-green-100 tw-text-green-800',
    Closed: 'tw-bg-gray-100 tw-text-gray-800',
    default: 'tw-bg-gray-100 tw-text-gray-600'
};

const PRIORITY_ICONS = {
    High: { icon: 'fa-arrow-up', color: 'tw-text-red-500' },
    Critical: { icon: 'fa-triangle-exclamation', color: 'tw-text-red-600' },
    Medium: { icon: 'fa-minus', color: 'tw-text-yellow-500' },
    Low: { icon: 'fa-arrow-down', color: 'tw-text-green-500' },
    default: { icon: 'fa-circle', color: 'tw-text-gray-400' }
};

const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.default;
const getPriorityStyle = (priority) => PRIORITY_ICONS[priority] || PRIORITY_ICONS.default;

const formatRelativeTime = (dateString) => {
    if (!dateString) return 'No activity';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const FollowedIssuesTicker = ({
    maxItems = 10,
    refreshInterval = 60000, // 1 minute
    showHeader = true,
    onIssueClick = null
}) => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadFollowedIssues = useCallback(async () => {
        try {
            const data = await issueTrackerService.getFollowedIssues(maxItems);
            setIssues(data || []);
            setError(null);
        } catch (err) {
            console.error('Error loading followed issues:', err);
            setError('Failed to load followed issues');
        } finally {
            setLoading(false);
        }
    }, [maxItems]);

    useEffect(() => {
        loadFollowedIssues();

        // Set up auto-refresh
        const interval = setInterval(loadFollowedIssues, refreshInterval);
        return () => clearInterval(interval);
    }, [loadFollowedIssues, refreshInterval]);

    const handleIssueClick = (issue) => {
        if (onIssueClick) {
            onIssueClick(issue);
        } else {
            navigate(`/issuetracker/view/${issue.issueId}`);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        loadFollowedIssues();
    };

    if (loading && issues.length === 0) {
        return (
            <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
                {showHeader && (
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                            <i className="fa-light fa-bell tw-mr-2 tw-text-blue-500"></i>
                            Followed Issues
                        </h3>
                    </div>
                )}
                <div className="tw-flex tw-justify-center tw-py-8">
                    <LoadIndicator height={30} width={30} />
                </div>
            </div>
        );
    }

    return (
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 followed-issues-ticker">
            {showHeader && (
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-bell tw-mr-2 tw-text-blue-500"></i>
                        Followed Issues
                        {issues.length > 0 && (
                            <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-gray-500">
                                ({issues.length})
                            </span>
                        )}
                    </h3>
                    <Button
                        icon="fa-light fa-refresh"
                        stylingMode="text"
                        onClick={handleRefresh}
                        disabled={loading}
                        hint="Refresh"
                    />
                </div>
            )}

            {error && (
                <div className="tw-text-center tw-py-4 tw-text-red-500">
                    <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                    {error}
                </div>
            )}

            {!error && issues.length === 0 && (
                <div className="tw-text-center tw-py-8 tw-text-gray-500">
                    <i className="fa-light fa-bell-slash tw-text-3xl tw-mb-2 tw-block"></i>
                    <p className="tw-text-sm">You're not following any issues</p>
                    <p className="tw-text-xs tw-mt-1">Follow issues to receive activity notifications</p>
                </div>
            )}

            {issues.length > 0 && (
                <div className="tw-space-y-2 tw-max-h-96 tw-overflow-y-auto">
                    {issues.map((issue) => {
                        const priorityStyle = getPriorityStyle(issue.priority);
                        const statusColor = getStatusColor(issue.status);

                        return (
                            <div
                                key={issue.issueId}
                                className="tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors"
                                onClick={() => handleIssueClick(issue)}
                            >
                                <div className="tw-flex tw-items-start tw-justify-between tw-gap-2">
                                    <div className="tw-flex-1 tw-min-w-0">
                                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                                            <span className="tw-text-xs tw-text-gray-500">
                                                #{issue.issueNumber || issue.issueId}
                                            </span>
                                            <span className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${statusColor}`}>
                                                {issue.status}
                                            </span>
                                            <i className={`fa-light ${priorityStyle.icon} ${priorityStyle.color} tw-text-xs`}></i>
                                        </div>
                                        <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-truncate">
                                            {issue.title || 'Untitled Issue'}
                                        </p>
                                        {issue.lastActivityDescription && (
                                            <p className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-truncate">
                                                {issue.lastActivityDescription}
                                            </p>
                                        )}
                                    </div>
                                    <div className="tw-text-right tw-flex-shrink-0">
                                        {issue.recentActivityCount > 0 && (
                                            <span className="tw-inline-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-bg-blue-500 tw-text-white tw-text-xs tw-rounded-full tw-mb-1">
                                                {issue.recentActivityCount > 9 ? '9+' : issue.recentActivityCount}
                                            </span>
                                        )}
                                        <p className="tw-text-xs tw-text-gray-400">
                                            {formatRelativeTime(issue.lastActivityDate)}
                                        </p>
                                    </div>
                                </div>
                                {issue.dueDate && (
                                    <div className="tw-mt-2 tw-text-xs tw-text-gray-500">
                                        <i className="fa-light fa-calendar tw-mr-1"></i>
                                        Due: {new Date(issue.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FollowedIssuesTicker;
