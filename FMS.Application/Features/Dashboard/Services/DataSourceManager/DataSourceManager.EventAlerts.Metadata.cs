/**
 * File: DataSourceManager.EventAlerts.Metadata.cs
 * Purpose: Defines dashboard catalog metadata for event and alert data sources.
 * Dependencies: DataSourceMetadata, WidgetTypeDefinitions, DataSourceRecommendations
 * Last Modified: 2026-03-07
 *
 * Key Functions:
 * - CreateActiveEventSummaryMetadata(): Registers the summary card/feed source for active events.
 * - CreateEventBreakdownMetadata(): Registers categorical sources for severity, type, and category.
 * - CreateEventsOverTimeMetadata(): Registers the trend source for event triggers.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private static DataSourceMetadata CreateActiveEventSummaryMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Active Event Summary",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Current active, acknowledged, and resolved event totals for the selected scope.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot", "rolling_window" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "hour", "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(30),
                SupportsCompareMode = true,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "today",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "ticker",
                    "CHART_BAR_COMPARISON",
                    "CHART_PIE_DISTRIBUTION",
                    "DATA_TABLE_DETAILED"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 3
                },
                Category = WidgetTypeDefinitions.Categories.ALERTS_MONITORING,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = true,
                TopKDefault = 3
            };
        }

        private static DataSourceMetadata CreateActiveEventsBySeverityMetadata()
        {
            return CreateEventBreakdownMetadata(
                "Active Events by Severity",
                "Unresolved active events grouped by severity level.",
                4);
        }

        private static DataSourceMetadata CreateActiveEventsByTypeMetadata()
        {
            return CreateEventBreakdownMetadata(
                "Active Events by Type",
                "Unresolved active events grouped by event type.",
                10);
        }

        private static DataSourceMetadata CreateActiveEventsByCategoryMetadata()
        {
            return CreateEventBreakdownMetadata(
                "Active Events by Category",
                "Unresolved active events grouped by event-engine business category.",
                8);
        }

        private static DataSourceMetadata CreateRecentActiveEventsMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Recent Active Events",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Most recent active events with severity, source, and triggered time.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "hour", "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(30),
                CompatibleWidgetTypes = new List<string>
                {
                    "ticker",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = false,
                    ["topK"] = 10
                },
                Category = WidgetTypeDefinitions.Categories.ALERTS_MONITORING,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = false,
                TopKDefault = 10
            };
        }

        private static DataSourceMetadata CreateEventsOverTimeMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Events Over Time",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Event trigger counts trended across the selected date range.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "daily_aggregated", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "hour", "day" },
                DefaultGranularity = "day",
                DefaultMode = "daily_aggregated",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                SupportsCompareMode = true,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "CHART_LINE_TREND",
                    "DATA_TABLE_DETAILED",
                    "BIG_STAT_CARD"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "daily_aggregated",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 30
                },
                Category = WidgetTypeDefinitions.Categories.ALERTS_MONITORING,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 30
            };
        }

        private static DataSourceMetadata CreateEventBreakdownMetadata(string displayName, string description, int topK)
        {
            return new DataSourceMetadata
            {
                DisplayName = displayName,
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = description,
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot", "rolling_window" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "hour", "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(30),
                CompatibleWidgetTypes = new List<string>
                {
                    "CHART_BAR_COMPARISON",
                    "CHART_PIE_DISTRIBUTION",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST",
                    "ticker"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = false,
                SupportedGroupBy = new List<string> { "none" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "today",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = topK
                },
                Category = WidgetTypeDefinitions.Categories.ALERTS_MONITORING,
                RefreshIntervalSeconds = 30,
                IncludeTotalDefault = true,
                TopKDefault = topK
            };
        }
    }
}