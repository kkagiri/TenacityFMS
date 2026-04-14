using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.RolesCommands
{
    /// <summary>
    /// This Command Takes a RoleId and a List of UserIds and updates the users in the role
    /// </summary>
    /// <param name="RoleId"></param>
    /// <param name="UserIds"></param>
    public record UpdateRoleUsersCommand(string RoleId, List<string> UserIds) : IRequest<FMSResponseMessage>;

    public class UpdateRoleUsersCommandHandler : IRequestHandler<UpdateRoleUsersCommand, FMSResponseMessage>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<UpdateRoleUsersCommandHandler> _logger;
        private readonly IPermissionAuthorizationService _permissionAuthorizationService;

        public UpdateRoleUsersCommandHandler(UserManager<User> userManager, RoleManager<Role> roleManager, ILogger<UpdateRoleUsersCommandHandler> logger, IPermissionAuthorizationService permissionAuthorizationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _permissionAuthorizationService = permissionAuthorizationService;
        }

        public async Task<FMSResponseMessage> Handle(UpdateRoleUsersCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId);
                if (role == null) return new FMSResponseMessage(false, "Role not found");

                var roleName = role.Name;
                var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);

                // Check for last admin (if applicable)
                if (roleName == "Admin" && usersInRole.Count == 1 && request.UserIds.Count == 0)
                {
                    return new FMSResponseMessage(false, "Cannot remove the last admin user.");
                }

                // Remove only users not in the new list
                var usersToRemove = usersInRole.Where(u => !request.UserIds.Contains(u.Id)).ToList();
                foreach (var user in usersToRemove)
                {
                    await _userManager.RemoveFromRoleAsync(user, roleName);
                }

                // Add new users to the role
                foreach (var userId in request.UserIds)
                {
                    var user = await _userManager.FindByIdAsync(userId);
                    if (user == null) return new FMSResponseMessage(false, "User not found");

                    if (!await _userManager.IsInRoleAsync(user, roleName))
                    {
                        await _userManager.AddToRoleAsync(user, roleName);
                    }
                }

                await _permissionAuthorizationService.InvalidateRolePermissionsAsync(role.Id);

                return new FMSResponseMessage(true, "Role users updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role users");
                return new FMSResponseMessage(false, ex.Message);
            }
        }
    }

}