/**
 * File: BatchRecomputeVehicleTripsCommand.cs
 * Purpose: Command contract and handler for batch-recomputing trips across vehicles filtered by type, site, vehicle, and GPS mapping.
 * Dependencies: MediatR, FMSResponse, VehicleTripBatchRecomputeResultDTO, GpsdataContext, IVehicleTripOrchestrationService.
 * Last Modified: 2026-03-17
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Commands;

public record BatchRecomputeVehicleTripsCommand : IRequest<FMSResponse<VehicleTripBatchRecomputeResultDTO>>
{
    public int? VehicleId { get; init; }
    public int? VehicleTypeId { get; init; }
    public int? SiteId { get; init; }
    public DateTime FromUtc { get; init; }
    public DateTime ToUtc { get; init; }
}

public class BatchRecomputeVehicleTripsCommandHandler
    : IRequestHandler<BatchRecomputeVehicleTripsCommand, FMSResponse<VehicleTripBatchRecomputeResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripOrchestrationService _orchestrationService;
    private readonly ILogger<BatchRecomputeVehicleTripsCommandHandler> _logger;

    public BatchRecomputeVehicleTripsCommandHandler(
        GpsdataContext context,
        IVehicleTripOrchestrationService orchestrationService,
        ILogger<BatchRecomputeVehicleTripsCommandHandler> logger)
    {
        _context = context;
        _orchestrationService = orchestrationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripBatchRecomputeResultDTO>> Handle(
        BatchRecomputeVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        if (request.FromUtc >= request.ToUtc)
            return FMSResponse<VehicleTripBatchRecomputeResultDTO>.Failed("FromUtc must be before ToUtc.");

        var vehicleIds = await ResolveGpsEquippedVehicleIdsAsync(request, cancellationToken);

        var result = new VehicleTripBatchRecomputeResultDTO
        {
            TotalVehiclesFound = vehicleIds.Count,
            FromUtc = request.FromUtc,
            ToUtc = request.ToUtc,
        };

        if (vehicleIds.Count == 0)
            return FMSResponse<VehicleTripBatchRecomputeResultDTO>.Success(result,
                "No GPS-equipped vehicles matched the given filters.");

        _logger.LogInformation(
            "Batch recompute starting for {Count} vehicle(s) [{From} — {To}]",
            vehicleIds.Count, request.FromUtc, request.ToUtc);

        foreach (var vehicleId in vehicleIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var response = await _orchestrationService.RecomputeVehicleTripsAsync(
                    vehicleId, request.FromUtc, request.ToUtc, cancellationToken);

                if (response.IsSuccess && response.Data != null)
                {
                    result.VehicleResults.Add(response.Data);
                    result.TotalVehiclesProcessed++;
                }
                else
                {
                    result.TotalVehiclesFailed++;
                    result.Errors.Add($"Vehicle {vehicleId}: {response.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch recompute failed for vehicle {VehicleId}", vehicleId);
                result.TotalVehiclesFailed++;
                result.Errors.Add($"Vehicle {vehicleId}: {ex.Message}");
            }
        }

        _logger.LogInformation(
            "Batch recompute finished. Processed={Processed}, Failed={Failed}",
            result.TotalVehiclesProcessed, result.TotalVehiclesFailed);

        return FMSResponse<VehicleTripBatchRecomputeResultDTO>.Success(result,
            $"Batch recompute completed: {result.TotalVehiclesProcessed} processed, {result.TotalVehiclesFailed} failed.");
    }

    private async Task<List<int>> ResolveGpsEquippedVehicleIdsAsync(
        BatchRecomputeVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        var query = _context.Vehicles.AsNoTracking().AsQueryable();

        if (request.VehicleId.HasValue)
            query = query.Where(v => v.VehicleId == request.VehicleId.Value);

        if (request.VehicleTypeId.HasValue)
            query = query.Where(v => v.VehicleTypeId == request.VehicleTypeId.Value);

        if (request.SiteId.HasValue)
            query = query.Where(v => v.WorkingSiteId == request.SiteId.Value);

        var vehicleIds = await query
            .Where(v => _context.VehicleProviderMappings.Any(m =>
                m.VehicleId == v.VehicleId
                && m.IsActive
                && !string.IsNullOrWhiteSpace(m.ExternalDeviceId)))
            .Select(v => v.VehicleId)
            .ToListAsync(cancellationToken);

        return vehicleIds;
    }
}
