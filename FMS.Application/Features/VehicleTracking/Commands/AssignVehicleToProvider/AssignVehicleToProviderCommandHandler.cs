using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Commands.AssignVehicleToProvider
{
    /// <summary>
    /// Handler for AssignVehicleToProviderCommand
    /// Fixes bug: Fetches device_id from vehicles table instead of using null
    /// </summary>
    public class AssignVehicleToProviderCommandHandler : IRequestHandler<AssignVehicleToProviderCommand, FMSResponse<bool>>
    {
        private readonly IProviderConfigurationService _configService;
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignVehicleToProviderCommandHandler> _logger;

        public AssignVehicleToProviderCommandHandler(
            IProviderConfigurationService configService,
            GpsdataContext context,
            ILogger<AssignVehicleToProviderCommandHandler> logger)
        {
            _configService = configService;
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(AssignVehicleToProviderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Assigning vehicle {VehicleId} to provider {ProviderId}",
                    request.VehicleId, request.ProviderId);

                // Get provider
                var provider = await _configService.GetByIdAsync(request.ProviderId);
                if (provider == null)
                {
                    return FMSResponse<bool>.Failed($"Provider {request.ProviderId} not found");
                }

                // ✓ BUG FIX: Get vehicle's device_id from database
                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == request.VehicleId)
                    .Select(v => new { v.VehicleId, v.DeviceId, v.HasGPSInstalled, v.HyoungNo })
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicle == null)
                {
                    return FMSResponse<bool>.Failed($"Vehicle {request.VehicleId} not found");
                }

                if (vehicle.HasGPSInstalled != 1)
                {
                    return FMSResponse<bool>.Failed($"Vehicle {vehicle.HyoungNo} does not have GPS installed");
                }

                if (!vehicle.DeviceId.HasValue)
                {
                    return FMSResponse<bool>.Failed(
                        $"Vehicle {vehicle.HyoungNo} does not have a GPSGate device ID configured. " +
                        "Please set the device_id in the vehicles table first.");
                }

                // ✓ BUG FIX: Pass correct device ID as externalDeviceId
                bool success = await _configService.MapVehicleToProviderAsync(
                    request.VehicleId,
                    provider.Name,
                    externalDeviceId: vehicle.DeviceId.Value.ToString(), // ✓ Correct GPSGate device ID
                    currentUser: request.UserId);

                if (!success)
                {
                    return FMSResponse<bool>.Failed("Failed to assign vehicle to provider");
                }

                _logger.LogInformation(
                    "Successfully assigned vehicle {VehicleId} ({VehicleName}) to provider {ProviderName} with device ID {DeviceId}",
                    request.VehicleId, vehicle.HyoungNo, provider.Name, vehicle.DeviceId);

                return FMSResponse<bool>.Success(true,
                    $"Vehicle {vehicle.HyoungNo} assigned to provider {provider.DisplayName} successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning vehicle {VehicleId} to provider {ProviderId}",
                    request.VehicleId, request.ProviderId);
                return FMSResponse<bool>.Failed($"Error assigning vehicle: {ex.Message}");
            }
        }
    }
}
