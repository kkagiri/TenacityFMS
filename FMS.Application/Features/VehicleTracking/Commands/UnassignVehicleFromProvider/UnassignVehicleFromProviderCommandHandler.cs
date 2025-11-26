using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTracking.Commands.UnassignVehicleFromProvider
{
    /// <summary>
    /// Handler for UnassignVehicleFromProviderCommand
    /// </summary>
    public class UnassignVehicleFromProviderCommandHandler : IRequestHandler<UnassignVehicleFromProviderCommand, FMSResponse<bool>>
    {
        private readonly IProviderConfigurationService _configService;
        private readonly ILogger<UnassignVehicleFromProviderCommandHandler> _logger;

        public UnassignVehicleFromProviderCommandHandler(
            IProviderConfigurationService configService,
            ILogger<UnassignVehicleFromProviderCommandHandler> logger)
        {
            _configService = configService;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(UnassignVehicleFromProviderCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Unassigning vehicle {VehicleId} from provider", request.VehicleId);

                bool success = await _configService.UnmapVehicleFromProviderAsync(request.VehicleId, request.UserId);

                if (!success)
                {
                    return FMSResponse<bool>.Failed("Failed to unassign vehicle from provider");
                }

                _logger.LogInformation("Successfully unassigned vehicle {VehicleId} from provider", request.VehicleId);

                return FMSResponse<bool>.Success(true, $"Vehicle {request.VehicleId} unassigned successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unassigning vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<bool>.Failed($"Error unassigning vehicle: {ex.Message}");
            }
        }
    }
}
