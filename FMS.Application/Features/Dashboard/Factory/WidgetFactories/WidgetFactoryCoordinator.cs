/**
 * File: WidgetFactoryCoordinator.cs
 * Purpose: Coordinates widget-type factories for validation and runtime processing.
 * Dependencies: IWidgetTypeFactory, ChartWidgetFactory, StatCardWidgetFactory, TableWidgetFactory
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - ValidateWidgetConfiguration(): Validates widget configuration inputs before persistence/runtime execution.
 * - ProcessWidgetDataAsync(): Delegates widget processing to the correct widget factory.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard.WidgetFactories
{
    // Main widget factory coordinator
    public class WidgetFactoryCoordinator : IWidgetTypeFactory
    {
        private readonly List<IWidgetTypeFactory> _factories;
        private readonly ILogger<WidgetFactoryCoordinator> _logger;

        public WidgetFactoryCoordinator(
            ChartWidgetFactory chartFactory,
            StatCardWidgetFactory statCardFactory,
            TableWidgetFactory tableFactory,
            ILogger<WidgetFactoryCoordinator> logger)
        {

            _factories = new List<IWidgetTypeFactory> {
                chartFactory,
                statCardFactory,
                tableFactory
            };
            _logger = logger;
        }

        public async Task<WidgetDataProcessingResult> ProcessWidgetDataAsync(
            string widgetType,
            string category,
            string dataSource,
            Dictionary<string, object> filters,
            Dictionary<string, object> settings,
            string timeRange,
            string mode)
        {

            var factory = GetFactoryForWidgetType(widgetType);
            if (factory == null)
            {
                _logger.LogWarning("No factory found for widget type {WidgetType}", widgetType);
                return new WidgetDataProcessingResult
                {
                    Success = false,
                    ErrorMessage = $"Unsupported widget type: {widgetType}"
                };
            }

            return await factory.ProcessWidgetDataAsync(widgetType, category, dataSource, filters, settings, timeRange, mode);
        }

        public bool SupportsWidgetType(string widgetType)
        {
            return _factories.Any(f => f.SupportsWidgetType(widgetType));
        }

        public WidgetTypeConfiguration GetWidgetTypeConfig(string widgetType)
        {
            var factory = GetFactoryForWidgetType(widgetType);
            if (factory == null)
            {
                throw new ArgumentException($"Unsupported widget type: {widgetType}");
            }

            return factory.GetWidgetTypeConfig(widgetType);
        }

        private IWidgetTypeFactory? GetFactoryForWidgetType(string widgetType)
        {
            return _factories.FirstOrDefault(f => f.SupportsWidgetType(widgetType));
        }

        // Helper method to get all supported widget types
        public Dictionary<string, WidgetTypeConfiguration> GetAllSupportedWidgetTypes()
        {
            var supportedTypes = new Dictionary<string, WidgetTypeConfiguration>();

            var widgetTypes = new[] {
                // Chart widgets
                "CHART_LINE_TREND",
                "CHART_BAR_COMPARISON",
                "CHART_PIE_DISTRIBUTION",

                // Stat card widgets
                "BIG_STAT_CARD",
                "ticker",

                // Table widgets
                "DATA_TABLE_DETAILED",
                "PROGRESS_LIST",
                "ALERT_NOTIFICATION"
            };

            foreach (var widgetType in widgetTypes)
            {
                try
                {
                    var factory = GetFactoryForWidgetType(widgetType);
                    if (factory != null)
                    {
                        supportedTypes[widgetType] = factory.GetWidgetTypeConfig(widgetType);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error getting configuration for widget type {WidgetType}", widgetType);
                }
            }

            return supportedTypes;
        }

        // Helper method to validate widget configuration
        public WidgetValidationResult ValidateWidgetConfiguration(
            string widgetType,
            string category,
            string dataSource,
            Dictionary<string, object> filters,
            Dictionary<string, object> settings)
        {

            var factory = GetFactoryForWidgetType(widgetType);
            if (factory == null)
            {
                return new WidgetValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Unsupported widget type: {widgetType}"
                };
            }

            try
            {
                var config = factory.GetWidgetTypeConfig(widgetType);
                var validationErrors = new List<string>();

                // RequiredDataFields describe the runtime data shape expected from the data source/transformer
                // (for example `rows`, `columns`, `value`, `date`, `category`) rather than user-supplied
                // create/update payload fields. They must not be enforced against widget configuration.
                // Runtime data validation happens later when data is retrieved and transformed.

                // Validate data source compatibility
                if (dataSource == "realtime" && !config.SupportsRealTimeData)
                {
                    validationErrors.Add($"Widget type '{widgetType}' does not support real-time data");
                }

                return new WidgetValidationResult
                {
                    IsValid = validationErrors.Count == 0,
                    ErrorMessage = validationErrors.Count > 0 ? string.Join(", ", validationErrors) : null,
                    ValidationErrors = validationErrors,
                    Configuration = config
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating widget configuration for type {WidgetType}", widgetType);
                return new WidgetValidationResult
                {
                    IsValid = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }

    // Widget validation result
    public class WidgetValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
        public List<string> ValidationErrors { get; set; } = new();
        public WidgetTypeConfiguration? Configuration { get; set; }
    }
}