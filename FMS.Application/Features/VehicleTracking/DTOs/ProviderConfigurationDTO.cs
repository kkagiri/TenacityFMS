using System;

namespace FMS.Application.Features.VehicleTracking.DTOs
{
    /// <summary>
    /// DTO for provider configuration data
    /// </summary>
    public class ProviderConfigurationDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsEnabled { get; set; }
        public bool IsDefault { get; set; }
        public string? Version { get; set; }
        public int Priority { get; set; }
        public string? Settings { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
