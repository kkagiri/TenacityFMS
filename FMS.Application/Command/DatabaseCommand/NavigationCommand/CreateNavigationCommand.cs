using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.NavigationCommand;

public record CreateNavigationItemCommand(string Link, int ParentId, string Icon, string Page, List<string> Roles) : IRequest<int>;

public class CreateNavigationItemCommandHandler : IRequestHandler<CreateNavigationItemCommand, int>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateNavigationItemCommandHandler> _logger;

    public CreateNavigationItemCommandHandler(GpsdataContext context, ILogger<CreateNavigationItemCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> Handle(CreateNavigationItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var navigationItem = new Navigationitem
            {
                Link = request.Link,
                Page = request.Page,
                ParentId = request.ParentId,
                Icon = request.Icon

            };
            _context.Navigationitems.Add(navigationItem);
            await _context.SaveChangesAsync(cancellationToken);

            // Assign roles after creating the navigation item
            foreach (var roleId in request.Roles)
            {
                var roleNavigation = new Rolenavigation
                {
                    RoleId = roleId,
                    NavigationItemId = navigationItem.Id
                };
                _context.Rolenavigations.Add(roleNavigation);
            }
            await _context.SaveChangesAsync(cancellationToken);

            return navigationItem.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating navigation item");
            throw;
        }
    }
}
