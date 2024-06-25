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

namespace FMS.Application.Command.DatabaseCommand.UserManagement
{
   public record AssignUserRoleCommand (string UserID,string RoleName) :IRequest<bool>;

    public class AssignUserRoleCommandHandler : IRequestHandler<AssignUserRoleCommand, bool>
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<AssignUserRoleCommandHandler> _logger;

        public AssignUserRoleCommandHandler(UserManager<User> userManager, RoleManager<Role> roleManager,ILogger<AssignUserRoleCommandHandler> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }
        public async Task<bool> Handle(AssignUserRoleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(request.UserID);
                if (user == null)
                {
                    throw new Exception("User not found");
                }

                var role = await _roleManager.FindByNameAsync(request.RoleName);
                if (role == null)
                {
                    throw new Exception("Role not found");
                }

                var result = await _userManager.AddToRoleAsync(user, request.RoleName);
                if (!result.Succeeded)
                {
                    throw new Exception("Failed to assign role");
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}
