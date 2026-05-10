# Transfer Reconciliation Feature - Deployment Checklist

## Overview
This document provides a comprehensive checklist for deploying the Transfer Reconciliation feature (Phase 2) along with the Stock Validation feature (Phase 1).

## Phase 2: Transfer Reconciliation - ? READY FOR DEPLOYMENT

### 1. Database Scripts

**File**: `Database/Scripts/add_stock_reconciliation_configurations.sql`
- **Status**: ? Created and ready
- **Description**: Adds 8 SystemConfiguration entries for variance thresholds and reconciliation settings
- **Contents**:
  - Stock.VarianceThreshold.Percentage (5%, range 0-100)
  - Stock.VarianceThreshold.AbsoluteLiters (50L, range 0-10000)
  - TransferReconciliation.DefaultDaysRange (30 days, range 1-365)
  - TransferReconciliation.MaxPeriodsToAnalyze (100, range 10-500)
  - TransferReconciliation.IncludeTransferDetailsDefault (false)
  - Stock.EnableRealtimeValidation (true)
  - Stock.ValidationDebounceMs (500ms, range 100-5000)
  - Stock.RequireConfirmationOnHighVariance (true)
- **Execution Order**: Run FIRST before navigation script

**Deployment Command**:
```bash
mysql -u [username] -p [database_name] < Database/Scripts/add_stock_reconciliation_configurations.sql
```

---

**File**: `Database/Scripts/add_transfer_reconciliation_menu_item.sql`
- **Status**: ? Created and ready
- **Description**: Adds Transfer Reconciliation navigation menu item under Tank Stock section
- **Contents**:
  - Inserts navigationitems entry with Page='transfer reconciliation', Link='/tankstock/transfer-reconciliation'
  - Automatically assigns _Read_tankStock permission to appropriate roles
  - Includes verification queries to confirm successful insertion
- **Execution Order**: Run SECOND after configuration script

**Deployment Command**:
```bash
mysql -u [username] -p [database_name] < Database/Scripts/add_transfer_reconciliation_menu_item.sql
```

**Post-Execution Verification**:
```sql
-- Verify navigation item exists
SELECT n.Id, n.Page, n.Link, n.Icon, n.ParentId, parent.Page AS ParentPage
FROM navigationitems n
LEFT JOIN navigationitems parent ON n.ParentId = parent.Id
WHERE n.Page = 'transfer reconciliation';

-- Verify role assignments
SELECT n.Page, r.Name AS RoleName
FROM navigationitems n
INNER JOIN rolenavigations rn ON n.Id = rn.NavigationItemId
INNER JOIN roles r ON rn.RoleId = r.Id
WHERE n.Page = 'transfer reconciliation';
```

---

### 2. Backend Files

**Location**: `FMS.Application/Features/TankStock/`

? **Queries**:
- `GetTransferReconciliationAnalysisQuery.cs`: Query with tankId, startDate, endDate, includeDetails parameters
- `GetTransferReconciliationAnalysisQueryHandler.cs`: Handler with period-based reconciliation logic, dual-source dispensing calculation

? **DTOs**:
- `TransferReconciliationResult.cs`: Complete result DTOs including:
  - ReconciliationPeriod (PeriodNumber, StartDate, EndDate, ExpectedStock, ActualStock, Variance, Severity, etc.)
  - TransferDetail (TransferId, TransferDate, FromTank, ToTank, Volume)
  - DispensingBreakdown (FromTank, ToTank, FTSTDispensing, SaleDispensing, TotalDispensing)
  - ReconciliationSummary (TotalPeriods, PeriodsWithHighVariance, PeriodsWithModerateVariance, PeriodsAcceptable, etc.)

? **Controller**:
- `TankStockController.cs`: Added GET endpoint `/api/v1/tankstock/transfer-reconciliation`
- Parameters: tankId (int), startDate (DateTime), endDate (DateTime), includeDetails (bool, default=false)
- Returns: `FMSResponse<TransferReconciliationResult>`

**Build Verification**:
```bash
dotnet build Tenacity.Fms.sln
```

---

### 3. Frontend Files

**Location**: `fms.frontend/src/pages/tankStock/`

? **Main Page**:
- `analytics/TransferReconciliation.js`: Main page component with filters, Apply/Clear buttons, loading states
- `analytics/TransferReconciliation.scss`: Styles with variance severity colors (green/yellow/red), animations

? **Components**:
- `analytics/components/TransferReconciliationSummary.js`: 6 metric cards showing summary statistics
- `analytics/components/TransferVarianceChart.js`: DevExtreme Chart with Expected/Actual lines, Variance bars
- `analytics/components/TransferReconciliationGrid.js`: DevExtreme DataGrid with expandable rows, dispensing breakdown
- `analytics/components/TransferReconciliationHelp.js`: Help documentation popup (9 sections)

? **Redux Integration**:
- `redux/actions/tankStockAction.js`: fetchTransferReconciliation and clearTransferReconciliation actions
- `redux/reducers/tankStockReducer.js`: transferReconciliation and transferReconciliationLoading state management

? **Routing**:
- `TankStockMain.js`: Added route for `/transfer-reconciliation`
- Import: `import TransferReconciliation from './analytics/TransferReconciliation';`
- Route: `<Route path="/transfer-reconciliation" element={<TransferReconciliation />} />`

**Build Verification**:
```bash
cd fms.frontend
npm install
npm run build:prod
```

---

### 4. Documentation

? **Created Documentation Files**:
- `Documentation/Features/TankStock/TransferReconciliation/SystemConfiguration.md`: Complete configuration guide with examples
- `Documentation/Features/TankStock/TransferReconciliation/DEPLOYMENT_CHECKLIST.md`: This file

---

### 5. Testing Checklist

#### Backend Testing

- [ ] **Build Success**: `dotnet build Tenacity.Fms.sln` completes without errors
- [ ] **API Endpoint**: Test GET `/api/v1/tankstock/transfer-reconciliation?tankId=1&startDate=2024-01-01&endDate=2024-01-31`
- [ ] **Response Structure**: Verify FMSResponse<TransferReconciliationResult> format
- [ ] **Variance Calculation**: Verify ACCEPTABLE/MODERATE/HIGH severity logic:
  - ACCEPTABLE: variance = threshold (BOTH percentage AND absolute)
  - MODERATE: threshold < variance = 2×threshold (EITHER condition)
  - HIGH: variance > 2×threshold (EITHER condition)
- [ ] **Dual-Source Dispensing**: Verify dispensing includes both FT-ST transfers AND sales

#### Frontend Testing

- [ ] **Build Success**: `npm run build:prod` completes without errors
- [ ] **Navigation**: Menu item appears under "Tank Stock" section
- [ ] **Route Access**: Direct URL `/tankstock/transfer-reconciliation` loads correctly
- [ ] **Permissions**: Users with `_Read_tankStock` permission can access the page
- [ ] **Tank Selection**: Dropdown populated with active tanks
- [ ] **Date Range**: Date pickers work correctly (default: last 30 days)
- [ ] **Apply Button**: Fetches data and displays loading state
- [ ] **Summary Cards**: 6 metric cards display correct values:
  1. Total Periods Analyzed
  2. Average Variance (percentage)
  3. High Variance Periods (red)
  4. Moderate Variance Periods (yellow)
  5. Acceptable Periods (green)
  6. Total Transfer Volume
- [ ] **Variance Chart**:
  - Expected Stock line (blue)
  - Actual Stock line (green)
  - Variance bars (color-coded: green/yellow/red)
  - Hover tooltips show detailed breakdown
- [ ] **Grid**:
  - Periods listed with all details
  - Expandable rows show dispensing breakdown
  - Transfer details table (if includeDetails enabled)
  - Export to Excel functionality works
- [ ] **Help Popup**: Opens and displays 9 sections of documentation
- [ ] **Clear Functionality**: Clear button resets filters and clears results
- [ ] **Error Handling**: API errors display user-friendly messages
- [ ] **Loading States**: Proper loading indicators during API calls

#### Database Testing

- [ ] **Configuration Entries**: Verify all 8 SystemConfiguration entries exist:
```sql
SELECT ConfigurationKey, ConfigurationValue, DataType, MinValue, MaxValue, DefaultValue
FROM SystemConfigurations
WHERE ConfigurationKey LIKE 'Stock.%' OR ConfigurationKey LIKE 'TransferReconciliation.%'
ORDER BY ConfigurationKey;
```

- [ ] **Navigation Entry**: Verify Transfer Reconciliation menu item exists:
```sql
SELECT n.Page, n.Link, n.Icon, parent.Page AS ParentPage
FROM navigationitems n
LEFT JOIN navigationitems parent ON n.ParentId = parent.Id
WHERE n.Page = 'transfer reconciliation';
```

- [ ] **Role Assignments**: Verify roles with _Read_tankStock can access:
```sql
SELECT r.Name, r.NormalizedName
FROM roles r
INNER JOIN rolenavigations rn ON r.Id = rn.RoleId
INNER JOIN navigationitems n ON rn.NavigationItemId = n.Id
WHERE n.Page = 'transfer reconciliation';
```

#### Integration Testing

- [ ] **Stock Filter Context**: Verify tank selection persists across sub-pages
- [ ] **Layout Integration**: TankStockLayout sidebar shows active page
- [ ] **Permission Enforcement**: Non-authorized users cannot access page
- [ ] **Mobile Responsiveness**: Layout adjusts properly on small screens
- [ ] **Browser Compatibility**: Test in Chrome, Edge, Firefox

---

### 6. Deployment Steps

#### Step 1: Database Changes
1. Backup database:
```bash
mysqldump -u [username] -p [database_name] > backup_before_transfer_reconciliation.sql
```

2. Execute configuration script:
```bash
mysql -u [username] -p [database_name] < Database/Scripts/add_stock_reconciliation_configurations.sql
```

3. Execute navigation script:
```bash
mysql -u [username] -p [database_name] < Database/Scripts/add_transfer_reconciliation_menu_item.sql
```

4. Verify execution:
```bash
mysql -u [username] -p [database_name] -e "SELECT COUNT(*) AS ConfigCount FROM SystemConfigurations WHERE ConfigurationKey LIKE 'Stock.%' OR ConfigurationKey LIKE 'TransferReconciliation.%';"
mysql -u [username] -p [database_name] -e "SELECT * FROM navigationitems WHERE Page = 'transfer reconciliation';"
```

#### Step 2: Backend Deployment
1. Build solution:
```bash
dotnet build Tenacity.Fms.sln --configuration Release
```

2. Run tests (if available):
```bash
dotnet test Tenacity.Fms.sln --configuration Release
```

3. Publish backend:
```bash
dotnet publish FMS.WebClient/FMS.WebClient.csproj --configuration Release --output ./publish
```

4. Deploy to server (copy publish folder to production server)

5. Restart application service

#### Step 3: Frontend Deployment
1. Install dependencies:
```bash
cd fms.frontend
npm install
```

2. Build for production:
```bash
npm run build:prod
```

3. Deploy build folder to web server (copy build/* to production web root)

4. Clear browser cache or increment app version to force client refresh

#### Step 4: Post-Deployment Verification
1. Test API endpoint directly:
```bash
curl -X GET "http://[server]/api/v1/tankstock/transfer-reconciliation?tankId=1&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer [token]"
```

2. Login to application
3. Navigate to Tank Stock ? Transfer Reconciliation
4. Select a tank and date range
5. Click Apply and verify results display correctly
6. Check browser console for errors
7. Verify role-based access works

---

### 7. Rollback Plan

If deployment fails or issues are discovered:

#### Database Rollback
```sql
-- Remove navigation item
DELETE FROM rolenavigations
WHERE NavigationItemId IN (
  SELECT Id FROM navigationitems
  WHERE Page = 'transfer reconciliation'
);

DELETE FROM navigationitems
WHERE Page = 'transfer reconciliation';

-- Remove configuration entries
DELETE FROM SystemConfigurations
WHERE ConfigurationKey LIKE 'Stock.%'
   OR ConfigurationKey LIKE 'TransferReconciliation.%';
```

Or restore from backup:
```bash
mysql -u [username] -p [database_name] < backup_before_transfer_reconciliation.sql
```

#### Backend Rollback
- Redeploy previous version from backup
- Restart application service

#### Frontend Rollback
- Restore previous build folder
- Clear CDN/cache if applicable

---

## Phase 1: Stock Validation - ?? INTEGRATION PENDING

### Status: Backend and Components Complete, Form Integration Deferred

? **Completed**:
- Backend: GetExpectedStockQuery + Handler + Controller endpoint
- Frontend: useStockValidation hook (fms.frontend/src/pages/tankStock/hooks/useStockValidation.js)
- Frontend: StockVarianceAlert component (fms.frontend/src/pages/tankStock/components/StockVarianceAlert.js)

? **Pending** (Task 4):
- Integration of useStockValidation and StockVarianceAlert into stock entry forms:
  - OpeningStock form
  - ClosingStock form
  - TankTransfer form

### Integration Instructions (When Ready)

When ready to complete Phase 1 integration (Task 4):

1. Locate form components (likely in `fms.frontend/src/pages/tankStock/forms/` or `management/`)
2. Import hook and component:
```javascript
import { useStockValidation } from '../hooks/useStockValidation';
import StockVarianceAlert from '../components/StockVarianceAlert';
```

3. Add hook in form component:
```javascript
const {
  expectedStock,
  actualStock,
  variance,
  severity,
  loading: validationLoading,
  breakdown
} = useStockValidation(
  tankId,           // From form state
  entryDate,        // From form state
  'Opening',        // 'Opening', 'Closing', or 'Transfer'
  enteredAmount,    // Current value from form input
  true              // enabled
);
```

4. Add component in JSX below amount input:
```jsx
<StockVarianceAlert
  expectedStock={expectedStock}
  actualStock={actualStock}
  variance={variance}
  severity={severity}
  loading={validationLoading}
  breakdown={breakdown}
/>
```

5. Add high variance confirmation dialog:
```javascript
const handleSubmit = async () => {
  if (severity === 'high' && !userConfirmed) {
    const confirmed = window.confirm(
      `High variance detected (>${2 * varianceThreshold}%).\n` +
      `Expected: ${expectedStock}L, Entered: ${actualStock}L, Variance: ${variance}L.\n` +
      `Proceed anyway?`
    );
    if (!confirmed) return;
    setUserConfirmed(true);
  }

  // Proceed with form submission...
};
```

---

## Success Metrics

### Phase 2 Success Indicators:
- ? Menu item appears under Tank Stock section
- ? Page loads without errors
- ? Tank selection works correctly
- ? Date range selection works correctly
- ? Apply button triggers API call successfully
- ? Summary cards display correct metrics
- ? Chart renders with correct data and colors
- ? Grid displays periods with expandable rows
- ? Help popup opens and displays documentation
- ? Export to Excel functionality works
- ? Permissions enforced correctly
- ? No console errors or warnings
- ? Mobile responsive layout works

### Phase 1 Success Indicators (When Integrated):
- Real-time validation triggers on amount input
- Alert displays with correct severity colors
- Breakdown popover shows dispensing details
- High variance confirmation dialog appears
- Forms can be submitted after confirmation
- No performance issues with debounced API calls

---

## Contact & Support

For issues or questions:
- Check browser console for errors
- Verify database scripts executed successfully
- Confirm user has _Read_tankStock permission
- Review SystemConfiguration entries for correct values
- Check backend logs for API errors

---

## Appendix: Configuration Values

### Default Variance Thresholds
- **Percentage Threshold**: 5% (configurable: 0-100%)
- **Absolute Threshold**: 50 liters (configurable: 0-10,000L)

### Severity Calculation Logic
```
ACCEPTABLE (Green):
  - Variance % = Percentage Threshold AND
  - Variance Absolute = Absolute Threshold

MODERATE (Yellow):
  - Percentage Threshold < Variance % = 2 × Percentage Threshold OR
  - Absolute Threshold < Variance Absolute = 2 × Absolute Threshold

HIGH (Red):
  - Variance % > 2 × Percentage Threshold OR
  - Variance Absolute > 2 × Absolute Threshold
```

### Example Scenarios
See `Documentation/Features/TankStock/TransferReconciliation/SystemConfiguration.md` for detailed examples with different tank sizes and variance scenarios.

---

**Document Version**: 1.0
**Last Updated**: 2024
**Status**: Phase 2 Ready for Deployment, Phase 1 Integration Pending
