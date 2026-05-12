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
using FMS.Application.Services.TankStock;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands;

/// <summary>
/// Command to update an existing fuel refill in place.
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
    private readonly TankStockFutureRecordsService _futureRecordsService;

    public UpdateFuelRefillCommandHandler(
        GpsdataContext context,
        ILogger<UpdateFuelRefillCommandHandler> logger,
        IMediator mediator,
        TankStockFutureRecordsService futureRecordsService)
    {
        _context = context;
        _logger = logger;
        _mediator = mediator;
        _futureRecordsService = futureRecordsService;
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

            var normalizedCorrectionDate = NormalizeCorrectionDate(request.CorrectionData.Date, originalFuelRefill.Date);

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

            if (!request.CorrectionData.TankId.HasValue || request.CorrectionData.TankId.Value <= 0)
            {
                return new FMSResponseMessage(false, "A valid tank is required.");
            }

            var targetTankId = request.CorrectionData.TankId.Value;
            var originalTankId = originalFuelRefill.TankId ?? originalTankVolumeHistory.TankId;
            if (!originalTankId.HasValue || originalTankId.Value <= 0)
            {
                return new FMSResponseMessage(false, $"Original tank for fuel refill {request.OriginalFuelRefillId} could not be determined.");
            }

            var resolvedOriginalTankId = originalTankId.Value;
            var originalTimestamp = originalTankVolumeHistory.Timestamp;

            decimal originalFuelRefillAmount = originalFuelRefill.ManualFuelrefillAmount ?? 0m;
            decimal originalTankVolumeHistoryAmount = Math.Abs(originalTankVolumeHistory.VolumeChange ?? 0m);
            decimal requestedAmount = request.CorrectionData.ManualFuelrefillAmount;

            bool amountChanged = !AmountsMatch(originalFuelRefillAmount, requestedAmount)
                || !AmountsMatch(originalTankVolumeHistoryAmount, requestedAmount);

            bool stockImpactChanged = amountChanged
                || originalFuelRefill.TankId != targetTankId
                || originalFuelRefill.SiteId != request.CorrectionData.SiteId
                || !DatesMatch(originalFuelRefill.Date, normalizedCorrectionDate);

            var validationResult = await ValidateUpdateRequestAsync(
                request,
                originalFuelRefill,
                originalTankVolumeHistory,
                targetTankId,
                normalizedCorrectionDate,
                stockImpactChanged,
                cancellationToken);

            if (!validationResult.Success)
            {
                return validationResult;
            }

            var linkedTankStock = await _context.Tankstocks
                .FirstOrDefaultAsync(ts => ts.EntryId == request.OriginalFuelRefillId
                    && ts.EntryType == VolumeChangeReasonEnum.Dispensing
                    && !ts.IsDeleted,
                    cancellationToken);

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
                originalFuelRefill.CorrectionReason = request.CorrectionData.CorrectionReason;

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

            originalFuelRefill.VehicleId = request.CorrectionData.VehicleId;
            originalFuelRefill.TankId = targetTankId;
            originalFuelRefill.SiteId = request.CorrectionData.SiteId;
            originalFuelRefill.Date = normalizedCorrectionDate;
            originalFuelRefill.ManualFuelrefillAmount = request.CorrectionData.ManualFuelrefillAmount;
            originalFuelRefill.PreviousMeterReading = request.CorrectionData.PreviousMeterReading;
            originalFuelRefill.CurrentMeterReading = request.CorrectionData.CurrentMeterReading;
            originalFuelRefill.DriverId = request.CorrectionData.DriverId;
            originalFuelRefill.TagId = request.CorrectionData.TagId;
            originalFuelRefill.Comment = request.CorrectionData.Comment;
            originalFuelRefill.PumpTranscationId = request.CorrectionData.PumpTranscationId;
            originalFuelRefill.DateModified = DateTime.UtcNow;
            originalFuelRefill.ModifiedBy = request.CorrectionData.FuelBy;
            originalFuelRefill.IsModified = 1;
            originalFuelRefill.IsCorrection = false;
            originalFuelRefill.CorrectsRecordId = null;
            originalFuelRefill.CorrectionReason = request.CorrectionData.CorrectionReason;

            originalTankVolumeHistory.TankId = targetTankId;
            originalTankVolumeHistory.Timestamp = normalizedCorrectionDate;
            originalTankVolumeHistory.VolumeChange = -request.CorrectionData.ManualFuelrefillAmount;
            originalTankVolumeHistory.RecordedBy = request.CorrectionData.FuelBy;
            originalTankVolumeHistory.ChangeReason = VolumeChangeReasonEnum.Dispensing;
            originalTankVolumeHistory.ReferenceType = "FuelRefill";

            if (linkedTankStock != null)
            {
                linkedTankStock.TankId = targetTankId;
                linkedTankStock.SiteId = request.CorrectionData.SiteId;
                linkedTankStock.EntryDate = normalizedCorrectionDate;
                linkedTankStock.ManualAmount = request.CorrectionData.ManualFuelrefillAmount;
                linkedTankStock.RecordedBy = request.CorrectionData.FuelBy;
                linkedTankStock.Comment = request.CorrectionData.Comment ?? linkedTankStock.Comment;
            }

            await _context.SaveChangesAsync(cancellationToken);

            if (resolvedOriginalTankId == targetTankId)
            {
                var effectiveDate = originalTimestamp <= normalizedCorrectionDate ? originalTimestamp : normalizedCorrectionDate;
                var recalcResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(targetTankId, effectiveDate),
                    cancellationToken);

                if (!recalcResult.Success)
                {
                    return new FMSResponseMessage(false, $"Failed to update tank volume history: {recalcResult.Message}");
                }
            }
            else
            {
                var originalTankRecalcResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(resolvedOriginalTankId, originalTimestamp),
                    cancellationToken);

                if (!originalTankRecalcResult.Success)
                {
                    return new FMSResponseMessage(false, $"Failed to update original tank volume history: {originalTankRecalcResult.Message}");
                }

                var targetTankRecalcResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(targetTankId, normalizedCorrectionDate),
                    cancellationToken);

                if (!targetTankRecalcResult.Success)
                {
                    return new FMSResponseMessage(false, $"Failed to update target tank volume history: {targetTankRecalcResult.Message}");
                }
            }

            _logger.LogInformation(
                "Updated fuel refill {FuelRefillId} in place by user {UserId}. Reason: {Reason}",
                request.OriginalFuelRefillId,
                request.CorrectionData.FuelBy,
                request.CorrectionData.CorrectionReason);

            return new FMSResponseMessage(true, "Fuel refill updated successfully.");

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing fuel refill correction for ID {FuelRefillId}", request.OriginalFuelRefillId);
            return new FMSResponseMessage(false, $"Error processing fuel refill correction: {ex.Message}");
        }
    }

    private async Task<FMSResponseMessage> ValidateUpdateRequestAsync(
        UpdateFuelRefillCommand request,
        global::FMS.Domain.Entities.FuelRefill originalFuelRefill,
        global::FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory originalTankVolumeHistory,
        int targetTankId,
        DateTime normalizedCorrectionDate,
        bool stockImpactChanged,
        CancellationToken cancellationToken)
    {
        if (request.CorrectionData.ManualFuelrefillAmount <= 0)
        {
            return new FMSResponseMessage(false, "Fuel refill amount should be greater than 0.");
        }

        if (request.CorrectionData.PreviousMeterReading.HasValue &&
            request.CorrectionData.CurrentMeterReading.HasValue &&
            request.CorrectionData.PreviousMeterReading >= request.CorrectionData.CurrentMeterReading)
        {
            return new FMSResponseMessage(false, "Previous meter reading should be smaller than current meter reading.");
        }

        var vehicleExists = await _context.Vehicles
            .AsNoTracking()
            .AnyAsync(v => v.VehicleId == request.CorrectionData.VehicleId, cancellationToken);
        if (!vehicleExists)
        {
            return new FMSResponseMessage(false, $"Vehicle with ID {request.CorrectionData.VehicleId} does not exist.");
        }

        var siteExists = await _context.Sites
            .AsNoTracking()
            .AnyAsync(s => s.Id == request.CorrectionData.SiteId, cancellationToken);
        if (!siteExists)
        {
            return new FMSResponseMessage(false, $"Site with ID {request.CorrectionData.SiteId} does not exist.");
        }

        var tank = await _context.Tanks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == targetTankId, cancellationToken);
        if (tank == null)
        {
            return new FMSResponseMessage(false, $"Tank with ID {targetTankId} does not exist.");
        }

        var fuelByUserExists = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.CorrectionData.FuelBy, cancellationToken);
        if (!fuelByUserExists)
        {
            return new FMSResponseMessage(false, $"User with ID {request.CorrectionData.FuelBy} does not exist.");
        }

        if (request.CorrectionData.DriverId.HasValue)
        {
            var driverExists = await _context.Employees
                .AsNoTracking()
                .AnyAsync(e => e.Id == request.CorrectionData.DriverId.Value, cancellationToken);
            if (!driverExists)
            {
                return new FMSResponseMessage(false, $"Driver with ID {request.CorrectionData.DriverId.Value} does not exist.");
            }
        }

        if (request.CorrectionData.PumpTranscationId.HasValue)
        {
            var pumpTransactionExists = await _context.Pumptransactions
                .AsNoTracking()
                .AnyAsync(pt => pt.Transaction == request.CorrectionData.PumpTranscationId.Value, cancellationToken);
            if (!pumpTransactionExists)
            {
                return new FMSResponseMessage(false, $"PumpTransaction with ID {request.CorrectionData.PumpTranscationId.Value} does not exist.");
            }
        }

        if (normalizedCorrectionDate.Date < DateTime.UtcNow.Date)
        {
            var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                targetTankId,
                normalizedCorrectionDate,
                VolumeChangeReasonEnum.Dispensing,
                cancellationToken);

            if (!futureRecordsValidation.IsAllowed)
            {
                return new FMSResponseMessage(false, futureRecordsValidation.Message);
            }
        }

        var existingOpeningStock = await _context.TankVolumeHistories
            .Where(x => x.TankId == targetTankId &&
                x.Timestamp.Date == normalizedCorrectionDate.Date &&
                x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                (x.IsDeleted != true))
            .OrderByDescending(x => x.Timestamp)
            .ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingOpeningStock == null)
        {
            return new FMSResponseMessage(false, $"Opening stock for the tank on {normalizedCorrectionDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.");
        }

        if (normalizedCorrectionDate < existingOpeningStock.Timestamp)
        {
            return new FMSResponseMessage(false,
                $"CHRONOLOGICAL ORDER VIOLATION: Fuel refill time ({normalizedCorrectionDate:yyyy-MM-dd HH:mm:ss}) is BEFORE opening stock recorded at ({existingOpeningStock.Timestamp:yyyy-MM-dd HH:mm:ss}). Transactions must occur AFTER opening stock is recorded.");
        }

        var closingStockForDay = await _context.TankVolumeHistories
            .Where(x => x.TankId == targetTankId &&
                x.Timestamp.Date == normalizedCorrectionDate.Date &&
                x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                (x.IsDeleted != true))
            .OrderByDescending(x => x.Timestamp)
            .ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (closingStockForDay != null && normalizedCorrectionDate > closingStockForDay.Timestamp)
        {
            return new FMSResponseMessage(false, $"Cannot update fuel refill after closing stock for {normalizedCorrectionDate.Date:yyyy-MM-dd}. Please create a new opening stock first.");
        }

        var duplicateRefuel = await _context.FuelRefills
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id != request.OriginalFuelRefillId &&
                f.VehicleId == request.CorrectionData.VehicleId &&
                f.Date.HasValue &&
                f.Date.Value.Date == normalizedCorrectionDate.Date &&
                f.ManualFuelrefillAmount == request.CorrectionData.ManualFuelrefillAmount &&
                !f.IsDeleted,
                cancellationToken);

        if (duplicateRefuel != null)
        {
            return new FMSResponseMessage(false,
                $"Duplicate entry: A fuel refill for vehicle already exists on {normalizedCorrectionDate.Date:yyyy-MM-dd} with the same volume ({request.CorrectionData.ManualFuelrefillAmount}L). Please check the existing entry or use a different volume.");
        }

        if (stockImpactChanged)
        {
            var previousVolumeRecord = await _context.TankVolumeHistories
                .Where(h => h.TankId == targetTankId &&
                    h.Id != originalTankVolumeHistory.Id &&
                    h.Timestamp < normalizedCorrectionDate &&
                    (h.IsDeleted != true))
                .OrderByDescending(h => h.Timestamp)
                .ThenByDescending(h => h.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var availableVolume = previousVolumeRecord?.NewVolume ?? 0m;
            if ((availableVolume - request.CorrectionData.ManualFuelrefillAmount) < 0)
            {
                return new FMSResponseMessage(false,
                    $"Operation would result in negative tank stock ({availableVolume - request.CorrectionData.ManualFuelrefillAmount:F2}L). Current available volume is insufficient for this fuel dispensing/refill of {request.CorrectionData.ManualFuelrefillAmount:F2}L. Please verify the transaction amount or check tank stock levels.");
            }
        }

        return new FMSResponseMessage(true, "Validation passed.");
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

    private static DateTime NormalizeCorrectionDate(DateTime requestedDate, DateTime? originalDate)
    {
        if (!originalDate.HasValue)
        {
            return requestedDate;
        }

        if (requestedDate.TimeOfDay != TimeSpan.Zero || originalDate.Value.TimeOfDay == TimeSpan.Zero)
        {
            return requestedDate;
        }

        var normalizedDate = requestedDate.Date.Add(originalDate.Value.TimeOfDay);

        return requestedDate.Kind switch
        {
            DateTimeKind.Utc => DateTime.SpecifyKind(normalizedDate, DateTimeKind.Utc),
            DateTimeKind.Local => DateTime.SpecifyKind(normalizedDate, DateTimeKind.Local),
            _ => normalizedDate
        };
    }
}