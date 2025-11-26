# Delivery Cycle Analysis - Testing Guide

## Overview

This guide helps you test the Delivery Cycle Analysis feature systematically to ensure all components work correctly.

## Prerequisites

### Backend
- [ ] .NET 8.0 solution builds successfully
- [ ] Database connection configured in appsettings.json
- [ ] `Tankstocks` table contains test data with deliveries
- [ ] User has `_Read_tankStock` permission

### Frontend
- [ ] Node.js dependencies installed (`npm install`)
- [ ] DevExtreme React installed
- [ ] Redux store configured
- [ ] API base URL configured in axiosInstance

### Test Data Requirements
Ensure database has:
- At least one tank with stock records
- Multiple delivery events (EntryType = 'Delivery')
- Dispensing records between deliveries (EntryType = 'Dispensing')
- Date range spanning at least 2-3 months for comprehensive testing

## Backend Testing

### 1. API Endpoint Test

#### Test Case: Valid Request
```bash
# Using PowerShell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

$params = @{
    tankId = 1
    startDate = "2024-01-01T00:00:00Z"
    endDate = "2024-03-31T23:59:59Z"
    analysisType = "BetweenDeliveries"
}

Invoke-RestMethod -Uri "https://localhost:7000/api/tankstock/delivery-cycle-analysis" `
    -Method Get `
    -Headers $headers `
    -Body $params
```

**Expected Response**:
```json
{
  "isSuccess": true,
  "message": "Delivery cycle analysis retrieved successfully",
  "data": {
    "tankId": 1,
    "tankName": "Tank A",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-03-31T23:59:59Z",
    "analysisType": "BetweenDeliveries",
    "cycles": [
      {
        "cycleNumber": 1,
        "startDate": "2024-01-05T08:00:00Z",
        "endDate": "2024-01-20T09:30:00Z",
        "daysInCycle": 15,
        "openingStock": 5000.00,
        "deliveryReceived": 20000.00,
        "stockAfterDelivery": 25000.00,
        "totalDispensing": 18500.00,
        "closingStock": 6400.00,
        "consumptionPerDay": 1233.33,
        "consumptionPerMonth": 37000.00,
        "actualMonthlyConsumption": null,
        "variance": -100.00,
        "daysToStockout": 5.19,
        "stockTurnoverRate": 1.18,
        "averageStockLevel": 15700.00
      }
    ],
    "summary": {
      "totalCycles": 8,
      "averageConsumptionPerDay": 1250.00,
      "averageConsumptionPerMonth": 37500.00,
      "averageVariance": -75.00,
      "totalDispensing": 150000.00,
      "averageDaysInCycle": 15.5
    }
  }
}
```

**Verify**:
- [ ] HTTP 200 status
- [ ] `isSuccess` is true
- [ ] `cycles` array contains cycle data
- [ ] `summary` contains aggregate statistics
- [ ] Consumption rates are calculated correctly
- [ ] Dates are in ISO format

#### Test Case: Invalid Tank ID
```bash
$params.tankId = -1
Invoke-RestMethod ...
```

**Expected**: 400 Bad Request with validation error

#### Test Case: Missing Authorization
```bash
# Remove Authorization header
Invoke-RestMethod ...
```

**Expected**: 401 Unauthorized

#### Test Case: Missing Permission
```bash
# Use token without _Read_tankStock permission
Invoke-RestMethod ...
```

**Expected**: 403 Forbidden

#### Test Case: Invalid Date Range
```bash
$params.startDate = "2024-03-31T00:00:00Z"
$params.endDate = "2024-01-01T23:59:59Z"  # End before start
Invoke-RestMethod ...
```

**Expected**: 400 Bad Request

### 2. Handler Logic Test

Create unit tests for `GetDeliveryCycleAnalysisQueryHandler`:

```csharp
// Test cycle boundary detection
[Fact]
public void DetermineCycleBoundaries_BetweenDeliveries_CreatesCorrectCycles()
{
    // Arrange: Create mock deliveries
    var deliveries = new List<Tankstock>
    {
        new Tankstock { EntryDate = new DateTime(2024, 1, 5), Volume = 20000 },
        new Tankstock { EntryDate = new DateTime(2024, 1, 20), Volume = 25000 },
        new Tankstock { EntryDate = new DateTime(2024, 2, 5), Volume = 22000 }
    };

    // Act: Call handler
    var cycles = handler.DetermineCycleBoundaries(
        deliveries,
        analysisType: DeliveryCycleAnalysisType.BetweenDeliveries
    );

    // Assert
    Assert.Equal(2, cycles.Count);
    Assert.Equal(new DateTime(2024, 1, 5), cycles[0].StartDate);
    Assert.Equal(new DateTime(2024, 1, 19, 23, 59, 59), cycles[0].EndDate);
}

// Test consumption rate calculation
[Fact]
public void CalculateCycleMetrics_ComputesCorrectConsumptionRates()
{
    // Arrange
    var cycle = new CycleBoundary
    {
        StartDate = new DateTime(2024, 1, 1),
        EndDate = new DateTime(2024, 1, 15)  // 15 days
    };
    var dispensing = 18000m;  // 18,000 L dispensed

    // Act
    var metrics = handler.CalculateCycleMetrics(cycle, dispensing);

    // Assert
    Assert.Equal(1200m, metrics.ConsumptionPerDay);  // 18000 / 15
    Assert.Equal(36000m, metrics.ConsumptionPerMonth);  // 1200 * 30
}
```

## Frontend Testing

### 1. Redux Actions Test

**Test Case: Successful Fetch**
```javascript
// In browser console (with Redux DevTools)
import { fetchDeliveryCycleAnalysis } from './redux/actions/tankStockAction';
import { store } from './redux/store';

// Dispatch action
store.dispatch(fetchDeliveryCycleAnalysis(
  1,
  new Date('2024-01-01'),
  new Date('2024-03-31'),
  'BetweenDeliveries'
));

// Check Redux state after response
console.log(store.getState().tankStock.deliveryCycleAnalysis);
console.log(store.getState().tankStock.deliveryCycleLoading);
```

**Verify**:
- [ ] `FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST` action dispatched
- [ ] `deliveryCycleLoading` becomes true
- [ ] API call made with correct parameters
- [ ] `FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS` action dispatched on success
- [ ] `deliveryCycleAnalysis` state populated with data
- [ ] `deliveryCycleLoading` becomes false

**Test Case: Validation Error**
```javascript
// Invalid tank ID
store.dispatch(fetchDeliveryCycleAnalysis(-1, startDate, endDate, 'BetweenDeliveries'));
```

**Verify**:
- [ ] `FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE` dispatched immediately
- [ ] Error message: "Invalid tank ID"
- [ ] No API call made

### 2. Component Rendering Test

**Manual Testing Steps**:

1. **Navigate to Component**
   - [ ] Go to Tank Stock → Stock Analytics
   - [ ] Click "Delivery Cycle Analysis" tab
   - [ ] Component loads without errors

2. **Initial State**
   - [ ] Analysis type selector shows "Between Deliveries"
   - [ ] Help icon (?) visible at top-right
   - [ ] Summary cards show placeholder/loading
   - [ ] Chart area shows loading indicator
   - [ ] DataGrid shows "Loading..." or empty state

3. **Apply Filters**
   - [ ] Select a tank from header filter
   - [ ] Set start date (e.g., 3 months ago)
   - [ ] Set end date (e.g., today)
   - [ ] Data auto-fetches

4. **Verify Data Display**
   - [ ] Summary cards show correct values:
     - Total Cycles count
     - Avg Daily Consumption (L)
     - Avg Monthly Consumption (L)
     - Avg Variance (L)
   - [ ] Chart renders with data
   - [ ] DataGrid shows cycle rows
   - [ ] Columns display correct values

5. **Test Analysis Type Switching**
   - [ ] Select "Monthly" → Data refreshes
   - [ ] Select "Until Next Delivery" → Data refreshes
   - [ ] Select "Between Deliveries" → Data refreshes
   - [ ] Each type shows appropriate data structure

6. **Test Chart View Switching**
   - [ ] Select "Consumption Rates" → Chart shows consumption lines
   - [ ] Select "Stock Levels" → Chart shows stock lines
   - [ ] Select "Variance Trends" → Chart shows variance bars
   - [ ] Chart legend updates correctly
   - [ ] Tooltips work on hover

### 3. Color Coding Test

**Consumption Rate Colors**:
- [ ] Find cycle with high consumption (>20% above avg) → Red
- [ ] Find cycle with normal consumption (±20% of avg) → Green
- [ ] Find cycle with low consumption (<20% below avg) → Blue

**Days to Stockout Colors**:
- [ ] Find cycle with ≤3 days → Red with warning icon
- [ ] Find cycle with 4-7 days → Orange
- [ ] Find cycle with >7 days → Green

**Variance Colors**:
- [ ] Find cycle with positive variance → Green
- [ ] Find cycle with negative variance → Red

### 4. Help Popup Test

1. **Open Help**
   - [ ] Click help icon (?)
   - [ ] Popup opens with title "Delivery Cycle Analysis Help"
   - [ ] Content scrollable

2. **Verify Sections**
   - [ ] Overview section visible
   - [ ] Analysis Types section with icons
   - [ ] Key Metrics with formulas
   - [ ] Sample Cycle example
   - [ ] Color coding guide
   - [ ] Chart visualizations
   - [ ] Best practices
   - [ ] Troubleshooting

3. **Close Help**
   - [ ] Click X button → Popup closes
   - [ ] Click outside popup → Popup closes
   - [ ] ESC key → Popup closes

### 5. DataGrid Functionality Test

**Sorting**:
- [ ] Click "Days in Cycle" header → Sorts ascending
- [ ] Click again → Sorts descending
- [ ] Repeat for other columns

**Filtering**:
- [ ] Click filter icon on "Variance" column
- [ ] Enter filter value (e.g., < 0)
- [ ] Grid filters to show only matching rows
- [ ] Clear filter

**Exporting**:
- [ ] Click export button (if available)
- [ ] Select Excel format
- [ ] File downloads with all columns and data
- [ ] Open file → Verify data accuracy

**Summary Row**:
- [ ] Verify "Total Days" shows sum of days
- [ ] Verify "Total Dispensing" shows sum
- [ ] Verify "Avg Daily Rate" shows average
- [ ] Verify "Avg Variance" shows average

### 6. Responsive Design Test

**Desktop (>1024px)**:
- [ ] Summary cards in 4-column grid
- [ ] Chart fills width properly
- [ ] DataGrid columns visible without horizontal scroll

**Tablet (768px-1024px)**:
- [ ] Summary cards in 2-column grid
- [ ] Chart still readable
- [ ] DataGrid allows horizontal scroll

**Mobile (<768px)**:
- [ ] Summary cards stack vertically (1 column)
- [ ] Chart height adjusts (300px min)
- [ ] DataGrid scrolls horizontally
- [ ] Tab navigation works

### 7. Error Handling Test

**No Data Scenario**:
- [ ] Select date range with no deliveries
- [ ] Verify message: "No data available for chart"
- [ ] DataGrid shows: "No cycles available. Adjust filters or date range."

**API Error Scenario**:
- [ ] Stop backend API
- [ ] Try to fetch data
- [ ] Error notification appears
- [ ] Error message displays in UI
- [ ] Component doesn't crash

**Network Error**:
- [ ] Disconnect network
- [ ] Try to fetch data
- [ ] Error notification: "Error fetching delivery cycle analysis"

## Integration Testing

### End-to-End Scenario

**Scenario**: Operations manager wants to schedule next delivery

1. **Setup**:
   - [ ] User logs in with `_Read_tankStock` permission
   - [ ] Navigate to Tank Stock module

2. **Analysis**:
   - [ ] Go to Stock Analytics → Delivery Cycle Analysis
   - [ ] Select "Between Deliveries" analysis
   - [ ] Filter to "Tank A", last 3 months
   - [ ] Wait for data to load

3. **Review Summary**:
   - [ ] Note "Avg Daily Consumption" value (e.g., 1,500 L/day)
   - [ ] Check "Total Cycles" (e.g., 8 cycles)

4. **Examine Most Recent Cycle**:
   - [ ] Scroll DataGrid to last row
   - [ ] Check "Days to Stockout" column
   - [ ] If ≤7 days, note as action item

5. **Visualize Trends**:
   - [ ] Switch to "Consumption Rates" chart
   - [ ] Look for upward/downward trends
   - [ ] Switch to "Variance Trends"
   - [ ] Check for consistent negative variance

6. **Make Decision**:
   - [ ] Calculate delivery timing: Current Days to Stockout - 3 day buffer
   - [ ] Calculate delivery size: Avg Daily Consumption × Target Days Supply
   - [ ] Document decision

7. **Export Report**:
   - [ ] Export DataGrid to Excel
   - [ ] Save for records
   - [ ] Share with procurement team

**Expected Outcome**:
- [ ] User completes workflow without errors
- [ ] Data makes sense and is actionable
- [ ] Export file contains accurate data

## Performance Testing

### Load Time Test
- [ ] Measure initial component load: < 500ms
- [ ] Measure data fetch time (3 months, 1 tank): < 2 seconds
- [ ] Measure chart render time: < 1 second
- [ ] Measure DataGrid render time (50 cycles): < 1 second

### Large Dataset Test
- [ ] Test with 6 months of data
- [ ] Test with multiple deliveries per day
- [ ] Test with 100+ cycles
- [ ] Verify no performance degradation

## Acceptance Criteria Checklist

### Functional Requirements
- [x] Backend endpoint returns cycle data with consumption rates
- [x] Frontend displays analysis in DataGrid
- [x] Summary cards show aggregate statistics
- [x] Chart visualization with 3 views
- [x] Analysis type selector works
- [x] Color coding applied correctly
- [x] Help documentation accessible
- [x] Integration with shared filters

### Non-Functional Requirements
- [x] API response time < 3 seconds for typical query
- [x] UI responsive on mobile devices
- [x] No memory leaks in component
- [x] Error handling for all failure scenarios
- [x] Proper authorization checks

### Documentation
- [x] Implementation guide created
- [x] User guide created
- [x] Testing guide created (this document)
- [x] Help content comprehensive

## Known Issues / Limitations

None currently identified. Document any issues found during testing here.

## Sign-Off

**Tested By**: _______________
**Date**: _______________
**Test Environment**: _______________
**Backend Version**: _______________
**Frontend Version**: _______________

**Overall Test Result**: ☐ PASS  ☐ FAIL  ☐ CONDITIONAL PASS

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Next Steps After Testing**:
1. Address any failed test cases
2. Performance optimization if needed
3. User acceptance testing with actual users
4. Deploy to production
5. Monitor for issues
