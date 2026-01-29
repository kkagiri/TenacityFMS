//
// File: PumpTankTransferService.cs
// Purpose: Processes pump-based tank transfer completions from EOT packets
// Dependencies: TankVolumeHistoryIntegrationService, GpsdataContext, AutoMapper
// Last Modified: 2025-11-13
//
// IMPORTANT NOTES:
// - TankTransfer entity currently lacks: Reason, TransferType, and PumpTransactionId properties
// - These would be valuable for audit trail and should be added to the entity in future
// - Current implementation stores: SourceTankId, DestinationTankId, Amount, TransferDate, RecordedBy
//
// Key Differences from CreateTankTransfer.cs:
// - Triggered by EOT (End of Transaction) packet, not user form submission
// - Relaxed validation - trusts device-reported volume (physical reality)
// - No opening/closing stock requirements (real-time operation)
// - Processes BOTH tank updates (source OUT, destination IN)

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Services.TankStock
{
    public interface IPumpTankTransferService
    {
        /// <summary>
        /// Process pump-based tank transfer completion from EOT packet
        /// Similar to CreateTankTransfer.cs but adapted for pump operations
        /// </summary>
        Task<FMSResponse<TankTransferDTO>> ProcessPumpTransferAsync(JObject transferData);
    }

    public class PumpTankTransferService : IPumpTankTransferService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpTankTransferService> _logger;
        private readonly IMapper _mapper;
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

        public PumpTankTransferService(
            GpsdataContext context,
            ILogger<PumpTankTransferService> logger,
            IMapper mapper,
            TankVolumeHistoryIntegrationService tankVolumeHistoryService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _tankVolumeHistoryService = tankVolumeHistoryService;
        }

        public async Task<FMSResponse<TankTransferDTO>> ProcessPumpTransferAsync(JObject transferData)
        {
            try
            {
                _logger.LogInformation("[PumpTransfer] **PROCESSING PUMP TRANSFER** - Data: {TransferData}",
                    transferData.ToString());

                // Extract transfer data from EOT payload
                var sourceTankId = transferData.Value<int>("SourceTankId");
                var destinationTankId = transferData.Value<int>("DestinationTankId");
                var volume = transferData.Value<decimal>("Volume");
                var reason = transferData.Value<string>("Reason") ?? "Pump transfer";
                var userId = transferData.Value<string>("UserId") ?? "System";
                var transferDate = transferData.Value<DateTime?>("TransferDate") ?? DateTime.Now;
                var pumpTransactionId = transferData.Value<int?>("PumpTransactionId");

                _logger.LogInformation(
                    "[PumpTransfer] Processing pump transfer: Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L, User: {User}",
                    sourceTankId, destinationTankId, volume, userId);

                // **STEP 1: VALIDATE TANKS EXIST**
                var sourceTank = await _context.Tanks.FindAsync(sourceTankId);
                var destinationTank = await _context.Tanks.FindAsync(destinationTankId);

                if (sourceTank == null)
                {
                    _logger.LogError("[PumpTransfer] Source tank {TankId} not found", sourceTankId);
                    return FMSResponse<TankTransferDTO>.NotFound($"Source tank {sourceTankId} not found");
                }

                if (destinationTank == null)
                {
                    _logger.LogError("[PumpTransfer] Destination tank {TankId} not found", destinationTankId);
                    return FMSResponse<TankTransferDTO>.NotFound($"Destination tank {destinationTankId} not found");
                }

                // **STEP 2: VALIDATE VOLUME**
                if (volume <= 0)
                {
                    _logger.LogError("[PumpTransfer] Invalid volume: {Volume}", volume);
                    return FMSResponse<TankTransferDTO>.ValidationFailed(
                        new List<string> { "Transfer volume must be greater than 0" });
                }

                // **STEP 3: CHECK SOURCE TANK STOCK (WARNING ONLY)**
                // Unlike CreateTankTransfer.cs, we don't reject if insufficient stock
                // Pump transfer is physical reality - we record it and log discrepancy
                if (sourceTank.UseBookKeeping == 1)
                {
                    var currentStock = sourceTank.CurrentStock ?? 0;
                    if (currentStock < volume)
                    {
                        _logger.LogWarning(
                            "[PumpTransfer] **STOCK DISCREPANCY** - Source tank '{TankName}' has insufficient book stock. Current: {CurrentStock} L, Requested: {Volume} L. Recording transfer anyway (physical reality).",
                            sourceTank.Name, currentStock, volume);
                        // Continue processing - don't reject
                    }
                }

                // **STEP 4: CREATE TANK TRANSFER RECORD**
                // NOTE: TankTransfer entity currently lacks these properties (should be added in future):
                //   - Reason: to store 'reason' variable
                //   - TransferType: to differentiate "InterTank" vs "CrossSite"
                //   - PumpTransactionId: to link back to pump transaction (pumpTransactionId variable)
                // These would improve audit trail and reporting capabilities
                var tankTransfer = new TankTransfer
                {
                    SourceTankId = sourceTankId,
                    DestinationTankId = destinationTankId,
                    Amount = volume,
                    TransferDate = transferDate,
                    RecordedBy = userId,
                    CreatedOn = DateTime.Now
                };

                _context.TankTransfers.Add(tankTransfer);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "[PumpTransfer] Created TankTransfer record: ID {TransferId}, {Volume} L from {SourceTank} to {DestTank}",
                    tankTransfer.Id, volume, sourceTank.Name, destinationTank.Name);

                // **STEP 5: UPDATE SOURCE TANK VOLUME HISTORY (TRANSFER OUT)**
                // The source tank loses fuel - recorded as TransferOut (negative volume change)
                decimal? sourcePhysicalStockValue = null;
                if (sourceTank.PhysicalStockValue.HasValue)
                {
                    sourcePhysicalStockValue = sourceTank.PhysicalStockValue.Value - volume;
                    if (sourcePhysicalStockValue < 0)
                    {
                        _logger.LogWarning(
                            "[PumpTransfer] **WARNING** - Source tank '{TankName}' physical stock will go negative after transfer. Current: {Current} L, Transfer: {Volume} L, Resulting: {Result} L",
                            sourceTank.Name, sourceTank.PhysicalStockValue.Value, volume, sourcePhysicalStockValue);
                    }
                }

                _logger.LogInformation(
                    "[PumpTransfer] **UPDATING SOURCE TANK VOLUME HISTORY** - Tank '{TankName}' (ID: {TankId}), TransferOut: -{Volume} L, NewPhysicalStock: {PhysicalStock} L",
                    sourceTank.Name, sourceTank.Id, volume, sourcePhysicalStockValue ?? 0);

                var sourceVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferOutChangeAsync(
                    sourceTankId: sourceTank.Id,
                    timestamp: transferDate,
                    volumeChange: volume, // Service will make it negative
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: userId,
                    newPhysicalStockValue: sourcePhysicalStockValue,
                    physicalStockSource: "PumpTransfer");

                if (!sourceVolumeResult.Success)
                {
                    _logger.LogError(
                        "[PumpTransfer] **CRITICAL ERROR** - Failed to update source tank volume history. Tank {TankId} ({TankName}): {Message}",
                        sourceTank.Id, sourceTank.Name, sourceVolumeResult.Message);

                    return FMSResponse<TankTransferDTO>.Failed(
                        $"Failed to record transfer OUT for source tank '{sourceTank.Name}': {sourceVolumeResult.Message}");
                }

                // Update source tank current stock after successful volume history update
                var newSourceStock = (sourceTank.CurrentStock ?? 0) - volume;
                sourceTank.CurrentStock = newSourceStock;
                sourceTank.PhysicalStockValue = sourcePhysicalStockValue;
                sourceTank.LastStockUpdate = DateTime.Now;

                _logger.LogInformation(
                    "[PumpTransfer] ✅ **SOURCE TANK UPDATED** - Tank '{TankName}' (ID: {TankId}): BookStock {OldStock} L -> {NewStock} L, PhysicalStock: {PhysicalStock} L",
                    sourceTank.Name, sourceTank.Id, (sourceTank.CurrentStock ?? 0) + volume, newSourceStock, sourcePhysicalStockValue ?? 0);

                // **STEP 6: UPDATE DESTINATION TANK VOLUME HISTORY (TRANSFER IN)**
                // The destination tank gains fuel - recorded as TransferIn (positive volume change)
                decimal? destinationPhysicalStockValue = null;
                if (destinationTank.PhysicalStockValue.HasValue)
                {
                    destinationPhysicalStockValue = destinationTank.PhysicalStockValue.Value + volume;
                }

                _logger.LogInformation(
                    "[PumpTransfer] **UPDATING DESTINATION TANK VOLUME HISTORY** - Tank '{TankName}' (ID: {TankId}), TransferIn: +{Volume} L, NewPhysicalStock: {PhysicalStock} L",
                    destinationTank.Name, destinationTank.Id, volume, destinationPhysicalStockValue ?? 0);

                var destinationVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferInChangeAsync(
                    destinationTankId: destinationTank.Id,
                    timestamp: transferDate,
                    volumeChange: volume, // Positive amount
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: userId,
                    newPhysicalStockValue: destinationPhysicalStockValue,
                    physicalStockSource: "PumpTransfer");

                if (!destinationVolumeResult.Success)
                {
                    _logger.LogError(
                        "[PumpTransfer] **CRITICAL ERROR** - Failed to update destination tank volume history. Tank {TankId} ({TankName}): {Message}",
                        destinationTank.Id, destinationTank.Name, destinationVolumeResult.Message);

                    return FMSResponse<TankTransferDTO>.Failed(
                        $"Failed to record transfer IN for destination tank '{destinationTank.Name}': {destinationVolumeResult.Message}");
                }

                // Update destination tank current stock after successful volume history update
                var newDestStock = (destinationTank.CurrentStock ?? 0) + volume;
                destinationTank.CurrentStock = newDestStock;
                destinationTank.PhysicalStockValue = destinationPhysicalStockValue;
                destinationTank.LastStockUpdate = DateTime.Now;

                _logger.LogInformation(
                    "[PumpTransfer] ✅ **DESTINATION TANK UPDATED** - Tank '{TankName}' (ID: {TankId}): BookStock {OldStock} L -> {NewStock} L, PhysicalStock: {PhysicalStock} L",
                    destinationTank.Name, destinationTank.Id, (destinationTank.CurrentStock ?? 0) - volume, newDestStock, destinationPhysicalStockValue ?? 0);

                // **STEP 7: SAVE ALL CHANGES**
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "[PumpTransfer] **TRANSFER COMPLETE** - {Volume} L transferred from {SourceTank} to {DestTank}",
                    volume, sourceTank.Name, destinationTank.Name);

                // Map to DTO for response
                var transferDTO = _mapper.Map<TankTransferDTO>(tankTransfer);

                return FMSResponse<TankTransferDTO>.Success(
                    transferDTO,
                    $"Pump transfer completed: {volume} L from {sourceTank.Name} to {destinationTank.Name}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PumpTransfer] **ERROR** - Failed to process pump transfer");
                return FMSResponse<TankTransferDTO>.Failed(
                    $"Error processing pump transfer: {ex.Message}");
            }
        }
    }
}
