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
    public record CreateTankVolumeHistoryCommand (TankVolumeHistory TankVolumeHistory) : IRequest<FMSResponseMessage>;
    

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
            try
            {
                var lastHistory = _context.TankVolumeHistories.
                    Where(x => x.TankId == request.TankVolumeHistory.TankId).
                    OrderByDescending(x => x.Timestamp).FirstOrDefaultAsync(cancellationToken);

                var newVolume = (lastHistory.Result?.NewVolume ?? 0) + request.TankVolumeHistory.NewVolume;

                var tankVolumeHistory = new TankVolumeHistory
                {
                    TankId = request.TankVolumeHistory.TankId,
                    Timestamp = request.TankVolumeHistory.Timestamp,
                    VolumeChange = request.TankVolumeHistory.VolumeChange,
                    NewVolume = newVolume,
                    ChangeReason = request.TankVolumeHistory.ChangeReason,
                    RecordedBy = request.TankVolumeHistory.RecordedBy,
                    ReferenceType = request.TankVolumeHistory.ReferenceType,
                    ReferenceId = request.TankVolumeHistory.ReferenceId.Value
                };

                _context.TankVolumeHistories.Add(tankVolumeHistory);

              await _context.SaveChangesAsync(cancellationToken);

               return new FMSResponseMessage(true, "Tank volume history created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tank volume history");
                return  new FMSResponseMessage(false, "Error creating tank volume history");
            }

            }
        }
    }

