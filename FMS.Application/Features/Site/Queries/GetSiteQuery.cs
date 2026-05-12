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
    public record GetSiteQuery(bool IncludeInactive = false) : IRequest<FMSResponse<List<SiteDTO>>>;

    public class GetSiteQueryHandler : IRequestHandler<GetSiteQuery, FMSResponse<List<SiteDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSiteQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetSiteQueryHandler(GpsdataContext context, ILogger<GetSiteQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<List<SiteDTO>>> Handle(GetSiteQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.Sites.AsQueryable();
                if (!request.IncludeInactive)
                {
                    query = query.Where(s => s.IsActive);
                }
                var sites = await query
                    .Include(s => s.SiteAdministrator)
                    .ToListAsync(cancellationToken);
                var siteDTOs = _mapper.Map<List<SiteDTO>>(sites);
                return FMSResponse<List<SiteDTO>>.Success(siteDTOs, "Sites retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSiteQuery");
                return FMSResponse<List<SiteDTO>>.Failed("An error occurred while retrieving sites");
            }
        }
    }
}
