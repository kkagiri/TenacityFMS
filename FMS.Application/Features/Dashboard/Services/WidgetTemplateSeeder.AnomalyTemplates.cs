/**
 * File: WidgetTemplateSeeder.AnomalyTemplates.cs
 * Purpose: Defines reusable dashboard widget templates for vehicle and fleet anomaly monitoring.
 * Dependencies: DashboardWidgetTemplate, JsonConvert
 * Last Modified: 2026-03-12
 *
 * Key Functions:
 * - GetAnomalyTemplates(): Returns preset templates for anomaly count, severity breakdown, and review feed.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private List<DashboardWidgetTemplate> GetAnomalyTemplates(string requiredPermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                // BIG_STAT_CARD — total unresolved anomaly count with change indicator
                new DashboardWidgetTemplate
                {
                    Name = "vehicle-anomaly-count-live",
                    DisplayName = "Anomaly Count",
                    Description = "Shows the total number of unresolved active events for today with a severity breakdown. Includes a Review link navigating to the Events page.",
                    Category = "fleet_anomalies",
                    WidgetType = "BIG_STAT_CARD",
                    DataSource = "vehicle_anomaly_count",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        icon = "fa-light fa-triangle-exclamation",
                        color = "#DC2626",
                        displayOrder = 710,
                        showReviewLink = true,
                        reviewPath = "/events",
                        defaultSettings = new
                        {
                            title = "Anomaly Count",
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "vehicle_anomaly_count",
                            includeTotal = true,
                            topK = 10,
                            icon = "fa-light fa-triangle-exclamation",
                            color = "#DC2626",
                            showReviewLink = true,
                            reviewPath = "/events"
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = requiredPermission,
                    IsEnabled = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // CHART_BAR_COMPARISON — anomaly count by severity
                new DashboardWidgetTemplate
                {
                    Name = "vehicle-anomaly-by-severity",
                    DisplayName = "Anomalies by Severity",
                    Description = "Bar chart showing today's unresolved active events broken down by severity level.",
                    Category = "fleet_anomalies",
                    WidgetType = "CHART_BAR_COMPARISON",
                    DataSource = "vehicle_anomaly_count",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "bar",
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        groupBy = "severity",
                        displayOrder = 720,
                        defaultSettings = new
                        {
                            title = "Anomalies by Severity",
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "vehicle_anomaly_count",
                            groupBy = "severity",
                            includeTotal = true,
                            topK = 10
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = requiredPermission,
                    IsEnabled = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // DATA_TABLE_DETAILED — live review feed with per-row review links
                new DashboardWidgetTemplate
                {
                    Name = "anomaly-review-feed",
                    DisplayName = "Anomaly Review Feed",
                    Description = "Live table of the most recent unresolved active events, ordered by severity. Each row links to the Events review page.",
                    Category = "fleet_anomalies",
                    WidgetType = "DATA_TABLE_DETAILED",
                    DataSource = "anomaly_review_feed",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        maxRows = 30,
                        displayOrder = 730,
                        showReviewLink = true,
                        reviewPath = "/events",
                        defaultSettings = new
                        {
                            title = "Anomaly Review Feed",
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "count",
                            dataSource = "anomaly_review_feed",
                            includeTotal = true,
                            topK = 30,
                            showReviewLink = true,
                            reviewPath = "/events"
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = requiredPermission,
                    IsEnabled = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
        }
    }
}
