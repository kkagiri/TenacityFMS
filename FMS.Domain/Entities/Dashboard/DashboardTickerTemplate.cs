using System;

namespace FMS.Domain.Entities.Dashboard {
    /// <summary>
    /// Master template/definition for a dashboard ticker type (what data source, permissions, options etc.)
    /// </summary>
    public class DashboardTickerTemplate {
        public int Id { get; set; }
        public string TickerType { get; set; } = null!; // unique key e.g. tank_levels
        public string Name { get; set; } = null!;
        public string ConfigurationJson { get; set; } = null!; // JSON blob containing filter & display meta
        public string? RequiredRole { get; set; }
        public string? RequiredPermissions { get; set; } // comma separated permissions
        public bool IsEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}