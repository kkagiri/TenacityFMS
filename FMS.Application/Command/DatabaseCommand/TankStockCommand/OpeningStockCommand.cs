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
    public record OpeningStockCommand (int TankId, decimal OpeningStock, string RecordedBy) :IRequest<FMSResponseMessage>;

    public class OpeningStockCommandHandler : IRequestHandler<OpeningStockCommand, FMSResponseMessage>
    {
        public readonly GpsdataContext _context;
        public ILogger<OpeningStockCommandHandler> _logger;
        public IMediator _mediator;

        public OpeningStockCommandHandler(GpsdataContext context, ILogger<OpeningStockCommandHandler> logger,IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }
        public async Task<FMSResponseMessage> Handle(OpeningStockCommand request, CancellationToken cancellationToken)
        {
            using var transaction = _context.Database.BeginTransactionAsync(cancellationToken);
            try { 
            var tank = await _context.Tanks.FindAsync(request.TankId,cancellationToken);
            if (tank == null) return new FMSResponseMessage (false, $"TankID {request.TankId} not found " );
            if(request.OpeningStock <= 0)return new FMSResponseMessage(false, "Opening stock should be greater than 0");

            var lastStockEntry = await _context.Tankstocks.Where(x => x.TankId == request.TankId )
                                         .OrderByDescending(x => x.EntryDate.Date).FirstOrDefaultAsync(cancellationToken);



               if(lastStockEntry!=null)
                {
                    if(lastStockEntry.EntryType == VolumeChangeReasonEnum.OpeningStock)
                    {
                        //check if there is a closing stock after the last opening stock
                        var closingStockAfterLastOpening = await _context.Tankstocks
                             .Where(x => x.TankId == request.TankId && x.EntryDate.Date > lastStockEntry.EntryDate.Date && x.EntryType==VolumeChangeReasonEnum.ClosingStock)
                             .AnyAsync(cancellationToken);

                        if(!closingStockAfterLastOpening) return new FMSResponseMessage(false, "Cannot create a new opening stock. The previous opening stock hasn't been closed yet.");
                    }

                    var discrepancy = request.OpeningStock - lastStockEntry.ManualClosingLevel;

                    if(Math.Abs((decimal)discrepancy) > 0 )
                    {
                        var discrepancyReason = discrepancy > 0 ? "over" : "under";
                        return new FMSResponseMessage(false, $"Opening stock is {discrepancyReason} by {Math.Abs((decimal)discrepancy)} litres from the last closing stock");
                    }
                }

            var stockTaking = new Tankstock
            {
                TankId = request.TankId,
                EntryDate = DateTime.Now,
                EntryType = VolumeChangeReasonEnum.OpeningStock,
                ManualOpeningLevel = request.OpeningStock,
                RecordedBy = request.RecordedBy,
                SiteId = tank.SiteId
                };
                _context.Tankstocks.Add(stockTaking);


                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.TankId,
                    Timestamp = DateTime.UtcNow,
                    VolumeChange =request.OpeningStock - (tank.CurrentStock ?? 0),
                    NewVolume = request.OpeningStock,
                    ChangeReason = VolumeChangeReasonEnum.OpeningStock,
                    RecordedBy = request.RecordedBy
                };


                tank.CurrentStock = request.OpeningStock;
                tank.LastStockUpdate = DateTime.Now;

                _context.Tanks.Update(tank);
                _context.TankVolumeHistories.Add(tankVolumeHistory);


                await _context.SaveChangesAsync(cancellationToken);
                await transaction.Result.CommitAsync(cancellationToken);
                return new FMSResponseMessage(true, "Opening stock created successfully");
            } catch(Exception ex)
            {
                _logger.LogError(ex, "Error while creating opening stock");
                return new FMSResponseMessage(false, $"Error while creating opening stock {ex.InnerException}");
            }
        }
    }


}
