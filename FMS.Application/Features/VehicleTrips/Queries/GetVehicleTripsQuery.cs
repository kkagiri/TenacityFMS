/**
 * File: GetVehicleTripsQuery.cs
 * Purpose: Query contract for the trip management workbench across vehicles.
 * Dependencies: MediatR, FMSResponse, VehicleTripListItemDTO.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Domain.Entities;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripsQuery : IRequest<FMSResponse<List<VehicleTripListItemDTO>>>
{
    public int? VehicleId { get; init; }
    public int? SiteId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
    public VehicleMovementProfile? MovementProfile { get; init; }
    public string? DetectionMode { get; init; }
    public decimal? MinimumConfidenceScore { get; init; }
    public bool? IsLowConfidence { get; init; }
    public VehicleTripStatus? Status { get; init; }
    public VehicleTripGroupingType? GroupingType { get; init; }
    public VehicleTripReconciliationStatus? ReconciliationStatus { get; init; }
}

public class GetVehicleTripsQueryHandler : IRequestHandler<GetVehicleTripsQuery, FMSResponse<List<VehicleTripListItemDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IGetVehicleTripsQueryValidator _validator;
    private readonly ILogger<GetVehicleTripsQueryHandler> _logger;

    public GetVehicleTripsQueryHandler(
        GpsdataContext context,
        IMapper mapper,
        IGetVehicleTripsQueryValidator validator,
        ILogger<GetVehicleTripsQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _validator = validator;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleTripListItemDTO>>> Handle(GetVehicleTripsQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<List<VehicleTripListItemDTO>>.ValidationFailed(validationErrors);
        }

        try
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(g => g.Vehicle)
                .Include(g => g.OriginSite)
                .Include(g => g.DestinationSite)
                .Include(g => g.Trips)
                .Where(g => !g.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.SupersededPrefix)
                    && g.StartTimeUtc <= toUtc
                    && g.EndTimeUtc >= fromUtc);

            if (request.VehicleId.HasValue)
            {
                query = query.Where(g => g.VehicleId == request.VehicleId.Value);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(g => g.OriginSiteId == request.SiteId.Value || g.DestinationSiteId == request.SiteId.Value);
            }

            if (request.MovementProfile.HasValue)
            {
                query = query.Where(g => g.MovementProfile == request.MovementProfile.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.DetectionMode))
            {
                var normalizedMode = request.DetectionMode.Trim();
                query = query.Where(g => g.DetectionMode == normalizedMode);
            }

            if (request.MinimumConfidenceScore.HasValue)
            {
                query = query.Where(g => g.ConfidenceScore >= request.MinimumConfidenceScore.Value);
            }

            if (request.IsLowConfidence.HasValue)
            {
                if (request.IsLowConfidence.Value)
                {
                    query = query.Where(g => g.ConfidenceScore < 0.60m);
                }
                else
                {
                    query = query.Where(g => g.ConfidenceScore >= 0.60m);
                }
            }

            if (request.Status.HasValue)
            {
                query = query.Where(g => g.Status == (int)request.Status.Value);
            }

            if (request.GroupingType.HasValue)
            {
                query = query.Where(g => g.GroupingType == (int)request.GroupingType.Value);
            }

            if (request.ReconciliationStatus.HasValue)
            {
                query = query.Where(g => g.ReconciliationStatus == (int)request.ReconciliationStatus.Value);
            }

            var persistedGroups = await query
                .OrderByDescending(g => g.StartTimeUtc)
                .Take(500)
                .ToListAsync(cancellationToken);

            var results = _mapper.Map<List<VehicleTripListItemDTO>>(persistedGroups);

            return FMSResponse<List<VehicleTripListItemDTO>>.Success(results, "Vehicle trips retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trips for trip management page");
            return FMSResponse<List<VehicleTripListItemDTO>>.SystemError($"Failed to read vehicle trips: {ex.Message}");
        }
    }


}
