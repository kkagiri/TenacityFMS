using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard {
    // Partial: Metadata catalog and builders
    public partial class DataSourceManager {
        private static Dictionary<string, DataSourceMetadata> BuildMetadata () {
            var catalog = new Dictionary<string, DataSourceMetadata> (StringComparer.OrdinalIgnoreCase);

            void Add (string key, DataSourceMetadata metadata) => catalog[key] = metadata;

            Add (WidgetTypeDefinitions.DataSources.FUEL_DISPENSE, CreateFuelDispensedMetadata (true));
            Add ("fuel_dispensed", CreateFuelDispensedMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FUEL_USED_GPS, CreateFuelUsedGpsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FUEL_LOST_GPS, CreateFuelLostGpsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.ENGINE_HOURS, CreateEngineHoursMetadata ());
            Add (WidgetTypeDefinitions.DataSources.ENGINE_HOURS_GPS, CreateEngineHoursGpsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.KM_TRAVEL, CreateDistanceTravelledMetadata ());
            Add (WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL, CreateDistanceTravelGpsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FUEL_EFFICIENCY, CreateFuelEfficiencyMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FLOWMETER_FUEL_USED, CreateFlowmeterFuelUsedMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FLOWMETER_FUEL_LOST, CreateFlowmeterFuelLostMetadata ());
            Add (WidgetTypeDefinitions.DataSources.FLOWMETER_EFFICIENCY, CreateFlowmeterEfficiencyMetadata ());
            Add (WidgetTypeDefinitions.DataSources.MAX_SPEED, CreateMaxSpeedMetadata ());
            Add (WidgetTypeDefinitions.DataSources.AVG_SPEED, CreateAvgSpeedMetadata ());

            // M1 remaining categories
            Add (WidgetTypeDefinitions.DataSources.ALERT_SUMMARY, CreateAlertSummaryMetadata ());
            Add (WidgetTypeDefinitions.DataSources.PERFORMANCE_TRENDS, CreatePerformanceTrendsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.SITE_COMPARISON, CreateSiteComparisonMetadata ());
            Add (WidgetTypeDefinitions.DataSources.VEHICLE_BREAKDOWN, CreateVehicleBreakdownMetadata ());
            Add (WidgetTypeDefinitions.DataSources.USAGE_PATTERNS, CreateUsagePatternsMetadata ());
            Add (WidgetTypeDefinitions.DataSources.COST_ANALYSIS, CreateCostAnalysisMetadata ());
            Add (WidgetTypeDefinitions.DataSources.EXPECTED_CONSUMPTION, CreateExpectedConsumptionMetadata ());

            foreach (var key in catalog.Keys.ToList ()) {
                catalog[key] = NormalizeMetadataEntry (catalog[key]);
            }

            return catalog;
        }

        private static DataSourceMetadata NormalizeMetadataEntry (DataSourceMetadata metadata) {
            metadata ??= new DataSourceMetadata ();

            metadata.Category ??= WidgetTypeDefinitions.Categories.CUSTOM_ANALYTICS;
            metadata.Unit ??= "units";

            metadata.SupportedModes ??= new List<string> ();
            if (!metadata.SupportedModes.Any ()) {
                metadata.SupportedModes.AddRange (new [] { "historical_snapshot", "daily_aggregated" });
            }

            metadata.SupportedAggregations ??= new List<string> ();
            if (!metadata.SupportedAggregations.Any ()) {
                metadata.SupportedAggregations.Add ("sum");
            }

            metadata.SupportedGranularities ??= new List<string> ();
            if (!metadata.SupportedGranularities.Any ()) {
                metadata.SupportedGranularities.Add ("day");
            }

            metadata.RecommendedUnits ??= new List<string> ();
            metadata.SupportedUnits ??= new List<string> ();

            metadata.SupportedGroupBy ??= new List<string> ();
            if (!metadata.SupportedGroupBy.Any ()) {
                metadata.SupportedGroupBy = (metadata.Category ?? WidgetTypeDefinitions.Categories.CUSTOM_ANALYTICS) switch {
                    WidgetTypeDefinitions.Categories.ALERTS_MONITORING => new List<string> { "none", "site", "severity" },
                    WidgetTypeDefinitions.Categories.FINANCIAL_ANALYSIS => new List<string> { "none", "site", "costCenter" },
                    WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS => new List<string> { "none", "site", "vehicleType" },
                    WidgetTypeDefinitions.Categories.CUSTOM_ANALYTICS => new List<string> { "none", "site", "vehicleType" },
                    _ => new List<string> { "none", "site", "vehicleType" }
                };
            }

            // Ensure "none" is present and first
            var hasNone = metadata.SupportedGroupBy.Any (g => string.Equals (g, "none", StringComparison.OrdinalIgnoreCase));
            if (!hasNone) {
                metadata.SupportedGroupBy.Insert (0, "none");
            } else if (!string.Equals (metadata.SupportedGroupBy.First (), "none", StringComparison.OrdinalIgnoreCase)) {
                metadata.SupportedGroupBy = new List<string> { "none" }
                    .Concat (metadata.SupportedGroupBy.Where (g => !string.Equals (g, "none", StringComparison.OrdinalIgnoreCase))).ToList ();
            }

            metadata.DefaultMode ??= metadata.SupportedModes.FirstOrDefault () ?? "historical_snapshot";
            metadata.DefaultAggregation ??= metadata.SupportedAggregations.FirstOrDefault () ?? "sum";
            metadata.DefaultGranularity ??= metadata.SupportedGranularities.FirstOrDefault () ?? "day";
            metadata.DefaultGroupBy = string.IsNullOrWhiteSpace (metadata.DefaultGroupBy) ? (metadata.SupportedGroupBy.FirstOrDefault () ?? "none") : metadata.DefaultGroupBy;

            metadata.Recommendations ??= new DataSourceRecommendations ();
            metadata.Recommendations.DatePreset ??= "last_7_days";
            metadata.Recommendations.Granularity ??= metadata.DefaultGranularity;
            metadata.Recommendations.SmoothingDefault ??= "none";

            metadata.DefaultConfiguration ??= new Dictionary<string, object> ();

            void EnsureDefaultConfig (string key, object value) {
                if (value == null) return;
                if (!metadata.DefaultConfiguration.ContainsKey (key)) {
                    metadata.DefaultConfiguration[key] = value;
                }
            }

            EnsureDefaultConfig ("mode", metadata.DefaultMode);
            EnsureDefaultConfig ("aggregation", metadata.DefaultAggregation);
            EnsureDefaultConfig ("granularity", metadata.DefaultGranularity);
            EnsureDefaultConfig ("datePreset", metadata.Recommendations.DatePreset);

            var defaultUnit = metadata.Unit ?? metadata.RecommendedUnits.FirstOrDefault () ?? metadata.SupportedUnits.FirstOrDefault ();
            EnsureDefaultConfig ("unit", defaultUnit);

            if (!metadata.DefaultConfiguration.ContainsKey ("includeTotal")) {
                metadata.DefaultConfiguration["includeTotal"] = metadata.IncludeTotalDefault;
            }

            if (!metadata.DefaultConfiguration.ContainsKey ("topK")) {
                metadata.DefaultConfiguration["topK"] = metadata.TopKDefault ?? 10;
            }

            EnsureDefaultConfig ("groupBy", metadata.DefaultGroupBy);

            return metadata;
        }

        // ----- Metadata factories -----
        private static DataSourceMetadata CreateFuelDispensedMetadata (bool isAlias = false) {
            return new DataSourceMetadata {
            DisplayName = "Fuel Dispensed",
            Unit = "liters",
            SupportedUnits = new List<string> { "liters", "gallons" },
            Description = "Total fuel dispensed from tanks",
            SupportsLiveData = true,
            SupportsHistoricalData = true,
            SupportedModes = new List<string> { "live", "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window", "compare_periods" },
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            SupportedGroupBy = new List<string> { "none", "site" },
            DefaultGroupBy = "none",
            DefaultAggregation = "sum",
            SupportedGranularities = new List<string> { "minute", "hour", "day", "week" },
            DefaultGranularity = "day",
            DefaultMode = "daily_aggregated",
            RecommendedUnits = new List<string> { "liters", "gallons" },
            MinWindow = TimeSpan.FromMinutes (5),
            MaxWindow = TimeSpan.FromDays (90),
            SupportsCompareMode = true,
            Recommendations = new DataSourceRecommendations {
            DatePreset = "last_7_days",
            Granularity = "day",
            CumulativeDefault = true,
            SmoothingDefault = "none"
            },
            CompatibleWidgetTypes = new List<string> {
            "BIG_STAT_CARD",
            "CHART_LINE_TREND",
            "CHART_BAR_COMPARISON",
            "CHART_PIE_DISTRIBUTION",
            "DATA_TABLE_DETAILED",
            "PROGRESS_LIST"
            },
            RequiresSiteFilter = true,
            RequiresVehicleFilter = false,
            DefaultConfiguration = new Dictionary<string, object> {
            ["aggregation"] = "sum",
            ["granularity"] = "day",
            ["datePreset"] = "last_7_days",
            ["unit"] = "liters"
            },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 30,
            IsCatalogVisible = !isAlias,
            IncludeTotalDefault = true,
            TopKDefault = 10
            };
        }

        private static DataSourceMetadata CreateFuelUsedGpsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Fuel Used (GPS)",
                    Unit = "liters",
                    SupportedUnits = new List<string> { "liters", "gallons" },
                    Description = "Fuel consumption from GPS tracking data",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "liters", "gallons" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "liters"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateFuelLostGpsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Fuel Lost (GPS)",
                    Unit = "liters",
                    SupportedUnits = new List<string> { "liters", "gallons" },
                    Description = "Fuel losses detected from GPS tracking and flow meter data",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "liters", "gallons" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (90),
                    SupportsCompareMode = false,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "liters"
                    },
                    Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
                    RefreshIntervalSeconds = 300,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateEngineHoursMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Engine Hours",
                    Unit = "hours",
                    SupportedUnits = new List<string> { "hours", "minutes" },
                    Description = "Total engine operating hours",
                    SupportsLiveData = true,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "live", "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "minute", "hour", "day", "week" },
                    DefaultGranularity = "hour",
                    DefaultMode = "running_cumulative",
                    RecommendedUnits = new List<string> { "hours" },
                    MinWindow = TimeSpan.FromMinutes (5),
                    MaxWindow = TimeSpan.FromDays (120),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "hour",
                    CumulativeDefault = true,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "hour",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "hours"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 60,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateEngineHoursGpsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Engine Hours (GPS)",
                    Unit = "hours",
                    SupportedUnits = new List<string> { "hours", "minutes" },
                    Description = "Engine operating hours from GPS data and flow meter",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "hours" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "hours"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateDistanceTravelledMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Distance Travelled",
                    Unit = "kilometers",
                    SupportedUnits = new List<string> { "kilometers", "miles" },
                    Description = "Total distance travelled by vehicles",
                    SupportsLiveData = true,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "live", "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "minute", "hour", "day", "week" },
                    DefaultGranularity = "hour",
                    DefaultMode = "running_cumulative",
                    RecommendedUnits = new List<string> { "kilometers", "miles" },
                    MinWindow = TimeSpan.FromMinutes (5),
                    MaxWindow = TimeSpan.FromDays (120),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "hour",
                    CumulativeDefault = true,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "hour",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "kilometers"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 60,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateDistanceTravelGpsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Distance Travel (GPS)",
                    Unit = "kilometers",
                    SupportedUnits = new List<string> { "kilometers", "miles" },
                    Description = "Distance travelled from GPS tracking",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "kilometers", "miles" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "kilometers"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateFuelEfficiencyMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Fuel Efficiency",
                    Unit = "km/l",
                    SupportedUnits = new List<string> { "km/l", "mpg" },
                    Description = "Fuel efficiency metrics",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "avg", "min", "max" },
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "week",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "km/l", "mpg" },
                    MinWindow = TimeSpan.FromDays (7),
                    MaxWindow = TimeSpan.FromDays (365),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "week",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "avg",
                    ["granularity"] = "week",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "km/l"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300,
                    IncludeTotalDefault = true,
                    TopKDefault = 10
            };
        }
        private static DataSourceMetadata CreateFlowmeterFuelUsedMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Fuel Used (Flow Meter)",
                    Unit = "liters",
                    SupportedUnits = new List<string> { "liters", "gallons" },
                    Description = "Fuel consumption from flow meter readings",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "liters", "gallons" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = false,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "liters"
                    },
                    Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateFlowmeterFuelLostMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Fuel Lost (Flow Meter)",
                    Unit = "liters",
                    SupportedUnits = new List<string> { "liters", "gallons" },
                    Description = "Fuel losses detected by flow meter",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "liters", "gallons" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (90),
                    SupportsCompareMode = false,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "sum",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "liters"
                    },
                    Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateFlowmeterEfficiencyMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Flow Meter Efficiency",
                    Unit = "percentage",
                    SupportedUnits = new List<string> { "percentage" },
                    Description = "Efficiency metrics from flow meter data",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window" },
                    SupportedAggregations = new List<string> { "avg", "min", "max" },
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "week",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "percentage" },
                    MinWindow = TimeSpan.FromDays (7),
                    MaxWindow = TimeSpan.FromDays (365),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_90_days",
                    Granularity = "week",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "avg",
                    ["granularity"] = "week",
                    ["datePreset"] = "last_90_days",
                    ["unit"] = "percentage"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateMaxSpeedMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Maximum Speed",
                    Unit = "km/h",
                    SupportedUnits = new List<string> { "km/h", "mph" },
                    Description = "Maximum speed recorded for vehicles",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window" },
                    SupportedAggregations = new List<string> { "max", "avg", "min" },
                    DefaultAggregation = "max",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "km/h", "mph" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (90),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "max",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "km/h"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateAvgSpeedMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Average Speed",
                    Unit = "km/h",
                    SupportedUnits = new List<string> { "km/h", "mph" },
                    Description = "Average speed recorded for vehicles",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window" },
                    SupportedAggregations = new List<string> { "avg", "max", "min" },
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "km/h", "mph" },
                    MinWindow = TimeSpan.FromHours (1),
                    MaxWindow = TimeSpan.FromDays (90),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["aggregation"] = "avg",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "km/h"
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateExpectedConsumptionMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Expected Fuel Consumption",
                    Unit = "liters",
                    SupportedUnits = new List<string> { "liters", "gallons" },
                    Description = "Expected fuel consumption baselines compared to actual usage",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "avg", "sum", "min", "max" },
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "week",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "liters", "gallons" },
                    MinWindow = TimeSpan.FromDays (7),
                    MaxWindow = TimeSpan.FromDays (365),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "week",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "daily_aggregated",
                    ["aggregation"] = "avg",
                    ["granularity"] = "week",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "liters",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 600
            };
        }
        private static DataSourceMetadata CreateVehicleBreakdownMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Vehicle Breakdown",
                    Unit = "vehicles",
                    SupportedUnits = new List<string> { "vehicles", "count" },
                    Description = "Vehicle counts segmented by status, vehicle type, or site",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "compare_periods" },
                    SupportedAggregations = new List<string> { "count", "sum" },
                    DefaultAggregation = "count",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "day",
                    DefaultMode = "historical_snapshot",
                    RecommendedUnits = new List<string> { "vehicles" },
                    MinWindow = TimeSpan.FromDays (1),
                    MaxWindow = TimeSpan.FromDays (365),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "DATA_TABLE_DETAILED",
                    "CHART_BAR_COMPARISON",
                    "PROGRESS_LIST",
                    "CHART_PIE_DISTRIBUTION",
                    "BIG_STAT_CARD"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = false,
                    SupportedGroupBy = new List<string> { "none", "vehicleType", "status", "site" },
                    DefaultGroupBy = "vehicleType",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "historical_snapshot",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "vehicles",
                    ["groupBy"] = "vehicleType",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                    RefreshIntervalSeconds = 600
            };
        }
        private static DataSourceMetadata CreateSiteComparisonMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Site Comparison",
                    Unit = "index",
                    SupportedUnits = new List<string> { "index", "percent" },
                    Description = "Comparative performance metrics across sites",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "compare_periods" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "week",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "index", "percent" },
                    MinWindow = TimeSpan.FromDays (7),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "week",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "CHART_BAR_COMPARISON",
                    "CHART_PIE_DISTRIBUTION",
                    "DATA_TABLE_DETAILED",
                    "BIG_STAT_CARD"
                    },
                    RequiresSiteFilter = false,
                    RequiresVehicleFilter = false,
                    SupportedGroupBy = new List<string> { "none", "site" },
                    DefaultGroupBy = "site",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "daily_aggregated",
                    ["aggregation"] = "sum",
                    ["granularity"] = "week",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "index",
                    ["groupBy"] = "site",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                    RefreshIntervalSeconds = 900
            };
        }
        private static DataSourceMetadata CreateCostAnalysisMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Cost Analysis",
                    Unit = "KES",
                    SupportedUnits = new List<string> { "KES", "USD" },
                    Description = "Fuel and operational cost insights",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
                    DefaultAggregation = "sum",
                    SupportedGranularities = new List<string> { "day", "week", "month" },
                    DefaultGranularity = "week",
                    DefaultMode = "daily_aggregated",
                    RecommendedUnits = new List<string> { "KES", "USD" },
                    MinWindow = TimeSpan.FromDays (7),
                    MaxWindow = TimeSpan.FromDays (365),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "week",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "CHART_BAR_COMPARISON",
                    "CHART_LINE_TREND",
                    "CHART_PIE_DISTRIBUTION",
                    "BIG_STAT_CARD",
                    "DATA_TABLE_DETAILED"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = false,
                    SupportedGroupBy = new List<string> { "none", "site", "costCenter", "supplier" },
                    DefaultGroupBy = "site",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "daily_aggregated",
                    ["aggregation"] = "sum",
                    ["granularity"] = "week",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "KES",
                    ["groupBy"] = "site",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.FINANCIAL_ANALYSIS,
                    RefreshIntervalSeconds = 900
            };
        }
        private static DataSourceMetadata CreatePerformanceTrendsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Performance Trends",
                    Unit = "score",
                    SupportedUnits = new List<string> { "score", "percent" },
                    Description = "Composite vehicle performance trend scores",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "running_cumulative", "rolling_window", "compare_periods" },
                    SupportedAggregations = new List<string> { "avg", "max", "min" },
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "hour", "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "score", "percent" },
                    MinWindow = TimeSpan.FromHours (6),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "CHART_LINE_TREND",
                    "BIG_STAT_CARD",
                    "CHART_BAR_COMPARISON",
                    "PROGRESS_LIST"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = true,
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                    DefaultGroupBy = "none",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "rolling_window",
                    ["aggregation"] = "avg",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "score",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
                    RefreshIntervalSeconds = 300
            };
        }
        private static DataSourceMetadata CreateAlertSummaryMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Alert Summary",
                    Unit = "count",
                    SupportedUnits = new List<string> { "count" },
                    Description = "Active and historical alarm counts segmented by severity",
                    SupportsLiveData = true,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "live", "rolling_window", "historical_snapshot" },
                    SupportedAggregations = new List<string> { "count" },
                    DefaultAggregation = "count",
                    SupportedGranularities = new List<string> { "minute", "hour", "day" },
                    DefaultGranularity = "minute",
                    DefaultMode = "live",
                    RecommendedUnits = new List<string> { "count" },
                    MinWindow = TimeSpan.FromMinutes (5),
                    MaxWindow = TimeSpan.FromDays (30),
                    SupportsCompareMode = false,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "today",
                    Granularity = "minute",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "BIG_STAT_CARD",
                    "PROGRESS_LIST",
                    "DATA_TABLE_DETAILED",
                    "CHART_BAR_COMPARISON"
                    },
                    RequiresSiteFilter = false,
                    RequiresVehicleFilter = false,
                    SupportedGroupBy = new List<string> { "none", "site", "severity", "category" },
                    DefaultGroupBy = "severity",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "minute",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["groupBy"] = "severity",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.ALERTS_MONITORING,
                    RefreshIntervalSeconds = 30
            };
        }
        private static DataSourceMetadata CreateUsagePatternsMetadata () {
            return new DataSourceMetadata {
                DisplayName = "Usage Patterns",
                    Unit = "percent",
                    SupportedUnits = new List<string> { "percent", "ratio" },
                    Description = "Equipment or vehicle usage distribution across dimensions",
                    SupportsLiveData = false,
                    SupportsHistoricalData = true,
                    SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated", "rolling_window" },
                    SupportedAggregations = new List<string> { "avg", "sum", "max", "min" },
                    DefaultAggregation = "avg",
                    SupportedGranularities = new List<string> { "hour", "day", "week" },
                    DefaultGranularity = "day",
                    DefaultMode = "rolling_window",
                    RecommendedUnits = new List<string> { "percent" },
                    MinWindow = TimeSpan.FromHours (6),
                    MaxWindow = TimeSpan.FromDays (180),
                    SupportsCompareMode = true,
                    Recommendations = new DataSourceRecommendations {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "medium"
                    },
                    CompatibleWidgetTypes = new List<string> {
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                    },
                    RequiresSiteFilter = true,
                    RequiresVehicleFilter = false,
                    SupportedGroupBy = new List<string> { "none", "site", "vehicleType", "driver" },
                    DefaultGroupBy = "vehicleType",
                    DefaultConfiguration = new Dictionary<string, object> {
                    ["mode"] = "rolling_window",
                    ["aggregation"] = "avg",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "percent",
                    ["groupBy"] = "vehicleType",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                    },
                    Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                    RefreshIntervalSeconds = 300
            };
        }
    }
}