/**
 * File: CreateSiteCommand.cs
 * Purpose: Creates site records with optional GPSGate tag/geofence configuration.
 * Dependencies: AutoMapper, GpsdataContext, MediatR, FMSResponse.
 * Last Modified: 2026-02-26
 */
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Site.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using Sites = FMS.Domain.Entities;
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

                var selectedGeofence = default(GpsGeofence);
                if (request.SiteDto.GpsGeofenceId.HasValue)
                {
                    selectedGeofence = await _context.GpsGeofences
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            g => g.Id == request.SiteDto.GpsGeofenceId.Value && g.IsActive,
                            cancellationToken);

                    if (selectedGeofence == null)
                    {
                        validationErrors.Add("Selected GPS geofence was not found or is inactive");
                    }
                    else if (selectedGeofence.GeofenceType != GpsGeofenceType.Polygon)
                    {
                        validationErrors.Add("Selected GPS geofence must be a Polygon type");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                var site = _mapper.Map<Sites.Site>(request.SiteDto);

                if (selectedGeofence != null)
                {
                    site.GpsGeofenceId = selectedGeofence.Id;
                    site.GpsGeofenceName = selectedGeofence.Name;
                    site.GpsGeofenceType = selectedGeofence.GeofenceType.ToString();
                    site.GpsGeofenceCenterLatitude = selectedGeofence.CenterLatitude;
                    site.GpsGeofenceCenterLongitude = selectedGeofence.CenterLongitude;
                }
                else
                {
                    site.GpsGeofenceId = null;
                    site.GpsGeofenceName = null;
                    site.GpsGeofenceType = null;
                    site.GpsGeofenceCenterLatitude = null;
                    site.GpsGeofenceCenterLongitude = null;
                }

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
