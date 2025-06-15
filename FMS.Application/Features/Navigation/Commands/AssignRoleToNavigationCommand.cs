using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.NavigationCommand
{
    public record AssignRoleToNavigationCommand(List<string> RoleIds, int NavigationItemId) : IRequest<bool>;


    public class AssignRoleToNavigationCommandHandler : IRequestHandler<AssignRoleToNavigationCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignRoleToNavigationCommandHandler> _logger;

        public AssignRoleToNavigationCommandHandler(GpsdataContext context, ILogger<AssignRoleToNavigationCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<bool> Handle(AssignRoleToNavigationCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var navigationItem = await _context.Navigationitems.FindAsync(request.NavigationItemId, cancellationToken);
                if (navigationItem == null)
                {
                    _logger.LogError($"Navigation item with ID {request.NavigationItemId} not found.");
                    return false;
                }

                foreach (var roleId in request.RoleIds)
                {
                    var role = await _context.Roles.FindAsync(roleId);
                    if (role == null)
                    {
                        _logger.LogError($"Role with ID {roleId} not found.");
                        continue;
                    }

                    var roleNavigation = new Rolenavigation
                    {
                        RoleId = roleId,
                        NavigationItemId = request.NavigationItemId
                    };

                    _context.Rolenavigations.Add(roleNavigation);
                }

                await _context.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning roles to navigation item");
                return false;
            }
        }

    }
}