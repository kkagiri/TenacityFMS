namespace FMS.Domain.Entities.Dashboard {
    /// <summary>
    /// Enhanced widget type definitions for flexible dashboard components
    /// </summary>
    public static class WidgetTypeDefinitions {
        // Key Statistics - Simple tickers only (existing functionality)
        public const string KEY_STAT_TICKER = "key_stat_ticker";

        // Enhanced Analytics Widgets - Full flexibility
        public const string BIG_STAT_CARD = "big_stat_card"; // Like fuel efficiency with sub-metrics
        public const string PROGRESS_LIST = "progress_list"; // Engine hours by vehicle type
        public const string DATA_TABLE = "data_table"; // Fuel issue by vehicle type
        public const string LINE_CHART = "line_chart"; // Time series data
        public const string BAR_CHART = "bar_chart"; // Comparative data
        public const string PIE_CHART = "pie_chart"; // Distribution data
        public const string GAUGE_CHART = "gauge_chart"; // Single metric with range
        public const string METRIC_GRID = "metric_grid"; // Multiple related metrics
        public const string STAT_CARD_WITH_TREND = "stat_card_with_trend"; // Number with trend indicator

        // Legacy support (backward compatibility)
        public const string TICKER = "ticker"; // Maps to KEY_STAT_TICKER
        public const string GRAPH = "graph"; // Maps to LINE_CHART
        public const string CHART = "chart"; // Maps to BAR_CHART
        public const string TABLE = "table"; // Maps to DATA_TABLE
        public const string GAUGE = "gauge"; // Maps to GAUGE_CHART

        /// <summary>
        /// Widget categories for better organization
        /// </summary>
        public static class Categories {
            public const string KEY_STATISTICS = "key_statistics"; // Only tickers
            public const string FUEL_MANAGEMENT = "fuel_management"; // Fuel-related widgets
            public const string VEHICLE_PERFORMANCE = "vehicle_performance"; // Vehicle metrics
            public const string OPERATIONAL_METRICS = "operational_metrics"; // Operations data
            public const string FINANCIAL_ANALYSIS = "financial_analysis"; // Cost and revenue
            public const string ALERTS_MONITORING = "alerts_monitoring"; // Status and alerts
            public const string CUSTOM_ANALYTICS = "custom_analytics"; // User-defined widgets
        }

        /// <summary>
        /// Data sources available for widgets
        /// </summary>
        public static class DataSources {
            // Existing sources (from your current system)
            public const string FUEL_DISPENSE = "fuel_dispense";
            public const string FUEL_USED_GPS = "fuel_used_gps";
            public const string ENGINE_HOURS = "engine_hours";
            public const string KM_TRAVEL = "km_travel";

            // GPS-based data sources from VehicleConsumption entity
            public const string DISTANCE_TRAVEL = "distance_travel";
            public const string FUEL_EFFICIENCY = "fuel_efficiency";
            public const string FUEL_LOST_GPS = "fuel_lost_gps";
            public const string ENGINE_HOURS_GPS = "engine_hours_gps";
            public const string FLOWMETER_FUEL_USED = "flowmeter_fuel_used";
            public const string FLOWMETER_FUEL_LOST = "flowmeter_fuel_lost";
            public const string FLOWMETER_EFFICIENCY = "flowmeter_efficiency";
            public const string MAX_SPEED = "max_speed";
            public const string AVG_SPEED = "avg_speed";
            public const string EXPECTED_CONSUMPTION = "expected_consumption";

            // Enhanced sources for new widget types
            public const string VEHICLE_BREAKDOWN = "vehicle_breakdown";
            public const string SITE_COMPARISON = "site_comparison";
            public const string COST_ANALYSIS = "cost_analysis";
            public const string PERFORMANCE_TRENDS = "performance_trends";
            public const string ALERT_SUMMARY = "alert_summary";
            public const string USAGE_PATTERNS = "usage_patterns";
        }

        /// <summary>
        /// Widget display modes
        /// </summary>
        public static class DisplayModes {
            public const string LIVE = "live"; // Real-time data
            public const string CUMULATIVE = "cumulative"; // Historical aggregated
            public const string COMPARATIVE = "comparative"; // Period comparison
            public const string TRENDING = "trending"; // Trend analysis
        }

        /// <summary>
        /// Time range presets
        /// </summary>
        public static class TimeRanges {
            public const string TODAY = "today";
            public const string YESTERDAY = "yesterday";
            public const string THIS_WEEK = "this_week";
            public const string LAST_WEEK = "last_week";
            public const string THIS_MONTH = "this_month";
            public const string LAST_MONTH = "last_month";
            public const string THIS_YEAR = "this_year";
            public const string LAST_YEAR = "last_year";
            public const string CUSTOM = "custom";
        }

        /// <summary>
        /// Get the display name for a widget type
        /// </summary>
        public static string GetDisplayName (string widgetType) {
            return widgetType
            switch {
                KEY_STAT_TICKER => "Key Statistic Ticker",
                    BIG_STAT_CARD => "Big Statistics Card",
                    PROGRESS_LIST => "Progress List",
                    DATA_TABLE => "Data Table",
                    LINE_CHART => "Line Chart",
                    BAR_CHART => "Bar Chart",
                    PIE_CHART => "Pie Chart",
                    GAUGE_CHART => "Gauge Chart",
                    METRIC_GRID => "Metrics Grid",
                    STAT_CARD_WITH_TREND => "Statistic with Trend",

                    // Legacy mappings
                    TICKER => "Ticker (Legacy)",
                    GRAPH => "Graph (Legacy)",
                    CHART => "Chart (Legacy)",
                    TABLE => "Table (Legacy)",
                    GAUGE => "Gauge (Legacy)",

                    _ => widgetType
            };
        }

        /// <summary>
        /// Check if widget type is supported in key statistics category
        /// </summary>
        public static bool IsKeyStatisticType (string widgetType) {
            return widgetType == KEY_STAT_TICKER || widgetType == TICKER;
        }

        /// <summary>
        /// Map legacy widget types to new types
        /// </summary>
        public static string MapLegacyType (string legacyType) {
            return legacyType
            switch {
                TICKER => KEY_STAT_TICKER,
                    GRAPH => LINE_CHART,
                    CHART => BAR_CHART,
                    TABLE => DATA_TABLE,
                    GAUGE => GAUGE_CHART,
                    _ => legacyType
            };
        }

        /// <summary>
        /// Get default configuration for widget type
        /// </summary>
        public static object GetDefaultConfiguration (string widgetType) {
            return widgetType
            switch {
                KEY_STAT_TICKER => new {
                        refreshInterval = 30000, // 30 seconds
                        showTrend = true,
                        showChange = true,
                        format = "number"
                        },
                        BIG_STAT_CARD => new {
                        showMainValue = true,
                        showBadge = true,
                        showSubItems = true,
                        maxSubItems = 5,
                        sortSubItems = "desc"
                        },
                        PROGRESS_LIST => new {
                        showPercentage = true,
                        maxItems = 10,
                        sortBy = "value",
                        sortOrder = "desc"
                        },
                        DATA_TABLE => new {
                        pageSize = 10,
                        sortable = true,
                        searchable = false,
                        showPagination = true
                        },
                        LINE_CHART => new {
                        showPoints = true,
                        showGrid = true,
                        tension = 0.3,
                        fill = false
                        },
                        BAR_CHART => new {
                        showValues = true,
                        orientation = "vertical",
                        showLegend = true
                        },
                        PIE_CHART => new {
                        showLabels = true,
                        showPercentage = true,
                        showLegend = true
                        },
                        GAUGE_CHART => new {
                        min = 0,
                        max = 100,
                        showValue = true,
                        showMinMax = true,
                        thresholds = new [] {
                        new { value = 70, color = "#28a745" },
                        new { value = 85, color = "#ffc107" },
                        new { value = 100, color = "#dc3545" }
                        }
                        },
                        _ => new { }
            };
        }
    }
}