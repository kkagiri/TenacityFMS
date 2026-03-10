using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Services.Dashboard
{
    /// <summary>
    /// Converts stored widget configuration JSON into strongly-typed DTO fields for reads.
    /// </summary>
    public class WidgetInstanceDtoHydrationService : IWidgetInstanceDtoHydrationService
    {
        public DashboardWidgetInstanceDto Hydrate(DashboardWidgetInstance widgetInstance, DashboardWidgetInstanceDto dto)
        {
            dto.VisualizationType = widgetInstance.WidgetType;
            dto.IsShared = widgetInstance.IsShared;
            dto.SharedFromUserId = widgetInstance.SharedFromUserId;
            dto.SharedFromWidgetId = widgetInstance.SharedFromWidgetId;
            dto.CanEdit = widgetInstance.CanEdit;
            dto.CanDelete = widgetInstance.CanDelete;
            dto.SharedAt = widgetInstance.SharedAt;

            if (string.IsNullOrWhiteSpace(widgetInstance.ConfigurationJson))
            {
                return dto;
            }

            JObject configuration = JObject.Parse(widgetInstance.ConfigurationJson);
            dto.VisualizationType = configuration.Value<string>("visualizationType") ?? dto.WidgetType;
            dto.Category = configuration.Value<string>("category") ?? dto.Category;
            dto.DataSource = configuration.Value<string>("dataSource") ?? dto.DataSource;
            dto.Mode = configuration.Value<string>("mode") ?? dto.Mode;
            dto.DatePreset = configuration.Value<string>("datePreset") ?? dto.DatePreset;
            dto.Settings = ConvertObject(configuration["settings"]) as Dictionary<string, object> ?? new Dictionary<string, object>();
            dto.Filters = ConvertObject(configuration["filters"]) as Dictionary<string, object> ?? new Dictionary<string, object>();

            return dto;
        }

        private static object? ConvertObject(JToken? token)
        {
            if (token == null || token.Type == JTokenType.Null || token.Type == JTokenType.Undefined)
            {
                return null;
            }

            return token.Type switch
            {
                JTokenType.Object => token.Children<JProperty>().ToDictionary(property => property.Name, property => ConvertObject(property.Value)!),
                JTokenType.Array => token.Select(ConvertObject).ToList(),
                JTokenType.Integer => token.Value<long>(),
                JTokenType.Float => token.Value<double>(),
                JTokenType.Boolean => token.Value<bool>(),
                JTokenType.Date => token.Value<System.DateTime>(),
                _ => token.ToString()
            };
        }
    }
}
