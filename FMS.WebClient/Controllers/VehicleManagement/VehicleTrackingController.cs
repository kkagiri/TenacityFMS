using FMS.Application.Features.Vehicle.Queries.VehicleTracking;
using FMS.Application.Features.Vehicle.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/v1/vehicletracking")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class VehicleTrackingController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly IGPSService _gpsService;
        private readonly ILogger<VehicleTrackingController> _logger;

        public VehicleTrackingController (
            IMediator mediator,
            IGPSService gpsService,
            ILogger<VehicleTrackingController> logger) {
            _mediator = mediator;
            _gpsService = gpsService;
            _logger = logger;
        }

        /// <summary>
        /// Get vehicle location by ID for dispatch module
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle location data</returns>
        [HttpGet ("{vehicleId}/location")]
        public async Task<IActionResult> GetVehicleLocation (int vehicleId) {
            try {
                var query = new GetVehicleLocationQuery { VehicleId = vehicleId };
                var result = await _mediator.Send (query);

                if (!result.IsSuccess) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting location for vehicle {VehicleId}", vehicleId);
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get vehicle odometer for maintenance module
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle odometer data</returns>
        [HttpGet ("{vehicleId}/odometer")]
        public async Task<IActionResult> GetVehicleOdometer (int vehicleId) {
            try {
                var query = new GetVehicleOdometerQuery { VehicleId = vehicleId };
                var result = await _mediator.Send (query);

                if (!result.IsSuccess) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting odometer for vehicle {VehicleId}", vehicleId);
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all vehicle locations
        /// </summary>
        /// <param name="onlineOnly">Filter to online vehicles only</param>
        /// <param name="gpsEnabledOnly">Filter to GPS-enabled vehicles only</param>
        /// <returns>List of vehicle locations</returns>
        [HttpGet ("locations")]
        public async Task<IActionResult> GetAllVehicleLocations (
            [FromQuery] bool onlineOnly = false, [FromQuery] bool gpsEnabledOnly = true) {
            try {
            var query = new GetAllVehicleLocationsQuery {
            OnlineOnly = onlineOnly,
            GPSEnabledOnly = gpsEnabledOnly
                };

                var result = await _mediator.Send (query);

                if (!result.IsSuccess) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting all vehicle locations");
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Check if a vehicle is online
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle online status</returns>
        [HttpGet ("{vehicleId}/online-status")]
        public async Task<IActionResult> GetVehicleOnlineStatus (int vehicleId) {
            try {
                var result = await _gpsService.IsVehicleOnlineAsync (vehicleId);

                if (!result.IsSuccess) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking online status for vehicle {VehicleId}", vehicleId);
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Validate GPS connection
        /// </summary>
        /// <returns>Connection status</returns>
        [HttpGet ("connection-status")]
        public async Task<IActionResult> GetConnectionStatus () {
            try {
                var result = await _gpsService.ValidateConnectionAsync ();

                return Ok (new {
                    Success = result.IsSuccess,
                        IsConnected = result.Data,
                        Message = result.IsSuccess ? "GPS connection is healthy" : result.Message,
                        Timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error validating GPS connection");
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get GPS-enabled vehicles summary for dashboard
        /// </summary>
        /// <returns>GPS vehicles summary</returns>
        [HttpGet ("summary")]
        public async Task<IActionResult> GetGPSVehiclesSummary () {
            try {
                var allLocationsQuery = new GetAllVehicleLocationsQuery { GPSEnabledOnly = true };
                var result = await _mediator.Send (allLocationsQuery);

                if (!result.IsSuccess) {
                    return BadRequest (result);
                }

                var vehicles = result.Data ?? new List<FMS.Application.Features.Vehicle.DTOs.VehicleLocationDTO> ();

                var summary = new {
                    TotalGPSVehicles = vehicles.Count,
                    OnlineVehicles = vehicles.Count (v => v.IsOnline),
                    OfflineVehicles = vehicles.Count (v => !v.IsOnline),
                    InTransitVehicles = vehicles.Count (v => v.IsMoving),
                    ParkedVehicles = vehicles.Count (v => v.IsOnline && !v.IsMoving),
                    LastUpdated = DateTime.UtcNow
                };

                return Ok (new {
                    Success = true,
                        Data = summary,
                        Message = "GPS vehicles summary retrieved successfully"
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting GPS vehicles summary");
                return StatusCode (500, new { Success = false, Message = "Internal server error" });
            }
        }
    }
}