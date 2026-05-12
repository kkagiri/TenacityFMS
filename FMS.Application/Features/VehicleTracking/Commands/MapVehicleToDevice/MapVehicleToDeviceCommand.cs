using FMS.Application.Common;
using MediatR;
using FMS.Application.Features.VehicleTracking.Services;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System;

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

    public class MapVehicleToDeviceCommandHandler : IRequestHandler<MapVehicleToDeviceCommand, FMSResponse<bool>>
    {
        private readonly IProviderConfigurationService _configService;
        private readonly ILogger<MapVehicleToDeviceCommandHandler> _logger;

        public MapVehicleToDeviceCommandHandler(
            IProviderConfigurationService configService,
            ILogger<MapVehicleToDeviceCommandHandler> logger)
        {
            _configService = configService;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(MapVehicleToDeviceCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Mapping vehicle {VehicleId} to device {DeviceId}",
                    request.VehicleId, request.ExternalDeviceId);

                // Get provider
                var provider = request.ProviderId.HasValue
                    ? await _configService.GetByIdAsync(request.ProviderId.Value)
                    : await _configService.GetByNameAsync(request.ProviderName ?? "");

                if (provider == null)
                {
                    return FMSResponse<bool>.Failed(
                        request.ProviderId.HasValue
                            ? $"Provider {request.ProviderId} not found"
                            : $"Provider '{request.ProviderName}' not found");
                }

                // Map with device metadata
                bool success = await _configService.MapVehicleToProviderAsync(
                    request.VehicleId,
                    provider.Name,
                    request.ExternalDeviceId,
                    request.DeviceIMEI,
                    request.DeviceName,
                    request.DeviceType,
                    request.Metadata,
                    request.UserId);

                if (!success)
                {
                    return FMSResponse<bool>.Failed("Failed to map vehicle to device");
                }

                _logger.LogInformation(
                    "Successfully mapped vehicle {VehicleId} to device {DeviceId} on provider {ProviderName}",
                    request.VehicleId, request.ExternalDeviceId, provider.Name);

                return FMSResponse<bool>.Success(true,
                    $"Vehicle {request.VehicleId} mapped to device {request.ExternalDeviceId} successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping vehicle {VehicleId} to device", request.VehicleId);
                return FMSResponse<bool>.Failed($"Error mapping vehicle to device: {ex.Message}");
            }
        }
    }
}
