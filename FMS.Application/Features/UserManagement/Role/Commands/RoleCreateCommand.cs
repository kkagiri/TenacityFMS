using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.RolesCommands
{
    public record RoleCreateCommand(string RoleName, string Description) : IRequest<string>;

    public class RoleCreateCommandHandler : IRequestHandler<RoleCreateCommand, string>
    {

        private readonly RoleManager<Role> _roleManager;

        private readonly ILogger<RoleCreateCommandHandler> _logger;


        public RoleCreateCommandHandler(RoleManager<Role> role, ILogger<RoleCreateCommandHandler> logger)
        {
            _roleManager = role;
            _logger = logger;
        }

        public async Task<string> Handle(RoleCreateCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var role = new Role
                {
                    Name = request.RoleName,
                    Description = request.Description,

                };
                var results = await _roleManager.CreateAsync(role);

                if (results.Succeeded)
                {
                    return role.Id;
                }
                else
                {
                    var errors = string.Join(", ", results.Errors.Select(e => e.Description));
                    throw new Exception($"Role creation failed: {errors}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}
