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
    public record GetAllNavigationItemsQuery : IRequest<List<AllNavigationItemDto>>;

    public class GetAllNavigationItemsQueryHandler : IRequestHandler<GetAllNavigationItemsQuery, List<AllNavigationItemDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetAllNavigationItemsQueryHandler> _logger;

        public GetAllNavigationItemsQueryHandler(GpsdataContext context, ILogger<GetAllNavigationItemsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<AllNavigationItemDto>> Handle(GetAllNavigationItemsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var navigationItems = await _context.Navigationitems
                    .Include(n => n.Rolenavigations)
                    .ThenInclude(rn => rn.Role)
                    .Select(n => new AllNavigationItemDto
                    {
                        Id = n.Id,
                        Page = n.Page ?? string.Empty,
                        Link = n.Link ?? string.Empty,
                        ParentId = n.ParentId,
                        Icon = n.Icon ?? string.Empty,
                        Roles = n.Rolenavigations.Select(rn => rn.Role.Name).ToList(),
                        Rolenavigations = n.Rolenavigations.Select(rn => new RoleNavigationDto
                        {
                            RoleId = rn.RoleId,
                            RoleName = rn.Role.Name
                        }).ToList()
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

    public class AllNavigationItemDto
    {
        public int Id { get; set; }
        public string Page { get; set; } = null!;
        public string Link { get; set; } = null!;
        public int? ParentId { get; set; }
        public string Icon { get; set; } = null!;
        public List<string> Roles { get; set; } = new List<string>();
        public List<RoleNavigationDto> Rolenavigations { get; set; } = new List<RoleNavigationDto>();
    }

    public class RoleNavigationDto
    {
        public string RoleId { get; set; } = null!;
        public string RoleName { get; set; } = null!;
    }
}
