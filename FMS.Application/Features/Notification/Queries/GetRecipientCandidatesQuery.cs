/**
 * File: GetRecipientCandidatesQuery.cs
 * Purpose: Query and handler for retrieving enriched recipient candidates for the dual-pane picker.
 * Dependencies: MediatR, GpsdataContext, RecipientCandidateDto
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - GetRecipientCandidatesQuery: Filters users by site, department, admin status, and search term.
 * - GetRecipientCandidatesQueryHandler: Queries users with site/department enrichment.
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Queries
{
    public record GetRecipientCandidatesQuery(
        int? SiteId = null,
        int? DepartmentId = null,
        bool? IsSiteAdmin = null,
        string? Search = null,
        int Take = 100,
        bool ApplySiteAssignmentFilter = true
    ) : IRequest<FMSResponse<List<RecipientCandidateDto>>>;

    public class GetRecipientCandidatesQueryHandler
        : IRequestHandler<GetRecipientCandidatesQuery, FMSResponse<List<RecipientCandidateDto>>>
    {
        private readonly GpsdataContext _context;

        public GetRecipientCandidatesQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<List<RecipientCandidateDto>>> Handle(
            GetRecipientCandidatesQuery request,
            CancellationToken cancellationToken)
        {
            // Start with all active users
            var usersQuery = _context.Users
                .Where(u => u.IsDeleted != true);

            // Filter by search term
            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                string term = request.Search.Trim();
                usersQuery = usersQuery.Where(u =>
                    (u.UserName != null && u.UserName.Contains(term)) ||
                    (u.Email != null && u.Email.Contains(term)));
            }

            // Filter by department
            if (request.DepartmentId.HasValue)
            {
                usersQuery = usersQuery.Where(u => u.DepartmentId == request.DepartmentId.Value);
            }

            // Filter by site assignment via UserSites
            if (request.SiteId.HasValue && request.ApplySiteAssignmentFilter)
            {
                var userIdsAtSite = _context.UserSites
                    .Where(us => us.SiteId == request.SiteId.Value)
                    .Select(us => us.UserId);
                usersQuery = usersQuery.Where(u => userIdsAtSite.Contains(u.Id));
            }

            // Get site admin user IDs
            var siteAdminUserIds = await _context.Sites
                .Where(s => s.SiteAdministratorId != null)
                .Select(s => s.SiteAdministratorId!)
                .Distinct()
                .ToListAsync(cancellationToken);
            var siteAdminSet = new HashSet<string>(siteAdminUserIds);

            // Filter by site admin flag
            if (request.IsSiteAdmin == true)
            {
                usersQuery = usersQuery.Where(u => siteAdminSet.Contains(u.Id));
            }

            // Execute user query
            var users = await usersQuery
                .Take(request.Take)
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.Email,
                    u.DepartmentId
                })
                .ToListAsync(cancellationToken);

            var userIds = users.Select(u => u.Id).ToList();

            // Batch-load site assignments
            var userSiteAssignments = await _context.UserSites
                .Where(us => userIds.Contains(us.UserId))
                .Join(_context.Sites, us => us.SiteId, s => s.Id, (us, s) => new { us.UserId, s.Id, s.Name })
                .ToListAsync(cancellationToken);

            // Batch-load admin sites
            var adminSites = await _context.Sites
                .Where(s => s.SiteAdministratorId != null && userIds.Contains(s.SiteAdministratorId))
                .Select(s => new { UserId = s.SiteAdministratorId!, s.Id, s.Name })
                .ToListAsync(cancellationToken);

            // Batch-load department names
            var departmentIds = users.Where(u => u.DepartmentId.HasValue).Select(u => u.DepartmentId!.Value).Distinct().ToList();
            var deptLookup = new Dictionary<int, string>();
            if (departmentIds.Any())
            {
                var deptData = await _context.Departments
                    .Where(d => departmentIds.Contains(d.DepartmentId))
                    .Select(d => new { d.DepartmentId, d.Name })
                    .ToListAsync(cancellationToken);
                foreach (var d in deptData) deptLookup[d.DepartmentId] = d.Name;
            }

            // Build result DTOs
            var data = users.Select(u => new RecipientCandidateDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Email = u.Email,
                DepartmentId = u.DepartmentId,
                DepartmentName = u.DepartmentId.HasValue && deptLookup.ContainsKey(u.DepartmentId.Value)
                    ? deptLookup[u.DepartmentId.Value] : null,
                IsSiteAdmin = siteAdminSet.Contains(u.Id),
                AdminOfSites = adminSites
                    .Where(a => a.UserId == u.Id)
                    .Select(a => new RecipientCandidateSiteDto { Id = a.Id, Name = a.Name })
                    .ToList(),
                AssignedSites = userSiteAssignments
                    .Where(a => a.UserId == u.Id)
                    .Select(a => new RecipientCandidateSiteDto { Id = a.Id, Name = a.Name })
                    .ToList()
            }).ToList();

            return FMSResponse<List<RecipientCandidateDto>>.Success(data);
        }
    }
}
