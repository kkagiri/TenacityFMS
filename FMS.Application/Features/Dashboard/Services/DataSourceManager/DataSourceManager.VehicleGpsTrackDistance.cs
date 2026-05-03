/**
 * File: DataSourceManager.VehicleGpsTrackDistance.cs
 * Purpose: Provides dashboard data for GPSGate track-distance rankings using active vehicle-provider mappings.
 * Dependencies: GpsdataContext, DeviceProviderMappingEntity, ITrackingTrackInfoSummaryService, DataSourceMetadata
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - BuildMostVehicleTravelledGpsSnapshotAsync(): Produces ranked snapshot payloads for top vehicle, site, or vehicle-type travel distance.
 * - BuildMostVehicleTravelledGpsAggregatedAsync(): Produces time-series payloads for GPS travel-distance trend widgets.
 * - BuildGpsTrackDistanceAnalyticsAsync(): Resolves mappings, fetches daily summaries, and aggregates results for dashboard consumers.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.Devices;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const int GpsTrackDistanceMaxConcurrency = 6;

        private async Task<object> BuildMostVehicleTravelledGpsSnapshotAsync(
            DashboardMetricRequestDto request,
            string canonicalSource)
        {
            var analytics = await BuildGpsTrackDistanceAnalyticsAsync(request, canonicalSource);
            var topEntry = analytics.CurrentGroups.FirstOrDefault();
            var previousTopEntry = analytics.PreviousGroups.FirstOrDefault();

            return new
            {
                current = new
                {
                    value = topEntry?.MetricValue ?? 0m,
                    unit = "km",
                    timestamp = DateTime.UtcNow,
                    label = analytics.CurrentLabel
                },
                change = BuildChangePayload(topEntry?.MetricValue ?? 0m, previousTopEntry?.MetricValue ?? 0m),
                total = analytics.TotalMetric,
                categories = analytics.Categories,
                rows = analytics.Rows,
                timeSeries = analytics.TimeSeries,
                additionalInfo = new
                {
                    topEntity = topEntry?.Label ?? "No travel data",
                    groupBy = analytics.GroupBy,
                    aggregation = analytics.AggregationType,
                    vehicleCount = analytics.VehicleCount,
                    groupCount = analytics.GroupCount,
                    activeMappings = analytics.ActiveMappings,
                    periodDays = analytics.PeriodDays
                },
                metadata = GetDataSourceMetadata(canonicalSource)
            };
        }

        private async Task<object> BuildMostVehicleTravelledGpsAggregatedAsync(
            DashboardMetricRequestDto request,
            string canonicalSource,
            string aggregationInterval)
        {
            var analytics = await BuildGpsTrackDistanceAnalyticsAsync(request, canonicalSource);
            var values = analytics.TimeSeries
                .Select(point => TryDecimal(point.GetType().GetProperty("value")?.GetValue(point)) ?? 0m)
                .ToList();

            var total = values.Sum();
            var count = values.Count;
            var average = count > 0 ? Math.Round(total / count, 2) : 0m;
            var min = count > 0 ? values.Min() : 0m;
            var max = count > 0 ? values.Max() : 0m;

            return new
            {
                aggregationType = aggregationInterval,
                granularity = request.Granularity ?? "day",
                dataPoints = analytics.TimeSeries,
                summary = new
                {
                    total = Math.Round(total, 2),
                    average,
                    min,
                    max,
                    count
                },
                additionalInfo = new
                {
                    groupBy = analytics.GroupBy,
                    aggregation = analytics.AggregationType,
                    topEntity = analytics.CurrentGroups.FirstOrDefault()?.Label ?? "No travel data"
                },
                metadata = GetDataSourceMetadata(canonicalSource)
            };
        }

        private async Task<GpsTrackDistanceAnalyticsResult> BuildGpsTrackDistanceAnalyticsAsync(
            DashboardMetricRequestDto request,
            string canonicalSource)
        {
            var metadata = GetDataSourceMetadata(canonicalSource);
            var (startDate, endDate) = ResolveDashboardDateRange(request);
            var periodDays = Math.Max(1, (endDate.Date - startDate.Date).Days + 1);
            var previousStartDate = startDate.AddDays(-periodDays);
            var previousEndDate = startDate.AddDays(-1);
            var groupBy = ResolveGpsTrackDistanceGroupBy(request.GroupBy);
            var aggregationType = ResolveGpsTrackDistanceAggregation(request.AggregationType);
            var topK = Math.Max(5, metadata.TopKDefault ?? 10);

            var currentEntries = await FetchGpsTrackDistanceEntriesAsync(request, startDate, endDate);
            var previousEntries = await FetchGpsTrackDistanceEntriesAsync(request, previousStartDate, previousEndDate);
            var currentGroups = GroupGpsTrackDistanceEntries(currentEntries, groupBy, aggregationType);
            var previousGroups = GroupGpsTrackDistanceEntries(previousEntries, groupBy, aggregationType);

            var categories = currentGroups
                .Take(topK)
                .Select(group => (object)new
                {
                    key = group.Label,
                    value = group.MetricValue,
                    percent = currentGroups.Sum(item => item.MetricValue) > 0
                        ? Math.Round(group.MetricValue / currentGroups.Sum(item => item.MetricValue) * 100m, 2)
                        : 0m
                })
                .ToList();

            var rows = currentGroups
                .Take(topK)
                .Select((group, index) => (object)new
                {
                    rank = index + 1,
                    key = group.Key,
                    label = group.Label,
                    metricValue = group.MetricValue,
                    distanceKm = group.MetricValue,
                    totalDistanceKm = group.TotalDistanceKm,
                    averageDistanceKm = group.AverageDistanceKm,
                    vehicleCount = group.VehicleCount,
                    daysReported = group.DaysReported,
                    topVehicleName = group.TopVehicleName,
                    siteName = group.SiteName ?? "Unassigned",
                    vehicleTypeName = group.VehicleTypeName ?? "Unspecified"
                })
                .ToList();

            return new GpsTrackDistanceAnalyticsResult
            {
                GroupBy = groupBy,
                AggregationType = aggregationType,
                CurrentGroups = currentGroups,
                PreviousGroups = previousGroups,
                Categories = categories,
                Rows = rows,
                TimeSeries = BuildGpsTrackDistanceTimeSeries(currentEntries, aggregationType),
                TotalMetric = Math.Round(currentGroups.Sum(group => group.MetricValue), 2),
                VehicleCount = currentEntries.Select(entry => entry.VehicleId).Distinct().Count(),
                GroupCount = currentGroups.Count,
                ActiveMappings = currentEntries.Select(entry => entry.ExternalDeviceId).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
                PeriodDays = periodDays,
                CurrentLabel = BuildGpsTrackDistanceLabel(groupBy, aggregationType)
            };
        }

        private async Task<List<GpsTrackDistanceVehicleDayEntry>> FetchGpsTrackDistanceEntriesAsync(
            DashboardMetricRequestDto request,
            DateTime startDate,
            DateTime endDate)
        {
            var summaryService = _serviceProvider.GetService<ITrackingTrackInfoSummaryService>();
            if (summaryService == null)
            {
                _logger.LogWarning("ITrackingTrackInfoSummaryService is not registered - most travelled GPS widgets will return empty data");
                return new List<GpsTrackDistanceVehicleDayEntry>();
            }

            var mappings = await _context.Set<DeviceProviderMappingEntity>()
                .AsNoTracking()
                .Include(mapping => mapping.ProviderConfiguration)
                .Include(mapping => mapping.Vehicle)
                    .ThenInclude(vehicle => vehicle.WorkingSite)
                .Include(mapping => mapping.Vehicle)
                    .ThenInclude(vehicle => vehicle.VehicleType)
                .Where(mapping => mapping.IsActive
                    && !string.IsNullOrWhiteSpace(mapping.ExternalDeviceId)
                    && mapping.Vehicle != null
                    && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.IsEnabled)
                    && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.DeviceCategory == DeviceCategory.Tracking.ToString())
                    && (mapping.Vehicle.IsActive == null || mapping.Vehicle.IsActive != 0))
                .ToListAsync();

            var latestMappings = mappings
                .GroupBy(mapping => mapping.VehicleId)
                .Select(group => group
                    .OrderByDescending(mapping => mapping.UpdatedAt)
                    .First())
                .ToList();

            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                latestMappings = latestMappings
                    .Where(mapping => mapping.VehicleId.HasValue && request.VehicleIds.Contains(mapping.VehicleId.Value))
                    .ToList();
            }

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                latestMappings = latestMappings
                    .Where(mapping =>
                    {
                        var workingSiteId = mapping.Vehicle?.WorkingSiteId;
                        return workingSiteId.HasValue && request.SiteIds.Contains(workingSiteId.Value);
                    })
                    .ToList();
            }

            if (request.VehicleType != null && request.VehicleType.Any())
            {
                latestMappings = latestMappings
                    .Where(mapping =>
                    {
                        var vehicleTypeId = mapping.Vehicle?.VehicleTypeId;
                        return vehicleTypeId.HasValue && request.VehicleType.Contains(vehicleTypeId.Value);
                    })
                    .ToList();
            }

            if (latestMappings.Count == 0)
            {
                return new List<GpsTrackDistanceVehicleDayEntry>();
            }

            var dates = Enumerable.Range(0, Math.Max(1, (endDate.Date - startDate.Date).Days + 1))
                .Select(offset => startDate.Date.AddDays(offset))
                .ToList();

            using var semaphore = new SemaphoreSlim(GpsTrackDistanceMaxConcurrency);
            var tasks = latestMappings
                .SelectMany(mapping => dates.Select(date => BuildGpsTrackDistanceEntryAsync(mapping, date, summaryService, semaphore)))
                .ToList();

            var entries = await Task.WhenAll(tasks);
            return entries
                .Where(entry => entry != null)
                .Select(entry => entry!)
                .ToList();
        }

        private async Task<GpsTrackDistanceVehicleDayEntry?> BuildGpsTrackDistanceEntryAsync(
            DeviceProviderMappingEntity mapping,
            DateTime date,
            ITrackingTrackInfoSummaryService summaryService,
            SemaphoreSlim semaphore)
        {
            await semaphore.WaitAsync();

            try
            {
                var summary = await summaryService.GetDaySummaryAsync(mapping.ExternalDeviceId!, date);
                if (summary == null || summary.DistanceKm <= 0)
                {
                    return null;
                }

                var vehicle = mapping.Vehicle!;

                return new GpsTrackDistanceVehicleDayEntry
                {
                    VehicleId = vehicle.VehicleId,
                    VehicleName = vehicle.NumberPlate ?? string.Empty,
                    NumberPlate = vehicle.NumberPlate ?? string.Empty,
                    SiteId = vehicle.WorkingSiteId,
                    SiteName = vehicle.WorkingSite?.Name ?? "Unassigned",
                    VehicleTypeId = vehicle.VehicleTypeId,
                    VehicleTypeName = vehicle.VehicleType?.Name ?? "Unspecified",
                    Date = summary.Date,
                    DistanceKm = summary.DistanceKm,
                    PointCount = summary.PointCount,
                    StartTimeUtc = summary.StartTimeUtc,
                    EndTimeUtc = summary.EndTimeUtc,
                    ExternalDeviceId = mapping.ExternalDeviceId ?? string.Empty
                };
            }
            finally
            {
                semaphore.Release();
            }
        }

        private static List<GpsTrackDistanceGroupedEntry> GroupGpsTrackDistanceEntries(
            IEnumerable<GpsTrackDistanceVehicleDayEntry> entries,
            string groupBy,
            string aggregationType)
        {
            Func<GpsTrackDistanceVehicleDayEntry, string> keySelector = groupBy switch
            {
                "site" => entry => entry.SiteId?.ToString() ?? "site:unassigned",
                "vehicleType" => entry => entry.VehicleTypeId?.ToString() ?? "vehicletype:unspecified",
                _ => entry => entry.VehicleId.ToString()
            };

            return entries
                .GroupBy(keySelector)
                .Select(group =>
                {
                    var first = group.First();
                    var totalDistanceKm = Math.Round(group.Sum(item => item.DistanceKm), 2);
                    var vehicleCount = group.Select(item => item.VehicleId).Distinct().Count();
                    var averageDistanceKm = vehicleCount > 0
                        ? Math.Round(totalDistanceKm / vehicleCount, 2)
                        : 0m;

                    return new GpsTrackDistanceGroupedEntry
                    {
                        Key = group.Key,
                        Label = groupBy switch
                        {
                            "site" => first.SiteName,
                            "vehicleType" => first.VehicleTypeName,
                            _ => first.VehicleName
                        },
                        MetricValue = aggregationType == "avg" ? averageDistanceKm : totalDistanceKm,
                        TotalDistanceKm = totalDistanceKm,
                        AverageDistanceKm = averageDistanceKm,
                        VehicleCount = vehicleCount,
                        DaysReported = group.Select(item => item.Date).Distinct().Count(),
                        TopVehicleName = group.OrderByDescending(item => item.DistanceKm).First().VehicleName,
                        SiteName = first.SiteName,
                        VehicleTypeName = first.VehicleTypeName
                    };
                })
                .OrderByDescending(group => group.MetricValue)
                .ThenBy(group => group.Label)
                .ToList();
        }

        private static List<object> BuildGpsTrackDistanceTimeSeries(
            IEnumerable<GpsTrackDistanceVehicleDayEntry> entries,
            string aggregationType)
        {
            return entries
                .GroupBy(entry => entry.Date.Date)
                .OrderBy(group => group.Key)
                .Select(group => (object)new
                {
                    timestamp = group.Key,
                    value = aggregationType == "avg"
                        ? Math.Round(group.Average(entry => entry.DistanceKm), 2)
                        : Math.Round(group.Sum(entry => entry.DistanceKm), 2)
                })
                .ToList();
        }

        private static string ResolveGpsTrackDistanceGroupBy(string? requestedGroupBy)
        {
            return (requestedGroupBy ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "site" => "site",
                "vehicletype" => "vehicleType",
                _ => "none"
            };
        }

        private static string ResolveGpsTrackDistanceAggregation(string? requestedAggregation)
        {
            return string.Equals(requestedAggregation, "avg", StringComparison.OrdinalIgnoreCase)
                ? "avg"
                : "sum";
        }

        private static string BuildGpsTrackDistanceLabel(string groupBy, string aggregationType)
        {
            return (groupBy, aggregationType) switch
            {
                ("site", "avg") => "Top Site Average Distance",
                ("site", _) => "Top Site Distance",
                ("vehicleType", "avg") => "Top Vehicle Type Average Distance",
                ("vehicleType", _) => "Top Vehicle Type Distance",
                (_, "avg") => "Most Travelled Vehicle Average Distance",
                _ => "Most Travelled Vehicle Distance"
            };
        }

        private static DataSourceMetadata CreateMostVehicleTravelledGpsMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Most Vehicle Travelled (GPS)",
                Unit = "km",
                SupportedUnits = new List<string> { "km" },
                Description = "Ranks vehicles and grouped site or vehicle-type buckets by GPSGate track distance using active vehicle-provider mappings.",
                SupportsLiveData = false,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "compare_periods" },
                SupportedAggregations = new List<string> { "sum", "avg" },
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultAggregation = "sum",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "historical_snapshot",
                RecommendedUnits = new List<string> { "km" },
                SupportsCompareMode = true,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = true,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "ticker",
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "historical_snapshot",
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["groupBy"] = "none",
                    ["unit"] = "km",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                },
                Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                RefreshIntervalSeconds = 300,
                IncludeTotalDefault = true,
                TopKDefault = 10
            };
        }

        private sealed class GpsTrackDistanceVehicleDayEntry
        {
            public int VehicleId { get; set; }
            public string VehicleName { get; set; } = string.Empty;
            public string NumberPlate { get; set; } = string.Empty;
            public int? SiteId { get; set; }
            public string SiteName { get; set; } = string.Empty;
            public int? VehicleTypeId { get; set; }
            public string VehicleTypeName { get; set; } = string.Empty;
            public DateTime Date { get; set; }
            public decimal DistanceKm { get; set; }
            public int PointCount { get; set; }
            public DateTime? StartTimeUtc { get; set; }
            public DateTime? EndTimeUtc { get; set; }
            public string ExternalDeviceId { get; set; } = string.Empty;
        }

        private sealed class GpsTrackDistanceGroupedEntry
        {
            public string Key { get; set; } = string.Empty;
            public string Label { get; set; } = string.Empty;
            public decimal MetricValue { get; set; }
            public decimal TotalDistanceKm { get; set; }
            public decimal AverageDistanceKm { get; set; }
            public int VehicleCount { get; set; }
            public int DaysReported { get; set; }
            public string TopVehicleName { get; set; } = string.Empty;
            public string? SiteName { get; set; }
            public string? VehicleTypeName { get; set; }
        }

        private sealed class GpsTrackDistanceAnalyticsResult
        {
            public string GroupBy { get; set; } = "none";
            public string AggregationType { get; set; } = "sum";
            public string CurrentLabel { get; set; } = string.Empty;
            public List<GpsTrackDistanceGroupedEntry> CurrentGroups { get; set; } = new();
            public List<GpsTrackDistanceGroupedEntry> PreviousGroups { get; set; } = new();
            public List<object> Categories { get; set; } = new();
            public List<object> Rows { get; set; } = new();
            public List<object> TimeSeries { get; set; } = new();
            public decimal TotalMetric { get; set; }
            public int VehicleCount { get; set; }
            public int GroupCount { get; set; }
            public int ActiveMappings { get; set; }
            public int PeriodDays { get; set; }
        }
    }
}