using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Features.FMS.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
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
    private readonly IMediator _mediator;

    public UpdateTankStockCommandHandler(GpsdataContext context, ILogger<UpdateTankStockCommandHandler> logger, IMapper mapper, IMediator mediator)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _mediator = mediator;
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
            var oldManualOpeningLevel = tankStock.ManualOpeningLevel;
            var oldManualClosingLevel = tankStock.ManualClosingLevel;

            // Map DTO to entity
            _mapper.Map(request.TankStockDTO, tankStock);

            // Optional: Process TankVolumeHistory updates if requested
            if (request.ProcessHistory)
            {
                var earliestAffectedTimestamp = await SyncLinkedVolumeHistoryAsync(tankStock, cancellationToken);

                _logger.LogInformation(
                    "Processed TankVolumeHistory updates for TankStock entry {EntryId}. " +
                    "Old values: EntryType={OldEntryType}, Amount={OldAmount}, Opening={OldOpening}, Closing={OldClosing}. " +
                    "New values: EntryType={NewEntryType}, Amount={NewAmount}, Opening={NewOpening}, Closing={NewClosing}. " +
                    "EarliestAffectedTimestamp={EarliestAffectedTimestamp}",
                    request.Id,
                    oldEntryType,
                    oldManualAmount,
                    oldManualOpeningLevel,
                    oldManualClosingLevel,
                    tankStock.EntryType,
                    tankStock.ManualAmount,
                    tankStock.ManualOpeningLevel,
                    tankStock.ManualClosingLevel,
                    earliestAffectedTimestamp);

                await _context.SaveChangesAsync(cancellationToken);

                if (earliestAffectedTimestamp.HasValue)
                {
                    var recalcResult = await _mediator.Send(
                        new UpdateTankVolumeHistoryCommand(
                            tankStock.TankId,
                            earliestAffectedTimestamp.Value,
                            IsHistoricalUpdate: true,
                            UpdateTankCurrentStock: true),
                        cancellationToken);

                    if (!recalcResult.Success)
                    {
                        throw new InvalidOperationException(
                            $"Tank stock updated, but tank volume history recalculation failed: {recalcResult.Message}");
                    }
                }
            }

            if (!request.ProcessHistory)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

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

    private async Task<DateTime?> SyncLinkedVolumeHistoryAsync(Tankstock tankStock, CancellationToken cancellationToken)
    {
        var linkedHistoryRecords = await _context.TankVolumeHistories
            .Where(history => history.ReferenceId == tankStock.EntryId && (history.IsDeleted != true))
            .ToListAsync(cancellationToken);

        if (!linkedHistoryRecords.Any())
        {
            _logger.LogWarning(
                "ProcessHistory requested for TankStock entry {EntryId}, but no linked TankVolumeHistory rows were found.",
                tankStock.EntryId);
            return null;
        }

        DateTime? earliestAffectedTimestamp = null;

        var openingHistory = linkedHistoryRecords
            .FirstOrDefault(history => history.ChangeReason == VolumeChangeReasonEnum.OpeningStock);

        if (openingHistory != null && tankStock.ManualOpeningLevel.HasValue)
        {
            openingHistory.TankId = tankStock.TankId;
            openingHistory.Timestamp = tankStock.EntryDate;
            openingHistory.NewVolume = tankStock.ManualOpeningLevel.Value;
            openingHistory.VolumeChange = 0m;
            openingHistory.RecordedBy = tankStock.RecordedBy;

            earliestAffectedTimestamp = openingHistory.Timestamp;
        }

        var closingHistory = linkedHistoryRecords
            .FirstOrDefault(history => history.ChangeReason == VolumeChangeReasonEnum.ClosingStock);

        if (closingHistory != null && tankStock.ManualClosingLevel.HasValue)
        {
            var openingTimestamp = openingHistory?.Timestamp ?? tankStock.EntryDate;
            var closingTimestamp = openingTimestamp.AddHours(23).AddMinutes(50);

            var previousTransaction = await _context.TankVolumeHistories
                .Where(history => history.TankId == tankStock.TankId &&
                                  history.Id != closingHistory.Id &&
                                  history.Timestamp < closingTimestamp &&
                                  (history.IsDeleted != true))
                .OrderByDescending(history => history.Timestamp)
                .ThenByDescending(history => history.Id)
                .FirstOrDefaultAsync(cancellationToken);

            closingHistory.TankId = tankStock.TankId;
            closingHistory.Timestamp = closingTimestamp;
            closingHistory.NewVolume = tankStock.ManualClosingLevel.Value;
            closingHistory.VolumeChange = tankStock.ManualClosingLevel.Value - (previousTransaction?.NewVolume ?? 0m);
            closingHistory.RecordedBy = tankStock.RecordedBy;

            if (!earliestAffectedTimestamp.HasValue || closingHistory.Timestamp < earliestAffectedTimestamp.Value)
            {
                earliestAffectedTimestamp = closingHistory.Timestamp;
            }
        }

        return earliestAffectedTimestamp;
    }
}