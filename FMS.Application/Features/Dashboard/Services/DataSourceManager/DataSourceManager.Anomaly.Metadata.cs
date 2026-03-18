/**
 * File: DataSourceManager.Anomaly.Metadata.cs
 * Purpose: Registers metadata for vehicle anomaly dashboard data sources.
 * Dependencies: DataSourceMetadata
 * Last Modified: 2026-03-12
 *
 * Key Functions:
 * - CreateVehicleAnomalyCountMetadata(): Declares anomaly count widget compatibility and live defaults.
 * - CreateAnomalyReviewFeedMetadata(): Declares review-feed widget compatibility.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string FleetAnomalyCategory = "fleet_anomalies";

        private static DataSourceMetadata CreateVehicleAnomalyCountMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Vehicle Anomaly Count",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Counts unresolved active events triggered in the selected period. Includes a review link so operators can navigate directly to the events page.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "severity", "site", "none" },
                DefaultGroupBy = "severity",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day", "week" },
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
                    ["groupBy"] = "severity"
                },
                Category = FleetAnomalyCategory,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 10
            };
        }

        private static DataSourceMetadata CreateAnomalyReviewFeedMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Anomaly Review Feed",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Live feed of the most recent unresolved active events ordered by severity, designed for quick review and navigation to the events page.",
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live" },
                SupportedAggregations = new List<string> { "count" },
                SupportedGroupBy = new List<string> { "none", "severity" },
                DefaultGroupBy = "none",
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                CompatibleWidgetTypes = new List<string>
                {
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST",
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
                Category = FleetAnomalyCategory,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = true,
                TopKDefault = 30
            };
        }
    }
}
