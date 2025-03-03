using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand
{
    public record ClosingStockCommand(int TankId, decimal ClosingStock, string RecordedBy, DateTime? EntryDate = null) : IRequest<FMSResponseMessage>;

    public class ClosingStockCommandHandler : IRequestHandler<ClosingStockCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ClosingStockCommandHandler> _logger;
        private readonly IMediator _mediator;

        public ClosingStockCommandHandler(GpsdataContext context, ILogger<ClosingStockCommandHandler> logger, IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }


        public async Task<FMSResponseMessage> Handle(ClosingStockCommand request, CancellationToken cancellationToken)
        {

            try
            {
                var entryDate = request.EntryDate ?? DateTime.Now.Date;

                var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.TankId} not found ");

                var existingClosingStock = await _context.TankVolumeHistories
           .Where(x => x.TankId == request.TankId &&
                       x.Timestamp.Date == entryDate &&
                       x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
           .SingleOrDefaultAsync(cancellationToken);

                if (existingClosingStock != null) return new FMSResponseMessage(false, "A closing stock entry already exists for today. You cannot create multiple closing stocks for the same day.");


                var openingStock = await _context.TankVolumeHistories.Where(x => x.TankId == request.TankId &&
                                    x.Timestamp.Date == entryDate.Date && x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                                 .SingleOrDefaultAsync(cancellationToken);

                if (openingStock == null) return new FMSResponseMessage(false, $"Cannot record closing stock for this date if no Opening stock not found for TankID {request.TankId} is not Found");

                // Get all transactions for the day
                var transactions = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId && tvh.Timestamp.Date == DateTime.Now.Date)
                    .ToListAsync();

                var totalRefills = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing).Sum(t => t.VolumeChange);
                var totalDeliveries = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery).Sum(t => t.VolumeChange);
                var totalTransfersIn = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn).Sum(t => t.VolumeChange);
                var totalTransfersOut = transactions.Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut).Sum(t => t.VolumeChange);



                var newClosingStock = new Tankstock
                {
                    TankId = request.TankId,
                    EntryDate = entryDate,
                    EntryType = VolumeChangeReasonEnum.ClosingStock,
                    ManualClosingLevel = request.ClosingStock,
                    RecordedBy = request.RecordedBy,
                    SiteId = tank.SiteId
                };

                _context.Tankstocks.Add(newClosingStock);



                if (entryDate.Date == DateTime.Now.Date)
                {

                    if (tank.UseBookKeeping == 1)
                    {
                        tank.CurrentStock = request.ClosingStock;
                        tank.LastStockUpdate = DateTime.Now;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);





                var tankhistory = new TankVolumeHistory
                {
                    TankId = request.TankId,
                    Timestamp = entryDate,
                    VolumeChange = request.ClosingStock - (tank.CurrentStock ?? 0),
                    NewVolume = request.ClosingStock,
                    ChangeReason = VolumeChangeReasonEnum.ClosingStock,
                    RecordedBy = request.RecordedBy,
                    ReferenceId = newClosingStock.EntryId,
                    ReferenceType = "ClosingStock"
                };

                _context.TankVolumeHistories.Add(tankhistory);
                await _context.SaveChangesAsync(cancellationToken);



                return new FMSResponseMessage(true, "Closing stock created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating closing stock");
                return new FMSResponseMessage(false, "Error while creating closing stock");
            }

        }
    }
}

