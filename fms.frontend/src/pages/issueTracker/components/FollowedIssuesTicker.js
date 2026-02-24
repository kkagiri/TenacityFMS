/**
 * File: FollowedIssuesTicker.js
 * Purpose: Horizontal ticker bar showing followed issues with live indicator and hide button
 * Dependencies: React, issueTrackerService
 * Last Modified: 2026-02-23
 *
 * Key Features:
 * - Horizontal scrolling bar with compact issue chips
 * - Green "Live" indicator with auto-refresh
 * - Click chip to navigate to issue detail
 * - "Hide ×" button to dismiss the ticker
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import issueTrackerService from '../../../services/issueTrackerService';

const STATUS_BADGE = {
    Open: { bg: '#EBF5FF', color: '#0078D4', label: 'Open' },
    'In Progress': { bg: '#FFF8E1', color: '#CA8A04', label: 'In Progress' },
    Pending: { bg: '#FFF3E0', color: '#E65100', label: 'Pending' },
    Resolved: { bg: '#E8F5E9', color: '#2E7D32', label: 'Resolved' },
    Closed: { bg: '#F5F5F5', color: '#616161', label: 'Closed' },
};

const PRIORITY_BADGE = {
    Critical: { bg: '#FDECEC', color: '#D13438', label: 'Critical' },
    High: { bg: '#FDECEC', color: '#D13438', label: 'High' },
    Medium: { bg: '#FFF8E1', color: '#CA8A04', label: 'Medium' },
    Low: { bg: '#E8F5E9', color: '#2E7D32', label: 'Low' },
};

const getBadge = (map, key) => map[key] || { bg: '#F5F5F5', color: '#616161', label: key || '' };

const FollowedIssuesTicker = ({
    maxItems = 10,
    refreshInterval = 60000,
    onIssueClick = null,
    onHide = null,
}) => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFollowedIssues = useCallback(async () => {
        try {
            const data = await issueTrackerService.getFollowedIssues(maxItems);
            setIssues(data || []);
        } catch (err) {
            console.error('Error loading followed issues:', err);
        } finally {
            setLoading(false);
        }
    }, [maxItems]);

    useEffect(() => {
        loadFollowedIssues();
        const interval = setInterval(loadFollowedIssues, refreshInterval);
        return () => clearInterval(interval);
    }, [loadFollowedIssues, refreshInterval]);

    const handleIssueClick = (issue) => {
        if (onIssueClick) {
            onIssueClick(issue);
        } else {
            navigate(`/issue-tracker/details/${issue.issueId}`);
        }
    };

    /* ── Horizontal scroll via mouse wheel ── */
    const handleWheel = useCallback((e) => {
        if (scrollRef.current) {
            e.preventDefault();
            scrollRef.current.scrollLeft += e.deltaY;
        }
    }, []);

    /* ── Loading state ── */
    if (loading && issues.length === 0) {
        return (
            <div className="fms-ticker">
                <div className="fms-ticker__label">
                    <span className="fms-ticker__dot fms-ticker__dot--loading"></span>
                    <span>Followed Issues</span>
                    <span className="fms-ticker__live">Loading…</span>
                </div>
            </div>
        );
    }

    /* ── Empty state ── */
    if (issues.length === 0) {
        return (
            <div className="fms-ticker">
                <div className="fms-ticker__label">
                    <span className="fms-ticker__dot"></span>
                    <span>Followed Issues</span>
                </div>
                <div className="fms-ticker__empty">
                    <i className="fa-light fa-bell-slash"></i>
                    <span>No followed issues</span>
                </div>
                {onHide && (
                    <button className="fms-ticker__hide" onClick={onHide} title="Hide ticker">
                        Hide <i className="fa-light fa-xmark"></i>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="fms-ticker">
            {/* ── Left: Live label ── */}
            <div className="fms-ticker__label">
                <span className="fms-ticker__dot"></span>
                <span>Followed Issues</span>
                <span className="fms-ticker__live">· Live</span>
            </div>

            {/* ── Centre: Horizontally scrolling issue chips ── */}
            <div
                className="fms-ticker__track"
                ref={scrollRef}
                onWheel={handleWheel}
            >
                {issues.map((issue) => {
                    const status = getBadge(STATUS_BADGE, issue.status);
                    const priority = getBadge(PRIORITY_BADGE, issue.priority);

                    return (
                        <button
                            key={issue.issueId}
                            className="fms-ticker__chip"
                            onClick={() => handleIssueClick(issue)}
                            title={issue.title || 'Untitled Issue'}
                        >
                            <span className="fms-ticker__chip-id">
                                {issue.issueNumber || `#${issue.issueId}`}
                            </span>
                            <span className="fms-ticker__chip-title">
                                {issue.title || 'Untitled Issue'}
                            </span>
                            <span
                                className="fms-ticker__chip-badge"
                                style={{ backgroundColor: status.bg, color: status.color }}
                            >
                                {status.label}
                            </span>
                            {(issue.priority === 'Critical' || issue.priority === 'High') && (
                                <span
                                    className="fms-ticker__chip-badge"
                                    style={{ backgroundColor: priority.bg, color: priority.color }}
                                >
                                    {priority.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Right: Hide button ── */}
            {onHide && (
                <button className="fms-ticker__hide" onClick={onHide} title="Hide ticker">
                    Hide <i className="fa-light fa-xmark"></i>
                </button>
            )}
        </div>
    );
};

export default FollowedIssuesTicker;
