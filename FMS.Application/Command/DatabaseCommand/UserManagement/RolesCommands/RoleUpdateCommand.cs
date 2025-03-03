using FMS.Application.ModelsDTOs.FMS.UserManagement;
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
    public record RoleUpdateCommand(RoleDto RoleDto) : IRequest<bool>;


    public class RoleUpdateCommandHandler : IRequestHandler<RoleUpdateCommand, bool>
    {
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<RoleUpdateCommandHandler> _logger;

        public RoleUpdateCommandHandler(RoleManager<Role> roleManager, ILogger<RoleUpdateCommandHandler> logger)
        {
            _logger = logger;
            _roleManager = roleManager;
        }


        public async Task<bool> Handle(RoleUpdateCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleDto.Id);

                if (role == null)
                {
                    _logger.LogWarning($"Role with ID {request.RoleDto.Id} not found.");
                    return false;
                };

                role.Name = request.RoleDto.Name;
                role.Description = request.RoleDto.Description;

                var result = await _roleManager.UpdateAsync(role);

                return result.Succeeded;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }


}
