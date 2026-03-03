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
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import { usePermissions } from '../../../hooks/usePermissions';
import ScheduleReportPanel from '../../../components/Reporting/ScheduleReportPanel';
import { buildUpdatePayloadFromForm } from './reportScheduleFormUtils';
import RecipientDeliveryStatusPopup from '../components/RecipientDeliveryStatusPopup';
import './ReportScheduleManager.scss';

// Map backend triggerSource values to frontend reportSourceRegistry IDs
const TRIGGER_SOURCE_TO_SOURCE_ID = {
    TransactionVolumeHistoryReportSchedule: 'tank-volume-history',
    ConsumptionByRefillReportSchedule: 'consumption-by-refills',
    VehicleConsumptionReportSchedule: 'vehicle-consumption',
    PTSDeviceOfflineReportSchedule: 'pts-device',
    FuelRefillReportSchedule: 'fuel-refill',
    PumpTransactionReportSchedule: 'pump-transaction',
    DeviceOfflineReportSchedule: 'device-offline',
};

const resolveSourceId = (schedule) => {
    if (schedule.reportType) return schedule.reportType;
    if (schedule.reportSourceId) return schedule.reportSourceId;
    return TRIGGER_SOURCE_TO_SOURCE_ID[schedule.triggerSource || ''] || '';
};

const STATUS_BADGE = {
    pending: 'm365-badge m365-badge--warning',
    active: 'm365-badge m365-badge--success',
    completed: 'm365-badge m365-badge--info',
    cancelled: 'm365-badge m365-badge--error',
    failed: 'm365-badge m365-badge--error',
};

const REPORT_TYPE_LABELS = {
    // reportType values
    'device-offline': 'Device Offline',
    'tank-volume-history': 'Tank Volume History',
    'consumption-by-refills': 'Consumption by Refills',
    'vehicle-consumption': 'Vehicle Consumption',
    'pump-transaction': 'Pump Transaction',
    'fuel-refill': 'Fuel Refill',
    'delivery': 'Delivery',
    'pts-device': 'PTS Device',
    TransactionVolumeHistory: 'Tank Volume History',
    ConsumptionByRefill: 'Consumption by Refills',
    VehicleConsumption: 'Vehicle Consumption',
    PTSDeviceOffline: 'PTS Device Offline',
    // triggerSource values
    TransactionVolumeHistoryReportSchedule: 'Tank Volume History',
    ConsumptionByRefillReportSchedule: 'Consumption by Refills',
    VehicleConsumptionReportSchedule: 'Vehicle Consumption',
    PTSDeviceOfflineReportSchedule: 'PTS Device Offline',
    FuelRefillReportSchedule: 'Fuel Refill',
    PumpTransactionReportSchedule: 'Pump Transaction',
    DeviceOfflineReportSchedule: 'Device Offline',
};

// Derive a human-readable label from reportType or triggerSource
const getReportLabel = (row) => {
    const key = row.reportType || row.triggerSource || '';
    if (REPORT_TYPE_LABELS[key]) return REPORT_TYPE_LABELS[key];
    // Strip trailing 'ReportSchedule' and space it out as fallback
    const stripped = key.replace(/ReportSchedule$/, '').replace(/([A-Z])/g, ' $1').trim();
    return stripped || '\u2014';
};

// Infer frequency when scheduleType is null
const getFrequency = (row) => {
    const v = row.scheduleType || row.frequency || '';
    if (v) return v.charAt(0).toUpperCase() + v.slice(1);
    // Infer from available schedule data
    const hasWeeks = Array.isArray(row.scheduleWeeksOfMonth) && row.scheduleWeeksOfMonth.length > 0;
    const hasDays = Array.isArray(row.scheduleDaysOfWeek) && row.scheduleDaysOfWeek.length > 0;
    // Parse from message field (e.g. "Daily PDF report")
    const msg = (row.message || '').toLowerCase();
    if (msg.includes('daily')) return 'Daily';
    if (msg.includes('weekly') || (hasDays && hasWeeks)) return 'Weekly';
    if (msg.includes('monthly')) return 'Monthly';
    if (hasDays) return 'Weekly';
    return '\u2014';
};

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

    // Delivery status popup
    const [deliveryTarget, setDeliveryTarget] = useState(null);

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

    // â”€â”€ Edit / Update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const handleEdit = useCallback((schedule) => {
        let parsedRecipients = [];
        if (Array.isArray(schedule.recipients)) {
            parsedRecipients = schedule.recipients.map((r) => r.recipientAddress || r.email || r);
        } else if (typeof schedule.recipients === 'string') {
            try { parsedRecipients = JSON.parse(schedule.recipients).map((r) => r.recipientAddress || r.email || r); } catch { /* ignore */ }
        }

        let parsedFilters = {};
        if (typeof schedule.filters === 'string') {
            try { parsedFilters = JSON.parse(schedule.filters); } catch { /* ignore */ }
        } else if (schedule.filters) {
            parsedFilters = schedule.filters;
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
            },
        });
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

    const renderStatus = useCallback((cellInfo) => {
        const status = String(cellInfo.value || 'pending').toLowerCase();
        const cls = STATUS_BADGE[status] || STATUS_BADGE.pending;
        return (
            <span className={cls}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    }, []);

    const renderActions = useCallback((cellInfo) => {
        const schedule = cellInfo.data;
        const isCancelled = String(schedule.status || '').toLowerCase() === 'cancelled';
        const isCompleted = String(schedule.status || '').toLowerCase() === 'completed';
        const isEditable = !isCancelled && !isCompleted;
        return (
            <div style={{ display: 'flex', gap: 2 }}>
                <Button icon="fa-light fa-pen-to-square" hint="Edit Schedule" stylingMode="text"
                    onClick={() => handleEdit(schedule)} disabled={!isEditable} />
                <Button icon="fa-light fa-users" hint="View Delivery Status" stylingMode="text"
                    onClick={() => setDeliveryTarget(schedule)} />
                <Button icon="fa-light fa-ban" hint="Cancel Schedule" stylingMode="text"
                    onClick={() => handleCancel(schedule)} disabled={!isEditable} />
                <Button icon="fa-light fa-trash" hint="Delete Permanently" stylingMode="text"
                    onClick={() => handleDelete(schedule)}
                    elementAttr={{ style: 'color: var(--m365-danger, #d13438)' }} />
            </div>
        );
    }, [handleCancel, handleDelete, handleEdit]);

    const renderDeliveryStats = useCallback((cellInfo) => {
        const schedule = cellInfo.data;
        const recipientList = Array.isArray(schedule.recipients) ? schedule.recipients : [];
        const total = schedule.recipientCount || recipientList.length || 0;
        const delivered = schedule.deliveredCount || recipientList.filter(r => r.deliveryStatus === 'delivered').length || 0;
        const failed = schedule.failedCount || recipientList.filter(r => r.deliveryStatus === 'failed').length || 0;
        const pending = total - delivered - failed;

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
        const schedule = cellInfo.data;
        let emails = [];
        if (Array.isArray(schedule.recipients)) {
            emails = schedule.recipients.map(r => r.recipientAddress || r.email || r).filter(Boolean);
        } else if (typeof schedule.recipients === 'string') {
            try {
                emails = JSON.parse(schedule.recipients).map(r => r.recipientAddress || r.email || r).filter(Boolean);
            } catch { /* ignore */ }
        }
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
        const row = cellInfo.data;
        const time = row.scheduleTimeOfDay || null;

        // Derive time from scheduledAt when scheduleTimeOfDay not populated
        let resolvedTime = time;
        if (!resolvedTime) {
            const sat = row.scheduledAt || row.nextRunAtUtc;
            if (sat) {
                let s = String(sat);
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[Z+\-]\d*$/.test(s)) s += 'Z';
                const d = new Date(s);
                if (!Number.isNaN(d.getTime())) {
                    resolvedTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                }
            }
        }

        let detail = resolvedTime || '';

        // Read schedule config (may be JSON string or object)
        let cfg = {};
        if (typeof row.scheduleConfig === 'string') { try { cfg = JSON.parse(row.scheduleConfig); } catch { /* ignore */ } }
        else if (row.scheduleConfig) { cfg = row.scheduleConfig; }

        // Top-level fields take precedence over parsed scheduleConfig
        const daysOfWeek = row.scheduleDaysOfWeek || cfg.scheduleDayOfWeekIds || [];
        const weeksOfMonth = row.scheduleWeeksOfMonth || cfg.scheduleWeekOfMonthIds || [];
        const dayOfMonth = row.scheduleDayOfMonth || cfg.scheduleDayOfMonth;

        const inferredFreq = getFrequency(row).toLowerCase();

        if (inferredFreq === 'weekly') {
            const days = daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
            const weeks = weeksOfMonth.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
            detail = [days, weeks, resolvedTime].filter(v => v && v !== '\u2014').join(' \u00B7 ');
        } else if (inferredFreq === 'monthly') {
            if (dayOfMonth) {
                detail = ['Day ' + dayOfMonth, resolvedTime].filter(Boolean).join(' \u00B7 ');
            } else {
                const days = daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
                const weeks = weeksOfMonth.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
                detail = [weeks, days, resolvedTime].filter(v => v && v !== '\u2014').join(' \u00B7 ');
            }
        }

        return <span style={{ fontSize: 12, color: 'var(--m365-text-secondary)' }}>{detail || '\u2014'}</span>;
    }, []);

    const formatDateTime = useCallback((value, isUtc = true) => {
        if (!value) return '\u2014';
        // Bare ISO strings (no Z or offset) from the server are UTC — append Z so
        // the browser parses them as UTC and toLocaleString() converts to local time.
        let str = String(value);
        if (isUtc && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[Z+\-]\d*$/.test(str)) {
            str = str + 'Z';
        }
        const d = new Date(str);
        if (Number.isNaN(d.getTime())) return '\u2014';
        return d.toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZoneName: 'short',
        });
    }, []);

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
                        calculateCellValue={(row) => formatDateTime(row.nextRunAtUtc || row.scheduledAt)}
                    />
                    <Column
                        caption="Last Run"
                        width={155}
                        calculateCellValue={(row) => formatDateTime(row.lastRunAtUtc || row.lastRunAt)}
                    />
                    <Column
                        caption="Created"
                        width={155}
                        calculateCellValue={(row) => formatDateTime(row.createdOnUtc || row.createdAt || row.createdDate)}
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
                    <Column
                        caption="Actions"
                        width={160}
                        cellRender={renderActions}
                        alignment="center"
                        allowSorting={false}
                        allowFiltering={false}
                        fixed={true}
                        fixedPosition="right"
                    />
                </DataGrid>
            </div>

            {/* New Schedule â€” ScheduleReportPanel (slide-in) */}
            <ScheduleReportPanel
                open={newPanelOpen}
                onClose={() => setNewPanelOpen(false)}
                initialSourceId={preselectedSource || ''}
            />

            {/* Edit Schedule — reuse ScheduleReportPanel in edit mode */}
            <ScheduleReportPanel
                open={editPanelOpen}
                onClose={() => { setEditPanelOpen(false); setEditTarget(null); }}
                mode="edit"
                initialValues={editTarget?.formValues || null}
                onUpdate={handleUpdate}
            />

            {/* Recipient Delivery Status Popup */}
            <RecipientDeliveryStatusPopup
                schedule={deliveryTarget}
                onHiding={() => setDeliveryTarget(null)}
                formatLocalDateTime={(val) => {
                    if (!val) return '\u2014';
                    const d = new Date(val);
                    return Number.isNaN(d.getTime()) ? '\u2014' : d.toLocaleString();
                }}
            />
        </div>
    );
};

export default ReportScheduleManager;
