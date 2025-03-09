
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.Common;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands;


public record UpdateDeliveryCommand(DeliveryDTO DeliveryDTO, bool ignoreNegativesValues = false) : IRequest<FMSResponseMessage>;
public class UpdateDeliveryCommandHandler : IRequestHandler<UpdateDeliveryCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeliveryCommandHandler> _logger;

    private readonly ITankVolumeAdjustmentService _adjustmentService;

    public UpdateDeliveryCommandHandler(GpsdataContext context, ILogger<UpdateDeliveryCommandHandler> logger, ITankVolumeAdjustmentService adjustmentService)
    {
        _context = context;
        _logger = logger;
        _adjustmentService = adjustmentService;
    }

    public async Task<FMSResponseMessage> Handle(UpdateDeliveryCommand request, CancellationToken cancellationToken)
    {
        try
        {

            var tank = await _context.Tanks.FindAsync(new object[] { request.DeliveryDTO.TankId }, cancellationToken);
            if (tank == null) return new FMSResponseMessage(false, $"TankID {request.DeliveryDTO.TankId} not found");

            var supplier = await _context.Suppliers.FindAsync(new object[] { request.DeliveryDTO.SupplierId }, cancellationToken);
            if (supplier == null) return new FMSResponseMessage(false, $"SupplierID {request.DeliveryDTO.SupplierId} not found");

            var user = await _context.Users.FindAsync(new object[] { request.DeliveryDTO.RecordedBy }, cancellationToken);
            if (user == null) return new FMSResponseMessage(false, $"UserID {request.DeliveryDTO.RecordedBy} not found");




            var dto = request.DeliveryDTO;
            //1. Fetch existing delivery

            var existingDelivery = await _context.Deliveries.FirstOrDefaultAsync(d => d.Id == dto.Id, cancellationToken);

            if (existingDelivery == null) return new FMSResponseMessage(false, $"Delivery with ID {dto.Id} not found");

            //2. Calculate the difference between the new and old delivery amount
            var oldVolume = existingDelivery.ManualDeliveryAmount;
            var oldStockBefore = existingDelivery.StockBeforeDelivery;
            var oldStockAfter = existingDelivery.StockAfterDelivery;

            //Fields that do not Affect the stock level
            existingDelivery.DeliveryDate = dto.DeliveryDate ?? existingDelivery.DeliveryDate;
            existingDelivery.CreatedOn = dto.CreatedOn;
            existingDelivery.DeliveryTemperature = dto.DeliveryTemperature;
            existingDelivery.DeliveryDensity = dto.DeliveryDensity;
            existingDelivery.DeliveryMass = dto.DeliveryMass;
            existingDelivery.SupplierId = dto.SupplierId;
            existingDelivery.RecordedBy = dto.RecordedBy;
            existingDelivery.Lponumber = dto.Lponumber;
            existingDelivery.Product = dto.Product;

            bool stockLevelChanged = false;

            if (dto.ManualDeliveryAmount != oldVolume)
            {
                existingDelivery.ManualDeliveryAmount = dto.ManualDeliveryAmount;
                stockLevelChanged = true;
            }
            //if stockbeforedelivery is changed
            if (dto.StockBeforeDelivery != oldStockBefore)
            {
                existingDelivery.StockBeforeDelivery = dto.StockBeforeDelivery;
                stockLevelChanged = true;
            }

            //if stockafterdelivery is changed
            if (dto.StockAfterDelivery != oldStockAfter)
            {
                existingDelivery.StockAfterDelivery = dto.StockAfterDelivery;
                stockLevelChanged = true;
            }


            _context.Deliveries.Update(existingDelivery);
            await _context.SaveChangesAsync(cancellationToken);

            if (stockLevelChanged)
            {
                var oldVolumeStock = oldStockAfter;
                var newVolumeStock = dto.StockAfterDelivery;

                try
                {
                    await _adjustmentService.AdjustTankVolumeAsync(
                        existingDelivery.TankId,
                        existingDelivery.Id,
                         oldVolumeStock,
                        newVolumeStock,
                        VolumeChangeReasonEnum.Delivery, dto.RecordedBy,
                       request.ignoreNegativesValues,
                       true,
                        cancellationToken
                    );
                }
                catch (System.Exception ex)
                {
                    _logger.LogError(ex, "Error adjusting tank volume");
                    return new FMSResponseMessage(false, "Error adjusting tank volume");
                }

            }

            return new FMSResponseMessage(true, "Delivery updated successfully");

        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Error updating delivery");
            return new FMSResponseMessage(false, "Error updating delivery");
        }

    }
}