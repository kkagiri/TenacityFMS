using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

/// <summary>
/// Command for creating a manual fuel dispensing volume record (bulk entry for stock-taking)
/// Simple record-keeping without TankVolumeHistory manipulation
/// </summary>
public record CreateDispensingVolumeCommand(int TankId, decimal DispensedVolume, string RecordedBy, DateTime EntryDate, string? Notes = null) : IRequest<FMSResponseMessage>;

public class CreateDispensingVolumeCommandHandler : IRequestHandler<CreateDispensingVolumeCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDispensingVolumeCommandHandler> _logger;

    public CreateDispensingVolumeCommandHandler(
        GpsdataContext context,
        ILogger<CreateDispensingVolumeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(CreateDispensingVolumeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validation: Check if tank exists
            var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
            if (tank == null)
            {
                return new FMSResponseMessage(false, $"Tank ID {request.TankId} not found");
            }

            // Validation: Check for positive dispensed volume
            if (request.DispensedVolume <= 0)
            {
                return new FMSResponseMessage(false, "Dispensed volume should be greater than 0");
            }

            // Create simple TankStock entry for bulk dispensing record
            var tankStock = new Tankstock
            {
                TankId = request.TankId,
                EntryDate = request.EntryDate,
                EntryType = VolumeChangeReasonEnum.Dispensing,
                ManualAmount = request.DispensedVolume,
                RecordedBy = request.RecordedBy,
                SiteId = tank.SiteId,
                Comment = request.Notes ?? "Manual bulk dispensing volume entry",
                CreatedOn = DateTime.UtcNow
            };

            _context.Tankstocks.Add(tankStock);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Bulk dispensing volume recorded successfully for Tank {TankId}, Volume: {DispensedVolume}L, Entry ID: {EntryId}",
                request.TankId, request.DispensedVolume, tankStock.EntryId);

            return new FMSResponseMessage(true, "Dispensing volume recorded successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording bulk dispensing volume for Tank {TankId}", request.TankId);
            return new FMSResponseMessage(false, $"Error recording dispensing volume: {ex.Message}");
        }
    }
}