using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Communication.Redis;
using FMS.Domain.Entities.PTS;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;


namespace FMS.WebClient.Controllers.PTSController
{
    [ApiController]
    [Route("api/[controller]")]
    public class PumpController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<PumpController> _logger;
        private readonly RedisCommandService _redisCommandService;

        public PumpController(IMediator mediator, ILogger<PumpController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Authorizes a pump for refueling
        /// </summary>
        [HttpPost("authorize")]
        public async Task<ActionResult<FMSResponseMessage<PumpAuthorizeConfirmation>>> AuthorizePump([FromBody] PumpAuthorizeCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authorizing pump");
                return StatusCode(500, new FMSResponseMessage<PumpAuthorizeConfirmation>(false, "Internal server error", null!));
            }
        }

        /// <summary>
        /// Gets the current state of a pump
        /// </summary>
        [HttpGet("{deviceId}/{pumpId}/state")]
        public async Task<ActionResult<string>> GetPumpState(string deviceId, int pumpId)
        {
            try
            {
                var command = new PumpStatusCommand(deviceId, pumpId);
                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pump state");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Stops an ongoing transaction
        /// </summary>
        [HttpPost("{deviceId}/{pumpId}/stop")]
        public async Task<ActionResult> StopPump(string deviceId, int pumpId)
        {
            try
            {
                var command = new PumpStopCommand(deviceId, pumpId);
                var result = await _mediator.Send(command);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping pump");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}