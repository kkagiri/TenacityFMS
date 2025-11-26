using System.Text.Json;
using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Queries;
using FMS.Application.Features.Vehicle.Queries.VehicleDashboard;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using FMS.WebClient.Controllers.Base;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class VehicleController : BaseApiController
    {

        private readonly IMediator _mediator;
        private readonly IDistributedCache _cache;

        public VehicleController(IMediator mediator, IDistributedCache cache)
        {
            _mediator = mediator;
            _cache = cache;
        }

        [HttpGet("simple")]
        public async Task<IActionResult> GetSimpleVehicleList()
        {
            // Try to get from cache first
            var cacheKey = "SimpleVehicleList";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedVehicles = JsonSerializer.Deserialize<List<VehicleDTO>>(cachedData);
                return Ok(cachedVehicles);
            }

            // If not in cache, get from database
            var query = new GetSimpleVehicleQuery();
            var vehicles = await _mediator.Send(query);

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(vehicles), cacheOptions);

            return Ok(vehicles);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleList([FromQuery] string? siteIds = null)
        {
            // Try to get from cache first
            var cacheKey = "VehicleList";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedVehicles = JsonSerializer.Deserialize<List<VehicleDTO>>(cachedData);
                if (!string.IsNullOrWhiteSpace(siteIds) && cachedVehicles != null)
                {
                    var set = siteIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToHashSet();
                    if (set.Count > 0)
                        cachedVehicles = cachedVehicles.Where(v => v.WorkingSiteId.HasValue && set.Contains(v.WorkingSiteId.Value)).ToList();
                }
                return Ok(cachedVehicles);
            }

            var query = new GetVehicleQuery();
            var vehicles = await _mediator.Send(query);
            if (!string.IsNullOrWhiteSpace(siteIds) && vehicles != null)
            {
                var set = siteIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id!.Value)
                    .ToHashSet();
                if (set.Count > 0)
                    vehicles = vehicles.Where(v => v.WorkingSiteId.HasValue && set.Contains(v.WorkingSiteId.Value)).ToList();
            }

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(vehicles), cacheOptions);

            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleByID(int id)
        {
            // Try to get from cache first
            var cacheKey = $"Vehicle:{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedVehicle = JsonSerializer.Deserialize<VehicleDTO>(cachedData);
                return Ok(cachedVehicle);
            }

            var query = new GetVehicleByIDQuery(id);
            var vehicle = await _mediator.Send(query);
            if (vehicle == null) return NotFound();

            // Store in cache
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(vehicle), cacheOptions);

            return Ok(vehicle);
        }

        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateVehicle([FromBody] VehicleDTO vehicleDTO)
        {
            var hasPermission = User.HasClaim("permissions", "_CreateVehicle");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdClaim = GetUserIdClaim();
            if (userIdClaim == null) return BadRequest("Invalid User ID");

            vehicleDTO.CreatedBy = userIdClaim.Value;

            var command = new CreateVehicleCommand(vehicleDTO);
            var result = await _mediator.Send(command);

            if (!result.Success) return BadRequest(result);
            return CreatedAtAction(nameof(GetVehicleByID), new { id = result.Data.VehicleId }, result);
        }

        [HttpPut]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateVehicle([FromBody] List<VehicleDTO> vehicleDTOs)
        {
            var hasPermission = User.HasClaim("permissions", "_EditVehicle");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            foreach (var vehicle in vehicleDTOs)
            {
                vehicle.ModifiedBy = userIdClaim.Value;
            }

            var command = new UpdateVehiclesCommand(vehicleDTOs);
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                // Invalidate cache
                await _cache.RemoveAsync("VehicleList");
                await _cache.RemoveAsync("SimpleVehicleList");

                // Invalidate individual vehicle caches
                foreach (var vehicle in vehicleDTOs)
                {
                    if (vehicle.VehicleId > 0)
                        await _cache.RemoveAsync($"Vehicle:{vehicle.VehicleId}");
                }
            }

            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] VehicleDTO vehicleDTO)
        {
            var hasPermission = User.HasClaim("permissions", "_EditVehicle");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // User ID for tracking who made the change
            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            // Add the user ID to the vehicle DTO
            vehicleDTO.ModifiedBy = userIdClaim.Value;
            vehicleDTO.VehicleId = id; // Make sure the ID is set correctly

            // Create and send the command
            var command = new UpdateSingleVehicleCommand(vehicleDTO);
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                // Invalidate cache
                await _cache.RemoveAsync("VehicleList");
                await _cache.RemoveAsync("SimpleVehicleList");
                await _cache.RemoveAsync($"Vehicle:{id}");
            }

            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_DeleteVehicle");
            if (!hasPermission) return Forbid();

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            // Add a log entry before deleting
            // Note: userIdClaim.Value would be used for auditing purposes

            var command = new DeleteVehicleCommand(id);
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                // Invalidate cache
                await _cache.RemoveAsync("VehicleList");
                await _cache.RemoveAsync("SimpleVehicleList");
                await _cache.RemoveAsync($"Vehicle:{id}");
            }

            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }

        [HttpGet("dashboard/analytics")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDashboardAnalytics()
        {
            // Try to get from cache first
            var cacheKey = "VehicleDashboardAnalytics";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedAnalytics = JsonSerializer.Deserialize<FMSResponse<VehicleDashboardAnalyticsDTO>>(cachedData);
                return Ok(cachedAnalytics);
            }

            var query = new GetVehicleDashboardAnalyticsQuery();
            var analytics = await _mediator.Send(query);

            // Store in cache for 5 minutes (dashboard data changes frequently)
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(analytics), cacheOptions);

            return Ok(analytics);
        }

        [HttpGet("dashboard/metrics")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            // Try to get from cache first
            var cacheKey = "VehicleDashboardMetrics";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedMetrics = JsonSerializer.Deserialize<FMSResponse<VehicleDashboardMetricsDTO>>(cachedData);
                return Ok(cachedMetrics);
            }

            var query = new GetVehicleDashboardMetricsQuery();
            var metrics = await _mediator.Send(query);

            // Store in cache for 3 minutes
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(3)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(metrics), cacheOptions);

            return Ok(metrics);
        }

        [HttpGet("dashboard/status-distribution")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleStatusDistribution()
        {
            var cacheKey = "VehicleStatusDistribution";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedDistribution = JsonSerializer.Deserialize<FMSResponse<List<VehicleStatusDistributionDTO>>>(cachedData);
                return Ok(cachedDistribution);
            }

            var query = new GetVehicleStatusDistributionQuery();
            var distribution = await _mediator.Send(query);

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(distribution), cacheOptions);

            return Ok(distribution);
        }

        [HttpGet("dashboard/fleet-utilization")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetFleetUtilization([FromQuery] int days = 30)
        {
            var cacheKey = $"FleetUtilization_{days}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedUtilization = JsonSerializer.Deserialize<FMSResponse<FleetUtilizationDTO>>(cachedData);
                return Ok(cachedUtilization);
            }

            var query = new GetFleetUtilizationQuery(days);
            var utilization = await _mediator.Send(query);

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(utilization), cacheOptions);

            return Ok(utilization);
        }

        [HttpGet("dashboard/maintenance-alerts")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMaintenanceAlerts()
        {
            var cacheKey = "VehicleMaintenanceAlerts";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedAlerts = JsonSerializer.Deserialize<FMSResponse<List<MaintenanceAlertDTO>>>(cachedData);
                return Ok(cachedAlerts);
            }

            var query = new GetVehicleMaintenanceAlertsQuery();
            var alerts = await _mediator.Send(query);

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(alerts), cacheOptions);

            return Ok(alerts);
        }

        [HttpGet("dashboard/recent-activities")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetRecentActivities([FromQuery] int limit = 10)
        {
            var cacheKey = $"VehicleRecentActivities_{limit}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedActivities = JsonSerializer.Deserialize<FMSResponse<List<VehicleActivityDTO>>>(cachedData);
                return Ok(cachedActivities);
            }

            var query = new GetVehicleRecentActivitiesQuery(limit);
            var activities = await _mediator.Send(query);

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(activities), cacheOptions);

            return Ok(activities);
        }

        [HttpGet("dashboard/performance-metrics")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetPerformanceMetrics([FromQuery] int days = 7)
        {
            var cacheKey = $"VehiclePerformanceMetrics_{days}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedMetrics = JsonSerializer.Deserialize<FMSResponse<VehiclePerformanceMetricsDTO>>(cachedData);
                return Ok(cachedMetrics);
            }

            var query = new GetVehiclePerformanceMetricsQuery(days);
            var metrics = await _mediator.Send(query);

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(metrics), cacheOptions);

            return Ok(metrics);
        }

        // Helper method to invalidate all dashboard-related cache entries
        private async Task InvalidateDashboardCache()
        {
            await _cache.RemoveAsync("VehicleDashboardAnalytics");
            await _cache.RemoveAsync("VehicleDashboardMetrics");
            await _cache.RemoveAsync("VehicleStatusDistribution");
            await _cache.RemoveAsync("VehicleMaintenanceAlerts");

            // Remove pattern-based cache entries (you might need a more sophisticated approach)
            var keysToRemove = new[] {
                "FleetUtilization_",
                "VehicleRecentActivities_",
                "VehiclePerformanceMetrics_"
            };

            // Note: You'll need to implement pattern-based cache removal or keep track of cache keys
            // This is a simplified example
        }

        // Vehicle Search Endpoints
        [HttpGet("search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchVehicles(
            [FromQuery] string searchTerm, [FromQuery] int? limit = 10, [FromQuery] string? vehicleType = null, [FromQuery] string? status = null, [FromQuery] string? manufacturer = null, [FromQuery] string? model = null, [FromQuery] bool? isActive = null)
        {
            try
            {
                // Validation
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term is required"));
                }

                // Use a cache key for search results
                var cacheKey = $"VehicleSearch_{searchTerm}_{limit}_{vehicleType}_{status}_{manufacturer}_{model}_{isActive}";
                var cachedData = await _cache.GetStringAsync(cacheKey);

                if (!string.IsNullOrEmpty(cachedData))
                {
                    var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<VehicleDTO>>>(cachedData);
                    return Ok(cachedResult);
                }

                var query = new SearchVehicleQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit,
                    VehicleType = vehicleType,
                    Status = status,
                    Manufacturer = manufacturer,
                    Model = model,
                    IsActive = isActive
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    // Cache for 5 minutes
                    var cacheOptions = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);
                }

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching vehicles", error = ex.Message });
            }
        }

        [HttpGet("quick-search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> QuickSearchVehicles(
            [FromQuery] string searchTerm, [FromQuery] int limit = 10)
        {
            try
            {
                // Validation
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term is required"));
                }

                if (searchTerm.Length < 2)
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term must be at least 2 characters long"));
                }

                // Use a shorter cache timeout for quick searches
                var cacheKey = $"QuickSearch_{searchTerm}_{limit}";
                var cachedData = await _cache.GetStringAsync(cacheKey);

                if (!string.IsNullOrEmpty(cachedData))
                {
                    var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<VehicleDTO>>>(cachedData);
                    return Ok(cachedResult);
                }

                var query = new SearchVehicleQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit
                    // Temporarily remove IsActive filter for debugging
                    // IsActive = true // Only return active vehicles for quick search
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    // Cache for 2 minutes for quick searches
                    var cacheOptions = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);
                }

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error in quick vehicle search", error = ex.Message });
            }
        }

        // DEBUG: Temporary debug endpoint
        [HttpGet("debug-search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DebugSearchVehicles(
            [FromQuery] string searchTerm, [FromQuery] int limit = 10)
        {
            try
            {
                var query = new DebugSearchVehicleQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Debug search error", error = ex.Message });
            }
        }

        [HttpGet("search-by-plate")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchVehiclesByPlate([FromQuery] string plateNumber)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(plateNumber))
                {
                    return BadRequest("Plate number is required");
                }

                var query = new SearchVehicleQuery
                {
                    SearchTerm = plateNumber,
                    Limit = 5
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching by plate", error = ex.Message });
            }
        }

        [HttpGet("search-by-hyoung")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchVehiclesByHyoungNo([FromQuery] string hyoungNo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(hyoungNo))
                {
                    return BadRequest("Hyoung number is required");
                }

                var query = new SearchVehicleQuery
                {
                    SearchTerm = hyoungNo,
                    Limit = 5
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching by Hyoung number", error = ex.Message });
            }
        }

    }
}