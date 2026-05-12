using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.TankManagement.Services;
using FMS.Application.Services.Configuration;
using FMS.Application.Services.TankStock;
using FMS.Application.Util;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.DeliveriesCommands
{
    public record CreateDeliveryCommand(DeliveryDTO DeliveryDTO) : IRequest<FMSResponseMessage>;

    public class CreateDeliveryCommandHandler : IRequestHandler<CreateDeliveryCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateDeliveryCommandHandler> _logger;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly IEventExpressionEngine _eventEngine;
        private readonly ClosingStockDiscrepancyRefreshService _closingDiscrepancyRefreshService;
        private readonly ISystemConfigurationService _systemConfigurationService;

        public CreateDeliveryCommandHandler(GpsdataContext context, ILogger<CreateDeliveryCommandHandler> logger, IMapper mapper, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService, IEventExpressionEngine eventEngine, ClosingStockDiscrepancyRefreshService closingDiscrepancyRefreshService, ISystemConfigurationService systemConfigurationService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _eventEngine = eventEngine;
            _closingDiscrepancyRefreshService = closingDiscrepancyRefreshService;
            _systemConfigurationService = systemConfigurationService;
        }

        public async Task<FMSResponseMessage> Handle(CreateDeliveryCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(new object[] { request.DeliveryDTO.TankId }, cancellationToken);
                if (tank == null) return new FMSResponseMessage(false, $"TankID {request.DeliveryDTO.TankId} not found");

                var supplier = await _context.Suppliers.FindAsync(new object[] { request.DeliveryDTO.SupplierId }, cancellationToken);
                if (supplier == null) return new FMSResponseMessage(false, $"SupplierID {request.DeliveryDTO.SupplierId} not found");

                var user = await _context.Users.FindAsync(new object[] { request.DeliveryDTO.RecordedBy }, cancellationToken);
                if (user == null) return new FMSResponseMessage(false, $"UserID {request.DeliveryDTO.RecordedBy} not found");

                if (request.DeliveryDTO.ManualDeliveryAmount <= 0) return new FMSResponseMessage(false, "Delivery amount should be greater than 0");

                // Always use UTC for internal storage
                var deliveryDate = request.DeliveryDTO.DeliveryDate ?? DateTime.UtcNow;

                // Prevent multiple deliveries on the same tank within the same calendar day
                var deliveryExistsSameDay = await _context.Deliveries
                    .AsNoTracking()
                    .AnyAsync(
                        d => d.TankId == request.DeliveryDTO.TankId &&
                             d.DeliveryDate.Date == deliveryDate.Date,
                        cancellationToken);

                if (deliveryExistsSameDay)
                {
                    return new FMSResponseMessage(false,
                        $"A delivery for tank {request.DeliveryDTO.TankId} already exists on {deliveryDate:yyyy-MM-dd}. Only one delivery per tank per day is allowed.");
                }

                // Validate historical entry against future records policy
                if (deliveryDate.Date < DateTime.Now.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        request.DeliveryDTO.TankId, deliveryDate, VolumeChangeReasonEnum.Delivery, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage(false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical delivery entry with future records: Tank {TankId}, Date {DeliveryDate}, Policy {Policy}, Future Records {Count}",
                            request.DeliveryDTO.TankId, deliveryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // Check if there is opening stock for the tank on the delivery day
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
                        x.Timestamp.Date.Date == deliveryDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending(x => x.Timestamp.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock == null)
                    return new FMSResponseMessage(false, $"Opening stock for the tank on {deliveryDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.");

                // NEW VALIDATION: Delivery MUST be after opening stock (chronological order)
                if (deliveryDate < existingOpeningStock.Timestamp)
                {
                    return new FMSResponseMessage(false,
                        $"CHRONOLOGICAL ORDER VIOLATION: Delivery time ({deliveryDate:yyyy-MM-dd HH:mm:ss}) is BEFORE opening stock recorded at ({existingOpeningStock.Timestamp:yyyy-MM-dd HH:mm:ss}). " +
                        "Transactions must occur AFTER opening stock is recorded.");
                }

                // Ensure there is a proper sequence: if there's an opening stock, deliveries should come after it
                // but before or after a closing stock if it exists
                var closingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
                        x.Timestamp.Date == deliveryDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync(cancellationToken);

                // If there's already a closing stock for the day, and delivery is after that closing stock,
                // then we need a new opening stock first
                if (closingStockForDay != null && deliveryDate > closingStockForDay.Timestamp)
                {
                    return new FMSResponseMessage(false, $"Cannot add delivery after closing stock for {deliveryDate.Date:yyyy-MM-dd}. Please create a new opening stock first.");
                }

                // Validate if the tank has enough space for the delivery (only for today's deliveries)
                if (deliveryDate.Date == DateTime.UtcNow.Date)
                {
                    if (tank.TankVolume < tank.CurrentStock + request.DeliveryDTO.ManualDeliveryAmount)
                        return new FMSResponseMessage(false, "The tank does not have enough space for the delivery");
                }

                var delivery = _mapper.Map<Delivery>(request.DeliveryDTO);
                delivery.DeliveryDate = deliveryDate;
                delivery.CreatedOn = DateTime.UtcNow;

                _context.Deliveries.Add(delivery);

                if (tank.UseBookKeeping == 1 && deliveryDate.Date == DateTime.Now.Date)
                {
                    tank.CurrentStock += request.DeliveryDTO.ManualDeliveryAmount;
                    _context.Tanks.Update(tank);
                }

                await _context.SaveChangesAsync(cancellationToken);

                var matchedAutoDetectedDelivery = await TryMatchExistingAutoDetectedDeliveryAsync(
                    delivery,
                    request.DeliveryDTO.ManualDeliveryAmount,
                    deliveryDate,
                    cancellationToken);

                if (matchedAutoDetectedDelivery != null)
                {
                    await _context.SaveChangesAsync(cancellationToken);
                }

                // Update TankStock entry with delivery information (single-row-per-day architecture)
                var tankStock = await _context.Tankstocks
                    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
                        x.EntryDate.Date == deliveryDate.Date &&
                        !x.IsDeleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (tankStock != null)
                {
                    // Update delivery amount (cumulative if multiple deliveries, though typically only one per day)
                    tankStock.DeliveryAmount = (tankStock.DeliveryAmount ?? 0) + request.DeliveryDTO.ManualDeliveryAmount;
                    tankStock.DeliveryId = delivery.Id; // Store latest delivery ID

                    _context.Tankstocks.Update(tankStock);
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation("Updated TankStock EntryID {EntryId} with delivery amount {Amount}",
                        tankStock.EntryId, tankStock.DeliveryAmount);
                }
                else
                {
                    _logger.LogWarning("No TankStock entry found for Tank {TankId} on {Date} to update delivery amount",
                        request.DeliveryDTO.TankId, deliveryDate.Date);
                }

                //Cursor - Replaced manual TankVolumeHistory creation with TankVolumeHistoryIntegrationService
                // Calculate new physical stock value based on current operation
                decimal? newPhysicalStockValue = null;
                string? physicalStockSource = null;

                // For current day operations, calculate the new physical stock
                if (deliveryDate.Date == DateTime.Now.Date && tank.PhysicalStockValue.HasValue)
                {
                    newPhysicalStockValue = tank.PhysicalStockValue.Value + request.DeliveryDTO.ManualDeliveryAmount;
                    physicalStockSource = "Delivery";
                }

                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessDeliveryChangeAsync(
                    tankId: request.DeliveryDTO.TankId,
                    timestamp: deliveryDate,
                    volumeChange: request.DeliveryDTO.ManualDeliveryAmount, // Positive because delivery adds to tank
                    deliveryId: delivery.Id,
                    actionType: ActionType.Create, // This is a new delivery
                    recordedBy: request.DeliveryDTO.RecordedBy,
                    newPhysicalStockValue: newPhysicalStockValue, // Pass calculated physical stock
                    physicalStockSource: physicalStockSource, // Pass physical stock source
                    cancellationToken: cancellationToken);

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    // We continue even if volume history update fails, but log the error
                }

                // Fire ManualDeliveryEvent through the event expression engine
                try
                {
                    var isSameDay = deliveryDate.Date == DateTime.UtcNow.Date;
                    var fillPct = tank.TankVolume > 0
                        ? (request.DeliveryDTO.ManualDeliveryAmount / tank.TankVolume) * 100m
                        : 0m;

                    var site = await _context.Sites.FindAsync(new object[] { tank.SiteId }, cancellationToken);

                    var deliveryEvent = new ManualDeliveryEvent
                    {
                        SiteId = tank.SiteId,
                        TankId = tank.Id,
                        Severity = isSameDay ? "Low" : "Medium",
                        TriggeredBy = request.DeliveryDTO.RecordedBy,
                        Message = $"Manual delivery recorded: {request.DeliveryDTO.ManualDeliveryAmount:N0}L of {tank.FuelGradeName ?? "fuel"} to {tank.Name ?? $"Tank {tank.Id}"}" +
                                  (isSameDay ? " (same-day entry)" : $" (historical: {deliveryDate:yyyy-MM-dd})"),

                        // Delivery identification
                        DeliveryId = delivery.Id,
                        LpoNumber = request.DeliveryDTO.Lponumber ?? string.Empty,

                        // Tank / Site
                        TankName = tank.Name ?? $"Tank {tank.Id}",
                        SiteName = site?.Name ?? $"Site {tank.SiteId}",
                        ProductName = tank.FuelGradeName ?? "Unknown",

                        // Supplier
                        SupplierName = supplier.Name ?? $"Supplier {supplier.Id}",
                        SupplierId = supplier.Id,

                        // Volume
                        ManualDeliveryAmount = request.DeliveryDTO.ManualDeliveryAmount,
                        SensorDeliveryAmount = delivery.SensorDeliveryAmount ?? request.DeliveryDTO.SensorDeliveryAmount,
                        StockBeforeDelivery = request.DeliveryDTO.StockBeforeDelivery,
                        StockAfterDelivery = request.DeliveryDTO.StockAfterDelivery,
                        TankCapacity = tank.TankVolume,
                        FillPercentage = fillPct,

                        // Cost
                        PricePerLiter = request.DeliveryDTO.PricePerLiter,
                        TotalCost = request.DeliveryDTO.PricePerLiter.HasValue
                            ? request.DeliveryDTO.PricePerLiter.Value * request.DeliveryDTO.ManualDeliveryAmount
                            : null,

                        // Temperature / Density
                        DeliveryTemperature = request.DeliveryDTO.DeliveryTemperature,
                        DeliveryDensity = request.DeliveryDTO.DeliveryDensity,

                        // Timing
                        DeliveryDate = deliveryDate,
                        IsSameDay = isSameDay,
                        RecordedByName = user.UserName ?? request.DeliveryDTO.RecordedBy
                    };

                    await _eventEngine.ProcessAsync(deliveryEvent, cancellationToken);
                    _logger.LogInformation(
                        "ManualDelivery event fired for DeliveryId {DeliveryId}: Tank={Tank}, Volume={Volume}L, SameDay={SameDay}",
                        delivery.Id, tank.Name, request.DeliveryDTO.ManualDeliveryAmount, isSameDay);
                }
                catch (Exception eventEx)
                {
                    // Event engine failure should never block delivery creation
                    _logger.LogWarning(eventEx, "Failed to fire ManualDelivery event for DeliveryId {DeliveryId}", delivery.Id);
                }

                if (deliveryDate.Date < DateTime.UtcNow.Date)
                {
                    await _closingDiscrepancyRefreshService.RefreshClosingDiscrepancyAsync(
                        request.DeliveryDTO.TankId,
                        deliveryDate,
                        request.DeliveryDTO.RecordedBy ?? user.UserName ?? "System",
                        cancellationToken);
                }

                var successMessage = matchedAutoDetectedDelivery != null
                    ? $"Delivery created successfully and matched to sensor-detected delivery #{matchedAutoDetectedDelivery.DeliveryId}."
                    : "Delivery created successfully";

                return new FMSResponseMessage(true, successMessage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating delivery");
                return new FMSResponseMessage(false, "An error occurred while creating the delivery");
            }
        }

        private async Task<Intankdelivery?> TryMatchExistingAutoDetectedDeliveryAsync(
            Delivery delivery,
            decimal manualDeliveryAmount,
            DateTime deliveryDate,
            CancellationToken cancellationToken)
        {
            var autoMatchEnabled = await _systemConfigurationService.GetItdAutoMatchManualDeliveryAsync(cancellationToken);
            if (!autoMatchEnabled)
            {
                return null;
            }

            var tolerance = await _systemConfigurationService.GetItdMatchVolumeToleranceAsync(cancellationToken);
            var timeWindowHours = await _systemConfigurationService.GetItdMatchTimeWindowHoursAsync(cancellationToken);

            var windowStart = deliveryDate.AddHours(-timeWindowHours);
            var windowEnd = deliveryDate.AddHours(timeWindowHours);

            var candidates = await _context.Intankdeliveries
                .Where(itd => itd.TankId == delivery.TankId
                    && itd.MatchedDeliveryId == null
                    && (itd.Status == null || itd.Status == "Detected" || itd.Status == "Unmatched")
                    && ((itd.EndDateTime ?? itd.DetectedAt ?? itd.StartDateTime) >= windowStart)
                    && ((itd.EndDateTime ?? itd.DetectedAt ?? itd.StartDateTime) <= windowEnd))
                .ToListAsync(cancellationToken);

            if (!candidates.Any() || manualDeliveryAmount <= 0)
            {
                return null;
            }

            var bestCandidate = candidates
                .Select(itd =>
                {
                    var itdTimestamp = itd.EndDateTime ?? itd.DetectedAt ?? itd.StartDateTime ?? deliveryDate;
                    var itdVolume = itd.AbsoluteProductVolume.HasValue
                        ? (decimal)Math.Abs(itd.AbsoluteProductVolume.Value)
                        : 0m;

                    var relativeDiff = itdVolume <= 0
                        ? decimal.MaxValue
                        : Math.Abs(itdVolume - manualDeliveryAmount) / manualDeliveryAmount;

                    return new
                    {
                        Delivery = itd,
                        SensorVolume = itdVolume,
                        RelativeDiff = relativeDiff,
                        TimeDeltaMinutes = Math.Abs((itdTimestamp - deliveryDate).TotalMinutes)
                    };
                })
                .Where(candidate => candidate.SensorVolume > 0 && candidate.RelativeDiff <= tolerance)
                .OrderBy(candidate => candidate.RelativeDiff)
                .ThenBy(candidate => candidate.TimeDeltaMinutes)
                .FirstOrDefault();

            if (bestCandidate == null)
            {
                return null;
            }

            bestCandidate.Delivery.MatchedDeliveryId = delivery.Id;
            bestCandidate.Delivery.Status = "Matched";

            if (!delivery.SensorDeliveryAmount.HasValue || delivery.SensorDeliveryAmount.Value <= 0)
            {
                delivery.SensorDeliveryAmount = bestCandidate.SensorVolume;
            }

            _logger.LogInformation(
                "Matched manual Delivery {DeliveryId} to auto-detected ITD {ItdId} for Tank {TankId}. Manual={ManualAmount:F2}L Sensor={SensorAmount:F2}L",
                delivery.Id,
                bestCandidate.Delivery.DeliveryId,
                delivery.TankId,
                manualDeliveryAmount,
                bestCandidate.SensorVolume);

            return bestCandidate.Delivery;
        }
    }
}