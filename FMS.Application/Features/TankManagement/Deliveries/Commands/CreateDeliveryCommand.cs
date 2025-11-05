using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Services.TankStock;
using FMS.Application.Util;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands
{
    public record CreateDeliveryCommand(DeliveryDTO DeliveryDTO) : IRequest<FMSResponseMessage>;

    public class CreateDeliveryCommandHandler : IRequestHandler<CreateDeliveryCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateDeliveryCommandHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;

        public CreateDeliveryCommandHandler(GpsdataContext context, ILogger<CreateDeliveryCommandHandler> logger, IMapper mapper, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
        }

        public async Task<FMSResponseMessage> Handle(CreateDeliveryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(new object[] { request.DeliveryDTO.TankId }, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.DeliveryDTO.TankId} not found");

                var supplier = await _context.Suppliers.FindAsync(new object[] { request.DeliveryDTO.SupplierId }, cancellationToken);
                if (supplier == null) return new FMSResponseMessage(false, $"SupplierID {request.DeliveryDTO.SupplierId} not found");

                var user = await _context.Users.FindAsync(new object[] { request.DeliveryDTO.RecordedBy }, cancellationToken);
                if (user == null) return new FMSResponseMessage(false, $"UserID {request.DeliveryDTO.RecordedBy} not found");

                if (request.DeliveryDTO.ManualDeliveryAmount <= 0) return new FMSResponseMessage(false, "Delivery amount should be greater than 0");

                var deliveryDate = request.DeliveryDTO.DeliveryDate ?? DateTime.Now;

                // Prevent multiple deliveries on the same tank within the same calendar day
                var deliveryExistsSameDay = await _context.Deliveries
                    .AsNoTracking()
                    .AnyAsync(
                        d => d.TankId == request.DeliveryDTO.TankId &&
                             d.DeliveryDate.Date == deliveryDate.Date,
                        cancellationToken);

                if (deliveryExistsSameDay)
                {
                    return new FMSResponseMessage(false,
                        $"A delivery for tank {request.DeliveryDTO.TankId} already exists on {deliveryDate:yyyy-MM-dd}. Only one delivery per tank per day is allowed.");
                }

                // Validate historical entry against future records policy
                if (deliveryDate.Date < DateTime.Now.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.DeliveryDTO.TankId, deliveryDate, VolumeChangeReasonEnum.Delivery, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage(false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical delivery entry with future records: Tank {TankId}, Date {DeliveryDate}, Policy {Policy}, Future Records {Count}",
                            request.DeliveryDTO.TankId, deliveryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // Check if there is opening stock for the tank on the delivery day
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
                        x.Timestamp.Date.Date == deliveryDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending(x => x.Timestamp.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock == null)
                    return new FMSResponseMessage(false, $"Opening stock for the tank on {deliveryDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.");

                // Ensure there is a proper sequence: if there's an opening stock, deliveries should come after it
                // but before or after a closing stock if it exists
                var closingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
                        x.Timestamp.Date == deliveryDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync(cancellationToken);

                // If there's already a closing stock for the day, and delivery is after that closing stock,
                // then we need a new opening stock first
                if (closingStockForDay != null && deliveryDate > closingStockForDay.Timestamp)
                {
                    return new FMSResponseMessage(false, $"Cannot add delivery after closing stock for {deliveryDate.Date:yyyy-MM-dd}. Please create a new opening stock first.");
                }

                // Validate if the tank has enough space for the delivery
                if (deliveryDate.Date == DateTime.Now.Date)
                {
                    if (tank.TankVolume < tank.CurrentStock + request.DeliveryDTO.ManualDeliveryAmount)
                        return new FMSResponseMessage(false, "The tank does not have enough space for the delivery");
                }

                // Validate if start stock is less than stock level at end of delivery
                if (request.DeliveryDTO.StockBeforeDelivery > request.DeliveryDTO.StockBeforeDelivery + request.DeliveryDTO.ManualDeliveryAmount)
                    return new FMSResponseMessage(false, "Start stock should be less than stock level at end of delivery");

                var delivery = _mapper.Map<Delivery>(request.DeliveryDTO);
                delivery.DeliveryDate = deliveryDate;
                delivery.CreatedOn = DateTime.UtcNow;

                _context.Deliveries.Add(delivery);

                if (tank.UseBookKeeping == 1 && deliveryDate.Date == DateTime.Now.Date)
                {
                    tank.CurrentStock += request.DeliveryDTO.ManualDeliveryAmount;
                    _context.Tanks.Update(tank);
                }

                await _context.SaveChangesAsync(cancellationToken);

                //Cursor - Replaced manual TankVolumeHistory creation with TankVolumeHistoryIntegrationService
                // Calculate new physical stock value based on current operation
                decimal? newPhysicalStockValue = null;
                string? physicalStockSource = null;

                // For current day operations, calculate the new physical stock
                if (deliveryDate.Date == DateTime.Now.Date && tank.PhysicalStockValue.HasValue)
                {
                    newPhysicalStockValue = tank.PhysicalStockValue.Value + request.DeliveryDTO.ManualDeliveryAmount;
                    physicalStockSource = "Delivery";
                }

                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessDeliveryChangeAsync(
                    tankId: request.DeliveryDTO.TankId,
                    timestamp: deliveryDate,
                    volumeChange: request.DeliveryDTO.ManualDeliveryAmount, // Positive because delivery adds to tank
                    deliveryId: delivery.Id,
                    actionType: ActionType.Create, // This is a new delivery
                    recordedBy: request.DeliveryDTO.RecordedBy,
                    newPhysicalStockValue: newPhysicalStockValue, // Pass calculated physical stock
                    physicalStockSource: physicalStockSource, // Pass physical stock source
                    cancellationToken: cancellationToken);

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    // We continue even if volume history update fails, but log the error
                }

                return new FMSResponseMessage(true, "Delivery created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating delivery");
                return new FMSResponseMessage(false, "An error occurred while creating the delivery");
            }
        }
    }
}