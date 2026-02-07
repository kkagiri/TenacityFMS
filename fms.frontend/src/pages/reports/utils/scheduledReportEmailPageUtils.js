/**
 * File: scheduledReportEmailPageUtils.js
 * Purpose: Shared helpers/configuration for Reports scheduled-email create/adjust flows.
 * Dependencies: reportEmailScheduleUtils
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - getScheduledReportTypeDefinition: Resolves report scheduling metadata by id/reportType.
 * - normalizeSiteOptions: Normalizes site API payloads for scheduler TagBox usage.
 * - normalizeTankOptions: Normalizes tank API payloads for scheduler TagBox usage.
 * - normalizeRecipientOptions: Normalizes user payloads for scheduler recipient TagBox.
 * - buildScheduleConfigFromExistingSchedule: Maps scheduled-email row metadata to dialog config.
 */
import {
  REPORT_NAME_PREFIX,
  createDefaultReportScheduleConfig,
} from "../../../components/Reporting/ReportScheduler";

export const SCHEDULED_REPORT_TYPE_OPTIONS = [
  {
    id: "transaction-volume-history",
    name: "Transaction Volume History",
    reportType: "TransactionVolumeHistory",
    templateName: "transaction-volume-history-report",
    triggerSource: "TransactionVolumeHistoryReportSchedule",
    reportPath: "/reports/tank-volume-history",
    reportNamePrefix: REPORT_NAME_PREFIX,
    defaultDescription: "Scheduled tank volume history report delivery.",
    supportsTankFilter: true,
  },
  {
    id: "consumption-refills",
    name: "Consumption by Refills",
    reportType: "ConsumptionByRefill",
    templateName: null,
    triggerSource: "ConsumptionByRefillReportSchedule",
    reportPath: "/reports/consumption-refills",
    reportNamePrefix: "ConsumptionRefills - ",
    defaultDescription: "Scheduled consumption by refills report delivery.",
    supportsTankFilter: false,
  },
  {
    id: "vehicle-consumption",
    name: "Vehicle Consumption",
    reportType: "VehicleConsumption",
    templateName: null,
    triggerSource: "VehicleConsumptionReportSchedule",
    reportPath: "/reports/vehicle-consumption",
    reportNamePrefix: "VehicleConsumption - ",
    defaultDescription: "Scheduled vehicle consumption report delivery.",
    supportsTankFilter: false,
  },
  {
    id: "pts-device-offline",
    name: "PTS Device Offline",
    reportType: "PTSDeviceOffline",
    templateName: null,
    triggerSource: "PTSDeviceOfflineReportSchedule",
    reportPath: "/reports/pts-offline",
    reportNamePrefix: "PTSOffline - ",
    defaultDescription: "Scheduled PTS offline report delivery.",
    supportsTankFilter: false,
  },
];

export const DEFAULT_SCHEDULED_REPORT_TYPE_ID =
  SCHEDULED_REPORT_TYPE_OPTIONS[0].id;

const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload && Array.isArray(payload.Data)) {
    return payload.Data;
  }

  if (payload && payload.data && Array.isArray(payload.data.data)) {
    return payload.data.data;
  }

  return [];
};

const normalizeId = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

export const getScheduledReportTypeDefinition = (reportTypeOrId) => {
  const normalizedValue = String(reportTypeOrId || "").trim().toLowerCase();

  const byId = SCHEDULED_REPORT_TYPE_OPTIONS.find(
    (option) => option.id.toLowerCase() === normalizedValue
  );
  if (byId) {
    return byId;
  }

  const byReportType = SCHEDULED_REPORT_TYPE_OPTIONS.find(
    (option) => option.reportType.toLowerCase() === normalizedValue
  );
  if (byReportType) {
    return byReportType;
  }

  return SCHEDULED_REPORT_TYPE_OPTIONS[0];
};

export const normalizeSiteOptions = (payload) =>
  extractCollection(payload)
    .map((site) => {
      const id = normalizeId(site?.id, site?.siteId, site?.SiteId);
      if (!id) {
        return null;
      }

      return {
        id,
        name:
          site?.name ||
          site?.siteName ||
          site?.Name ||
          site?.SiteName ||
          `Site ${id}`,
      };
    })
    .filter(Boolean);

export const normalizeTankOptions = (payload) =>
  extractCollection(payload)
    .map((tank) => {
      const id = normalizeId(tank?.id, tank?.tankId, tank?.TankId);
      if (!id) {
        return null;
      }

      const siteId = normalizeId(tank?.siteId, tank?.SiteId);

      return {
        id,
        siteId,
        name:
          tank?.name ||
          tank?.tankName ||
          tank?.Name ||
          tank?.TankName ||
          `Tank ${id}`,
      };
    })
    .filter(Boolean);

export const normalizeRecipientOptions = (payload) =>
  extractCollection(payload)
    .map((user) => {
      const rawId = user?.userId ?? user?.id ?? user?.Id ?? user?.UserId;
      if (rawId === null || rawId === undefined || String(rawId).trim() === "") {
        return null;
      }

      return {
        id: String(rawId),
        name:
          user?.userName ||
          user?.username ||
          user?.name ||
          user?.Name ||
          `User ${rawId}`,
      };
    })
    .filter(Boolean);

export const buildScheduleConfigFromExistingSchedule = (
  schedule,
  reportDefinition
) => {
  const parseIntegerIds = (values) =>
    (Array.isArray(values) ? values : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

  const parseIntegerIdsFromViewPath = (reportViewPath, paramName) => {
    if (!reportViewPath || !paramName) return [];

    try {
      const normalizedPath = String(reportViewPath).startsWith("http")
        ? new URL(reportViewPath)
        : new URL(String(reportViewPath), "http://localhost");
      const raw = normalizedPath.searchParams.get(paramName);
      if (!raw) return [];

      return raw
        .split(",")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    } catch {
      return [];
    }
  };

  const sanitizeDescription = (value, fallback) => {
    const raw = String(value || "").trim();
    if (!raw) return String(fallback || "");

    if (raw.includes("<") && raw.includes(">")) {
      return String(fallback || "");
    }

    return raw;
  };

  const dayIds =
    Array.isArray(schedule?.scheduleDaysOfWeek) &&
      schedule.scheduleDaysOfWeek.length
      ? schedule.scheduleDaysOfWeek
      : [schedule?.scheduleDayOfWeek || "monday"];
  const weekIds =
    Array.isArray(schedule?.scheduleWeeksOfMonth) &&
      schedule.scheduleWeeksOfMonth.length
      ? schedule.scheduleWeeksOfMonth
      : [schedule?.scheduleWeekOfMonth || "first"];

  const recipientIds = Array.isArray(schedule?.recipients)
    ? schedule.recipients
      .map((recipient) => recipient?.userId)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value))
    : [];

  const periodType =
    String(schedule?.periodType || "").trim().toLowerCase() === "monthly" ||
      String(schedule?.scheduleType || "").trim().toLowerCase() === "monthly"
      ? "monthly"
      : "daily";

  const format = String(schedule?.format || "pdf").trim().toLowerCase();
  const safeFormat =
    format === "html" || format === "excel" || format === "pdf"
      ? format
      : "pdf";
  const siteIds = parseIntegerIds(schedule?.siteIds);
  const tankIds = parseIntegerIds(schedule?.tankIds);
  const parsedSiteIdsFromPath = parseIntegerIdsFromViewPath(
    schedule?.reportViewPath || schedule?.reportViewUrl,
    "siteIds"
  );
  const parsedTankIdsFromPath = parseIntegerIdsFromViewPath(
    schedule?.reportViewPath || schedule?.reportViewUrl,
    "tankIds"
  );
  const resolvedSiteIds = siteIds.length ? siteIds : parsedSiteIdsFromPath;
  const resolvedTankIds = tankIds.length ? tankIds : parsedTankIdsFromPath;
  const supportsTankFilter = reportDefinition?.supportsTankFilter !== false;

  return createDefaultReportScheduleConfig({
    siteIds: resolvedSiteIds,
    tankIds: supportsTankFilter ? resolvedTankIds : [],
    recipientIds,
    periodType,
    format: safeFormat,
    scheduleDayOfWeekIds: dayIds,
    scheduleDayOfWeek: dayIds[0] || "monday",
    scheduleWeekOfMonthIds: weekIds,
    scheduleWeekOfMonth: weekIds[0] || "first",
    scheduleTime: schedule?.scheduleTimeOfDay || "08:00",
    reportName: schedule?.title || "Scheduled Report",
    reportDescription:
      sanitizeDescription(
        schedule?.reportDescription || schedule?.message,
        reportDefinition?.defaultDescription || ""
      ),
  });
};
