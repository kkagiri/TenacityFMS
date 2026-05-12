/**
 * File: WidgetTemplateSeeder.PumpTransactionTemplates.cs
 * Purpose: Defines curated dashboard widget templates for live PTS fueling visibility and recent pump transactions.
 * Dependencies: DashboardWidgetTemplate, Newtonsoft.Json
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - GetPumpTransactionTemplates(): Returns seeded templates for pump transaction dashboard widgets.
 */
using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    public partial class WidgetTemplateSeeder
    {
        private static IEnumerable<DashboardWidgetTemplate> GetPumpTransactionTemplates(string dashboardFuelPermission)
        {
            return new List<DashboardWidgetTemplate>
            {
                new DashboardWidgetTemplate
                {
                    WidgetType = "BIG_STAT_CARD",
                    Name = "pts_fueling_now_card",
                    DisplayName = "PTS Fueling Now",
                    Description = "Shows how many PTS devices are actively fueling right now.",
                    Category = "fuel_operation",
                    DataSource = "pts_active_fueling_summary",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "minute",
                        unit = "pts",
                        showTrend = false,
                        showComparison = false,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "minute",
                            unit = "pts",
                            dataSource = "pts_active_fueling_summary",
                            includeTotal = true,
                            topK = 10
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardFuelPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "DATA_TABLE_DETAILED",
                    Name = "pts_current_fueling_table",
                    DisplayName = "Which PTS Is Fueling",
                    Description = "Lists all currently fueling PTS devices and their active pumps.",
                    Category = "fuel_operation",
                    DataSource = "pts_active_fueling_current",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "live",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "minute",
                        unit = "pts",
                        pageSize = 10,
                        showSearch = false,
                        showPagination = true,
                        defaultSettings = new
                        {
                            mode = "live",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "minute",
                            unit = "pts",
                            dataSource = "pts_active_fueling_current",
                            includeTotal = true,
                            topK = 25
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardFuelPermission,
                    IsEnabled = true
                },
                new DashboardWidgetTemplate
                {
                    WidgetType = "DATA_TABLE_DETAILED",
                    Name = "pump_transactions_recent_table",
                    DisplayName = "Recent Pump Transactions",
                    Description = "Shows the 10 most recent non-transfer pump transactions ordered by recorded time.",
                    Category = "fuel_operation",
                    DataSource = "pump_transactions_recent",
                    ConfigurationJson = JsonConvert.SerializeObject(new
                    {
                        defaultMode = "historical_snapshot",
                        defaultDatePreset = "today",
                        aggregation = "count",
                        granularity = "hour",
                        unit = "transactions",
                        pageSize = 10,
                        showSearch = false,
                        showPagination = false,
                        defaultSettings = new
                        {
                            mode = "historical_snapshot",
                            datePreset = "today",
                            aggregation = "count",
                            granularity = "hour",
                            unit = "transactions",
                            dataSource = "pump_transactions_recent",
                            includeTotal = false,
                            topK = 10
                        }
                    }),
                    RequiredRole = null,
                    RequiredPermissions = dashboardFuelPermission,
                    IsEnabled = true
                }
            };
        }
    }
}