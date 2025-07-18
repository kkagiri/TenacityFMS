using System.Text.Json;
using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using FMS.Application.Features.Vehicle.Queries.VehicleDashboard;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    public class VehicleController : ControllerBase {

        private readonly IMediator _mediator;
        private readonly IDistributedCache _cache;

        public VehicleController (IMediator mediator, IDistributedCache cache) {
            _mediator = mediator;
            _cache = cache;
        }

        [HttpGet ("simple")]
        public async Task<IActionResult> GetSimpleVehicleList () {
            // Try to get from cache first
            var cacheKey = "SimpleVehicleList";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedVehicles = JsonSerializer.Deserialize<List<VehicleDTO>> (cachedData);
                return Ok (cachedVehicles);
            }

            // If not in cache, get from database
            var query = new GetSimpleVehicleQuery ();
            var vehicles = await _mediator.Send (query);

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (15)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (vehicles), cacheOptions);

            return Ok (vehicles);
        }

        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleList () {
            // Try to get from cache first
            var cacheKey = "VehicleList";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedVehicles = JsonSerializer.Deserialize<List<VehicleDTO>> (cachedData);
                return Ok (cachedVehicles);
            }

            var query = new GetVehicleQuery ();
            var vehicles = await _mediator.Send (query);

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (15)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (vehicles), cacheOptions);

            return Ok (vehicles);
        }

        [HttpGet ("{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleByID (int id) {
            // Try to get from cache first
            var cacheKey = $"Vehicle:{id}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedVehicle = JsonSerializer.Deserialize<VehicleDTO> (cachedData);
                return Ok (cachedVehicle);
            }

            var query = new GetVehicleByIDQuery (id);
            var vehicle = await _mediator.Send (query);
            if (vehicle == null) return NotFound ();

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (30)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (vehicle), cacheOptions);

            return Ok (vehicle);
        }

        [HttpPost]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateVehicle ([FromBody] VehicleDTO vehicleDTO) {
            var hasPermission = User.HasClaim ("permissions", "_CreateVehicle");
            if (!hasPermission) return Forbid ();
            if (!ModelState.IsValid) return BadRequest (ModelState);

            var userIdClaim = User.Claims.FirstOrDefault (c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse (c.Value, out _));

            if (userIdClaim == null) return BadRequest ("Invalid User ID");

            vehicleDTO.CreatedBy = userIdClaim.Value;

            var command = new CreateVehicleCommand (vehicleDTO);
            var result = await _mediator.Send (command);

            if (!result.Success) return BadRequest (result);
            return CreatedAtAction (nameof (GetVehicleByID), new { id = result.Data.VehicleId }, result);
        }

        [HttpPut]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateVehicle ([FromBody] List<VehicleDTO> vehicleDTOs) {
            var hasPermission = User.HasClaim ("permissions", "_EditVehicle");
            if (!hasPermission) return Forbid ();
            if (!ModelState.IsValid) return BadRequest (ModelState);

            var userIdClaim = User.Claims.FirstOrDefault (c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse (c.Value, out _));

            if (userIdClaim == null) return BadRequest ("Invalid User ID");

            foreach (var vehicle in vehicleDTOs) {
                vehicle.ModifiedBy = userIdClaim.Value;
            }

            var command = new UpdateVehiclesCommand (vehicleDTOs);
            var result = await _mediator.Send (command);

            if (result.Success) {
                // Invalidate cache
                await _cache.RemoveAsync ("VehicleList");
                await _cache.RemoveAsync ("SimpleVehicleList");

                // Invalidate individual vehicle caches
                foreach (var vehicle in vehicleDTOs) {
                    if (vehicle.VehicleId > 0)
                        await _cache.RemoveAsync ($"Vehicle:{vehicle.VehicleId}");
                }
            }

            if (!result.Success) return BadRequest (result.Message);
            return Ok (result);
        }

        [HttpPut ("{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateVehicle (int id, [FromBody] VehicleDTO vehicleDTO) {
            var hasPermission = User.HasClaim ("permissions", "_EditVehicle");
            if (!hasPermission) return Forbid ();
            if (!ModelState.IsValid) return BadRequest (ModelState);

            // User ID for tracking who made the change
            var userIdClaim = User.Claims.FirstOrDefault (c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse (c.Value, out _));

            if (userIdClaim == null) return BadRequest ("Invalid User ID");

            // Add the user ID to the vehicle DTO
            vehicleDTO.ModifiedBy = userIdClaim.Value;
            vehicleDTO.VehicleId = id; // Make sure the ID is set correctly

            // Create and send the command
            var command = new UpdateSingleVehicleCommand (vehicleDTO);
            var result = await _mediator.Send (command);

            if (result.Success) {
                // Invalidate cache
                await _cache.RemoveAsync ("VehicleList");
                await _cache.RemoveAsync ("SimpleVehicleList");
                await _cache.RemoveAsync ($"Vehicle:{id}");
            }

            if (!result.Success) return BadRequest (result.Message);
            return Ok (result);
        }

        [HttpDelete ("{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteVehicle (int id) {
            var hasPermission = User.HasClaim ("permissions", "_DeleteVehicle");
            if (!hasPermission) return Forbid ();

            var userIdClaim = User.Claims.FirstOrDefault (c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse (c.Value, out _));

            if (userIdClaim == null) return BadRequest ("Invalid User ID");

            // Add a log entry before deleting
            // Note: userIdClaim.Value would be used for auditing purposes

            var command = new DeleteVehicleCommand (id);
            var result = await _mediator.Send (command);

            if (result.Success) {
                // Invalidate cache
                await _cache.RemoveAsync ("VehicleList");
                await _cache.RemoveAsync ("SimpleVehicleList");
                await _cache.RemoveAsync ($"Vehicle:{id}");
            }

            if (!result.Success) return BadRequest (result.Message);
            return Ok (result);
        }

        [HttpGet ("dashboard/analytics")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDashboardAnalytics () {
            // Try to get from cache first
            var cacheKey = "VehicleDashboardAnalytics";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedAnalytics = JsonSerializer.Deserialize<VehicleDashboardAnalyticsDTO> (cachedData);
                return Ok (cachedAnalytics);
            }

            var query = new GetVehicleDashboardAnalyticsQuery ();
            var analytics = await _mediator.Send (query);

            // Store in cache for 5 minutes (dashboard data changes frequently)
            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (5)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (analytics), cacheOptions);

            return Ok (analytics);
        }

        [HttpGet ("dashboard/metrics")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDashboardMetrics () {
            // Try to get from cache first
            var cacheKey = "VehicleDashboardMetrics";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedMetrics = JsonSerializer.Deserialize<VehicleDashboardMetricsDTO> (cachedData);
                return Ok (cachedMetrics);
            }

            var query = new GetVehicleDashboardMetricsQuery ();
            var metrics = await _mediator.Send (query);

            // Store in cache for 3 minutes
            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (3)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (metrics), cacheOptions);

            return Ok (metrics);
        }

        [HttpGet ("dashboard/status-distribution")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleStatusDistribution () {
            var cacheKey = "VehicleStatusDistribution";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedDistribution = JsonSerializer.Deserialize<List<VehicleStatusDistributionDTO>> (cachedData);
                return Ok (cachedDistribution);
            }

            var query = new GetVehicleStatusDistributionQuery ();
            var distribution = await _mediator.Send (query);

            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (10)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (distribution), cacheOptions);

            return Ok (distribution);
        }

        [HttpGet ("dashboard/fleet-utilization")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetFleetUtilization ([FromQuery] int days = 30) {
            var cacheKey = $"FleetUtilization_{days}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedUtilization = JsonSerializer.Deserialize<FleetUtilizationDTO> (cachedData);
                return Ok (cachedUtilization);
            }

            var query = new GetFleetUtilizationQuery (days);
            var utilization = await _mediator.Send (query);

            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (15)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (utilization), cacheOptions);

            return Ok (utilization);
        }

        [HttpGet ("dashboard/maintenance-alerts")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMaintenanceAlerts () {
            var cacheKey = "VehicleMaintenanceAlerts";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedAlerts = JsonSerializer.Deserialize<List<MaintenanceAlertDTO>> (cachedData);
                return Ok (cachedAlerts);
            }

            var query = new GetVehicleMaintenanceAlertsQuery ();
            var alerts = await _mediator.Send (query);

            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (10)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (alerts), cacheOptions);

            return Ok (alerts);
        }

        [HttpGet ("dashboard/recent-activities")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetRecentActivities ([FromQuery] int limit = 10) {
            var cacheKey = $"VehicleRecentActivities_{limit}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedActivities = JsonSerializer.Deserialize<List<VehicleActivityDTO>> (cachedData);
                return Ok (cachedActivities);
            }

            var query = new GetVehicleRecentActivitiesQuery (limit);
            var activities = await _mediator.Send (query);

            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (2)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (activities), cacheOptions);

            return Ok (activities);
        }

        [HttpGet ("dashboard/performance-metrics")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetPerformanceMetrics ([FromQuery] int days = 7) {
            var cacheKey = $"VehiclePerformanceMetrics_{days}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedMetrics = JsonSerializer.Deserialize<VehiclePerformanceMetricsDTO> (cachedData);
                return Ok (cachedMetrics);
            }

            var query = new GetVehiclePerformanceMetricsQuery (days);
            var metrics = await _mediator.Send (query);

            var cacheOptions = new DistributedCacheEntryOptions {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (15)
            };
            await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (metrics), cacheOptions);

            return Ok (metrics);
        }

        // Helper method to invalidate all dashboard-related cache entries
        private async Task InvalidateDashboardCache () {
            await _cache.RemoveAsync ("VehicleDashboardAnalytics");
            await _cache.RemoveAsync ("VehicleDashboardMetrics");
            await _cache.RemoveAsync ("VehicleStatusDistribution");
            await _cache.RemoveAsync ("VehicleMaintenanceAlerts");

            // Remove pattern-based cache entries (you might need a more sophisticated approach)
            var keysToRemove = new [] {
                "FleetUtilization_",
                "VehicleRecentActivities_",
                "VehiclePerformanceMetrics_"
            };

            // Note: You'll need to implement pattern-based cache removal or keep track of cache keys
            // This is a simplified example
        }

    }
}