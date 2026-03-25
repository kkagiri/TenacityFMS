/**
 * File: ScheduledReportPayloadBuilder.cs
 * Purpose: Fetches data via MediatR and builds template-ready payloads for all report types.
 *          Used by ScheduledReportDeliveryService to generate attachments for scheduled reports.
 * Dependencies: IMediator, GpsdataContext, MediatR queries for each report source
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - FetchAndBuildAsync: Dispatches to the appropriate MediatR query and shapes data for jsReport template
 * - CanHandle: Checks if a given report type / source ID is supported
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Queries;
using FMS.Application.Features.ATG;
using FMS.Application.Features.IssueTracker.Queries;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Application.Features.Reporting.Services;
using FMS.Application.Features.TankManagement.PumpTransaction;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Notification.Services
{
    /// <summary>
    /// Fetches report data via MediatR and shapes it into template-ready payloads
    /// for all supported scheduled report types.
    /// </summary>
    public class ScheduledReportPayloadBuilder
    {
        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly ILogger<ScheduledReportPayloadBuilder> _logger;
        private readonly OperationalReportPayloadBuilder _operationalReportPayloadBuilder;

        /// <summary>
        /// Source IDs (kebab-case) that this builder explicitly handles.
        /// Tank-volume-history and transaction-history-summary are handled by
        /// ScheduledReportDeliveryService directly (existing code).
        /// </summary>
        private static readonly HashSet<string> _supportedSourceIds = new(StringComparer.OrdinalIgnoreCase)
        {
            "fuel-refill",
            "vehicle-consumption",
            "consumption-by-refills",
            "delivery",
            "pump-transaction",
            "device-offline",
            "pts-device",
            "issue-tracker",
            "live-trip-operations",
            "tank-level-detail",
            "storage-received-vs-dispensed",
            "alarm-report",
        };

        public ScheduledReportPayloadBuilder(
            IMediator mediator,
            GpsdataContext context,
            ILogger<ScheduledReportPayloadBuilder> logger,
            OperationalReportPayloadBuilder operationalReportPayloadBuilder)
        {
            _mediator = mediator;
            _context = context;
            _logger = logger;
            _operationalReportPayloadBuilder = operationalReportPayloadBuilder;
        }

        /// <summary>
        /// Returns true if this builder can handle the given source ID.
        /// </summary>
        public static bool CanHandle(string? sourceId)
        {
            return !string.IsNullOrWhiteSpace(sourceId) && _supportedSourceIds.Contains(sourceId);
        }

        /// <summary>
        /// Resolves the source ID from notification metadata.
        /// Checks "sourceId" first, then infers from "reportType" or "templateName".
        /// </summary>
        public static string? ResolveSourceId(JObject metadata)
        {
            // Prefer explicit sourceId
            var sourceId = metadata.Value<string>("sourceId");
            if (!string.IsNullOrWhiteSpace(sourceId))
                return sourceId.Trim();

            // Infer from templateName (most reliable since it's set from source.defaultTemplate)
            var templateName = metadata.Value<string>("templateName");
            if (!string.IsNullOrWhiteSpace(templateName))
            {
                var inferred = InferSourceIdFromTemplate(templateName);
                if (inferred != null)
                    return inferred;
            }

            // Infer from reportType
            var reportType = metadata.Value<string>("reportType");
            if (!string.IsNullOrWhiteSpace(reportType))
            {
                var inferred = InferSourceIdFromReportType(reportType);
                if (inferred != null)
                    return inferred;
            }

            return null;
        }

        /// <summary>
        /// Fetches data via MediatR and shapes it into a template-ready object.
        /// </summary>
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
            try
            {
                return sourceId.ToLowerInvariant() switch
                {
                    "fuel-refill" => await BuildFuelRefillPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "vehicle-consumption" => await BuildVehicleConsumptionPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken, false),
                    "consumption-by-refills" => await BuildVehicleConsumptionPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken, true),
                    "delivery" => await BuildDeliveryPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "pump-transaction" => await BuildPumpTransactionPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "device-offline" => await BuildDeviceOfflinePayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "pts-device" => await BuildPtsDevicePayload(metadata, reportTitle, cancellationToken),
                    "issue-tracker" => await BuildIssueTrackerPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "live-trip-operations" => await BuildLiveTripOperationsPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "tank-level-detail" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "storage-received-vs-dispensed" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "alarm-report" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    _ => null,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch/build report data for source {SourceId}", sourceId);
                return null;
            }
        }

        // ─── Fuel Refill ────────────────────────────────────────────────────────────

        private async Task<object?> BuildFuelRefillPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var query = new Application.Queries.Database.FMSQuery.FuelRefilQueries.FuelRefillGetListQuery
            {
                StartDate = startUtc,
                EndDate = endUtc,
                SiteId = GetIntParam(metadata, "siteId"),
                Take = 10000,
                Skip = 0,
            };

            var records = await _mediator.Send(query, ct);
            if (records == null || records.Count == 0)
            {
                _logger.LogInformation("No fuel refill records found for scheduled report");
                return BuildEmptyPayload(reportTitle, startLocal, endLocal, "Fuel Refill Report");
            }

            var mapped = records.Select((r, i) => new
            {
                rowNumber = i + 1,
                dateTime = FormatDateTime(r.Date),
                vehicleName = r.HyoungNo ?? "-",
                siteName = r.SiteName ?? "-",
                volume = Fmt(r.ManualFuelrefillAmount),
                fuelAverage = "0.00",
                fuelAverageUnit = "Km/L",
            }).ToList();

            var totalVolume = records.Sum(r => r.ManualFuelrefillAmount ?? 0m);

            return BuildPayload(reportTitle, startLocal, endLocal, mapped, new
            {
                totalRecords = mapped.Count,
                totalRefills = mapped.Count,
                totalVolume = Fmt(totalVolume),
            });
        }

        // ─── Vehicle Consumption / Consumption by Refills ───────────────────────────

        private async Task<object?> BuildVehicleConsumptionPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct,
            bool isConsumptionByRefills)
        {
            var averageKmL = GetBoolParam(metadata, "averageKmL");
            var query = new Application.Queries.Database.FMSQuery.Consumption.GetVehicleConsumptionManualRefillQueryFiltered(
                StartDate: startUtc,
                EndDate: endUtc,
                SiteId: GetIntParam(metadata, "siteId"),
                VehicleTypeId: GetIntParam(metadata, "vehicleTypeId"),
                VehicleId: GetIntParam(metadata, "vehicleId"),
                AverageKmL: averageKmL);

            var (distanceHeader, consumptionHeader, distanceSummaryLabel, avgConsumptionLabel, consumptionModeLabel, distanceUnit, consumptionUnit) =
                BuildConsumptionLabels(averageKmL, null);

            var records = await _mediator.Send(query, ct);
            if (records == null || records.Count == 0)
            {
                var emptyTitle = isConsumptionByRefills ? "Consumption by Refills Report" : "Vehicle Consumption Report";
                return BuildConsumptionPayload(
                    string.IsNullOrWhiteSpace(reportTitle) ? emptyTitle : reportTitle,
                    startLocal,
                    endLocal,
                    Array.Empty<object>(),
                    new
                    {
                        totalRecords = 0,
                        totalVehicles = 0,
                        totalVolume = "0.00",
                        totalFuel = "0.00",
                        totalFuelDisplay = "0.00 L",
                        avgExpectedAverage = "0.00",
                        avgExpectedAverageDisplay = consumptionUnit == string.Empty ? "0.00" : $"0.00 {consumptionUnit}",
                        totalDistanceKm = "0.00",
                        totalDistanceKmDisplay = "0.00 km",
                        totalEngineHours = "0.00",
                        totalEngineHoursDisplay = "0.00 hr",
                        totalDistance = "0.00",
                        totalDistanceDisplay = distanceUnit == string.Empty ? "0.00" : $"0.00 {distanceUnit}",
                        totalCost = "0.00",
                        avgConsumption = "0.00",
                        avgConsumptionDisplay = consumptionUnit == string.Empty ? "0.00" : $"0.00 {consumptionUnit}",
                        avgConsumptionKmL = "0.00",
                        avgConsumptionKmLDisplay = "0.00 km/L",
                        avgConsumptionLHr = "0.00",
                        avgConsumptionLHrDisplay = "0.00 L/hr",
                    },
                    distanceHeader,
                    consumptionHeader,
                    distanceSummaryLabel,
                    avgConsumptionLabel,
                    consumptionModeLabel);
            }

            (distanceHeader, consumptionHeader, distanceSummaryLabel, avgConsumptionLabel, consumptionModeLabel, distanceUnit, consumptionUnit) =
                BuildConsumptionLabels(averageKmL, records.Select(r => r.IsKmL));

            var mapped = records.Select((r, i) => new
            {
                rowNumber = i + 1,
                vehicleName = r.HyoungNo ?? r.VehicleInfo ?? "-",
                numberPlate = r.HyoungNo ?? "-",
                vehicleType = r.VehicleType ?? "-",
                siteName = r.WorkingSiteName ?? "-",
                refillCount = r.RefillCount,
                volume = Fmt(r.TotalFuelAmount),
                totalVolume = Fmt(r.TotalFuelAmount),
                distance = Fmt(r.DistanceOrEngineHours),
                totalDistance = Fmt(r.DistanceOrEngineHours),
                distanceDisplay = $"{Fmt(r.DistanceOrEngineHours)} {(r.IsKmL ? "km" : "hr")}",
                consumption = Fmt(r.Consumption),
                consumptionDisplay = $"{Fmt(r.Consumption)} {(r.IsKmL ? "km/L" : "L/hr")}",
                expectedAverage = Fmt(r.ExpectedAverage),
                expectedAverageDisplay = r.ExpectedAverage > 0
                    ? $"{Fmt(r.ExpectedAverage)} {(r.IsKmL ? "km/L" : "L/hr")}"
                    : "-",
                distanceUnit = r.IsKmL ? "km" : "hr",
                consumptionUnit = r.IsKmL ? "km/L" : "L/hr",
                isKmL = r.IsKmL,
                cost = "0.00",
            }).ToList();

            var totalVolume = records.Sum(r => r.TotalFuelAmount);
            var totalDistance = records.Sum(r => r.DistanceOrEngineHours);
            var avgConsumption = records.Count > 0 ? records.Average(r => r.Consumption) : 0m;
            var validDistanceRows = records.Where(r => r.DistanceOrEngineHours > 0).ToList();
            var validKmRows = validDistanceRows.Where(r => r.IsKmL).ToList();
            var validHrRows = validDistanceRows.Where(r => !r.IsKmL).ToList();
            var totalDistanceKm = validKmRows.Sum(r => r.DistanceOrEngineHours);
            var totalEngineHours = validHrRows.Sum(r => r.DistanceOrEngineHours);
            var avgConsumptionKmL = validKmRows.Count > 0 ? validKmRows.Average(r => r.Consumption) : 0m;
            var avgConsumptionLHr = validHrRows.Count > 0 ? validHrRows.Average(r => r.Consumption) : 0m;
            var validExpectedRows = records.Where(r => r.ExpectedAverage > 0).ToList();
            var avgExpectedAverage = validExpectedRows.Count > 0 ? validExpectedRows.Average(r => r.ExpectedAverage) : 0m;

            return BuildConsumptionPayload(reportTitle, startLocal, endLocal, mapped, new
            {
                totalRecords = mapped.Count,
                totalVehicles = mapped.Count,
                totalVolume = Fmt(totalVolume),
                totalFuel = Fmt(totalVolume),
                totalFuelDisplay = $"{Fmt(totalVolume)} L",
                avgExpectedAverage = Fmt(avgExpectedAverage),
                avgExpectedAverageDisplay = consumptionUnit == string.Empty ? Fmt(avgExpectedAverage) : $"{Fmt(avgExpectedAverage)} {consumptionUnit}",
                totalDistanceKm = Fmt(totalDistanceKm),
                totalDistanceKmDisplay = $"{Fmt(totalDistanceKm)} km",
                totalEngineHours = Fmt(totalEngineHours),
                totalEngineHoursDisplay = $"{Fmt(totalEngineHours)} hr",
                totalDistance = Fmt(totalDistance),
                totalDistanceDisplay = distanceUnit == string.Empty ? Fmt(totalDistance) : $"{Fmt(totalDistance)} {distanceUnit}",
                totalCost = "0.00",
                avgConsumption = Fmt(avgConsumption),
                avgConsumptionDisplay = consumptionUnit == string.Empty ? Fmt(avgConsumption) : $"{Fmt(avgConsumption)} {consumptionUnit}",
                avgConsumptionKmL = Fmt(avgConsumptionKmL),
                avgConsumptionKmLDisplay = $"{Fmt(avgConsumptionKmL)} km/L",
                avgConsumptionLHr = Fmt(avgConsumptionLHr),
                avgConsumptionLHrDisplay = $"{Fmt(avgConsumptionLHr)} L/hr",
            },
            distanceHeader,
            consumptionHeader,
            distanceSummaryLabel,
            avgConsumptionLabel,
            consumptionModeLabel);
        }

        // ─── Delivery ───────────────────────────────────────────────────────────────

        private async Task<object?> BuildDeliveryPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var query = new Application.Queries.Database.FMSQuery.DeliveryQueries.GetDeliveryListByDateRangeQuery(
                StartDate: startUtc,
                EndDate: endUtc);

            var records = await _mediator.Send(query, ct);
            if (records == null || records.Count == 0)
            {
                return BuildEmptyPayload(reportTitle, startLocal, endLocal, "Fuel Delivery Report");
            }

            // Resolve tank names
            var tankIds = records.Where(r => r.TankId > 0).Select(r => r.TankId).Distinct().ToList();
            var tankLookup = tankIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Tanks
                    .AsNoTracking()
                    .Where(t => tankIds.Contains(t.Id))
                    .ToDictionaryAsync(t => t.Id, t => t.Name ?? $"Tank {t.Id}", ct);

            // Resolve supplier names
            var supplierIds = records.Where(r => r.SupplierId > 0).Select(r => r.SupplierId).Distinct().ToList();
            var supplierLookup = supplierIds.Count == 0
                ? new Dictionary<int, string>()
                : await _context.Suppliers
                    .AsNoTracking()
                    .Where(s => supplierIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Name ?? $"Supplier {s.Id}", ct);

            var mapped = records.Select((r, i) =>
            {
                var volume = r.ManualDeliveryAmount;
                var cost = volume * (r.PricePerLiter ?? 0m);
                return new
                {
                    rowNumber = i + 1,
                    deliveryDate = FormatDate(r.DeliveryDate),
                    supplierName = supplierLookup.TryGetValue(r.SupplierId, out var sn) ? sn : "-",
                    tankName = tankLookup.TryGetValue(r.TankId, out var tn) ? tn : "-",
                    fuelGradeName = r.Product ?? "-",
                    volume = Fmt(volume),
                    cost = Fmt(cost),
                    siteName = "-",
                };
            }).ToList();

            var totalVolume = records.Sum(r => r.ManualDeliveryAmount);
            var totalCost = records.Sum(r => r.ManualDeliveryAmount * (r.PricePerLiter ?? 0m));
            var uniqueTanks = records.Where(r => r.TankId > 0).Select(r => r.TankId).Distinct().Count();

            return BuildPayload(reportTitle, startLocal, endLocal, mapped, new
            {
                totalRecords = mapped.Count,
                totalDeliveries = mapped.Count,
                totalVolume = Fmt(totalVolume),
                totalCost = Fmt(totalCost),
                uniqueTanks,
            });
        }

        // ─── Pump Transaction ───────────────────────────────────────────────────────

        private async Task<object?> BuildPumpTransactionPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var siteIds = ParseIntList(metadata["siteIds"]);
            var tankIds = ParseIntList(metadata["tankIds"]);
            var vehicleIds = ParseIntList(metadata["vehicleIds"]);

            var query = new GetPumpTransactionQuery
            {
                StartDate = startUtc,
                EndDate = endUtc,
                SiteIds = siteIds.Count > 0 ? siteIds : null,
                TankIds = tankIds.Count > 0 ? tankIds : null,
                VehicleIds = vehicleIds.Count > 0 ? vehicleIds : null,
            };

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                _logger.LogWarning("PumpTransaction query failed for scheduled report: {Msg}", result.Message);
                return BuildEmptyPayload(reportTitle, startLocal, endLocal, "Pump Transaction Report");
            }

            var records = result.Data.ToList();
            var mapped = records.Select((t, i) => new
            {
                rowNumber = i + 1,
                dateTime = t.DateTime.ToString("yyyy-MM-dd HH:mm"),
                vehicleName = t.VehicleName ?? "-",
                tankName = t.TankName ?? "-",
                volume = Fmt(t.Volume),
                amount = Fmt(t.Amount),
                siteName = t.SiteName ?? "-",
                fuelGradeName = t.FuelGradeName ?? "-",
            }).ToList();

            return BuildPayload(reportTitle, startLocal, endLocal, mapped, new
            {
                totalRecords = mapped.Count,
                totalTransactions = mapped.Count,
                totalVolume = Fmt(records.Sum(t => t.Volume)),
                totalAmount = Fmt(records.Sum(t => t.Amount)),
            });
        }

        // ─── Device Offline ─────────────────────────────────────────────────────────

        private async Task<object?> BuildDeviceOfflinePayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var query = new GetPtsDeviceOfflineReportQuery(
                startUtc,
                endUtc,
                metadata.Value<string>("deviceId"),
                GetIntParam(metadata, "minThresholdSeconds"));

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null || result.Data.Count == 0)
            {
                return BuildEmptyPayload(reportTitle, startLocal, endLocal, "Device Offline Report");
            }

            var flattened = new List<object>();
            foreach (var record in result.Data)
            {
                if (record.Periods == null || record.Periods.Count == 0)
                {
                    flattened.Add(new
                    {
                        deviceName = record.DeviceName ?? record.DeviceId ?? "-",
                        siteName = record.SiteName ?? "-",
                        offlineAt = FormatDateTime(record.Date),
                        onlineAt = "-",
                        duration = FormatDuration(record.TotalOfflineSeconds),
                        isOnline = false,
                    });
                    continue;
                }

                foreach (var period in record.Periods)
                {
                    flattened.Add(new
                    {
                        deviceName = record.DeviceName ?? record.DeviceId ?? "-",
                        siteName = record.SiteName ?? "-",
                        offlineAt = FormatDateTime(period.StartAt),
                        onlineAt = FormatDateTime(period.EndAt),
                        duration = FormatDuration(period.DurationSeconds),
                        isOnline = false,
                    });
                }
            }

            var totalOffline = result.Data.Sum(r => r.TotalOfflineSeconds);
            var uniqueDevices = result.Data.Select(r => r.DeviceId).Distinct().Count();

            return BuildPayload(reportTitle, startLocal, endLocal, flattened, new
            {
                totalRecords = flattened.Count,
                totalIncidents = flattened.Count,
                totalOfflineDuration = FormatDuration(totalOffline),
                uniqueDevices,
            });
        }

        // ─── PTS Device (current status – no date filter) ───────────────────────────

        private async Task<object?> BuildPtsDevicePayload(
            JObject metadata, string reportTitle, CancellationToken ct)
        {
            var query = new GetPTSDeviceListQuery();
            var devices = await _mediator.Send(query, ct);
            if (devices == null || devices.Count == 0)
            {
                return BuildEmptyPayload(reportTitle, DateTime.Now, DateTime.Now, "PTS Device Status Report");
            }

            var siteIds = ParseIntList(metadata["siteIds"]);
            var filtered = siteIds.Count > 0
                ? devices.Where(d => d.Site.HasValue && siteIds.Contains(d.Site.Value)).ToList()
                : devices;

            var mapped = filtered.Select((d, i) => new
            {
                rowNumber = i + 1,
                deviceId = d.Ptsid ?? "-",
                deviceName = d.PtsName ?? d.Ptsid ?? "-",
                siteName = d.SiteNavigation?.Name ?? "-",
                ipAddress = d.Ipaddress ?? "-",
                port = d.PortNumber?.ToString() ?? "-",
                status = d.ConnectionStatus ?? "Unknown",
                isOnline = string.Equals(d.ConnectionStatus, "Connected", StringComparison.OrdinalIgnoreCase),
                lastHeartbeat = FormatDateTime(d.LastActivity),
            }).ToList();

            var onlineCount = mapped.Count(d => (bool)((dynamic)d).isOnline);

            return new
            {
                reportTitle = reportTitle ?? "PTS Device Status Report",
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                records = mapped,
                data = mapped,
                items = mapped,
                transactions = mapped,
                summary = new
                {
                    totalRecords = mapped.Count,
                    totalDevices = mapped.Count,
                    onlineDevices = onlineCount,
                    offlineDevices = mapped.Count - onlineCount,
                },
            };
        }

        // ─── Issue Tracker ──────────────────────────────────────────────────────────

        private async Task<object?> BuildIssueTrackerPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var siteIds = ParseIntList(metadata["siteIds"]);
            var vehicleIds = ParseIntList(metadata["vehicleIds"]);

            var query = new GetIssueTrackerReportQuery
            {
                DateFrom = startUtc,
                DateTo = endUtc,
                SiteIds = siteIds.Count > 0 ? siteIds : null,
                VehicleIds = vehicleIds.Count > 0 ? vehicleIds : null,
                PageNumber = 1,
                PageSize = 10000,
            };

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                _logger.LogWarning("IssueTracker query failed for scheduled report: {Msg}", result.Message);
                return BuildEmptyPayload(reportTitle, startLocal, endLocal, "Issue Tracker Report");
            }

            var records = result.Data.Records ?? new List<Application.Features.IssueTracker.DTOs.IssueTrackerReportRowDto>();
            var mapped = records.Select((r, i) => new
            {
                rowNumber = i + 1,
                openDate = FormatDate(r.OpenDate),
                dueDate = FormatDate(r.DueDate),
                closingDate = FormatDate(r.ClosingDate),
                siteName = r.SiteName ?? "-",
                vehicleNumber = r.VehicleNumber ?? r.VehicleHyoungNo ?? "-",
                categoryName = r.CategoryName ?? "-",
                statusName = r.StatusName ?? "-",
                priorityName = r.PriorityName ?? "-",
                problemTitle = r.ProblemTitle ?? "-",
                assignToUserName = r.AssignToUserName ?? r.AssignToUserNames ?? "-",
                isAutoCreated = r.IsAutoCreated,
            }).ToList();

            return BuildPayload(reportTitle, startLocal, endLocal, mapped, new
            {
                totalRecords = mapped.Count,
                totalIssues = mapped.Count,
                openIssues = result.Data.OpenIssues,
                closedIssues = result.Data.ClosedIssues,
                autoCreatedIssues = result.Data.AutoCreatedIssues,
            });
        }

        // ─── Live Trip Operations ─────────────────────────────────────────────────

        private async Task<object?> BuildLiveTripOperationsPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var query = new GetVehicleTripLiveOperationsReportQuery
            {
                VehicleId = GetIntParam(metadata, "vehicleId"),
                SiteId = GetIntParam(metadata, "siteId"),
                StartDate = startUtc,
                EndDate = endUtc,
                IdleThresholdMinutes = GetIntParam(metadata, "idleThresholdMinutes") ?? 15,
            };

            var result = await _mediator.Send(query, ct);
            if (!result.IsSuccess || result.Data == null)
            {
                _logger.LogWarning("Live trip operations query failed for scheduled report: {Msg}", result.Message);
                return BuildEmptyLiveTripOperationsPayload(reportTitle, startLocal, endLocal, query.IdleThresholdMinutes);
            }

            return BuildLiveTripOperationsPayload(result.Data, reportTitle, startLocal, endLocal);
        }

        // ─── Helpers ────────────────────────────────────────────────────────────────

        private static object BuildPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            object records,
            object summary)
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

        private static object BuildConsumptionPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            object records,
            object summary,
            string distanceHeader,
            string consumptionHeader,
            string distanceSummaryLabel,
            string avgConsumptionLabel,
            string consumptionModeLabel)
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
                distanceHeader,
                consumptionHeader,
                distanceSummaryLabel,
                avgConsumptionLabel,
                consumptionModeLabel,
                records,
                data = records,
                items = records,
                transactions = records,
                summary,
            };
        }

        private static object BuildEmptyPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            string fallbackTitle)
        {
            var title = string.IsNullOrWhiteSpace(reportTitle) ? fallbackTitle : reportTitle;
            return BuildPayload(title, startLocal, endLocal,
                Array.Empty<object>(),
                new { totalRecords = 0 });
        }

        private static object BuildEmptyLiveTripOperationsPayload(
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal,
            int idleThresholdMinutes)
        {
            return new
            {
                reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Live Trip Operations Report" : reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                idleThresholdMinutes,
                travelingVehicles = Array.Empty<object>(),
                activeTrips = Array.Empty<object>(),
                tripCounts = Array.Empty<object>(),
                tipperCycles = Array.Empty<object>(),
                idleOutsideWorkZones = Array.Empty<object>(),
                records = Array.Empty<object>(),
                data = Array.Empty<object>(),
                items = Array.Empty<object>(),
                transactions = Array.Empty<object>(),
                summary = new
                {
                    vehiclesCurrentlyTravelingCount = 0,
                    activeTripsInProgressCount = 0,
                    vehiclesWithTripCountsCount = 0,
                    liveTipperCycleVehicleCount = 0,
                    vehiclesIdleOutsideWorkZonesCount = 0,
                    totalTripGroups = 0,
                    totalTripLegs = 0,
                    totalActiveDistanceDisplay = "0.00 km",
                    totalActiveDurationDisplay = "0.0 min",
                },
            };
        }

        private static object BuildLiveTripOperationsPayload(
            VehicleTripLiveOperationsReportDTO payload,
            string reportTitle,
            DateTime startLocal,
            DateTime endLocal)
        {
            var travelingVehicles = payload.VehiclesCurrentlyTraveling
                .Select((item, index) => new
                {
                    rowNumber = index + 1,
                    vehicleLabel = item.VehicleLabel,
                    numberPlate = item.NumberPlate ?? "-",
                    movementProfileLabel = FormatMovementProfile(item.MovementProfile),
                    detectionMode = item.DetectionMode,
                    originDisplayName = item.OriginDisplayName,
                    destinationDisplayName = item.DestinationDisplayName,
                    startedAtLocal = FormatDateTime(item.StartedAtUtc),
                    lastUpdatedAtLocal = FormatDateTime(item.LastUpdatedAtUtc),
                    durationDisplay = $"{Fmt(item.DurationMinutes)} min",
                    distanceDisplay = $"{Fmt(item.DistanceKm)} km",
                    confidenceBand = item.ConfidenceBand,
                })
                .ToList();

            var activeTrips = payload.ActiveTripsInProgress
                .Select((item, index) => new
                {
                    rowNumber = index + 1,
                    vehicleLabel = item.VehicleLabel,
                    movementProfileLabel = FormatMovementProfile(item.MovementProfile),
                    routeLabel = $"{item.OriginDisplayName} → {item.DestinationDisplayName}",
                    startedAtLocal = FormatDateTime(item.StartedAtUtc),
                    lastUpdatedAtLocal = FormatDateTime(item.LastUpdatedAtUtc),
                    durationDisplay = $"{Fmt(item.DurationMinutes)} min",
                    distanceDisplay = $"{Fmt(item.DistanceKm)} km",
                    fuelConsumedDisplay = item.FuelConsumed.HasValue ? $"{Fmt(item.FuelConsumed)} L" : "N/A",
                    confidenceBand = item.ConfidenceBand,
                    anomalyFlagsLabel = FormatAnomalyFlags(item.AnomalyFlags),
                    outOfBoundsLabel = item.IsOutOfBounds == true ? "Yes" : "No",
                })
                .ToList();

            var tripCounts = payload.TripCountsPerVehicle
                .Select((item, index) => new
                {
                    rowNumber = index + 1,
                    vehicleLabel = item.VehicleLabel,
                    tripGroupCount = item.TripGroupCount,
                    tripLegCount = item.TripLegCount,
                    activeTripCount = item.ActiveTripCount,
                    loadCycleCount = item.LoadCycleCount,
                    roundTripCount = item.RoundTripCount,
                    totalDistanceDisplay = $"{Fmt(item.TotalDistanceKm)} km",
                })
                .ToList();

            var tipperCycles = payload.LiveTipperCycleCounts
                .Select((item, index) => new
                {
                    rowNumber = index + 1,
                    vehicleLabel = item.VehicleLabel,
                    totalCycleCount = item.TotalCycleCount,
                    completedCycleCount = item.CompletedCycleCount,
                    activeCycleCount = item.ActiveCycleCount,
                    totalDistanceDisplay = $"{Fmt(item.TotalDistanceKm)} km",
                    lastCycleStartedAtLocal = item.LastCycleStartedAtUtc.HasValue ? FormatDateTime(item.LastCycleStartedAtUtc.Value) : "-",
                })
                .ToList();

            var idleOutsideWorkZones = payload.VehiclesIdleOutsideWorkZones
                .Select((item, index) => new
                {
                    rowNumber = index + 1,
                    vehicleLabel = item.VehicleLabel,
                    locationDisplayName = item.LocationDisplayName,
                    startedAtLocal = FormatDateTime(item.StartedAtUtc),
                    lastUpdatedAtLocal = FormatDateTime(item.LastUpdatedAtUtc),
                    idleMinutesDisplay = $"{Fmt(item.IdleMinutes)} min",
                    flagSource = item.OffSiteIdleSuspected ? "Off-site idle anomaly" : "Out-of-bounds flag",
                    anomalyFlagsLabel = FormatAnomalyFlags(item.AnomalyFlags),
                })
                .ToList();

            return new
            {
                reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Live Trip Operations Report" : reportTitle,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = "System (Scheduled)",
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                dateFrom = startLocal.ToString("yyyy-MM-dd"),
                dateTo = endLocal.ToString("yyyy-MM-dd"),
                startDate = startLocal.ToString("yyyy-MM-dd"),
                endDate = endLocal.ToString("yyyy-MM-dd"),
                idleThresholdMinutes = payload.IdleThresholdMinutes,
                travelingVehicles,
                activeTrips,
                tripCounts,
                tipperCycles,
                idleOutsideWorkZones,
                records = activeTrips,
                data = activeTrips,
                items = activeTrips,
                transactions = activeTrips,
                summary = new
                {
                    vehiclesCurrentlyTravelingCount = payload.Summary.VehiclesCurrentlyTravelingCount,
                    activeTripsInProgressCount = payload.Summary.ActiveTripsInProgressCount,
                    vehiclesWithTripCountsCount = payload.Summary.VehiclesWithTripCountsCount,
                    liveTipperCycleVehicleCount = payload.Summary.LiveTipperCycleVehicleCount,
                    vehiclesIdleOutsideWorkZonesCount = payload.Summary.VehiclesIdleOutsideWorkZonesCount,
                    totalTripGroups = payload.Summary.TotalTripGroups,
                    totalTripLegs = payload.Summary.TotalTripLegs,
                    totalActiveDistanceDisplay = $"{Fmt(payload.Summary.TotalActiveDistanceKm)} km",
                    totalActiveDurationDisplay = $"{Fmt(payload.Summary.TotalActiveDurationMinutes)} min",
                },
            };
        }

        private static int? GetIntParam(JObject metadata, string key)
        {
            var value = metadata.Value<int?>(key);
            return value.HasValue && value.Value > 0 ? value : null;
        }

        private static bool? GetBoolParam(JObject metadata, string key)
        {
            if (!metadata.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out var token) || token == null)
            {
                return null;
            }

            if (token.Type == JTokenType.Boolean)
            {
                return token.Value<bool>();
            }

            if (bool.TryParse(token.ToString(), out var parsed))
            {
                return parsed;
            }

            if (int.TryParse(token.ToString(), out var numeric))
            {
                return numeric != 0;
            }

            return null;
        }

        private static (string DistanceHeader, string ConsumptionHeader, string DistanceSummaryLabel, string AvgConsumptionLabel, string ConsumptionModeLabel, string DistanceUnit, string ConsumptionUnit)
            BuildConsumptionLabels(bool? requestedAverageKmL, IEnumerable<bool>? rowModes)
        {
            var resolvedMode = requestedAverageKmL switch
            {
                true => "km",
                false => "hr",
                null => ResolveConsumptionMode(rowModes),
            };

            return resolvedMode switch
            {
                "km" => (
                    "Distance (km)",
                    "km/L",
                    "Total Distance",
                    "Avg km/L",
                    "KM/L Vehicles",
                    "km",
                    "km/L"),
                "hr" => (
                    "Engine Hours (hr)",
                    "L/hr",
                    "Total Engine Hours",
                    "Avg L/hr",
                    "L/hr Equipment",
                    "hr",
                    "L/hr"),
                _ => (
                    "Distance / Engine Hours",
                    "Consumption",
                    "Total Distance / Engine Hours",
                    "Avg Consumption",
                    "All Vehicles",
                    string.Empty,
                    string.Empty),
            };
        }

        private static string ResolveConsumptionMode(IEnumerable<bool>? rowModes)
        {
            if (rowModes == null)
            {
                return "mixed";
            }

            var modes = rowModes.ToList();
            if (modes.Count == 0)
            {
                return "mixed";
            }

            if (modes.All(mode => mode))
            {
                return "km";
            }

            if (modes.All(mode => !mode))
            {
                return "hr";
            }

            return "mixed";
        }

        private static List<int> ParseIntList(JToken? token)
        {
            if (token == null) return new List<int>();

            if (token is JArray arr)
            {
                return arr
                    .Select(v => int.TryParse(v?.ToString(), out var n) && n > 0 ? n : 0)
                    .Where(n => n > 0)
                    .ToList();
            }

            var raw = token.ToString();
            return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s.Trim(), out var n) && n > 0 ? n : 0)
                .Where(n => n > 0)
                .ToList();
        }

        private static string Fmt(decimal? value)
        {
            return value?.ToString("#,##0.00", CultureInfo.InvariantCulture) ?? "0.00";
        }

        private static string FormatDate(DateTime? value)
        {
            return value?.ToString("yyyy-MM-dd") ?? "-";
        }

        private static string FormatDateTime(DateTime? value)
        {
            return value?.ToString("yyyy-MM-dd HH:mm:ss") ?? "-";
        }

        private static string FormatDuration(int totalSeconds)
        {
            var seconds = Math.Max(0, totalSeconds);
            var hours = seconds / 3600;
            var minutes = (seconds % 3600) / 60;
            var secs = seconds % 60;
            if (hours > 0) return $"{hours}h {minutes}m {secs}s";
            if (minutes > 0) return $"{minutes}m {secs}s";
            return $"{secs}s";
        }

        private static string? InferSourceIdFromTemplate(string templateName)
        {
            var name = templateName.Trim().ToLowerInvariant();
            // Template names follow the pattern: {sourceId}-report
            // e.g., "fuel-refill-report" → "fuel-refill"
            if (name.EndsWith("-report"))
            {
                var candidate = name[..^7]; // remove "-report"
                if (_supportedSourceIds.Contains(candidate))
                    return candidate;
            }

            // Also check explicit mappings for templates that don't follow the pattern
            return name switch
            {
                "fuel-refill-report" => "fuel-refill",
                "vehicle-consumption-report" => "vehicle-consumption",
                "consumption-by-refills-report" => "consumption-by-refills",
                "fuel-delivery-report" => "delivery",
                "pump-transaction-report" => "pump-transaction",
                "device-offline-report" => "device-offline",
                "pts-device-status-report" => "pts-device",
                "issue-tracker-report" => "issue-tracker",
                "live-trip-operations-report" => "live-trip-operations",
                "alarm-report" => "alarm-report",
                _ => null,
            };
        }

        private static string? InferSourceIdFromReportType(string reportType)
        {
            return reportType.Trim().ToLowerInvariant() switch
            {
                "fuelrefill" or "fuel-refill" => "fuel-refill",
                "vehicleconsumption" or "vehicle-consumption" => "vehicle-consumption",
                "consumptionbyrefill" or "consumptionbyrefills" or "consumption-by-refills" => "consumption-by-refills",
                "delivery" or "fueldelivery" or "fuel-delivery" => "delivery",
                "pumptransaction" or "pump-transaction" => "pump-transaction",
                "ptsdeviceoffline" or "deviceoffline" or "device-offline" => "device-offline",
                "ptsdevice" or "ptsdevicestatus" or "pts-device" => "pts-device",
                "issuetracker" or "issue-tracker" => "issue-tracker",
                "livetripoperations" or "live-trip-operations" => "live-trip-operations",
                "tankleveldetail" or "tank-level-detail" => "tank-level-detail",
                "storagereceivedvsdispensed" or "storage-received-vs-dispensed" => "storage-received-vs-dispensed",
                "alarmreport" or "alarm-report" => "alarm-report",
                _ => null,
            };
        }

        private static string FormatMovementProfile(VehicleMovementProfile movementProfile)
        {
            return movementProfile switch
            {
                VehicleMovementProfile.Cluster => "Cluster",
                VehicleMovementProfile.Geofence => "Geofence",
                _ => movementProfile.ToString(),
            };
        }

        private static string FormatAnomalyFlags(VehicleTripAnomalyType anomalyFlags)
        {
            if (anomalyFlags == VehicleTripAnomalyType.None)
            {
                return "None";
            }

            var labels = new List<string>();
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.LowConfidence)) labels.Add("Low Confidence");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.UnknownOriginOrDestination)) labels.Add("Unknown Origin / Destination");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.GpsGapSuspected)) labels.Add("GPS Gap Suspected");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.OffSiteIdleSuspected)) labels.Add("Off-Site Idle Suspected");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.UnmatchedReturn)) labels.Add("Unmatched Return");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.MissingFuelData)) labels.Add("Missing Fuel Data");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.NegativeFuelConsumption)) labels.Add("Negative Fuel Consumption");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.UnrealisticSpeed)) labels.Add("Unrealistic Speed");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.AsymmetricCycle)) labels.Add("Asymmetric Cycle");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.NoReturnToOrigin)) labels.Add("No Return To Origin");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.WeakFuelData)) labels.Add("Weak Fuel Data");
            if (anomalyFlags.HasFlag(VehicleTripAnomalyType.SuspiciousFuelRate)) labels.Add("Suspicious Fuel Rate");

            return labels.Count == 0 ? "None" : string.Join(", ", labels);
        }
    }
}
