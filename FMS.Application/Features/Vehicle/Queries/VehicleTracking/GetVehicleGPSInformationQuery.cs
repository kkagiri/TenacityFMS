using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleTracking
{
    public class GetVehicleGPSInformationQuery : IRequest<FMSResponse<VehicleGPSInformationDTO>>
    {
        public int VehicleId { get; set; }
    }

    public class GetVehicleGPSInformationQueryHandler : IRequestHandler<GetVehicleGPSInformationQuery, FMSResponse<VehicleGPSInformationDTO>>
    {
        private readonly IGPSService _gpsService;
        private readonly ILogger<GetVehicleGPSInformationQueryHandler> _logger;

        public GetVehicleGPSInformationQueryHandler(
            IGPSService gpsService,
            ILogger<GetVehicleGPSInformationQueryHandler> logger)
        {
            _gpsService = gpsService;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleGPSInformationDTO>> Handle(GetVehicleGPSInformationQuery request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Getting GPS information for vehicle {VehicleId}", request.VehicleId);
                return await _gpsService.GetVehicleGPSInformationAsync(request.VehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling GetVehicleGPSInformationQuery for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<VehicleGPSInformationDTO>.Failed($"Failed to get vehicle GPS information: {ex.Message}");
            }
        }
    }
}

