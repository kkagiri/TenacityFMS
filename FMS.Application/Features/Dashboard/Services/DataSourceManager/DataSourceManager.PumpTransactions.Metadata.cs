/**
 * File: DataSourceManager.PumpTransactions.Metadata.cs
 * Purpose: Defines dashboard catalog metadata for live PTS fueling and recent pump-transaction sources.
 * Dependencies: DataSourceMetadata, WidgetTypeDefinitions, DataSourceRecommendations
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - CreatePtsActiveFuelingSummaryMetadata(): Registers the live big-stat source for active fueling PTS devices.
 * - CreatePtsActiveFuelingCurrentMetadata(): Registers the live table source for currently fueling PTS devices.
 * - CreatePumpTransactionsRecentMetadata(): Registers the recent transaction table source.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private static DataSourceMetadata CreatePtsActiveFuelingSummaryMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "PTS Fueling Now",
                Unit = "pts",
                SupportedUnits = new List<string> { "pts", "count" },
                Description = "Shows how many PTS devices are actively fueling right now for the selected scope.",
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "minute", "hour" },
                DefaultGranularity = "minute",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "pts" },
                MinWindow = TimeSpan.FromMinutes(1),
                MaxWindow = TimeSpan.FromHours(24),
                SupportsCompareMode = false,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "today",
                    Granularity = "minute",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "ticker",
                    "DATA_TABLE_DETAILED"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none", "site" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "minute",
                    ["datePreset"] = "today",
                    ["unit"] = "pts",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 10
                },
                Category = WidgetTypeDefinitions.Categories.FUEL_OPERATION,
                RefreshIntervalSeconds = 15,
                IncludeTotalDefault = true,
                TopKDefault = 10
            };
        }

        private static DataSourceMetadata CreatePtsActiveFuelingCurrentMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Active Fueling PTS",
                Unit = "pts",
                SupportedUnits = new List<string> { "pts", "count" },
                Description = "Lists all PTS devices that are currently fueling, including active pumps and targets.",
                SupportsLiveData = true,
                SupportsHistoricalData = false,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "minute", "hour" },
                DefaultGranularity = "minute",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "pts" },
                MinWindow = TimeSpan.FromMinutes(1),
                MaxWindow = TimeSpan.FromHours(24),
                SupportsCompareMode = false,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "today",
                    Granularity = "minute",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST",
                    "ticker"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none", "site" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "minute",
                    ["datePreset"] = "today",
                    ["unit"] = "pts",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 25
                },
                Category = WidgetTypeDefinitions.Categories.FUEL_OPERATION,
                RefreshIntervalSeconds = 15,
                IncludeTotalDefault = true,
                TopKDefault = 25
            };
        }

        private static DataSourceMetadata CreatePumpTransactionsRecentMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Recent Pump Transactions",
                Unit = "transactions",
                SupportedUnits = new List<string> { "transactions", "count" },
                Description = "Shows the 10 most recent recorded non-transfer pump transactions for the selected scope.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count", "sum" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "hour", "day" },
                DefaultGranularity = "hour",
                DefaultMode = "historical_snapshot",
                RecommendedUnits = new List<string> { "transactions" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                SupportsCompareMode = false,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "today",
                    Granularity = "hour",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "DATA_TABLE_DETAILED",
                    "ticker"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none", "site", "pts" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "historical_snapshot",
                    ["aggregation"] = "count",
                    ["granularity"] = "hour",
                    ["datePreset"] = "today",
                    ["unit"] = "transactions",
                    ["groupBy"] = "none",
                    ["includeTotal"] = false,
                    ["topK"] = 10
                },
                Category = WidgetTypeDefinitions.Categories.FUEL_OPERATION,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = false,
                TopKDefault = 10
            };
        }
    }
}