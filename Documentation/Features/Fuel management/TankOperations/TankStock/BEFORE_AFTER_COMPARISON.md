# TankStock Architecture: Before vs After Comparison

## Visual Comparison

### BEFORE: Multi-Row Per Tank Per Day

```
TankID | EntryDate  | EntryType      | OpeningLevel | ClosingLevel | DeliveryAmount | ...
-------|------------|----------------|--------------|--------------|----------------|----
1      | 2025-01-20 | OpeningStock   | 50.00        | NULL         | NULL           |
1      | 2025-01-20 | Delivery       | NULL         | NULL         | NULL           |  ← Separate row
1      | 2025-01-20 | TransferIn     | NULL         | NULL         | NULL           |  ← Separate row
1      | 2025-01-20 | ClosingStock   | NULL         | 145.00       | NULL           |  ← Separate row

Result: 4 rows for Tank 1 on 2025-01-20
❌ Problem: Multiple rows per tank per day
❌ Problem: Difficult to get complete daily picture
❌ Problem: Cannot enforce "one entry per day" constraint
```

### AFTER: Single-Row Per Tank Per Day

```
TankID | EntryDate  | EntryType    | OpeningLevel | ClosingLevel | DeliveryAmount | TransferInAmount | ManualCalculatedUsage | ...
-------|------------|--------------|--------------|--------------|----------------|------------------|-----------------------|----
1      | 2025-01-20 | OpeningStock | 50.00        | 145.00       | 100.00         | 30.00            | 20.00                 |

Result: 1 row for Tank 1 on 2025-01-20
✅ Benefit: Single source of truth
✅ Benefit: All daily transactions visible at once
✅ Benefit: Enforced by unique constraint
```

## Database Schema Comparison

### BEFORE
```sql
CREATE TABLE tankstock (
    EntryID INT PRIMARY KEY AUTO_INCREMENT,
    TankID INT NOT NULL,
    EntryDate DATETIME NOT NULL,
    EntryType INT,  -- Determines row type: 1=Opening, 2=Closing, 4=Delivery, etc.
    ManualOpeningLevel DECIMAL(10,2),
    ManualClosingLevel DECIMAL(10,2),
    ...
    -- No unique constraint - allows multiple rows per tank/day
);
```

### AFTER
```sql
CREATE TABLE tankstock (
    EntryID INT PRIMARY KEY AUTO_INCREMENT,
    TankID INT NOT NULL,
    EntryDate DATETIME NOT NULL,
    EntryType INT,  -- Always 1 (OpeningStock) as primary type
    ManualOpeningLevel DECIMAL(10,2),
    ManualClosingLevel DECIMAL(10,2),

    -- NEW FIELDS for single-row architecture
    DeliveryAmount DECIMAL(10,2),        -- Total delivery for the day
    DeliveryId INT,                       -- Reference to delivery record
    TransferInAmount DECIMAL(10,2),       -- Total fuel transferred IN
    TransferOutAmount DECIMAL(10,2),      -- Total fuel transferred OUT
    TransferRecordId INT,                 -- Reference to transfer record
    ...

    -- Unique constraint enforces one row per tank per day
    UNIQUE KEY UQ_tankstock_tank_date (TankID, EntryDate)
);
```

## Code Pattern Comparison

### Creating Opening Stock

#### BEFORE
```csharp
var stockTaking = new Tankstock
{
    TankId = request.TankId,
    EntryDate = DateTime.Now,
    EntryType = VolumeChangeReasonEnum.OpeningStock,
    ManualOpeningLevel = request.OpeningStock
};
_context.Tankstocks.Add(stockTaking);
await _context.SaveChangesAsync();
```

#### AFTER (Same - Creates row)
```csharp
// Check if entry already exists
var exists = await _context.Tankstocks
    .AnyAsync(x => x.TankId == request.TankId && x.EntryDate.Date == date.Date);

if (exists)
    return Error("Entry already exists");

var stockTaking = new Tankstock
{
    TankId = request.TankId,
    EntryDate = DateTime.Now,
    EntryType = VolumeChangeReasonEnum.OpeningStock,
    ManualOpeningLevel = request.OpeningStock
};
_context.Tankstocks.Add(stockTaking);
await _context.SaveChangesAsync();
```

### Recording Closing Stock

#### BEFORE (Created new row)
```csharp
var closingStock = new Tankstock
{
    TankId = request.TankId,
    EntryDate = DateTime.Now,
    EntryType = VolumeChangeReasonEnum.ClosingStock,  // Different EntryType
    ManualClosingLevel = request.ClosingStock
};
_context.Tankstocks.Add(closingStock);  // INSERT new row
await _context.SaveChangesAsync();
```

#### AFTER (Updates existing row)
```csharp
// Find existing row
var existingEntry = await _context.Tankstocks
    .FirstAsync(x => x.TankId == request.TankId && x.EntryDate.Date == date.Date);

// Update same row
existingEntry.ManualClosingLevel = request.ClosingStock;
existingEntry.ClosingMeter = request.ClosingMeter;

_context.Tankstocks.Update(existingEntry);  // UPDATE existing row
await _context.SaveChangesAsync();
```

### Recording Delivery

#### BEFORE (Created separate row)
```csharp
// Only created Delivery record, no TankStock entry
var delivery = new Delivery { ... };
_context.Deliveries.Add(delivery);
await _context.SaveChangesAsync();

// TankStock would be separate manual entry with EntryType=Delivery
```

#### AFTER (Updates TankStock row)
```csharp
// Create Delivery record
var delivery = new Delivery { ... };
_context.Deliveries.Add(delivery);
await _context.SaveChangesAsync();

// Update TankStock row with delivery info
var tankStock = await _context.Tankstocks
    .FirstAsync(x => x.TankId == tankId && x.EntryDate.Date == date.Date);

tankStock.DeliveryAmount = (tankStock.DeliveryAmount ?? 0) + deliveryAmount;
tankStock.DeliveryId = delivery.Id;

_context.Tankstocks.Update(tankStock);
await _context.SaveChangesAsync();
```

## Query Comparison

### Getting Daily Tank Summary

#### BEFORE (Complex aggregation)
```sql
-- Had to aggregate multiple rows
SELECT
    ts.TankID,
    DATE(ts.EntryDate) as Date,
    MAX(CASE WHEN ts.EntryType = 1 THEN ts.ManualOpeningLevel END) as Opening,
    MAX(CASE WHEN ts.EntryType = 2 THEN ts.ManualClosingLevel END) as Closing,
    SUM(CASE WHEN ts.EntryType = 4 THEN ts.ManualAmount END) as Delivery,
    SUM(CASE WHEN ts.EntryType = 5 THEN ts.ManualAmount END) as TransferIn,
    SUM(CASE WHEN ts.EntryType = 6 THEN ts.ManualAmount END) as TransferOut
FROM tankstock ts
WHERE DATE(ts.EntryDate) = '2025-01-20'
GROUP BY ts.TankID, DATE(ts.EntryDate);  -- Required GROUP BY
```

#### AFTER (Simple direct query)
```sql
-- Direct access - no aggregation needed
SELECT
    TankID,
    EntryDate,
    ManualOpeningLevel as Opening,
    ManualClosingLevel as Closing,
    DeliveryAmount as Delivery,
    TransferInAmount as TransferIn,
    TransferOutAmount as TransferOut,
    ManualCalculatedUsage as Dispensing
FROM tankstock
WHERE DATE(EntryDate) = '2025-01-20'
    AND IsDeleted = 0;  -- No GROUP BY needed!
```

## Dispensing Handling

### BEFORE
- Dispensing tracked in `TankVolumeHistory` table only
- Not reflected in `TankStock` table
- Had to join multiple tables to get complete picture

### AFTER
- **Automated Background Service** aggregates dispensing every 15 minutes
- Updates `TankStock.ManualCalculatedUsage` from `FuelRefills` table
- Single query gives complete daily picture including dispensing

```csharp
// Background service runs every 15 minutes
foreach (var tankStock in todaysTankStocks)
{
    var totalDispensing = await _context.FuelRefills
        .Where(fr => fr.TankId == tankStock.TankId && fr.StartDateTime.Date == today)
        .SumAsync(fr => fr.Amount);

    tankStock.ManualCalculatedUsage = totalDispensing;
    await _context.SaveChangesAsync();
}
```

## Data Migration Process

### BEFORE State
```
Tank 1, 2025-01-20: 4 separate rows
Tank 2, 2025-01-20: 3 separate rows
Tank 3, 2025-01-20: 5 separate rows
...
Total: 1,247 rows across 412 tank-dates
```

### Python Consolidation Script
```python
# For each tank-date with multiple rows:
1. Find primary row (OpeningStock entry or earliest)
2. Merge closing stock data
3. Fetch delivery from deliveries table → populate DeliveryAmount
4. Fetch transfers from tanktransfers table → populate TransferIn/Out
5. Update primary row with all data
6. Soft delete redundant rows (IsDeleted=1)
```

### AFTER State
```
Tank 1, 2025-01-20: 1 consolidated row (3 soft deleted)
Tank 2, 2025-01-20: 1 consolidated row (2 soft deleted)
Tank 3, 2025-01-20: 1 consolidated row (4 soft deleted)
...
Total: 412 active rows (1 per tank-date), 835 soft deleted
```

## Constraint Protection

### BEFORE
```sql
-- No protection against duplicates
INSERT INTO tankstock (TankID, EntryDate, EntryType, ...) VALUES (1, '2025-01-20', 1, ...);  -- OK
INSERT INTO tankstock (TankID, EntryDate, EntryType, ...) VALUES (1, '2025-01-20', 1, ...);  -- OK (❌ allowed)
INSERT INTO tankstock (TankID, EntryDate, EntryType, ...) VALUES (1, '2025-01-20', 2, ...);  -- OK (❌ allowed)
```

### AFTER
```sql
-- Unique constraint protects against duplicates
INSERT INTO tankstock (TankID, EntryDate, ...) VALUES (1, '2025-01-20', ...);  -- OK
INSERT INTO tankstock (TankID, EntryDate, ...) VALUES (1, '2025-01-20', ...);  -- ERROR (✅ prevented)
-- Error: Duplicate entry '1-2025-01-20' for key 'UQ_tankstock_tank_date'
```

## Complete Daily Workflow Example

### BEFORE (Multi-row approach)
```
8:00 AM - Opening Stock (50L)
  → INSERT tankstock: EntryType=1, OpeningLevel=50

10:00 AM - Delivery (100L)
  → INSERT tankstock: EntryType=4, ManualAmount=100

2:00 PM - Transfer In (30L)
  → INSERT tankstock: EntryType=5, ManualAmount=30

4:00 PM - Transfer Out (15L)
  → INSERT tankstock: EntryType=6, ManualAmount=15

6:00 PM - Closing Stock (145L)
  → INSERT tankstock: EntryType=2, ClosingLevel=145

Result: 5 separate rows for Tank 1 on this date
Query complexity: Must GROUP BY and aggregate
```

### AFTER (Single-row approach)
```
8:00 AM - Opening Stock (50L)
  → INSERT tankstock: OpeningLevel=50, EntryType=1

10:00 AM - Delivery (100L)
  → UPDATE tankstock: DeliveryAmount=100, DeliveryId=X

2:00 PM - Transfer In (30L)
  → UPDATE tankstock: TransferInAmount=30

4:00 PM - Transfer Out (15L)
  → UPDATE tankstock: TransferOutAmount=15

Every 15 min - Background Service
  → UPDATE tankstock: ManualCalculatedUsage=20 (from FuelRefills)

6:00 PM - Closing Stock (145L)
  → UPDATE tankstock: ClosingLevel=145, ClosingMeter=12500

Result: 1 row for Tank 1 with all data
Query: SELECT * FROM tankstock WHERE TankID=1 AND DATE(EntryDate)='2025-01-20'

Row contents:
  Opening: 50L
  Closing: 145L
  Delivery: 100L
  TransferIn: 30L
  TransferOut: 15L
  Dispensing: 20L

Validation: 50 + 100 + 30 - 15 - 20 = 145L ✓
```

## Benefits Summary

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Rows per tank/day** | 2-5 rows | 1 row |
| **Query complexity** | Requires GROUP BY aggregation | Simple SELECT |
| **Data integrity** | No constraint protection | Unique constraint enforced |
| **Dispensing data** | Not in TankStock | Automated every 15 min |
| **Reporting** | Complex joins needed | Direct access |
| **Daily summary** | 5+ table joins | Single table query |
| **Reconciliation** | Manual aggregation | Built into row |
| **Database size** | More rows | Fewer rows |
| **Code complexity** | Multiple INSERT patterns | Clear workflow |

## Migration Safety

✅ **Backup Created:** `tankstock_backup_YYYYMMDD_HHMMSS`
✅ **Soft Delete:** Old rows marked `IsDeleted=1` (can be restored)
✅ **Rollback Available:** Rename backup table to restore
✅ **Validation:** Script verifies no duplicates remain
✅ **Logging:** Complete audit trail of consolidation

---

**Conclusion:** Single-row architecture provides cleaner data model, simpler queries, better integrity, and improved performance.
