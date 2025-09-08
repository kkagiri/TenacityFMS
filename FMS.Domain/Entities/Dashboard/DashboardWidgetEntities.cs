using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Dashboard {
    /// <summary>
    /// Master template defining available dashboard widgets
    /// </summary>
    public class DashboardWidgetTemplate {
        public int Id { get; set; }
        public string WidgetType { get; set; } = null!; // ticker, graph, chart, table, gauge
        public string Name { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!; // key_statistics, fuel_management, vehicle_performance, etc.
        public string DataSource { get; set; } = null!; // fuel_dispense, engine_hours, km_travel, etc.
        public string ConfigurationJson { get; set; } = null!; // Default configuration schema
        public string? RequiredRole { get; set; }
        public string? RequiredPermissions { get; set; }
        public bool IsEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<DashboardWidgetInstance> WidgetInstances { get; set; } = new List<DashboardWidgetInstance> ();
    }

    /// <summary>
    /// User's specific widget instance with custom configuration
    /// Enhanced to support both template-based and fully custom widgets
    /// </summary>
    public class DashboardWidgetInstance {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;

        // Optional template - null for custom widgets
        public int? TemplateId { get; set; }

        public string CustomName { get; set; } = null!;

        // Core widget properties (moved from template to allow customization)
        public string WidgetType { get; set; } = null!; // BIG_STAT_CARD, CHART_LINE_TREND, etc.
        public string Category { get; set; } = null!; // fuel_management, vehicle_performance, etc.
        public string DataSource { get; set; } = null!; // fuel_dispense, engine_hours, etc.

        // Layout properties
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public int Width { get; set; } = 4; // Default width in grid units
        public int Height { get; set; } = 3; // Default height in grid

        // Configuration and metadata
        public string ConfigurationJson { get; set; } = null!; // User-specific configuration
        public bool IsVisible { get; set; } = true;
        public bool IsCustomWidget { get; set; } = false; // True if created without template

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation - Template is now optional
        public virtual User User { get; set; } = null!;
        public virtual DashboardWidgetTemplate? Template { get; set; }
    }

    /// <summary>
    /// User's dashboard layout and global settings
    /// </summary>
    public class UserDashboardLayout {
        public Guid Id { get; set; } = Guid.NewGuid ();
        public string UserId { get; set; } = null!;
        public string LayoutName { get; set; } = "Default";
        public string LayoutJson { get; set; } = null!; // Grid layout configuration
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Audit
        public string CreatedBy { get; set; } = null!;
        public string? UpdatedBy { get; set; }

        // Navigation
        public virtual User User { get; set; } = null!;
    }
}