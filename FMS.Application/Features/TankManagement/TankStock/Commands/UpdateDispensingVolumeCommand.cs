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
/// Command for updating a manual fuel dispensing volume record
/// </summary>
public record UpdateDispensingVolumeCommand(int EntryId, decimal DispensedVolume, DateTime EntryDate, string? Notes = null) : IRequest<FMSResponseMessage>;

public class UpdateDispensingVolumeCommandHandler : IRequestHandler<UpdateDispensingVolumeCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDispensingVolumeCommandHandler> _logger;

    public UpdateDispensingVolumeCommandHandler(
        GpsdataContext context,
        ILogger<UpdateDispensingVolumeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(UpdateDispensingVolumeCommand request, CancellationToken cancellationToken)
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

            // Validation: Check for positive dispensed volume
            if (request.DispensedVolume <= 0)
            {
                return new FMSResponseMessage(false, "Dispensed volume should be greater than 0");
            }

            // Update the record
            tankStock.ManualAmount = request.DispensedVolume;
            tankStock.EntryDate = request.EntryDate;
            tankStock.Comment = request.Notes ?? tankStock.Comment;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Dispensing volume updated successfully for Entry ID: {EntryId}, New Volume: {DispensedVolume}L",
                request.EntryId, request.DispensedVolume);

            return new FMSResponseMessage(true, "Dispensing volume updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating dispensing volume for Entry ID: {EntryId}", request.EntryId);
            return new FMSResponseMessage(false, $"Error updating dispensing volume: {ex.Message}");
        }
    }
}
