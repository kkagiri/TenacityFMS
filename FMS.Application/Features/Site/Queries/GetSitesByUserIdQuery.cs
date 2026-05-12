using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Site.DTOs;
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

namespace FMS.Application.Features.Site.Queries
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

                // Get active sites associated with the user
                var userSites = await _context.UserSites
                    .Where(us => us.UserId == request.UserId)
                    .Include(us => us.Site)
                    .Select(us => us.Site)
                    .Where(s => s.IsActive)
                    .ToListAsync(cancellationToken);

                var siteDTOs = _mapper.Map<List<SiteDTO>>(userSites);
                return FMSResponse<List<SiteDTO>>.Success(siteDTOs, "User sites retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSitesByUserIdQuery for user ID: {UserId}", request.UserId);
                return FMSResponse<List<SiteDTO>>.Failed("An error occurred while retrieving user sites");
            }
        }
    }
}
