# Transaction Hub Delete Feature - Implementation Guide

## Phase 1: Backend Implementation

### Step 1: Enhance TankStockFutureRecordsService

Add these methods to the existing `TankStockFutureRecordsService.cs`:

```csharp
/// <summary>
/// Validates if a specific tank volume history record can be deleted
/// </summary>
public async Task<TankStockFutureRecordsValidationResult> ValidateHistoricalEntryDeletionAsync(
    int tankVolumeHistoryId,
    CancellationToken cancellationToken = default)
{
    try
    {
        var recordToDelete = await _context.TankVolumeHistories
            .FirstOrDefaultAsync(h => h.Id == tankVolumeHistoryId, cancellationToken);

        if (recordToDelete == null)
        {
            return new TankStockFutureRecordsValidationResult
            {
                IsAllowed = false,
                Policy = "ERROR",
                WarningType = "ERROR",
                Message = "Tank volume history record not found"
            };
        }

        return await ValidateHistoricalEntryAsync(
            recordToDelete.TankId.Value,
            recordToDelete.Timestamp,
            recordToDelete.ChangeReason,
            cancellationToken);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating deletion for ID {Id}", tankVolumeHistoryId);
        return new TankStockFutureRecordsValidationResult
        {
            IsAllowed = false,
            Policy = "ERROR",
            WarningType = "ERROR",
            Message = $"Validation error: {ex.Message}"
        };
    }
}

/// <summary>
/// Analyzes the impact of deleting a tank volume history record
/// </summary>
public async Task<DeleteImpactAnalysis> AnalyzeDeleteImpactAsync(
    int tankVolumeHistoryId,
    CancellationToken cancellationToken = default)
{
    try
    {
        var recordToDelete = await _context.TankVolumeHistories
            .Include(h => h.Tank)
            .FirstOrDefaultAsync(h => h.Id == tankVolumeHistoryId, cancellationToken);

        if (recordToDelete == null)
        {
            return new DeleteImpactAnalysis
            {
                IsValid = false,
                ErrorMessage = "Record not found"
            };
        }

        var futureRecords = await GetFutureRecordsAsync(
            recordToDelete.TankId.Value,
            recordToDelete.Timestamp,
            cancellationToken);

        var currentStock = recordToDelete.Tank.CurrentStock ?? 0;
        var stockAfterDelete = currentStock - (recordToDelete.VolumeChange ?? 0);

        return new DeleteImpactAnalysis
        {
            IsValid = true,
            RecordToDelete = recordToDelete,
            AffectedFutureRecords = futureRecords,
            CurrentStockBefore = currentStock,
            CurrentStockAfter = stockAfterDelete,
            VolumeChangeImpact = recordToDelete.VolumeChange ?? 0,
            RequiresRecalculation = futureRecords.Any()
        };
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error analyzing delete impact for ID {Id}", tankVolumeHistoryId);
        return new DeleteImpactAnalysis
        {
            IsValid = false,
            ErrorMessage = $"Analysis error: {ex.Message}"
        };
    }
}
```

### Step 2: Create DeleteImpactAnalysis Class

Add this class to the same file:

```csharp
/// <summary>
/// Analysis result for delete impact
/// </summary>
public class DeleteImpactAnalysis
{
    public bool IsValid { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public TankVolumeHistory RecordToDelete { get; set; }
    public List<TankVolumeHistory> AffectedFutureRecords { get; set; } = new();
    public decimal CurrentStockBefore { get; set; }
    public decimal CurrentStockAfter { get; set; }
    public decimal VolumeChangeImpact { get; set; }
    public bool RequiresRecalculation { get; set; }

    // Enhanced: Add affected tanks information
    public List<AffectedTankInfo> AffectedTanks { get; set; } = new();

    public string GetImpactSummary()
    {
        if (!IsValid) return $"Error: {ErrorMessage}";

        var changeType = VolumeChangeImpact >= 0 ? "increase" : "decrease";
        var summary = $"Deleting this transaction will:\n";
        summary += $"• Change tank stock from {CurrentStockBefore:N2}L to {CurrentStockAfter:N2}L\n";
        summary += $"• Net impact: {Math.Abs(VolumeChangeImpact):N2}L {changeType}\n";

        if (RequiresRecalculation && AffectedFutureRecords.Count > 0)
        {
            summary += $"• Trigger recalculation of {AffectedFutureRecords.Count} future records\n";
            summary += $"• Date range: {AffectedFutureRecords.Min(r => r.Timestamp):yyyy-MM-dd} to {AffectedFutureRecords.Max(r => r.Timestamp):yyyy-MM-dd}\n";
        }
        else
        {
            summary += $"• No future records will be affected\n";
        }

        // Enhanced: Show affected tanks
        if (AffectedTanks.Any())
        {
            summary += $"• Affected tanks: {AffectedTanks.Count}\n";
            foreach (var tankInfo in AffectedTanks)
            {
                summary += $"  - {tankInfo.TankName}: {tankInfo.CurrentStock:N2}L → {tankInfo.FinalStock:N2}L\n";
            }
        }

        return summary;
    }
}

/// <summary>
/// Information about affected tank after deletion
/// </summary>
public class AffectedTankInfo
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal FinalStock { get; set; }
    public decimal StockChange { get; set; }
    public int AffectedRecordsCount { get; set; }
}
```

### Step 3: Enhance DeleteTankVolumeHistoryCommand

Update the existing command to include validation:

```csharp
public record DeleteTankVolumeHistoryCommand(
    int? Id = null,
    int? TankId = null,
    string ReferenceType = null,
    int? ReferenceId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool UserConfirmed = false,
    string DeleteReason = null,
    string UserId = null) : IRequest<FMSResponseMessage>;
```

Add these fields to the handler constructor:

```csharp
private readonly TankStockFutureRecordsService _futureRecordsService;

public DeleteTankVolumeHistoryCommandHandler(
    GpsdataContext context,
    ILogger<DeleteTankVolumeHistoryCommandHandler> logger,
    IMediator mediator,
    TankStockFutureRecordsService futureRecordsService) // Add this
{
    _context = context;
    _logger = logger;
    _mediator = mediator;
    _futureRecordsService = futureRecordsService; // Add this
}
```

### Step 4: Add API Endpoints

Create these endpoints in your TankVolumeHistory controller:

```csharp
[HttpPost("validate-delete/{id}")]
public async Task<ActionResult<object>> ValidateDelete(int id)
{
    try
    {
        var validation = await _futureRecordsService.ValidateHistoricalEntryDeletionAsync(id);
        var impact = await _futureRecordsService.AnalyzeDeleteImpactAsync(id);

        return Ok(new
        {
            Validation = validation,
            Impact = impact,
            ImpactSummary = impact.GetImpactSummary()
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating delete for record {Id}", id);
        return StatusCode(500, new { Message = "Error validating deletion", Error = ex.Message });
    }
}

[HttpDelete("{id}")]
public async Task<ActionResult<FMSResponseMessage>> DeleteTransaction(
    int id,
    [FromBody] DeleteTransactionRequest request = null)
{
    try
    {
        var command = new DeleteTankVolumeHistoryCommand(
            Id: id,
            UserConfirmed: request?.UserConfirmed ?? false,
            DeleteReason: request?.Reason,
            UserId: User.Identity?.Name);

        var result = await _mediator.Send(command);

        if (result.Success)
        {
            return Ok(result);
        }
        else if (result.MessageType == "CONFIRMATION_REQUIRED")
        {
            return StatusCode(409, result); // Conflict - requires confirmation
        }
        else
        {
            return BadRequest(result);
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error deleting transaction {Id}", id);
        return StatusCode(500, new FMSResponseMessage(false, $"Server error: {ex.Message}"));
    }
}

public class DeleteTransactionRequest
{
    public bool UserConfirmed { get; set; }
    public string Reason { get; set; }
}
```

## Phase 2: Frontend Implementation

### Step 1: Add Delete State to TransactionHub

Add these state variables to `TransactionHub.js`:

```javascript
// Add to existing state declarations
const [deleteDialog, setDeleteDialog] = useState({
  visible: false,
  transaction: null,
  validation: null,
  impact: null,
  impactSummary: null,
  loading: false
});

// Enhanced: Add state for showing all affected tanks
const [showAllAffectedTanks, setShowAllAffectedTanks] = useState(false);
```

### Step 2: Add Delete Handler

Add this function to `TransactionHub.js`:

```javascript
// Delete transaction handler
const handleDeleteTransaction = async (transaction) => {
  setDeleteDialog({ ...deleteDialog, loading: true, visible: true, transaction });

  try {
    const response = await fetch(`/api/tank-volume-history/validate-delete/${transaction.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Validation failed');
    }

    const data = await response.json();

    setDeleteDialog({
      visible: true,
      transaction,
      validation: data.validation,
      impact: data.impact,
      impactSummary: data.impactSummary,
      loading: false
    });

  } catch (error) {
    console.error('Error validating deletion:', error);
    notify({
      message: 'Error validating deletion. Please try again.',
      type: 'error'
    });
    setDeleteDialog({ ...deleteDialog, loading: false, visible: false });
  }
};

// Execute deletion
const executeDelete = async (reason = '') => {
  try {
    const response = await fetch(`/api/tank-volume-history/${deleteDialog.transaction.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userConfirmed: true,
        reason: reason
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      notify({
        message: 'Transaction deleted successfully',
        type: 'success'
      });

      await handleRefresh();
      setDeleteDialog({ visible: false, transaction: null, validation: null, impact: null, loading: false });

    } else {
      throw new Error(result.message || 'Delete failed');
    }

  } catch (error) {
    console.error('Error deleting transaction:', error);
    notify({
      message: `Error deleting transaction: ${error.message}`,
      type: 'error'
    });
  }
};
```

### Step 3: Add Delete Actions to DataGrid

You can implement delete actions in two ways:

#### Option 1: Direct Delete Action Column
```javascript
<Column
  type="buttons"
  width={70}
  caption=""
  cellRender={(cellData) => (
    <div className="tw-flex tw-justify-center">
      <Button
        icon="fa-light fa-trash"
        stylingMode="text"
        onClick={() => handleDeleteTransaction(cellData.data)}
        className="tw-text-red-600 hover:tw-text-red-800"
        hint="Delete Transaction"
        disabled={isLoading}
      />
    </div>
  )}
/>
```

#### Option 2: Meatball Action Button (Recommended)
```javascript
<Column
  type="buttons"
  width={90}
  caption="Actions"
  cellRender={(cellData) => (
    <div className="tw-flex tw-justify-center">
      <DropDownButton
        text=""
        icon="fa-light fa-ellipsis-vertical"
        stylingMode="text"
        className="tw-text-gray-600"
        showArrowIcon={false}
        items={[
          {
            text: 'Delete Transaction',
            icon: 'fa-light fa-trash',
            onClick: () => handleDeleteTransaction(cellData.data),
            className: 'tw-text-red-600'
          },
          {
            text: 'View Details',
            icon: 'fa-light fa-eye',
            onClick: () => handleViewDetails(cellData.data)
          },
          {
            text: 'Edit Transaction',
            icon: 'fa-light fa-edit',
            onClick: () => handleEditTransaction(cellData.data),
            disabled: !canEdit(cellData.data)
          }
        ]}
        onItemClick={(e) => {
          if (e.itemData.onClick) {
            e.itemData.onClick();
          }
        }}
      />
    </div>
  )}
/>
```

### Step 4: Add Delete Confirmation Dialog

Add this component before the closing div of `TransactionHub.js`:

```javascript
{/* Delete Confirmation Dialog */}
<Popup
  visible={deleteDialog.visible}
  onHiding={() => setDeleteDialog({ visible: false, transaction: null, validation: null, impact: null, loading: false })}
  showTitle={true}
  title="Delete Transaction"
  width={600}
  height="auto"
  showCloseButton={true}
>
  <div className="tw-p-4">
    {deleteDialog.loading ? (
      <div className="tw-text-center tw-py-8">
        <LoadIndicator visible={true} />
        <div className="tw-mt-2">Validating deletion...</div>
      </div>
    ) : (
      <>
        {/* Transaction Details */}
        {deleteDialog.transaction && (
          <div className="tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-mb-2">Transaction to Delete:</h4>
            <div className="tw-text-sm tw-space-y-1">
              <div><strong>Type:</strong> {VolumeChangeReasonEnum.find(r => r.id === deleteDialog.transaction.changeReason)?.name}</div>
              <div><strong>Date:</strong> {new Date(deleteDialog.transaction.timestamp).toLocaleString()}</div>
              <div><strong>Volume Change:</strong> {deleteDialog.transaction.volumeChange?.toFixed(2)}L</div>
              <div><strong>Tank:</strong> Tank ID {deleteDialog.transaction.tankId}</div>
            </div>
          </div>
        )}

        {/* Validation Results */}
        {deleteDialog.validation && (
          <div className={`tw-mb-4 tw-p-4 tw-rounded-lg ${
            deleteDialog.validation.warningType === 'BLOCKED'
              ? 'tw-bg-red-50 tw-border tw-border-red-200'
              : deleteDialog.validation.requiresUserConfirmation
              ? 'tw-bg-yellow-50 tw-border tw-border-yellow-200'
              : 'tw-bg-green-50 tw-border tw-border-green-200'
          }`}>
            <div className="tw-flex tw-items-start">
              <i className={`tw-mr-2 tw-mt-1 ${
                deleteDialog.validation.warningType === 'BLOCKED'
                  ? 'fa-light fa-times-circle tw-text-red-600'
                  : deleteDialog.validation.requiresUserConfirmation
                  ? 'fa-light fa-exclamation-triangle tw-text-yellow-600'
                  : 'fa-light fa-check-circle tw-text-green-600'
              }`}></i>
              <div>
                <div className="tw-font-semibold tw-text-sm">
                  {deleteDialog.validation.warningType === 'BLOCKED' ? 'Delete Blocked' :
                   deleteDialog.validation.requiresUserConfirmation ? 'Confirmation Required' : 'Safe to Delete'}
                </div>
                <div className="tw-text-sm tw-mt-1">{deleteDialog.validation.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* Impact Analysis */}
        {deleteDialog.impactSummary && (
          <div className="tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-mb-2 tw-text-blue-800">Impact Analysis:</h4>
            <pre className="tw-text-xs tw-text-blue-700 tw-whitespace-pre-wrap tw-font-mono">
              {deleteDialog.impactSummary}
            </pre>
          </div>
        )}

        {/* Affected Tanks List - Enhanced Feature */}
        {deleteDialog.impact?.affectedTanks && deleteDialog.impact.affectedTanks.length > 0 && (
          <div className="tw-mb-4 tw-p-4 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-mb-3 tw-text-orange-800 tw-flex tw-items-center">
              <i className="fa-light fa-gas-pump tw-mr-2"></i>
              Affected Tanks ({deleteDialog.impact.affectedTanks.length})
            </h4>
            <div className="tw-space-y-2">
              {deleteDialog.impact.affectedTanks.map((tank, index) => (
                <div key={index} className="tw-flex tw-justify-between tw-items-center tw-p-3 tw-bg-white tw-rounded tw-border">
                  <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-oil-can tw-text-orange-600 tw-mr-2"></i>
                    <div>
                      <div className="tw-font-medium">{tank.tankName}</div>
                      <div className="tw-text-xs tw-text-gray-500">
                        {tank.affectedRecordsCount} records will be recalculated
                      </div>
                    </div>
                  </div>
                  <div className="tw-text-right">
                    <div className="tw-flex tw-items-center tw-space-x-2">
                      <span className="tw-text-sm tw-text-gray-600">{tank.currentStock.toFixed(2)}L</span>
                      <i className="fa-light fa-arrow-right tw-text-gray-400"></i>
                      <span className={`tw-text-sm tw-font-semibold ${
                        tank.finalStock > tank.currentStock
                          ? 'tw-text-green-600'
                          : tank.finalStock < tank.currentStock
                          ? 'tw-text-red-600'
                          : 'tw-text-gray-600'
                      }`}>
                        {tank.finalStock.toFixed(2)}L
                      </span>
                    </div>
                    <div className={`tw-text-xs ${
                      tank.stockChange > 0
                        ? 'tw-text-green-600'
                        : tank.stockChange < 0
                        ? 'tw-text-red-600'
                        : 'tw-text-gray-500'
                    }`}>
                      {tank.stockChange > 0 ? '+' : ''}{tank.stockChange.toFixed(2)}L change
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less Button for many tanks */}
            {deleteDialog.impact.affectedTanks.length > 3 && (
              <div className="tw-mt-2 tw-text-center">
                <Button
                  text={`${showAllAffectedTanks ? 'Show Less' : `Show All ${deleteDialog.impact.affectedTanks.length} Tanks`}`}
                  stylingMode="text"
                  className="tw-text-orange-600 tw-text-xs"
                  onClick={() => setShowAllAffectedTanks(!showAllAffectedTanks)}
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-space-x-2">
          <Button
            text="Cancel"
            onClick={() => setDeleteDialog({ visible: false, transaction: null, validation: null, impact: null, loading: false })}
            stylingMode="outlined"
          />
          {deleteDialog.validation && !deleteDialog.validation.isAllowed ? (
            <Button
              text="Cannot Delete"
              type="danger"
              disabled={true}
            />
          ) : (
            <Button
              text="Delete Transaction"
              type="danger"
              onClick={() => executeDelete()}
            />
          )}
        </div>
      </>
    )}
  </div>
</Popup>
```

## Testing the Implementation

### 1. Test Cases to Verify

1. **Normal Delete (No Future Records)**
   - Create a transaction today
   - Delete it immediately
   - Should delete without warnings

2. **Delete with Future Records (Policy: WARN_RECALCULATE)**
   - Create an opening stock entry for yesterday
   - Create a closing stock entry for today
   - Try to delete yesterday's entry
   - Should show warning and require confirmation

3. **Delete with Future Records (Policy: BLOCK)**
   - Set policy to BLOCK in configuration
   - Try the same scenario as above
   - Should prevent deletion entirely

### 2. Configuration Setup

Add these to your system configuration:

```json
{
  "TankStock.FutureRecordsPolicy": "WARN_RECALCULATE",
  "TankStock.AllowPolicyOverride": false,
  "TankStock.MaxHistoricalDays": 30,
  "TankStock.ShowDetailedWarnings": true
}
```

### 3. Initial Test Flow

1. Deploy the backend changes
2. Test the validation endpoint manually
3. Deploy the frontend changes
4. Test the complete workflow
5. Verify audit logging works
6. Check tank current stock updates correctly

## Rollout Plan

### Phase 1: Backend Only (Week 1)
- Deploy enhanced services and commands
- Add API endpoints
- Test with Postman/API tools
- Verify database updates work correctly

### Phase 2: Frontend Integration (Week 2)
- Add delete UI to TransactionHub
- Test user workflow
- Verify confirmation dialogs
- Test error handling

### Phase 3: Production Rollout (Week 3)
- Deploy to staging environment
- User acceptance testing
- Performance testing with large datasets
- Deploy to production with monitoring

This implementation guide provides a practical step-by-step approach to adding the delete functionality while ensuring proper integration with the future records validation system.
