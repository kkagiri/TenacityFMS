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
        private const string TransactionVolumeHistoryReportTypeKebab = "tank-volume-history";
        private const string TransactionHistorySummaryReportType = "TransactionHistorySummary";
        private const string TransactionHistorySummaryReportTypeKebab = "transaction-history-summary";
        private const string DefaultTemplateName = "transaction-volume-history-report";
        private const string DefaultSummaryTemplateName = "transaction-history-summary-report";
        private const int MaxAttachmentBytes = 7 * 1024 * 1024;

        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly INotificationReportRenderer _reportRenderer;
        private readonly ILogger<ScheduledReportDeliveryService> _logger;
        private readonly ScheduledReportPayloadBuilder _payloadBuilder;

        public ScheduledReportDeliveryService(
            IMediator mediator,
            GpsdataContext context,
            INotificationReportRenderer reportRenderer,
            ILogger<ScheduledReportDeliveryService> logger,
            ScheduledReportPayloadBuilder payloadBuilder)
        {
            _mediator = mediator;
            _context = context;
            _reportRenderer = reportRenderer;
            _logger = logger;
            _payloadBuilder = payloadBuilder;
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
            var isSummaryReport = string.Equals(reportType, TransactionHistorySummaryReportType, StringComparison.OrdinalIgnoreCase)
                || string.Equals(reportType, TransactionHistorySummaryReportTypeKebab, StringComparison.OrdinalIgnoreCase);
            var isVolumeHistoryReport = string.Equals(reportType, TransactionVolumeHistoryReportType, StringComparison.OrdinalIgnoreCase)
                || string.Equals(reportType, TransactionVolumeHistoryReportTypeKebab, StringComparison.OrdinalIgnoreCase);

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

            var existingReportData = isSummaryReport
                ? BuildTransactionHistorySummaryReportData(
                    rows, tankNameLookup, notification, metadata,
                    windowStartLocal, windowEndLocal, siteNames, timezoneId)
                : BuildTransactionVolumeHistoryReportData(
                    rows, tankNameLookup, notification, metadata,
                    windowStartLocal, windowEndLocal, siteNames, timezoneId);

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

        /// <summary>
        /// Builds an aggregated monthly summary report data object for the
        /// 'transaction-history-summary-report' Handlebars template.
        /// Groups transactions by month → site → tank with totals for dispensing, delivery, transfer, and variance.
        /// </summary>
        private static object BuildTransactionHistorySummaryReportData(
            IReadOnlyCollection<TankVolumeHistoryDTO> rows,
            IReadOnlyDictionary<int, string> tankNameLookup,
            NotificationEntity notification,
            JObject metadata,
            DateTime windowStartLocal,
            DateTime windowEndLocal,
            List<string> siteNames,
            string timezoneId)
        {
            var timezone = ResolveTimeZoneInfo(timezoneId);
            var monthNames = new[] { "", "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" };

            // Group by month → site → tank
            var monthGroups = rows
                .Where(r => r.TankId.HasValue)
                .Select(r =>
                {
                    var ts = r.Timestamp.Kind == DateTimeKind.Utc
                        ? TimeZoneInfo.ConvertTimeFromUtc(r.Timestamp, timezone)
                        : r.Timestamp;
                    return new { Row = r, LocalTimestamp = ts };
                })
                .GroupBy(x => new { x.LocalTimestamp.Year, x.LocalTimestamp.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .ToList();

            decimal grandDispensing = 0, grandDelivery = 0, grandTransfer = 0;
            var monthlyGroups = new List<object>();

            foreach (var monthGroup in monthGroups)
            {
                var year = monthGroup.Key.Year;
                var month = monthGroup.Key.Month;
                var monthLabel = $"{monthNames[month]} {year}";

                decimal monthDispensing = 0, monthDelivery = 0, monthTransfer = 0;
                int monthDispCount = 0, monthDelCount = 0, monthXferCount = 0;

                var siteGroupMap = monthGroup
                    .GroupBy(x => Sanitize(x.Row.Site, "-"))
                    .OrderBy(g => g.Key);

                var siteGroupsList = new List<object>();
                foreach (var siteGroup in siteGroupMap)
                {
                    var tankGroupMap = siteGroup
                        .GroupBy(x => x.Row.TankId!.Value)
                        .OrderBy(g => tankNameLookup.TryGetValue(g.Key, out var n) ? n : $"Tank {g.Key}");

                    var tanksList = new List<object>();
                    foreach (var tankGroup in tankGroupMap)
                    {
                        var ordered = tankGroup.OrderBy(x => x.LocalTimestamp).ToList();
                        var first = ordered.First();
                        var last = ordered.Last();
                        var tankName = tankNameLookup.TryGetValue(tankGroup.Key, out var tn) ? tn : $"Tank {tankGroup.Key}";

                        var openingRaw = (first.Row.NewVolume ?? 0m) - (first.Row.VolumeChange ?? 0m);
                        var closingRaw = last.Row.NewVolume ?? 0m;

                        var dispensingRows = ordered.Where(x => IsDispensing(x.Row.ChangeReason)).ToList();
                        var deliveryRows = ordered.Where(x => IsDelivery(x.Row.ChangeReason)).ToList();
                        var transferRows = ordered.Where(x => IsTransfer(x.Row.ChangeReason)).ToList();

                        var dispTotal = dispensingRows.Sum(x => Math.Abs(x.Row.VolumeChange ?? 0m));
                        var delTotal = deliveryRows.Sum(x => x.Row.VolumeChange ?? 0m);
                        var xferTotal = transferRows.Sum(x => x.Row.VolumeChange ?? 0m);

                        var expectedClosing = openingRaw + delTotal + xferTotal - dispTotal;
                        var variance = closingRaw - expectedClosing;
                        var variancePercent = expectedClosing != 0
                            ? Math.Round(variance / Math.Abs(expectedClosing) * 100, 2)
                            : 0m;

                        var daySpan = Math.Max(1, (int)Math.Ceiling((last.LocalTimestamp - first.LocalTimestamp).TotalDays));
                        var avgDaily = Math.Round(dispTotal / daySpan, 2);

                        monthDispensing += dispTotal;
                        monthDelivery += delTotal;
                        monthTransfer += Math.Abs(xferTotal);
                        monthDispCount += dispensingRows.Count;
                        monthDelCount += deliveryRows.Count;
                        monthXferCount += transferRows.Count;

                        tanksList.Add(new
                        {
                            tankName,
                            openingBalance = FormatDecimal(openingRaw),
                            closingBalance = FormatDecimal(closingRaw),
                            expectedClosing = FormatDecimal(expectedClosing),
                            dispensing = new { total = FormatDecimal(dispTotal), count = dispensingRows.Count },
                            delivery = new { total = FormatDecimal(delTotal), count = deliveryRows.Count },
                            transfer = new { total = FormatDecimal(Math.Abs(xferTotal)), count = transferRows.Count },
                            variance = FormatDecimal(variance),
                            varianceIsNegative = variance < -0.5m,
                            variancePercent = $"{variancePercent}%",
                            avgDailyConsumption = FormatDecimal(avgDaily),
                            totalTransactions = ordered.Count,
                        });
                    }

                    siteGroupsList.Add(new { siteName = siteGroup.Key, tanks = tanksList });
                }

                grandDispensing += monthDispensing;
                grandDelivery += monthDelivery;
                grandTransfer += monthTransfer;

                monthlyGroups.Add(new
                {
                    month = $"{year}-{month:D2}",
                    monthLabel,
                    year = year.ToString(),
                    siteGroups = siteGroupsList,
                    subtotal = new
                    {
                        dispensing = FormatDecimal(monthDispensing),
                        dispensingCount = monthDispCount,
                        delivery = FormatDecimal(monthDelivery),
                        deliveryCount = monthDelCount,
                        transfer = FormatDecimal(monthTransfer),
                        transferCount = monthXferCount,
                        variance = FormatDecimal(monthDelivery + monthTransfer - monthDispensing),
                    },
                });
            }

            var netVariance = grandDelivery + grandTransfer - grandDispensing;

            return new
            {
                reportTitle = metadata.Value<string>("reportName") ?? notification.Title ?? "Transaction History Summary",
                reportSubtitle = $"Period: {FormatDateRange(windowStartLocal, windowEndLocal)}",
                generatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = metadata.Value<string>("requestedBy") ?? notification.TriggeredBy ?? "System",
                dateFrom = windowStartLocal.ToString("yyyy-MM-dd"),
                dateTo = windowEndLocal.ToString("yyyy-MM-dd"),
                siteName = ResolveSiteDisplay(siteNames),
                monthlyGroups,
                grandTotal = new
                {
                    dispensing = FormatDecimal(grandDispensing),
                    delivery = FormatDecimal(grandDelivery),
                    transfer = FormatDecimal(grandTransfer),
                    variance = FormatDecimal(netVariance),
                    varianceIsNegative = netVariance < -0.5m,
                },
                summary = new
                {
                    totalTransactions = rows.Count,
                    totalDispensed = FormatDecimal(grandDispensing),
                    totalDelivery = FormatDecimal(grandDelivery),
                    totalTransfer = FormatDecimal(grandTransfer),
                    netVariance = FormatDecimal(netVariance),
                    monthsCovered = monthGroups.Count,
                    sitesMonitored = rows.Select(r => r.Site).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Count(),
                    tanksMonitored = rows.Where(r => r.TankId.HasValue).Select(r => r.TankId!.Value).Distinct().Count(),
                },
            };
        }

        private static bool IsDispensing(VolumeChangeReasonEnum reason)
            => reason == VolumeChangeReasonEnum.Dispensing || reason == VolumeChangeReasonEnum.AutomatedDispensing;

        private static bool IsDelivery(VolumeChangeReasonEnum reason)
            => reason == VolumeChangeReasonEnum.Delivery || reason == VolumeChangeReasonEnum.InTankDelivery;

        private static bool IsTransfer(VolumeChangeReasonEnum reason)
            => reason == VolumeChangeReasonEnum.TransferIn || reason == VolumeChangeReasonEnum.TransferOut;

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
