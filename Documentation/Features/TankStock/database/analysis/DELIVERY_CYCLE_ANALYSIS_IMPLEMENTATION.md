# Delivery Cycle Analysis - Implementation Summary

## Overview

The Delivery Cycle Analysis feature tracks fuel consumption patterns and stock behavior between deliveries, providing detailed insights into:
- **Consumption rates** (per day, per month, actual monthly)
- **Stock adequacy** (days to stockout/runway)
- **Operational efficiency** (variance, turnover rate)
- **Trend visualization** (consumption, stock levels, variance)

## Features Implemented

### Backend (C# .NET)

#### 1. DTOs (`GetDeliveryCycleAnalysisQuery.cs`)
- **Location**: `FMS.Application/Features/TankStock/Queries/`
- **Classes**:
  - `GetDeliveryCycleAnalysisQuery`: Query request with tankId, startDate, endDate, analysisType
  - `DeliveryCycleAnalysisResult`: Response wrapper
  - `DeliveryCycle`: Individual cycle data with all metrics
  - `CycleSummary`: Aggregated statistics across cycles
  - `DeliveryCycleAnalysisType`: Enum (BetweenDeliveries, Monthly, UntilNextDelivery, Custom)

**Key Metrics in `DeliveryCycle`**:
```csharp
public decimal ConsumptionPerDay { get; set; }        // L/day
public decimal ConsumptionPerMonth { get; set; }      // Projected monthly (L)
public decimal? ActualMonthlyConsumption { get; set; } // Actual for full months
public decimal DaysToStockout { get; set; }           // Runway in days
public decimal StockTurnoverRate { get; set; }        // Efficiency metric
public decimal AverageStockLevel { get; set; }        // Average during cycle
```

#### 2. Handler (`GetDeliveryCycleAnalysisQueryHandler.cs`)
- **Location**: `FMS.Application/Features/TankStock/Queries/`
- **Key Methods**:
  - `DetermineCycleBoundaries()`: Creates cycle periods based on analysis type
  - `CalculateCycleMetrics()`: Computes all consumption and stock metrics
  - `CalculateSummary()`: Aggregates statistics (avg, min, max)

**Calculation Formulas**:
```csharp
// Daily consumption
consumptionPerDay = totalDispensing / daysInCycle

// Monthly consumption (projected)
consumptionPerMonth = consumptionPerDay * 30

// Actual monthly (only for cycles >= 28 days)
actualMonthlyConsumption = totalDispensing (if daysInCycle >= 28)

// Days to stockout (runway)
daysToStockout = closingStock / consumptionPerDay

// Stock turnover rate
stockTurnoverRate = totalDispensing / averageStockLevel

// Average stock level
averageStockLevel = (stockAfterDelivery + closingStock) / 2
```

#### 3. Controller Endpoint (`TankStockController.cs`)
- **Route**: `GET /tankstock/delivery-cycle-analysis`
- **Parameters**:
  - `tankId` (int, required)
  - `startDate` (DateTime, required)
  - `endDate` (DateTime, required)
  - `analysisType` (enum, default: BetweenDeliveries)
- **Authorization**: Requires `_Read_tankStock` permission
- **Response**: `FMSResponse<DeliveryCycleAnalysisResult>`

### Frontend (React + Redux)

#### 1. Redux Actions (`tankStockAction.js`)
- **Action Types**:
  - `FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST`
  - `FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS`
  - `FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE`

- **Action Creator**: `fetchDeliveryCycleAnalysis(tankId, startDate, endDate, analysisType)`
  - Full parameter validation (dates, tank ID, analysis type)
  - Date conversion to ISO format
  - Error handling and response normalization

#### 2. Redux Reducer (`tankStockReducer.js`)
- **State Added**:
  - `deliveryCycleAnalysis`: Stores analysis result
  - `deliveryCycleLoading`: Loading state flag
- **Handlers**: REQUEST, SUCCESS, FAILURE actions

#### 3. React Component (`DeliveryCycleAnalysis.js`)
- **Location**: `fms.frontend/src/pages/tankStock/analytics/`
- **Features**:
  - Analysis type selector (Between Deliveries, Monthly, Until Next Delivery)
  - Summary cards (Total Cycles, Avg Daily/Monthly Consumption, Avg Variance)
  - Chart visualization with 3 views:
    - Consumption Rates (daily, monthly, average baseline)
    - Stock Levels (opening, closing, average)
    - Variance Trends (bar chart with positive/negative colors)
  - DataGrid with detailed cycle data
  - Color-coded consumption rates (high/normal/low)
  - Days to stockout warnings (critical/warning/safe)
  - Variance color coding (green=surplus, red=shortage)
  - HelpPopup integration

**DataGrid Columns**:
- Cycle #, Start Date, End Date, Days in Cycle
- Opening Stock, Delivery, Stock After Delivery
- Total Dispensing, Closing Stock
- Daily Rate, Monthly Rate, Actual Monthly (conditional)
- Variance, Days to Stockout, Turnover Rate
- Summary row with totals and averages

#### 4. Help Documentation (`DeliveryCycleAnalysisHelp.js`)
- **Sections**:
  - Overview and analysis types explanation
  - Key metrics with formulas and examples
  - Sample cycle calculation walkthrough
  - Color coding guide
  - Chart visualization explanations
  - Best practices for usage
  - Troubleshooting common issues

#### 5. Styling (`DeliveryCycleAnalysis.scss`)
- Summary cards with hover effects
- Chart container styling
- DataGrid with color-coded cells:
  - Consumption rates (red/green/blue)
  - Days to stockout (red/orange/green)
  - Variance (green/red)
- Responsive adjustments for mobile

#### 6. Navigation Integration (`StockAnalytics.js`)
- Added "Delivery Cycle Analysis" tab
- Icon: `fa-light fa-truck-clock`
- Position: After "Variance Analysis", before "Tank Stock Table"
- Lazy loading support

## Analysis Types Explained

### 1. Between Deliveries
- **Use Case**: Operational insights, delivery planning
- **Cycle Definition**: From one delivery to just before the next
- **Best For**: Understanding consumption patterns between refills

### 2. Monthly
- **Use Case**: Financial planning, budgeting
- **Cycle Definition**: Calendar month boundaries
- **Best For**: Month-over-month comparisons, reporting

### 3. Until Next Delivery
- **Use Case**: Cumulative tracking
- **Cycle Definition**: From start date to each subsequent delivery
- **Best For**: Tracking consumption leading up to refills

## Key Metrics and Their Purpose

| Metric | Formula | Use Case |
|--------|---------|----------|
| Consumption Per Day | Dispensing ÷ Days | Normalized daily usage |
| Consumption Per Month | Daily × 30 | Forecasting, budgeting |
| Actual Monthly | Dispensing (if ≥28 days) | True monthly consumption |
| Days to Stockout | Closing ÷ Daily Rate | Delivery scheduling |
| Stock Turnover Rate | Dispensing ÷ Avg Stock | Efficiency measurement |
| Variance | Actual - Expected | Loss detection |
| Average Stock Level | (After Delivery + Closing) ÷ 2 | Working capital analysis |

## Color Coding System

### Consumption Rates
- **Red**: >20% above average (investigate high usage)
- **Green**: Within ±20% of average (normal)
- **Blue**: <20% below average (check for issues)

### Days to Stockout
- **Red (Critical)**: ≤3 days - immediate delivery needed
- **Orange (Warning)**: 4-7 days - plan delivery soon
- **Green (Safe)**: >7 days - adequate stock

### Variance
- **Green**: Positive (surplus stock)
- **Red**: Negative (shortage/loss)

## Usage Workflow

1. **Select Analysis Type**: Choose based on your use case
2. **Apply Filters**: Use shared header filters (tank, date range)
3. **Review Summary**: Check aggregate metrics in top cards
4. **Analyze Chart**: Select view (consumption/stock/variance)
5. **Examine Details**: Review DataGrid for cycle-by-cycle data
6. **Export Data**: Use DevExtreme export for reporting
7. **Get Help**: Click help icon for detailed explanations

## Integration Points

### Shared Context
- Uses `StockFilterContext` for tank selection and date range
- Auto-fetches when filters change
- No duplicate filter UI (consistent with Variance Analysis)

### Redux Store
- State path: `state.tankStock.deliveryCycleAnalysis`
- Loading state: `state.tankStock.deliveryCycleLoading`
- Error state: `state.tankStock.error`

### Backend Integration
- Queries `Tankstocks` table
- Filters by `EntryType`: Delivery, Dispensing, TransferIn/Out, Opening/Closing Stock
- Groups by date and delivery events
- Returns cycles with pre-calculated metrics

## Files Created/Modified

### Backend Files (Created)
1. `FMS.Application/Features/TankStock/Queries/GetDeliveryCycleAnalysisQuery.cs`
2. `FMS.Application/Features/TankStock/Queries/GetDeliveryCycleAnalysisQueryHandler.cs`

### Backend Files (Modified)
3. `FMS.WebClient/Controllers/TankStockController.cs` - Added endpoint

### Frontend Files (Created)
4. `fms.frontend/src/pages/tankStock/analytics/DeliveryCycleAnalysis.js`
5. `fms.frontend/src/pages/tankStock/analytics/DeliveryCycleAnalysis.scss`
6. `fms.frontend/src/pages/tankStock/analytics/DeliveryCycleAnalysisHelp.js`

### Frontend Files (Modified)
7. `fms.frontend/src/redux/actions/tankStockAction.js` - Added actions
8. `fms.frontend/src/redux/reducers/tankStockReducer.js` - Added state/handlers
9. `fms.frontend/src/pages/tankStock/analytics/StockAnalytics.js` - Added tab

## Testing Checklist

- [ ] Backend endpoint returns correct data structure
- [ ] Cycle boundaries calculated correctly for each analysis type
- [ ] Consumption rates match manual calculations
- [ ] Days to stockout warnings appear at correct thresholds
- [ ] Chart views switch correctly (consumption, stock, variance)
- [ ] DataGrid sorting and filtering work
- [ ] Color coding applies correctly based on thresholds
- [ ] Summary cards show accurate aggregates
- [ ] Help popup displays with all sections
- [ ] Mobile responsive layout works
- [ ] Export to Excel functions properly
- [ ] Error handling works for invalid parameters
- [ ] Loading states display correctly
- [ ] Authorization restricts access properly

## Next Steps

1. **Test with real data** across different tanks and date ranges
2. **Validate calculations** against manual spreadsheet calculations
3. **Get user feedback** on UI/UX and metric usefulness
4. **Consider enhancements**:
   - Add comparison view (multiple tanks side-by-side)
   - Export report generation (PDF with charts)
   - Alert configuration (notify when days to stockout < threshold)
   - Historical trend comparison (year-over-year)
   - Integration with delivery scheduling system

## Performance Considerations

- Backend query is optimized with proper indexing on `TankId` and `EntryDate`
- Frontend uses React hooks (useCallback) to prevent unnecessary re-renders
- Chart re-renders only when data or view changes
- DataGrid uses DevExtreme virtual scrolling for large datasets
- Redux state is normalized to avoid duplication

## Maintenance Notes

- Formulas are centralized in backend handler - easy to update
- Help documentation should be updated if formulas change
- Color thresholds are hardcoded - consider making configurable
- Analysis type enum is shared between backend and frontend - keep in sync

---

**Implementation Date**: June 2024
**Developer**: GitHub Copilot
**Architecture**: Clean Architecture + CQRS
**Status**: ✅ Complete and ready for testing
