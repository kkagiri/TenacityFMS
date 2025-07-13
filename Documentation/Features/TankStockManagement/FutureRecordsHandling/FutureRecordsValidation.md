# Tank Stock Future Records Validation System

## Overview

The Tank Stock Future Records Validation System helps manage historical tank stock entries by enforcing policies when there are existing records in the future relative to the entry being made.

## API Integration

### Backend API

**Endpoint**: `POST /api/tankstock/validate-historical-entry`

**Request Format**:
```json
{
  "tankId": 2,
  "entryDate": "2025-07-09T12:14:07.083Z",
  "entryType": 0
}
```

**Note**: The `entryType` should be sent as a numeric value (0-9) corresponding to the `VolumeChangeReasonEnum` values, not as a string.

**Valid Entry Types** (numeric values for `VolumeChangeReasonEnum`):
- `0` - `OpeningStock`
- `1` - `ClosingStock`
- `2` - `Delivery`
- `3` - `TransferIn`
- `4` - `TransferOut`
- `5` - `Adjustment`
- `6` - `Dispensing`
- `7` - `AutomatedDispensing`
- `8` - `Reconciliation`
- `9` - `AutomatedReconciliation`

**Response Format**:
```json
{
  "success": true,
  "data": {
    "isAllowed": true,
    "requiresUserConfirmation": false,
    "policy": "WARN_RECALCULATE",
    "message": "Warning message",
    "warningType": "WARN_RECALCULATE",
    "detailedWarning": "Detailed warning information",
    "futureRecordsCount": 5,
    "earliestFutureRecord": "2025-07-10T08:00:00Z",
    "latestFutureRecord": "2025-07-12T18:00:00Z"
  },
  "message": "Validation completed successfully"
}
```

### Frontend Service

**Service**: `tankStockFutureRecordsService`

**Usage**:
```javascript
import tankStockFutureRecordsService, { VolumeChangeReasons } from '../services/tankStockFutureRecordsService';

// Validate historical entry
const result = await tankStockFutureRecordsService.validateHistoricalEntry({
  tankId: 2,
  entryDate: "2025-07-09T12:14:07.083Z",
  entryType: "OpeningStock"  // Service will automatically convert to numeric value (0)
});

// Or use the enum constants
const result2 = await tankStockFutureRecordsService.validateHistoricalEntry({
  tankId: 2,
  entryDate: "2025-07-09T12:14:07.083Z",
  entryType: VolumeChangeReasons.OPENING_STOCK
});
```

### React Hook

**Hook**: `useFutureRecordsValidation`

**Usage**:
```javascript
import { useFutureRecordsValidation } from '../hooks/useFutureRecordsValidation';

const {
  validateHistoricalEntry,
  validationResult,
  isValidating,
  showWarning,
  canSubmit,
  confirmProceed,
  resetValidation
} = useFutureRecordsValidation();
```

## Warning Types

| Warning Type | Description | User Action Required |
|-------------|-------------|---------------------|
| `NONE` | No issues, entry allowed | None |
| `BLOCKED` | Entry is not allowed | Cannot proceed |
| `WARN_RECONCILE` | Manual reconciliation recommended | User confirmation required |
| `WARN_RECALCULATE` | Automatic recalculation will occur | User confirmation required |
| `INFO_RECALCULATE` | Informational, auto-recalculation enabled | None |
| `HISTORICAL_CUTOFF` | Entry exceeds historical cutoff date | Cannot proceed |
| `ERROR` | Validation error occurred | Cannot proceed |

## UI Components

The system provides configuration objects for each warning type:

```javascript
const config = tankStockFutureRecordsService.getWarningTypeConfig('WARN_RECONCILE');
// Returns:
// {
//   showWarning: true,
//   icon: 'fas fa-exclamation-triangle',
//   iconClass: 'tw-text-orange-500',
//   alertType: 'warning',
//   requiresConfirmation: true,
//   recommendedAction: 'Manual reconciliation recommended after entry'
// }
```

## Integration in Forms

1. **Import the hook**: Import `useFutureRecordsValidation` in your form component
2. **Validate on date change**: Call `validateHistoricalEntry` when the date or tank changes
3. **Display warnings**: Show warning messages if `showWarning` is true
4. **Handle confirmation**: Use `confirmProceed` for user confirmation
5. **Control submission**: Use `canSubmit` to enable/disable form submission

## Configuration

The system supports different policy configurations:
- **BLOCK**: Block all historical entries with future records
- **WARN_RECONCILE**: Allow with warning, recommend manual reconciliation
- **WARN_RECALCULATE**: Allow with warning, automatic recalculation
- **ALLOW_RECALCULATE**: Allow with info message, automatic recalculation

## Error Handling

The service provides comprehensive error handling:
- Parameter validation
- API error response handling
- Model state validation errors
- Network connectivity issues

## Testing

Use the test utility for debugging:

```javascript
import { testValidation } from '../utils/testFutureRecordsValidation';

// Test in browser console
testValidation().then(result => console.log(result));
```

## Common Issues

1. **Enum value format**: The API expects numeric values (0-9) for the `entryType` field, not string values
2. **Date format**: Use ISO format dates (YYYY-MM-DDTHH:mm:ss.sssZ)
3. **API response structure**: Backend returns FMSResponse wrapper, service extracts data automatically
4. **Validation timing**: Only validate for historical dates (< today)
5. **Model binding**: The API uses camelCase property naming due to JsonNamingPolicy.CamelCase configuration

## Troubleshooting

The service implements a fallback mechanism that tries multiple request formats:

1. **First attempt**: Sends enum as numeric value (recommended)
2. **Second attempt**: Sends enum as string value (fallback)
3. **Third attempt**: Wraps request in `request` object (for certain API configurations)

Check browser console for detailed request/response logs to see which format works.
