/**
 * File: OperationalReportPayloadBuilder.cs
 * Purpose: Builds payloads for custom operational reports that reuse existing alert and tank history data.
 * Dependencies: MediatR, Tank volume history query, alarm report query, Newtonsoft.Json.Linq
 * Last Modified: 2026-03-24
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Application.Features.Notification.Queries;
using FMS.Application.Features.TankManagement.TankVolumeHistory.Queries;
using MediatR;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Reporting.Services
{
    public class OperationalReportPayloadBuilder
    {
        private static readonly HashSet<int> DeliveryReasons = new() { 2, 10 };
        private static readonly HashSet<int> DispensingReasons = new() { 6, 7 };
        private static readonly HashSet<int> TransferInReasons = new() { 3 };
        private static readonly HashSet<int> TransferOutReasons = new() { 4 };

        private readonly IMediator _mediator;

        public OperationalReportPayloadBuilder(IMediator mediator)
        {
            _mediator = mediator;
        }

        public async Task<object?> FetchAndBuildAsync(
            string sourceId,
            JObject metadata,
            DateTime windowStartUtc,
            DateTime windowEndUtc,
            DateTime windowStartLocal,
            DateTime windowEndLocal,
            string reportTitle,
            CancellationToken cancellationToken = default)
        {
            return sourceId.ToLowerInvariant() switch
            {
                "tank-level-detail" => await BuildTankLevelDetailPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                "storage-received-vs-dispensed" => await BuildStorageReceivedVsDispensedPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                "alarm-report" => await BuildAlarmReportPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                _ => null,
            };
        }

        private async Task<object?> BuildTankLevelDetailPayload(
            JObject metadata,
            DateTime startUtc,
            DateTime endUtc,
            DateTime startLocal,
            DateTime endLocal,
            string reportTitle,
            CancellationToken ct)
        {
            var records = await GetTankHistoryAsync(metadata, startUtc, endUtc, ct);
            if (records.Count == 0)
            {
                return BuildPayload(
                    string.IsNullOrWhiteSpace(reportTitle) ? "Tank Level Detail Report" : reportTitle,
                    startLocal,
                    endLocal,
                    Array.Empty<object>(),
                    new { totalRecords = 0, currentLevel = "0.00", totalReceived = "0.00", totalDispensed = "0.00", netChange = "0.00" });
            }

            var ordered = records.OrderBy(record => record.Timestamp).ToList();
            var openingLevel = (ordered[0].NewVolume ?? 0m) - (ordered[0].VolumeChange ?? 0m);
            var closingLevel = ordered[^1].NewVolume ?? 0m;
            var totalReceived = ordered.Where(record => DeliveryReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
            var totalDispensed = ordered.Where(record => DispensingReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
            var netChange = closingLevel - openingLevel;

            var mapped = ordered.Select((record, index) => new
            {
                rowNumber = index + 1,
                occurredAt = FormatDateTime(record.Timestamp),
                siteName = CleanText(record.Site, "-"),
                tankName = CleanText(record.TankName, $"Tank {record.TankId}"),
                transactionType = ResolveReasonLabel(record),
                volumeChange = FormatSigned(record.VolumeChange ?? 0m),
                balanceAfter = Fmt(record.NewVolume ?? 0m),
                vehicleName = CleanText(record.VehicleName, "-"),
                reference = CleanText(record.ReferenceType, "-"),
                operatorName = CleanText(record.RecordedByUserName ?? record.RecordedBy, "System"),
                notes = BuildNotes(record),
            }).ToList();

            return BuildPayload(
                string.IsNullOrWhiteSpace(reportTitle) ? "Tank Level Detail Report" : reportTitle,
                startLocal,
                endLocal,
                mapped,
                new
                {
                    totalRecords = mapped.Count,
                    openingLevel = Fmt(openingLevel),
                    currentLevel = Fmt(closingLevel),
                    totalReceived = Fmt(totalReceived),
                    totalDispensed = Fmt(totalDispensed),
                    netChange = FormatSigned(netChange),
                    lastUpdatedAt = FormatDateTime(ordered[^1].Timestamp),
                });
        }

        private async Task<object?> BuildStorageReceivedVsDispensedPayload(
            JObject metadata,
            DateTime startUtc,
            DateTime endUtc,
            DateTime startLocal,
            DateTime endLocal,
            string reportTitle,
            CancellationToken ct)
        {
            var records = await GetTankHistoryAsync(metadata, startUtc, endUtc, ct);
            if (records.Count == 0)
            {
                return BuildPayload(
                    string.IsNullOrWhiteSpace(reportTitle) ? "Storage Received vs. Dispensed Report" : reportTitle,
                    startLocal,
                    endLocal,
                    Array.Empty<object>(),
                    new { totalRecords = 0, tankCount = 0, totalReceived = "0.00", totalDispensed = "0.00", totalVariance = "0.00" });
            }

            var grouped = records
                .GroupBy(record => new { record.SiteId, SiteName = CleanText(record.Site, "-"), record.TankId, TankName = CleanText(record.TankName, $"Tank {record.TankId}") })
                .OrderBy(group => group.Key.SiteName)
                .ThenBy(group => group.Key.TankName)
                .ToList();

            var rawRows = grouped.Select(group =>
            {
                var ordered = group.OrderBy(record => record.Timestamp).ToList();
                var openingLevel = (ordered[0].NewVolume ?? 0m) - (ordered[0].VolumeChange ?? 0m);
                var actualClosing = ordered[^1].NewVolume ?? 0m;
                var received = ordered.Where(record => DeliveryReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
                var dispensed = ordered.Where(record => DispensingReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
                var transferIn = ordered.Where(record => TransferInReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
                var transferOut = ordered.Where(record => TransferOutReasons.Contains((int)record.ChangeReason)).Sum(record => Math.Abs(record.VolumeChange ?? 0m));
                var expectedClosing = openingLevel + received + transferIn - dispensed - transferOut;
                var variance = actualClosing - expectedClosing;

                return new
                {
                    group.Key.SiteName,
                    group.Key.TankName,
                    OpeningLevel = openingLevel,
                    Received = received,
                    Dispensed = dispensed,
                    TransferIn = transferIn,
                    TransferOut = transferOut,
                    ExpectedClosing = expectedClosing,
                    ActualClosing = actualClosing,
                    Variance = variance,
                };
            }).ToList();

            var mapped = rawRows.Select((row, index) => new
            {
                rowNumber = index + 1,
                siteName = row.SiteName,
                tankName = row.TankName,
                openingLevel = Fmt(row.OpeningLevel),
                received = Fmt(row.Received),
                dispensed = Fmt(row.Dispensed),
                transferIn = Fmt(row.TransferIn),
                transferOut = Fmt(row.TransferOut),
                expectedClosing = Fmt(row.ExpectedClosing),
                actualClosing = Fmt(row.ActualClosing),
                variance = FormatSigned(row.Variance),
                varianceClass = row.Variance < 0m ? "text-danger" : row.Variance > 0m ? "text-success" : "text-muted",
            }).ToList();

            return BuildPayload(
                string.IsNullOrWhiteSpace(reportTitle) ? "Storage Received vs. Dispensed Report" : reportTitle,
                startLocal,
                endLocal,
                mapped,
                new
                {
                    totalRecords = mapped.Count,
                    tankCount = mapped.Count,
                    totalReceived = Fmt(rawRows.Sum(row => row.Received)),
                    totalDispensed = Fmt(rawRows.Sum(row => row.Dispensed)),
                    totalTransferIn = Fmt(rawRows.Sum(row => row.TransferIn)),
                    totalTransferOut = Fmt(rawRows.Sum(row => row.TransferOut)),
                    totalVariance = FormatSigned(rawRows.Sum(row => row.Variance)),
                });
        }

        private async Task<object?> BuildAlarmReportPayload(
            JObject metadata,
            DateTime startUtc,
            DateTime endUtc,
            DateTime startLocal,
            DateTime endLocal,
            string reportTitle,
            CancellationToken ct)
        {
            var query = new GetAlarmReportDataQuery
            {
                StartDate = startUtc,
                EndDate = endUtc,
                PtsId = GetStringParam(metadata, "ptsId"),
                DeviceType = GetStringParam(metadata, "deviceType"),
                State = GetStringParam(metadata, "state"),
                Take = GetIntParam(metadata, "take") ?? 5000,
            };

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null || result.Data.Count == 0)
            {
                return new
                {
                    reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Alarm Report" : reportTitle,
                    generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    generatedBy = "System (Scheduled)",
                    reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                    dateFrom = startLocal.ToString("yyyy-MM-dd"),
                    dateTo = endLocal.ToString("yyyy-MM-dd"),
                    startDate = startLocal.ToString("yyyy-MM-dd"),
                    endDate = endLocal.ToString("yyyy-MM-dd"),
                    deviceType = GetStringParam(metadata, "deviceType"),
                    ptsId = GetStringParam(metadata, "ptsId"),
                    state = GetStringParam(metadata, "state"),
                    records = Array.Empty<object>(),
                    data = Array.Empty<object>(),
                    items = Array.Empty<object>(),
                    transactions = Array.Empty<object>(),
                    summary = new { totalRecords = 0, criticalCount = 0, activeCount = 0, resolvedCount = 0, uniqueDevices = 0 },
                };
            }

            var records = result.Data;
            var mapped = records.Select((record, index) => new
            {
                rowNumber = index + 1,
                occurredAt = FormatDateTime(record.OccurredAt),
                ptsId = record.PtsId,
                deviceLabel = $"{record.DeviceType} #{record.DeviceNumber}",
                alertCode = record.AlertCode,
                alarmType = record.AlarmType,
                severity = record.Severity,
                severityClass = record.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)
                    ? "text-danger"
                    : record.Severity.Equals("High", StringComparison.OrdinalIgnoreCase)
                        ? "text-success"
                        : "text-muted",
                state = record.State,
                description = record.Description,
                configurationId = CleanText(record.ConfigurationId, "-"),
            }).ToList();

            var activeCount = records.Count(record => record.State.Equals("Started", StringComparison.OrdinalIgnoreCase)
                || record.State.Equals("Detected", StringComparison.OrdinalIgnoreCase));
            var resolvedCount = records.Count(record => record.State.Equals("Finished", StringComparison.OrdinalIgnoreCase));
            var criticalCount = records.Count(record => record.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase));
            var uniqueDevices = records.Select(record => $"{record.PtsId}:{record.DeviceType}:{record.DeviceNumber}").Distinct().Count();

            return new
            {
                reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Alarm Report" : reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                deviceType = GetStringParam(metadata, "deviceType"),
                ptsId = GetStringParam(metadata, "ptsId"),
                state = GetStringParam(metadata, "state"),
                records = mapped,
                data = mapped,
                items = mapped,
                transactions = mapped,
                summary = new
                {
                    totalRecords = mapped.Count,
                    criticalCount,
                    activeCount,
                    resolvedCount,
                    uniqueDevices,
                },
            };
        }

        private async Task<List<TankVolumeHistoryDTO>> GetTankHistoryAsync(JObject metadata, DateTime startUtc, DateTime endUtc, CancellationToken ct)
        {
            var query = new GetTankVolumeHistoryFilteredQuery
            {
                StartDate = startUtc,
                EndDate = endUtc,
                SiteId = GetIntParam(metadata, "siteId"),
                TankId = GetIntParam(metadata, "tankId"),
                Take = null,
                IncludeVehicleNames = true,
                UseManualDispensing = false,
            };

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                return new List<TankVolumeHistoryDTO>();
            }

            return result.Data;
        }

        private static object BuildPayload(string reportTitle, DateTime startLocal, DateTime endLocal, object records, object summary)
        {
            return new
            {
                reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                records,
                data = records,
                items = records,
                transactions = records,
                summary,
            };
        }

        private static string CleanText(string? value, string fallback)
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private static string Fmt(decimal value)
        {
            return value.ToString("N2", CultureInfo.InvariantCulture);
        }

        private static string FormatSigned(decimal value)
        {
            return value.ToString("+0.00;-0.00;0.00", CultureInfo.InvariantCulture);
        }

        private static string FormatDateTime(DateTime value)
        {
            return value.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        }

        private static string ResolveReasonLabel(TankVolumeHistoryDTO record)
        {
            if (!string.IsNullOrWhiteSpace(record.ChangeReasonDisplay))
            {
                return record.ChangeReasonDisplay!;
            }

            return ((int)record.ChangeReason) switch
            {
                2 => "Delivery",
                3 => "Transfer In",
                4 => "Transfer Out",
                6 => "Manual Dispensing",
                7 => "Auto Dispensing",
                10 => "In-Tank Delivery",
                _ => record.ChangeReason.ToString(),
            };
        }

        private static string BuildNotes(TankVolumeHistoryDTO record)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(record.VehicleType))
            {
                parts.Add(record.VehicleType);
            }

            if (!string.IsNullOrWhiteSpace(record.TransferTankName))
            {
                parts.Add($"Transfer: {record.TransferTankName}");
            }

            if (!string.IsNullOrWhiteSpace(record.TransferTankSite))
            {
                parts.Add($"Site: {record.TransferTankSite}");
            }

            return parts.Count == 0 ? "-" : string.Join(" | ", parts);
        }

        private static string? GetStringParam(JObject metadata, string key)
        {
            var value = metadata.Value<string>(key);
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static int? GetIntParam(JObject metadata, string key)
        {
            var token = metadata[key];
            if (token == null)
            {
                return null;
            }

            return token.Type switch
            {
                JTokenType.Integer => token.Value<int>(),
                JTokenType.String when int.TryParse(token.Value<string>(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) => value,
                _ => null,
            };
        }
    }
}