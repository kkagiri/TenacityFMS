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
        public async Task<IActionResult> GetTankReconciliationByDate([FromQuery] DateTime date)
        {

            //insertPermission check here

            var result = await _mediator.Send(new GetDailyTankReconcillationQuery ( date ));
            return Ok(result);
        }

        [HttpGet("by-site")]
        [Authorize]
        public async Task<IActionResult> GetTankReconciliationBySite(DateTime date,int siteId)
        {
            //insertPermission check here

            var result = await _mediator.Send(new GetDailyTankReconciliationBySiteQuery(date,siteId));
            return Ok(result);
        }
    }
}