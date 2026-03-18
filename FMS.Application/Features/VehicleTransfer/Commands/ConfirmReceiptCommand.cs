/**
 * File: ConfirmReceiptCommand.cs
 * Purpose: Command contract for confirming vehicle receipt at destination (InTransit → Completed).
 * Dependencies: FMSResponse, VehicleTransferDTO
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - ConfirmReceiptCommand: Carries transfer id, receiver user id, and optional remarks.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using MediatR;
using AutoMapper;
using FMS.Application.Features.VehicleTransfer.Services;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Threading;
using System;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record ConfirmReceiptCommand(
    int TransferId,
    string? UserId,
    string? Remarks
) : IRequest<FMSResponse<VehicleTransferDTO>>;

public class ConfirmReceiptCommandHandler : IRequestHandler<ConfirmReceiptCommand, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly IVehicleTransferNotificationService _notificationService;
    private readonly IGpsGateTagTransferService? _tagTransferService;
    private readonly ILogger<ConfirmReceiptCommandHandler> _logger;

    public ConfirmReceiptCommandHandler(
        GpsdataContext context,
        IMapper mapper,
        IVehicleTransferNotificationService notificationService,
        ILogger<ConfirmReceiptCommandHandler> logger,
        IGpsGateTagTransferService? tagTransferService = null)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _logger = logger;
        _tagTransferService = tagTransferService;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(ConfirmReceiptCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            if (!string.Equals(transfer.Status, "InTransit", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<VehicleTransferDTO>.Failed(
                    "Only InTransit transfers can be confirmed as received",
                    "VALIDATION_ERROR");
            }

            // Transition to Completed
            transfer.Status = "Completed";
            transfer.ReceivedAt = DateTime.UtcNow;
            transfer.ArrivalTime = DateTime.UtcNow;
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.Remarks))
            {
                transfer.Remarks = string.IsNullOrWhiteSpace(transfer.Remarks)
                    ? $"[Received {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC] {request.Remarks}"
                    : $"{transfer.Remarks}{Environment.NewLine}[Received {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC] {request.Remarks}";
            }

            // Update vehicle's working site
            await UpdateVehicleWorkingSiteAsync(transfer, cancellationToken);

            await _context.SaveChangesAsync(cancellationToken);

            // Update GPSGate tags
            await UpdateGpsGateTagsAsync(transfer, cancellationToken);

            // Notify creator/sender
            try
            {
                await _notificationService.NotifyCreatorReceivedAsync(
                    transfer.TransferId,
                    request.UserId ?? "System",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Transfer {TransferId} confirmed but notification to creator failed",
                    transfer.TransferId);
            }

            var response = _mapper.Map<VehicleTransferDTO>(transfer);
            return FMSResponse<VehicleTransferDTO>.Success(response, "Vehicle receipt confirmed. Transfer completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming receipt for transfer {TransferId}", request.TransferId);
            return FMSResponse<VehicleTransferDTO>.Failed($"Error confirming receipt: {ex.Message}");
        }
    }

    private async Task UpdateVehicleWorkingSiteAsync(
        Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer,
        CancellationToken ct)
    {
        try
        {
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == transfer.VehicleId, ct);

            if (vehicle == null)
            {
                _logger.LogWarning("Vehicle {VehicleId} not found when updating site for transfer {TransferId}",
                    transfer.VehicleId, transfer.TransferId);
                return;
            }

            var previousSiteId = vehicle.WorkingSiteId;
            vehicle.WorkingSiteId = transfer.ToSiteId;
            vehicle.DateModified = DateTime.UtcNow;

            _logger.LogInformation(
                "Updated vehicle {VehicleId} ({HyoungNo}) working site {FromSiteId} → {ToSiteId} for transfer {TransferId}",
                vehicle.VehicleId, vehicle.HyoungNo, previousSiteId, transfer.ToSiteId, transfer.TransferId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle site for transfer {TransferId}", transfer.TransferId);
        }
    }

    private async Task UpdateGpsGateTagsAsync(
        Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer,
        CancellationToken ct)
    {
        if (_tagTransferService == null)
        {
            _logger.LogWarning("GPSGate tag transfer service not available. Skipping for transfer {TransferId}",
                transfer.TransferId);
            return;
        }

        try
        {
            if (transfer.FromSiteId <= 0 || transfer.ToSiteId <= 0)
            {
                _logger.LogWarning("Transfer {TransferId} has invalid site IDs — skipping tag update", transfer.TransferId);
                return;
            }

            var result = await _tagTransferService.MoveVehicleBetweenSiteTagsAsync(
                transfer.VehicleId,
                transfer.FromSiteId,
                transfer.ToSiteId,
                ct);

            if (result.IsSuccess)
                _logger.LogInformation("GPSGate tags updated for vehicle {VehicleId}", transfer.VehicleId);
            else
                _logger.LogWarning("GPSGate tag update failed for vehicle {VehicleId}: {Error}", transfer.VehicleId, result.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating GPSGate tags for transfer {TransferId}", transfer.TransferId);
        }
    }
}
