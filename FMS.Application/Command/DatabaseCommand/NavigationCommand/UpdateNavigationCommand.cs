using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.NavigationCommand {
    public record UpdateNavigationCommand (string Link, string PageName, int Id, List<string> RoleIds, int? ParentId, string? Icon) : IRequest<bool>;

    public class UpdateNavigationCommandHandler : IRequestHandler<UpdateNavigationCommand, bool> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateNavigationCommandHandler> _logger;

        public UpdateNavigationCommandHandler (GpsdataContext context, ILogger<UpdateNavigationCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle (UpdateNavigationCommand request, CancellationToken cancellationToken) {
            try {

                //check if link and page name is empty
                if (string.IsNullOrEmpty (request.Link) || string.IsNullOrEmpty (request.PageName)) {
                    _logger.LogError ("Link or Page Name cannot be empty");
                    return false;
                }

                var navigationItem = await _context.Navigationitems.FindAsync (request.Id);
                if (navigationItem == null) {
                    _logger.LogError ($"Navigation item with ID {request.Id} not found.");
                    return false;
                }

                navigationItem.Link = request.Link;
                navigationItem.Page = request.PageName;
                navigationItem.ParentId = request.ParentId;
                navigationItem.Icon = request.Icon;

                // Update roles
                var existingRoleNavigations = _context.Rolenavigations.Where (rn => rn.NavigationItemId == request.Id);
                _context.Rolenavigations.RemoveRange (existingRoleNavigations);

                foreach (var roleId in request.RoleIds) {
                    var roleNavigation = new Rolenavigation {
                        RoleId = roleId,
                        NavigationItemId = request.Id
                    };
                    _context.Rolenavigations.Add (roleNavigation);
                }

                await _context.SaveChangesAsync (cancellationToken);

                return true;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating navigation item");
                throw;
            }
        }
    }

}