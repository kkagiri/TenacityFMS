using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard.WidgetFactories;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard.WidgetFactories {
    // Stat card widget factory (Big Stat Card, Ticker)
    public class StatCardWidgetFactory : IWidgetTypeFactory {
        private readonly ILogger<StatCardWidgetFactory> _logger;

        public StatCardWidgetFactory (ILogger<StatCardWidgetFactory> logger) {
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
                var processedFilters = ProcessStatFilters (filters, timeRange, mode);
                var processedSettings = ProcessStatSettings (settings, widgetType);

                return new WidgetDataProcessingResult {
                    Success = true,
                        ProcessedFilters = processedFilters,
                        ProcessedSettings = processedSettings,
                        AggregationType = GetAggregationType (mode, settings),
                        RequiredFields = config.RequiredDataFields,
                        DataQueryType = GetDataQueryType (dataSource, timeRange)
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing stat card widget data for type {WidgetType}", widgetType);
                return new WidgetDataProcessingResult {
                    Success = false,
                        ErrorMessage = ex.Message
                };
            }
        }

        public bool SupportsWidgetType (string widgetType) {
            return widgetType
            switch {
                "BIG_STAT_CARD" => true,
                "ticker" => true,
                _ => false
            };
        }

        public WidgetTypeConfiguration GetWidgetTypeConfig (string widgetType) {
            return widgetType
            switch {
                "BIG_STAT_CARD" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "statCard",
                    RequiredDataFields = new List<string> { "value", "unit" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "min", "max", "latest" },
                    DefaultSettings = new Dictionary<string, object> { { "showTrend", true },
                    { "showSubMetrics", true },
                    { "trendPeriod", "previous" },
                    { "numberFormat", "auto" },
                    { "showUnit", true }
                    },
                    RequiresTrendData = true,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 30
                    },
                    "ticker" => new WidgetTypeConfiguration {
                    WidgetType = widgetType,
                    ExpectedDataFormat = "statCard",
                    RequiredDataFields = new List<string> { "value" },
                    SupportedAggregations = new List<string> { "sum", "avg", "count", "latest" },
                    DefaultSettings = new Dictionary<string, object> { { "showTrend", true },
                    { "trendPeriod", "previous" },
                    { "numberFormat", "compact" },
                    { "animateChanges", true }
                    },
                    RequiresTrendData = true,
                    SupportsRealTimeData = true,
                    DefaultRefreshInterval = 15
                    },
                    _ =>
                    throw new ArgumentException ($"Unsupported widget type: {widgetType}")
            };
        }

        private Dictionary<string, object> ProcessStatFilters (
            Dictionary<string, object> filters,
            string timeRange,
            string mode) {

            var processed = new Dictionary<string, object> (filters);

            // Add time-based filters
            processed["timeRange"] = timeRange;
            processed["mode"] = mode;
            processed["trendComparisonPeriod"] = GetTrendComparisonPeriod (timeRange);

            // Process metric-specific filters
            if (filters.ContainsKey ("metricType")) {
                processed["metricFilter"] = filters["metricType"];
            }

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

        private Dictionary<string, object> ProcessStatSettings (
            Dictionary<string, object> settings,
            string widgetType) {

            var config = GetWidgetTypeConfig (widgetType);
            var processed = new Dictionary<string, object> (config.DefaultSettings);

            // Override with user settings
            foreach (var setting in settings) {
                processed[setting.Key] = setting.Value;
            }

            // Widget-specific processing
            if (widgetType == "BIG_STAT_CARD") {
                ProcessBigStatCardSettings (processed, settings);
            } else if (widgetType == "ticker") {
                ProcessTickerSettings (processed, settings);
            }

            return processed;
        }

        private void ProcessBigStatCardSettings (
            Dictionary<string, object> processed,
            Dictionary<string, object> settings) {

            // Configure sub-metrics display
            if (settings.ContainsKey ("subMetrics") && settings["subMetrics"] is List<object> subMetrics) {
                processed["enabledSubMetrics"] = subMetrics;
            }

            // Configure trend display
            if (settings.ContainsKey ("trendPeriod")) {
                processed["trendComparisonPeriod"] = settings["trendPeriod"];
            }

            // Configure formatting
            if (settings.ContainsKey ("decimalPlaces")) {
                processed["valueDecimalPlaces"] = settings["decimalPlaces"];
            }
        }

        private void ProcessTickerSettings (
            Dictionary<string, object> processed,
            Dictionary<string, object> settings) {

            // Configure animation
            if (settings.ContainsKey ("animationDuration")) {
                processed["tickerAnimationDuration"] = settings["animationDuration"];
            }

            // Configure display format
            if (settings.ContainsKey ("compactThreshold")) {
                processed["numberCompactThreshold"] = settings["compactThreshold"];
            }
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
                "latest" => "latest",
                _ => "sum"
            };
        }

        private string GetDataQueryType (string dataSource, string timeRange) {
            if (dataSource == "realtime") return "realtime";
            if (timeRange == "live" || timeRange == "today") return "realtime";
            return "historical";
        }

        private string GetTrendComparisonPeriod (string timeRange) {
            return timeRange
            switch {
                "today" => "yesterday",
                "yesterday" => "day_before_yesterday",
                "last_7_days" => "previous_7_days",
                "last_30_days" => "previous_30_days",
                "last_3_months" => "previous_3_months",
                "last_6_months" => "previous_6_months",
                "last_year" => "previous_year",
                _ => "previous_period"
            };
        }
    }
}