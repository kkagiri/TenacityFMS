using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands
{

    public record CreateFuelRrefillCommand(FuelRefilDTO FuelRefilDTO) : IRequest<FMSResponseMessage>;

    public class CreateFuelRrefillCommandCommandHandler : IRequestHandler<CreateFuelRrefillCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateFuelRrefillCommandCommandHandler> _logger;
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;

        public CreateFuelRrefillCommandCommandHandler(
            GpsdataContext context,
            ILogger<CreateFuelRrefillCommandCommandHandler> logger,
            IMapper mapper,
            TankVolumeHistoryIntegrationService tankVolumeHistoryService,
            TankStockFutureRecordsService futureRecordsService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
        }

        public async Task<FMSResponseMessage> Handle(CreateFuelRrefillCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (request.FuelRefilDTO == null)
                {
                    return new FMSResponseMessage(false, "Fuel refill data is required.");
                }
                var fuelRefilDto = request.FuelRefilDTO;

                // Always use UTC for internal storage
                var entryDate = request.FuelRefilDTO?.Date ?? DateTime.UtcNow;

                // Validate historical entry against future records policy
                if (entryDate.Date < DateTime.UtcNow.Date)
                {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                        fuelRefilDto.TankId ?? 0, entryDate, VolumeChangeReasonEnum.Dispensing, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed)
                    {
                        return new FMSResponseMessage(false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation)
                    {
                        _logger.LogWarning("Historical fuel refill entry with future records: Tank {TankId}, Date {EntryDate}, Policy {Policy}, Future Records {Count}",
                            fuelRefilDto.TankId, entryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                // Check if there is opening stock for the tank on the entry day
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.FuelRefilDTO.TankId &&
                        x.Timestamp.Date.Date == entryDate.Date.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .OrderByDescending(x => x.Timestamp.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOpeningStock == null)
                    return new FMSResponseMessage(false, $"Opening stock for the tank on {entryDate.Date:yyyy-MM-dd} not found. Create a new Opening Stock first.");

                // NEW VALIDATION: Fuel refill MUST be after opening stock (chronological order)
                if (entryDate < existingOpeningStock.Timestamp)
                {
                    return new FMSResponseMessage(false,
                        $"CHRONOLOGICAL ORDER VIOLATION: Fuel refill time ({entryDate:yyyy-MM-dd HH:mm:ss}) is BEFORE opening stock recorded at ({existingOpeningStock.Timestamp:yyyy-MM-dd HH:mm:ss}). " +
                        "Transactions must occur AFTER opening stock is recorded.");
                }

                // Ensure there is a proper sequence: if there's an opening stock, fuel refills should come after it
                // but before or after a closing stock if it exists
                var closingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.FuelRefilDTO.TankId &&
                        x.Timestamp.Date == entryDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .FirstOrDefaultAsync(cancellationToken);

                // If there's already a closing stock for the day, and fuel refill is after that closing stock,
                // then we need a new opening stock first
                if (closingStockForDay != null && fuelRefilDto.Date > closingStockForDay.Timestamp)
                {
                    return new FMSResponseMessage(false, $"Cannot add fuel refill after closing stock for {entryDate.Date:yyyy-MM-dd}. Please create a new opening stock first.");
                }

                var existingRefuel = await _context.FuelRefills
                    .FirstOrDefaultAsync(f =>
                        f.VehicleId == fuelRefilDto.VehicleId &&
                        f.Date.Value.Date == fuelRefilDto.Date.Value.Date &&
                        f.PreviousMeterReading == fuelRefilDto.PreviousMeterReading &&
                        f.CurrentMeterReading == fuelRefilDto.CurrentMeterReading &&
                        f.ManualFuelrefillAmount == fuelRefilDto.ManualFuelrefillAmount,
                        cancellationToken);

                if (existingRefuel != null) return new FMSResponseMessage(false, "Duplicate entry: A fuel refill with the same details already exists for this vehicle on the specified date.");

                if (request.FuelRefilDTO.ManualFuelrefillAmount == null || request.FuelRefilDTO.ManualFuelrefillAmount <= 0) return new FMSResponseMessage(false, "Fuel refill amount should be greater than 0.");

                var vehicle = await _context.Vehicles
                    .AsNoTracking()
                    .Include(v => v.WorkingSite)
                    .FirstOrDefaultAsync(v => v.VehicleId == fuelRefilDto.VehicleId, cancellationToken);
                // Validate related entities existence
                if (vehicle == null) return new FMSResponseMessage(false, $"Vehicle with ID {fuelRefilDto.VehicleId} does not exist.");

                var site = await _context.Sites.FindAsync(new object[] { fuelRefilDto.SiteId }, cancellationToken);
                if (site == null) return new FMSResponseMessage(false, $"Site with ID {fuelRefilDto.SiteId} does not exist.");

                var tank = await _context.Tanks.FindAsync(new object[] { fuelRefilDto.TankId }, cancellationToken);

                if (tank == null) return new FMSResponseMessage(false, $"Tank with ID {fuelRefilDto.TankId} does not exist.");

                // Check if the tank is using book keeping
                if (tank.UseBookKeeping == 1)
                {
                    // For current date entries, validate against tank's current stock
                    if (entryDate.Date == DateTime.UtcNow.Date)
                    {
                        if (tank.CurrentStock == null || tank.CurrentStock <= 0)
                            return new FMSResponseMessage(false, "The tank is empty. Please check if the opening stock has been set correctly.");

                        if (tank.CurrentStock < fuelRefilDto.ManualFuelrefillAmount)
                            return new FMSResponseMessage(false, $"Insufficient fuel in the tank. Current stock: {tank.CurrentStock}, Requested amount: {fuelRefilDto.ManualFuelrefillAmount}");
                    }

                    // TODO: Implement validation for past-date fuel refills
                    // For past date entries, we need to check available fuel BEFORE this transaction timestamp
                    // The validation should query TankVolumeHistory for the record immediately before this transaction
                    // and verify sufficient fuel was available at that point in time
                    // Currently commented out to allow historical entries without strict validation

                    //else if (entryDate.Date < DateTime.Now.Date)
                    //{
                    //    // Get the volume history record immediately BEFORE this transaction's timestamp
                    //    // This ensures we check the available fuel at the moment before this dispensing
                    //    var volumeHistoryBeforeTransaction = await _context.TankVolumeHistories
                    //        .Where(x => x.TankId == tank.Id &&
                    //               x.Timestamp < fuelRefilDto.Date.Value &&
                    //               (x.IsDeleted != true))
                    //        .OrderByDescending(x => x.Timestamp)
                    //        .ThenByDescending(x => x.Id)
                    //        .FirstOrDefaultAsync(cancellationToken);

                    //    if (volumeHistoryBeforeTransaction != null)
                    //    {
                    //        decimal availableFuelBeforeTransaction = volumeHistoryBeforeTransaction.NewVolume ?? 0;

                    //        if (availableFuelBeforeTransaction <= 0)
                    //        {
                    //            return new FMSResponseMessage(false,
                    //                $"The tank was empty before this transaction at {fuelRefilDto.Date.Value:g}. Cannot record fuel dispensing.");
                    //        }

                    //        if (availableFuelBeforeTransaction < fuelRefilDto.ManualFuelrefillAmount)
                    //        {
                    //            return new FMSResponseMessage(false,
                    //                $"Insufficient fuel in the tank before this transaction at {fuelRefilDto.Date.Value:g}. " +
                    //                $"Available: {availableFuelBeforeTransaction:F2}L, Requested: {fuelRefilDto.ManualFuelrefillAmount:F2}L");
                    //        }
                    //    }
                    //    else
                    //    {
                    //        // No history found before this transaction - check if there's an opening stock for the day
                    //        var openingStockForDay = await _context.TankVolumeHistories
                    //            .Where(x => x.TankId == tank.Id &&
                    //                   x.Timestamp.Date == entryDate.Date &&
                    //                   x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                    //                   (x.IsDeleted != true))
                    //            .OrderBy(x => x.Timestamp)
                    //            .FirstOrDefaultAsync(cancellationToken);

                    //        if (openingStockForDay == null)
                    //        {
                    //            return new FMSResponseMessage(false,
                    //                $"No volume history found before {fuelRefilDto.Date.Value:g}. Ensure opening stock exists for {entryDate.Date:d}.");
                    //        }
                    //    }
                    //}
                }
                var fuelByUser = await _context.Users.FindAsync(new object[] { fuelRefilDto.FuelBy }, cancellationToken);
                if (fuelByUser == null) return new FMSResponseMessage(false, $"User with ID {fuelRefilDto.FuelBy} does not exist.");

                if (fuelRefilDto.DriverId.HasValue)
                {
                    var driver = await _context.Employees.FindAsync(new object[] { fuelRefilDto.DriverId.Value }, cancellationToken);
                    if (driver == null) return new FMSResponseMessage(false, $"Driver with ID {fuelRefilDto.DriverId.Value} does not exist.");
                }

                if (fuelRefilDto.PumpTranscationId.HasValue)
                {
                    var pumpTransaction = await _context.Pumptransactions.FindAsync(new object[] { fuelRefilDto.PumpTranscationId.Value }, cancellationToken);
                    if (pumpTransaction == null) return new FMSResponseMessage(false, $"PumpTransaction with ID {fuelRefilDto.PumpTranscationId.Value} does not exist.");
                }

                // Validate meter readings
                if (fuelRefilDto.PreviousMeterReading.HasValue && fuelRefilDto.CurrentMeterReading.HasValue &&
                    fuelRefilDto.PreviousMeterReading >= fuelRefilDto.CurrentMeterReading)
                {
                    return new FMSResponseMessage(false, "Previous meter reading should be smaller than current meter reading.");
                }
                request.FuelRefilDTO.DateCreated = DateTime.UtcNow.ToString();
                request.FuelRefilDTO.DateModified = DateTime.UtcNow;
                var fuelRefil = _mapper.Map<Domain.Entities.FuelRefill>(fuelRefilDto);
                fuelRefil.IsModified = false ? (sbyte)1 : (sbyte)0;

                _context.FuelRefills.Add(fuelRefil);

                // We check if the tank is using book keeping and update the stock accordingly
                if (tank.UseBookKeeping == 1)
                {
                    // Check if the date of the fuel refill is today
                    var today = DateTime.UtcNow.Date;

                    if (entryDate.Date == today)
                    {
                        // Final check to prevent negative stock (defensive programming)
                        if (tank.CurrentStock == null || tank.CurrentStock - (decimal)fuelRefil.ManualFuelrefillAmount < 0)
                        {
                            return new FMSResponseMessage(false, "Operation would result in negative tank level. Cannot proceed.");
                        }

                        tank.CurrentStock -= (decimal)fuelRefil.ManualFuelrefillAmount;
                        tank.LastStockUpdate = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                // After saving the fuel refill, update tank volume history
                // Note: fuel refills decrease tank volume (negative volume change)
                // Calculate new physical stock value based on current operation
                decimal? newPhysicalStockValue = null;
                string? physicalStockSource = null;

                // For current day operations, calculate the new physical stock
                if (entryDate.Date == DateTime.Now.Date && tank.PhysicalStockValue.HasValue)
                {
                    newPhysicalStockValue = tank.PhysicalStockValue.Value - (decimal)fuelRefil.ManualFuelrefillAmount;
                    physicalStockSource = "FuelRefill";
                }

                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync(
                    tankId: tank.Id,
                    timestamp: fuelRefilDto.Date.Value,
                    volumeChange: -(decimal)fuelRefil.ManualFuelrefillAmount, // Negative because fuel is taken from the tank
                    refillId: fuelRefil.Id,
                    actionType: ActionType.Create, // This is a new refill
                    recordedBy: fuelRefil.FuelBy,
                    newPhysicalStockValue: newPhysicalStockValue, // Pass calculated physical stock
                    physicalStockSource: physicalStockSource, // Pass physical stock source
                    cancellationToken: cancellationToken);

                if (!volumeUpdateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    // We continue even if volume history update fails, but log the error
                }

                return new FMSResponseMessage<Domain.Entities.FuelRefill>(true, "Fuel refill created successfully.", fuelRefil);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating fuel refill");
                return new FMSResponseMessage(false, ex.Message);
            }
        }
    }
}