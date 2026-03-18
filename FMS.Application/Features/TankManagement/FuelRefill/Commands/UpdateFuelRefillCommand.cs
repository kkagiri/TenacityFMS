using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Application.Features.TankManagement.FuelRefill.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands;

/// <summary>
/// Command to update fuel refill using correction-based approach
/// This creates a correction entry and soft deletes the original
/// </summary>
public record UpdateFuelRefillCommand(
    int OriginalFuelRefillId,
    FuelRefillCorrectionDto CorrectionData
) : IRequest<FMSResponseMessage>;

public class UpdateFuelRefillCommandHandler : IRequestHandler<UpdateFuelRefillCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateFuelRefillCommandHandler> _logger;
    private readonly IMediator _mediator;

    public UpdateFuelRefillCommandHandler(
        GpsdataContext context,
        ILogger<UpdateFuelRefillCommandHandler> logger,
        IMediator mediator)
    {
        _context = context;
        _logger = logger;
        _mediator = mediator;
    }

    public async Task<FMSResponseMessage> Handle(UpdateFuelRefillCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Validate the original record exists
            var originalFuelRefill = await _context.FuelRefills.FindAsync(new object[] { request.OriginalFuelRefillId }, cancellationToken);
            if (originalFuelRefill == null || originalFuelRefill.IsDeleted)
            {
                return new FMSResponseMessage(false, $"Original fuel refill with ID {request.OriginalFuelRefillId} not found");
            }

            // 2. Find the associated TankVolumeHistory record
            // CRITICAL: Include IsDeleted filter and secondary sort for deterministic ordering
            var originalTankVolumeHistory = await _context.TankVolumeHistories
                .Where(tvh => tvh.ReferenceId == request.OriginalFuelRefillId &&
                    tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing &&
                    (tvh.IsDeleted != true))
                .OrderByDescending(tvh => tvh.Timestamp)
                .ThenByDescending(tvh => tvh.Id)  // Secondary sort for deterministic ordering
                .FirstOrDefaultAsync(cancellationToken);

            if (originalTankVolumeHistory == null)
            {
                return new FMSResponseMessage(false, $"Associated tank volume history for fuel refill {request.OriginalFuelRefillId} not found");
            }

            decimal originalFuelRefillAmount = originalFuelRefill.ManualFuelrefillAmount ?? 0m;
            decimal originalTankVolumeHistoryAmount = Math.Abs(originalTankVolumeHistory.VolumeChange ?? 0m);
            decimal requestedAmount = request.CorrectionData.ManualFuelrefillAmount;

            bool amountChanged = !AmountsMatch(originalFuelRefillAmount, requestedAmount)
                || !AmountsMatch(originalTankVolumeHistoryAmount, requestedAmount);

            bool stockImpactChanged = amountChanged
                || originalFuelRefill.TankId != request.CorrectionData.TankId
                || originalFuelRefill.SiteId != request.CorrectionData.SiteId
                || !DatesMatch(originalFuelRefill.Date, request.CorrectionData.Date);

            if (!stockImpactChanged)
            {
                originalFuelRefill.VehicleId = request.CorrectionData.VehicleId;
                originalFuelRefill.PreviousMeterReading = request.CorrectionData.PreviousMeterReading;
                originalFuelRefill.CurrentMeterReading = request.CorrectionData.CurrentMeterReading;
                originalFuelRefill.DriverId = request.CorrectionData.DriverId;
                originalFuelRefill.TagId = request.CorrectionData.TagId;
                originalFuelRefill.Comment = request.CorrectionData.Comment;
                originalFuelRefill.PumpTranscationId = request.CorrectionData.PumpTranscationId;
                originalFuelRefill.DateModified = DateTime.UtcNow;
                originalFuelRefill.ModifiedBy = request.CorrectionData.FuelBy;
                originalFuelRefill.IsModified = 1;

                Tankstock? linkedTankStock = await _context.Tankstocks
                    .FirstOrDefaultAsync(ts => ts.EntryId == request.OriginalFuelRefillId
                        && ts.EntryType == VolumeChangeReasonEnum.Dispensing
                        && !ts.IsDeleted,
                        cancellationToken);

                if (linkedTankStock != null)
                {
                    linkedTankStock.Comment = request.CorrectionData.Comment ?? linkedTankStock.Comment;
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Updated non-stock-impacting fields for fuel refill {FuelRefillId} without tank volume history recalculation.",
                    request.OriginalFuelRefillId);

                return new FMSResponseMessage(true, "Fuel refill updated successfully without stock recalculation.");
            }

            // 3. Soft delete the original tank volume history record with validation
            var deleteResult = await _mediator.Send(new DeleteTankVolumeHistoryCommand(
                DeletedBy: request.CorrectionData.FuelBy,
                Id: originalTankVolumeHistory.Id,
                ValidateFutureRecords: true
            ), cancellationToken);

            if (!deleteResult.Success)
            {
                return new FMSResponseMessage(false, $"Failed to delete original tank volume history: {deleteResult.Message}");
            }

            // 4. Create new correction entry using existing create command
            var createResult = await _mediator.Send(new CreateFuelRrefillCommand(new Features.FMS.FuelRefil.FuelRefilDTO
            {
                VehicleId = request.CorrectionData.VehicleId,
                TankId = request.CorrectionData.TankId,
                SiteId = request.CorrectionData.SiteId,
                Date = request.CorrectionData.Date,
                ManualFuelrefillAmount = request.CorrectionData.ManualFuelrefillAmount,
                PreviousMeterReading = request.CorrectionData.PreviousMeterReading,
                CurrentMeterReading = request.CorrectionData.CurrentMeterReading,
                DriverId = request.CorrectionData.DriverId,
                TagId = request.CorrectionData.TagId,
                Comment = request.CorrectionData.Comment,
                PumpTranscationId = request.CorrectionData.PumpTranscationId,
                FuelBy = request.CorrectionData.FuelBy,
                // Correction tracking
                IsCorrection = true,
                CorrectsRecordId = request.OriginalFuelRefillId,
                CorrectionReason = request.CorrectionData.CorrectionReason
            }), cancellationToken);

            if (!createResult.Success)
            {
                _logger.LogError("Failed to create correction entry for fuel refill {FuelRefillId}: {Error}",
                    request.OriginalFuelRefillId, createResult.Message);
                return new FMSResponseMessage(false, $"Failed to create correction entry: {createResult.Message}");
            }

            _logger.LogInformation("Successfully created correction entry for fuel refill {OriginalId} by user {UserId}. Reason: {Reason}",
                request.OriginalFuelRefillId, request.CorrectionData.FuelBy, request.CorrectionData.CorrectionReason);

            return new FMSResponseMessage(true, "Fuel refill correction completed successfully");

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing fuel refill correction for ID {FuelRefillId}", request.OriginalFuelRefillId);
            return new FMSResponseMessage(false, $"Error processing fuel refill correction: {ex.Message}");
        }
    }

    private static bool AmountsMatch(decimal left, decimal right)
    {
        return Math.Abs(left - right) < 0.0001m;
    }

    private static bool DatesMatch(DateTime? left, DateTime right)
    {
        if (!left.HasValue)
        {
            return false;
        }

        return left.Value.ToUniversalTime() == right.ToUniversalTime();
    }
}