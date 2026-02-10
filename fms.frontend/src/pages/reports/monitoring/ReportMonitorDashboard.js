/**
 * File: ReportMonitorDashboard.js
 * Purpose: Dashboard for monitoring report execution history — success/failure rates,
 *          format usage, recent executions, and performance stats.
 * Dependencies: React, DevExtreme DataGrid, reportingService
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportMonitorDashboard: Grid + stats cards for execution history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    FilterRow,
    Summary,
    TotalItem,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { DateBox } from 'devextreme-react/date-box';
import notify from 'devextreme/ui/notify';
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

    return (
        <div className="report-monitor-dashboard">
            <LoadPanel visible={loading} />

            {/* Header */}
            <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                        <i className="fa-light fa-monitor-waveform tw-mr-2 tw-text-blue-600"></i>
                        Report Monitoring
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Track report execution history, performance, and errors
                    </p>
                </div>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <DateBox
                        value={dateFrom}
                        onValueChanged={(e) => setDateFrom(e.value)}
                        type="date"
                        displayFormat="yyyy-MM-dd"
                        width={140}
                    />
                    <span className="tw-text-gray-400">to</span>
                    <DateBox
                        value={dateTo}
                        onValueChanged={(e) => setDateTo(e.value)}
                        type="date"
                        displayFormat="yyyy-MM-dd"
                        width={140}
                    />
                    <Button
                        icon="fa-light fa-refresh"
                        hint="Refresh"
                        onClick={loadExecutions}
                        stylingMode="outlined"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mb-6">
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border-l-4 tw-border-blue-500">
                    <p className="tw-text-sm tw-text-gray-500 tw-m-0">Total Executions</p>
                    <p className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-m-0">{stats.total}</p>
                </div>
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border-l-4 tw-border-green-500">
                    <p className="tw-text-sm tw-text-gray-500 tw-m-0">Successful</p>
                    <p className="tw-text-2xl tw-font-bold tw-text-green-600 tw-m-0">{stats.successful}</p>
                </div>
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border-l-4 tw-border-red-500">
                    <p className="tw-text-sm tw-text-gray-500 tw-m-0">Failed</p>
                    <p className="tw-text-2xl tw-font-bold tw-text-red-600 tw-m-0">{stats.failed}</p>
                </div>
                <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border-l-4 tw-border-purple-500">
                    <p className="tw-text-sm tw-text-gray-500 tw-m-0">Avg Duration</p>
                    <p className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-m-0">
                        {stats.avgDuration < 1000 ? `${stats.avgDuration}ms` : `${(stats.avgDuration / 1000).toFixed(1)}s`}
                    </p>
                </div>
            </div>

            {/* Format Usage */}
            {Object.keys(stats.formatCounts).length > 0 && (
                <div className="tw-flex tw-gap-3 tw-mb-4">
                    <span className="tw-text-sm tw-text-gray-500 tw-self-center">Format usage:</span>
                    {Object.entries(stats.formatCounts).map(([fmt, count]) => (
                        <span
                            key={fmt}
                            className="tw-px-2 tw-py-1 tw-bg-gray-100 tw-text-gray-700 tw-rounded tw-text-xs tw-font-medium"
                        >
                            {fmt}: {count}
                        </span>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div className="tw-flex tw-gap-4">
                {/* Grid */}
                <div className="tw-flex-1">
                    <DataGrid
                        dataSource={executions}
                        showBorders={true}
                        columnAutoWidth={true}
                        rowAlternationEnabled={true}
                        keyExpr="reportExecutionId"
                        onRowClick={(e) => setSelectedExecution(e.data)}
                        selection={{ mode: 'single' }}
                        noDataText="No execution records found for the selected period"
                    >
                        <SearchPanel visible={true} width={250} />
                        <FilterRow visible={true} />
                        <Paging defaultPageSize={15} />
                        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 15, 30]} showInfo={true} />

                        <Column dataField="reportExecutionId" caption="ID" width={60} />
                        <Column dataField="executedBy" caption="User" width={130} />
                        <Column
                            dataField="executedAt"
                            caption="Executed At"
                            dataType="datetime"
                            format="yyyy-MM-dd HH:mm:ss"
                            width={170}
                            sortOrder="desc"
                        />
                        <Column dataField="exportFormat" caption="Format" width={80} />
                        <Column dataField="recordCount" caption="Records" width={80} alignment="center" />
                        <Column
                            dataField="executionTimeMs"
                            caption="Duration"
                            width={100}
                            cellRender={formatDuration}
                        />
                        <Column
                            dataField="success"
                            caption="Status"
                            width={90}
                            cellRender={renderStatus}
                        />

                        <Summary>
                            <TotalItem column="reportExecutionId" summaryType="count" />
                        </Summary>
                    </DataGrid>
                </div>

                {/* Detail Panel */}
                <div className="tw-w-96 tw-flex-shrink-0">
                    <ReportExecutionLog execution={selectedExecution} />
                </div>
            </div>
        </div>
    );
};

export default ReportMonitorDashboard;
