using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Dashboard {
    // Widget Template DTOs
    public class DashboardWidgetTemplateDto {
        public int Id { get; set; }
        public string WidgetType { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string DataSource { get; set; } = null!;
        public string ConfigurationJson { get; set; } = null!;
        public string? RequiredRole { get; set; }
        public string? RequiredPermissions { get; set; }
        public bool IsEnabled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // Widget Instance DTOs
    public class DashboardWidgetInstanceDto {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public int? TemplateId { get; set; } // Changed to nullable to match entity
        public string CustomName { get; set; } = null!;
        public string WidgetType { get; set; } = null!; // Added to match entity
        public string Category { get; set; } = null!; // Added to match entity
        public string DataSource { get; set; } = null!; // Added to match entity
        public string ConfigurationJson { get; set; } = null!;
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public bool IsVisible { get; set; }
        public bool IsCustomWidget { get; set; } // Added to match entity
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Template information
        public DashboardWidgetTemplateDto? Template { get; set; }
    }

    // Widget Data DTOs
    public class WidgetDataRequestDto {
        public int WidgetInstanceId { get; set; }
        public string MetricType { get; set; } = null!;
        public string Mode { get; set; } = "cumulative";
        public string DatePreset { get; set; } = "yesterday";
        public List<int> ? SiteIds { get; set; }
        public List<int> ? VehicleIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Dictionary<string, object> ? Filters { get; set; }
    }

    public class WidgetDataResponseDto {
        public int WidgetInstanceId { get; set; }
        public string WidgetType { get; set; } = null!;
        public object Data { get; set; } = null!;
        public DateTime LastUpdated { get; set; }
        public string? ErrorMessage { get; set; }
        public bool Success => string.IsNullOrEmpty (ErrorMessage);
    }

    // Layout DTOs
    public class UserDashboardLayoutDto {
        public Guid Id { get; set; }
        public string UserId { get; set; } = null!;
        public string LayoutName { get; set; } = null!;
        public string LayoutJson { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SaveUserDashboardLayoutDto {
        public string LayoutName { get; set; } = "Default";
        public string LayoutJson { get; set; } = null!;
    }

    // Enhanced Layout DTOs for Category Grouped Widgets
    public class CategoryGroupedLayoutDto {
        public string LayoutName { get; set; } = "Category Grouped Dashboard";
        public string[] CategoryOrder { get; set; } = new string[0];
        public Dictionary<string, string[]> WidgetOrder { get; set; } = new Dictionary<string, string[]> ();
        public Dictionary<string, WidgetSizeDto> WidgetSizes { get; set; } = new Dictionary<string, WidgetSizeDto> ();
        public string Version { get; set; } = "1.0";
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class WidgetSizeDto {
        public int Width { get; set; } = 6; // Grid columns (1-12)
        public int Height { get; set; } = 4; // Height units
    }

    public class SaveCategoryGroupedLayoutDto {
        public string LayoutName { get; set; } = "Category Grouped Dashboard";
        public string[] CategoryOrder { get; set; } = new string[0];
        public Dictionary<string, string[]> WidgetOrder { get; set; } = new Dictionary<string, string[]> ();
        public Dictionary<string, WidgetSizeDto> WidgetSizes { get; set; } = new Dictionary<string, WidgetSizeDto> ();
        public string Version { get; set; } = "1.0";
    }

    // Widget Configuration DTOs
    public class WidgetConfigurationDto {
        public int? TemplateId { get; set; } // Changed to nullable to support custom widgets
        public string CustomName { get; set; } = null!;
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int Width { get; set; } = 4;
        public int Height { get; set; } = 3;
        public Dictionary<string, object> Settings { get; set; } = new ();
        public Dictionary<string, object> Filters { get; set; } = new ();
        public string VisualizationType { get; set; } = "default";
    }

    // Key Statistics specific DTOs
    public class KeyStatisticsWidgetDto {
        public int Id { get; set; }
        public string CustomName { get; set; } = "Key Statistics";
        public List<KeyStatisticItemDto> Statistics { get; set; } = new ();
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int Width { get; set; } = 12;
        public int Height { get; set; } = 4;
    }

    public class KeyStatisticItemDto {
        public string Id { get; set; } = null!;
        public string MetricType { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string VisualizationType { get; set; } = "number"; // number, ticker, graph, gauge
        public string TimeRange { get; set; } = "yesterday";
        public string Mode { get; set; } = "cumulative";
        public List<int> ? SiteIds { get; set; }
        public Dictionary<string, object> Filters { get; set; } = new ();
        public decimal? CurrentValue { get; set; }
        public decimal? PreviousValue { get; set; }
        public decimal? ChangePercent { get; set; }
        public string Unit { get; set; } = null!;
        public DateTime? LastUpdated { get; set; }
    }
}