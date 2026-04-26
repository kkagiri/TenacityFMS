/**
 * File: UpdateVehicleTransferStatusCommand.cs
 * Purpose: Updates transfer lifecycle status with transition validation and side effects.
 * Dependencies: EF Core, optional GPS tag transfer service
 * Last Modified: 2026-02-26
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Commands;

/// <summary>
/// Interface for GPSGate tag management - implemented in Infrastructure layer
/// </summary>
public interface IGpsGateTagTransferService
{
    Task<FMSResponse<object>> MoveVehicleBetweenSiteTagsAsync(
        int vehicleId,
        int fromSiteId,
        int toSiteId,
        CancellationToken cancellationToken = default);
}

public record UpdateVehicleTransferStatusCommand(int TransferId, string Status, string? UserId) : IRequest<FMSResponse<bool>>;

public class UpdateVehicleTransferStatusCommandHandler : IRequestHandler<UpdateVehicleTransferStatusCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateVehicleTransferStatusCommandHandler> _logger;
    private readonly IGpsGateTagTransferService? _tagTransferService;
    private readonly IVehicleTransferNotificationService? _transferNotificationService;

    public UpdateVehicleTransferStatusCommandHandler(
        GpsdataContext context,
        ILogger<UpdateVehicleTransferStatusCommandHandler> logger,
        IGpsGateTagTransferService? tagTransferService = null,
        IVehicleTransferNotificationService? transferNotificationService = null)
    {
        _context = context;
        _logger = logger;
        _tagTransferService = tagTransferService;
        _transferNotificationService = transferNotificationService;
    }

    public async Task<FMSResponse<bool>> Handle(UpdateVehicleTransferStatusCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<bool>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            var requestedStatus = string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase)
                ? "PendingApproval"
                : request.Status;

            // Validate status value
            var validStatuses = new[] { "Draft", "PendingApproval", "Approved", "InTransit", "Completed", "Cancelled", "Pending" };
            if (!Array.Exists(validStatuses, s => s.Equals(requestedStatus, StringComparison.OrdinalIgnoreCase)))
            {
                return FMSResponse<bool>.Failed($"Invalid status: {request.Status}. Valid statuses: {string.Join(", ", validStatuses)}", "VALIDATION_ERROR");
            }

            var previousStatus = transfer.Status;

            if (!IsAllowedTransition(previousStatus, requestedStatus))
            {
                return FMSResponse<bool>.Failed(
                    $"Status transition from {previousStatus} to {request.Status} is not allowed",
                    "VALIDATION_ERROR");
            }

            transfer.Status = requestedStatus;
            transfer.ModifiedBy = request.UserId;
            transfer.DateModified = DateTime.UtcNow;

            // If completed, set arrival time if not already set
            if (requestedStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase) && !transfer.ArrivalTime.HasValue)
            {
                transfer.ArrivalTime = DateTime.UtcNow;
            }

            // When completed, also update the vehicle's working site
            if (requestedStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                await UpdateVehicleWorkingSiteAsync(transfer, cancellationToken);
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Vehicle transfer {TransferId} status updated to {Status}", request.TransferId, requestedStatus);

            // When transfer is completed, update GPSGate tags for vehicle monitoring
            if (requestedStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                !previousStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                await UpdateGpsGateTagsAsync(transfer, cancellationToken);
            }

            // Send notifications for relevant transitions
            await SendStatusNotificationsAsync(transfer, previousStatus, requestedStatus, request.UserId, cancellationToken);

            return FMSResponse<bool>.Success(true, $"Transfer status updated to {requestedStatus}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transfer status for {TransferId}", request.TransferId);
            return FMSResponse<bool>.Failed($"Error updating transfer status: {ex.Message}");
        }
    }

    /// <summary>
    /// Updates the vehicle's WorkingSiteId to the destination site when transfer is completed.
    /// </summary>
    private async Task UpdateVehicleWorkingSiteAsync(Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer, CancellationToken cancellationToken)
    {
        try
        {
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == transfer.VehicleId, cancellationToken);

            if (vehicle == null)
            {
                _logger.LogWarning("Vehicle {VehicleId} not found when updating working site for transfer {TransferId}",
                    transfer.VehicleId, transfer.TransferId);
                return;
            }

            var previousSiteId = vehicle.WorkingSiteId;
            vehicle.WorkingSiteId = transfer.ToSiteId;
            vehicle.DateModified = DateTime.UtcNow;

            _logger.LogInformation(
                "Updated vehicle {VehicleId} ({VehicleCode}) working site from {FromSiteId} to {ToSiteId} for transfer {TransferId}",
                vehicle.VehicleId, vehicle.VehicleCode, previousSiteId, transfer.ToSiteId, transfer.TransferId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle working site for transfer {TransferId}", transfer.TransferId);
            // Don't throw - we still want the transfer to complete
        }
    }

    /// <summary>
    /// Updates GPSGate tags when vehicle transfer is completed.
    /// Moves vehicle from source site's tag to destination site's tag.
    /// </summary>
    private async Task UpdateGpsGateTagsAsync(Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer, CancellationToken cancellationToken)
    {
        if (_tagTransferService == null)
        {
            _logger.LogWarning("GPSGate tag transfer service not available. Skipping tag update for transfer {TransferId}", transfer.TransferId);
            return;
        }

        try
        {
            // FromSiteId and ToSiteId are required fields, but check for default values
            if (transfer.FromSiteId <= 0 || transfer.ToSiteId <= 0)
            {
                _logger.LogWarning("Transfer {TransferId} has invalid site IDs. FromSiteId: {FromSiteId}, ToSiteId: {ToSiteId}. Skipping tag update.",
                    transfer.TransferId, transfer.FromSiteId, transfer.ToSiteId);
                return;
            }

            _logger.LogInformation(
                "Initiating GPSGate tag update for vehicle {VehicleId} transfer from site {FromSiteId} to site {ToSiteId}",
                transfer.VehicleId, transfer.FromSiteId, transfer.ToSiteId);

            var result = await _tagTransferService.MoveVehicleBetweenSiteTagsAsync(
                transfer.VehicleId,
                transfer.FromSiteId,
                transfer.ToSiteId,
                cancellationToken);

            if (result.IsSuccess)
            {
                _logger.LogInformation(
                    "Successfully updated GPSGate tags for vehicle {VehicleId}. Message: {Message}",
                    transfer.VehicleId, result.Message);
            }
            else
            {
                _logger.LogWarning(
                    "Failed to update GPSGate tags for vehicle {VehicleId}. Error: {Error}",
                    transfer.VehicleId, result.Message);
                // Note: We don't fail the transfer if tag update fails - it can be fixed manually
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error updating GPSGate tags for transfer {TransferId}, vehicle {VehicleId}",
                transfer.TransferId, transfer.VehicleId);
            // Don't throw - tag update failure shouldn't fail the transfer
        }
    }

    private static bool IsAllowedTransition(string? currentStatus, string targetStatus)
    {
        var current = (currentStatus ?? "Draft").Trim();
        var target = targetStatus.Trim();

        if (string.Equals(current, target, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Backward compatibility for older "Pending" status.
        if (string.Equals(current, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            current = "Draft";
        }

        return current.ToLowerInvariant() switch
        {
            "draft" => target.Equals("PendingApproval", StringComparison.OrdinalIgnoreCase)
                    || target.Equals("Cancelled", StringComparison.OrdinalIgnoreCase),
            "pendingapproval" => target.Equals("Approved", StringComparison.OrdinalIgnoreCase)
                    || target.Equals("Draft", StringComparison.OrdinalIgnoreCase)
                    || target.Equals("Cancelled", StringComparison.OrdinalIgnoreCase),
            "approved" => target.Equals("InTransit", StringComparison.OrdinalIgnoreCase)
                    || target.Equals("Cancelled", StringComparison.OrdinalIgnoreCase),
            "intransit" => target.Equals("Completed", StringComparison.OrdinalIgnoreCase)
                    || target.Equals("Cancelled", StringComparison.OrdinalIgnoreCase),
            "completed" => false,
            "cancelled" => false,
            _ => false
        };
    }

    /// <summary>
    /// Sends in-app notifications based on the status transition.
    /// </summary>
    private async Task SendStatusNotificationsAsync(
        Domain.Entities.Features.VehicleManagement.VehicleTransfer transfer,
        string? previousStatus,
        string newStatus,
        string? userId,
        CancellationToken ct)
    {
        if (_transferNotificationService == null)
            return;

        try
        {
            var triggeredBy = userId ?? "System";

            if (newStatus.Equals("InTransit", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(previousStatus, "InTransit", StringComparison.OrdinalIgnoreCase))
            {
                // Set DispatchedAt if not already set
                if (!transfer.DispatchedAt.HasValue)
                {
                    transfer.DispatchedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync(ct);
                }

                await _transferNotificationService.NotifyReceiverDispatchedAsync(transfer.TransferId, triggeredBy, ct);
            }
            else if (newStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(previousStatus, "Completed", StringComparison.OrdinalIgnoreCase))
            {
                if (!transfer.ReceivedAt.HasValue)
                {
                    transfer.ReceivedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync(ct);
                }

                await _transferNotificationService.NotifyCreatorReceivedAsync(transfer.TransferId, triggeredBy, ct);
            }
            else if (newStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                await _transferNotificationService.NotifyStakeholdersCancelledAsync(transfer.TransferId, triggeredBy, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Status notification failed for transfer {TransferId} ({Status})", transfer.TransferId, newStatus);
        }
    }
}
