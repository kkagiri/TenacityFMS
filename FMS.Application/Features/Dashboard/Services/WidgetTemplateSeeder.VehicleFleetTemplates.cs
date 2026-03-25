/**
 * File: WidgetTemplateSeeder.VehicleFleetTemplates.cs
 * Purpose: Defines reusable dashboard widget templates for vehicle fleet live-status, trip-distance, and GPS track-distance KPIs.
 * Dependencies: DashboardWidgetTemplate, WidgetTypeDefinitions, DashboardPermissions
 * Last Modified: 2026-03-25
 *
 * Key Functions:
 * - GetVehicleFleetTemplates(): Returns dashboard widget templates for fleet and distance widgets.
 * - CreateFleetBigStatTemplate(): Builds big stat card templates for live fleet counts.
 * - CreateTripDistanceBigStatTemplate(): Builds big stat card templates for trip-distance snapshots.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private List<DashboardWidgetTemplate> GetVehicleFleetTemplates(string requiredPermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-total-gps",
                    name: "Total GPS Vehicles",
                    description: "Shows the total number of GPS-enabled vehicles currently tracked by the live fleet feed.",
                    dataSource: "fleet_total_gps",
                    iconClass: "fa-light fa-truck",
                    color: "#2563EB",
                    displayOrder: 510),

                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-online-gps",
                    name: "Online GPS Vehicles",
                    description: "Shows how many GPS-enabled vehicles are currently online.",
                    dataSource: "fleet_online_gps",
                    iconClass: "fa-light fa-signal-stream",
                    color: "#16A34A",
                    displayOrder: 520),

                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-moving-gps",
                    name: "Moving Vehicles",
                    description: "Shows how many online GPS vehicles are currently moving.",
                    dataSource: "fleet_moving_gps",
                    iconClass: "fa-light fa-route",
                    color: "#0EA5E9",
                    displayOrder: 530),

                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-parked-gps",
                    name: "Parked Vehicles",
                    description: "Shows how many online GPS vehicles are currently parked.",
                    dataSource: "fleet_parked_gps",
                    iconClass: "fa-light fa-square-parking",
                    color: "#F59E0B",
                    displayOrder: 540),

                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-stopped-gps",
                    name: "Stopped Vehicles",
                    description: "Shows how many online GPS vehicles are currently stopped but not yet parked.",
                    dataSource: "fleet_stopped_gps",
                    iconClass: "fa-light fa-circle-stop",
                    color: "#F97316",
                    displayOrder: 550),

                CreateFleetBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "fleet-offline-gps",
                    name: "Offline GPS Vehicles",
                    description: "Shows how many GPS-enabled vehicles are currently offline.",
                    dataSource: "fleet_offline_gps",
                    iconClass: "fa-light fa-wifi-slash",
                    color: "#64748B",
                    displayOrder: 560),

                CreateTripDistanceBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "trip-distance-today",
                    name: "Distance Today",
                    description: "Shows total trip distance covered today from persisted trip groups.",
                    datePreset: "today",
                    iconClass: "fa-light fa-road",
                    color: "#7C3AED",
                    displayOrder: 570),

                CreateTripDistanceBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "trip-distance-yesterday",
                    name: "Distance Yesterday",
                    description: "Shows total trip distance covered yesterday from persisted trip groups.",
                    datePreset: "yesterday",
                    iconClass: "fa-light fa-timeline-arrow",
                    color: "#9333EA",
                    displayOrder: 580),

                CreateTripDistanceBigStatTemplate(
                    requiredPermission: requiredPermission,
                    key: "trip-distance-last-week",
                    name: "Distance Last Week",
                    description: "Shows total trip distance covered during the previous week from persisted trip groups.",
                    datePreset: "last_week",
                    iconClass: "fa-light fa-calendar-week",
                    color: "#A855F7",
                    displayOrder: 590),

                CreateTripDistanceTrendTemplate(requiredPermission),

                CreateMostTravelledVehicleTickerTemplate(
                    requiredPermission,
                    "gps-most-travelled-vehicle-today",
                    "Most Travelled Vehicle Today",
                    "Highlights the vehicle with the highest GPSGate track distance today using active provider mappings.",
                    "today",
                    "sum",
                    "fa-light fa-tachograph-digital",
                    "#0F766E",
                    610),

                CreateMostTravelledVehicleTickerTemplate(
                    requiredPermission,
                    "gps-most-travelled-vehicle-yesterday",
                    "Most Travelled Vehicle Yesterday",
                    "Highlights the vehicle with the highest GPSGate track distance yesterday using active provider mappings.",
                    "yesterday",
                    "sum",
                    "fa-light fa-road-circle-check",
                    "#0D9488",
                    620),

                CreateMostTravelledVehicleTickerTemplate(
                    requiredPermission,
                    "gps-most-travelled-vehicle-last-week",
                    "Most Travelled Vehicle Last Week",
                    "Highlights the vehicle with the highest GPSGate track distance last week using active provider mappings.",
                    "last_week",
                    "sum",
                    "fa-light fa-calendar-week",
                    "#0F766E",
                    630),

                CreateMostTravelledGpsLineTemplate(requiredPermission),
                CreateMostTravelledGpsBarTemplate(requiredPermission),
                CreateMostTravelledGpsVehicleTypeTemplate(requiredPermission),
                CreateMostTravelledGpsTableTemplate(requiredPermission)
            };
        }

        private DashboardWidgetTemplate CreateMostTravelledVehicleTickerTemplate(
            string requiredPermission,
            string key,
            string name,
            string description,
            string datePreset,
            string aggregation,
            string iconClass,
            string color,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = name,
                Description = description,
                Category = "vehicle_performance",
                WidgetType = "ticker",
                DataSource = "most_vehicle_travelled_gps",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "historical_snapshot",
                    defaultDatePreset = datePreset,
                    aggregation,
                    granularity = "day",
                    groupBy = "none",
                    unit = "km",
                    showTrend = true,
                    showComparison = true,
                    icon = iconClass,
                    color,
                    displayOrder,
                    defaultSettings = new
                    {
                        title = name,
                        mode = "historical_snapshot",
                        datePreset,
                        aggregation,
                        granularity = "day",
                        groupBy = "none",
                        unit = "km",
                        dataSource = "most_vehicle_travelled_gps",
                        includeTotal = true,
                        topK = 10,
                        icon = iconClass,
                        color
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateMostTravelledGpsLineTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "gps-most-travelled-distance-trend",
                DisplayName = "GPS Travel Distance Trend",
                Description = "Shows the daily GPSGate travel-distance trend for the selected fleet scope.",
                Category = "vehicle_performance",
                WidgetType = "CHART_LINE_TREND",
                DataSource = "most_vehicle_travelled_gps",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    chartType = "line",
                    defaultMode = "daily_aggregated",
                    defaultDatePreset = "last_7_days",
                    aggregation = "sum",
                    granularity = "day",
                    groupBy = "none",
                    unit = "km",
                    showArea = true,
                    showDataLabels = false,
                    color = "#0F766E",
                    displayOrder = 640,
                    defaultSettings = new
                    {
                        title = "GPS Travel Distance Trend",
                        mode = "daily_aggregated",
                        datePreset = "last_7_days",
                        aggregation = "sum",
                        granularity = "day",
                        groupBy = "none",
                        unit = "km",
                        dataSource = "most_vehicle_travelled_gps",
                        includeTotal = true,
                        topK = 14,
                        color = "#0F766E"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateMostTravelledGpsBarTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "gps-most-travelled-by-site",
                DisplayName = "GPS Distance by Site",
                Description = "Compares cumulative GPSGate travel distance by vehicle working site.",
                Category = "vehicle_performance",
                WidgetType = "CHART_BAR_COMPARISON",
                DataSource = "most_vehicle_travelled_gps",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    chartType = "bar",
                    defaultMode = "historical_snapshot",
                    defaultDatePreset = "last_week",
                    aggregation = "sum",
                    granularity = "day",
                    groupBy = "site",
                    unit = "km",
                    showValues = true,
                    color = "#0EA5E9",
                    displayOrder = 650,
                    defaultSettings = new
                    {
                        title = "GPS Distance by Site",
                        mode = "historical_snapshot",
                        datePreset = "last_week",
                        aggregation = "sum",
                        granularity = "day",
                        groupBy = "site",
                        unit = "km",
                        dataSource = "most_vehicle_travelled_gps",
                        includeTotal = true,
                        topK = 10,
                        color = "#0EA5E9"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateMostTravelledGpsVehicleTypeTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "gps-average-distance-by-vehicle-type",
                DisplayName = "GPS Distance by Vehicle Type",
                Description = "Compares average GPSGate travel distance by vehicle type for the selected period.",
                Category = "vehicle_performance",
                WidgetType = "CHART_BAR_COMPARISON",
                DataSource = "most_vehicle_travelled_gps",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    chartType = "bar",
                    defaultMode = "historical_snapshot",
                    defaultDatePreset = "last_week",
                    aggregation = "avg",
                    granularity = "day",
                    groupBy = "vehicleType",
                    unit = "km",
                    showValues = true,
                    color = "#7C3AED",
                    displayOrder = 660,
                    defaultSettings = new
                    {
                        title = "GPS Distance by Vehicle Type",
                        mode = "historical_snapshot",
                        datePreset = "last_week",
                        aggregation = "avg",
                        granularity = "day",
                        groupBy = "vehicleType",
                        unit = "km",
                        dataSource = "most_vehicle_travelled_gps",
                        includeTotal = true,
                        topK = 10,
                        color = "#7C3AED"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateMostTravelledGpsTableTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "gps-top-travelled-vehicles-table",
                DisplayName = "Top Travelled Vehicles Table",
                Description = "Shows ranked vehicles with GPSGate travel distance, site, and vehicle type for the selected period.",
                Category = "vehicle_performance",
                WidgetType = "DATA_TABLE_DETAILED",
                DataSource = "most_vehicle_travelled_gps",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "historical_snapshot",
                    defaultDatePreset = "last_week",
                    aggregation = "sum",
                    granularity = "day",
                    groupBy = "none",
                    unit = "km",
                    displayOrder = 670,
                    defaultSettings = new
                    {
                        title = "Top Travelled Vehicles Table",
                        mode = "historical_snapshot",
                        datePreset = "last_week",
                        aggregation = "sum",
                        granularity = "day",
                        groupBy = "none",
                        unit = "km",
                        dataSource = "most_vehicle_travelled_gps",
                        includeTotal = true,
                        topK = 15,
                        pageSize = 15,
                        showPaging = true,
                        showFiltering = true,
                        showSorting = true,
                        visibleColumns = new[]
                        {
                            "rank",
                            "label",
                            "distanceKm",
                            "siteName",
                            "vehicleTypeName",
                            "daysReported"
                        }
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateFleetBigStatTemplate(
            string requiredPermission,
            string key,
            string name,
            string description,
            string dataSource,
            string iconClass,
            string color,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = name,
                Description = description,
                Category = "vehicle_performance",
                WidgetType = "BIG_STAT_CARD",
                DataSource = dataSource,
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "live",
                    defaultDatePreset = "today",
                    aggregation = "count",
                    granularity = "minute",
                    unit = "count",
                    showTrend = false,
                    showComparison = false,
                    icon = iconClass,
                    color,
                    displayOrder,
                    defaultSettings = new
                    {
                        title = name,
                        mode = "live",
                        datePreset = "today",
                        aggregation = "count",
                        granularity = "minute",
                        unit = "count",
                        dataSource,
                        includeTotal = true,
                        topK = 10,
                        icon = iconClass,
                        color
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateTripDistanceBigStatTemplate(
            string requiredPermission,
            string key,
            string name,
            string description,
            string datePreset,
            string iconClass,
            string color,
            int displayOrder)
        {
            return new DashboardWidgetTemplate
            {
                Name = key,
                DisplayName = name,
                Description = description,
                Category = "vehicle_performance",
                WidgetType = "BIG_STAT_CARD",
                DataSource = "trip_distance",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    defaultMode = "historical_snapshot",
                    defaultDatePreset = datePreset,
                    aggregation = "sum",
                    granularity = "day",
                    unit = "km",
                    showTrend = true,
                    showComparison = true,
                    icon = iconClass,
                    color,
                    displayOrder,
                    defaultSettings = new
                    {
                        title = name,
                        mode = "historical_snapshot",
                        datePreset,
                        aggregation = "sum",
                        granularity = "day",
                        unit = "km",
                        dataSource = "trip_distance",
                        includeTotal = true,
                        topK = 14,
                        icon = iconClass,
                        color
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }

        private DashboardWidgetTemplate CreateTripDistanceTrendTemplate(string requiredPermission)
        {
            return new DashboardWidgetTemplate
            {
                Name = "trip-distance-trend",
                DisplayName = "Trip Distance Trend",
                Description = "Shows the daily trip-distance trend for the selected period.",
                Category = "vehicle_performance",
                WidgetType = "CHART_LINE_TREND",
                DataSource = "trip_distance",
                ConfigurationJson = JsonConvert.SerializeObject(new
                {
                    chartType = "line",
                    defaultMode = "daily_aggregated",
                    defaultDatePreset = "last_7_days",
                    aggregation = "sum",
                    granularity = "day",
                    unit = "km",
                    showArea = true,
                    showDataLabels = false,
                    color = "#7C3AED",
                    displayOrder = 600,
                    defaultSettings = new
                    {
                        title = "Trip Distance Trend",
                        mode = "daily_aggregated",
                        datePreset = "last_7_days",
                        aggregation = "sum",
                        granularity = "day",
                        unit = "km",
                        dataSource = "trip_distance",
                        includeTotal = true,
                        topK = 30,
                        color = "#7C3AED"
                    }
                }),
                RequiredRole = null,
                RequiredPermissions = requiredPermission,
                IsEnabled = true,
                CreatedAt = System.DateTime.UtcNow,
                UpdatedAt = System.DateTime.UtcNow
            };
        }
    }
}
