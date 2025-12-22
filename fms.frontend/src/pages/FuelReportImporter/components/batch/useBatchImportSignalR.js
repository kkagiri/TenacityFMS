/**
 * File: useBatchImportSignalR.js
 * Purpose: Custom hook for managing SignalR connections for batch import
 * Last Modified: 2025-12-03
 *
 * This hook encapsulates all SignalR-related logic for the batch import feature,
 * including event handlers for progress, completion, errors, and cancellation.
 */
import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import businessSignalRService from "../../../../signalR/businessSignalRService";
import {
  setupAsyncImportListeners,
  setupFuelImportProgressListener,
} from "../../../../redux/actions/fuelReportActions";

/**
 * Custom hook for managing SignalR connections and handlers for batch import
 * @param {Object} params - Hook parameters
 * @param {Function} params.setFiles - State setter for files array
 * @param {Function} params.setImportProgress - State setter for import progress
 * @param {Function} params.setActiveJobId - State setter for active job ID
 * @param {React.MutableRefObject} params.activeJobIdRef - Ref for active job ID
 * @param {React.MutableRefObject} params.pendingJobsMapRef - Ref for pending jobs map
 * @param {Function} params.setPendingJobsMap - State setter for pending jobs map
 * @param {React.MutableRefObject} params.importResolversRef - Ref for import promise resolvers
 * @returns {Object} SignalR utilities
 */
const useBatchImportSignalR = ({
  setFiles,
  setImportProgress,
  setActiveJobId,
  activeJobIdRef,
  pendingJobsMapRef,
  setPendingJobsMap,
  importResolversRef,
}) => {
  const dispatch = useDispatch();

  // Update file status helper
  const updateFileStatus = useCallback(
    (fileId, statusUpdate) => {
      if (fileId === null || fileId === undefined) return;
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, ...statusUpdate } : f))
      );
    },
    [setFiles]
  );

  // Handle job started event
  const handleJobStarted = useCallback(
    (data) => {
      console.log("[BatchImport] Import job started - raw:", data);
      const jobId = data.JobId ?? data.jobId;
      const totalRecords = data.TotalRecords ?? data.totalRecords ?? 0;

      if (jobId && pendingJobsMapRef.current.has(jobId)) {
        const fileId = pendingJobsMapRef.current.get(jobId);
        updateFileStatus(fileId, {
          status: `Processing: Starting (0/${totalRecords} - 0%)`,
          statusIcon: "fa-light fa-spinner fa-spin",
          statusColor: "tw-text-blue-500",
        });
      }
    },
    [pendingJobsMapRef, updateFileStatus]
  );

  // Handle progress update event
  const handleProgressUpdate = useCallback(
    (data) => {
      console.log("[BatchImport] Import progress - raw:", data);
      const jobId = data.JobId ?? data.jobId;

      const normalizedProgress = {
        jobId: jobId,
        totalRecords: data.TotalRecords ?? data.totalRecords ?? 0,
        processedRecords: data.ProcessedRecords ?? data.processedRecords ?? 0,
        successCount: data.SuccessCount ?? data.successCount ?? 0,
        failureCount: data.FailureCount ?? data.failureCount ?? 0,
        skippedCount: data.SkippedCount ?? data.skippedCount ?? 0,
        duplicateCount: data.DuplicateCount ?? data.duplicateCount ?? 0,
        status: data.Status ?? data.status ?? "Processing",
        progressPercentage:
          data.ProgressPercentage ?? data.progressPercentage ?? 0,
        reportId: data.ReportId ?? data.reportId,
      };

      setImportProgress(normalizedProgress);

      if (jobId && pendingJobsMapRef.current.has(jobId)) {
        const fileId = pendingJobsMapRef.current.get(jobId);
        const progressPercent =
          normalizedProgress.progressPercentage ||
          (normalizedProgress.totalRecords > 0
            ? Math.round(
                (normalizedProgress.processedRecords /
                  normalizedProgress.totalRecords) *
                  100
              )
            : 0);

        const stage = String(normalizedProgress.status || "Processing").trim();
        const stageLabel = stage.length > 0 ? stage : "Processing";

        updateFileStatus(fileId, {
          status: `Processing: ${stageLabel} (${normalizedProgress.processedRecords}/${normalizedProgress.totalRecords} - ${progressPercent}%)`,
          statusIcon: "fa-light fa-spinner fa-spin",
          statusColor: "tw-text-blue-500",
          progress: normalizedProgress,
        });
      }
    },
    [pendingJobsMapRef, setImportProgress, updateFileStatus]
  );

  // Find resolver by jobId (handles type coercion)
  const findResolver = useCallback(
    (jobId) => {
      let resolver = jobId ? importResolversRef.current.get(jobId) : null;
      if (!resolver && jobId) {
        for (const [key, value] of importResolversRef.current.entries()) {
          if (String(key) === String(jobId)) {
            resolver = value;
            break;
          }
        }
      }
      return resolver;
    },
    [importResolversRef]
  );

  // Find file id by jobId (handles type coercion)
  const findFileId = useCallback(
    (jobId) => {
      let fileId = jobId ? pendingJobsMapRef.current.get(jobId) : null;
      if (fileId === undefined && jobId) {
        for (const [key, value] of pendingJobsMapRef.current.entries()) {
          if (String(key) === String(jobId)) {
            fileId = value;
            break;
          }
        }
      }
      return fileId;
    },
    [pendingJobsMapRef]
  );

  // Handle job completion event
  const handleCompletion = useCallback(
    (data) => {
      console.log(
        "[BatchImport] Import completed - raw:",
        JSON.stringify(data, null, 2)
      );
      const jobId = data.JobId || data.jobId;

      const resolver = findResolver(jobId);
      const fileId = findFileId(jobId);

      const isSuccess = data.IsSuccess ?? data.isSuccess ?? false;
      const resultData = data.Data || data.data || {};
      const errorMessage = data.Message || data.message || "Import failed";
      const successCount =
        resultData.SuccessCount ?? resultData.successCount ?? 0;
      const totalProcessed =
        resultData.TotalProcessed ?? resultData.totalProcessed ?? 0;
      const skippedCount =
        resultData.SkippedCount ?? resultData.skippedCount ?? 0;
      const duplicateCount =
        resultData.DuplicateCount ?? resultData.duplicateCount ?? 0;
      const duplicateRecords =
        resultData.DuplicateRecords ?? resultData.duplicateRecords ?? [];

      // Check if error message mentions duplicates even if duplicateRecords array is empty
      const isDuplicateError =
        (duplicateRecords && duplicateRecords.length > 0) ||
        duplicateCount > 0 ||
        errorMessage.toLowerCase().includes("duplicate");

      // Update file status
      if (fileId !== null && fileId !== undefined) {
        if (isSuccess) {
          const allDuplicates = skippedCount > 0 && successCount === 0;
          if (allDuplicates) {
            updateFileStatus(fileId, {
              status: "Skipped (All Duplicates)",
              statusIcon: "fa-light fa-copy",
              statusColor: "tw-text-yellow-600",
              info: `All ${skippedCount} records already exist.`,
              resultSummary: {
                recordCount: 0,
                skippedCount,
                duplicateCount: duplicateCount || skippedCount,
                message: errorMessage,
              },
            });
          } else if (skippedCount > 0) {
            updateFileStatus(fileId, {
              status: `Partial (${successCount} imported, ${skippedCount} skipped)`,
              statusIcon: "fa-light fa-check-circle",
              statusColor: "tw-text-yellow-600",
              resultSummary: {
                recordCount: successCount,
                skippedCount,
                duplicateCount,
                message: errorMessage,
              },
            });
          } else {
            updateFileStatus(fileId, {
              status: `Success (${successCount} records)`,
              statusIcon: "fa-light fa-check-circle",
              statusColor: "tw-text-green-500",
              resultSummary: {
                recordCount: successCount,
                skippedCount: 0,
                duplicateCount: 0,
                message: errorMessage,
              },
            });
          }
        } else {
          // Failed import - distinguish between duplicate errors and other failures
          updateFileStatus(fileId, {
            status: isDuplicateError ? `Failed (Duplicate Entries)` : "Failed",
            statusIcon: isDuplicateError
              ? "fa-light fa-copy"
              : "fa-light fa-exclamation-circle",
            statusColor: isDuplicateError
              ? "tw-text-orange-500"
              : "tw-text-red-500",
            error: errorMessage,
            errorDetails: {
              message: errorMessage,
              duplicates: duplicateRecords,
              skippedCount: skippedCount,
              duplicateCount: duplicateCount,
            },
            resultSummary: {
              recordCount: successCount,
              totalRecords: totalProcessed,
              skippedCount,
              duplicateCount,
              message: errorMessage,
            },
          });
        }
      }

      // Resolve/reject promise
      if (resolver) {
        if (resolver.timeoutId) {
          clearTimeout(resolver.timeoutId);
        }

        if (isSuccess) {
          resolver.resolve({
            success: true,
            recordCount: successCount || totalProcessed,
            skippedCount: skippedCount,
            allDuplicates: skippedCount > 0 && successCount === 0,
            message: errorMessage,
            duplicateRecords: duplicateRecords,
            duplicateCount: duplicateCount,
          });
        } else {
          const error = new Error(errorMessage);
          error.duplicates = duplicateRecords;
          error.skippedCount = skippedCount;
          error.duplicateCount = duplicateCount;
          error.isDuplicateError = isDuplicateError;
          error.message = errorMessage;
          resolver.reject(error);
        }
        importResolversRef.current.delete(jobId);
      }

      // Cleanup
      if (jobId) {
        pendingJobsMapRef.current.delete(jobId);
        setPendingJobsMap(new Map(pendingJobsMapRef.current));
      }

      if (activeJobIdRef.current === jobId) {
        setImportProgress(null);
        setActiveJobId(null);
        activeJobIdRef.current = null;
      }
    },
    [
      findResolver,
      findFileId,
      updateFileStatus,
      importResolversRef,
      pendingJobsMapRef,
      setPendingJobsMap,
      activeJobIdRef,
      setImportProgress,
      setActiveJobId,
    ]
  );

  // Handle error event
  const handleError = useCallback(
    (data) => {
      console.error("[BatchImport] Import error:", data);
      const jobId = data.JobId || data.jobId;
      const fileId = findFileId(jobId);

      if (fileId !== null && fileId !== undefined) {
        updateFileStatus(fileId, {
          status: "Failed",
          statusIcon: "fa-light fa-exclamation-circle",
          statusColor: "tw-text-red-500",
          error: data.Message || data.message || "Import error occurred",
        });
      }

      const resolver = findResolver(jobId);
      if (resolver) {
        const error = new Error(
          data.Message || data.message || "Import error occurred"
        );
        resolver.reject(error);
        importResolversRef.current.delete(jobId);
      }

      if (jobId) {
        pendingJobsMapRef.current.delete(jobId);
        setPendingJobsMap(new Map(pendingJobsMapRef.current));
      }

      if (activeJobIdRef.current === jobId) {
        setImportProgress(null);
        setActiveJobId(null);
        activeJobIdRef.current = null;
      }
    },
    [
      findFileId,
      findResolver,
      updateFileStatus,
      importResolversRef,
      pendingJobsMapRef,
      setPendingJobsMap,
      activeJobIdRef,
      setImportProgress,
      setActiveJobId,
    ]
  );

  // Handle cancellation event
  const handleCancelled = useCallback(
    (data) => {
      console.log("[BatchImport] Import cancelled:", data);
      const jobId = data.JobId || data.jobId;
      const fileId = findFileId(jobId);

      if (fileId !== null && fileId !== undefined) {
        updateFileStatus(fileId, {
          status: "Cancelled",
          statusIcon: "fa-light fa-ban",
          statusColor: "tw-text-gray-500",
          error: data.Message || data.message || "Import was cancelled",
        });
      }

      const resolver = findResolver(jobId);
      if (resolver) {
        const error = new Error(
          data.Message || data.message || "Import was cancelled"
        );
        error.cancelled = true;
        resolver.reject(error);
        importResolversRef.current.delete(jobId);
      }

      if (jobId) {
        pendingJobsMapRef.current.delete(jobId);
        setPendingJobsMap(new Map(pendingJobsMapRef.current));
      }

      if (activeJobIdRef.current === jobId) {
        setImportProgress(null);
        setActiveJobId(null);
        activeJobIdRef.current = null;
      }
    },
    [
      findFileId,
      findResolver,
      updateFileStatus,
      importResolversRef,
      pendingJobsMapRef,
      setPendingJobsMap,
      activeJobIdRef,
      setImportProgress,
      setActiveJobId,
    ]
  );

  // Setup SignalR listeners
  useEffect(() => {
    let unsubscribers = [];

    const setupListeners = async () => {
      try {
        await businessSignalRService.ensureConnection();
        await dispatch(setupFuelImportProgressListener());
        await dispatch(setupAsyncImportListeners());

        unsubscribers = [
          businessSignalRService.on("fuelImportJobStarted", handleJobStarted),
          businessSignalRService.on("fuelImportProgress", handleProgressUpdate),
          businessSignalRService.on("fuelImportCompleted", handleCompletion),
          businessSignalRService.on("fuelImportError", handleError),
          businessSignalRService.on("fuelImportCancelled", handleCancelled),
        ];
      } catch (error) {
        console.error(
          "[BatchImport] Error setting up SignalR listeners:",
          error
        );
      }
    };

    setupListeners();

    return () => {
      unsubscribers.forEach((unsub) => {
        if (unsub) unsub();
      });
    };
  }, [
    dispatch,
    handleJobStarted,
    handleProgressUpdate,
    handleCompletion,
    handleError,
    handleCancelled,
  ]);

  return {
    // Expose any utilities needed by the parent component
  };
};

export default useBatchImportSignalR;
