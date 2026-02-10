using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace FMS.Application.Features.TankManagement.TankStock.Commands;

#pragma warning disable CS0618 // Type or member is obsolete
/// <summary>
/// Command to soft delete a TankStock entry.
/// Sets IsDeleted = true, DeletedAt = now, DeletedBy = current user.
/// Optionally processes TankVolumeHistory updates (controlled by processHistory parameter).
/// </summary>
public record DeleteTankStockCommand(
    int EntryId,
    bool ProcessHistory = false,
    string? UserId = null
) : IRequest<FMSResponseMessage>;

public class DeleteTankStockCommandHandler : IRequestHandler<DeleteTankStockCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTankStockCommandHandler> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;

    public DeleteTankStockCommandHandler(
        GpsdataContext context,
        ILogger<DeleteTankStockCommandHandler> logger,
        IHttpContextAccessor httpContextAccessor,
        IMediator mediator)
    {
        _context = context;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _mediator = mediator;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStock = await _context.Tankstocks.FindAsync(new object[] { request.EntryId }, cancellationToken);

            if (tankStock == null)
            {
                return new FMSResponseMessage(false, $"Tank stock entry with ID {request.EntryId} not found");
            }

            if (tankStock.IsDeleted)
            {
                return new FMSResponseMessage(false, $"Tank stock entry {request.EntryId} is already deleted");
            }

            // Get current user ID
            var userId = request.UserId ?? _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Soft delete: mark as deleted instead of removing
            tankStock.IsDeleted = true;
            tankStock.DeletedAt = DateTime.UtcNow;
            tankStock.DeletedBy = userId;

            // Clear ActiveEntryKey to release the unique constraint for future entries
            tankStock.ActiveEntryKey = null;

            await _context.SaveChangesAsync(cancellationToken);

            // Always cascade to TankVolumeHistory: find and soft-delete the linked record,
            // then trigger recalculation of all subsequent volume balances.
            await CascadeDeleteTankVolumeHistoryAsync(tankStock, userId, cancellationToken);

            _logger.LogInformation(
                "Tank stock entry {EntryId} soft deleted successfully by user {UserId}",
                request.EntryId,
                userId);

            return new FMSResponseMessage(true, "Tank stock entry deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tank stock entry {EntryId}", request.EntryId);
            return new FMSResponseMessage(false, $"Failed to delete tank stock entry: {ex.Message}");
        }
    }

    /// <summary>
    /// Cascade soft-deletes ALL linked TankVolumeHistory records for an OpeningStock/ClosingStock entry.
    /// One Tankstock row produces TWO TVH records (Opening at 21:05 + Closing at 20:55 next day),
    /// both sharing the same ReferenceId. This method finds and deletes BOTH,
    /// then triggers recalculation from the earliest deleted timestamp.
    /// </summary>
    private async Task CascadeDeleteTankVolumeHistoryAsync(
        Domain.Entities.Features.TankStockManagement.Tankstock tankStock,
        string? userId,
        CancellationToken cancellationToken)
    {
        try
        {
            // Find ALL linked TankVolumeHistory records by ReferenceId (both Opening + Closing)
            var historyRecords = await _context.TankVolumeHistories
                .Where(h => h.ReferenceId == tankStock.EntryId
                    && h.TankId == tankStock.TankId
                    && (h.IsDeleted == null || h.IsDeleted == false))
                .ToListAsync(cancellationToken);

            // Fallback: match by TankId + Date range if ReferenceId didn't match
            if (!historyRecords.Any())
            {
                // Opening is at EntryDate, Closing is ~1 day later
                var searchStart = tankStock.EntryDate.Date;
                var searchEnd = tankStock.EntryDate.Date.AddDays(2);

                historyRecords = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankStock.TankId
                        && (h.ChangeReason == VolumeChangeReasonEnum.OpeningStock
                            || h.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                        && h.Timestamp >= searchStart
                        && h.Timestamp < searchEnd
                        && (h.IsDeleted == null || h.IsDeleted == false))
                    .ToListAsync(cancellationToken);
            }

            if (historyRecords.Any())
            {
                DateTime earliestTimestamp = historyRecords.Min(h => h.Timestamp);

                // Soft-delete all linked records
                foreach (var record in historyRecords)
                {
                    record.IsDeleted = true;
                    record.DeletedAt = DateTime.UtcNow;
                    record.DeletedBy = userId;
                }

                await _context.SaveChangesAsync(cancellationToken);

                var deletedTypes = string.Join(", ", historyRecords.Select(h => h.ChangeReason));
                _logger.LogInformation(
                    "Cascade soft-deleted {Count} TankVolumeHistory records [{Types}] " +
                    "(Tank: {TankId}, ReferenceId: {ReferenceId}) " +
                    "triggered by TankStock deletion of entry {EntryId}",
                    historyRecords.Count, deletedTypes, tankStock.TankId,
                    tankStock.EntryId, tankStock.EntryId);

                // Trigger cascade recalculation from the earliest deleted timestamp
                var updateResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(
                        tankStock.TankId,
                        earliestTimestamp),
                    cancellationToken);

                if (!updateResult.Success)
                {
                    _logger.LogWarning(
                        "Failed to recalculate volume history for tank {TankId} after TankStock deletion: {Message}",
                        tankStock.TankId, updateResult.Message);
                }
                else
                {
                    _logger.LogInformation(
                        "Successfully recalculated volume history for tank {TankId} from {Timestamp} " +
                        "after TankStock deletion of entry {EntryId}",
                        tankStock.TankId, earliestTimestamp, tankStock.EntryId);
                }
            }
            else
            {
                _logger.LogInformation(
                    "No matching active TankVolumeHistory records found for TankStock entry {EntryId} " +
                    "(TankId: {TankId}, EntryType: {EntryType}, EntryDate: {EntryDate}). " +
                    "They may have been already deleted or were created without volume history entries.",
                    tankStock.EntryId, tankStock.TankId, tankStock.EntryType, tankStock.EntryDate);
            }
        }
        catch (Exception ex)
        {
            // Log but don't fail the parent operation — the tankstock was already deleted
            _logger.LogError(ex,
                "Error during cascade deletion of TankVolumeHistory for TankStock entry {EntryId} (Tank: {TankId}). " +
                "The TankStock entry was deleted but volume history may be inconsistent.",
                tankStock.EntryId, tankStock.TankId);
        }
    }
}
#pragma warning restore CS0618 // Type or member is obsolete
