/**
 * File: ReportMonitorDashboard.js
 * Purpose: Dashboard for monitoring report execution history — success/failure rates,
 *          format usage, recent executions, and performance stats.
 *          M365 Admin Center Fluent Design.
 * Dependencies: React, DevExtreme DataGrid, reportingService
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - ReportMonitorDashboard: Full-width grid + M365 stat tiles + execution detail panel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DateRangeBox from 'devextreme-react/date-range-box';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    FilterRow,
    Summary,
    TotalItem,
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import reportingService from '../../../services/reportingService';
import ReportExecutionLog from './ReportExecutionLog';
import './ReportMonitorDashboard.scss';

const ReportMonitorDashboard = () => {
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
    });
    const [dateTo, setDateTo] = useState(() => new Date());

    const loadExecutions = useCallback(async () => {
        setLoading(true);
        try {
            const result = await reportingService.fetchReportData('/Reporting/execution-history', {
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
            });
            if (result.success) {
                setExecutions(Array.isArray(result.data) ? result.data : result.data?.data || []);
            } else {
                // If endpoint not available yet, show empty state
                setExecutions([]);
            }
        } catch (err) {
            console.error('Error loading execution history:', err);
            setExecutions([]);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        loadExecutions();
    }, [loadExecutions]);

    // Stats
    const stats = useMemo(() => {
        const total = executions.length;
        const successful = executions.filter((e) => e.success).length;
        const failed = total - successful;
        const avgDuration =
            total > 0
                ? Math.round(
                    executions.reduce((sum, e) => sum + (e.executionTimeMs || 0), 0) / total
                )
                : 0;

        const formatCounts = {};
        executions.forEach((e) => {
            const fmt = (e.exportFormat || 'unknown').toUpperCase();
            formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
        });

        return { total, successful, failed, avgDuration, formatCounts };
    }, [executions]);

    const renderStatus = useCallback((cellInfo) => {
        const success = cellInfo.value;
        return (
            <span
                className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${success ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
                    }`}
            >
                {success ? 'Success' : 'Failed'}
            </span>
        );
    }, []);

    const formatDuration = useCallback((cellInfo) => {
        const ms = cellInfo.value;
        if (!ms) return '—';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }, []);

    const dateRangeValue = useMemo(() => [dateFrom, dateTo], [dateFrom, dateTo]);

    const handleDateRangeChange = useCallback((e) => {
        const [start, end] = e.value ?? [null, null];
        if (start !== undefined) setDateFrom(start ? new Date(start) : null);
        if (end !== undefined) setDateTo(end ? new Date(end) : null);
    }, []);

    return (
        <div className="report-monitor-dashboard">
            <LoadPanel visible={loading} />

            {/* M365 Page Header */}
            <div className="monitor-header">
                <div className="monitor-header__left">
                    <div className="monitor-header__icon-wrap">
                        <i className="fa-light fa-monitor-waveform" />
                    </div>
                    <div>
                        <h2 className="monitor-header__title">Report Monitoring</h2>
                        <p className="monitor-header__subtitle">Track execution history, performance, and errors</p>
                    </div>
                </div>
                <div className="monitor-header__actions">
                    <div className="monitor-header__date-range">
                        <DateRangeBox
                            value={dateRangeValue}
                            onValueChanged={handleDateRangeChange}
                            displayFormat="dd MMM yyyy"
                            showClearButton={false}
                            startDateLabel="From"
                            endDateLabel="To"
                            height={34}
                            stylingMode="outlined"
                            className="monitor-date-range-box"
                        />
                    </div>
                    <button className="m365-btn m365-btn--text" onClick={loadExecutions}>
                        <i className="fa-light fa-rotate-right" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* M365 Stat Tiles */}
            <div className="monitor-stats">
                <div className="monitor-stat">
                    <div className="monitor-stat__icon" style={{ background: '#deecf9', color: '#0078d4' }}>
                        <i className="fa-light fa-chart-bar" />
                    </div>
                    <div className="monitor-stat__body">
                        <p className="monitor-stat__label">Total Executions</p>
                        <p className="monitor-stat__value">{stats.total}</p>
                    </div>
                </div>
                <div className="monitor-stat">
                    <div className="monitor-stat__icon" style={{ background: '#dff6dd', color: '#107c10' }}>
                        <i className="fa-light fa-circle-check" />
                    </div>
                    <div className="monitor-stat__body">
                        <p className="monitor-stat__label">Successful</p>
                        <p className="monitor-stat__value" style={{ color: '#107c10' }}>{stats.successful}</p>
                    </div>
                </div>
                <div className="monitor-stat">
                    <div className="monitor-stat__icon" style={{ background: '#fde7e9', color: '#d13438' }}>
                        <i className="fa-light fa-circle-xmark" />
                    </div>
                    <div className="monitor-stat__body">
                        <p className="monitor-stat__label">Failed</p>
                        <p className="monitor-stat__value" style={{ color: '#d13438' }}>{stats.failed}</p>
                    </div>
                </div>
                <div className="monitor-stat">
                    <div className="monitor-stat__icon" style={{ background: '#f3e8fd', color: '#6b21a8' }}>
                        <i className="fa-light fa-timer" />
                    </div>
                    <div className="monitor-stat__body">
                        <p className="monitor-stat__label">Avg Duration</p>
                        <p className="monitor-stat__value">
                            {stats.avgDuration < 1000 ? `${stats.avgDuration}ms` : `${(stats.avgDuration / 1000).toFixed(1)}s`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Format usage badges */}
            {Object.keys(stats.formatCounts).length > 0 && (
                <div className="monitor-format-bar">
                    <span className="monitor-format-bar__label">Format usage:</span>
                    {Object.entries(stats.formatCounts).map(([fmt, count]) => (
                        <span key={fmt} className="m365-badge m365-badge--neutral">
                            {fmt}: {count}
                        </span>
                    ))}
                </div>
            )}

            {/* Full-width DataGrid */}
            <div className="monitor-grid-wrap">
                <DataGrid
                    dataSource={executions}
                    showBorders={false}
                    columnAutoWidth={false}
                    rowAlternationEnabled={true}
                    keyExpr="reportExecutionId"
                    onRowClick={(e) =>
                        setSelectedExecution(prev =>
                            prev?.reportExecutionId === e.data?.reportExecutionId ? null : e.data
                        )
                    }
                    selection={{ mode: 'single' }}
                    noDataText="No execution records found for the selected period"
                    width="100%"
                    height={executions.length > 0 ? 420 : 160}
                >
                    <SearchPanel visible={true} width={240} placeholder="Search executions…" />
                    <FilterRow visible={true} />
                    <Paging defaultPageSize={15} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[10, 15, 30, 50]} showInfo={true} />

                    <Column dataField="reportExecutionId" caption="ID" width={70} />
                    <Column dataField="executedBy" caption="User" minWidth={120} />
                    <Column
                        dataField="executedAt"
                        caption="Executed At"
                        dataType="datetime"
                        format="yyyy-MM-dd HH:mm:ss"
                        width={170}
                        sortOrder="desc"
                    />
                    <Column
                        caption="Report Source"
                        minWidth={140}
                        calculateCellValue={(row) => {
                            try {
                                const f = JSON.parse(row.filters || '{}');
                                return f.sourceName || f.sourceId || (row.reportDefinitionId ? `Report #${row.reportDefinitionId}` : '—');
                            } catch {
                                return row.reportDefinitionId ? `Report #${row.reportDefinitionId}` : '—';
                            }
                        }}
                    />
                    <Column dataField="exportFormat" caption="Format" width={80} alignment="center" />
                    <Column dataField="recordCount" caption="Records" width={90} alignment="center" />
                    <Column
                        dataField="executionTimeMs"
                        caption="Duration"
                        width={110}
                        alignment="right"
                        cellRender={formatDuration}
                    />
                    <Column
                        dataField="success"
                        caption="Status"
                        width={100}
                        alignment="center"
                        cellRender={renderStatus}
                    />

                    <Summary>
                        <TotalItem column="reportExecutionId" summaryType="count" displayFormat="{0} records" />
                    </Summary>
                </DataGrid>
            </div>

            {/* Execution detail — collapses in below the grid */}
            {selectedExecution && (
                <div className="monitor-detail-panel">
                    <div className="monitor-detail-panel__header">
                        <span className="monitor-detail-panel__title">
                            <i className="fa-light fa-file-lines" />
                            Execution Detail
                            <span className="monitor-detail-panel__id">#{selectedExecution.reportExecutionId}</span>
                        </span>
                        <button
                            className="m365-btn m365-btn--text"
                            onClick={() => setSelectedExecution(null)}
                        >
                            <i className="fa-light fa-xmark" />
                            Close
                        </button>
                    </div>
                    <ReportExecutionLog execution={selectedExecution} />
                </div>
            )}
        </div>
    );
};

export default ReportMonitorDashboard;
