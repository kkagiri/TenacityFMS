# Tank Stock Calculation Rules & Guidelines

## Overview

The FMS Tank Stock Management system maintains two types of stock values:

| Stock Type | Description | Source |
|------------|-------------|--------|
| **Physical Stock** (`PhysicalStockValue`) | Actual fuel volume in tank | ATG sensors, manual dip readings, or calculated from operations |
| **Book Stock** (`CurrentStock`) | Ledger/accounting value | Calculated from opening stock ± transactions |

The system uses a **ledger-based approach** where every stock change is recorded in `TankVolumeHistory` with full audit trail.

---

## 1. Opening Stock

### Definition
Opening stock is the **starting balance** for a tank at the beginning of each day. It establishes the baseline for all subsequent calculations.

### Rules

| Rule | Description |
|------|-------------|
| **R1.1** | Opening stock MUST be recorded before any dispensing or transfer operations |
| **R1.2** | Only ONE opening stock entry is allowed per tank per day |
| **R1.3** | Opening stock value must be ≥ 0 (no negative opening) |
| **R1.4** | Opening stock should ideally equal previous day's closing stock |
| **R1.5** | Opening stock sets both `PhysicalStockValue` and `CurrentStock` on the tank |

### Validation Points

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTHORIZATION TIME (PumpAuthorizeCommand/PumpAuthorizeTransfer) │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Check: Does opening stock exist for today?                   │
│ ✓ If NO → Block authorization with error message               │
│ ✓ If YES → Continue to stock level validation                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code Location
- `OpeningStockCommand.cs` - Creates opening stock entry
- `PumpAuthorizeCommand.cs` (Step 5.5) - Validates opening stock exists
- `PumpAuthorizeTransferCommand.cs` (Step 2.5) - Validates opening stock for both tanks

### Database Entry
```sql
INSERT INTO tankvolumehistory (TankId, Timestamp, VolumeChange, NewVolume, ChangeReason, ...)
VALUES (@TankId, @Today, 0, @OpeningValue, 'OpeningStock', ...);
```

---

## 2. Closing Stock

### Definition
Closing stock is the **ending balance** for a tank at the end of each day. It should reconcile with all day's transactions.

### Rules

| Rule | Description |
|------|-------------|
| **R2.1** | Closing stock should be recorded at end of business day |
| **R2.2** | Only ONE closing stock entry is allowed per tank per day |
| **R2.3** | Closing stock value must be ≥ 0 (no negative closing) |
| **R2.4** | Closing stock = Opening Stock + Receipts - Dispensing ± Adjustments ± Transfers |
| **R2.5** | Discrepancy between calculated and actual closing triggers variance alert |

### Calculation Formula
```
Closing Stock = Opening Stock
              + Fuel Receipts (deliveries)
              - Dispensing (automated + manual)
              + Transfer In
              - Transfer Out
              ± Stock Adjustments
```

### Variance Detection
```
Variance = Actual Closing (physical reading) - Calculated Closing (book value)

If |Variance| > Threshold:
    → Flag for investigation (possible leak, theft, or measurement error)
```

### Code Location
- `ClosingStockCommand.cs` - Creates closing stock entry

---

## 3. Dispensing (Vehicle Fueling)

### Definition
Dispensing is the **outflow** of fuel from a tank to a vehicle. This is the primary fuel consumption operation.

### Rules

| Rule | Description |
|------|-------------|
| **R3.1** | Opening stock MUST exist before dispensing is allowed |
| **R3.2** | Dispensing amount MUST NOT exceed available physical stock |
| **R3.3** | Resulting stock MUST NOT be negative |
| **R3.4** | Each dispensing creates a negative `VolumeChange` entry in ledger |
| **R3.5** | Dispensing is linked to `pumptransaction` via `ReferenceId` |

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              DISPENSING AUTHORIZATION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User requests fuel authorization                             │
│                    ↓                                             │
│  2. Check: Opening stock exists for today?                       │
│     NO  → ❌ Block: "Opening stock not recorded"                 │
│     YES → Continue                                               │
│                    ↓                                             │
│  3. Check: PhysicalStock >= RequestedVolume?                     │
│     NO  → ❌ Block: "Insufficient stock"                         │
│     YES → Continue                                               │
│                    ↓                                             │
│  4. Authorize pump, dispense fuel                                │
│                    ↓                                             │
│  5. Create TankVolumeHistory entry:                              │
│     VolumeChange = -DispensedAmount                              │
│     NewVolume = PreviousVolume - DispensedAmount                 │
│                    ↓                                             │
│  6. Final check: NewVolume >= 0?                                 │
│     NO  → ❌ Block ledger creation (safety net)                  │
│     YES → ✅ Ledger entry created                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Stock Calculation
```
New Stock = Previous Stock - Dispensed Volume

Example:
  Previous Stock: 5,000 L
  Dispensed:        -53 L
  New Stock:      4,947 L
```

### Code Locations
- `PumpAuthorizeCommand.cs` (Step 5.5, 5.6) - Pre-authorization validation
- `ProcessTankStockChangeCommand.cs` - Ledger entry creation with negative stock prevention
- `PumpTransactionIntegrationService.cs` - Links pump transaction to tank volume history

---

## 4. Transfer (Tank-to-Tank)

### Definition
Transfer is the movement of fuel between two tanks. It creates TWO ledger entries: one outflow (source) and one inflow (destination).

### Rules

| Rule | Description |
|------|-------------|
| **R4.1** | Opening stock MUST exist for BOTH source and destination tanks |
| **R4.2** | Source tank physical stock MUST be ≥ transfer volume |
| **R4.3** | Destination tank MUST have sufficient capacity (not overfill) |
| **R4.4** | Transfer creates TWO entries: negative for source, positive for destination |
| **R4.5** | Both entries share same `ReferenceId` (TankTransfer.Id) |
| **R4.6** | Minimum transfer volume: 10 L |
| **R4.7** | Maximum single transfer: 20,000 L |

### Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                 TRANSFER AUTHORIZATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User requests tank transfer                                  │
│                    ↓                                             │
│  2. Check: Opening stock exists for SOURCE tank?                 │
│     NO  → ❌ Block: "Opening stock not recorded for source"      │
│     YES → Continue                                               │
│                    ↓                                             │
│  3. Check: Opening stock exists for DESTINATION tank?            │
│     NO  → ❌ Block: "Opening stock not recorded for destination" │
│     YES → Continue                                               │
│                    ↓                                             │
│  4. Check: Source PhysicalStock >= TransferVolume?               │
│     NO  → ❌ Block: "Insufficient stock in source tank"          │
│     YES → Continue                                               │
│                    ↓                                             │
│  5. Check: Destination has capacity?                             │
│     NO  → ❌ Block: "Insufficient capacity in destination"       │
│     YES → Continue                                               │
│                    ↓                                             │
│  6. Authorize transfer, execute                                  │
│                    ↓                                             │
│  7. Create TWO TankVolumeHistory entries:                        │
│     Source:      VolumeChange = -TransferAmount                  │
│     Destination: VolumeChange = +TransferAmount                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Stock Calculation
```
Source Tank:
  New Stock = Previous Stock - Transfer Volume

Destination Tank:
  New Stock = Previous Stock + Transfer Volume

Example (Transfer 500L from Tank A to Tank B):
  Tank A: 3,000 L → 2,500 L  (VolumeChange: -500)
  Tank B: 1,000 L → 1,500 L  (VolumeChange: +500)
```

### Safety Thresholds
```
Destination Fill Warning:
  If (DestStock + TransferVolume) / DestCapacity > 95%
    → Log warning (potential overfill risk)
```

### Code Locations
- `PumpAuthorizeTransferCommand.cs` - Pre-authorization validation
- `CreateTankTransfer.cs` - Manual transfer creation with validation
- `ProcessTankStockChangeCommand.cs` - Ledger entry creation

---

## 5. Stock Adjustment

### Definition
Stock adjustment is a manual correction to reconcile book stock with actual physical stock.

### Rules

| Rule | Description |
|------|-------------|
| **R5.1** | Adjustments require a reason/justification |
| **R5.2** | Adjusted stock MUST NOT be negative |
| **R5.3** | Large adjustments (>5% of tank capacity) trigger audit alert |
| **R5.4** | Adjustment = New Physical Reading - Current Book Value |

### Code Location
- `CreateStockAdjustmentCommand.cs`

---

## 6. Fuel Receipt (Delivery)

### Definition
Fuel receipt is the **inflow** of fuel into a tank from a delivery/supplier.

### Rules

| Rule | Description |
|------|-------------|
| **R6.1** | Receipt volume MUST be positive |
| **R6.2** | Resulting stock MUST NOT exceed tank capacity |
| **R6.3** | Creates positive `VolumeChange` entry in ledger |

### Stock Calculation
```
New Stock = Previous Stock + Received Volume
```

### Code Location
- `CreateFuelRefillCommand.cs`

---

## 7. Negative Stock Prevention

### Overview
The system has **THREE layers** of negative stock prevention:

```
┌─────────────────────────────────────────────────────────────────┐
│                  NEGATIVE STOCK PREVENTION LAYERS                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER 1: PRE-AUTHORIZATION (UI/Mobile App)                      │
│  ─────────────────────────────────────────                       │
│  • Check opening stock exists                                    │
│  • Check physical stock >= requested volume                      │
│  • Block authorization if validation fails                       │
│                                                                  │
│  LAYER 2: PRE-LEDGER (ProcessTankStockChangeCommand)             │
│  ────────────────────────────────────────────────                │
│  • Calculate: NewVolume = PreviousVolume + VolumeChange          │
│  • If NewVolume < 0 → Reject ledger creation                     │
│  • Log error with full details                                   │
│                                                                  │
│  LAYER 3: DATABASE CONSTRAINT (Optional)                         │
│  ────────────────────────────────────────                        │
│  • CHECK constraint: NewVolume >= 0                              │
│  • Last line of defense                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### When Negative Stock Prevention Triggers

| Scenario | Layer 1 | Layer 2 | Result |
|----------|---------|---------|--------|
| No opening stock recorded | ✅ Blocks | N/A | Authorization rejected |
| Insufficient physical stock | ✅ Blocks | N/A | Authorization rejected |
| Opening stock = 0, then dispense | ❌ May pass | ✅ Blocks | Ledger rejected |
| Race condition (parallel transactions) | ❌ May pass | ✅ Blocks | Ledger rejected |

---

## 8. Daily Stock Reconciliation Formula

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY STOCK FORMULA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Expected Closing = Opening Stock                                │
│                   + Fuel Receipts (deliveries)                   │
│                   - Automated Dispensing                         │
│                   - Manual Dispensing                            │
│                   + Transfer In                                  │
│                   - Transfer Out                                 │
│                   ± Stock Adjustments                            │
│                                                                  │
│  Variance = Actual Closing (physical) - Expected Closing (book) │
│                                                                  │
│  Acceptable Variance: ±0.5% of tank capacity                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Volume Change Reason Codes

| Code | Description | VolumeChange Sign |
|------|-------------|-------------------|
| `OpeningStock` | Daily opening balance | 0 (sets baseline) |
| `ClosingStock` | Daily closing balance | 0 (sets baseline) |
| `AutomatedDispensing` | PTS pump transaction | Negative (-) |
| `ManualDispensing` | Manual fuel issue | Negative (-) |
| `FuelReceipt` | Fuel delivery received | Positive (+) |
| `TransferIn` | Fuel received from another tank | Positive (+) |
| `TransferOut` | Fuel sent to another tank | Negative (-) |
| `StockAdjustment` | Manual correction | Either (+/-) |

---

## 10. Common Issues & Troubleshooting

### Issue 1: "Opening stock not recorded"
**Cause:** No opening stock entry exists for the tank on the current day.
**Solution:** Record opening stock via Mobile App → Manage Stocks → Opening Stock.

### Issue 2: "Insufficient stock in tank"
**Cause:** Requested fuel volume exceeds available physical stock.
**Solution:**
- Reduce requested volume
- Receive fuel delivery first
- Verify physical stock reading is accurate

### Issue 3: "NEGATIVE STOCK PREVENTED" in logs
**Cause:** Operation would result in negative stock.
**Possible Reasons:**
1. Opening stock not recorded (previous volume = 0)
2. Multiple concurrent transactions depleted stock
3. Stock not synchronized with physical reality

**Solution:**
1. Record today's opening stock
2. Perform stock adjustment to match physical reading
3. Check for missing fuel receipts

### Issue 4: Transaction saved but no ledger entry
**Cause:** Pump transaction completed but TankVolumeHistory creation failed.
**Symptoms:**
- Record exists in `pumptransaction` table
- No corresponding record in `tankvolumehistory` table

**Investigation:**
1. Check logs for "NEGATIVE STOCK PREVENTED"
2. Verify opening stock exists for the day
3. Check if physical stock was sufficient at transaction time

---

## 11. Best Practices

1. **Always record opening stock first thing each day**
   - Do this before any fuel operations
   - Ideally equals previous day's closing stock

2. **Record closing stock at end of each day**
   - Compare with calculated value
   - Investigate variances > 0.5%

3. **Keep physical stock readings current**
   - Update from ATG sensors regularly
   - Manual dip readings for tanks without ATG

4. **Monitor for unusual patterns**
   - Large unexplained variances
   - Frequent stock adjustments
   - Transactions failing due to negative stock

5. **Use transfers only when necessary**
   - Both tanks must have opening stock
   - Verify both tanks have capacity/stock

---

## 12. Database Schema Reference

### TankVolumeHistory Table
```sql
CREATE TABLE tankvolumehistory (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    TankId INT NOT NULL,
    Timestamp DATETIME NOT NULL,
    VolumeChange DECIMAL(18,2) NOT NULL,
    NewVolume DECIMAL(18,2) NOT NULL,
    ChangeReason VARCHAR(50) NOT NULL,
    ReferenceId INT NULL,
    ReferenceType VARCHAR(50) NULL,
    RecordedBy VARCHAR(100) NULL,
    CreatedOn DATETIME NOT NULL,
    IsDeleted BIT DEFAULT 0,

    CONSTRAINT FK_TankVolumeHistory_Tank
        FOREIGN KEY (TankId) REFERENCES tanks(Id),
    CONSTRAINT CHK_NewVolume_NonNegative
        CHECK (NewVolume >= 0)
);
```

### Tanks Table (Stock Fields)
```sql
-- Key stock-related columns in tanks table
PhysicalStockValue DECIMAL(18,2)     -- Actual physical stock
LastPhysicalStockUpdate DATETIME      -- When physical stock was last updated
PhysicalStockSource VARCHAR(50)       -- Source of reading (ATG, Manual, Transfer, etc.)
CurrentStock DECIMAL(18,2)            -- Book/ledger stock value
UseBookKeeping BIT                    -- Whether tank uses ledger system
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: FMS Development Team*
