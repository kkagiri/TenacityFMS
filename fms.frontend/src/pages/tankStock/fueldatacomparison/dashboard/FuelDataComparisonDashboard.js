import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, LoadPanel } from "devextreme-react";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import { useNavigate } from "react-router-dom";
import FuelComparisonMetricCard from "../components/FuelComparisonMetricCard";
import ComparisonDataGrid from "../components/ComparisonDataGrid";
import SettingsModal from "../modals/SettingsModal";
import FetchGpsDataModal from "../modals/FetchGpsDataModal";
import { useStockFilters } from "../../shared/context/StockFilterContext";
import businessSignalRService from "../../../../signalR/businessSignalRService";
import {
  getVarianceReport,
  getUserSettings,
  fetchGpsData,
  cancelGpsFetch,
  getActiveJobs,
  resumeGpsFetch,
  markReportFailed,
} from "../../../../api/fuelComparisonClient";
import "./FuelDataComparisonDashboard.scss";

/**
 * FuelDataComparisonDashboard - Main dashboard for Fuel Data Comparison feature
 *
 * Compares fuel data from 3 sources:
 * - Manual entry (fuelrefil table)
 * - PTS automated (pumptransaction table)
 * - GPS data (gpsgate_report_entries table)
 *
 * Features:
 * - Variance analysis with user-configurable threshold
 * - Row highlighting (RED > threshold, YELLOW > 50% threshold)
 * - Edit/Delete GPS entries with audit trail
 * - Fetch new GPS data from GPSGate
 * - Filter by all/site/tank (uses StockFilterContext)
 *
 * @returns {JSX.Element} Fuel Data Comparison Dashboard
 */
const FuelDataComparisonDashboard = () => {
  const navigate = useNavigate();

  // Context for filters (from TankStock shared context)
  const { startDate, endDate, selectedSiteIds, selectedTankIds } =
    useStockFilters();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFetchGpsModal, setShowFetchGpsModal] = useState(false);

  // GPS fetch tracking
  const [gpsFetchJob, setGpsFetchJob] = useState(null);
  const [gpsFetchProgress, setGpsFetchProgress] = useState({
    status: "",
    progressPercent: 0,
    message: "",
  });

  // Track when actively resuming or marking failed (separate from isFetchingGps)
  const [isResuming, setIsResuming] = useState(false);

  // Active jobs tracking (for showing other ongoing processes)
  const [activeJobs, setActiveJobs] = useState({
    hasActiveJob: false,
    activeJobCount: 0,
    activeJobIds: [],
    processingReports: [],
  });
  const [isCheckingActiveJobs, setIsCheckingActiveJobs] = useState(false);
  const activeJobsPollingRef = useRef(null);

  // GPS Gate busy state (when GPSGate server itself is processing)
  const [isGpsGateBusy, setIsGpsGateBusy] = useState(false);
  const [gpsGateBusyMessage, setGpsGateBusyMessage] = useState("");
  const gpsGateBusyPollingRef = useRef(null);

  // Track if user dismissed the busy popup (don't auto-show again until jobs clear)
  const [isBusyDismissed, setIsBusyDismissed] = useState(false);

  // Progress overlay minimize state
  const [isProgressMinimized, setIsProgressMinimized] = useState(false);

  // Unmapped GPSGate vehicles popup (device IDs that have no vehicle_provider_mappings)
  const [showUnmappedVehiclesPopup, setShowUnmappedVehiclesPopup] =
    useState(false);
  const [unmappedGpsGateVehicles, setUnmappedGpsGateVehicles] = useState([]);

  /**
   * Check for active GPS fetch jobs on the server
   */
  const checkActiveJobs = useCallback(async () => {
    try {
      setIsCheckingActiveJobs(true);
      const response = await getActiveJobs();
      if (response.isSuccess) {
        const data = response.data;
        setActiveJobs(data);

        // If there's an active job in the database that's not ours, update the UI
        if (data.hasActiveJob && !gpsFetchJob) {
          setIsFetchingGps(true);

          // Check if there are processing reports from the database
          const processingReport = data.processingReports?.[0];
          if (processingReport) {
            setGpsFetchProgress({
              status: "Processing",
              progressPercent: 0,
              message: `Report processing: ${
                processingReport.dateRange || "Unknown date range"
              }`,
            });
            // If there's a processing report without our job, GPSGate is busy
            // But only show if user hasn't dismissed the popup
            if (!processingReport.isInMemory && !isBusyDismissed) {
              setIsGpsGateBusy(true);
              setGpsGateBusyMessage(
                `GPSGate is processing another report (ID: ${processingReport.id})`
              );
            }
          } else {
            setGpsFetchProgress({
              status: "Running",
              progressPercent: 0,
              message: "Another GPS fetch job is in progress...",
            });
          }
        } else if (!data.hasActiveJob && !gpsFetchJob && !isGpsGateBusy) {
          // No active jobs and no GPSGate busy state, reset fetching state
          setIsFetchingGps(false);
        } else if (!data.hasActiveJob && (isGpsGateBusy || isBusyDismissed)) {
          // GPSGate finished processing, clear busy state and dismissed flag
          setIsGpsGateBusy(false);
          setGpsGateBusyMessage("");
          setIsFetchingGps(false);
          setIsBusyDismissed(false); // Reset dismissed flag when jobs clear
          notify(
            "GPSGate is now available. You can start a new fetch.",
            "success",
            5000
          );
        }
      }
    } catch (error) {
      console.error("Error checking active jobs:", error);
    } finally {
      setIsCheckingActiveJobs(false);
    }
  }, [gpsFetchJob, isGpsGateBusy, isBusyDismissed]);

  /**
   * Start polling for active jobs when fetching or GPSGate is busy
   */
  useEffect(() => {
    // Check for active jobs on mount
    checkActiveJobs();

    // Poll for active jobs every 5 seconds while fetching or GPSGate is busy
    if (isFetchingGps || isGpsGateBusy) {
      activeJobsPollingRef.current = setInterval(checkActiveJobs, 5000);
    }

    return () => {
      if (activeJobsPollingRef.current) {
        clearInterval(activeJobsPollingRef.current);
        activeJobsPollingRef.current = null;
      }
    };
  }, [isFetchingGps, isGpsGateBusy, checkActiveJobs]);

  /**
   * Load variance report with comparison data
   */
  const loadVarianceReport = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    try {
      setIsLoading(true);

      // Prepare parameters for API call
      const filterType = "all";
      const siteId =
        selectedSiteIds && selectedSiteIds.length > 0
          ? selectedSiteIds[0]
          : null;
      const tankId =
        selectedTankIds && selectedTankIds.length > 0
          ? selectedTankIds[0]
          : null;

      // Call API with params object
      const response = await getVarianceReport({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filterType,
        siteId,
        tankId,
      });

      if (response.isSuccess) {
        setReportData(response.data);

        // Debug: Log GPS data statistics
        const details = response.data?.details || [];
        const totalRecords = details.length;
        const recordsWithGps = details.filter(
          (d) => d.gpsVolume != null
        ).length;
        const recordsWithEffectiveGps = details.filter(
          (d) => d.effectiveGpsVolume != null
        ).length;
        console.log("[Fuel Comparison] Data loaded:", {
          totalRecords,
          recordsWithGps,
          recordsWithEffectiveGps,
          sampleRecord: details[0],
        });
      } else {
        notify(
          response.message || "Failed to load variance report",
          "error",
          3000
        );
        setReportData(null);
      }
    } catch (error) {
      console.error("Error loading variance report:", error);
      notify("Failed to load variance report", "error", 3000);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedSiteIds, selectedTankIds]);

  /**
   * Load user settings from API
   */
  const loadUserSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await getUserSettings();

      if (response.isSuccess) {
        setUserSettings(response.data);
      } else {
        notify(response.message || "Failed to load settings", "error", 3000);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      notify("Failed to load user settings", "error", 3000);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  /**
   * Load user settings on component mount
   */
  useEffect(() => {
    loadUserSettings();
  }, []);

  /**
   * Subscribe to GPS fetch SignalR events
   */
  useEffect(() => {
    // Ensure SignalR is connected
    if (!businessSignalRService.isConnected) {
      businessSignalRService.start().catch((err) => {
        console.error("Failed to connect to SignalR:", err);
      });
    }

    // Subscribe to GPS fetch progress events
    const cleanupProgress = businessSignalRService.on(
      "GpsFetchProgress",
      (data) => {
        console.log("[GPS Fetch] Progress:", data);
        // Update progress for any active job (ours or another user's)
        if (isFetchingGps || (gpsFetchJob && data.jobId === gpsFetchJob)) {
          setGpsFetchProgress({
            status: data.status,
            progressPercent: data.progressPercent,
            message: data.message,
          });
        }
      }
    );

    const cleanupCompleted = businessSignalRService.on(
      "GpsFetchCompleted",
      (data) => {
        console.log("[GPS Fetch] Completed:", data);
        // Handle completion for our job or any job if we're tracking active jobs
        const isOurJob = gpsFetchJob && data.jobId === gpsFetchJob;
        const isTrackedJob = activeJobs.activeJobIds?.includes(data.jobId);

        if (isOurJob || isTrackedJob || isFetchingGps) {
          const result = data.result;

          // Show success notification
          notify(
            `GPS fetch completed! Fetched: ${result.totalRecordsFetched}, ` +
              `Saved: ${result.newRecordsSaved}, Updated: ${
                result.recordsUpdated || 0
              }`,
            "success",
            5000
          );

          // Show warning if there are unmapped vehicles
          if (result.unmappedVehiclesCount > 0) {
            const unmappedList =
              result.unmappedVehicles?.slice(0, 5).join(", ") || "";
            const moreCount = (result.unmappedVehicles?.length || 0) - 5;
            const moreText = moreCount > 0 ? ` and ${moreCount} more` : "";

            notify(
              `Warning: ${result.unmappedVehiclesCount} records skipped due to unmapped GPSGate vehicles: ${unmappedList}${moreText}. ` +
                `Go to Admin > Provider Configuration to create mappings.`,
              "warning",
              10000
            );

            // Show popup with the full list (best-effort: only when this completion is relevant to the user)
            if (isOurJob || isFetchingGps) {
              const ids = (result.unmappedVehicles || [])
                .map((x) => String(x))
                .filter(Boolean);
              setUnmappedGpsGateVehicles(ids);
              setShowUnmappedVehiclesPopup(true);
            }
          }

          // Reload report to show new data
          loadVarianceReport();

          // Re-check active jobs to update UI
          checkActiveJobs();

          // Reset state if it was our job
          if (isOurJob) {
            setIsFetchingGps(false);
            setGpsFetchJob(null);
          }

          // Clear GPSGate busy state on successful completion
          setIsGpsGateBusy(false);
          setGpsGateBusyMessage("");
        }
      }
    );

    const cleanupError = businessSignalRService.on("GpsFetchError", (data) => {
      console.error("[GPS Fetch] Error:", data);
      // Always handle error if we're fetching GPS data, or if jobId matches
      // The error might arrive before gpsFetchJob state is updated
      const isOurJob = gpsFetchJob && data.jobId === gpsFetchJob;
      const isTrackedJob = activeJobs.activeJobIds?.includes(data.jobId);
      const errorMessage = data.error || "Unknown error";

      // Check if this is a "GPSGate is busy" error
      const isGpsGateBusyError =
        errorMessage.toLowerCase().includes("currently processing") ||
        errorMessage.toLowerCase().includes("only one report");

      if (isFetchingGps || isOurJob || isTrackedJob) {
        if (isGpsGateBusyError) {
          // GPSGate server is busy processing another report
          setIsGpsGateBusy(true);
          setGpsGateBusyMessage(
            "GPSGate server is currently processing another report. Please wait..."
          );
          setGpsFetchProgress({
            status: "Waiting",
            progressPercent: 0,
            message: "GPSGate is busy. Will retry automatically when ready...",
          });
          notify(
            "GPSGate is currently processing another report. The system will monitor and notify you when it's available.",
            "warning",
            8000
          );
        } else {
          // Regular error - reset state
          setGpsFetchProgress({
            status: "Error",
            progressPercent: 0,
            message: errorMessage,
          });
          notify(`GPS fetch failed: ${errorMessage}`, "error", 8000);
          setIsGpsGateBusy(false);
          setGpsGateBusyMessage("");
        }

        // Re-check active jobs to update UI
        checkActiveJobs();

        // Reset state if it was our job (unless GPSGate is just busy)
        if (isOurJob && !isGpsGateBusyError) {
          setIsFetchingGps(false);
          setGpsFetchJob(null);
        } else if (isOurJob && isGpsGateBusyError) {
          // Keep fetching state but clear the job since it failed
          setGpsFetchJob(null);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      cleanupProgress();
      cleanupCompleted();
      cleanupError();
    };
  }, [
    gpsFetchJob,
    isFetchingGps,
    activeJobs.activeJobIds,
    loadVarianceReport,
    checkActiveJobs,
  ]);

  /**
   * Load variance report when filters change
   */
  useEffect(() => {
    if (userSettings && startDate && endDate) {
      loadVarianceReport();
    }
  }, [startDate, endDate, userSettings, loadVarianceReport]);

  /**
   * Handle settings save
   */
  const handleSettingsSaved = (newSettings) => {
    setUserSettings(newSettings);
    setShowSettingsModal(false);
    // Reload report with new threshold
    loadVarianceReport();
    notify("Settings updated successfully", "success", 3000);
  };

  /**
   * Handle GPS data fetch (fire-and-forget with SignalR progress)
   */
  const handleFetchGpsData = async (fetchParams) => {
    try {
      // First check if there's already an active job
      const activeJobsResponse = await getActiveJobs();
      if (
        activeJobsResponse.isSuccess &&
        activeJobsResponse.data.hasActiveJob
      ) {
        notify(
          `Cannot start new fetch: ${activeJobsResponse.data.message}. Please wait for it to complete or cancel it.`,
          "warning",
          6000
        );
        setShowFetchGpsModal(false);
        setIsFetchingGps(true);
        setGpsFetchProgress({
          status: "Waiting",
          progressPercent: 0,
          message: "Another GPS fetch job is already running...",
        });
        return;
      }

      setIsFetchingGps(true);
      setShowFetchGpsModal(false);
      setGpsFetchProgress({
        status: "Starting...",
        progressPercent: 0,
        message: "",
      });

      // Pass fetchParams object directly to API - it expects FetchGpsDataRequestDto
      const response = await fetchGpsData(fetchParams);

      if (response.isSuccess) {
        const jobId = response.data.jobId;
        setGpsFetchJob(jobId);

        notify(
          "GPS data fetch started. You will be notified when complete.",
          "info",
          3000
        );
      } else {
        setIsFetchingGps(false);
        notify(response.message || "Failed to start GPS fetch", "error", 5000);
      }
    } catch (error) {
      console.error("Error starting GPS fetch:", error);
      setIsFetchingGps(false);
      notify("Error starting GPS data fetch", "error", 5000);
    }
  };

  /**
   * Handle GPS data fetch cancellation
   */
  const handleCancelGpsFetch = async () => {
    if (!gpsFetchJob) {
      notify("No GPS fetch job to cancel", "warning", 3000);
      return;
    }

    try {
      const response = await cancelGpsFetch(gpsFetchJob);

      if (response.isSuccess) {
        setIsFetchingGps(false);
        setGpsFetchJob(null);
        setGpsFetchProgress({
          status: "Cancelled",
          progressPercent: 0,
          message: "",
        });
        notify("GPS fetch cancelled successfully", "success", 3000);
      } else {
        notify(response.message || "Failed to cancel GPS fetch", "error", 3000);
      }
    } catch (error) {
      console.error("Error cancelling GPS fetch:", error);
      notify("Error cancelling GPS data fetch", "error", 3000);
    }
  };

  /**
   * Handle resuming a stuck GPS fetch job
   */
  const handleResumeGpsFetch = async (reportId) => {
    try {
      setIsResuming(true);
      setIsFetchingGps(true);
      setGpsFetchProgress({
        status: "Resuming...",
        progressPercent: 0,
        message: `Attempting to resume report #${reportId}...`,
      });

      const response = await resumeGpsFetch(reportId);

      if (response.isSuccess) {
        const jobId = response.data?.jobId;
        setGpsFetchJob(jobId);
        notify(
          `Resume started for report #${reportId}. You will receive progress updates.`,
          "info",
          3000
        );
        // Refresh active jobs to update UI
        checkActiveJobs();
      } else {
        setIsFetchingGps(false);
        notify(response.message || "Failed to resume GPS fetch", "error", 5000);
      }
    } catch (error) {
      console.error("Error resuming GPS fetch:", error);
      setIsFetchingGps(false);
      notify("Error resuming GPS data fetch", "error", 5000);
    } finally {
      setIsResuming(false);
    }
  };

  /**
   * Handle marking a stuck report as failed
   */
  const handleMarkReportFailed = async (reportId) => {
    if (
      !window.confirm(
        `Are you sure you want to mark report #${reportId} as failed?\n\n` +
          `This will clear the "Processing" status so you can start a new fetch. ` +
          `The partial data (if any) will remain in the database.`
      )
    ) {
      return;
    }

    try {
      setIsResuming(true); // Reuse same state to disable buttons
      const response = await markReportFailed(reportId);

      if (response.isSuccess) {
        notify(`Report #${reportId} marked as failed`, "success", 3000);
        // Refresh active jobs to update UI
        checkActiveJobs();
        // Clear busy state if this was the blocking report
        setIsGpsGateBusy(false);
        setGpsGateBusyMessage("");
        setIsFetchingGps(false);
      } else {
        notify(
          response.message || "Failed to mark report as failed",
          "error",
          3000
        );
      }
    } catch (error) {
      console.error("Error marking report as failed:", error);
      notify("Error marking report as failed", "error", 3000);
    } finally {
      setIsResuming(false);
    }
  };

  /**
   * Handle data refresh after grid operations (edit/delete)
   */
  const handleDataRefresh = () => {
    loadVarianceReport();
  };

  // Calculate metrics from summary
  const summary = reportData?.summary || {};
  const highVariancePercent = summary.highVariancePercent || 0;
  const dataCompletenessPercent = summary.dataCompletenessPercent || 0;

  return (
    <div className="fuel-data-comparison-dashboard">
      <Popup
        visible={showUnmappedVehiclesPopup}
        onHiding={() => setShowUnmappedVehiclesPopup(false)}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Unmapped GPSGate Vehicles"
        width={720}
        height={520}
        showCloseButton={true}
      >
        <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4 tw-h-full">
          <div className="tw-text-sm tw-text-gray-700">
            These GPSGate IDs were present in the report but have no mapping to
            an FMS vehicle. Map them in Admin → Provider Configuration.
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <Button
              text="Open Device Mapping"
              icon="fa-light fa-link"
              type="default"
              stylingMode="contained"
              onClick={() => {
                const ids = (unmappedGpsGateVehicles || []).filter(Boolean);
                const query = ids.length
                  ? `?unmapped=${encodeURIComponent(ids.join(","))}`
                  : "";
                navigate(`/admin/providers/map-devices${query}`);
                setShowUnmappedVehiclesPopup(false);
              }}
              disabled={!unmappedGpsGateVehicles?.length}
            />
            <Button
              text="Copy IDs"
              icon="fa-light fa-copy"
              type="normal"
              stylingMode="outlined"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    (unmappedGpsGateVehicles || []).join(",")
                  );
                  notify("Copied unmapped GPSGate IDs", "success", 2000);
                } catch {
                  notify("Could not copy to clipboard", "warning", 2000);
                }
              }}
              disabled={!unmappedGpsGateVehicles?.length}
            />
            <div className="tw-flex-1" />
            <Button
              text="Close"
              icon="fa-light fa-xmark"
              type="normal"
              stylingMode="text"
              onClick={() => setShowUnmappedVehiclesPopup(false)}
            />
          </div>

          <div className="tw-flex-1 tw-overflow-auto tw-border tw-border-gray-200 tw-rounded tw-bg-white">
            {!unmappedGpsGateVehicles?.length ? (
              <div className="tw-p-4 tw-text-sm tw-text-gray-500">
                No unmapped GPSGate IDs to show.
              </div>
            ) : (
              <div className="tw-p-4">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-3">
                  Total unmapped IDs:{" "}
                  <span className="tw-font-semibold">
                    {unmappedGpsGateVehicles.length}
                  </span>
                </div>
                <div className="tw-grid tw-grid-cols-3 tw-gap-2">
                  {unmappedGpsGateVehicles.map((id) => (
                    <div
                      key={id}
                      className="tw-flex tw-items-center tw-justify-between tw-border tw-border-gray-200 tw-rounded tw-px-3 tw-py-2"
                    >
                      <div className="tw-font-semibold tw-text-gray-800">
                        {id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="tw-text-xs tw-text-gray-500">
            Tip: Click “Open Device Mapping” to auto-filter the devices list by
            these IDs.
          </div>
        </div>
      </Popup>

      {/* Action Bar */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center tw-gap-3">
          <Button
            text="Fetch GPS Data"
            icon="fa-light fa-satellite-dish"
            onClick={() => setShowFetchGpsModal(true)}
            type="default"
            stylingMode="contained"
            disabled={isLoading || isFetchingGps}
          />
          <Button
            text="Settings"
            icon="fa-light fa-cog"
            onClick={() => setShowSettingsModal(true)}
            type="normal"
            stylingMode="outlined"
            disabled={isLoadingSettings}
          />
          <Button
            text="Refresh"
            icon="fa-light fa-rotate"
            onClick={loadVarianceReport}
            type="normal"
            stylingMode="text"
            disabled={isLoading}
          />
          <Button
            text={isCheckingActiveJobs ? "Checking..." : "Check Active Jobs"}
            icon={
              isCheckingActiveJobs
                ? "fa-light fa-spinner fa-spin"
                : "fa-light fa-list-check"
            }
            onClick={checkActiveJobs}
            type="normal"
            stylingMode="text"
            disabled={isCheckingActiveJobs}
          />
        </div>

        {/* Current Threshold Display */}
        {userSettings && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
            <i className="fa-light fa-ruler tw-text-blue-600"></i>
            <span className="tw-text-sm tw-font-medium tw-text-blue-800">
              Variance Threshold:{" "}
              <span className="tw-font-bold">
                {userSettings.varianceThreshold}L
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Active Jobs Banner */}
      {activeJobs.hasActiveJob && (
        <div className="tw-mb-4 tw-px-4 tw-py-3 tw-bg-amber-50 tw-border tw-border-amber-300 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-spinner fa-spin tw-text-amber-600 tw-text-xl"></i>
              <div>
                <span className="tw-text-sm tw-font-semibold tw-text-amber-800">
                  GPS Fetch In Progress
                </span>
                <p className="tw-text-xs tw-text-amber-700 tw-mt-0.5">
                  {activeJobs.message ||
                    `${
                      activeJobs.databaseProcessingReports || 0
                    } report(s) processing in database`}
                </p>
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              {gpsFetchJob && (
                <Button
                  text="Cancel"
                  icon="fa-light fa-xmark"
                  type="danger"
                  stylingMode="outlined"
                  onClick={handleCancelGpsFetch}
                />
              )}
              <Button
                text="Refresh Status"
                icon="fa-light fa-rotate"
                type="normal"
                stylingMode="text"
                onClick={checkActiveJobs}
                disabled={isCheckingActiveJobs}
              />
            </div>
          </div>

          {/* Show processing reports details */}
          {activeJobs.processingReports?.length > 0 && (
            <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-amber-200">
              <p className="tw-text-xs tw-font-medium tw-text-amber-800 tw-mb-2">
                Active Reports:
              </p>
              <div className="tw-space-y-2">
                {activeJobs.processingReports.map((report, index) => (
                  <div
                    key={report.id || index}
                    className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-amber-700 tw-bg-amber-100 tw-rounded tw-px-3 tw-py-2"
                  >
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <i className="fa-light fa-file-lines"></i>
                      <span>Report #{report.id}</span>
                      <span className="tw-text-amber-500">|</span>
                      <span>{report.dateRange}</span>
                      <span className="tw-text-amber-500">|</span>
                      <span>Handle: {report.handleId || "N/A"}</span>
                      <span className="tw-text-amber-500">|</span>
                      <span
                        className={`tw-font-medium ${
                          report.isInMemory
                            ? "tw-text-green-600"
                            : "tw-text-amber-600"
                        }`}
                      >
                        {report.isInMemory ? "Our Job" : "External/Stuck"}
                      </span>
                    </div>
                    {/* Action buttons for stuck reports (not in memory but has handle_id) */}
                    {!report.isInMemory && report.handleId > 0 && (
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <Button
                          text="Resume"
                          icon="fa-light fa-play"
                          type="success"
                          stylingMode="contained"
                          hint="Try to resume using the existing handle ID"
                          onClick={() => handleResumeGpsFetch(report.id)}
                          disabled={isResuming}
                          elementAttr={{ class: "tw-text-xs" }}
                        />
                        <Button
                          text="Mark Failed"
                          icon="fa-light fa-xmark"
                          type="danger"
                          stylingMode="outlined"
                          hint="Clear this stuck report so you can start a new fetch"
                          onClick={() => handleMarkReportFailed(report.id)}
                          disabled={isResuming}
                          elementAttr={{ class: "tw-text-xs" }}
                        />
                      </div>
                    )}
                    {/* Mark Failed button for reports without handle_id */}
                    {!report.isInMemory &&
                      (!report.handleId || report.handleId === 0) && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <span className="tw-text-red-500 tw-text-xs">
                            No handle ID - cannot resume
                          </span>
                          <Button
                            text="Mark Failed"
                            icon="fa-light fa-xmark"
                            type="danger"
                            stylingMode="outlined"
                            hint="Clear this stuck report"
                            onClick={() => handleMarkReportFailed(report.id)}
                            disabled={isResuming}
                            elementAttr={{ class: "tw-text-xs" }}
                          />
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Cards */}
      {!isLoading && reportData && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <FuelComparisonMetricCard
            title="Total Records"
            icon="fa-light fa-database"
            tone="info"
            value={summary.totalRecords}
            unit="records"
            subtitle={`${summary.completeRecords} complete, ${summary.partialRecords} partial`}
          />
          <FuelComparisonMetricCard
            title="High Variance"
            icon="fa-light fa-triangle-exclamation"
            tone={
              highVariancePercent > 20
                ? "negative"
                : highVariancePercent > 10
                ? "warning"
                : "success"
            }
            value={summary.highVarianceCount}
            unit="records"
            subtitle={`${highVariancePercent.toFixed(1)}% of total`}
          />
          <FuelComparisonMetricCard
            title="Average Variance"
            icon="fa-light fa-chart-line"
            tone={summary.averageVariance > 10 ? "warning" : "success"}
            value={summary.averageVariance}
            unit="L"
            subtitle={`Max: ${summary.maxVariance?.toFixed(1) || 0}L`}
            formatValue={(val) => val?.toFixed(2) || "0"}
          />
          <FuelComparisonMetricCard
            title="Data Completeness"
            icon="fa-light fa-circle-check"
            tone={
              dataCompletenessPercent < 70
                ? "negative"
                : dataCompletenessPercent < 90
                ? "warning"
                : "success"
            }
            value={dataCompletenessPercent}
            unit="%"
            subtitle={`${summary.singleSourceRecords} with 1 source only`}
            formatValue={(val) => val?.toFixed(1) || "0"}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-p-12">
          <LoadPanel
            visible={true}
            message="Loading comparison data..."
            showPane={true}
          />
        </div>
      )}

      {/* Data Grid */}
      {!isLoading && reportData && (
        <ComparisonDataGrid
          data={reportData.details || []}
          varianceThreshold={userSettings?.varianceThreshold || 10.0}
          onRefresh={handleDataRefresh}
        />
      )}

      {/* Empty State */}
      {!isLoading && !reportData && (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-12 tw-bg-white tw-rounded-lg tw-shadow-md tw-border tw-border-gray-200">
          <i className="fa-light fa-inbox tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">
            No Data Available
          </h3>
          <p className="tw-text-gray-500 tw-mb-6 tw-text-center">
            Select a date range using the filters above to view comparison data.
            <br />
            Or click "Fetch GPS Data" to retrieve data from GPSGate.
          </p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && userSettings && (
        <SettingsModal
          visible={showSettingsModal}
          currentSettings={userSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSettingsSaved}
        />
      )}

      {/* Fetch GPS Data Modal */}
      {showFetchGpsModal && (
        <FetchGpsDataModal
          visible={showFetchGpsModal}
          currentFilters={{
            startDate,
            endDate,
            siteId: selectedSiteIds?.[0],
            vehicleId: null,
          }}
          onClose={() => setShowFetchGpsModal(false)}
          onFetch={handleFetchGpsData}
          isFetching={isFetchingGps}
          currentJobId={gpsFetchJob}
          onCancel={handleCancelGpsFetch}
          fetchProgress={gpsFetchProgress}
        />
      )}

      {/* GPS Fetch Progress Overlay - Full Size */}
      {isFetchingGps && !isProgressMinimized && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-8 tw-max-w-md tw-w-full tw-mx-4 tw-relative">
            {/* Minimize Button */}
            <button
              onClick={() => setIsProgressMinimized(true)}
              className="tw-absolute tw-top-3 tw-right-3 tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors"
              title="Minimize"
            >
              <i className="fa-light fa-window-minimize tw-text-lg"></i>
            </button>

            <div className="tw-flex tw-flex-col tw-items-center">
              {/* Animated Icon */}
              <div className="tw-mb-4">
                {isGpsGateBusy ? (
                  <i className="fa-light fa-clock tw-text-5xl tw-text-amber-500 tw-animate-pulse"></i>
                ) : gpsFetchProgress.status === "Error" ? (
                  <i className="fa-light fa-triangle-exclamation tw-text-5xl tw-text-red-500"></i>
                ) : (
                  <i className="fa-light fa-satellite-dish tw-text-5xl tw-text-blue-500 tw-animate-pulse"></i>
                )}
              </div>

              {/* Title */}
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                {isGpsGateBusy ? "GPSGate Server Busy" : "Fetching GPS Data"}
              </h3>

              {/* Status */}
              <div
                className={`tw-text-sm tw-mb-4 tw-text-center ${
                  isGpsGateBusy ? "tw-text-amber-600" : "tw-text-gray-600"
                }`}
              >
                {gpsFetchProgress.status || "Connecting to GPSGate..."}
              </div>

              {/* GPSGate Busy Message */}
              {isGpsGateBusy && gpsGateBusyMessage && (
                <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-3 tw-mb-4 tw-w-full">
                  <p className="tw-text-xs tw-text-amber-700 tw-text-center">
                    {gpsGateBusyMessage}
                  </p>
                  <p className="tw-text-xs tw-text-amber-600 tw-text-center tw-mt-2">
                    <i className="fa-light fa-rotate tw-mr-1"></i>
                    Checking every 5 seconds...
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              {!isGpsGateBusy && (
                <div className="tw-w-full tw-mb-3">
                  <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-500 tw-mb-1">
                    <span>Progress</span>
                    <span>{gpsFetchProgress.progressPercent || 0}%</span>
                  </div>
                  <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-3">
                    <div
                      className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-blue-600 tw-h-3 tw-rounded-full tw-transition-all tw-duration-500 tw-ease-out"
                      style={{
                        width: `${gpsFetchProgress.progressPercent || 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              {gpsFetchProgress.message && !isGpsGateBusy && (
                <div className="tw-text-xs tw-text-gray-500 tw-text-center tw-mt-2">
                  {gpsFetchProgress.message}
                </div>
              )}

              {/* Job ID (for debugging) */}
              {gpsFetchJob && (
                <div className="tw-text-xs tw-text-gray-400 tw-mt-4">
                  Job: {gpsFetchJob.substring(0, 8)}...
                </div>
              )}

              {/* Action Buttons */}
              <div className="tw-flex tw-gap-3 tw-mt-6">
                {gpsFetchJob && (
                  <Button
                    text="Cancel"
                    icon="fa-light fa-xmark"
                    type="danger"
                    stylingMode="outlined"
                    onClick={handleCancelGpsFetch}
                  />
                )}
                {isGpsGateBusy && (
                  <Button
                    text="Dismiss"
                    icon="fa-light fa-check"
                    type="normal"
                    stylingMode="outlined"
                    onClick={() => {
                      setIsGpsGateBusy(false);
                      setIsFetchingGps(false);
                      setGpsGateBusyMessage("");
                      setIsBusyDismissed(true); // Remember user dismissed
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Fetch Progress - Minimized Version */}
      {isFetchingGps && isProgressMinimized && (
        <div className="tw-fixed tw-bottom-4 tw-right-4 tw-z-50">
          <div
            className={`tw-rounded-lg tw-shadow-xl tw-p-4 tw-min-w-[280px] tw-cursor-pointer tw-border-2 ${
              isGpsGateBusy
                ? "tw-bg-amber-50 tw-border-amber-300"
                : gpsFetchProgress.status === "Error"
                ? "tw-bg-red-50 tw-border-red-300"
                : "tw-bg-blue-50 tw-border-blue-300"
            }`}
            onClick={() => setIsProgressMinimized(false)}
            title="Click to expand"
          >
            <div className="tw-flex tw-items-center tw-gap-3">
              {/* Icon */}
              {isGpsGateBusy ? (
                <i className="fa-light fa-clock tw-text-2xl tw-text-amber-500 tw-animate-pulse"></i>
              ) : gpsFetchProgress.status === "Error" ? (
                <i className="fa-light fa-triangle-exclamation tw-text-2xl tw-text-red-500"></i>
              ) : (
                <i className="fa-light fa-satellite-dish tw-text-2xl tw-text-blue-500 tw-animate-pulse"></i>
              )}

              {/* Content */}
              <div className="tw-flex-1">
                <div
                  className={`tw-text-sm tw-font-medium ${
                    isGpsGateBusy
                      ? "tw-text-amber-800"
                      : gpsFetchProgress.status === "Error"
                      ? "tw-text-red-800"
                      : "tw-text-blue-800"
                  }`}
                >
                  {isGpsGateBusy ? "GPSGate Busy" : "Fetching GPS Data"}
                </div>
                <div className="tw-text-xs tw-text-gray-600">
                  {gpsFetchProgress.status || "Processing..."}
                </div>
                {!isGpsGateBusy && (
                  <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-1.5 tw-mt-1">
                    <div
                      className="tw-bg-blue-500 tw-h-1.5 tw-rounded-full tw-transition-all tw-duration-500"
                      style={{
                        width: `${gpsFetchProgress.progressPercent || 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Expand Icon */}
              <i className="fa-light fa-expand tw-text-gray-400"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelDataComparisonDashboard;
