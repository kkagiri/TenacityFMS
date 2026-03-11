/**
 * File: WidgetTemplateSeeder.EventIssueTemplates.cs
 * Purpose: Defines curated dashboard widget templates for event alerts and issue tracker widgets.
 * Dependencies: DashboardWidgetTemplate, Newtonsoft.Json
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - GetEventAndIssueTemplates(): Returns seeded templates for event and issue-tracker widgets.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private static IEnumerable<DashboardWidgetTemplate> GetEventAndIssueTemplates(
            string dashboardEventPermission,
            string dashboardIssuePermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                new DashboardWidgetTemplate
                {
                    WidgetType = "BIG_STAT_CARD",
                    Name = "event_active_summary_card",
                    DisplayName = "Event Alerts - Active Summary",
                    Description = "Big stat card showing active event totals for the selected scope.",
                    Category = "alerts_monitoring",
                    DataSource = "active_event_summary",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        showTrend = true,
                        showComparison = true,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "active_event_summary",
                            includeTotal = true
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardEventPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_BAR_COMPARISON",
                    Name = "event_severity_bar_chart",
                    DisplayName = "Event Alerts - Severity Breakdown",
                    Description = "Bar chart showing active events by severity.",
                    Category = "alerts_monitoring",
                    DataSource = "active_events_by_severity",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "bar",
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "active_events_by_severity",
                            includeTotal = true,
                            topK = 4
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardEventPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "ticker",
                    Name = "event_recent_active_ticker",
                    DisplayName = "Event Alerts - Recent Active Feed",
                    Description = "Ticker feed listing the most recent active events.",
                    Category = "alerts_monitoring",
                    DataSource = "recent_active_events",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "recent_active_events",
                            includeTotal = false,
                            topK = 10
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardEventPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_LINE_TREND",
                    Name = "event_trend_line_chart",
                    DisplayName = "Event Alerts - Events Over Time",
                    Description = "Line chart showing event triggers over time.",
                    Category = "alerts_monitoring",
                    DataSource = "events_over_time",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "line",
                        defaultMode = "daily_aggregated",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        showDataPoints = true,
                        defaultSettings = new
                        {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "events_over_time",
                            includeTotal = true,
                            topK = 30
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardEventPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "BIG_STAT_CARD",
                    Name = "issue_tracker_summary_card",
                    DisplayName = "Issue Tracker - Open Summary",
                    Description = "Big stat card showing open issues and overall issue summary.",
                    Category = "operational_metrics",
                    DataSource = "issue_tracker_summary",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        showTrend = true,
                        showComparison = true,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "issue_tracker_summary",
                            includeTotal = true
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardIssuePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_BAR_COMPARISON",
                    Name = "issue_status_bar_chart",
                    DisplayName = "Issue Tracker - Status Breakdown",
                    Description = "Bar chart showing issues by status.",
                    Category = "operational_metrics",
                    DataSource = "issues_by_status",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "bar",
                        defaultMode = "live",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "issues_by_status",
                            includeTotal = true,
                            topK = 5
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardIssuePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "ticker",
                    Name = "issue_overdue_ticker",
                    DisplayName = "Issue Tracker - Overdue Feed",
                    Description = "Ticker feed listing overdue issues needing attention.",
                    Category = "operational_metrics",
                    DataSource = "overdue_issues",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "overdue_issues",
                            includeTotal = true,
                            topK = 15
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardIssuePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_LINE_TREND",
                    Name = "issue_trend_line_chart",
                    DisplayName = "Issue Tracker - Issues Over Time",
                    Description = "Line chart showing issue volume over time.",
                    Category = "operational_metrics",
                    DataSource = "issues_over_time",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "line",
                        defaultMode = "daily_aggregated",
                        defaultDatePreset = "last_30_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        showDataPoints = true,
                        defaultSettings = new
                        {
                            mode = "daily_aggregated",
                            datePreset = "last_30_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "issues_over_time",
                            includeTotal = true,
                            topK = 30
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardIssuePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "DATA_TABLE_DETAILED",
                    Name = "issue_detail_table",
                    DisplayName = "Issue Tracker - Detail Table",
                    Description = "Business-friendly issue table for triage, ownership, and due-date review.",
                    Category = "operational_metrics",
                    DataSource = "issues_detail_table",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        pageSize = 8,
                        showPagination = true,
                        showSearch = true,
                        showRowNumbers = false,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "issues_detail_table",
                            includeTotal = true,
                            topK = 25
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardIssuePermission,
                    IsEnabled = true
                }
            };
        }
    }
}