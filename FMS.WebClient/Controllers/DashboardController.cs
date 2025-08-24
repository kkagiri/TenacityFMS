using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.Dashboard;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Application.Queries.Database.Dashboard;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DashboardController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly ILogger<DashboardController> _logger;
        public DashboardController (IMediator mediator, ILogger<DashboardController> logger) {
            _mediator = mediator;
            _logger = logger;
        }

        private string CurrentUserId => User?.FindFirstValue (ClaimTypes.NameIdentifier) ?? User?.Identity?.Name ?? "system";
        private string CurrentActor => User?.Identity?.Name ?? "system";

        /// <summary>
        /// Get current user's dashboard preferences (active)
        /// </summary>
        [HttpGet ("preferences")]
        public async Task<ActionResult<FMSResponseMessage<UserDashboardPreferenceDto>>> GetPreferences () {
            string userId = CurrentUserId;
            FMSResponseMessage<UserDashboardPreferenceDto> result = await _mediator.Send (new GetUserDashboardPreferencesQuery (userId));
            if (!result.Success) {
                return NotFound (result);
            }
            return Ok (result);
        }

        /// <summary>
        /// Save (create/update) current user's dashboard preferences
        /// </summary>
        [HttpPost ("preferences")]
        public async Task<ActionResult<FMSResponseMessage<UserDashboardPreferenceDto>>> SavePreferences ([FromBody] SaveUserDashboardPreferenceDto dto) {
            if (dto == null || string.IsNullOrWhiteSpace (dto.PreferencesJson)) {
                return BadRequest (new FMSResponseMessage<UserDashboardPreferenceDto> (false, "Invalid payload", null!));
            }
            string userId = CurrentUserId;
            FMSResponseMessage<UserDashboardPreferenceDto> result = await _mediator.Send (new SaveUserDashboardPreferencesCommand (userId, dto.PreferencesJson, dto.Version, CurrentActor));
            if (!result.Success) {
                return BadRequest (result);
            }
            return Ok (result);
        }

        /// <summary>
        /// Get all dashboard ticker templates (optionally only enabled)
        /// </summary>
        [HttpGet ("ticker-configs")]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>>>> GetTickerTemplates ([FromQuery] bool onlyEnabled = true) {
            string userId = CurrentUserId;
            FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>> result = await _mediator.Send (new GetDashboardTickerTemplatesQuery (userId, onlyEnabled));
            if (!result.Success) {
                return BadRequest (result);
            }
            return Ok (result);
        }
    }
}