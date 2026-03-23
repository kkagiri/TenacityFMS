/**
 * File: CreateFuelRrefillCommand.cs
 * Purpose: Creates a manual fuel refill, validates tank chronology and stock,
 *          updates tank volume history, and runs post-save vehicle alert checks.
 * Dependencies: GpsdataContext, TankVolumeHistoryIntegrationService,
 *               TankStockFutureRecordsService, ExpectedFuelAverageAlertService
 * Last Modified: 2026-03-23
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.ExpectedFuelAverage.Services;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Features.Vehicle.Services;
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
        private readonly IVehicleSiteAutoAssignmentService? _siteAutoAssignmentService;
        private readonly IVehicleGpsOfflineAlertService? _gpsOfflineAlertService;
        private readonly IGPSGateDriverNameService? _driverNameService;
        private readonly IExpectedFuelAverageAlertService _expectedFuelAverageAlertService;

        public CreateFuelRrefillCommandCommandHandler(
            GpsdataContext context,
            ILogger<CreateFuelRrefillCommandCommandHandler> logger,
            IMapper mapper,
            TankVolumeHistoryIntegrationService tankVolumeHistoryService,
            TankStockFutureRecordsService futureRecordsService,
            IExpectedFuelAverageAlertService expectedFuelAverageAlertService,
            IVehicleSiteAutoAssignmentService? siteAutoAssignmentService = null,
            IVehicleGpsOfflineAlertService? gpsOfflineAlertService = null,
            IGPSGateDriverNameService? driverNameService = null)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _expectedFuelAverageAlertService = expectedFuelAverageAlertService;
            _siteAutoAssignmentService = siteAutoAssignmentService;
            _gpsOfflineAlertService = gpsOfflineAlertService;
            _driverNameService = driverNameService;
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
                // CRITICAL: Include IsDeleted filter and secondary sort for deterministic ordering
                var existingOpeningStock = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.FuelRefilDTO.TankId &&
                        x.Timestamp.Date == entryDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                        (x.IsDeleted != true))
                    .OrderByDescending(x => x.Timestamp)
                    .ThenByDescending(x => x.Id)  // Secondary sort for deterministic ordering
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
                // CRITICAL: Include IsDeleted filter and secondary sort for deterministic ordering
                var closingStockForDay = await _context.TankVolumeHistories
                    .Where(x => x.TankId == request.FuelRefilDTO.TankId &&
                        x.Timestamp.Date == entryDate.Date &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                        (x.IsDeleted != true))
                    .OrderByDescending(x => x.Timestamp)
                    .ThenByDescending(x => x.Id)  // Secondary sort for deterministic ordering
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
                        f.ManualFuelrefillAmount == fuelRefilDto.ManualFuelrefillAmount &&
                        (f.IsDeleted != true),
                        cancellationToken);

                if (existingRefuel != null) return new FMSResponseMessage(false, $"Duplicate entry: A fuel refill for vehicle already exists on {fuelRefilDto.Date.Value.Date:yyyy-MM-dd} with the same volume ({fuelRefilDto.ManualFuelrefillAmount}L). Please check the existing entry or use a different volume.");

                // NEW VALIDATION: Check for existing AUTOMATED pump transaction for the same vehicle
                // This prevents double-counting when an automated PTS transaction has already recorded this fueling
                // Uses a 1% volume tolerance to account for minor discrepancies between systems
                const decimal VOLUME_TOLERANCE = 0.01m; // 1% tolerance for volume comparison
                var requestedVolume = (decimal)fuelRefilDto.ManualFuelrefillAmount;

                var existingPumpTransaction = await _context.Pumptransactions
                    .FirstOrDefaultAsync(pt =>
                        pt.VehicleId == fuelRefilDto.VehicleId &&
                        pt.DateTime.Date == fuelRefilDto.Date.Value.Date &&
                        pt.Volume.HasValue &&
                        Math.Abs(pt.Volume.Value - requestedVolume) / requestedVolume <= VOLUME_TOLERANCE,
                        cancellationToken);

                if (existingPumpTransaction != null)
                {
                    _logger.LogWarning(
                        "Blocked duplicate manual fuel refill: Automated pump transaction already exists. " +
                        "Vehicle {VehicleId}, Date {Date}, PTS Volume: {PtsVolume}L, Requested Volume: {RequestedVolume}L, " +
                        "Transaction ID: {TransactionId}, PTS: {PtsId}",
                        fuelRefilDto.VehicleId, fuelRefilDto.Date.Value.Date,
                        existingPumpTransaction.Volume, fuelRefilDto.ManualFuelrefillAmount,
                        existingPumpTransaction.Transaction, existingPumpTransaction.PtsId);

                    return new FMSResponseMessage(false,
                        $"⚠️ DUPLICATE PREVENTED: An automated pump transaction already exists for this vehicle on {fuelRefilDto.Date.Value.Date:yyyy-MM-dd} " +
                        $"with volume {existingPumpTransaction.Volume:F2}L (PTS Transaction ID: {existingPumpTransaction.Transaction}). " +
                        "This fueling was already recorded by the PTS system automatically. Manual entry is not required.");
                }

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
                    // For current date entries, validate against tank's PHYSICAL stock (actual measured value)
                    // PhysicalStockValue = what we "actually" have (real-time physical measurement)
                    // CurrentStock = what we "should" have (book/ledger value for accounting)
                    if (entryDate.Date == DateTime.UtcNow.Date)
                    {
                        if (tank.PhysicalStockValue == null || tank.PhysicalStockValue <= 0)
                            return new FMSResponseMessage(false, "The tank is empty. Please check if the opening stock has been set correctly.");

                        if (tank.PhysicalStockValue < fuelRefilDto.ManualFuelrefillAmount)
                            return new FMSResponseMessage(false, $"Insufficient fuel in the tank. Physical stock: {tank.PhysicalStockValue:F2}L, Requested amount: {fuelRefilDto.ManualFuelrefillAmount}L");
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

                // We check if the tank is using book keeping and validate stock accordingly
                if (tank.UseBookKeeping == 1)
                {
                    // Check if the date of the fuel refill is today
                    var today = DateTime.UtcNow.Date;

                    if (entryDate.Date == today)
                    {
                        // Final check to prevent negative physical stock (defensive programming)
                        // Use PhysicalStockValue for real-time validation (what we "actually" have)
                        if (tank.PhysicalStockValue == null || tank.PhysicalStockValue - (decimal)fuelRefil.ManualFuelrefillAmount < 0)
                        {
                            return new FMSResponseMessage(false, "Operation would result in negative tank level. Cannot proceed.");
                        }

                        // NOTE: Do NOT update CurrentStock here.
                        // ProcessTankStockChangeCommand handles the CurrentStock and PhysicalStockValue updates
                        // when processing the TankVolumeHistory record. Updating here would cause a DOUBLE DEDUCTION
                        // because both handlers share the same scoped DbContext (same tracked entity).
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                // After saving the fuel refill, update tank volume history
                // Note: fuel refills decrease tank volume (negative volume change)
                // Calculate new physical stock value based on current operation
                decimal? newPhysicalStockValue = null;
                string? physicalStockSource = null;

                // For current day operations, calculate the new physical stock
                // FIXED: Use DateTime.UtcNow for consistency with other date comparisons
                if (entryDate.Date == DateTime.UtcNow.Date && tank.PhysicalStockValue.HasValue)
                {
                    newPhysicalStockValue = tank.PhysicalStockValue.Value - (decimal)fuelRefil.ManualFuelrefillAmount;

                    // CRITICAL VALIDATION: Prevent negative stock
                    if (newPhysicalStockValue < 0)
                    {
                        // Rollback the saved fuel refill since we detected insufficient stock
                        _context.FuelRefills.Remove(fuelRefil);
                        await _context.SaveChangesAsync(cancellationToken);

                        return new FMSResponseMessage(false,
                            $"Fuel refill would result in negative tank stock. " +
                            $"Current physical stock: {tank.PhysicalStockValue.Value:F2}L, Refill amount: {fuelRefil.ManualFuelrefillAmount:F2}L. " +
                            "Please verify the refill amount or check tank stock levels.");
                    }
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
                    _logger.LogError("Failed to update tank volume history for fuel refill {RefillId}: {Message}",
                        fuelRefil.Id, volumeUpdateResult.Message);

                    // CRITICAL FIX: Roll back the fuel refill to maintain data consistency.
                    // Without this, the FuelRefills table has an entry but TankVolumeHistory does not,
                    // causing stock calculation discrepancies.
                    _context.FuelRefills.Remove(fuelRefil);
                    await _context.SaveChangesAsync(cancellationToken);

                    return new FMSResponseMessage(false,
                        $"Failed to create fuel refill: Could not update tank volume history. {volumeUpdateResult.Message}");
                }

                // Check if vehicle should be auto-assigned to a different site based on refueling pattern
                await CheckVehicleSiteAutoAssignmentAsync(fuelRefilDto.VehicleId, cancellationToken);

                // Check if vehicle GPS is offline and create alert if needed
                await CheckVehicleGpsOfflineAsync(fuelRefilDto.VehicleId, fuelRefilDto.SiteId,
                    (decimal?)fuelRefilDto.ManualFuelrefillAmount, fuelByUser?.UserName, cancellationToken);

                // Update GPSGate DriverName custom field if driver is specified and entry is within 5 days
                await UpdateGpsGateDriverNameAsync(fuelRefilDto.VehicleId, fuelRefilDto.DriverId, entryDate, cancellationToken);

                // Check whether this refill breached the vehicle's configured expected fuel average.
                await _expectedFuelAverageAlertService.CheckManualFuelRefillAsync(
                    fuelRefil,
                    fuelByUser?.UserName,
                    cancellationToken);

                // Map to DTO to avoid serializing navigation properties (which causes massive response size)
                var resultDto = _mapper.Map<FuelRefilDTO>(fuelRefil);
                return new FMSResponseMessage<FuelRefilDTO>(true, "Fuel refill created successfully.", resultDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating fuel refill");
                return new FMSResponseMessage(false, ex.Message);
            }
        }

        /// <summary>
        /// Checks if the vehicle should be auto-assigned to a different site based on refueling patterns.
        /// If vehicle has refueled 3 consecutive times at a site different from its assigned site,
        /// it will be automatically reassigned and its GPSGate tag updated.
        /// </summary>
        private async Task CheckVehicleSiteAutoAssignmentAsync(int vehicleId, CancellationToken cancellationToken)
        {
            if (_siteAutoAssignmentService == null)
            {
                return;
            }

            try
            {
                var result = await _siteAutoAssignmentService.CheckAndUpdateVehicleSiteAsync(vehicleId, cancellationToken);

                if (result.SiteChanged)
                {
                    _logger.LogInformation(
                        "Vehicle {VehicleId} auto-assigned from site {FromSite} to site {ToSite} based on refueling pattern. GPSGate tag updated: {TagUpdated}",
                        vehicleId, result.PreviousSiteName, result.NewSiteName, result.GpsGateTagUpdated);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the refill operation
                _logger.LogWarning(ex, "Failed to check vehicle site auto-assignment for vehicle {VehicleId}", vehicleId);
            }
        }

        /// <summary>
        /// Checks if the vehicle has GPS tracking and if the GPS is offline or stale.
        /// If so, creates an alert/notification to inform operators.
        /// </summary>
        private async Task CheckVehicleGpsOfflineAsync(int vehicleId, int? siteId, decimal? fuelAmount, string? triggeredBy, CancellationToken cancellationToken)
        {
            if (_gpsOfflineAlertService == null)
            {
                return;
            }

            try
            {
                var result = await _gpsOfflineAlertService.CheckAndAlertIfGpsOfflineAsync(
                    vehicleId, siteId, fuelAmount, triggeredBy, cancellationToken);

                if (result.AlertCreated)
                {
                    _logger.LogWarning(
                        "GPS offline alert created for vehicle {VehicleId}: {Message}",
                        vehicleId, result.Message);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the refill operation
                _logger.LogWarning(ex, "Failed to check vehicle GPS offline status for vehicle {VehicleId}", vehicleId);
            }
        }

        /// <summary>
        /// Updates the GPSGate DriverName custom field if:
        /// - A driver is specified (DriverId has value)
        /// - The entry date is today or within the last 5 days
        /// This allows operators to see who was the last driver to fuel a vehicle in GPSGate.
        /// </summary>
        private async Task UpdateGpsGateDriverNameAsync(int vehicleId, int? driverId, DateTime entryDate, CancellationToken cancellationToken)
        {
            if (_driverNameService == null)
            {
                return;
            }

            // Only update if driver is specified
            if (!driverId.HasValue)
            {
                _logger.LogDebug("No driver specified for fuel refill, skipping GPSGate DriverName update for vehicle {VehicleId}", vehicleId);
                return;
            }

            // Only update for entries within the last 5 days (including today)
            var daysDifference = (DateTime.UtcNow.Date - entryDate.Date).TotalDays;
            if (daysDifference < 0 || daysDifference > 5)
            {
                _logger.LogDebug(
                    "Fuel refill entry date {EntryDate} is outside 5-day window, skipping GPSGate DriverName update for vehicle {VehicleId}",
                    entryDate.Date, vehicleId);
                return;
            }

            try
            {
                var result = await _driverNameService.UpdateDriverNameAsync(vehicleId, driverId.Value, cancellationToken);

                if (result.IsSuccess)
                {
                    _logger.LogInformation(
                        "Updated GPSGate DriverName for vehicle {VehicleId} with driver {DriverId}: {Message}",
                        vehicleId, driverId.Value, result.Message);
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to update GPSGate DriverName for vehicle {VehicleId} with driver {DriverId}: {Message}",
                        vehicleId, driverId.Value, result.Message);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the refill operation - this is a non-critical enhancement
                _logger.LogWarning(ex,
                    "Error updating GPSGate DriverName for vehicle {VehicleId} with driver {DriverId}",
                    vehicleId, driverId.Value);
            }
        }
    }
}