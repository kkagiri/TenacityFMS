/**
 * File: GetVehicleTripHistoryQuery.cs
 * Purpose: Query contract for reading persisted trip history for a vehicle.
 * Dependencies: MediatR, FMSResponse, VehicleTripGroupDTO.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripHistoryQuery : IRequest<FMSResponse<List<VehicleTripGroupDTO>>>
{
    public int VehicleId { get; init; }
    public int? SiteId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
    public decimal? MinimumConfidenceScore { get; init; }
    public VehicleTripStatus? Status { get; init; }
    public VehicleTripGroupingType? GroupingType { get; init; }
    public VehicleTripReconciliationStatus? ReconciliationStatus { get; init; }
}

public class GetVehicleTripHistoryQueryHandler : IRequestHandler<GetVehicleTripHistoryQuery, FMSResponse<List<VehicleTripGroupDTO>>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IGetVehicleTripHistoryQueryValidator _validator;
    private readonly ILogger<GetVehicleTripHistoryQueryHandler> _logger;

    public GetVehicleTripHistoryQueryHandler(
        GpsdataContext context,
        IMapper mapper,
        IGetVehicleTripHistoryQueryValidator validator,
        ILogger<GetVehicleTripHistoryQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _validator = validator;
        _logger = logger;
    }

    public async Task<FMSResponse<List<VehicleTripGroupDTO>>> Handle(GetVehicleTripHistoryQuery request, CancellationToken cancellationToken)
    {
        var fromUtc = request.FromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
        var toUtc = request.ToUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<List<VehicleTripGroupDTO>>.ValidationFailed(validationErrors);
        }

        try
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(g => g.OriginSite)
                .Include(g => g.DestinationSite)
                .Include(g => g.Trips)
                .Where(g => g.VehicleId == request.VehicleId
                    && !g.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.SupersededPrefix)
                    && g.StartTimeUtc <= toUtc
                    && g.EndTimeUtc >= fromUtc);

            if (request.SiteId.HasValue)
            {
                query = query.Where(g => g.OriginSiteId == request.SiteId.Value || g.DestinationSiteId == request.SiteId.Value);
            }

            if (request.MinimumConfidenceScore.HasValue)
            {
                query = query.Where(g => g.ConfidenceScore >= request.MinimumConfidenceScore.Value);
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
                .ToListAsync(cancellationToken);

            var groups = _mapper.Map<List<VehicleTripGroupDTO>>(persistedGroups);

            return FMSResponse<List<VehicleTripGroupDTO>>.Success(groups, "Vehicle trip history retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip history for vehicle {VehicleId}", request.VehicleId);
            return FMSResponse<List<VehicleTripGroupDTO>>.SystemError($"Failed to read trip history: {ex.Message}");
        }
    }


}
