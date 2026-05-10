/**
 * File: useReportJobTracking.js
 * Purpose: React hook for managing async report job lifecycle with SignalR progress tracking
 * Dependencies: react, businessSignalRService, reportJobApi, devextreme notify
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - submitJob(dto): Submit a new async report job
 * - cancelActiveJob(): Cancel the active job
 * - downloadResult(): Download completed report
 * - dismissJob(): Clear the tracking state
 * - activeJob: Current job state object
 * - isTracking: Whether a job is actively being tracked
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  addReportProgress,
  updateReportProgress,
  clearReportProgress,
  addCompletedReport,
} from "../redux/actions/notificationActions";
import {
  submitReportJob,
  downloadJobResult,
  cancelJob,
  getJobStatus,
  requestEmailDelivery as requestEmailDeliveryApi,
} from "../api/reportJobApi";
import businessSignalRService from "../signalR/businessSignalRService";

/**
 * Report job status enum (mirrors backend ReportJobStatus)
 */
export const ReportJobStatus = {
  Queued: 0,
  FetchingData: 1,
  Rendering: 2,
  Completed: 3,
  Failed: 4,
  Cancelled: 5,
  EmailSent: 6,
};

/**
 * Status labels for display
 */
export const statusLabels = {
  [ReportJobStatus.Queued]: "Queued",
  [ReportJobStatus.FetchingData]: "Fetching Data...",
  [ReportJobStatus.Rendering]: "Rendering Report...",
  [ReportJobStatus.Completed]: "Completed",
  [ReportJobStatus.Failed]: "Failed",
  [ReportJobStatus.Cancelled]: "Cancelled",
  [ReportJobStatus.EmailSent]: "Emailed",
};

/**
 * Hook for tracking async report job progress via SignalR
 * @returns {Object} Job tracking state and control functions
 */
const useReportJobTracking = () => {
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);

  const [activeJob, setActiveJob] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const jobIdRef = useRef(null);
  // Refs to capture submitted metadata for completed-report history
  const reportTitleRef = useRef('Report');
  const reportSourceIdRef = useRef('');
  const activeJobRef = useRef(null);
  const listenerCleanupRef = useRef(null);

  // Keep activeJobRef in sync so SignalR callbacks can read latest value
  useEffect(() => { activeJobRef.current = activeJob; }, [activeJob]);

  // Clean up SignalR listeners on unmount
  useEffect(() => {
    return () => {
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
        listenerCleanupRef.current = null;
      }
    };
  }, []);

  /**
   * Refresh job status from the server (fallback if SignalR misses an event)
   */
  const refreshStatus = useCallback(async () => {
    if (!jobIdRef.current) return;
    try {
      const response = await getJobStatus(jobIdRef.current);
      if (response?.isSuccess && response?.data) {
        setActiveJob(response.data);
        const status = response.data.status;
        if (status === ReportJobStatus.Failed) {
          setError(
            response.data.statusMessage ||
            response.data.errorMessage ||
            "Report generation failed"
          );
        }
        if (
          status === ReportJobStatus.Completed ||
          status === ReportJobStatus.Failed ||
          status === ReportJobStatus.Cancelled ||
          status === ReportJobStatus.EmailSent
        ) {
          setIsTracking(false);
        }
      }
    } catch (err) {
      console.error("Failed to refresh job status:", err);
    }
  }, []);

  /**
   * Register SignalR listeners.
   * Uses jobIdRef (mutable ref) so listeners can be registered BEFORE the
   * HTTP response arrives, avoiding the race condition where backend sends
   * SignalR events before the frontend knows the jobId.
   */
  const registerListeners = useCallback(() => {
    // Clean up previous listeners
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
    }

    const cleanups = [];

    const matchesJob = (data) => {
      const currentId = jobIdRef.current;
      return currentId && data?.jobId === currentId;
    };

    const handleProgress = (data) => {
      if (matchesJob(data)) {
        setActiveJob((prev) => ({
          ...prev,
          ...data,
        }));
        dispatchRef.current(updateReportProgress(data.jobId, {
          status: statusLabels[data.status] || 'Processing',
          percentage: data.progressPercent || 0,
          statusMessage: data.statusMessage || '',
          recordCount: data.recordCount || 0,
        }));
      }
    };

    const handleStarted = (data) => {
      if (matchesJob(data)) {
        setActiveJob((prev) => ({
          ...prev,
          ...data,
          status: ReportJobStatus.Queued,
        }));
        dispatchRef.current(updateReportProgress(data.jobId, {
          status: 'Processing',
          percentage: data.progressPercent || 0,
          statusMessage: data.statusMessage || 'Job queued',
        }));
      }
    };

    const handleCompleted = (data) => {
      if (matchesJob(data)) {
        setActiveJob((prev) => ({
          ...prev,
          ...data,
        }));
        setIsTracking(false);
        // Move to completed reports history and clear active progress
        dispatchRef.current(addCompletedReport({
          jobId: data.jobId,
          reportTitle: reportTitleRef.current,
          sourceId: reportSourceIdRef.current,
          completedAt: Date.now(),
          status: 'Completed',
          outputFormat: activeJobRef.current?.outputFormat || data.outputFormat || 'html',
          recordCount: data.recordCount || 0,
          fileSizeBytes: data.fileSizeBytes || 0,
        }));
        dispatchRef.current(clearReportProgress());
      }
    };

    const handleError = (data) => {
      if (matchesJob(data)) {
        setActiveJob((prev) => ({
          ...prev,
          ...data,
        }));
        setError(
          data.statusMessage ||
          data.errorMessage ||
          "Report generation failed"
        );
        setIsTracking(false);
        // Move to completed reports history as Failed
        dispatchRef.current(addCompletedReport({
          jobId: data.jobId,
          reportTitle: reportTitleRef.current,
          sourceId: reportSourceIdRef.current,
          completedAt: Date.now(),
          status: 'Failed',
          outputFormat: activeJobRef.current?.outputFormat || 'html',
          errorMessage:
            data.statusMessage ||
            data.errorMessage ||
            'Failed',
        }));
        dispatchRef.current(clearReportProgress());
      }
    };

    // Register listeners using .on() which returns unsubscribe functions
    cleanups.push(businessSignalRService.on("reportJobStarted", handleStarted));
    cleanups.push(
      businessSignalRService.on("reportJobProgress", handleProgress)
    );
    cleanups.push(
      businessSignalRService.on("reportJobCompleted", handleCompleted)
    );
    cleanups.push(businessSignalRService.on("reportJobError", handleError));

    // Store cleanup function that calls all unsubscribers
    listenerCleanupRef.current = () => {
      cleanups.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, []);

  /**
   * Submit a new async report job
   * @param {Object} dto - SubmitReportJobDTO (sourceId, templateName, outputFormat, parameters, deliverByEmail)
   */
  const submitJob = useCallback(
    async (dto) => {
      try {
        setError(null);
        setIsTracking(true);

        // Ensure SignalR is connected before submitting so progress events can flow immediately.
        const connected = await businessSignalRService.ensureConnection();
        if (!connected) {
          console.warn(
            "[ReportJobTracking] Business SignalR is not connected. Falling back to polling updates."
          );
        }

        // Register SignalR listeners BEFORE the HTTP call so we catch events
        // the backend fires during the request (SendJobStarted, early progress).
        // Listeners use jobIdRef.current which will be set once we get the response.
        registerListeners();

        const response = await submitReportJob(dto);

        if (response?.isSuccess && response?.data) {
          const job = response.data;
          jobIdRef.current = job.jobId;
          setActiveJob(job);

          // Capture display metadata for completed-report history entries
          reportTitleRef.current = dto.reportTitle || dto.sourceId || 'Report';
          reportSourceIdRef.current = dto.sourceId || '';

          // Push reportProgress to notification center bell
          dispatchRef.current(addReportProgress({
            jobId: job.jobId,
            status: 'Processing',
            percentage: 0,
            statusMessage: 'Job queued',
            reportTitle: dto.reportTitle || dto.sourceId || 'Report',
            outputFormat: dto.outputFormat || 'html',
            timestamp: Date.now(),
          }));

          // Immediately refresh to catch any progress events we missed
          // while jobIdRef.current was still null during the HTTP call
          setTimeout(() => refreshStatus(), 500);

          return job;
        } else {
          const msg = response?.message || "Failed to submit report job";
          setError(msg);
          setIsTracking(false);
          return null;
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to submit report job";
        setError(msg);
        setIsTracking(false);
        return null;
      }
    },
    [registerListeners, refreshStatus]
  );

  /**
   * Fetch the completed report HTML as a string (for inline preview, no file download)
   */
  const fetchHtmlContent = useCallback(async () => {
    if (!jobIdRef.current) return null;
    try {
      const blob = await downloadJobResult(jobIdRef.current);
      return await blob.text();
    } catch (err) {
      console.error("Failed to fetch report HTML:", err);
      return null;
    }
  }, []);

  /**
   * Cancel the active job
   */
  const cancelActiveJob = useCallback(async () => {
    if (!jobIdRef.current) return;
    try {
      await cancelJob(jobIdRef.current);
      const cancelled = {
        status: ReportJobStatus.Cancelled,
        statusText: 'Cancelled',
      };
      setActiveJob((prev) => ({ ...prev, ...cancelled }));
      setIsTracking(false);
      // Move to completed history as Cancelled and clear active progress
      dispatchRef.current(addCompletedReport({
        jobId: jobIdRef.current,
        reportTitle: reportTitleRef.current,
        sourceId: reportSourceIdRef.current,
        completedAt: Date.now(),
        status: 'Cancelled',
        outputFormat: activeJobRef.current?.outputFormat || 'html',
      }));
      dispatchRef.current(clearReportProgress());
    } catch (err) {
      console.error("Failed to cancel job:", err);
    }
  }, []);

  /**
   * Download the completed report
   */
  const downloadResult = useCallback(async () => {
    if (!jobIdRef.current) return;
    try {
      const blob = await downloadJobResult(jobIdRef.current);
      const fmt = activeJob?.outputFormat?.toLowerCase();
      const ext = fmt === "excel" ? "xlsx" : fmt === "html" ? "html" : "pdf";
      const fileName = `${activeJob?.reportTitle || "Report"}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report:", err);
      setError("Failed to download report file");
    }
  }, [activeJob]);

  /**
   * Dismiss the job tracker (clear state)
   */
  const dismissJob = useCallback(() => {
    if (listenerCleanupRef.current) {
      listenerCleanupRef.current();
      listenerCleanupRef.current = null;
    }
    jobIdRef.current = null;
    setActiveJob(null);
    setIsTracking(false);
    setError(null);
    dispatchRef.current(clearReportProgress());
  }, []);

  /**
   * Request email delivery for the active job (works on running or completed jobs)
   */
  const emailWhenDone = useCallback(async () => {
    if (!jobIdRef.current) return;
    try {
      const response = await requestEmailDeliveryApi(jobIdRef.current);
      if (response?.isSuccess) {
        setActiveJob((prev) => ({
          ...prev,
          deliverByEmail: true,
          statusMessage: "Email delivery enabled",
        }));
      }
      return response;
    } catch (err) {
      console.error("Failed to enable email delivery:", err);
      setError("Failed to enable email delivery");
      return null;
    }
  }, []);

  // Periodic polling fallback when tracking (every 3s for snappy updates)
  useEffect(() => {
    if (!isTracking || !jobIdRef.current) return;
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, [isTracking, refreshStatus]);

  return {
    activeJob,
    isTracking,
    error,
    submitJob,
    cancelActiveJob,
    downloadResult,
    fetchHtmlContent,
    dismissJob,
    refreshStatus,
    emailWhenDone,
  };
};

export default useReportJobTracking;
