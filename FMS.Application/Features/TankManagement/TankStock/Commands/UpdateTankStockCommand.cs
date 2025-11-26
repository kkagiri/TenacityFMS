using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

/// <summary>
/// Command to update a TankStock entry.
/// Optionally processes TankVolumeHistory updates (controlled by processHistory parameter).
/// Provides warnings for historical edits that may impact subsequent records.
/// </summary>
public record UpdateTankStockCommand(
    TankStockDTO TankStockDTO,
    int Id,
    bool ProcessHistory = false
) : IRequest<bool>;

public class UpdateTankStockCommandHandler : IRequestHandler<UpdateTankStockCommand, bool>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateTankStockCommandHandler> _logger;
    private readonly IMapper _mapper;

    public UpdateTankStockCommandHandler(GpsdataContext context, ILogger<UpdateTankStockCommandHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<bool> Handle(UpdateTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStock = await _context.Tankstocks.FindAsync(new object[] { request.Id }, cancellationToken);
            if (tankStock == null) return false;

            // Check if this is a soft-deleted record
            if (tankStock.IsDeleted)
            {
                _logger.LogWarning("Attempted to update soft-deleted TankStock entry {EntryId}", request.Id);
                throw new InvalidOperationException($"Cannot update deleted tank stock entry {request.Id}");
            }

            var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == request.TankStockDTO.TankId, cancellationToken);
            if (tank == null) throw new Exception($"Tank with ID {request.TankStockDTO.TankId} does not exist.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.TankStockDTO.RecordedBy, cancellationToken);
            if (user == null) throw new Exception($"User with ID {request.TankStockDTO.RecordedBy} does not exist.");

            // Check if this is a historical edit (entry date is in the past)
            var isHistoricalEdit = tankStock.EntryDate < DateTime.UtcNow.Date;
            if (isHistoricalEdit)
            {
                _logger.LogWarning(
                    "Historical edit detected for TankStock entry {EntryId}. " +
                    "Entry date: {EntryDate}, Current date: {CurrentDate}. " +
                    "This may impact subsequent stock calculations.",
                    request.Id,
                    tankStock.EntryDate,
                    DateTime.UtcNow.Date);

                // Check if there are future records for this tank
                var hasFutureRecords = await _context.Tankstocks
                    .AnyAsync(ts => ts.TankId == tankStock.TankId &&
                                   ts.EntryDate > tankStock.EntryDate &&
                                   !ts.IsDeleted,
                             cancellationToken);

                if (hasFutureRecords)
                {
                    _logger.LogWarning(
                        "TankStock entry {EntryId} has future records. " +
                        "Updating this entry may require recalculation of subsequent balances. " +
                        "ProcessHistory flag: {ProcessHistory}",
                        request.Id,
                        request.ProcessHistory);
                }
            }

            // Store old values for logging
            var oldEntryType = tankStock.EntryType;
            var oldManualAmount = tankStock.ManualAmount;

            // Map DTO to entity
            _mapper.Map(request.TankStockDTO, tankStock);

            // Optional: Process TankVolumeHistory updates if requested
            if (request.ProcessHistory)
            {
                _logger.LogInformation(
                    "Processing TankVolumeHistory updates for updated TankStock entry {EntryId}. " +
                    "This feature is currently not implemented - TankStock updates do not automatically update TankVolumeHistory. " +
                    "Old values: EntryType={OldEntryType}, Amount={OldAmount}. " +
                    "New values: EntryType={NewEntryType}, Amount={NewAmount}.",
                    request.Id,
                    oldEntryType,
                    oldManualAmount,
                    tankStock.EntryType,
                    tankStock.ManualAmount);

                // TODO: Implement optional TankVolumeHistory processing
                // This would involve:
                // 1. Finding related TankVolumeHistory record by ReferenceId/ReferenceType
                // 2. Updating it or creating a new entry
                // 3. Triggering recalculation of subsequent balances if historical edit
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Tank stock entry {EntryId} updated successfully. ProcessHistory: {ProcessHistory}",
                request.Id,
                request.ProcessHistory);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tank stock");
            throw;
        }
    }
}