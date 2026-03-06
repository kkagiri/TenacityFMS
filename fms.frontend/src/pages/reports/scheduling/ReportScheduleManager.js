/**
 * File: ReportScheduleManager.js
 * Purpose: Full schedule management page â€” lists all scheduled reports, supports
 *          creating new schedules via ScheduleReportPanel (slide-in), editing
 *          existing via ScheduleReportPanel in edit mode, cancelling, and viewing delivery status.
 * Dependencies: React, DevExtreme DataGrid, ScheduleReportPanel, reportingService
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - ReportScheduleManager: M365-styled schedule list + panels
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    FilterRow,
    Scrolling,
    ColumnFixing,
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import { usePermissions } from '../../../hooks/usePermissions';
import ScheduleReportPanel from '../../../components/Reporting/ScheduleReportPanel';
import SlidePanel from '../../../components/ui/SlidePanel';
import { buildUpdatePayloadFromForm } from './reportScheduleFormUtils';
import ReportScheduleDetailPanel from './ReportScheduleDetailPanel';
import {
    formatScheduleDateTime,
    getDeliveryStats,
    getFrequency,
    getRecipientEmails,
    getReportLabel,
    getScheduleDetail,
    getStatusBadgeClass,
    isScheduledReport,
    resolveSourceId,
} from './reportScheduleDisplayUtils';
import './ReportScheduleManager.scss';

const SCHEDULE_PANEL_WIDTH = 1000;

const ReportScheduleManager = () => {
    const [searchParams] = useSearchParams();
    const { hasPermission } = usePermissions();
    const isAdmin = hasPermission('_Manage_ReportSchedules');
    const authUser = useSelector((state) => state.auth?.user || null);
    const currentUserName = authUser?.userName || authUser?.username || 'Unknown';

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    // New schedule â€” ScheduleReportPanel
    const [newPanelOpen, setNewPanelOpen] = useState(false);

    // Edit schedule â€” SlidePanel + form
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    // Detail side panel
    const [detailTarget, setDetailTarget] = useState(null);

    const preselectedSource = searchParams.get('source');

    // â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const result = await reportingService.getScheduledReportEmails({
                includeCompleted: true,
                take: 300,
            });
            if (result.success) {
                setSchedules(Array.isArray(result.data) ? result.data : []);
            } else {
                notify({ message: result.error || 'Failed to load schedules', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to load schedules', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    // Auto-open new panel if source param present
    useEffect(() => {
        if (preselectedSource) {
            setNewPanelOpen(true);
        }
    }, [preselectedSource]);

    const handleScheduleCreated = useCallback(async () => {
        await loadSchedules();
    }, [loadSchedules]);

    // â”€â”€ Edit / Update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleEdit = useCallback((schedule) => {
        // Only allow editing true scheduled reports
        if (!isScheduledReport(schedule)) {
            notify({ message: 'This is an event-triggered notification and cannot be edited as a schedule.', type: 'warning', displayTime: 4000 });
            return;
        }

        // Parse recipients — only include Email delivery entries (not System UUIDs)
        let parsedRecipients = [];
        if (Array.isArray(schedule.recipients)) {
            parsedRecipients = schedule.recipients
                .filter((r) => r.deliveryMethod === 'Email' || (!r.deliveryMethod && r.recipientAddress?.includes('@')))
                .map((r) => r.recipientAddress || r.email || r)
                .filter((addr) => typeof addr === 'string' && addr.includes('@'));
        } else if (typeof schedule.recipients === 'string') {
            try {
                parsedRecipients = JSON.parse(schedule.recipients)
                    .filter((r) => r.deliveryMethod === 'Email' || (!r.deliveryMethod && (r.recipientAddress || r.email || '').includes('@')))
                    .map((r) => r.recipientAddress || r.email || r)
                    .filter((addr) => typeof addr === 'string' && addr.includes('@'));
            } catch { /* ignore */ }
        }

        let parsedFilters = {};
        if (typeof schedule.filters === 'string') {
            try {
                const raw = JSON.parse(schedule.filters);
                // Detect .NET JsonElement serialization artifact {ValueKind: N}
                if (raw && typeof raw === 'object' && Object.keys(raw).length === 1 && 'ValueKind' in raw) {
                    parsedFilters = {};
                } else {
                    parsedFilters = raw;
                }
            } catch { /* ignore */ }
        } else if (schedule.filters) {
            if (typeof schedule.filters === 'object' && Object.keys(schedule.filters).length === 1 && 'ValueKind' in schedule.filters) {
                parsedFilters = {};
            } else {
                parsedFilters = schedule.filters;
            }
        }

        let parsedConfig = {};
        if (typeof schedule.scheduleConfig === 'string') {
            try { parsedConfig = JSON.parse(schedule.scheduleConfig); } catch { /* ignore */ }
        } else if (schedule.scheduleConfig) {
            parsedConfig = schedule.scheduleConfig;
        }

        const scheduleDayOfWeekIds = parsedConfig.scheduleDayOfWeekIds
            || (Array.isArray(schedule.scheduleDaysOfWeek) && schedule.scheduleDaysOfWeek.length ? schedule.scheduleDaysOfWeek : null)
            || ['monday'];
        const scheduleWeekOfMonthIds = parsedConfig.scheduleWeekOfMonthIds
            || (Array.isArray(schedule.scheduleWeeksOfMonth) && schedule.scheduleWeeksOfMonth.length ? schedule.scheduleWeeksOfMonth : null)
            || ['first'];
        const scheduleTime = parsedConfig.scheduleTime || schedule.scheduleTimeOfDay || '08:00';

        setEditTarget({
            ...schedule,
            formValues: {
                reportSourceId: resolveSourceId(schedule),
                scheduleName: schedule.title || schedule.scheduleName || '',
                description: schedule.reportDescription || schedule.description || '',
                recipientEmails: parsedRecipients,
                frequency: schedule.scheduleType || schedule.frequency || getFrequency(schedule).toLowerCase() || 'daily',
                outputFormat: (schedule.format || schedule.outputFormat || 'pdf').toLowerCase(),
                scheduledAt: schedule.nextRunAtUtc ? new Date(schedule.nextRunAtUtc)
                    : schedule.scheduledAt ? new Date(schedule.scheduledAt) : new Date(),
                repeatCount: schedule.repeatCount || 1,
                filters: parsedFilters,
                scheduleDayOfWeekIds,
                scheduleWeekOfMonthIds,
                scheduleTime,
                scheduleDayOfMonth: parsedConfig.scheduleDayOfMonth || schedule.scheduleDayOfMonth || null,
                offsetDays: schedule.offsetDays ?? 1,
                windowDays: schedule.windowDays ?? 1,
            },
        });
        setDetailTarget(null);
        setEditPanelOpen(true);
    }, []);

    const handleUpdate = useCallback(async (formData) => {
        if (!editTarget) return;
        setLoading(true);
        try {
            const payload = buildUpdatePayloadFromForm(formData, [], currentUserName);
            const result = await reportingService.updateScheduledReportEmail(editTarget.id, payload);
            if (result.success) {
                notify({ message: 'Schedule updated successfully', type: 'success' });
                setEditPanelOpen(false);
                setEditTarget(null);
                await loadSchedules();
            } else {
                notify({ message: result.error || 'Failed to update schedule', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to update schedule', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [editTarget, loadSchedules, currentUserName]);

    // â”€â”€ Cancel / Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleCancel = useCallback(async (schedule) => {
        if (!window.confirm(`Cancel schedule "${schedule.title || schedule.scheduleName || schedule.id}"?`)) return;
        setLoading(true);
        try {
            const result = await reportingService.cancelScheduledReportEmail(schedule.id);
            if (result.success) {
                notify({ message: 'Schedule cancelled', type: 'success' });
                setDetailTarget((current) => (current?.id === schedule.id ? null : current));
                await loadSchedules();
            } else {
                notify({ message: result.error || 'Failed to cancel', type: 'error' });
            }
        } catch {
            notify({ message: 'Failed to cancel schedule', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [loadSchedules]);

    const handleDelete = useCallback(async (schedule) => {
        if (!window.confirm(`Permanently delete schedule "${schedule.title || schedule.scheduleName || schedule.id}"?\n\nThis action cannot be undone.`)) return;
        setLoading(true);
        try {
            const result = await reportingService.deleteScheduledReportEmail(schedule.id);
            if (result.success) {
                notify({ message: 'Schedule deleted permanently', type: 'success' });
                setDetailTarget((current) => (current?.id === schedule.id ? null : current));
                await loadSchedules();
            } else {
                notify({ message: result.error || 'Failed to delete', type: 'error' });
            }
        } catch {
            notify({ message: 'Failed to delete schedule', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [loadSchedules]);

    // â”€â”€ Cell renderers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleViewDetails = useCallback((schedule) => {
        setDetailTarget(schedule);
    }, []);

    const getScheduleActionState = useCallback((schedule) => {
        const statusLower = String(schedule?.status || '').toLowerCase();
        const isCancelled = statusLower === 'cancelled';
        const isCompleted = statusLower === 'completed';
        const isSent = statusLower === 'sent';
        const isScheduleRecord = isScheduledReport(schedule || {});
        const isEditable = !isCancelled && !isCompleted && !isSent && isScheduleRecord;

        return {
            isCancelled,
            isCompleted,
            isSent,
            isScheduleRecord,
            isEditable,
        };
    }, []);

    const renderStatus = useCallback((cellInfo) => {
        const label = String(cellInfo.value || 'pending');
        return (
            <span className={getStatusBadgeClass(label)}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
        );
    }, []);

    const renderDeliveryStats = useCallback((cellInfo) => {
        const { total, delivered, failed, pending } = getDeliveryStats(cellInfo.data);

        if (total === 0) return <span style={{ color: 'var(--m365-text-tertiary)', fontSize: 12 }}>{"\u2014"}</span>;

        return (
            <div style={{ fontSize: 12, lineHeight: '20px' }}>
                <span style={{ color: 'var(--m365-text-secondary)' }}>{total} total</span>
                {delivered > 0 && <span style={{ marginLeft: 8, color: 'var(--m365-success, #107c10)' }}><i className="fa-light fa-check" style={{ marginRight: 2 }} />{delivered}</span>}
                {failed > 0 && <span style={{ marginLeft: 8, color: 'var(--m365-danger, #d13438)' }}><i className="fa-light fa-xmark" style={{ marginRight: 2 }} />{failed}</span>}
                {pending > 0 && <span style={{ marginLeft: 8, color: 'var(--m365-warning, #d67a00)' }}><i className="fa-light fa-clock" style={{ marginRight: 2 }} />{pending}</span>}
            </div>
        );
    }, []);

    const renderRecipients = useCallback((cellInfo) => {
        const emails = getRecipientEmails(cellInfo.data);
        if (emails.length === 0) return <span style={{ color: 'var(--m365-text-tertiary)', fontSize: 12 }}>{"\u2014"}</span>;
        return (
            <div style={{ fontSize: 12 }}>
                <span title={emails.join(', ')} style={{ color: 'var(--m365-text-primary)' }}>
                    {emails[0]}
                    {emails.length > 1 && (
                        <span style={{ marginLeft: 4, color: 'var(--m365-text-tertiary)' }}>
                            +{emails.length - 1} more
                        </span>
                    )}
                </span>
            </div>
        );
    }, []);

    const renderScheduleDetail = useCallback((cellInfo) => {
        return <span style={{ fontSize: 12, color: 'var(--m365-text-secondary)' }}>{getScheduleDetail(cellInfo.data)}</span>;
    }, []);

    const handleRowClick = useCallback((event) => {
        if (event?.rowType !== 'data') return;
        if (event?.event?.target?.closest?.('.sched-mgr__action-buttons')) return;
        handleViewDetails(event.data);
    }, [handleViewDetails]);

    if (!isAdmin) {
        return (
            <div className="sched-mgr__access-denied">
                <i className="fa-light fa-lock" />
                <p>Schedule management requires Admin access.</p>
            </div>
        );
    }

    return (
        <div className="sched-mgr">
            <LoadPanel visible={loading} />

            {/* M365 Page Header */}
            <div className="sched-mgr__header">
                <div className="sched-mgr__header-left">
                    <div className="sched-mgr__icon-wrap">
                        <i className="fa-light fa-calendar-clock" />
                    </div>
                    <div>
                        <h2 className="sched-mgr__title">Report Schedules</h2>
                        <p className="sched-mgr__subtitle">
                            Manage automated report generation and email delivery
                        </p>
                    </div>
                </div>
                <div className="sched-mgr__header-actions">
                    <button
                        className="m365-btn m365-btn--primary"
                        onClick={() => setNewPanelOpen(true)}
                    >
                        <i className="fa-light fa-plus" />
                        New Schedule
                    </button>
                    <button className="m365-btn m365-btn--text" onClick={loadSchedules}>
                        <i className="fa-light fa-rotate-right" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Schedule Grid */}
            <div className="sched-mgr__grid-wrap">
                <DataGrid
                    dataSource={schedules}
                    showBorders={false}
                    showRowLines={true}
                    columnAutoWidth={false}
                    rowAlternationEnabled={false}
                    keyExpr="id"
                    height="100%"
                    noDataText="No schedules found"
                    columnResizingMode="widget"
                    allowColumnResizing={true}
                    onRowClick={handleRowClick}
                >
                    <Scrolling mode="standard" showScrollbar="always" />
                    <ColumnFixing enabled={true} />
                    <SearchPanel visible={true} width={250} placeholder="Search schedules…" />
                    <FilterRow visible={true} />
                    <Paging defaultPageSize={15} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[10, 15, 30, 50]} showInfo={true} />

                    <Column
                        caption="Schedule Name"
                        minWidth={180}
                        calculateCellValue={(row) => row.title || row.scheduleName || '\u2014'}
                    />
                    <Column
                        caption="Report"
                        width={200}
                        calculateCellValue={(row) => getReportLabel(row)}
                    />
                    <Column
                        caption="Frequency"
                        width={90}
                        calculateCellValue={(row) => getFrequency(row)}
                    />
                    <Column
                        caption="Schedule Detail"
                        width={200}
                        cellRender={renderScheduleDetail}
                        allowSorting={false}
                        allowFiltering={false}
                    />
                    <Column
                        caption="Format"
                        width={75}
                        calculateCellValue={(row) => {
                            const fmt = row.format || row.outputFormat || '';
                            if (fmt) return fmt.toUpperCase();
                            // Extract from message e.g. "Daily PDF report"
                            const m = (row.message || '').match(/\b(PDF|EXCEL|CSV|XLSX)\b/i);
                            return m ? m[1].toUpperCase() : '\u2014';
                        }}
                        alignment="center"
                    />
                    <Column
                        dataField="status"
                        caption="Status"
                        width={100}
                        cellRender={renderStatus}
                        alignment="center"
                    />
                    <Column
                        caption="Recipients"
                        width={200}
                        cellRender={renderRecipients}
                        allowSorting={false}
                        allowFiltering={false}
                    />
                    <Column
                        caption="Next Run"
                        width={155}
                        calculateCellValue={(row) => {
                            const freq = getFrequency(row).toLowerCase();
                            const status = (row.status || '').toLowerCase();
                            // Once-frequency schedules that already fired have no next run
                            if (freq === 'once' && ['sent', 'completed', 'cancelled', 'failed'].includes(status)) {
                                return '\u2014';
                            }
                            return formatScheduleDateTime(row.nextRunAtUtc || row.scheduledAt);
                        }}
                    />
                    <Column
                        caption="Last Run"
                        width={155}
                        calculateCellValue={(row) => formatScheduleDateTime(row.lastProcessedAtUtc || row.sentAt || row.lastRunAtUtc || row.lastRunAt)}
                    />
                    <Column
                        caption="Created"
                        width={155}
                        calculateCellValue={(row) => formatScheduleDateTime(row.createdOnUtc || row.createdAt || row.createdDate)}
                    />
                    <Column
                        caption="Requested By"
                        width={130}
                        calculateCellValue={(row) => row.requestedBy || row.createdBy || '\u2014'}
                    />
                    <Column
                        caption="Delivery"
                        width={155}
                        cellRender={renderDeliveryStats}
                        allowSorting={false}
                        allowFiltering={false}
                    />
                </DataGrid>
            </div>

            {/* New Schedule â€” ScheduleReportPanel (slide-in) */}
            <ScheduleReportPanel
                open={newPanelOpen}
                onClose={() => setNewPanelOpen(false)}
                onScheduled={handleScheduleCreated}
                initialSourceId={preselectedSource || ''}
                width={SCHEDULE_PANEL_WIDTH}
            />

            {/* Edit Schedule — reuse ScheduleReportPanel in edit mode */}
            <ScheduleReportPanel
                open={editPanelOpen}
                onClose={() => { setEditPanelOpen(false); setEditTarget(null); }}
                mode="edit"
                initialValues={editTarget?.formValues || null}
                onUpdate={handleUpdate}
                width={SCHEDULE_PANEL_WIDTH}
            />

            {/* Schedule Detail Side Panel */}
            <SlidePanel
                open={!!detailTarget}
                onClose={() => setDetailTarget(null)}
                title={detailTarget?.title || detailTarget?.scheduleName || 'Schedule Details'}
                width={SCHEDULE_PANEL_WIDTH}
                panelClassName="sched-mgr__detail-shell"
                headerActions={detailTarget ? (() => {
                    const { isEditable } = getScheduleActionState(detailTarget);
                    return (
                        <div className="sched-mgr__panel-actions">
                            <button
                                type="button"
                                className="sched-mgr__panel-action"
                                onClick={() => handleEdit(detailTarget)}
                                disabled={!isEditable}
                            >
                                <i className="fa-light fa-pen-to-square" />
                                Edit
                            </button>
                            <button
                                type="button"
                                className="sched-mgr__panel-action"
                                onClick={() => handleCancel(detailTarget)}
                                disabled={!isEditable}
                            >
                                <i className="fa-light fa-ban" />
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="sched-mgr__panel-action sched-mgr__panel-action--danger"
                                onClick={() => handleDelete(detailTarget)}
                            >
                                <i className="fa-light fa-trash" />
                                Delete
                            </button>
                        </div>
                    );
                })() : null}
            >
                <ReportScheduleDetailPanel schedule={detailTarget} />
            </SlidePanel>
        </div>
    );
};

export default ReportScheduleManager;
