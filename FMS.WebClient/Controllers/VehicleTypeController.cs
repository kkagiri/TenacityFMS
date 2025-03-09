using FMS.Application.Queries.Database.FMSQuery.VehicleTypeQuery;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public class VehicleTypeController : ControllerBase
    {
        private readonly IMediator _mediator;
        public VehicleTypeController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVehicleType()
        {
            var query = new GetVehicleTypeQuery();
            var vehicleTypes = await _mediator.Send(query);
            return Ok(vehicleTypes);
        }

    }
}
