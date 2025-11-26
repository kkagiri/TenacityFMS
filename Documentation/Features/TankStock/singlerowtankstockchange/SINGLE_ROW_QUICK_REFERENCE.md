# TankStock Single-Row-Per-Day - Quick Reference

## Summary

Successfully implemented single-row-per-tank-per-day architecture for TankStock table.

## Files Changed

### Database Schema
- **Entity:** `FMS.Domain/Entities/Features/TankStockManagement/Tankstock.cs`
  - Added: `DeliveryAmount`, `DeliveryId`, `TransferInAmount`, `TransferOutAmount`, `TransferRecordId`

- **Configuration:** `FMS.Persistence/EntityConfigurations/TankstockConfiguration.cs`
  - Added column configurations with precision, comments
  - Added unique index: `UQ_tankstock_tank_date (TankId, EntryDate)`

### Command Handlers
- **OpeningStockCommand.cs** - Added duplicate check, prevents multiple entries per tank/day
- **ClosingStockCommand.cs** - Changed from INSERT to UPDATE existing row
- **CreateDeliveryCommand.cs** - Updates TankStock.DeliveryAmount after creating delivery
- **CreateTankTransfer.cs** - Updates both source and destination TankStock rows

### Background Service
- **DispensingAggregationService.cs** - Runs every 15 minutes, aggregates FuelRefills into ManualCalculatedUsage

### Scripts & Documentation
- **SQL Migration:** `Documentation/Features/TankStock/database/tankstock_single_row_migration.sql`
- **Python Consolidation:** `scripts/database/consolidate_tankstock_entries.py`
- **Implementation Guide:** `Documentation/Features/TankStock/SINGLE_ROW_PER_DAY_IMPLEMENTATION_GUIDE.md`

## Deployment Steps

1. **Run SQL migration** (adds new columns)
2. **Run Python consolidation script** (merges existing multi-row entries)
3. **Deploy updated code** (with DispensingAggregationService registered)
4. **Add unique constraint** (prevents future duplicates)

## Daily Workflow

```
1. Morning: Create Opening Stock → Creates new TankStock row
2. Throughout Day:
   - Delivery → Updates same row (DeliveryAmount)
   - Transfer Out → Updates same row (TransferOutAmount)
   - Transfer In → Updates same row (TransferInAmount)
   - Dispensing → Background service updates (ManualCalculatedUsage) every 15 min
3. Evening: Create Closing Stock → Updates same row (ManualClosingLevel)

Result: Single row per tank with all daily data
```

## Key Benefits

✅ One row per tank per day (enforced by unique constraint)
✅ No duplicate entries
✅ Easier reporting and reconciliation
✅ Automated dispensing aggregation
✅ Complete daily transaction view in single row

## Register Background Service

Add to `Program.cs` or `Startup.cs`:

```csharp
services.AddHostedService<DispensingAggregationService>();
```

## Verification Queries

```sql
-- Check for duplicates (should be 0)
SELECT TankID, DATE(EntryDate), COUNT(*)
FROM tankstock
WHERE IsDeleted = 0
GROUP BY TankID, DATE(EntryDate)
HAVING COUNT(*) > 1;

-- View today's consolidated data
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
WHERE DATE(EntryDate) = CURDATE() AND IsDeleted = 0;
```

## Rollback

If issues occur, restore from backup:

```sql
DROP TABLE tankstock;
RENAME TABLE tankstock_backup_YYYYMMDD_HHMMSS TO tankstock;
```

Then redeploy old code.

---

**For detailed information, see:** `SINGLE_ROW_PER_DAY_IMPLEMENTATION_GUIDE.md`
