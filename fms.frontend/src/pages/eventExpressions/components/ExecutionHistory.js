/**
 * File: ExecutionHistory.js
 * Purpose: Displays execution log for a specific Event Expression. Shows when it
 *          was evaluated, whether it triggered, suppression reasons, and linked data.
 * Dependencies: react-redux, react-router-dom, devextreme-react, eventExpressionSlice
 * Last Modified: 2026-02-06
 *
 * Key Features:
 * - Paginated execution log table
 * - Trigger result badges (triggered / not triggered / suppressed)
 * - Event data preview
 * - Notification link
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    Sorting,
    LoadPanel
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import {
    fetchEventExpressionById,
    fetchExecutionHistory,
    clearExecutions,
    clearSelectedExpression
} from '../../../redux/slices/eventExpressionSlice';
import './ExecutionHistory.scss';

const ExecutionHistory = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const expressionId = parseInt(id);

    const {
        selectedExpression,
        selectedLoading,
        executions,
        executionsLoading
    } = useSelector((state) => state.eventExpressions);

    const [page, setPage] = useState(1);
    const pageSize = 25;

    // Load expression info and execution history
    useEffect(() => {
        if (expressionId) {
            dispatch(fetchEventExpressionById(expressionId));
            dispatch(
                fetchExecutionHistory({
                    expressionId,
                    params: { page, pageSize }
                })
            );
        }
        return () => {
            dispatch(clearExecutions());
            dispatch(clearSelectedExpression());
        };
    }, [dispatch, expressionId, page, pageSize]);

    const handleBack = useCallback(() => {
        navigate('/event-expressions');
    }, [navigate]);

    const handleRefresh = useCallback(() => {
        dispatch(
            fetchExecutionHistory({
                expressionId,
                params: { page, pageSize }
            })
        );
    }, [dispatch, expressionId, page, pageSize]);

    // Render cells
    const renderTriggeredCell = useCallback((cellData) => {
        const { wasTriggered, suppressedReason } = cellData.data;
        if (suppressedReason) {
            return (
                <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-yellow-100 tw-text-yellow-800">
                    <i className="fa-light fa-ban tw-mr-1" />
                    Suppressed
                </span>
            );
        }
        if (wasTriggered) {
            return (
                <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-red-100 tw-text-red-800">
                    <i className="fa-light fa-bolt tw-mr-1" />
                    Triggered
                </span>
            );
        }
        return (
            <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-green-100 tw-text-green-800">
                <i className="fa-light fa-check tw-mr-1" />
                Not Triggered
            </span>
        );
    }, []);

    const renderSuccessCell = useCallback((cellData) => {
        const success = cellData.value;
        if (success === true || success === 1) {
            return (
                <span className="tw-text-green-600">
                    <i className="fa-light fa-check-circle" />
                </span>
            );
        }
        if (success === false || success === 0) {
            return (
                <span className="tw-text-red-600">
                    <i className="fa-light fa-times-circle" />
                </span>
            );
        }
        return <span className="tw-text-gray-400">—</span>;
    }, []);

    const renderDateCell = useCallback((cellData) => {
        if (!cellData.value) return <span className="tw-text-gray-400">—</span>;
        const date = new Date(cellData.value);
        return (
            <span className="tw-text-sm">
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
        );
    }, []);

    const renderEventDataCell = useCallback((cellData) => {
        const data = cellData.value;
        if (!data) return <span className="tw-text-gray-400">—</span>;
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            const preview = JSON.stringify(parsed).substring(0, 80);
            return (
                <span
                    className="tw-text-xs tw-text-gray-600 tw-font-mono tw-truncate tw-block tw-max-w-xs"
                    title={JSON.stringify(parsed, null, 2)}
                >
                    {preview}
                    {JSON.stringify(parsed).length > 80 ? '...' : ''}
                </span>
            );
        } catch {
            return <span className="tw-text-xs tw-text-gray-500">{String(data).substring(0, 80)}</span>;
        }
    }, []);

    const renderExecutionTimeCell = useCallback((cellData) => {
        const ms = cellData.value;
        if (ms == null) return <span className="tw-text-gray-400">—</span>;
        if (ms < 100) {
            return <span className="tw-text-green-600 tw-text-sm">{ms}ms</span>;
        }
        if (ms < 500) {
            return <span className="tw-text-yellow-600 tw-text-sm">{ms}ms</span>;
        }
        return <span className="tw-text-red-600 tw-text-sm">{ms}ms</span>;
    }, []);

    if (selectedLoading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator visible={true} />
            </div>
        );
    }

    return (
        <div className="execution-history tw-p-4">
            {/* Header */}
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
                        <i className="fa-light fa-clock-rotate-left tw-mr-2" />
                        Execution History
                    </h2>
                    {selectedExpression && (
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            <span className="tw-font-medium">{selectedExpression.name}</span>
                            {' — '}
                            <span className="tw-text-gray-400">
                                {selectedExpression.eventType}
                            </span>
                        </p>
                    )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <Button
                        text="Refresh"
                        icon="fa-light fa-arrows-rotate"
                        stylingMode="outlined"
                        onClick={handleRefresh}
                    />
                    <Button
                        text="Back to List"
                        icon="fa-light fa-arrow-left"
                        stylingMode="text"
                        onClick={handleBack}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            {selectedExpression && (
                <div className="tw-grid tw-grid-cols-4 tw-gap-3 tw-mb-4">
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-text-center">
                        <div className="tw-text-2xl tw-font-bold tw-text-gray-800">
                            {selectedExpression.triggerCount ?? 0}
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">Total Triggers</div>
                    </div>
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-text-center">
                        <div className="tw-text-2xl tw-font-bold tw-text-blue-600">
                            {selectedExpression.cooldownMinutes ?? 0}m
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">Cooldown</div>
                    </div>
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-text-center">
                        <div className="tw-text-2xl tw-font-bold tw-text-orange-600">
                            {selectedExpression.maxNotificationsPerDay || '∞'}
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">Daily Limit</div>
                    </div>
                    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-text-center">
                        <div
                            className={`tw-text-2xl tw-font-bold ${selectedExpression.isActive
                                    ? 'tw-text-green-600'
                                    : 'tw-text-red-600'
                                }`}
                        >
                            {selectedExpression.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">Status</div>
                    </div>
                </div>
            )}

            {/* Execution History Table */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
                <DataGrid
                    dataSource={executions}
                    showBorders={false}
                    showRowLines={true}
                    showColumnLines={false}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    wordWrapEnabled={false}
                    noDataText={
                        executionsLoading
                            ? 'Loading...'
                            : 'No execution records found'
                    }
                >
                    <LoadPanel enabled={executionsLoading} />
                    <Sorting mode="multiple" />
                    <FilterRow visible={true} />
                    <HeaderFilter visible={true} />
                    <Paging defaultPageSize={pageSize} />
                    <Pager
                        showPageSizeSelector={true}
                        allowedPageSizes={[10, 25, 50, 100]}
                        showInfo={true}
                        showNavigationButtons={true}
                    />

                    <Column
                        dataField="executedAt"
                        caption="Executed At"
                        dataType="datetime"
                        sortOrder="desc"
                        cellRender={renderDateCell}
                        width={180}
                    />
                    <Column
                        dataField="wasTriggered"
                        caption="Result"
                        cellRender={renderTriggeredCell}
                        width={120}
                        alignment="center"
                    />
                    <Column
                        dataField="success"
                        caption="Success"
                        cellRender={renderSuccessCell}
                        width={80}
                        alignment="center"
                    />
                    <Column
                        dataField="eventType"
                        caption="Event Type"
                        width={160}
                    />
                    <Column
                        dataField="suppressedReason"
                        caption="Suppressed Reason"
                        width={180}
                    />
                    <Column
                        dataField="eventData"
                        caption="Event Data"
                        cellRender={renderEventDataCell}
                        width={250}
                    />
                    <Column
                        dataField="errorMessage"
                        caption="Error"
                        width={180}
                    />
                    <Column
                        dataField="executionTimeMs"
                        caption="Duration"
                        cellRender={renderExecutionTimeCell}
                        width={90}
                        alignment="center"
                    />
                    <Column
                        dataField="notificationId"
                        caption="Notif. ID"
                        width={90}
                    />
                </DataGrid>
            </div>
        </div>
    );
};

export default ExecutionHistory;
