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

    let parsedFilters = {};
    try {
        parsedFilters =
            typeof execution.filters === 'string'
                ? JSON.parse(execution.filters)
                : execution.filters || {};
    } catch {
        parsedFilters = {};
    }

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
                    <span className="exec-log__field-value">{execution.executedBy || '—'}</span>
                </div>
                <div className="exec-log__field">
                    <span className="exec-log__field-label">Executed At</span>
                    <span className="exec-log__field-value">
                        {execution.executedAt ? new Date(execution.executedAt).toLocaleString() : '—'}
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
            {Object.keys(parsedFilters).length > 0 && (
                <div className="exec-log__filters">
                    <p className="exec-log__filters-title">Filters Applied</p>
                    <div className="exec-log__filters-grid">
                        {Object.entries(parsedFilters).map(([key, val]) => (
                            <div key={key} className="exec-log__filter-row">
                                <span className="exec-log__filter-key">{key}</span>
                                <span className="exec-log__filter-val">{String(val ?? 'null')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportExecutionLog;
