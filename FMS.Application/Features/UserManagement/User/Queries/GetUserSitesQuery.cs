using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
    public record GetUserSitesQuery(string UserId) : IRequest<List<Site>>;

    public class GetUserSitesQueryHandler : IRequestHandler<GetUserSitesQuery, List<Site>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetUserSitesQueryHandler> _logger;

        public GetUserSitesQueryHandler(GpsdataContext context, ILogger<GetUserSitesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Site>> Handle(GetUserSitesQuery request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Getting sites for user {UserId}", request.UserId);

            var user = await _context.Users
                .Include(u => u.UserSites)
                .ThenInclude(us => us.Site)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", request.UserId);
                return new List<Site>();
            }

            var sites = user.UserSites
                .Where(us => us.Site != null)
                .Select(us => us.Site)
                .ToList();

            return sites;
        }
    }
}