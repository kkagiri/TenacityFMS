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

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record CreateTankVolumeHistoryCommand (int TankId, DateTime Timestamp, decimal? VolumeChange, decimal? NewVolume, VolumeChangeReasonEnum ChangeReason, string RecordedBy) : IRequest<FMSResponseMessage>;
    

    public class CreateTankVolumeHistoryCommandHandler : IRequestHandler<CreateTankVolumeHistoryCommand, FMSResponseMessage>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<CreateTankVolumeHistoryCommandHandler> _logger;

        public CreateTankVolumeHistoryCommandHandler( GpsdataContext context ,ILogger<CreateTankVolumeHistoryCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        

        public async Task<FMSResponseMessage> Handle(CreateTankVolumeHistoryCommand request, CancellationToken cancellationToken)
        {
            using var transaction = _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var lastHistory = _context.TankVolumeHistories.
                    Where(x => x.TankId == request.TankId).
                    OrderByDescending(x => x.Timestamp).FirstOrDefaultAsync(cancellationToken);

                var newVolume = (lastHistory.Result?.NewVolume ?? 0) + request.VolumeChange;

                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.TankId,
                    Timestamp = request.Timestamp,
                    VolumeChange = request.VolumeChange,
                    NewVolume = newVolume,
                    ChangeReason = request.ChangeReason,
                    RecordedBy = request.RecordedBy
                };

                _context.TankVolumeHistories.Add(tankVolumeHistory);

              await _context.SaveChangesAsync(cancellationToken);

            await   transaction.Result.CommitAsync(cancellationToken);
               return new FMSResponseMessage(true, "Tank volume history created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank volume history");
                transaction.Result.Rollback();
                return  new FMSResponseMessage(false, "Error creating tank volume history");
            }

            }
        }
    }

