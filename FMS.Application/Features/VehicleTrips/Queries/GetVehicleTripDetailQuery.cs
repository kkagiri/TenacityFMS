/**
 * File: GetVehicleTripDetailQuery.cs
 * Purpose: Query contract for reading one persisted vehicle trip group with its trip legs.
 * Dependencies: MediatR, FMSResponse, VehicleTripDetailDTO.
 * Last Modified: 2026-03-17
 */
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Application.Features.VehicleTrips.Validators;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripDetailQuery : IRequest<FMSResponse<VehicleTripDetailDTO>>
{
    public int VehicleTripGroupId { get; init; }
}

public class GetVehicleTripDetailQueryHandler : IRequestHandler<GetVehicleTripDetailQuery, FMSResponse<VehicleTripDetailDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IGetVehicleTripDetailQueryValidator _validator;
    private readonly ILogger<GetVehicleTripDetailQueryHandler> _logger;

    public GetVehicleTripDetailQueryHandler(
        GpsdataContext context,
        IMapper mapper,
        IGetVehicleTripDetailQueryValidator validator,
        ILogger<GetVehicleTripDetailQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _validator = validator;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripDetailDTO>> Handle(GetVehicleTripDetailQuery request, CancellationToken cancellationToken)
    {
        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripDetailDTO>.ValidationFailed(validationErrors);
        }

        try
        {
            var group = await _context.VehicleTripGroups
                .AsNoTracking()
                .Include(g => g.Vehicle)
                .Include(g => g.OriginSite)
                .Include(g => g.DestinationSite)
                .Include(g => g.Trips)
                    .ThenInclude(t => t.OriginSite)
                .Include(g => g.Trips)
                    .ThenInclude(t => t.DestinationSite)
                .FirstOrDefaultAsync(g => g.VehicleTripGroupId == request.VehicleTripGroupId, cancellationToken);

            if (group == null)
            {
                return FMSResponse<VehicleTripDetailDTO>.NotFound("VEHICLE_TRIP_GROUP_NOT_FOUND", $"Trip group {request.VehicleTripGroupId} was not found.");
            }

            var result = _mapper.Map<VehicleTripDetailDTO>(group);

            return FMSResponse<VehicleTripDetailDTO>.Success(result, "Vehicle trip detail retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip detail for group {VehicleTripGroupId}", request.VehicleTripGroupId);
            return FMSResponse<VehicleTripDetailDTO>.SystemError($"Failed to read trip detail: {ex.Message}");
        }
    }


}
