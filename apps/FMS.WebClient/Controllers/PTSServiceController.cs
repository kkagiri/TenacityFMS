using FMS.Application.Common;
using FMS.Application.Features.Devices.Fueling.PumpControl.Commands;
using FMS.Application.Features.Devices.Fueling.PumpControl.DTOs;
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
    [RequirePermission(Permissions.Admin.Device)]
    public class PTSServiceController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<PTSServiceController> _logger;

        public PTSServiceController(IMediator mediator, ILogger<PTSServiceController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get the current status of the PTS Windows Service
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<FMSResponse<ServiceStatusDto>>> GetServiceStatus()
        {
            var command = new ServiceControlCommand
            {
                Action = ServiceAction.GetStatus
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        /// <summary>
        /// Start the PTS Windows Service
        /// </summary>
        [HttpPost("start")]
        public async Task<ActionResult<FMSResponse<ServiceStatusDto>>> StartService()
        {
            _logger.LogInformation("Service start requested by user: {UserId}", User.Identity?.Name);

            var command = new ServiceControlCommand
            {
                Action = ServiceAction.Start
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        /// <summary>
        /// Stop the PTS Windows Service
        /// </summary>
        [HttpPost("stop")]
        public async Task<ActionResult<FMSResponse<ServiceStatusDto>>> StopService()
        {
            _logger.LogInformation("Service stop requested by user: {UserId}", User.Identity?.Name);

            var command = new ServiceControlCommand
            {
                Action = ServiceAction.Stop
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        /// <summary>
        /// Restart the PTS Windows Service
        /// </summary>
        [HttpPost("restart")]
        public async Task<ActionResult<FMSResponse<ServiceStatusDto>>> RestartService()
        {
            _logger.LogInformation("Service restart requested by user: {UserId}", User.Identity?.Name);

            var command = new ServiceControlCommand
            {
                Action = ServiceAction.Restart
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }

        /// <summary>
        /// Get recent log entries from the PTS service
        /// </summary>
        [HttpGet("logs")]
        public async Task<ActionResult<FMSResponse<List<string>>>> GetRecentLogs([FromQuery] int lines = 50)
        {
            try
            {
                // This would need to be implemented as a separate query/command
                // For now, we'll get it through the status endpoint
                var statusCommand = new ServiceControlCommand
                {
                    Action = ServiceAction.GetStatus
                };

                var statusResult = await _mediator.Send(statusCommand);
                if (statusResult.IsSuccess)
                {
                    return Ok(FMSResponse<List<string>>.Success(statusResult.Data.RecentLogEntries));
                }

                return Ok(FMSResponse<List<string>>.Failed("Failed to retrieve logs"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving service logs");
                return Ok(FMSResponse<List<string>>.Failed("Error retrieving service logs"));
            }
        }
    }
}
