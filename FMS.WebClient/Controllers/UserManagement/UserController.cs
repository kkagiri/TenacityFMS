using System.Configuration;
using System.Security.Claims;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Common; // FMSResponse
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route ("api/v1/[controller]")]
[Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

public class UserController : ControllerBase {
    private readonly IMediator _mediator;

    public UserController (IMediator mediator) {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser ([FromBody] UserCreateCommand command) {
        if (!ModelState.IsValid) {
            // Convert model state errors to our response format
            var allErrors = ModelState.Values.SelectMany (v => v.Errors).Select (e => e.ErrorMessage).ToList ();
            return BadRequest (FMSResponse<string>.ValidationFailed (allErrors));
        }
        var response = await _mediator.Send (command);

        if (response.IsSuccess) {
            return Ok (response);
        }

        // Map error type to status code (expandable)
        return response.ErrorType
        switch {
            ErrorType.Validation => BadRequest (response),
                ErrorType.SystemError => StatusCode (StatusCodes.Status500InternalServerError, response),
                _ => BadRequest (response)
        };
    }

    //Get:api/User/{id}
    [HttpGet ("{id}")]
    public async Task<IActionResult> GetUser (string id) {
        var command = new GetUserByIdQuery (id);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    //Get user list:api/User
    [HttpGet]
    public async Task<IActionResult> GetUserList () {
        var command = new GetUserListQuery ();
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    //Delete:api/User/{id}
    [HttpDelete ("{id}")]
    public async Task<IActionResult> DeleteUser (string id) {
        var command = new UserPermanentDeleteCommand (id);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    [HttpPut ("softuserdelete/{id}")]
    public async Task<IActionResult> SoftDeleteUser (string id) {
        var command = new UserDeleteCommand (id);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    [HttpPut ("restoreuser/{id}")]
    public async Task<IActionResult> RestoreUser (string id) {
        var command = new RestoreUserCommand (id);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    //Update:api/User/{id}
    [HttpPut ("{id}")]
    public async Task<IActionResult> UpdateUser (string id, [FromBody] UserUpdateCommand command) {
        if (!ModelState.IsValid) {
            return BadRequest (ModelState);
        }

        command = command with { UserId = id };
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    [HttpPost ("Login")]
    [AllowAnonymous] // Override class-level authorization for login
    [EnableCors ("DevelopmentCorsPolicy")]
    public async Task<ActionResult<string>> Login (LoginCommand command) {
        try {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }
            var result = await _mediator.Send (command);

            return Ok (new { Token = result });
        } catch (UnauthorizedAccessException) {
            return Unauthorized ();
        }
    }

    [HttpGet ("details")]
    public async Task<IActionResult> GetUserDetails () {
        var userID = User.FindFirstValue (ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty (userID)) {
            return Unauthorized ();
        }

        var command = new GetUserByIdQuery (userID);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    [HttpPost ("assignRoles")]
    public async Task<IActionResult> AssignRoles (AssignUserRoleCommand command) {
        if (!ModelState.IsValid) {
            return BadRequest (ModelState);
        }
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    // Get user's sites
    [HttpGet ("{id}/sites")]
    public async Task<IActionResult> GetUserSites (string id) {
        var command = new GetUserSitesQuery (id);
        var result = await _mediator.Send (command);
        return Ok (result);
    }

    // Update user's sites
    [HttpPost ("{id}/sites")]
    public async Task<IActionResult> UpdateUserSites (string id, [FromBody] UpdateUserSitesCommand command) {
        if (!ModelState.IsValid) {
            return BadRequest (ModelState);
        }

        command = command with { UserId = id };
        var result = await _mediator.Send (command);
        return Ok (result);
    }
}