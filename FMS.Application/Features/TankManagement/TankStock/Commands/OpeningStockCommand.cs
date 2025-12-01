using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand
{
    public record OpeningStockCommand(int TankId, decimal OpeningStock, string RecordedBy, DateTime? EntryDate = null, decimal? OpeningMeter = null) : IRequest<FMSResponseMessage>;

    public class OpeningStockCommandHandler : IRequestHandler<OpeningStockCommand, FMSResponseMessage>
    {
        public readonly GpsdataContext _context;
        public ILogger<OpeningStockCommandHandler> _logger;
        public IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly OpeningStockValidationService _openingStockValidationService;

        public OpeningStockCommandHandler(GpsdataContext context, ILogger<OpeningStockCommandHandler> logger, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService, OpeningStockValidationService openingStockValidationService)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _openingStockValidationService = openingStockValidationService;
        }
        public async Task<FMSResponseMessage> Handle(OpeningStockCommand request, CancellationToken cancellationToken)
        {

            try
            {

                var tank = await _context.Tanks.FindAsync(request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.TankId} not found ");
                if (request.OpeningStock <= 0) return new FMSResponseMessage(false, "Opening stock should be greater than 0");

                var entryDate = request.EntryDate?.Date ?? DateTime.Now.Date;

                // Validate historical entry against future records policy
                if (entryDate.Date < DateTime.Now.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.TankId, entryDate, VolumeChangeReasonEnum.OpeningStock, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage(false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical opening stock entry with future records: Tank {TankId}, Date {EntryDate}, Policy {Policy}, Future Records {Count}",
                            request.TankId, entryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // Enhanced validation using the new validation service
                var validationResult = await _openingStockValidationService.ValidateOpeningStockCreationAsync(request.TankId, entryDate, cancellationToken);
                if (!validationResult.Success)
                {
                    return new FMSResponseMessage(false, validationResult.Message);
                }

                // Check if OPENING STOCK entry already exists for this tank on this date
                var existingOpeningStock = await _context.Tankstocks
                    .Where(x => x.TankId == request.TankId &&
                        x.EntryDate.Date == entryDate.Date &&
                        x.EntryType == VolumeChangeReasonEnum.OpeningStock &&
                        (x.IsDeleted == null || x.IsDeleted == false))
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock != null)
                {
                    var tankName = tank.Name ?? $"Tank {request.TankId}";
                    return new FMSResponseMessage(false,
                        $"An opening stock entry already exists for {tankName} on {entryDate:yyyy-MM-dd}. " +
                        "Only one opening stock per tank per day is allowed. " +
                        "Use Update operation to modify existing entry.");
                }

                // Clean up any soft-deleted TankStock entries for this tank on this date
                // This handles the case where unique constraint doesn't respect IsDeleted flag
                var deletedEntries = await _context.Tankstocks
                    .Where(x => x.TankId == request.TankId &&
                        x.EntryDate.Date == entryDate.Date &&
                        x.IsDeleted == true)
                    .ToListAsync(cancellationToken);

                if (deletedEntries.Any())
                {
                    _context.Tankstocks.RemoveRange(deletedEntries);
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Cleaned up {Count} soft-deleted TankStock entries for tank {TankId} on {Date}",
                        deletedEntries.Count, request.TankId, entryDate.ToString("yyyy-MM-dd"));
                }

                //Cursor - Check for previous closing stock but don't require it (allow first opening stock)
                // CRITICAL: Secondary sort by Id ensures we get the correct latest record when timestamps are equal
                var previousClosingStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.TankId &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                        x.Timestamp < entryDate)
                    .OrderByDescending(x => x.Timestamp)
                    .ThenByDescending(x => x.Id)  // Secondary sort for deterministic ordering
                    .FirstOrDefaultAsync(cancellationToken);

                var stockTaking = new Tankstock
                {
                    TankId = request.TankId,
                    EntryDate = entryDate.AddMinutes(5), // Always 00:05:00 UTC on the entry date
                    EntryType = VolumeChangeReasonEnum.OpeningStock,
                    ManualOpeningLevel = request.OpeningStock,
                    OpeningMeter = request.OpeningMeter, // Save opening meter reading
                    RecordedBy = request.RecordedBy,
                    SiteId = tank.SiteId
                };
                _context.Tankstocks.Add(stockTaking);

                // Save only the Tankstock entry first to get the ID
                await _context.SaveChangesAsync(cancellationToken);

                //Cursor - Calculate volume change: if no previous closing stock, use 0 as baseline (will show large negative or positive)
                decimal volumeChange;
                if (previousClosingStock != null && previousClosingStock.NewVolume.HasValue)
                {
                    // Calculate from previous closing stock
                    volumeChange = request.OpeningStock - previousClosingStock.NewVolume.Value;
                }
                else
                {
                    // No previous closing stock - use 0 as baseline (first opening stock scenario)
                    volumeChange = request.OpeningStock - 0; // This will be the full opening stock amount
                }

                // Determine physical stock source based on entry date
                var physicalStockSource = entryDate.Date == DateTime.UtcNow.Date
                    ? "Manual Opening Stock"
                    : "Manual Opening Stock (Historical)";

                //Cursor - Use TankVolumeHistoryIntegrationService which will handle tank updates atomically
                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessTankStockChangeAsync(
                    tankId: request.TankId,
                    timestamp: stockTaking.EntryDate,
                    volumeChange: volumeChange,
                    stockId: stockTaking.EntryId,
                    isOpening: true, // This is an opening stock
                    actionType: ActionType.Create, // This is a new opening stock
                    recordedBy: request.RecordedBy,
                    newPhysicalStockValue: request.OpeningStock, // Pass the physical stock value
                    physicalStockSource: physicalStockSource, // Pass the physical stock source
                    cancellationToken: cancellationToken);

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    return new FMSResponseMessage(false, $"Failed to update tank volume history: {volumeUpdateResult.Message}");
                }

                return new FMSResponseMessage(true, "Opening stock created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating opening stock");
                return new FMSResponseMessage(false, $"Error while creating opening stock {ex}");
            }
        }
    }

}