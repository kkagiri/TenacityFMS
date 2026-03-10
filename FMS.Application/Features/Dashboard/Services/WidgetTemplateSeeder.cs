/**
 * File: WidgetTemplateSeeder.cs
 * Purpose: Seeds default dashboard widget templates, including report-inspired analytics widgets.
 * Dependencies: GpsdataContext, DashboardWidgetTemplate, Newtonsoft.Json, Entity Framework Core
 * Last Modified: 2026-03-06
 *
 * Key Functions:
 * - SeedWidgetTemplatesAsync(): Adds missing widget templates to the dashboard template catalog.
 * - GetDefaultTemplates(): Defines default widget templates for operational and report analytics dashboards.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public interface IWidgetTemplateSeeder
    {
        Task SeedWidgetTemplatesAsync();
    }

    public partial class WidgetTemplateSeeder : IWidgetTemplateSeeder
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<WidgetTemplateSeeder> _logger;

        public WidgetTemplateSeeder(
            GpsdataContext context,
            ILogger<WidgetTemplateSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedWidgetTemplatesAsync()
        {
            try
            {
                await EnsureDashboardReportingPermissionAsync();

                var existingTemplates = await _context.DashboardWidgetTemplates.ToListAsync();
                var existingByName = existingTemplates.ToDictionary(t => t.Name, StringComparer.OrdinalIgnoreCase);

                var allTemplates = GetDefaultTemplates();
                var newTemplates = new List<DashboardWidgetTemplate>();
                var updatedCount = 0;

                foreach (var template in allTemplates)
                {
                    if (existingByName.TryGetValue(template.Name, out var existingTemplate))
                    {
                        if (SyncTemplateAccess(existingTemplate, template))
                        {
                            updatedCount++;
                        }

                        continue;
                    }

                    newTemplates.Add(template);
                }

                if (!newTemplates.Any() && updatedCount == 0)
                {
                    _logger.LogInformation("All widget templates already exist and access metadata is already synchronized");
                    return;
                }

                if (newTemplates.Any())
                {
                    await _context.DashboardWidgetTemplates.AddRangeAsync(newTemplates);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Synchronized widget templates: added {AddedCount}, updated access for {UpdatedCount}, unchanged {UnchangedCount}",
                    newTemplates.Count,
                    updatedCount,
                    allTemplates.Count - newTemplates.Count - updatedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding widget templates");
                throw;
            }
        }

        private List<DashboardWidgetTemplate> GetDefaultTemplates()
        {
            var dashboardViewPermission = Permissions.Dashboard.View;
            var dashboardFuelPermission = string.Join(",", Permissions.Dashboard.View, Permissions.FuelRefill.Read);
            var dashboardReportingPermission = string.Join(",", Permissions.Dashboard.View, Permissions.Dashboard.Reporting);
            var dashboardTankPermission = string.Join(",", Permissions.Dashboard.View, Permissions.Tank.Read);
            var dashboardVehiclePermission = string.Join(",", Permissions.Dashboard.View, Permissions.Vehicle.Read);
            var dashboardAdminUsersPermission = string.Join(",", Permissions.Dashboard.View, Permissions.Admin.Users);
            var dashboardAdminDevicePermission = string.Join(",", Permissions.Dashboard.View, Permissions.Admin.Device);
            var dashboardNotificationPermission = string.Join(",", Permissions.Dashboard.View, Permissions.Notification.Read);

            var templates = new List<DashboardWidgetTemplate> {
                // Key Statistics Widgets
                new DashboardWidgetTemplate {
                    WidgetType = "ticker",
                        Name = "fuel_dispensed_ticker",
                        DisplayName = "Fuel Dispensed",
                        Description = "Shows total fuel dispensed with trend indicator",
                        Category = "key_statistics",
                        DataSource = "fuel_dispense",
                        ConfigurationJson = JsonConvert.SerializeObject (new {
                            defaultMode = "cumulative",
                            defaultDatePreset = "yesterday",
                            showTrend = true,
                            showComparison = true,
                            unit = "liters"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "graph",
                            Name = "fuel_dispensed_chart",
                            DisplayName = "Fuel Dispensed Over Time",
                            Description = "Line chart showing fuel dispensed over time",
                            Category = "key_statistics",
                            DataSource = "fuel_dispense",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "line",
                            defaultMode = "cumulative",
                            defaultDatePreset = "last_week",
                            showDataPoints = true,
                            unit = "liters"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "ticker",
                            Name = "engine_hours_ticker",
                            DisplayName = "Engine Hours",
                            Description = "Shows total engine hours with utilization indicator",
                            Category = "key_statistics",
                            DataSource = "engine_hours",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            defaultMode = "cumulative",
                            defaultDatePreset = "yesterday",
                            showTrend = true,
                            showUtilization = true,
                            unit = "hours"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "gauge",
                            Name = "engine_hours_gauge",
                            DisplayName = "Engine Hours Gauge",
                            Description = "Gauge showing engine hours utilization",
                            Category = "key_statistics",
                            DataSource = "engine_hours",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            min = 0,
                            max = 24,
                            defaultMode = "cumulative",
                            defaultDatePreset = "today",
                            thresholds = new [] {
                            new { value = 8, color = "green", label = "Normal" },
                            new { value = 16, color = "yellow", label = "High" },
                            new { value = 24, color = "red", label = "Critical" }
                            },
                            unit = "hours"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "ticker",
                            Name = "distance_travelled_ticker",
                            DisplayName = "Distance Travelled",
                            Description = "Shows total distance travelled by vehicles",
                            Category = "key_statistics",
                            DataSource = "km_travel",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            defaultMode = "cumulative",
                            defaultDatePreset = "yesterday",
                            showTrend = true,
                            showEfficiency = true,
                            unit = "km"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "graph",
                            Name = "fuel_used_gps_chart",
                            DisplayName = "Fuel Used (GPS)",
                            Description = "Chart showing fuel consumption from GPS data",
                            Category = "key_statistics",
                            DataSource = "fuel_used_gps",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "bar",
                            defaultMode = "cumulative",
                            defaultDatePreset = "last_week",
                            showComparison = true,
                            unit = "liters"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardViewPermission,
                            IsEnabled = true
                            },

                            // Fuel Management Widgets
                            new DashboardWidgetTemplate {
                            WidgetType = "BIG_STAT_CARD",
                            Name = "fuel_dispense_today",
                            DisplayName = "Fuel Dispense Today",
                            Description = "Shows total fuel dispensed today from pumps or manual refill",
                            Category = "fuel_management",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "today",
                            aggregation = "sum",
                            unit = "liters",
                            showTrend = true,
                            showComparison = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "today",
                            aggregation = "sum",
                            granularity = "hour",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardFuelPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "CHART_LINE_TREND",
                            Name = "fuel_dispense_trend_chart",
                            DisplayName = "Fuel Dispense Trend",
                            Description = "Line chart showing fuel dispensed trend over time",
                            Category = "fuel_management",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "line",
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            showDataPoints = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardFuelPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "CHART_BAR_COMPARISON",
                            Name = "fuel_dispense_by_site",
                            DisplayName = "Fuel Dispense by Site",
                            Description = "Bar chart comparing fuel dispensed across sites",
                            Category = "fuel_management",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "bar",
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_7_days",
                            aggregation = "sum",
                            groupBy = "site",
                            unit = "liters",
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "sum",
                            groupBy = "site",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardFuelPermission,
                            IsEnabled = true
                            },

                            // Report Analytics Widgets (based on Tank Volume / Transaction History report facts)
                            new DashboardWidgetTemplate {
                            WidgetType = "BIG_STAT_CARD",
                            Name = "report_total_dispensed_card",
                            DisplayName = "Report Total Dispensed",
                            Description = "Headline dispensed volume card inspired by the tank volume and transaction summary reports",
                            Category = "reporting",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_30_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            showTrend = true,
                            showComparison = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_30_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardReportingPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "CHART_LINE_TREND",
                            Name = "report_dispensed_trend_line",
                            DisplayName = "Report Dispensing Trend",
                            Description = "Line trend for daily dispensed fuel, aligned with the report analytics section",
                            Category = "reporting",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "line",
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            showDataPoints = true,
                            showTrend = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardReportingPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "CHART_BAR_COMPARISON",
                            Name = "report_dispensed_bar_comparison",
                            DisplayName = "Report Dispensing Bars",
                            Description = "Bar comparison widget for dispensed fuel volumes based on report-style analytics",
                            Category = "reporting",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "bar",
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            showValues = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            dataSource = "fuel_dispensed"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardReportingPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "CHART_PIE_DISTRIBUTION",
                            Name = "report_dispensed_circle_distribution",
                            DisplayName = "Report Dispensing Circle",
                            Description = "Circle distribution widget for dispensed fuel patterns using report-inspired analytics",
                            Category = "reporting",
                            DataSource = "fuel_dispensed",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "donut",
                            defaultMode = "daily_aggregated",
                            defaultDatePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            showLegend = true,
                            showLabels = true,
                            defaultSettings = new {
                            mode = "daily_aggregated",
                            datePreset = "last_7_days",
                            aggregation = "sum",
                            granularity = "day",
                            unit = "liters",
                            dataSource = "fuel_dispensed",
                            type = "donut"
                            }
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardReportingPermission,
                            IsEnabled = true
                            },

                            new DashboardWidgetTemplate {
                            WidgetType = "table",
                            Name = "tank_levels_table",
                            DisplayName = "Tank Levels",
                            Description = "Table showing current fuel tank levels",
                            Category = "fuel_management",
                            DataSource = "tank_levels",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            columns = new [] {
                            "tank_name",
                            "current_level",
                            "capacity",
                            "percentage",
                            "last_updated"
                            },
                            sortable = true,
                            filterable = true,
                            showAlerts = true
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardTankPermission,
                            IsEnabled = true
                            },

                            // Vehicle Performance Widgets
                            new DashboardWidgetTemplate {
                            WidgetType = "graph",
                            Name = "vehicle_efficiency_chart",
                            DisplayName = "Vehicle Fuel Efficiency",
                            Description = "Chart showing fuel efficiency by vehicle",
                            Category = "vehicle_performance",
                            DataSource = "vehicle_efficiency",
                            ConfigurationJson = JsonConvert.SerializeObject (new {
                            chartType = "bar",
                            defaultMode = "cumulative",
                            defaultDatePreset = "last_month",
                            groupBy = "vehicle",
                            unit = "km/l"
                            }),
                            RequiredRole = null,
                            RequiredPermissions = dashboardVehiclePermission,
                            IsEnabled = true
                            }
            };

            templates.AddRange(GetEventAndIssueTemplates(
                string.Join(",", Permissions.Dashboard.View, Permissions.EventExpression.Read),
                string.Join(",", Permissions.Dashboard.View, Permissions.IssueTracker.Read)));

            templates.AddRange(GetAdminTemplates(
                dashboardAdminUsersPermission,
                dashboardAdminDevicePermission,
                dashboardNotificationPermission,
                dashboardVehiclePermission));

            return templates;
        }

        private async Task EnsureDashboardReportingPermissionAsync()
        {
            int? dashboardModuleId = await _context.Permissions
                .Where(permission => permission.Name == Permissions.Modules.DashboardModule)
                .Select(permission => (int?)permission.Id)
                .FirstOrDefaultAsync();

            if (!dashboardModuleId.HasValue)
            {
                _logger.LogWarning("Dashboard module permission '{DashboardModule}' was not found. Skipping dashboard reporting permission seed.",
                    Permissions.Modules.DashboardModule);
                return;
            }

            Permission? dashboardReportingPermission = await _context.Permissions
                .FirstOrDefaultAsync(permission => permission.Name == Permissions.Dashboard.Reporting);

            if (dashboardReportingPermission == null)
            {
                dashboardReportingPermission = new Permission
                {
                    Name = Permissions.Dashboard.Reporting,
                    ParentId = dashboardModuleId.Value
                };

                _context.Permissions.Add(dashboardReportingPermission);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Seeded dashboard reporting permission '{PermissionName}' under module {ModuleId}",
                    Permissions.Dashboard.Reporting,
                    dashboardModuleId.Value);
            }

            var donorPermissionNames = new[] {
                Permissions.Dashboard.View,
                Permissions.Reporting.Read,
                Permissions.Report.VehicleConsumption,
                Permissions.Report.FuelRefill
            };

            var donorPermissionIds = await _context.Permissions
                .Where(permission => donorPermissionNames.Contains(permission.Name))
                .Select(permission => permission.Id)
                .ToListAsync();

            if (!donorPermissionIds.Any())
            {
                _logger.LogWarning("No donor permissions were found while syncing dashboard reporting permission assignments.");
                return;
            }

            var donorRoleIds = await _context.RolePermissions
                .Where(rolePermission => donorPermissionIds.Contains(rolePermission.PermissionId))
                .Select(rolePermission => rolePermission.RoleId)
                .Distinct()
                .ToListAsync();

            if (!donorRoleIds.Any())
            {
                _logger.LogInformation("No role assignments found to inherit for dashboard reporting permission.");
                return;
            }

            var existingAssignedRoleIds = await _context.RolePermissions
                .Where(rolePermission => rolePermission.PermissionId == dashboardReportingPermission.Id)
                .Select(rolePermission => rolePermission.RoleId)
                .ToListAsync();

            var missingRoleIds = donorRoleIds
                .Except(existingAssignedRoleIds, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!missingRoleIds.Any())
            {
                return;
            }

            await _context.RolePermissions.AddRangeAsync(
                missingRoleIds.Select(roleId => new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = dashboardReportingPermission.Id
                }));

            await _context.SaveChangesAsync();

            _logger.LogInformation("Assigned dashboard reporting permission to {RoleCount} roles", missingRoleIds.Count);
        }

        private static bool SyncTemplateAccess(DashboardWidgetTemplate existingTemplate, DashboardWidgetTemplate defaultTemplate)
        {
            var hasChanges = false;

            if (!string.Equals(existingTemplate.RequiredRole, defaultTemplate.RequiredRole, StringComparison.Ordinal))
            {
                existingTemplate.RequiredRole = defaultTemplate.RequiredRole;
                hasChanges = true;
            }

            if (!string.Equals(existingTemplate.RequiredPermissions, defaultTemplate.RequiredPermissions, StringComparison.Ordinal))
            {
                existingTemplate.RequiredPermissions = defaultTemplate.RequiredPermissions;
                hasChanges = true;
            }

            if (existingTemplate.IsEnabled != defaultTemplate.IsEnabled)
            {
                existingTemplate.IsEnabled = defaultTemplate.IsEnabled;
                hasChanges = true;
            }

            if (hasChanges)
            {
                existingTemplate.UpdatedAt = DateTime.UtcNow;
            }

            return hasChanges;
        }
    }
}