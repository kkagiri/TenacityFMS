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

namespace FMS.Application.Command.DatabaseCommand.UserManagement
{
    public record UpdateUserSitesCommand : IRequest<List<Site>>
    {
        public string UserId { get; set; }
        public List<int> SiteIds { get; set; } = new List<int>();
    }

    public class UpdateUserSitesCommandHandler : IRequestHandler<UpdateUserSitesCommand, List<Site>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateUserSitesCommandHandler> _logger;

        public UpdateUserSitesCommandHandler(GpsdataContext context, ILogger<UpdateUserSitesCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Site>> Handle(UpdateUserSitesCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Updating sites for user {UserId}", request.UserId);

            var user = await _context.Users
                .Include(u => u.UserSites)
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", request.UserId);
                throw new ArgumentException($"User with ID {request.UserId} not found");
            }

            // Remove existing user-site relationships
            _context.RemoveRange(user.UserSites);

            // Get the sites to assign
            var sites = await _context.Sites
                .Where(s => request.SiteIds.Contains(s.Id))
                .ToListAsync(cancellationToken);

            // Create new user-site relationships
            foreach (var site in sites)
            {
                user.UserSites.Add(new UserSites
                {
                    UserId = user.Id,
                    SiteId = site.Id,
                    User = user,
                    Site = site
                });
            }

            await _context.SaveChangesAsync(cancellationToken);

            return sites;
        }
    }
}