using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Dashboard {
    /// <summary>
    /// Centralized normalization for dashboard identifiers to reduce stringly-typed usage.
    /// Maps legacy/synonym strings to canonical values defined in WidgetTypeDefinitions.
    /// </summary>
    public static class IdentifierNormalizer {
        private static readonly Dictionary<string, string> DataSourceAliases = new Dictionary<string, string> (StringComparer.OrdinalIgnoreCase) {
            // Fuel dispensed variants
            ["fuel_dispense"] = WidgetTypeDefinitions.DataSources.FUEL_DISPENSE, ["fuel_dispensed"] = WidgetTypeDefinitions.DataSources.FUEL_DISPENSE, ["fuel_dispensed_total"] = WidgetTypeDefinitions.DataSources.FUEL_DISPENSE,

            // Fuel used (GPS)
            ["fuel_used_gps"] = WidgetTypeDefinitions.DataSources.FUEL_USED_GPS,

            // Engine hours
            ["engine_hours"] = WidgetTypeDefinitions.DataSources.ENGINE_HOURS, ["engine_hours_gps"] = WidgetTypeDefinitions.DataSources.ENGINE_HOURS_GPS,

            // Distance / KM travelled
            ["km_travel"] = WidgetTypeDefinitions.DataSources.KM_TRAVEL, ["distance_travel"] = WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL, ["distance_travel_gps"] = WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL,
        };

        /// <summary>
        /// Normalize a data source/metric type to a canonical constant from WidgetTypeDefinitions.DataSources.
        /// Returns the original trimmed lower-case string if no mapping is found.
        /// </summary>
        public static string NormalizeDataSource (string input) {
            var key = (input ?? string.Empty).Trim ();
            if (string.IsNullOrEmpty (key)) {
                return string.Empty;
            }

            if (DataSourceAliases.TryGetValue (key, out string mapped)) {
                return mapped;
            }

            return key.ToLowerInvariant ();
        }

        /// <summary>
        /// Normalize a widget type to a canonical constant from WidgetTypeDefinitions.
        /// Applies legacy mapping then returns lower-case.
        /// </summary>
        public static string NormalizeWidgetType (string input) {
            var mapped = WidgetTypeDefinitions.MapLegacyType (input ?? string.Empty) ?? string.Empty;
            return mapped.Trim ().ToLowerInvariant ();
        }

        /// <summary>
        /// Map some common ad-hoc chart identifiers used historically to canonical widget types.
        /// </summary>
        public static string NormalizeChartAlias (string input) {
            var key = (input ?? string.Empty).Trim ().ToUpperInvariant ();
            if (string.IsNullOrEmpty (key)) {
                return string.Empty;
            }

            return key
            switch {
                // Historical keys used around v1 widgets
                "CHART_LINE_TREND" => WidgetTypeDefinitions.LINE_CHART,
                    "CHART_BAR_COMPARISON" => WidgetTypeDefinitions.BAR_CHART,
                    "CHART_PIE_DISTRIBUTION" => WidgetTypeDefinitions.PIE_CHART,
                    "CHART_GAUGE" => WidgetTypeDefinitions.GAUGE_CHART,
                    "DATA_TABLE_DETAILED" => WidgetTypeDefinitions.DATA_TABLE,
                    "BIG_STAT_CARD" => WidgetTypeDefinitions.BIG_STAT_CARD,
                    "PROGRESS_LIST" => WidgetTypeDefinitions.PROGRESS_LIST,
                    "STAT_CARD_WITH_TREND" => WidgetTypeDefinitions.STAT_CARD_WITH_TREND,
                    "TICKER" => WidgetTypeDefinitions.KEY_STAT_TICKER,
                    _ => input ?? string.Empty
            };
        }
    }
}