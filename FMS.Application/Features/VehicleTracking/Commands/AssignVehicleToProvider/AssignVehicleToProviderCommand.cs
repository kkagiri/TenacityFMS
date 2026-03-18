using FMS.Application.Common;
using MediatR;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTracking.Commands.AssignVehicleToProvider
{
    /// <summary>
    /// Command to assign a vehicle to a provider
    /// </summary>
    public class AssignVehicleToProviderCommand : IRequest<FMSResponse<bool>>
    {
        public int VehicleId { get; set; }
        public int ProviderId { get; set; }
        public string ExternalDeviceId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }

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

                var vehicle = await _context.Vehicles
                    .Where(v => v.VehicleId == request.VehicleId)
                    .Select(v => new { v.VehicleId, v.HasGPSInstalled, v.HyoungNo })
                    .FirstOrDefaultAsync(cancellationToken);

                if (vehicle == null)
                {
                    return FMSResponse<bool>.Failed($"Vehicle {request.VehicleId} not found");
                }

                if (vehicle.HasGPSInstalled != 1)
                {
                    return FMSResponse<bool>.Failed($"Vehicle {vehicle.HyoungNo} does not have GPS installed");
                }

                if (string.IsNullOrWhiteSpace(request.ExternalDeviceId))
                {
                    return FMSResponse<bool>.Failed(
                        $"Vehicle {vehicle.HyoungNo} requires an external device ID. " +
                        "Provide VehicleProviderMapping.ExternalDeviceId in the request.");
                }

                bool success = await _configService.MapVehicleToProviderAsync(
                    request.VehicleId,
                    provider.Name,
                    externalDeviceId: request.ExternalDeviceId,
                    currentUser: request.UserId);

                if (!success)
                {
                    return FMSResponse<bool>.Failed("Failed to assign vehicle to provider");
                }

                _logger.LogInformation(
                    "Successfully assigned vehicle {VehicleId} ({VehicleName}) to provider {ProviderName} with device ID {DeviceId}",
                    request.VehicleId, vehicle.HyoungNo, provider.Name, request.ExternalDeviceId);

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

