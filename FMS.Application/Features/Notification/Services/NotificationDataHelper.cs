/**
 * File: NotificationDataHelper.cs
 * Purpose: Static utility for parsing and normalizing notification Data JSON fields,
 *          and mapping Notification entities to ScheduledReportEmailDto.
 * Dependencies: Newtonsoft.Json, FMS.Application DTOs
 * Last Modified: 2026-03-05
 *
 * Key Functions:
 * - ParseNotificationData(): Safely parses JSON string to JObject
 * - MapScheduledReportEmail(): Maps Notification entity to ScheduledReportEmailDto
 * - ParseStringList()/ParseIntList(): Extract typed lists from JToken
 * - NormalizeScheduleDays/Weeks/Time(): Validate and normalize schedule parameters
 * - ConvertToJToken(): Safely converts System.Text.Json JsonElement to Newtonsoft JToken
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using FMS.Application.Features.Notification.DTOs;

namespace FMS.Application.Features.Notification.Services
{
    /// <summary>
    /// Shared utilities for parsing, normalizing and mapping notification data JSON.
    /// </summary>
    public static class NotificationDataHelper
    {
        /// <summary>
        /// Maps a Notification entity to a ScheduledReportEmailDto.
        /// </summary>
        public static ScheduledReportEmailDto MapScheduledReportEmail(
            global::FMS.Domain.Entities.Features.Notifications.Notification notification)
        {
            var root = ParseNotificationData(notification.Data);
            var recurringSchedule = root["recurringSchedule"] as JObject;

            var recipients = notification.Recipients?
                .Select(r => new ScheduledReportRecipientDto
                {
                    UserId = r.UserId,
                    UserName = r.User?.UserName ?? r.UserId,
                    DeliveryMethod = r.DeliveryMethod,
                    RecipientAddress = r.RecipientAddress,
                    DeliveryStatus = string.IsNullOrWhiteSpace(r.DeliveryStatus) ? "Pending" : r.DeliveryStatus,
                    SentAt = r.SentAt,
                    DeliveredAt = r.DeliveredAt,
                    DeliveryError = r.DeliveryError
                })
                .ToList() ?? new List<ScheduledReportRecipientDto>();

            var deliveredCount = recipients.Count(r =>
                string.Equals(r.DeliveryStatus, "Sent", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(r.DeliveryStatus, "Delivered", StringComparison.OrdinalIgnoreCase));
            var failedCount = recipients.Count(r =>
                string.Equals(r.DeliveryStatus, "Failed", StringComparison.OrdinalIgnoreCase));
            var pendingCount = recipients.Count - deliveredCount - failedCount;

            return new ScheduledReportEmailDto
            {
                Id = notification.Id,
                NotificationId = notification.NotificationId,
                Title = notification.Title,
                Message = notification.Message,
                TriggerSource = notification.TriggerSource,
                Status = notification.Status,
                Priority = notification.Priority,
                CreatedAt = notification.CreatedAt,
                ScheduledAt = notification.ScheduledAt,
                SentAt = notification.SentAt,
                ReportType = root.Value<string>("reportType"),
                ReportTemplateName = root.Value<string>("templateName"),
                Format = root.Value<string>("format"),
                PeriodType = root.Value<string>("periodType"),
                RequestedBy = root.Value<string>("requestedBy"),
                ReportDescription = root.Value<string>("reportDescription"),
                ReportViewPath = root.Value<string>("reportViewPath"),
                ReportViewUrl = root.Value<string>("reportViewUrl"),
                SiteIds = ParseIntList(root["siteIds"]),
                TankIds = ParseIntList(root["tankIds"]),
                EffectiveStartDate = root.Value<string>("effectiveStartDate"),
                EffectiveEndDate = root.Value<string>("effectiveEndDate"),
                OffsetDays = root.Value<int?>("offsetDays") ?? root.Value<int?>("lookbackDays") ?? 1,
                WindowDays = root.Value<int?>("windowDays") ?? 1,
                SiteNames = ParseStringList(root["siteNames"], "All Sites"),
                TankNames = ParseStringList(root["tankNames"], "All Tanks"),
                Filters = root["filters"]?.ToString(Newtonsoft.Json.Formatting.None),
                TimeZone = recurringSchedule?.Value<string>("timeZone"),
                ScheduleType = recurringSchedule?.Value<string>("scheduleType"),
                ScheduleTimeOfDay = recurringSchedule?.Value<string>("timeOfDay"),
                ScheduleWeekOfMonth = recurringSchedule?.Value<string>("weekOfMonth"),
                ScheduleWeeksOfMonth = NormalizeScheduleWeeks(
                    ParseStringList(recurringSchedule?["weeksOfMonth"],
                    recurringSchedule?.Value<string>("weekOfMonth") ?? string.Empty)),
                ScheduleDaysOfWeek = ParseStringList(
                    recurringSchedule?["daysOfWeek"],
                    recurringSchedule?.Value<string>("dayOfWeek") ?? "monday"),
                NextRunAtUtc = recurringSchedule?.Value<DateTime?>("nextRunAtUtc"),
                LastProcessedAtUtc = recurringSchedule?.Value<DateTime?>("lastProcessedAtUtc"),
                RecipientCount = recipients.Count,
                DeliveredCount = deliveredCount,
                FailedCount = failedCount,
                PendingCount = pendingCount,
                Recipients = recipients
            };
        }

        /// <summary>
        /// Safely parses a JSON string into a JObject, returning empty JObject on failure.
        /// </summary>
        public static JObject ParseNotificationData(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return new JObject();
            }

            try
            {
                return JObject.Parse(dataJson);
            }
            catch
            {
                return new JObject();
            }
        }

        /// <summary>
        /// Extracts a list of strings from a JToken, with a fallback default.
        /// </summary>
        public static List<string> ParseStringList(JToken? token, string fallbackIfEmpty)
        {
            if (token is JArray arrayToken)
            {
                var values = arrayToken
                    .Select(value => value?.ToString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .Select(value => value!.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (values.Count > 0)
                {
                    return values;
                }
            }

            if (token is JValue scalarToken)
            {
                var scalarValue = scalarToken.ToString();
                if (!string.IsNullOrWhiteSpace(scalarValue))
                {
                    return scalarValue
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(value => value.Trim())
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
                }
            }

            return new List<string> { fallbackIfEmpty };
        }

        /// <summary>
        /// Extracts a list of integers from a JToken.
        /// </summary>
        public static List<int> ParseIntList(JToken? token)
        {
            if (token is JArray arrayToken && arrayToken.Count > 0)
            {
                return arrayToken
                    .Select(value => int.TryParse(value?.ToString(), out var parsed) ? parsed : 0)
                    .Where(value => value > 0)
                    .Distinct()
                    .ToList();
            }

            if (token is JValue scalarToken)
            {
                var scalarValue = scalarToken.ToString();
                if (!string.IsNullOrWhiteSpace(scalarValue))
                {
                    return scalarValue
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(value => int.TryParse(value.Trim(), out var parsed) ? parsed : 0)
                        .Where(value => value > 0)
                        .Distinct()
                        .ToList();
                }
            }

            return new List<int>();
        }

        /// <summary>
        /// Validates and normalizes day-of-week strings to lowercase canonical form.
        /// </summary>
        public static List<string> NormalizeScheduleDays(IEnumerable<string>? values)
        {
            if (values == null)
            {
                return new List<string>();
            }

            return values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim().ToLowerInvariant())
                .Where(value =>
                    value == "monday" ||
                    value == "tuesday" ||
                    value == "wednesday" ||
                    value == "thursday" ||
                    value == "friday" ||
                    value == "saturday" ||
                    value == "sunday")
                .Distinct()
                .ToList();
        }

        /// <summary>
        /// Validates and normalizes week-of-month strings to lowercase canonical form.
        /// </summary>
        public static List<string> NormalizeScheduleWeeks(IEnumerable<string>? values)
        {
            if (values == null)
            {
                return new List<string>();
            }

            return values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim().ToLowerInvariant())
                .Where(value =>
                    value == "first" ||
                    value == "second" ||
                    value == "third" ||
                    value == "fourth" ||
                    value == "last")
                .Distinct()
                .ToList();
        }

        /// <summary>
        /// Normalizes a time-of-day string to HH:mm format, defaulting to "08:00".
        /// </summary>
        public static string NormalizeScheduleTime(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "08:00";
            }

            var rawValue = value.Trim();
            if (TimeSpan.TryParse(rawValue, out var parsedTime))
            {
                var hours = Math.Max(0, Math.Min(23, parsedTime.Hours));
                var minutes = Math.Max(0, Math.Min(59, parsedTime.Minutes));
                return $"{hours:D2}:{minutes:D2}";
            }

            return "08:00";
        }

        /// <summary>
        /// Ensures a DateTime is in UTC kind.
        /// </summary>
        public static DateTime NormalizeToUtc(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }

            if (value.Kind == DateTimeKind.Local)
            {
                return value.ToUniversalTime();
            }

            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        /// <summary>
        /// Safely converts a System.Text.Json JsonElement (from ASP.NET model binding)
        /// to a Newtonsoft.Json JToken by re-parsing the raw JSON text.
        /// </summary>
        public static JToken ConvertToJToken(object value)
        {
            if (value is JsonElement jsonElement)
            {
                try
                {
                    return JToken.Parse(jsonElement.GetRawText());
                }
                catch
                {
                    return JValue.CreateNull();
                }
            }

            return JToken.FromObject(value);
        }
    }
}
