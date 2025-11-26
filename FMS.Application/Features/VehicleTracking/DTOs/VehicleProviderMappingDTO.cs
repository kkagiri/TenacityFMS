using System;

namespace FMS.Application.Features.VehicleTracking.DTOs
{
    /// <summary>
    /// DTO for vehicle-to-provider mapping data
    /// </summary>
    public class VehicleProviderMappingDTO
    {
        public int VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public string? NumberPlate { get; set; }
        public string? VehicleType { get; set; }
        public int ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public string? ExternalDeviceId { get; set; }
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? DeviceType { get; set; }
        public bool IsActive { get; set; }
        public DateTime? MappedAt { get; set; }
        public string? MappedBy { get; set; }
    }
}
