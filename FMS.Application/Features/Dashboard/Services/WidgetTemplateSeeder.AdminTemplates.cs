/**
 * File: WidgetTemplateSeeder.AdminTemplates.cs
 * Purpose: Defines seeded dashboard widget templates for admin and system operations monitoring.
 * Dependencies: DashboardWidgetTemplate, Newtonsoft.Json
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - GetAdminTemplates(): Returns admin-focused widget templates for operational monitoring.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private static IEnumerable<DashboardWidgetTemplate> GetAdminTemplates(
            string dashboardAdminUsersPermission,
            string dashboardAdminDevicePermission,
            string dashboardNotificationPermission,
            string dashboardVehiclePermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                new DashboardWidgetTemplate
                {
                    WidgetType = "BIG_STAT_CARD",
                    Name = "admin_current_logged_in_users_card",
                    DisplayName = "Admin - Currently Logged In Users",
                    Description = "Shows the current active frontend session count with recent login activity.",
                    Category = "admin",
                    DataSource = "current_logged_in_users",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "users",
                        showTrend = false,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "users",
                            dataSource = "current_logged_in_users",
                            includeTotal = true
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardAdminUsersPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "BIG_STAT_CARD",
                    Name = "admin_pts_windows_service_card",
                    DisplayName = "Admin - PTS Windows Service Uptime",
                    Description = "Shows whether the PTS Windows Service is running and how long it has been up.",
                    Category = "admin",
                    DataSource = "pts_windows_service_status",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "max",
                        granularity = "day",
                        unit = "hours",
                        showTrend = false,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "max",
                            granularity = "day",
                            unit = "hours",
                            dataSource = "pts_windows_service_status",
                            includeTotal = true
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardAdminDevicePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_BAR_COMPARISON",
                    Name = "admin_notification_performance_chart",
                    DisplayName = "Admin - Notification Performance",
                    Description = "Daily notification performance across all users showing sent, delivered, and failed outcomes.",
                    Category = "admin",
                    DataSource = "notification_performance_all_users",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "bar",
                        defaultMode = "daily_aggregated",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "notifications",
                        defaultSettings = new
                        {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "notifications",
                            dataSource = "notification_performance_all_users",
                            includeTotal = true,
                            topK = 14
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardNotificationPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "CHART_BAR_COMPARISON",
                    Name = "admin_location_validation_outcomes_chart",
                    DisplayName = "Admin - Location Validation Outcomes",
                    Description = "Daily pass and fail outcomes for location validation, including bypassed validations.",
                    Category = "admin",
                    DataSource = "location_validation_outcomes",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        chartType = "bar",
                        defaultMode = "daily_aggregated",
                        defaultDatePreset = "last_7_days",
                        aggregation = "count",
                        granularity = "day",
                        unit = "validations",
                        defaultSettings = new
                        {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "count",
                            granularity = "day",
                            unit = "validations",
                            dataSource = "location_validation_outcomes",
                            includeTotal = true,
                            topK = 14
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardVehiclePermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "PROGRESS_LIST",
                    Name = "admin_provider_health_progress_list",
                    DisplayName = "Admin - Provider Health",
                    Description = "Provider health view with response times, request volume, and success rates.",
                    Category = "admin",
                    DataSource = "provider_health_status",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "day",
                        unit = "providers",
                        maxItems = 10,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "day",
                            unit = "providers",
                            dataSource = "provider_health_status",
                            includeTotal = true,
                            topK = 10
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardAdminDevicePermission,
                    IsEnabled = true
                }
            };
        }
    }
}
