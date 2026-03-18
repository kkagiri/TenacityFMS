/**
 * File: GetVehicleTripSettingsQuery.cs
 * Purpose: Query contract for reading VehicleTrips runtime settings.
 * Dependencies: MediatR, FMSResponse, VehicleTripSettingsDTO, IVehicleTripSettingsService.
 * Last Modified: 2026-03-12
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripSettingsQuery : IRequest<FMSResponse<VehicleTripSettingsDTO>>;

public class GetVehicleTripSettingsQueryHandler : IRequestHandler<GetVehicleTripSettingsQuery, FMSResponse<VehicleTripSettingsDTO>>
{
    private readonly IVehicleTripSettingsService _vehicleTripSettingsService;
    private readonly ILogger<GetVehicleTripSettingsQueryHandler> _logger;

    public GetVehicleTripSettingsQueryHandler(
        IVehicleTripSettingsService vehicleTripSettingsService,
        ILogger<GetVehicleTripSettingsQueryHandler> logger)
    {
        _vehicleTripSettingsService = vehicleTripSettingsService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripSettingsDTO>> Handle(
        GetVehicleTripSettingsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var settings = await _vehicleTripSettingsService.GetSettingsAsync(cancellationToken);

            return FMSResponse<VehicleTripSettingsDTO>.Success(
                settings,
                "Vehicle trip settings retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip settings");
            return FMSResponse<VehicleTripSettingsDTO>.SystemError(
                $"Failed to read vehicle trip settings: {ex.Message}");
        }
    }
}