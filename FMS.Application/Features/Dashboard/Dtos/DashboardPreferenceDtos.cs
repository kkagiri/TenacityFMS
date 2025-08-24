using System;
using System.Collections.Generic;

namespace FMS.Application.ModelsDTOs.Dashboard {
    public class DashboardTickerTemplateDto {
        public int Id { get; set; }
        public string TickerType { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string ConfigurationJson { get; set; } = null!;
        public string? RequiredRole { get; set; }
        public string? RequiredPermissions { get; set; }
        public bool IsEnabled { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UserDashboardPreferenceDto {
        public Guid Id { get; set; }
        public string UserId { get; set; } = null!;
        public string PreferencesJson { get; set; } = null!;
        public string Version { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SaveUserDashboardPreferenceDto {
        public string PreferencesJson { get; set; } = null!;
        public string Version { get; set; } = "1.0";
    }
}