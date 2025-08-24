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

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SiteController : ControllerBase {
        private readonly IMediator _mediator;

        public SiteController (IMediator mediator) {
            _mediator = mediator;
        }

        /// <summary>
        /// Get all sites.
        /// NEW: GET /api/site
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll () {
            FMSResponse<List<SiteDTO>> result = await _mediator.Send (new GetSiteQuery ());
            return result.IsSuccess ? Ok (result.Data) : BadRequest (result.Message);
        }

        /// <summary>
        /// Get site by id.
        /// NEW: GET /api/site/{id}
        /// </summary>
        [HttpGet ("{id:int}")]
        public async Task<IActionResult> GetById (int id) {
            FMSResponse<SiteDTO> result = await _mediator.Send (new GetSiteByIdQuery (id));
            if (result.IsSuccess) {
                return Ok (result.Data);
            }
            if (result.ValidationErrors is { Count: > 0 }) {
                return BadRequest (new { result.Message, Errors = result.ValidationErrors });
            }
            return BadRequest (result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/get/{id}
        /// </summary>
        [HttpGet ("get/{id:int}")]
        [Obsolete ("Use GET /api/site/{id}")] // kept for backward compatibility
        public Task<IActionResult> LegacyGetById (int id) {
            return GetById (id);
        }

        /// <summary>
        /// Get sites for current authenticated user.
        /// NEW: GET /api/site/me
        /// </summary>
        [HttpGet ("me")]
        public async Task<IActionResult> GetForCurrentUser () {
            string? userId = User.FindFirstValue (ClaimTypes.NameIdentifier);
            if (!Guid.TryParse (userId, out _)) {
                return BadRequest ("Invalid User ID");
            }
            FMSResponse<List<SiteDTO>> result = await _mediator.Send (new GetSitesByUserIdQuery (userId!));
            return result.IsSuccess ? Ok (result.Data) : BadRequest (result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/getsitebyuserid
        /// </summary>
        [HttpGet ("getsitebyuserid")]
        [Obsolete ("Use GET /api/site/me")] // backward compatibility
        public Task<IActionResult> LegacyGetForCurrentUser () {
            return GetForCurrentUser ();
        }

        /// <summary>
        /// Get sites for specified user id (admin capability).
        /// NEW: GET /api/site/users/{userId}
        /// </summary>
        [HttpGet ("users/{userId:guid}")]
        public async Task<IActionResult> GetForUserId (Guid userId) {
            FMSResponse<List<SiteDTO>> result = await _mediator.Send (new GetSitesByUserIdQuery (userId.ToString ()));
            return result.IsSuccess ? Ok (result.Data) : BadRequest (result.Message);
        }

        /// <summary>
        /// LEGACY route: GET /api/site/getsitebyuserid/{userId}
        /// </summary>
        [HttpGet ("getsitebyuserid/{userId:guid}")]
        [Obsolete ("Use GET /api/site/users/{userId}")] // backward compatibility
        public Task<IActionResult> LegacyGetForUserId (Guid userId) {
            return GetForUserId (userId);
        }

        /// <summary>
        /// Create a site.
        /// NEW: POST /api/site
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create ([FromBody] CreateSiteDTO siteDto) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }
            FMSResponse<int> result = await _mediator.Send (new CreateSiteCommand (siteDto));
            if (result.IsSuccess) {
                return Ok (new { Id = result.Data, result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 }) {
                return BadRequest (new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode (500, result.Message);
        }

        /// <summary>
        /// LEGACY route: POST /api/site/create
        /// </summary>
        [HttpPost ("create")]
        [Obsolete ("Use POST /api/site")] // backward compatibility
        public Task<IActionResult> LegacyCreate ([FromBody] CreateSiteDTO siteDto) {
            return Create (siteDto);
        }

        /// <summary>
        /// Update a site.
        /// NEW: PUT /api/site/{id}
        /// </summary>
        [HttpPut ("{id:int}")]
        public async Task<IActionResult> Update (int id, [FromBody] UpdateSiteDTO siteDto) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }
            FMSResponse<bool> result = await _mediator.Send (new UpdateSiteCommand (id, siteDto));
            if (result.IsSuccess) {
                return Ok (new { result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 }) {
                return BadRequest (new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode (500, result.Message);
        }

        /// <summary>
        /// LEGACY route: PUT /api/site/update/{id}
        /// </summary>
        [HttpPut ("update/{id:int}")]
        [Obsolete ("Use PUT /api/site/{id}")] // backward compatibility
        public Task<IActionResult> LegacyUpdate (int id, [FromBody] UpdateSiteDTO siteDto) {
            return Update (id, siteDto);
        }

        /// <summary>
        /// Delete a site.
        /// NEW: DELETE /api/site/{id}
        /// </summary>
        [HttpDelete ("{id:int}")]
        public async Task<IActionResult> Delete (int id) {
            FMSResponse<bool> result = await _mediator.Send (new DeleteSiteCommand (id));
            if (result.IsSuccess) {
                return Ok (new { result.Message });
            }
            if (result.ValidationErrors is { Count: > 0 }) {
                return BadRequest (new { result.Message, Errors = result.ValidationErrors });
            }
            return StatusCode (500, result.Message);
        }

        /// <summary>
        /// LEGACY route: DELETE /api/site/delete/{id}
        /// </summary>
        [HttpDelete ("delete/{id:int}")]
        [Obsolete ("Use DELETE /api/site/{id}")] // backward compatibility
        public Task<IActionResult> LegacyDelete (int id) {
            return Delete (id);
        }

        /// <summary>
        /// Assign sites to a user.
        /// NEW: PUT /api/site/users/{userId}/sites
        /// </summary>
        [HttpPut ("users/{userId:guid}/sites")]
        public async Task<IActionResult> AssignSites (Guid userId, [FromBody] AssignSitesToUserCommand command) {
            if (command?.SiteIds == null || !command.SiteIds.Any ()) {
                return BadRequest ("Invalid command payload");
            }
            AssignSitesToUserCommand effective = new (userId.ToString (), command.SiteIds);
            bool result = await _mediator.Send (effective);
            return result ? Ok ("Sites assigned to user successfully") : StatusCode (500, "An error occurred while assigning sites to the user");
        }

        /// <summary>
        /// LEGACY route: PUT /api/site/assignSitestoUser
        /// </summary>
        [HttpPut ("assignSitestoUser")]
        [Obsolete ("Use PUT /api/site/users/{userId}/sites")] // backward compatibility
        public Task<IActionResult> LegacyAssign ([FromBody] AssignSitesToUserCommand command) {
            if (command is null || string.IsNullOrEmpty (command.UserId) || !Guid.TryParse (command.UserId, out var uid)) {
                return Task.FromResult<IActionResult> (BadRequest ("Invalid command payload"));
            }
            return AssignSites (uid, command);
        }
    }
}