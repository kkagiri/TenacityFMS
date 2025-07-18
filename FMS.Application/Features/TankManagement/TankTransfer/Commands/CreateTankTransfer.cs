using System;
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

        public CreateTankTransferHandler (GpsdataContext context, ILogger<CreateTankTransferHandler> logger, IMapper mapper, IMediator mediator, TankStockFutureRecordsService futureRecordsService) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
            _futureRecordsService = futureRecordsService;
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

                if (transferDate.Date == DateTime.Now.Date) {
                    sourceTank.CurrentStock -= transferAmount;
                    destinationTank.CurrentStock += transferAmount;
                }

                var sourceTankStock = CreateTankStock (sourceTank, -transferAmount, VolumeChangeReasonEnum.TransferOut, request.TankTransferDTO.RecordedBy);
                var destinationTankStock = CreateTankStock (destinationTank, transferAmount, VolumeChangeReasonEnum.TransferIn, request.TankTransferDTO.RecordedBy);

                _context.Tankstocks.Add (sourceTankStock);
                _context.Tankstocks.Add (destinationTankStock);

                await _context.SaveChangesAsync (cancellationToken);

                var tankVolumeHistorySource = CreateTankVolumeHistory (sourceTank, -transferAmount, VolumeChangeReasonEnum.TransferOut, request.TankTransferDTO.RecordedBy, sourceTankStock.EntryId, "TransferOut");
                var tankVolumeHistoryDestination = CreateTankVolumeHistory (destinationTank, transferAmount, VolumeChangeReasonEnum.TransferIn, request.TankTransferDTO.RecordedBy, destinationTankStock.EntryId, "TransferIn");

                _context.TankVolumeHistories.Add (tankVolumeHistorySource);
                _context.TankVolumeHistories.Add (tankVolumeHistoryDestination);

                await _context.SaveChangesAsync (cancellationToken);

                return new FMSResponseMessage<TankTransferDTO> (true, "Tank Transfer successful", request.TankTransferDTO);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating tank transfer");
                return new FMSResponseMessage<TankTransferDTO> (false, "Error creating tank transfer", null);
            }
        }

        private Tankstock CreateTankStock (Tank tank, decimal amount, VolumeChangeReasonEnum entryType, string recordedBy) {
            return new Tankstock {
                TankId = tank.Id,
                    EntryDate = DateTime.UtcNow,
                    EntryType = entryType,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    ManualClosingLevel = tank.CurrentStock,
                    ManualAmount = amount
            };
        }

        private TankVolumeHistory CreateTankVolumeHistory (Tank tank, decimal amount, VolumeChangeReasonEnum changeReason, string recordedBy, int referenceId, string referenceType) {
            return new TankVolumeHistory {
                TankId = tank.Id,
                    Timestamp = DateTime.Now,
                    VolumeChange = amount,
                    NewVolume = tank.CurrentStock,
                    ChangeReason = changeReason,
                    RecordedBy = recordedBy,
                    ReferenceId = referenceId,
                    ReferenceType = referenceType
            };
        }
    }
}