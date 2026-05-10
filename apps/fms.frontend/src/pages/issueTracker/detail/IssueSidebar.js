/**
 * File: IssueSidebar.js
 * Purpose: Left sidebar displaying a scrollable list of issues for quick navigation
 * Dependencies: React, react-router-dom, issueTrackerService, issueDetailUtils
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - IssueSidebar: Fetches issues and renders a compact navigable list
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import issueTrackerService from '../../../services/issueTrackerService';
import { normalizeIssueListResponse } from './issueDetailUtils';

const SIDEBAR_PAGE_SIZE = 50;

/**
 * Compact issue list item for sidebar
 */
const SidebarIssueItem = React.memo(({ issue, isActive, onClick }) => {
    const priorityDot = useMemo(() => {
        const name = (issue.priorityName || '').toLowerCase();
        if (name.includes('critical')) return 'tw-bg-red-500';
        if (name.includes('high')) return 'tw-bg-orange-500';
        if (name.includes('medium')) return 'tw-bg-yellow-500';
        if (name.includes('low')) return 'tw-bg-green-500';
        return 'tw-bg-gray-400';
    }, [issue.priorityName]);

    const statusStyle = useMemo(() => {
        const name = (issue.statusName || '').toLowerCase();
        if (name.includes('closed')) return 'issue-sidebar__badge--closed';
        if (name.includes('complete') || name.includes('resolved')) return 'issue-sidebar__badge--complete';
        if (name.includes('progress') || name.includes('active')) return 'issue-sidebar__badge--active';
        return 'issue-sidebar__badge--open';
    }, [issue.statusName]);

    return (
        <button
            type="button"
            className={`issue-sidebar__item ${isActive ? 'issue-sidebar__item--active' : ''}`}
            onClick={onClick}
            title={issue.problemTitle}
        >
            <div className="issue-sidebar__item-top">
                <span className="issue-sidebar__item-id">#{issue.id}</span>
                <span className={`issue-sidebar__item-dot ${priorityDot}`}></span>
            </div>
            <div className="issue-sidebar__item-title">
                {issue.problemTitle || 'Untitled Issue'}
            </div>
            <div className="issue-sidebar__item-meta">
                <span className={`issue-sidebar__badge ${statusStyle}`}>
                    {issue.statusName || '\u2014'}
                </span>
            </div>
        </button>
    );
});

SidebarIssueItem.displayName = 'SidebarIssueItem';

const IssueSidebar = ({ currentIssueId, onCollapseChange }) => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = useCallback((value) => {
        setCollapsed(value);
        onCollapseChange?.(value);
    }, [onCollapseChange]);

    const loadIssues = useCallback(async () => {
        try {
            setLoading(true);
            const response = await issueTrackerService.getIssues({ pageSize: SIDEBAR_PAGE_SIZE });
            const list = normalizeIssueListResponse(response);
            setIssues(list);
        } catch (err) {
            console.error('[IssueSidebar] Failed to load issues:', err);
            setIssues([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadIssues();
    }, [loadIssues]);

    const filteredIssues = useMemo(() => {
        if (!searchText.trim()) return issues;
        const q = searchText.toLowerCase();
        return issues.filter((iss) =>
            (iss.problemTitle || '').toLowerCase().includes(q)
            || String(iss.id).includes(q)
            || (iss.assignToUserName || '').toLowerCase().includes(q)
            || (iss.statusName || '').toLowerCase().includes(q)
        );
    }, [issues, searchText]);

    const handleNavigate = useCallback(
        (issueId) => {
            navigate(`/issue-tracker/details/${issueId}`);
        },
        [navigate]
    );

    if (collapsed) {
        return (
            <aside className="issue-sidebar issue-sidebar--collapsed">
                <button
                    type="button"
                    className="issue-sidebar__toggle"
                    onClick={() => toggleCollapse(false)}
                    title="Expand issue list"
                >
                    <i className="fa-light fa-chevron-right"></i>
                </button>
            </aside>
        );
    }

    return (
        <aside className="issue-sidebar">
            <div className="issue-sidebar__header">
                <h3 className="issue-sidebar__heading">
                    <i className="fa-light fa-layer-group tw-mr-1.5"></i>
                    Issues
                </h3>
                <button
                    type="button"
                    className="issue-sidebar__toggle"
                    onClick={() => toggleCollapse(true)}
                    title="Collapse issue list"
                >
                    <i className="fa-light fa-chevron-left"></i>
                </button>
            </div>

            <div className="issue-sidebar__search">
                <i className="fa-light fa-search issue-sidebar__search-icon"></i>
                <input
                    type="text"
                    className="issue-sidebar__search-input"
                    placeholder={"Filter issues\u2026"}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                {searchText && (
                    <button
                        type="button"
                        className="issue-sidebar__search-clear"
                        onClick={() => setSearchText('')}
                    >
                        <i className="fa-light fa-times"></i>
                    </button>
                )}
            </div>

            <div className="issue-sidebar__list">
                {loading ? (
                    <div className="issue-sidebar__loading">
                        <i className="fa-light fa-spinner-third fa-spin tw-mr-2"></i>
                        {"Loading\u2026"}
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="issue-sidebar__empty">
                        <i className="fa-light fa-inbox tw-text-lg tw-mb-1"></i>
                        <span>{searchText ? 'No matching issues' : 'No issues found'}</span>
                    </div>
                ) : (
                    filteredIssues.map((iss) => (
                        <SidebarIssueItem
                            key={iss.id}
                            issue={iss}
                            isActive={String(iss.id) === String(currentIssueId)}
                            onClick={() => handleNavigate(iss.id)}
                        />
                    ))
                )}
            </div>

            <div className="issue-sidebar__footer">
                <span className="issue-sidebar__count">
                    {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
                </span>
                <button
                    type="button"
                    className="issue-sidebar__view-all"
                    onClick={() => navigate('/issue-tracker/tickets')}
                >
                    View all <i className="fa-light fa-arrow-right tw-ml-1"></i>
                </button>
            </div>
        </aside>
    );
};

export default IssueSidebar;
