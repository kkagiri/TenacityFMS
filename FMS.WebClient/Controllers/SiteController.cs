/**
 * File: SiteController.cs
 * Purpose: Provides site CRUD, user-site assignment, and site tag configuration endpoints.
 * Dependencies: MediatR site/user commands and queries, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GetForCurrentUser(): Returns sites assigned to the authenticated user.
 * - Create(): Creates site records.
 * - UpdateSiteTagConfiguration(): Updates GPSGate tag settings with user context.
 */
using System.Security.Claims;
using FMS.Application.Command.DatabaseCommand.SiteCommands;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Common;
using FMS.Application.Features.Site.Commands;
using FMS.Application.Features.Site.DTOs;
using FMS.Application.Features.Site.Queries;
using FMS.Application.Models;
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
    public class SiteController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SiteController(IMediator mediator)
        {
            _mediator = mediator;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        /// <summary>
        /// Get all sites.
        /// NEW: GET /api/site
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.Site.Read, Permissions.Admin.Site)]
        public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
        {
            FMSResponse<List<SiteDTO>> result = await _mediator.Send(new GetSiteQuery(includeInactive));
            return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Message);
        }

        /// <summary>
        /// Get quick stats for a site (tank, vehicle, employee, PTS device counts).
        /// GET /api/v1/site/{id}/stats
        /// </summary>
        [HttpGet("{id:int}/stats")]
        [RequirePermission(Permissions.Site.Read, Permissions.Admin.Site)]
        public async Task<IActionResult> GetSiteStats(int id)
        {
            var result = await _mediator.Send(new GetSiteStatsQuery(id));
            return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Message);
        }

        /// <summary>
        /// Get site by id.
        /// NEW: GET /api/site/{id}
        /// </summary>
        [HttpGet("{id:int}")]
        [RequirePermission(Permissions.Site.Read, Permissions.Admin.Site)]
        public async Task<IActionResult> GetById(int id)
        {
            FMSResponse<SiteDTO> result = await _mediator.Send(new GetSiteByIdQuery(id));
            if (result.IsSuccess)
            {
                return Ok(result.Data);
            }
            if (result.ValidationErrors is { Count: > 0 })
            {
                return BadRequest(new { result.Message, Errors = result.ValidationErrors });
            }
            return BadRequest(result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/get/{id}
        /// </summary>
        [HttpGet("get/{id:int}")]
        [Obsolete("Use GET /api/site/{id}")] // kept for backward compatibility
        [RequirePermission(Permissions.Site.Read, Permissions.Admin.Site)]
        public Task<IActionResult> LegacyGetById(int id)
        {
            return GetById(id);
        }

        /// <summary>
        /// Get sites for current authenticated user.
        /// NEW: GET /api/site/me
        /// </summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetForCurrentUser()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return BadRequest("Invalid User ID");
            }
            FMSResponse<List<SiteDTO>> result = await _mediator.Send(new GetSitesByUserIdQuery(userId));
            return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/getsitebyuserid
        /// </summary>
        [HttpGet("getsitebyuserid")]
        [Obsolete("Use GET /api/site/me")] // backward compatibility
        public Task<IActionResult> LegacyGetForCurrentUser()
        {
            return GetForCurrentUser();
        }

        /// <summary>
        /// Get sites for specified user id (admin capability).
        /// NEW: GET /api/site/users/{userId}
        /// </summary>
        [HttpGet("users/{userId:guid}")]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> GetForUserId(Guid userId)
        {
            FMSResponse<List<SiteDTO>> result = await _mediator.Send(new GetSitesByUserIdQuery(userId.ToString()));
            return result.IsSuccess ? Ok(result.Data) : BadRequest(result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/getsitebyuserid/{userId}
        /// </summary>
        [HttpGet("getsitebyuserid/{userId:guid}")]
        [Obsolete("Use GET /api/site/users/{userId}")] // backward compatibility
        [RequirePermission(Permissions.Admin.Site)]
        public Task<IActionResult> LegacyGetForUserId(Guid userId)
        {
            return GetForUserId(userId);
        }

        /// <summary>
        /// Create a site.
        /// NEW: POST /api/site
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> Create([FromBody] CreateSiteDTO siteDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            FMSResponse<int> result = await _mediator.Send(new CreateSiteCommand(siteDto));
            if (result.IsSuccess)
            {
                return Ok(new { Id = result.Data, result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 })
            {
                return BadRequest(new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode(500, result.Message);
        }

        /// <summary>
        /// LEGACY route: POST /api/site/create
        /// </summary>
        [HttpPost("create")]
        [Obsolete("Use POST /api/site")] // backward compatibility
        [RequirePermission(Permissions.Admin.Site)]
        public Task<IActionResult> LegacyCreate([FromBody] CreateSiteDTO siteDto)
        {
            return Create(siteDto);
        }

        /// <summary>
        /// Update a site.
        /// NEW: PUT /api/site/{id}
        /// </summary>
        [HttpPut("{id:int}")]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSiteDTO siteDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            FMSResponse<bool> result = await _mediator.Send(new UpdateSiteCommand(id, siteDto));
            if (result.IsSuccess)
            {
                return Ok(new { result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 })
            {
                return BadRequest(new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode(500, result.Message);
        }

        /// <summary>
        /// LEGACY route: PUT /api/site/update/{id}
        /// </summary>
        [HttpPut("update/{id:int}")]
        [Obsolete("Use PUT /api/site/{id}")] // backward compatibility
        [RequirePermission(Permissions.Admin.Site)]
        public Task<IActionResult> LegacyUpdate(int id, [FromBody] UpdateSiteDTO siteDto)
        {
            return Update(id, siteDto);
        }

        /// <summary>
        /// Delete a site.
        /// NEW: DELETE /api/site/{id}
        /// </summary>
        [HttpDelete("{id:int}")]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> Delete(int id)
        {
            FMSResponse<bool> result = await _mediator.Send(new DeleteSiteCommand(id));
            if (result.IsSuccess)
            {
                return Ok(new { result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 })
            {
                return BadRequest(new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode(500, result.Message);
        }

        /// <summary>
        /// LEGACY route: DELETE /api/site/delete/{id}
        /// </summary>
        [HttpDelete("delete/{id:int}")]
        [Obsolete("Use DELETE /api/site/{id}")] // backward compatibility
        [RequirePermission(Permissions.Admin.Site)]
        public Task<IActionResult> LegacyDelete(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Assign sites to a user.
        /// NEW: PUT /api/site/users/{userId}/sites
        /// </summary>
        [HttpPut("users/{userId:guid}/sites")]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> AssignSites(Guid userId, [FromBody] AssignSitesToUserCommand command)
        {
            if (command?.SiteIds == null || !command.SiteIds.Any())
            {
                return BadRequest("Invalid command payload");
            }
            AssignSitesToUserCommand effective = new(userId.ToString(), command.SiteIds);
            bool result = await _mediator.Send(effective);
            return result ? Ok("Sites assigned to user successfully") : StatusCode(500, "An error occurred while assigning sites to the user");
        }

        /// <summary>
        /// LEGACY route: PUT /api/site/assignSitestoUser
        /// </summary>
        [HttpPut("assignSitestoUser")]
        [Obsolete("Use PUT /api/site/users/{userId}/sites")] // backward compatibility
        [RequirePermission(Permissions.Admin.Site)]
        public Task<IActionResult> LegacyAssign([FromBody] AssignSitesToUserCommand command)
        {
            if (command is null || string.IsNullOrEmpty(command.UserId) || !Guid.TryParse(command.UserId, out var uid))
            {
                return Task.FromResult<IActionResult>(BadRequest("Invalid command payload"));
            }
            return AssignSites(uid, command);
        }

        #region GPSGate Tag Configuration

        /// <summary>
        /// Get all sites with their GPSGate tag configurations.
        /// GET /api/site/tags
        /// </summary>
        [HttpGet("tags")]
        [RequirePermission(Permissions.Site.Read, Permissions.Admin.Site)]
        public async Task<IActionResult> GetSiteTagConfigurations()
        {
            var result = await _mediator.Send(new GetSiteTagConfigurationsQuery());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Update a site's GPSGate tag configuration.
        /// PUT /api/site/{id}/tags
        /// </summary>
        [HttpPut("{id:int}/tags")]
        [RequirePermission(Permissions.Admin.Site)]
        public async Task<IActionResult> UpdateSiteTagConfiguration(int id, [FromBody] UpdateSiteTagDto tagDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            tagDto.SiteId = id;
            string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

            var result = await _mediator.Send(new UpdateSiteTagConfigurationCommand(tagDto, userId));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        #endregion
    }
}
