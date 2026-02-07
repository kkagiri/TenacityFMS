/**
 * File: useScheduledReportPreview.js
 * Purpose: Build inline jsreport previews/downloads for scheduled report email setup.
 * Dependencies: react, devextreme/ui/notify, axiosInstance, reportingService, report scheduler utilities
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - useScheduledReportPreview: Generates jsreport HTML preview and optional PDF/Excel download payload.
 */
import { useCallback, useState } from "react";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import reportingService from "../../../services/reportingService";
import {
  createReportScheduleNotificationRequest,
  toIsoDate,
} from "../../../components/Reporting/ReportScheduler";
import {
  buildTransactionVolumeHistoryFileName,
  buildTransactionVolumeHistoryReportData,
} from "../../tankStock/management/components/transactionHub/transactionHistoryReportUtils";

const DEFAULT_PREVIEW_STATE = {
  isLoading: false,
  isDownloading: false,
  generatedAt: null,
  reportLabel: "",
  format: "pdf",
  html: "",
  error: "",
  info: "",
};

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeIdArray = (values) =>
  (Array.isArray(values) ? values : [])
    .map((value) => normalizeNumber(value))
    .filter((value) => Number.isInteger(value) && value > 0);

const normalizeVolumeHistoryRows = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      timestamp: row?.timestamp || row?.Timestamp || null,
      tankId: normalizeNumber(row?.tankId ?? row?.TankId),
      siteId: normalizeNumber(row?.siteId ?? row?.SiteId),
      newVolume: row?.newVolume ?? row?.NewVolume ?? 0,
      volumeChange: row?.volumeChange ?? row?.VolumeChange ?? 0,
      changeReason: row?.changeReason ?? row?.ChangeReason ?? null,
      vehicleName: row?.vehicleName || row?.VehicleName || null,
      recordedByUserName:
        row?.recordedByUserName ||
        row?.RecordedByUserName ||
        row?.recordedBy ||
        row?.RecordedBy ||
        null,
    }))
    .filter((row) => Number.isInteger(row.tankId) && row.tankId > 0);

const useScheduledReportPreview = ({
  sites,
  tanks,
  usersForFilter,
  requestedBy,
}) => {
  const [previewState, setPreviewState] = useState(DEFAULT_PREVIEW_STATE);
  const [previewContext, setPreviewContext] = useState(null);

  const clearPreview = useCallback(() => {
    setPreviewState(DEFAULT_PREVIEW_STATE);
    setPreviewContext(null);
  }, []);

  const buildTransactionPreviewData = useCallback(
    async ({ scheduleConfig, reportWindow }) => {
      const startDate = reportWindow?.startDate || null;
      const endDate = reportWindow?.endDate || null;
      const startIso = toIsoDate(startDate);
      const endIso = toIsoDate(endDate);

      if (!startIso || !endIso) {
        throw new Error("Unable to resolve report window for preview.");
      }

      const selectedSiteIds = normalizeIdArray(scheduleConfig?.siteIds);
      const selectedTankIds = normalizeIdArray(scheduleConfig?.tankIds);

      const response = await axiosInstance.get("/tankvolumehistory/filtered", {
        params: {
          startDate: startIso,
          endDate: endIso,
          includeVehicleNames: true,
          useManualDispensing: false,
          take: 50000,
        },
      });

      const normalizedRows = normalizeVolumeHistoryRows(response?.data);
      const scopedRows = normalizedRows.filter((row) => {
        const sitePass = selectedSiteIds.length
          ? selectedSiteIds.includes(row.siteId)
          : true;
        const tankPass = selectedTankIds.length
          ? selectedTankIds.includes(row.tankId)
          : true;
        return sitePass && tankPass;
      });

      return {
        reportData: buildTransactionVolumeHistoryReportData({
          tankVolumeHistory: scopedRows,
          tanks,
          sites,
          headerStartDate: startDate ? new Date(startDate) : null,
          headerEndDate: endDate ? new Date(endDate) : null,
          selectedSiteIds,
          selectedTankIds,
          user: { userName: requestedBy || "Unknown User" },
        }),
        startDate,
        endDate,
      };
    },
    [requestedBy, sites, tanks]
  );

  const generatePreview = useCallback(
    async (scheduleConfig, reportDefinition) => {
      const requestBuildResult = createReportScheduleNotificationRequest({
        scheduleConfig,
        reportDefinition,
        sites,
        tanks,
        users: usersForFilter,
        requestedBy,
        reportNamePrefix: reportDefinition?.reportNamePrefix,
        windowOrigin: window.location.origin,
        requireRecipients: false,
      });

      if (!requestBuildResult.success || !requestBuildResult.request) {
        const message =
          requestBuildResult.error || "Unable to prepare preview request.";
        setPreviewState((prev) => ({
          ...prev,
          error: message,
          info: "",
          html: "",
        }));
        notify({
          message,
          type: "warning",
          displayTime: 3000,
          position: "top center",
        });
        return;
      }

      if (!reportDefinition?.templateName) {
        const message =
          "JsReport preview is not configured for this report type yet.";
        setPreviewState((prev) => ({
          ...prev,
          error: message,
          info: "",
          html: "",
        }));
        notify({
          message,
          type: "warning",
          displayTime: 3000,
          position: "top center",
        });
        return;
      }

      setPreviewState((prev) => ({
        ...prev,
        isLoading: true,
        error: "",
        info: "",
      }));

      try {
        let previewData = null;
        const reportType = String(reportDefinition?.reportType || "").trim();

        if (reportType === "TransactionVolumeHistory") {
          previewData = await buildTransactionPreviewData({
            scheduleConfig,
            reportWindow: requestBuildResult.reportWindow,
          });
        } else {
          throw new Error(
            "Preview data builder is not available for this report type."
          );
        }

        const previewResult = await reportingService.previewJsReport(
          reportDefinition.templateName,
          previewData.reportData
        );

        if (!previewResult.success || !previewResult.html) {
          throw new Error(
            previewResult.error || "Failed to render jsreport preview."
          );
        }

        const selectedFormat = String(scheduleConfig?.format || "pdf").toLowerCase();

        setPreviewContext({
          templateName: reportDefinition.templateName,
          reportData: previewData.reportData,
          reportType,
          startDate: previewData.startDate,
          endDate: previewData.endDate,
          selectedFormat,
          html: previewResult.html,
        });

        setPreviewState({
          isLoading: false,
          isDownloading: false,
          generatedAt: new Date().toISOString(),
          reportLabel: reportDefinition?.name || "Scheduled Report",
          format: selectedFormat,
          html: previewResult.html,
          error: "",
          info:
            selectedFormat === "html"
              ? ""
              : `Preview is HTML source. Final delivery format remains ${selectedFormat.toUpperCase()}.`,
        });
      } catch (error) {
        const message = error?.message || "Failed to generate jsreport preview.";
        setPreviewState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          info: "",
          html: "",
        }));
        notify({
          message,
          type: "error",
          displayTime: 3000,
          position: "top center",
        });
      }
    },
    [
      buildTransactionPreviewData,
      requestedBy,
      sites,
      tanks,
      usersForFilter,
    ]
  );

  const downloadPreview = useCallback(async () => {
    if (!previewContext?.templateName || !previewContext?.reportData) {
      notify({
        message: "Generate preview first before downloading.",
        type: "warning",
        displayTime: 2500,
        position: "top center",
      });
      return;
    }

    const format = String(previewContext.selectedFormat || "pdf").toLowerCase();
    if (format === "html") {
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(previewContext.html || previewState.html || "");
        previewWindow.document.close();
      }
      return;
    }

    setPreviewState((prev) => ({ ...prev, isDownloading: true }));

    try {
      const renderResult =
        format === "excel"
          ? await reportingService.renderJsReportExcel(
              previewContext.templateName,
              previewContext.reportData
            )
          : await reportingService.renderJsReportPdf(
              previewContext.templateName,
              previewContext.reportData
            );

      if (!renderResult.success || !renderResult.blob) {
        throw new Error(renderResult.error || "Failed to render preview download.");
      }

      const baseFileName = buildTransactionVolumeHistoryFileName(
        previewContext.startDate ? new Date(previewContext.startDate) : null,
        previewContext.endDate ? new Date(previewContext.endDate) : null
      ).replace(/\.pdf$/i, "");
      const extension = format === "excel" ? "xlsx" : "pdf";

      reportingService.downloadReportFile(
        renderResult.blob,
        `${baseFileName}.${extension}`
      );
    } catch (error) {
      notify({
        message: error?.message || "Failed to download preview report.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    } finally {
      setPreviewState((prev) => ({ ...prev, isDownloading: false }));
    }
  }, [previewContext, previewState.html]);

  return {
    previewState,
    generatePreview,
    downloadPreview,
    clearPreview,
  };
};

export { useScheduledReportPreview };
