# Delivery Cycle Analysis - User Guide

## Quick Start

1. **Navigate** to Tank Stock → Stock Analytics
2. **Select** the "Delivery Cycle Analysis" tab
3. **Choose** your analysis type (Between Deliveries, Monthly, or Until Next Delivery)
4. **Apply filters** using the header controls:
   - Select a tank
   - Set date range
5. **View results** in summary cards, charts, and detailed data grid

## What is Delivery Cycle Analysis?

Delivery Cycle Analysis helps you understand fuel consumption patterns between deliveries or within specific time periods. It answers questions like:

- How much fuel are we consuming per day/month?
- When will we run out of stock?
- Are we experiencing unusual consumption patterns?
- Is our stock level adequate?
- Are there fuel losses or gains?

## Analysis Types

### Between Deliveries
**When to use**: Daily operations, delivery planning

Tracks consumption from one delivery to the next. Each cycle shows:
- Opening stock when delivery arrived
- Delivery amount received
- Total fuel dispensed during the cycle
- Closing stock before next delivery
- Consumption rates (daily and monthly)
- Days remaining until stockout

**Example**: Cycle 1 starts with Delivery A on June 1st and ends just before Delivery B on June 15th.

### Monthly
**When to use**: Financial reporting, budget planning

Divides the period into calendar months. Shows consumption patterns on a monthly basis for easier comparison across months.

**Example**: June 2024 (June 1-30), July 2024 (July 1-31), etc.

### Until Next Delivery
**When to use**: Cumulative tracking, trend analysis

Tracks consumption from your start date until each subsequent delivery event, showing cumulative patterns.

**Example**: From June 1st to Delivery A (June 8th), then from June 1st to Delivery B (June 15th).

## Understanding the Metrics

### Summary Cards (Top of Page)

**Total Cycles**: Number of complete periods analyzed
**Avg Daily Consumption**: Average liters consumed per day across all cycles
**Avg Monthly Consumption**: Projected monthly consumption (daily rate × 30)
**Avg Variance**: Average difference between expected and actual stock

### Chart Visualizations

**Consumption Rates Chart**:
- Blue line: Daily consumption rate
- Orange line: Monthly consumption (projected)
- Green dashed line: Average daily consumption baseline
- Use this to spot trends and anomalies

**Stock Levels Chart**:
- Shows opening, closing, and average stock across cycles
- Helps visualize stock adequacy over time
- Identify patterns in inventory management

**Variance Trends Chart**:
- Bar chart showing positive (green) or negative (red) variance
- Consistent negative variance may indicate losses or measurement issues
- Positive variance may indicate unrecorded inflows or measurement gains

### Data Grid Columns

| Column | Meaning |
|--------|---------|
| **#** | Cycle number |
| **Start Date** | When cycle begins |
| **End Date** | When cycle ends |
| **Days** | Duration of cycle |
| **Opening Stock** | Stock at start of cycle |
| **Delivery** | Fuel received during cycle |
| **After Delivery** | Stock immediately after delivery |
| **Dispensing** | Total fuel sold/dispensed |
| **Closing Stock** | Stock at end of cycle |
| **Daily Rate** | Liters consumed per day (color-coded) |
| **Monthly Rate** | Projected monthly consumption (L) |
| **Actual Monthly** | True monthly consumption (only if cycle ≥ 28 days) |
| **Variance** | Difference between expected and actual closing stock |
| **Days to Stockout** | Estimated days until tank empty (color-coded) |
| **Turnover Rate** | Stock efficiency metric |

## Color Coding Guide

### Daily Consumption Rate
- 🔴 **Red**: High consumption (>20% above average) - investigate cause
- 🟢 **Green**: Normal consumption (within ±20% of average)
- 🔵 **Blue**: Low consumption (<20% below average) - check for issues

### Days to Stockout
- 🔴 **Red (Critical)**: ≤ 3 days - immediate delivery needed ⚠️
- 🟠 **Orange (Warning)**: 4-7 days - schedule delivery soon
- 🟢 **Green (Safe)**: > 7 days - adequate stock

### Variance
- 🟢 **Green**: Positive (surplus) - more stock than expected
- 🔴 **Red**: Negative (shortage) - less stock than expected, possible losses

## Practical Use Cases

### 1. Delivery Scheduling
**Goal**: Avoid stockouts

1. Select "Between Deliveries" analysis type
2. Check "Days to Stockout" column
3. Look for cycles where days drop below 7 (orange/red)
4. Schedule deliveries to maintain >7 day buffer
5. Use daily consumption rate to calculate optimal delivery size

### 2. Budget Planning
**Goal**: Forecast fuel costs

1. Select "Monthly" analysis type
2. Review "Avg Monthly Consumption" summary card
3. Export data grid to Excel
4. Use average monthly consumption × fuel price for budget
5. Account for seasonal variations

### 3. Loss Detection
**Goal**: Identify fuel losses or theft

1. Look at Variance Trends chart
2. Check for consistent negative variance (red bars)
3. Review specific cycles with large negative variance
4. Investigate causes: leakage, theft, measurement errors, temperature changes
5. Variance > -5% warrants investigation

### 4. Efficiency Analysis
**Goal**: Optimize stock levels

1. Review "Turnover Rate" column
2. Higher turnover = faster stock rotation (more efficient)
3. Lower turnover = slow consumption or overstocking
4. Compare across tanks to identify outliers
5. Adjust delivery schedules based on turnover patterns

### 5. Consumption Trend Analysis
**Goal**: Identify seasonal patterns

1. Use "Monthly" analysis for a full year
2. Switch to "Consumption Rates" chart view
3. Look for seasonal peaks and valleys
4. Use insights for proactive planning (e.g., higher summer demand)

## Step-by-Step Example

### Scenario: Planning Next Delivery

**Current Situation**:
- Tank A current stock: 8,000 L
- Last delivery: 5 days ago
- Need to know when to schedule next delivery

**Steps**:

1. **Navigate** to Delivery Cycle Analysis tab
2. **Select** "Between Deliveries" analysis type
3. **Filter** to Tank A, last 3 months
4. **Review** summary card: Avg Daily Consumption = 1,500 L/day
5. **Check** most recent cycle in data grid:
   - Daily Rate: 1,600 L/day (slightly above average)
   - Days to Stockout: 5 days (orange warning)
6. **Calculate**: At 1,600 L/day, need delivery in ≤ 5 days
7. **Action**: Schedule delivery for 3 days from now to maintain buffer
8. **Delivery Size**: (1,600 L/day × 15 days target) = 24,000 L recommended

## Troubleshooting

### "No Cycles Displayed"
**Possible Causes**:
- Date range doesn't include any deliveries
- Selected tank has no stock records
- Analysis type doesn't match data pattern

**Solutions**:
- Extend date range
- Try "Monthly" analysis type
- Verify tank has recorded transactions

### Unusual Consumption Rates
**Possible Causes**:
- Data accuracy issues
- System downtime
- Actual consumption spike
- Seasonal variation

**Solutions**:
- Verify dispensing data for accuracy
- Check for system outages during period
- Compare with historical data
- Investigate operational changes

### High Negative Variance
**Possible Causes**:
- Fuel leakage
- Theft or unauthorized withdrawals
- Inaccurate measurements
- Missing delivery records
- Temperature compensation issues

**Solutions**:
- Physical tank inspection
- Calibrate measuring devices
- Review security footage
- Verify all transactions recorded
- Check temperature correction factors

## Tips for Success

1. **Regular Monitoring**: Review analysis weekly to catch issues early
2. **Maintain Buffer**: Keep minimum 7 days of stock to prevent emergencies
3. **Investigate Anomalies**: Look into any cycle with >5% variance
4. **Compare Tanks**: Analyze multiple tanks to identify outliers
5. **Export Data**: Use DevExtreme export to save reports for deeper analysis
6. **Track Trends**: Monitor month-over-month to identify patterns
7. **Use Help**: Click the help icon (?) for detailed explanations

## Exporting Data

1. Click the export icon in the DataGrid toolbar
2. Choose format (Excel, PDF)
3. File includes all columns and summary totals
4. Use exported data for:
   - Management reports
   - Audit trails
   - Deeper analysis in Excel
   - Archival purposes

## Getting Help

- Click the **? Help icon** at top-right for detailed formulas and examples
- Review the **color coding** to understand what each metric means
- Check **Summary Cards** for quick overview
- Use **Chart Views** to visualize different aspects
- Contact system administrator for data accuracy issues

## Best Practices

✅ **Do**:
- Review analysis at least weekly
- Act on "Days to Stockout" warnings promptly
- Investigate consistent negative variance
- Use appropriate analysis type for your goal
- Export and archive monthly reports

❌ **Don't**:
- Ignore low days to stockout warnings
- Assume all variance is normal
- Make decisions on single cycle data
- Forget to account for seasonal patterns
- Delay deliveries below 3-day buffer

---

**Need More Help?**
Contact your system administrator or refer to the technical documentation in the Help popup.
