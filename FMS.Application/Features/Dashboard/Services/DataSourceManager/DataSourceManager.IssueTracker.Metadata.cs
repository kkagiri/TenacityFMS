/**
 * File: DataSourceManager.IssueTracker.Metadata.cs
 * Purpose: Defines dashboard catalog metadata for issue-tracker data sources.
 * Dependencies: DataSourceMetadata, WidgetTypeDefinitions, DataSourceRecommendations
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - CreateIssueTrackerSummaryMetadata(): Registers the summary source for issue-tracker KPI widgets.
 * - CreateIssueDetailTableMetadata(): Registers the detailed issue-table source for operational review.
 * - CreateIssueBreakdownMetadata(): Registers categorical issue sources for charts and lists.
 * - CreateIssueFeedMetadata(): Registers recent and overdue issue list/ticker sources.
 * - CreateIssuesOverTimeMetadata(): Registers the issue trend source.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private static DataSourceMetadata CreateIssueTrackerSummaryMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Issue Tracker Summary",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Open, closed, overdue, and high-priority issue totals for the selected scope.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot", "rolling_window" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                SupportsCompareMode = true,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "BIG_STAT_CARD",
                    "ticker",
                    "CHART_BAR_COMPARISON",
                    "CHART_PIE_DISTRIBUTION"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = true,
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 5
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 5
            };
        }

        private static DataSourceMetadata CreateIssuesByStatusMetadata()
        {
            return CreateIssueBreakdownMetadata(
                "Issues by Status",
                "Issues grouped into open, in-progress, and closed status buckets.",
                5);
        }

        private static DataSourceMetadata CreateIssuesByPriorityMetadata()
        {
            return CreateIssueBreakdownMetadata(
                "Issues by Priority",
                "Issues grouped by business priority level.",
                5);
        }

        private static DataSourceMetadata CreateIssuesByCategoryMetadata()
        {
            return CreateIssueBreakdownMetadata(
                "Issues by Category",
                "Issues grouped by issue category.",
                10);
        }

        private static DataSourceMetadata CreateIssuesByVehicleMetadata()
        {
            return CreateIssueBreakdownMetadata(
                "Issues by Vehicle",
                "Top vehicles ranked by issue count.",
                10);
        }

        private static DataSourceMetadata CreateIssuesBySiteMetadata()
        {
            return CreateIssueBreakdownMetadata(
                "Issues by Site",
                "Top sites ranked by issue count.",
                10);
        }

        private static DataSourceMetadata CreateRecentIssuesMetadata()
        {
            return CreateIssueFeedMetadata(
                "Recent Issues",
                "Latest created or updated issues for the selected scope.",
                10,
                includeTotal: false);
        }

        private static DataSourceMetadata CreateOverdueIssuesMetadata()
        {
            return CreateIssueFeedMetadata(
                "Overdue Issues",
                "Open issues whose due date has already passed.",
                15,
                includeTotal: true);
        }

        private static DataSourceMetadata CreateIssuesOverTimeMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Issues Over Time",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Issue creation trend across the selected date range.",
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
                MaxWindow = TimeSpan.FromDays(180),
                SupportsCompareMode = true,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "last_30_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "low"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "CHART_LINE_TREND",
                    "CHART_BAR_COMPARISON",
                    "DATA_TABLE_DETAILED",
                    "BIG_STAT_CARD"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = true,
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "daily_aggregated",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_30_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 30
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 30
            };
        }

        private static DataSourceMetadata CreateIssueDetailTableMetadata()
        {
            return new DataSourceMetadata
            {
                DisplayName = "Issue Detail Table",
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = "Detailed issue records with business-friendly columns for status review and triage.",
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot", "rolling_window" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                SupportsCompareMode = false,
                Recommendations = new DataSourceRecommendations
                {
                    DatePreset = "last_7_days",
                    Granularity = "day",
                    CumulativeDefault = false,
                    SmoothingDefault = "none"
                },
                CompatibleWidgetTypes = new List<string>
                {
                    "DATA_TABLE_DETAILED"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = true,
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = 25
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = 25
            };
        }

        private static DataSourceMetadata CreateIssueBreakdownMetadata(string displayName, string description, int topK)
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
                SupportedGranularities = new List<string> { "day", "week" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                CompatibleWidgetTypes = new List<string>
                {
                    "CHART_BAR_COMPARISON",
                    "CHART_PIE_DISTRIBUTION",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST",
                    "ticker"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = true,
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = true,
                    ["topK"] = topK
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = true,
                TopKDefault = topK
            };
        }

        private static DataSourceMetadata CreateIssueFeedMetadata(string displayName, string description, int topK, bool includeTotal)
        {
            return new DataSourceMetadata
            {
                DisplayName = displayName,
                Unit = "count",
                SupportedUnits = new List<string> { "count" },
                Description = description,
                SupportsLiveData = true,
                SupportsHistoricalData = true,
                SupportedModes = new List<string> { "live", "historical_snapshot" },
                SupportedAggregations = new List<string> { "count" },
                DefaultAggregation = "count",
                SupportedGranularities = new List<string> { "day" },
                DefaultGranularity = "day",
                DefaultMode = "live",
                RecommendedUnits = new List<string> { "count" },
                MinWindow = TimeSpan.FromHours(1),
                MaxWindow = TimeSpan.FromDays(90),
                CompatibleWidgetTypes = new List<string>
                {
                    "ticker",
                    "DATA_TABLE_DETAILED",
                    "PROGRESS_LIST"
                },
                RequiresSiteFilter = false,
                RequiresVehicleFilter = true,
                SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                DefaultGroupBy = "none",
                DefaultConfiguration = new Dictionary<string, object>
                {
                    ["mode"] = "live",
                    ["aggregation"] = "count",
                    ["granularity"] = "day",
                    ["datePreset"] = "last_7_days",
                    ["unit"] = "count",
                    ["groupBy"] = "none",
                    ["includeTotal"] = includeTotal,
                    ["topK"] = topK
                },
                Category = WidgetTypeDefinitions.Categories.OPERATIONAL_METRICS,
                RefreshIntervalSeconds = 60,
                IncludeTotalDefault = includeTotal,
                TopKDefault = topK
            };
        }
    }
}