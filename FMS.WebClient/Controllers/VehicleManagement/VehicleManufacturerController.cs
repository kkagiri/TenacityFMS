using FMS.Application.Queries.Database.FMSQuery.VehicleManufacturer;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {

    [ApiController]
    [Route ("api/v1/[controller]")]

    public class VehicleManufacturerController : ControllerBase {

        private readonly IMediator _mediator;

        public VehicleManufacturerController (IMediator mediator) {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleManufacturer () {
            var query = new GetVehicleManufacturerQuery ();
            var vehicleManufacturer = await _mediator.Send (query);

            return Ok (vehicleManufacturer);
        }

    }
}