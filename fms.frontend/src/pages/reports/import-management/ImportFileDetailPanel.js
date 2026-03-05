/**
 * File: ImportFileDetailPanel.js
 * Purpose: SlidePanel detail content — displays full details of a tracked import file
 *          with retry action, file info, import results, and error details.
 *          Follows M365 Admin Center Fluent design language.
 * Dependencies: react, SlidePanel
 * Last Modified: 2026-02-25
 *
 * Key Components:
 * - ImportFileDetailPanel: Full detail view inside SlidePanel
 */

import React from "react";

// ── Status → badge mapping ──
const STATUS_CONFIG = {
    Completed: { badge: "m365-badge--success", label: "Completed", iconBg: "#dff6dd", iconColor: "#107c10" },
    Failed: { badge: "m365-badge--error", label: "Failed", iconBg: "#fde7e9", iconColor: "#d13438" },
    Pending: { badge: "m365-badge--warning", label: "Pending", iconBg: "#fff4ce", iconColor: "#ca5010" },
    Skipped: { badge: "m365-badge--neutral", label: "Skipped", iconBg: "#f3f2f1", iconColor: "#605e5c" },
    Processing: { badge: "m365-badge--primary", label: "Processing", iconBg: "#deecf9", iconColor: "#0078d4" },
};

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
        // Ensure UTC dates from the API are parsed correctly
        // .NET DateTime serializes without 'Z' — append it so JS interprets as UTC
        let isoStr = dateStr;
        if (typeof isoStr === "string" && !isoStr.endsWith("Z") && !isoStr.includes("+")) {
            isoStr += "Z";
        }
        return new Date(isoStr).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    } catch {
        return dateStr;
    }
};

const ImportFileDetailPanel = ({ file, onRetry, retrying }) => {
    if (!file) return null;

    const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.Pending;

    return (
        <div style={{ padding: "20px 24px" }}>
            {/* ── Header ── */}
            <div className="m365-detail-header">
                <div
                    className="m365-detail-header__icon-circle"
                    style={{ background: cfg.iconBg, color: cfg.iconColor }}
                >
                    <i className="fa-light fa-file-spreadsheet" />
                </div>
                <div className="m365-detail-header__title-block">
                    <h2 className="m365-detail-header__name">{file.fileName}</h2>
                    <div className="m365-detail-header__meta">
                        <span className={`m365-badge ${cfg.badge}`}>{cfg.label}</span>
                        {file.reportType && (
                            <span className="m365-badge m365-badge--primary">{file.reportType}</span>
                        )}
                        {file.detectedSiteName && <span>{file.detectedSiteName}</span>}
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            {file.canRetry && (
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    <button
                        className="m365-btn m365-btn--primary"
                        onClick={() => onRetry?.(file.id)}
                        disabled={retrying}
                    >
                        <i className={`fa-light ${retrying ? "fa-spinner-third fa-spin" : "fa-rotate-right"}`} />
                        {retrying ? "Retrying…" : "Retry Import"}
                    </button>
                </div>
            )}

            {/* ── File Information ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">
                    <i className="fa-light fa-file-lines" /> File Information
                </h3>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">File Name</span>
                        <span className="m365-info-cell__value" title={file.fileName}>
                            {file.fileName}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">File Size</span>
                        <span className="m365-info-cell__value">{file.fileSizeDisplay || "—"}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Report Type</span>
                        <span className="m365-info-cell__value">{file.reportType || "—"}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Detected Site</span>
                        <span className="m365-info-cell__value">{file.detectedSiteName || "—"}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Detected Month</span>
                        <span className="m365-info-cell__value">{file.detectedMonth || "—"}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Detected Year</span>
                        <span className="m365-info-cell__value">{file.detectedYear || "—"}</span>
                    </div>
                    <div className="m365-info-cell m365-info-cell--full">
                        <span className="m365-info-cell__label">File Path</span>
                        <span className="m365-info-cell__value tw-text-xs tw-break-all">
                            {file.filePath || "—"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Import Results ── */}
            <div className="m365-flat-section">
                <div className="m365-flat-section__title-row">
                    <h3 className="m365-flat-section__title">
                        <i className="fa-light fa-chart-bar" /> Import Results
                    </h3>
                    {file.status === "Completed" && (
                        <span className="m365-badge m365-badge--success">Success</span>
                    )}
                </div>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Total Records</span>
                        <span className="m365-info-cell__value tw-font-semibold">{file.totalRecords ?? 0}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Successful</span>
                        <span className="m365-info-cell__value" style={{ color: "#107c10" }}>
                            {file.successCount ?? 0}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Failed</span>
                        <span className="m365-info-cell__value" style={{ color: file.failedRecordCount > 0 ? "#d13438" : undefined }}>
                            {file.failedRecordCount ?? 0}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Skipped</span>
                        <span className="m365-info-cell__value">{file.skippedCount ?? 0}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Duplicates</span>
                        <span className="m365-info-cell__value">{file.duplicateCount ?? 0}</span>
                    </div>
                    {file.importReportId && (
                        <div className="m365-info-cell">
                            <span className="m365-info-cell__label">Import Report ID</span>
                            <span className="m365-info-cell__value tw-font-mono tw-text-xs">
                                {file.importReportId}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Retry Information ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">
                    <i className="fa-light fa-rotate" /> Retry Information
                </h3>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Retry Count</span>
                        <span className="m365-info-cell__value">
                            {file.retryCount ?? 0} / {file.maxRetries ?? 3}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Can Retry</span>
                        <span className="m365-info-cell__value">
                            {file.canRetry ? (
                                <span className="m365-badge m365-badge--success">Yes</span>
                            ) : (
                                <span className="m365-badge m365-badge--neutral">No</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Timestamps ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">
                    <i className="fa-light fa-clock" /> Timeline
                </h3>
                <div className="m365-info-grid">
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">File Last Modified</span>
                        <span className="m365-info-cell__value">{formatDate(file.fileLastModifiedUtc)}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">First Scanned</span>
                        <span className="m365-info-cell__value">{formatDate(file.firstScannedAtUtc)}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Last Processed</span>
                        <span className="m365-info-cell__value">{formatDate(file.lastProcessedAtUtc)}</span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Updated At</span>
                        <span className="m365-info-cell__value">{formatDate(file.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* ── Error Details (only if error) ── */}
            {file.errorMessage && (
                <div className="m365-flat-section">
                    <h3 className="m365-flat-section__title">
                        <i className="fa-light fa-triangle-exclamation" /> Error Details
                    </h3>
                    <div className="import-mgmt-error-box">
                        <pre className="import-mgmt-error-box__text">{file.errorMessage}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportFileDetailPanel;
