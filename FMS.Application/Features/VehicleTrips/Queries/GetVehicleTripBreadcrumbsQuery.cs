/**
 * File: GetVehicleTripBreadcrumbsQuery.cs
 * Purpose: Query contract for loading GPS breadcrumb points for one persisted vehicle trip group.
 * Dependencies: MediatR, FMSResponse, VehicleTripBreadcrumbsDTO, IGPSService.
 * Last Modified: 2026-03-13
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Validators;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripBreadcrumbsQuery : IRequest<FMSResponse<VehicleTripBreadcrumbsDTO>>
{
    public int VehicleTripGroupId { get; init; }
    public int MaxPoints { get; init; } = 2000;
}

public class GetVehicleTripBreadcrumbsQueryHandler : IRequestHandler<GetVehicleTripBreadcrumbsQuery, FMSResponse<VehicleTripBreadcrumbsDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IGPSService _gpsService;
    private readonly IGetVehicleTripBreadcrumbsQueryValidator _validator;
    private readonly ILogger<GetVehicleTripBreadcrumbsQueryHandler> _logger;

    public GetVehicleTripBreadcrumbsQueryHandler(
        GpsdataContext context,
        IGPSService gpsService,
        IGetVehicleTripBreadcrumbsQueryValidator validator,
        ILogger<GetVehicleTripBreadcrumbsQueryHandler> logger)
    {
        _context = context;
        _gpsService = gpsService;
        _validator = validator;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripBreadcrumbsDTO>> Handle(GetVehicleTripBreadcrumbsQuery request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripBreadcrumbsDTO>.ValidationFailed(validationErrors);
        }

        try
        {
            var group = await _context.VehicleTripGroups
                .AsNoTracking()
                .Where(item => item.VehicleTripGroupId == request.VehicleTripGroupId)
                .Select(item => new
                {
                    item.VehicleTripGroupId,
                    item.VehicleId,
                    item.StartTimeUtc,
                    item.EndTimeUtc,
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (group == null)
            {
                return FMSResponse<VehicleTripBreadcrumbsDTO>.NotFound(
                    "VEHICLE_TRIP_GROUP_NOT_FOUND",
                    $"Trip group {request.VehicleTripGroupId} was not found.");
            }

            var fromUtc = group.StartTimeUtc.AddMinutes(-2);
            var toUtc = group.EndTimeUtc.AddMinutes(2);
            var trackPointsResponse = await _gpsService.GetTrackPointsAsync(group.VehicleId, fromUtc, toUtc, request.MaxPoints);
            if (!trackPointsResponse.IsSuccess)
            {
                return FMSResponse<VehicleTripBreadcrumbsDTO>.Failed(trackPointsResponse.Message);
            }

            var trackPoints = (trackPointsResponse.Data ?? new System.Collections.Generic.List<TrackPointDTO>())
                .Where(point => point.IsValid
                    && point.Timestamp >= fromUtc
                    && point.Timestamp <= toUtc
                    && Math.Abs(point.Latitude) <= 90m
                    && Math.Abs(point.Longitude) <= 180m)
                .OrderBy(point => point.Timestamp)
                .ToList();

            var payload = new VehicleTripBreadcrumbsDTO
            {
                VehicleTripGroupId = group.VehicleTripGroupId,
                VehicleId = group.VehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
                PointCount = trackPoints.Count,
                TrackPoints = trackPoints,
            };

            return FMSResponse<VehicleTripBreadcrumbsDTO>.Success(payload, "Vehicle trip breadcrumbs retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip breadcrumbs for group {VehicleTripGroupId}", request.VehicleTripGroupId);
            return FMSResponse<VehicleTripBreadcrumbsDTO>.SystemError($"Failed to read trip breadcrumbs: {ex.Message}");
        }
    }
}