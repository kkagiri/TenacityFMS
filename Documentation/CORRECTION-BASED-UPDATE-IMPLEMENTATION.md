# Tank Management Correction-Based Update Implementation

## Overview

We have implemented a **correction-based update pattern** for Tank Management volume change entities instead of direct updates. This approach maintains full audit trail compliance by:

1. **Soft deleting** the original record (marking as deleted without physical removal)
2. **Creating a new correction entry** with updated values and reference to the original
3. **Maintaining complete audit trail** of both original and corrected transactions

## Entities Updated

### ✅ Domain Entities Enhanced

All primary volume change entities now include correction tracking properties:

#### 1. **Delivery Entity** (`FMS.Domain.Entities.Delivery`)
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties
- ✅ Added self-referencing navigation properties for correction relationships
- ✅ Enhanced with soft delete properties

#### 2. **FuelRefill Entity** (`FMS.Domain.Entities.FuelRefill`)
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties
- ✅ Added self-referencing navigation properties for correction relationships
- ✅ Enhanced with soft delete properties

#### 3. **StockAdjustment Entity** (`FMS.Domain.Entities.StockAdjustment`)
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties
- ✅ Added self-referencing navigation properties for correction relationships
- ✅ Enhanced with soft delete properties

#### 4. **TankTransfer Entity** (`FMS.Domain.TankTransfer`)
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties
- ✅ Added self-referencing navigation properties for correction relationships
- ✅ Enhanced with soft delete properties

### ✅ Entity Framework Configurations

#### 1. **DeliveryConfiguration**
- ✅ Added correction property mappings
- ✅ Added self-referencing foreign key relationships
- ✅ Enhanced soft delete configuration

#### 2. **FuelRefillConfiguration**
- ✅ Added correction property mappings
- ✅ Added self-referencing foreign key relationships
- ✅ Enhanced soft delete configuration

#### 3. **StockAdjustmentConfiguration** (Needs Update)
- ⚠️ Still needs correction property mappings

#### 4. **TankTransferConfiguration** (Needs Update)
- ⚠️ Still needs correction property mappings

### ✅ Correction DTOs Created

#### 1. **DeliveryCorrectionDto**
- ✅ Complete validation attributes
- ✅ All delivery-specific properties
- ✅ Correction reason and user tracking

#### 2. **FuelRefillCorrectionDto**
- ✅ Complete validation attributes
- ✅ All fuel refill-specific properties
- ✅ Correction reason and user tracking

#### 3. **StockAdjustmentCorrectionDto**
- ✅ Complete validation attributes
- ✅ All stock adjustment-specific properties
- ✅ Correction reason and user tracking

#### 4. **TankTransferCorrectionDto**
- ✅ Complete validation attributes
- ✅ All tank transfer-specific properties
- ✅ Correction reason and user tracking

### ✅ Enhanced Existing DTOs

#### 1. **DeliveryDTO**
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties

#### 2. **FuelRefilDTO**
- ✅ Added `IsCorrection`, `CorrectsRecordId`, `CorrectionReason` properties

## Command Implementation Status

### ✅ Update Commands (Correction-Based Pattern)

#### 1. **UpdateFuelRefillCommand**
- ✅ **Signature**: `UpdateFuelRefillCommand(int OriginalFuelRefillId, FuelRefillCorrectionDto CorrectionData)`
- ✅ **Implementation**:
  - Validates original record exists
  - Finds associated TankVolumeHistory record
  - Soft deletes original via `DeleteTankVolumeHistoryCommand`
  - Creates correction entry via `CreateFuelRrefillCommand`
  - Full error handling and logging
- ⚠️ **Status**: Code complete, needs compilation fixes

#### 2. **UpdateDeliveryCommand**
- ✅ **Signature**: `UpdateDeliveryCommand(int OriginalDeliveryId, DeliveryCorrectionDto CorrectionData)`
- ✅ **Implementation**:
  - Validates original record exists
  - Finds associated TankVolumeHistory record
  - Soft deletes original via `DeleteTankVolumeHistoryCommand`
  - Creates correction entry via `CreateDeliveryCommand`
  - Full error handling and logging
- ⚠️ **Status**: Code complete, needs compilation fixes

#### 3. **UpdateStockAdjustmentCommand** (Missing)
- ❌ **Status**: Needs to be created
- **Signature**: `UpdateStockAdjustmentCommand(int OriginalStockAdjustmentId, StockAdjustmentCorrectionDto CorrectionData)`

#### 4. **UpdateTankTransferCommand** (Missing)
- ❌ **Status**: Needs to be created
- **Signature**: `UpdateTankTransferCommand(int OriginalTankTransferId, TankTransferCorrectionDto CorrectionData)`

### ⚠️ Create Commands (Need Enhancement)

#### 1. **CreateFuelRrefillCommand**
- ✅ **Status**: Exists and supports correction properties
- ✅ **Enhancement**: Already handles `IsCorrection`, `CorrectsRecordId`, `CorrectionReason`

#### 2. **CreateDeliveryCommand**
- ✅ **Status**: Exists
- ⚠️ **Enhancement**: Needs to handle correction properties from DTO

#### 3. **CreateStockAdjustmentCommand**
- ✅ **Status**: Exists
- ⚠️ **Enhancement**: Needs to handle correction properties

#### 4. **CreateTankTransferCommand** (Missing)
- ❌ **Status**: Needs to be created entirely

## Database Migration Requirements

### New Columns Needed

Each volume change entity table needs these additional columns:

```sql
-- For each table: deliveries, fuelrefills, stockadjustments, tanktransfers
ALTER TABLE [table_name] ADD COLUMN:
    is_correction TINYINT(1) DEFAULT 0,
    corrects_record_id INT(11) NULL,
    correction_reason VARCHAR(200) NULL,
    FOREIGN KEY fk_[table]_corrects_record (corrects_record_id)
        REFERENCES [table_name](id) ON DELETE RESTRICT
```

## Controller Interface Pattern

### Recommended Signature for All Controllers:

```csharp
[HttpPut("correct/{originalId}")]
public async Task<IActionResult> UpdateFuelRefill(
    int originalId,
    [FromBody] FuelRefillCorrectionDto correctionData)
{
    var command = new UpdateFuelRefillCommand(originalId, correctionData);
    var result = await _mediator.Send(command);
    return result.Success ? Ok(result) : BadRequest(result);
}
```

## Integration Points

### ✅ Soft Delete Infrastructure
- **DeleteTankVolumeHistoryCommand**: Already handles validation and future records
- **TankVolumeHistoryDeletionService**: Validates business rules
- **Global Query Filters**: Automatically exclude soft deleted records

### ✅ Audit Trail System
- **TankVolumeAdjustmentAudit**: Financial audit compliance
- **User Navigation Properties**: Complete user tracking
- **Timestamp Tracking**: Full timeline of changes

## Next Steps Required

### 1. **Complete Missing Commands**
- [ ] Create `UpdateStockAdjustmentCommand`
- [ ] Create `UpdateTankTransferCommand`
- [ ] Create `CreateTankTransferCommand`

### 2. **Update Entity Configurations**
- [ ] Complete `StockAdjustmentConfiguration`
- [ ] Complete `TankTransferConfiguration`

### 3. **Enhance Create Commands**
- [ ] Update `CreateDeliveryCommand` to handle correction properties
- [ ] Update `CreateStockAdjustmentCommand` to handle correction properties

### 4. **Database Migration**
- [ ] Generate EF Core migration for new correction columns
- [ ] Execute migration scripts
- [ ] Add indexes for performance

### 5. **Service Registration**
- [ ] Register correction DTOs in DI container
- [ ] Update MediatR command registrations

### 6. **Controller Updates**
- [ ] Update all tank management controllers with new correction endpoints
- [ ] Update frontend integration points

### 7. **Testing**
- [ ] Unit tests for correction logic
- [ ] Integration tests for full workflow
- [ ] Performance testing with large datasets

## Business Rules Enforced

1. **Immutable Financial Records**: Original records are never physically deleted
2. **Complete Audit Trail**: Every change tracked with user, timestamp, and reason
3. **Data Integrity**: Correction entries reference originals, maintaining relationships
4. **Future Records Validation**: Prevents historical changes that would corrupt future data
5. **User Authorization**: All corrections require valid user authentication
6. **Business Validation**: Volume change rules still apply to corrections

## Benefits of This Approach

1. **Financial Compliance**: Bank-grade audit trail preservation
2. **Regulatory Compliance**: Immutable financial transaction history
3. **Data Recovery**: Original values always recoverable
4. **Change Tracking**: Complete history of who changed what and why
5. **Performance**: Soft deletes with query filters for optimal performance
6. **Scalability**: Pattern works for any volume change entity
