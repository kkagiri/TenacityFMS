/**
 * File: NotificationService.RecurringSchedule.cs
 * Purpose: Encapsulates recurring schedule parsing, recurrence computation, and
 *          notification re-arming logic used by NotificationService.
 * Dependencies: GpsdataContext, ILogger, Newtonsoft.Json, Entity Framework Core
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - TryRescheduleRecurringNotificationAsync(): Re-arms a processed recurring notification
 * - TryResolveNextRecurringRunUtc(): Computes the next UTC execution time from stored schedule data
 * - TryParseRecurringScheduleData(): Parses recurring schedule metadata from notification JSON
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Services
{
    public partial class NotificationService
    {
        private bool HasRecurringSchedule(string? dataJson)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return false;
            }

            try
            {
                var root = JObject.Parse(dataJson);
                var recurringSchedule = root["recurringSchedule"] as JObject;
                return recurringSchedule?.Value<bool?>("enabled") == true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> TryRescheduleRecurringNotificationAsync(
            int notificationId,
            string notificationPublicId,
            string? dataJson,
            DateTime referenceUtc,
            string? lastDeliveryError,
            CancellationToken cancellationToken)
        {
            if (!TryResolveNextRecurringRunUtc(dataJson, referenceUtc, out var nextRunUtc, out var parseError))
            {
                _logger.LogWarning(
                    "Recurring schedule parse failed for notification {NotificationId}: {ParseError}",
                    notificationPublicId,
                    parseError ?? "Unknown parse error");
                return false;
            }

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId, cancellationToken);

            if (notification == null)
            {
                _logger.LogWarning("Cannot re-arm recurring notification {NotificationId}; record not found", notificationPublicId);
                return false;
            }

            notification.Status = "Scheduled";
            notification.ScheduledAt = nextRunUtc;
            notification.ErrorMessage = string.IsNullOrWhiteSpace(lastDeliveryError) ? null : lastDeliveryError;
            notification.Data = UpdateRecurringScheduleData(dataJson, nextRunUtc, referenceUtc);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Recurring notification {NotificationId} re-armed for next run at {NextRunUtc}",
                notificationPublicId,
                nextRunUtc);

            return true;
        }

        private bool TryResolveNextRecurringRunUtc(
            string? dataJson,
            DateTime referenceUtc,
            out DateTime nextRunUtc,
            out string? parseError)
        {
            nextRunUtc = default;
            parseError = null;

            if (!TryParseRecurringScheduleData(
                    dataJson,
                    out var scheduleType,
                    out var dayOfWeeks,
                    out var weekOfMonthOrdinals,
                    out var dayOfMonth,
                    out var timeOfDay,
                    out var timeZoneId,
                    out parseError))
            {
                return false;
            }

            if (string.Equals(scheduleType, "monthly", StringComparison.OrdinalIgnoreCase))
            {
                if (dayOfMonth.HasValue)
                {
                    var domRunUtc = ComputeNextDayOfMonthRunUtc(
                        dayOfMonth.Value,
                        timeOfDay,
                        timeZoneId,
                        referenceUtc);

                    if (!domRunUtc.HasValue)
                    {
                        parseError = "Could not compute next monthly (day-of-month) run date";
                        return false;
                    }

                    nextRunUtc = domRunUtc.Value;
                    return true;
                }

                var monthlyRunUtc = ComputeNextMonthlyRunUtc(
                    dayOfWeeks,
                    weekOfMonthOrdinals,
                    timeOfDay,
                    timeZoneId,
                    referenceUtc);

                if (!monthlyRunUtc.HasValue)
                {
                    parseError = "Could not compute next monthly run date for schedule";
                    return false;
                }

                nextRunUtc = monthlyRunUtc.Value;
                return true;
            }

            if (string.Equals(scheduleType, "daily", StringComparison.OrdinalIgnoreCase))
            {
                nextRunUtc = ComputeNextDailyRunUtc(timeOfDay, timeZoneId, referenceUtc);
                return true;
            }

            nextRunUtc = ComputeNextWeeklyRunUtc(
                dayOfWeeks,
                timeOfDay,
                timeZoneId,
                referenceUtc);

            return true;
        }

        private bool TryParseRecurringScheduleData(
            string? dataJson,
            out string scheduleType,
            out IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            out IReadOnlyCollection<int> weekOfMonthOrdinals,
            out int? dayOfMonth,
            out TimeSpan timeOfDay,
            out string? timeZoneId,
            out string? parseError)
        {
            scheduleType = "weekly";
            dayOfWeeks = new List<DayOfWeek> { DayOfWeek.Monday };
            weekOfMonthOrdinals = new List<int> { 1 };
            dayOfMonth = null;
            timeOfDay = TimeSpan.FromHours(8);
            timeZoneId = "UTC";
            parseError = null;

            if (string.IsNullOrWhiteSpace(dataJson))
            {
                parseError = "Notification data payload is empty";
                return false;
            }

            try
            {
                var root = JObject.Parse(dataJson);
                var recurringSchedule = root["recurringSchedule"] as JObject;

                if (recurringSchedule == null || recurringSchedule.Value<bool?>("enabled") != true)
                {
                    parseError = "Recurring schedule is missing or disabled";
                    return false;
                }

                var scheduleTypeValue = recurringSchedule.Value<string>("scheduleType");
                if (!string.IsNullOrWhiteSpace(scheduleTypeValue))
                {
                    scheduleType = scheduleTypeValue.Trim().ToLowerInvariant();
                }

                var timeValue = recurringSchedule.Value<string>("timeOfDay");
                if (!TryParseTimeOfDayValue(timeValue, out timeOfDay))
                {
                    parseError = $"Invalid recurring timeOfDay value '{timeValue}'";
                    return false;
                }

                timeZoneId = recurringSchedule.Value<string>("timeZone");

                if (string.Equals(scheduleType, "monthly", StringComparison.OrdinalIgnoreCase))
                {
                    var domToken = recurringSchedule["dayOfMonth"];
                    if (domToken != null)
                    {
                        var domValue = domToken.Value<int?>();
                        if (domValue.HasValue && domValue.Value >= 1 && domValue.Value <= 31)
                        {
                            dayOfMonth = domValue.Value;
                            return true;
                        }
                    }

                    if (!TryParseDayOfWeekValues(recurringSchedule, out dayOfWeeks, out parseError))
                    {
                        return false;
                    }

                    if (!TryParseWeekOfMonthValues(recurringSchedule, out weekOfMonthOrdinals, out parseError))
                    {
                        return false;
                    }

                    return true;
                }

                if (!TryParseDayOfWeekValues(recurringSchedule, out dayOfWeeks, out parseError))
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                parseError = $"Recurring schedule JSON parsing failed: {ex.Message}";
                return false;
            }
        }

        private bool TryParseDayOfWeekValues(
            JObject recurringSchedule,
            out IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            out string? parseError)
        {
            var parsedDays = new List<DayOfWeek>();
            parseError = null;

            if (recurringSchedule["daysOfWeek"] is JArray dayArray && dayArray.Count > 0)
            {
                foreach (var dayToken in dayArray)
                {
                    var rawDayValue = dayToken?.ToString();
                    if (!TryParseDayOfWeekValue(rawDayValue, out var parsedDay))
                    {
                        parseError = $"Invalid recurring daysOfWeek value '{rawDayValue}'";
                        dayOfWeeks = Array.Empty<DayOfWeek>();
                        return false;
                    }

                    parsedDays.Add(parsedDay);
                }
            }
            else
            {
                var dayValue = recurringSchedule.Value<string>("dayOfWeek");
                if (!TryParseDayOfWeekValue(dayValue, out var parsedDay))
                {
                    parseError = $"Invalid recurring dayOfWeek value '{dayValue}'";
                    dayOfWeeks = Array.Empty<DayOfWeek>();
                    return false;
                }

                parsedDays.Add(parsedDay);
            }

            dayOfWeeks = parsedDays
                .Distinct()
                .ToList();

            if (!dayOfWeeks.Any())
            {
                parseError = "Recurring schedule requires at least one day of week";
                return false;
            }

            return true;
        }

        private bool TryParseWeekOfMonthValues(
            JObject recurringSchedule,
            out IReadOnlyCollection<int> weekOfMonthOrdinals,
            out string? parseError)
        {
            var parsedWeeks = new List<int>();
            parseError = null;

            if (recurringSchedule["weeksOfMonth"] is JArray weekArray && weekArray.Count > 0)
            {
                foreach (var weekToken in weekArray)
                {
                    var rawWeekValue = weekToken?.ToString();
                    var parsedWeek = ParseWeekOfMonthOrdinal(rawWeekValue);
                    if (!parsedWeek.HasValue)
                    {
                        parseError = $"Invalid recurring weeksOfMonth value '{rawWeekValue}'";
                        weekOfMonthOrdinals = Array.Empty<int>();
                        return false;
                    }

                    parsedWeeks.Add(parsedWeek.Value);
                }
            }
            else
            {
                var weekValue = recurringSchedule.Value<string>("weekOfMonth");
                var parsedWeek = ParseWeekOfMonthOrdinal(weekValue);
                if (!parsedWeek.HasValue)
                {
                    parseError = $"Invalid recurring weekOfMonth value '{weekValue}'";
                    weekOfMonthOrdinals = Array.Empty<int>();
                    return false;
                }

                parsedWeeks.Add(parsedWeek.Value);
            }

            weekOfMonthOrdinals = parsedWeeks
                .Distinct()
                .ToList();

            if (!weekOfMonthOrdinals.Any())
            {
                parseError = "Recurring schedule requires at least one week of month selector";
                return false;
            }

            return true;
        }

        private bool TryParseDayOfWeekValue(string? rawValue, out DayOfWeek dayOfWeek)
        {
            dayOfWeek = DayOfWeek.Monday;
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return false;
            }

            if (int.TryParse(rawValue.Trim(), out var numericValue) &&
                numericValue >= 0 &&
                numericValue <= 6)
            {
                return SetDayOfWeek((DayOfWeek)numericValue, out dayOfWeek);
            }

            return rawValue.Trim().ToLowerInvariant() switch
            {
                "monday" or "mon" => SetDayOfWeek(DayOfWeek.Monday, out dayOfWeek),
                "tuesday" or "tue" or "tues" => SetDayOfWeek(DayOfWeek.Tuesday, out dayOfWeek),
                "wednesday" or "wed" => SetDayOfWeek(DayOfWeek.Wednesday, out dayOfWeek),
                "thursday" or "thu" or "thurs" => SetDayOfWeek(DayOfWeek.Thursday, out dayOfWeek),
                "friday" or "fri" => SetDayOfWeek(DayOfWeek.Friday, out dayOfWeek),
                "saturday" or "sat" => SetDayOfWeek(DayOfWeek.Saturday, out dayOfWeek),
                "sunday" or "sun" => SetDayOfWeek(DayOfWeek.Sunday, out dayOfWeek),
                _ => false,
            };
        }

        private static bool SetDayOfWeek(DayOfWeek value, out DayOfWeek dayOfWeek)
        {
            dayOfWeek = value;
            return true;
        }

        private int? ParseWeekOfMonthOrdinal(string? rawValue)
        {
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return null;
            }

            return rawValue.Trim().ToLowerInvariant() switch
            {
                "first" or "1st" or "1" => 1,
                "second" or "2nd" or "2" => 2,
                "third" or "3rd" or "3" => 3,
                "fourth" or "4th" or "4" => 4,
                "last" => -1,
                _ => null,
            };
        }

        private bool TryParseTimeOfDayValue(string? rawValue, out TimeSpan timeOfDay)
        {
            timeOfDay = default;
            if (string.IsNullOrWhiteSpace(rawValue))
            {
                return false;
            }

            if (TimeSpan.TryParse(rawValue, out timeOfDay))
            {
                return timeOfDay >= TimeSpan.Zero && timeOfDay < TimeSpan.FromDays(1);
            }

            var parts = rawValue.Split(':', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2)
            {
                return false;
            }

            if (!int.TryParse(parts[0], out var hours) || !int.TryParse(parts[1], out var minutes))
            {
                return false;
            }

            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59)
            {
                return false;
            }

            timeOfDay = new TimeSpan(hours, minutes, 0);
            return true;
        }

        private TimeZoneInfo ResolveTimeZoneInfo(string? timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                return TimeZoneInfo.Utc;
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                _logger.LogWarning("Time zone '{TimeZoneId}' not found. Falling back to UTC.", timeZoneId);
                return TimeZoneInfo.Utc;
            }
            catch (InvalidTimeZoneException)
            {
                _logger.LogWarning("Time zone '{TimeZoneId}' is invalid. Falling back to UTC.", timeZoneId);
                return TimeZoneInfo.Utc;
            }
        }

        private DateTime ComputeNextDailyRunUtc(
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            var candidateLocal = localNow.Date.Add(timeOfDay);
            if (candidateLocal <= localNow)
            {
                candidateLocal = candidateLocal.AddDays(1);
            }

            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
                timezone);
        }

        private DateTime ComputeNextWeeklyRunUtc(
            DayOfWeek dayOfWeek,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            var candidateLocal = localNow.Date.Add(timeOfDay);
            var daysUntilTarget = ((int)dayOfWeek - (int)candidateLocal.DayOfWeek + 7) % 7;
            candidateLocal = candidateLocal.AddDays(daysUntilTarget);

            if (candidateLocal <= localNow)
            {
                candidateLocal = candidateLocal.AddDays(7);
            }

            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
                timezone);
        }

        private DateTime ComputeNextWeeklyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var candidates = dayOfWeeks
                .Distinct()
                .Select(dayOfWeek => ComputeNextWeeklyRunUtc(dayOfWeek, timeOfDay, timeZoneId, referenceUtc))
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any()
                ? candidates[0]
                : ComputeNextWeeklyRunUtc(DayOfWeek.Monday, timeOfDay, timeZoneId, referenceUtc);
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            DayOfWeek dayOfWeek,
            int weekOfMonthOrdinal,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            var candidateDate = GetNthWeekdayOfMonth(localNow.Year, localNow.Month, dayOfWeek, weekOfMonthOrdinal);
            if (!candidateDate.HasValue)
            {
                return null;
            }

            var candidateLocal = candidateDate.Value.Date.Add(timeOfDay);
            if (candidateLocal <= localNow)
            {
                var nextMonth = new DateTime(localNow.Year, localNow.Month, 1).AddMonths(1);
                candidateDate = GetNthWeekdayOfMonth(nextMonth.Year, nextMonth.Month, dayOfWeek, weekOfMonthOrdinal);
                if (!candidateDate.HasValue)
                {
                    return null;
                }

                candidateLocal = candidateDate.Value.Date.Add(timeOfDay);
            }

            return TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(candidateLocal, DateTimeKind.Unspecified),
                timezone);
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            IReadOnlyCollection<int> weekOfMonthOrdinals,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var safeWeekOrdinals = (weekOfMonthOrdinals ?? Array.Empty<int>())
                .Where(value => value == -1 || (value >= 1 && value <= 4))
                .Distinct()
                .ToList();
            if (!safeWeekOrdinals.Any())
            {
                safeWeekOrdinals.Add(1);
            }

            var candidates = safeWeekOrdinals
                .SelectMany(weekOfMonthOrdinal =>
                    dayOfWeeks
                        .Distinct()
                        .Select(dayOfWeek => ComputeNextMonthlyRunUtc(
                            dayOfWeek,
                            weekOfMonthOrdinal,
                            timeOfDay,
                            timeZoneId,
                            referenceUtc)))
                .Where(candidate => candidate.HasValue)
                .Select(candidate => candidate.GetValueOrDefault())
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any() ? candidates[0] : null;
        }

        private DateTime? ComputeNextMonthlyRunUtc(
            IReadOnlyCollection<DayOfWeek> dayOfWeeks,
            int weekOfMonthOrdinal,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var candidates = dayOfWeeks
                .Distinct()
                .Select(dayOfWeek => ComputeNextMonthlyRunUtc(
                    dayOfWeek,
                    weekOfMonthOrdinal,
                    timeOfDay,
                    timeZoneId,
                    referenceUtc))
                .Where(candidate => candidate.HasValue)
                .Select(candidate => candidate.GetValueOrDefault())
                .OrderBy(candidate => candidate)
                .ToList();

            return candidates.Any() ? candidates[0] : null;
        }

        private DateTime? ComputeNextDayOfMonthRunUtc(
            int dayOfMonth,
            TimeSpan timeOfDay,
            string? timeZoneId,
            DateTime referenceUtc)
        {
            var timezone = ResolveTimeZoneInfo(timeZoneId);
            var localNow = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, timezone);

            for (var offset = 0; offset < 13; offset++)
            {
                var candidateBase = new DateTime(localNow.Year, localNow.Month, 1).AddMonths(offset);
                var daysInMonth = DateTime.DaysInMonth(candidateBase.Year, candidateBase.Month);
                var clampedDay = Math.Min(dayOfMonth, daysInMonth);

                var candidateLocal = new DateTime(
                    candidateBase.Year,
                    candidateBase.Month,
                    clampedDay,
                    timeOfDay.Hours,
                    timeOfDay.Minutes,
                    0,
                    DateTimeKind.Unspecified);

                var candidateUtc = TimeZoneInfo.ConvertTimeToUtc(candidateLocal, timezone);
                if (candidateUtc > referenceUtc)
                {
                    return candidateUtc;
                }
            }

            return null;
        }

        private DateTime? GetNthWeekdayOfMonth(int year, int month, DayOfWeek dayOfWeek, int weekOfMonthOrdinal)
        {
            if (weekOfMonthOrdinal == -1)
            {
                var lastDay = new DateTime(year, month, DateTime.DaysInMonth(year, month));
                while (lastDay.DayOfWeek != dayOfWeek)
                {
                    lastDay = lastDay.AddDays(-1);
                }

                return lastDay;
            }

            if (weekOfMonthOrdinal < 1 || weekOfMonthOrdinal > 4)
            {
                return null;
            }

            var firstDay = new DateTime(year, month, 1);
            var offset = ((int)dayOfWeek - (int)firstDay.DayOfWeek + 7) % 7;
            var candidate = firstDay.AddDays(offset + (weekOfMonthOrdinal - 1) * 7);

            if (candidate.Month != month)
            {
                return null;
            }

            return candidate;
        }

        private string? UpdateRecurringScheduleData(string? dataJson, DateTime nextRunUtc, DateTime processedAtUtc)
        {
            if (string.IsNullOrWhiteSpace(dataJson))
            {
                return dataJson;
            }

            try
            {
                var root = JObject.Parse(dataJson);
                if (root["recurringSchedule"] is not JObject recurringSchedule)
                {
                    return dataJson;
                }

                recurringSchedule["nextRunAtUtc"] = nextRunUtc.ToString("o");
                recurringSchedule["lastProcessedAtUtc"] = processedAtUtc.ToString("o");
                root["recurringSchedule"] = recurringSchedule;
                return root.ToString(Formatting.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update recurring schedule metadata in notification data payload");
                return dataJson;
            }
        }
    }
}