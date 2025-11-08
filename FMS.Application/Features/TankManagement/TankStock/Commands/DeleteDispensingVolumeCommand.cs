using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

/// <summary>
/// Command for deleting a manual fuel dispensing volume record
/// </summary>
public record DeleteDispensingVolumeCommand(int EntryId) : IRequest<FMSResponseMessage>;

public class DeleteDispensingVolumeCommandHandler : IRequestHandler<DeleteDispensingVolumeCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDispensingVolumeCommandHandler> _logger;

    public DeleteDispensingVolumeCommandHandler(
        GpsdataContext context,
        ILogger<DeleteDispensingVolumeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteDispensingVolumeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Find the existing dispensing record
            var tankStock = await _context.Tankstocks
                .FirstOrDefaultAsync(ts => ts.EntryId == request.EntryId && ts.EntryType == VolumeChangeReasonEnum.Dispensing, cancellationToken);

            if (tankStock == null)
            {
                return new FMSResponseMessage(false, $"Dispensing record with ID {request.EntryId} not found");
            }

            _context.Tankstocks.Remove(tankStock);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Dispensing volume deleted successfully for Entry ID: {EntryId}, Tank ID: {TankId}",
                request.EntryId, tankStock.TankId);

            return new FMSResponseMessage(true, "Dispensing volume deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting dispensing volume for Entry ID: {EntryId}", request.EntryId);
            return new FMSResponseMessage(false, $"Error deleting dispensing volume: {ex.Message}");
        }
    }
}
