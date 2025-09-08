using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Application.Services.Dashboard.WidgetFactories;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard.WidgetFactories {
    // Table and list widget factory (Data Table, Progress List, Alert Widget)
    public class TableWidgetFactory : IWidgetTypeFactory {
        private readonly ILogger<TableWidgetFactory> _logger;

        public TableWidgetFactory (ILogger<TableWidgetFactory> logger) {
            _logger = logger;
        }

        public async Task<WidgetDataProcessingResult> ProcessWidgetDataAsync (
            string widgetType,
            string category,
            string dataSource,
            Dictionary<string, object> filters,
            Dictionary<string, object> settings,
            string timeRange,
            string mode) {

            try {
                var config = GetWidgetTypeConfig (widgetType);
                var processedFilters = ProcessTableFilters (filters, timeRange, mode, widgetType);
                var processedSettings = ProcessTableSettings (settings, widgetType);

                return new WidgetDataProcessingResult {
                    Success = true,
                        ProcessedFilters = processedFilters,
                        ProcessedSettings = processedSettings,
                        AggregationType = GetAggregationType (mode, settings, widgetType),
                        RequiredFields = config.RequiredDataFields,
                        DataQueryType = GetDataQueryType (dataSource, timeRange, widgetType)
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing table widget data for type {WidgetType}", widgetType);
                return new WidgetDataProcessingResult {
                    Success = false,
                        ErrorMessage = ex.Message
                };
            }
        }

        public bool SupportsWidgetType (string widgetType) {
            return widgetType
            switch {
                "DATA_TABLE_DETAILED" => true,
                "PROGRESS_LIST" => true,
                "ALERT_NOTIFICATION" => true,
                _ => false
            };
        }

        public WidgetTypeConfiguration GetWidgetTypeConfig (string widgetType) {
            return widgetType
            switch {
                "DATA_TABLE_DETAILED" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "tableData",
                    RequiredDataFields = new List<string> { "rows", "columns" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "min", "max", "group" },
                    DefaultSettings = new Dictionary<string, object> { { "pageSize", 10 },
                    { "showPaging", true },
                    { "showFiltering", true },
                    { "showSorting", true },
                    { "showExport", true },
                    { "autoFitColumns", true }
                    },
                    RequiresTrendData = false,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 60
                    },
                    "PROGRESS_LIST" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "progressList",
                    RequiredDataFields = new List<string> { "items", "label", "value", "target" },
                    SupportedAggregations = new List<string> { "percentage", "sum", "avg" },
                    DefaultSettings = new Dictionary<string, object> { { "showPercentages", true },
                    { "showTargets", true },
                    { "colorByPerformance", true },
                    { "sortBy", "value" },
                    { "maxItems", 10 }
                    },
                    RequiresTrendData = false,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 60
                    },
                    "ALERT_NOTIFICATION" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "alertList",
                    RequiredDataFields = new List<string> { "alerts", "severity", "message", "timestamp" },
                    SupportedAggregations = new List<string> { "count", "group" },
                    DefaultSettings = new Dictionary<string, object> { { "maxAlerts", 20 },
                    { "showSeverityColors", true },
                    { "groupBySeverity", false },
                    { "autoRefresh", true },
                    { "soundNotifications", false }
                    },
                    RequiresTrendData = false,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 15
                    },
                    _ =>
                    throw new ArgumentException ($"Unsupported widget type: {widgetType}")
            };
        }

        private Dictionary<string, object> ProcessTableFilters (
            Dictionary<string, object> filters,
            string timeRange,
            string mode,
            string widgetType) {

            var processed = new Dictionary<string, object> (filters);

            // Add time-based filters
            processed["timeRange"] = timeRange;
            processed["mode"] = mode;

            // Widget-specific filter processing
            switch (widgetType) {
                case "DATA_TABLE_DETAILED":
                    ProcessDataTableFilters (processed, filters);
                    break;
                case "PROGRESS_LIST":
                    ProcessProgressListFilters (processed, filters);
                    break;
                case "ALERT_NOTIFICATION":
                    ProcessAlertFilters (processed, filters);
                    break;
            }

            // Common filters
            if (filters.ContainsKey ("siteIds") && filters["siteIds"] is List<object> sites) {
                processed["siteFilter"] = sites.Count > 0 ? sites : null;
            }

            return processed;
        }

        private void ProcessDataTableFilters (Dictionary<string, object> processed, Dictionary<string, object> filters) {
            // Column filters
            if (filters.ContainsKey ("columnFilters")) {
                processed["tableColumnFilters"] = filters["columnFilters"];
            }

            // Search filters
            if (filters.ContainsKey ("searchText")) {
                processed["globalSearch"] = filters["searchText"];
            }

            // Sorting
            if (filters.ContainsKey ("sortBy")) {
                processed["tableSortBy"] = filters["sortBy"];
            }
        }

        private void ProcessProgressListFilters (Dictionary<string, object> processed, Dictionary<string, object> filters) {
            // Performance threshold filters
            if (filters.ContainsKey ("performanceThreshold")) {
                processed["minPerformance"] = filters["performanceThreshold"];
            }

            // Category filters for progress items
            if (filters.ContainsKey ("progressCategories")) {
                processed["categoryFilter"] = filters["progressCategories"];
            }
        }

        private void ProcessAlertFilters (Dictionary<string, object> processed, Dictionary<string, object> filters) {
            // Severity level filters
            if (filters.ContainsKey ("severityLevels")) {
                processed["severityFilter"] = filters["severityLevels"];
            }

            // Alert status filters
            if (filters.ContainsKey ("alertStatus")) {
                processed["statusFilter"] = filters["alertStatus"];
            }

            // Source system filters
            if (filters.ContainsKey ("alertSources")) {
                processed["sourceFilter"] = filters["alertSources"];
            }
        }

        private Dictionary<string, object> ProcessTableSettings (
            Dictionary<string, object> settings,
            string widgetType) {

            var config = GetWidgetTypeConfig (widgetType);
            var processed = new Dictionary<string, object> (config.DefaultSettings);

            // Override with user settings
            foreach (var setting in settings) {
                processed[setting.Key] = setting.Value;
            }

            // Widget-specific settings processing
            switch (widgetType) {
                case "DATA_TABLE_DETAILED":
                    ProcessDataTableSettings (processed, settings);
                    break;
                case "PROGRESS_LIST":
                    ProcessProgressListSettings (processed, settings);
                    break;
                case "ALERT_NOTIFICATION":
                    ProcessAlertSettings (processed, settings);
                    break;
            }

            return processed;
        }

        private void ProcessDataTableSettings (Dictionary<string, object> processed, Dictionary<string, object> settings) {
            // Column configuration
            if (settings.ContainsKey ("visibleColumns")) {
                processed["tableVisibleColumns"] = settings["visibleColumns"];
            }

            // Export settings
            if (settings.ContainsKey ("exportFormats")) {
                processed["enabledExportFormats"] = settings["exportFormats"];
            }
        }

        private void ProcessProgressListSettings (Dictionary<string, object> processed, Dictionary<string, object> settings) {
            // Color scheme for progress bars
            if (settings.ContainsKey ("colorScheme")) {
                processed["progressColorScheme"] = settings["colorScheme"];
            }

            // Performance thresholds
            if (settings.ContainsKey ("performanceThresholds")) {
                processed["progressThresholds"] = settings["performanceThresholds"];
            }
        }

        private void ProcessAlertSettings (Dictionary<string, object> processed, Dictionary<string, object> settings) {
            // Notification settings
            if (settings.ContainsKey ("notificationSettings")) {
                processed["alertNotificationConfig"] = settings["notificationSettings"];
            }

            // Display settings
            if (settings.ContainsKey ("displaySettings")) {
                processed["alertDisplayConfig"] = settings["displaySettings"];
            }
        }

        private string GetAggregationType (string mode, Dictionary<string, object> settings, string widgetType) {
            // Check if custom aggregation is specified in settings
            if (settings.ContainsKey ("aggregation")) {
                return settings["aggregation"].ToString () ?? "none";
            }

            // Default based on widget type and mode
            return widgetType
            switch {
                "DATA_TABLE_DETAILED" => mode == "group" ? "group" : "none",
                    "PROGRESS_LIST" => "percentage",
                    "ALERT_NOTIFICATION" => "count",
                    _ => "none"
            };
        }

        private string GetDataQueryType (string dataSource, string timeRange, string widgetType) {
            if (widgetType == "ALERT_NOTIFICATION") return "realtime";
            if (dataSource == "realtime") return "realtime";
            if (timeRange == "live" || timeRange == "today") return "realtime";
            return "historical";
        }
    }
}