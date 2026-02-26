/**
 * File: ReportScheduleSettings.js
 * Purpose: Admin schedule editor with inline jsreport preview for scheduled report emails.
 * Last Modified: 2026-02-07
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../api/axiosInstance";
import reportingService from "../../services/reportingService";
import { usePermissions } from "../../hooks/usePermissions";
import {
  ScheduleReportEmailDialog,
  createDefaultReportScheduleConfig,
  createReportScheduleNotificationRequest,
  getNextRunDateTime,
} from "../../components/Reporting/ReportScheduler";
import {
  DEFAULT_SCHEDULED_REPORT_TYPE_ID,
  SCHEDULED_REPORT_TYPE_OPTIONS,
  buildScheduleConfigFromExistingSchedule,
  getScheduledReportTypeDefinition,
  normalizeRecipientOptions,
  normalizeSiteOptions,
  normalizeTankOptions,
} from "./utils/scheduledReportEmailPageUtils";
import {
  STATUS_CLASS_BY_VALUE,
  applyNoopSafeScheduleUpdates,
  formatLocalDateTime,
  normalizeScheduleRow,
  resolveRequestedByUser,
} from "./utils/reportScheduleSettingsUtils";
import { useScheduledReportPreview } from "./hooks/useScheduledReportPreview";
import ScheduledEmailGrid from "./components/ScheduledEmailGrid";
import RecipientDeliveryStatusPopup from "./components/RecipientDeliveryStatusPopup";
import "./ReportScheduleSettings.scss";
const ReportScheduleSettings = () => {
  const { hasPermission } = usePermissions();
  const authUser = useSelector((state) => state.auth?.user || null);
  const isAdmin = hasPermission("_Manage_ReportSchedules");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [sites, setSites] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [usersForFilter, setUsersForFilter] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [selectedCreateReportType, setSelectedCreateReportType] = useState(
    DEFAULT_SCHEDULED_REPORT_TYPE_ID
  );
  const [createScheduleConfig, setCreateScheduleConfig] = useState(() =>
    createDefaultReportScheduleConfig()
  );
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [adjustingSchedule, setAdjustingSchedule] = useState(null);
  const [adjustScheduleConfig, setAdjustScheduleConfig] = useState(() =>
    createDefaultReportScheduleConfig()
  );
  const [isAdjustingSchedule, setIsAdjustingSchedule] = useState(false);
  const [recipientPopupSchedule, setRecipientPopupSchedule] = useState(null);
  const selectedCreateReportDefinition = useMemo(
    () => getScheduledReportTypeDefinition(selectedCreateReportType),
    [selectedCreateReportType]
  );
  const adjustReportDefinition = useMemo(
    () =>
      getScheduledReportTypeDefinition(
        adjustingSchedule?.reportType || DEFAULT_SCHEDULED_REPORT_TYPE_ID
      ),
    [adjustingSchedule]
  );
  const requestedBy = useMemo(
    () => resolveRequestedByUser(authUser),
    [authUser]
  );
  const isAdjustMode = editorMode === "adjust" && !!adjustingSchedule;
  const activeReportDefinition = isAdjustMode
    ? adjustReportDefinition
    : selectedCreateReportDefinition;
  const activeScheduleConfig = isAdjustMode
    ? adjustScheduleConfig
    : createScheduleConfig;
  const activeSchedulingState = isAdjustMode
    ? isAdjustingSchedule
    : isCreatingSchedule;
  const {
    previewState,
    generatePreview,
    downloadPreview,
    clearPreview,
  } = useScheduledReportPreview({
    sites,
    tanks,
    usersForFilter,
    requestedBy,
  });
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportingService.getScheduledReportEmails({
        includeCompleted,
        take: 300,
      });
      if (result.success) {
        const normalizedRows = (Array.isArray(result.data) ? result.data : [])
          .map(normalizeScheduleRow)
          .filter(Boolean);
        setSchedules(normalizedRows);
      } else {
        notify({
          message: result.error || "Failed to load scheduled report emails.",
          type: "error",
          displayTime: 3000,
          position: "top center",
        });
      }
    } catch {
      notify({
        message: "Failed to load scheduled report emails.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    } finally {
      setLoading(false);
    }
  }, [includeCompleted]);
  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);
    try {
      const [sitesResult, tanksResult, usersResult] = await Promise.allSettled([
        axiosInstance.get("/site"),
        axiosInstance.get("/tank"),
        axiosInstance.get("/tankvolumehistory/users"),
      ]);
      setSites(
        sitesResult.status === "fulfilled"
          ? normalizeSiteOptions(sitesResult.value?.data)
          : []
      );
      setTanks(
        tanksResult.status === "fulfilled"
          ? normalizeTankOptions(tanksResult.value?.data)
          : []
      );
      setUsersForFilter(
        usersResult.status === "fulfilled"
          ? normalizeRecipientOptions(usersResult.value?.data)
          : []
      );
    } catch {
      notify({
        message: "Failed to load report scheduling references.",
        type: "warning",
        displayTime: 3000,
        position: "top center",
      });
    } finally {
      setReferenceLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isAdmin) return;
    loadSchedules();
  }, [isAdmin, loadSchedules]);
  useEffect(() => {
    if (!isAdmin) return;
    loadReferenceData();
  }, [isAdmin, loadReferenceData]);
  const handleCreateConfigChange = useCallback(
    (updates) => applyNoopSafeScheduleUpdates(setCreateScheduleConfig, updates),
    []
  );
  const handleAdjustConfigChange = useCallback(
    (updates) => applyNoopSafeScheduleUpdates(setAdjustScheduleConfig, updates),
    []
  );
  const handleActiveConfigChange = useCallback(
    (updates) => {
      if (isAdjustMode) {
        handleAdjustConfigChange(updates);
        return;
      }
      handleCreateConfigChange(updates);
    },
    [handleAdjustConfigChange, handleCreateConfigChange, isAdjustMode]
  );
  const handleCreateReportTypeChange = useCallback((nextReportTypeId) => {
    const definition = getScheduledReportTypeDefinition(nextReportTypeId);
    setSelectedCreateReportType(definition.id);
    setCreateScheduleConfig((prev) => ({
      ...prev,
      tankIds:
        definition.supportsTankFilter === false ? [] : prev.tankIds || [],
      reportDescription:
        String(prev.reportDescription || "").trim() ||
        definition.defaultDescription ||
        "",
    }));
  }, []);
  const handleStartCreate = useCallback(() => {
    setEditorMode("create");
    setAdjustingSchedule(null);
    clearPreview();
  }, [clearPreview]);
  const openEditInline = useCallback(
    (schedule) => {
      if (!schedule) return;
      const reportDefinition = getScheduledReportTypeDefinition(schedule.reportType);
      setAdjustScheduleConfig(
        buildScheduleConfigFromExistingSchedule(schedule, reportDefinition)
      );
      setAdjustingSchedule(schedule);
      setEditorMode("adjust");
      clearPreview();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearPreview]
  );
  const handleOpenRecipientsPopup = useCallback((schedule) => {
    if (!schedule) return;
    setRecipientPopupSchedule(schedule);
  }, []);
  const handleCloseRecipientsPopup = useCallback(() => {
    setRecipientPopupSchedule(null);
  }, []);
  const handleCancelSchedule = useCallback(
    async (schedule) => {
      if (!schedule?.id) return;
      const shouldCancel = window.confirm(`Cancel schedule '${schedule.title}'?`);
      if (!shouldCancel) return;
      const result = await reportingService.cancelScheduledReportEmail(schedule.id);
      if (result.success) {
        notify({
          message: "Schedule cancelled successfully.",
          type: "success",
          displayTime: 2500,
          position: "top center",
        });
        loadSchedules();
        return;
      }
      notify({
        message: result.error || "Failed to cancel schedule.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    },
    [loadSchedules]
  );
  const handleDeleteSchedule = useCallback(
    async (schedule) => {
      if (!schedule?.id) return;
      const shouldDelete = window.confirm(
        `Permanently delete schedule '${schedule.title}'?\n\nThis action cannot be undone.`
      );
      if (!shouldDelete) return;
      const result = await reportingService.deleteScheduledReportEmail(schedule.id);
      if (result.success) {
        notify({
          message: "Schedule deleted permanently.",
          type: "success",
          displayTime: 2500,
          position: "top center",
        });
        loadSchedules();
        return;
      }
      notify({
        message: result.error || "Failed to delete schedule.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    },
    [loadSchedules]
  );
  const handleCreateSchedule = useCallback(async () => {
    const requestBuildResult = createReportScheduleNotificationRequest({
      scheduleConfig: createScheduleConfig,
      reportDefinition: selectedCreateReportDefinition,
      sites,
      tanks,
      users: usersForFilter,
      requestedBy,
      reportNamePrefix: selectedCreateReportDefinition.reportNamePrefix,
      windowOrigin: window.location.origin,
      requireRecipients: true,
    });
    if (!requestBuildResult.success) {
      notify({
        message: requestBuildResult.error || "Unable to build schedule request.",
        type: "warning",
        displayTime: 3000,
        position: "top center",
      });
      return;
    }
    setIsCreatingSchedule(true);
    try {
      const scheduleResult = await reportingService.scheduleReportEmail(
        requestBuildResult.request
      );
      if (scheduleResult.success) {
        notify({
          message: "Report email scheduled successfully.",
          type: "success",
          displayTime: 3000,
          position: "top center",
        });
        clearPreview();
        loadSchedules();
      } else {
        notify({
          message: scheduleResult.error || "Failed to schedule report email.",
          type: "error",
          displayTime: 3000,
          position: "top center",
        });
      }
    } catch {
      notify({
        message: "Failed to schedule report email. Please try again.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    } finally {
      setIsCreatingSchedule(false);
    }
  }, [
    clearPreview,
    createScheduleConfig,
    loadSchedules,
    requestedBy,
    selectedCreateReportDefinition,
    sites,
    tanks,
    usersForFilter,
  ]);
  const handleSaveScheduleChanges = useCallback(async () => {
    if (!adjustingSchedule?.id) return;
    const periodType = adjustScheduleConfig?.periodType || "daily";
    const scheduleDayOfWeekIds =
      Array.isArray(adjustScheduleConfig?.scheduleDayOfWeekIds) &&
        adjustScheduleConfig.scheduleDayOfWeekIds.length
        ? adjustScheduleConfig.scheduleDayOfWeekIds.filter(Boolean)
        : [adjustScheduleConfig?.scheduleDayOfWeek || "monday"];
    const scheduleWeekOfMonthIds =
      Array.isArray(adjustScheduleConfig?.scheduleWeekOfMonthIds) &&
        adjustScheduleConfig.scheduleWeekOfMonthIds.length
        ? adjustScheduleConfig.scheduleWeekOfMonthIds.filter(Boolean)
        : [adjustScheduleConfig?.scheduleWeekOfMonth || "first"];
    const scheduleWeekOfMonth = scheduleWeekOfMonthIds[0] || "first";
    const scheduleTime = adjustScheduleConfig?.scheduleTime || "08:00";
    const nextRunDate = getNextRunDateTime({
      periodType,
      scheduleDayOfWeek: scheduleDayOfWeekIds[0] || "monday",
      scheduleDayOfWeekIds,
      scheduleWeekOfMonthIds,
      scheduleWeekOfMonth,
      scheduleTime,
    });
    if (!nextRunDate) {
      notify({
        message: "Please provide a valid schedule day/week/time.",
        type: "warning",
        displayTime: 3000,
        position: "top center",
      });
      return;
    }
    const payload = {
      scheduledAtUtc: nextRunDate.toISOString(),
      scheduleType: periodType === "monthly" ? "monthly" : "weekly",
      daysOfWeek: scheduleDayOfWeekIds,
      weeksOfMonth: periodType === "monthly" ? scheduleWeekOfMonthIds : null,
      weekOfMonth: periodType === "monthly" ? scheduleWeekOfMonth : null,
      scheduleTimeOfDay: scheduleTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      enabled: true,
    };
    setIsAdjustingSchedule(true);
    try {
      const result = await reportingService.updateScheduledReportEmail(
        adjustingSchedule.id,
        payload
      );
      if (result.success) {
        notify({
          message: "Schedule updated successfully.",
          type: "success",
          displayTime: 2500,
          position: "top center",
        });
        setAdjustingSchedule(null);
        setEditorMode("create");
        clearPreview();
        loadSchedules();
        return;
      }
      notify({
        message: result.error || "Failed to update schedule.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    } catch {
      notify({
        message: "Failed to update schedule.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    } finally {
      setIsAdjustingSchedule(false);
    }
  }, [adjustScheduleConfig, adjustingSchedule, clearPreview, loadSchedules]);
  const handleSubmitSchedule = useCallback(() => {
    if (isAdjustMode) {
      handleSaveScheduleChanges();
      return;
    }
    handleCreateSchedule();
  }, [handleCreateSchedule, handleSaveScheduleChanges, isAdjustMode]);
  const handlePreview = useCallback(() => {
    generatePreview(activeScheduleConfig, activeReportDefinition);
  }, [activeReportDefinition, activeScheduleConfig, generatePreview]);
  const handleDownloadPreview = useCallback(() => {
    downloadPreview();
  }, [downloadPreview]);
  const previewGeneratedAtText = previewState.generatedAt
    ? formatLocalDateTime(previewState.generatedAt)
    : "-";
  const adjustFormNotice = isAdjustMode
    ? "Adjust mode updates the schedule cadence/time. Preview shows the jsreport output that recipients will receive."
    : null;
  if (!isAdmin) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <div className="tw-text-lg tw-font-semibold tw-text-gray-700">
            Access Denied
          </div>
          <div className="tw-text-sm tw-text-gray-500">
            Only admins can manage scheduled report emails.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="scheduled-emails tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4 tw-space-y-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            Scheduled Report Emails
          </h2>
          <p className="tw-text-sm tw-text-gray-500">
            Create or adjust scheduled report emails and preview jsreport output
            in one page.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
            />
            Include sent/cancelled
          </label>
          <Button
            text="Create New"
            icon="fa-light fa-plus"
            type={isAdjustMode ? "normal" : "default"}
            stylingMode={isAdjustMode ? "outlined" : "contained"}
            onClick={handleStartCreate}
            disabled={referenceLoading}
          />
          <Button
            text="Refresh"
            icon="fa-light fa-rotate"
            stylingMode="outlined"
            onClick={loadSchedules}
          />
        </div>
      </div>
      <div className="scheduled-emails__workspace tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-4">
        <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
            <div>
              <div className="tw-text-sm tw-font-semibold tw-text-slate-800">
                {isAdjustMode
                  ? `Adjust Schedule: ${adjustingSchedule?.title || "Scheduled Report"}`
                  : "Create Scheduled Report Email"}
              </div>
              {isAdjustMode && (
                <div className="tw-text-xs tw-text-slate-500 tw-mt-1">
                  Status: {adjustingSchedule?.status || "Scheduled"}
                </div>
              )}
            </div>
            {isAdjustMode && (
              <Button
                text="Exit Adjust"
                icon="fa-light fa-arrow-left"
                stylingMode="outlined"
                onClick={handleStartCreate}
                disabled={activeSchedulingState}
              />
            )}
          </div>
          <ScheduleReportEmailDialog
            isInline={true}
            hideCancelButton={!isAdjustMode}
            cancelButtonText="Discard Changes"
            onHiding={isAdjustMode ? handleStartCreate : undefined}
            sites={sites}
            tanks={
              activeReportDefinition.supportsTankFilter === false ? [] : tanks
            }
            usersForFilter={usersForFilter}
            scheduleConfig={activeScheduleConfig}
            onScheduleConfigChange={handleActiveConfigChange}
            onSchedule={handleSubmitSchedule}
            isScheduling={activeSchedulingState}
            title={
              isAdjustMode
                ? "Adjust Scheduled Email"
                : "Create Scheduled Report Email"
            }
            submitButtonText={isAdjustMode ? "Save Changes" : "Create Schedule"}
            reportNamePrefix={activeReportDefinition.reportNamePrefix}
            reportTypeOptions={isAdjustMode ? [] : SCHEDULED_REPORT_TYPE_OPTIONS}
            selectedReportType={isAdjustMode ? null : selectedCreateReportType}
            onReportTypeChange={isAdjustMode ? null : handleCreateReportTypeChange}
            formNotice={adjustFormNotice}
            onPreview={handlePreview}
          />
        </div>
        <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-flex tw-flex-col">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
            <div>
              <div className="tw-text-sm tw-font-semibold tw-text-slate-800">
                JsReport Preview
              </div>
              <div className="tw-text-xs tw-text-slate-500 tw-mt-1">
                Generated: {previewGeneratedAtText}
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <Button
                text="Generate"
                icon="fa-light fa-eye"
                stylingMode="outlined"
                onClick={handlePreview}
                disabled={previewState.isLoading}
              />
              <Button
                text={
                  previewState.isDownloading
                    ? "Preparing..."
                    : `Download ${String(
                      activeScheduleConfig?.format || "pdf"
                    ).toUpperCase()}`
                }
                icon="fa-light fa-download"
                stylingMode="outlined"
                onClick={handleDownloadPreview}
                disabled={previewState.isLoading || !previewState.html}
              />
            </div>
          </div>
          {previewState.error ? (
            <div className="tw-rounded-md tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700 tw-mb-3">
              {previewState.error}
            </div>
          ) : null}
          {previewState.info ? (
            <div className="tw-rounded-md tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-800 tw-mb-3">
              {previewState.info}
            </div>
          ) : null}
          <div className="scheduled-emails__preview-shell tw-flex-1 tw-border tw-border-gray-200 tw-rounded-md tw-bg-white tw-overflow-auto">
            {previewState.isLoading ? (
              <div className="tw-h-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-text-slate-500">
                Generating jsreport preview...
              </div>
            ) : previewState.html ? (
              <div
                className="scheduled-emails__preview-html"
                dangerouslySetInnerHTML={{ __html: previewState.html }}
              />
            ) : (
              <div className="tw-h-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-text-slate-500 tw-p-6 tw-text-center">
                Configure schedule details and click Generate to preview the
                jsreport output.
              </div>
            )}
          </div>
        </div>
      </div>
      <ScheduledEmailGrid
        schedules={schedules}
        loading={loading}
        statusClassByValue={STATUS_CLASS_BY_VALUE}
        formatLocalDateTime={formatLocalDateTime}
        onOpenAdjust={openEditInline}
        onOpenRecipients={handleOpenRecipientsPopup}
        onCancelSchedule={handleCancelSchedule}
        onDeleteSchedule={handleDeleteSchedule}
      />
      <RecipientDeliveryStatusPopup
        schedule={recipientPopupSchedule}
        onHiding={handleCloseRecipientsPopup}
        formatLocalDateTime={formatLocalDateTime}
      />
    </div>
  );
};
export default ReportScheduleSettings;
