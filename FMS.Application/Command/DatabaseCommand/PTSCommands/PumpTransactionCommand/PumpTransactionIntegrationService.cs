using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand
{
    /// <summary>
    /// Service to handle integration between pump transactions and tank volume history
    /// This ensures automated PTS fueling transactions are properly recorded in the tank ledger
    /// </summary>
    public class PumpTransactionIntegrationService
    {
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly ISystemConfigurationService _systemConfigService;
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpTransactionIntegrationService> _logger;

        public PumpTransactionIntegrationService(
            TankVolumeHistoryIntegrationService tankVolumeHistoryService,
            ISystemConfigurationService systemConfigService,
            GpsdataContext context,
            ILogger<PumpTransactionIntegrationService> logger)
        {
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _systemConfigService = systemConfigService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Process a pump transaction to update tank volume history
        /// </summary>
        public async Task<FMSResponseMessage> ProcessPumpTransactionAsync(
            int tankId,
            int pumpTransactionId,
            DateTime timestamp,
            decimal volume,
            string recordedBy,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("[PumpTxIntegration] 🔄 Processing pump transaction - TankId: {TankId}, TransactionId: {TransactionId}, Volume: {Volume}L, Timestamp: {Timestamp}",
                    tankId, pumpTransactionId, volume, timestamp);

                if (tankId <= 0)
                {
                    _logger.LogWarning("[PumpTxIntegration] ❌ Invalid tank ID: {TankId} - Cannot create TankVolumeHistory", tankId);
                    return new FMSResponseMessage(false, "Invalid tank ID specified");
                }

                if (volume <= 0)
                {
                    _logger.LogWarning("[PumpTxIntegration] ❌ Invalid volume: {Volume} - Cannot create TankVolumeHistory (volume must be positive)", volume);
                    return new FMSResponseMessage(false, "Transaction volume must be positive");
                }

                // Get the tank to determine site ID
                var tank = await _context.Tanks.FindAsync(new object[] { tankId }, cancellationToken);
                if (tank == null)
                {
                    _logger.LogError("[PumpTxIntegration] ❌ Tank not found: {TankId} - Cannot create TankVolumeHistory", tankId);
                    return new FMSResponseMessage(false, $"Tank with ID {tankId} not found");
                }

                _logger.LogInformation("[PumpTxIntegration] ✅ Tank found: {TankName} (ID: {TankId}), CurrentStock: {CurrentStock}L, UseBookKeeping: {UseBookKeeping}",
                    tank.Name, tankId, tank.CurrentStock, tank.UseBookKeeping);

                // Check if we should create ledger entries based on configuration
                var shouldCreateLedger = await _systemConfigService.GetPtsAutoCreateLedgerEntriesAsync(cancellationToken);
                if (!shouldCreateLedger)
                {
                    _logger.LogInformation("[PumpTxIntegration] ⏭️ Skipping ledger entry creation for pump transaction {TransactionId} based on PTS.AutoCreateLedgerEntries=false configuration",
                        pumpTransactionId);
                    return new FMSResponseMessage(true, "Ledger entry creation skipped based on configuration");
                }

                // Calculate new physical stock value for the tank after dispensing
                // This ensures both CurrentStock AND PhysicalStockValue are updated together
                decimal? newPhysicalStockValue = null;
                var currentPhysicalStock = tank.PhysicalStockValue;
                if (currentPhysicalStock.HasValue && currentPhysicalStock > 0)
                {
                    // Deduct the dispensed volume from physical stock
                    newPhysicalStockValue = currentPhysicalStock.Value - volume;
                    // Ensure we don't go below zero for physical stock
                    if (newPhysicalStockValue < 0)
                    {
                        newPhysicalStockValue = 0;
                    }
                }

                _logger.LogInformation("[PumpTxIntegration] 📤 Calling TankVolumeHistoryService.ProcessChangeAsync - TankId: {TankId}, VolumeChange: -{Volume}L, Reason: AutomatedDispensing, ReferenceId: {ReferenceId}, CurrentPhysicalStock: {CurrentPhysical:N2}L -> NewPhysicalStock: {NewPhysical:N2}L",
                    tankId, volume, pumpTransactionId, currentPhysicalStock, newPhysicalStockValue);

                // Record in tank volume history with a negative volume change (fuel being dispensed)
                var result = await _tankVolumeHistoryService.ProcessChangeAsync(
                    tankId,
                    timestamp, -volume, // Negative because fuel is being dispensed from the tank
                    VolumeChangeReasonEnum.AutomatedDispensing,
                    recordedBy,
                    pumpTransactionId,
                    "PumpTransaction",
                    ActionType.Create,
                    newPhysicalStockValue, "PumpTransaction",
                    cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("[PumpTxIntegration] ✅ SUCCESS - Pump transaction {TransactionId} recorded in tank {TankId} volume history with volume -{Volume}L",
                        pumpTransactionId, tankId, volume);

                    // Update tank current volume if configured to do so from book keeping
                    if (await _systemConfigService.GetPtsUpdateTankVolumeFromBookKeepingAsync(cancellationToken))
                    {
                        // The UpdateTankVolumeHistoryCommand already updates the tank's current stock
                        // when UpdateTankCurrentStock is true (which it is by default)
                        _logger.LogDebug("Tank current volume will be updated from book keeping for tank {TankId}", tankId);
                    }

                    // ========== EARLY WARNING: Check if tank is becoming critically negative ==========
                    // Re-fetch tank to get updated CurrentStock after the transaction was recorded
                    await _context.Entry(tank).ReloadAsync(cancellationToken);
                    var newCurrentStock = tank.CurrentStock ?? 0;

                    const decimal WARNING_THRESHOLD = 0;      // Warn when stock goes below 0
                    const decimal CRITICAL_THRESHOLD = -1000; // Critical when stock goes below -1000L

                    if (newCurrentStock < CRITICAL_THRESHOLD)
                    {
                        _logger.LogError(
                            "[PumpTxIntegration] 🚨 CRITICAL NEGATIVE STOCK ALERT: Tank {TankId} ({TankName}) CurrentStock is now {CurrentStock:N0}L " +
                            "after transaction {TransactionId}. This indicates a data integrity issue requiring immediate reconciliation!",
                            tankId, tank.Name, newCurrentStock, pumpTransactionId);
                    }
                    else if (newCurrentStock < WARNING_THRESHOLD)
                    {
                        _logger.LogWarning(
                            "[PumpTxIntegration] ⚠️ NEGATIVE STOCK WARNING: Tank {TankId} ({TankName}) CurrentStock is now {CurrentStock:N0}L " +
                            "after transaction {TransactionId}. Stock is below zero - check if opening stock was recorded.",
                            tankId, tank.Name, newCurrentStock, pumpTransactionId);
                    }
                    // ========== END EARLY WARNING ==========
                }
                else
                {
                    _logger.LogError("[PumpTxIntegration] ❌ FAILED - Could not record pump transaction {TransactionId} in tank {TankId} volume history. Reason: {Message}. " +
                        "This transaction will NOT appear in the tank ledger! Check if the tank has sufficient stock or opening stock.",
                        pumpTransactionId, tankId, result.Message);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PumpTxIntegration] ❌ EXCEPTION processing pump transaction {TransactionId} for tank volume history", pumpTransactionId);
                return new FMSResponseMessage(false, $"Error processing transaction: {ex.Message}");
            }
        }

        /// <summary>
        /// Check if a transaction with the same vehicle and volume exists in both Pumptransactions and Fuelrefils
        /// This helps prevent double-counting when manual entries are made for automated transactions
        /// </summary>
        public async Task<bool> CheckForDuplicateManualEntryAsync(
            int? vehicleId,
            decimal volume,
            DateTime timestamp,
            int? siteId,
            IMediator mediator,
            CancellationToken cancellationToken = default)
        {
            if (!vehicleId.HasValue)
            {
                return false; // No vehicle ID to check
            }

            try
            {
                // Check if duplicate checking is enabled in configuration
                var checkForDuplicates = await _systemConfigService.GetPtsCheckForDuplicateManualEntriesAsync(cancellationToken);
                if (!checkForDuplicates)
                {
                    _logger.LogDebug("Duplicate checking disabled by configuration");
                    return false;
                }

                // Get the tolerance from configuration (not used in current query but available)
                var tolerance = await _systemConfigService.GetPtsDuplicateVolumeToleranceAsync(cancellationToken);

                // Check if a corresponding manual entry exists
                var query = new CheckDuplicateFuelRefillQuery(
                    vehicleId.Value,
                    volume,
                    timestamp.Date);

                var result = await mediator.Send(query, cancellationToken);
                return result.Success && result.Data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking for duplicate manual entry for vehicle {VehicleId}, volume {Volume}",
                    vehicleId, volume);
                return false; // Assume no duplicate if error
            }
        }
    }
}