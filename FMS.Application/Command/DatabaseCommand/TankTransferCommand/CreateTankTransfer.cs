using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankTransfer;
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

namespace FMS.Application.Command.DatabaseCommand.TankTransferCommand
{
    public record CreateTankTransfer(TankTransferDTO TankTransferDTO) : IRequest<FMSResponseMessage<TankTransferDTO>>;



    public class CreateTankTransferHandler : IRequestHandler<CreateTankTransfer, FMSResponseMessage<TankTransferDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankTransferHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;

        public CreateTankTransferHandler(GpsdataContext context, ILogger<CreateTankTransferHandler> logger ,IMapper mapper,IMediator mediatr)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediatr;

        }

        public async Task<FMSResponseMessage<TankTransferDTO>> Handle(CreateTankTransfer request, CancellationToken cancellationToken)
        {
            using var transaction = _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var sourceTank = await _context.Tanks.FindAsync(new object[] { request.TankTransferDTO.SourceTankId }, cancellationToken);

                var destinationTank = await _context.Tanks.FindAsync(new object[] { request.TankTransferDTO.DestinationTankId }, cancellationToken);

                if(sourceTank == null || destinationTank == null) return new FMSResponseMessage<TankTransferDTO>(false, "Source or Destination Tank not found",null);

                if(sourceTank.CurrentStock < request.TankTransferDTO.Amount) return new FMSResponseMessage<TankTransferDTO>(false, "Insufficient stock in source tank Check your stock Level ",null);


                var tankTransfer = _mapper.Map<TankTransfer>(request.TankTransferDTO);

                tankTransfer.TransferDate = DateTime.Now;

                _context.TankTransfers.Add(tankTransfer);

                //update source tank stock
                sourceTank.CurrentStock -= request.TankTransferDTO.Amount;

                //update tank history   
                 await _mediator.Send(new CreateTankVolumeHistoryCommand(sourceTank.Id, DateTime.Now, -request.TankTransferDTO.Amount, sourceTank.CurrentStock, VolumeChangeReasonEnum.TransferOut, request.TankTransferDTO.RecordedBy), cancellationToken);

                //update destination tank stock
                destinationTank.CurrentStock += request.TankTransferDTO.Amount;

                //update tank history
                await _mediator.Send(new CreateTankVolumeHistoryCommand(destinationTank.Id, DateTime.Now, request.TankTransferDTO.Amount, destinationTank.CurrentStock, VolumeChangeReasonEnum.TransferIn, request.TankTransferDTO.RecordedBy), cancellationToken);


                //update TankStock for both tanks
                var sourceTankStock = new Tankstock
                {
                    TankId = sourceTank.Id,
                    EntryDate = DateTime.UtcNow,
                    EntryType = VolumeChangeReasonEnum.TransferOut,
                    RecordedBy = request.TankTransferDTO.RecordedBy,
                    SiteId = sourceTank.SiteId,
                    ManualClosingLevel = sourceTank.CurrentStock,
                    ManualAmount = -request.TankTransferDTO.Amount

                    
                };

                var destinationTankStock = new Tankstock
                {
                    TankId = destinationTank.Id,
                    EntryDate = DateTime.UtcNow,
                    EntryType = VolumeChangeReasonEnum.TransferIn,
                    ManualClosingLevel = destinationTank.CurrentStock,
                    RecordedBy = request.TankTransferDTO.RecordedBy,
                    SiteId = destinationTank.SiteId,
                    ManualAmount = request.TankTransferDTO.Amount
                    
                };

                _context.Tankstocks.Add(sourceTankStock);
                _context.Tankstocks.Add(destinationTankStock);

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.Result.CommitAsync(cancellationToken);

                return new FMSResponseMessage<TankTransferDTO>(true, "Tank Transfer successful", request.TankTransferDTO);

                
                   
            }catch(Exception ex)
            {
                _logger.LogError(ex, "Error creating tank transfer");
                await transaction.Result.RollbackAsync(cancellationToken);
                return new FMSResponseMessage<TankTransferDTO>(false, "Error creating tank transfer",null);
            }   
        }
    }
}
