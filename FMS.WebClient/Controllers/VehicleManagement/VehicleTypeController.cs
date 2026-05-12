using FMS.Application.Queries.Database.FMSQuery.VehicleTypeQuery;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Vehicle.Read)]

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