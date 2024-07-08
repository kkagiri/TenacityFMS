using FMS.Domain.Entities;
using FMS.PTS.Common;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.RolesCommands
{
    /// <summary>
    /// This Command Takes a RoleId and a List of UserIds and updates the users in the role
    /// </summary>
    /// <param name="RoleId"></param>
    /// <param name="UserIds"></param>
   public record UpdateRoleUsersCommand (string RoleId, List<string> UserIds) : IRequest <UpdateRoleUsersResult>;

    public class UpdateRoleUsersCommandHandler : IRequestHandler<UpdateRoleUsersCommand, UpdateRoleUsersResult>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<UpdateRoleUsersCommandHandler> _logger;    

        public UpdateRoleUsersCommandHandler(UserManager<User> userManager, RoleManager<Role> roleManager, ILogger<UpdateRoleUsersCommandHandler> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

       
        public async Task<UpdateRoleUsersResult> Handle(UpdateRoleUsersCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId);
                if(role == null) return new UpdateRoleUsersResult(false,"Role not found");

                var roleName = role.Name;

                var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
                if (roleName == "Admin")
                {
                    var currentAdminCount = usersInRole.Count;
                    if (currentAdminCount == 1 && request.UserIds.Count == 0)
                    {
                        return new UpdateRoleUsersResult(false, "Cannot remove the last admin user.");
                    }
                }
                foreach (var user in usersInRole)
                {
                    await _userManager.RemoveFromRoleAsync(user, roleName);
                }
                foreach (var userId in request.UserIds)
                {
                    var user = await _userManager.FindByIdAsync(userId);
                    if (user == null) return  new UpdateRoleUsersResult(false,"User not found");

                    var userRoles = await _userManager.GetRolesAsync(user);
                    if (userRoles.Count > 0)
                    {
                        return new UpdateRoleUsersResult(false, $"User {user.UserName} is already in another role.");
                    }

                    await _userManager.AddToRoleAsync(user, roleName);
                }
                return new UpdateRoleUsersResult(true,"Role User Updated Successfully");
            } catch (Exception ex)
            {
               _logger.LogError("Error updating role users", ex.Message);
                throw;
            }
        }
    }
    public class UpdateRoleUsersResult
    {
        public bool Succeeded { get; set; }
        public string Message { get; set; }

        public UpdateRoleUsersResult(bool succeeded, string message)
        {
            Succeeded = succeeded;
            Message = message;
        }
    }

}
