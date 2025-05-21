using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehicleController : ControllerBase
    {

        private readonly IMediator _mediator;

        public VehicleController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("routes")]
        public IActionResult GetRoutes()
        {
            var endpoints = HttpContext.RequestServices
                .GetRequiredService<IEnumerable<EndpointDataSource>>()
                .SelectMany(source => source.Endpoints)
                .OfType<RouteEndpoint>();

            var routes = endpoints.Select(e => new
            {
                Route = e.RoutePattern.RawText,
                Methods = e.Metadata
                    .OfType<HttpMethodMetadata>()
                    .FirstOrDefault()
                    ?.HttpMethods,
                HasAuthorize = e.Metadata.Any(m => m is Microsoft.AspNetCore.Authorization.IAuthorizeData)
            });

            return Ok(routes);
        }

        // Add a test endpoint to verify routing
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpGet("test")]

        public IActionResult Test()
        {
            return Ok("Vehicle controller test endpoint working!");
        }


        [HttpGet("simple")]

        public async Task<IActionResult> GetSimpleVehicleList()
        {
            var query = new GetSimpleVehicleQuery();
            var vehicles = await _mediator.Send(query);
            return Ok(vehicles);
        }


        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleList()
        {
            var query = new GetVehicleQuery();

            var vehicles = await _mediator.Send(query);

            return Ok(vehicles);

        }


        [HttpGet("/{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleByID(int id)
        {

            var query = new GetVehicleByIDQuery(id);
            var vehicle = await _mediator.Send(query);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }


        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateVehicle([FromBody] VehicleDTO vehicleDTO)
        {
            var hasPermission = User.HasClaim("permissions", "_CreateVehicle");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

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
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);

        }

        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<IActionResult> UpdateVehicle(int id, [FromBody] VehicleDTO vehicleDTO)
        {
            var hasPermission = User.HasClaim("permissions", "_EditVehicle");
            if (!hasPermission) return Forbid();
            //  if (vehicleDTO.VehicleId != id) return BadRequest("Vehicle Id mismatch");
            if (id == 0 || id < 0) return BadRequest("Invalid Vehicle Id");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            vehicleDTO.VehicleId = id;
            vehicleDTO.ModifiedBy = userIdClaim.Value;

            var command = new UpdateSingleVehicleCommand(vehicleDTO);
            var result = await _mediator.Send(command);

            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_DeleteVehicle");
            if (!hasPermission) return Forbid();
            if (id <= 0) return BadRequest("Invalid Vehicle Id");

            var command = new DeleteVehicleCommand(id);
            var result = await _mediator.Send(command);

            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }
    }
}
