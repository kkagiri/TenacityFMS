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
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.Site.Queries
{
    public record GetSiteByIdQuery(int Id) : IRequest<FMSResponse<SiteDTO>>;

    public class GetSiteByIdQueryHandler : IRequestHandler<GetSiteByIdQuery, FMSResponse<SiteDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSiteByIdQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetSiteByIdQueryHandler(GpsdataContext context, ILogger<GetSiteByIdQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<SiteDTO>> Handle(GetSiteByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                var validationErrors = new List<string>();

                if (request.Id <= 0)
                {
                    validationErrors.Add("Valid site ID is required");
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<SiteDTO>.ValidationFailed(validationErrors);
                }

                var site = await _context.Sites
                    .Include(s => s.SiteAdministrator)
                    .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
                if (site == null)
                {
                    return FMSResponse<SiteDTO>.Failed("Site not found");
                }

                var siteDTO = _mapper.Map<SiteDTO>(site);
                return FMSResponse<SiteDTO>.Success(siteDTO, "Site retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSiteByIdQuery for site ID: {SiteId}", request.Id);
                return FMSResponse<SiteDTO>.Failed("An error occurred while retrieving the site");
            }
        }
    }
}