/**
 * File: PermissionController.cs
 * Purpose: Manages permission CRUD operations (admin) and provides a self-service
 *          endpoint for authenticated users to fetch their own permissions.
 * Dependencies: IMediator, IPermissionAuthorizationService, FMSResponse<T>
 * Last Modified: 2026-02-07
 *
 * Key Endpoints:
 * - GET /me: Returns current user's permissions (any authenticated user)
 * - GET /: List all permissions (admin only)
 * - POST /: Create permission (admin only)
 * - PUT /{id}: Update permission (admin only)
 * - DELETE /{id}: Delete permission (admin only)
 * - GET /role/{roleId}: Get permissions by role (admin only)
 * - GET /user/{userId}: Get permissions by user (admin only)
 */
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class PermissionController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IPermissionAuthorizationService _permissionService;

        public PermissionController(IMediator mediator, IPermissionAuthorizationService permissionService)
        {
            _mediator = mediator;
            _permissionService = permissionService;
        }

        /// <summary>
        /// Returns the current authenticated user's permissions.
        /// Any authenticated user can call this — no admin permission required.
        /// Used by the frontend after login to populate permission state.
        /// </summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var permissions = await _permissionService.GetUserPermissionsAsync();
            return Ok(FMSResponse<IEnumerable<string>>.Success(permissions, "Permissions loaded"));
        }

        // GET: api/Permission
        /// <summary>
        /// Get all Permissions (admin only)
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.Admin.Roles)]
        public async Task<IActionResult> GetPermissions()
        {
            var result = await _mediator.Send(new GetPermissionQuery());
            return Ok(result);
        }

        // POST: api/Permission
        /// <summary>
        /// Create Permission (admin only)
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.Admin.Roles)]
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
        /// Update Permission (admin only)
        /// </summary>
        [HttpPut("{id}")]
        [RequirePermission(Permissions.Admin.Roles)]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] UpdatePermissionCommand command)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            command = command with { Id = id };
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        // DELETE: api/Permission/5
        [HttpDelete("{id}")]
        [RequirePermission(Permissions.Admin.Roles)]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var result = await _mediator.Send(new DeletePermissionCommand(id));
            return Ok(result);
        }

        /// <summary>
        /// Get Permissions by RoleID (admin only)
        /// </summary>
        [HttpGet("role/{roleId:guid}")]
        [RequirePermission(Permissions.Admin.Roles)]
        public async Task<IActionResult> GetPermissionsByRoleID(string roleId)
        {
            if (roleId == null) return BadRequest("RoleID is null");

            var result = await _mediator.Send(new GetPermissionsByRoleIDQuery(roleId));
            return Ok(result);
        }

        /// <summary>
        /// Get Permissions by UserID (admin only)
        /// </summary>
        [HttpGet("user/{userId:guid}")]
        [RequirePermission(Permissions.Admin.Roles)]
        public async Task<IActionResult> GetPermissionsByUserID(string userId)
        {
            if (userId == null) return BadRequest("UserID is null");

            var result = await _mediator.Send(new GetUserPermissionsQuery(userId));
            return Ok(result);
        }

    }
}