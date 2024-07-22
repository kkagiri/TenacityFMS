using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using FMS.Application.Queries.Database.FMSQuery.VehicleQuery;
using MediatR;
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


        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetVehicleList()
        {
            var query = new GetVehicleListQuery();

            var vehicles = await _mediator.Send(query);

            return Ok(vehicles);

        }


        [HttpGet("/{id}")]
        [Authorize]

        public async Task<IActionResult> GetVehicleByID(int id)
        {
            
            var query = new GetVehicleByIDQuery(id);
            var vehicle = await _mediator.Send(query);
            if (vehicle == null) return NotFound();           
            return Ok(vehicle);
        }


        [HttpGet("simple")]
        [Authorize]

        public async Task<IActionResult> GetSimpleVehicleList()
        {
            var query = new GetSimpleVehicleQuery();
            var vehicles = await _mediator.Send(query);
            return Ok(vehicles);
        }


        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateVehicle([FromBody] List<VehicleDTO> vehicleDTOs)
        {

            var hasPermission = User.HasClaim("permissions", "_editVehicle");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var command = new UpdateVehiclesCommand(vehicleDTOs);
            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);

        }
    }
}
