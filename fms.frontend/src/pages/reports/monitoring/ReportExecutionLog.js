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

const ReportExecutionLog = ({ execution }) => {
    if (!execution) {
        return (
            <div className="tw-text-center tw-text-gray-400 tw-py-8">
                <i className="fa-light fa-list tw-text-3xl tw-mb-2"></i>
                <p>Select an execution to view details</p>
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

    return (
        <div className="report-execution-log tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
                <i className="fa-light fa-file-lines tw-mr-2 tw-text-blue-600"></i>
                Execution Details
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Execution ID:</span>
                    <span className="tw-ml-2">{execution.reportExecutionId || execution.id}</span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Status:</span>
                    <span
                        className={`tw-ml-2 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${execution.success
                                ? 'tw-bg-green-100 tw-text-green-800'
                                : 'tw-bg-red-100 tw-text-red-800'
                            }`}
                    >
                        {execution.success ? 'Success' : 'Failed'}
                    </span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Executed By:</span>
                    <span className="tw-ml-2">{execution.executedBy || '—'}</span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Executed At:</span>
                    <span className="tw-ml-2">
                        {execution.executedAt ? new Date(execution.executedAt).toLocaleString() : '—'}
                    </span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Format:</span>
                    <span className="tw-ml-2 tw-uppercase">{execution.exportFormat || '—'}</span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Duration:</span>
                    <span className="tw-ml-2">{formatDuration(execution.executionTimeMs)}</span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">Records:</span>
                    <span className="tw-ml-2">{execution.recordCount ?? '—'}</span>
                </div>
                <div>
                    <span className="tw-font-medium tw-text-gray-600">IP Address:</span>
                    <span className="tw-ml-2">{execution.ipAddress || '—'}</span>
                </div>
            </div>

            {/* Error Message */}
            {execution.errorMessage && (
                <div className="tw-mt-4 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                    <span className="tw-font-medium tw-text-red-700">
                        <i className="fa-light fa-circle-exclamation tw-mr-1"></i>
                        Error:
                    </span>
                    <p className="tw-text-red-600 tw-text-sm tw-mt-1">{execution.errorMessage}</p>
                </div>
            )}

            {/* Filters Used */}
            {Object.keys(parsedFilters).length > 0 && (
                <div className="tw-mt-4">
                    <span className="tw-font-medium tw-text-gray-600 tw-text-sm">Filters Applied:</span>
                    <div className="tw-mt-1 tw-bg-gray-50 tw-rounded tw-p-3 tw-text-xs tw-font-mono">
                        {Object.entries(parsedFilters).map(([key, val]) => (
                            <div key={key} className="tw-flex tw-gap-2">
                                <span className="tw-text-gray-500">{key}:</span>
                                <span className="tw-text-gray-800">{String(val ?? 'null')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportExecutionLog;
