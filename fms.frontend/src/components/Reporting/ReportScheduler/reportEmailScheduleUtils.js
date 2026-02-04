/**
 * File: reportEmailScheduleUtils.js
 * Purpose: Shared helpers/constants for recurring report email scheduling
 * Dependencies: none
 * Last Modified: 2026-02-03
 *
 * Key Functions:
 * - createDefaultReportScheduleConfig: Builds default scheduler form state
 * - getNextRunDateTime: Resolves next run date/time from day/week/time selectors
 * - getEffectiveReportWindowForRun: Resolves report window from next run and period
 * - buildScheduledReportSummaryHtml: Creates summary HTML for notification message body
 */

export const REPORT_NAME_PREFIX = "TankVolumeHistory - ";

export const REPORT_PERIOD_OPTIONS = [
  { id: "daily", name: "Daily" },
  { id: "monthly", name: "Monthly" },
];

export const REPORT_FORMAT_OPTIONS = [
  { id: "pdf", name: "PDF" },
  { id: "excel", name: "Excel" },
];

export const DAY_OF_WEEK_OPTIONS = [
  { id: "monday", name: "Monday", dayIndex: 1 },
  { id: "tuesday", name: "Tuesday", dayIndex: 2 },
  { id: "wednesday", name: "Wednesday", dayIndex: 3 },
  { id: "thursday", name: "Thursday", dayIndex: 4 },
  { id: "friday", name: "Friday", dayIndex: 5 },
  { id: "saturday", name: "Saturday", dayIndex: 6 },
  { id: "sunday", name: "Sunday", dayIndex: 0 },
];

export const WEEK_OF_MONTH_OPTIONS = [
  { id: "first", name: "1st Week", order: 1 },
  { id: "second", name: "2nd Week", order: 2 },
  { id: "third", name: "3rd Week", order: 3 },
  { id: "fourth", name: "4th Week", order: 4 },
  { id: "last", name: "Last Week", order: -1 },
];

const toStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const toEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const pad2 = (value) => String(value).padStart(2, "0");

export const toIsoDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
};

export const toTimeString = (dateValue) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "08:00";
  return `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
};

export const createDateFromTimeString = (timeOfDay) => {
  const now = new Date();
  const [hourPart, minutePart] = String(timeOfDay || "08:00").split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);

  now.setHours(
    Number.isFinite(hours) ? Math.max(0, Math.min(23, hours)) : 8,
    Number.isFinite(minutes) ? Math.max(0, Math.min(59, minutes)) : 0,
    0,
    0
  );

  return now;
};

export const buildReportNameWithPrefix = (reportName) => {
  const normalizedName = String(reportName || "").trim();
  if (!normalizedName) return `${REPORT_NAME_PREFIX}Scheduled Report`;
  return normalizedName.startsWith(REPORT_NAME_PREFIX)
    ? normalizedName
    : `${REPORT_NAME_PREFIX}${normalizedName}`;
};

export const createDefaultReportScheduleConfig = ({
  siteIds = [],
  tankIds = [],
  recipientIds = [],
  periodType = "daily",
  format = "pdf",
  scheduleDayOfWeek = "monday",
  scheduleDayOfWeekIds = null,
  scheduleWeekOfMonth = "first",
  scheduleTime = null,
  reportName = "Scheduled Report",
  reportDescription = "",
} = {}) => {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  const normalizedDays = normalizeDayIds(
    Array.isArray(scheduleDayOfWeekIds) && scheduleDayOfWeekIds.length
      ? scheduleDayOfWeekIds
      : [scheduleDayOfWeek]
  );

  return {
    siteIds: [...siteIds],
    tankIds: [...tankIds],
    recipientIds: [...recipientIds],
    periodType,
    format,
    scheduleDayOfWeekIds: normalizedDays,
    scheduleDayOfWeek: normalizedDays[0],
    scheduleWeekOfMonth,
    scheduleTime: scheduleTime || toTimeString(nextHour),
    reportName,
    reportDescription,
  };
};

export const filterTankIdsBySelectedSites = ({
  tankIds = [],
  siteIds = [],
  tanks = [],
}) => {
  if (!tankIds.length || !siteIds.length) return tankIds;

  const allowedTankIds = new Set(
    tanks
      .filter((tank) => siteIds.includes(tank.siteId))
      .map((tank) => tank.id)
  );

  return tankIds.filter((tankId) => allowedTankIds.has(tankId));
};

const getDayIndex = (dayId) =>
  DAY_OF_WEEK_OPTIONS.find((day) => day.id === dayId)?.dayIndex ?? 1;

const getWeekOrder = (weekId) =>
  WEEK_OF_MONTH_OPTIONS.find((week) => week.id === weekId)?.order ?? 1;

function normalizeDayIds(dayIds = []) {
  const validIds = new Set(DAY_OF_WEEK_OPTIONS.map((day) => day.id));
  const normalized = (dayIds || []).filter((dayId) => validIds.has(dayId));
  return normalized.length ? [...new Set(normalized)] : ["monday"];
}

const getNthWeekdayOfMonth = (year, monthIndex, targetDayIndex, weekOrder) => {
  if (weekOrder === -1) {
    const candidate = new Date(year, monthIndex + 1, 0);
    while (candidate.getDay() !== targetDayIndex) {
      candidate.setDate(candidate.getDate() - 1);
    }
    return candidate;
  }

  const firstDay = new Date(year, monthIndex, 1);
  const deltaDays = (targetDayIndex - firstDay.getDay() + 7) % 7;
  const candidate = new Date(year, monthIndex, 1 + deltaDays + (weekOrder - 1) * 7);

  if (candidate.getMonth() !== monthIndex) return null;
  return candidate;
};

export const getNextRunDateTime = ({
  periodType = "daily",
  scheduleDayOfWeek = "monday",
  scheduleDayOfWeekIds = null,
  scheduleWeekOfMonth = "first",
  scheduleTime = "08:00",
  fromDate = new Date(),
}) => {
  const reference = new Date(fromDate);
  if (Number.isNaN(reference.getTime())) return null;

  const [hourPart, minutePart] = String(scheduleTime).split(":");
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const dayIds = normalizeDayIds(
    Array.isArray(scheduleDayOfWeekIds) && scheduleDayOfWeekIds.length
      ? scheduleDayOfWeekIds
      : [scheduleDayOfWeek]
  );
  const targetDayIndexes = dayIds.map((dayId) => getDayIndex(dayId));

  if (periodType === "monthly") {
    const weekOrder = getWeekOrder(scheduleWeekOfMonth);
    const currentMonthCandidates = targetDayIndexes
      .map((targetDayIndex) =>
        getNthWeekdayOfMonth(
          reference.getFullYear(),
          reference.getMonth(),
          targetDayIndex,
          weekOrder
        )
      )
      .filter(Boolean)
      .map((date) => {
        const value = new Date(date);
        value.setHours(hours, minutes, 0, 0);
        return value;
      })
      .filter((date) => date > reference)
      .sort((a, b) => a - b);

    if (currentMonthCandidates.length) {
      return currentMonthCandidates[0];
    }

    const nextMonthBase = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
    const nextMonthCandidates = targetDayIndexes
      .map((targetDayIndex) =>
        getNthWeekdayOfMonth(
          nextMonthBase.getFullYear(),
          nextMonthBase.getMonth(),
          targetDayIndex,
          weekOrder
        )
      )
      .filter(Boolean)
      .map((date) => {
        const value = new Date(date);
        value.setHours(hours, minutes, 0, 0);
        return value;
      })
      .sort((a, b) => a - b);

    return nextMonthCandidates.length ? nextMonthCandidates[0] : null;
  }

  const candidates = targetDayIndexes
    .map((targetDayIndex) => {
      const candidate = new Date(reference);
      candidate.setHours(hours, minutes, 0, 0);

      const daysUntilTarget = (targetDayIndex - candidate.getDay() + 7) % 7;
      candidate.setDate(candidate.getDate() + daysUntilTarget);

      if (candidate <= reference) {
        candidate.setDate(candidate.getDate() + 7);
      }

      return candidate;
    })
    .sort((a, b) => a - b);

  return candidates.length ? candidates[0] : null;
};

export const getEffectiveReportWindowForRun = ({
  periodType = "daily",
  runDate,
}) => {
  const baseRunDate = new Date(runDate);
  if (Number.isNaN(baseRunDate.getTime())) return null;

  if (periodType === "monthly") {
    const monthStart = new Date(baseRunDate.getFullYear(), baseRunDate.getMonth(), 1);
    const monthEnd = new Date(baseRunDate.getFullYear(), baseRunDate.getMonth() + 1, 0);

    return {
      startDate: toStartOfDay(monthStart),
      endDate: toEndOfDay(monthEnd),
      label: monthStart.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      offsetDescription: "current run month",
    };
  }

  const previousDay = new Date(baseRunDate);
  previousDay.setDate(previousDay.getDate() - 1);

  return {
    startDate: toStartOfDay(previousDay),
    endDate: toEndOfDay(previousDay),
    label: previousDay.toLocaleDateString(),
    offsetDescription: "run date minus 1 day",
  };
};

export const resolveEntityNames = (
  items = [],
  ids = [],
  {
    idField = "id",
    nameField = "name",
    emptyLabel = "All",
  } = {}
) => {
  if (!ids || ids.length === 0) return [emptyLabel];

  const idSet = new Set(ids);
  const resolved = items
    .filter((item) => idSet.has(item[idField]))
    .map((item) => item[nameField])
    .filter(Boolean);

  return resolved.length > 0 ? resolved : [emptyLabel];
};

export const buildScheduledReportSummaryHtml = ({
  title,
  description,
  periodType,
  reportWindow,
  nextRunAt,
  format,
  scheduleDayOfWeek,
  scheduleDayOfWeekIds,
  scheduleWeekOfMonth,
  scheduleTime,
  siteNames = [],
  tankNames = [],
  recipientNames = [],
  requestedBy,
  timeZone,
}) => {
  const nextRun = nextRunAt ? new Date(nextRunAt) : null;
  const nextRunText =
    nextRun && !Number.isNaN(nextRun.getTime())
      ? nextRun.toLocaleString()
      : "N/A";

  const safeTitle = title || `${REPORT_NAME_PREFIX}Scheduled Report`;
  const safeDescription = description || "Scheduled tank volume history report delivery.";
  const periodLabel = periodType === "monthly" ? "Monthly" : "Daily";
  const formatLabel = (format || "pdf").toUpperCase();
  const windowLabel = reportWindow?.label || "N/A";
  const windowStart = toIsoDate(reportWindow?.startDate) || "N/A";
  const windowEnd = toIsoDate(reportWindow?.endDate) || "N/A";
  const siteText = siteNames.length ? siteNames.join(", ") : "All Sites";
  const tankText = tankNames.length ? tankNames.join(", ") : "All Tanks";
  const recipientText = recipientNames.length
    ? recipientNames.join(", ")
    : "Selected recipients";
  const weekLabel =
    periodType === "monthly"
      ? WEEK_OF_MONTH_OPTIONS.find((week) => week.id === scheduleWeekOfMonth)?.name || "1st Week"
      : "Weekly";
  const dayIds = normalizeDayIds(
    Array.isArray(scheduleDayOfWeekIds) && scheduleDayOfWeekIds.length
      ? scheduleDayOfWeekIds
      : [scheduleDayOfWeek]
  );
  const dayLabel = dayIds
    .map((dayId) => DAY_OF_WEEK_OPTIONS.find((day) => day.id === dayId)?.name)
    .filter(Boolean)
    .join(", ");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.45;color:#1f2937;">
      <h3 style="margin:0 0 10px 0;color:#0f172a;">${safeTitle}</h3>
      <p style="margin:0 0 10px 0;">${safeDescription}</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Period</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${periodLabel}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Schedule pattern</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${dayLabel}${periodType === "monthly" ? `, ${weekLabel}` : ""} at ${scheduleTime}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Next run</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${nextRunText}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Report window</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${windowLabel} (${windowStart} to ${windowEnd})</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Format</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${formatLabel}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Sites</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${siteText}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Tanks</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${tankText}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Recipients</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${recipientText}</td></tr>
        <tr><td style="padding:6px 8px;border:1px solid #e5e7eb;"><strong>Requested by</strong></td><td style="padding:6px 8px;border:1px solid #e5e7eb;">${requestedBy || "Unknown User"} (${timeZone || "UTC"})</td></tr>
      </table>
    </div>
  `;
};
