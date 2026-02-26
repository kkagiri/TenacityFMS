/**
 * File:          GetSiteStatsQueryHandler.cs
 * Purpose:       Handler that returns project-level site stats and GPSGate geofence context
 * Dependencies:  GpsdataContext, MediatR, FMSResponse, SiteStatsDTO
 * Last Modified: 2026-02-26
 *
 * Key Functions:
 * - Handle(): Validates SiteId, counts related entities, resolves geofence linkage summary
 */
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

namespace FMS.Application.Features.Site.Queries;

public class GetSiteStatsQueryHandler : IRequestHandler<GetSiteStatsQuery, FMSResponse<SiteStatsDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetSiteStatsQueryHandler> _logger;

    public GetSiteStatsQueryHandler(GpsdataContext context, ILogger<GetSiteStatsQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<SiteStatsDTO>> Handle(GetSiteStatsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.SiteId <= 0)
            {
                return FMSResponse<SiteStatsDTO>.Failed("Invalid site ID");
            }

            var site = await _context.Sites
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.SiteId, cancellationToken);

            if (site == null)
            {
                return FMSResponse<SiteStatsDTO>.Failed("Site not found");
            }

            var geofenceGroupIds = new List<int>();
            var geofenceCount = 0;
            var primaryGeofenceName = site.GpsGeofenceName;
            var primaryGeofenceLatitude = site.GpsGeofenceCenterLatitude;
            var primaryGeofenceLongitude = site.GpsGeofenceCenterLongitude;

            if (site.GpsGeofenceId.HasValue)
            {
                geofenceCount = 1;

                geofenceGroupIds = await _context.GpsGeofenceGroupMembers
                    .AsNoTracking()
                    .Where(m => m.GeofenceId == site.GpsGeofenceId.Value)
                    .Select(m => m.GroupId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
            }
            else
            {
                var geofenceGroupsQuery = _context.GpsGeofenceGroups
                    .AsNoTracking()
                    .Where(g => g.IsActive && g.IsAllowedForFueling);

                if (!string.IsNullOrWhiteSpace(site.GpsGateTagName))
                {
                    var normalizedTag = site.GpsGateTagName.Trim().ToLower();
                    geofenceGroupsQuery = geofenceGroupsQuery.Where(g => g.Name.ToLower().Contains(normalizedTag));
                }

                geofenceGroupIds = await geofenceGroupsQuery
                    .Select(g => g.Id)
                    .ToListAsync(cancellationToken);

                if (geofenceGroupIds.Count > 0)
                {
                    geofenceCount = await _context.GpsGeofenceGroupMembers
                        .AsNoTracking()
                        .Where(m => geofenceGroupIds.Contains(m.GroupId))
                        .Select(m => m.GeofenceId)
                        .Distinct()
                        .CountAsync(cancellationToken);

                    var primaryGeofence = await _context.GpsGeofenceGroupMembers
                        .AsNoTracking()
                        .Where(m => geofenceGroupIds.Contains(m.GroupId))
                        .Select(m => m.Geofence)
                        .Where(g => g.IsActive)
                        .OrderBy(g => g.Name)
                        .Select(g => new
                        {
                            g.Name,
                            g.CenterLatitude,
                            g.CenterLongitude
                        })
                        .FirstOrDefaultAsync(cancellationToken);

                    if (primaryGeofence != null)
                    {
                        primaryGeofenceName = primaryGeofence.Name;
                        primaryGeofenceLatitude = primaryGeofence.CenterLatitude;
                        primaryGeofenceLongitude = primaryGeofence.CenterLongitude;
                    }
                }
            }

            var stats = new SiteStatsDTO
            {
                TankCount = await _context.Tanks
                    .CountAsync(t => t.SiteId == request.SiteId, cancellationToken),
                VehicleCount = await _context.Vehicles
                    .CountAsync(v => v.WorkingSiteId == request.SiteId, cancellationToken),
                EmployeeCount = await _context.Employees
                    .CountAsync(e => e.SiteId == request.SiteId, cancellationToken),
                PtsDeviceCount = await _context.Ptsdevices
                    .CountAsync(p => p.Site == request.SiteId, cancellationToken),
                UserCount = await _context.UserSites
                    .Where(us => us.SiteId == request.SiteId)
                    .Select(us => us.UserId)
                    .Distinct()
                    .CountAsync(cancellationToken),
                IssueCount = await _context.Issuetrackers
                    .CountAsync(i => i.SiteId == request.SiteId, cancellationToken),
                OpenIssueCount = await _context.Issuetrackers
                    .CountAsync(i => i.SiteId == request.SiteId && i.ClosingDate == null, cancellationToken),
                GeofenceGroupCount = geofenceGroupIds.Count,
                GeofenceCount = geofenceCount,
                PrimaryGeofenceName = primaryGeofenceName,
                PrimaryGeofenceLatitude = primaryGeofenceLatitude,
                PrimaryGeofenceLongitude = primaryGeofenceLongitude
            };

            return FMSResponse<SiteStatsDTO>.Success(stats, "Site stats retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stats for site {SiteId}", request.SiteId);
            return FMSResponse<SiteStatsDTO>.Failed("An error occurred while retrieving site stats");
        }
    }
}
