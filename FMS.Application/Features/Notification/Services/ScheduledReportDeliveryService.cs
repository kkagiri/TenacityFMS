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
using FMS.Application.Features.TankManagement.TankVolumeHistory.Services;
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
        private const string TransactionVolumeHistoryReportTypeKebab = "tank-volume-history";
        private const string TransactionHistorySummaryReportType = "TransactionHistorySummary";
        private const string TransactionHistorySummaryReportTypeKebab = "transaction-history-summary";
        private const string DefaultTemplateName = "tank-volume-history-report";
        private const string DefaultSummaryTemplateName = "transaction-history-summary-report";
        private const int MaxAttachmentBytes = 7 * 1024 * 1024;

        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly INotificationReportRenderer _reportRenderer;
        private readonly ILogger<ScheduledReportDeliveryService> _logger;
        private readonly ScheduledReportPayloadBuilder _payloadBuilder;
        private readonly ITankVolumeReportDataBuilder _dataBuilder;

        public ScheduledReportDeliveryService(
            IMediator mediator,
            GpsdataContext context,
            INotificationReportRenderer reportRenderer,
            ILogger<ScheduledReportDeliveryService> logger,
            ScheduledReportPayloadBuilder payloadBuilder,
            ITankVolumeReportDataBuilder dataBuilder)
        {
            _mediator = mediator;
            _context = context;
            _reportRenderer = reportRenderer;
            _logger = logger;
            _payloadBuilder = payloadBuilder;
            _dataBuilder = dataBuilder;
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
            var sourceId = metadata.Value<string>("sourceId");
            var isSummaryReport = string.Equals(reportType, TransactionHistorySummaryReportType, StringComparison.OrdinalIgnoreCase)
                || string.Equals(reportType, TransactionHistorySummaryReportTypeKebab, StringComparison.OrdinalIgnoreCase)
                || string.Equals(sourceId, TransactionHistorySummaryReportTypeKebab, StringComparison.OrdinalIgnoreCase);
            var isVolumeHistoryReport = string.Equals(reportType, TransactionVolumeHistoryReportType, StringComparison.OrdinalIgnoreCase)
                || string.Equals(reportType, TransactionVolumeHistoryReportTypeKebab, StringComparison.OrdinalIgnoreCase)
                || string.Equals(sourceId, TransactionVolumeHistoryReportTypeKebab, StringComparison.OrdinalIgnoreCase);

            var templateName = metadata.Value<string>("templateName");
            var format = NormalizeFormat(metadata.Value<string>("format"));
            var (windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, timezoneId) =
                ResolveExecutionWindow(notification, metadata);

            // ── Generic path: delegate to ScheduledReportPayloadBuilder for other report types ──
            if (!isVolumeHistoryReport && !isSummaryReport)
            {
                var resolvedSourceId = ScheduledReportPayloadBuilder.ResolveSourceId(metadata);
                if (resolvedSourceId == null || !ScheduledReportPayloadBuilder.CanHandle(resolvedSourceId))
                {
                    _logger.LogWarning(
                        "Unsupported report type '{ReportType}' / sourceId '{SourceId}' for scheduled report {NotificationId}",
                        reportType, resolvedSourceId, notification.NotificationId);
                    return null;
                }

                var resolvedTemplateName = templateName;
                if (string.IsNullOrWhiteSpace(resolvedTemplateName))
                    resolvedTemplateName = $"{resolvedSourceId}-report";

                var reportTitle = metadata.Value<string>("reportName")
                    ?? notification.Title
                    ?? "Scheduled Report";

                var reportData = await _payloadBuilder.FetchAndBuildAsync(
                    resolvedSourceId, metadata,
                    windowStartUtc, windowEndUtc,
                    windowStartLocal, windowEndLocal,
                    reportTitle, cancellationToken);

                if (reportData == null)
                {
                    return BuildFallbackPayload(notification, metadata, format, windowStartLocal, windowEndLocal);
                }

                return await RenderAndBuildPayload(
                    notification, metadata, reportData,
                    resolvedTemplateName, format,
                    windowStartLocal, windowEndLocal,
                    resolvedSourceId);
            }

            // ── Existing path: tank-volume-history and transaction-history-summary ──
            if (string.IsNullOrWhiteSpace(templateName))
            {
                templateName = isSummaryReport ? DefaultSummaryTemplateName : DefaultTemplateName;
            }

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

            var analyticsResult = await _mediator.Send(
                new GetTankVolumeHistoryFilteredQuery
                {
                    StartDate = windowEndUtc.AddDays(-6).Date,
                    EndDate = windowEndUtc,
                    SiteId = siteIds.Count == 1 ? siteIds.First() : null,
                    TankId = tankIds.Count == 1 ? tankIds.First() : null,
                    IncludeVehicleNames = true,
                    UseManualDispensing = metadata.Value<bool?>("useManualDispensing") ?? false,
                    IncludeGpsData = metadata.Value<bool?>("includeGpsData") ?? false
                },
                cancellationToken);

            var analyticsRows = analyticsResult.IsSuccess && analyticsResult.Data != null
                ? analyticsResult.Data
                : rows;

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

            var reportContext = new TankVolumeReportContext
            {
                ReportTitle = metadata.Value<string>("reportName") ?? notification.Title ?? "Tank Volume History Report",
                ReportSubtitle = ResolveSiteDisplay(siteNames) + " \u2014 All Transaction Types",
                CreatedBy = metadata.Value<string>("requestedBy") ?? notification.TriggeredBy ?? "System",
                DateFrom = windowStartLocal,
                DateTo = windowEndLocal,
                TimezoneId = timezoneId,
                TankNameLookup = tankNameLookup,
                AnalyticsRecords = analyticsRows
            };

            var existingReportData = isSummaryReport
                ? _dataBuilder.BuildTransactionHistorySummaryPayload(rows, reportContext)
                : _dataBuilder.BuildTankVolumeHistoryPayload(rows, reportContext);

            if (format == "html")
            {
                var htmlReport = await _reportRenderer.RenderHtmlAsync(templateName, existingReportData);
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
                    ? await _reportRenderer.RenderExcelAsync(templateName, existingReportData)
                    : await _reportRenderer.RenderPdfAsync(templateName, existingReportData);
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
            var volumeReportTitle = metadata.Value<string>("reportName")
                ?? notification.Title
                ?? "Scheduled Report";
            var payloadBody = BuildStyledEmailBody(volumeReportTitle, format, rows.Count, reportBytes.Length);

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
                return payload;
            }

            // Oversized or empty — no attachment
            return payload;
        }

        /// <summary>
        /// Renders report data via jsReport and builds the email payload with attachment.
        /// Shared by the generic path (ScheduledReportPayloadBuilder) for all non-volume-history report types.
        /// </summary>
        private async Task<ScheduledReportEmailPayload> RenderAndBuildPayload(
            NotificationEntity notification,
            JObject metadata,
            object reportData,
            string templateName,
            string format,
            DateTime windowStartLocal,
            DateTime windowEndLocal,
            string sourceId)
        {
            if (format == "html")
            {
                try
                {
                    var htmlReport = await _reportRenderer.RenderHtmlAsync(templateName, reportData);
                    return new ScheduledReportEmailPayload
                    {
                        Subject = notification.Title,
                        Body = htmlReport,
                        IsHtml = true
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "HTML render failed for {SourceId} template {Template}", sourceId, templateName);
                    return BuildFallbackPayload(notification, metadata, format, windowStartLocal, windowEndLocal);
                }
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
                _logger.LogError(ex,
                    "Report render failed for {SourceId} template {Template} format {Format}",
                    sourceId, templateName, format);
                return BuildFallbackPayload(notification, metadata, format, windowStartLocal, windowEndLocal);
            }

            var safeSourceId = sourceId.Replace("-", "_");
            var startText = windowStartLocal.ToString("yyyy-MM-dd");
            var endText = windowEndLocal.ToString("yyyy-MM-dd");
            var fileName = startText == endText
                ? $"{safeSourceId}_{startText}.{extension}"
                : $"{safeSourceId}_{startText}_to_{endText}.{extension}";

            var genericTitle = metadata.Value<string>("reportName")
                ?? notification.Title
                ?? "Scheduled Report";
            var payloadBody = BuildStyledEmailBody(genericTitle, format, -1, reportBytes.Length);

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
                return payload;
            }

            // Oversized or empty — no attachment
            return payload;
        }

        private static ScheduledReportEmailPayload BuildFallbackPayload(
            NotificationEntity notification,
            JObject metadata,
            string format,
            DateTime windowStartLocal,
            DateTime windowEndLocal)
        {
            var title = metadata.Value<string>("reportName")
                ?? notification.Title
                ?? "Scheduled Report";
            var body = BuildStyledEmailBody(title, format, 0, 0);

            return new ScheduledReportEmailPayload
            {
                Subject = notification.Title,
                Body = body,
                IsHtml = true
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

            if (periodType == "yearly")
            {
                var yearStartLocal = new DateTime(runAtLocal.Year, 1, 1, 0, 0, 0, DateTimeKind.Unspecified);
                var yearEndLocal = yearStartLocal.AddYears(1).AddTicks(-1);
                return (
                    TimeZoneInfo.ConvertTimeToUtc(yearStartLocal, timezone),
                    TimeZoneInfo.ConvertTimeToUtc(yearEndLocal, timezone),
                    yearStartLocal,
                    yearEndLocal,
                    timeZoneId);
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

            var offsetDays = metadata.Value<int?>("offsetDays") ?? 1;
            if (offsetDays < 1) offsetDays = 1;
            var windowDays = metadata.Value<int?>("windowDays") ?? 1;
            if (windowDays < 1) windowDays = 1;

            var dayStartLocal = runAtLocal.Date.AddDays(-offsetDays);
            var dayEndLocal = dayStartLocal.AddDays(windowDays).AddTicks(-1);
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

        /// <summary>
        /// Builds an M365-style flat-design HTML email body for scheduled report delivery.
        /// Matches the on-demand report email style from ReportJobManager.
        /// </summary>
        private static string BuildStyledEmailBody(
            string reportTitle,
            string format,
            int recordCount,
            long fileSizeBytes)
        {
            var formatUpper = (format ?? "pdf").Trim().ToUpperInvariant();
            var formatBadge = formatUpper switch
            {
                "PDF" => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#deecf9;color:#0078d4;'>PDF</span>",
                "EXCEL" => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#dff6dd;color:#107c10;'>EXCEL</span>",
                "HTML" => "<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#fff4ce;color:#ca5010;'>HTML</span>",
                _ => $"<span style='display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:#f3f2f1;color:#605e5c;'>{formatUpper}</span>"
            };

            var safeTitle = System.Net.WebUtility.HtmlEncode(reportTitle);

            // Build optional info rows
            var recordsRow = recordCount > 0
                ? $@"
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Records</td>
            <td align='right' style='font-size:14px;font-weight:600;color:#201f1e;'>{recordCount:N0}</td>
          </tr>
          </table>
        </td>
      </tr>"
                : "";

            var fileSizeRow = fileSizeBytes > 0
                ? $@"
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>File Size</td>
            <td align='right' style='font-size:13px;color:#201f1e;'>{FormatFileSize(fileSizeBytes)}</td>
          </tr>
          </table>
        </td>
      </tr>"
                : "";

            return $@"
<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f3f2f1;font-family:""Segoe UI"",-apple-system,system-ui,sans-serif;'>
<table cellpadding='0' cellspacing='0' border='0' width='100%' style='background:#f3f2f1;padding:32px 0;'>
<tr><td align='center'>
<table cellpadding='0' cellspacing='0' border='0' width='560' style='max-width:560px;background:#ffffff;border:1px solid #edebe9;border-radius:8px;overflow:hidden;'>

  <!-- Header Bar -->
  <tr><td style='background:#0078d4;padding:16px 24px;'>
    <table width='100%' cellpadding='0' cellspacing='0' border='0'>
    <tr>
      <td style='font-size:16px;font-weight:600;color:#ffffff;'>Hyoung Fleet Management</td>
      <td align='right' style='font-size:11px;color:#ffffff;'>Report Delivery</td>
    </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style='padding:28px 24px 12px;'>
    <h2 style='margin:0 0 4px;font-size:18px;font-weight:600;color:#201f1e;'>{safeTitle}</h2>
    <p style='margin:0 0 20px;font-size:13px;color:#605e5c;'>Your requested report has been generated and is attached to this email.</p>

    <!-- Info Card -->
    <table cellpadding='0' cellspacing='0' border='0' width='100%' style='background:#faf9f8;border:1px solid #edebe9;border-radius:6px;'>
{recordsRow}
      <tr>
        <td style='padding:14px 18px;border-bottom:1px solid #edebe9;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Format</td>
            <td align='right'>{formatBadge}</td>
          </tr>
          </table>
        </td>
      </tr>
{fileSizeRow}
      <tr>
        <td style='padding:14px 18px;'>
          <table width='100%' cellpadding='0' cellspacing='0' border='0'>
          <tr>
            <td style='font-size:12px;font-weight:600;color:#605e5c;text-transform:uppercase;letter-spacing:0.3px;'>Generated</td>
            <td align='right' style='font-size:13px;color:#201f1e;'>{DateTime.Now:dd MMM yyyy, HH:mm}</td>
          </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Attachment Note -->
  <tr><td style='padding:8px 24px 24px;'>
    <p style='margin:0;font-size:13px;color:#605e5c;'>
      <span style='display:inline-block;width:16px;height:16px;border-radius:50%;background:#deecf9;text-align:center;line-height:16px;font-size:10px;color:#0078d4;margin-right:6px;vertical-align:middle;'>&#128206;</span>
      The report file is attached to this email.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style='padding:16px 24px;border-top:1px solid #edebe9;background:#faf9f8;'>
    <p style='margin:0;font-size:11px;color:#a19f9d;'>
      This is an automated message from Hyoung FMS Report Engine. Please do not reply to this email.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>";
        }

        /// <summary>Formats byte count to human-readable size string.</summary>
        private static string FormatFileSize(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
            return $"{bytes / (1024.0 * 1024.0):F1} MB";
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

        /// <inheritdoc />
        public async Task<List<EmailAttachmentDto>> BuildReportAttachmentAsync(
            string reportType,
            string templateName,
            int? tankId,
            int? siteId,
            DateTime startDate,
            DateTime endDate,
            string fileNamePrefix,
            CancellationToken cancellationToken = default)
        {
            var attachments = new List<EmailAttachmentDto>();

            try
            {
                if (!string.Equals(reportType, TransactionVolumeHistoryReportType, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(reportType, TransactionVolumeHistoryReportTypeKebab, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(reportType, TransactionHistorySummaryReportType, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(reportType, TransactionHistorySummaryReportTypeKebab, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Unsupported event report attachment type: {ReportType}", reportType);
                    return attachments;
                }

                if (string.IsNullOrWhiteSpace(templateName))
                    templateName = DefaultTemplateName;

                // Fetch volume history data for the date range
                var historyResult = await _mediator.Send(
                    new GetTankVolumeHistoryFilteredQuery
                    {
                        StartDate = startDate,
                        EndDate = endDate,
                        IncludeVehicleNames = true,
                        UseManualDispensing = false,
                        IncludeGpsData = false
                    },
                    cancellationToken);

                if (!historyResult.IsSuccess || historyResult.Data == null)
                {
                    _logger.LogWarning("Failed to fetch tank volume history for event report attachment: {Message}", historyResult.Message);
                    return attachments;
                }

                var filteredRows = historyResult.Data.AsEnumerable();
                if (siteId.HasValue)
                    filteredRows = filteredRows.Where(row => row.SiteId.HasValue && row.SiteId.Value == siteId.Value);
                if (tankId.HasValue)
                    filteredRows = filteredRows.Where(row => row.TankId.HasValue && row.TankId.Value == tankId.Value);

                var rows = filteredRows.ToList();
                if (rows.Count == 0)
                {
                    _logger.LogInformation("No volume history rows found for event report attachment (TankId={TankId}, SiteId={SiteId})", tankId, siteId);
                    return attachments;
                }

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

                var reportData = BuildEventReportData(rows, tankNameLookup, startDate, endDate, fileNamePrefix);

                byte[] pdfBytes;
                try
                {
                    pdfBytes = await _reportRenderer.RenderPdfAsync(templateName, reportData);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to render PDF for event report attachment (template={TemplateName})", templateName);
                    return attachments;
                }

                if (pdfBytes.Length > 0 && pdfBytes.Length <= MaxAttachmentBytes)
                {
                    var dateStr = startDate.ToString("yyyy-MM-dd");
                    attachments.Add(new EmailAttachmentDto
                    {
                        FileName = $"{fileNamePrefix}_{dateStr}.pdf",
                        ContentType = "application/pdf",
                        Content = pdfBytes
                    });
                }
                else if (pdfBytes.Length > MaxAttachmentBytes)
                {
                    _logger.LogWarning("Event report PDF exceeds max attachment size ({Size} bytes)", pdfBytes.Length);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building event report attachment");
            }

            return attachments;
        }

        /// <summary>
        /// Builds the report data object for event-triggered PDF rendering.
        /// Simpler than the scheduled version — no notification entity needed.
        /// </summary>
        private static object BuildEventReportData(
            IReadOnlyCollection<TankVolumeHistoryDTO> rows,
            IReadOnlyDictionary<int, string> tankNameLookup,
            DateTime startDate,
            DateTime endDate,
            string reportTitle)
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
                        openingTimestamp = FormatTimestamp(opening?.Timestamp, "UTC"),
                        closingVolume = FormatDecimal(closing?.NewVolume),
                        closingTimestamp = FormatTimestamp(closing?.Timestamp, "UTC"),
                        totalTransactions = ordered.Count,
                        transactions = ordered.Select((item, index) => new
                        {
                            index = index + 1,
                            timestamp = FormatTimestamp(item.Timestamp, "UTC"),
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
                reportTitle = reportTitle.Replace("_", " "),
                generatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "Event Engine",
                dateRange = FormatDateRange(startDate, endDate),
                siteName = "All Sites",
                totalTransactions = rows.Count,
                tankReports = groupedRows
            };
        }
    }
}
