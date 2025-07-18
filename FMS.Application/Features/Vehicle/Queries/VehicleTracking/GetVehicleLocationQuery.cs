using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleTracking {

    public class GetVehicleLocationQuery : IRequest<FMSResponse<VehicleLocationDTO>> {
        public int VehicleId { get; set; }
    }
    public class GetVehicleLocationQueryHandler : IRequestHandler<GetVehicleLocationQuery, FMSResponse<VehicleLocationDTO>> {
        private readonly IGPSService _gpsService;
        private readonly ILogger<GetVehicleLocationQueryHandler> _logger;

        public GetVehicleLocationQueryHandler (
            IGPSService gpsService,
            ILogger<GetVehicleLocationQueryHandler> logger) {
            _gpsService = gpsService;
            _logger = logger;
        }

        public async Task<FMSResponse<VehicleLocationDTO>> Handle (GetVehicleLocationQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting location for vehicle {VehicleId}", request.VehicleId);
                return await _gpsService.GetVehicleLocationAsync (request.VehicleId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error handling GetVehicleLocationQuery for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<VehicleLocationDTO>.Failed ($"Failed to get vehicle location: {ex.Message}");
            }
        }
    }
}