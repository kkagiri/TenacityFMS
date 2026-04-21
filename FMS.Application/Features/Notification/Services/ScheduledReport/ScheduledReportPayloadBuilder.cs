/**
 * File: ScheduledReportPayloadBuilder.cs
 * Purpose: Fetches data via MediatR and builds template-ready payloads for all report types.
 *          Used by ScheduledReportDeliveryService to generate attachments for scheduled reports.
 * Dependencies: IMediator, GpsdataContext, MediatR queries for each report source
 * Last Modified: 2026-04-16
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
    public partial class ScheduledReportPayloadBuilder
    {
        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly ILogger<ScheduledReportPayloadBuilder> _logger;
        private readonly OperationalReportPayloadBuilder _operationalReportPayloadBuilder;
        private readonly FleetExecutiveReportPayloadBuilder _fleetExecutiveReportPayloadBuilder;

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
            "monthly-fleet-report",
            "weekly-fleet-report",
        };

        public ScheduledReportPayloadBuilder(
            IMediator mediator,
            GpsdataContext context,
            ILogger<ScheduledReportPayloadBuilder> logger,
            OperationalReportPayloadBuilder operationalReportPayloadBuilder,
            FleetExecutiveReportPayloadBuilder fleetExecutiveReportPayloadBuilder)
        {
            _mediator = mediator;
            _context = context;
            _logger = logger;
            _operationalReportPayloadBuilder = operationalReportPayloadBuilder;
            _fleetExecutiveReportPayloadBuilder = fleetExecutiveReportPayloadBuilder;
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
                    "vehicle-consumption-gps" => await BuildVehicleConsumptionGpsPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "delivery" => await BuildDeliveryPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "pump-transaction" => await BuildPumpTransactionPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "device-offline" => await BuildDeviceOfflinePayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "pts-device" => await BuildPtsDevicePayload(metadata, reportTitle, cancellationToken),
                    "issue-tracker" => await BuildIssueTrackerPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "live-trip-operations" => await BuildLiveTripOperationsPayload(metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "tank-level-detail" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "storage-received-vs-dispensed" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "alarm-report" => await _operationalReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "monthly-fleet-report" => await _fleetExecutiveReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
                    "weekly-fleet-report" => await _fleetExecutiveReportPayloadBuilder.FetchAndBuildAsync(sourceId, metadata, windowStartUtc, windowEndUtc, windowStartLocal, windowEndLocal, reportTitle, cancellationToken),
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
            var includeDriverColumn = GetBoolParam(metadata, "includeDriverColumn") ?? false;
            var includePassengerColumn = GetBoolParam(metadata, "includePassengerColumn") ?? false;
            var sortBy = GetStringParam(metadata, "sortBy");
            var sortDirection = GetStringParam(metadata, "sortDirection");
            var siteIds = ParseIntList(metadata["siteIds"]);
            var singleSiteId = GetIntParam(metadata, "siteId");
            if (singleSiteId.HasValue && !siteIds.Contains(singleSiteId.Value))
            {
                siteIds.Add(singleSiteId.Value);
            }

            var query = new Application.Queries.Database.FMSQuery.Consumption.GetVehicleConsumptionManualRefillQueryFiltered(
                StartDate: startUtc,
                EndDate: endUtc,
                SiteId: singleSiteId,
                SiteIds: siteIds.Count > 0 ? siteIds : null,
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
                        consumptionModeLabel,
                        includeDriverColumn,
                        includePassengerColumn);
            }

            var orderedRecords = SortVehicleConsumptionRecords(records, sortBy, sortDirection);

            (distanceHeader, consumptionHeader, distanceSummaryLabel, avgConsumptionLabel, consumptionModeLabel, distanceUnit, consumptionUnit) =
                BuildConsumptionLabels(averageKmL, orderedRecords.Select(r => r.IsKmL));

            var mapped = orderedRecords.Select((r, i) => new
            {
                rowNumber = i + 1,
                vehicleName = r.HyoungNo ?? r.VehicleInfo ?? "-",
                numberPlate = r.HyoungNo ?? "-",
                vehicleType = r.VehicleType ?? "-",
                siteName = r.WorkingSiteName ?? "-",
                driverName = string.IsNullOrWhiteSpace(r.DriverName) ? "-" : r.DriverName,
                passenger = string.IsNullOrWhiteSpace(r.Passenger) ? "-" : r.Passenger,
                refillCount = r.RefillCount,
                volume = Fmt(r.TotalFuelAmount),
                totalVolume = Fmt(r.TotalFuelAmount),
                volumeRaw = r.TotalFuelAmount,
                distance = Fmt(r.DistanceOrEngineHours),
                totalDistance = Fmt(r.DistanceOrEngineHours),
                distanceRaw = r.DistanceOrEngineHours,
                distanceDisplay = $"{Fmt(r.DistanceOrEngineHours)} {(r.IsKmL ? "km" : "hr")}",
                consumption = Fmt(r.Consumption),
                consumptionDisplay = $"{Fmt(r.Consumption)} {(r.IsKmL ? "km/L" : "L/hr")}",
                consumptionRaw = r.Consumption,
                expectedAverage = Fmt(r.ExpectedAverage),
                expectedAverageDisplay = r.ExpectedAverage > 0
                    ? $"{Fmt(r.ExpectedAverage)} {(r.IsKmL ? "km/L" : "L/hr")}"
                    : "-",
                distanceUnit = r.IsKmL ? "km" : "hr",
                consumptionUnit = r.IsKmL ? "km/L" : "L/hr",
                isKmL = r.IsKmL,
                cost = "0.00",
                costRaw = 0m,
            }).ToList();

            var siteGroups = BuildVehicleConsumptionSiteGroups(mapped);

            var totalVolume = orderedRecords.Sum(r => r.TotalFuelAmount);
            var totalDistance = orderedRecords.Sum(r => r.DistanceOrEngineHours);
            var avgConsumption = orderedRecords.Count > 0 ? orderedRecords.Average(r => r.Consumption) : 0m;
            var validDistanceRows = orderedRecords.Where(r => r.DistanceOrEngineHours > 0).ToList();
            var validKmRows = validDistanceRows.Where(r => r.IsKmL).ToList();
            var validHrRows = validDistanceRows.Where(r => !r.IsKmL).ToList();
            var totalDistanceKm = validKmRows.Sum(r => r.DistanceOrEngineHours);
            var totalEngineHours = validHrRows.Sum(r => r.DistanceOrEngineHours);
            var avgConsumptionKmL = validKmRows.Count > 0 ? validKmRows.Average(r => r.Consumption) : 0m;
            var avgConsumptionLHr = validHrRows.Count > 0 ? validHrRows.Average(r => r.Consumption) : 0m;
            var validExpectedRows = orderedRecords.Where(r => r.ExpectedAverage > 0).ToList();
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
            consumptionModeLabel,
            includeDriverColumn,
            includePassengerColumn,
            siteGroups);
        }

        // ─── Vehicle Consumption GPS ────────────────────────────────────────────────

        private async Task<object?> BuildVehicleConsumptionGpsPayload(
            JObject metadata, DateTime startUtc, DateTime endUtc,
            DateTime startLocal, DateTime endLocal, string reportTitle,
            CancellationToken ct)
        {
            var averageKmL = GetBoolParam(metadata, "averageKmL");
            var siteIds = ParseIntList(metadata["siteIds"]);
            var singleSiteId = GetIntParam(metadata, "siteId");
            if (singleSiteId.HasValue && !siteIds.Contains(singleSiteId.Value))
            {
                siteIds.Add(singleSiteId.Value);
            }

            var query = new Application.Queries.Database.FMSQuery.Consumption.GetVehicleConsumptionGpsQueryFiltered(
                StartDate: startUtc,
                EndDate: endUtc,
                SiteId: singleSiteId,
                SiteIds: siteIds.Count > 0 ? siteIds : null,
                VehicleTypeId: GetIntParam(metadata, "vehicleTypeId"),
                VehicleId: GetIntParam(metadata, "vehicleId"),
                AverageKmL: averageKmL);

            var (distanceHeader, consumptionHeader, distanceSummaryLabel, avgConsumptionLabel, consumptionModeLabel, distanceUnit, consumptionUnit) =
                BuildConsumptionLabels(averageKmL, null);

            var records = await _mediator.Send(query, ct);
            if (records == null || records.Count == 0)
            {
                return BuildConsumptionPayload(
                    string.IsNullOrWhiteSpace(reportTitle) ? "Vehicle Consumption (GPS) Report" : reportTitle,
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
                    consumptionModeLabel,
                    false,
                    false);
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
                refillCount = r.RecordCount,
                volume = Fmt(r.TotalFuelAmount),
                totalVolume = Fmt(r.TotalFuelAmount),
                volumeRaw = r.TotalFuelAmount,
                distance = Fmt(r.DistanceOrEngineHours),
                totalDistance = Fmt(r.DistanceOrEngineHours),
                distanceRaw = r.DistanceOrEngineHours,
                distanceDisplay = $"{Fmt(r.DistanceOrEngineHours)} {(r.IsKmL ? "km" : "hr")}",
                consumption = Fmt(r.Consumption),
                consumptionDisplay = $"{Fmt(r.Consumption)} {(r.IsKmL ? "km/L" : "L/hr")}",
                consumptionRaw = r.Consumption,
                expectedAverage = Fmt(r.ExpectedAverage),
                expectedAverageDisplay = r.ExpectedAverage > 0
                    ? $"{Fmt(r.ExpectedAverage)} {(r.IsKmL ? "km/L" : "L/hr")}"
                    : "-",
                distanceUnit = r.IsKmL ? "km" : "hr",
                consumptionUnit = r.IsKmL ? "km/L" : "L/hr",
                isKmL = r.IsKmL,
                cost = "0.00",
                costRaw = 0m,
            }).ToList();

            var siteGroups = BuildVehicleConsumptionSiteGroups(mapped);

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
            consumptionModeLabel,
            false,
            false,
            siteGroups);
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

            var onlineCount = mapped.Count(d => d.isOnline);

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

    }
}
