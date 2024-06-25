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
  public record RoleDeleteCommand(string RoleId) : IRequest<bool>;

    public class RoleDeleteCommandHandler : IRequestHandler<RoleDeleteCommand, bool>
    {

        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<RoleDeleteCommandHandler> _logger;

        public RoleDeleteCommandHandler(RoleManager<Role> roleManager, ILogger<RoleDeleteCommandHandler> logger)
        {
            _roleManager = roleManager;
            _logger = logger;
        }
        public async Task<bool> Handle(RoleDeleteCommand request, CancellationToken cancellationToken)
        {
        

            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId);
                if(role == null)
                {
                    throw new Exception("Role not found");
                }
                var result = await _roleManager.DeleteAsync(role);

                return result.Succeeded;
            }catch(Exception ex)
            {
                _logger.LogError(ex.Message);
                throw new Exception(ex.Message); // 
            }
        }
    }
}
