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
using System.Text;
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
                    vehicle.VehicleCode,
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

            var tankNameLookup = await _context.Tanks
                .AsNoTracking()
                .Select(tank => new { tank.Id, tank.Name })
                .ToDictionaryAsync(
                    tank => tank.Id,
                    tank => NormalizeLabel(tank.Name),
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

            return new ReportDataBundle(monthAnchor, monthEnd, siteLookup, vehicleLookup, consumptionRows, tankRows, tankSiteLookup, tankNameLookup, openingTankBoundaries, closingTankBoundaries);
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
            var stockSiteInsights = BuildStockSiteInsights(siteNames, stockControlRows, currentMonthConsumption, currentMonthTankRows, data);
            var stockSiteKpis = BuildStockSiteKpis(stockControlRows);
            var stockSiteStackEntries = BuildStockSiteStackEntries(stockControlRows);
            var fuelFlowSummary = BuildFuelFlowSummary(currentMonthTankRows);
            var fuelFlowHierarchy = BuildFuelFlowHierarchy(siteNames, currentMonthTankRows, currentMonthConsumption, data);
            var fuelFlowDiagramSvg = BuildFuelFlowDiagramSvg(siteNames, currentMonthTankRows, currentMonthConsumption, data);
            var fuelFlowTopVehicleTypes = BuildFuelFlowTopVehicleTypes(currentMonthConsumption, data);
            var fuelFlowTopVehicles = BuildFuelFlowTopVehicles(currentMonthConsumption, data);
            var currentMonthSummary = BuildMonthSummary(data.MonthAnchor, currentMonthConsumption, currentMonthTankRows, data.VehicleLookup);
            var lvCurrentMonthRows = currentMonthConsumption.Where(row => row.IsKmL).ToList();
            var lvDispensedTotal = lvCurrentMonthRows.Sum(row => row.TotalFuel);
            var lvFuelLostTotal = lvCurrentMonthRows.Sum(row => row.FuelLost);
            var lvFuelUsedGpsTotal = Math.Max(0m, lvDispensedTotal - lvFuelLostTotal);
            var lvDistanceTotal = lvCurrentMonthRows.Sum(row => row.TotalDistance);
            var lvFuelLostPct = SafePercent(lvFuelLostTotal, lvDispensedTotal);
            var lvSectionKpis = new[]
            {
                Kpi(FormatNumber(lvDispensedTotal, "L"), "Total Fuel Dispensed", "km/L vehicles"),
                Kpi(FormatNumber(lvFuelUsedGpsTotal, "L"), "Total Fuel Used GPS", "Dispensed minus loss"),
                Kpi(FormatNumber(lvDistanceTotal, "km"), "Total Distance", "GPS distance"),
                Kpi(FormatNumber(lvFuelLostTotal, "L"), "Total Fuel Lost", "Excess over GPS"),
                Kpi(FormatPercent(lvFuelLostPct), "% Fuel Lost", "Loss / dispensed")
            };
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
                reportSubtitle = "Tenacy & Co (EA) Ltd — Fleet Management System",
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
                chartDataJson = BuildChartDataJson(monthlySummaries, siteNames, currentMonthConsumption, currentMonthTankRows, data, lvTypeNames, heTypeNames, stockSiteStackEntries),
                stockSitePairs,
                stockSiteKpis,
                stockSiteStacks = stockSiteStackEntries.Select(e =>
                {
                    var match = stockControlRows.FirstOrDefault(r => r.SiteName == e.SiteName);
                    return (object)new
                    {
                        siteName = e.SiteName,
                        chartId = e.ChartId,
                        showKpis = match != null,
                        delivered = match != null ? FormatWholeNumber(match.Delivered) : string.Empty,
                        dispensed = match != null ? FormatWholeNumber(match.Issued) : string.Empty,
                        transferOut = match != null ? FormatWholeNumber(match.TransfersOut) : string.Empty
                    };
                }).ToList(),
                stockHighlights = siteHighlights,
                stockControlSummary,
                stockControlHighlights,
                stockSiteInsights,
                fuelFlowSummary,
                fuelFlowHierarchy,
                fuelFlowDiagramSvg,
                fuelFlowTopVehicleTypes,
                fuelFlowTopVehicles,
                lvSectionKpis,
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
                reportSubtitle = "Tenacy & Co (EA) Ltd — Fleet Management System",
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

        private List<object> BuildStockSiteInsights(
            IEnumerable<string> siteNames,
            IEnumerable<StockControlRow> stockRows,
            IEnumerable<ConsumptionRow> currentMonthConsumption,
            IEnumerable<TankMovementRow> currentMonthTankRows,
            ReportDataBundle data)
        {
            var stockLookup = stockRows.ToDictionary(row => row.SiteName, row => row);
            var consumptionRows = currentMonthConsumption.ToList();
            var tankRows = currentMonthTankRows.ToList();

            return siteNames
                .Select(siteName =>
                {
                    stockLookup.TryGetValue(siteName, out var stockRow);

                    var siteTankRows = tankRows
                        .Where(row => ResolveTankSiteName(data.TankSiteLookup, row.TankId) == siteName)
                        .ToList();

                    var issuedTotal = siteTankRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange));
                    var issuedDays = siteTankRows
                        .Where(IsIssueReason)
                        .Select(row => row.Timestamp.Date)
                        .Distinct()
                        .Count();
                    if (issuedDays == 0)
                    {
                        issuedDays = 1;
                    }

                    var siteVehicleRows = consumptionRows
                        .Where(row => ResolveConsumptionSiteName(data, row) == siteName)
                        .ToList();

                    var topVehicleTypes = siteVehicleRows
                        .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                        .Select(group => new
                        {
                            TypeName = group.Key,
                            FuelUsed = group.Sum(row => row.TotalFuel)
                        })
                        .Where(item => item.FuelUsed > 0)
                        .OrderByDescending(item => item.FuelUsed)
                        .Take(3)
                        .ToList();

                    var vehicleTypeMix = topVehicleTypes.Any()
                        ? string.Join(" | ", topVehicleTypes.Select(item => $"{item.TypeName} {FormatNumber(item.FuelUsed, "L")}"))
                        : "No vehicle consumption rows for this month";

                    return new
                    {
                        siteName,
                        openingStock = FormatNumber(stockRow?.OpeningStock ?? 0m, "L"),
                        expectedClosing = FormatNumber(stockRow?.ExpectedClosing ?? 0m, "L"),
                        actualClosing = FormatNumber(stockRow?.ActualClosing ?? 0m, "L"),
                        variance = $"{FormatSigned(stockRow?.Variance ?? 0m)} L",
                        variancePercent = FormatSignedPercent(stockRow?.VariancePercent ?? 0m),
                        avgDailyConsumption = FormatNumber(SafeDivide(issuedTotal, issuedDays), "L/day"),
                        fuelDispensed = FormatNumber(issuedTotal, "L"),
                        vehicleTypeMix
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

        private object BuildFuelFlowSummary(IEnumerable<TankMovementRow> currentMonthTankRows)
        {
            var tankRows = currentMonthTankRows.ToList();
            var delivered = tankRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange));
            var transferIn = tankRows.Where(IsTransferInReason).Sum(row => PositiveValue(row.VolumeChange));
            var adjustmentIn = tankRows.Where(row => IsAdjustmentReason(row) && row.VolumeChange > 0m).Sum(row => row.VolumeChange);
            var dispensed = tankRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange));
            var transferOut = tankRows.Where(IsTransferOutReason).Sum(row => Math.Abs(row.VolumeChange));
            var adjustmentOut = tankRows.Where(row => IsAdjustmentReason(row) && row.VolumeChange < 0m).Sum(row => Math.Abs(row.VolumeChange));

            return new
            {
                totalInput = FormatNumber(delivered + transferIn + adjustmentIn, "L"),
                totalOutput = FormatNumber(dispensed + transferOut + adjustmentOut, "L"),
                delivered = FormatNumber(delivered, "L"),
                transferIn = FormatNumber(transferIn, "L"),
                adjustmentIn = FormatNumber(adjustmentIn, "L"),
                dispensed = FormatNumber(dispensed, "L"),
                transferOut = FormatNumber(transferOut, "L"),
                adjustmentOut = FormatNumber(adjustmentOut, "L")
            };
        }

        private object BuildFuelFlowHierarchy(
            IEnumerable<string> siteNames,
            IEnumerable<TankMovementRow> currentMonthTankRows,
            IEnumerable<ConsumptionRow> currentMonthConsumption,
            ReportDataBundle data)
        {
            var tankRows = currentMonthTankRows.ToList();
            var consumptionRows = currentMonthConsumption.ToList();

            var siteAmounts = siteNames
                .Select(siteName => new
                {
                    Name = siteName,
                    Amount = tankRows
                        .Where(row => ResolveTankSiteName(data.TankSiteLookup, row.TankId) == siteName)
                        .Where(IsIssueReason)
                        .Sum(row => Math.Abs(row.VolumeChange))
                })
                .Where(item => item.Amount > 0m)
                .OrderByDescending(item => item.Amount)
                .Take(3)
                .ToList();

            var tankAmounts = tankRows
                .Where(IsIssueReason)
                .GroupBy(row => row.TankId)
                .Select(group => new
                {
                    Name = ResolveTankName(data.TankNameLookup, group.Key),
                    Subtitle = ResolveTankSiteName(data.TankSiteLookup, group.Key),
                    Amount = group.Sum(row => Math.Abs(row.VolumeChange))
                })
                .Where(item => item.Amount > 0m)
                .OrderByDescending(item => item.Amount)
                .Take(3)
                .ToList();

            var vehicleTypeAmounts = consumptionRows
                .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                .Select(group => new
                {
                    Name = group.Key,
                    Subtitle = $"{group.Select(row => ResolveConsumptionSiteName(data, row)).Distinct().Count()} sites",
                    Amount = group.Sum(row => row.TotalFuel)
                })
                .Where(item => item.Amount > 0m)
                .OrderByDescending(item => item.Amount)
                .Take(3)
                .ToList();

            var vehicleAmounts = consumptionRows
                .GroupBy(row => row.VehicleId)
                .Select(group => new
                {
                    Name = ResolveVehicleName(data.VehicleLookup, group.Key),
                    Subtitle = ResolveVehicleType(data.VehicleLookup, group.Key),
                    Amount = group.Sum(row => row.TotalFuel)
                })
                .Where(item => item.Amount > 0m)
                .OrderByDescending(item => item.Amount)
                .Take(3)
                .ToList();

            return new
            {
                sites = BuildFuelFlowItems(siteAmounts.Select(item => (item.Name, item.Amount, string.Empty)).ToList()),
                tanks = BuildFuelFlowItems(tankAmounts.Select(item => (item.Name, item.Amount, item.Subtitle)).ToList()),
                vehicleTypes = BuildFuelFlowItems(vehicleTypeAmounts.Select(item => (item.Name, item.Amount, item.Subtitle)).ToList()),
                vehicles = BuildFuelFlowItems(vehicleAmounts.Select(item => (item.Name, item.Amount, item.Subtitle)).ToList())
            };
        }

        private string BuildFuelFlowDiagramSvg(
            IEnumerable<string> siteNames,
            IEnumerable<TankMovementRow> currentMonthTankRows,
            IEnumerable<ConsumptionRow> currentMonthConsumption,
            ReportDataBundle data)
        {
            var tankRows = currentMonthTankRows.ToList();
            var consumptionRows = currentMonthConsumption.ToList();
            var delivered = tankRows.Where(IsReceiptReason).Sum(row => PositiveValue(row.VolumeChange));
            var transferIn = tankRows.Where(IsTransferInReason).Sum(row => PositiveValue(row.VolumeChange));
            var adjustmentIn = tankRows.Where(row => IsAdjustmentReason(row) && row.VolumeChange > 0m).Sum(row => row.VolumeChange);
            var totalDispensed = tankRows.Where(IsIssueReason).Sum(row => Math.Abs(row.VolumeChange));
            if (totalDispensed <= 0m)
            {
                return "<svg viewBox=\"0 0 980 360\" class=\"fuel-flow-svg\" role=\"img\" aria-label=\"Fuel movement flow diagram\"><text x=\"490\" y=\"180\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#605e5c\">No dispensed fuel rows for the selected period</text></svg>";
            }

            var siteNodes = siteNames
                .Select(siteName => new FuelFlowStageNode(
                    $"site:{siteName}",
                    siteName,
                    string.Empty,
                    tankRows.Where(row => ResolveTankSiteName(data.TankSiteLookup, row.TankId) == siteName && IsIssueReason(row)).Sum(row => Math.Abs(row.VolumeChange)),
                    "#A3A3A3"))
                .Where(node => node.Amount > 0m)
                .OrderByDescending(node => node.Amount)
                .Take(3)
                .ToList();

            var selectedSites = siteNodes.Select(node => node.Label).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var tankNodes = tankRows
                .Where(IsIssueReason)
                .Where(row => selectedSites.Contains(ResolveTankSiteName(data.TankSiteLookup, row.TankId)))
                .GroupBy(row => row.TankId)
                .Select(group => new FuelFlowStageNode(
                    $"tank:{group.Key}",
                    ResolveTankName(data.TankNameLookup, group.Key),
                    ResolveTankSiteName(data.TankSiteLookup, group.Key),
                    group.Sum(row => Math.Abs(row.VolumeChange)),
                    "#B8B8B8"))
                .Where(node => node.Amount > 0m)
                .OrderByDescending(node => node.Amount)
                .Take(3)
                .ToList();

            var typePalette = new[] { "#0F62FE", "#D12771", "#FF832B" };
            var typeNodes = consumptionRows
                .Where(row => selectedSites.Contains(ResolveConsumptionSiteName(data, row)))
                .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                .Select((group, index) => new FuelFlowStageNode(
                    $"type:{group.Key}",
                    group.Key,
                    $"{group.Select(row => ResolveConsumptionSiteName(data, row)).Distinct().Count()} sites",
                    group.Sum(row => row.TotalFuel),
                    typePalette[index % typePalette.Length]))
                .Where(node => node.Amount > 0m)
                .OrderByDescending(node => node.Amount)
                .Take(3)
                .ToList();

            var selectedTypes = typeNodes.Select(node => node.Label).ToHashSet(StringComparer.OrdinalIgnoreCase);

            var vehicleNodes = consumptionRows
                .Where(row => selectedSites.Contains(ResolveConsumptionSiteName(data, row)))
                .Where(row => selectedTypes.Contains(ResolveVehicleType(data.VehicleLookup, row.VehicleId)))
                .GroupBy(row => row.VehicleId)
                .Select(group => new FuelFlowStageNode(
                    $"vehicle:{group.Key}",
                    ResolveVehicleName(data.VehicleLookup, group.Key),
                    $"{ResolveVehicleType(data.VehicleLookup, group.Key)} | {ResolveVehicleSiteName(data.VehicleLookup, group.Key)}",
                    group.Sum(row => row.TotalFuel),
                    typePalette[Math.Abs(ResolveVehicleType(data.VehicleLookup, group.Key).GetHashCode()) % typePalette.Length]))
                .Where(node => node.Amount > 0m)
                .OrderByDescending(node => node.Amount)
                .Take(3)
                .ToList();

            var inputNodes = new List<FuelFlowStageNode>();
            if (delivered > 0m)
            {
                inputNodes.Add(new FuelFlowStageNode("input:delivered", "DELIVERED", FormatNumber(delivered, "L"), delivered, "#0F62FE"));
            }
            if (transferIn > 0m)
            {
                inputNodes.Add(new FuelFlowStageNode("input:transferin", "TRANSFER IN", FormatNumber(transferIn, "L"), transferIn, "#107C10"));
            }
            if (adjustmentIn > 0m)
            {
                inputNodes.Add(new FuelFlowStageNode("input:adjustin", "ADJUST IN", FormatNumber(adjustmentIn, "L"), adjustmentIn, "#8764B8"));
            }

            var rootNode = new FuelFlowStageNode("root", "FUEL DISPENSED", FormatNumber(totalDispensed, "L"), totalDispensed, "#9E9E9E");
            var inputBoxes = LayoutFuelFlowColumn(inputNodes, 18m, 82m, 20m, 210m, 16m, 28m);
            var rootBox = new FuelFlowNodeBox(rootNode.Key, 165m, 92m, 16m, 176m, rootNode.Label, rootNode.Subtitle, rootNode.Color, rootNode.Amount);
            var siteBoxes = LayoutFuelFlowColumn(siteNodes, 325m, 82m, 20m, 210m, 16m, 28m);
            var tankBoxes = LayoutFuelFlowColumn(tankNodes, 520m, 82m, 20m, 210m, 16m, 28m);
            var typeBoxes = LayoutFuelFlowColumn(typeNodes, 715m, 82m, 20m, 210m, 16m, 28m);
            var vehicleBoxes = LayoutFuelFlowColumn(vehicleNodes, 900m, 82m, 20m, 210m, 16m, 28m);

            var boxLookup = inputBoxes
                .Concat(new[] { rootBox })
                .Concat(siteBoxes)
                .Concat(tankBoxes)
                .Concat(typeBoxes)
                .Concat(vehicleBoxes)
                .ToDictionary(box => box.Key);

            var flows = new List<FuelFlowLink>();
            flows.AddRange(inputNodes.Select(node => new FuelFlowLink(node.Key, rootNode.Key, node.Amount, node.Color, 0.45m)));
            flows.AddRange(siteNodes.Select(node => new FuelFlowLink(rootNode.Key, node.Key, node.Amount, "#8AB4F8", 0.55m)));

            foreach (var tank in tankNodes)
            {
                flows.Add(new FuelFlowLink($"site:{tank.Subtitle}", tank.Key, tank.Amount, "#9CC2F7", 0.45m));
            }

            foreach (var tank in tankNodes)
            {
                var tankSite = tank.Subtitle;
                var siteTypeRows = consumptionRows
                    .Where(row => ResolveConsumptionSiteName(data, row) == tankSite)
                    .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                    .Where(group => selectedTypes.Contains(group.Key))
                    .Select(group => new { TypeName = group.Key, Amount = group.Sum(row => row.TotalFuel) })
                    .Where(item => item.Amount > 0m)
                    .ToList();

                var siteTypeTotal = siteTypeRows.Sum(item => item.Amount);
                if (siteTypeTotal <= 0m)
                {
                    continue;
                }

                foreach (var type in siteTypeRows)
                {
                    var allocated = tank.Amount * SafeDivide(type.Amount, siteTypeTotal);
                    if (allocated <= 0m)
                    {
                        continue;
                    }

                    var typeNode = typeNodes.FirstOrDefault(node => node.Label == type.TypeName);
                    if (typeNode != null)
                    {
                        flows.Add(new FuelFlowLink(tank.Key, typeNode.Key, allocated, typeNode.Color, 0.38m));
                    }
                }
            }

            foreach (var type in typeNodes)
            {
                var typeVehicleRows = consumptionRows
                    .Where(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId) == type.Label)
                    .GroupBy(row => row.VehicleId)
                    .Select(group => new { VehicleId = group.Key, Amount = group.Sum(row => row.TotalFuel) })
                    .Where(item => vehicleNodes.Any(node => node.Key == $"vehicle:{item.VehicleId}") && item.Amount > 0m)
                    .ToList();

                foreach (var vehicle in typeVehicleRows)
                {
                    var vehicleNode = vehicleNodes.FirstOrDefault(node => node.Key == $"vehicle:{vehicle.VehicleId}");
                    if (vehicleNode != null)
                    {
                        flows.Add(new FuelFlowLink(type.Key, vehicleNode.Key, vehicle.Amount, type.Color, 0.45m));
                    }
                }
            }

            var maxFlow = flows.Select(flow => flow.Amount).DefaultIfEmpty(totalDispensed).Max();
            var svg = new StringBuilder();
            svg.Append("<svg viewBox=\"0 0 980 360\" class=\"fuel-flow-svg\" role=\"img\" aria-label=\"Fuel movement flow distribution diagram\">");
            svg.Append("<text x=\"490\" y=\"24\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#201f1e\">Fuel Movement Flow Distribution</text>");

            foreach (var flow in flows.Where(flow => boxLookup.ContainsKey(flow.SourceKey) && boxLookup.ContainsKey(flow.TargetKey)))
            {
                svg.Append(BuildFuelFlowPath(boxLookup[flow.SourceKey], boxLookup[flow.TargetKey], flow.Amount, maxFlow, flow.Color, flow.Opacity));
                svg.Append(BuildFuelFlowAmountLabel(boxLookup[flow.SourceKey], boxLookup[flow.TargetKey], flow.Amount, flow.Color));
            }

            foreach (var box in inputBoxes) svg.Append(BuildFuelFlowNode(box, false));
            svg.Append(BuildFuelFlowNode(rootBox, true));
            foreach (var box in siteBoxes) svg.Append(BuildFuelFlowNode(box, false));
            foreach (var box in tankBoxes) svg.Append(BuildFuelFlowNode(box, false));
            foreach (var box in typeBoxes) svg.Append(BuildFuelFlowNode(box, false));
            foreach (var box in vehicleBoxes) svg.Append(BuildFuelFlowNode(box, false));
            svg.Append("</svg>");
            return svg.ToString();
        }

        private List<object> BuildFuelFlowTopVehicleTypes(IEnumerable<ConsumptionRow> currentMonthConsumption, ReportDataBundle data)
        {
            var rows = currentMonthConsumption.ToList();
            var totalFuel = rows.Sum(row => row.TotalFuel);
            var maxFuel = rows
                .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                .Select(group => group.Sum(row => row.TotalFuel))
                .DefaultIfEmpty(0m)
                .Max();

            return rows
                .GroupBy(row => ResolveVehicleType(data.VehicleLookup, row.VehicleId))
                .Select(group => new
                {
                    typeName = group.Key,
                    fuelUsed = FormatNumber(group.Sum(row => row.TotalFuel), "L"),
                    sharePercent = FormatPercent(SafePercent(group.Sum(row => row.TotalFuel), totalFuel)),
                    shareWidth = FormatPercent(SafePercent(group.Sum(row => row.TotalFuel), maxFuel)),
                    note = $"{group.Select(row => ResolveConsumptionSiteName(data, row)).Distinct().Count()} sites"
                })
                .Where(item => ParseDecimal(item.fuelUsed.Replace(",", string.Empty).Replace(" L", string.Empty)) > 0m)
                .OrderByDescending(item => ParseDecimal(item.fuelUsed.Replace(",", string.Empty).Replace(" L", string.Empty)))
                .Take(5)
                .Cast<object>()
                .ToList();
        }

        private List<object> BuildFuelFlowTopVehicles(IEnumerable<ConsumptionRow> currentMonthConsumption, ReportDataBundle data)
        {
            var rows = currentMonthConsumption.ToList();
            var totalFuel = rows.Sum(row => row.TotalFuel);
            var vehicleGroups = rows
                .GroupBy(row => row.VehicleId)
                .Select(group => new
                {
                    vehicleId = group.Key,
                    fuel = group.Sum(row => row.TotalFuel)
                })
                .Where(item => item.fuel > 0m)
                .OrderByDescending(item => item.fuel)
                .ToList();
            var maxFuel = vehicleGroups.Select(item => item.fuel).DefaultIfEmpty(0m).Max();

            return vehicleGroups
                .Take(5)
                .Select(item => (object)new
                {
                    vehicleName = ResolveVehicleName(data.VehicleLookup, item.vehicleId),
                    fuelUsed = FormatNumber(item.fuel, "L"),
                    sharePercent = FormatPercent(SafePercent(item.fuel, totalFuel)),
                    shareWidth = FormatPercent(SafePercent(item.fuel, maxFuel)),
                    note = $"{ResolveVehicleType(data.VehicleLookup, item.vehicleId)} | {ResolveVehicleSiteName(data.VehicleLookup, item.vehicleId)}"
                })
                .ToList();
        }

        private static List<object> BuildFuelFlowItems(List<(string Name, decimal Amount, string Subtitle)> items)
        {
            var maxAmount = items.Select(item => item.Amount).DefaultIfEmpty(0m).Max();
            return items
                .Select(item => (object)new
                {
                    name = item.Name,
                    amount = FormatNumber(item.Amount, "L"),
                    shareWidth = FormatPercent(SafePercent(item.Amount, maxAmount)),
                    subtitle = item.Subtitle
                })
                .ToList();
        }

        private static List<FuelFlowNodeBox> LayoutFuelFlowColumn(List<FuelFlowStageNode> nodes, decimal x, decimal top, decimal gap, decimal maxHeight, decimal width = 24m, decimal minHeight = 34m)
        {
            var result = new List<FuelFlowNodeBox>();
            if (!nodes.Any())
            {
                return result;
            }

            var total = nodes.Sum(node => node.Amount);
            var usableHeight = maxHeight - gap * (nodes.Count - 1);
            var currentY = top;
            foreach (var node in nodes)
            {
                var proportionalHeight = total > 0m ? usableHeight * SafeDivide(node.Amount, total) : usableHeight / nodes.Count;
                var height = Math.Max(minHeight, proportionalHeight);
                result.Add(new FuelFlowNodeBox(node.Key, x, currentY, width, height, node.Label, node.Subtitle, node.Color, node.Amount));
                currentY += height + gap;
            }

            return result;
        }

        private static string BuildFuelFlowPath(FuelFlowNodeBox source, FuelFlowNodeBox target, decimal amount, decimal maxFlow, string color, decimal opacity)
        {
            var startX = source.X + source.Width;
            var startY = source.Y + source.Height / 2m;
            var endX = target.X;
            var endY = target.Y + target.Height / 2m;
            var cx1 = startX + 72m;
            var cx2 = endX - 72m;
            var strokeWidth = Math.Max(6m, 26m * SafeDivide(amount, maxFlow));
            return string.Concat(
                "<path d='M ", Fmt(startX), " ", Fmt(startY),
                " C ", Fmt(cx1), " ", Fmt(startY), ", ", Fmt(cx2), " ", Fmt(endY), ", ", Fmt(endX), " ", Fmt(endY),
                "' fill='none' stroke='", color,
                "' stroke-opacity='", Fmt(opacity),
                "' stroke-width='", Fmt(strokeWidth),
                "' stroke-linecap='round'/>"
            );
        }

        private static string BuildFuelFlowNode(FuelFlowNodeBox box, bool isRoot)
        {
            var labelX = isRoot ? box.X + 8m : box.X + box.Width + 8m;
            var titleY = box.Y + (isRoot ? box.Height / 2m - 5m : 11m);
            var subtitleY = isRoot ? titleY + 15m : titleY + 13m;
            var rect = string.Concat(
                "<rect x='", Fmt(box.X),
                "' y='", Fmt(box.Y),
                "' width='", Fmt(box.Width),
                "' height='", Fmt(box.Height),
                "' rx='2' fill='", box.Color, "'/>"
            );
            var title = string.Concat(
                "<text x='", Fmt(labelX),
                "' y='", Fmt(titleY),
                "' text-anchor='start' font-size='10' font-weight='700' fill='#201f1e'>",
                EscapeSvg(box.Label),
                "</text>"
            );
            var subtitleText = string.IsNullOrWhiteSpace(box.Subtitle)
                ? string.Empty
                : string.Concat(
                    "<text x='", Fmt(labelX),
                    "' y='", Fmt(subtitleY),
                    "' text-anchor='start' font-size='9' font-weight='400' fill='#605e5c'>",
                    EscapeSvg(box.Subtitle),
                    "</text>");
            return rect + title + subtitleText;
        }

        private static string BuildFuelFlowAmountLabel(FuelFlowNodeBox source, FuelFlowNodeBox target, decimal amount, string color)
        {
            var labelX = (source.X + source.Width + target.X) / 2m;
            var labelY = (source.Y + source.Height / 2m + target.Y + target.Height / 2m) / 2m;
            var text = EscapeSvg(FormatNumber(amount, "L"));
            return string.Concat(
                "<rect x='", Fmt(labelX - 20m),
                "' y='", Fmt(labelY - 8m),
                "' width='40' height='16' rx='8' fill='#ffffff' fill-opacity='0.92' stroke='", color, "' stroke-opacity='0.35'/>",
                "<text x='", Fmt(labelX),
                "' y='", Fmt(labelY + 3m),
                "' text-anchor='middle' font-size='8' font-weight='700' fill='#201f1e'>",
                text,
                "</text>");
        }

        private static string Fmt(decimal value)
        {
            return value.ToString("0.##", CultureInfo.InvariantCulture);
        }

        private static string EscapeSvg(string value)
        {
            return value
                .Replace("&", "&amp;", StringComparison.Ordinal)
                .Replace("<", "&lt;", StringComparison.Ordinal)
                .Replace(">", "&gt;", StringComparison.Ordinal)
                .Replace("\"", "&quot;", StringComparison.Ordinal)
                .Replace("'", "&apos;", StringComparison.Ordinal);
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
                data.TankNameLookup,
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

        private static string ResolveVehicleName(IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, int vehicleId)
        {
            return vehicleLookup.TryGetValue(vehicleId, out var vehicle) && !string.IsNullOrWhiteSpace(vehicle.VehicleCode)
                ? vehicle.VehicleCode
                : $"VEHICLE {vehicleId}";
        }

        private static string ResolveVehicleSiteName(IReadOnlyDictionary<int, VehicleSnapshot> vehicleLookup, int vehicleId)
        {
            return vehicleLookup.TryGetValue(vehicleId, out var vehicle) && !string.IsNullOrWhiteSpace(vehicle.SiteName)
                ? vehicle.SiteName
                : "UNASSIGNED";
        }

        private static string ResolveTankSiteName(IReadOnlyDictionary<int, string> tankSiteLookup, int tankId)
        {
            return tankSiteLookup.TryGetValue(tankId, out var siteName) ? siteName : "UNASSIGNED";
        }

        private static string ResolveTankName(IReadOnlyDictionary<int, string> tankNameLookup, int tankId)
        {
            return tankNameLookup.TryGetValue(tankId, out var tankName) ? tankName : $"TANK {tankId}";
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
            List<string> heTypeNames,
            List<StockSiteStackEntry> stockSiteStackEntries)
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
            var siteLvDistance = new List<decimal>();
            var siteLvFuelLost = new List<decimal>();
            var siteLvLostPct = new List<decimal>();

            foreach (var siteName in siteNames)
            {
                var siteRows = currentMonthConsumption.Where(r => ResolveConsumptionSiteName(data, r) == siteName).ToList();
                siteFuelUsed.Add(Math.Round(siteRows.Sum(r => r.TotalFuel), 0));
                siteFuelLost.Add(Math.Round(siteRows.Sum(r => r.FuelLost), 0));
                siteDistance.Add(Math.Round(siteRows.Sum(r => r.TotalDistance), 0));

                var lvRows = siteRows.Where(r => r.IsKmL).ToList();
                var lvFuel = lvRows.Sum(r => r.TotalFuel);
                var lvDist = lvRows.Sum(r => r.TotalDistance);
                var lvLost = lvRows.Sum(r => r.FuelLost);
                siteLvActual.Add(SafeDivide(lvDist, lvFuel));
                siteLvExpected.Add(ComputeExpectedAverage(lvRows, data.VehicleLookup));
                siteLvDistance.Add(Math.Round(lvDist, 0));
                siteLvFuelLost.Add(Math.Round(lvLost, 0));
                siteLvLostPct.Add(SafePercent(lvLost, lvFuel));

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
            var lvTypeDistance = new List<decimal>();
            foreach (var typeName in lvTypeNames)
            {
                var rows = currentMonthConsumption.Where(r => r.IsKmL && ResolveVehicleType(data.VehicleLookup, r.VehicleId) == typeName).ToList();
                lvTypeFuel.Add(Math.Round(rows.Sum(r => r.TotalFuel), 0));
                lvTypeActual.Add(SafeDivide(rows.Sum(r => r.TotalDistance), rows.Sum(r => r.TotalFuel)));
                lvTypeExpected.Add(ComputeExpectedAverage(rows, data.VehicleLookup));
                lvTypeDistance.Add(Math.Round(rows.Sum(r => r.TotalDistance), 0));
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
                ["c_lv3_distSite"] = SimpleBarChart(siteNames, "Distance (km)", siteLvDistance, "#0078D4"),
                ["c_lv3_lostSite"] = BarLineChart(siteNames, "Fuel Lost (L)", siteLvFuelLost, "#D13438", "% Lost", siteLvLostPct, "#D97706"),
                ["c_lv3_distMonth"] = BarLineChart(monthLabels, "Distance", distanceSeries, "#0078D4", "Average", ComputeRunningAverage(distanceSeries), "#107C10"),
                ["c_lv3_distType"] = SimpleBarChart(lvTypeNames, "Distance (km)", lvTypeDistance, "#0078D4"),
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

            // Page 2 — Stock Analysis redesign
            foreach (var entry in stockSiteStackEntries)
            {
                charts[entry.ChartId] = BuildSiteMovementStackChart(entry.SiteName, monthlySummaries, data);
            }

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

        private static List<object> BuildStockSiteKpis(List<StockControlRow> stockControlRows)
        {
            return stockControlRows
                .Take(8)
                .Select(row => (object)new
                {
                    siteName = row.SiteName,
                    delivered = FormatWholeNumber(row.Delivered),
                    dispensed = FormatWholeNumber(row.Issued),
                    transferOut = FormatWholeNumber(row.TransfersOut)
                })
                .ToList();
        }

        private static List<StockSiteStackEntry> BuildStockSiteStackEntries(List<StockControlRow> stockControlRows)
        {
            return stockControlRows
                .Take(6)
                .Select((row, index) => new StockSiteStackEntry(row.SiteName, $"c_siteStack_{index}"))
                .ToList();
        }

        private object BuildSiteMovementStackChart(string siteName, List<MonthSummary> monthlySummaries, ReportDataBundle data)
        {
            var labels = monthlySummaries.Select(s => s.Month.ToString("MMM yy", CultureInfo.InvariantCulture)).ToList();

            decimal[] SeriesFor(Func<TankMovementRow, bool> filter, bool usePositive = false)
            {
                return monthlySummaries.Select(s =>
                {
                    var rows = FilterMonth(data.TankRows, s.Month)
                        .Where(r => ResolveTankSiteName(data.TankSiteLookup, r.TankId) == siteName)
                        .Where(filter)
                        .ToList();
                    var sum = usePositive
                        ? rows.Sum(r => PositiveValue(r.VolumeChange))
                        : rows.Sum(r => Math.Abs(r.VolumeChange));
                    return Math.Round(sum, 0);
                }).ToArray();
            }

            var delivered = SeriesFor(IsReceiptReason, usePositive: true);
            var dispensed = SeriesFor(IsIssueReason);
            var transferIn = SeriesFor(IsTransferInReason, usePositive: true);
            var transferOut = SeriesFor(IsTransferOutReason);
            var adjustments = SeriesFor(IsAdjustmentReason);

            var datasets = new object[]
            {
                new { label = "Delivered", data = delivered, backgroundColor = "#0078D4", stack = "mv", borderRadius = 2 },
                new { label = "Dispensed", data = dispensed, backgroundColor = "#D13438", stack = "mv", borderRadius = 2 },
                new { label = "Transfer In", data = transferIn, backgroundColor = "#107C10", stack = "mv", borderRadius = 2 },
                new { label = "Transfer Out", data = transferOut, backgroundColor = "#D97706", stack = "mv", borderRadius = 2 },
                new { label = "Adjustments", data = adjustments, backgroundColor = "#8764B8", stack = "mv", borderRadius = 2 }
            };

            return new
            {
                type = "bar",
                data = new { labels, datasets },
                options = StackedChartOptions()
            };
        }

        private static object StackedChartOptions()
        {
            return new
            {
                responsive = true,
                maintainAspectRatio = false,
                plugins = new { legend = new { display = false } },
                layout = new { padding = new { bottom = 4 } },
                scales = new
                {
                    x = new { stacked = true, ticks = new { font = new { size = 8 }, padding = 2 }, grid = new { display = false } },
                    y = new { stacked = true, beginAtZero = true, ticks = new { font = new { size = 8 }, padding = 2 }, grid = new { color = "rgba(0,0,0,0.04)" } }
                }
            };
        }

        private static object ChartOptionsWithLegend()
        {
            return new
            {
                responsive = true,
                maintainAspectRatio = false,
                plugins = new { legend = new { display = true, position = "top", labels = new { font = new { size = 9 }, boxWidth = 10, padding = 6 } } },
                layout = new { padding = new { bottom = 4 } },
                scales = new
                {
                    x = new { ticks = new { font = new { size = 9 }, padding = 2 }, grid = new { display = false } },
                    y = new { beginAtZero = true, ticks = new { font = new { size = 9 }, padding = 2 }, grid = new { color = "rgba(0,0,0,0.04)" } }
                }
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
        private sealed record VehicleSnapshot(int VehicleId, string VehicleCode, int? VehicleTypeId, string VehicleType, int? SiteId, string SiteName, bool IsKmL, decimal ExpectedAverage);
        private sealed record ConsumptionRow(int VehicleId, int SiteId, DateTime Date, decimal TotalFuel, decimal TotalDistance, decimal EngineHours, decimal FuelLost, bool IsKmL);
        private sealed record TankMovementRow(int Id, int TankId, DateTime Timestamp, VolumeChangeReasonEnum ChangeReason, decimal VolumeChange, decimal NewVolume);
        private sealed record StockControlRow(string SiteName, decimal OpeningStock, decimal Delivered, decimal Issued, decimal TransfersIn, decimal TransfersOut, decimal Adjustments, decimal ExpectedClosing, decimal ActualClosing, decimal Variance, decimal VariancePercent);
        private sealed record StockSiteStackEntry(string SiteName, string ChartId);
        private sealed record ReportFilters(int? SiteId, string? SiteName, IReadOnlyCollection<int> LightVehicleTypeIds, string? LightVehicleTypeName, IReadOnlyCollection<int> HeavyEquipmentTypeIds, string? HeavyEquipmentTypeName);
        private sealed record ReportDataBundle(
            DateTime MonthAnchor,
            DateTime MonthEnd,
            IReadOnlyDictionary<int, string> SiteLookup,
            IReadOnlyDictionary<int, VehicleSnapshot> VehicleLookup,
            List<ConsumptionRow> ConsumptionRows,
            List<TankMovementRow> TankRows,
            IReadOnlyDictionary<int, string> TankSiteLookup,
            IReadOnlyDictionary<int, string> TankNameLookup,
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
        private sealed record FuelFlowStageNode(string Key, string Label, string Subtitle, decimal Amount, string Color);
        private sealed record FuelFlowNodeBox(string Key, decimal X, decimal Y, decimal Width, decimal Height, string Label, string Subtitle, string Color, decimal Amount);
        private sealed record FuelFlowLink(string SourceKey, string TargetKey, decimal Amount, string Color, decimal Opacity);

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