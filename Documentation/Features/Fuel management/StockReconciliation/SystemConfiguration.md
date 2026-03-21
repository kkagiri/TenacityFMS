# Stock Reconciliation System Configuration

## Overview
This document describes the system configuration entries added for stock reconciliation and variance analysis features.

## Configuration Entries

### Variance Threshold Configurations

#### `Stock.VarianceThreshold.Percentage`
- **Default Value**: 5 (5%)
- **Data Type**: Decimal
- **Range**: 0 - 100
- **Description**: Acceptable variance threshold as percentage for stock reconciliation
- **Usage**: Determines if variance is within acceptable limits. Used in both real-time validation and transfer reconciliation analysis.
- **Example**: With 5%, a variance of 4.5% on 1000L (45L) would be flagged as ACCEPTABLE

#### `Stock.VarianceThreshold.AbsoluteLiters`
- **Default Value**: 50 (liters)
- **Data Type**: Decimal
- **Range**: 0 - 10,000
- **Description**: Acceptable absolute variance in liters
- **Usage**: Used alongside percentage threshold. Variance must be within BOTH thresholds to be considered acceptable.
- **Example**: With 50L threshold, a variance of 45L would be ACCEPTABLE even if percentage is high

### Transfer Reconciliation Configurations

#### `TransferReconciliation.DefaultDaysRange`
- **Default Value**: 30 (days)
- **Data Type**: Integer
- **Range**: 1 - 365
- **Description**: Default date range for transfer reconciliation analysis
- **Usage**: Auto-populates date range when user opens Transfer Reconciliation page (Today - 30 days to Today)

#### `TransferReconciliation.MaxPeriodsToAnalyze`
- **Default Value**: 100 (periods)
- **Data Type**: Integer
- **Range**: 10 - 500
- **Description**: Maximum number of periods to analyze in a single request
- **Usage**: Performance safeguard to prevent analyzing too many periods at once. A period is the span between two consecutive stock entries.

#### `TransferReconciliation.IncludeTransferDetailsDefault`
- **Default Value**: false
- **Data Type**: Boolean
- **Description**: Default setting for including detailed transfer transactions
- **Usage**: Controls whether transfer transaction details are included by default. Users can toggle this via checkbox.

### Stock Validation Configurations

#### `Stock.EnableRealtimeValidation`
- **Default Value**: true
- **Data Type**: Boolean
- **Description**: Enable real-time stock variance validation before saving
- **Usage**: When enabled, useStockValidation hook will call expected stock API and show variance alerts as user enters stock values

#### `Stock.ValidationDebounceMs`
- **Default Value**: 500 (milliseconds)
- **Data Type**: Integer
- **Range**: 100 - 5,000
- **Description**: Debounce delay for real-time validation API calls
- **Usage**: Prevents excessive API requests while user is typing. 500ms means API is called 500ms after user stops typing.

#### `Stock.RequireConfirmationOnHighVariance`
- **Default Value**: true
- **Data Type**: Boolean
- **Description**: Require user confirmation before saving high variance entries
- **Usage**: When enabled, stock entries with HIGH variance (>2x threshold) will show confirmation dialog before allowing save.

## Severity Levels

The system uses variance thresholds to categorize entries into three severity levels:

### ACCEPTABLE (Green)
- **Condition**: `variance ≤ threshold`
- **Both conditions must be true**:
  - Percentage variance ≤ `Stock.VarianceThreshold.Percentage`
  - Absolute variance ≤ `Stock.VarianceThreshold.AbsoluteLiters`
- **Action**: No action required

### MODERATE (Yellow)
- **Condition**: `threshold < variance ≤ 2 × threshold`
- **Either condition true**:
  - `threshold < percentage ≤ 2 × threshold`
  - `threshold < absolute ≤ 2 × absolute_threshold`
- **Action**: Review recommended

### HIGH (Red)
- **Condition**: `variance > 2 × threshold`
- **Either condition true**:
  - Percentage variance > `2 × Stock.VarianceThreshold.Percentage`
  - Absolute variance > `2 × Stock.VarianceThreshold.AbsoluteLiters`
- **Action**: Investigation required, confirmation needed before save

## Examples

### Example 1: Small Tank (500L capacity)
**Configuration**: 5% percentage, 50L absolute
**Stock Entry**: Opening 400L, Actual Closing 380L, Expected Closing 395L
**Variance**: -15L (-3.75%)

**Result**: ACCEPTABLE
- Percentage: 3.75% ≤ 5% ✓
- Absolute: 15L ≤ 50L ✓

### Example 2: Large Tank (50,000L capacity)
**Configuration**: 5% percentage, 50L absolute
**Stock Entry**: Opening 40,000L, Actual Closing 37,500L, Expected Closing 39,000L
**Variance**: -1,500L (-3.85%)

**Result**: HIGH
- Percentage: 3.85% ≤ 5% ✓
- Absolute: 1,500L > 50L ✗ (and > 100L = 2×50L)
- **One threshold exceeded in HIGH range triggers HIGH severity**

### Example 3: Medium Variance
**Configuration**: 5% percentage, 50L absolute
**Stock Entry**: Opening 2,000L, Actual Closing 1,850L, Expected Closing 1,920L
**Variance**: -70L (-3.65%)

**Result**: MODERATE
- Percentage: 3.65% ≤ 5% ✓
- Absolute: 70L > 50L but ≤ 100L (2×50L)
- **Exceeds threshold but not 2× threshold = MODERATE**

## Installation

Run the SQL script to add configurations:

```bash
mysql -u username -p database_name < Database/Scripts/add_stock_reconciliation_configurations.sql
```

Or execute in MySQL Workbench or similar tool.

## Updating Configuration Values

Administrators can update configuration values via:

1. **System Configuration UI** (if available in admin panel)
2. **Direct SQL update**:
```sql
UPDATE SystemConfigurations
SET ConfigurationValue = '10'
WHERE ConfigurationKey = 'Stock.VarianceThreshold.Percentage';
```

3. **Application restart may be required** depending on caching strategy

## Related Features

- **Real-time Stock Validation** (Phase 1)
  - Uses: `Stock.VarianceThreshold.*`, `Stock.EnableRealtimeValidation`, `Stock.ValidationDebounceMs`, `Stock.RequireConfirmationOnHighVariance`
  - Files: `useStockValidation.js`, `StockVarianceAlert.js`

- **Transfer Reconciliation Analysis** (Phase 2)
  - Uses: `Stock.VarianceThreshold.*`, `TransferReconciliation.*`
  - Files: `TransferReconciliation.js`, `GetTransferReconciliationAnalysisQueryHandler.cs`

## Notes

- Configuration changes are typically cached by the application
- Changes may require application restart or cache clear
- All configurations have validation patterns to prevent invalid values
- `ON DUPLICATE KEY UPDATE` ensures script can be run multiple times safely
