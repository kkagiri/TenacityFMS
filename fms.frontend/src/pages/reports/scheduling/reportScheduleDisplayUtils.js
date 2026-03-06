/**
 * File: reportScheduleDisplayUtils.js
 * Purpose: Shared display helpers for report schedule list/detail UI.
 * Dependencies: None
 * Last Modified: 2026-03-06
 *
 * Key Functions:
 * - resolveSourceId(): Maps backend schedule payloads to report source ids
 * - isScheduledReport(): Identifies editable scheduled report records
 * - getScheduleDetail(): Builds human-readable frequency detail text
 * - formatScheduleDateTime(): Formats UTC/local timestamps for display
 */

export const TRIGGER_SOURCE_TO_SOURCE_ID = {
    TransactionVolumeHistoryReportSchedule: 'tank-volume-history',
    ConsumptionByRefillReportSchedule: 'consumption-by-refills',
    VehicleConsumptionReportSchedule: 'vehicle-consumption',
    PTSDeviceOfflineReportSchedule: 'pts-device',
    FuelRefillReportSchedule: 'fuel-refill',
    PumpTransactionReportSchedule: 'pump-transaction',
    DeviceOfflineReportSchedule: 'device-offline',
};

const REPORT_TYPE_LABELS = {
    'device-offline': 'Device Offline',
    'tank-volume-history': 'Tank Volume History',
    'consumption-by-refills': 'Consumption by Refills',
    'vehicle-consumption': 'Vehicle Consumption',
    'pump-transaction': 'Pump Transaction',
    'fuel-refill': 'Fuel Refill',
    delivery: 'Delivery',
    'pts-device': 'PTS Device',
    TransactionVolumeHistory: 'Tank Volume History',
    ConsumptionByRefill: 'Consumption by Refills',
    VehicleConsumption: 'Vehicle Consumption',
    PTSDeviceOffline: 'PTS Device Offline',
    TransactionVolumeHistoryReportSchedule: 'Tank Volume History',
    ConsumptionByRefillReportSchedule: 'Consumption by Refills',
    VehicleConsumptionReportSchedule: 'Vehicle Consumption',
    PTSDeviceOfflineReportSchedule: 'PTS Device Offline',
    FuelRefillReportSchedule: 'Fuel Refill',
    PumpTransactionReportSchedule: 'Pump Transaction',
    DeviceOfflineReportSchedule: 'Device Offline',
};

const STATUS_BADGE = {
    pending: 'm365-badge m365-badge--warning',
    scheduled: 'm365-badge m365-badge--info',
    active: 'm365-badge m365-badge--success',
    sent: 'm365-badge m365-badge--success',
    completed: 'm365-badge m365-badge--info',
    cancelled: 'm365-badge m365-badge--error',
    failed: 'm365-badge m365-badge--error',
};

export const resolveSourceId = (schedule = {}) => {
    if (schedule.reportType) return schedule.reportType;
    if (schedule.reportSourceId) return schedule.reportSourceId;
    return TRIGGER_SOURCE_TO_SOURCE_ID[schedule.triggerSource || ''] || '';
};

export const isScheduledReport = (row = {}) => {
    const ts = row.triggerSource || '';
    if (ts.endsWith('ReportSchedule')) return true;
    if (row.reportType && TRIGGER_SOURCE_TO_SOURCE_ID[row.reportType]) return true;
    if (row.scheduleType && row.scheduleType !== '') return true;
    return false;
};

export const getStatusBadgeClass = (status) => {
    const normalizedStatus = String(status || 'pending').toLowerCase();
    return STATUS_BADGE[normalizedStatus] || STATUS_BADGE.pending;
};

export const getStatusLabel = (status) => {
    const normalizedStatus = String(status || 'pending').toLowerCase();
    return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
};

export const getReportLabel = (row = {}) => {
    const key = row.reportType || row.triggerSource || '';
    if (REPORT_TYPE_LABELS[key]) return REPORT_TYPE_LABELS[key];
    const stripped = key.replace(/ReportSchedule$/, '').replace(/([A-Z])/g, ' $1').trim();
    return stripped || '\u2014';
};

export const getFrequency = (row = {}) => {
    const value = row.scheduleType || row.frequency || '';
    if (value) return value.charAt(0).toUpperCase() + value.slice(1);

    const hasWeeks = Array.isArray(row.scheduleWeeksOfMonth) && row.scheduleWeeksOfMonth.length > 0;
    const hasDays = Array.isArray(row.scheduleDaysOfWeek) && row.scheduleDaysOfWeek.length > 0;
    const message = (row.message || '').toLowerCase();

    if (message.includes('daily')) return 'Daily';
    if (message.includes('weekly') || (hasDays && hasWeeks)) return 'Weekly';
    if (message.includes('monthly')) return 'Monthly';
    if (hasDays) return 'Weekly';
    return '\u2014';
};

export const getRecipientEmails = (schedule = {}) => {
    if (Array.isArray(schedule.recipients)) {
        return schedule.recipients
            .map((recipient) => recipient?.recipientAddress || recipient?.email || recipient)
            .filter(Boolean);
    }

    if (typeof schedule.recipients === 'string') {
        try {
            return JSON.parse(schedule.recipients)
                .map((recipient) => recipient?.recipientAddress || recipient?.email || recipient)
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    return [];
};

export const getDeliveryStats = (schedule = {}) => {
    const recipientList = Array.isArray(schedule.recipients) ? schedule.recipients : [];
    const total = schedule.recipientCount || recipientList.length || 0;
    const delivered = schedule.deliveredCount || recipientList.filter((recipient) => recipient.deliveryStatus === 'delivered').length || 0;
    const failed = schedule.failedCount || recipientList.filter((recipient) => recipient.deliveryStatus === 'failed').length || 0;
    const pending = Math.max(total - delivered - failed, 0);

    return {
        total,
        delivered,
        failed,
        pending,
    };
};

export const getScheduleDetail = (row = {}) => {
    const time = row.scheduleTimeOfDay || null;
    let resolvedTime = time;

    if (!resolvedTime) {
        const scheduledAt = row.scheduledAt || row.nextRunAtUtc;
        if (scheduledAt) {
            let value = String(scheduledAt);
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !/[Z+\-]\d*$/.test(value)) {
                value += 'Z';
            }

            const dateValue = new Date(value);
            if (!Number.isNaN(dateValue.getTime())) {
                resolvedTime = dateValue.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
        }
    }

    let detail = resolvedTime || '';
    let config = {};

    if (typeof row.scheduleConfig === 'string') {
        try {
            config = JSON.parse(row.scheduleConfig);
        } catch {
            config = {};
        }
    } else if (row.scheduleConfig) {
        config = row.scheduleConfig;
    }

    const daysOfWeek = row.scheduleDaysOfWeek || config.scheduleDayOfWeekIds || [];
    const weeksOfMonth = row.scheduleWeeksOfMonth || config.scheduleWeekOfMonthIds || [];
    const dayOfMonth = row.scheduleDayOfMonth || config.scheduleDayOfMonth;
    const inferredFrequency = getFrequency(row).toLowerCase();
    const offset = row.offsetDays ?? 1;
    const windowDays = row.windowDays ?? 1;

    if (inferredFrequency === 'weekly') {
        const days = daysOfWeek.map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
        const weeks = weeksOfMonth.map((week) => week.charAt(0).toUpperCase() + week.slice(1)).join(', ');
        detail = [days, weeks, resolvedTime].filter((value) => value && value !== '\u2014').join(' · ');
    } else if (inferredFrequency === 'monthly') {
        if (dayOfMonth) {
            detail = [`Day ${dayOfMonth}`, resolvedTime].filter(Boolean).join(' · ');
        } else {
            const days = daysOfWeek.map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
            const weeks = weeksOfMonth.map((week) => week.charAt(0).toUpperCase() + week.slice(1)).join(', ');
            detail = [weeks, days, resolvedTime].filter((value) => value && value !== '\u2014').join(' · ');
        }
    }

    const windowLabel = inferredFrequency !== 'monthly' && (offset > 1 || windowDays > 1)
        ? `-${offset}d, ${windowDays}d window`
        : '';

    return [detail, windowLabel].filter(Boolean).join(' · ') || '\u2014';
};

export const formatScheduleDateTime = (value, isUtc = true) => {
    if (!value) return '\u2014';

    let stringValue = String(value);
    if (isUtc && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(stringValue) && !/[Z+\-]\d*$/.test(stringValue)) {
        stringValue += 'Z';
    }

    const dateValue = new Date(stringValue);
    if (Number.isNaN(dateValue.getTime())) return '\u2014';

    return dateValue.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
};