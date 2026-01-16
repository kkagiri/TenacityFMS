using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankTransferCommand
{
    public record CreateTankTransfer(TankTransferDTO TankTransferDTO) : IRequest<FMSResponseMessage<TankTransferDTO>>;

    public class CreateTankTransferHandler : IRequestHandler<CreateTankTransfer, FMSResponseMessage<TankTransferDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankTransferHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

        public CreateTankTransferHandler(GpsdataContext context, ILogger<CreateTankTransferHandler> logger, IMapper mapper, IMediator mediator, TankStockFutureRecordsService futureRecordsService, TankVolumeHistoryIntegrationService tankVolumeHistoryService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
            _tankVolumeHistoryService = tankVolumeHistoryService;
        }

        public async Task<FMSResponseMessage<TankTransferDTO>> Handle(CreateTankTransfer request, CancellationToken cancellationToken)
        {
            try
            {
                var sourceTank = await _context.Tanks.FindAsync(new object[] { request.TankTransferDTO.SourceTankId }, cancellationToken);
                var destinationTank = await _context.Tanks.FindAsync(new object[] { request.TankTransferDTO.DestinationTankId }, cancellationToken);

                if (sourceTank == null || destinationTank == null)
                    return new FMSResponseMessage<TankTransferDTO>(false, "Source or Destination Tank not found", null);

                if (!request.TankTransferDTO.Amount.HasValue || request.TankTransferDTO.Amount.Value <= 0)
                    return new FMSResponseMessage<TankTransferDTO>(false, "Invalid transfer amount", null);

                var transferAmount = request.TankTransferDTO.Amount.Value;
                // Always use UTC for internal storage
                var transferDate = request.TankTransferDTO.Date ?? DateTime.UtcNow;

                // NEW VALIDATION: Check for existing transfer (manual or automated) with same tanks and volume on same date
                // This prevents double-counting when an automated pump transfer has already recorded this operation
                const decimal VOLUME_TOLERANCE = 0.01m; // 1% tolerance for volume comparison

                var existingTransfer = await _context.TankTransfers
                    .FirstOrDefaultAsync(tt =>
                        tt.SourceTankId == request.TankTransferDTO.SourceTankId &&
                        tt.DestinationTankId == request.TankTransferDTO.DestinationTankId &&
                        tt.TransferDate.HasValue &&
                        tt.TransferDate.Value.Date == transferDate.Date &&
                        tt.Amount.HasValue &&
                        Math.Abs(tt.Amount.Value - transferAmount) / transferAmount <= VOLUME_TOLERANCE &&
                        !tt.IsDeleted,
                        cancellationToken);

                if (existingTransfer != null)
                {
                    _logger.LogWarning(
                        "Blocked duplicate tank transfer: Existing transfer already exists. " +
                        "Source Tank {SourceTankId} -> Dest Tank {DestTankId}, Date {Date}, " +
                        "Existing Volume: {ExistingVolume}L, Requested Volume: {RequestedVolume}L, " +
                        "Existing Transfer ID: {TransferId}",
                        request.TankTransferDTO.SourceTankId, request.TankTransferDTO.DestinationTankId,
                        transferDate.Date, existingTransfer.Amount, transferAmount, existingTransfer.Id);

                    return new FMSResponseMessage<TankTransferDTO>(false,
                        $"⚠️ DUPLICATE PREVENTED: A transfer from '{sourceTank.Name}' to '{destinationTank.Name}' already exists on {transferDate.Date:yyyy-MM-dd} " +
                        $"with volume {existingTransfer.Amount:F2}L (Transfer ID: {existingTransfer.Id}). " +
                        "This may have been recorded automatically by the PTS pump system. Manual entry is not required.", null);
                }

                // Check if there is opening stock for both source and destination tanks on the transfer day
                var sourceOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankTransferDTO.SourceTankId &&
                        x.Timestamp.Date.Date == transferDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending(x => x.Timestamp.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (sourceOpeningStock == null)
                    return new FMSResponseMessage<TankTransferDTO>(false, $"Opening stock for SOURCE tank '{sourceTank.Name}' on {transferDate.Date:yyyy-MM-dd} not found. Create opening stock for this tank first.", null);

                var destinationOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankTransferDTO.DestinationTankId &&
                        x.Timestamp.Date.Date == transferDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending(x => x.Timestamp.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (destinationOpeningStock == null)
                    return new FMSResponseMessage<TankTransferDTO>(false, $"Opening stock for DESTINATION tank '{destinationTank.Name}' on {transferDate.Date:yyyy-MM-dd} not found. Create opening stock for this tank first.", null);

                // NEW VALIDATION: Transfer MUST be after opening stock for BOTH tanks (chronological order)
                if (transferDate < sourceOpeningStock.Timestamp)
                {
                    return new FMSResponseMessage<TankTransferDTO>(false,
                        $"CHRONOLOGICAL ORDER VIOLATION (SOURCE TANK): Transfer time ({transferDate:yyyy-MM-dd HH:mm:ss}) is BEFORE opening stock recorded at ({sourceOpeningStock.Timestamp:yyyy-MM-dd HH:mm:ss}) " +
                        $"for source tank '{sourceTank.Name}'. Transactions must occur AFTER opening stock is recorded.", null);
                }

                if (transferDate < destinationOpeningStock.Timestamp)
                {
                    return new FMSResponseMessage<TankTransferDTO>(false,
                        $"CHRONOLOGICAL ORDER VIOLATION (DESTINATION TANK): Transfer time ({transferDate:yyyy-MM-dd HH:mm:ss}) is BEFORE opening stock recorded at ({destinationOpeningStock.Timestamp:yyyy-MM-dd HH:mm:ss}) " +
                        $"for destination tank '{destinationTank.Name}'. Transactions must occur AFTER opening stock is recorded.", null);
                }

                // Ensure there is a proper sequence: if there's an opening stock, transfers should come after it
                // but before or after a closing stock if it exists
                var sourceClosingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankTransferDTO.SourceTankId &&
                        x.Timestamp.Date == transferDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync(cancellationToken);

                var destinationClosingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankTransferDTO.DestinationTankId &&
                        x.Timestamp.Date == transferDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync(cancellationToken);

                // If there's already a closing stock for the day, and transfer is after that closing stock,
                // then we need a new opening stock first
                if (sourceClosingStockForDay != null && transferDate > sourceClosingStockForDay.Timestamp)
                {
                    return new FMSResponseMessage<TankTransferDTO>(false, $"Cannot add transfer after closing stock for SOURCE tank '{sourceTank.Name}' on {transferDate.Date:yyyy-MM-dd}. Please create a new opening stock first.", null);
                }

                if (destinationClosingStockForDay != null && transferDate > destinationClosingStockForDay.Timestamp)
                {
                    return new FMSResponseMessage<TankTransferDTO>(false, $"Cannot add transfer after closing stock for DESTINATION tank '{destinationTank.Name}' on {transferDate.Date:yyyy-MM-dd}. Please create a new opening stock first.", null);
                }

                // Validate historical entry against future records policy for both tanks
                if (transferDate.Date < DateTime.UtcNow.Date)
                {
                    // Check source tank
                    var sourceFutureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.TankTransferDTO.SourceTankId ?? 0, transferDate, VolumeChangeReasonEnum.TransferOut, cancellationToken);

                    if (!sourceFutureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage<TankTransferDTO>(false, $"Source tank validation failed: {sourceFutureRecordsValidation.Message}", null);
                    }

                    // Check destination tank
                    var destinationFutureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.TankTransferDTO.DestinationTankId ?? 0, transferDate, VolumeChangeReasonEnum.TransferIn, cancellationToken);

                    if (!destinationFutureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage<TankTransferDTO>(false, $"Destination tank validation failed: {destinationFutureRecordsValidation.Message}", null);
                    }

                    // Log warnings for future reference
                    if (sourceFutureRecordsValidation.RequiresUserConfirmation || destinationFutureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical tank transfer with future records: Source Tank {SourceTankId}, Destination Tank {DestinationTankId}, Date {TransferDate}",
                            request.TankTransferDTO.SourceTankId, request.TankTransferDTO.DestinationTankId, transferDate);
                    }
                }

                // Validate source tank has sufficient PHYSICAL stock (actual measured value)
                // PhysicalStockValue = what we "actually" have (real-time physical measurement)
                // CurrentStock = what we "should" have (book/ledger value for accounting)
                if (sourceTank.UseBookKeeping == 1)
                {
                    // For current day, check physical stock for real-time validation
                    if (transferDate.Date == DateTime.UtcNow.Date)
                    {
                        if (sourceTank.PhysicalStockValue == null || sourceTank.PhysicalStockValue < transferAmount)
                            return new FMSResponseMessage<TankTransferDTO>(false, $"Insufficient stock in source tank. Physical stock: {sourceTank.PhysicalStockValue:F2}L, Requested amount: {transferAmount:F2}L", null);
                    }

                    // TODO: Implement validation for past-date tank transfers
                    // For past date entries, we need to check available stock BEFORE this transaction timestamp
                    // The validation should query TankVolumeHistory for the record immediately before this transaction
                    // and verify sufficient stock was available in the source tank at that point in time
                    // Currently commented out to allow historical entries without strict validation

                    //else if (transferDate.Date < DateTime.Now.Date)
                    //{
                    //    var volumeHistoryBeforeTransaction = await _context.TankVolumeHistories
                    //        .Where(x => x.TankId == sourceTank.Id &&
                    //               x.Timestamp < transferDate &&
                    //               (x.IsDeleted != true))
                    //        .OrderByDescending(x => x.Timestamp)
                    //        .ThenByDescending(x => x.Id)
                    //        .FirstOrDefaultAsync(cancellationToken);

                    //    if (volumeHistoryBeforeTransaction != null)
                    //    {
                    //        decimal availableStockBeforeTransaction = volumeHistoryBeforeTransaction.NewVolume ?? 0;

                    //        if (availableStockBeforeTransaction <= 0)
                    //            return new FMSResponseMessage<TankTransferDTO>(false, $"The source tank was empty before this transaction at {transferDate:g}. Cannot record transfer.", null);

                    //        if (availableStockBeforeTransaction < transferAmount)
                    //            return new FMSResponseMessage<TankTransferDTO>(false, $"Insufficient stock in source tank before this transaction at {transferDate:g}. Available: {availableStockBeforeTransaction:F2}L, Requested: {transferAmount:F2}L", null);
                    //    }
                    //}
                }

                var tankTransfer = _mapper.Map<TankTransfer>(request.TankTransferDTO);
                tankTransfer.TransferDate = transferDate;
                _context.TankTransfers.Add(tankTransfer);

                await _context.SaveChangesAsync(cancellationToken);

                // Calculate physical stock values for current day operations
                decimal? sourcePhysicalStockValue = null;
                decimal? destinationPhysicalStockValue = null;
                string? physicalStockSource = null;

                if (transferDate.Date == DateTime.UtcNow.Date)
                {
                    if (sourceTank.PhysicalStockValue.HasValue)
                    {
                        sourcePhysicalStockValue = sourceTank.PhysicalStockValue.Value - transferAmount;

                        // CRITICAL VALIDATION: Prevent negative stock in source tank
                        if (sourcePhysicalStockValue < 0)
                        {
                            return new FMSResponseMessage<TankTransferDTO>(false,
                                $"Transfer would result in negative stock for source tank '{sourceTank.Name}'. " +
                                $"Current physical stock: {sourceTank.PhysicalStockValue.Value:F2}L, Transfer amount: {transferAmount:F2}L. " +
                                "Please reduce the transfer amount or verify tank stock levels.", null);
                        }
                    }
                    if (destinationTank.PhysicalStockValue.HasValue)
                    {
                        destinationPhysicalStockValue = destinationTank.PhysicalStockValue.Value + transferAmount;
                    }
                    physicalStockSource = "Transfer";
                }

                // Process source tank volume change (outgoing)
                var sourceVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferOutChangeAsync(
                    sourceTankId: sourceTank.Id,
                    timestamp: transferDate,
                    volumeChange: transferAmount, // Pass positive amount, service will make it negative
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: request.TankTransferDTO.RecordedBy ?? "Unknown",
                    newPhysicalStockValue: sourcePhysicalStockValue,
                    physicalStockSource: physicalStockSource,
                    cancellationToken: cancellationToken);

                if (!sourceVolumeResult.Success)
                {
                    _logger.LogWarning("Failed to update source tank volume history: {Message}", sourceVolumeResult.Message);
                }

                // Process destination tank volume change (incoming)
                var destinationVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferInChangeAsync(
                    destinationTankId: destinationTank.Id,
                    timestamp: transferDate,
                    volumeChange: transferAmount, // Pass positive amount
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: request.TankTransferDTO.RecordedBy ?? "Unknown",
                    newPhysicalStockValue: destinationPhysicalStockValue,
                    physicalStockSource: physicalStockSource,
                    cancellationToken: cancellationToken);

                if (!destinationVolumeResult.Success)
                {
                    _logger.LogWarning("Failed to update destination tank volume history: {Message}", destinationVolumeResult.Message);
                }

                // Update TankStock entries for both source and destination tanks (single-row-per-day architecture)
                var sourceTankStock = await _context.Tankstocks
                    .Where(x => x.TankId == sourceTank.Id &&
                        x.EntryDate.Date == transferDate.Date &&
                        !x.IsDeleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (sourceTankStock != null)
                {
                    // Update transfer out amount (cumulative if multiple transfers)
                    sourceTankStock.TransferOutAmount = (sourceTankStock.TransferOutAmount ?? 0) + transferAmount;
                    sourceTankStock.TransferRecordId = tankTransfer.Id; // Store latest transfer ID

                    _context.Tankstocks.Update(sourceTankStock);

                    _logger.LogInformation("Updated source TankStock EntryID {EntryId} with transfer out amount {Amount}",
                        sourceTankStock.EntryId, sourceTankStock.TransferOutAmount);
                }
                else
                {
                    _logger.LogWarning("No TankStock entry found for source Tank {TankId} on {Date} to update transfer out amount",
                        sourceTank.Id, transferDate.Date);
                }

                var destinationTankStock = await _context.Tankstocks
                    .Where(x => x.TankId == destinationTank.Id &&
                        x.EntryDate.Date == transferDate.Date &&
                        !x.IsDeleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (destinationTankStock != null)
                {
                    // Update transfer in amount (cumulative if multiple transfers)
                    destinationTankStock.TransferInAmount = (destinationTankStock.TransferInAmount ?? 0) + transferAmount;
                    destinationTankStock.TransferRecordId = tankTransfer.Id; // Store latest transfer ID

                    _context.Tankstocks.Update(destinationTankStock);

                    _logger.LogInformation("Updated destination TankStock EntryID {EntryId} with transfer in amount {Amount}",
                        destinationTankStock.EntryId, destinationTankStock.TransferInAmount);
                }
                else
                {
                    _logger.LogWarning("No TankStock entry found for destination Tank {TankId} on {Date} to update transfer in amount",
                        destinationTank.Id, transferDate.Date);
                }

                // Save TankStock updates
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage<TankTransferDTO>(true, "Tank Transfer successful", request.TankTransferDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank transfer");
                return new FMSResponseMessage<TankTransferDTO>(false, "Error creating tank transfer", request.TankTransferDTO);
            }
        }
    }
}