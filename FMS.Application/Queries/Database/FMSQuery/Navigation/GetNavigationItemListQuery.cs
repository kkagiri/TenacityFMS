using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.Navigation
{
    public record GetAllNavigationItemsQuery : IRequest<List<NavigationItemDto>>;

    public class GetAllNavigationItemsQueryHandler : IRequestHandler<GetAllNavigationItemsQuery, List<NavigationItemDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAllNavigationItemsQueryHandler> _logger;

        public GetAllNavigationItemsQueryHandler(GpsdataContext context, ILogger<GetAllNavigationItemsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<NavigationItemDto>> Handle(GetAllNavigationItemsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var navigationItems = await _context.Navigationitems
                    .Select(n => new NavigationItemDto
                    {
                        Id = n.Id,
                        Page = n.Page?? string.Empty,
                        Link = n.Link?? string.Empty,
                        ParentId = n.ParentId,
                        Icon = n.Icon ?? string.Empty,
                        Roles = n.Rolenavigations.Select(rn => rn.Role.Name).ToList()
                    }).ToListAsync(cancellationToken);

                return navigationItems;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all navigation items");
                throw;
            }
        }
    }
}
