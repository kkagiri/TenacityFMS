# TankStock Single-Row-Per-Day Implementation Guide

## Overview

This document describes the implementation of the single-row-per-day TankStock architecture, which consolidates all daily tank transactions into a single row per tank per day instead of creating separate rows for each transaction type.

## Implementation Date
January 20, 2025

## Problem Statement

**Previous Architecture:**
- Created separate TankStock rows for:
  - Opening Stock (EntryType = 1)
  - Closing Stock (EntryType = 2)
  - Delivery (EntryType = 4) - via separate entry
  - Transfer In (EntryType = 5) - via separate entry
  - Transfer Out (EntryType = 6) - via separate entry

**Issue:** Multiple rows per tank per day caused:
- Data duplication
- Difficulty in reporting and reconciliation
- Constraint violations when trying to enforce business rules
- Complex queries to aggregate daily information

**New Architecture:**
- Single TankStock row per tank per day
- Opening Stock creates the row
- Delivery, Transfer, Closing Stock update the same row
- Dispensing calculated by background service from FuelRefills table

## Changes Implemented

### 1. Database Schema Changes

#### New Columns Added to `tankstock` Table:

```sql
-- Delivery tracking
DeliveryAmount DECIMAL(10,2) NULL          -- Total delivery for the day
DeliveryId INT(11) NULL                     -- Reference to delivery record

-- Transfer tracking
TransferInAmount DECIMAL(10,2) NULL         -- Total fuel transferred IN
TransferOutAmount DECIMAL(10,2) NULL        -- Total fuel transferred OUT
TransferRecordId INT(11) NULL               -- Reference to transfer record
```

#### Unique Constraint (Applied AFTER data consolidation):
```sql
ALTER TABLE tankstock
ADD UNIQUE INDEX UQ_tankstock_tank_date (TankID, EntryDate);
```

**Files Modified:**
- `FMS.Domain/Entities/Features/TankStockManagement/Tankstock.cs`
- `FMS.Persistence/EntityConfigurations/TankstockConfiguration.cs`

**SQL Script:**
- `Documentation/Features/TankStock/database/tankstock_single_row_migration.sql`

---

### 2. Command Handler Updates

#### A. OpeningStockCommand
**File:** `FMS.Application/Features/TankManagement/TankStock/Commands/OpeningStockCommand.cs`

**Changes:**
- Added validation to prevent duplicate TankStock entries for same tank-date
- Returns error if entry already exists
- Creates new row with `EntryType = OpeningStock` (unchanged)

**Logic:**
```csharp
// Check if TankStock entry already exists
var existingTankStock = await _context.Tankstocks
    .Where(x => x.TankId == request.TankId &&
        x.EntryDate.Date == entryDate.Date &&
        !x.IsDeleted)
    .FirstOrDefaultAsync(cancellationToken);

if (existingTankStock != null)
{
    return new FMSResponseMessage(false,
        "A TankStock entry already exists for this tank on this date. " +
        "Only one TankStock entry per tank per day is allowed.");
}
```

---

#### B. ClosingStockCommand
**File:** `FMS.Application/Features/TankManagement/TankStock/Commands/ClosingStockCommand.cs`

**Changes:**
- Changed from **INSERT** to **UPDATE** operation
- Finds existing TankStock entry for the tank-date
- Updates `ManualClosingLevel` and `ClosingMeter` fields
- Keeps `EntryType` as `OpeningStock` (primary type for the day)
- Maintains all reconciliation logic (discrepancy detection, alarms, notifications)

**Before:**
```csharp
var newClosingStock = new Tankstock { ... };
_context.Tankstocks.Add(newClosingStock);
```

**After:**
```csharp
// Find existing entry
var existingTankStock = await _context.Tankstocks
    .Where(x => x.TankId == request.TankId &&
        x.EntryDate.Date == entryDate.Date &&
        !x.IsDeleted)
    .FirstOrDefaultAsync(cancellationToken);

if (existingTankStock == null)
{
    return new FMSResponseMessage(false,
        "No TankStock entry found. Opening stock must be created first.");
}

// Update existing entry
existingTankStock.ManualClosingLevel = request.ClosingStock;
existingTankStock.ClosingMeter = request.ClosingMeter;
_context.Tankstocks.Update(existingTankStock);
```

---

#### C. CreateDeliveryCommand
**File:** `FMS.Application/Features/TankManagement/Deliveries/Commands/CreateDeliveryCommand.cs`

**Changes:**
- After creating Delivery record, finds TankStock entry for the tank-date
- Updates `DeliveryAmount` (cumulative if multiple deliveries)
- Sets `DeliveryId` reference to latest delivery

**New Logic:**
```csharp
// Update TankStock entry with delivery information
var tankStock = await _context.Tankstocks
    .Where(x => x.TankId == request.DeliveryDTO.TankId &&
        x.EntryDate.Date == deliveryDate.Date &&
        !x.IsDeleted)
    .FirstOrDefaultAsync(cancellationToken);

if (tankStock != null)
{
    tankStock.DeliveryAmount = (tankStock.DeliveryAmount ?? 0) + request.DeliveryDTO.ManualDeliveryAmount;
    tankStock.DeliveryId = delivery.Id;
    _context.Tankstocks.Update(tankStock);
    await _context.SaveChangesAsync(cancellationToken);
}
```

---

#### D. CreateTankTransfer
**File:** `FMS.Application/Features/TankManagement/TankTransfer/Commands/CreateTankTransfer.cs`

**Changes:**
- After creating TankTransfer record, updates TankStock for BOTH tanks
- Source Tank: Updates `TransferOutAmount` (cumulative)
- Destination Tank: Updates `TransferInAmount` (cumulative)
- Both: Sets `TransferRecordId` to latest transfer

**New Logic:**
```csharp
// Update source tank TankStock
var sourceTankStock = await _context.Tankstocks
    .Where(x => x.TankId == sourceTank.Id &&
        x.EntryDate.Date == transferDate.Date &&
        !x.IsDeleted)
    .FirstOrDefaultAsync(cancellationToken);

if (sourceTankStock != null)
{
    sourceTankStock.TransferOutAmount = (sourceTankStock.TransferOutAmount ?? 0) + transferAmount;
    sourceTankStock.TransferRecordId = tankTransfer.Id;
    _context.Tankstocks.Update(sourceTankStock);
}

// Update destination tank TankStock
var destinationTankStock = await _context.Tankstocks
    .Where(x => x.TankId == destinationTank.Id &&
        x.EntryDate.Date == transferDate.Date &&
        !x.IsDeleted)
    .FirstOrDefaultAsync(cancellationToken);

if (destinationTankStock != null)
{
    destinationTankStock.TransferInAmount = (destinationTankStock.TransferInAmount ?? 0) + transferAmount;
    destinationTankStock.TransferRecordId = tankTransfer.Id;
    _context.Tankstocks.Update(destinationTankStock);
}

await _context.SaveChangesAsync(cancellationToken);
```

---

### 3. Background Service

#### DispensingAggregationService
**File:** `FMS.BackgroundServices/TankStock/DispensingAggregationService.cs`

**Purpose:** Aggregate FuelRefills and update `ManualCalculatedUsage` every 15 minutes

**Logic:**
1. Runs every 15 minutes
2. Gets all TankStock entries for today
3. For each entry:
   - Sums `FuelRefills.Amount` for the tank today
   - Updates `TankStock.ManualCalculatedUsage`
   - Only saves if value changed (optimized)
4. Logs summary of updates

**Key Features:**
- Scoped service pattern for DbContext
- Error handling per tank (continues on errors)
- Efficient - only updates changed values
- Detailed logging for monitoring

**Registration Required:**
```csharp
// In Program.cs or Startup.cs
services.AddHostedService<DispensingAggregationService>();
```

---

### 4. Data Consolidation Script

#### Python Script
**File:** `scripts/database/consolidate_tankstock_entries.py`

**Purpose:** Migrate existing multi-row TankStock entries to single-row-per-day format

**Process:**
1. **Creates Backup:** `tankstock_backup_YYYYMMDD_HHMMSS`
2. **Finds Duplicates:** All tank-date combinations with multiple rows
3. **Consolidates Each:**
   - Identifies primary entry (prefer OpeningStock, or earliest)
   - Merges closing stock data into primary entry
   - Fetches delivery from `deliveries` table
   - Fetches transfers from `tanktransfers` table
   - Updates primary entry with all consolidated data
   - Soft deletes redundant entries
4. **Verification:** Checks no duplicates remain
5. **Summary Report:** Statistics on consolidation

**Features:**
- Creates automatic backup before changes
- Preserves all data (opening, closing, deliveries, transfers)
- Soft delete (sets `IsDeleted=1`) instead of hard delete
- Comprehensive logging
- Verification step
- Can be re-run safely (idempotent)

---

## Implementation Steps

### Phase 1: Database Migration (SAFE - Non-Breaking)
```bash
# Run SQL migration to add new columns
mysql -u root -p gpsdata < Documentation/Features/TankStock/database/tankstock_single_row_migration.sql

# Steps 1-3 will execute (add columns, add indexes)
# Step 4 (unique constraint) is COMMENTED OUT - run later
```

**Result:** New columns added, existing code continues to work

---

### Phase 2: Data Consolidation (RUN DURING LOW TRAFFIC)
```bash
# Navigate to script directory
cd scripts/database

# Run Python consolidation script
python consolidate_tankstock_entries.py

# Review log file in logs/tankstock_consolidation/
# Verify consolidation completed successfully
```

**Important Checks:**
- Backup table created: `tankstock_backup_YYYYMMDD_HHMMSS`
- No remaining duplicates
- Summary report shows correct counts

---

### Phase 3: Deploy Updated Code
```bash
# Build solution
dotnet build Tenacity.Fms.sln

# Deploy backend (stop services first)
# Copy updated DLLs to production

# Register background service
# Add to Program.cs:
services.AddHostedService<DispensingAggregationService>();

# Restart services
```

---

### Phase 4: Enable Unique Constraint (After Testing)
```sql
-- Only run AFTER verifying consolidation successful
-- This prevents future duplicate entries

ALTER TABLE tankstock
ADD UNIQUE INDEX UQ_tankstock_tank_date (TankID, EntryDate);
```

---

## Testing Checklist

### Test 1: Opening Stock
- [ ] Create opening stock for Tank A on Date X
- [ ] Verify TankStock row created with `EntryType = 1`
- [ ] Try to create another opening stock for Tank A on Date X
- [ ] Verify error: "A TankStock entry already exists..."

### Test 2: Closing Stock
- [ ] Create opening stock for Tank B on Date Y
- [ ] Create closing stock for Tank B on Date Y
- [ ] Verify same TankStock row updated (not new row created)
- [ ] Verify `ManualClosingLevel` and `ClosingMeter` populated
- [ ] Verify reconciliation logic still works (discrepancy detection)

### Test 3: Delivery
- [ ] Create opening stock for Tank C on Date Z
- [ ] Create delivery for Tank C on Date Z
- [ ] Verify TankStock row has `DeliveryAmount` populated
- [ ] Verify `DeliveryId` reference set
- [ ] Check Delivery record created in `deliveries` table
- [ ] Check TankVolumeHistory updated

### Test 4: Transfer
- [ ] Create opening stock for Tank D (source) on Date W
- [ ] Create opening stock for Tank E (destination) on Date W
- [ ] Create transfer from Tank D to Tank E
- [ ] Verify Tank D TankStock has `TransferOutAmount` populated
- [ ] Verify Tank E TankStock has `TransferInAmount` populated
- [ ] Verify both have `TransferRecordId` set

### Test 5: Dispensing Aggregation
- [ ] Create opening stock for Tank F on today
- [ ] Create FuelRefills for Tank F (multiple transactions)
- [ ] Wait 15 minutes for background service
- [ ] Verify TankStock `ManualCalculatedUsage` = sum of FuelRefills.Amount
- [ ] Check logs for "Dispensing aggregation completed"

### Test 6: Complete Day Flow
- [ ] Morning: Create opening stock (50L)
- [ ] 10 AM: Delivery (100L) ? verify DeliveryAmount = 100
- [ ] 11 AM: Dispensing (20L via FuelRefills)
- [ ] 2 PM: Transfer in (30L) ? verify TransferInAmount = 30
- [ ] 4 PM: Transfer out (15L) ? verify TransferOutAmount = 15
- [ ] Evening: Closing stock (145L)
- [ ] Verify single TankStock row has all data:
  ```
  Opening: 50L
  Delivery: 100L
  TransferIn: 30L
  TransferOut: 15L
  Dispensing: 20L (from background service)
  Closing: 145L
  Expected: 50 + 100 + 30 - 15 - 20 = 145L ?
  ```

---

## Rollback Plan

### If Issues Occur During Phase 2 (Data Consolidation):

```sql
-- Restore from backup
DROP TABLE tankstock;
RENAME TABLE tankstock_backup_YYYYMMDD_HHMMSS TO tankstock;
```

### If Issues Occur After Phase 3 (Code Deployment):

1. **Redeploy old code** (without single-row logic)
2. **Remove unique constraint** if added:
   ```sql
   ALTER TABLE tankstock DROP INDEX UQ_tankstock_tank_date;
   ```
3. **Stop DispensingAggregationService**
4. System returns to multi-row behavior

---

## Monitoring

### Key Metrics to Watch:

1. **Background Service Logs:**
   - `"Dispensing aggregation completed"`
   - Check for errors in aggregation
   - Verify updated counts

2. **Command Handler Logs:**
   - `"Updated TankStock EntryID {X} with delivery amount {Y}"`
   - `"Updated source TankStock EntryID {X} with transfer out amount {Y}"`
   - `"Updated destination TankStock EntryID {X} with transfer in amount {Y}"`

3. **Database Queries:**
   ```sql
   -- Check for duplicates (should be 0 after Phase 2)
   SELECT TankID, DATE(EntryDate) as EntryDate, COUNT(*) as Count
   FROM tankstock
   WHERE IsDeleted = 0
   GROUP BY TankID, DATE(EntryDate)
   HAVING COUNT(*) > 1;

   -- Check TankStock with all data populated
   SELECT
       TankID,
       EntryDate,
       ManualOpeningLevel,
       ManualClosingLevel,
       DeliveryAmount,
       TransferInAmount,
       TransferOutAmount,
       ManualCalculatedUsage
   FROM tankstock
   WHERE DATE(EntryDate) = CURDATE()
       AND IsDeleted = 0;
   ```

---

## Benefits

### Data Integrity:
? **Single source of truth** - One row per tank per day
? **Prevents duplicates** - Unique constraint enforced
? **Complete daily picture** - All transactions in one view
? **Easier reconciliation** - All data in single row

### Query Performance:
? **Simpler queries** - No need to GROUP BY and aggregate multiple rows
? **Better reporting** - Direct access to daily totals
? **Reduced complexity** - PivotGrid and reports simplified

### Maintenance:
? **Clear workflow** - Opening creates, others update
? **Automated dispensing** - Background service handles FuelRefills
? **Audit trail preserved** - Soft delete maintains history

---

## Troubleshooting

### Issue: "A TankStock entry already exists..."
**Cause:** Trying to create opening stock when entry exists
**Solution:** Use Update operation or check existing entry first

### Issue: "No TankStock entry found for tank X on date Y..."
**Cause:** Trying to close, deliver, or transfer before opening stock
**Solution:** Create opening stock first

### Issue: Dispensing not updating
**Cause:** Background service not running or failing
**Solution:**
- Check service registered: `services.AddHostedService<DispensingAggregationService>()`
- Check logs for errors
- Verify FuelRefills data exists

### Issue: Consolidation script fails
**Cause:** Missing deliveries or transfers tables
**Solution:**
- Verify foreign key relationships
- Check backup created before script failed
- Review logs for specific error
- Can modify script to handle missing data

---

## Future Enhancements

1. **Historical Data Rebuild:** Create admin tool to rebuild historical TankStock from TankVolumeHistory
2. **Real-time Updates:** Consider SignalR notifications when TankStock updated
3. **Bulk Import:** Handle Excel imports for multiple days with single-row logic
4. **Validation Rules:** Add business rules for max delivery/transfer amounts per day
5. **Reporting Dashboard:** Create daily tank summary report using single-row data

---

## Contact & Support

For issues or questions regarding this implementation:
- Review this guide first
- Check logs in `logs/tankstock_consolidation/`
- Review SQL migration script comments
- Test in dev environment before production

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-20 | System | Initial implementation - Single-row-per-day architecture |

---

**END OF IMPLEMENTATION GUIDE**
