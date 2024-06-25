using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Navigation;


    public record GetNavigationItemListByRoleQuery(List<string> UserRole) : IRequest<List<NavigationItemDto>>;



    public class GetNavigationItemListQueryHandler : IRequestHandler<GetNavigationItemListByRoleQuery, List<NavigationItemDto>>
    {
        private readonly GpsdataContext _context;

        private readonly ILogger<GetNavigationItemListQueryHandler> _logger;
        public GetNavigationItemListQueryHandler(GpsdataContext context, ILogger<GetNavigationItemListQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<NavigationItemDto>> Handle(GetNavigationItemListByRoleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var userRoles = request.UserRole;

                var navigationItems = await _context.Rolenavigations
                            .Where(r => userRoles.Contains(r.Role.Name))
                            .Select(r => r.NavigationItem)
                            .Distinct()
                            .Select(n => new NavigationItemDto
                            {
                                Id = n.Id,
                                Page = n.Page,
                                Link = n.Link?? string.Empty,
                                ParentId = n.ParentId,
                                Icon = n.Icon ?? string.Empty,
                                Roles = n.Rolenavigations.Select(nr => nr.Role.Name).ToList()

                            }).ToListAsync(cancellationToken);

                return navigationItems;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving navigation items");
                throw;
            }
        }
    }

    public class NavigationItemDto
{
    public int Id { get; set; }
    public string Page { get; set; }= null!;
    public string Link { get; set; } = null!;
    public int? ParentId { get; set; }
   
     public string Icon { get; set; } = null!;
     public List<string> Roles { get; set; } = new List<string>();
}