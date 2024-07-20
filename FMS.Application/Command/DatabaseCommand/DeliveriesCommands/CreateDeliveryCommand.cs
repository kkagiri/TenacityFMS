using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands
{
    public record CreateDeliveryCommand(DeliveryDTO DeliveryDTO) : IRequest<FMSResponseMessage>;


    public record CreateDeliveryCommandHandler : IRequestHandler<CreateDeliveryCommand, FMSResponseMessage>
    {
          private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeliveryCommandHandler> _logger;
        private readonly IMapper _mapper;

    public CreateDeliveryCommandHandler(GpsdataContext context, ILogger<CreateDeliveryCommandHandler> logger,IMapper mapper)
    {
        _context = context;
        _logger = logger;
            _mapper = mapper;
    }
        public async Task<FMSResponseMessage> Handle(CreateDeliveryCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var tank = await _context.Tanks.FindAsync(new object[] { request.DeliveryDTO.TankId }, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.DeliveryDTO.TankId} not found");

                var supplier = await _context.Suppliers.FindAsync(new object[] { request.DeliveryDTO.SupplierId }, cancellationToken);
                if (supplier == null) return new FMSResponseMessage(false, $"SupplierID {request.DeliveryDTO.SupplierId} not found");

                var user = await _context.Users.FindAsync(new object[] { request.DeliveryDTO.RecordedBy }, cancellationToken);
                if (user == null) return new FMSResponseMessage(false, $"UserID {request.DeliveryDTO.RecordedBy} not found");

                if (request.DeliveryDTO.ManualDeliveryAmount <= 0) return new FMSResponseMessage(false, "Delivery amount should be greater than 0");

                // Validate if the tank has enough space for the delivery
                if (tank.TankVolume < tank.CurrentStock + request.DeliveryDTO.ManualDeliveryAmount) return new FMSResponseMessage(false, "The tank does not have enough space for the delivery");

                //validate if start stock is less that stock level at end of delivery 
              if(request.DeliveryDTO.StockBeforeDelivery > request.DeliveryDTO.StockBeforeDelivery) return new FMSResponseMessage(false, "Start stock should be less than stock level at end of delivery");

               
                var site = await _context.Sites.FindAsync(new object[] { request.DeliveryDTO.SiteId }, cancellationToken);
                if (site == null) return new FMSResponseMessage(false, $"Site with ID {request.DeliveryDTO.SiteId} does not exist.");

                // Map the DTO to the entity
                // var delivery = new Delivery(
               _mapper.Map<DeliveryDTO>(request.DeliveryDTO);

                var delivery = _mapper.Map<Delivery>(request.DeliveryDTO);

                delivery.DeliveryDate = DateTime.Now;
                _context.Deliveries.Add(delivery);

                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.DeliveryDTO.TankId,
                    VolumeChange = request.DeliveryDTO.ManualDeliveryAmount,
                    NewVolume = tank.CurrentStock + request.DeliveryDTO.ManualDeliveryAmount,
                    ChangeReason = VolumeChangeReasonEnum.Delivery,
                    Timestamp = DateTime.Now
                };

                _context.TankVolumeHistories.Add(tankVolumeHistory);

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return new FMSResponseMessage(true, "Delivery created successfully");
            } catch( Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex.Message);
                throw;
            }

        }
    }

}
