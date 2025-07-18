using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleTracking {

    public class GetVehicleOdometerQuery : IRequest<FMSResponse<VehicleOdometerDTO>> {
        public int VehicleId { get; set; }
    }
    public class GetVehicleOdometerQueryHandler : IRequestHandler<GetVehicleOdometerQuery, FMSResponse<VehicleOdometerDTO>> {
        private readonly IGPSService _gpsService;
        private readonly ILogger<GetVehicleOdometerQueryHandler> _logger;

        public GetVehicleOdometerQueryHandler (
            IGPSService gpsService,
            ILogger<GetVehicleOdometerQueryHandler> logger) {
            _gpsService = gpsService;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleOdometerDTO>> Handle (GetVehicleOdometerQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting odometer for vehicle {VehicleId}", request.VehicleId);
                return await _gpsService.GetVehicleOdometerAsync (request.VehicleId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error handling GetVehicleOdometerQuery for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<VehicleOdometerDTO>.Failed ($"Failed to get vehicle odometer: {ex.Message}");
            }
        }
    }
}