/**
 * File: TankVolumeReportDataBuilder.cs
 * Purpose: Shared implementation that shapes TankVolumeHistoryDTO records into template-ready payloads.
 *          Extracted from ReportJobManager so both on-demand and scheduled report paths produce identical output.
 * Dependencies: TankVolumeHistoryDTO, VolumeChangeReasonEnum, Newtonsoft.Json (JToken)
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - BuildTankVolumeHistoryPayload: Full report with sparklines, consumption trends, variance
 * - BuildTransactionHistorySummaryPayload: Monthly aggregated summary report
 * - BuildTransactionNotes: Notes column (vehicle type, transfer arrow notation)
 */
using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities.enums;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Services
{
    /// <summary>
    /// Canonical implementation of the report data builder.
    /// Both ReportJobManager (on-demand) and ScheduledReportDeliveryService (scheduled)
    /// delegate to this class so every report has identical data quality.
    /// </summary>
    public class TankVolumeReportDataBuilder : ITankVolumeReportDataBuilder
    {
        // ── Reason-code category sets ──────────────────────────────────────────
        private static readonly HashSet<int> DeliveryReasons = new() { 2, 10 };   // Delivery, InTankDelivery
        private static readonly HashSet<int> DispensingReasons = new() { 6, 7 };  // Dispensing, AutomatedDispensing
        private static readonly HashSet<int> TransferReasons = new() { 3, 4 };    // TransferIn, TransferOut

        /// <summary>
        /// Display labels + CSS classes mapped to VolumeChangeReasonEnum integer values.
        /// </summary>
        private static readonly Dictionary<int, (string Label, string CssClass)> TypeInfo = new()
        {
            { 0,  ("Opening Stock",          "type-adjust")   },
            { 1,  ("Closing Stock",          "type-adjust")   },
            { 2,  ("Delivery",               "type-refill")   },
            { 3,  ("Transfer In",            "type-transfer") },
            { 4,  ("Transfer Out",           "type-transfer") },
            { 5,  ("Adjustment",             "type-adjust")   },
            { 6,  ("Manual Dispensing",      "type-dispense") },
            { 7,  ("Auto Dispense",          "type-dispense") },
            { 8,  ("Reconciliation",         "type-adjust")   },
            { 9,  ("Auto Reconciliation",    "type-adjust")   },
            { 10, ("In-Tank Delivery",       "type-refill")   },
        };

        // ── Default timezone (EAT = UTC+3) ─────────────────────────────────────
        private const string DefaultTimezoneId = "E. Africa Standard Time";

        // ====================================================================
        //  PUBLIC – Tank Volume History (detail report)
        // ====================================================================
        public object BuildTankVolumeHistoryPayload(
            IReadOnlyCollection<TankVolumeHistoryDTO> records,
            TankVolumeReportContext context)
        {
            var tz = ResolveTimeZone(context.TimezoneId);
            var createdBy = !string.IsNullOrWhiteSpace(context.CreatedBy) ? context.CreatedBy : "System";
            var dateFromText = context.DateFrom?.ToString("dd MMM yyyy") ?? "All";
            var dateToText = context.DateTo?.ToString("dd MMM yyyy") ?? "All";

            if (records == null || records.Count == 0)
                return BuildEmptyHistoryPayload(context.ReportTitle, createdBy, dateFromText, dateToText);

            var normalizedRecords = NormalizeToBusinessWindow(records);
            if (normalizedRecords.Count == 0)
                normalizedRecords = records.ToList();

            // ── Global summary aggregates ──────────────────────────────────────
            decimal globalDelivery = 0m, globalDispensed = 0m, globalTransfer = 0m;
            foreach (var r in normalizedRecords)
            {
                var code = (int)r.ChangeReason;
                var vol = Math.Abs(r.VolumeChange ?? 0m);
                if (DeliveryReasons.Contains(code)) globalDelivery += vol;
                if (DispensingReasons.Contains(code)) globalDispensed += vol;
                if (TransferReasons.Contains(code)) globalTransfer += vol;
            }
            var netBalanceChange = globalDelivery + globalTransfer - globalDispensed;

            // ── Group by TankId (sorted by TankName) ───────────────────────────
            var tankGroups = normalizedRecords
                .Where(r => r.TankId.HasValue)
                .GroupBy(r => r.TankId!.Value)
                .OrderBy(g => ResolveTankName(g.First(), g.Key, context.TankNameLookup))
                .ToList();

            // ── Build siteGroups: site → tanks[] + transactionGroups[] ─────────
            var siteMap = new Dictionary<string, (List<object> Tanks, List<object> TxGroups)>(
                StringComparer.OrdinalIgnoreCase);
            decimal grandClosingBalance = 0m;
            decimal globalTotalVariance = 0m;
            int globalRowNumber = 1;

            foreach (var group in tankGroups)
            {
                var tankRecords = group.OrderBy(r => r.Timestamp).ToList();
                var tankName = ResolveTankName(tankRecords[0], group.Key, context.TankNameLookup);
                var siteName = Sanitize(tankRecords[0].Site, "—");

                // Opening = NewVolume of first record minus its VolumeChange
                var firstRec = tankRecords[0];
                var openingBal = (firstRec.NewVolume ?? 0m) - (firstRec.VolumeChange ?? 0m);
                var closingBal = tankRecords[^1].NewVolume ?? 0m;
                grandClosingBalance += closingBal;

                decimal dispensingTotal = 0m; int dispensingCount = 0;
                decimal deliveryTotal = 0m; int deliveryCount = 0;
                decimal transferInTotal = 0m; int transferInCount = 0;
                decimal transferOutTotal = 0m; int transferOutCount = 0;

                foreach (var r in tankRecords)
                {
                    var code = (int)r.ChangeReason;
                    var vol = Math.Abs(r.VolumeChange ?? 0m);
                    if (code == 6 || code == 7) { dispensingTotal += vol; dispensingCount++; }
                    if (code == 2 || code == 10) { deliveryTotal += vol; deliveryCount++; }
                    if (code == 3) { transferInTotal += vol; transferInCount++; }
                    if (code == 4) { transferOutTotal += vol; transferOutCount++; }
                }

                var expectedClosing = openingBal + deliveryTotal + transferInTotal
                                      - dispensingTotal - transferOutTotal;
                var expectedMatch = Math.Abs(expectedClosing - closingBal) < 1m;
                var transferCount = transferInCount + transferOutCount;
                var tankVariance = closingBal - expectedClosing;
                globalTotalVariance += tankVariance;

                // ── Consumption trend (sparkline data) ─────────────────────────
                var dispensingRecords = tankRecords
                    .Where(r => (int)r.ChangeReason == 6 || (int)r.ChangeReason == 7)
                    .ToList();
                var trendDays = BuildDailyConsumptionTrend(dispensingRecords, tz, 2);
                var trendDirection = trendDays.Count >= 2
                    ? (trendDays[^1].Value > trendDays[^2].Value ? "up"
                       : trendDays[^1].Value < trendDays[^2].Value ? "down" : "flat")
                    : "flat";

                var last2DispensingDays = BuildLast2DispensingDays(tankRecords, dispensingRecords, tz, 3);

                var trendMaxVal = trendDays.Count > 0 ? trendDays.Max(d => d.Value) : 1m;
                if (trendMaxVal == 0m) trendMaxVal = 1m;

                var tankEntry = new
                {
                    tankName,
                    fuelType = "Diesel",
                    openingBalance = openingBal.ToString("N2"),
                    closingBalance = closingBal.ToString("N2"),
                    expectedClosing = expectedClosing.ToString("N2"),
                    expectedMatch,
                    variance = new
                    {
                        value = tankVariance.ToString("N2"),
                        formatted = tankVariance.ToString("+0.00;-0.00;0.00"),
                        isNegative = tankVariance < 0,
                        percentage = openingBal != 0m
                            ? ((tankVariance / openingBal) * 100m).ToString("N1")
                            : "0.0",
                    },
                    consumptionTrend = new
                    {
                        days = trendDays.Select(d => new
                        {
                            label = d.Label,
                            date = d.Date,
                            value = d.Value,
                            formatted = d.Value.ToString("N2"),
                            barHeight = Math.Max((int)Math.Round(d.Value / trendMaxVal * 100m), 15),
                        }).ToList(),
                        direction = trendDirection,
                        isUp = trendDirection == "up",
                        isDown = trendDirection == "down",
                    },
                    dispensing = new { total = dispensingTotal.ToString("N2"), count = dispensingCount, last2Days = last2DispensingDays },
                    delivery = new { total = deliveryTotal.ToString("N2"), count = deliveryCount },
                    transfer = new { total = Math.Abs(transferInTotal - transferOutTotal).ToString("N2"), count = transferCount },
                };

                // ── Transaction detail rows ────────────────────────────────────
                decimal groupNet = 0m;
                var rows = new List<object>();
                foreach (var r in tankRecords)
                {
                    var code = (int)r.ChangeReason;
                    if (!TypeInfo.TryGetValue(code, out var typeInfo))
                        typeInfo = ($"Type {code}", "type-adjust");

                    var volChange = r.VolumeChange ?? 0m;
                    var volFormatted = volChange.ToString("+0.00;-0.00;0.00");
                    groupNet += volChange;

                    var localTime = ToLocal(r.Timestamp, tz);

                    rows.Add(new
                    {
                        rowNumber = globalRowNumber++,
                        siteName,
                        timestamp = new
                        {
                            date = localTime.ToString("dd MMM yyyy"),
                            time = localTime.ToString("HH:mm"),
                        },
                        tankName,
                        vehiclePlate = !string.IsNullOrWhiteSpace(r.VehicleName) ? r.VehicleName : "—",
                        changeReasonLabel = typeInfo.Label,
                        changeReasonClass = typeInfo.CssClass,
                        isPositive = volChange >= 0,
                        volumeChange = volFormatted,
                        balanceAfter = (r.NewVolume ?? 0m).ToString("N2"),
                        operatorName = !string.IsNullOrWhiteSpace(r.RecordedByUserName) ? r.RecordedByUserName
                                          : !string.IsNullOrWhiteSpace(r.RecordedBy) ? r.RecordedBy
                                          : "— (System)",
                        notes = BuildTransactionNotes(r),
                    });
                }

                var txGroup = new
                {
                    groupName = tankName,
                    fuelType = "Diesel",
                    openingBalance = openingBal.ToString("N2"),
                    closingBalance = closingBal.ToString("N2"),
                    groupNet = groupNet.ToString("+0.00;-0.00;0.00"),
                    rows,
                };

                if (!siteMap.TryGetValue(siteName, out var siteData))
                {
                    siteData = (new List<object>(), new List<object>());
                    siteMap[siteName] = siteData;
                }
                siteData.Tanks.Add(tankEntry);
                siteData.TxGroups.Add(txGroup);
            }

            // ── Site-level aggregates ──────────────────────────────────────────
            var recordsList = normalizedRecords.ToList();
            var siteGroupsPayload = siteMap
                .OrderBy(kv => kv.Key)
                .Select(kv =>
                {
                    var siteRecords = recordsList.Where(r => string.Equals(r.Site, kv.Key, StringComparison.OrdinalIgnoreCase)).ToList();
                    var siteTotalDispensing = siteRecords
                        .Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                        .Sum(r => Math.Abs(r.VolumeChange ?? 0m));
                    var uniqueDays = siteRecords
                        .Select(r => ToLocal(r.Timestamp, tz).Date)
                        .Distinct()
                        .Count();
                    if (uniqueDays == 0) uniqueDays = 1;
                    var avgDailyConsumption = siteTotalDispensing / uniqueDays;

                    return (object)new
                    {
                        siteName = kv.Key,
                        tanks = kv.Value.Tanks,
                        transactionGroups = kv.Value.TxGroups,
                        siteSummary = new
                        {
                            totalDispensing = siteTotalDispensing.ToString("N2"),
                            avgDailyConsumption = avgDailyConsumption.ToString("N2"),
                            daysInPeriod = uniqueDays,
                        },
                    };
                })
                .ToList();

            // ── Report subtitle ────────────────────────────────────────────────
            var subtitle = context.ReportSubtitle;
            if (string.IsNullOrWhiteSpace(subtitle))
            {
                string siteFilterName = context.SiteFilterId.HasValue
                    ? recordsList.FirstOrDefault(r => !string.IsNullOrWhiteSpace(r.Site))?.Site ?? "All Sites"
                    : "All Sites";
                string tankFilterName = context.TankFilterId.HasValue
                    ? recordsList.FirstOrDefault(r => !string.IsNullOrWhiteSpace(r.TankName))?.TankName ?? "All Tanks"
                    : "All Tanks";
                subtitle = $"{tankFilterName} - {siteFilterName}";
            }

            // ── 5-day sparkline trends for summary cards ───────────────────────
            var summaryTrends = new
            {
                transactions = BuildFiveDaySparkTrend(recordsList, tz, _ => 1m),
                dispensed = BuildFiveDaySparkTrend(recordsList, tz, r => DispensingReasons.Contains((int)r.ChangeReason) ? Math.Abs(r.VolumeChange ?? 0m) : 0m),
                transfer = BuildFiveDaySparkTrend(recordsList, tz, r => TransferReasons.Contains((int)r.ChangeReason) ? Math.Abs(r.VolumeChange ?? 0m) : 0m),
                delivery = BuildFiveDaySparkTrend(recordsList, tz, r => DeliveryReasons.Contains((int)r.ChangeReason) ? Math.Abs(r.VolumeChange ?? 0m) : 0m),
                variance = BuildFiveDaySparkTrend(recordsList, tz, r =>
                {
                    var vol = Math.Abs(r.VolumeChange ?? 0m);
                    if (DeliveryReasons.Contains((int)r.ChangeReason) || TransferReasons.Contains((int)r.ChangeReason)) return vol;
                    if (DispensingReasons.Contains((int)r.ChangeReason)) return -vol;
                    return 0m;
                }),
            };

            // ── Analytics — chart data for 7-day dispensing + vehicle type ──────
            var analyticsRecords = (context.AnalyticsRecords ?? recordsList).ToList();

            var allDispensingRecs = recordsList
                .Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                .ToList();

            var analyticsDispensingRecs = analyticsRecords
                .Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                .ToList();

            // 7-day daily dispensing (always 7 points, zero-filled)
            var dailyDispensingMap = analyticsDispensingRecs
                .GroupBy(r => ToLocal(r.Timestamp, tz).Date)
                .ToDictionary(
                    g => g.Key,
                    g => Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2)
                );

            var latestAnalyticsDate = dailyDispensingMap.Count > 0
                ? dailyDispensingMap.Keys.Max()
                : (context.DateTo?.Date ?? DateTime.Now.Date);

            var last7 = Enumerable.Range(0, 7)
                .Select(offset => latestAnalyticsDate.AddDays(offset - 6))
                .Select(date => new
                {
                    date,
                    volume = dailyDispensingMap.TryGetValue(date, out var value) ? value : 0m,
                })
                .ToList();

            var sevenDayTotal = last7.Sum(d => d.volume);
            var dailyAvg = last7.Count > 0 ? Math.Round(sevenDayTotal / last7.Count, 0) : 0m;
            var peakDay = last7.OrderByDescending(d => d.volume).FirstOrDefault();
            var lowestDay = last7.Where(d => d.volume > 0).OrderBy(d => d.volume).FirstOrDefault();

            // Vehicle type consumption (top 7)
            var vehicleTypeGroups = allDispensingRecs
                .GroupBy(r => Sanitize(r.VehicleType, "Other"))
                .Select(g => new
                {
                    type = g.Key,
                    litres = Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2)
                })
                .OrderByDescending(x => x.litres)
                .Take(7)
                .ToList();

            var vehicleTypeTotal = vehicleTypeGroups.Sum(v => v.litres);

            // Avg per fill + active vehicle count
            var dispensingTxnCount = allDispensingRecs.Count;
            var avgPerFill = dispensingTxnCount > 0
                ? Math.Round(globalDispensed / dispensingTxnCount, 1) : 0m;
            var activeVehicleCount = allDispensingRecs
                .Where(r => !string.IsNullOrWhiteSpace(r.VehicleName))
                .Select(r => r.VehicleName!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            // Chart data for JSON injection
            var chartData = new
            {
                dailyDispensing = new
                {
                    labels = last7.Select(d => d.date.ToString("ddd d")).ToArray(),
                    data = last7.Select(d => d.volume).ToArray(),
                },
                vehicleTypeConsumption = new
                {
                    labels = vehicleTypeGroups.Select(v => v.type).ToArray(),
                    data = vehicleTypeGroups.Select(v => v.litres).ToArray(),
                    total = vehicleTypeTotal,
                },
            };

            var analyticsJsonStr = JsonConvert.SerializeObject(chartData);

            // ── Final payload (JToken for safe anonymous-type serialization) ───
            var payload = new
            {
                reportTitle = context.ReportTitle ?? "Tank Volume History Report",
                reportSubtitle = subtitle,
                createdBy,
                dateFrom = dateFromText,
                dateTo = dateToText,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                summary = new
                {
                    totalTransactions = normalizedRecords.Count,
                    totalDispensed = globalDispensed.ToString("N2"),
                    totalTransfer = globalTransfer.ToString("N2"),
                    totalDelivery = globalDelivery.ToString("N2"),
                    netBalanceChange = netBalanceChange.ToString("+0.00;-0.00;0.00"),
                    grandClosingBalance = grandClosingBalance.ToString("N2"),
                    totalVariance = new
                    {
                        value = globalTotalVariance.ToString("N2"),
                        formatted = globalTotalVariance.ToString("+0.00;-0.00;0.00"),
                        isNegative = globalTotalVariance < 0,
                    },
                    trends = summaryTrends,
                },
                siteGroups = siteGroupsPayload,
                analytics = new
                {
                    kpis = new
                    {
                        sevenDayTotal = $"{sevenDayTotal:N0} L",
                        dailyAverage = $"{dailyAvg:N0} L",
                        peakDayLabel = peakDay != null ? peakDay.date.ToString("ddd dd MMM") : "\u2014",
                        peakDayVolume = peakDay != null ? $"{peakDay.volume:N0}" : "0",
                        lowestDayLabel = lowestDay != null ? lowestDay.date.ToString("ddd dd MMM") : "\u2014",
                        lowestDayVolume = lowestDay != null ? $"{lowestDay.volume:N0}" : "0",
                        avgPerVehicleFill = $"{avgPerFill:N1}",
                        fleetActiveCount = activeVehicleCount,
                    },
                },
                analyticsJson = analyticsJsonStr,
            };

            return JToken.FromObject(payload);
        }

        private static List<TankVolumeHistoryDTO> NormalizeToBusinessWindow(
            IReadOnlyCollection<TankVolumeHistoryDTO> records)
        {
            var normalized = new List<TankVolumeHistoryDTO>();

            foreach (var tankGroup in records
                .Where(r => r.TankId.HasValue)
                .GroupBy(r => r.TankId!.Value))
            {
                var ordered = tankGroup
                    .OrderBy(r => r.Timestamp)
                    .ThenBy(r => r.Id)
                    .ToList();

                if (ordered.Count == 0)
                {
                    continue;
                }

                var firstOpeningIndex = ordered.FindIndex(r => r.ChangeReason == VolumeChangeReasonEnum.OpeningStock);
                var lastClosingIndex = ordered.FindLastIndex(r => r.ChangeReason == VolumeChangeReasonEnum.ClosingStock);

                var startIndex = firstOpeningIndex >= 0 ? firstOpeningIndex : 0;
                var endIndex = lastClosingIndex >= startIndex ? lastClosingIndex : ordered.Count - 1;

                normalized.AddRange(ordered.Skip(startIndex).Take(endIndex - startIndex + 1));
            }

            return normalized
                .OrderBy(r => r.Timestamp)
                .ThenBy(r => r.TankId)
                .ThenBy(r => r.Id)
                .ToList();
        }

        // ====================================================================
        //  PUBLIC – Transaction History Summary (monthly aggregated)
        // ====================================================================
        public object BuildTransactionHistorySummaryPayload(
            IReadOnlyCollection<TankVolumeHistoryDTO> records,
            TankVolumeReportContext context)
        {
            var tz = ResolveTimeZone(context.TimezoneId);
            var createdBy = !string.IsNullOrWhiteSpace(context.CreatedBy) ? context.CreatedBy : "System";
            var dateFromText = context.DateFrom?.ToString("dd MMM yyyy") ?? "All";
            var dateToText = context.DateTo?.ToString("dd MMM yyyy") ?? "All";

            if (records == null || records.Count == 0)
            {
                var emptyChartData = new
                {
                    dailyTrend = new { labels = Array.Empty<string>(), data = Array.Empty<decimal>() },
                    txnTypeSplit = new { labels = new[] { "Dispensing", "Delivery", "Transfer", "Adjustment" }, data = new[] { 0, 0, 0, 0 } },
                    siteComparison = new { labels = Array.Empty<string>(), datasets = Array.Empty<object>() },
                    vehicleTypeConsumption = new { labels = Array.Empty<string>(), data = Array.Empty<decimal>(), total = 0m },
                    varianceGauges = Array.Empty<object>(),
                };
                return JToken.FromObject(new
                {
                    reportTitle = context.ReportTitle ?? "Transaction History Summary",
                    reportSubtitle = "",
                    generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    generatedBy = createdBy,
                    dateFrom = dateFromText,
                    dateTo = dateToText,
                    reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                    monthlyGroups = Array.Empty<object>(),
                    grandTotal = new { dispensing = "0.00", delivery = "0.00", transfer = "0.00", variance = "0.00", varianceIsNegative = false },
                    summary = new { totalTransactions = 0, totalDispensed = "0.00", totalDelivery = "0.00", totalTransfer = "0.00", netVariance = "0.00", monthsCovered = 0, sitesMonitored = 0, tanksMonitored = 0, avgDailyDispensed = "0" },
                    analytics = new
                    {
                        topVehicles = Array.Empty<object>(),
                        daysOfSupply = Array.Empty<object>(),
                        kpis = new { peakDayLabel = "\u2014", peakDayVolume = "0 L", avgDailyLabel = "0 L", avgDailyNote = "No data", lowestDayLabel = "\u2014", lowestDayVolume = "0 L", avgPerVehicleTxn = "0 L", lowStockAlertCount = 0, lowStockSites = "None", dispensingTxnCount = 0, deliveryTxnCount = 0 },
                    },
                    analyticsJson = JsonConvert.SerializeObject(emptyChartData),
                });
            }

            var monthNames = new[] { "", "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December" };

            var monthGroups = records
                .Where(r => r.TankId.HasValue)
                .GroupBy(r =>
                {
                    var local = ToLocal(r.Timestamp, tz);
                    return new { local.Year, local.Month };
                })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .ToList();

            decimal grandDispensing = 0m, grandDelivery = 0m, grandTransfer = 0m;
            var monthlyGroupsList = new List<object>();

            foreach (var monthGroup in monthGroups)
            {
                var year = monthGroup.Key.Year;
                var month = monthGroup.Key.Month;
                var monthLabel = $"{monthNames[month]} {year}";

                decimal monthDisp = 0m, monthDel = 0m, monthXfer = 0m;
                int monthDispCount = 0, monthDelCount = 0, monthXferCount = 0;

                var siteGroupMap = monthGroup
                    .GroupBy(r => Sanitize(r.Site, "—"))
                    .OrderBy(g => g.Key);

                var siteGroupsList = new List<object>();
                foreach (var siteGroup in siteGroupMap)
                {
                    var tankGroupMap = siteGroup
                        .GroupBy(r => r.TankId!.Value)
                        .OrderBy(g => ResolveTankName(g.First(), g.Key, context.TankNameLookup));

                    var tanksList = new List<object>();
                    foreach (var tankGroup in tankGroupMap)
                    {
                        var ordered = tankGroup.OrderBy(r => r.Timestamp).ToList();
                        var first = ordered[0];
                        var last = ordered[^1];
                        var tankName = ResolveTankName(first, tankGroup.Key, context.TankNameLookup);

                        var openingRaw = (first.NewVolume ?? 0m) - (first.VolumeChange ?? 0m);
                        var closingRaw = last.NewVolume ?? 0m;

                        decimal dispTotal = 0m, delTotal = 0m, xferTotal = 0m;
                        int dispCount = 0, delCount = 0, xferCount = 0;

                        foreach (var r in ordered)
                        {
                            var code = (int)r.ChangeReason;
                            var vol = r.VolumeChange ?? 0m;
                            if (DispensingReasons.Contains(code)) { dispTotal += Math.Abs(vol); dispCount++; }
                            if (DeliveryReasons.Contains(code)) { delTotal += vol; delCount++; }
                            if (TransferReasons.Contains(code)) { xferTotal += vol; xferCount++; }
                        }

                        var expectedClosing = openingRaw + delTotal + xferTotal - dispTotal;
                        var variance = closingRaw - expectedClosing;
                        var variancePercent = expectedClosing != 0m
                            ? Math.Round(variance / Math.Abs(expectedClosing) * 100m, 2)
                            : 0m;

                        var daySpan = Math.Max(1, (int)Math.Ceiling((last.Timestamp - first.Timestamp).TotalDays));
                        var avgDaily = Math.Round(dispTotal / daySpan, 2);

                        monthDisp += dispTotal;
                        monthDel += delTotal;
                        monthXfer += Math.Abs(xferTotal);
                        monthDispCount += dispCount;
                        monthDelCount += delCount;
                        monthXferCount += xferCount;

                        tanksList.Add(new
                        {
                            tankName,
                            openingBalance = openingRaw.ToString("N2"),
                            closingBalance = closingRaw.ToString("N2"),
                            expectedClosing = expectedClosing.ToString("N2"),
                            dispensing = new { total = dispTotal.ToString("N2"), count = dispCount },
                            delivery = new { total = delTotal.ToString("N2"), count = delCount },
                            transfer = new { total = Math.Abs(xferTotal).ToString("N2"), count = xferCount },
                            variance = variance.ToString("N2"),
                            varianceIsNegative = variance < -0.5m,
                            variancePercent = $"{variancePercent}%",
                            avgDailyConsumption = avgDaily.ToString("N2"),
                            totalTransactions = ordered.Count,
                        });
                    }

                    siteGroupsList.Add(new { siteName = siteGroup.Key, tanks = tanksList });
                }

                grandDispensing += monthDisp;
                grandDelivery += monthDel;
                grandTransfer += monthXfer;

                monthlyGroupsList.Add(new
                {
                    month = $"{year}-{month:D2}",
                    monthLabel,
                    year = year.ToString(),
                    siteGroups = siteGroupsList,
                    subtotal = new
                    {
                        dispensing = monthDisp.ToString("N2"),
                        dispensingCount = monthDispCount,
                        delivery = monthDel.ToString("N2"),
                        deliveryCount = monthDelCount,
                        transfer = monthXfer.ToString("N2"),
                        transferCount = monthXferCount,
                        variance = (monthDel + monthXfer - monthDisp).ToString("N2"),
                    },
                });
            }

            var netVariance = grandDelivery + grandTransfer - grandDispensing;

            // ═══ Analytics — charts, gauges, top vehicles, days of supply ═══
            var allDispensingRecords = records
                .Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                .ToList();

            // Daily consumption trend
            var dailyConsumption = allDispensingRecords
                .GroupBy(r => ToLocal(r.Timestamp, tz).Date)
                .OrderBy(g => g.Key)
                .Select(g => new { date = g.Key, volume = Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2) })
                .ToList();

            var totalDays = dailyConsumption.Count > 0 ? dailyConsumption.Count : 1;
            var avgDailyAll = Math.Round(grandDispensing / totalDays, 0);
            var peakDay = dailyConsumption.OrderByDescending(d => d.volume).FirstOrDefault();
            var lowestDay = dailyConsumption.OrderBy(d => d.volume).FirstOrDefault();

            // Transaction type split (counts)
            var dispensingTxnCount = allDispensingRecords.Count;
            var deliveryTxnCount = records.Count(r => DeliveryReasons.Contains((int)r.ChangeReason));
            var transferTxnCount = records.Count(r => TransferReasons.Contains((int)r.ChangeReason));
            var adjustmentTxnCount = Math.Max(0, records.Count - dispensingTxnCount - deliveryTxnCount - transferTxnCount);

            // Site comparison (per month × siteName → dispensed)
            var allSiteNames = records
                .Select(r => Sanitize(r.Site, "\u2014"))
                .Distinct().OrderBy(s => s).ToList();

            var monthKeysDistinct = records
                .Where(r => r.TankId.HasValue)
                .Select(r =>
                {
                    var local = ToLocal(r.Timestamp, tz);
                    return (local.Year, local.Month);
                })
                .Distinct()
                .OrderBy(k => k.Year).ThenBy(k => k.Month)
                .ToList();

            var siteComparisonDatasets = monthKeysDistinct.Select(mk =>
            {
                var label = $"{monthNames[mk.Month]} {mk.Year}";
                var siteDispMap = allDispensingRecords
                    .Where(r =>
                    {
                        var local = ToLocal(r.Timestamp, tz);
                        return local.Year == mk.Year && local.Month == mk.Month;
                    })
                    .GroupBy(r => Sanitize(r.Site, "\u2014"))
                    .ToDictionary(
                        g => g.Key,
                        g => Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2),
                        StringComparer.OrdinalIgnoreCase);

                return new
                {
                    label,
                    data = allSiteNames
                        .Select(s => siteDispMap.TryGetValue(s, out var v) ? v : 0m)
                        .ToArray()
                };
            }).ToList();

            // Vehicle type consumption (top 7)
            var vehicleTypeGroups = allDispensingRecords
                .GroupBy(r => Sanitize(r.VehicleType, "Other"))
                .Select(g => new
                {
                    type = g.Key,
                    litres = Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2)
                })
                .OrderByDescending(x => x.litres)
                .Take(7)
                .ToList();

            var vehicleTypeTotal = vehicleTypeGroups.Sum(v => v.litres);

            // Top 10 vehicles by consumption
            var topVehicles = allDispensingRecords
                .Where(r => !string.IsNullOrWhiteSpace(r.VehicleName))
                .GroupBy(r => r.VehicleName!.Trim())
                .Select(g =>
                {
                    var litres = Math.Round(g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)), 2);
                    var firstTankName = g.First().TankName ?? "";
                    var fuelType = firstTankName.IndexOf("PMS", StringComparison.OrdinalIgnoreCase) >= 0
                        ? "pms" : "ago";
                    return new { plate = g.Key, litres, txnCount = g.Count(), fuelType };
                })
                .OrderByDescending(v => v.litres)
                .Take(10)
                .ToList();

            var maxVehicleLitres = topVehicles.Any() ? topVehicles[0].litres : 1m;

            // Days of supply per site
            var daysOfSupplyList = records
                .Where(r => r.TankId.HasValue)
                .GroupBy(r => Sanitize(r.Site, "\u2014"))
                .Select(g =>
                {
                    var closingStock = g
                        .GroupBy(r => r.TankId!.Value)
                        .Select(tg => tg.OrderBy(r => r.Timestamp).Last().NewVolume ?? 0m)
                        .Sum();

                    var siteDispensed = g
                        .Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                        .Sum(r => Math.Abs(r.VolumeChange ?? 0m));

                    var siteRecords = g.OrderBy(r => r.Timestamp).ToList();
                    var siteDays = siteRecords.Count > 1
                        ? Math.Max(1, (int)Math.Ceiling((siteRecords[^1].Timestamp - siteRecords[0].Timestamp).TotalDays))
                        : 1;
                    var siteAvgDaily = Math.Round(siteDispensed / siteDays, 0);
                    var daysRemaining = siteAvgDaily > 0 ? (int)Math.Round(closingStock / siteAvgDaily, 0) : 999;
                    var widthPercent = Math.Min(100, (int)Math.Round((double)daysRemaining / 25.0 * 100.0));
                    var supplyStatus = daysRemaining >= 14 ? "good" : daysRemaining >= 7 ? "warn" : "bad";
                    var statusColor = supplyStatus == "good" ? "var(--success)"
                        : supplyStatus == "warn" ? "var(--warning)" : "var(--danger)";

                    return new
                    {
                        siteName = g.Key,
                        closingStock = Math.Round(closingStock, 0),
                        closingStockFormatted = closingStock.ToString("N0"),
                        avgDaily = siteAvgDaily,
                        avgDailyFormatted = siteAvgDaily.ToString("N0"),
                        days = daysRemaining,
                        status = supplyStatus,
                        statusColor,
                        widthPercent,
                    };
                })
                .OrderByDescending(s => s.days)
                .ToList();

            var lowStockSites = daysOfSupplyList.Where(s => s.days <= 10).ToList();

            // Variance gauges per tank (global)
            var varianceGauges = records
                .Where(r => r.TankId.HasValue)
                .GroupBy(r => r.TankId!.Value)
                .Select(g =>
                {
                    var ordered = g.OrderBy(r => r.Timestamp).ToList();
                    var firstRec = ordered[0];
                    var lastRec = ordered[^1];
                    var tankName = ResolveTankName(firstRec, g.Key, context.TankNameLookup);
                    var siteName = Sanitize(firstRec.Site, "\u2014");

                    var openingRaw = (firstRec.NewVolume ?? 0m) - (firstRec.VolumeChange ?? 0m);
                    var closingRaw = lastRec.NewVolume ?? 0m;
                    var dTotal = ordered.Where(r => DispensingReasons.Contains((int)r.ChangeReason))
                        .Sum(r => Math.Abs(r.VolumeChange ?? 0m));
                    var dlTotal = ordered.Where(r => DeliveryReasons.Contains((int)r.ChangeReason))
                        .Sum(r => r.VolumeChange ?? 0m);
                    var xTotal = ordered.Where(r => TransferReasons.Contains((int)r.ChangeReason))
                        .Sum(r => r.VolumeChange ?? 0m);

                    var expectedClosing = openingRaw + dlTotal + xTotal - dTotal;
                    var vari = closingRaw - expectedClosing;
                    var variPct = expectedClosing != 0m
                        ? Math.Abs(Math.Round(vari / Math.Abs(expectedClosing) * 100m, 2))
                        : 0m;

                    var gaugeStatus = variPct <= 0.005m ? "ok"
                        : variPct < 0.5m ? "ok"
                        : variPct < 2m ? "warn" : "bad";
                    var filledRatio = Math.Round(Math.Min(variPct / 2m, 1m), 4);

                    return new
                    {
                        tankName,
                        siteName,
                        variancePercent = Math.Round(variPct, 2),
                        isLoss = vari < 0,
                        status = gaugeStatus,
                        filledRatio,
                    };
                })
                .OrderByDescending(v => v.variancePercent)
                .ToList();

            // KPIs
            var avgPerVehicleTxn = dispensingTxnCount > 0
                ? Math.Round(grandDispensing / dispensingTxnCount, 1) : 0m;

            // Build chart data for JSON injection
            var chartData = new
            {
                dailyTrend = new
                {
                    labels = dailyConsumption.Select(d => d.date.ToString("MMM d")).ToArray(),
                    data = dailyConsumption.Select(d => d.volume).ToArray(),
                },
                txnTypeSplit = new
                {
                    labels = new[] { "Dispensing", "Delivery", "Transfer", "Adjustment" },
                    data = new[] { dispensingTxnCount, deliveryTxnCount, transferTxnCount, adjustmentTxnCount },
                },
                siteComparison = new
                {
                    labels = allSiteNames.ToArray(),
                    datasets = siteComparisonDatasets,
                },
                vehicleTypeConsumption = new
                {
                    labels = vehicleTypeGroups.Select(v => v.type).ToArray(),
                    data = vehicleTypeGroups.Select(v => v.litres).ToArray(),
                    total = vehicleTypeTotal,
                },
                varianceGauges,
            };

            var analyticsJsonStr = JsonConvert.SerializeObject(chartData);

            var payload = new
            {
                reportTitle = context.ReportTitle ?? "Transaction History Summary",
                reportSubtitle = context.ReportSubtitle ?? "",
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                generatedBy = createdBy,
                dateFrom = dateFromText,
                dateTo = dateToText,
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                monthlyGroups = monthlyGroupsList,
                grandTotal = new
                {
                    dispensing = grandDispensing.ToString("N2"),
                    delivery = grandDelivery.ToString("N2"),
                    transfer = grandTransfer.ToString("N2"),
                    variance = netVariance.ToString("N2"),
                    varianceIsNegative = netVariance < -0.5m,
                },
                summary = new
                {
                    totalTransactions = records.Count,
                    totalDispensed = grandDispensing.ToString("N2"),
                    totalDelivery = grandDelivery.ToString("N2"),
                    totalTransfer = grandTransfer.ToString("N2"),
                    netVariance = netVariance.ToString("N2"),
                    monthsCovered = monthGroups.Count,
                    sitesMonitored = records.Select(r => r.Site).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Count(),
                    tanksMonitored = records.Where(r => r.TankId.HasValue).Select(r => r.TankId!.Value).Distinct().Count(),
                    avgDailyDispensed = avgDailyAll.ToString("N0"),
                },
                analytics = new
                {
                    topVehicles = topVehicles.Select(v => new
                    {
                        v.plate,
                        litresFormatted = v.litres.ToString("N0"),
                        v.txnCount,
                        v.fuelType,
                        widthPercent = (int)Math.Round(v.litres / maxVehicleLitres * 100m),
                    }).ToList(),
                    daysOfSupply = daysOfSupplyList,
                    kpis = new
                    {
                        peakDayLabel = peakDay != null ? peakDay.date.ToString("dd MMM") : "\u2014",
                        peakDayVolume = peakDay != null ? $"{peakDay.volume:N0} L" : "0 L",
                        avgDailyLabel = $"{avgDailyAll:N0} L",
                        avgDailyNote = $"across {totalDays} days",
                        lowestDayLabel = lowestDay != null ? lowestDay.date.ToString("dd MMM") : "\u2014",
                        lowestDayVolume = lowestDay != null ? $"{lowestDay.volume:N0} L" : "0 L",
                        avgPerVehicleTxn = $"{avgPerVehicleTxn:N1} L",
                        lowStockAlertCount = lowStockSites.Count,
                        lowStockSites = lowStockSites.Any()
                            ? string.Join(" \u00B7 ", lowStockSites.Select(s => s.siteName))
                            : "None",
                        dispensingTxnCount,
                        deliveryTxnCount,
                    },
                },
                analyticsJson = analyticsJsonStr,
            };

            return JToken.FromObject(payload);
        }

        // ====================================================================
        //  STATIC HELPERS — shared by both payloads
        // ====================================================================

        /// <summary>Builds the Notes column text for a single transaction row.</summary>
        internal static string BuildTransactionNotes(TankVolumeHistoryDTO r)
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(r.VehicleName) && !string.IsNullOrWhiteSpace(r.VehicleType))
                parts.Add(r.VehicleType);

            if (!string.IsNullOrWhiteSpace(r.TransferTankName))
            {
                var arrow = r.ChangeReason == VolumeChangeReasonEnum.TransferIn ? "←" : "→";
                parts.Add($"{arrow} {r.TransferTankName}" +
                           (!string.IsNullOrWhiteSpace(r.TransferTankSite)
                               ? $" ({r.TransferTankSite})"
                               : ""));
            }

            return parts.Count > 0 ? string.Join(" · ", parts) : "";
        }

        // ── Timezone helpers ───────────────────────────────────────────────────

        private static TimeZoneInfo ResolveTimeZone(string? timezoneId)
        {
            if (string.IsNullOrWhiteSpace(timezoneId))
            {
                try { return TimeZoneInfo.FindSystemTimeZoneById(DefaultTimezoneId); }
                catch { return TimeZoneInfo.Utc; }
            }
            try { return TimeZoneInfo.FindSystemTimeZoneById(timezoneId); }
            catch { return TimeZoneInfo.Utc; }
        }

        private static DateTime ToLocal(DateTime timestamp, TimeZoneInfo tz)
        {
            if (timestamp.Kind == DateTimeKind.Utc)
                return TimeZoneInfo.ConvertTimeFromUtc(timestamp, tz);
            // Assume UTC if unspecified
            if (timestamp.Kind == DateTimeKind.Unspecified)
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(timestamp, DateTimeKind.Utc), tz);
            return timestamp;
        }

        // ── Tank name resolution ───────────────────────────────────────────────

        private static string ResolveTankName(TankVolumeHistoryDTO record, int tankId, IReadOnlyDictionary<int, string>? lookup)
        {
            if (lookup != null && lookup.TryGetValue(tankId, out var name))
                return name;
            return !string.IsNullOrWhiteSpace(record.TankName) ? record.TankName : $"Tank {tankId}";
        }

        private static string Sanitize(string? value, string fallback)
            => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        // ── Daily consumption trend ────────────────────────────────────────────

        private static List<(string Label, string Date, decimal Value)> BuildDailyConsumptionTrend(
            List<TankVolumeHistoryDTO> dispensingRecords,
            TimeZoneInfo tz,
            int numDays = 2)
        {
            if (dispensingRecords == null || dispensingRecords.Count == 0)
                return new List<(string, string, decimal)>();

            var dayNames = new[] { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

            var dailyMap = new Dictionary<string, decimal>();
            foreach (var r in dispensingRecords)
            {
                var localDate = ToLocal(r.Timestamp, tz).Date;
                var key = localDate.ToString("yyyy-MM-dd");
                if (!dailyMap.ContainsKey(key)) dailyMap[key] = 0m;
                dailyMap[key] += Math.Abs(r.VolumeChange ?? 0m);
            }

            return dailyMap
                .OrderBy(kv => kv.Key)
                .TakeLast(numDays)
                .Select(kv =>
                {
                    var d = DateTime.Parse(kv.Key);
                    return (dayNames[(int)d.DayOfWeek], kv.Key, kv.Value);
                })
                .ToList();
        }

        // ── Last 2 dispensing days ─────────────────────────────────────────────

        private static List<object> BuildLast2DispensingDays(
            List<TankVolumeHistoryDTO> tankAllRecords,
            List<TankVolumeHistoryDTO> dispensingRecords,
            TimeZoneInfo tz,
            int maxPreviousDays = 3)
        {
            if (tankAllRecords == null || tankAllRecords.Count == 0)
                return new List<object>();

            var dayNames = new[] { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };
            var dispensingByDate = dispensingRecords
                .GroupBy(r => ToLocal(r.Timestamp, tz).Date)
                .ToDictionary(g => g.Key, g => g.Sum(r => Math.Abs(r.VolumeChange ?? 0m)));

            var anchorDate = tankAllRecords.Max(r => ToLocal(r.Timestamp, tz).Date);
            var targets = new[] { anchorDate.AddDays(-2), anchorDate.AddDays(-1) };
            var used = new HashSet<DateTime>();
            var result = new List<object>();

            foreach (var target in targets)
            {
                DateTime? selected = null;
                for (var offset = 0; offset <= maxPreviousDays; offset++)
                {
                    var candidate = target.AddDays(-offset);
                    if (dispensingByDate.ContainsKey(candidate) && !used.Contains(candidate))
                    {
                        selected = candidate;
                        used.Add(candidate);
                        break;
                    }
                }

                if (!selected.HasValue) continue;

                var selectedDate = selected.Value;
                var value = dispensingByDate[selectedDate];
                result.Add(new
                {
                    date = selectedDate.ToString("yyyy-MM-dd"),
                    label = dayNames[(int)selectedDate.DayOfWeek],
                    value,
                    formatted = value.ToString("N2"),
                });
            }

            return result;
        }

        // ── 5-day sparkline trend ──────────────────────────────────────────────

        private static object BuildFiveDaySparkTrend(
            List<TankVolumeHistoryDTO> source,
            TimeZoneInfo tz,
            Func<TankVolumeHistoryDTO, decimal> valueSelector)
        {
            var neutral = new { direction = "neutral", isUp = false, isDown = false, points = "2,8 7,8 12,8 17,8 22,8" };

            if (source == null || source.Count == 0) return neutral;

            var dailySource = source
                .GroupBy(r => ToLocal(r.Timestamp, tz).Date)
                .Select(g => new { Date = g.Key, Value = g.Sum(valueSelector) })
                .OrderBy(x => x.Date)
                .ToList();

            if (dailySource.Count == 0) return neutral;

            var latestDate = dailySource[^1].Date;
            var dailyMap = dailySource.ToDictionary(x => x.Date, x => x.Value);
            var daily = new List<(DateTime Date, decimal Value)>();
            for (var offset = 4; offset >= 0; offset--)
            {
                var date = latestDate.AddDays(-offset);
                daily.Add((date, dailyMap.TryGetValue(date, out var value) ? value : 0m));
            }

            var last = daily[^1].Value;
            var previous = daily[^2].Value;
            var direction = last > previous ? "rise" : last < previous ? "fall" : "neutral";

            var values = daily.Select(d => d.Value).ToList();
            var minVal = values.Min();
            var maxVal = values.Max();

            int ToY(decimal value)
            {
                if (maxVal == minVal) return 8;
                var normalized = (value - minVal) / (maxVal - minVal);
                return (int)Math.Round(14m - (normalized * 10m));
            }

            var xPoints = new[] { 2, 7, 12, 17, 22 };
            var polylinePoints = string.Join(" ", daily.Select((d, idx) => $"{xPoints[idx]},{ToY(d.Value)}"));

            return new
            {
                direction,
                isUp = direction == "rise",
                isDown = direction == "fall",
                points = polylinePoints,
            };
        }

        // ── Empty-data fallback ────────────────────────────────────────────────

        private static object BuildEmptyHistoryPayload(string? title, string createdBy, string dateFrom, string dateTo)
        {
            var neutralTrend = new { direction = "neutral", isUp = false, isDown = false, points = "2,8 7,8 12,8 17,8 22,8" };
            var emptyChartData = new
            {
                dailyDispensing = new { labels = Array.Empty<string>(), data = Array.Empty<decimal>() },
                vehicleTypeConsumption = new { labels = Array.Empty<string>(), data = Array.Empty<decimal>(), total = 0m },
            };
            return JToken.FromObject(new
            {
                reportTitle = title ?? "Tank Volume History Report",
                reportSubtitle = "No data found",
                createdBy,
                dateFrom,
                dateTo,
                generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",
                summary = new
                {
                    totalTransactions = 0,
                    totalDispensed = "0.00",
                    totalTransfer = "0.00",
                    totalDelivery = "0.00",
                    netBalanceChange = "0.00",
                    grandClosingBalance = "0.00",
                    totalVariance = new { value = "0.00", formatted = "+0.00", isNegative = false },
                    trends = new
                    {
                        transactions = neutralTrend,
                        dispensed = neutralTrend,
                        transfer = neutralTrend,
                        delivery = neutralTrend,
                        variance = neutralTrend,
                    },
                },
                siteGroups = Array.Empty<object>(),
                analytics = new
                {
                    kpis = new
                    {
                        sevenDayTotal = "0 L",
                        dailyAverage = "0 L",
                        peakDayLabel = "\u2014",
                        peakDayVolume = "0",
                        lowestDayLabel = "\u2014",
                        lowestDayVolume = "0",
                        avgPerVehicleFill = "0.0",
                        fleetActiveCount = 0,
                    },
                },
                analyticsJson = JsonConvert.SerializeObject(emptyChartData),
            });
        }
    }
}
