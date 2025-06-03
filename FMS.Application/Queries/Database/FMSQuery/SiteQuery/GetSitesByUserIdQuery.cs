using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Models;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.SiteQuery
{
    public record GetSitesByUserIdQuery(string UserId) : IRequest<FMSResponse<List<SiteDTO>>>;

    public class GetSitesByUserIdQueryHandler : IRequestHandler<GetSitesByUserIdQuery, FMSResponse<List<SiteDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSitesByUserIdQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetSitesByUserIdQueryHandler(GpsdataContext context, ILogger<GetSitesByUserIdQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<List<SiteDTO>>> Handle(GetSitesByUserIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.UserId))
                {
                    validationErrors.Add("User ID is required");
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<List<SiteDTO>>.ValidationFailed(validationErrors);
                }

                //To:do verify if the userID is valid
                var userId = await _context.Users.FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken);
                if (userId == null)
                {
                    return FMSResponse<List<SiteDTO>>.Failed("Invalid User ID");
                }

                var sites = await _context.Sites
                    .Join(_context.UserSites, site => site.Id,
                           usersite => usersite.SiteId,
                           (site, usersite) => new { site, usersite })
                    .Where(x => x.usersite.UserId == userId.Id)
                    .Select(x => x.site)
                    .OrderBy(x => x.Name)
                    .ToListAsync(cancellationToken);

                var siteDTOs = _mapper.Map<List<SiteDTO>>(sites);
                return FMSResponse<List<SiteDTO>>.Success(siteDTOs, "User sites retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSitesByUserIdQueryHandler for user {UserId}", request.UserId);
                return FMSResponse<List<SiteDTO>>.Failed("An error occurred while retrieving user sites");
            }
        }
    }
}
