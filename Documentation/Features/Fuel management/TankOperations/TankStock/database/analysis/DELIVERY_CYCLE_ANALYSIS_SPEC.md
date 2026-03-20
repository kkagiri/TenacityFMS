# Delivery Cycle Analysis - Feature Specification

## Overview
This feature analyzes tank stock behavior between delivery events, tracking how stock flows from one delivery to the next (or until closing date). This helps identify consumption patterns, optimal delivery schedules, and potential issues during delivery cycles.

---

## Business Use Cases

### 1. Delivery Cycle Performance
**Question:** "How did the tank perform from last delivery until the next delivery (or month end)?"

**Analysis includes:**
- Opening stock at start of cycle
- Delivery received (if any)
- Total dispensing during cycle
- Expected vs Actual closing
- Variance accumulation
- Days until stock would run out
- Consumption rate (liters/day)

### 2. Monthly Analysis
**Question:** "What happened to the stock from opening of the month until closing?"

**Analysis includes:**
- Month opening stock
- All deliveries in the month
- Total dispensing
- Net variance
- Stock turnover rate
- Average daily consumption

### 3. Between-Delivery Analysis
**Question:** "How much stock was consumed between two specific deliveries?"

**Analysis includes:**
- Stock level before delivery 1
- Stock level after delivery 1
- Stock level before delivery 2
- Actual consumption vs expected
- Variance during the cycle
- Number of days in cycle
- Average consumption rate

---

## Proposed API Endpoints

### 1. Delivery Cycle Analysis
```
GET /api/tankstock/delivery-cycle-analysis
```

**Parameters:**
```json
{
  "tankId": 5,
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "analysisType": "BetweenDeliveries" // or "Monthly" or "UntilNextDelivery"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tankId": 5,
    "tankName": "Tank A",
    "analysisType": "BetweenDeliveries",
    "cycles": [
      {
        "cycleNumber": 1,
        "cycleStartDate": "2025-10-01",
        "cycleEndDate": "2025-10-15",
        "daysInCycle": 15,
        "openingStock": 1000.00,
        "deliveryReceived": 5000.00,
        "stockAfterDelivery": 6000.00,
        "totalDispensing": 4500.00,
        "totalTransferOut": 200.00,
        "totalTransferIn": 0.00,
        "expectedClosing": 1300.00,
        "actualClosing": 1280.00,
        "cycleVariance": -20.00,
        "variancePercent": -1.54,
        "averageConsumptionPerDay": 300.00,
        "daysToStockout": 4.27,
        "deliveryDetails": [
          {
            "date": "2025-10-01",
            "volume": 5000.00,
            "beforeDelivery": 1000.00,
            "afterDelivery": 6000.00
          }
        ]
      },
      {
        "cycleNumber": 2,
        "cycleStartDate": "2025-10-16",
        "cycleEndDate": "2025-10-31",
        "daysInCycle": 16,
        // ... similar structure
      }
    ],
    "summary": {
      "totalCycles": 2,
      "totalDeliveries": 2,
      "totalDeliveryVolume": 10000.00,
      "totalDispensing": 9000.00,
      "totalVariance": -50.00,
      "averageCycleLength": 15.5,
      "averageDailyConsumption": 290.32,
      "overallVariancePercent": -0.83
    }
  }
}
```

---

## Database Query Logic

### Get Delivery Events
```sql
SELECT
    EntryDate,
    ManualOpeningLevel,
    ManualClosingLevel,
    SensorOpeningLevel,
    SensorClosingLevel
FROM tankstocks
WHERE TankId = @TankId
  AND EntryType = 'Delivery'
  AND EntryDate BETWEEN @StartDate AND @EndDate
ORDER BY EntryDate;
```

### Get Daily Stock Data Between Deliveries
```sql
SELECT
    EntryDate,
    EntryType,
    ManualOpeningLevel,
    ManualClosingLevel,
    SensorOpeningLevel,
    SensorClosingLevel,
    ExpectedClosingLevel
FROM tankstocks
WHERE TankId = @TankId
  AND EntryDate BETWEEN @CycleStartDate AND @CycleEndDate
ORDER BY EntryDate, EntryType;
```

---

## Calculation Formulas

### 1. Cycle Opening Stock
```
Cycle Opening = Stock level at start of cycle (before any delivery)
```

### 2. Stock After Delivery
```
Stock After Delivery = Opening Stock + Delivery Volume
```

### 3. Expected Closing
```
Expected Closing = Stock After Delivery - Total Dispensing - Transfer Out + Transfer In
```

### 4. Cycle Variance
```
Cycle Variance = Actual Closing - Expected Closing
```

### 5. Average Daily Consumption
```
Average Daily Consumption = Total Dispensing / Days in Cycle
```

### 6. Days to Stockout
```
Days to Stockout = Current Stock Level / Average Daily Consumption
```

### 7. Stock Turnover Rate
```
Stock Turnover = Total Dispensing / Average Stock Level
```

---

## Implementation Plan

### Phase 1: Backend (C# .NET)

#### 1.1 Create DTO
**File:** `FMS.Application/Features/TankManagement/Queries/GetDeliveryCycleAnalysisQuery.cs`

```csharp
public record GetDeliveryCycleAnalysisQuery(
    int TankId,
    DateTime StartDate,
    DateTime EndDate,
    DeliveryCycleAnalysisType AnalysisType = DeliveryCycleAnalysisType.BetweenDeliveries
) : IRequest<FMSResponse<DeliveryCycleAnalysisResult>>;

public enum DeliveryCycleAnalysisType
{
    BetweenDeliveries,  // Analyze each delivery-to-delivery cycle
    Monthly,             // Analyze full month cycles
    UntilNextDelivery,  // From opening to next delivery only
    Custom              // User-defined cycle
}

public class DeliveryCycleAnalysisResult
{
    public int TankId { get; set; }
    public string TankName { get; set; }
    public DeliveryCycleAnalysisType AnalysisType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<DeliveryCycle> Cycles { get; set; }
    public CycleSummary Summary { get; set; }
}

public class DeliveryCycle
{
    public int CycleNumber { get; set; }
    public DateTime CycleStartDate { get; set; }
    public DateTime CycleEndDate { get; set; }
    public int DaysInCycle { get; set; }

    public decimal OpeningStock { get; set; }
    public decimal DeliveryReceived { get; set; }
    public decimal StockAfterDelivery { get; set; }

    public decimal TotalDispensing { get; set; }
    public decimal TotalTransferOut { get; set; }
    public decimal TotalTransferIn { get; set; }

    public decimal ExpectedClosing { get; set; }
    public decimal ActualClosing { get; set; }
    public decimal CycleVariance { get; set; }
    public decimal VariancePercent { get; set; }

    public decimal AverageConsumptionPerDay { get; set; }
    public decimal DaysToStockout { get; set; }

    public List<DeliveryDetail> DeliveryDetails { get; set; }
}

public class DeliveryDetail
{
    public DateTime Date { get; set; }
    public decimal Volume { get; set; }
    public decimal BeforeDelivery { get; set; }
    public decimal AfterDelivery { get; set; }
}

public class CycleSummary
{
    public int TotalCycles { get; set; }
    public int TotalDeliveries { get; set; }
    public decimal TotalDeliveryVolume { get; set; }
    public decimal TotalDispensing { get; set; }
    public decimal TotalVariance { get; set; }
    public double AverageCycleLength { get; set; }
    public decimal AverageDailyConsumption { get; set; }
    public decimal OverallVariancePercent { get; set; }
}
```

#### 1.2 Create Handler
**File:** `FMS.Application/Features/TankManagement/Queries/GetDeliveryCycleAnalysisQueryHandler.cs`

```csharp
public class GetDeliveryCycleAnalysisQueryHandler
    : IRequestHandler<GetDeliveryCycleAnalysisQuery, FMSResponse<DeliveryCycleAnalysisResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeliveryCycleAnalysisQueryHandler> _logger;

    public async Task<FMSResponse<DeliveryCycleAnalysisResult>> Handle(
        GetDeliveryCycleAnalysisQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Get all deliveries in date range
        var deliveries = await GetDeliveries(request.TankId, request.StartDate, request.EndDate);

        // 2. Get all tank stock data
        var stockData = await GetStockData(request.TankId, request.StartDate, request.EndDate);

        // 3. Identify cycle boundaries based on analysis type
        var cycleBoundaries = DetermineCycleBoundaries(
            request.AnalysisType,
            request.StartDate,
            request.EndDate,
            deliveries
        );

        // 4. Calculate metrics for each cycle
        var cycles = new List<DeliveryCycle>();
        foreach (var (start, end) in cycleBoundaries)
        {
            var cycle = CalculateCycleMetrics(start, end, stockData, deliveries);
            cycles.Add(cycle);
        }

        // 5. Calculate summary
        var summary = CalculateSummary(cycles);

        // 6. Return result
        return FMSResponse<DeliveryCycleAnalysisResult>.Success(new DeliveryCycleAnalysisResult
        {
            TankId = request.TankId,
            AnalysisType = request.AnalysisType,
            Cycles = cycles,
            Summary = summary
        });
    }

    private DeliveryCycle CalculateCycleMetrics(
        DateTime start,
        DateTime end,
        List<TankStockData> allData,
        List<DeliveryData> deliveries)
    {
        var cycleData = allData.Where(d => d.Date >= start && d.Date <= end).ToList();
        var cycleDeliveries = deliveries.Where(d => d.Date >= start && d.Date <= end).ToList();

        var openingStock = cycleData.First().OpeningLevel;
        var actualClosing = cycleData.Last().ClosingLevel;

        var totalDelivery = cycleDeliveries.Sum(d => d.Volume);
        var totalDispensing = cycleData.Sum(d => d.DispensingVolume);
        var totalTransferOut = cycleData.Sum(d => d.TransferOutVolume);
        var totalTransferIn = cycleData.Sum(d => d.TransferInVolume);

        var expectedClosing = openingStock + totalDelivery + totalTransferIn
                            - totalDispensing - totalTransferOut;

        var cycleVariance = actualClosing - expectedClosing;
        var variancePercent = expectedClosing != 0 ? (cycleVariance / expectedClosing) * 100 : 0;

        var daysInCycle = (end - start).Days + 1;
        var avgConsumption = totalDispensing / daysInCycle;
        var daysToStockout = avgConsumption > 0 ? actualClosing / avgConsumption : 0;

        return new DeliveryCycle
        {
            CycleStartDate = start,
            CycleEndDate = end,
            DaysInCycle = daysInCycle,
            OpeningStock = openingStock,
            DeliveryReceived = totalDelivery,
            StockAfterDelivery = openingStock + totalDelivery,
            TotalDispensing = totalDispensing,
            TotalTransferOut = totalTransferOut,
            TotalTransferIn = totalTransferIn,
            ExpectedClosing = expectedClosing,
            ActualClosing = actualClosing,
            CycleVariance = cycleVariance,
            VariancePercent = variancePercent,
            AverageConsumptionPerDay = avgConsumption,
            DaysToStockout = daysToStockout,
            DeliveryDetails = cycleDeliveries.Select(d => new DeliveryDetail
            {
                Date = d.Date,
                Volume = d.Volume,
                BeforeDelivery = d.BeforeLevel,
                AfterDelivery = d.AfterLevel
            }).ToList()
        };
    }
}
```

#### 1.3 Create Controller Endpoint
**File:** `FMS.WebClient/Controllers/TankStockController.cs`

```csharp
[HttpGet("delivery-cycle-analysis")]
public async Task<IActionResult> GetDeliveryCycleAnalysis(
    [FromQuery] int tankId,
    [FromQuery] DateTime startDate,
    [FromQuery] DateTime endDate,
    [FromQuery] DeliveryCycleAnalysisType analysisType = DeliveryCycleAnalysisType.BetweenDeliveries)
{
    var query = new GetDeliveryCycleAnalysisQuery(tankId, startDate, endDate, analysisType);
    var result = await _mediator.Send(query);

    return result.IsSuccess ? Ok(result) : BadRequest(result);
}
```

---

### Phase 2: Frontend (React)

#### 2.1 Create Redux Action
**File:** `fms.frontend/src/redux/actions/tankStockAction.js`

```javascript
export const fetchDeliveryCycleAnalysis = (tankId, startDate, endDate, analysisType = 'BetweenDeliveries') => async (dispatch) => {
  try {
    dispatch({ type: 'FETCH_DELIVERY_CYCLE_ANALYSIS_REQUEST' });

    const params = new URLSearchParams({
      tankId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      analysisType
    });

    const response = await axiosInstance.get(`/tankstock/delivery-cycle-analysis?${params}`);

    dispatch({
      type: 'FETCH_DELIVERY_CYCLE_ANALYSIS_SUCCESS',
      payload: response.data.data
    });

    return { success: true, data: response.data.data };
  } catch (error) {
    dispatch({
      type: 'FETCH_DELIVERY_CYCLE_ANALYSIS_FAILURE',
      payload: error.response?.data?.message || error.message
    });
    return { success: false, error: error.message };
  }
};
```

#### 2.2 Create Component
**File:** `fms.frontend/src/pages/tankStock/analytics/components/DeliveryCycleAnalysis.js`

```javascript
import React, { useState } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import DataGrid, {
  Column,
  Paging,
  Pager,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';
import { Chart, Series, Legend, Tooltip } from 'devextreme-react/chart';

const DeliveryCycleAnalysis = () => {
  const [analysisType, setAnalysisType] = useState('BetweenDeliveries');
  const [cycleData, setCycleData] = useState(null);

  const analysisTypes = [
    { value: 'BetweenDeliveries', text: 'Between Deliveries' },
    { value: 'Monthly', text: 'Monthly Cycles' },
    { value: 'UntilNextDelivery', text: 'Until Next Delivery' }
  ];

  return (
    <div className="tw-p-6">
      <h2>Delivery Cycle Analysis</h2>

      {/* Analysis Type Selector */}
      <SelectBox
        dataSource={analysisTypes}
        displayExpr="text"
        valueExpr="value"
        value={analysisType}
        onValueChanged={(e) => setAnalysisType(e.value)}
      />

      {/* Cycles Grid */}
      <DataGrid dataSource={cycleData?.cycles || []}>
        <Column dataField="cycleNumber" caption="Cycle #" />
        <Column dataField="cycleStartDate" caption="Start Date" dataType="date" />
        <Column dataField="cycleEndDate" caption="End Date" dataType="date" />
        <Column dataField="daysInCycle" caption="Days" />
        <Column dataField="openingStock" caption="Opening" format="#,##0.00" />
        <Column dataField="deliveryReceived" caption="Delivery" format="#,##0.00" />
        <Column dataField="totalDispensing" caption="Dispensing" format="#,##0.00" />
        <Column dataField="actualClosing" caption="Closing" format="#,##0.00" />
        <Column dataField="cycleVariance" caption="Variance" format="#,##0.00" />
        <Column dataField="averageConsumptionPerDay" caption="Avg/Day" format="#,##0.00" />
        <Column dataField="daysToStockout" caption="Days to Stockout" format="#,##0.0" />
      </DataGrid>

      {/* Chart */}
      <Chart dataSource={cycleData?.cycles || []}>
        <Series valueField="openingStock" name="Opening Stock" />
        <Series valueField="actualClosing" name="Closing Stock" />
        <Series valueField="deliveryReceived" name="Delivery" type="bar" />
      </Chart>
    </div>
  );
};
```

---

## Analysis Examples

### Example 1: Between Two Deliveries
```
Opening (Oct 1):  1000 L
Delivery (Oct 1): +5000 L
Stock after:      6000 L
Dispensing:       -4500 L (over 15 days)
Transfer Out:     -200 L
Expected Closing: 1300 L
Actual Closing:   1280 L
Variance:         -20 L (-1.54%)
Avg/Day:          300 L/day
Days to Stockout: 4.27 days
```

### Example 2: Monthly Analysis
```
Month: October 2025
Opening:          1000 L
Total Deliveries: 10000 L (2 deliveries)
Total Dispensing: 9000 L
Total Transfers:  -500 L
Expected Closing: 1500 L
Actual Closing:   1450 L
Variance:         -50 L (-3.33%)
Turnover Rate:    1.5 times
```

---

## Benefits

1. **Optimized Delivery Scheduling**: Know when to order next delivery based on consumption rate
2. **Inventory Management**: Track how long stock lasts between deliveries
3. **Loss Detection**: Identify which cycles have highest variance
4. **Consumption Patterns**: Understand daily usage trends
5. **Planning**: Forecast future delivery needs
6. **Performance Monitoring**: Compare cycle efficiency

---

## Next Steps

1. ✅ Review this specification
2. Implement backend query handler
3. Create frontend component
4. Add to Stock Analytics navigation
5. Create help documentation
6. Test with real data
7. Deploy to production

Would you like me to proceed with implementing this feature?
