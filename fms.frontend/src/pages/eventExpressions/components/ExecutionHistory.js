/**
 * File: ExecutionHistory.js
 * Purpose: Displays execution log for a specific Event Expression. Shows when it
 *          was evaluated, whether it triggered, suppression reasons, and linked data.
 * Dependencies: react-redux, react-router-dom, devextreme-react, eventExpressionSlice
 * Last Modified: 2026-02-24
 *
 * Key Features:
 * - Paginated execution log table with column chooser
 * - Trigger result badges (triggered / not triggered / suppressed)
 * - Event data popup (click cell to view full JSON)
 * - ScopeKey column (tank/site/global cooldown scope)
 * - Notification link
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import DataGrid, {
    Column,
    ColumnChooser,
    Paging,
    Pager,
    FilterRow,
    HeaderFilter,
    Sorting,
    LoadPanel,
    Toolbar,
    Item
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Popup } from 'devextreme-react/popup';
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

    // Event data popup state
    const [eventDataPopup, setEventDataPopup] = useState({ visible: false, data: null, title: '' });

    const openEventDataPopup = useCallback((rowData) => {
        let parsed = rowData.eventData;
        try {
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        } catch { /* keep as string */ }
        setEventDataPopup({
            visible: true,
            data: parsed,
            title: `Event Data — ${rowData.eventType || 'Execution'}`
        });
    }, []);

    const closeEventDataPopup = useCallback(() => {
        setEventDataPopup({ visible: false, data: null, title: '' });
    }, []);

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
        navigate('/event-expressions/expressions');
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
        let keyCount = 0;
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            keyCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
        } catch { /* ignore */ }
        return (
            <button
                className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-blue-600 tw-underline-offset-2 hover:tw-text-blue-800 hover:tw-underline tw-bg-transparent tw-border-0 tw-cursor-pointer tw-p-0"
                onClick={() => openEventDataPopup(cellData.data)}
            >
                <i className="fa-light fa-code" />
                {keyCount > 0 ? `${keyCount} fields` : 'View JSON'}
            </button>
        );
    }, [openEventDataPopup]);

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
        <>
            <div className="execution-history tw-p-4">
                {/* Header */}
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                    <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
                        <Button
                            text="Back to List"
                            icon="fa-light fa-arrow-left"
                            stylingMode="text"
                            onClick={handleBack}
                        />
                        {selectedExpression && (
                            <p className="tw-text-sm tw-text-gray-500 tw-ml-1">
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
                    </div>
                </div>

                {/* Summary Cards */}
                {selectedExpression && (
                    <div className="tw-grid tw-grid-cols-5 tw-gap-3 tw-mb-4">
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
                            <div className="tw-text-2xl tw-font-bold tw-text-purple-600">
                                {selectedExpression.maxNotificationsPerHour || '∞'}
                            </div>
                            <div className="tw-text-xs tw-text-gray-500">Hourly Limit</div>
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
                <div className="execution-grid-card tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
                    <DataGrid
                        dataSource={executions}
                        showBorders={false}
                        showRowLines={true}
                        showColumnLines={false}
                        rowAlternationEnabled={true}
                        columnAutoWidth={true}
                        wordWrapEnabled={false}
                        width="100%"
                        height="100%"
                        className="execution-history-grid"
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
                        <ColumnChooser enabled={true} mode="select" />
                        <Paging defaultPageSize={pageSize} />
                        <Pager
                            showPageSizeSelector={true}
                            allowedPageSizes={[10, 25, 50, 100]}
                            showInfo={true}
                            showNavigationButtons={true}
                        />
                        <Toolbar>
                            <Item name="columnChooserButton" />
                        </Toolbar>

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
                            dataField="scopeKey"
                            caption="Scope"
                            width={120}
                            cellRender={(cell) => {
                                const v = cell.value || 'global';
                                const isGlobal = v === 'global';
                                return (
                                    <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-mono ${isGlobal ? 'tw-bg-gray-100 tw-text-gray-500' : 'tw-bg-blue-50 tw-text-blue-700'
                                        }`}>
                                        {v}
                                    </span>
                                );
                            }}
                        />
                        <Column
                            dataField="eventData"
                            caption="Event Data"
                            cellRender={renderEventDataCell}
                            width={120}
                            allowFiltering={false}
                            allowSorting={false}
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

            {/* Event Data Popup */}
            <Popup
                visible={eventDataPopup.visible}
                onHiding={closeEventDataPopup}
                title={eventDataPopup.title}
                width={640}
                height={480}
                showCloseButton={true}
                dragEnabled={true}
                resizeEnabled={true}
            >
                <div className="tw-h-full tw-flex tw-flex-col tw-p-2">
                    <div className="tw-flex-1 tw-overflow-auto tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 tw-p-3">
                        <pre className="tw-text-xs tw-font-mono tw-text-gray-700 tw-whitespace-pre-wrap tw-break-all tw-m-0">
                            {eventDataPopup.data != null
                                ? JSON.stringify(eventDataPopup.data, null, 2)
                                : '(no data)'}
                        </pre>
                    </div>
                    <div className="tw-flex tw-justify-end tw-pt-2">
                        <Button
                            text="Close"
                            stylingMode="outlined"
                            onClick={closeEventDataPopup}
                        />
                    </div>
                </div>
            </Popup>
        </>
    );
};

export default ExecutionHistory;
