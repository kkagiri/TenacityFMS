using System.Collections.Generic;
using FMS.Domain.Entities.Dashboard;

namespace FMS.Application.Services.Dashboard
{
    /// <summary>
    /// Prepared widget configuration result used by create and update handlers.
    /// </summary>
    public class WidgetConfigurationPreparationResult
    {
        public bool Success { get; init; }
        public string Message { get; init; } = string.Empty;
        public DashboardWidgetTemplate? Template { get; init; }
        public int? TemplateId { get; init; }
        public string WidgetType { get; init; } = "default";
        public string Category { get; init; } = string.Empty;
        public string DataSource { get; init; } = string.Empty;
        public bool IsCustomWidget { get; init; }
        public bool? IsVisible { get; init; }
        public Dictionary<string, object?> Settings { get; init; } = new();
        public Dictionary<string, object?> Filters { get; init; } = new();
        public string Mode { get; init; } = "cumulative";
        public string DatePreset { get; init; } = "yesterday";
        public string ConfigurationJson { get; init; } = "{}";
    }
}
