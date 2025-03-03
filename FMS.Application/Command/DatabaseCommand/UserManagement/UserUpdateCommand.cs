using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement
{
    public record UserUpdateCommand(string UserId, string Email, string UserName, string RoleName) : IRequest<bool>;

    public class UserUpdateCommandHandler : IRequestHandler<UserUpdateCommand, bool>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<UserUpdateCommandHandler> _logger;

        public UserUpdateCommandHandler(UserManager<User> userManager, RoleManager<Role> roleManager, ILogger<UserUpdateCommandHandler> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        public async Task<bool> Handle(UserUpdateCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(request.UserId);

                if (user == null)
                {
                    _logger.LogError("Update user: User not found");
                    throw new Exception("Update User is not Found");
                }

                user.Email = request.Email;
                user.UserName = request.UserName;

                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    _logger.LogError("Update user: Error updating user");
                    throw new Exception(string.Join("; ", result.Errors.Select(e => e.Description)));
                }

                if (!string.IsNullOrEmpty(request.RoleName))
                {
                    var roleExists = await _roleManager.RoleExistsAsync(request.RoleName);
                    if (!roleExists)
                    {
                        throw new Exception($"Role '{request.RoleName}' does not exist.");
                    }

                    var currentRoles = await _userManager.GetRolesAsync(user);

                    var roleRemovalResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    if (!roleRemovalResult.Succeeded)
                    {
                        throw new Exception(string.Join("; ", roleRemovalResult.Errors.Select(e => e.Description)));
                    }

                    var roleAdditionResult = await _userManager.AddToRoleAsync(user, request.RoleName);
                    if (!roleAdditionResult.Succeeded)
                    {
                        throw new Exception(string.Join("; ", roleAdditionResult.Errors.Select(e => e.Description)));
                    }
                }
                return true;


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                throw new Exception("Error updating user", ex);
            }
        }
    }



}
