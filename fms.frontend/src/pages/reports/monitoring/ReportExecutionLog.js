/**
 * File: ReportExecutionLog.js
 * Purpose: Detailed execution log for a specific report run — shows parameters,
 *          output format, duration, status, and error messages.
 * Dependencies: React, DevExtreme
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportExecutionLog: Detail view of a single execution record
 */

import React from 'react';
import './ReportExecutionLog.scss';

const ReportExecutionLog = ({ execution }) => {
    if (!execution) {
        return (
            <div className="exec-log exec-log--empty">
                <i className="fa-light fa-list-timeline exec-log__empty-icon" />
                <p className="exec-log__empty-text">Select an execution to view details</p>
            </div>
        );
    }

    const formatDuration = (ms) => {
        if (!ms) return '—';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const parseUtcToLocalDate = (value) => {
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
    };

    const formatExecutedAtLocal = (value) => {
        const localDate = parseUtcToLocalDate(value);
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
    };

    const normalizeObject = (value) => {
        if (!value) return {};
        if (typeof value === 'object') return value;
        if (typeof value !== 'string') return {};
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    };

    const toTitleCase = (key) =>
        String(key)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .replace(/^./, (ch) => ch.toUpperCase());

    const formatRecurringSchedule = (schedule) => {
        if (!schedule || typeof schedule !== 'object') return '—';

        const frequency = schedule.frequency || schedule.Frequency || schedule.type || schedule.Type;
        const interval = schedule.interval || schedule.Interval;
        const days =
            schedule.daysOfWeek ||
            schedule.DaysOfWeek ||
            schedule.days ||
            schedule.Days ||
            [];
        const time = schedule.time || schedule.Time || schedule.timeOfDay || schedule.TimeOfDay;

        const parts = [];
        if (frequency) parts.push(String(frequency));
        if (interval && Number(interval) > 1) parts.push(`every ${interval}`);
        if (Array.isArray(days) && days.length > 0) parts.push(days.join(', '));
        if (time) parts.push(`at ${time}`);

        return parts.length > 0 ? parts.join(' · ') : JSON.stringify(schedule);
    };

    const isJsonElementMetaOnly = (value) =>
        value &&
        typeof value === 'object' &&
        Object.keys(value).length === 1 &&
        Object.prototype.hasOwnProperty.call(value, 'ValueKind');

    const formatFilterValue = (key, value) => {
        if (value === null || value === undefined) return 'null';
        if (key === 'recurringSchedule') return formatRecurringSchedule(value);
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
        }
        if (typeof value === 'object') {
            if (isJsonElementMetaOnly(value)) return null;
            return JSON.stringify(value);
        }
        return String(value);
    };

    const parsedFilters = normalizeObject(execution.filters);
    const nestedFilters =
        parsedFilters?.filters && typeof parsedFilters.filters === 'object'
            ? parsedFilters.filters
            : {};
    const mergedFilters = {
        ...parsedFilters,
        ...nestedFilters,
    };
    delete mergedFilters.filters;

    const filterEntries = Object.entries(mergedFilters || {})
        .filter(([key, value]) => key !== 'ValueKind' && !isJsonElementMetaOnly(value))
        .map(([key, value]) => ({
            key,
            label: toTitleCase(key),
            value: formatFilterValue(key, value),
        }))
        .filter((row) => row.value !== null && row.value !== undefined && row.value !== '');

    const isSuccess = execution.success;

    return (
        <div className="exec-log">
            {/* Primary fields row */}
            <div className="exec-log__primary">
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Status</span>
                    <span className={`m365-badge ${isSuccess ? 'm365-badge--success' : 'm365-badge--error'}`}>
                        <i className={`fa-light ${isSuccess ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                        {isSuccess ? 'Success' : 'Failed'}
                    </span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Execution ID</span>
                    <span className="exec-log__field-value">{execution.reportExecutionId || execution.id}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Executed By</span>
                    <span className="exec-log__field-value">{execution.executedByDisplay || execution.executedBy || '—'}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Executed At</span>
                    <span className="exec-log__field-value">
                        {formatExecutedAtLocal(execution.executedAt)}
                    </span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Format</span>
                    <span className="exec-log__field-value exec-log__field-value--upper">{execution.exportFormat || '—'}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Duration</span>
                    <span className="exec-log__field-value">{formatDuration(execution.executionTimeMs)}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Records</span>
                    <span className="exec-log__field-value">{execution.recordCount ?? '—'}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">IP Address</span>
                    <span className="exec-log__field-value">{execution.ipAddress || '—'}</span>
                </div>
            </div>

            {/* Error Message */}
            {execution.errorMessage && (
                <div className="exec-log__error">
                    <i className="fa-light fa-circle-exclamation exec-log__error-icon" />
                    <div>
                        <p className="exec-log__error-title">Error</p>
                        <p className="exec-log__error-msg">{execution.errorMessage}</p>
                    </div>
                </div>
            )}

            {/* Filters Applied */}
            {filterEntries.length > 0 && (
                <div className="exec-log__filters">
                    <p className="exec-log__filters-title">Filters Applied</p>
                    <div className="exec-log__filters-grid">
                        {filterEntries.map((entry) => (
                            <div key={entry.key} className="exec-log__filter-row">
                                <span className="exec-log__filter-key">{entry.label}</span>
                                <span className="exec-log__filter-val">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportExecutionLog;
