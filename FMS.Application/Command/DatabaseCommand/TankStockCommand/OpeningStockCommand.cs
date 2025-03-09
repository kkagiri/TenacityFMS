using AutoMapper.Configuration.Annotations;
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
using System.Transactions;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand
{
    public record OpeningStockCommand(int TankId, decimal OpeningStock, string RecordedBy, DateTime? EntryDate = null) : IRequest<FMSResponseMessage>;

    public class OpeningStockCommandHandler : IRequestHandler<OpeningStockCommand, FMSResponseMessage>
    {
        public readonly GpsdataContext _context;
        public ILogger<OpeningStockCommandHandler> _logger;
        public IMediator _mediator;

        public OpeningStockCommandHandler(GpsdataContext context, ILogger<OpeningStockCommandHandler> logger, IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }
        public async Task<FMSResponseMessage> Handle(OpeningStockCommand request, CancellationToken cancellationToken)
        {

            try
            {



                var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.TankId} not found ");
                if (request.OpeningStock <= 0) return new FMSResponseMessage(false, "Opening stock should be greater than 0");

                var entryDate = request.EntryDate?.Date ?? DateTime.Now.Date;


                // Check for existing opening stock on the same day
                var existingOpeningStock = await _context.TankVolumeHistories
                   .Where(x => x.TankId == request.TankId &&
                               x.Timestamp.Date == entryDate &&
                               x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                   .OrderByDescending(x => x.Timestamp)
                   .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock != null)
                {
                    // Check if there's a closing stock after the existing opening stock
                    var closingStockAfterOpening = await _context.TankVolumeHistories
                        .Where(x => x.TankId == request.TankId &&
                                    x.Timestamp > existingOpeningStock.Timestamp &&
                                    x.Timestamp.Date == entryDate &&
                                    x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                        .OrderBy(x => x.Timestamp)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (closingStockAfterOpening == null)
                    {
                        return new FMSResponseMessage(false, $"An opening stock already exists for this date {entryDate.Date} without a subsequent closing stock.");
                    }
                    // Ensure the new opening stock is after the closing stock
                    if (request.EntryDate <= closingStockAfterOpening.Timestamp)
                    {
                        return new FMSResponseMessage(false, "New opening stock must be after the previous closing stock.");
                    }
                }

                var stockTaking = new Tankstock
                {
                    TankId = request.TankId,
                    EntryDate = request.EntryDate ?? DateTime.Now,
                    EntryType = VolumeChangeReasonEnum.OpeningStock,
                    ManualOpeningLevel = request.OpeningStock,
                    RecordedBy = request.RecordedBy,
                    SiteId = tank.SiteId
                };
                _context.Tankstocks.Add(stockTaking);


                if (entryDate.Date == DateTime.Now.Date)
                {

                    if (tank.UseBookKeeping == 1)
                    {
                        tank.CurrentStock = request.OpeningStock;
                        tank.LastStockUpdate = DateTime.Now;
                    }
                }

                _context.Tanks.Update(tank);


                await _context.SaveChangesAsync(cancellationToken);


                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.TankId,
                    Timestamp = stockTaking.EntryDate,
                    VolumeChange = tank.UseBookKeeping == 1 ? request.OpeningStock - (tank.CurrentStock ?? 0) : 0,
                    NewVolume = request.OpeningStock,
                    ChangeReason = VolumeChangeReasonEnum.OpeningStock,
                    RecordedBy = request.RecordedBy,
                    ReferenceId = stockTaking.EntryId,
                    ReferenceType = "OpeningStock"
                };
                _context.TankVolumeHistories.Add(tankVolumeHistory);
                await _context.SaveChangesAsync(cancellationToken);


                return new FMSResponseMessage(true, "Opening stock created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating opening stock");
                return new FMSResponseMessage(false, $"Error while creating opening stock {ex}");
            }
        }
    }


}
