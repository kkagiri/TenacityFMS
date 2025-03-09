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
using System.Linq;
using FMS.Domain.Entities;

namespace FMS.Application.Command.DatabaseCommand.TankTransferCommand;

public record DeleteTankTransferCommand(int Id) : IRequest<FMSResponseMessage>;

public class DeleteTankTransferCommandHandler : IRequestHandler<DeleteTankTransferCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTankTransferCommandHandler> _logger;
    private readonly ITankVolumeAdjustmentService _adjustmentService;

    public DeleteTankTransferCommandHandler(
        GpsdataContext context,
        ILogger<DeleteTankTransferCommandHandler> logger,
        ITankVolumeAdjustmentService adjustmentService)
    {
        _context = context;
        _logger = logger;
        _adjustmentService = adjustmentService;
    }

    public async Task<FMSResponseMessage> Handle(DeleteTankTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.TankTransfers
                .Include(t => t.SourceTank)
                .Include(t => t.DestinationTank)
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (transfer == null)
                return new FMSResponseMessage(false, $"Tank transfer with ID {request.Id} not found");

            try
            {
                // Adjust source tank volume (add back the transferred volume)
                await _adjustmentService.AdjustTankVolumeAsync(
                    transfer.SourceTankId ?? 0,
                    transfer.Id,
                    (transfer.SourceTank.CurrentStock ?? 0) - (transfer.Amount ?? 0),  // Current volume
                    transfer.SourceTank.CurrentStock ?? 0,                             // Original volume
                    VolumeChangeReasonEnum.Adjustment,
                    transfer.RecordedBy ?? string.Empty,
                    false,
                    true,
                    cancellationToken
                );

                // Adjust destination tank volume (remove the transferred volume)
                await _adjustmentService.AdjustTankVolumeAsync(
                    transfer.DestinationTankId ?? 0,
                    transfer.Id,
                    (transfer.DestinationTank.CurrentStock ?? 0) + (transfer.Amount ?? 0),  // Current volume
                    transfer.DestinationTank.CurrentStock ?? 0,                             // Original volume
                    VolumeChangeReasonEnum.Adjustment,
                    transfer.RecordedBy ?? string.Empty,
                    false,
                    true,
                    cancellationToken
                );

                _context.TankTransfers.Remove(transfer);
                await _context.SaveChangesAsync(cancellationToken);

                return new FMSResponseMessage(true, "Tank transfer deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adjusting tank volumes during transfer deletion");
                return new FMSResponseMessage(false, "Error adjusting tank volumes during transfer deletion");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tank transfer");
            return new FMSResponseMessage(false, "Error deleting tank transfer");
        }
    }
}