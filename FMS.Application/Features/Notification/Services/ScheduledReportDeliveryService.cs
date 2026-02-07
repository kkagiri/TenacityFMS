/**
 * File: ScheduledReportDeliveryService.cs
 * Purpose: Generates and formats scheduled report output (HTML/PDF/Excel) for notification email delivery.
 * Dependencies: IMediator, GpsdataContext, INotificationReportRenderer, TankVolumeHistory queries
 * Last Modified: 2026-02-07
 *
 * Key Functions:
 * - BuildEmailPayloadAsync: Builds runtime report payload for scheduled notification email delivery.
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.TankManagement.TankVolumeHistory.Queries;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.Notifications;
using NotificationEntity = FMS.Domain.Entities.Features.Notifications.Notification;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Services
{
    public class ScheduledReportDeliveryService : IScheduledReportDeliveryService
    {
        private const string TransactionVolumeHistoryReportType = "TransactionVolumeHistory";
        private const string DefaultTemplateName = "transaction-volume-history-report";
        private const int MaxAttachmentBytes = 7 * 1024 * 1024;

        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly INotificationReportRenderer _reportRenderer;
        private readonly ILogger<ScheduledReportDeliveryService> _logger;

        public ScheduledReportDeliveryService(
            IMediator mediator,
            GpsdataContext context,
            INotificationReportRenderer reportRenderer,
            ILogger<ScheduledReportDeliveryService> logger)
        {
            _mediator = mediator;
            _context = context;
            _reportRenderer = reportRenderer;
            _logger = logger;
        }

        public async Task<ScheduledReportEmailPayload?> BuildEmailPayloadAsync(
            NotificationEntity notification,
            CancellationToken cancellationToken = default)
        {
            if (notification == null || string.IsNullOrWhiteSpace(notification.Data))
            {
                return null;
            }

            JObject metadata;
            try
            {
                metadata = JObject.Parse(notification.Data);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Skipping scheduled report payload build: invalid metadata JSON");
                return null;
            }

            var reportType = metadata.Value<string>("reportType");
            if (!string.Equals(reportType, TransactionVolumeHistoryReportType, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var templateName = metadata.Value<string>("templateName");
            if (string.IsNullOrWhiteSpace(templateName))
            {
                templateName = DefaultTemplateName;
            }

            var format = NormalizeFormat(metadata.Value<string>("format"));
            var (windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, timezoneId) =
                ResolveExecutionWindow(notification, metadata);

            var siteIds = ParseIdSet(metadata["siteIds"]);
            var tankIds = ParseIdSet(metadata["tankIds"]);
            var siteNames = ParseStringList(metadata["siteNames"]);

            var historyResult = await _mediator.Send(
                new GetTankVolumeHistoryFilteredQuery
                {
                    StartDate = windowStartUtc,
                    EndDate = windowEndUtc,
                    IncludeVehicleNames = true,
                    UseManualDispensing = metadata.Value<bool?>("useManualDispensing") ?? false,
                    IncludeGpsData = metadata.Value<bool?>("includeGpsData") ?? false
                },
                cancellationToken);

            if (!historyResult.IsSuccess || historyResult.Data == null)
            {
                _logger.LogWarning(
                    "Failed to fetch tank volume history for scheduled report {NotificationId}: {Message}",
                    notification.NotificationId,
                    historyResult.Message);
                return BuildFallbackPayload(notification, metadata, format, windowStartLocal, windowEndLocal);
            }

            var filteredRows = historyResult.Data.AsEnumerable();
            if (siteIds.Count > 0)
            {
                filteredRows = filteredRows.Where(row => row.SiteId.HasValue && siteIds.Contains(row.SiteId.Value));
            }
            if (tankIds.Count > 0)
            {
                filteredRows = filteredRows.Where(row => row.TankId.HasValue && tankIds.Contains(row.TankId.Value));
            }

            var rows = filteredRows.ToList();
            var resolvedTankIds = rows
                .Where(row => row.TankId.HasValue)
                .Select(row => row.TankId!.Value)
                .Distinct()
                .ToList();

            var tankNameLookup = resolvedTankIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Tanks
                    .AsNoTracking()
                    .Where(tank => resolvedTankIds.Contains(tank.Id))
                    .ToDictionaryAsync(tank => tank.Id, tank => tank.Name ?? $"Tank {tank.Id}", cancellationToken);

            var reportData = BuildTransactionVolumeHistoryReportData(
                rows,
                tankNameLookup,
                notification,
                metadata,
                windowStartLocal,
                windowEndLocal,
                siteNames,
                timezoneId);

            if (format == "html")
            {
                var htmlReport = await _reportRenderer.RenderHtmlAsync(templateName, reportData);
                return new ScheduledReportEmailPayload
                {
                    Subject = notification.Title,
                    Body = htmlReport,
                    IsHtml = true
                };
            }

            var contentType = format == "excel"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/pdf";
            var extension = format == "excel" ? "xlsx" : "pdf";
            byte[] reportBytes;
            try
            {
                reportBytes = format == "excel"
                    ? await _reportRenderer.RenderExcelAsync(templateName, reportData)
                    : await _reportRenderer.RenderPdfAsync(templateName, reportData);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Scheduled report render failed for notification {NotificationId} template {TemplateName} format {Format}",
                    notification.NotificationId,
                    templateName,
                    format);
                return BuildFallbackPayload(notification, metadata, format, windowStartLocal, windowEndLocal);
            }

            var fileName = BuildAttachmentFileName(windowStartLocal, windowEndLocal, extension);
            var payloadBody = BuildDeliveryBody(notification, metadata, format, windowStartLocal, windowEndLocal);

            var payload = new ScheduledReportEmailPayload
            {
                Subject = notification.Title,
                Body = payloadBody,
                IsHtml = true
            };

            if (reportBytes.Length > 0 && reportBytes.Length <= MaxAttachmentBytes)
            {
                payload.Attachments.Add(new EmailAttachmentDto
                {
                    FileName = fileName,
                    ContentType = contentType,
                    Content = reportBytes
                });
                payload.Body += "<p><strong>Attachment:</strong> Included in this email.</p>";
                return payload;
            }

            var attachmentMessage = reportBytes.Length > MaxAttachmentBytes
                ? "<p><strong>Note:</strong> Attachment size exceeded limit, use the report link to download.</p>"
                : "<p><strong>Note:</strong> Report attachment could not be generated. Use the report link below.</p>";
            payload.Body = $"{payload.Body}{attachmentMessage}";

            return payload;
        }

        private static ScheduledReportEmailPayload BuildFallbackPayload(
            NotificationEntity notification,
            JObject metadata,
            string format,
            DateTime windowStartLocal,
            DateTime windowEndLocal)
        {
            var formatLabel = format == "excel" ? "Excel" : format == "pdf" ? "PDF" : "HTML";
            var body = BuildDeliveryBody(notification, metadata, format, windowStartLocal, windowEndLocal);
            body += $"<p><strong>Runtime report generation failed.</strong> Requested format: {formatLabel}.</p>";

            return new ScheduledReportEmailPayload
            {
                Subject = notification.Title,
                Body = body,
                IsHtml = true
            };
        }

        private static object BuildTransactionVolumeHistoryReportData(
            IReadOnlyCollection<TankVolumeHistoryDTO> rows,
            IReadOnlyDictionary<int, string> tankNameLookup,
            NotificationEntity notification,
            JObject metadata,
            DateTime windowStartLocal,
            DateTime windowEndLocal,
            List<string> siteNames,
            string timezoneId)
        {
            var groupedRows = rows
                .Where(row => row.TankId.HasValue)
                .GroupBy(row => row.TankId!.Value)
                .Select(group =>
                {
                    var ordered = group.OrderBy(item => item.Timestamp).ToList();
                    var opening = ordered.FirstOrDefault();
                    var closing = ordered.LastOrDefault();
                    var tankName = tankNameLookup.TryGetValue(group.Key, out var resolvedName)
                        ? resolvedName
                        : $"Tank {group.Key}";

                    return new
                    {
                        tankId = group.Key,
                        tankName,
                        openingVolume = FormatDecimal(opening?.NewVolume),
                        openingTimestamp = FormatTimestamp(opening?.Timestamp, timezoneId),
                        closingVolume = FormatDecimal(closing?.NewVolume),
                        closingTimestamp = FormatTimestamp(closing?.Timestamp, timezoneId),
                        totalTransactions = ordered.Count,
                        transactions = ordered.Select((item, index) => new
                        {
                            index = index + 1,
                            timestamp = FormatTimestamp(item.Timestamp, timezoneId),
                            changeReason = FormatChangeReason(item.ChangeReason),
                            volumeChange = FormatDecimal(item.VolumeChange),
                            newVolume = FormatDecimal(item.NewVolume),
                            vehicleName = Sanitize(item.VehicleName, "N/A"),
                            recordedBy = Sanitize(item.RecordedByUserName, "Unknown")
                        }).ToList()
                    };
                })
                .OrderBy(entry => entry.tankName)
                .ToList();

            return new
            {
                reportTitle = metadata.Value<string>("reportName") ?? notification.Title ?? "Transaction Volume History Report",
                generatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = metadata.Value<string>("requestedBy") ?? notification.TriggeredBy ?? "System",
                dateRange = FormatDateRange(windowStartLocal, windowEndLocal),
                siteName = ResolveSiteDisplay(siteNames),
                totalTransactions = rows.Count,
                tankReports = groupedRows
            };
        }

        private static (DateTime startUtc, DateTime endUtc, DateTime startLocal, DateTime endLocal, string timeZoneId)
            ResolveExecutionWindow(NotificationEntity notification, JObject metadata)
        {
            var recurringSchedule = metadata["recurringSchedule"] as JObject;
            var timeZoneId = recurringSchedule?.Value<string>("timeZone")
                ?? metadata.Value<string>("timeZone")
                ?? "UTC";
            var timezone = ResolveTimeZoneInfo(timeZoneId);

            var runAtUtc = notification.ScheduledAt?.ToUniversalTime() ?? DateTime.UtcNow;
            var runAtLocal = TimeZoneInfo.ConvertTimeFromUtc(runAtUtc, timezone);

            var periodType = metadata.Value<string>("periodType")?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(periodType))
            {
                periodType = recurringSchedule?.Value<string>("scheduleType")?.Trim().ToLowerInvariant();
            }

            if (periodType == "monthly")
            {
                var monthStartLocal = new DateTime(runAtLocal.Year, runAtLocal.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
                var monthEndLocal = monthStartLocal.AddMonths(1).AddTicks(-1);
                return (
                    TimeZoneInfo.ConvertTimeToUtc(monthStartLocal, timezone),
                    TimeZoneInfo.ConvertTimeToUtc(monthEndLocal, timezone),
                    monthStartLocal,
                    monthEndLocal,
                    timeZoneId);
            }

            var dayLocal = runAtLocal.Date.AddDays(-1);
            var dayStartLocal = new DateTime(dayLocal.Year, dayLocal.Month, dayLocal.Day, 0, 0, 0, DateTimeKind.Unspecified);
            var dayEndLocal = dayStartLocal.AddDays(1).AddTicks(-1);
            return (
                TimeZoneInfo.ConvertTimeToUtc(dayStartLocal, timezone),
                TimeZoneInfo.ConvertTimeToUtc(dayEndLocal, timezone),
                dayStartLocal,
                dayEndLocal,
                timeZoneId);
        }

        private static HashSet<int> ParseIdSet(JToken? token)
        {
            var results = new HashSet<int>();
            if (token == null)
            {
                return results;
            }

            if (token is JArray arrayToken)
            {
                foreach (var value in arrayToken)
                {
                    if (int.TryParse(value?.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed > 0)
                    {
                        results.Add(parsed);
                    }
                }
                return results;
            }

            var raw = token.ToString();
            if (string.IsNullOrWhiteSpace(raw))
            {
                return results;
            }

            foreach (var piece in raw.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                if (int.TryParse(piece.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) && parsed > 0)
                {
                    results.Add(parsed);
                }
            }

            return results;
        }

        private static List<string> ParseStringList(JToken? token)
        {
            if (token is JArray arrayToken)
            {
                return arrayToken
                    .Select(item => item?.ToString()?.Trim())
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()!;
            }

            if (token == null)
            {
                return new List<string>();
            }

            return token
                .ToString()
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(value => value.Trim())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string BuildAttachmentFileName(DateTime startLocal, DateTime endLocal, string extension)
        {
            var startText = startLocal.ToString("yyyy-MM-dd");
            var endText = endLocal.ToString("yyyy-MM-dd");
            return $"TransactionVolumeHistory_{startText}_to_{endText}.{extension}";
        }

        private static string BuildDeliveryBody(
            NotificationEntity notification,
            JObject metadata,
            string format,
            DateTime windowStartLocal,
            DateTime windowEndLocal)
        {
            var formatLabel = format == "excel" ? "Excel" : format == "html" ? "HTML" : "PDF";
            var title = metadata.Value<string>("reportName")
                ?? notification.Title
                ?? "Scheduled Report";
            var description = metadata.Value<string>("reportDescription");
            var reportLink = ResolveReportLink(metadata);

            var body = $"<p>Your scheduled report <strong>{title}</strong> is ready.</p>" +
                $"<p>Report window: {windowStartLocal:yyyy-MM-dd} to {windowEndLocal:yyyy-MM-dd}</p>" +
                $"<p>Requested format: {formatLabel}</p>";

            if (!string.IsNullOrWhiteSpace(description))
            {
                body += $"<p>{description.Trim()}</p>";
            }

            if (!string.IsNullOrWhiteSpace(reportLink))
            {
                body += $"<p><a href=\"{reportLink}\">Click here to view the report</a></p>";
            }

            return body;
        }

        private static string? ResolveReportLink(JObject metadata)
        {
            var reportLink = metadata.Value<string>("reportViewUrl")
                ?? metadata.Value<string>("reportViewPath");
            return string.IsNullOrWhiteSpace(reportLink) ? null : reportLink.Trim();
        }

        private static string NormalizeFormat(string? rawFormat)
        {
            var normalized = rawFormat?.Trim().ToLowerInvariant();
            if (normalized == "excel" || normalized == "html")
            {
                return normalized;
            }

            return "pdf";
        }

        private static string ResolveSiteDisplay(IReadOnlyCollection<string> siteNames)
        {
            if (siteNames == null || siteNames.Count == 0)
            {
                return "All Sites";
            }

            if (siteNames.Count == 1)
            {
                return siteNames.First();
            }

            return $"Multiple Sites ({siteNames.Count})";
        }

        private static string FormatDateRange(DateTime startLocal, DateTime endLocal)
        {
            var startText = startLocal.ToString("yyyy-MM-dd");
            var endText = endLocal.ToString("yyyy-MM-dd");
            return startText == endText ? startText : $"{startText} - {endText}";
        }

        private static string FormatTimestamp(DateTime? timestamp, string timezoneId)
        {
            if (!timestamp.HasValue)
            {
                return "-";
            }

            var timezone = ResolveTimeZoneInfo(timezoneId);
            var utc = timestamp.Value.Kind == DateTimeKind.Utc
                ? timestamp.Value
                : timestamp.Value.ToUniversalTime();
            var local = TimeZoneInfo.ConvertTimeFromUtc(utc, timezone);
            return local.ToString("yyyy-MM-dd HH:mm:ss");
        }

        private static string FormatDecimal(decimal? value)
        {
            if (!value.HasValue)
            {
                return "-";
            }

            return value.Value.ToString("#,##0.00", CultureInfo.InvariantCulture);
        }

        private static string FormatChangeReason(VolumeChangeReasonEnum reason)
        {
            return reason.ToString();
        }

        private static string Sanitize(string? value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private static TimeZoneInfo ResolveTimeZoneInfo(string? timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                return TimeZoneInfo.Utc;
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch
            {
                return TimeZoneInfo.Utc;
            }
        }
    }
}
