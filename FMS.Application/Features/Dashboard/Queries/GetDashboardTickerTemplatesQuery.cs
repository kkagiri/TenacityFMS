using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.Dashboard {
    /// <summary>
    /// Retrieve dashboard ticker templates visible to the specified user, with optional enabled-only filter.
    /// Role / permission filtering rules (enhanced for hierarchy + multi-role):
    /// ROLE HIERARCHY: Admin (3) > Manager (2) > User (1) > Guest (0)
    /// - Template.RequiredRole may be NULL/empty (means open to all roles subject to permissions) OR a single role OR a comma separated list of roles.
    /// - The effective required rank for the template is the MIN rank among the listed roles (listing User,Manager is equivalent to just User).
    /// - A user is allowed if their HIGHEST role rank >= required rank.
    /// - Unknown role tokens are ignored; if all tokens are unknown the template is excluded for safety.
    /// PERMISSIONS:
    /// - RequiredPermissions: comma separated; user must possess ALL permissions (logical AND) to view the template.
    /// - If RequiredPermissions empty/null then no permission gate.
    /// NOTES:
    /// - Admin no longer receives an unconditional bypass; hierarchy logic already grants access to anything requiring a lower or equal rank.
    /// </summary>
    /// <param name="UserId">Current user id (Identity)</param>
    /// <param name="OnlyEnabled">If true only templates with IsEnabled=true are returned.</param>
    public record GetDashboardTickerTemplatesQuery (string UserId, bool OnlyEnabled) : IRequest<FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>>>;

    public class GetDashboardTickerTemplatesQueryHandler : IRequestHandler<GetDashboardTickerTemplatesQuery, FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetDashboardTickerTemplatesQueryHandler> _logger;

        public GetDashboardTickerTemplatesQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetDashboardTickerTemplatesQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>>> Handle (GetDashboardTickerTemplatesQuery request, CancellationToken cancellationToken) {
            try {
                // Gather user roles
                List<string> userRoleIds = await _context.UserRoles
                    .Where (ur => ur.UserId == request.UserId)
                    .Select (ur => ur.RoleId)
                    .ToListAsync (cancellationToken);

                List<string> userRoleNames = new List<string> ();
                if (userRoleIds.Count > 0) {
                    userRoleNames = await _context.Roles
                        .Where (r => userRoleIds.Contains (r.Id))
                        .Select (r => r.Name)
                        .ToListAsync (cancellationToken);
                }

                // Gather permissions (distinct)
                List<string> permissionNames = new List<string> ();
                if (userRoleIds.Count > 0) {
                    permissionNames = await _context.RolePermissions
                        .Where (rp => userRoleIds.Contains (rp.RoleId))
                        .Select (rp => rp.Permission.Name)
                        .Distinct ()
                        .ToListAsync (cancellationToken);
                }

                // Role hierarchy mapping
                Dictionary<string, int> roleRank = new Dictionary<string, int> (System.StringComparer.OrdinalIgnoreCase) { { "Guest", 0 }, { "User", 1 }, { "Manager", 2 }, { "Admin", 3 }
                };
                int userHighestRank = -1;
                foreach (string rn in userRoleNames) {
                    if (roleRank.TryGetValue (rn ?? string.Empty, out int rnk) && rnk > userHighestRank) {
                        userHighestRank = rnk;
                    }
                }
                HashSet<string> roleSet = new HashSet<string> (userRoleNames, System.StringComparer.OrdinalIgnoreCase);
                HashSet<string> permSet = new HashSet<string> (permissionNames, System.StringComparer.OrdinalIgnoreCase);

                IQueryable<DashboardTickerTemplate> baseQuery = _context.DashboardTickerTemplates.AsNoTracking ();
                if (request.OnlyEnabled) {
                    baseQuery = baseQuery.Where (t => t.IsEnabled);
                }

                List<DashboardTickerTemplate> allTemplates = await baseQuery.ToListAsync (cancellationToken);

                List<DashboardTickerTemplate> filtered = new List<DashboardTickerTemplate> (allTemplates.Count);
                foreach (DashboardTickerTemplate template in allTemplates) {
                    // Role check with hierarchy & multi-role support
                    if (!string.IsNullOrWhiteSpace (template.RequiredRole)) {
                        string[] tokens = template.RequiredRole.Split (',');
                        List<int> ranks = new List<int> (tokens.Length);
                        foreach (string raw in tokens) {
                            string token = raw.Trim ();
                            if (token.Length == 0) {
                                continue;
                            }
                            if (roleRank.TryGetValue (token, out int rnk)) {
                                ranks.Add (rnk);
                            }
                        }
                        if (ranks.Count == 0) {
                            continue; // unknown roles only
                        }
                        int requiredRank = ranks.Min ();
                        if (userHighestRank < requiredRank) {
                            continue;
                        }
                    }
                    // Permission check (all required)
                    if (!string.IsNullOrWhiteSpace (template.RequiredPermissions)) {
                        string[] required = template.RequiredPermissions.Split (',');
                        bool missing = false;
                        foreach (string raw in required) {
                            string token = raw.Trim ();
                            if (token.Length == 0) {
                                continue;
                            }
                            if (!permSet.Contains (token)) {
                                missing = true;
                                break;
                            }
                        }
                        if (missing) {
                            continue;
                        }
                    }
                    filtered.Add (template);
                }

                IEnumerable<DashboardTickerTemplateDto> dto = _mapper.Map<IEnumerable<DashboardTickerTemplateDto>> (filtered);
                _logger.LogInformation ("User {UserId} templates filtered: total={Total} visible={Visible} roles={Roles} perms={Perms}", request.UserId, allTemplates.Count, filtered.Count, string.Join (";", userRoleNames), string.Join (";", permissionNames));
                return new FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>> (true, "Templates retrieved", dto);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error retrieving dashboard ticker templates for user {UserId}", request.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardTickerTemplateDto>> (false, ex.Message, null!);
            }
        }
    }
}