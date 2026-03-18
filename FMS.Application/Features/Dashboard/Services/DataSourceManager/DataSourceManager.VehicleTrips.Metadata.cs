/**
 * File: DataSourceManager.VehicleTrips.Metadata.cs
 * Purpose: Registers metadata for trip-management dashboard data sources.
 * Dependencies: DataSourceMetadata
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - CreateTripInTransitMetadata(): Declares live in-transit widget compatibility.
 * - CreateVehiclesAtSiteMetadata(): Declares site occupancy widget compatibility.
 * - CreateTripCountVsExpectedMetadata(): Declares trip baseline comparison widget compatibility.
 * - CreateAverageTripDurationMetadata(): Declares duration widget compatibility and defaults.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private static DataSourceMetadata CreateTripInTransitMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Vehicles In Transit",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Live list of vehicles currently on an in-progress trip with origin and estimated destination.",
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "none", "site" },
                DefaultGroupBy = "none",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST",
                    "CHART_BAR_COMPARISON"
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
                Category = TripManagementCategory,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = true,
                TopKDefault = 25
            };
        }

        private static DataSourceMetadata CreateVehiclesAtSiteMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Vehicles At Site",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Current site occupancy derived from the latest persisted trip or working-site assignment for each vehicle.",
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "site" },
                DefaultGroupBy = "site",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "PROGRESS_LIST",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["mode"] = "live",
                    ["groupBy"] = "site"
                },
                Category = TripManagementCategory,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 20
            };
        }

        private static DataSourceMetadata CreateTripCountVsExpectedMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Trip Count vs Expected",
                Unit = "trips",
                SupportedUnits = new List<string> { "trips" },
                Description = "Compares the selected period's persisted trip count against a rolling baseline from previous equivalent periods.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "sum", "count" },
                SupportedGroupBy = new List<string> { "vehicle", "site", "none" },
                DefaultGroupBy = "vehicle",
                DefaultAggregation = "sum",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "trips" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "PROGRESS_LIST",
                    "DATA_TABLE_DETAILED",
                    "CHART_BAR_COMPARISON"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "trips",
                    ["mode"] = "live",
                    ["groupBy"] = "vehicle"
                },
                Category = TripManagementCategory,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 15
            };
        }

        private static DataSourceMetadata CreateTipperCycleCountMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Tipper Cycle Count",
                Unit = "cycles",
                SupportedUnits = new List<string> { "cycles" },
                Description = "Counts persisted load-cycle trip groups to show live dump/load cycle activity. Defaults to live today mode so operators see the current shift count in real time.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "vehicle", "site", "none" },
                DefaultGroupBy = "vehicle",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "cycles" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "PROGRESS_LIST",
                    "DATA_TABLE_DETAILED",
                    "CHART_BAR_COMPARISON"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "cycles",
                    ["mode"] = "live",
                    ["groupBy"] = "vehicle"
                },
                Category = TripManagementCategory,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 15
            };
        }

        private static DataSourceMetadata CreateAverageTripDurationMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Average Trip Duration",
                Unit = "minutes",
                SupportedUnits = new List<string> { "minutes" },
                Description = "Shows average trip duration from persisted trip-group totals and supports daily duration trends.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "live" },
                SupportedAggregations = new List<string> { "avg" },
                SupportedGroupBy = new List<string> { "vehicle", "site", "none" },
                DefaultGroupBy = "none",
                DefaultAggregation = "avg",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "historical_snapshot",
                RecommendedUnits = new List<string> { "minutes" },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["aggregation"] = "avg",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "minutes",
                    ["mode"] = "historical_snapshot"
                },
                Category = TripManagementCategory,
                RefreshIntervalSeconds = 120,
                IncludeTotalDefault = true,
                TopKDefault = 15
            };
        }
    }
}
