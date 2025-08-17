# Transaction Hub Delete Feature Documentation

## Overview
This document describes the implementation of the delete functionality in the Transaction Hub, which allows users to delete transactions directly from the unified transaction view. The delete operation is critical as it affects the tank volume history ledger and the final `tank.currentStock` value.

## Feature Scope

### Deletable Transaction Types
Based on `VolumeChangeReasonEnum`, the following transaction types can be deleted from the Transaction Hub:

1. **OpeningStock** (0) - Opening stock entries
2. **ClosingStock** (1) - Closing stock entries
3. **Delivery** (2) - Fuel deliveries
4. **TransferIn** (3) - Tank transfer incoming
5. **TransferOut** (4) - Tank transfer outgoing
6. **Adjustment** (5) - Manual adjustments
7. **Dispensing** (6) - Manual dispensing/refill

### Key Components

#### 1. Delete Command Infrastructure
- **Primary Command**: `DeleteTankVolumeHistoryCommand.cs`
- **Integration Service**: `TankVolumeHistoryIntegrationService.cs`
- **Future Records Validation**: `TankStockFutureRecordsService.cs`

#### 2. Reference Table Commands
Each transaction type has its corresponding delete command in the reference tables:
- `DeleteTankStockCommand.cs` - For Opening/Closing stock
- `DeleteTankTransferCommand.cs` - For Transfer operations
- `CreateStockAdjustmentCommand.cs` - For Adjustments (reverse entries)
- Related delivery and dispensing commands

## Critical Integration: TankStockFutureRecordsService

### Purpose
The `TankStockFutureRecordsService` validates and manages the policy when historical entries are being deleted, ensuring data integrity when there are future records that depend on the deleted entry.

### Policy Types
1. **BLOCK** - Completely prevent deletion of historical entries with future records
2. **WARN_RECONCILE** - Allow deletion but warn user that manual reconciliation is required
3. **WARN_RECALCULATE** - Allow deletion but warn user that automatic recalculation will occur
4. **ALLOW_RECALCULATE** - Allow deletion and automatically recalculate without warning

### Validation Result Structure
```csharp
public class TankStockFutureRecordsValidationResult {
    public bool IsAllowed { get; set; }
    public bool RequiresUserConfirmation { get; set; }
    public string Policy { get; set; }
    public string Message { get; set; }
    public string WarningType { get; set; }
    public string? DetailedWarning { get; set; }
    public int FutureRecordsCount { get; set; }
    public DateTime? EarliestFutureRecord { get; set; }
    public DateTime? LatestFutureRecord { get; set; }
}
```

## Delete Operation Flow

### 1. User-Initiated Delete
```
TransactionHub → Delete Button → Confirmation Dialog → Backend Delete Process
```

### 2. Backend Delete Process
```
1. Validate Request (DeleteTankVolumeHistoryCommand)
2. Check Future Records (TankStockFutureRecordsService)
3. Apply Policy (BLOCK/WARN/ALLOW)
4. If Allowed:
   a. Delete from TankVolumeHistory
   b. Delete from Reference Table (TankStock, Transfer, etc.)
   c. Recalculate Volume History (UpdateTankVolumeHistoryCommand)
   d. Update Tank.CurrentStock
```

### 3. Impact Analysis
When deleting a transaction, the system must:
- **Identify Affected Records**: All volume history entries after the deleted timestamp
- **Recalculate Volumes**: Recalculate `NewVolume` for all subsequent entries
- **Update Current Stock**: Update the final `Tank.CurrentStock` to reflect the changes
- **Cascade Updates**: Ensure all dependent calculations are updated

## Implementation Requirements

### Frontend (TransactionHub.js)

#### 1. Delete Action Column
Add a delete action column to the DataGrid:
```javascript
<Column
  type="buttons"
  width={100}
  cellRender={(cellData) => (
    <div className="tw-flex tw-space-x-2">
      <Button
        icon="fa-light fa-trash"
        stylingMode="text"
        onClick={() => handleDeleteTransaction(cellData.data)}
        className="tw-text-red-600 hover:tw-text-red-800"
        hint="Delete Transaction"
      />
    </div>
  )}
/>
```

#### 2. Delete Confirmation Dialog
```javascript
const [deleteConfirmation, setDeleteConfirmation] = useState({
  visible: false,
  transaction: null,
  validationResult: null
});

const handleDeleteTransaction = async (transaction) => {
  // Validate deletion with future records service
  const validation = await validateDeletion(transaction);

  setDeleteConfirmation({
    visible: true,
    transaction,
    validationResult: validation
  });
};
```

#### 3. Validation Integration
```javascript
const validateDeletion = async (transaction) => {
  try {
    const response = await fetch('/api/tankvolumehistory/validate-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tankId: transaction.tankId,
        entryDate: transaction.timestamp,
        entryType: transaction.changeReason
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error validating deletion:', error);
    return null;
  }
};
```

### Backend Implementation

#### 1. Enhanced DeleteTankVolumeHistoryCommand
```csharp
public async Task<FMSResponseMessage> Handle(
    DeleteTankVolumeHistoryCommand request,
    CancellationToken cancellationToken)
{
    try
    {
        // Step 1: Get records to delete
        var records = await GetRecordsToDelete(request, cancellationToken);

        if (!records.Any())
        {
            return new FMSResponseMessage(true, "No records found to delete");
        }

        // Step 2: Validate each deletion for future records
        var validationResults = new List<TankStockFutureRecordsValidationResult>();

        foreach (var record in records)
        {
            var validation = await _futureRecordsService.ValidateHistoricalEntryAsync(
                record.TankId.Value,
                record.Timestamp,
                record.ChangeReason,
                cancellationToken);

            validationResults.Add(validation);

            if (!validation.IsAllowed)
            {
                return new FMSResponseMessage(false,
                    $"Delete blocked: {validation.Message}");
            }
        }

        // Step 3: Check if user confirmation is required
        var requiresConfirmation = validationResults.Any(v => v.RequiresUserConfirmation);
        if (requiresConfirmation && !request.UserConfirmed)
        {
            return new FMSResponseMessage(false, "User confirmation required")
            {
                Data = validationResults
            };
        }

        // Step 4: Perform the deletion
        return await ExecuteDelete(records, cancellationToken);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error deleting tank volume history records");
        return new FMSResponseMessage(false, $"Error: {ex.Message}");
    }
}
```

#### 2. Reference Table Deletion
```csharp
private async Task<FMSResponseMessage> DeleteReferenceRecord(
    TankVolumeHistory volumeRecord,
    CancellationToken cancellationToken)
{
    switch (volumeRecord.ChangeReason)
    {
        case VolumeChangeReasonEnum.OpeningStock:
        case VolumeChangeReasonEnum.ClosingStock:
            return await _mediator.Send(
                new DeleteTankStockCommand(volumeRecord.ReferenceId.Value),
                cancellationToken);

        case VolumeChangeReasonEnum.TransferIn:
        case VolumeChangeReasonEnum.TransferOut:
            return await _mediator.Send(
                new DeleteTankTransferCommand(volumeRecord.ReferenceId.Value),
                cancellationToken);

        case VolumeChangeReasonEnum.Adjustment:
            return await CreateReverseAdjustment(volumeRecord, cancellationToken);

        // Add other cases as needed
        default:
            _logger.LogWarning("No reference deletion logic for {ChangeReason}",
                volumeRecord.ChangeReason);
            return new FMSResponseMessage(true, "No reference record to delete");
    }
}
```

### API Endpoints

#### 1. Validate Deletion
```csharp
[HttpPost("validate-delete")]
public async Task<ActionResult<TankStockFutureRecordsValidationResult>> ValidateDelete(
    [FromBody] ValidateDeleteRequest request)
{
    var result = await _futureRecordsService.ValidateHistoricalEntryAsync(
        request.TankId,
        request.EntryDate,
        request.EntryType);

    return Ok(result);
}
```

#### 2. Execute Delete
```csharp
[HttpDelete("{id}")]
public async Task<ActionResult<FMSResponseMessage>> DeleteTransaction(
    int id,
    [FromQuery] bool userConfirmed = false)
{
    var command = new DeleteTankVolumeHistoryCommand(
        Id: id,
        UserConfirmed: userConfirmed);

    var result = await _mediator.Send(command);
    return Ok(result);
}
```

## User Experience Flow

### 1. Normal Delete (No Future Records)
```
User clicks delete → Confirmation dialog → Delete confirmed → Success message
```

### 2. Delete with Future Records (WARN Policy)
```
User clicks delete →
Validation shows warning →
Enhanced confirmation dialog with impact details →
User confirms understanding →
Delete with recalculation →
Success message with recalculation details
```

### 3. Delete with Future Records (BLOCK Policy)
```
User clicks delete →
Validation blocks deletion →
Error message with policy information →
User must contact administrator or remove future records first
```

## Configuration Requirements

### System Configuration Keys
```json
{
  "TankStock": {
    "FutureRecordsPolicy": "WARN_RECALCULATE",
    "AllowPolicyOverride": false,
    "MaxHistoricalDays": 30,
    "ShowDetailedWarnings": true,
    "RequireManagerApprovalForHistoricalDeletes": true
  }
}
```

### User Permissions
- **DELETE_TRANSACTIONS**: Basic delete permission
- **DELETE_HISTORICAL_TRANSACTIONS**: Delete transactions older than current day
- **OVERRIDE_FUTURE_RECORDS_POLICY**: Override policy restrictions
- **APPROVE_HISTORICAL_DELETES**: Manager approval for historical deletes

## Error Handling & Logging

### Critical Log Points
1. **Delete Initiation**: Log all delete attempts with user and transaction details
2. **Validation Results**: Log policy decisions and future records impact
3. **Reference Deletions**: Log success/failure of reference table deletions
4. **Recalculation**: Log volume history recalculation results
5. **Stock Updates**: Log tank current stock changes

### Error Messages
- **Policy Block**: "Delete blocked by system policy. Contact administrator."
- **Validation Error**: "Cannot validate deletion. Please try again."
- **Recalculation Failure**: "Transaction deleted but recalculation failed. Manual intervention required."
- **Partial Failure**: "Volume history deleted but reference record deletion failed."

## Testing Strategy

### Unit Tests
1. Delete command validation
2. Future records service policy application
3. Reference table deletion logic
4. Volume history recalculation

### Integration Tests
1. End-to-end delete workflow
2. Policy enforcement scenarios
3. Multi-tank impact scenarios
4. Concurrent deletion handling

### User Acceptance Tests
1. Normal transaction deletion
2. Historical transaction deletion with warnings
3. Policy-blocked deletions
4. Manager approval workflows

## Performance Considerations

### Optimization Points
1. **Batch Validation**: Validate multiple deletions in single call
2. **Async Recalculation**: Perform volume recalculation asynchronously for large datasets
3. **Selective Updates**: Only recalculate affected tank portions
4. **Caching**: Cache policy configurations and tank data

### Monitoring
- Delete operation duration
- Recalculation performance
- Policy violation rates
- User confirmation rates

## Security Considerations

### Audit Trail
All delete operations must be logged in the audit trail with:
- User ID and timestamp
- Transaction details being deleted
- Reason for deletion
- Policy override details (if applicable)
- Manager approval details (if applicable)

### Data Protection
- Soft delete option for critical transactions
- Backup verification before permanent deletion
- Manager approval for high-impact deletions
- Automatic backup of affected tank states

---

## Next Steps
1. Implement frontend delete functionality in TransactionHub
2. Enhance DeleteTankVolumeHistoryCommand with future records validation
3. Create API endpoints for validation and deletion
4. Implement user permission checks
5. Add comprehensive logging and monitoring
6. Create user documentation and training materials
