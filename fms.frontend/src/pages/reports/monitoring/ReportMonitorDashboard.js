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
import { useSelector } from 'react-redux';
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
import SlidePanel from '../../../components/ui/SlidePanel';
import ReportExecutionLog from './ReportExecutionLog';
import './ReportMonitorDashboard.scss';

const ReportMonitorDashboard = () => {
    const authUser = useSelector((state) => state.auth?.user || null);
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
    });
    const [dateTo, setDateTo] = useState(() => new Date());

    const currentUserId = useMemo(
        () =>
            authUser?.id ||
            authUser?.userId ||
            authUser?.userID ||
            authUser?.Id ||
            authUser?.userid ||
            null,
        [authUser]
    );

    const currentUserName = useMemo(() => {
        const fullName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ').trim();
        return (
            authUser?.userName ||
            authUser?.username ||
            authUser?.email ||
            fullName ||
            null
        );
    }, [authUser]);

    const isGuidLike = useCallback((value) => {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
    }, []);

    const safeParseObject = useCallback((value) => {
        if (!value) return {};
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return {};
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }, []);

    const resolveExecutedByDisplay = useCallback(
        (row) => {
            const raw = row?.executedBy;
            const explicitName =
                row?.executedByName ||
                row?.executedByUserName ||
                row?.executedByUsername ||
                row?.executedByEmail ||
                row?.userName ||
                row?.user?.userName ||
                row?.user?.username ||
                row?.user?.email;

            if (explicitName) return explicitName;

            if (raw && currentUserId && String(raw).toLowerCase() === String(currentUserId).toLowerCase()) {
                return currentUserName || raw;
            }

            if (isGuidLike(raw) && currentUserName && executions.length > 0) {
                const allSameUser = executions.every((e) => String(e?.executedBy || '').toLowerCase() === String(raw).toLowerCase());
                if (allSameUser) return currentUserName;
            }

            return raw || '—';
        },
        [currentUserId, currentUserName, executions, isGuidLike]
    );

    const resolveReportSource = useCallback(
        (row) => {
            const parsed = safeParseObject(row?.filters);
            const nested = parsed?.filters && typeof parsed.filters === 'object' ? parsed.filters : null;
            const sourceName = parsed?.sourceName || nested?.sourceName;
            const sourceId = parsed?.sourceId || nested?.sourceId;

            if (sourceName) return sourceName;
            if (sourceId) return sourceId;
            return row?.reportDefinitionId ? `Report #${row.reportDefinitionId}` : '—';
        },
        [safeParseObject]
    );

    const normalizedExecutions = useMemo(
        () =>
            executions.map((row) => ({
                ...row,
                executedByDisplay: resolveExecutedByDisplay(row),
                reportSourceDisplay: resolveReportSource(row),
            })),
        [executions, resolveExecutedByDisplay, resolveReportSource]
    );

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

    const parseUtcToLocalDate = useCallback((value) => {
        if (!value) return null;

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === 'string') {
            let normalized = value.trim().replace(' ', 'T');
            const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(normalized);
            if (!hasZone) normalized = `${normalized}Z`;
            const parsed = new Date(normalized);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, []);

    const formatExecutedAtLocal = useCallback(
        (cellInfo) => {
            const localDate = parseUtcToLocalDate(cellInfo?.value);
            if (!localDate) return '—';

            return localDate.toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        },
        [parseUtcToLocalDate]
    );

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
                    dataSource={normalizedExecutions}
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
                >
                    <SearchPanel visible={true} width={240} placeholder="Search executions…" />
                    <FilterRow visible={true} />
                    <Paging defaultPageSize={15} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[10, 15, 30, 50]} showInfo={true} />

                    <Column dataField="reportExecutionId" caption="ID" width={70} />
                    <Column dataField="executedByDisplay" caption="User" minWidth={160} />
                    <Column
                        dataField="executedAt"
                        caption="Executed At"
                        width={170}
                        sortOrder="desc"
                        cellRender={formatExecutedAtLocal}
                    />
                    <Column dataField="reportSourceDisplay" caption="Report Source" minWidth={160} />
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

            <SlidePanel
                open={!!selectedExecution}
                onClose={() => setSelectedExecution(null)}
                title={selectedExecution ? `Execution Detail #${selectedExecution.reportExecutionId}` : 'Execution Detail'}
                width={820}
            >
                <ReportExecutionLog execution={selectedExecution} />
            </SlidePanel>
        </div>
    );
};

export default ReportMonitorDashboard;
