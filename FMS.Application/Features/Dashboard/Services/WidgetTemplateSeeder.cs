using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    public interface IWidgetTemplateSeeder {
        Task SeedWidgetTemplatesAsync ();
    }

    public class WidgetTemplateSeeder : IWidgetTemplateSeeder {
        private readonly GpsdataContext _context;
        private readonly ILogger<WidgetTemplateSeeder> _logger;

        public WidgetTemplateSeeder (
            GpsdataContext context,
            ILogger<WidgetTemplateSeeder> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task SeedWidgetTemplatesAsync () {
            try {
                // Check if templates already exist
                if (await _context.DashboardWidgetTemplates.AnyAsync ()) {
                    _logger.LogInformation ("Widget templates already exist, skipping seeding");
                    return;
                }

                var templates = GetDefaultTemplates ();
                await _context.DashboardWidgetTemplates.AddRangeAsync (templates);
                await _context.SaveChangesAsync ();

                _logger.LogInformation ("Successfully seeded {Count} widget templates", templates.Count);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error seeding widget templates");
                throw;
            }
        }

        private List<DashboardWidgetTemplate> GetDefaultTemplates () {
            return new List<DashboardWidgetTemplate> {
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view",
                            IsEnabled = true
                            },

                            // Fuel Management Widgets
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
                            RequiredRole = "Manager,Admin",
                            RequiredPermissions = "tank.view",
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
                            RequiredRole = "Manager,Admin",
                            RequiredPermissions = "vehicle.view,dashboard.view",
                            IsEnabled = true
                            }
            };
        }
    }
}