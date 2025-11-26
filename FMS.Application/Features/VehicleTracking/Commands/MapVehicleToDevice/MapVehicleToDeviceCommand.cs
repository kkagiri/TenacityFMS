using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.VehicleTracking.Commands.MapVehicleToDevice
{
    /// <summary>
    /// Command to map a vehicle to a device with full metadata
    /// </summary>
    public class MapVehicleToDeviceCommand : IRequest<FMSResponse<bool>>
    {
        public int VehicleId { get; set; }
        public int? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public string ExternalDeviceId { get; set; } = string.Empty;
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? DeviceType { get; set; }
        public string? Metadata { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}
