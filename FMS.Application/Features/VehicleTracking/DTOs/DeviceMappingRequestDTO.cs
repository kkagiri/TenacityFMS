namespace FMS.Application.Features.VehicleTracking.DTOs
{
    /// <summary>
    /// DTO for device mapping request
    /// </summary>
    public class DeviceMappingRequestDTO
    {
        public int VehicleId { get; set; }
        public int? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public string ExternalDeviceId { get; set; } = string.Empty;
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? DeviceType { get; set; }
        public string? Metadata { get; set; }
    }
}
