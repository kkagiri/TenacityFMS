using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Application.Util;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands
{
    public record CreateDeliveryCommand(DeliveryDTO DeliveryDTO) : IRequest<FMSResponseMessage>;

    public class CreateDeliveryCommandHandler : IRequestHandler<CreateDeliveryCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateDeliveryCommandHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public CreateDeliveryCommandHandler(GpsdataContext context, ILogger<CreateDeliveryCommandHandler> logger, IMapper mapper, IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
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

                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.DeliveryDTO.TankId,
                    VolumeChange = request.DeliveryDTO.ManualDeliveryAmount,
                    NewVolume = tank.CurrentStock,
                    ChangeReason = VolumeChangeReasonEnum.Delivery,
                    Timestamp = deliveryDate,
                    RecordedBy = request.DeliveryDTO.RecordedBy,
                    ReferenceId = delivery.Id,
                    ReferenceType = "Delivery"
                };
                _context.TankVolumeHistories.Add(tankVolumeHistory);

                await _context.SaveChangesAsync(cancellationToken);

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