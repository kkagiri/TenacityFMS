using FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FMS.WebClient.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PermissionController : ControllerBase
    {

        private readonly IMediator _mediator;

        public PermissionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET: api/Permission
        /// <summary>
        /// Get Permissions
        /// </summary>
        /// 
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetPermissions()
        {
            var result = await _mediator.Send(new GetPermissionQuery());
            return Ok(result);
        }

        // POST: api/Permission
        /// <summary>
        /// Create Permission
        /// </summary>  
        /// <param name="command"></param>
        /// <returns> ok </returns>
       
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreatePermission([FromBody] AddPermissionCommand command)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        // PUT: api/Permission/5
        /// <summary>
        /// Update Permission
        /// </summary>
        /// <param name="id"></param>
        /// <param name="command"></param>
        /// <returns> ok </returns>

        [HttpPut("{id}")]
       [Authorize]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] UpdatePermissionCommand command)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            command = command with { Id = id };  // Update the Id in the command
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        // DELETE: api/Permission/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var result = await _mediator.Send(new DeletePermissionCommand(id));
            return Ok(result);
        }


        ///Get /Api/Permission/role/{roleId}
        /// <summary>
        /// Get Permissions by RoleID 
        /// </summary>
        /// <param name="roleId"></param>
        /// <returns></returns>
        [HttpGet("role/{roleId:guid}")]
         [Authorize]
        public async Task<IActionResult> GetPermissionsByRoleID(string roleId)
        {
            if (roleId == null  ) return BadRequest("RoleID is null");

            var result = await _mediator.Send(new GetPermissionsByRoleIDQuery(roleId));
            return Ok(result);
        }

        ///Get /Api/Permission/user/{userId} <summary>
        /// Get /Api/Permission/user/{userId}
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>

        [HttpGet("user/{userId:guid}")]
        [Authorize]     
        public async Task<IActionResult> GetPermissionsByUserID(string userId)
        {
            if (userId == null) return BadRequest("UserID is null");

            var result = await _mediator.Send(new GetUserPermissionsQuery(userId));
            return Ok(result);
        }

    }
}
