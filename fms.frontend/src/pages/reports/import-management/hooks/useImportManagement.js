/**
 * File: useImportManagement.js
 * Purpose: Custom hook managing state and data-fetching for the Import Management page
 * Dependencies: react, importManagementApi
 * Last Modified: 2026-02-25
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
} from "../../../../api/importManagementApi";
import businessSignalRService from "../../../../signalR/businessSignalRService";
import notify from "devextreme/ui/notify";

const DEFAULT_PAGE_SIZE = 50;

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

    // ── Filters / pagination ──
    const [activeTab, setActiveTab] = useState("all"); // all | Completed | Failed | Pending | Skipped | Processing
    const [search, setSearch] = useState("");
    const [reportType, setReportType] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState("UpdatedAt");
    const [sortDirection, setSortDirection] = useState("desc");

    // ── Selected file for detail panel ──
    const [selectedFile, setSelectedFile] = useState(null);

    // Debounce ref for search
    const searchTimerRef = useRef(null);

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
    }, [page, pageSize, sortBy, sortDirection, activeTab, search, reportType]);

    // Auto-fetch when dependencies change
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // ── SignalR: listen for background import completion / error / cancel ──
    useEffect(() => {
        const unsubCompleted = businessSignalRService.on("fuelImportCompleted", (data) => {
            // Clear running state if this profile finished
            setProfileRunningId((current) => {
                if (current && data?.profileId === current) return null;
                return current;
            });
            setActiveJobId(null);
            fetchFiles();

            const msg = data?.isSuccess
                ? "Import completed successfully"
                : "Import completed with errors";
            notify(msg, data?.isSuccess ? "success" : "warning", 4000);
        });

        const unsubError = businessSignalRService.on("fuelImportError", (data) => {
            setProfileRunningId((current) => {
                if (current && data?.profileId === current) return null;
                return current;
            });
            setActiveJobId(null);
            if (data?.message) {
                setError(data.message);
            }
            notify(data?.message || "Import failed", "error", 5000);
        });

        const unsubCancelled = businessSignalRService.on("fuelImportCancelled", (data) => {
            setProfileRunningId((current) => {
                if (current && data?.profileId === current) return null;
                return current;
            });
            setActiveJobId(null);
            fetchFiles();
            notify("Import was cancelled", "warning", 3000);
        });

        return () => {
            if (unsubCompleted) unsubCompleted();
            if (unsubError) unsubError();
            if (unsubCancelled) unsubCancelled();
        };
    }, [fetchFiles]);

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

    const handleOnDemandTest = useCallback(async () => {
        setOnDemandRunning(true);
        setError(null);
        try {
            const response = await triggerOnDemandImport({
                batchSize: pageSize,
                includeRetries: true,
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

    const handleProfileImport = useCallback(async (profileId) => {
        setProfileRunningId(profileId);
        setActiveJobId(null);
        setError(null);
        try {
            const response = await triggerProfileImport(profileId);
            if (!response?.isSuccess) {
                setProfileRunningId(null);
                return { success: false, message: response?.message || "Failed to start profile import" };
            }
            // Store the jobId so we can cancel this job later
            const jobId = response?.data?.jobId;
            if (jobId) setActiveJobId(jobId);
            // Import is now running in the background — SignalR will notify when done
            return { success: true, message: "Import started", jobId };
        } catch (err) {
            console.error("Error triggering profile import:", err);
            setProfileRunningId(null);
            return { success: false, message: err.message || "Network error" };
        }
    }, []);

    const handleCancelImport = useCallback(async () => {
        if (!activeJobId) return;
        try {
            await cancelImportJob(activeJobId);
            // The actual state cleanup happens via the fuelImportCancelled SignalR event
        } catch (err) {
            console.error("Error cancelling import:", err);
            notify("Failed to cancel import", "error", 3000);
        }
    }, [activeJobId]);

    const handleSelectFile = useCallback((file) => {
        setSelectedFile(file);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedFile(null);
    }, []);

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
