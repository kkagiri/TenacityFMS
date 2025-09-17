using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard.WidgetFactories;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard.WidgetFactories {
    // Chart widget factory (Line, Bar, Pie)
    public class ChartWidgetFactory : IWidgetTypeFactory {
        private readonly ILogger<ChartWidgetFactory> _logger;

        public ChartWidgetFactory (ILogger<ChartWidgetFactory> logger) {
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
                var processedFilters = ProcessChartFilters (filters, timeRange, mode);
                var processedSettings = ProcessChartSettings (settings, widgetType);

                return new WidgetDataProcessingResult {
                    Success = true,
                        ProcessedFilters = processedFilters,
                        ProcessedSettings = processedSettings,
                        AggregationType = GetAggregationType (mode, settings),
                        RequiredFields = config.RequiredDataFields,
                        DataQueryType = GetDataQueryType (dataSource, timeRange)
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing chart widget data for type {WidgetType}", widgetType);
                return new WidgetDataProcessingResult {
                    Success = false,
                        ErrorMessage = ex.Message
                };
            }
        }

        public bool SupportsWidgetType (string widgetType) {
            return widgetType
            switch {
                "CHART_LINE_TREND" => true,
                "CHART_BAR_COMPARISON" => true,
                "CHART_PIE_DISTRIBUTION" => true,
                _ => false
            };
        }

        public WidgetTypeConfiguration GetWidgetTypeConfig (string widgetType) {
            return widgetType
            switch {
                "CHART_LINE_TREND" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "chartData",
                    RequiredDataFields = new List<string> { "date", "value" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "min", "max" },
                    DefaultSettings = new Dictionary<string, object> { { "showPoints", true },
                    { "showGrid", true },
                    { "enableZoom", true },
                    { "dateFormat", "MMM dd" }
                    },
                    RequiresTrendData = true,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 30
                    },
                    "CHART_BAR_COMPARISON" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "chartData",
                    RequiredDataFields = new List<string> { "category", "value" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count" },
                    DefaultSettings = new Dictionary<string, object> { { "orientation", "vertical" },
                    { "showLabels", true },
                    { "colorScheme", "default" }
                    },
                    RequiresTrendData = false,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 60
                    },
                    "CHART_PIE_DISTRIBUTION" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "chartData",
                    RequiredDataFields = new List<string> { "category", "value" },
                    SupportedAggregations = new List<string> { "sum", "percentage" },
                    DefaultSettings = new Dictionary<string, object> { { "showPercentages", true },
                    { "showLegend", true },
                    { "innerRadius", 0 }
                    },
                    RequiresTrendData = false,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 60
                    },
                    _ =>
                    throw new ArgumentException ($"Unsupported widget type: {widgetType}")
            };
        }

        private Dictionary<string, object> ProcessChartFilters (
            Dictionary<string, object> filters,
            string timeRange,
            string mode) {

            var processed = new Dictionary<string, object> (filters);

            // Add time-based filters
            processed["timeRange"] = timeRange;
            processed["mode"] = mode;
            processed["aggregationPeriod"] = GetAggregationPeriod (timeRange);

            // Process site filters
            if (filters.ContainsKey ("siteIds") && filters["siteIds"] is List<object> sites) {
                processed["siteFilter"] = sites.Count > 0 ? sites : null;
            }

            // Process vehicle type filters
            if (filters.ContainsKey ("vehicleTypeIds") && filters["vehicleTypeIds"] is List<object> vehicleTypes) {
                processed["vehicleTypeFilter"] = vehicleTypes.Count > 0 ? vehicleTypes : null;
            }

            return processed;
        }

        private Dictionary<string, object> ProcessChartSettings (
            Dictionary<string, object> settings,
            string widgetType) {

            var config = GetWidgetTypeConfig (widgetType);
            var processed = new Dictionary<string, object> (config.DefaultSettings);

            // Override with user settings
            foreach (var setting in settings) {
                processed[setting.Key] = setting.Value;
            }

            return processed;
        }

        private string GetAggregationType (string mode, Dictionary<string, object> settings) {
            // Check if custom aggregation is specified in settings
            if (settings.ContainsKey ("aggregation")) {
                return settings["aggregation"].ToString () ?? "sum";
            }

            // Default based on mode
            return mode
            switch {
                "cumulative" => "sum",
                "average" => "avg",
                "count" => "count",
                _ => "sum"
            };
        }

        private string GetDataQueryType (string dataSource, string timeRange) {
            if (dataSource == "realtime") return "realtime";
            if (timeRange == "live" || timeRange == "today") return "realtime";
            return "historical";
        }

        private string GetAggregationPeriod (string timeRange) {
            return timeRange
            switch {
                "today" => "hour",
                "yesterday" => "hour",
                "last_7_days" => "day",
                "last_30_days" => "day",
                "last_3_months" => "week",
                "last_6_months" => "month",
                "last_year" => "month",
                _ => "day"
            };
        }
    }
}