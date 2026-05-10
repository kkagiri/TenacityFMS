/**
 * File: reportScheduleSettingsUtils.js
 * Purpose: Utility helpers for scheduled report email settings page display/state normalization.
 * Dependencies: none
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - formatLocalDateTime: Formats nullable date values for data-grid display.
 * - normalizeScheduleRow: Normalizes API payload casing/shape for schedule rows.
 * - resolveRequestedByUser: Resolves display name from auth user payload variants.
 * - applyNoopSafeScheduleUpdates: Prevents state loops by skipping no-op object updates.
 */
export const STATUS_CLASS_BY_VALUE = {
  scheduled: "scheduled-emails__status--scheduled",
  sent: "scheduled-emails__status--sent",
  cancelled: "scheduled-emails__status--cancelled",
  failed: "scheduled-emails__status--failed",
  partiallyfailed: "scheduled-emails__status--warning",
  pending: "scheduled-emails__status--pending",
};

export const formatLocalDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export const normalizeScheduleRow = (row) => {
  if (!row || typeof row !== "object") {
    return null;
  }

  return {
    ...row,
    id: row.id ?? row.Id ?? null,
    notificationId: row.notificationId ?? row.NotificationId ?? "",
    title: row.title ?? row.Title ?? "Scheduled Report",
    format: row.format ?? row.Format ?? "PDF",
    status: row.status ?? row.Status ?? "Pending",
    scheduledAt: row.scheduledAt ?? row.ScheduledAt ?? null,
    scheduleTimeOfDay: row.scheduleTimeOfDay ?? row.ScheduleTimeOfDay ?? "08:00",
    scheduleType: row.scheduleType ?? row.ScheduleType ?? "weekly",
    scheduleWeekOfMonth:
      row.scheduleWeekOfMonth ?? row.ScheduleWeekOfMonth ?? "first",
    scheduleWeeksOfMonth:
      row.scheduleWeeksOfMonth ?? row.ScheduleWeeksOfMonth ?? [],
    scheduleDaysOfWeek:
      row.scheduleDaysOfWeek ?? row.ScheduleDaysOfWeek ?? ["monday"],
    periodType: row.periodType ?? row.PeriodType ?? "daily",
    reportType: row.reportType ?? row.ReportType ?? "TransactionVolumeHistory",
    reportDescription: row.reportDescription ?? row.ReportDescription ?? "",
    reportViewPath: row.reportViewPath ?? row.ReportViewPath ?? "",
    reportViewUrl: row.reportViewUrl ?? row.ReportViewUrl ?? "",
    siteIds: row.siteIds ?? row.SiteIds ?? [],
    tankIds: row.tankIds ?? row.TankIds ?? [],
    timeZone: row.timeZone ?? row.TimeZone ?? "UTC",
    requestedBy: row.requestedBy ?? row.RequestedBy ?? "-",
    recipientCount: row.recipientCount ?? row.RecipientCount ?? 0,
    deliveredCount: row.deliveredCount ?? row.DeliveredCount ?? 0,
    failedCount: row.failedCount ?? row.FailedCount ?? 0,
    pendingCount: row.pendingCount ?? row.PendingCount ?? 0,
    recipients: row.recipients ?? row.Recipients ?? [],
  };
};

export const resolveRequestedByUser = (authUser) =>
  authUser?.userName ??
  authUser?.username ??
  authUser?.name ??
  authUser?.Name ??
  "Unknown User";

const areScheduleValuesEqual = (currentValue, nextValue) => {
  if (Array.isArray(currentValue) && Array.isArray(nextValue)) {
    if (currentValue.length !== nextValue.length) return false;
    return currentValue.every((value, index) => value === nextValue[index]);
  }

  return currentValue === nextValue;
};

export const applyNoopSafeScheduleUpdates = (setState, updates) => {
  if (!updates || typeof updates !== "object") return;

  setState((prev) => {
    const updateEntries = Object.entries(updates);
    if (!updateEntries.length) return prev;

    const hasActualChange = updateEntries.some(([key, nextValue]) => {
      if (!(key in prev)) return true;
      return !areScheduleValuesEqual(prev[key], nextValue);
    });

    return hasActualChange ? { ...prev, ...updates } : prev;
  });
};
