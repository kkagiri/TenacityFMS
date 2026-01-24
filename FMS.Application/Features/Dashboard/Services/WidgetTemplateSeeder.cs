using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

    public class WidgetTemplateSeeder : IWidgetTemplateSeeder
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
                var existingTemplateNames = await _context.DashboardWidgetTemplates
                    .Select(t => t.Name)
                    .ToListAsync();
                var existingSet = new HashSet<string>(existingTemplateNames, StringComparer.OrdinalIgnoreCase);

                var allTemplates = GetDefaultTemplates();
                var newTemplates = allTemplates.Where(t => !existingSet.Contains(t.Name)).ToList();

                if (!newTemplates.Any())
                {
                    _logger.LogInformation("All widget templates already exist, nothing to seed");
                    return;
                }

                await _context.DashboardWidgetTemplates.AddRangeAsync(newTemplates);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully seeded {Count} new widget templates (skipped {SkippedCount} existing)",
                    newTemplates.Count, allTemplates.Count - newTemplates.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding widget templates");
                throw;
            }
        }

        private List<DashboardWidgetTemplate> GetDefaultTemplates()
        {
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view,fuel.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view,fuel.view",
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
                            RequiredRole = "User,Manager,Admin",
                            RequiredPermissions = "dashboard.view,fuel.view",
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