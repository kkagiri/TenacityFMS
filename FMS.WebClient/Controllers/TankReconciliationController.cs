using FMS.Application.Queries.Database.FMSQuery.TankReconciliation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TankReconciliationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TankReconciliationController(IMediator mediator)
        {
            _mediator = mediator;

        }
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetTankReconciliationByDate([FromQuery] DateTime startDate, DateTime endDate)
        {

            //insertPermission check here

            var result = await _mediator.Send(new GetDailyTankReconcillationQuery(startDate, endDate));
            return Ok(result);
        }

        [HttpGet("by-site")]
        [Authorize]
        public async Task<IActionResult> GetTankReconciliationBySite(DateTime startDate, DateTime endDate, int siteId)
        {
            //insertPermission check here

            var result = await _mediator.Send(new GetDailyTankReconciliationBySiteQuery(startDate, endDate, siteId));
            return Ok(result);
        }
    }
}