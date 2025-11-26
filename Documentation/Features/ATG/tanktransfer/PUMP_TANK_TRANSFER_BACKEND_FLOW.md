# Pump-Based Tank Transfer - Backend Implementation
**Date**: November 13, 2025
**Purpose**: Handle EOT (End of Transaction) for pump tank transfers with dual-tank stock updates

---

## 🎯 Overview

When a pump completes a tank transfer operation (not vehicle fueling), the backend must:
1. Detect `IsTransferMode: true` flag in Redis context
2. Create `TankTransfer` record (NOT `Pumptransaction`)
3. Update **BOTH** source and destination tank stocks
4. Create `TankVolumeHistory` records for **BOTH** tanks
5. Update physical stock values for **BOTH** tanks

**Key Difference**: Vehicle fueling only updates ONE tank (source). Tank transfer updates TWO tanks.

---

## 📊 Comparison: Vehicle Fueling vs Tank Transfer

### Vehicle Fueling (Current)

```csharp
// UploadStatusCommand.cs - Line ~680
var contextJson = await redis.StringGetAsync(contextKey);
if (contextJson.HasValue)
{
    var context = JsonSerializer.Deserialize<JsonObject>(contextJson!);

    var statusData = new JObject
    {
        ["VehicleId"] = context.Value<int>("VehicleId"),
        ["TankId"] = context.Value<int>("TankId"),      // Only ONE tank
        ["Tag"] = context.Value<string>("Tag"),
        ["Volume"] = volume,
        ["Amount"] = amount,
        // ... other fields
    };

    // Process vehicle transaction
    await _autoCompletionService.ProcessEndOfTransactionAsync(
        deviceId, pumpId, detectedTransactionId.Value, statusData
    );

    // Result:
    // 1. Creates Pumptransaction with VehicleId
    // 2. Updates ONLY TankId (fuel dispensed OUT)
    // 3. ONE TankVolumeHistory record (Dispensed)
}
```

### Tank Transfer (NEW)

```csharp
// UploadStatusCommand.cs - Line ~680 (MODIFIED)
var contextJson = await redis.StringGetAsync(contextKey);
if (contextJson.HasValue)
{
    var context = JsonSerializer.Deserialize<JsonObject>(contextJson!);

    // **CHECK: Is this a tank transfer?**
    var isTransferMode = context.Value<bool>("IsTransferMode");

    if (isTransferMode)
    {
        // TANK TRANSFER PATH
        var transferData = new JObject
        {
            ["SourceTankId"] = context.Value<int>("SourceTankId"),
            ["DestinationTankId"] = context.Value<int>("DestinationTankId"),
            ["Volume"] = volume,
            ["Amount"] = amount,
            ["Pump"] = pumpId,
            ["Transaction"] = detectedTransactionId.Value,
            ["DateTime"] = context.Value<DateTime>("InitiatedAt"),
            ["Reason"] = context.Value<string>("Reason") ?? "Pump transfer",
            ["RecordedBy"] = context.Value<string>("UserId") ?? "System",
            ["VehicleId"] = (int?)null,  // Explicitly NULL
            ["Tag"] = (string?)null       // Explicitly NULL
        };

        _logger.LogInformation(
            "[AutoComplete] **TANK TRANSFER MODE** - Processing transfer from Tank {SourceTank} to Tank {DestTank}, Volume: {Volume} L, Transaction: {TxId}",
            transferData.Value<int>("SourceTankId"),
            transferData.Value<int>("DestinationTankId"),
            volume,
            detectedTransactionId
        );

        // Process tank transfer (similar to CreateTankTransfer.cs)
        await _pumpTankTransferService.ProcessPumpTransferAsync(transferData);

        // Result:
        // 1. Creates TankTransfer record (NOT Pumptransaction)
        // 2. Updates SourceTankId (fuel OUT)
        // 3. Updates DestinationTankId (fuel IN)
        // 4. TWO TankVolumeHistory records (TransferOut + TransferIn)
        // 5. Updates PhysicalStockValue for BOTH tanks

        await redis.KeyDeleteAsync(contextKey);
    }
    else
    {
        // VEHICLE FUELING PATH (existing logic)
        var statusData = new JObject { /* ... */ };
        await _autoCompletionService.ProcessEndOfTransactionAsync(...);
    }
}
```

---

## 🏗️ New Service: PumpTankTransferService

### Interface

```csharp
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
}
```

### Implementation

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankTransfer;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Services.TankStock
{
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
                // Extract data from JObject
                var sourceTankId = transferData.Value<int>("SourceTankId");
                var destinationTankId = transferData.Value<int>("DestinationTankId");
                var volume = transferData.Value<decimal>("Volume");
                var transferDate = transferData.Value<DateTime?>("DateTime") ?? DateTime.UtcNow;
                var reason = transferData.Value<string>("Reason") ?? "Pump transfer";
                var recordedBy = transferData.Value<string>("RecordedBy") ?? "System";
                var pumpTransactionId = transferData.Value<int?>("Transaction");

                _logger.LogInformation(
                    "[PumpTransfer] Processing pump transfer: Source {SourceTank} -> Dest {DestTank}, Volume: {Volume} L",
                    sourceTankId, destinationTankId, volume
                );

                // Validate tanks exist
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

                // Validate volume
                if (volume <= 0)
                {
                    _logger.LogWarning("[PumpTransfer] Invalid volume: {Volume}", volume);
                    return FMSResponse<TankTransferDTO>.ValidationFailed("Transfer volume must be greater than zero");
                }

                // **CRITICAL**: For pump transfers, we skip opening stock validation
                // because the transfer happens in real-time via physical pump
                // Unlike manual web entries, we trust the device-reported volume

                // **SIMPLIFIED VALIDATION**: Check current stock only (for current day)
                if (transferDate.Date == DateTime.UtcNow.Date)
                {
                    if (sourceTank.UseBookKeeping == 1 && sourceTank.CurrentStock < volume)
                    {
                        _logger.LogWarning(
                            "[PumpTransfer] Insufficient stock in source tank {TankName}. Current: {Current} L, Requested: {Requested} L",
                            sourceTank.Name, sourceTank.CurrentStock, volume
                        );

                        // WARNING: Allow but log discrepancy (pump physically transferred fuel)
                        _logger.LogWarning(
                            "[PumpTransfer] **STOCK DISCREPANCY DETECTED** - Pump transferred {Volume} L but book stock only shows {Stock} L. Proceeding with actual transfer.",
                            volume, sourceTank.CurrentStock
                        );
                    }
                }

                // Create TankTransfer record
                var tankTransfer = new TankTransfer
                {
                    SourceTankId = sourceTankId,
                    DestinationTankId = destinationTankId,
                    Amount = volume,
                    TransferDate = transferDate,
                    Reason = reason,
                    TransferType = "InterTank", // Same site (pump-based transfers are always same site)
                    RecordedBy = recordedBy,
                    CreatedAt = DateTime.UtcNow,
                    // Link to pump transaction for audit trail
                    PumpTransactionId = pumpTransactionId
                };

                _context.TankTransfers.Add(tankTransfer);
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "[PumpTransfer] Created TankTransfer record: ID {TransferId}, {Volume} L from {SourceTank} to {DestTank}",
                    tankTransfer.Id, volume, sourceTank.Name, destinationTank.Name
                );

                // Calculate physical stock values (for current day only)
                decimal? sourcePhysicalStockValue = null;
                decimal? destinationPhysicalStockValue = null;
                string? physicalStockSource = null;

                if (transferDate.Date == DateTime.UtcNow.Date)
                {
                    // Update source tank physical stock (decrease)
                    if (sourceTank.PhysicalStockValue.HasValue)
                    {
                        sourcePhysicalStockValue = sourceTank.PhysicalStockValue.Value - volume;
                    }

                    // Update destination tank physical stock (increase)
                    if (destinationTank.PhysicalStockValue.HasValue)
                    {
                        destinationPhysicalStockValue = destinationTank.PhysicalStockValue.Value + volume;
                    }

                    physicalStockSource = "PumpTransfer";
                }

                // **STEP 1**: Process source tank volume change (TransferOut)
                _logger.LogInformation(
                    "[PumpTransfer] Updating source tank {TankName} volume history (TransferOut: -{Volume} L)",
                    sourceTank.Name, volume
                );

                var sourceVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferOutChangeAsync(
                    sourceTankId: sourceTank.Id,
                    timestamp: transferDate,
                    volumeChange: volume, // Service will make it negative
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: recordedBy,
                    newPhysicalStockValue: sourcePhysicalStockValue,
                    physicalStockSource: physicalStockSource,
                    cancellationToken: default
                );

                if (!sourceVolumeResult.Success)
                {
                    _logger.LogError(
                        "[PumpTransfer] Failed to update source tank volume history: {Message}",
                        sourceVolumeResult.Message
                    );
                    // Continue anyway - transfer physically happened
                }
                else
                {
                    _logger.LogInformation(
                        "[PumpTransfer] Source tank {TankName} updated: Old stock {OldStock} L -> New stock {NewStock} L",
                        sourceTank.Name,
                        sourceVolumeResult.PreviousVolume,
                        sourceVolumeResult.NewVolume
                    );
                }

                // **STEP 2**: Process destination tank volume change (TransferIn)
                _logger.LogInformation(
                    "[PumpTransfer] Updating destination tank {TankName} volume history (TransferIn: +{Volume} L)",
                    destinationTank.Name, volume
                );

                var destinationVolumeResult = await _tankVolumeHistoryService.ProcessTankTransferInChangeAsync(
                    destinationTankId: destinationTank.Id,
                    timestamp: transferDate,
                    volumeChange: volume, // Positive amount
                    transferId: tankTransfer.Id,
                    actionType: ActionType.Create,
                    recordedBy: recordedBy,
                    newPhysicalStockValue: destinationPhysicalStockValue,
                    physicalStockSource: physicalStockSource,
                    cancellationToken: default
                );

                if (!destinationVolumeResult.Success)
                {
                    _logger.LogError(
                        "[PumpTransfer] Failed to update destination tank volume history: {Message}",
                        destinationVolumeResult.Message
                    );
                    // Continue anyway - transfer physically happened
                }
                else
                {
                    _logger.LogInformation(
                        "[PumpTransfer] Destination tank {TankName} updated: Old stock {OldStock} L -> New stock {NewStock} L",
                        destinationTank.Name,
                        destinationVolumeResult.PreviousVolume,
                        destinationVolumeResult.NewVolume
                    );
                }

                // Map to DTO for response
                var transferDTO = _mapper.Map<TankTransferDTO>(tankTransfer);

                _logger.LogInformation(
                    "[PumpTransfer] **TRANSFER COMPLETE** - {Volume} L transferred from {SourceTank} to {DestTank}",
                    volume, sourceTank.Name, destinationTank.Name
                );

                return FMSResponse<TankTransferDTO>.Success(
                    transferDTO,
                    $"Pump transfer completed: {volume:F2} L from {sourceTank.Name} to {destinationTank.Name}"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[PumpTransfer] Error processing pump tank transfer");
                return FMSResponse<TankTransferDTO>.SystemError(
                    "An error occurred while processing the pump transfer"
                );
            }
        }
    }
}
```

---

## 🔄 UploadStatusCommand.cs Modification

### Current Code (Line ~680)

```csharp
var contextJson = await redis.StringGetAsync(contextKey);
if (contextJson.HasValue)
{
    var context = JsonSerializer.Deserialize<JsonObject>(contextJson!);

    var statusData = new JObject
    {
        ["VehicleId"] = context.Value<int>("VehicleId"),
        ["TankId"] = context.Value<int>("TankId"),
        // ... existing vehicle fueling logic
    };

    await _autoCompletionService.ProcessEndOfTransactionAsync(
        deviceId, pumpId, detectedTransactionId.Value, statusData
    );
}
```

### Modified Code (with Tank Transfer Support)

```csharp
var contextJson = await redis.StringGetAsync(contextKey);
if (contextJson.HasValue)
{
    var context = JsonSerializer.Deserialize<JsonObject>(contextJson!);

    // **NEW: Check operation mode**
    var isTransferMode = context.Value<bool>("IsTransferMode");

    if (isTransferMode)
    {
        // ============================================
        // TANK TRANSFER PATH (NEW)
        // ============================================
        var transferData = new JObject
        {
            ["SourceTankId"] = context.Value<int>("SourceTankId"),
            ["DestinationTankId"] = context.Value<int>("DestinationTankId"),
            ["Volume"] = volume,
            ["Amount"] = amount,
            ["Pump"] = pumpId,
            ["Transaction"] = detectedTransactionId.Value,
            ["DateTime"] = context.Value<DateTime?>("InitiatedAt") ?? DateTime.UtcNow,
            ["Reason"] = context.Value<string>("Reason") ?? "Pump transfer",
            ["RecordedBy"] = context.Value<string>("UserId") ?? "System",
            ["VehicleId"] = (int?)null,  // NULL for transfers
            ["Tag"] = (string?)null       // NULL for transfers
        };

        _logger.LogInformation(
            "[AutoComplete] **TANK TRANSFER MODE** - Device {DeviceId}, Pump {PumpId}, Transaction {TxId}, Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L",
            deviceId,
            pumpId,
            detectedTransactionId,
            transferData.Value<int>("SourceTankId"),
            transferData.Value<int>("DestinationTankId"),
            volume
        );

        // Process pump tank transfer
        _ = Task.Run(async () =>
        {
            try
            {
                var result = await _pumpTankTransferService.ProcessPumpTransferAsync(transferData);

                if (result.IsSuccess)
                {
                    _logger.LogInformation(
                        "[AutoComplete] Pump transfer completed successfully: {Message}",
                        result.Message
                    );
                }
                else
                {
                    _logger.LogError(
                        "[AutoComplete] Pump transfer failed: {Message}",
                        result.Message
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[AutoComplete] Error processing pump tank transfer {DeviceId}:{Transaction}",
                    deviceId, detectedTransactionId
                );
            }
        });

        // Clean up Redis context
        await redis.KeyDeleteAsync(contextKey);
    }
    else
    {
        // ============================================
        // VEHICLE FUELING PATH (EXISTING)
        // ============================================
        var statusData = new JObject
        {
            ["VehicleId"] = context.Value<int>("VehicleId"),
            ["TankId"] = context.Value<int>("TankId"),
            ["Tag"] = context.Value<string>("Tag"),
            ["Volume"] = volume,
            ["Amount"] = amount,
            // ... existing fields
        };

        _logger.LogInformation(
            "[AutoComplete] Processing vehicle fueling with context for Device {DeviceId}, Transaction {TransactionId}",
            deviceId, detectedTransactionId
        );

        // Existing vehicle transaction processing
        _ = Task.Run(async () =>
        {
            try
            {
                await _autoCompletionService.ProcessEndOfTransactionAsync(
                    deviceId, pumpId, detectedTransactionId.Value, statusData
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[AutoComplete] Error processing EndOfTransaction {DeviceId}:{Transaction}",
                    deviceId, detectedTransactionId
                );
            }
        });

        // Clean up Redis context
        await redis.KeyDeleteAsync(contextKey);
    }
}
```

---

## 📋 Database Tables Affected

### 1. TankTransfer (NEW Record Created)

```sql
INSERT INTO tanktransfers (
    SourceTankId,
    DestinationTankId,
    Amount,
    TransferDate,
    Reason,
    TransferType,
    RecordedBy,
    CreatedAt,
    PumpTransactionId  -- Links to pump transaction for audit
)
VALUES (
    5,                              -- Source tank
    8,                              -- Destination tank
    1500.00,                        -- Volume transferred
    '2025-11-13 14:30:00',         -- Transfer timestamp
    'Pump transfer',                -- Reason
    'InterTank',                    -- Same site
    'john.doe@example.com',         -- User
    CURRENT_TIMESTAMP,              -- Created
    12345                           -- Pump transaction ID
);
```

### 2. TankVolumeHistory (TWO Records Created)

#### Record 1: Source Tank (TransferOut)

```sql
INSERT INTO tank_volume_history (
    TankId,
    Timestamp,
    VolumeChange,
    NewVolume,
    ChangeReason,
    RelatedId,          -- Links to TankTransfer.Id
    RecordedBy,
    PhysicalStockValue,
    PhysicalStockSource
)
VALUES (
    5,                              -- Source tank
    '2025-11-13 14:30:00',         -- Transfer time
    -1500.00,                       -- NEGATIVE (fuel OUT)
    18500.00,                       -- New calculated stock (20000 - 1500)
    'TransferOut',                  -- Change reason enum
    123,                            -- TankTransfer.Id
    'john.doe@example.com',
    18500.00,                       -- Updated physical stock
    'PumpTransfer'
);
```

#### Record 2: Destination Tank (TransferIn)

```sql
INSERT INTO tank_volume_history (
    TankId,
    Timestamp,
    VolumeChange,
    NewVolume,
    ChangeReason,
    RelatedId,          -- Links to TankTransfer.Id
    RecordedBy,
    PhysicalStockValue,
    PhysicalStockSource
)
VALUES (
    8,                              -- Destination tank
    '2025-11-13 14:30:00',         -- Same transfer time
    1500.00,                        -- POSITIVE (fuel IN)
    11500.00,                       -- New calculated stock (10000 + 1500)
    'TransferIn',                   -- Change reason enum
    123,                            -- TankTransfer.Id (same as source)
    'john.doe@example.com',
    11500.00,                       -- Updated physical stock
    'PumpTransfer'
);
```

### 3. Tanks Table (BOTH Updated)

```sql
-- Source Tank (fuel decreased)
UPDATE tanks
SET CurrentStock = CurrentStock - 1500.00,
    PhysicalStockValue = PhysicalStockValue - 1500.00,
    LastUpdated = CURRENT_TIMESTAMP
WHERE Id = 5;

-- Destination Tank (fuel increased)
UPDATE tanks
SET CurrentStock = CurrentStock + 1500.00,
    PhysicalStockValue = PhysicalStockValue + 1500.00,
    LastUpdated = CURRENT_TIMESTAMP
WHERE Id = 8;
```

---

## 🔑 Key Differences from CreateTankTransfer.cs

| Aspect | CreateTankTransfer.cs (Web) | PumpTankTransferService (Pump) |
|--------|----------------------------|--------------------------------|
| **Trigger** | User clicks "Save Transfer" button | EOT packet from PTS device |
| **Validation** | Strict (opening/closing stock required) | Relaxed (trusts device volume) |
| **Volume Source** | User manual input | Device-reported actual volume |
| **Stock Check** | Rejects if insufficient | Logs warning but proceeds |
| **Transaction Link** | No pump transaction | Links to PumpTransactionId |
| **Timestamp** | User selects date/time | Device reports actual time |
| **Future Records** | Full validation with policy | Skipped (real-time operation) |

**Rationale**: Pump transfers are **physical reality** - fuel was actually transferred via pump. We must record it even if book stock shows discrepancy (indicates other inventory issues).

---

## ✅ Service Registration

Add to `FMS.Application/Extensions/ServiceCollectionExtensions.cs`:

```csharp
public static IServiceCollection AddApplicationServices(this IServiceCollection services)
{
    // ... existing services

    // Tank transfer services
    services.AddScoped<IPumpTankTransferService, PumpTankTransferService>();
    services.AddScoped<TankVolumeHistoryIntegrationService>();

    return services;
}
```

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] `IsTransferMode: true` flag detected correctly in UploadStatusCommand
- [ ] PumpTankTransferService creates TankTransfer record with NULL VehicleId
- [ ] Source tank CurrentStock decreased by volume
- [ ] Destination tank CurrentStock increased by volume
- [ ] TWO TankVolumeHistory records created (TransferOut + TransferIn)
- [ ] PhysicalStockValue updated for BOTH tanks
- [ ] PumpTransactionId link created in TankTransfer
- [ ] Insufficient stock logs warning but proceeds
- [ ] Transfer appears in tank reports, NOT vehicle reports

### Integration Tests

- [ ] Complete pump transfer workflow end-to-end
- [ ] Redis context cleanup after EOT
- [ ] Concurrent transfers to same tank handled correctly
- [ ] Historical transfers (backdated) process correctly
- [ ] Stock reconciliation reflects both tanks

---

## 📊 Logging Output Example

```log
[2025-11-13 14:30:15] INFO [AutoComplete] **TANK TRANSFER MODE** - Device PTS001, Pump 2, Transaction 12345, Source Tank 5 -> Dest Tank 8, Volume: 1500.00 L

[2025-11-13 14:30:15] INFO [PumpTransfer] Processing pump transfer: Source 5 -> Dest 8, Volume: 1500.00 L

[2025-11-13 14:30:15] INFO [PumpTransfer] Created TankTransfer record: ID 123, 1500.00 L from Storage Tank A to Storage Tank B

[2025-11-13 14:30:15] INFO [PumpTransfer] Updating source tank Storage Tank A volume history (TransferOut: -1500.00 L)

[2025-11-13 14:30:16] INFO [PumpTransfer] Source tank Storage Tank A updated: Old stock 20000.00 L -> New stock 18500.00 L

[2025-11-13 14:30:16] INFO [PumpTransfer] Updating destination tank Storage Tank B volume history (TransferIn: +1500.00 L)

[2025-11-13 14:30:16] INFO [PumpTransfer] Destination tank Storage Tank B updated: Old stock 10000.00 L -> New stock 11500.00 L

[2025-11-13 14:30:16] INFO [PumpTransfer] **TRANSFER COMPLETE** - 1500.00 L transferred from Storage Tank A to Storage Tank B

[2025-11-13 14:30:16] INFO [AutoComplete] Pump transfer completed successfully: Pump transfer completed: 1500.00 L from Storage Tank A to Storage Tank B
```

---

## 🚀 Next Steps

1. **Create** `IPumpTankTransferService` interface
2. **Implement** `PumpTankTransferService` class
3. **Modify** `UploadStatusCommand.cs` to detect `IsTransferMode` flag
4. **Register** service in DI container
5. **Test** with real pump transfer operation
6. **Monitor** logs to verify dual-tank updates

---

**Summary**: Pump tank transfers follow similar pattern to `CreateTankTransfer.cs` but adapted for real-time pump operations with relaxed validation (trusts device-reported volumes) and creates proper audit trail linking to pump transaction.
