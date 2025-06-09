using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

public record DeleteTankStockCommand(int Id) : IRequest<FMSResponseMessage>;

public class DeleteTankStockCommandHandler : IRequestHandler<DeleteTankStockCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTankStockCommandHandler> _logger;

    public DeleteTankStockCommandHandler(
        GpsdataContext context,
        ILogger<DeleteTankStockCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStock = await _context.Tankstocks
                .Include(ts => ts.Tank)
                .FirstOrDefaultAsync(ts => ts.EntryId == request.Id, cancellationToken);

            if (tankStock == null)
                return new FMSResponseMessage(false, $"TankStock with ID {request.Id} not found");

            // Check for related deliveries on the same date
            var hasDeliveries = await _context.Deliveries
                .AnyAsync(d => d.TankId == tankStock.TankId &&
                              d.DeliveryDate.Date == tankStock.EntryDate.Date,
                              cancellationToken);

            if (hasDeliveries)
            {
                return new FMSResponseMessage(
                    false,
                    $"Cannot delete tank stock with ID {request.Id} because there are deliveries on {tankStock.EntryDate.Date:d}. " +
                    "Please delete the deliveries first."
                );
            }

            // Check for related transfers on the same date
            var hasTransfers = await _context.TankTransfers
                .AnyAsync(t => (t.SourceTankId == tankStock.TankId || t.DestinationTankId == tankStock.TankId)
                              && (t.TransferDate != null && t.TransferDate.Value.Date == tankStock.EntryDate.Date),
                              cancellationToken);

            if (hasTransfers)
            {
                return new FMSResponseMessage(
                    false,
                    $"Cannot delete tank stock with ID {request.Id} because there are tank transfers on {tankStock.EntryDate.Date:d}. " +
                    "Please delete the tank transfers first."
                );
            }

            // Check if this is an opening stock and has a corresponding closing stock
            if (tankStock.EntryType == VolumeChangeReasonEnum.OpeningStock)
            {
                var hasClosingStock = await _context.Tankstocks
                    .AnyAsync(ts => ts.TankId == tankStock.TankId
                                   && ts.EntryDate.Date == tankStock.EntryDate.Date
                                   && ts.EntryType == VolumeChangeReasonEnum.ClosingStock,
                                   cancellationToken);

                if (hasClosingStock)
                {
                    return new FMSResponseMessage(
                        false,
                        $"Cannot delete opening stock with ID {request.Id} because it has a corresponding closing stock. " +
                        "Please delete the closing stock first."
                    );
                }
            }

            // If this is today's record and affects current stock, update the tank
            if (tankStock.EntryDate.Date == DateTime.Now.Date && tankStock.Tank.UseBookKeeping == 1)
            {
                var previousStock = await _context.Tankstocks
                    .Where(ts => ts.TankId == tankStock.TankId
                                && ts.EntryId != tankStock.EntryId
                                && ts.EntryDate < tankStock.EntryDate)
                    .OrderByDescending(ts => ts.EntryDate)
                    .FirstOrDefaultAsync(cancellationToken);

                // Update tank's current stock based on the previous record
                if (tankStock.Tank != null)
                {
                    tankStock.Tank.CurrentStock = previousStock?.ManualClosingLevel
                                                ?? previousStock?.ManualOpeningLevel
                                                ?? 0;
                    _context.Tanks.Update(tankStock.Tank);
                }
            }

            // Delete the tank volume history record if it exists
            var volumeHistory = await _context.TankVolumeHistories
                .FirstOrDefaultAsync(tvh => tvh.ReferenceId == tankStock.EntryId
                                          && (tvh.ChangeReason == VolumeChangeReasonEnum.OpeningStock
                                              || tvh.ChangeReason == VolumeChangeReasonEnum.ClosingStock),
                                          cancellationToken);

            if (volumeHistory != null)
            {
                _context.TankVolumeHistories.Remove(volumeHistory);
            }

            _context.Tankstocks.Remove(tankStock);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage(true, "Tank stock deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tank stock");
            return new FMSResponseMessage(false, "Error deleting tank stock");
        }
    }
}
