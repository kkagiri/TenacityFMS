using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Features.Dashboard.Command {
    // Create Widget Instance Command
    public record CreateWidgetInstanceCommand (
        string UserId,
        WidgetConfigurationDto Configuration,
        string Actor) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class CreateWidgetInstanceCommandHandler : IRequestHandler<CreateWidgetInstanceCommand, FMSResponseMessage<DashboardWidgetInstanceDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateWidgetInstanceCommandHandler> _logger;
        private readonly IWidgetFactoryService _widgetFactoryService;

        public CreateWidgetInstanceCommandHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<CreateWidgetInstanceCommandHandler> logger,
            IWidgetFactoryService widgetFactoryService) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _widgetFactoryService = widgetFactoryService;
        }

        public async Task<FMSResponseMessage<DashboardWidgetInstanceDto>> Handle (
            CreateWidgetInstanceCommand request,
            CancellationToken cancellationToken) {
            try {
                // Handle both template-based and custom widgets
                DashboardWidgetTemplate? template = null;
                string category, dataSource;
                bool isCustomWidget = false;

                // Check if this is a custom widget by examining settings
                if (request.Configuration.Settings?.ContainsKey ("isCustomWidget") == true) {
                    isCustomWidget = GetBooleanValue (request.Configuration.Settings["isCustomWidget"]);
                }

                if (!isCustomWidget && request.Configuration.TemplateId.HasValue && request.Configuration.TemplateId.Value > 0) {
                    // Template-based widget
                    template = await _context.DashboardWidgetTemplates
                        .FirstOrDefaultAsync (t => t.Id == request.Configuration.TemplateId && t.IsEnabled, cancellationToken);

                    if (template == null) {
                        return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                            false, "Widget template not found or disabled", null!);
                    }

                    category = template.Category;
                    dataSource = template.DataSource;
                } else {
                    // Custom widget - extract from settings
                    if (!request.Configuration.Settings.TryGetValue ("originalCategory", out object? categoryValue) ||
                        !request.Configuration.Settings.TryGetValue ("dataSource", out object? dataSourceValue)) {
                        return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                            false, "Custom widgets require 'originalCategory' and 'dataSource' in settings", null!);
                    }

                    // Handle JsonElement objects from System.Text.Json
                    category = GetStringValue (categoryValue);
                    dataSource = GetStringValue (dataSourceValue);
                    isCustomWidget = true; // Explicitly mark as custom widget
                }

                // Validate widget configuration using enhanced service
                WidgetValidationRequest validationRequest = new WidgetValidationRequest {
                    WidgetType = request.Configuration.VisualizationType,
                    Category = category,
                    DataSource = dataSource,
                    Filters = request.Configuration.Filters,
                    Settings = request.Configuration.Settings,
                    Mode = "cumulative", // Default mode - will be enhanced
                    AggregationType = request.Configuration.Settings?.ContainsKey ("aggregation") == true ?
                    GetStringValue (request.Configuration.Settings["aggregation"]) :
                    "SUM"
                };

                var validation = await _widgetFactoryService.ValidateWidgetConfigurationAsync (validationRequest);

                if (!validation.IsValid) {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                        false, validation.ErrorMessage!, null!);
                }

                // Create enhanced configuration JSON with processed data
                // Convert JsonElement objects to simple values before serialization
                var processedSettings = new Dictionary<string, object?> ();
                if (request.Configuration.Settings != null) {
                    foreach (var kvp in request.Configuration.Settings) {
                        processedSettings[kvp.Key] = GetObjectValue (kvp.Value);
                    }
                }

                var processedFilters = new Dictionary<string, object?> ();
                if (request.Configuration.Filters != null) {
                    foreach (var kvp in request.Configuration.Filters) {
                        processedFilters[kvp.Key] = GetObjectValue (kvp.Value);
                    }
                }

                var configuration = new {
                    settings = processedSettings,
                    filters = processedFilters,
                    visualizationType = request.Configuration.VisualizationType,
                    widgetType = request.Configuration.VisualizationType,
                    category = category,
                    dataSource = dataSource,
                    datePreset = "yesterday",
                    mode = "cumulative",
                    // Enhanced configuration
                    validatedAt = DateTime.UtcNow,
                    factoryProcessed = true
                };

                DashboardWidgetInstance widgetInstance = new DashboardWidgetInstance {
                    UserId = request.UserId,
                    TemplateId = isCustomWidget ? null : template?.Id, // Only set template ID for template-based widgets
                    CustomName = request.Configuration.CustomName,
                    WidgetType = request.Configuration.VisualizationType, // Set widget type from request
                    Category = category, // Set category from template or settings
                    DataSource = dataSource, // Set data source from template or settings
                    IsCustomWidget = isCustomWidget,
                    ConfigurationJson = JsonConvert.SerializeObject (configuration),
                };

                _context.DashboardWidgetInstances.Add (widgetInstance);
                await _context.SaveChangesAsync (cancellationToken);

                DashboardWidgetInstanceDto dto = _mapper.Map<DashboardWidgetInstanceDto> (widgetInstance);
                // Only attach template for template-based widgets, not custom widgets
                if (!isCustomWidget && template != null) {
                    dto.Template = _mapper.Map<DashboardWidgetTemplateDto> (template);
                }

                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    true, "Widget instance created successfully with factory validation", dto);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating widget instance for user {UserId}", request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    false, ex.Message, null!);
            }
        }

        /// <summary>
        /// Helper method to safely extract string values from JsonElement or other object types
        /// </summary>
        private static string GetStringValue (object? value) {
            if (value == null) return string.Empty;

            // Handle System.Text.Json.JsonElement
            if (value is System.Text.Json.JsonElement jsonElement) {
                return jsonElement.ValueKind == System.Text.Json.JsonValueKind.String ?
                    jsonElement.GetString () ?? string.Empty :
                    jsonElement.ToString ();
            }

            return value.ToString () ?? string.Empty;
        }

        /// <summary>
        /// Helper method to safely extract integer values from JsonElement or other object types
        /// </summary>
        private static int GetIntValue (object? value) {
            if (value == null) return 0;

            // Handle System.Text.Json.JsonElement
            if (value is System.Text.Json.JsonElement jsonElement) {
                return jsonElement.ValueKind == System.Text.Json.JsonValueKind.Number ?
                    jsonElement.GetInt32 () :
                    (int.TryParse (jsonElement.ToString (), out int result) ? result : 0);
            }

            if (value is int intValue) return intValue;
            if (value is string stringValue) return int.TryParse (stringValue, out int result) ? result : 0;

            return 0;
        }

        /// <summary>
        /// Helper method to safely extract boolean values from JsonElement or other object types
        /// </summary>
        private static bool GetBooleanValue (object? value) {
            if (value == null) return false;

            // Handle System.Text.Json.JsonElement
            if (value is System.Text.Json.JsonElement jsonElement) {
                return jsonElement.ValueKind == System.Text.Json.JsonValueKind.True ||
                    (jsonElement.ValueKind == System.Text.Json.JsonValueKind.String &&
                        bool.TryParse (jsonElement.GetString (), out bool boolResult) && boolResult);
            }

            if (value is bool boolValue) return boolValue;
            if (value is string stringValue) return bool.TryParse (stringValue, out bool result) && result;

            return false;
        }

        /// <summary>
        /// Helper method to safely extract object values from JsonElement or other object types
        /// </summary>
        private static object? GetObjectValue (object? value) {
            if (value == null) {
                return null;
            }

            if (value is JsonElement jsonElement) {
                return jsonElement.ValueKind
                switch {
                    JsonValueKind.String => jsonElement.GetString (),
                        JsonValueKind.Number => jsonElement.TryGetInt32 (out int intValue) ? intValue :
                        jsonElement.TryGetDouble (out double doubleValue) ? doubleValue : 0,
                        JsonValueKind.True => true,
                        JsonValueKind.False => false,
                        JsonValueKind.Null => null,
                        JsonValueKind.Array => jsonElement.EnumerateArray ().Select (element => GetObjectValue (element)).ToArray (),
                        JsonValueKind.Object => jsonElement.EnumerateObject ().ToDictionary (p => p.Name, p => GetObjectValue (p.Value)),
                        _ => jsonElement.ToString ()
                };
            }

            return value;
        }
    }
}