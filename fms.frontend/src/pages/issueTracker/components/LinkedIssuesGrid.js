/**
 * File: LinkedIssuesGrid.js
 * Purpose: DataGrid component showing issues with the same template/category
 * Dependencies: React, DevExtreme DataGrid, issueTrackerService
 * Last Modified: 2026-02-10
 *
 * Key Components:
 * - LinkedIssuesGrid: Displays related issues in a data grid with navigation
 */
import React, { useEffect, useState, useCallback } from 'react';
import DataGrid, { Column, Paging, Pager, SearchPanel, Sorting } from 'devextreme-react/data-grid';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useNavigate } from 'react-router-dom';
import issueTrackerService from '../../../services/issueTrackerService';

const normalizeLinkedIssue = (issue) => {
    const statusDisplay = issue?.statusName
        || issue?.statusLabel
        || issue?.statusText
        || (typeof issue?.status === 'number' ? `Status ${issue.status}` : issue?.status)
        || 'Unknown';

    const priorityDisplay = issue?.priorityName
        || issue?.priorityLabel
        || issue?.priorityText
        || (typeof issue?.priority === 'number' ? `Priority ${issue.priority}` : issue?.priority)
        || 'Unknown';

    return {
        ...issue,
        titleDisplay: issue?.problemTitle || issue?.title || `Issue #${issue?.id ?? '-'}`,
        statusDisplay,
        priorityDisplay,
        assigneeDisplay: issue?.assignToUserName || issue?.assigneeName || 'Unassigned'
    };
};

const getStatusBadgeClass = (status) => {
    const statusMap = {
        'open': 'tw-bg-blue-100 tw-text-blue-800',
        'in progress': 'tw-bg-yellow-100 tw-text-yellow-800',
        'resolved': 'tw-bg-green-100 tw-text-green-800',
        'closed': 'tw-bg-gray-100 tw-text-gray-800',
        'pending': 'tw-bg-orange-100 tw-text-orange-800',
        'rejected': 'tw-bg-red-100 tw-text-red-800'
    };
    return statusMap[(status || '').toString().toLowerCase()] || 'tw-bg-gray-100 tw-text-gray-600';
};

const getPriorityBadgeClass = (priority) => {
    const priorityMap = {
        'critical': 'tw-bg-red-100 tw-text-red-800',
        'high': 'tw-bg-orange-100 tw-text-orange-800',
        'medium': 'tw-bg-yellow-100 tw-text-yellow-800',
        'low': 'tw-bg-green-100 tw-text-green-800'
    };
    return priorityMap[(priority || '').toString().toLowerCase()] || 'tw-bg-gray-100 tw-text-gray-600';
};

const LinkedIssuesGrid = ({ issueId, currentIssue }) => {
    const navigate = useNavigate();
    const [linkedIssues, setLinkedIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLinkedIssues = useCallback(async () => {
        if (!issueId) return;

        try {
            setLoading(true);
            const data = await issueTrackerService.getLinkedIssues(issueId);
            // Filter out the current issue from linked issues
            const filtered = (data || [])
                .filter(issue => issue.id !== Number(issueId))
                .map(normalizeLinkedIssue);
            setLinkedIssues(filtered);
        } catch (error) {
            console.error('Failed to load linked issues:', error);
            setLinkedIssues([]);
        } finally {
            setLoading(false);
        }
    }, [issueId]);

    useEffect(() => {
        loadLinkedIssues();
    }, [loadLinkedIssues]);

    const handleRowClick = (e) => {
        if (e.data?.id) {
            navigate(`/issue-tracker/details/${e.data.id}`);
        }
    };

    const statusCellRender = (cellData) => (
        <span className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${getStatusBadgeClass(cellData.value)}`}>
            {cellData.value}
        </span>
    );

    const priorityCellRender = (cellData) => (
        <span className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${getPriorityBadgeClass(cellData.value)}`}>
            {cellData.value}
        </span>
    );

    const dateCellRender = (cellData) => {
        if (!cellData.value) return '-';
        const date = new Date(cellData.value);
        if (Number.isNaN(date.getTime())) return cellData.value;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                <LoadIndicator />
                <span className="tw-ml-3 tw-text-gray-500">Loading linked issues...</span>
            </div>
        );
    }

    if (linkedIssues.length === 0) {
        return (
            <div className="tw-text-center tw-py-12">
                <i className="fa-light fa-link-slash tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
                <p className="tw-text-gray-500">No linked issues found.</p>
                {currentIssue?.templateName && (
                    <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                        (Issues using the same template: {currentIssue.templateName})
                    </p>
                )}
            </div>
        );
    }

    return (
        <div>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                Showing {linkedIssues.length} issue{linkedIssues.length !== 1 ? 's' : ''}
                {currentIssue?.templateName && (
                    <span> using template: <span className="tw-font-medium">{currentIssue.templateName}</span></span>
                )}
            </p>
            <DataGrid
                dataSource={linkedIssues}
                keyExpr="id"
                showBorders={true}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                onRowClick={handleRowClick}
                columnAutoWidth={true}
                className="tw-cursor-pointer"
            >
                <SearchPanel visible={true} width={200} placeholder="Search issues..." />
                <Sorting mode="multiple" />
                <Paging defaultPageSize={10} />
                <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />

                <Column dataField="id" caption="ID" width={70} alignment="center" />
                <Column dataField="titleDisplay" caption="Title" minWidth={220} />
                <Column dataField="statusDisplay" caption="Status" width={140} cellRender={statusCellRender} />
                <Column dataField="priorityDisplay" caption="Priority" width={130} cellRender={priorityCellRender} />
                <Column dataField="assigneeDisplay" caption="Assignee" width={180} />
                <Column dataField="dueDate" caption="Due Date" width={120} cellRender={dateCellRender} />
            </DataGrid>
        </div>
    );
};

export default LinkedIssuesGrid;
