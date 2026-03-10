/**
 * File: WidgetConfigurationPreparationService.cs
 * Purpose: Normalizes widget configuration, applies data-source defaults, and prepares storage payloads.
 * Dependencies: GpsdataContext, IDataSourceManager, IWidgetFactoryService, Dashboard widget DTOs/entities
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - PrepareAsync(): Normalizes and validates widget configuration for create/update operations.
 * - ResolveAggregationType(): Aligns aggregation with the selected data source metadata.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
    /// <summary>
    /// Normalizes widget configuration, validates it through the widget factory, and prepares storage payloads.
    /// </summary>
    public class WidgetConfigurationPreparationService : IWidgetConfigurationPreparationService
    {
        private readonly GpsdataContext _context;
        private readonly IDataSourceManager _dataSourceManager;
        private readonly IWidgetFactoryService _widgetFactoryService;

        public WidgetConfigurationPreparationService(
            GpsdataContext context,
            IDataSourceManager dataSourceManager,
            IWidgetFactoryService widgetFactoryService)
        {
            _context = context;
            _dataSourceManager = dataSourceManager;
            _widgetFactoryService = widgetFactoryService;
        }

        public async Task<WidgetConfigurationPreparationResult> PrepareAsync(
            WidgetConfigurationDto configuration,
            CancellationToken cancellationToken)
        {
            var rawSettings = configuration.Settings ?? new Dictionary<string, object>();
            var rawFilters = configuration.Filters ?? new Dictionary<string, object>();
            var processedSettings = NormalizeDictionary(rawSettings);
            var processedFilters = NormalizeDictionary(rawFilters);

            bool requestedCustomWidget = configuration.IsCustomWidget ?? (TryGetBoolean(rawSettings, "isCustomWidget") ?? false);
            bool hasTemplateId = configuration.TemplateId.HasValue && configuration.TemplateId.Value > 0;
            bool isCustomWidget = requestedCustomWidget || !hasTemplateId;

            DashboardWidgetTemplate? template = null;
            if (hasTemplateId)
            {
                template = await _context.DashboardWidgetTemplates
                    .FirstOrDefaultAsync(t => t.Id == configuration.TemplateId && t.IsEnabled, cancellationToken);

                if (template == null && !isCustomWidget)
                {
                    return Failure("Widget template not found or disabled");
                }
            }

            string category;
            string dataSource;

            if (isCustomWidget)
            {
                category = configuration.Category ?? GetStringValue(GetDictionaryValue(processedSettings, "originalCategory"));
                dataSource = configuration.DataSource ?? GetStringValue(GetDictionaryValue(processedSettings, "dataSource"));

                if (string.IsNullOrWhiteSpace(category))
                {
                    category = template?.Category ?? string.Empty;
                }

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    dataSource = template?.DataSource ?? string.Empty;
                }

                if (string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(dataSource))
                {
                    return Failure("Custom widgets require 'originalCategory' and 'dataSource' in settings");
                }
            }
            else
            {
                category = template!.Category;
                dataSource = template.DataSource;
            }

            string widgetType = ResolveWidgetType(configuration, template, processedSettings);
            if (string.IsNullOrWhiteSpace(widgetType))
            {
                return Failure("Widget configuration requires a visualization type");
            }

            string mode = GetStringValue(GetDictionaryValue(processedSettings, "mode"));
            if (string.IsNullOrWhiteSpace(mode))
            {
                mode = "cumulative";
            }

            string datePreset = GetStringValue(GetDictionaryValue(processedSettings, "datePreset"));
            if (string.IsNullOrWhiteSpace(datePreset))
            {
                datePreset = "yesterday";
            }

            string aggregationType = ResolveAggregationType(
                dataSource,
                GetStringValue(GetDictionaryValue(processedSettings, "aggregation")));

            processedSettings["mode"] = mode;
            processedSettings["datePreset"] = datePreset;
            processedSettings["aggregation"] = aggregationType;
            processedSettings["dataSource"] = dataSource;

            if (isCustomWidget)
            {
                processedSettings["isCustomWidget"] = true;
                processedSettings["originalCategory"] = category;
                processedSettings["customWidgetType"] = widgetType;
            }

            var validation = await _widgetFactoryService.ValidateWidgetConfigurationAsync(new WidgetValidationRequest
            {
                WidgetType = widgetType,
                Category = category,
                DataSource = dataSource,
                Filters = ToObjectDictionary(processedFilters),
                Settings = ToObjectDictionary(processedSettings),
                Mode = mode,
                AggregationType = aggregationType
            });

            if (!validation.IsValid)
            {
                string message = !string.IsNullOrWhiteSpace(validation.ErrorMessage)
                    ? validation.ErrorMessage
                    : string.Join(", ", validation.ValidationErrors);

                return Failure(message);
            }

            var storedConfiguration = new
            {
                settings = processedSettings,
                filters = processedFilters,
                visualizationType = widgetType,
                widgetType,
                category,
                dataSource,
                datePreset,
                mode,
                validatedAt = DateTime.UtcNow,
                factoryProcessed = true
            };

            return new WidgetConfigurationPreparationResult
            {
                Success = true,
                Message = "Widget configuration prepared successfully",
                Template = isCustomWidget ? null : template,
                TemplateId = isCustomWidget ? null : template?.Id,
                WidgetType = widgetType,
                Category = category,
                DataSource = dataSource,
                IsCustomWidget = isCustomWidget,
                IsVisible = configuration.IsVisible ?? TryGetBoolean(rawSettings, "isVisible"),
                Settings = processedSettings,
                Filters = processedFilters,
                Mode = mode,
                DatePreset = datePreset,
                ConfigurationJson = JsonConvert.SerializeObject(storedConfiguration)
            };
        }

        private static WidgetConfigurationPreparationResult Failure(string message)
        {
            return new WidgetConfigurationPreparationResult
            {
                Success = false,
                Message = message
            };
        }

        private string ResolveAggregationType(string dataSource, string requestedAggregation)
        {
            DataSourceMetadata metadata = _dataSourceManager.GetDataSourceMetadata(dataSource);
            List<string> supportedAggregations = metadata.SupportedAggregations ?? new List<string>();

            if (!string.IsNullOrWhiteSpace(requestedAggregation))
            {
                string? supportedMatch = supportedAggregations.FirstOrDefault(aggregation =>
                    string.Equals(aggregation, requestedAggregation, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrWhiteSpace(supportedMatch))
                {
                    return supportedMatch;
                }
            }

            if (!string.IsNullOrWhiteSpace(metadata.DefaultAggregation))
            {
                return metadata.DefaultAggregation;
            }

            if (supportedAggregations.Count > 0)
            {
                return supportedAggregations[0];
            }

            return "SUM";
        }

        private static string ResolveWidgetType(
            WidgetConfigurationDto configuration,
            DashboardWidgetTemplate? template,
            Dictionary<string, object?> processedSettings)
        {
            if (!string.IsNullOrWhiteSpace(configuration.VisualizationType) &&
                !string.Equals(configuration.VisualizationType, "default", StringComparison.OrdinalIgnoreCase))
            {
                return configuration.VisualizationType;
            }

            string configuredWidgetType = GetStringValue(GetDictionaryValue(processedSettings, "customWidgetType"));
            if (!string.IsNullOrWhiteSpace(configuredWidgetType))
            {
                return configuredWidgetType;
            }

            string storedWidgetType = GetStringValue(GetDictionaryValue(processedSettings, "widgetType"));
            if (!string.IsNullOrWhiteSpace(storedWidgetType))
            {
                return storedWidgetType;
            }

            return template?.WidgetType ?? string.Empty;
        }

        private static Dictionary<string, object?> NormalizeDictionary(Dictionary<string, object> source)
        {
            return source.ToDictionary(kvp => kvp.Key, kvp => GetObjectValue(kvp.Value));
        }

        private static Dictionary<string, object> ToObjectDictionary(Dictionary<string, object?> source)
        {
            return source.ToDictionary(kvp => kvp.Key, kvp => kvp.Value!);
        }

        private static object? GetDictionaryValue(Dictionary<string, object?> source, string key)
        {
            return source.TryGetValue(key, out object? value) ? value : null;
        }

        private static bool? TryGetBoolean(Dictionary<string, object> source, string key)
        {
            if (!source.TryGetValue(key, out object? value))
            {
                return null;
            }

            return GetBooleanValue(value);
        }

        private static string GetStringValue(object? value)
        {
            if (value == null)
            {
                return string.Empty;
            }

            if (value is JsonElement jsonElement)
            {
                return jsonElement.ValueKind == JsonValueKind.String
                    ? jsonElement.GetString() ?? string.Empty
                    : jsonElement.ToString();
            }

            return value.ToString() ?? string.Empty;
        }

        private static bool GetBooleanValue(object? value)
        {
            if (value == null)
            {
                return false;
            }

            if (value is JsonElement jsonElement)
            {
                return jsonElement.ValueKind == JsonValueKind.True ||
                    (jsonElement.ValueKind == JsonValueKind.String &&
                        bool.TryParse(jsonElement.GetString(), out bool jsonBool) && jsonBool);
            }

            if (value is bool booleanValue)
            {
                return booleanValue;
            }

            return value is string stringValue && bool.TryParse(stringValue, out bool parsed) && parsed;
        }

        private static object? GetObjectValue(object? value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is JsonElement jsonElement)
            {
                return jsonElement.ValueKind switch
                {
                    JsonValueKind.String => jsonElement.GetString(),
                    JsonValueKind.Number => jsonElement.TryGetInt32(out int intValue)
                        ? intValue
                        : jsonElement.TryGetDouble(out double doubleValue)
                            ? doubleValue
                            : 0,
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    JsonValueKind.Array => jsonElement.EnumerateArray().Select(element => GetObjectValue(element)).ToArray(),
                    JsonValueKind.Object => jsonElement.EnumerateObject().ToDictionary(property => property.Name, property => GetObjectValue(property.Value)),
                    _ => jsonElement.ToString()
                };
            }

            return value;
        }
    }
}
