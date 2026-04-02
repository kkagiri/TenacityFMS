/**
 * File: useImportManagement.js
 * Purpose: Custom hook managing state and data-fetching for the Import Management page
 * Dependencies: react, importManagementApi
 * Last Modified: 2026-04-02
 *
 * Key Exports:
 * - useImportManagement(): Returns files, loading, filters, pagination, actions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
    getFileTrackerList,
    retryFileImport,
    triggerOnDemandImport,
    triggerProfileImport,
    cancelImportJob,
    clearImportLogs,
} from "../../../../api/importManagementApi";
import businessSignalRService from "../../../../signalR/businessSignalRService";
import notify from "devextreme/ui/notify";

const DEFAULT_PAGE_SIZE = 50;
const RUNNING_JOB_STALE_AFTER_MS = 15000;

const useImportManagement = () => {
    // ── Data state ──
    const [files, setFiles] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [summary, setSummary] = useState({
        pendingCount: 0,
        processingCount: 0,
        completedCount: 0,
        failedCount: 0,
        skippedCount: 0,
    });

    // ── UI state ──
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryingId, setRetryingId] = useState(null);
    const [onDemandRunning, setOnDemandRunning] = useState(false);
    const [profileRunningId, setProfileRunningId] = useState(null);
    const [activeJobId, setActiveJobId] = useState(null);
    const [activeJobStartedAt, setActiveJobStartedAt] = useState(null);

    // ── Filters / pagination ──
    const [activeTab, setActiveTab] = useState("all"); // all | Completed | Failed | Pending | Skipped | Processing
    const [search, setSearch] = useState("");
    const [reportType, setReportType] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState("UpdatedAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // ── Selected file for detail panel ──
    const [selectedFile, setSelectedFile] = useState(null);

    // Debounce ref for search
    const searchTimerRef = useRef(null);

    const resetActiveImportState = useCallback(() => {
        setProfileRunningId(null);
        setActiveJobId(null);
        setActiveJobStartedAt(null);
    }, []);

    // ── Fetch logic ──
    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                pageSize,
                sortBy,
                sortDirection,
            };
            if (activeTab !== "all") params.status = activeTab;
            if (search.trim()) params.search = search.trim();
            if (reportType) params.reportType = reportType;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;

            const response = await getFileTrackerList(params);

            if (response?.isSuccess) {
                const data = response.data;
                setFiles(data.items || []);
                setTotalCount(data.totalCount || 0);
                setTotalPages(data.totalPages || 0);
                setSummary({
                    pendingCount: data.pendingCount ?? 0,
                    processingCount: data.processingCount ?? 0,
                    completedCount: data.completedCount ?? 0,
                    failedCount: data.failedCount ?? 0,
                    skippedCount: data.skippedCount ?? 0,
                });
            } else {
                setError(response?.message || "Failed to load files");
            }
        } catch (err) {
            console.error("Error fetching file tracker list:", err);
            setError(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sortBy, sortDirection, activeTab, search, reportType, dateFrom, dateTo]);

    // Auto-fetch when dependencies change
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    useEffect(() => {
        if (!selectedFile) {
            return;
        }

        const refreshedFile = files.find((file) => file.id === selectedFile.id);
        if (refreshedFile && refreshedFile !== selectedFile) {
            setSelectedFile(refreshedFile);
        }
    }, [files, selectedFile]);

    useEffect(() => {
        if (!activeJobId || !activeJobStartedAt) {
            return;
        }

        if (summary.processingCount > 0) {
            return;
        }

        const elapsed = Date.now() - activeJobStartedAt;
        if (elapsed < RUNNING_JOB_STALE_AFTER_MS) {
            return;
        }

        resetActiveImportState();
        notify("Cleared stale import state because no active processing job remains.", "warning", 4000);
    }, [activeJobId, activeJobStartedAt, summary.processingCount, resetActiveImportState]);

    // ── SignalR: listen for background import completion / error / cancel ──
    useEffect(() => {
        const unsubCompleted = businessSignalRService.on("fuelImportCompleted", (data) => {
            resetActiveImportState();
            fetchFiles();

            const msg = data?.isSuccess
                ? "Import completed successfully"
                : "Import completed with errors";
            notify(msg, data?.isSuccess ? "success" : "warning", 4000);
        });

        const unsubError = businessSignalRService.on("fuelImportError", (data) => {
            resetActiveImportState();
            if (data?.message) {
                setError(data.message);
            }
            notify(data?.message || "Import failed", "error", 5000);
        });

        const unsubCancelled = businessSignalRService.on("fuelImportCancelled", (data) => {
            resetActiveImportState();
            fetchFiles();
            notify("Import was cancelled", "warning", 3000);
        });

        return () => {
            if (unsubCompleted) unsubCompleted();
            if (unsubError) unsubError();
            if (unsubCancelled) unsubCancelled();
        };
    }, [fetchFiles, resetActiveImportState]);

    // ── Handlers ──

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setPage(1);
    }, []);

    const handleSearchChange = useCallback((value) => {
        setSearch(value);
        // Reset page when searching
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setPage(1);
        }, 300);
    }, []);

    const handleReportTypeChange = useCallback((value) => {
        setReportType(value);
        setPage(1);
    }, []);

    const handleDateFromChange = useCallback((value) => {
        setDateFrom(value);
        setPage(1);
    }, []);

    const handleDateToChange = useCallback((value) => {
        setDateTo(value);
        setPage(1);
    }, []);

    const handleSortChange = useCallback((field) => {
        setSortBy((prev) => {
            if (prev === field) {
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                return prev;
            }
            setSortDirection("desc");
            return field;
        });
        setPage(1);
    }, []);

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    const handleRetry = useCallback(
        async (id) => {
            setRetryingId(id);
            try {
                const response = await retryFileImport(id);
                if (response?.isSuccess) {
                    // Refresh list after successful retry
                    await fetchFiles();
                    // If detail panel is open for this file, update it
                    if (selectedFile && selectedFile.id === id) {
                        const updatedFile = files.find((f) => f.id === id);
                        if (updatedFile) setSelectedFile(updatedFile);
                    }
                    return { success: true, message: response.message };
                }
                return { success: false, message: response?.message || "Retry failed" };
            } catch (err) {
                console.error("Error retrying import:", err);
                return { success: false, message: err.message || "Network error" };
            } finally {
                setRetryingId(null);
            }
        },
        [fetchFiles, selectedFile, files]
    );

    const handleOnDemandTest = useCallback(async (options = {}) => {
        setOnDemandRunning(true);
        setError(null);
        try {
            const response = await triggerOnDemandImport({
                batchSize: pageSize,
                includeRetries: true,
                forceReprocess: options.forceReprocess || false,
            });

            if (response?.isSuccess) {
                await fetchFiles();
                return { success: true, message: response.message || "On-demand import completed" };
            }

            return { success: false, message: response?.message || "On-demand import failed" };
        } catch (err) {
            console.error("Error triggering on-demand import:", err);
            return { success: false, message: err.message || "Network error" };
        } finally {
            setOnDemandRunning(false);
        }
    }, [fetchFiles, pageSize]);

    const handleProfileImport = useCallback(async (profileId, options = {}) => {
        setProfileRunningId(profileId);
        setActiveJobId(null);
        setActiveJobStartedAt(null);
        setError(null);
        try {
            const response = await triggerProfileImport(profileId, options);
            if (!response?.isSuccess) {
                resetActiveImportState();
                return { success: false, message: response?.message || "Failed to start profile import" };
            }
            // Store the jobId so we can cancel this job later
            const jobId = response?.data?.jobId;
            if (jobId) {
                setActiveJobId(jobId);
                setActiveJobStartedAt(Date.now());
            }
            // Import is now running in the background — SignalR will notify when done
            return { success: true, message: "Import started", jobId };
        } catch (err) {
            console.error("Error triggering profile import:", err);
            resetActiveImportState();
            return { success: false, message: err.message || "Network error" };
        }
    }, [resetActiveImportState]);

    const handleCancelImport = useCallback(async () => {
        if (!activeJobId) return;
        try {
            await cancelImportJob(activeJobId);
            // The actual state cleanup happens via the fuelImportCancelled SignalR event
        } catch (err) {
            console.error("Error cancelling import:", err);
            const status = err?.response?.status;
            const responseMessage = err?.response?.data?.message || err?.response?.data?.Message;
            const errorMessage = responseMessage || err.message || "Failed to cancel import";

            if (status === 404 && /No running import job found/i.test(errorMessage)) {
                resetActiveImportState();
                await fetchFiles();
                notify("The import job is no longer running. Cleared stale import state.", "warning", 4000);
                return;
            }

            notify("Failed to cancel import", "error", 3000);
        }
    }, [activeJobId, fetchFiles, resetActiveImportState]);

    const handleSelectFile = useCallback((file) => {
        setSelectedFile(file);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedFile(null);
    }, []);

    const handleClearLogs = useCallback(async () => {
        try {
            const params = {};
            if (activeTab !== "all") params.status = activeTab;
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;
            const response = await clearImportLogs(params);
            if (response?.isSuccess) {
                notify(`Cleared ${response.data?.deletedCount ?? 0} log records`, "success", 3000);
                await fetchFiles();
            } else {
                notify(response?.message || "Failed to clear logs", "error", 4000);
            }
        } catch (err) {
            console.error("Error clearing logs:", err);
            notify("Failed to clear logs", "error", 4000);
        }
    }, [activeTab, dateFrom, dateTo, fetchFiles]);

    const totalAll =
        summary.pendingCount +
        summary.processingCount +
        summary.completedCount +
        summary.failedCount +
        summary.skippedCount;

    return {
        // Data
        files,
        totalCount,
        totalPages,
        totalAll,
        summary,

        // UI state
        loading,
        error,
        retryingId,
        onDemandRunning,
        profileRunningId,
        activeJobId,

        // Filters
        activeTab,
        search,
        reportType,
        dateFrom,
        dateTo,
        page,
        pageSize,
        sortBy,
        sortDirection,

        // Selected
        selectedFile,

        // Actions
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
        refreshFiles: fetchFiles,
    };
};

export default useImportManagement;
