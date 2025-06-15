using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands;

public record DeleteDeliveryCommand(int Id) : IRequest<FMSResponseMessage>;

public class DeleteDeliveryCommandHandler : IRequestHandler<DeleteDeliveryCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDeliveryCommandHandler> _logger;
    private readonly ITankVolumeAdjustmentService _adjustmentService;

    public DeleteDeliveryCommandHandler(
        GpsdataContext context,
        ILogger<DeleteDeliveryCommandHandler> logger,
        ITankVolumeAdjustmentService adjustmentService)
    {
        _context = context;
        _logger = logger;
        _adjustmentService = adjustmentService;
    }


    public async Task<FMSResponseMessage> Handle(DeleteDeliveryCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var delivery = await _context.Deliveries.FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

            if (delivery == null) return new FMSResponseMessage(false, $"Delivery with ID {request.Id} not found");

            try
            {
                // Adjust tank volume before deleting the delivery
                await _adjustmentService.AdjustTankVolumeAsync(
                    delivery.TankId,
                    delivery.Id,
                    delivery.StockAfterDelivery,
                    delivery.StockBeforeDelivery,
                    VolumeChangeReasonEnum.Delivery,
                    delivery.RecordedBy,
                    false,
                    true,
                    cancellationToken
                );

                _context.Deliveries.Remove(delivery);
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "Delivery deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adjusting tank volume during delivery deletion");
                return new FMSResponseMessage(false, "Error adjusting tank volume during delivery deletion");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting delivery");
            return new FMSResponseMessage(false, "Error deleting delivery");
        }
    }
}