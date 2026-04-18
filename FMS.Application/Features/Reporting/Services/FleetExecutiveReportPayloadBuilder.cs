/**
 * File: FleetExecutiveReportPayloadBuilder.cs
 * Purpose: Builds monthly and weekly fleet executive PDF report payloads from persisted fleet and tank data.
 * Dependencies: GpsdataContext, EF Core, Newtonsoft.Json.Linq
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - CanHandle(): Determines whether a report source belongs to the fleet executive suite
 * - FetchAndBuildAsync(): Loads persisted fleet/tank metrics and builds a template-ready executive payload
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.Reporting.Services
{
    public class FleetExecutiveReportPayloadBuilder
    {
        private const int MonthlyTrendWindow = 5;
        private const int MaxSitesPerMatrix = 8;
        private const int MaxLvTypesPerMatrix = 5;
        private const int MaxHeTypesPerMatrix = 5;
        private readonly GpsdataContext _context;

        public FleetExecutiveReportPayloadBuilder(GpsdataContext context)
        {
            _context = context;
        }

        public bool CanHandle(string? sourceId)
        {
            return sourceId is "monthly-fleet-report" or "weekly-fleet-report";
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
            var monthAnchor = new DateTime(windowStartLocal.Year, windowStartLocal.Month, 1);
            var monthEnd = EndOfMonth(monthAnchor);
            var reportData = await LoadReportDataAsync(monthAnchor, monthEnd, cancellationToken);
            var filters = ResolveFilters(metadata, reportData);
            var filteredData = ApplyFilters(reportData, filters);

            return sourceId switch
            {
                "monthly-fleet-report" => BuildMonthlyPayload(metadata, filteredData, reportTitle, filters),
                "weekly-fleet-report" => BuildWeeklyPayload(metadata, filteredData, reportTitle, filters),
                _ => BuildEmptyPayload(reportTitle, windowStartLocal, windowEndLocal),
            };
        }

        private async Task<ReportDataBundle> LoadReportDataAsync(DateTime monthAnchor, DateTime monthEnd, CancellationToken cancellationToken)
        {
            var trendStart = monthAnchor.AddMonths(-(MonthlyTrendWindow - 1));
            var allSites = await _context.Sites
                .AsNoTracking()
                .Select(site => new SiteLookup(site.Id, NormalizeLabel(site.Name)))
                .ToListAsync(cancellationToken);

            var siteLookup = allSites.ToDictionary(site => site.SiteId, site => site.SiteName);
            var expectedAverageLookup = await _context.Expectedaverages
                .AsNoTracking()
                .Select(item => new { item.Id, item.ExpectedAverageValue })
                .ToDictionaryAsync(item => item.Id, item => item.ExpectedAverageValue, cancellationToken);

            var vehicleSnapshots = await _context.Vehicles
                .AsNoTracking()
                .Include(vehicle => vehicle.VehicleType)
                .Select(vehicle => new VehicleSnapshot(
                    vehicle.VehicleId,
                    vehicle.HyoungNo,
                    vehicle.VehicleTypeId,
                    NormalizeLabel(vehicle.VehicleType != null ? vehicle.VehicleType.Name : null),
                    vehicle.WorkingSiteId,
                    ResolveSiteName(siteLookup, vehicle.WorkingSiteId),
                    vehicle.AverageKmL,
                    vehicle.DefaultExptdAvgid.HasValue && expectedAverageLookup.ContainsKey(vehicle.DefaultExptdAvgid.Value)
                        ? expectedAverageLookup[vehicle.DefaultExptdAvgid.Value]
                        : 0m))
                .ToListAsync(cancellationToken);

            var vehicleLookup = vehicleSnapshots.ToDictionary(vehicle => vehicle.VehicleId);

            var consumptionRows = await _context.Vehicleconsumptions
                .AsNoTracking()
                .Where(row => row.Date >= trendStart && row.Date <= monthEnd)
                .Select(row => new ConsumptionRow(
                    row.VehicleId,
                    row.SiteId,
                    row.Date,
                    row.TotalFuel ?? 0m,
                    row.TotalDistance ?? 0m,
                    row.EngHours ?? 0m,
                    row.FuelLost ?? 0m,
                    row.IsKmperLiter == 1UL))
                .ToListAsync(cancellationToken);

            var tankSiteLookup = await _context.Tanks
                .AsNoTracking()
                .Select(tank => new { tank.Id, tank.SiteId })
                .ToDictionaryAsync(
                    tank => tank.Id,
                    tank => ResolveSiteName(siteLookup, tank.SiteId),
                    cancellationToken);

            var openingTankBoundaries = await LoadLatestTankRowsAtOrBeforeAsync(monthAnchor, cancellationToken);
            var closingTankBoundaries = await LoadLatestTankRowsAtOrBeforeAsync(monthEnd, cancellationToken);

            var tankRows = await _context.TankVolumeHistories
                .AsNoTracking()
                .Where(row => row.Timestamp >= trendStart && row.Timestamp <= monthEnd && (row.IsDeleted == null || row.IsDeleted == false))
                .Select(row => new TankMovementRow(
                    row.Id,
                    row.TankId ?? 0,
                    row.Timestamp,
                    row.ChangeReason,
                    row.VolumeChange ?? 0m,
                    row.NewVolume ?? 0m))
                .ToListAsync(cancellationToken);

            return new ReportDataBundle(monthAnchor, monthEnd, siteLookup, vehicleLookup, consumptionRows, tankRows, tankSiteLookup, openingTankBoundaries, closingTankBoundaries);
        }

        private object BuildMonthlyPayload(JObject metadata, ReportDataBundle data, string reportTitle, ReportFilters filters)
        {
            var now = DateTime.Now;
            var currentMonthConsumption = FilterMonth(data.ConsumptionRows, data.MonthAnchor);
            var currentMonthTankRows = FilterMonth(data.TankRows, data.MonthAnchor);
            var siteNames = SelectSiteNames(data, currentMonthConsumption, currentMonthTankRows, filters);
            var lvTypeNames = SelectVehicleTypes(currentMonthConsumption, data.VehicleLookup, isKmL: true, MaxLvTypesPerMatrix, filters);
            var heTypeNames = SelectVehicleTypes(currentMonthConsumption, data.VehicleLookup, isKmL: false, MaxHeTypesPerMatrix, filters);
            var monthlyTrend = BuildMonthlyTrend(data);
            var monthlySummaries = BuildRawMonthlySummaries(data);
            var stockControlRows = BuildStockControlRows(siteNames, data.TankRows, data.OpeningTankBoundaries, data.ClosingTankBoundaries, data.MonthAnchor, data.MonthEnd, data.TankSiteLookup);
            var stockSitePairs = BuildStockSitePairs(stockControlRows);
            var stockControlSummary = BuildStockControlSummary(stockControlRows);
            var stockControlHighlights = BuildStockControlHighlights(stockControlRows);
            var currentMonthSummary = BuildMonthSummary(data.MonthAnchor, currentMonthConsumption, currentMonthTankRows, data.VehicleLookup);
            var siteHighlights = BuildSiteHighlights(siteNames, currentMonthConsumption, currentMonthTankRows, data.SiteLookup, data.VehicleLookup, data.TankSiteLookup);
            var lvHighlights = BuildTypeHighlights(currentMonthConsumption.Where(row => row.IsKmL), data.VehicleLookup, MaxLvTypesPerMatrix, true);
            var heHighlights = BuildTypeHighlights(currentMonthConsumption.Where(row => !row.IsKmL), data.VehicleLookup, MaxHeTypesPerMatrix, false);
            var lastThreeMonths = Enumerable.Range(0, 3)
                .Select(offset => data.MonthAnchor.AddMonths(offset - 2))
                .ToList();

            return new
            {
                implementationStatus = "live-data-v1",
                reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Monthly Fleet Report" : reportTitle,
                reportSubtitle = "Hyoung & Co (EA) Ltd — Fleet Management System",
                generatedAt = now.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture),
                generatedBy = "System",
                reportId = $"MFR-{data.MonthAnchor:yyyy-MM}",
                periodBadge = data.MonthAnchor.ToString("MMMM yyyy", CultureInfo.InvariantCulture),
                periodLabel = $"{data.MonthAnchor:dd MMM yyyy} – {data.MonthEnd:dd MMM yyyy}",
                confidentialityLabel = "CONFIDENTIAL — Internal Use Only",
                filterSummary = new[]
                {
                    new { label = "Sites", value = filters.SiteName ?? (siteNames.Any() ? string.Join(", ", siteNames.Take(4)) + (siteNames.Count > 4 ? "..." : string.Empty) : "All Sites") },
                    new { label = "Light Vehicle Type", value = filters.LightVehicleTypeName ?? "All Light Vehicle Types" },
                    new { label = "Heavy Equipment Type", value = filters.HeavyEquipmentTypeName ?? "All Heavy Equipment Types" },
                    new { label = "Period", value = $"{data.MonthAnchor:dd MMM yyyy} – {data.MonthEnd:dd MMM yyyy}" },
                    new { label = "Data Mode", value = "vehicleconsumption + tankvolumehistory" },
                    new { label = "Report ID", value = $"MFR-{data.MonthAnchor:yyyy-MM}" }
                },
                coverKpis = new[]
                {
                    Kpi(FormatNumber(currentMonthSummary.TotalFuelUsed, "L"), "Total Fuel Used GPS"),
                    Kpi(FormatNumber(currentMonthSummary.TotalDistance, "km"), "Total Distance"),
                    Kpi(FormatNumber(currentMonthSummary.TotalEngineHours, "hrs"), "Engine Hours"),
                    Kpi($"{FormatNumber(currentMonthSummary.TotalFuelLost, "L")} / {FormatPercent(currentMonthSummary.FuelLostPercent)}", "Fuel Lost")
                },
                executiveKpis = new[]
                {
                    Kpi(FormatNumber(currentMonthSummary.TotalFuelUsed, "L"), "Total Fuel Used GPS", "Vehicle consumption ledger"),
                    Kpi(FormatNumber(currentMonthSummary.TotalDistance, "km"), "Total GPS Distance", "km/L fleet subset"),
                    Kpi(FormatNumber(currentMonthSummary.TotalEngineHours, "hrs"), "Total Engine Hours", "L/hr equipment subset"),
                    Kpi(FormatNumber(currentMonthSummary.TotalFuelLost, "L"), "Total Fuel Lost", "Persisted fuel-loss rows"),
                    Kpi(FormatRate(currentMonthSummary.KmPerLiter, "km/L"), "Fleet Avg Efficiency"),
                    Kpi(FormatRate(currentMonthSummary.LitersPerHour, "L/hr"), "Avg Fuel / Engine Hr"),
                    Kpi(FormatNumber(currentMonthSummary.TotalFuelReceived, "L"), "Total Fuel Received"),
                    Kpi(FormatNumber(currentMonthSummary.TotalFuelIssued, "L"), "Total Fuel Dispensed")
                },
                executiveNarrative = BuildMonthlyNarrative(currentMonthSummary, siteHighlights, lvHighlights, heHighlights, data.MonthAnchor),
                monthlyMatrix = monthlyTrend,
                monthlyMatrixTotals = BuildMonthlyMatrixTotals(monthlySummaries),
                chartDataJson = BuildChartDataJson(monthlySummaries, siteNames, currentMonthConsumption, currentMonthTankRows, data, lvTypeNames, heTypeNames),
                stockSitePairs,
                stockHighlights = siteHighlights,
                stockControlSummary,
                stockControlHighlights,
                lvFuelMatrix = BuildVehicleTypeMatrix(siteNames, lvTypeNames, currentMonthConsumption.Where(row => row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.LvFuel),
                lvEfficiencyMatrix = BuildVehicleTypeMatrix(siteNames, lvTypeNames, currentMonthConsumption.Where(row => row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.LvEfficiency),
                lvDistanceMatrix = BuildVehicleTypeMatrix(siteNames, lvTypeNames, currentMonthConsumption.Where(row => row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.LvDistance),
                heFuelLostMatrix = BuildVehicleTypeMatrix(siteNames, heTypeNames, currentMonthConsumption.Where(row => !row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.HeFuelLost),
                heEngineHoursMatrix = BuildVehicleTypeMatrix(siteNames, heTypeNames, currentMonthConsumption.Where(row => !row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.HeEngineHours),
                heEfficiencyMatrix = BuildVehicleTypeMatrix(siteNames, heTypeNames, currentMonthConsumption.Where(row => !row.IsKmL), data.SiteLookup, data.VehicleLookup, MatrixMode.HeEfficiency),
                siteUsageMatrix = BuildSiteUsageMatrix(siteNames, lastThreeMonths, data),
                fleetHighlights = new
                {
                    topSites = siteHighlights,
                    topLightVehicleTypes = lvHighlights,
                    topHeavyEquipmentTypes = heHighlights
                },
                chartNotes = new[]
                {
                    "Fuel dispensed/delivered data comes from tankvolumehistory with transfer rows excluded.",
                    "Light/heavy segmentation follows vehicle.Average_km_l / vehicleconsumption.IsKmPerLiter.",
                    "Expected averages come from expectedaverage via vehicle.DefaultExptdAVGId.",
                    "Type and site ordering is based on current-month persisted totals."
                }
            };
        }

        private object BuildWeeklyPayload(JObject metadata, ReportDataBundle data, string reportTitle, ReportFilters filters)
        {
            var now = DateTime.Now;
            var currentMonthConsumption = FilterMonth(data.ConsumptionRows, data.MonthAnchor);
            var currentMonthTankRows = FilterMonth(data.TankRows, data.MonthAnchor);
            var weekRanges = BuildWeekRanges(data.MonthAnchor, data.MonthEnd);
            var siteNames = SelectSiteNames(data, currentMonthConsumption, currentMonthTankRows, filters);
            var weeklySummaries = weekRanges.Select(range =>
            {
                var weekConsumption = currentMonthConsumption
                    .Where(row => row.Date.Date >= range.StartDate && row.Date.Date <= range.EndDate)
                    .ToList();
                var weekTankRows = currentMonthTankRows
                    .Where(row => row.Timestamp.Date >= range.StartDate && row.Timestamp.Date <= range.EndDate)
                    .ToList();
                var summary = BuildMonthSummary(range.StartDate, weekConsumption, weekTankRows, data.VehicleLookup);

                return new WeeklySummary(range.WeekNumber, range.WeekLabel, range.StartDate, range.EndDate, summary);
            }).ToList();

            var weeklyNarrative = BuildWeeklyNarrative(weeklySummaries, data.MonthAnchor);
            var lvHighlights = BuildWeeklyHighlights(weeklySummaries, isKmL: true);
            var heHighlights = BuildWeeklyHighlights(weeklySummaries, isKmL: false);

            return new
            {
                implementationStatus = "live-data-v1",
                reportTitle = string.IsNullOrWhiteSpace(reportTitle) ? "Weekly Fleet Report" : reportTitle,
                reportSubtitle = "Hyoung & Co (EA) Ltd — Fleet Management System",
                generatedAt = now.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture),
                generatedBy = "System",
                reportId = $"WFR-{data.MonthAnchor:yyyy-MM}",
                periodBadge = data.MonthAnchor.ToString("MMMM yyyy", CultureInfo.InvariantCulture),
                periodLabel = $"{data.MonthAnchor:dd MMM yyyy} – {data.MonthEnd:dd MMM yyyy}",
                confidentialityLabel = "CONFIDENTIAL — Internal Use Only",
                filterSummary = new[]
                {
                    new { label = "Sites", value = filters.SiteName ?? (siteNames.Any() ? string.Join(", ", siteNames.Take(4)) + (siteNames.Count > 4 ? "..." : string.Empty) : "All Sites") },
                    new { label = "Light Vehicle Type", value = filters.LightVehicleTypeName ?? "All Light Vehicle Types" },
                    new { label = "Heavy Equipment Type", value = filters.HeavyEquipmentTypeName ?? "All Heavy Equipment Types" },
                    new { label = "Month", value = data.MonthAnchor.ToString("MMMM yyyy", CultureInfo.InvariantCulture) },
                    new { label = "Weeks", value = string.Join(", ", weeklySummaries.Select(week => $"W{week.WeekNumber}")) },
                    new { label = "Report ID", value = $"WFR-{data.MonthAnchor:yyyy-MM}" }
                },
                coverKpis = new[]
                {
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalFuelUsed), "L"), "Fuel Used GPS"),
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalDistance), "km"), "Distance"),
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalEngineHours), "hrs"), "Engine Hours"),
                    Kpi(FormatPercent(SafePercent(weeklySummaries.Sum(week => week.Summary.TotalFuelLost), weeklySummaries.Sum(week => week.Summary.TotalFuelUsed))), "Fuel Lost")
                },
                executiveKpis = new[]
                {
                    Kpi(weeklySummaries.Count.ToString(CultureInfo.InvariantCulture), "Weeks In Scope"),
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalFuelUsed), "L"), "Total Fuel Used GPS"),
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalDistance), "km"), "Total Distance"),
                    Kpi(FormatNumber(weeklySummaries.Sum(week => week.Summary.TotalEngineHours), "hrs"), "Total Engine Hours"),
                    Kpi(FormatRate(AverageWeeklyRate(weeklySummaries, true), "km/L"), "LV Avg Efficiency"),
                    Kpi(FormatRate(AverageWeeklyRate(weeklySummaries, false), "L/hr"), "HE Avg Efficiency")
                },
                weeklyNarrative,
                weeklyBuckets = weeklySummaries.Select(week => new
                {
                    weekNumber = week.WeekNumber,
                    weekLabel = week.WeekLabel,
                    startDate = week.StartDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
                    endDate = week.EndDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
                    fuelUsed = FormatNumber(week.Summary.TotalFuelUsed, "L"),
                    delivered = FormatNumber(week.Summary.TotalFuelReceived, "L"),
                    issued = FormatNumber(week.Summary.TotalFuelIssued, "L"),
                    distance = FormatNumber(week.Summary.TotalDistance, "km"),
                    engineHours = FormatNumber(week.Summary.TotalEngineHours, "hrs"),
                    fuelLost = FormatNumber(week.Summary.TotalFuelLost, "L"),
                    lvEfficiency = FormatRate(week.Summary.KmPerLiter, "km/L"),
                    heEfficiency = FormatRate(week.Summary.LitersPerHour, "L/hr")
                }).ToList(),
                weeklyStockRows = BuildWeeklyStockRows(siteNames, weeklySummaries, data.TankSiteLookup, currentMonthTankRows),
                weeklyLvRows = BuildWeeklyUsageRows(siteNames, weeklySummaries, currentMonthConsumption, data.SiteLookup, data.VehicleLookup, true),
                weeklyHeRows = BuildWeeklyUsageRows(siteNames, weeklySummaries, currentMonthConsumption, data.SiteLookup, data.VehicleLookup, false),
                weeklySiteUsageRows = BuildWeeklySiteUsageRows(siteNames, weeklySummaries, currentMonthConsumption, data.SiteLookup, data.VehicleLookup),
                weeklyHighlights = new
                {
                    lv = lvHighlights,
                    he = heHighlights
                }
            };
        }

        private object BuildEmptyPayload(string reportTitle, DateTime startLocal, DateTime endLocal)
        {
            return new
            {
                implementationStatus = "live-data-v1",
                reportTitle = reportTitle,
                periodLabel = $"{startLocal:dd MMM yyyy} – {endLocal:dd MMM yyyy}",
                generatedAt = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture),
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}"
            };
        }

        private List<object> BuildMonthlyTrend(ReportDataBundle data)
        {
            return Enumerable.Range(0, MonthlyTrendWindow)
                .Select(offset => data.MonthAnchor.AddMonths(offset - (MonthlyTrendWindow - 1)))
                .Select(month =>
                {
                    var monthConsumption = FilterMonth(data.ConsumptionRows, month);
                    var monthTankRows = FilterMonth(data.TankRows, month);
                    var summary = BuildMonthSummary(month, monthConsumption, monthTankRows, data.VehicleLookup);

                    return new
                    {
                        month = month.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                        fuelUsed = FormatWholeNumber(summary.TotalFuelUsed),
                        gpsDistance = FormatWholeNumber(summary.TotalDistance),
                        fuelIssued = FormatWholeNumber(summary.TotalFuelIssued),
                        fuelReceived = FormatWholeNumber(summary.TotalFuelReceived),
                        engineHours = FormatWholeNumber(summary.TotalEngineHours),
                        fuelLost = FormatWholeNumber(summary.TotalFuelLost),
                        fuelLostPercent = FormatPercent(summary.FuelLostPercent),
                        kmPerLiter = FormatDecimal(summary.KmPerLiter),
                        expectedKmPerLiter = FormatDecimal(summary.ExpectedKmPerLiter),
                        litersPerHour = FormatDecimal(summary.LitersPerHour),
                        expectedLitersPerHour = FormatDecimal(summary.ExpectedLitersPerHour)
                    };
                })
                .Cast<object>()
                .ToList();
        }

        private List<StockControlRow> BuildStockControlRows(
            IEnumerable<string> siteNames,
            IEnumerable<TankMovementRow> tankRows,
            IReadOnlyDictionary<int, TankMovementRow> openingTankBoundaries,
            IReadOnlyDictionary<int, TankMovementRow> closingTankBoundaries,
            DateTime periodStart,
            DateTime periodEnd,
            IReadOnlyDictionary<int, string> tankSiteLookup)
        {
            var rows = tankRows.ToList();

            return siteNames
                .Select(siteName =>
                {
                    var siteTankIds = tankSiteLookup
                        .Where(tank => tank.Value == siteName)
                        .Select(tank => tank.Key)
                        .Distinct()
                        .ToList();

                    decimal openingStock = 0m;
                    decimal delivered = 0m;
                    decimal issued = 0m;
                    decimal transfersIn = 0m;
                    decimal transfersOut = 0m;
                    decimal adjustments = 0m;
                    decimal expectedClosing = 0m;
                    decimal actualClosing = 0m;

                    foreach (var tankId in siteTankIds)
                    {
                        var tankPeriodRows = rows
                            .Where(row => row.TankId == tankId && row.Timestamp > periodStart && row.Timestamp <= periodEnd)
                            .OrderBy(row => row.Timestamp)
                            .ThenBy(row => row.Id)
                            .ToList();

                        var explicitOpening = rows
                            .Where(row => row.TankId == tankId && row.ChangeReason == VolumeChangeReasonEnum.OpeningStock && row.Timestamp.Date == periodStart.Date)
                            .OrderByDescending(row => row.Timestamp)
                            .ThenByDescending(row => row.Id)
                            .FirstOrDefault();

                        var explicitClosing = rows
                            .Where(row => row.TankId == tankId && row.ChangeReason == VolumeChangeReasonEnum.ClosingStock && row.Timestamp.Date == periodEnd.Date)
                            .OrderByDescending(row => row.Timestamp)
                            .ThenByDescending(row => row.Id)
                            .FirstOrDefault();

                        var tankOpening = explicitOpening?.NewVolume
                            ?? (openingTankBoundaries.TryGetValue(tankId, out var openingBoundary) ? openingBoundary.NewVolume : 0m);
                        var tankClosing = explicitClosing?.NewVolume
                            ?? (closingTankBoundaries.TryGetValue(tankId, out var closingBoundary) ? closingBoundary.NewVolume : 0m);
                        var tankDelivered = tankPeriodRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange));
                        var tankIssued = tankPeriodRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange));
                        var tankTransfersIn = tankPeriodRows.Where(IsTransferInReason).Sum(row => PositiveValue(row.VolumeChange));
                        var tankTransfersOut = tankPeriodRows.Where(IsTransferOutReason).Sum(row => Math.Abs(row.VolumeChange));
                        var tankAdjustments = tankPeriodRows.Where(IsAdjustmentReason).Sum(row => row.VolumeChange);
                        var tankExpectedClosing = tankOpening + tankDelivered + tankTransfersIn - tankIssued - tankTransfersOut + tankAdjustments;

                        openingStock += tankOpening;
                        delivered += tankDelivered;
                        issued += tankIssued;
                        transfersIn += tankTransfersIn;
                        transfersOut += tankTransfersOut;
                        adjustments += tankAdjustments;
                        expectedClosing += tankExpectedClosing;
                        actualClosing += tankClosing;
                    }

                    var variance = actualClosing - expectedClosing;
                    var variancePercent = expectedClosing != 0m
                        ? Math.Round((variance / expectedClosing) * 100m, 1, MidpointRounding.AwayFromZero)
                        : 0m;

                    return new StockControlRow(siteName, openingStock, delivered, issued, transfersIn, transfersOut, adjustments, expectedClosing, actualClosing, variance, variancePercent);
                })
                .ToList();
        }

        private static List<object> BuildStockSitePairs(IEnumerable<StockControlRow> stockRows)
        {
            return stockRows
                .Select(row => new
                {
                    siteName = row.SiteName,
                    expectedClosing = FormatCompact(row.ExpectedClosing),
                    actualClosing = FormatCompact(row.ActualClosing)
                })
                .Cast<object>()
                .ToList();
        }

        private static List<object> BuildStockControlSummary(IEnumerable<StockControlRow> stockRows)
        {
            var rows = stockRows.ToList();
            var openingStock = rows.Sum(row => row.OpeningStock);
            var expectedClosing = rows.Sum(row => row.ExpectedClosing);
            var actualClosing = rows.Sum(row => row.ActualClosing);
            var variance = rows.Sum(row => row.Variance);

            return new List<object>
            {
                new { value = FormatNumber(openingStock, "L"), label = "Opening Stock", note = "Latest stock at or before month start" },
                new { value = FormatNumber(expectedClosing, "L"), label = "Expected Closing", note = "Opening plus in-month movements" },
                new { value = FormatNumber(actualClosing, "L"), label = "Actual Closing", note = "Latest stock at or before month end" },
                new { value = $"{FormatSigned(variance)} L", label = "Variance", note = "Actual closing minus expected closing" }
            };
        }

        private static List<object> BuildStockControlHighlights(IEnumerable<StockControlRow> stockRows)
        {
            var rows = stockRows.ToList();
            var maxVariancePercent = rows.Select(row => Math.Abs(row.VariancePercent)).DefaultIfEmpty(0m).Max();

            return rows
                .OrderByDescending(row => Math.Abs(row.VariancePercent))
                .ThenByDescending(row => Math.Abs(row.Variance))
                .Select(row =>
                {
                    var status = ResolveStockStatus(row);
                    var width = maxVariancePercent > 0m
                        ? Math.Max(10m, Math.Min(100m, Math.Round((Math.Abs(row.VariancePercent) / maxVariancePercent) * 100m, 0, MidpointRounding.AwayFromZero)))
                        : 10m;

                    return new
                    {
                        siteName = row.SiteName,
                        statusLabel = status.Label,
                        statusClass = status.CssClass,
                        openingStock = FormatNumber(row.OpeningStock, "L"),
                        expectedClosing = FormatNumber(row.ExpectedClosing, "L"),
                        actualClosing = FormatNumber(row.ActualClosing, "L"),
                        variance = $"{FormatSigned(row.Variance)} L",
                        variancePercent = FormatSignedPercent(row.VariancePercent),
                        movementSummary = $"Delivered {FormatNumber(row.Delivered, "L")} | Dispensed {FormatNumber(row.Issued, "L")} | Transfers {FormatSigned(row.TransfersIn - row.TransfersOut)} L | Adjustments {FormatSigned(row.Adjustments)} L",
                        barWidth = $"{width:N0}%",
                        barColor = status.BarColor
                    };
                })
                .Cast<object>()
                .ToList();
        }

        private static (string Label, string CssClass, string BarColor) ResolveStockStatus(StockControlRow row)
        {
            var absVariancePercent = Math.Abs(row.VariancePercent);

            if (absVariancePercent >= 5m)
            {
                return ("Action", "critical", "#D13438");
            }

            if (absVariancePercent >= 2m)
            {
                return ("Watch", "watch", "#CA5010");
            }

            return ("Stable", "stable", "#107C10");
        }

        private List<object> BuildSiteUsageMatrix(IEnumerable<string> siteNames, IEnumerable<DateTime> recentMonths, ReportDataBundle data)
        {
            return siteNames.Select(siteName => new
            {
                siteName,
                months = recentMonths.Select(month =>
                {
                    var monthConsumption = FilterMonth(data.ConsumptionRows, month)
                        .Where(row => ResolveConsumptionSiteName(data, row) == siteName)
                        .ToList();
                    var lvRows = monthConsumption.Where(row => row.IsKmL).ToList();
                    var heRows = monthConsumption.Where(row => !row.IsKmL).ToList();
                    var lvSummary = BuildSubsetSummary(lvRows, data.VehicleLookup, true);
                    var heSummary = BuildSubsetSummary(heRows, data.VehicleLookup, false);

                    return new
                    {
                        month = month.ToString("MMM", CultureInfo.InvariantCulture),
                        lvEfficiency = FormatRate(lvSummary.ActualRate, "km/L"),
                        heEfficiency = FormatRate(heSummary.ActualRate, "L/hr"),
                        fuelLost = FormatCompact(monthConsumption.Sum(row => row.FuelLost)),
                        distance = FormatCompact(lvRows.Sum(row => row.TotalDistance)),
                        engineHours = FormatCompact(heRows.Sum(row => row.EngineHours)),
                        totalFuel = FormatCompact(monthConsumption.Sum(row => row.TotalFuel))
                    };
                }).ToList()
            }).Cast<object>().ToList();
        }

        private List<object> BuildVehicleTypeMatrix(
            IEnumerable<string> siteNames,
            IEnumerable<string> vehicleTypes,
            IEnumerable<ConsumptionRow> sourceRows,
            IReadOnlyDictionary<int, string> siteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup,
            MatrixMode mode)
        {
            var rows = sourceRows.ToList();
            var typeList = vehicleTypes.ToList();

            return siteNames.Select(siteName => new
            {
                siteName,
                rows = typeList.Select(vehicleType =>
                {
                    var groupRows = rows.Where(row => ResolveSiteName(siteLookup, row.SiteId, vehicleLookup, row.VehicleId) == siteName && ResolveVehicleType(vehicleLookup, row.VehicleId) == vehicleType).ToList();
                    return new
                    {
                        vehicleType,
                        metrics = BuildMatrixMetrics(mode, groupRows, vehicleLookup)
                    };
                }).ToList()
            }).Cast<object>().ToList();
        }

        private List<object> BuildMatrixMetrics(MatrixMode mode, List<ConsumptionRow> rows, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup)
        {
            var unitCount = rows.Select(row => row.VehicleId).Distinct().Count();
            var distinctDays = rows.Select(row => row.Date.Date).Distinct().Count();
            var totalFuel = rows.Sum(row => row.TotalFuel);
            var totalDistance = rows.Sum(row => row.TotalDistance);
            var totalHours = rows.Sum(row => row.EngineHours);
            var totalFuelLost = rows.Sum(row => row.FuelLost);
            var expectedAverage = ComputeExpectedAverage(rows, vehicleLookup);

            // km/L: only rows with meaningful distance (>10 km) and non-zero fuel
            var lvEfficRows = rows.Where(r => r.TotalDistance > 10m && r.TotalFuel > 0m).ToList();
            var actualKmPerLiter = SafeDivide(lvEfficRows.Sum(r => r.TotalDistance), lvEfficRows.Sum(r => r.TotalFuel));

            // L/hr: only rows with meaningful engine hours (>0.5 hr) and non-zero fuel
            var heEfficRows = rows.Where(r => r.EngineHours > 0.5m && r.TotalFuel > 0m).ToList();
            var actualLitersPerHour = SafeDivide(heEfficRows.Sum(r => r.TotalFuel), heEfficRows.Sum(r => r.EngineHours));

            return mode switch
            {
                MatrixMode.LvFuel => new List<object>
                {
                    Metric("fuelUsed", FormatCompact(totalFuel)),
                    Metric("fuelLost", FormatCompact(totalFuelLost)),
                    Metric("lostPercent", FormatPercent(SafePercent(totalFuelLost, totalFuel)))
                },
                MatrixMode.LvEfficiency => new List<object>
                {
                    Metric("actualKmPerLiter", FormatDecimal(actualKmPerLiter)),
                    Metric("expectedKmPerLiter", FormatDecimal(expectedAverage)),
                    Metric("variance", FormatSigned(actualKmPerLiter - expectedAverage))
                },
                MatrixMode.LvDistance => new List<object>
                {
                    Metric("totalDistance", FormatCompact(totalDistance)),
                    Metric("avgKmPerDay", FormatDecimal(SafeDivide(totalDistance, distinctDays))),
                    Metric("unitCount", unitCount.ToString(CultureInfo.InvariantCulture))
                },
                MatrixMode.HeFuelLost => new List<object>
                {
                    Metric("actualLitersPerHour", FormatDecimal(actualLitersPerHour)),
                    Metric("expectedLitersPerHour", FormatDecimal(expectedAverage)),
                    Metric("fuelLost", FormatCompact(totalFuelLost))
                },
                MatrixMode.HeEngineHours => new List<object>
                {
                    Metric("totalHours", FormatCompact(totalHours)),
                    Metric("avgHoursPerUnit", FormatDecimal(SafeDivide(totalHours, unitCount))),
                    Metric("unitCount", unitCount.ToString(CultureInfo.InvariantCulture))
                },
                MatrixMode.HeEfficiency => new List<object>
                {
                    Metric("actualLitersPerHour", FormatDecimal(actualLitersPerHour)),
                    Metric("expectedLitersPerHour", FormatDecimal(expectedAverage)),
                    Metric("variance", FormatSigned(expectedAverage - actualLitersPerHour))
                },
                _ => new List<object>()
            };
        }

        private List<object> BuildSiteHighlights(
            IEnumerable<string> siteNames,
            IEnumerable<ConsumptionRow> consumptionRows,
            IEnumerable<TankMovementRow> tankRows,
            IReadOnlyDictionary<int, string> siteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup,
            IReadOnlyDictionary<int, string> tankSiteLookup)
        {
            var siteRows = siteNames.Select(siteName =>
            {
                var siteConsumption = consumptionRows.Where(row => ResolveSiteName(siteLookup, row.SiteId, vehicleLookup, row.VehicleId) == siteName).ToList();
                var siteTankRows = tankRows.Where(row => ResolveTankSiteName(tankSiteLookup, row.TankId) == siteName).ToList();
                var totalFuel = siteConsumption.Sum(row => row.TotalFuel);

                return new
                {
                    siteName,
                    fuelUsed = FormatCompact(totalFuel),
                    issued = FormatCompact(siteTankRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange))),
                    delivered = FormatCompact(siteTankRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange))),
                    sharePercent = FormatPercent(SafePercent(totalFuel, consumptionRows.Sum(row => row.TotalFuel))),
                    shareWidth = FormatPercent(SafePercent(totalFuel, siteNames.Select(name => consumptionRows.Where(row => ResolveSiteName(siteLookup, row.SiteId, vehicleLookup, row.VehicleId) == name).Sum(row => row.TotalFuel)).DefaultIfEmpty(0m).Max()))
                };
            });

            return siteRows.Cast<object>().ToList();
        }

        private List<object> BuildTypeHighlights(IEnumerable<ConsumptionRow> rows, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, int limit, bool isKmL)
        {
            var sourceRows = rows.ToList();
            var totalFuel = sourceRows.Sum(row => row.TotalFuel);
            var maxFuel = sourceRows
                .GroupBy(row => ResolveVehicleType(vehicleLookup, row.VehicleId))
                .Select(group => group.Sum(row => row.TotalFuel))
                .DefaultIfEmpty(0m)
                .Max();

            return sourceRows
                .GroupBy(row => ResolveVehicleType(vehicleLookup, row.VehicleId))
                .Select(group =>
                {
                    var groupRows = group.ToList();
                    var summary = BuildSubsetSummary(groupRows, vehicleLookup, isKmL);
                    var groupFuel = groupRows.Sum(row => row.TotalFuel);
                    return new
                    {
                        typeName = group.Key,
                        fuelUsed = FormatCompact(groupFuel),
                        efficiency = FormatRate(summary.ActualRate, isKmL ? "km/L" : "L/hr"),
                        expected = FormatRate(summary.ExpectedRate, isKmL ? "km/L" : "L/hr"),
                        unitCount = groupRows.Select(row => row.VehicleId).Distinct().Count().ToString(CultureInfo.InvariantCulture),
                        sharePercent = FormatPercent(SafePercent(groupFuel, totalFuel)),
                        shareWidth = FormatPercent(SafePercent(groupFuel, maxFuel))
                    };
                })
                .OrderByDescending(item => ParseDecimal(item.fuelUsed))
                .ThenBy(item => item.typeName)
                .Take(limit)
                .Cast<object>()
                .ToList();
        }

        private List<object> BuildWeeklyStockRows(
            IEnumerable<string> siteNames,
            IEnumerable<WeeklySummary> weeklySummaries,
            IReadOnlyDictionary<int, string> tankSiteLookup,
            IEnumerable<TankMovementRow> currentMonthTankRows)
        {
            var tankRows = currentMonthTankRows.ToList();

            return siteNames.Select(siteName => new
            {
                siteName,
                weeks = weeklySummaries.Select(week =>
                {
                    var siteWeekRows = tankRows.Where(row => ResolveTankSiteName(tankSiteLookup, row.TankId) == siteName && row.Timestamp.Date >= week.StartDate && row.Timestamp.Date <= week.EndDate).ToList();
                    return new
                    {
                        weekLabel = week.WeekLabel,
                        delivered = FormatCompact(siteWeekRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange))),
                        issued = FormatCompact(siteWeekRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange))),
                        fuelLost = FormatCompact(siteWeekRows.Where(IsLossReason).Sum(row => Math.Abs(row.VolumeChange)))
                    };
                }).ToList()
            }).Cast<object>().ToList();
        }

        private List<object> BuildWeeklyUsageRows(
            IEnumerable<string> siteNames,
            IEnumerable<WeeklySummary> weeklySummaries,
            IEnumerable<ConsumptionRow> currentMonthConsumption,
            IReadOnlyDictionary<int, string> siteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup,
            bool isKmL)
        {
            var consumptionRows = currentMonthConsumption.Where(row => row.IsKmL == isKmL).ToList();

            return siteNames.Select(siteName => new
            {
                siteName,
                weeks = weeklySummaries.Select(week =>
                {
                    var siteWeekRows = consumptionRows.Where(row => ResolveSiteName(siteLookup, row.SiteId, vehicleLookup, row.VehicleId) == siteName && row.Date.Date >= week.StartDate && row.Date.Date <= week.EndDate).ToList();
                    var summary = BuildSubsetSummary(siteWeekRows, vehicleLookup, isKmL);
                    return new
                    {
                        weekLabel = week.WeekLabel,
                        fuelUsed = FormatCompact(siteWeekRows.Sum(row => row.TotalFuel)),
                        fuelLost = FormatCompact(siteWeekRows.Sum(row => row.FuelLost)),
                        kmPerLiter = isKmL ? FormatRate(summary.ActualRate, "km/L") : string.Empty,
                        litersPerHour = isKmL ? string.Empty : FormatRate(summary.ActualRate, "L/hr"),
                        engineHours = isKmL ? string.Empty : FormatCompact(siteWeekRows.Sum(row => row.EngineHours)),
                        distance = isKmL ? FormatCompact(siteWeekRows.Sum(row => row.TotalDistance)) : string.Empty
                    };
                }).ToList()
            }).Cast<object>().ToList();
        }

        private List<object> BuildWeeklySiteUsageRows(
            IEnumerable<string> siteNames,
            IEnumerable<WeeklySummary> weeklySummaries,
            IEnumerable<ConsumptionRow> currentMonthConsumption,
            IReadOnlyDictionary<int, string> siteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup)
        {
            var rows = currentMonthConsumption.ToList();

            return siteNames.Select(siteName => new
            {
                siteName,
                weeks = weeklySummaries.Select(week =>
                {
                    var siteWeekRows = rows.Where(row => ResolveSiteName(siteLookup, row.SiteId, vehicleLookup, row.VehicleId) == siteName && row.Date.Date >= week.StartDate && row.Date.Date <= week.EndDate).ToList();
                    var lvSummary = BuildSubsetSummary(siteWeekRows.Where(row => row.IsKmL).ToList(), vehicleLookup, true);
                    var heSummary = BuildSubsetSummary(siteWeekRows.Where(row => !row.IsKmL).ToList(), vehicleLookup, false);
                    return new
                    {
                        weekLabel = week.WeekLabel,
                        lvEfficiency = FormatRate(lvSummary.ActualRate, "km/L"),
                        heEfficiency = FormatRate(heSummary.ActualRate, "L/hr"),
                        distance = FormatCompact(siteWeekRows.Where(row => row.IsKmL).Sum(row => row.TotalDistance)),
                        engineHours = FormatCompact(siteWeekRows.Where(row => !row.IsKmL).Sum(row => row.EngineHours)),
                        totalFuel = FormatCompact(siteWeekRows.Sum(row => row.TotalFuel))
                    };
                }).ToList()
            }).Cast<object>().ToList();
        }

        private List<object> BuildWeeklyHighlights(IEnumerable<WeeklySummary> weeklySummaries, bool isKmL)
        {
            return weeklySummaries.Select(week => new
            {
                weekLabel = week.WeekLabel,
                fuelUsed = FormatCompact(week.Summary.TotalFuelUsed),
                efficiency = FormatRate(isKmL ? week.Summary.KmPerLiter : week.Summary.LitersPerHour, isKmL ? "km/L" : "L/hr"),
                issued = FormatCompact(week.Summary.TotalFuelIssued),
                delivered = FormatCompact(week.Summary.TotalFuelReceived)
            }).Cast<object>().ToList();
        }

        private MonthSummary BuildMonthSummary(
            DateTime month,
            IEnumerable<ConsumptionRow> consumptionRows,
            IEnumerable<TankMovementRow> tankRows,
            IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup)
        {
            var rows = consumptionRows.ToList();
            var lvRows = rows.Where(row => row.IsKmL).ToList();
            var heRows = rows.Where(row => !row.IsKmL).ToList();
            var expectedKmPerLiter = ComputeExpectedAverage(lvRows, vehicleLookup);
            var expectedLitersPerHour = ComputeExpectedAverage(heRows, vehicleLookup);
            var totalFuelUsed = rows.Sum(row => row.TotalFuel);
            var totalFuelLost = rows.Sum(row => row.FuelLost);

            var lvEfficRows = lvRows.Where(r => r.TotalDistance > 10m && r.TotalFuel > 0m).ToList();
            var heEfficRows = heRows.Where(r => r.EngineHours > 0.5m && r.TotalFuel > 0m).ToList();

            return new MonthSummary(
                month,
                totalFuelUsed,
                lvRows.Sum(row => row.TotalDistance),
                heRows.Sum(row => row.EngineHours),
                tankRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange)),
                tankRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange)),
                totalFuelLost,
                SafePercent(totalFuelLost, totalFuelUsed),
                SafeDivide(lvEfficRows.Sum(row => row.TotalDistance), lvEfficRows.Sum(row => row.TotalFuel)),
                expectedKmPerLiter,
                SafeDivide(heEfficRows.Sum(row => row.TotalFuel), heEfficRows.Sum(row => row.EngineHours)),
                expectedLitersPerHour);
        }

        private SubsetSummary BuildSubsetSummary(List<ConsumptionRow> rows, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, bool isKmL)
        {
            if (!rows.Any())
            {
                return new SubsetSummary(0m, 0m);
            }

            var actualRate = isKmL
                ? SafeDivide(rows.Sum(row => row.TotalDistance), rows.Sum(row => row.TotalFuel))
                : SafeDivide(rows.Sum(row => row.TotalFuel), rows.Sum(row => row.EngineHours));

            return new SubsetSummary(actualRate, ComputeExpectedAverage(rows, vehicleLookup));
        }

        private decimal ComputeExpectedAverage(IEnumerable<ConsumptionRow> rows, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup)
        {
            var expectedValues = rows
                .Select(row => vehicleLookup.TryGetValue(row.VehicleId, out var vehicle) ? vehicle.ExpectedAverage : 0m)
                .Where(value => value > 0)
                .Distinct()
                .ToList();

            return expectedValues.Any() ? expectedValues.Average() : 0m;
        }

        private List<ConsumptionRow> FilterMonth(IEnumerable<ConsumptionRow> rows, DateTime month)
        {
            return rows
                .Where(row => row.Date.Year == month.Year && row.Date.Month == month.Month)
                .ToList();
        }

        private List<TankMovementRow> FilterMonth(IEnumerable<TankMovementRow> rows, DateTime month)
        {
            return rows
                .Where(row => row.Timestamp.Year == month.Year && row.Timestamp.Month == month.Month)
                .ToList();
        }

        private List<string> SelectSiteNames(ReportDataBundle data, IEnumerable<ConsumptionRow> currentMonthConsumption, IEnumerable<TankMovementRow> currentMonthTankRows, ReportFilters filters)
        {
            if (!string.IsNullOrWhiteSpace(filters.SiteName))
            {
                return new List<string> { filters.SiteName };
            }

            var fromConsumption = currentMonthConsumption
                .GroupBy(row => ResolveConsumptionSiteName(data, row))
                .Select(group => new { SiteName = group.Key, Score = group.Sum(row => row.TotalFuel) })
                .Where(item => !string.IsNullOrWhiteSpace(item.SiteName));

            var fromTank = currentMonthTankRows
                .GroupBy(row => ResolveTankSiteName(data.TankSiteLookup, row.TankId))
                .Select(group => new { SiteName = group.Key, Score = group.Sum(row => Math.Abs(row.VolumeChange)) })
                .Where(item => !string.IsNullOrWhiteSpace(item.SiteName));

            var orderedSites = fromConsumption
                .Concat(fromTank)
                .GroupBy(item => item.SiteName)
                .Select(group => new { SiteName = group.Key, Score = group.Sum(item => item.Score) })
                .OrderByDescending(item => item.Score)
                .ThenBy(item => item.SiteName)
                .Take(MaxSitesPerMatrix)
                .Select(item => item.SiteName)
                .ToList();

            if (orderedSites.Any())
            {
                return orderedSites;
            }

            return data.VehicleLookup.Values
                .Select(vehicle => vehicle.SiteName)
                .Where(siteName => !string.IsNullOrWhiteSpace(siteName))
                .Distinct()
                .OrderBy(siteName => siteName)
                .Take(MaxSitesPerMatrix)
                .ToList();
        }

        private List<string> SelectVehicleTypes(IEnumerable<ConsumptionRow> rows, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, bool isKmL, int limit, ReportFilters filters)
        {
            var selectedTypeName = isKmL ? filters.LightVehicleTypeName : filters.HeavyEquipmentTypeName;
            if (!string.IsNullOrWhiteSpace(selectedTypeName))
            {
                return new List<string> { selectedTypeName };
            }

            var types = rows
                .Where(row => row.IsKmL == isKmL)
                .GroupBy(row => ResolveVehicleType(vehicleLookup, row.VehicleId))
                .Select(group => new { VehicleType = group.Key, TotalFuel = group.Sum(row => row.TotalFuel) })
                .Where(item => !string.IsNullOrWhiteSpace(item.VehicleType))
                .OrderByDescending(item => item.TotalFuel)
                .ThenBy(item => item.VehicleType)
                .Take(limit)
                .Select(item => item.VehicleType)
                .ToList();

            if (types.Any())
            {
                return types;
            }

            return vehicleLookup.Values
                .Where(vehicle => vehicle.IsKmL == isKmL)
                .Select(vehicle => vehicle.VehicleType)
                .Where(vehicleType => !string.IsNullOrWhiteSpace(vehicleType))
                .Distinct()
                .OrderBy(vehicleType => vehicleType)
                .Take(limit)
                .ToList();
        }

        private string BuildMonthlyNarrative(MonthSummary summary, List<object> siteHighlights, List<object> lvHighlights, List<object> heHighlights, DateTime monthAnchor)
        {
            var leadingSite = siteHighlights.FirstOrDefault();
            var leadingLvType = lvHighlights.FirstOrDefault();
            var leadingHeType = heHighlights.FirstOrDefault();

            return $"For {monthAnchor:MMMM yyyy}, persisted fleet data shows {FormatNumber(summary.TotalFuelUsed, "L")} of fuel used GPS, {FormatNumber(summary.TotalFuelReceived, "L")} received into tanks, and {FormatNumber(summary.TotalFuelIssued, "L")} dispensed from tanks. Average light-vehicle efficiency closed at {FormatRate(summary.KmPerLiter, "km/L")}, heavy-equipment efficiency closed at {FormatRate(summary.LitersPerHour, "L/hr")}, and recorded fuel loss remained at {FormatPercent(summary.FuelLostPercent)} of total usage. Leading site, light-vehicle type, and heavy-equipment type are surfaced in the highlight panels for fast executive review.";
        }

        private string BuildWeeklyNarrative(IEnumerable<WeeklySummary> weeklySummaries, DateTime monthAnchor)
        {
            var busiestWeek = weeklySummaries.OrderByDescending(week => week.Summary.TotalFuelUsed).FirstOrDefault();
            if (busiestWeek == null)
            {
                return $"Weekly persisted fleet summaries for {monthAnchor:MMMM yyyy} are available once vehicle consumption and tank ledger rows are recorded.";
            }

            return $"This weekly view splits {monthAnchor:MMMM yyyy} into {weeklySummaries.Count()} persisted reporting buckets. {busiestWeek.WeekLabel} carried the heaviest fuel demand at {FormatNumber(busiestWeek.Summary.TotalFuelUsed, "L")}, with {FormatNumber(busiestWeek.Summary.TotalFuelReceived, "L")} received into stock and {FormatNumber(busiestWeek.Summary.TotalFuelIssued, "L")} dispensed to the fleet.";
        }

        private ReportFilters ResolveFilters(JObject metadata, ReportDataBundle data)
        {
            var siteId = GetIntParam(metadata, "siteId");
            var lightVehicleTypeIds = GetIntParams(metadata, "lightVehicleTypeId");
            var heavyEquipmentTypeIds = GetIntParams(metadata, "heavyEquipmentTypeId");

            return new ReportFilters(
                siteId,
                siteId.HasValue ? ResolveSiteName(data.SiteLookup, siteId) : null,
                lightVehicleTypeIds,
                lightVehicleTypeIds.Count > 0
                    ? string.Join(", ", data.VehicleLookup.Values
                        .Where(vehicle => vehicle.IsKmL && vehicle.VehicleTypeId.HasValue && lightVehicleTypeIds.Contains(vehicle.VehicleTypeId.Value))
                        .Select(vehicle => vehicle.VehicleType)
                        .Where(vehicleType => !string.IsNullOrWhiteSpace(vehicleType))
                        .Distinct()
                        .OrderBy(vehicleType => vehicleType))
                    : null,
                heavyEquipmentTypeIds,
                heavyEquipmentTypeIds.Count > 0
                    ? string.Join(", ", data.VehicleLookup.Values
                        .Where(vehicle => !vehicle.IsKmL && vehicle.VehicleTypeId.HasValue && heavyEquipmentTypeIds.Contains(vehicle.VehicleTypeId.Value))
                        .Select(vehicle => vehicle.VehicleType)
                        .Where(vehicleType => !string.IsNullOrWhiteSpace(vehicleType))
                        .Distinct()
                        .OrderBy(vehicleType => vehicleType))
                    : null);
        }

        private ReportDataBundle ApplyFilters(ReportDataBundle data, ReportFilters filters)
        {
            var filteredVehicleLookup = data.VehicleLookup.Values
                .Where(vehicle => MatchesVehicleTypeFilter(vehicle, filters))
                .ToDictionary(vehicle => vehicle.VehicleId);

            var filteredConsumptionRows = data.ConsumptionRows
                .Where(row => MatchesSiteFilter(row, data, filters))
                .Where(row => MatchesVehicleTypeFilter(row, data.VehicleLookup, filters))
                .ToList();

            var filteredTankRows = data.TankRows
                .Where(row => !filters.SiteId.HasValue || ResolveTankSiteName(data.TankSiteLookup, row.TankId) == filters.SiteName)
                .ToList();

            return new ReportDataBundle(
                data.MonthAnchor,
                data.MonthEnd,
                data.SiteLookup,
                filteredVehicleLookup,
                filteredConsumptionRows,
                filteredTankRows,
                data.TankSiteLookup,
                data.OpeningTankBoundaries,
                data.ClosingTankBoundaries);
        }

        private static DateTime EndOfMonth(DateTime monthAnchor)
        {
            return new DateTime(monthAnchor.Year, monthAnchor.Month, DateTime.DaysInMonth(monthAnchor.Year, monthAnchor.Month), 23, 59, 59, 999, DateTimeKind.Unspecified).AddTicks(9999);
        }

        private async Task<IReadOnlyDictionary<int, TankMovementRow>> LoadLatestTankRowsAtOrBeforeAsync(DateTime boundary, CancellationToken cancellationToken)
        {
            var latestTimestamps = _context.TankVolumeHistories
                .AsNoTracking()
                .Where(row => row.Timestamp <= boundary && (row.IsDeleted == null || row.IsDeleted == false))
                .GroupBy(row => row.TankId ?? 0)
                .Select(group => new
                {
                    TankId = group.Key,
                    Timestamp = group.Max(item => item.Timestamp)
                });

            var boundaryRows = await (
                from row in _context.TankVolumeHistories.AsNoTracking()
                join latest in latestTimestamps
                    on new { TankId = row.TankId ?? 0, row.Timestamp } equals new { latest.TankId, latest.Timestamp }
                where row.Timestamp <= boundary && (row.IsDeleted == null || row.IsDeleted == false)
                select new TankMovementRow(
                    row.Id,
                    row.TankId ?? 0,
                    row.Timestamp,
                    row.ChangeReason,
                    row.VolumeChange ?? 0m,
                    row.NewVolume ?? 0m))
                .ToListAsync(cancellationToken);

            return boundaryRows
                .GroupBy(row => row.TankId)
                .ToDictionary(
                    group => group.Key,
                    group => group.OrderByDescending(row => row.Id).First());
        }

        private static bool MatchesSiteFilter(ConsumptionRow row, ReportDataBundle data, ReportFilters filters)
        {
            if (!filters.SiteId.HasValue)
            {
                return true;
            }

            if (row.SiteId == filters.SiteId.Value)
            {
                return true;
            }

            return data.VehicleLookup.TryGetValue(row.VehicleId, out var vehicle)
                && vehicle.SiteId == filters.SiteId.Value;
        }

        private static bool MatchesVehicleTypeFilter(ConsumptionRow row, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, ReportFilters filters)
        {
            if (!vehicleLookup.TryGetValue(row.VehicleId, out var vehicle))
            {
                return false;
            }

            return MatchesVehicleTypeFilter(vehicle, filters);
        }

        private static bool MatchesVehicleTypeFilter(VehicleSnapshot vehicle, ReportFilters filters)
        {
            if (vehicle.IsKmL)
            {
                return filters.LightVehicleTypeIds.Count == 0
                    || (vehicle.VehicleTypeId.HasValue && filters.LightVehicleTypeIds.Contains(vehicle.VehicleTypeId.Value));
            }

            return filters.HeavyEquipmentTypeIds.Count == 0
                || (vehicle.VehicleTypeId.HasValue && filters.HeavyEquipmentTypeIds.Contains(vehicle.VehicleTypeId.Value));
        }

        private static List<WeekRange> BuildWeekRanges(DateTime monthStart, DateTime monthEnd)
        {
            var weeks = new List<WeekRange>();
            var current = monthStart;
            var weekNumber = 1;

            while (current <= monthEnd)
            {
                var weekEnd = current.AddDays(6);
                if (weekEnd > monthEnd)
                {
                    weekEnd = monthEnd;
                }

                weeks.Add(new WeekRange(weekNumber, $"W{weekNumber}: {current:dd MMM} - {weekEnd:dd MMM}", current, weekEnd));
                current = weekEnd.AddDays(1);
                weekNumber++;
            }

            return weeks;
        }

        private static object Kpi(string value, string label, string? note = null)
        {
            return new
            {
                value,
                label,
                note = note ?? string.Empty
            };
        }

        private static object Metric(string name, string value)
        {
            return new { name, value };
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

        private static List<int> GetIntParams(JObject metadata, string key)
        {
            var token = metadata[key];
            if (token == null)
            {
                return new List<int>();
            }

            if (token.Type == JTokenType.Array)
            {
                return token.Values<string>()
                    .SelectMany(value => SplitIntegerValues(value))
                    .Distinct()
                    .ToList();
            }

            if (token.Type == JTokenType.Integer)
            {
                return new List<int> { token.Value<int>() };
            }

            if (token.Type == JTokenType.String)
            {
                return SplitIntegerValues(token.Value<string>())
                    .Distinct()
                    .ToList();
            }

            return new List<int>();
        }

        private static IEnumerable<int> SplitIntegerValues(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                yield break;
            }

            foreach (var segment in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (int.TryParse(segment, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
                {
                    yield return parsed;
                }
            }
        }

        private static bool IsReceiptReason(TankMovementRow row)
        {
            return row.ChangeReason == VolumeChangeReasonEnum.Delivery || row.ChangeReason == VolumeChangeReasonEnum.InTankDelivery;
        }

        private static bool IsIssueReason(TankMovementRow row)
        {
            return row.ChangeReason == VolumeChangeReasonEnum.Dispensing || row.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing;
        }

        private static bool IsTransferInReason(TankMovementRow row)
        {
            return row.ChangeReason == VolumeChangeReasonEnum.TransferIn;
        }

        private static bool IsTransferOutReason(TankMovementRow row)
        {
            return row.ChangeReason == VolumeChangeReasonEnum.TransferOut;
        }

        private static bool IsAdjustmentReason(TankMovementRow row)
        {
            return row.ChangeReason == VolumeChangeReasonEnum.Adjustment ||
                   row.ChangeReason == VolumeChangeReasonEnum.Reconciliation ||
                   row.ChangeReason == VolumeChangeReasonEnum.AutomatedReconciliation;
        }

        private static bool IsLossReason(TankMovementRow row)
        {
            return (row.ChangeReason == VolumeChangeReasonEnum.Adjustment ||
                    row.ChangeReason == VolumeChangeReasonEnum.Reconciliation ||
                    row.ChangeReason == VolumeChangeReasonEnum.AutomatedReconciliation) && row.VolumeChange < 0;
        }

        private static decimal PositiveValue(decimal value)
        {
            return value > 0 ? value : 0m;
        }

        private static decimal SafeDivide(decimal numerator, decimal denominator)
        {
            return denominator > 0 ? Math.Round(numerator / denominator, 2) : 0m;
        }

        private static decimal SafeDivide(decimal numerator, int denominator)
        {
            return denominator > 0 ? Math.Round(numerator / denominator, 2) : 0m;
        }

        private static decimal SafePercent(decimal numerator, decimal denominator)
        {
            return denominator > 0 ? Math.Round((numerator / denominator) * 100m, 1) : 0m;
        }

        private static decimal AverageWeeklyRate(IEnumerable<WeeklySummary> weeks, bool isKmL)
        {
            var values = weeks.Select(week => isKmL ? week.Summary.KmPerLiter : week.Summary.LitersPerHour).Where(value => value > 0).ToList();
            return values.Any() ? Math.Round(values.Average(), 2) : 0m;
        }

        private static string ResolveSiteName(IReadOnlyDictionary<int, string> siteLookup, int? siteId)
        {
            return siteId.HasValue && siteLookup.TryGetValue(siteId.Value, out var siteName)
                ? siteName
                : "UNASSIGNED";
        }

        private static string ResolveSiteName(IReadOnlyDictionary<int, string> siteLookup, int siteId, IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, int vehicleId)
        {
            if (siteId > 0 && siteLookup.TryGetValue(siteId, out var siteName))
            {
                return siteName;
            }

            return vehicleLookup.TryGetValue(vehicleId, out var snapshot)
                ? snapshot.SiteName
                : "UNASSIGNED";
        }

        private static string ResolveVehicleType(IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, int vehicleId)
        {
            return vehicleLookup.TryGetValue(vehicleId, out var vehicle) && !string.IsNullOrWhiteSpace(vehicle.VehicleType)
                ? vehicle.VehicleType
                : "UNKNOWN";
        }

        private static string ResolveTankSiteName(IReadOnlyDictionary<int, string> tankSiteLookup, int tankId)
        {
            return tankSiteLookup.TryGetValue(tankId, out var siteName) ? siteName : "UNASSIGNED";
        }

        private static string ResolveConsumptionSiteName(ReportDataBundle data, ConsumptionRow row)
        {
            return row.SiteId > 0
                ? ResolveSiteName(data.SiteLookup, row.SiteId)
                : ResolveSiteName(data.SiteLookup, row.SiteId, data.VehicleLookup, row.VehicleId);
        }

        private static string NormalizeLabel(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? "UNASSIGNED" : value.Trim().ToUpperInvariant();
        }

        private static string FormatNumber(decimal value, string unit)
        {
            return $"{value:N1} {unit}";
        }

        private static string FormatRate(decimal value, string unit)
        {
            return value > 0 ? $"{value:N2} {unit}" : $"0.00 {unit}";
        }

        private static string FormatPercent(decimal value)
        {
            return $"{value:N1}%";
        }

        private static string FormatCompact(decimal value)
        {
            return value.ToString("N1", CultureInfo.InvariantCulture);
        }

        private static string FormatWholeNumber(decimal value)
        {
            return Math.Round(value, 0, MidpointRounding.AwayFromZero).ToString("N0", CultureInfo.InvariantCulture);
        }

        private static string FormatDecimal(decimal value)
        {
            return value.ToString("N2", CultureInfo.InvariantCulture);
        }

        private static string FormatSignedPercent(decimal value)
        {
            return value >= 0
                ? $"+{value:N1}%"
                : $"{value:N1}%";
        }

        private static string FormatSigned(decimal value)
        {
            return value >= 0
                ? $"+{value:N2}"
                : value.ToString("N2", CultureInfo.InvariantCulture);
        }

        private static decimal ParseDecimal(string value)
        {
            return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)
                ? parsed
                : 0m;
        }

        private List<MonthSummary> BuildRawMonthlySummaries(ReportDataBundle data)
        {
            return Enumerable.Range(0, MonthlyTrendWindow)
                .Select(offset => data.MonthAnchor.AddMonths(offset - (MonthlyTrendWindow - 1)))
                .Select(month => BuildMonthSummary(month, FilterMonth(data.ConsumptionRows, month), FilterMonth(data.TankRows, month), data.VehicleLookup))
                .ToList();
        }

        private static object BuildMonthlyMatrixTotals(List<MonthSummary> summaries)
        {
            var totalFuel = summaries.Sum(s => s.TotalFuelUsed);
            return new
            {
                fuelUsed = FormatWholeNumber(totalFuel),
                gpsDistance = FormatWholeNumber(summaries.Sum(s => s.TotalDistance)),
                fuelIssued = FormatWholeNumber(summaries.Sum(s => s.TotalFuelIssued)),
                fuelReceived = FormatWholeNumber(summaries.Sum(s => s.TotalFuelReceived)),
                engineHours = FormatWholeNumber(summaries.Sum(s => s.TotalEngineHours)),
                fuelLost = FormatWholeNumber(summaries.Sum(s => s.TotalFuelLost)),
                fuelLostPercent = FormatPercent(SafePercent(summaries.Sum(s => s.TotalFuelLost), totalFuel)),
                kmPerLiter = FormatDecimal(summaries.Where(s => s.KmPerLiter > 0).Select(s => s.KmPerLiter).DefaultIfEmpty(0m).Average()),
                expectedKmPerLiter = FormatDecimal(summaries.Where(s => s.ExpectedKmPerLiter > 0).Select(s => s.ExpectedKmPerLiter).DefaultIfEmpty(0m).Average()),
                litersPerHour = FormatDecimal(summaries.Where(s => s.LitersPerHour > 0).Select(s => s.LitersPerHour).DefaultIfEmpty(0m).Average()),
                expectedLitersPerHour = FormatDecimal(summaries.Where(s => s.ExpectedLitersPerHour > 0).Select(s => s.ExpectedLitersPerHour).DefaultIfEmpty(0m).Average())
            };
        }

        private string BuildChartDataJson(
            List<MonthSummary> monthlySummaries,
            List<string> siteNames,
            List<ConsumptionRow> currentMonthConsumption,
            List<TankMovementRow> currentMonthTankRows,
            ReportDataBundle data,
            List<string> lvTypeNames,
            List<string> heTypeNames)
        {
            var monthLabels = monthlySummaries.Select(s => s.Month.ToString("MMM yy", CultureInfo.InvariantCulture)).ToList();
            var fuelUsedSeries = monthlySummaries.Select(s => Math.Round(s.TotalFuelUsed, 0)).ToList();
            var fuelReceivedSeries = monthlySummaries.Select(s => Math.Round(s.TotalFuelReceived, 0)).ToList();
            var fuelIssuedSeries = monthlySummaries.Select(s => Math.Round(s.TotalFuelIssued, 0)).ToList();
            var distanceSeries = monthlySummaries.Select(s => Math.Round(s.TotalDistance, 0)).ToList();
            var engineHoursSeries = monthlySummaries.Select(s => Math.Round(s.TotalEngineHours, 0)).ToList();
            var fuelLostSeries = monthlySummaries.Select(s => Math.Round(s.TotalFuelLost, 0)).ToList();
            var kmPerLiterSeries = monthlySummaries.Select(s => Math.Round(s.KmPerLiter, 2)).ToList();
            var expectedKmPerLiterSeries = monthlySummaries.Select(s => Math.Round(s.ExpectedKmPerLiter, 2)).ToList();
            var litersPerHourSeries = monthlySummaries.Select(s => Math.Round(s.LitersPerHour, 2)).ToList();
            var expectedLitersPerHourSeries = monthlySummaries.Select(s => Math.Round(s.ExpectedLitersPerHour, 2)).ToList();

            var runningAvg = ComputeRunningAverage(fuelUsedSeries);

            var siteFuelUsed = new List<decimal>();
            var siteFuelLost = new List<decimal>();
            var siteDelivered = new List<decimal>();
            var siteIssued = new List<decimal>();
            var siteLvActual = new List<decimal>();
            var siteLvExpected = new List<decimal>();
            var siteHeActual = new List<decimal>();
            var siteHeExpected = new List<decimal>();
            var siteHeFuel = new List<decimal>();
            var siteHeLost = new List<decimal>();
            var siteDistance = new List<decimal>();

            foreach (var siteName in siteNames)
            {
                var siteRows = currentMonthConsumption.Where(r => ResolveConsumptionSiteName(data, r) == siteName).ToList();
                siteFuelUsed.Add(Math.Round(siteRows.Sum(r => r.TotalFuel), 0));
                siteFuelLost.Add(Math.Round(siteRows.Sum(r => r.FuelLost), 0));
                siteDistance.Add(Math.Round(siteRows.Sum(r => r.TotalDistance), 0));

                var lvRows = siteRows.Where(r => r.IsKmL).ToList();
                var lvFuel = lvRows.Sum(r => r.TotalFuel);
                var lvDist = lvRows.Sum(r => r.TotalDistance);
                siteLvActual.Add(SafeDivide(lvDist, lvFuel));
                siteLvExpected.Add(ComputeExpectedAverage(lvRows, data.VehicleLookup));

                var heRows = siteRows.Where(r => !r.IsKmL).ToList();
                var heFuel = heRows.Sum(r => r.TotalFuel);
                var heHours = heRows.Sum(r => r.EngineHours);
                siteHeActual.Add(SafeDivide(heFuel, heHours));
                siteHeExpected.Add(ComputeExpectedAverage(heRows, data.VehicleLookup));
                siteHeFuel.Add(Math.Round(heFuel, 0));
                siteHeLost.Add(Math.Round(heRows.Sum(r => r.FuelLost), 0));

                var siteTanks = currentMonthTankRows.Where(r => ResolveTankSiteName(data.TankSiteLookup, r.TankId) == siteName).ToList();
                siteDelivered.Add(Math.Round(siteTanks.Where(IsReceiptReason).Sum(r => PositiveValue(r.VolumeChange)), 0));
                siteIssued.Add(Math.Round(siteTanks.Where(IsIssueReason).Sum(r => Math.Abs(r.VolumeChange)), 0));
            }

            var lvTypeFuel = new List<decimal>();
            var lvTypeActual = new List<decimal>();
            var lvTypeExpected = new List<decimal>();
            foreach (var typeName in lvTypeNames)
            {
                var rows = currentMonthConsumption.Where(r => r.IsKmL && ResolveVehicleType(data.VehicleLookup, r.VehicleId) == typeName).ToList();
                lvTypeFuel.Add(Math.Round(rows.Sum(r => r.TotalFuel), 0));
                lvTypeActual.Add(SafeDivide(rows.Sum(r => r.TotalDistance), rows.Sum(r => r.TotalFuel)));
                lvTypeExpected.Add(ComputeExpectedAverage(rows, data.VehicleLookup));
            }

            var heTypeFuel = new List<decimal>();
            var heTypeActual = new List<decimal>();
            var heTypeExpected = new List<decimal>();
            var heTypeAvgHrs = new List<decimal>();
            foreach (var typeName in heTypeNames)
            {
                var rows = currentMonthConsumption.Where(r => !r.IsKmL && ResolveVehicleType(data.VehicleLookup, r.VehicleId) == typeName).ToList();
                heTypeFuel.Add(Math.Round(rows.Sum(r => r.TotalFuel), 0));
                heTypeActual.Add(SafeDivide(rows.Sum(r => r.TotalFuel), rows.Sum(r => r.EngineHours)));
                heTypeExpected.Add(ComputeExpectedAverage(rows, data.VehicleLookup));
                var unitCount = rows.Select(r => r.VehicleId).Distinct().Count();
                heTypeAvgHrs.Add(SafeDivide(rows.Sum(r => r.EngineHours), unitCount));
            }

            var heFuelLostMonthlySeries = monthlySummaries.Select(s =>
            {
                var heRows = FilterMonth(data.ConsumptionRows, s.Month).Where(r => !r.IsKmL).ToList();
                return Math.Round(heRows.Sum(r => r.FuelLost), 0);
            }).ToList();
            var heEngineHoursMonthlySeries = monthlySummaries.Select(s =>
            {
                var heRows = FilterMonth(data.ConsumptionRows, s.Month).Where(r => !r.IsKmL).ToList();
                return Math.Round(heRows.Sum(r => r.EngineHours), 0);
            }).ToList();

            var charts = new Dictionary<string, object>
            {
                ["c_execFuel"] = BarLineChart(monthLabels, "Fuel Used GPS", fuelUsedSeries, "#0078D4", "Average", runningAvg, "#107C10"),
                ["c_issDeliv"] = GroupedBarChart(monthLabels, "Delivered", fuelReceivedSeries, "#0078D4", "Fuel Dispensed", fuelIssuedSeries, "#D13438"),
                ["c_stockTrend"] = GroupedBarChart(monthLabels, "Delivered", fuelReceivedSeries, "#0078D4", "Fuel Dispensed", fuelIssuedSeries, "#D13438"),
                ["c_lvFuSite"] = GroupedBarChart(siteNames, "Fuel Used GPS", siteFuelUsed, "#0078D4", "Fuel Lost", siteFuelLost, "#D13438"),
                ["c_lvFuPct"] = SimpleBarChart(siteNames, "% Lost", siteFuelUsed.Zip(siteFuelLost, (used, lost) => SafePercent(lost, used)).ToList(), "#D13438"),
                ["c_lvEffLine"] = DualLineChart(monthLabels, "Actual km/L", kmPerLiterSeries, "#0078D4", "Expected km/L", expectedKmPerLiterSeries, "#107C10", true),
                ["c_lvEffType"] = GroupedBarChart(lvTypeNames, "Actual", lvTypeActual, "#0078D4", "Expected", lvTypeExpected, "#C8C6C4"),
                ["c_lvDistSite"] = SimpleBarChart(siteNames, "Distance", siteDistance, "#0078D4"),
                ["c_lvDistTrend"] = SimpleBarChart(monthLabels, "Distance", distanceSeries, "#0078D4"),
                ["c_heDashType"] = DoughnutChart(heTypeNames, heTypeFuel),
                ["c_heDashSite"] = SimpleBarChart(siteNames, "Fuel Used GPS", siteHeFuel, "#D97706"),
                ["c_heFuSite"] = SimpleBarChart(siteNames, "Fuel Lost", siteHeLost, "#D13438"),
                ["c_heFuTrend"] = SimpleBarChart(monthLabels, "Fuel Lost", heFuelLostMonthlySeries, "#D13438"),
                ["c_heEngTrend"] = SimpleBarChart(monthLabels, "Engine Hrs", heEngineHoursMonthlySeries, "#D97706"),
                ["c_heEngAvg"] = SimpleBarChart(heTypeNames, "Avg Hrs", heTypeAvgHrs, "#D97706"),
                ["c_heEffSite"] = GroupedBarChart(siteNames, "Actual", siteHeActual, "#D97706", "Expected", siteHeExpected, "#C8C6C4"),
                ["c_heEffTrend"] = DualLineChart(monthLabels, "Actual L/hr", litersPerHourSeries, "#D97706", "Expected L/hr", expectedLitersPerHourSeries, "#C8C6C4", true),
                ["c_siteFuelTrend"] = BuildSiteMultiLineChart(monthlySummaries, siteNames, data, isDistance: false),
                ["c_siteLostTrend"] = BuildSiteMultiLineChart(monthlySummaries, siteNames, data, isDistance: true)
            };

            return JsonConvert.SerializeObject(charts, new JsonSerializerSettings
            {
                NullValueHandling = NullValueHandling.Ignore,
                Formatting = Formatting.None
            });
        }

        private static List<decimal> ComputeRunningAverage(List<decimal> series)
        {
            var result = new List<decimal>();
            for (var i = 0; i < series.Count; i++)
            {
                var window = series.Take(i + 1);
                result.Add(Math.Round(window.Average(), 0));
            }
            return result;
        }

        private object BuildSiteMultiLineChart(List<MonthSummary> monthlySummaries, List<string> siteNames, ReportDataBundle data, bool isDistance)
        {
            var palette = new[] { "#0078D4", "#107C10", "#D97706", "#D13438", "#8764B8", "#038387", "#605E5C", "#C19C00" };
            var labels = monthlySummaries.Select(s => s.Month.ToString("MMM yy", CultureInfo.InvariantCulture)).ToList();
            var datasets = siteNames.Select((site, index) =>
            {
                var color = palette[index % palette.Length];
                var values = monthlySummaries.Select(s =>
                {
                    var monthRows = FilterMonth(data.ConsumptionRows, s.Month)
                        .Where(r => ResolveConsumptionSiteName(data, r) == site)
                        .ToList();
                    return isDistance
                        ? Math.Round(monthRows.Sum(r => r.FuelLost), 0)
                        : Math.Round(monthRows.Sum(r => r.TotalFuel), 0);
                }).ToList();
                return (object)new
                {
                    label = site,
                    data = values,
                    borderColor = color,
                    borderWidth = 2,
                    pointRadius = 3,
                    tension = 0.3,
                    fill = false
                };
            }).ToArray();

            return new
            {
                type = "line",
                data = new { labels, datasets },
                options = ChartOptions()
            };
        }

        private static object BarLineChart(IEnumerable<string> labels, string barLabel, IEnumerable<decimal> barData, string barColor, string lineLabel, IEnumerable<decimal> lineData, string lineColor)
        {
            return new
            {
                type = "bar",
                data = new
                {
                    labels,
                    datasets = new object[]
                    {
                        new { label = barLabel, data = barData.Select(v => Math.Round(v, 1)), backgroundColor = barColor, borderRadius = 4, order = 2 },
                        new { label = lineLabel, data = lineData.Select(v => Math.Round(v, 1)), type = "line", borderColor = lineColor, borderWidth = 2, pointRadius = 3, tension = 0.3, fill = false, order = 1 }
                    }
                },
                options = ChartOptions()
            };
        }

        private static object GroupedBarChart(IEnumerable<string> labels, string label1, IEnumerable<decimal> data1, string color1, string label2, IEnumerable<decimal> data2, string color2)
        {
            return new
            {
                type = "bar",
                data = new
                {
                    labels,
                    datasets = new object[]
                    {
                        new { label = label1, data = data1.Select(v => Math.Round(v, 1)), backgroundColor = color1, borderRadius = 4 },
                        new { label = label2, data = data2.Select(v => Math.Round(v, 1)), backgroundColor = color2, borderRadius = 4 }
                    }
                },
                options = ChartOptions()
            };
        }

        private static object SimpleBarChart(IEnumerable<string> labels, string label, IEnumerable<decimal> data, string color)
        {
            return new
            {
                type = "bar",
                data = new
                {
                    labels,
                    datasets = new object[]
                    {
                        new { label, data = data.Select(v => Math.Round(v, 1)), backgroundColor = color, borderRadius = 4 }
                    }
                },
                options = ChartOptions()
            };
        }

        private static object DualLineChart(IEnumerable<string> labels, string line1Label, IEnumerable<decimal> line1Data, string color1, string line2Label, IEnumerable<decimal> line2Data, string color2, bool dashedLine2 = false)
        {
            return new
            {
                type = "line",
                data = new
                {
                    labels,
                    datasets = new object[]
                    {
                        new { label = line1Label, data = line1Data.Select(v => Math.Round(v, 2)), borderColor = color1, borderWidth = 2, pointRadius = 3, tension = 0.3, fill = false },
                        new { label = line2Label, data = line2Data.Select(v => Math.Round(v, 2)), borderColor = color2, borderWidth = 2, borderDash = dashedLine2 ? new[] { 5, 5 } : Array.Empty<int>(), pointRadius = 3, tension = 0.3, fill = false }
                    }
                },
                options = ChartOptions()
            };
        }

        private static object DoughnutChart(IEnumerable<string> labels, IEnumerable<decimal> data)
        {
            var palette = new[] { "#0078D4", "#107C10", "#D97706", "#D13438", "#8764B8", "#038387", "#605E5C", "#C19C00" };
            return new
            {
                type = "doughnut",
                data = new
                {
                    labels,
                    datasets = new object[]
                    {
                        new { data = data.Select(v => Math.Round(v, 1)), backgroundColor = palette.Take(data.Count()) }
                    }
                },
                options = new
                {
                    responsive = true,
                    maintainAspectRatio = false,
                    plugins = new { legend = new { display = true, position = "right", labels = new { font = new { size = 9 } } } }
                }
            };
        }

        private static object ChartOptions()
        {
            return new
            {
                responsive = true,
                maintainAspectRatio = false,
                plugins = new { legend = new { display = false } },
                layout = new { padding = new { bottom = 4 } },
                scales = new
                {
                    x = new { ticks = new { font = new { size = 9 }, padding = 2 }, grid = new { display = false } },
                    y = new { beginAtZero = true, grace = 0, ticks = new { font = new { size = 9 }, padding = 2 }, grid = new { color = "rgba(0,0,0,0.04)" } }
                }
            };
        }

        private sealed record SiteLookup(int SiteId, string SiteName);
        private sealed record VehicleSnapshot(int VehicleId, string HyoungNo, int? VehicleTypeId, string VehicleType, int? SiteId, string SiteName, bool IsKmL, decimal ExpectedAverage);
        private sealed record ConsumptionRow(int VehicleId, int SiteId, DateTime Date, decimal TotalFuel, decimal TotalDistance, decimal EngineHours, decimal FuelLost, bool IsKmL);
        private sealed record TankMovementRow(int Id, int TankId, DateTime Timestamp, VolumeChangeReasonEnum ChangeReason, decimal VolumeChange, decimal NewVolume);
        private sealed record StockControlRow(string SiteName, decimal OpeningStock, decimal Delivered, decimal Issued, decimal TransfersIn, decimal TransfersOut, decimal Adjustments, decimal ExpectedClosing, decimal ActualClosing, decimal Variance, decimal VariancePercent);
        private sealed record ReportFilters(int? SiteId, string? SiteName, IReadOnlyCollection<int> LightVehicleTypeIds, string? LightVehicleTypeName, IReadOnlyCollection<int> HeavyEquipmentTypeIds, string? HeavyEquipmentTypeName);
        private sealed record ReportDataBundle(
            DateTime MonthAnchor,
            DateTime MonthEnd,
            IReadOnlyDictionary<int, string> SiteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> VehicleLookup,
            List<ConsumptionRow> ConsumptionRows,
            List<TankMovementRow> TankRows,
            IReadOnlyDictionary<int, string> TankSiteLookup,
            IReadOnlyDictionary<int, TankMovementRow> OpeningTankBoundaries,
            IReadOnlyDictionary<int, TankMovementRow> ClosingTankBoundaries);
        private sealed record MonthSummary(
            DateTime Month,
            decimal TotalFuelUsed,
            decimal TotalDistance,
            decimal TotalEngineHours,
            decimal TotalFuelReceived,
            decimal TotalFuelIssued,
            decimal TotalFuelLost,
            decimal FuelLostPercent,
            decimal KmPerLiter,
            decimal ExpectedKmPerLiter,
            decimal LitersPerHour,
            decimal ExpectedLitersPerHour);
        private sealed record SubsetSummary(decimal ActualRate, decimal ExpectedRate);
        private sealed record WeekRange(int WeekNumber, string WeekLabel, DateTime StartDate, DateTime EndDate);
        private sealed record WeeklySummary(int WeekNumber, string WeekLabel, DateTime StartDate, DateTime EndDate, MonthSummary Summary);

        private enum MatrixMode
        {
            LvFuel,
            LvEfficiency,
            LvDistance,
            HeFuelLost,
            HeEngineHours,
            HeEfficiency
        }
    }
}