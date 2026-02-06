/**
 * File: IssueActivityStream.js
 * Purpose: Activity stream component showing timeline of issue changes
 * Dependencies: React, issueTrackerService
 * Last Modified: 2026-02-05
 *
 * Key Components:
 * - IssueActivityStream: Displays chronological activity log with icons and timestamps
 */
import React, { useEffect, useState, useCallback } from 'react';
import LoadIndicator from 'devextreme-react/load-indicator';
import issueTrackerService from '../../../services/issueTrackerService';

const formatActivityDate = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show relative time for recent activities
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Show absolute time for older activities
    return date.toLocaleString('en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const formatTimeOnly = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toLowerCase();
};

const getActivityIcon = (activityType) => {
    const iconMap = {
        'Created': { icon: 'fa-light fa-circle-plus', color: 'tw-text-green-600', bg: 'tw-bg-green-100' },
        'Updated': { icon: 'fa-light fa-pen-to-square', color: 'tw-text-blue-600', bg: 'tw-bg-blue-100' },
        'StatusChanged': { icon: 'fa-light fa-arrow-right-arrow-left', color: 'tw-text-purple-600', bg: 'tw-bg-purple-100' },
        'PriorityChanged': { icon: 'fa-light fa-arrow-up', color: 'tw-text-orange-600', bg: 'tw-bg-orange-100' },
        'Assigned': { icon: 'fa-light fa-user-check', color: 'tw-text-indigo-600', bg: 'tw-bg-indigo-100' },
        'ReminderSet': { icon: 'fa-light fa-bell', color: 'tw-text-yellow-600', bg: 'tw-bg-yellow-100' },
        'TagsUpdated': { icon: 'fa-light fa-tags', color: 'tw-text-pink-600', bg: 'tw-bg-pink-100' },
        'Closed': { icon: 'fa-light fa-circle-check', color: 'tw-text-gray-600', bg: 'tw-bg-gray-100' },
        'Reopened': { icon: 'fa-light fa-rotate-left', color: 'tw-text-amber-600', bg: 'tw-bg-amber-100' }
    };
    return iconMap[activityType] || { icon: 'fa-light fa-clock', color: 'tw-text-gray-500', bg: 'tw-bg-gray-100' };
};

const parseDescription = (description) => {
    if (!description) return { userName: '', action: description };

    // Pattern: "Username has ActionVerb FieldName from OldValue to NewValue"
    const match = description.match(/^(.+?)\s+has\s+(.+)$/);
    if (match) {
        return { userName: match[1], action: `has ${match[2]}` };
    }
    return { userName: '', action: description };
};

const IssueActivityStream = ({ issueId, onRefresh }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadActivities = useCallback(async () => {
        if (!issueId) return;

        try {
            setLoading(true);
            const data = await issueTrackerService.getIssueActivities(issueId);
            setActivities(data || []);
        } catch (error) {
            console.error('Failed to load activities:', error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [issueId]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    // Expose refresh function to parent
    useEffect(() => {
        if (onRefresh) {
            onRefresh(loadActivities);
        }
    }, [onRefresh, loadActivities]);

    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                <LoadIndicator />
                <span className="tw-ml-3 tw-text-gray-500">Loading activity stream...</span>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="tw-text-center tw-py-12">
                <i className="fa-light fa-clock-rotate-left tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
                <p className="tw-text-gray-500">No activity recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="tw-relative">
            {/* Timeline line */}
            <div className="tw-absolute tw-left-4 tw-top-0 tw-bottom-0 tw-w-0.5 tw-bg-gray-200" style={{ marginLeft: '11px' }}></div>

            <div className="tw-space-y-0">
                {activities.map((activity, index) => {
                    const { icon, color, bg } = getActivityIcon(activity.activityType);
                    const { userName, action } = parseDescription(activity.description);
                    const timeStr = formatTimeOnly(activity.activityDate);

                    return (
                        <div key={activity.id || index} className="tw-relative tw-flex tw-items-start tw-gap-4 tw-py-3 tw-pl-0">
                            {/* Timeline dot */}
                            <div className={`tw-relative tw-z-10 tw-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-rounded-full ${bg} ${color}`}>
                                <i className={icon}></i>
                            </div>

                            {/* Content */}
                            <div className="tw-flex-1 tw-min-w-0">
                                <div className="tw-flex tw-items-baseline tw-gap-2">
                                    <span className="tw-text-sm tw-text-gray-500">{timeStr}</span>
                                </div>
                                <p className="tw-text-sm tw-text-gray-700 tw-mt-0.5">
                                    {userName && <span className="tw-font-medium tw-text-gray-900">{userName} </span>}
                                    <span dangerouslySetInnerHTML={{
                                        __html: action
                                            .replace(/from\s+(\S+)/g, 'from <span class="tw-font-semibold tw-text-red-600">$1</span>')
                                            .replace(/to\s+(\S+)/g, 'to <span class="tw-font-semibold tw-text-green-600">$1</span>')
                                    }} />
                                </p>
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">{formatActivityDate(activity.activityDate)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default IssueActivityStream;
