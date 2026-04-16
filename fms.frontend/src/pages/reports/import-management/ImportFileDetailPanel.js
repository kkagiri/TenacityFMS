/**
 * File: ImportFileDetailPanel.js
 * Purpose: SlidePanel detail content — displays full details of a tracked import file
 *          with retry action, file info, import results, and error details.
 *          Follows M365 Admin Center Fluent design language.
 * Dependencies: react, SlidePanel
 * Last Modified: 2026-04-01
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

const parseBusinessDateTime = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        const dateTimeMatch = trimmed.match(
            /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?)?$/
        );

        if (dateTimeMatch) {
            const [, year, month, day, hour = "00", minute = "00", second = "00", fraction = "0"] = dateTimeMatch;
            const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second),
                milliseconds
            );
        }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
        const parsedDate = parseBusinessDateTime(dateStr);
        if (!parsedDate) {
            return dateStr;
        }

        return parsedDate.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateStr;
    }
};

const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "—";

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return String(value);

    return numericValue.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const ImportFileDetailPanel = ({ file, onRetry, retrying }) => {
    if (!file) return null;

    const cfg = STATUS_CONFIG[file.status] || STATUS_CONFIG.Pending;
    const latestPersistedRecord = file.latestPersistedRecord;
    const showLatestPersistedSection = file.status === "Completed";

    return (
        <div className="import-mgmt-detail-panel" style={{ padding: "20px 24px" }}>
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
                        <span className="m365-info-cell__label">Added</span>
                        <span className="m365-info-cell__value" style={{ color: "#107c10" }}>
                            {file.successCount ?? 0}
                        </span>
                    </div>
                    <div className="m365-info-cell">
                        <span className="m365-info-cell__label">Failed</span>
                        <span className="m365-info-cell__value" style={{ color: (file.failedCount ?? 0) > 0 ? "#d13438" : undefined }}>
                            {file.failedCount ?? 0}
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

            {showLatestPersistedSection && (
                <div className="m365-flat-section">
                    <div className="m365-flat-section__title-row">
                        <h3 className="m365-flat-section__title">
                            <i className="fa-light fa-database" /> Latest Database Record
                        </h3>
                        {latestPersistedRecord ? (
                            <span className="m365-badge m365-badge--success">From vehicleconsumption</span>
                        ) : (
                            <span className="m365-badge m365-badge--neutral">No row added</span>
                        )}
                    </div>

                    {latestPersistedRecord ? (
                        <div className="m365-info-grid">
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Record Date</span>
                                <span className="m365-info-cell__value">{formatDate(latestPersistedRecord.recordDate)}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Shift</span>
                                <span className="m365-info-cell__value">
                                    <span className="m365-badge m365-badge--neutral">{latestPersistedRecord.shiftLabel || "—"}</span>
                                </span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Vehicle</span>
                                <span className="m365-info-cell__value">{latestPersistedRecord.vehicleLabel || "—"}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Site</span>
                                <span className="m365-info-cell__value">{latestPersistedRecord.siteLabel || "—"}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Employee</span>
                                <span className="m365-info-cell__value">{latestPersistedRecord.employeeName || "—"}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Fuel Efficiency</span>
                                <span className="m365-info-cell__value">{formatNumber(latestPersistedRecord.fuelEfficiency)}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Total Fuel (L)</span>
                                <span className="m365-info-cell__value">{formatNumber(latestPersistedRecord.totalFuel)}</span>
                            </div>
                            <div className="m365-info-cell">
                                <span className="m365-info-cell__label">Total Distance (km)</span>
                                <span className="m365-info-cell__value">{formatNumber(latestPersistedRecord.totalDistance)}</span>
                            </div>
                            <div className="m365-info-cell m365-info-cell--full">
                                <span className="m365-info-cell__label">Engine Hours</span>
                                <span className="m365-info-cell__value">{formatNumber(latestPersistedRecord.engineHours)}</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "12px 16px", fontSize: 13, color: "#605e5c" }}>
                            No new <strong>vehicleconsumption</strong> row was added for the latest run. This usually means the file was fully skipped as duplicates.
                        </div>
                    )}
                </div>
            )}

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
