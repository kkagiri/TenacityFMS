using FMS.Application.Command.DatabaseCommand.VehicleCmd;
using FMS.Application.Command.DatabaseCommand.VehicleModelCommand;
using FMS.Application.Features.FMS;
using FMS.Application.Queries.Database.FMSQuery.VehicleModelQuery;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {

    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public class VehicleModelController : ControllerBase {

        private readonly IMediator _mediator;

        public VehicleModelController (IMediator mediator) {
            _mediator = mediator;
        }

        [HttpPost ("CreateVehicleModel")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<int>> CreateVehicleModel ([FromBody] Vehiclemodel vehicleModel) {
            if (!ModelState.IsValid) return BadRequest (ModelState);

            var command = new CreateVehicleModelCommand (vehicleModel.ManufacturerId, vehicleModel.Name);
            var results = await _mediator.Send (command);

            if (!results.Success) return BadRequest (results.Message);

            return Ok (results.Data);

        }

        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<IActionResult> GetVehicleModel () {

            var query = new GetVehicleModelQuery ();
            var vehicleModels = await _mediator.Send (query);
            return Ok (vehicleModels);

        }

    }
}