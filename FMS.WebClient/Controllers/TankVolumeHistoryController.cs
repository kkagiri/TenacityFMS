using System.Threading.Tasks;
using FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {
    [Route ("api/[controller]")]
    [ApiController]
    [Authorize (Roles = "Admin,User")]
    public class TankVolumeHistoryController : ControllerBase {
        private readonly IMediator _mediator;

        public TankVolumeHistoryController (IMediator mediator) {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistory () {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            var result = await _mediator.Send (new GetTankVolumeHistoryQuery ());
            if (result == null) return NoContent ();
            return Ok (result);
        }

        [HttpGet ("byTankAndDateRange")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryById (DateTime startDate, DateTime endDate, int TankId) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (TankId <= 0) return BadRequest ("Invalid ID");
            if (startDate == default || endDate == default) return BadRequest ("Invalid Date Range");

            var result = await _mediator.Send (new GetTankVolumeHistoryByTankIdQuery (startDate, endDate, TankId));
            if (result == null) return NotFound ();
            if (result.Success == false) return BadRequest (result.Message);

            return Ok (result.Data);
        }

        [HttpGet ("byDateRange")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryByDateRange (DateTime StartDate, DateTime EndDate) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (StartDate == default || EndDate == default) return BadRequest ("Invalid Date Range");
            var result = await _mediator.Send (new GetTankVolumeHistoryByDateRangeQuery (StartDate, EndDate));
            if (result == null) return NotFound ();
            return Ok (result);
        }

        [HttpGet ("bySite")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTankVolumeHistoryBySite (DateTime startDate, DateTime endDate, int siteId) {
            var hasPermission = User.HasClaim ("permissions", "_Read_tankVolumeHistory");
            if (!hasPermission) return Forbid ();

            if (siteId <= 0) return BadRequest ("Invalid Site ID");
            if (startDate == default || endDate == default) return BadRequest ("Invalid Date Range");

            var result = await _mediator.Send (new GetTankVolumeHistoryBySiteQuery (startDate, endDate, siteId));
            if (result == null) return NotFound ();

            return Ok (result);
        }
    }
}