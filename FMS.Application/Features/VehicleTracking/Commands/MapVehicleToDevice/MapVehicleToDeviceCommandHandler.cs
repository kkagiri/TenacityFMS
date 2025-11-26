using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Commands.MapVehicleToDevice
{
    /// <summary>
    /// Handler for MapVehicleToDeviceCommand
    /// Maps vehicle to device with full metadata
    /// </summary>
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
