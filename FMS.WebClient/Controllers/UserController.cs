using System.Configuration;
using System.Security.Claims;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase


{
    private readonly IMediator _mediator;

    public UserController(IMediator mediator)
    {
        _mediator = mediator;
    }





    [HttpPost]
   // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] UserCreateCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var result = await _mediator.Send(command);
        //return CreatedAtAction(nameof(GetUser),new{id=userId},command));
        return Ok(result);
    }





    //Get:api/User/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(string id)
    {

        var command = new GetUserByIdQuery(id);
        var result = await _mediator.Send(command);
        return Ok(result);

    }

    //Get user list:api/User
    [HttpGet]
    public async Task<IActionResult> GetUserList()
    {
        var command = new GetUserListQuery();
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Delete:api/User/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var command = new UserPermanentDeleteCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }


    [HttpPut("softuserdelete/{id}")]
    public async Task<IActionResult> SoftDeleteUser(string id)
    {
        var command = new UserDeleteCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPut("restoreuser/{id}")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        var command = new RestoreUserCommand(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    //Update:api/User/{id}
    [HttpPut("{id}")]
    [Authorize(Roles ="Admin")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpdateCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        command = command with { UserId = id }; 
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("Login")]
    public async Task<ActionResult<string>> Login(LoginCommand command)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _mediator.Send(command);
            return Ok(new { Token = result });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    [HttpGet("details")]
    [Authorize]
    public async Task<IActionResult> GetUserDetails()
    {
        var userID = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if(string.IsNullOrEmpty(userID))
        {
            return Unauthorized();
        }

        var command = new GetUserByUserNameQuery(userID);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("assignRoles")]
    [Authorize]
    public async Task<IActionResult> AssignRoles(AssignUserRoleCommand command)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var result = await _mediator.Send(command);
        return Ok(result);
    }


}