/**
 * File: SearchUsersQuery.cs
 * Purpose: Query and handler to search users by username or email.
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-03-05
 *
 * Key Types:
 * - SearchUsersQuery: Search term and take limit for user lookup.
 * - SearchUserResultDto: Lightweight user result (id, userName, email).
 * - SearchUsersQueryHandler: Queries users from GpsdataContext.
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
    public record SearchUsersQuery(string? Search = null, int Take = 20)
        : IRequest<FMSResponse<List<SearchUserResultDto>>>;

    public class SearchUserResultDto
    {
        public string Id { get; set; } = null!;
        public string? UserName { get; set; }
        public string? Email { get; set; }
    }

    public class SearchUsersQueryHandler
        : IRequestHandler<SearchUsersQuery, FMSResponse<List<SearchUserResultDto>>>
    {
        private readonly GpsdataContext _context;

        public SearchUsersQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<List<SearchUserResultDto>>> Handle(
            SearchUsersQuery request,
            CancellationToken cancellationToken)
        {
            var usersQuery = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                string term = request.Search.Trim();
                usersQuery = usersQuery.Where(u =>
                    (u.UserName != null && u.UserName.Contains(term)) ||
                    (u.Email != null && u.Email.Contains(term)));
            }

            var data = await usersQuery
                .Take(request.Take)
                .Select(u => new SearchUserResultDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<SearchUserResultDto>>.Success(data);
        }
    }
}
