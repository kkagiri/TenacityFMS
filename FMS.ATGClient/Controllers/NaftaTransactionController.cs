using AutoMapper.Configuration.Annotations;
using FMS.Application.Queries.Database.NaftaATGQueries.CardDetailsQueries;
using FMS.Application.Queries.Database.NaftaATGQueries.CardTransactionQueries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;

namespace FMS.ATGClient.Controllers
{
    [ApiController]
    [Route("api/atg/Naftatransaction")]
    public class NaftaTransactionController : ControllerBase
    {

        private readonly IMediator _mediator;
        private readonly ILogger _logger;

        public NaftaTransactionController(IMediator mediator,ILogger<NaftaTransactionController> logger) {
          
            _mediator = mediator;
            _logger = logger;

         }




        [HttpGet]
        [Route("getsalestransaction")]
        public async Task<IActionResult> GetTransactionByDate([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            if (startDate > endDate)
            {
                return BadRequest("Start date must be earlier than or equal to the end date.");
            }

            try {

                var query = new GetTransactionListQuery { StartDate = startDate, EndDate = endDate };
                var result = await _mediator.Send(query);

                if(result == null || !result.Any())
                {
                    return NotFound($"No transactions found between {startDate.ToString("yyyy-MM-dd")} and {endDate.ToString("yyyy-MM-dd")}");
                }
                return Ok(result);

                
            }catch(Exception ex)
            {

                return StatusCode(500, "An unexpected error occurred.");
            }
            
        }

        [HttpGet("card-details/{cardid}")]
        public async Task<ActionResult> GetCardDetails(string cardId)
        {
            var query = new GetCardDetailbyCardIDQuery { CardID = cardId };

            var results = await _mediator.Send(query);


            if(results == null)
            {
                return NotFound();
            }
            return Ok(results);
        }



    }
}
