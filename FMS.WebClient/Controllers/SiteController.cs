using System.Security.Claims;
using FMS.Application.Command.DatabaseCommand.SiteCommands;
using FMS.Application.Command.DatabaseCommand.UserManagement;
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

        //return list of sites
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetSiteList () {
            var query = new GetSiteQuery ();
            var result = await _mediator.Send (query);

            if (result.IsSuccess) {
                return Ok (result.Data);
            }

            return BadRequest (result.Message);
        }

        //return site by id
        [HttpGet ("get/{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetSiteById (int id) {
            var query = new GetSiteByIdQuery (id);
            var result = await _mediator.Send (query);

            if (result.IsSuccess) {
                return Ok (result.Data);
            }

            if (result.ValidationErrors?.Any () == true) {
                return BadRequest (new { Message = result.Message, Errors = result.ValidationErrors });
            }

            return BadRequest (result.Message);
        }

        //return list of sites by user id (current user)
        [HttpGet ("getsitebyuserid")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetSitesByUserId () {
            var userIdClaim = User.Claims.FirstOrDefault (c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse (c.Value, out _));

            if (userIdClaim == null) return BadRequest ("Invalid User ID");

            var query = new GetSitesByUserIdQuery (userIdClaim.Value);
            var result = await _mediator.Send (query);

            if (result.IsSuccess) {
                return Ok (result.Data);
            }

            return BadRequest (result.Message);
        }

        //return list of sites by specific user id //Cursor
        [HttpGet ("getsitebyuserid/{userId}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetSitesBySpecificUserId (string userId) {
            if (string.IsNullOrWhiteSpace (userId)) {
                return BadRequest ("User ID is required");
            }

            var query = new GetSitesByUserIdQuery (userId);
            var result = await _mediator.Send (query);

            if (result.IsSuccess) {
                return Ok (result.Data);
            }

            return BadRequest (result.Message);
        }

        [HttpPost ("create")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateSite ([FromBody] CreateSiteDTO siteDto) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }

            var command = new CreateSiteCommand (siteDto);
            var result = await _mediator.Send (command);

            if (result.IsSuccess) {
                return Ok (new { Id = result.Data, Message = result.Message });
            }

            if (result.ValidationErrors?.Any () == true) {
                return BadRequest (new { Message = result.Message, Errors = result.ValidationErrors });
            }

            return StatusCode (500, result.Message);
        }

        [HttpPut ("update/{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateSite (int id, [FromBody] UpdateSiteDTO siteDto) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }

            var command = new UpdateSiteCommand (id, siteDto);
            var result = await _mediator.Send (command);

            if (result.IsSuccess) {
                return Ok (new { Message = result.Message });
            }

            if (result.ValidationErrors?.Any () == true) {
                return BadRequest (new { Message = result.Message, Errors = result.ValidationErrors });
            }

            return StatusCode (500, result.Message);
        }

        [HttpDelete ("delete/{id}")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteSite (int id) {
            var command = new DeleteSiteCommand (id);
            var result = await _mediator.Send (command);

            if (result.IsSuccess) {
                return Ok (new { Message = result.Message });
            }

            if (result.ValidationErrors?.Any () == true) {
                return BadRequest (new { Message = result.Message, Errors = result.ValidationErrors });
            }

            return StatusCode (500, result.Message);
        }

        [HttpPut ("assignSitestoUser")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AssignSiteToUser (AssignSitesToUserCommand command) {
            if (command == null || string.IsNullOrEmpty (command.UserId) || command.SiteIds == null || !command.SiteIds.Any ()) {
                return BadRequest ("Invalid command payload");
            }

            try {
                var result = await _mediator.Send (command);

                if (result) {
                    return Ok ("Sites assigned to user successfully");
                }

                return StatusCode (500, "An error occurred while assigning sites to the user");
            } catch (Exception ex) {
                // Log the exception details
                return StatusCode (500, ex.Message);
            }
        }
    }
}