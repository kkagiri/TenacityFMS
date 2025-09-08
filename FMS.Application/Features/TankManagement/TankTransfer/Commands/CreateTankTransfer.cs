using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankTransfer;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankTransferCommand {
    public record CreateTankTransfer (TankTransferDTO TankTransferDTO) : IRequest<FMSResponseMessage<TankTransferDTO>>;

    public class CreateTankTransferHandler : IRequestHandler<CreateTankTransfer, FMSResponseMessage<TankTransferDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankTransferHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

        public CreateTankTransferHandler (GpsdataContext context, ILogger<CreateTankTransferHandler> logger, IMapper mapper, IMediator mediator, TankStockFutureRecordsService futureRecordsService, TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
            _tankVolumeHistoryService = tankVolumeHistoryService;
        }

        public async Task<FMSResponseMessage<TankTransferDTO>> Handle (CreateTankTransfer request, CancellationToken cancellationToken) {
            try {
                var sourceTank = await _context.Tanks.FindAsync (new object[] { request.TankTransferDTO.SourceTankId }, cancellationToken);
                var destinationTank = await _context.Tanks.FindAsync (new object[] { request.TankTransferDTO.DestinationTankId }, cancellationToken);

                if (sourceTank == null || destinationTank == null)
                    return new FMSResponseMessage<TankTransferDTO> (false, "Source or Destination Tank not found", null);

                if (!request.TankTransferDTO.Amount.HasValue || request.TankTransferDTO.Amount.Value <= 0)
                    return new FMSResponseMessage<TankTransferDTO> (false, "Invalid transfer amount", null);

                var transferAmount = request.TankTransferDTO.Amount.Value;
                var transferDate = request.TankTransferDTO.Date ?? DateTime.Now;

                // Check if there is opening stock for both source and destination tanks on the transfer day
                var sourceOpeningStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankTransferDTO.SourceTankId &&
                        x.Timestamp.Date.Date == transferDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending (x => x.Timestamp.Date)
                    .FirstOrDefaultAsync (cancellationToken);

                if (sourceOpeningStock == null)
                    return new FMSResponseMessage<TankTransferDTO> (false, $"Opening stock for the source tank on {transferDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.", null);

                var destinationOpeningStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankTransferDTO.DestinationTankId &&
                        x.Timestamp.Date.Date == transferDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending (x => x.Timestamp.Date)
                    .FirstOrDefaultAsync (cancellationToken);

                if (destinationOpeningStock == null)
                    return new FMSResponseMessage<TankTransferDTO> (false, $"Opening stock for the destination tank on {transferDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.", null);

                // Ensure there is a proper sequence: if there's an opening stock, transfers should come after it
                // but before or after a closing stock if it exists
                var sourceClosingStockForDay = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankTransferDTO.SourceTankId &&
                        x.Timestamp.Date == transferDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync (cancellationToken);

                var destinationClosingStockForDay = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankTransferDTO.DestinationTankId &&
                        x.Timestamp.Date == transferDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync (cancellationToken);

                // If there's already a closing stock for the day, and transfer is after that closing stock,
                // then we need a new opening stock first
                if (sourceClosingStockForDay != null && transferDate > sourceClosingStockForDay.Timestamp) {
                    return new FMSResponseMessage<TankTransferDTO> (false, $"Cannot add transfer after closing stock for source tank on {transferDate.Date:yyyy-MM-dd}. Please create a new opening stock first.", null);
                }

                if (destinationClosingStockForDay != null && transferDate > destinationClosingStockForDay.Timestamp) {
                    return new FMSResponseMessage<TankTransferDTO> (false, $"Cannot add transfer after closing stock for destination tank on {transferDate.Date:yyyy-MM-dd}. Please create a new opening stock first.", null);
                }

                // Validate historical entry against future records policy for both tanks
                if (transferDate.Date < DateTime.Now.Date) {
                    // Check source tank
                    var sourceFutureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync (
                        request.TankTransferDTO.SourceTankId ?? 0, transferDate, VolumeChangeReasonEnum.TransferOut, cancellationToken);

                    if (!sourceFutureRecordsValidation.IsAllowed) {
                        return new FMSResponseMessage<TankTransferDTO> (false, $"Source tank validation failed: {sourceFutureRecordsValidation.Message}", null);
                    }

                    // Check destination tank
                    var destinationFutureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync (
                        request.TankTransferDTO.DestinationTankId ?? 0, transferDate, VolumeChangeReasonEnum.TransferIn, cancellationToken);

                    if (!destinationFutureRecordsValidation.IsAllowed) {
                        return new FMSResponseMessage<TankTransferDTO> (false, $"Destination tank validation failed: {destinationFutureRecordsValidation.Message}", null);
                    }

                    // Log warnings for future reference
                    if (sourceFutureRecordsValidation.RequiresUserConfirmation || destinationFutureRecordsValidation.RequiresUserConfirmation) {
                        _logger.LogWarning ("Historical tank transfer with future records: Source Tank {SourceTankId}, Destination Tank {DestinationTankId}, Date {TransferDate}",
                            request.TankTransferDTO.SourceTankId, request.TankTransferDTO.DestinationTankId, transferDate);
                    }
                }

                if (transferDate == DateTime.Now.Date) {
                    if (sourceTank.CurrentStock < transferAmount)
                        return new FMSResponseMessage<TankTransferDTO> (false, "Insufficient stock in source tank. Check your stock level.", null);
                }

                var tankTransfer = _mapper.Map<TankTransfer> (request.TankTransferDTO);
                tankTransfer.TransferDate = transferDate;
                _context.TankTransfers.Add (tankTransfer);

                await _context.SaveChangesAsync (cancellationToken);

                // Calculate physical stock values for current day operations
                decimal? sourcePhysicalStockValue = null;
                decimal? destinationPhysicalStockValue = null;
                string? physicalStockSource = null;

                if (transferDate.Date == DateTime.Now.Date) {
                    if (sourceTank.PhysicalStockValue.HasValue) {
                        sourcePhysicalStockValue = sourceTank.PhysicalStockValue.Value - transferAmount;
                    }
                    if (destinationTank.PhysicalStockValue.HasValue) {
                        destinationPhysicalStockValue = destinationTank.PhysicalStockValue.Value + transferAmount;
                    }
                    physicalStockSource = "Transfer";
                }

                // Process source tank volume change (outgoing)
                var sourceVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferOutChangeAsync (
                    sourceTankId: sourceTank.Id,
                    timestamp: transferDate,
                    volumeChange: transferAmount, // Pass positive amount, service will make it negative
                    transferId : tankTransfer.Id,
                    actionType : ActionType.Create,
                    recordedBy : request.TankTransferDTO.RecordedBy ?? "Unknown",
                    newPhysicalStockValue : sourcePhysicalStockValue,
                    physicalStockSource : physicalStockSource,
                    cancellationToken : cancellationToken);

                if (!sourceVolumeResult.Success) {
                    _logger.LogWarning ("Failed to update source tank volume history: {Message}", sourceVolumeResult.Message);
                }

                // Process destination tank volume change (incoming)
                var destinationVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferInChangeAsync (
                    destinationTankId: destinationTank.Id,
                    timestamp: transferDate,
                    volumeChange: transferAmount, // Pass positive amount
                    transferId : tankTransfer.Id,
                    actionType : ActionType.Create,
                    recordedBy : request.TankTransferDTO.RecordedBy ?? "Unknown",
                    newPhysicalStockValue : destinationPhysicalStockValue,
                    physicalStockSource : physicalStockSource,
                    cancellationToken : cancellationToken);

                if (!destinationVolumeResult.Success) {
                    _logger.LogWarning ("Failed to update destination tank volume history: {Message}", destinationVolumeResult.Message);
                }

                return new FMSResponseMessage<TankTransferDTO> (true, "Tank Transfer successful", request.TankTransferDTO);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating tank transfer");
                return new FMSResponseMessage<TankTransferDTO> (false, "Error creating tank transfer", request.TankTransferDTO);
            }
        }
    }
}