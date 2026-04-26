using System.ComponentModel.DataAnnotations;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Queries;

public record SearchVehicleQuery : IRequest<FMSResponse<List<VehicleDto>>> {
    [Required]
    public string SearchTerm { get; init; } = string.Empty;

    public int? Limit { get; init; } = 10;

    public string? VehicleType { get; init; }

    public string? Status { get; init; }

    public string? Manufacturer { get; init; }

    public string? Model { get; init; }

    public bool? IsActive { get; init; }
}

public class SearchVehicleQueryHandler : IRequestHandler<SearchVehicleQuery, FMSResponse<List<VehicleDto>>> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<SearchVehicleQueryHandler> _logger;

    public SearchVehicleQueryHandler (GpsdataContext context, IMapper mapper, ILogger<SearchVehicleQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleDto>>> Handle (SearchVehicleQuery request, CancellationToken cancellationToken) {
        try {
            // Validation checks
            if (string.IsNullOrWhiteSpace (request.SearchTerm)) {
                return FMSResponse<List<VehicleDto>>.Failure (
                    FMSResponseMessage.ValidationError,
                    "Search term is required"
                );
            }

            if (request.SearchTerm.Length < 2) {
                return FMSResponse<List<VehicleDto>>.Failure (
                    FMSResponseMessage.ValidationError,
                    "Search term must be at least 2 characters long"
                );
            }

            if (request.Limit.HasValue && (request.Limit <= 0 || request.Limit > 100)) {
                return FMSResponse<List<VehicleDto>>.Failure (
                    FMSResponseMessage.ValidationError,
                    "Limit must be between 1 and 100"
                );
            }

            var searchTerm = request.SearchTerm.ToLower ().Trim ();
            var query = _context.Vehicles
                .Include (x => x.DefaultExptdAvg != null ? x.DefaultExptdAvg.ExpectedAverageClassification : null)
                .Include (x => x.Tags)
                .Where (v =>
                    v.VehicleCode.ToLower ().Contains (searchTerm) ||
                    v.NumberPlate.ToLower ().Contains (searchTerm) ||
                    (v.VehicleModel != null && v.VehicleModel.ToLower ().Contains (searchTerm)) ||
                    (v.VehicleManufacturer != null && v.VehicleManufacturer.ToLower ().Contains (searchTerm))
                );

            // Apply additional filters
            if (!string.IsNullOrWhiteSpace (request.VehicleType)) {
                query = query.Where (v => v.VehicleType != null &&
                    v.VehicleType.ToLower ().Contains (request.VehicleType.ToLower ()));
            }

            if (!string.IsNullOrWhiteSpace (request.Status)) {
                query = query.Where (v => v.Status != null &&
                    v.Status.ToLower () == request.Status.ToLower ());
            }

            if (!string.IsNullOrWhiteSpace (request.Manufacturer)) {
                query = query.Where (v => v.VehicleManufacturer != null &&
                    v.VehicleManufacturer.ToLower ().Contains (request.Manufacturer.ToLower ()));
            }

            if (!string.IsNullOrWhiteSpace (request.Model)) {
                query = query.Where (v => v.VehicleModel != null &&
                    v.VehicleModel.ToLower ().Contains (request.Model.ToLower ()));
            }

            if (request.IsActive.HasValue) {
                query = query.Where (v => v.IsActive == request.IsActive.Value);
            }

            // Apply limit and execute query
            var limit = request.Limit ?? 10;
            var results = await query
                .Take (limit)
                .ProjectTo<VehicleDto> (_mapper.ConfigurationProvider)
                .ToListAsync (cancellationToken);

            _logger.LogInformation ($"Vehicle search for '{request.SearchTerm}' returned {results.Count} results");

            return FMSResponse<List<VehicleDto>>.Success (
                results,
                $"Found {results.Count} vehicle(s) matching '{request.SearchTerm}'"
            );
        } catch (Exception ex) {
            _logger.LogError (ex, "Error searching vehicles with term: {SearchTerm}", request.SearchTerm);

            return FMSResponse<List<VehicleDto>>.Failure (
                FMSResponseMessage.SystemError,
                $"Error searching vehicles: {ex.Message}"
            );
        }
    }
}

using System.Text.Json;
using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Queries;
using FMS.Application.Features.Vehicle.Queries.VehicleDashboard;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

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

        [HttpGet ("search")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchVehicles ([FromQuery] string? query = null, [FromQuery] int? vehicleTypeId = null, [FromQuery] int? vehicleManufacturerId = null, [FromQuery] int? workingSiteId = null, [FromQuery] bool? hasGPS = null, [FromQuery] bool? isActive = null, [FromQuery] int? yearFrom = null, [FromQuery] int? yearTo = null, [FromQuery] bool? isCompanyVehicle = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50) {
            // Validate page size to prevent excessive data retrieval
            if (pageSize > 100) pageSize = 100;
            if (pageSize < 1) pageSize = 10;
            if (pageNumber < 1) pageNumber = 1;

            // Create cache key based on search parameters
            var cacheKey = $"VehicleSearch:{query}:{vehicleTypeId}:{vehicleManufacturerId}:{workingSiteId}:{hasGPS}:{isActive}:{yearFrom}:{yearTo}:{isCompanyVehicle}:{pageNumber}:{pageSize}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedResult = JsonSerializer.Deserialize<List<VehicleDTO>> (cachedData);
                return Ok (new { success = true, data = cachedResult, message = "Search results retrieved from cache" });
            }

            var searchQuery = new SearchVehicleQuery {
                SearchTerm = query,
                VehicleTypeId = vehicleTypeId,
                VehicleManufacturerId = vehicleManufacturerId,
                WorkingSiteId = workingSiteId,
                HasGPS = hasGPS,
                IsActive = isActive,
                YearFrom = yearFrom,
                YearTo = yearTo,
                IsCompanyVehicle = isCompanyVehicle,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var result = await _mediator.Send (searchQuery);

            if (result.IsSuccess) {
                // Cache the results for 5 minutes (search results can change frequently)
                var cacheOptions = new DistributedCacheEntryOptions {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (5)
                };
                await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (result.Data), cacheOptions);

                return Ok (new { success = result.IsSuccess, data = result.Data, message = result.Message });
            }

            return BadRequest (new { success = result.IsSuccess, message = result.Message, errors = result.ValidationErrors });
        }

        [HttpGet ("quick-search")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> QuickSearchVehicles ([FromQuery] string q, [FromQuery] int limit = 10) {
            if (string.IsNullOrWhiteSpace (q) || q.Length < 2) {
                return Ok (new { success = true, data = new List<VehicleDTO> (), message = "Search term must be at least 2 characters" });
            }

            // Cache key for quick search
            var cacheKey = $"VehicleQuickSearch:{q}:{limit}";
            var cachedData = await _cache.GetStringAsync (cacheKey);

            if (!string.IsNullOrEmpty (cachedData)) {
                var cachedResult = JsonSerializer.Deserialize<List<VehicleDTO>> (cachedData);
                return Ok (new { success = true, data = cachedResult, message = "Quick search results from cache" });
            }

            var searchQuery = new SearchVehicleQuery {
                SearchTerm = q,
                PageNumber = 1,
                PageSize = limit
            };

            var result = await _mediator.Send (searchQuery);

            if (result.IsSuccess) {
                // Cache quick search results for 2 minutes
                var cacheOptions = new DistributedCacheEntryOptions {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes (2)
                };
                await _cache.SetStringAsync (cacheKey, JsonSerializer.Serialize (result.Data), cacheOptions);

                return Ok (new { success = result.IsSuccess, data = result.Data, message = result.Message });
            }

            return BadRequest (new { success = result.IsSuccess, message = result.Message });
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

import axiosInstance from "../../api/axiosInstance";

// Action types for vehicle search
export const SEARCH_VEHICLES_REQUEST = "SEARCH_VEHICLES_REQUEST";
export const SEARCH_VEHICLES_SUCCESS = "SEARCH_VEHICLES_SUCCESS";
export const SEARCH_VEHICLES_FAILURE = "SEARCH_VEHICLES_FAILURE";
export const CLEAR_SEARCH_RESULTS = "CLEAR_SEARCH_RESULTS";

// Search vehicles action
export const searchVehicles = (searchTerm, filters = { }) => async (dispatch) => {
    try {
        dispatch ({ type : SEARCH_VEHICLES_REQUEST });

        // Use the backend search endpoint
        const response = await axiosInstance.get ('/vehicle/search', {
            params: {
                query : searchTerm,
                ...filters
            }
        });

        const result = response.data;
        if (result.success) {
            dispatch ({
                type : SEARCH_VEHICLES_SUCCESS,
                payload : result.data
            });

            return {
                success : true,
                data : result.data,
                message : result.message
            };
        } else {
            dispatch ({
                type : SEARCH_VEHICLES_FAILURE,
                payload : result.message
            });

            return {
                success : false,
                data: [],
                message : result.message
            };
        }
    } catch (error) {
        console.error ('Error searching vehicles:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to search vehicles';

        dispatch ({
            type : SEARCH_VEHICLES_FAILURE,
            payload : errorMessage
        });

        return {
            success : false,
            data: [],
            message : errorMessage
        };
    }
};

// Clear search results action
export const clearSearchResults = () => ({
    type : CLEAR_SEARCH_RESULTS
});

// Quick search for autocomplete suggestions
export const quickSearchVehicles = async (searchTerm, limit = 10) => {
    try {
    if (!searchTerm || searchTerm.length < 2) {
    return {
    success : true,
    data: [],
    message: "Search term must be at least 2 characters"
            };
        }

        // Use the backend quick search endpoint
        const response = await axiosInstance.get ('/vehicle/quick-search', {
            params: {
                q : searchTerm,
                limit : limit
            }
        });

        const result = response.data;
        if (result.success) {
            return {
                success : true,
                data : result.data,
                message : result.message
            };
        } else {
            return {
                success : false,
                data: [],
                message : result.message
            };
        }
    } catch (error) {
        console.error ('Error in quick search:', error);
        return {
            success : false,
            data: [],
            message : error.response?.data?.message || 'Quick search failed'
        };
    }
};

// Advanced search with multiple criteria
export const advancedVehicleSearch = (criteria) => async (dispatch) => {
    try {
        dispatch ({ type : SEARCH_VEHICLES_REQUEST });

        // Use the backend advanced search endpoint
        const response = await axiosInstance.get ('/vehicle/search', {
            params: {
                query : criteria.searchTerm || '',
                vehicleTypeId : criteria.vehicleType,
                vehicleManufacturerId : criteria.manufacturer,
                workingSiteId : criteria.workingSite,
                hasGPS : criteria.hasGPS,
                isActive : criteria.isActive,
                yearFrom : criteria.yearFrom,
                yearTo : criteria.yearTo,
                isCompanyVehicle : criteria.isCompanyVehicle,
                pageNumber : criteria.pageNumber || 1,
                pageSize : criteria.pageSize || 50
            }
        });

        const result = response.data;
        if (result.success) {
            dispatch ({
                type : SEARCH_VEHICLES_SUCCESS,
                payload : result.data
            });

            return {
                success : true,
                data : result.data,
                message : result.message
            };
        } else {
            dispatch ({
                type : SEARCH_VEHICLES_FAILURE,
                payload : result.message
            });

            return {
                success : false,
                data: [],
                message : result.message
            };
        }
    } catch (error) {
        console.error ('Error in advanced vehicle search:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to perform advanced search';

        dispatch ({
            type : SEARCH_VEHICLES_FAILURE,
            payload : errorMessage
        });

        return {
            success : false,
            data: [],
            message : errorMessage
        };
    }
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickSearchVehicles } from '../../../redux/actions/vehicleSearchActions';
import './VehicleSearchBar.scss';

const VehicleSearchBar = ({ placeholder = "Search vehicles..." }) => {
        const navigate = useNavigate ();
        const searchRef = useRef (null);
        const timeoutRef = useRef (null);
        const isComponentMounted = useRef (true);

        const [searchTerm, setSearchTerm] = useState ('');
        const [suggestions, setSuggestions] = useState ([]);
        const [showSuggestions, setShowSuggestions] = useState (false);
        const [selectedIndex, setSelectedIndex] = useState (-1);
        const [isLoading, setIsLoading] = useState (false);
        const [isNavigating, setIsNavigating] = useState (false);

        // Cleanup function
        useEffect (() => {
            isComponentMounted.current = true;
            return () => {
                isComponentMounted.current = false;
                if (timeoutRef.current) {
                    clearTimeout (timeoutRef.current);
                    timeoutRef.current = null;
                }
            };
        }, []);

        // Search for vehicles using backend API
        useEffect (() => {
            // Skip search if currently navigating
            if (isNavigating) return;

            const searchVehicles = async () => {
                if (!isComponentMounted.current || isNavigating) return;

                const trimmedTerm = searchTerm.trim ();

                if (trimmedTerm.length >= 2) {
                    setIsLoading (true);
                    try {
                        const result = await quickSearchVehicles (trimmedTerm, 10);
                        if (isComponentMounted.current && !isNavigating && result.success) {
                            setSuggestions (result.data || []);
                            setShowSuggestions (true);
                            setSelectedIndex (-1);
                        } else if (isComponentMounted.current && !isNavigating) {
                            setSuggestions ([]);
                            setShowSuggestions (false);
                        }
                    } catch (error) {
                        console.error ('Error searching vehicles:', error);
                        if (isComponentMounted.current && !isNavigating) {
                            setSuggestions ([]);
                            setShowSuggestions (false);
                        }
                    } finally {
                        if (isComponentMounted.current && !isNavigating) {
                            setIsLoading (false);
                        }
                    }
                } else if (isComponentMounted.current && !isNavigating && trimmedTerm.length == = 0) {
                    // Only clear suggestions when search term is completely empty
                    setSuggestions ([]);
                    setShowSuggestions (false);
                    setIsLoading (false);
                }
            };

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout (timeoutRef.current);
                timeoutRef.current = null;
            }

            // Only set timeout for meaningful searches or empty string
            const trimmedTerm = searchTerm.trim ();
            if (trimmedTerm.length >= 2 || trimmedTerm.length == = 0) {
                timeoutRef.current = setTimeout (searchVehicles, 300);
            }

            return () => {
                if (timeoutRef.current) {
                    clearTimeout (timeoutRef.current);
                    timeoutRef.current = null;
                }
            };
        }, [searchTerm, isNavigating]);

        // Handle click outside to close suggestions
        useEffect (() => {
            const handleClickOutside = (event) => {
                if (isComponentMounted.current &&
                    searchRef.current &&
                    !searchRef.current.contains (event.target)) {
                    setShowSuggestions (false);
                    setSelectedIndex (-1);
                }
            };

            if (showSuggestions && isComponentMounted.current) {
                // Use a small delay to ensure DOM is ready
                const timeoutId = setTimeout (() => {
                    document.addEventListener ('mousedown', handleClickOutside);
                }, 0);

                return () => {
                    clearTimeout (timeoutId);
                    document.removeEventListener ('mousedown', handleClickOutside);
                };
            }

            return () => {
                document.removeEventListener ('mousedown', handleClickOutside);
            };
        }, [showSuggestions]);

        const handleInputChange = useCallback ((e) => {
            if (!isNavigating && isComponentMounted.current) {
                setSearchTerm (e.target.value);
            }
        }, [isNavigating]);

        const handleSuggestionClick = useCallback ((vehicle) => {
                    if (!isComponentMounted.current || !vehicle || !vehicle.vehicleId || isNavigating) {
                        console.error ('Invalid vehicle object or component unmounted:', vehicle);
                        return;
                    }

                    // Set navigation flag to prevent further state updates
                    setIsNavigating (true);

                    // Use a flag to prevent unnecessary updates during navigation
                    const vehicleId = vehicle.vehicleId;

                    // Clear search state in a single batch update
                    setSearchTerm ('');
                    setShowSuggestions (false);
                    setSelectedIndex (-1);
                    setSuggestions ([]);

                    // Navigate to vehicle details
                    navigate (` / vehicles / ${vehicleId}/details`);

    // Reset navigation flag after a brief delay
    setTimeout (() => {
      if (isComponentMounted.current) {
        setIsNavigating (false);
      }
    }, 100);
  }, [isNavigating, navigate]);  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault ();
        setSelectedIndex (prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault ();
        setSelectedIndex (prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault ();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick (suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions (false);
        setSelectedIndex (-1);
        break;
      default:
        break;
    }
  };

  const highlightText = (text, search) => {
    if (!text || !search.trim ()) return text || '';

    try {
      const regex = new RegExp (`(${search})`, 'gi');
      const parts = text.split (regex);

      return parts.map ((part, index) =>
        regex.test (part) ? (
          <span key={index} className="tw-bg-yellow-200 tw-font-semibold">
            {part}
          </span>
        ) : part
      );
    } catch (error) {
      console.error ('Error highlighting text:', error);
      return text;
    }
  };

  return (
    <div className="
                            vehicle - search - bar " ref={searchRef}>
      <div className="
                            search - input - container ">
        <div className="
                            search - icon ">🔍</div>
        <input
          type="
                            text "
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !isNavigating && searchTerm.length >= 2 && isComponentMounted.current && setShowSuggestions (true)}
          className="
                            tw - border tw - rounded - lg tw - px - 4 tw - py - 2 tw - pl - 10 tw - text - sm tw - w - full tw - outline - none focus: tw - border - blue - 500 "
          disabled={isLoading || isNavigating}
        />
        {isLoading && (
          <div className="
                            loading - icon ">⏳</div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="
                            suggestions - dropdown ">
          <div className="
                            suggestions - header ">
            <span className="
                            tw - text - xs tw - text - gray - 500 tw - font - medium ">
              Found {suggestions.length} vehicle{suggestions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {suggestions.map ((vehicle, index) => {
            if (!vehicle || !vehicle.vehicleId) {
              console.warn ('Invalid vehicle in suggestions:', vehicle);
              return null;
            }

            return (
              <div
                key={vehicle.vehicleId}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick (vehicle)}
              >
                <div className="
                            suggestion - content ">
                  <div className="
                            vehicle - primary ">
                    <span className="
                            vehicle - icon ">🚛</span>
                    <span className="
                            vehicle - name ">
                      {highlightText (vehicle.vehicleCode || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`, searchTerm)}
                    </span>
                  </div>
                  <div className="
                            vehicle - secondary ">
                    {vehicle.numberPlate && vehicle.vehicleCode !== vehicle.numberPlate && (
                      <span className="
                            tw - text - gray - 600 tw - text - xs ">
                        Plate: {highlightText (vehicle.numberPlate, searchTerm)}
                      </span>
                    )}
                    {vehicle.tags && Array.isArray (vehicle.tags) && vehicle.tags.length > 0 && (
                      <div className="
                            tw - flex tw - gap - 1 tw - mt - 1 ">
                        {vehicle.tags.slice (0, 2).map ((tag, tagIndex) => (
                          <span key={tagIndex} className="
                            tw - bg - gray - 100 tw - text - xs tw - px - 2 tw - py - 1 tw - rounded ">
                            {highlightText (tag.tagName || tag, searchTerm)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="
                            arrow - icon ">→</span>
              </div>
            );
          }).filter (Boolean)}
        </div>
      )}

      {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="
                            suggestions - dropdown ">
          <div className="
                            suggestion - item no - results ">
            <div className="
                            tw - text - gray - 400 tw - mr - 2 ">🔍</div>
            <span className="
                            tw - text - gray - 500 ">No vehicles found for " { searchTerm }
                            "</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSearchBar;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickSearchVehicles } from '../../../redux/actions/vehicleSearchActions';
import './VehicleSearchBar.scss';

const VehicleSearchBar = ({ placeholder = "
                            Search by vehicles, site, passenger..." }) => {
  const navigate = useNavigate ();
  const searchRef = useRef (null);
  const timeoutRef = useRef (null);
  const isMountedRef = useRef (true);

  const [searchTerm, setSearchTerm] = useState ('');
  const [suggestions, setSuggestions] = useState ([]);
  const [showSuggestions, setShowSuggestions] = useState (false);
  const [selectedIndex, setSelectedIndex] = useState (-1);
  const [isLoading, setIsLoading] = useState (false);

  // Cleanup on unmount
  useEffect (() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout (timeoutRef.current);
      }
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback (async (term) => {
    if (!isMountedRef.current || !term || term.length < 2) {
      if (isMountedRef.current) {
        setSuggestions ([]);
        setShowSuggestions (false);
        setIsLoading (false);
      }
      return;
    }

    setIsLoading (true);

    try {
      const result = await quickSearchVehicles (term, 10);

      if (!isMountedRef.current) return;

      if (result.success && Array.isArray (result.data)) {
        setSuggestions (result.data);
        setShowSuggestions (result.data.length > 0);
        setSelectedIndex (-1);
      } else {
        setSuggestions ([]);
        setShowSuggestions (false);
      }
    } catch (error) {
      console.error ('Search error:', error);
      if (isMountedRef.current) {
        setSuggestions ([]);
        setShowSuggestions (false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading (false);
      }
    }
  }, []);

  // Handle search term changes
  useEffect (() => {
    if (timeoutRef.current) {
      clearTimeout (timeoutRef.current);
    }

    timeoutRef.current = setTimeout (() => {
      debouncedSearch (searchTerm);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout (timeoutRef.current);
      }
    };
  }, [searchTerm, debouncedSearch]);

  // Handle click outside
  useEffect (() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains (event.target)) {
        setShowSuggestions (false);
        setSelectedIndex (-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener ('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener ('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleInputChange = useCallback ((e) => {
    const value = e.target.value;
    setSearchTerm (value);

    if (value.length === 0) {
      setSuggestions ([]);
      setShowSuggestions (false);
      setSelectedIndex (-1);
    }
  }, []);

  const handleSuggestionClick = useCallback ((vehicle) => {
    if (!vehicle?.vehicleId) return;

    setSearchTerm ('');
    setShowSuggestions (false);
    setSelectedIndex (-1);

    // Use requestAnimationFrame for better performance
    requestAnimationFrame (() => {
      navigate (`/vehicles/${vehicle.vehicleId}/details`);
    });
  }, [navigate]);

  const handleKeyDown = useCallback ((e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault ();
        setSelectedIndex (prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault ();
        setSelectedIndex (prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault ();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick (suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions (false);
        setSelectedIndex (-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, handleSuggestionClick]);

  const highlightText = useCallback ((text, search) => {
    if (!text || !search) return text || '';

    try {
      const parts = text.split (new RegExp (`(${search})`, 'gi'));
      return parts.map ((part, i) =>
        part.toLowerCase () === search.toLowerCase () ? (
          <mark key={i} className="
                            tw - bg - yellow - 200 ">{part}</mark>
        ) : part
      );
    } catch {
      return text;
    }
  }, []);

  return (
    <div className="
                            vehicle - search - bar " ref={searchRef}>
      <div className="
                            search - input - container ">
        <span className="
                            search - icon " aria-hidden="
                            true ">🔍</span>
        <input
          type="
                            text "
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="
                            tw - border tw - rounded - lg tw - px - 4 tw - py - 2 tw - pl - 10 tw - text - sm tw - w - full tw - outline - none focus: tw - border - blue - 500 "
          autoComplete="
                            off "
        />
        {isLoading && (
          <span className="
                            loading - icon " aria-hidden="
                            true ">⏳</span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="
                            suggestions - dropdown ">
          <div className="
                            suggestions - header ">
            <span className="
                            tw - text - xs tw - text - gray - 500 ">
              {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
            </span>
          </div>
          {suggestions.map ((vehicle, index) => (
            <div
              key={`${vehicle.vehicleId}-${index}`}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick (vehicle)}
              role="
                            option "
              aria-selected={index === selectedIndex}
            >
              <div className="
                            suggestion - content ">
                <div className="
                            vehicle - primary ">
                  <span className="
                            vehicle - icon " aria-hidden="
                            true ">🚛</span>
                  <span className="
                            vehicle - name ">
                    {highlightText (
                      vehicle.vehicleCode || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`,
                      searchTerm
                    )}
                  </span>
                </div>
                {vehicle.numberPlate && vehicle.vehicleCode !== vehicle.numberPlate && (
                  <div className="
                            vehicle - secondary ">
                    <span className="
                            tw - text - gray - 600 tw - text - xs ">
                      Plate: {highlightText (vehicle.numberPlate, searchTerm)}
                    </span>
                  </div>
                )}
              </div>
              <span className="
                            arrow - icon " aria-hidden="
                            true ">→</span>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="
                            suggestions - dropdown ">
          <div className="
                            suggestion - item no - results ">
            <span aria-hidden="
                            true ">🔍</span>
            <span className="
                            tw - text - gray - 500 ">No vehicles found</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSearchBar;


import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TabPanel } from 'devextreme-react/tab-panel';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Popup } from 'devextreme-react/popup';

// Import tab components
import VehicleEditForm from './component/VehicleEditForm';
import VehicleConsumptionHistory from './component/VehicleConsumptionHistory';
import VehicleMaintenanceHistory from './component/VehicleMaintenanceHistory';
import VehicleFuelingHistory from './component/VehicleFuelingHistory';
import VehicleSchedules from './component/VehicleSchedules';
import VehicleInsuranceLicense from './component/VehicleInsuranceLicense';

// Import popup components
import TagAssignmentForm from '../../components/Tags/TagAssignmentForm/TagAssignmentForm';
import ExpectedAverageForm from './component/ExpectedAverageForm';

// Services
import { getVehicleById, deleteVehicle } from '../../redux/actions/vehicleActions';
import { fetchTags } from '../../redux/actions/tagActions';
import { fetchSiteList } from '../../redux/actions/siteActions';

import './VehicleDetails.scss';

const VehicleDetails = () => {
  const { id } = useParams ();
  const navigate = useNavigate ();
  const dispatch = useDispatch ();

  // Redux state
  const vehicles = useSelector ((state) => state.vehicle.vehicles);
  const tags = useSelector ((state) => state.tag.tags);
  const sites = useSelector ((state) => state.site.sites); // Used in SiteAssignmentForm component
  // No longer used but will be needed when site form is implemented

  // Local state
  const [vehicle, setVehicle] = useState (null);
  const [isLoading, setIsLoading] = useState (true);
  const [activeTab, setActiveTab] = useState (0);
  const [showTagPopup, setShowTagPopup] = useState (false);
  const [showSitePopup, setShowSitePopup] = useState (false);
  const [showExpectedAvgPopup, setShowExpectedAvgPopup] = useState (false);
  const [tabLoadingStates, setTabLoadingStates] = useState ({
    0 : true, // Vehicle Information tab starts loading
    // Other tabs will be set to true only when selected
  });
  const [tabDataLoaded, setTabDataLoaded] = useState ({ }); // Track which tabs have loaded their data
  const [dataLoaded, setDataLoaded] = useState (false); // Track if vehicle data is loaded

  // Reset component state when vehicle ID changes
  useEffect (() => {
    setDataLoaded (false);
    setVehicle (null);
    setTabDataLoaded ({ });
    setTabLoadingStates ({
      0 : true,
    });
    setActiveTab (0);
  }, [id]);

  // Load vehicle data - Fixed dependencies and optimized
  useEffect (() => {
    const loadVehicleData = async () => {
      if (dataLoaded) return; // Prevent re-loading

      try {
        setIsLoading (true);

        // Try to get vehicle from existing state first
        let vehicleData = vehicles.find (v => v.vehicleId === parseInt (id));

        if (!vehicleData) {
          // If not in state, fetch from API
          const response = await dispatch (getVehicleById (id));
          vehicleData = response.data;
        }

        setVehicle (vehicleData);

        // Ensure supporting data is loaded
        await Promise.all ([
          dispatch (fetchTags ()),
          dispatch (fetchSiteList ())
        ]);

        setDataLoaded (true); // Mark as loaded

        // Mark first tab as loaded
        setTabLoadingStates (prev => ({
          ...prev,
          0 : false
        }));

        setTabDataLoaded (prev => ({
          ...prev,
          0 : true
        }));

      } catch (error) {
        console.error ('Error loading vehicle data:', error);
        notify ('Error loading vehicle data', 'error', 3000);
      } finally {
        setIsLoading (false);
      }
    };

    if (id && !dataLoaded) { // Only load if not already loaded
      loadVehicleData ();
    }
  }, [id, dispatch, dataLoaded, vehicles]);

  // Quick action handlers
  const handleAssignTag = () => {
    setShowTagPopup (true);
  };

  // Site popup handler (will be used when SiteAssignmentForm is implemented)
  const handleChangeSite = () => {
    setShowSitePopup (true);
  };

  const handleAssignExpectedAverage = () => {
    setShowExpectedAvgPopup (true);
  };

  // Helper function to navigate to fueling history tab
  const handleViewFuelHistory = () => {
    // Navigate to the fuel history tab
    setActiveTab (3); // Fueling History tab
  };

  const handleGenerateReport = () => {
    // Implement report generation
    notify ('Report generation feature coming soon', 'info', 3000);
  };

  const handleBackToList = () => {
    navigate ('/vehicles/fleet');
  };

  const handleDelete = async () => {
    const confirmed = window.confirm (`Are you sure you want to delete vehicle ${vehicle.vehicleCode} - ${vehicle.numberPlate}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await dispatch (deleteVehicle (id));

      if (response && response.success) {
        notify ('Vehicle deleted successfully', 'success', 3000);
        navigate ('/vehicles');
      } else {
        throw new Error (response?.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error ('Error deleting vehicle:', error);
      notify ('Failed to delete vehicle', 'error', 3000);
    }
  };

  // Vehicle metrics calculation (memoized for performance)
  const vehicleMetrics = useMemo (() => {
    if (!vehicle) return { };

    return {
      totalFuel : vehicle.totalFuelConsumed || 0,
      totalDistance : vehicle.totalDistance || 0,
      avgEfficiency : vehicle.avgEfficiency || 0,
      lastActivity : vehicle.lastActivity || 'N/A',
      status : vehicle.isActive ? 'Active' : 'Inactive',
      gpsStatus : vehicle.hasGPSInstalled ? 'Installed' : 'Not Installed'
    };
  }, [vehicle]);

  // Handle tab selection with loading state - Optimized for lazy loading
  const handleTabSelectionChange = useCallback ((e) => {
    const newTabIndex = e.selectedIndex;
    setActiveTab (newTabIndex);

    // Only set loading state if we haven't loaded this tab's data before
    if (!tabDataLoaded[newTabIndex]) {
      setTabLoadingStates (prev => ({
        ...prev,
        [newTabIndex] : true
      }));

      // Mark tab as loaded after a short delay to simulate loading
      // In a real implementation, this would be set when data loading completes
      setTimeout (() => {
        setTabLoadingStates (prev => ({
          ...prev,
          [newTabIndex] : false
        }));

        setTabDataLoaded (prev => ({
          ...prev,
          [newTabIndex] : true
        }));
      }, 500);
    }
  }, [tabDataLoaded]);

  // Vehicle save handler - Stable reference
  const handleVehicleSave = useCallback ((data) => {
    setVehicle (prevVehicle => ({ ...prevVehicle, ...data }));
    notify ('Vehicle updated successfully', 'success', 3000);
  }, []);  // Create individual memoized components to prevent unnecessary re-renders
  const vehicleEditFormComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[0]) return null;
    return (
      <VehicleEditForm
        key={`vehicle-form-${vehicle?.vehicleId}`}
        vehicle={vehicle}
        isEditing={false}
        onSave={handleVehicleSave}
      />
    );
  }, [vehicle, handleVehicleSave, tabLoadingStates]);

  const consumptionHistoryComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[1]) return null;
    return <VehicleConsumptionHistory key={`consumption-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const maintenanceHistoryComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[2]) return null;
    return <VehicleMaintenanceHistory key={`maintenance-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const fuelingHistoryComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[3]) return null;
    return <VehicleFuelingHistory key={`fueling-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const schedulesComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[4]) return null;
    return <VehicleSchedules key={`schedules-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const insuranceLicenseComponent = useMemo (() => {
    if (!vehicle || tabLoadingStates[5]) return null;
    return <VehicleInsuranceLicense key={`insurance-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  // Memoize tab items with stable dependencies
  const tabItems = useMemo (() => {
    if (!vehicle) return [];

    // Loading spinner component reused for all tabs
    const loadingSpinner = (title) => (
      <div className="
                            tw - flex tw - items - center tw - justify - center tw - h - 64 ">
        <div className="
                            tw - text - center ">
          <i className="
                            fa - light fa - spinner fa - spin tw - text - 4 xl tw - text - blue - 600 tw - mb - 4 "></i>
          <p className="
                            tw - text - gray - 600 ">Loading {title.toLowerCase ()}...</p>
        </div>
      </div>
    );

    return [
      {
        title: 'Vehicle Information',
        icon: 'fa-solid fa-edit',
        component : tabLoadingStates[0] ? loadingSpinner ('vehicle information') : vehicleEditFormComponent
      },
      {
        title: 'Consumption History',
        icon: 'fa-solid fa-gas-pump',
        component : tabLoadingStates[1] ? loadingSpinner ('consumption history') : consumptionHistoryComponent
      },
      {
        title: 'Maintenance History',
        icon: 'fa-solid fa-wrench',
        component : tabLoadingStates[2] ? loadingSpinner ('maintenance history') : maintenanceHistoryComponent
      },
      {
        title: 'Fueling History',
        icon: 'fa-solid fa-pump',
        component : tabLoadingStates[3] ? loadingSpinner ('fueling history') : fuelingHistoryComponent
      },
      {
        title: 'Schedules',
        icon: 'fa-solid fa-calendar',
        component : tabLoadingStates[4] ? loadingSpinner ('schedules') : schedulesComponent
      },
      {
        title: 'Insurance & License',
        icon: 'fa-solid fa-shield-check',
        component : tabLoadingStates[5] ? loadingSpinner ('insurance & license info') : insuranceLicenseComponent
      }
    ];
  }, [
    vehicle,
    vehicleEditFormComponent,
    consumptionHistoryComponent,
    maintenanceHistoryComponent,
    fuelingHistoryComponent,
    schedulesComponent,
    insuranceLicenseComponent,
    tabLoadingStates
  ]);


  if (isLoading) {
    return (
      <div className="
                            tw - flex tw - justify - center tw - items - center tw - h - screen ">
        <LoadIndicator width="
                            48 px " height="
                            48 px " visible={true} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="
                            tw - p - 6 ">
        <div className="
                            tw - text - center tw - py - 12 ">
          <i className="
                            fa - light fa - exclamation - triangle tw - text - 4 xl tw - text - yellow - 500 tw - mb - 4 "></i>
          <h2 className="
                            tw - text - xl tw - font - semibold tw - text - gray - 800 ">Vehicle Not Found</h2>
          <p className="
                            tw - text - gray - 600 tw - mb - 6 ">The requested vehicle could not be found.</p>
          <Button
            text="
                            Back to Vehicle List "
            icon="
                            fa - light fa - arrow - left "
            onClick={handleBackToList}
            type="
                            default "
            stylingMode="
                            contained "
          />
        </div>
      </div>
    );
  }

  return (
    <div className="
                            vehicle - details tw - p - 4 md: tw - p - 6 ">
      {/* Header Section */}
      <div className="
                            tw - bg - white tw - rounded - lg tw - shadow - sm tw - border tw - border - gray - 200 tw - p - 4 md: tw - p - 6 tw - mb - 6 ">
        <div className="
                            tw - flex tw - flex - col md: tw - flex - row md: tw - items - center md: tw - justify - between tw - mb - 4 ">
          <div className="
                            tw - flex tw - items - center tw - mb - 4 md: tw - mb - 0 ">
            <Button
              icon="
                            fa - light fa - arrow - left "
              onClick={handleBackToList}
              stylingMode="
                            text "
              className="
                            tw - mr - 4 "
            />
            <div>
              <h1 className="
                            tw - text - xl md: tw - text - 2 xl tw - font - bold tw - text - gray - 800 ">
                {vehicle.vehicleCode} - {vehicle.numberPlate}
              </h1>
              <p className="
                            tw - text - sm md: tw - text - base tw - text - gray - 600 ">
                {vehicle.vehicleManufacturer?.name} {vehicle.vehicleModel?.name} • {vehicle.yom}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="
                            tw - flex tw - flex - wrap tw - gap - 2 ">
            <Button
              text="
                            Assign Tag "
              icon="
                            fa - light fa - tag "
              onClick={handleAssignTag}
              type="
                            default "
              stylingMode="
                            outlined "
            />


            <Button
              text="
                            Expected Average "
              icon="
                            fa - light fa - chart - line "
              onClick={handleAssignExpectedAverage}
              type="
                            default "
              stylingMode="
                            outlined "
            />


            <Button
              text="
                            Generate Report "
              icon="
                            fa - light fa - file - chart - column "
              onClick={handleGenerateReport}
              type="
                            default "
              stylingMode="
                            outlined "
            />

          </div>
        </div>

        {/* Vehicle Metrics Dashboard */}
        <div className="
                            tw - grid tw - grid - cols - 2 md: tw - grid - cols - 3 lg: tw - grid - cols - 6 tw - gap - 4 ">
          <div className="
                            tw - bg - blue - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - blue - 200 ">
            <div className="
                            tw - text - sm tw - text - blue - 600 tw - mb - 1 ">Status</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - blue - 800 ">{vehicleMetrics.status}</div>
          </div>

          <div className="
                            tw - bg - green - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - green - 200 ">
            <div className="
                            tw - text - sm tw - text - green - 600 tw - mb - 1 ">GPS Status</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - green - 800 ">{vehicleMetrics.gpsStatus}</div>
          </div>

          <div className="
                            tw - bg - yellow - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - yellow - 200 ">
            <div className="
                            tw - text - sm tw - text - yellow - 600 tw - mb - 1 ">Working Site</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - yellow - 800 ">
              {vehicle.workingSite?.name || 'Not Assigned'}
            </div>
          </div>

          <div className="
                            tw - bg - purple - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - purple - 200 ">
            <div className="
                            tw - text - sm tw - text - purple - 600 tw - mb - 1 ">Default Driver</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - purple - 800 ">
              {vehicle.defaultEmployee?.fullName || 'Not Assigned'}
            </div>
          </div>

          <div className="
                            tw - bg - red - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - red - 200 ">
            <div className="
                            tw - text - sm tw - text - red - 600 tw - mb - 1 ">Vehicle Type</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - red - 800 ">
              {vehicle.vehicleType?.name || 'Not Specified'}
            </div>
          </div>

          <div className="
                            tw - bg - indigo - 50 tw - p - 4 tw - rounded - lg tw - border tw - border - indigo - 200 ">
            <div className="
                            tw - text - sm tw - text - indigo - 600 tw - mb - 1 ">Capacity</div>
            <div className="
                            tw - text - lg tw - font - semibold tw - text - indigo - 800 ">
              {vehicle.capacity || 'Not Specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="
                            tw - bg - white tw - rounded - lg tw - shadow - sm tw - border tw - border - gray - 200 ">
        <TabPanel
          dataSource={tabItems}
          scrollByContent={true}
          selectedIndex={activeTab}
          onSelectionChanged={handleTabSelect#ionChange}
          animationEnabled={true}
          swipeEnabled={true}
          showNavButtons={true}
          itemTitleRender={(item) => (
            <div className="
                            tw - flex tw - items - center tw - gap - 2 ">
              <i className={item.icon}></i>
              <span className="
                            tw - hidden md: tw - inline ">{item.title}</span>
            </div>
          )}
          itemRender={(item) => (
            <div className="
                            tw - p - 4 md: tw - p - 6 ">
              {item.component}
            </div>
          )}
        />
      </div>

      {/* Popup Forms */}
      <Popup
        visible={showTagPopup}
        onHiding={() => setShowTagPopup (false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to ${vehicle.vehicleCode}`}
        width="
                            auto "
        height="
                            auto "
        showCloseButton={true}
        position={{ my: "
                            center ", at: "
                            center ", of : window }}
      >
        <TagAssignmentForm
          vehicle={vehicle}
          tags={tags}
          onClose={() => setShowTagPopup (false)}
          onSuccess={() => {
            setShowTagPopup (false);
            notify ('Tag assigned successfully', 'success', 3000);
          }}
        />
      </Popup>

      <Popup
        visible={showSitePopup}
        onHiding={() => setShowSitePopup (false)}
        dragEnabled={false}
        showTitle={true}
        title={`Change Working Site for ${vehicle.vehicleCode}`}
        width="
                            90 % "
        height="
                            auto "
        showCloseButton={true}
      >
        <div className="
                            tw - p - 6 tw - text - center ">
          <i className="
                            fa - light fa - wrench tw - text - 4 xl tw - text - yellow - 500 tw - mb - 4 "></i>
          <h3 className="
                            tw - text - lg tw - font - semibold tw - mb - 2 ">Site Assignment Form</h3>
          <p className="
                            tw - text - gray - 600 tw - mb - 4 ">This feature is under development.</p>
          <p className="
                            tw - text - gray - 500 tw - mb - 4 ">Site assignment will allow changing the working site for this vehicle.</p>

          {/* Available Sites Display */}
          <div className="
                            tw - mb - 4 tw - text - left tw - border tw - border - gray - 200 tw - rounded - lg tw - p - 4 tw - bg - gray - 50 ">
            <h4 className="
                            tw - font - semibold tw - mb - 2 ">Available Sites ({sites.length})</h4>
            <ul className="
                            tw - space - y - 1 tw - max - h - 40 tw - overflow - y - auto ">
              {sites.map (site => (
                <li key={site.id} className="
                            tw - p - 2 tw - border - b tw - border - gray - 200 ">
                  {site.name}
                </li>
              ))}
            </ul>
          </div>

          <Button
            text="
                            Close "
            type="
                            default "
            stylingMode="
                            contained "
            onClick={() => setShowSitePopup (false)}
          />
        </div>
        {/* Uncomment when SiteAssignmentForm is implemented
        <SiteAssignmentForm
          vehicle={vehicle}
          sites={sites}
          onClose={() => setShowSitePopup(false)}
          onSuccess={(newSiteId) => {
            setVehicle({ ...vehicle, workingSiteId: newSiteId });
            setShowSitePopup(false);
            notify('Working site updated successfully', 'success', 3000);
          }}
        /> */}
      </Popup>

      <Popup
        visible={showExpectedAvgPopup}
        onHiding={() => setShowExpectedAvgPopup (false)}
        dragEnabled={false}
        showTitle={true}
        title={`Set Expected Average for ${vehicle.vehicleCode}`}
        width="
                            90 % "
        height={'400'}
        showCloseButton={true}
      >
        <ExpectedAverageForm
          vehicle={vehicle}
          onClose={() => setShowExpectedAvgPopup (false)}
          onSuccess={(newAverage) => {
            setVehicle ({ ...vehicle, defaultExptdAvgid : newAverage });
            setShowExpectedAvgPopup (false);
            notify ('Expected average updated successfully', 'success', 3000);
          }}
        />
      </Popup>
    </div>
  );
};

export default VehicleDetails;