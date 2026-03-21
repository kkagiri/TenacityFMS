# DeleteTankVolumeHistoryCommand Volume Change Reason Implementation

## Overview

This document outlines the implementation of soft delete cascade functionality for each `VolumeChangeReason` in the `DeleteTankVolumeHistoryCommand`. Each volume change reason type now properly handles cascade deletion of related entities with comprehensive validation and audit trail compliance.

## Implementation Status

### ✅ Completed: Core Infrastructure

1. **Added Soft Delete Properties to Related Entities**:
   - `StockAdjustment`: Added `IsDeleted`, `DeletedAt`, `DeletedBy`, and `DeletedByNavigation`
   - `Delivery`: Added `IsDeleted`, `DeletedAt`, `DeletedBy`, and `DeletedByNavigation`
   - `FuelRefill`: Added `IsDeleted`, `DeletedAt`, `DeletedBy`, and `DeletedByNavigation`
   - `TankTransfer`: Added `IsDeleted`, `DeletedAt`, `DeletedBy`, and `DeletedByNavigation`

2. **Updated Entity Configurations**:
   - `StockAdjustmentConfiguration`: Added soft delete fields, global query filter, and navigation
   - `DeliveryConfiguration`: Added soft delete fields, global query filter, and navigation
   - `FuelRefillConfiguration`: Created new configuration with soft delete support
   - `TankTransferConfiguration`: Added soft delete fields, global query filter, and navigation

3. **Enhanced User Entity**:
   - Added navigation properties for deleted entities: `StockAdjustmentsDeleted`, `DeliveriesDeleted`, `FuelRefillsDeleted`, `TankTransfersDeleted`

### ✅ Completed: Volume Change Reason Handlers

#### 1. VolumeChangeReasonEnum.Adjustment
**Handler**: `HandleStockAdjustmentDeletionAsync`
- **Entity**: `StockAdjustment`
- **Implementation**: Soft deletes the related stock adjustment record
- **Validation**: None required at entity level (TankVolumeHistory validation handles audit compliance)
- **Logging**: Comprehensive info/warning logging

#### 2. VolumeChangeReasonEnum.Delivery
**Handler**: `HandleDeliveryDeletionAsync`
- **Entity**: `Delivery`
- **Implementation**: Soft deletes the related delivery record
- **Business Logic**: Maintains delivery history for supply chain tracking
- **Logging**: Comprehensive info/warning logging

#### 3. VolumeChangeReasonEnum.Dispensing / AutomatedDispensing
**Handler**: `HandleFuelRefillDeletionAsync`
- **Entity**: `FuelRefill`
- **Implementation**: Soft deletes the related fuel refill record
- **Business Logic**: Preserves vehicle fueling records for fleet management
- **Logging**: Comprehensive info/warning logging

#### 4. VolumeChangeReasonEnum.TransferIn / TransferOut
**Handler**: `HandleTransferDeletionAsync`
- **Entity**: `TankTransfer`
- **Implementation**: Soft deletes the related tank transfer record
- **Business Logic**: Maintains transfer audit trail between tanks
- **Logging**: Comprehensive info/warning logging

#### 5. VolumeChangeReasonEnum.OpeningStock / ClosingStock / Reconciliation / AutomatedReconciliation
**Handler**: No cascade deletion required
- **Implementation**: These operations typically don't have separate related records
- **Logging**: Informational log that no cascade deletion is needed

### ✅ Completed: Enhanced Validation System

1. **Integrated TankVolumeHistoryDeletionService**:
   - Added service injection to command handler constructor
   - Validates each record for financial audit compliance before deletion
   - Checks for subsequent adjustments that would be affected
   - Provides detailed validation results with recommended actions

2. **Dual Validation Approach**:
   - **Deletion Validation Service**: Ensures financial ledger compliance and audit trail integrity
   - **Future Records Service**: Validates against business policy for historical entries
   - Combined validation provides comprehensive protection against data integrity issues

3. **Enhanced Error Handling**:
   - Comprehensive try-catch blocks in each cascade handler
   - Detailed logging for successful operations and errors
   - Proper error propagation with meaningful messages

## Database Schema Changes Required

### New Columns to Add

```sql
-- StockAdjustment table
ALTER TABLE stock_adjustments
ADD COLUMN is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by VARCHAR(450) NULL,
ADD INDEX idx_stock_adjustments_is_deleted (is_deleted),
ADD CONSTRAINT fk_stock_adjustments_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users(Id) ON DELETE SET NULL;

-- Delivery table
ALTER TABLE delivery
ADD COLUMN is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by VARCHAR(450) NULL,
ADD INDEX idx_delivery_is_deleted (is_deleted),
ADD CONSTRAINT delivery_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users(Id) ON DELETE SET NULL;

-- FuelRefill table
ALTER TABLE fuelrefill
ADD COLUMN is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by VARCHAR(450) NULL,
ADD INDEX idx_fuelrefill_is_deleted (is_deleted),
ADD CONSTRAINT fuelrefill_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users(Id) ON DELETE SET NULL;

-- TankTransfer table
ALTER TABLE tanktransfer
ADD COLUMN is_deleted TINYINT(1) DEFAULT 0,
ADD COLUMN deleted_at DATETIME NULL,
ADD COLUMN deleted_by VARCHAR(450) NULL,
ADD INDEX idx_tanktransfer_is_deleted (is_deleted),
ADD CONSTRAINT FK_TankTransfer_DeletedBy
    FOREIGN KEY (deleted_by) REFERENCES users(Id) ON DELETE SET NULL;
```

## Usage Examples

### Basic Single Record Deletion
```csharp
var command = new DeleteTankVolumeHistoryCommand(
    DeletedBy: "user@example.com",
    Id: 123,
    ValidateFutureRecords: true
);

var result = await mediator.Send(command);
```

### Bulk Deletion by Date Range
```csharp
var command = new DeleteTankVolumeHistoryCommand(
    DeletedBy: "admin@example.com",
    TankId: 5,
    FromDate: DateTime.Now.AddDays(-30),
    ToDate: DateTime.Now.AddDays(-1),
    ValidateFutureRecords: true
);

var result = await mediator.Send(command);
```

### Deletion by Reference Type
```csharp
var command = new DeleteTankVolumeHistoryCommand(
    DeletedBy: "system@example.com",
    ReferenceType: "StockAdjustment",
    ReferenceId: 456,
    ValidateFutureRecords: true
);

var result = await mediator.Send(command);
```

## Validation Flow

1. **Input Validation**: Ensures required parameters are provided
2. **Record Discovery**: Finds all TankVolumeHistory records matching criteria
3. **Audit Compliance Validation**: Uses `TankVolumeHistoryDeletionService` to check:
   - Whether deletion affects subsequent adjustments
   - Impact on audit trail integrity
   - Financial ledger compliance
4. **Policy Validation**: Uses `TankStockFutureRecordsService` to validate:
   - Business rules for historical entry modification
   - Future records policy compliance
5. **Cascade Validation**: Each related entity is validated before cascade deletion
6. **Transaction Safety**: All operations occur within database transaction context

## Error Handling Scenarios

### Validation Failures
- **Audit Trail Impact**: If deletion would affect subsequent adjustments, operation is blocked
- **Policy Violations**: If business rules prevent historical modification, operation is blocked
- **Missing References**: If related entity not found, warning logged but operation continues

### System Errors
- **Database Connectivity**: Transaction rollback with detailed error logging
- **Constraint Violations**: Graceful handling with rollback and error reporting
- **Service Unavailability**: Fallback behavior with appropriate error messages

## Logging and Monitoring

### Information Logs
- Successful soft deletions with record counts
- Cascade deletion operations
- Validation warnings for edge cases

### Warning Logs
- Records with subsequent adjustments being deleted
- Future records policy confirmations required
- Missing related entities for cascade deletion

### Error Logs
- Validation failures with detailed reasons
- Database operation failures
- Service unavailability issues

## Future Enhancements

### Immediate (Next Sprint)
1. **Database Migration Scripts**: Create production-ready migration scripts
2. **Service Registration**: Add `ITankVolumeHistoryDeletionService` to DI container
3. **Integration Testing**: Comprehensive tests for all volume change reason scenarios

### Medium Term
1. **Batch Processing**: Support for large-scale deletion operations
2. **Undo Functionality**: Restore soft-deleted records with audit trail
3. **Performance Optimization**: Bulk operations and query optimization

### Long Term
1. **Archive Strategy**: Move old soft-deleted records to archive tables
2. **Compliance Reporting**: Generate reports on deletion activities
3. **Advanced Validation**: ML-based anomaly detection for deletion patterns

## Dependencies

### Required Services
- `ITankVolumeHistoryDeletionService`: Financial audit compliance validation
- `TankStockFutureRecordsService`: Business policy validation
- `IMediator`: Command/query handling
- `GpsdataContext`: Database operations

### Entity Framework Features
- Global Query Filters: Automatic exclusion of soft-deleted records
- Navigation Properties: Relationship management for audit trails
- Transaction Support: Ensure data consistency across operations

## Testing Considerations

### Unit Tests Required
1. Each volume change reason handler
2. Validation service integration
3. Error handling scenarios
4. Logging verification

### Integration Tests Required
1. End-to-end deletion workflows
2. Database constraint validation
3. Transaction rollback scenarios
4. Performance under load

### Manual Testing Scenarios
1. Production data validation
2. User interface integration
3. Permission and security validation
4. Audit trail verification

## Conclusion

The implementation provides a comprehensive, audit-compliant soft delete system for tank volume history records with proper cascade handling for all volume change reason types. The dual validation approach ensures both financial compliance and business policy adherence while maintaining data integrity through proper transaction management and error handling.

The system is ready for database migration and integration testing, with clear paths for future enhancements and monitoring capabilities.
