# Bulk Import Test Data - Valid Scenario

## Test File: Valid_Data_Sample.xlsx

### Description
This test file contains valid data with no anomalies. All entries should pass validation and import successfully.

### Test Data

| Row# | Tank Name | Date | Opening Stock | Dispensing | Transfer IN | Transfer OUT | Delivery | Closing Stock | Opening Meter | Closing Meter | Notes |
|------|-----------|------|---------------|------------|-------------|--------------|----------|---------------|---------------|---------------|-------|
| 1 | Tank 1 | 2024-01-01 | 10000 | 5000 | 0 | 0 | 0 | 5000 | 1000000 | 1005000 | Regular operations |
| 2 | Tank 1 | 2024-01-02 | 5000 | 3000 | 0 | 0 | 8000 | 10000 | 1005000 | 1008000 | Delivery + sales |
| 3 | Tank 1 | 2024-01-03 | 10000 | 4000 | 0 | 0 | 0 | 6000 | 1008000 | 1012000 | Normal day |
| 4 | Tank 2 | 2024-01-01 | 8000 | 2000 | 0 | 1000 | 0 | 5000 | 500000 | 502000 | Transfer out |
| 5 | Tank 2 | 2024-01-02 | 5000 | 1500 | 0 | 0 | 5000 | 8500 | 502000 | 503500 | Delivery |
| 6 | Tank 3 | 2024-01-01 | 12000 | 6000 | 1000 | 0 | 0 | 7000 | 750000 | 756000 | Transfer in from Tank 2 |
| 7 | Tank 3 | 2024-01-02 | 7000 | 4000 | 0 | 0 | 0 | 3000 | 756000 | 760000 | Regular sales |

### Expected Results
- **Total Rows**: 7
- **Valid Rows**: 7
- **Rows with Errors**: 0
- **Anomalies**: 0
- **Import Status**: Success
- **Imported Rows**: 7
- **Skipped Rows**: 0

### Validation Checks
✅ All tank names exist
✅ All dates are valid (not in future)
✅ Daily balance correct (within 50L or 2%)
✅ Continuity maintained (opening = previous closing)
✅ Meter readings are progressive
✅ Meter mismatch within tolerance (5%, 20L minimum)
✅ No capacity overflow
✅ No negative stock
✅ Transfer reciprocity (Tank 2 OUT 1000 = Tank 3 IN 1000)
✅ Deliveries fit in available space
✅ Dispensing doesn't exceed available stock

### Business Logic Checks
- Row 1: Simple opening + dispensing = closing
- Row 2: Continuity check (5000 opening matches Row 1 closing)
- Row 3: Continuity check (10000 opening matches Row 2 closing)
- Row 4: Transfer out reduces stock
- Row 5: Delivery increases stock
- Row 6: Transfer in increases stock (matches Row 4 transfer out)
- Row 7: Continuity check

### Database Impact
**TankStock entries created**: 7 rows × average 3-4 entries = ~24 tankstock records
- Opening stock entries: 7
- Closing stock entries: 7
- Dispensing entries: 7
- Delivery entries: 2 (rows 2, 5)
- Transfer IN entries: 1 (row 6)
- Transfer OUT entries: 1 (row 4)

**Total**: 25 tankstock records

### ImportBatchId
All entries will share the same ImportBatchId (GUID generated at runtime)

### Import Tracking Fields
```
ImportBatchId: "550e8400-e29b-41d4-a716-446655440000" (example)
ImportedAt: "2024-11-13T10:30:00Z"
ImportSource: "BulkImport"
```
