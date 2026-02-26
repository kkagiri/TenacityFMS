using FMS.Application.Common;
using FMS.Domain.Entities;
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
    public record RoleDeleteCommand(string RoleId) : IRequest<FMSResponse<bool>>;

    public class RoleDeleteCommandHandler : IRequestHandler<RoleDeleteCommand, FMSResponse<bool>>
    {

        private readonly RoleManager<Role> _roleManager;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<RoleDeleteCommandHandler> _logger;

        public RoleDeleteCommandHandler(
            RoleManager<Role> roleManager,
            UserManager<User> userManager,
            ILogger<RoleDeleteCommandHandler> logger)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _logger = logger;
        }
        public async Task<FMSResponse<bool>> Handle(RoleDeleteCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId);
                if (role == null)
                {
                    return FMSResponse<bool>.Failed("Role not found.");
                }

                // Check if any users are assigned to this role
                var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);
                if (usersInRole != null && usersInRole.Count > 0)
                {
                    return FMSResponse<bool>.Failed(
                        $"Cannot delete role '{role.Name}' because it has {usersInRole.Count} user(s) assigned. Please transfer the users to another role first.");
                }

                var result = await _roleManager.DeleteAsync(role);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return FMSResponse<bool>.Failed($"Failed to delete role: {errors}");
                }

                return FMSResponse<bool>.Success(true, $"Role '{role.Name}' deleted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role {RoleId}", request.RoleId);
                return FMSResponse<bool>.Failed($"Error deleting role: {ex.Message}");
            }
        }
    }
}
