using FMS.Domain.Entities;
using FMS.Application.CommonInterface;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement
{
    /// <summary>
    /// This Commands Takes a User Id and a List of Roles and Assigns the Roles to the User
    /// </summary>
    /// <param name="UserId"></param>
    /// <param name="Roles"></param>
    public record AssignUserRolesCommand(string UserId, List<string> Roles) : IRequest<bool>;


    public class AssignUserRolesCommandHandler : IRequestHandler<AssignUserRolesCommand, bool>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<AssignUserRolesCommandHandler> _logger;
        private readonly IPermissionAuthorizationService _permissionAuthorizationService;

        public AssignUserRolesCommandHandler(UserManager<User> userManager, RoleManager<Role> roleManager, ILogger<AssignUserRolesCommandHandler> logger, IPermissionAuthorizationService permissionAuthorizationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _permissionAuthorizationService = permissionAuthorizationService;
        }

        public async Task<bool> Handle(AssignUserRolesCommand request, CancellationToken cancellationToken)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                _logger.LogError($"User with ID {request.UserId} not found.");
                throw new KeyNotFoundException("User not found");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToAdd = request.Roles.Except(currentRoles).ToList();
            var rolesToRemove = currentRoles.Except(request.Roles).ToList();

            var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                _logger.LogError($"Failed to remove roles from user {user.UserName}: {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
                throw new Exception("Failed to remove roles");
            }

            var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
            if (!addResult.Succeeded)
            {
                _logger.LogError($"Failed to add roles to user {user.UserName}: {string.Join(", ", addResult.Errors.Select(e => e.Description))}");
                throw new Exception("Failed to add roles");
            }

            _permissionAuthorizationService.InvalidateUserPermissions(user.Id);

            return true;
        }
    }
}
