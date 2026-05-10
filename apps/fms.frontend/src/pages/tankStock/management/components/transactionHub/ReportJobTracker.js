/**
 * File: ReportJobTracker.js
 * Purpose: Popup component showing async report generation progress with SignalR live updates.
 *          Displays progress bar, status text, elapsed time, cancel/download/dismiss actions.
 * Dependencies: react, devextreme (Popup, ProgressBar, Button), useReportJobTracking hook
 * Last Modified: 2026-02-12
 *
 * Key Components:
 * - ReportJobTracker: Floating popup that appears when a background report job is active
 */
import React, { useMemo } from "react";
import Popup from "devextreme-react/popup";
import Button from "devextreme-react/button";
import ProgressBar from "devextreme-react/progress-bar";
import {
    ReportJobStatus,
    statusLabels,
} from "../../../../../hooks/useReportJobTracking";

/**
 * Format elapsed seconds to human-readable string
 */
const formatElapsed = (seconds) => {
    if (!seconds || seconds < 1) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
};

/**
 * Get status icon class
 */
const getStatusIcon = (status) => {
    switch (status) {
        case ReportJobStatus.Queued:
            return "fa-light fa-clock";
        case ReportJobStatus.FetchingData:
            return "fa-light fa-database";
        case ReportJobStatus.Rendering:
            return "fa-light fa-file-pdf";
        case ReportJobStatus.Completed:
            return "fa-light fa-check-circle";
        case ReportJobStatus.EmailSent:
            return "fa-light fa-envelope-check";
        case ReportJobStatus.Failed:
            return "fa-light fa-circle-xmark";
        case ReportJobStatus.Cancelled:
            return "fa-light fa-ban";
        default:
            return "fa-light fa-spinner";
    }
};

/**
 * Get status color class (tw- prefix)
 */
const getStatusColor = (status) => {
    switch (status) {
        case ReportJobStatus.Completed:
        case ReportJobStatus.EmailSent:
            return "tw-text-green-600";
        case ReportJobStatus.Failed:
            return "tw-text-red-600";
        case ReportJobStatus.Cancelled:
            return "tw-text-gray-500";
        default:
            return "tw-text-blue-600";
    }
};

/**
 * ReportJobTracker Component
 * Shows as a popup when an async report job is in progress or recently completed
 */
const ReportJobTracker = ({
    activeJob,
    isTracking,
    error,
    onCancel,
    onDownload,
    onDismiss,
    onEmailWhenDone,
}) => {
    const isVisible = !!activeJob;
    const status = activeJob?.status;
    const progress = activeJob?.progressPercent ?? 0;
    const isCompleted =
        status === ReportJobStatus.Completed ||
        status === ReportJobStatus.EmailSent;
    const isFailed = status === ReportJobStatus.Failed;
    const isCancelled = status === ReportJobStatus.Cancelled;
    const isRunning = isTracking && !isCompleted && !isFailed && !isCancelled;
    const canDownload = isCompleted;
    const canCancel = isRunning;

    const statusText = useMemo(() => {
        if (activeJob?.statusText) return activeJob.statusText;
        return statusLabels[status] || "Unknown";
    }, [activeJob?.statusText, status]);

    const renderTitle = () => (
        <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-file-chart-column tw-text-blue-600" />
            <span className="tw-font-semibold tw-text-sm">Report Generation</span>
        </div>
    );

    if (!isVisible) return null;

    return (
        <Popup
            visible={isVisible}
            onHiding={onDismiss}
            dragEnabled={true}
            hideOnOutsideClick={false}
            showCloseButton={!isRunning}
            showTitle={true}
            titleRender={renderTitle}
            width={380}
            height="auto"
            position={{ my: "right bottom", at: "right bottom", offset: "-20 -20" }}
            shading={false}
            wrapperAttr={{ class: "report-job-tracker-popup" }}
        >
            <div className="tw-p-4 tw-space-y-3">
                {/* Report title */}
                <div className="tw-text-sm tw-font-medium tw-text-gray-800 tw-truncate">
                    {activeJob?.reportTitle || "Report"}
                </div>

                {/* Status row */}
                <div className="tw-flex tw-items-center tw-gap-2">
                    <i className={`${getStatusIcon(status)} ${getStatusColor(status)}`} />
                    <span className={`tw-text-sm tw-font-medium ${getStatusColor(status)}`}>
                        {statusText}
                    </span>
                    {isRunning && (
                        <span className="tw-text-xs tw-text-gray-400 tw-ml-auto">
                            {formatElapsed(activeJob?.elapsedSeconds)}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                <ProgressBar
                    min={0}
                    max={100}
                    value={progress}
                    showStatus={true}
                    statusFormat={(value) => `${Math.round(value)}%`}
                    width="100%"
                    className="tw-mt-1"
                />

                {/* Record count and file size */}
                <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-500">
                    {activeJob?.recordCount > 0 && (
                        <span>
                            <i className="fa-light fa-list-ol tw-mr-1" />
                            {activeJob.recordCount.toLocaleString()} records
                        </span>
                    )}
                    {activeJob?.fileSizeBytes > 0 && isCompleted && (
                        <span>
                            <i className="fa-light fa-file tw-mr-1" />
                            {(activeJob.fileSizeBytes / 1024).toFixed(0)} KB
                        </span>
                    )}
                    {activeJob?.elapsedSeconds > 0 && (isCompleted || isFailed) && (
                        <span>
                            <i className="fa-light fa-stopwatch tw-mr-1" />
                            {formatElapsed(activeJob.elapsedSeconds)}
                        </span>
                    )}
                </div>

                {/* Email delivery indicator */}
                {activeJob?.deliverByEmail && (
                    <div className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-gray-500">
                        <i className="fa-light fa-envelope tw-text-blue-500" />
                        <span>
                            {status === ReportJobStatus.EmailSent
                                ? `Emailed to ${activeJob.emailAddress}`
                                : `Will email to ${activeJob.emailAddress}`}
                        </span>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="tw-text-xs tw-text-red-600 tw-bg-red-50 tw-rounded tw-p-2">
                        <i className="fa-light fa-triangle-exclamation tw-mr-1" />
                        {error}
                    </div>
                )}

                {/* Action buttons */}
                <div className="tw-flex tw-gap-2 tw-justify-end tw-pt-2 tw-border-t tw-border-gray-100">
                    {canCancel && (
                        <Button
                            text="Cancel"
                            icon="fa-light fa-xmark"
                            stylingMode="text"
                            type="danger"
                            onClick={onCancel}
                        />
                    )}
                    {/* Email When Done - shown when job is running and email not yet enabled */}
                    {isRunning && !activeJob?.deliverByEmail && onEmailWhenDone && (
                        <Button
                            text="Email When Done"
                            icon="fa-light fa-envelope"
                            stylingMode="outlined"
                            type="normal"
                            onClick={onEmailWhenDone}
                        />
                    )}
                    {canDownload && (
                        <Button
                            text="Download"
                            icon="fa-light fa-download"
                            stylingMode="contained"
                            type="default"
                            onClick={onDownload}
                        />
                    )}
                    {(isCompleted || isFailed || isCancelled) && (
                        <Button
                            text="Dismiss"
                            stylingMode="text"
                            onClick={onDismiss}
                        />
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default ReportJobTracker;
