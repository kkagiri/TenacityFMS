/**
 * File: WidgetTemplateSeeder.VehicleTripTemplates.cs
 * Purpose: Defines reusable dashboard widget templates for trip-management KPIs and operational trip views.
 * Dependencies: DashboardWidgetTemplate, JsonConvert
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - GetVehicleTripTemplates(): Returns preset templates for trip-management dashboard widgets.
 * - CreateTripManagementBigStatTemplate(): Builds big stat templates for trip KPIs.
 * - CreateTripManagementTrendTemplate(): Builds trend templates for historical trip analytics.
 */
using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private List<DashboardWidgetTemplate> GetVehicleTripTemplates(string requiredPermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                CreateTripManagementTableTemplate(
                    requiredPermission,
                    key: "trip-in-transit-table",
                    displayName: "Vehicles In Transit",
                    description: "Shows vehicles currently in transit with origin, estimated destination, and elapsed duration.",
                    dataSource: "trip_in_transit",
                    title: "Vehicles In Transit",
                    displayOrder: 610),

                CreateTripManagementProgressTemplate(
                    requiredPermission,
                    key: "vehicles-at-site-progress",
                    displayName: "Vehicles At Site",
                    description: "Shows current site occupancy based on persisted trip completions and working-site fallbacks.",
                    dataSource: "vehicles_at_site",
                    title: "Vehicles At Site",
                    displayOrder: 620),

                CreateTripManagementBigStatTemplate(
                    requiredPermission,
                    key: "trip-count-vs-expected-today",
                    displayName: "Trip Count vs Expected",
                    description: "Compares today's trip count against a rolling historical baseline. Refreshes live so operators see the current tally throughout the shift.",
                    dataSource: "trip_count_vs_expected",
                    title: "Trip Count vs Expected",
                    unit: "trips",
                    iconClass: "fa-light fa-road-circle-check",
                    color: "#2563EB",
                    defaultMode: "live",
                    displayOrder: 630),

                CreateTripManagementBigStatTemplate(
                    requiredPermission,
                    key: "tipper-cycle-count-today",
                    displayName: "Tipper Cycle Count",
                    description: "Shows live load-cycle activity for the current shift. Refreshes every 60 seconds so operators always see the latest cycle tally.",
                    dataSource: "tipper_cycle_count",
                    title: "Tipper Cycle Count",
                    unit: "cycles",
                    iconClass: "fa-light fa-arrow-rotate-right",
                    color: "#EA580C",
                    defaultMode: "live",
                    displayOrder: 640),

                CreateTripManagementBigStatTemplate(
                    requiredPermission,
                    key: "average-trip-duration-today",
                    displayName: "Average Trip Duration",
                    description: "Shows the average duration per trip using persisted trip groups.",
                    dataSource: "average_trip_duration",
                    title: "Average Trip Duration",
                    unit: "minutes",
                    iconClass: "fa-light fa-stopwatch",
                    color: "#7C3AED",
                    defaultMode: "historical_snapshot",
                    displayOrder: 650),

                CreateTripManagementTrendTemplate(requiredPermission)
            };
        }

        private DashboardWidgetTemplate CreateTripManagementBigStatTemplate(
            string requiredPermission,
            string key,
            string displayName,
            string description,
            string dataSource,
            string title,
            string unit,
            string iconClass,
            string color,
            string defaultMode,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = displayName,
                Description = description,
                Category = "trip_management",
                WidgetType = "BIG_STAT_CARD",
                DataSource = dataSource,
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode,
                    defaultDatePreset = "today",
                    aggregation = unit == "minutes" ? "avg" : "count",
                    granularity = "day",
                    unit,
                    icon = iconClass,
                    color,
                    displayOrder,
                    defaultSettings = new
                    {
                        title,
                        mode = defaultMode,
                        datePreset = "today",
                        aggregation = unit == "minutes" ? "avg" : "count",
                        granularity = "day",
                        unit,
                        dataSource,
                        includeTotal = true,
                        topK = 15,
                        icon = iconClass,
                        color
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateTripManagementTableTemplate(
            string requiredPermission,
            string key,
            string displayName,
            string description,
            string dataSource,
            string title,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = displayName,
                Description = description,
                Category = "trip_management",
                WidgetType = "DATA_TABLE_DETAILED",
                DataSource = dataSource,
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "live",
                    defaultDatePreset = "today",
                    aggregation = "count",
                    granularity = "day",
                    unit = "count",
                    maxRows = 25,
                    displayOrder,
                    defaultSettings = new
                    {
                        title,
                        mode = "live",
                        datePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        dataSource,
                        includeTotal = true,
                        topK = 25
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateTripManagementProgressTemplate(
            string requiredPermission,
            string key,
            string displayName,
            string description,
            string dataSource,
            string title,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = displayName,
                Description = description,
                Category = "trip_management",
                WidgetType = "PROGRESS_LIST",
                DataSource = dataSource,
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "live",
                    defaultDatePreset = "today",
                    aggregation = "count",
                    granularity = "day",
                    unit = "count",
                    maxItems = 15,
                    displayOrder,
                    defaultSettings = new
                    {
                        title,
                        mode = "live",
                        datePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "count",
                        dataSource,
                        includeTotal = true,
                        topK = 15,
                        groupBy = "site"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateTripManagementTrendTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "average-trip-duration-trend",
                DisplayName = "Average Trip Duration Trend",
                Description = "Shows the daily average trip duration trend for the selected period.",
                Category = "trip_management",
                WidgetType = "CHART_LINE_TREND",
                DataSource = "average_trip_duration",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    chartType = "line",
                    defaultMode = "daily_aggregated",
                    defaultDatePreset = "last_7_days",
                    aggregation = "avg",
                    granularity = "day",
                    unit = "minutes",
                    color = "#7C3AED",
                    displayOrder = 660,
                    defaultSettings = new
                    {
                        title = "Average Trip Duration Trend",
                        mode = "daily_aggregated",
                        datePreset = "last_7_days",
                        aggregation = "avg",
                        granularity = "day",
                        unit = "minutes",
                        dataSource = "average_trip_duration",
                        includeTotal = true,
                        topK = 30,
                        color = "#7C3AED"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
    }
}
