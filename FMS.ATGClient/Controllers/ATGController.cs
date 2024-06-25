using FMS.Application.Command.PTSCommand;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FMS.ATGClient.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ATGController : ControllerBase
    {
        private readonly ILogger<ATGController> _logger;
        private readonly IMediator _mediator;

        public ATGController(ILogger<ATGController> logger, IMediator mediator)
        {
            _logger = logger;
            _mediator = mediator;
        }

        //[HttpPost("ReadRFIDTag")]
        //public async Task<IActionResult> ReadRFIDTag(int pumpNumber, int nozzleNumber)
        //{

            
        //    var result = await _mediator.Send(new PumpGetTagCommand(pumpNumber, nozzleNumber));
        //    if(result.Success)
        //    {
        //        return Ok(result.TagData);
        //    }
        //    else{
        //        return BadRequest(result.ErrorMessage);
        //    }

        //}
        
    }
}