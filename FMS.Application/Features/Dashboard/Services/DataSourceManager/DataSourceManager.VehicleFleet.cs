/**
 * File: DataSourceManager.VehicleFleet.cs
 * Purpose: Provides dashboard data sources for live GPS fleet counts and trip-distance KPIs.
 * Dependencies: GpsdataContext, IGPSService, VehicleLocationDTO, VehicleTripGroup, DataSourceMetadata
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - GetVehicleFleetDataAsync(): Routes vehicle fleet dashboard sources to live or historical builders.
 * - BuildLiveFleetMetricAsync(): Produces live GPS-enabled fleet counts for moving, parked, stopped, online, offline, and total.
 * - BuildTripDistanceSnapshotAsync(): Produces trip-distance KPI payloads for big stat cards.
 * - BuildTripDistanceAggregatedAsync(): Produces trip-distance time-series payloads for charts.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string FleetMovingGpsDataSource = "fleet_moving_gps";
        private const string FleetParkedGpsDataSource = "fleet_parked_gps";
        private const string FleetStoppedGpsDataSource = "fleet_stopped_gps";
        private const string FleetOnlineGpsDataSource = "fleet_online_gps";
        private const string FleetOfflineGpsDataSource = "fleet_offline_gps";
        private const string FleetTotalGpsDataSource = "fleet_total_gps";
        private const string MostVehicleTravelledGpsDataSource = "most_vehicle_travelled_gps";

        private static readonly string[] VehicleFleetDataSourceKeys =
        {
            FleetMovingGpsDataSource,
            FleetParkedGpsDataSource,
            FleetStoppedGpsDataSource,
            FleetOnlineGpsDataSource,
            FleetOfflineGpsDataSource,
            FleetTotalGpsDataSource,
            MostVehicleTravelledGpsDataSource
        };

        private bool IsVehicleFleetDataSource(string canonicalSource)
        {
            return VehicleFleetDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetVehicleFleetDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode,
            string aggregationInterval = "daily")
        {
            return canonicalSource switch
            {
                FleetMovingGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Moving GPS Vehicles"),
                FleetParkedGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Parked GPS Vehicles"),
                FleetStoppedGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Stopped GPS Vehicles"),
                FleetOnlineGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Online GPS Vehicles"),
                FleetOfflineGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Offline GPS Vehicles"),
                FleetTotalGpsDataSource => await BuildLiveFleetMetricAsync(canonicalSource, "Total GPS Vehicles"),
                MostVehicleTravelledGpsDataSource when string.Equals(accessMode, "aggregated", StringComparison.OrdinalIgnoreCase)
                    => await BuildMostVehicleTravelledGpsAggregatedAsync(request, canonicalSource, aggregationInterval),
                MostVehicleTravelledGpsDataSource
                    => await BuildMostVehicleTravelledGpsSnapshotAsync(request, canonicalSource),
                _ => new { error = $"Unsupported vehicle fleet data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildLiveFleetMetricAsync(
            string canonicalSource,
            string label)
        {
            var (totalGps, online, offline, moving, parked, stopped) = await GetLiveFleetSummaryAsync();

            var value = canonicalSource switch
            {
                FleetMovingGpsDataSource => moving,
                FleetParkedGpsDataSource => parked,
                FleetStoppedGpsDataSource => stopped,
                FleetOnlineGpsDataSource => online,
                FleetOfflineGpsDataSource => offline,
                FleetTotalGpsDataSource => totalGps,
                _ => 0
            };

            return new
            {
                current = new
                {
                    value = (decimal)value,
                    unit = "count",
                    timestamp = DateTime.UtcNow,
                    label
                },
                change = BuildChangePayload((decimal)value, (decimal)value),
                total = totalGps,
                categories = new List<object>
                {
                    new { key = "Moving", value = moving },
                    new { key = "Parked", value = parked },
                    new { key = "Stopped", value = stopped },
                    new { key = "Online", value = online },
                    new { key = "Offline", value = offline }
                },
                additionalInfo = new
                {
                    vehicles_count = totalGps
                },
                metadata = GetDataSourceMetadata(canonicalSource)
            };
        }

        private async Task<(int totalGps, int online, int offline, int moving, int parked, int stopped)> GetLiveFleetSummaryAsync()
        {
            var gpsService = _serviceProvider.GetService<IGPSService>();
            if (gpsService == null)
            {
                _logger.LogWarning("IGPSService is not registered - vehicle fleet widgets will return zero values");
                return (0, 0, 0, 0, 0, 0);
            }

            var gpsResult = await gpsService.GetAllVehicleLocationsAsync(onlineOnly: false, gpsEnabledOnly: true);
            var locations = gpsResult.Data ?? new List<VehicleLocationDTO>();

            if (!gpsResult.IsSuccess || locations.Count == 0)
            {
                return (0, 0, 0, 0, 0, 0);
            }

            var onlineLocations = locations.Where(location => location.IsOnline).ToList();
            var moving = onlineLocations.Count(location => location.IsMoving);
            var stationary = onlineLocations.Where(location => !location.IsMoving).ToList();

            var parked = stationary.Count(location =>
            {
                if (location.LastUpdated == default)
                {
                    return false;
                }

                return (DateTime.UtcNow - location.LastUpdated.ToUniversalTime()) >= TimeSpan.FromMinutes(15);
            });

            var stopped = Math.Max(0, stationary.Count - parked);
            var totalGps = locations.Count;
            var online = onlineLocations.Count;
            var offline = Math.Max(0, totalGps - online);

            return (totalGps, online, offline, moving, parked, stopped);
        }

        private static (DateTime startDate, DateTime endDate) ResolveDashboardDateRange(DashboardMetricRequestDto request)
        {
            if (request.StartDate.HasValue && request.EndDate.HasValue)
            {
                return (request.StartDate.Value.Date, request.EndDate.Value.Date);
            }

            var today = DateTime.Today;

            return (request.DatePreset ?? string.Empty).ToLowerInvariant() switch
            {
                "today" => (today, today),
                "yesterday" => (today.AddDays(-1), today.AddDays(-1)),
                "last_7_days" => (today.AddDays(-6), today),
                "this_week" => GetThisWeekRange(today),
                "last_week" => GetLastWeekRange(today),
                "this_month" => GetThisMonthRange(today),
                "last_month" => GetLastMonthRange(today),
                _ => (today, today)
            };
        }

        private static (DateTime startDate, DateTime endDate) GetThisWeekRange(DateTime referenceDate)
        {
            var daysFromMonday = ((int)referenceDate.DayOfWeek - 1 + 7) % 7;
            var weekStart = referenceDate.AddDays(-daysFromMonday).Date;
            return (weekStart, weekStart.AddDays(6));
        }

        private static (DateTime startDate, DateTime endDate) GetLastWeekRange(DateTime referenceDate)
        {
            var (thisWeekStart, _) = GetThisWeekRange(referenceDate);
            var lastWeekStart = thisWeekStart.AddDays(-7);
            return (lastWeekStart, lastWeekStart.AddDays(6));
        }

        private static (DateTime startDate, DateTime endDate) GetThisMonthRange(DateTime referenceDate)
        {
            var monthStart = new DateTime(referenceDate.Year, referenceDate.Month, 1);
            return (monthStart, monthStart.AddMonths(1).AddDays(-1));
        }

        private static (DateTime startDate, DateTime endDate) GetLastMonthRange(DateTime referenceDate)
        {
            var thisMonthStart = new DateTime(referenceDate.Year, referenceDate.Month, 1);
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            return (lastMonthStart, thisMonthStart.AddDays(-1));
        }

        private static DataSourceMetadata CreateFleetStatusMetricMetadata(string displayName, string description)
        {
            return new DataSourceMetadata
            {
                DisplayName = displayName,
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = description,
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "none" },
                DefaultGroupBy = "none",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["mode"] = "live"
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = true,
                TopKDefault = 10
            };
        }

    }
}
