// using DevExpress.Charts.Native;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands;
using FMS.Application.Command.DatabaseCommand.UserManagement.RolesCommands;
using FMS.Application.Features.FMS.UserManagement;
using FMS.Application.Features.UserManagement.Role.Commands;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles;
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
    [RequirePermission(Permissions.Admin.Roles)]
    public class RoleController : ControllerBase
    {
        private readonly IMediator _mediator;

        public RoleController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // create api/Role/
        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] RoleCreateCommand command)
        {
            var roleId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetRoleById), new { id = roleId }, command);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] RoleDto roleDto)
        {
            if (roleDto == null || id != roleDto.Id) return BadRequest();
            var command = new RoleUpdateCommand(roleDto);
            var result = await _mediator.Send(command);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RoleDeleteCommand(string id)
        {
            var result = await _mediator.Send(new RoleDeleteCommand(id));
            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoleById(string id)
        {
            var role = await _mediator.Send(new GetRoleByIDQuery(id));
            if (role == null) return NotFound();
            return Ok(role);
        }

        [HttpGet("getlist")]
        public async Task<IActionResult> GetRoleList()
        {
            var roles = await _mediator.Send(new GetRoleListQuery());
            return Ok(roles);
        }

        [HttpPost("AssignPermissions")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AssignPermissions([FromBody] AssignPermissionsToRoleCommand command)
        {

            if (string.IsNullOrWhiteSpace(command.RoleId)) return BadRequest("invalid Role ID");

            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _mediator.Send(command);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("UpdateRoleUsers")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateRoleForUsers([FromBody] UpdateRoleUsersCommand command)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _mediator.Send(command);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        //api: api/role/UsersInRole/{roleId}
        [HttpGet("UsersInRole/{roleId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUsersInRole(string roleId)
        {
            var command = new GetUsersInRoleQuery(roleId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("PermissionsByRole/{roleId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetPermissionsByRoleId(string roleId)
        {
            var command = new GetPermissionsByRoleIDQuery(roleId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetRolesByUserId(string userId)
        {
            var command = new GetRolesByUserIDQuery(userId);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("AssignRolesToUser")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AssignRolesToUser([FromBody] AssignUserRolesCommand command)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        /// <summary>
        /// Clones an existing role with its permissions and navigation items.
        /// Users are NOT copied.
        /// </summary>
        [HttpPost("{roleId}/clone")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CloneRole(string roleId, [FromBody] CloneRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.NewRoleName))
                return BadRequest(new { success = false, message = "New role name is required." });

            var command = new CloneRoleCommand(roleId, request.NewRoleName, request.Description);
            var result = await _mediator.Send(command);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

    }

    /// <summary>
    /// Request body for the Clone Role endpoint
    /// </summary>
    public class CloneRoleRequest
    {
        public string NewRoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}