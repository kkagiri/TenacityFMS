using System;
using System.Collections.Generic;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries.VehicleTracking {

    public class GetAllVehicleLocationsQuery : IRequest<FMSResponse<List<VehicleLocationDTO>>> {
        public bool OnlineOnly { get; set; } = false;
        public bool GPSEnabledOnly { get; set; } = true;
    }
    public class GetAllVehicleLocationsQueryHandler : IRequestHandler<GetAllVehicleLocationsQuery, FMSResponse<List<VehicleLocationDTO>>> {
        private readonly IGPSService _gpsService;
        private readonly ILogger<GetAllVehicleLocationsQueryHandler> _logger;

        public GetAllVehicleLocationsQueryHandler (
            IGPSService gpsService,
            ILogger<GetAllVehicleLocationsQueryHandler> logger) {
            _gpsService = gpsService;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleLocationDTO>>> Handle (GetAllVehicleLocationsQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting all vehicle locations. OnlineOnly: {OnlineOnly}, GPSEnabledOnly: {GPSEnabledOnly}",
                    request.OnlineOnly, request.GPSEnabledOnly);

                return await _gpsService.GetAllVehicleLocationsAsync (request.OnlineOnly, request.GPSEnabledOnly);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error handling GetAllVehicleLocationsQuery");
                return FMSResponse<List<VehicleLocationDTO>>.Failed ($"Failed to get vehicle locations: {ex.Message}");
            }
        }
    }
}