# ReconciliationDiscrepancy Database Fix

## Problem
The application was failing with the error:
```
Unknown column 'ReconciliationPolicyId' in 'field list'
```

This occurred when trying to create `ReconciliationDiscrepancy` records during closing stock operations.

## Root Cause
1. The `ReconciliationDiscrepancy` entity had a **required** `PolicyExecutionId` property
2. Manual closing stock discrepancies were being created with `PolicyExecutionId = 0`
3. Entity Framework was trying to track navigation properties and inserting a non-existent `ReconciliationPolicyId` column

## Solution

### Code Changes
1. **Entity Model** (`ReconciliationDiscrepancy.cs`):
   - Changed `PolicyExecutionId` from `int` to `int?` (nullable)
   - Changed `PolicyExecution` navigation property to nullable

2. **Entity Configuration** (`ReconciliationDiscrepancyConfiguration.cs`):
   - Removed `.IsRequired()` from `PolicyExecutionId` property
   - Added `.OnDelete(DeleteBehavior.SetNull)` to foreign key relationship

3. **ClosingStockCommand** (`ClosingStockCommand.cs`):
   - Changed `PolicyExecutionId = 0` to `PolicyExecutionId = null`

### Database Changes
Execute the migration script:
```sql
-- Run this file:
Documentation/Features/AutomatedReconciliation/database/00_EXECUTE_THIS_reconciliationdiscrepancy_setup.sql
```

This script will:
- Create the table if it doesn't exist (with correct nullable column)
- Fix existing tables by making `PolicyExecutionId` nullable
- Update foreign key constraint to `ON DELETE SET NULL`

## Why This Fix Works

### Before (Broken):
- Manual closing stock creates discrepancy with `PolicyExecutionId = 0`
- Foreign key constraint requires a valid `PolicyExecutionId`
- EF tracking tries to insert related policy data
- Database rejects because referenced execution doesn't exist

### After (Fixed):
- Manual closing stock creates discrepancy with `PolicyExecutionId = null`
- No foreign key violation (NULL is allowed)
- EF doesn't track navigation property when value is null
- Automated policy-driven discrepancies can still use valid `PolicyExecutionId`

## Usage Scenarios

### 1. Manual Closing Stock Discrepancies
Created during daily closing stock operations:
```csharp
new ReconciliationDiscrepancy
{
    PolicyExecutionId = null,  // ✅ No policy execution involved
    TankId = tankId,
    // ... other properties
}
```

### 2. Automated Policy-Driven Discrepancies
Created by automated reconciliation policies:
```csharp
new ReconciliationDiscrepancy
{
    PolicyExecutionId = executionId,  // ✅ Links to policy execution
    TankId = tankId,
    // ... other properties
}
```

## Verification

After running the migration, verify the fix:

```sql
-- Check column definition
DESCRIBE reconciliationdiscrepancy;

-- PolicyExecutionId should show:
-- Type: int(11)
-- Null: YES
-- Default: NULL

-- Check existing records
SELECT
    Id,
    PolicyExecutionId,
    TankId,
    DetectedAt,
    AbsoluteVariance,
    Severity,
    IsResolved
FROM reconciliationdiscrepancy
ORDER BY DetectedAt DESC
LIMIT 10;
```

## Related Files
- Entity: `FMS.Domain/Entities/Features/AutomaticReconciliation/ReconciliationDiscrepancy.cs`
- Configuration: `FMS.Persistence/EntityConfigurations/ReconciliationDiscrepancyConfiguration.cs`
- Handler: `FMS.Application/Features/TankManagement/TankStock/Commands/ClosingStockCommand.cs`
- Migration: `Documentation/Features/AutomatedReconciliation/database/00_EXECUTE_THIS_reconciliationdiscrepancy_setup.sql`

## Testing
After applying the fix:
1. Run the SQL migration script
2. Restart the application
3. Create a closing stock entry
4. Verify no database errors occur
5. Check that discrepancy records are created with `PolicyExecutionId = NULL`
