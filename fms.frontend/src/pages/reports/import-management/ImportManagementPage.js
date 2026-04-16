/**
 * File: ImportManagementPage.js
 * Purpose: Import Management page — view, filter, and manage tracked auto-import files.
 *          M365 Admin Center Fluent design with SlidePanel for file details.
 * Dependencies: react, useImportManagement, ImportFileDetailPanel, SlidePanel
 * Last Modified: 2026-02-25
 *
 * Key Components:
 * - ImportManagementPage: Full page with header, tabs, filters, file list, detail panel
 */

import React, { useCallback, useEffect, useState } from "react";
import SlidePanel from "../../../components/ui/SlidePanel";
import { usePermissions } from "../../../hooks/usePermissions";
import { getFileTrackerRows } from "../../../api/importManagementApi";
import useImportManagement from "./hooks/useImportManagement";
import ImportFileDetailPanel from "./ImportFileDetailPanel";
import AutoImportSettingsPanel from "./AutoImportSettingsPanel";
import ImportFileRowsPopup from "./ImportFileRowsPopup";
import "./_ImportManagement.scss";

// ── Status badge mapping ──
const STATUS_BADGE = {
    Completed: "m365-badge--success",
    Failed: "m365-badge--error",
    Pending: "m365-badge--warning",
    Skipped: "m365-badge--neutral",
    Processing: "m365-badge--primary",
};

// ── Tab definitions ──
const TABS = [
    { id: "all", label: "All" },
    { id: "Completed", label: "Completed" },
    { id: "Failed", label: "Failed" },
    { id: "Pending", label: "Pending" },
    { id: "Skipped", label: "Skipped" },
    { id: "Processing", label: "Processing" },
];

// ── Sortable column definitions ──
const COLUMNS = [
    { key: "FileName", label: "File Name", flex: 3 },
    { key: "DetectedSiteName", label: "Site", flex: 2 },
    { key: "reportType", label: "Type", flex: 1, sortKey: "ReportType" },
    { key: "Status", label: "Status", flex: 1 },
    { key: "totalRecords", label: "Records", flex: 1, sortKey: "TotalRecords" },
    { key: "UpdatedAt", label: "Last Updated", flex: 2 },
];

const formatDateShort = (dateStr) => {
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

const ImportManagementPage = () => {
    const {
        files,
        totalCount,
        totalPages,
        totalAll,
        summary,
        loading,
        error,
        retryingId,
        onDemandRunning,
        profileRunningId,
        activeJobId,
        activeTab,
        search,
        reportType,
        dateFrom,
        dateTo,
        page,
        sortBy,
        sortDirection,
        selectedFile,
        handleTabChange,
        handleSearchChange,
        handleReportTypeChange,
        handleDateFromChange,
        handleDateToChange,
        handleClearLogs,
        handleSortChange,
        handlePageChange,
        handleRetry,
        handleOnDemandTest,
        handleProfileImport,
        handleCancelImport,
        handleSelectFile,
        handleCloseDetail,
        refreshFiles,
    } = useImportManagement();

    const [showSettings, setShowSettings] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showOnDemandConfirm, setShowOnDemandConfirm] = useState(false);
    const [forceReprocess, setForceReprocess] = useState(false);
    const [rowPopupFile, setRowPopupFile] = useState(null);
    const [rowPopupViewMode, setRowPopupViewMode] = useState("imported");
    const [rowPopupRows, setRowPopupRows] = useState([]);
    const [rowPopupLoading, setRowPopupLoading] = useState(false);
    const [rowPopupError, setRowPopupError] = useState(null);
    const [rowPopupNote, setRowPopupNote] = useState("");
    const [rowPopupTotalCount, setRowPopupTotalCount] = useState(0);
    const { hasPermission } = usePermissions();
    const canManageImport = hasPermission("_Manage_FuelImport");

    // ── Retry with toast-style feedback ──
    const onRetryClick = useCallback(
        async (id, e) => {
            if (e) e.stopPropagation();
            const result = await handleRetry(id);
            // Could integrate a toast notification here
            if (!result.success) {
                console.warn("Retry failed:", result.message);
            }
        },
        [handleRetry]
    );

    const onOnDemandTestClick = useCallback(() => {
        setForceReprocess(false);
        setShowOnDemandConfirm(true);
    }, []);

    const onOnDemandConfirm = useCallback(async () => {
        setShowOnDemandConfirm(false);
        const result = await handleOnDemandTest({ forceReprocess });
        if (!result.success) {
            console.warn("On-demand test failed:", result.message);
        }
    }, [handleOnDemandTest, forceReprocess]);

    const loadFileRows = useCallback(async (fileId, viewMode) => {
        setRowPopupLoading(true);
        setRowPopupError(null);

        try {
            const response = await getFileTrackerRows(fileId, { viewMode });
            if (response?.isSuccess) {
                const data = response.data || {};
                setRowPopupRows(data.rows || []);
                setRowPopupNote(data.note || "");
                setRowPopupTotalCount(data.totalCount || 0);
                return;
            }

            setRowPopupRows([]);
            setRowPopupNote("");
            setRowPopupTotalCount(0);
            setRowPopupError(response?.message || "Failed to load row details.");
        } catch (err) {
            console.error("Error fetching file tracker rows:", err);
            setRowPopupRows([]);
            setRowPopupNote("");
            setRowPopupTotalCount(0);
            setRowPopupError(err.message || "Failed to load row details.");
        } finally {
            setRowPopupLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!rowPopupFile?.id) {
            return;
        }

        loadFileRows(rowPopupFile.id, rowPopupViewMode);
    }, [rowPopupFile, rowPopupViewMode, loadFileRows]);

    const handleOpenRowsPopup = useCallback((file, event) => {
        if (event) {
            event.stopPropagation();
        }

        setRowPopupFile(file);
        setRowPopupViewMode("imported");
        setRowPopupRows([]);
        setRowPopupError(null);
        setRowPopupNote("");
        setRowPopupTotalCount(0);
    }, []);

    const handleCloseRowsPopup = useCallback(() => {
        setRowPopupFile(null);
        setRowPopupRows([]);
        setRowPopupError(null);
        setRowPopupNote("");
        setRowPopupTotalCount(0);
        setRowPopupLoading(false);
    }, []);

    // ── Tab count helper ──
    const getTabCount = (tabId) => {
        switch (tabId) {
            case "all": return totalAll;
            case "Completed": return summary.completedCount;
            case "Failed": return summary.failedCount;
            case "Pending": return summary.pendingCount;
            case "Skipped": return summary.skippedCount;
            case "Processing": return summary.processingCount;
            default: return 0;
        }
    };

    // ── Sort indicator ──
    const renderSortIcon = (colKey) => {
        const sortKey = COLUMNS.find((c) => c.key === colKey)?.sortKey || colKey;
        if (sortBy !== sortKey && sortBy !== colKey) return null;
        return (
            <i
                className={`fa-light ${sortDirection === "asc" ? "fa-sort-up" : "fa-sort-down"} tw-ml-1`}
                style={{ fontSize: 10, color: "#0078d4" }}
            />
        );
    };

    return (
        <div className="import-mgmt">
            {/* ── Page Header ── */}
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-gear-complex m365-page-header__icon" />
                    <h2 className="m365-page-header__title">
                        Import Management
                        <span className="m365-page-header__count">{totalAll}</span>
                    </h2>
                </div>
                <div className="m365-page-header__actions">
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={onOnDemandTestClick}
                        disabled={onDemandRunning || !canManageImport}
                        title="Trigger on-demand import test"
                    >
                        <i className={`fa-light ${onDemandRunning ? "fa-spinner-third fa-spin" : "fa-vial"}`} />
                        {onDemandRunning ? "Running Test…" : "On-Demand Test"}
                    </button>
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={() => setShowSettings(true)}
                        title="Auto-Import Settings"
                    >
                        <i className="fa-light fa-gear" />
                        Settings
                    </button>
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={refreshFiles}
                        disabled={loading}
                    >
                        <i className={`fa-light ${loading ? "fa-spinner-third fa-spin" : "fa-rotate-right"}`} />
                        Refresh
                    </button>
                    {canManageImport && (
                        <button
                            className="m365-btn m365-btn--danger"
                            onClick={() => setShowClearConfirm(true)}
                            disabled={loading}
                            title="Clear filtered log records"
                        >
                            <i className="fa-light fa-trash-can" />
                            Clear Logs
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="m365-tabs">
                {TABS.map((tab) => {
                    const count = getTabCount(tab.id);
                    return (
                        <button
                            key={tab.id}
                            className={`m365-tab ${activeTab === tab.id ? "m365-tab--active" : ""}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span
                                    className={
                                        tab.id === "Failed" && count > 0
                                            ? "m365-tab-badge"
                                            : "m365-page-header__count"
                                    }
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Filters ── */}
            <div className="m365-filters">
                <div className="m365-search">
                    <i className="fa-light fa-magnifying-glass m365-search__icon" />
                    <input
                        className="m365-search__input"
                        placeholder="Search by file name or site…"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <select
                    className="m365-select"
                    value={reportType}
                    onChange={(e) => handleReportTypeChange(e.target.value)}
                >
                    <option value="">All Report Types</option>
                    <option value="km/l">km/l</option>
                    <option value="l/hr">l/hr</option>
                </select>
                <input
                    type="date"
                    className="m365-date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    title="From date"
                    placeholder="From"
                />
                <input
                    type="date"
                    className="m365-date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    title="To date"
                    placeholder="To"
                />
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="m365-info-banner m365-info-banner--error">
                    <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                    <div className="m365-info-banner__content">
                        <span className="m365-info-banner__text">{error}</span>
                    </div>
                    <button className="m365-info-banner__dismiss" onClick={() => refreshFiles()}>
                        <i className="fa-light fa-rotate-right" />
                    </button>
                </div>
            )}

            {/* ── File List ── */}
            <div className="import-mgmt__list-container">
                {/* Column Headers */}
                <div className="import-mgmt__list-header">
                    {COLUMNS.map((col) => (
                        <div
                            key={col.key}
                            className="import-mgmt__col-header"
                            style={{ flex: col.flex }}
                            onClick={() => handleSortChange(col.sortKey || col.key)}
                            role="button"
                            tabIndex={0}
                        >
                            {col.label}
                            {renderSortIcon(col.key)}
                        </div>
                    ))}
                    <div className="import-mgmt__col-header" style={{ width: 96 }}>
                        {/* Actions */}
                    </div>
                </div>

                {/* Rows */}
                <div className="import-mgmt__list-body">
                    {loading && files.length === 0 ? (
                        <div className="import-mgmt__empty">
                            <i className="fa-light fa-spinner-third fa-spin" style={{ fontSize: 24, color: "#0078d4" }} />
                            <span className="tw-mt-2">Loading files…</span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="import-mgmt__empty">
                            <i className="fa-light fa-folder-open" style={{ fontSize: 32, color: "#a19f9d" }} />
                            <span className="tw-mt-2" style={{ color: "#605e5c" }}>No files found</span>
                        </div>
                    ) : (
                        files.map((file) => {
                            const statusCls = STATUS_BADGE[file.status] || "m365-badge--neutral";
                            const isSelected = selectedFile?.id === file.id;
                            return (
                                <div
                                    key={file.id}
                                    className={`import-mgmt__row ${isSelected ? "import-mgmt__row--selected" : ""}`}
                                    onClick={() => handleSelectFile(file)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    {/* File Name */}
                                    <div className="import-mgmt__cell" style={{ flex: 3 }}>
                                        <i className="fa-light fa-file-spreadsheet tw-mr-2" style={{ color: "#0078d4" }} />
                                        <span className="import-mgmt__filename" title={file.fileName}>
                                            {file.fileName}
                                        </span>
                                    </div>
                                    {/* Site */}
                                    <div className="import-mgmt__cell" style={{ flex: 2 }}>
                                        {file.detectedSiteName || "—"}
                                    </div>
                                    {/* Type */}
                                    <div className="import-mgmt__cell" style={{ flex: 1 }}>
                                        {file.reportType ? (
                                            <span className="m365-badge m365-badge--primary">{file.reportType}</span>
                                        ) : "—"}
                                    </div>
                                    {/* Status */}
                                    <div className="import-mgmt__cell" style={{ flex: 1 }}>
                                        <span className={`m365-badge ${statusCls}`}>{file.status}</span>
                                    </div>
                                    {/* Records */}
                                    <div className="import-mgmt__cell" style={{ flex: 1 }}>
                                        {file.totalRecords ?? 0}
                                    </div>
                                    {/* Updated */}
                                    <div className="import-mgmt__cell" style={{ flex: 2 }}>
                                        {formatDateShort(file.updatedAt)}
                                    </div>
                                    {/* Actions */}
                                    <div className="import-mgmt__cell" style={{ width: 96, justifyContent: "center", gap: 6 }}>
                                        <button
                                            className="m365-icon-btn"
                                            title="View imported data rows"
                                            onClick={(e) => handleOpenRowsPopup(file, e)}
                                        >
                                            <i className="fa-light fa-table" />
                                        </button>
                                        {file.canRetry && (
                                            <button
                                                className="m365-icon-btn"
                                                title="Retry import"
                                                onClick={(e) => onRetryClick(file.id, e)}
                                                disabled={retryingId === file.id || !canManageImport}
                                            >
                                                <i
                                                    className={`fa-light ${retryingId === file.id ? "fa-spinner-third fa-spin" : "fa-rotate-right"
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="import-mgmt__pagination">
                        <span className="import-mgmt__pagination-info">
                            Page {page} of {totalPages} ({totalCount} files)
                        </span>
                        <div className="import-mgmt__pagination-btns">
                            <button
                                className="m365-btn m365-btn--ghost"
                                disabled={page <= 1}
                                onClick={() => handlePageChange(page - 1)}
                            >
                                <i className="fa-light fa-chevron-left" />
                            </button>
                            <button
                                className="m365-btn m365-btn--ghost"
                                disabled={page >= totalPages}
                                onClick={() => handlePageChange(page + 1)}
                            >
                                <i className="fa-light fa-chevron-right" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Panel ── */}
            <SlidePanel
                open={!!selectedFile}
                onClose={handleCloseDetail}
                title="File Details"
                width={640}
            >
                <ImportFileDetailPanel
                    file={selectedFile}
                    onRetry={onRetryClick}
                    retrying={retryingId === selectedFile?.id}
                />
            </SlidePanel>

            <ImportFileRowsPopup
                file={rowPopupFile}
                viewMode={rowPopupViewMode}
                onViewModeChange={setRowPopupViewMode}
                rows={rowPopupRows}
                loading={rowPopupLoading}
                error={rowPopupError}
                note={rowPopupNote}
                totalCount={rowPopupTotalCount}
                onHiding={handleCloseRowsPopup}
            />

            {/* ── On-Demand Import Confirmation ── */}
            {showOnDemandConfirm && (
                <div className="import-mgmt__confirm-overlay">
                    <div className="import-mgmt__confirm-dialog">
                        <div className="import-mgmt__confirm-header">
                            <i className="fa-light fa-vial" style={{ color: "#0078d4", fontSize: 18 }} />
                            <h3>On-Demand Import</h3>
                        </div>
                        <p className="import-mgmt__confirm-text">
                            This will scan configured directories and import new or changed files.
                        </p>
                        <label className="import-mgmt__checkbox-label">
                            <input
                                type="checkbox"
                                checked={forceReprocess}
                                onChange={(e) => setForceReprocess(e.target.checked)}
                            />
                            <span>Reprocess all files</span>
                        </label>
                        {forceReprocess && (
                            <div className="m365-info-banner m365-info-banner--warning tw-mt-2">
                                <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                                <span className="m365-info-banner__text">
                                    All files will be re-imported, including previously completed ones.
                                    Duplicate handling per profile will determine whether existing records are skipped or replaced.
                                </span>
                            </div>
                        )}
                        <div className="import-mgmt__confirm-actions">
                            <button
                                className="m365-btn m365-btn--ghost"
                                onClick={() => setShowOnDemandConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="m365-btn m365-btn--primary"
                                onClick={onOnDemandConfirm}
                            >
                                <i className="fa-light fa-play" />
                                Run Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Clear Logs Confirmation ── */}
            {showClearConfirm && (
                <div className="import-mgmt__confirm-overlay">
                    <div className="import-mgmt__confirm-dialog">
                        <div className="import-mgmt__confirm-header">
                            <i className="fa-light fa-triangle-exclamation" style={{ color: "#d13438", fontSize: 18 }} />
                            <h3>Clear Log Records</h3>
                        </div>
                        <p className="import-mgmt__confirm-text">
                            This will permanently delete the currently filtered log records.
                            Records with "Processing" status are always excluded.
                        </p>
                        <div className="import-mgmt__confirm-actions">
                            <button
                                className="m365-btn m365-btn--ghost"
                                onClick={() => setShowClearConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="m365-btn m365-btn--danger"
                                onClick={async () => {
                                    setShowClearConfirm(false);
                                    await handleClearLogs();
                                }}
                            >
                                <i className="fa-light fa-trash-can" />
                                Clear Logs
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings Panel ── */}
            <SlidePanel
                open={showSettings}
                onClose={() => setShowSettings(false)}
                title="Auto-Import Settings"
                width={750}
            >
                <AutoImportSettingsPanel
                    onClose={() => setShowSettings(false)}
                    onProfileImport={handleProfileImport}
                    onCancelImport={handleCancelImport}
                    profileRunningId={profileRunningId}
                />
            </SlidePanel>
        </div>
    );
};

export default ImportManagementPage;
