# Tank Volume History Soft Delete Implementation Requirements

## Overview
This document outlines the requirements and implementation details for implementing soft delete functionality in the Tank Volume History system, including related entities and validation mechanisms.

## 1. Background

### Problem Statement
The current system uses hard deletion for `TankVolumeHistory` records, which:
- Permanently removes historical data that may be needed for auditing
- Makes it impossible to recover accidentally deleted records
- Creates data integrity issues when related transactions are deleted
- Doesn't provide an audit trail of deletion activities

### Solution
Implement soft delete functionality that:
- Preserves historical data while marking it as deleted
- Maintains referential integrity
- Provides audit trails for all deletion activities
- Validates future records policy before allowing deletions
- Handles cascade operations for related entities

## 2. Entity Changes

### 2.1 TankVolumeHistory Entity
**File**: `FMS.Domain.Entities.TankVolumeHistory.cs`

#### New Properties Added:
```csharp
/// <summary>
/// Gets or sets a value indicating whether this record is soft deleted.
/// </summary>
public bool? IsDeleted { get; set; }

/// <summary>
/// Gets or sets the date and time when this record was deleted.
/// </summary>
public DateTime? DeletedAt { get; set; }

/// <summary>
/// Gets or sets the user who deleted this record.
/// </summary>
public string? DeletedBy { get; set; }

/// <summary>
/// Navigation property for the user who deleted this record.
/// </summary>
public virtual User? DeletedByNavigation { get; set; }
```

### 2.2 Database Configuration
**File**: `FMS.Persistence.EntityConfigurations.TankVolumeHistoryConfiguration.cs`

#### Configuration Changes:
```csharp
// Soft delete fields
builder.Property(e => e.IsDeleted)
    .HasDefaultValueSql("'0'")
    .IsRequired(false);

builder.Property(e => e.DeletedAt)
    .HasColumnType("datetime")
    .IsRequired(false);

builder.Property(e => e.DeletedBy)
    .HasMaxLength(50)
    .IsRequired(false);

// Navigation property for deleted by user
builder.HasOne(d => d.DeletedByNavigation)
    .WithMany()
    .HasForeignKey(d => d.DeletedBy)
    .HasConstraintName("FK_TankVolumeHistory_DeletedBy_User");

// Global query filter to exclude deleted records
builder.HasQueryFilter(tvh => !tvh.IsDeleted == true);
```

## 3. Service Layer Changes

### 3.1 DeleteTankVolumeHistoryCommand
**File**: `FMS.Application.Features.TankManagement.TankVolumeHistory.Commands.DeleteTankVolumeHistoryCommand.cs`

#### Key Features:
- **Soft Delete Implementation**: Records are marked as deleted instead of being physically removed
- **Future Records Validation**: Integrates with `TankStockFutureRecordsService` to validate deletion policy
- **Cascade Deletion**: Handles related entity deletions based on `VolumeChangeReasonEnum`
- **Audit Trail**: Records who deleted the record and when

#### Command Parameters:
```csharp
public record DeleteTankVolumeHistoryCommand (
    string DeletedBy,                    // Required: User performing the deletion
    int? Id = null,                      // Optional: Specific record ID
    int? TankId = null,                  // Optional: Filter by tank
    string? ReferenceType = null,        // Optional: Filter by reference type
    int? ReferenceId = null,             // Optional: Filter by reference ID
    DateTime? FromDate = null,           // Optional: Date range start
    DateTime? ToDate = null,             // Optional: Date range end
    bool ValidateFutureRecords = true    // Whether to validate future records policy
) : IRequest<FMSResponseMessage>;
```

#### Validation Logic:
1. **Input Validation**: Ensures `DeletedBy` is specified and at least one filter criterion is provided
2. **Future Records Validation**: Checks against future records policy using `TankStockFutureRecordsService`
3. **Policy Enforcement**: Blocks deletion if policy prohibits it, warns if confirmation required

#### Cascade Deletion Mapping:
| Volume Change Reason | Related Entity | Action |
|---------------------|----------------|---------|
| `Adjustment` | `StockAdjustment` | Soft delete related record |
| `Delivery` | `Delivery` | Soft delete related record |
| `Dispensing`, `AutomatedDispensing` | `FuelRefill` | Soft delete related record |
| `TransferIn`, `TransferOut` | `TankTransfer` | Soft delete related record |
| `OpeningStock`, `ClosingStock`, `Reconciliation`, `AutomatedReconciliation` | None | No cascade action |

### 3.2 ProcessTankStockChangeCommand Updates
**File**: `FMS.Application.Features.TankManagement.TankVolumeHistory.Commands.ProcessTankStockChangeCommand.cs`

#### Changes:
- **Delete Action**: Now performs soft delete instead of hard delete
- **Query Filtering**: Excludes soft-deleted records when calculating previous volumes

### 3.3 UpdateTankVolumeHistoryCommand Updates
**File**: `FMS.Application.Features.TankManagement.TankVolumeHistory.Commands.UpdateTankVolumeHistoryCommand.cs`

#### Changes:
- **Query Filtering**: Only processes non-deleted records during volume recalculation
- **Base Volume Calculation**: Excludes soft-deleted records when determining base volumes

### 3.4 TankVolumeAdjustmentService Updates
**File**: `FMS.Application.Services.TankVolumeAdjustmentService.cs`

#### Changes:
- **Rebase Logic**: Only updates non-deleted subsequent transactions

## 4. Integration with Future Records Service

### 4.1 TankStockFutureRecordsService Integration
The soft delete operation integrates with the existing `TankStockFutureRecordsService` to:

#### Validation Process:
1. **Policy Check**: Validates each record against the current future records policy
2. **Block if Required**: Prevents deletion if policy is set to "BLOCK"
3. **Warn if Needed**: Logs warnings for policies requiring user confirmation
4. **Detailed Warnings**: Provides detailed impact analysis when configured

#### Policy Enforcement:
- **BLOCK**: Deletion is prevented, returns error message
- **WARN_RECONCILE**: Proceeds with warning, logs reconciliation requirement
- **WARN_RECALCULATE**: Proceeds with warning, logs recalculation requirement
- **ALLOW_RECALCULATE**: Proceeds silently with automatic recalculation

## 5. Database Migration Requirements

### 5.1 Schema Changes
```sql
-- Add soft delete columns to tankvolumehistory table
ALTER TABLE tankvolumehistory
ADD COLUMN IsDeleted BOOLEAN DEFAULT FALSE,
ADD COLUMN DeletedAt DATETIME NULL,
ADD COLUMN DeletedBy VARCHAR(50) NULL;

-- Add foreign key constraint for DeletedBy
ALTER TABLE tankvolumehistory
ADD CONSTRAINT FK_TankVolumeHistory_DeletedBy_User
FOREIGN KEY (DeletedBy) REFERENCES aspnetusers(Id);

-- Add index for soft delete queries
CREATE INDEX IX_TankVolumeHistory_IsDeleted_TankId_Timestamp
ON tankvolumehistory(IsDeleted, TankId, Timestamp);
```

### 5.2 Data Migration Considerations
- Existing records should have `IsDeleted = FALSE` by default
- No data loss during migration
- Consider backup strategy before applying changes

## 6. Related Entity Soft Delete Implementation

### 6.1 Required Entity Updates
The following entities need soft delete properties added:

#### StockAdjustment Entity
```csharp
public bool? IsDeleted { get; set; }
public DateTime? DeletedAt { get; set; }
public string? DeletedBy { get; set; }
public virtual User? DeletedByNavigation { get; set; }
```

#### Delivery Entity
```csharp
public bool? IsDeleted { get; set; }
public DateTime? DeletedAt { get; set; }
public string? DeletedBy { get; set; }
public virtual User? DeletedByNavigation { get; set; }
```

#### FuelRefill Entity
```csharp
public bool? IsDeleted { get; set; }
public DateTime? DeletedAt { get; set; }
public string? DeletedBy { get; set; }
public virtual User? DeletedByNavigation { get; set; }
```

#### TankTransfer Entity
```csharp
public bool? IsDeleted { get; set; }
public DateTime? DeletedAt { get; set; }
public string? DeletedBy { get; set; }
public virtual User? DeletedByNavigation { get; set; }
```

### 6.2 Configuration Updates Required
Each entity needs:
- Entity configuration updates for soft delete properties
- Global query filters to exclude deleted records
- Navigation property configurations
- Database migration scripts

## 7. Testing Requirements

### 7.1 Unit Tests
- **Soft Delete Functionality**: Verify records are marked as deleted, not removed
- **Query Filtering**: Ensure deleted records are excluded from normal queries
- **Cascade Operations**: Test related entity soft deletion
- **Validation Logic**: Test future records policy enforcement
- **Audit Trail**: Verify deletion metadata is recorded correctly

### 7.2 Integration Tests
- **End-to-End Deletion**: Test complete deletion workflow
- **Volume Recalculation**: Verify calculations exclude deleted records
- **Policy Integration**: Test with different future records policies
- **Error Handling**: Test error scenarios and rollback mechanisms

### 7.3 Performance Tests
- **Query Performance**: Ensure query filters don't significantly impact performance
- **Large Dataset Tests**: Test with large volumes of historical data
- **Concurrent Operations**: Test thread safety and concurrent access

## 8. Deployment Considerations

### 8.1 Backwards Compatibility
- Existing queries automatically exclude deleted records via global query filter
- API contracts remain unchanged
- No breaking changes to existing functionality

### 8.2 Configuration Settings
Update system configuration to include:
- Default soft delete behavior settings
- Cascade deletion policy settings
- Audit retention policies

### 8.3 Monitoring and Alerting
- Monitor soft delete operations
- Alert on cascade deletion failures
- Track deletion audit trail usage

## 9. Security Considerations

### 9.1 Access Control
- Only authorized users should be able to delete records
- Consider separate permission for bulk deletion operations
- Audit all deletion activities

### 9.2 Data Privacy
- Ensure soft-deleted data complies with data retention policies
- Consider hard deletion for sensitive data after retention period
- Implement data anonymization where required

## 10. Future Enhancements

### 10.1 Restore Functionality
- Implement restore capability for soft-deleted records
- Add validation for restore operations
- Handle volume recalculation on restore

### 10.2 Batch Operations
- Implement batch soft delete operations
- Add progress tracking for large deletion operations
- Optimize for performance with large datasets

### 10.3 Advanced Audit Features
- Implement detailed change tracking
- Add before/after snapshots for deleted records
- Create deletion impact reports

## 11. Documentation Updates Required

### 11.1 API Documentation
- Update API documentation to reflect soft delete behavior
- Document new command parameters
- Add examples for deletion operations

### 11.2 User Documentation
- Update user manuals to explain soft delete functionality
- Document recovery procedures
- Add troubleshooting guides

### 11.3 Technical Documentation
- Update database schema documentation
- Document configuration options
- Create deployment guides

## 12. Implementation Checklist

### Phase 1: Core Soft Delete
- [x] Add soft delete properties to TankVolumeHistory entity
- [x] Update entity configuration with query filters
- [x] Implement DeleteTankVolumeHistoryCommand with soft delete logic
- [x] Update related services to exclude deleted records
- [x] Integrate with TankStockFutureRecordsService for validation

### Phase 2: Related Entities (TODO)
- [ ] Add soft delete properties to StockAdjustment entity
- [ ] Add soft delete properties to Delivery entity
- [ ] Add soft delete properties to FuelRefill entity
- [ ] Add soft delete properties to TankTransfer entity
- [ ] Update cascade deletion logic to use actual soft delete

### Phase 3: Testing and Documentation
- [ ] Create comprehensive unit tests
- [ ] Develop integration tests
- [ ] Performance testing with large datasets
- [ ] Update API documentation
- [ ] Create user documentation

### Phase 4: Deployment
- [ ] Create database migration scripts
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing
- [ ] Deploy to production
- [ ] Monitor and validate functionality

## Conclusion

This soft delete implementation provides a robust, auditable, and recoverable deletion mechanism for the Tank Volume History system. The integration with the future records validation service ensures data integrity while maintaining the flexibility needed for complex fuel management scenarios.

The phased approach allows for incremental implementation and testing, reducing risk while delivering immediate benefits for the core tank volume history functionality.
