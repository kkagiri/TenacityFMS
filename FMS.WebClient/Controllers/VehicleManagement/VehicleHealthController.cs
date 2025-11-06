using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.VehicleManagement
{
    /// <summary>
    /// API Controller for Vehicle Health Monitoring
    /// Tracks vehicle online/offline status, offline reasons, and permanent locations
    /// Integrates with issue tracking for investigation
    /// </summary>
    [ApiController]
    [Route("api/v1/vehicles/health")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class VehicleHealthController : ControllerBase
    {
        private readonly IVehicleHealthMonitorService _healthService;
        private readonly ILogger<VehicleHealthController> _logger;

        public VehicleHealthController(
            IVehicleHealthMonitorService healthService,
            ILogger<VehicleHealthController> logger)
        {
            _healthService = healthService ?? throw new ArgumentNullException(nameof(healthService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Record a health check for a vehicle
        /// </summary>
        /// <param name="request">Health check request</param>
        /// <returns>Health monitor record</returns>
        [HttpPost("check")]
        public async Task<IActionResult> RecordHealthCheck([FromBody] RecordHealthCheckRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { Success = false, Message = "Request cannot be null" });

                var result = await _healthService.RecordHealthCheckAsync(
                    request.VehicleId,
                    request.IsOnline,
                    request.Latitude,
                    request.Longitude,
                    request.Address);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording health check for vehicle {VehicleId}", request?.VehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update offline status for a vehicle
        /// </summary>
        /// <param name="request">Offline status update request</param>
        /// <returns>Updated health monitor record</returns>
        [HttpPut("offline-status")]
        public async Task<IActionResult> UpdateOfflineStatus([FromBody] UpdateVehicleOfflineStatusRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { Success = false, Message = "Request cannot be null" });

                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

                var result = await _healthService.UpdateOfflineStatusAsync(request, username);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating offline status for vehicle {VehicleId}", request?.VehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get latest health status for a vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Latest health status</returns>
        [HttpGet("{vehicleId}/latest")]
        public async Task<IActionResult> GetLatestHealthStatus(int vehicleId)
        {
            try
            {
                var result = await _healthService.GetLatestHealthStatusAsync(vehicleId);

                if (!result.IsSuccess)
                    return NotFound(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest health status for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get health history for a vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="from">Start date (default: 7 days ago)</param>
        /// <param name="to">End date (default: now)</param>
        /// <returns>Health history records</returns>
        [HttpGet("{vehicleId}/history")]
        public async Task<IActionResult> GetHealthHistory(
            int vehicleId,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.AddDays(-7);
                var toDate = to ?? DateTime.UtcNow;

                if (fromDate > toDate)
                    return BadRequest(new { Success = false, Message = "From date cannot be after to date" });

                var result = await _healthService.GetHealthHistoryAsync(vehicleId, fromDate, toDate);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health history for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all currently offline vehicles
        /// </summary>
        /// <returns>List of offline vehicles</returns>
        [HttpGet("offline")]
        public async Task<IActionResult> GetOfflineVehicles()
        {
            try
            {
                var result = await _healthService.GetOfflineVehiclesAsync();

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting offline vehicles");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get long-term offline vehicles (offline for more than specified hours)
        /// </summary>
        /// <param name="hoursThreshold">Hours threshold (default: 24)</param>
        /// <returns>List of long-term offline vehicles</returns>
        [HttpGet("offline/long-term")]
        public async Task<IActionResult> GetLongTermOfflineVehicles([FromQuery] int hoursThreshold = 24)
        {
            try
            {
                if (hoursThreshold < 1)
                    return BadRequest(new { Success = false, Message = "Hours threshold must be at least 1" });

                var result = await _healthService.GetLongTermOfflineVehiclesAsync(hoursThreshold);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting long-term offline vehicles");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get vehicles by offline reason
        /// </summary>
        /// <param name="offlineReason">Offline reason (Workshop, Yard, ToBeReviewed, etc.)</param>
        /// <returns>List of vehicles with specified offline reason</returns>
        [HttpGet("offline/by-reason/{offlineReason}")]
        public async Task<IActionResult> GetVehiclesByOfflineReason(string offlineReason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(offlineReason))
                    return BadRequest(new { Success = false, Message = "Offline reason cannot be empty" });

                var result = await _healthService.GetVehiclesByOfflineReasonAsync(offlineReason);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicles by offline reason {OfflineReason}", offlineReason);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update permanent location for a vehicle
        /// </summary>
        /// <param name="request">Permanent location update request</param>
        /// <returns>Success status</returns>
        [HttpPut("permanent-location")]
        public async Task<IActionResult> UpdatePermanentLocation([FromBody] UpdatePermanentLocationRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { Success = false, Message = "Request cannot be null" });

                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

                var result = await _healthService.UpdatePermanentLocationAsync(
                    request.VehicleId,
                    request.Location,
                    request.WorkingSiteId,
                    username);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating permanent location for vehicle {VehicleId}", request?.VehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Link a vehicle health record to an issue tracking ticket
        /// </summary>
        /// <param name="request">Link request</param>
        /// <returns>Success status</returns>
        [HttpPost("link-issue")]
        public async Task<IActionResult> LinkToIssueTracking([FromBody] LinkToIssueTrackingRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { Success = false, Message = "Request cannot be null" });

                var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";

                var result = await _healthService.LinkToIssueTrackingAsync(
                    request.VehicleId,
                    request.IssueTrackingId,
                    username);

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking to issue tracking for vehicle {VehicleId}", request?.VehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }
    }

    #region Request Models

    /// <summary>
    /// Request model for recording a health check
    /// </summary>
    public class RecordHealthCheckRequest
    {
        [Required]
        public int VehicleId { get; set; }

        [Required]
        public bool IsOnline { get; set; }

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? Address { get; set; }
    }

    /// <summary>
    /// Request model for updating permanent location
    /// </summary>
    public class UpdatePermanentLocationRequest
    {
        [Required]
        public int VehicleId { get; set; }

        [Required]
        public string Location { get; set; } = string.Empty;

        public int? WorkingSiteId { get; set; }
    }

    /// <summary>
    /// Request model for linking to issue tracking
    /// </summary>
    public class LinkToIssueTrackingRequest
    {
        [Required]
        public int VehicleId { get; set; }

        [Required]
        public int IssueTrackingId { get; set; }
    }

    #endregion
}
