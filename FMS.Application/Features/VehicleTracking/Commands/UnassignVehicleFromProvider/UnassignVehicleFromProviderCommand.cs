using FMS.Application.Common;
using MediatR;
using FMS.Application.Features.VehicleTracking.Services;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTracking.Commands.UnassignVehicleFromProvider
{
    /// <summary>
    /// Command to unassign a vehicle from its provider
    /// </summary>
    public class UnassignVehicleFromProviderCommand : IRequest<FMSResponse<bool>>
    {
        public int VehicleId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }

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
