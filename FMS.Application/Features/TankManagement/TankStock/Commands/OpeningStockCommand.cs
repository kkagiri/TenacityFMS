using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand {
    public record OpeningStockCommand (int TankId, decimal OpeningStock, string RecordedBy, DateTime? EntryDate = null) : IRequest<FMSResponseMessage>;

    public class OpeningStockCommandHandler : IRequestHandler<OpeningStockCommand, FMSResponseMessage> {
        public readonly GpsdataContext _context;
        public ILogger<OpeningStockCommandHandler> _logger;
        public IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;

        public OpeningStockCommandHandler (GpsdataContext context, ILogger<OpeningStockCommandHandler> logger, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
        }
        public async Task<FMSResponseMessage> Handle (OpeningStockCommand request, CancellationToken cancellationToken) {

            try {

                var tank = await _context.Tanks.FindAsync (request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage (false, $"TankID {request.TankId} not found ");
                if (request.OpeningStock <= 0) return new FMSResponseMessage (false, "Opening stock should be greater than 0");

                var entryDate = request.EntryDate?.Date ?? DateTime.Now.Date;

                // Validate historical entry against future records policy
                if (entryDate.Date < DateTime.Now.Date) {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync (
                        request.TankId, entryDate, VolumeChangeReasonEnum.OpeningStock, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed) {
                        return new FMSResponseMessage (false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation) {
                        _logger.LogWarning ("Historical opening stock entry with future records: Tank {TankId}, Date {EntryDate}, Policy {Policy}, Future Records {Count}",
                            request.TankId, entryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // Check for existing opening stock on the same day
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending (x => x.Timestamp)
                    .FirstOrDefaultAsync (cancellationToken);

                //Cursor - Check for previous closing stock but don't require it (allow first opening stock)
                var previousClosingStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankId &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                        x.Timestamp < entryDate)
                    .OrderByDescending (x => x.Timestamp)
                    .FirstOrDefaultAsync (cancellationToken);

                var stockTaking = new Tankstock {
                    TankId = request.TankId,
                    EntryDate = request.EntryDate ?? DateTime.Now,
                    EntryType = VolumeChangeReasonEnum.OpeningStock,
                    ManualOpeningLevel = request.OpeningStock,
                    RecordedBy = request.RecordedBy,
                    SiteId = tank.SiteId
                };
                _context.Tankstocks.Add (stockTaking);

                if (entryDate.Date == DateTime.Now.Date) {

                    if (tank.UseBookKeeping == 1) {
                        tank.CurrentStock = request.OpeningStock;
                        tank.LastStockUpdate = DateTime.Now;
                    }
                }

                _context.Tanks.Update (tank);

                await _context.SaveChangesAsync (cancellationToken);

                //Cursor - Calculate volume change: if no previous closing stock, use 0 as baseline (will show large negative or positive)
                decimal volumeChange;
                if (previousClosingStock != null && previousClosingStock.NewVolume.HasValue) {
                    // Calculate from previous closing stock
                    volumeChange = request.OpeningStock - previousClosingStock.NewVolume.Value;
                } else {
                    // No previous closing stock - use 0 as baseline (first opening stock scenario)
                    volumeChange = request.OpeningStock - 0; // This will be the full opening stock amount
                }

                //Cursor - Replaced manual TankVolumeHistory creation with TankVolumeHistoryIntegrationService
                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessTankStockChangeAsync (
                    tankId: request.TankId,
                    timestamp: stockTaking.EntryDate,
                    volumeChange: volumeChange,
                    stockId: stockTaking.EntryId,
                    isOpening: true, // This is an opening stock
                    actionType : ActionType.Create, // This is a new opening stock
                    recordedBy : request.RecordedBy,
                    cancellationToken : cancellationToken);

                if (!volumeUpdateResult.Success) {
                    _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    return new FMSResponseMessage (false, $"Failed to update tank volume history: {volumeUpdateResult.Message}");
                }

                return new FMSResponseMessage (true, "Opening stock created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error while creating opening stock");
                return new FMSResponseMessage (false, $"Error while creating opening stock {ex}");
            }
        }
    }

}