# Tank Stock Management - Fueling Transaction Flow

## Overview

This document describes the sequence flow and components involved in adjusting `Tank.CurrentStock` and `Tank.PhysicalStockValue` when a fueling transaction (PTS pump transaction) occurs. It identifies the services, commands, and handlers that affect tank stock and explains how negative stock values can occur.

---

## 🚨 Root Cause of Negative Stock

**The primary cause of negative `Tank.CurrentStock` is:**

> **Missing or no Opening Stock for the current day.**

When a pump transaction is completed, the system looks for the **previous TankVolumeHistory record** to calculate the new volume. If NO history records exist for today (no opening stock was recorded), it falls back to `Tank.CurrentStock`. If `Tank.CurrentStock` is 0 or already negative, any dispensing transaction will push it further negative.

---

## Sequence Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FUELING TRANSACTION FLOW                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────────┐    ┌────────────────────────┐
│ 1. PumpAuthorize│───►│ 2. PTS Device        │───►│ 3. EndOfTransaction    │
│    Command      │    │    Dispenses Fuel    │    │    Status Received     │
└─────────────────┘    └──────────────────────┘    └───────────┬────────────┘
                                                               │
                                                               ▼
                       ┌──────────────────────────────────────────────────────┐
                       │ 4. AutoTransactionCompletionService                  │
                       │    .ProcessEndOfTransactionAsync()                   │
                       │                                                      │
                       │  • Detects EndOfTransaction status                   │
                       │  • Checks if auto-complete is enabled                │
                       │  • Gets complete transaction data from device        │
                       │  • Enriches with Redis context (TankId, VehicleId)   │
                       │  • Calls CompleteAndSaveTransactionAsync()           │
                       └───────────────────────────┬──────────────────────────┘
                                                   │
                                                   ▼
                       ┌──────────────────────────────────────────────────────┐
                       │ 5. CompleteAndSaveTransactionAsync()                 │
                       │    (AutoTransactionCompletionService.cs)             │
                       │                                                      │
                       │  • Creates Pumptransaction entity                    │
                       │  • Saves to database (pumptransactions table)        │
                       │  • Calls PumpTransactionIntegrationService           │
                       └───────────────────────────┬──────────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 6. PumpTransactionIntegrationService.ProcessPumpTransactionAsync()           │
│    (PumpTransactionIntegrationService.cs)                                    │
│                                                                              │
│  • Validates TankId and Volume                                               │
│  • Checks PTS.AutoCreateLedgerEntries config                                 │
│  • Calculates new physical stock: currentPhysicalStock - volume              │
│  • Calls TankVolumeHistoryIntegrationService.ProcessChangeAsync()            │
│    with VolumeChangeReasonEnum.AutomatedDispensing                           │
└─────────────────────────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 7. TankVolumeHistoryIntegrationService.ProcessChangeAsync()                  │
│    (TankVolumeHistoryIntegrationService.cs)                                  │
│                                                                              │
│  • Sends MediatR command: ProcessTankStockChangeCommand                      │
│    - TankId                                                                  │
│    - VolumeChange: -volume (NEGATIVE for dispensing)                         │
│    - ChangeReason: VolumeChangeReasonEnum.AutomatedDispensing                │
│    - ReferenceId: pumpTransactionId                                          │
│    - ReferenceType: "PumpTransaction"                                        │
└─────────────────────────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 8. ProcessTankStockChangeCommandHandler.Handle()                             │
│    (ProcessTankStockChangeCommand.cs)                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP A: Get Previous Volume                                            │  │
│  │         GetPreviousVolumeAsync(tankId, timestamp)                      │  │
│  │                                                                        │  │
│  │  • Queries TankVolumeHistory for records BEFORE this timestamp         │  │
│  │  • If NO records found → Falls back to Tank.CurrentStock               │  │
│  │  • ⚠️ If Tank.CurrentStock = 0 → NEGATIVE STOCK WILL OCCUR!           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP B: Calculate New Volume                                           │  │
│  │         newVolume = previousVolume + volumeChange                      │  │
│  │                                                                        │  │
│  │  Example:                                                              │  │
│  │  - previousVolume: 0 (no opening stock)                                │  │
│  │  - volumeChange: -50 (dispensing 50L)                                  │  │
│  │  - newVolume: 0 + (-50) = -50L 🚨 NEGATIVE!                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP C: Negative Stock Validation (CURRENTLY BLOCKS OPERATION)         │  │
│  │                                                                        │  │
│  │  if (newVolume < 0) {                                                  │  │
│  │      return FMSResponseMessage(false, "Would result in negative...")   │  │
│  │  }                                                                     │  │
│  │                                                                        │  │
│  │  ⚠️ This BLOCKS the TankVolumeHistory entry creation!                 │  │
│  │  But the Pumptransaction is ALREADY SAVED in the database.            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP D: Create TankVolumeHistory Record (if validation passes)         │  │
│  │         (tankVolumehistory table)                                      │  │
│  │                                                                        │  │
│  │  • Creates new TankVolumeHistory record                                │  │
│  │  • Sets NewVolume = calculated new volume                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP E: Update Tank Entity (if today's date)                           │  │
│  │                                                                        │  │
│  │  if (isCurrentDay && tank.UseBookKeeping == 1) {                       │  │
│  │      tank.CurrentStock = (tank.CurrentStock ?? 0) + volumeChange;      │  │
│  │      tank.LastStockUpdate = DateTime.UtcNow;                           │  │
│  │  }                                                                     │  │
│  │                                                                        │  │
│  │  ⚠️ This directly modifies Tank.CurrentStock!                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 9. UpdateTankVolumeHistoryCommand.Handle()                                   │
│    (UpdateTankVolumeHistoryCommand.cs)                                       │
│                                                                              │
│  • Recalculates NewVolume for ALL affected TankVolumeHistory records         │
│  • Gets latest record's NewVolume                                            │
│  • Updates Tank.CurrentStock = latestRecord.NewVolume                        │
│  • This RECONCILES Tank.CurrentStock with the ledger!                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files Involved

| File | Purpose |
|------|---------|
| [AutoTransactionCompletionService.cs](../../../FMS.Application/Services/AutoTransactionCompletionService.cs) | Detects EndOfTransaction and orchestrates save |
| [PumpTransactionIntegrationService.cs](../../../FMS.Application/Command/DatabaseCommand/PTSCommands/PumpTransactionCommand/PumpTransactionIntegrationService.cs) | Bridges PumpTransaction → TankVolumeHistory |
| [TankVolumeHistoryIntegrationService.cs](../../../FMS.Application/Features/TankManagement/TankVolumeHistory/Commands/TankVolumeHistoryIntegrationService.cs) | Unified service for all volume change operations |
| [ProcessTankStockChangeCommand.cs](../../../FMS.Application/Features/TankManagement/TankVolumeHistory/Commands/ProcessTankStockChangeCommand.cs) | **CORE**: Handles actual stock calculation and updates |
| [UpdateTankVolumeHistoryCommand.cs](../../../FMS.Application/Features/TankManagement/TankVolumeHistory/Commands/UpdateTankVolumeHistoryCommand.cs) | Recalculates volumes and reconciles Tank.CurrentStock |
| [VolumeChangeReasonEnum.cs](../../../FMS.Domain/Entities/enums/VolumeChangeReasonEnum.cs) | Enum defining change reasons including `AutomatedDispensing` |

---

## VolumeChangeReasonEnum Values

```csharp
public enum VolumeChangeReasonEnum {
    OpeningStock = 0,          // Daily opening stock entry
    ClosingStock = 1,          // Daily closing stock entry
    Delivery = 2,              // Fuel delivery to tank
    TransferIn = 3,            // Transfer from another tank (incoming)
    TransferOut = 4,           // Transfer to another tank (outgoing)
    Adjustment = 5,            // Manual adjustment
    Dispensing = 6,            // Manual fuel refill (FuelRefill table)
    AutomatedDispensing = 7,   // 🔥 PTS pump transactions (Pumptransaction table)
    Reconciliation = 8,        // Manual reconciliation
    AutomatedReconciliation = 9 // System reconciliation
}
```

---

## Why Does Negative Stock Happen?

### Scenario 1: No Opening Stock for Today

```
Timeline:
┌─────────────────────────────────────────────────────────────────┐
│ Yesterday 11:59 PM                                              │
│ - Closing Stock: 5000L recorded                                 │
│ - Tank.CurrentStock = 5000L                                     │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼ (Date changes)
┌─────────────────────────────────────────────────────────────────┐
│ Today 12:01 AM                                                  │
│ - NO Opening Stock entry created!                               │
│ - Tank.CurrentStock = 5000L (from yesterday)                    │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Today 8:00 AM - Pump Transaction (50L dispensed)                │
│                                                                 │
│ GetPreviousVolumeAsync() looks for records BEFORE 8:00 AM today │
│ Result: NO records found for TODAY                              │
│         Falls back to Tank.CurrentStock = 5000L                 │
│                                                                 │
│ Calculation: newVolume = 5000 + (-50) = 4950L ✅                │
└─────────────────────────────────────────────────────────────────┘
```

This works because `Tank.CurrentStock` still had yesterday's value.

### Scenario 2: Tank.CurrentStock Was Reset or Corrupted

```
Timeline:
┌─────────────────────────────────────────────────────────────────┐
│ Tank.CurrentStock = 0L (was never set or corrupted)             │
│ NO TankVolumeHistory records exist for today                    │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Pump Transaction (50L dispensed)                                │
│                                                                 │
│ GetPreviousVolumeAsync():                                       │
│   - No TankVolumeHistory records found                          │
│   - Falls back to Tank.CurrentStock = 0L                        │
│                                                                 │
│ Calculation: newVolume = 0 + (-50) = -50L 🚨                    │
│                                                                 │
│ ProcessTankStockChangeCommand BLOCKS this with error:           │
│ "Operation would result in negative tank stock (-50L)"          │
│                                                                 │
│ BUT Pumptransaction is ALREADY SAVED!                           │
│ TankVolumeHistory entry is NOT created.                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Background Services That Affect Tank Stock

### 1. DailyTankReconciliationService

**Location:** [FMS.BackgroundServices/FMS/DailyTankReconciliationService.cs](../../../FMS.BackgroundServices/FMS/DailyTankReconciliationService.cs)

- Runs at **12:00 AM daily**
- Processes previous day's reconciliation
- Aggregates refills, deliveries, transfers from `tankdeliveries`
- Creates/updates `dailytankreconciliation` records

### 2. DailyTankReconciliationService (TankManagement)

**Location:** [FMS.BackgroundServices/TankManagement/DailyTankReconciliationService.cs](../../../FMS.BackgroundServices/TankManagement/DailyTankReconciliationService.cs)

- Runs at **2:00 AM daily**
- Reconciles TankStock with TankVolumeHistory
- Fixes critically negative tanks (threshold: -1000L)
- Updates `dailytankreconciliation` table

### 3. DispensingAggregationService

**Location:** [FMS.BackgroundServices/TankStock/DispensingAggregationService.cs](../../../FMS.BackgroundServices/TankStock/DispensingAggregationService.cs)

- Runs every **15 minutes**
- Aggregates FuelRefills into TankStock.ManualCalculatedUsage
- Does NOT directly modify `Tank.CurrentStock`

### 4. TankMonitoringService

**Location:** [FMS.BackgroundServices/FMS/TankMonitoringService.cs](../../../FMS.BackgroundServices/FMS/TankMonitoringService.cs)

- Runs every **5 minutes**
- Checks tank levels from ATG measurements
- Creates alarms for low/high volume
- Does NOT modify `Tank.CurrentStock`

---

## How Tank.CurrentStock Gets Modified

### Direct Modifications in ProcessTankStockChangeCommand.cs

```csharp
// Lines 180-186 in ProcessTankStockChangeCommand.cs

// For current day operations when no physical stock is provided
else if ((request.Timestamp.Date == DateTime.UtcNow.Date ||
          request.Timestamp.Date == DateTime.Now.Date) &&
          tank.UseBookKeeping == 1)
{
    // Only update book balance for current day operations
    tank.CurrentStock = (tank.CurrentStock ?? 0) + request.VolumeChange;
    tank.LastStockUpdate = DateTime.UtcNow;
    _context.Tanks.Update(tank);
}
```

### Reconciliation via UpdateTankVolumeHistoryCommand

```csharp
// Lines 99-112 in UpdateTankVolumeHistoryCommand.cs

if (request.UpdateTankCurrentStock && tank.UseBookKeeping == 1)
{
    var latestRecord = await _context.TankVolumeHistories
        .Where(h => h.TankId == request.TankId)
        .OrderByDescending(h => h.Timestamp)
        .ThenByDescending(h => h.Id)
        .FirstOrDefaultAsync(cancellationToken);

    if (latestRecord != null && latestRecord.NewVolume.HasValue)
    {
        tank.CurrentStock = latestRecord.NewVolume;
        tank.LastStockUpdate = DateTime.Now;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
```

---

## Troubleshooting Negative Stock

### Step 1: Check if Opening Stock exists for Today

```sql
SELECT * FROM tankvolumehistory
WHERE TankId = @tankId
  AND DATE(Timestamp) = CURDATE()
  AND ChangeReason = 0  -- OpeningStock
ORDER BY Timestamp ASC;
```

### Step 2: Check the Tank's current state

```sql
SELECT Id, Name, CurrentStock, PhysicalStockValue,
       LastStockUpdate, LastPhysicalStockUpdate, UseBookKeeping
FROM tanks
WHERE Id = @tankId;
```

### Step 3: Get the latest TankVolumeHistory

```sql
SELECT * FROM tankvolumehistory
WHERE TankId = @tankId
  AND IsDeleted != 1
ORDER BY Timestamp DESC, Id DESC
LIMIT 10;
```

### Step 4: Check for PumpTransactions without TankVolumeHistory

```sql
-- Find pump transactions that might not have created ledger entries
SELECT pt.Id, pt.PtsId, pt.Transaction, pt.Volume, pt.DateTime, pt.TankId
FROM pumptransactions pt
LEFT JOIN tankvolumehistory tvh ON tvh.ReferenceId = pt.Id
  AND tvh.ReferenceType = 'PumpTransaction'
  AND tvh.ChangeReason = 7  -- AutomatedDispensing
WHERE pt.TankId = @tankId
  AND DATE(pt.DateTime) = CURDATE()
  AND tvh.Id IS NULL;
```

---

## Fix: Ensure Opening Stock is Always Created

The system needs an **automatic Opening Stock creation** process that runs at midnight or when the first transaction of the day occurs. This should:

1. Take yesterday's Closing Stock (or last known volume)
2. Create an OpeningStock entry in TankVolumeHistory for today
3. Set Tank.CurrentStock = OpeningStock value

This prevents the "no previous volume" scenario that causes negative stock calculations.

---

## Summary

| Component | Responsibility | Modifies Tank.CurrentStock? |
|-----------|----------------|----------------------------|
| PumpAuthorizeCommand | Authorizes pump, stores context in Redis | ❌ No |
| AutoTransactionCompletionService | Saves Pumptransaction to DB | ❌ No |
| PumpTransactionIntegrationService | Bridges to TankVolumeHistory | ❌ No (delegates) |
| ProcessTankStockChangeCommand | **CREATES TankVolumeHistory** | ✅ **YES** |
| UpdateTankVolumeHistoryCommand | Recalculates volumes | ✅ **YES** (reconciles) |
| DailyTankReconciliationService | Daily reconciliation | ✅ YES (fixes negatives) |
| TankMonitoringService | Monitors levels, creates alarms | ❌ No |
| DispensingAggregationService | Aggregates FuelRefills | ❌ No |

**The key takeaway:** `ProcessTankStockChangeCommand` is the **central handler** that modifies `Tank.CurrentStock` when a fueling transaction (AutomatedDispensing) occurs. If it cannot find a valid previous volume, it will either:
1. Use `Tank.CurrentStock` as fallback (may be 0 or stale)
2. Block the operation if the result would be negative

