/**
 * File: BatchReconcileVehicleTripsCommand.cs
 * Purpose: Command contract and handler for batch-reconciling trips across vehicles filtered by type, site, vehicle, and GPS mapping.
 * Dependencies: MediatR, FMSResponse, VehicleTripBatchReconciliationResultDTO, GpsdataContext, IVehicleTripReconciliationService.
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

public record BatchReconcileVehicleTripsCommand : IRequest<FMSResponse<VehicleTripBatchReconciliationResultDTO>>
{
    public int? VehicleId { get; init; }
    public int? VehicleTypeId { get; init; }
    public int? SiteId { get; init; }
    public DateTime FromUtc { get; init; }
    public DateTime ToUtc { get; init; }
    public bool PreviewOnly { get; init; } = true;
}

public class BatchReconcileVehicleTripsCommandHandler
    : IRequestHandler<BatchReconcileVehicleTripsCommand, FMSResponse<VehicleTripBatchReconciliationResultDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripReconciliationService _reconciliationService;
    private readonly ILogger<BatchReconcileVehicleTripsCommandHandler> _logger;

    public BatchReconcileVehicleTripsCommandHandler(
        GpsdataContext context,
        IVehicleTripReconciliationService reconciliationService,
        ILogger<BatchReconcileVehicleTripsCommandHandler> logger)
    {
        _context = context;
        _reconciliationService = reconciliationService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripBatchReconciliationResultDTO>> Handle(
        BatchReconcileVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        if (request.FromUtc >= request.ToUtc)
            return FMSResponse<VehicleTripBatchReconciliationResultDTO>.Failed("FromUtc must be before ToUtc.");

        var vehicleIds = await ResolveGpsEquippedVehicleIdsAsync(request, cancellationToken);

        var result = new VehicleTripBatchReconciliationResultDTO
        {
            TotalVehiclesFound = vehicleIds.Count,
            PreviewOnly = request.PreviewOnly,
            FromUtc = request.FromUtc,
            ToUtc = request.ToUtc,
        };

        if (vehicleIds.Count == 0)
            return FMSResponse<VehicleTripBatchReconciliationResultDTO>.Success(result,
                "No GPS-equipped vehicles matched the given filters.");

        _logger.LogInformation(
            "Batch reconciliation starting for {Count} vehicle(s) [{From} — {To}], PreviewOnly={Preview}",
            vehicleIds.Count, request.FromUtc, request.ToUtc, request.PreviewOnly);

        foreach (var vehicleId in vehicleIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var response = await _reconciliationService.ReconcileVehicleTripsAsync(
                    vehicleId, request.FromUtc, request.ToUtc, request.PreviewOnly, cancellationToken);

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
                _logger.LogError(ex, "Batch reconciliation failed for vehicle {VehicleId}", vehicleId);
                result.TotalVehiclesFailed++;
                result.Errors.Add($"Vehicle {vehicleId}: {ex.Message}");
            }
        }

        _logger.LogInformation(
            "Batch reconciliation finished. Processed={Processed}, Failed={Failed}",
            result.TotalVehiclesProcessed, result.TotalVehiclesFailed);

        return FMSResponse<VehicleTripBatchReconciliationResultDTO>.Success(result,
            $"Batch reconciliation completed: {result.TotalVehiclesProcessed} processed, {result.TotalVehiclesFailed} failed.");
    }

    private async Task<List<int>> ResolveGpsEquippedVehicleIdsAsync(
        BatchReconcileVehicleTripsCommand request, CancellationToken cancellationToken)
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
