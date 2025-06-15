using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Site.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.Site.Commands
{
    public record UpdateSiteCommand(int Id, UpdateSiteDTO SiteDto) : IRequest<FMSResponse<bool>>;

    public class UpdateSiteCommandHandler : IRequestHandler<UpdateSiteCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateSiteCommandHandler> _logger;

        public UpdateSiteCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateSiteCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(UpdateSiteCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                var validationErrors = new List<string>();

                if (request.Id <= 0)
                {
                    validationErrors.Add("Valid site ID is required");
                }

                if (string.IsNullOrWhiteSpace(request.SiteDto.Name))
                {
                    validationErrors.Add("Site name is required");
                }

                if (request.SiteDto.Name?.Length > 255)
                {
                    validationErrors.Add("Site name must not exceed 255 characters");
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<bool>.ValidationFailed(validationErrors);
                }

                var site = await _context.Sites.FindAsync(request.Id);
                if (site == null)
                {
                    return FMSResponse<bool>.Failed("Site not found");
                }

                // Check if site name already exists (excluding current site)
                if (!string.IsNullOrWhiteSpace(request.SiteDto.Name))
                {
                    var existingSite = await _context.Sites
                        .AnyAsync(s => s.Name.ToLower() == request.SiteDto.Name.ToLower() && s.Id != request.Id, cancellationToken);

                    if (existingSite)
                    {
                        return FMSResponse<bool>.ValidationFailed(new List<string> { "A site with this name already exists" });
                    }
                }

                _mapper.Map(request.SiteDto, site);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Site updated successfully with ID: {SiteId}", site.Id);
                return FMSResponse<bool>.Success(true, "Site updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating site with ID: {SiteId}", request.Id);
                return FMSResponse<bool>.Failed("An error occurred while updating the site");
            }
        }
    }
}