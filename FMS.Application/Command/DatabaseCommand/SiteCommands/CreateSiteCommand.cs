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
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.SiteCommands
{
    public record CreateSiteCommand(CreateSiteDTO SiteDto) : IRequest<FMSResponse<int>>;

    public class CreateSiteCommandHandler : IRequestHandler<CreateSiteCommand, FMSResponse<int>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateSiteCommandHandler> _logger;

        public CreateSiteCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateSiteCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<int>> Handle(CreateSiteCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.SiteDto.Name))
                {
                    validationErrors.Add("Site name is required");
                }

                if (request.SiteDto.Name?.Length > 255)
                {
                    validationErrors.Add("Site name must not exceed 255 characters");
                }

                // Check if site name already exists
                if (!string.IsNullOrWhiteSpace(request.SiteDto.Name))
                {
                    var existingSite = await _context.Sites
                        .AnyAsync(s => s.Name.ToLower() == request.SiteDto.Name.ToLower(), cancellationToken);

                    if (existingSite)
                    {
                        validationErrors.Add("A site with this name already exists");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                var site = _mapper.Map<Site>(request.SiteDto);

                _context.Sites.Add(site);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Site created successfully with ID: {SiteId}", site.Id);
                return FMSResponse<int>.Success(site.Id, "Site created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating site");
                return FMSResponse<int>.Failed("An error occurred while creating the site");
            }
        }
    }
}