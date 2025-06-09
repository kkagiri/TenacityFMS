using System.Text.Json;
using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.Features.Vehicle.DTOs;
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

        [HttpGet ("routes")]
        public IActionResult GetRoutes () {
            var endpoints = HttpContext.RequestServices
                .GetRequiredService<IEnumerable<EndpointDataSource>> ()
                .SelectMany (source => source.Endpoints)
                .OfType<RouteEndpoint> ();

            var routes = endpoints.Select (e => new {
                Route = e.RoutePattern.RawText,
                    Methods = e.Metadata
                    .OfType<HttpMethodMetadata> ()
                    .FirstOrDefault () ?
                    .HttpMethods,
                    HasAuthorize = e.Metadata.Any (m => m is Microsoft.AspNetCore.Authorization.IAuthorizeData)
            });

            return Ok (routes);
        }

        // Add a test endpoint to verify routing
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpGet ("test")]

        public IActionResult Test () {
            return Ok ("Vehicle controller test endpoint working!");
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
    }
}