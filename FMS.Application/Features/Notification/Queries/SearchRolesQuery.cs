/**
 * File: SearchRolesQuery.cs
 * Purpose: Query and handler to search roles by name.
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - SearchRolesQuery: Search term and take limit for role lookup.
 * - SearchRoleResultDto: Lightweight role result (id, name).
 * - SearchRolesQueryHandler: Queries roles from GpsdataContext.
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Queries
{
    public record SearchRolesQuery(string? Search = null, int Take = 20)
        : IRequest<FMSResponse<List<SearchRoleResultDto>>>;

    public class SearchRoleResultDto
    {
        public string Id { get; set; } = null!;
        public string? Name { get; set; }
    }

    public class SearchRolesQueryHandler
        : IRequestHandler<SearchRolesQuery, FMSResponse<List<SearchRoleResultDto>>>
    {
        private readonly GpsdataContext _context;

        public SearchRolesQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<List<SearchRoleResultDto>>> Handle(
            SearchRolesQuery request,
            CancellationToken cancellationToken)
        {
            var rolesQuery = _context.Roles.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                string term = request.Search.Trim();
                rolesQuery = rolesQuery.Where(r => r.Name != null && r.Name.Contains(term));
            }

            var data = await rolesQuery
                .Take(request.Take)
                .Select(r => new SearchRoleResultDto
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<SearchRoleResultDto>>.Success(data);
        }
    }
}
