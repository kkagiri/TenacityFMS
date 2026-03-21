# PhysicalStockValue User Guide

## Overview

The PhysicalStockValue feature allows you to record actual physical measurements of tank stock levels alongside the calculated book balance. This enables better inventory management by detecting discrepancies between what the system calculates and what is actually in the tanks.

## Key Concepts

### Book Balance vs Physical Stock

- **Book Balance (CurrentStock)**: Calculated stock level based on transactions (deliveries, sales, transfers)
- **Physical Stock**: Actual measured stock level from tank gauges, dip sticks, or other measurement methods
- **Discrepancy**: The difference between physical stock and book balance

### When to Use Physical Stock Measurements

- Daily opening stock readings
- Daily closing stock readings
- After major deliveries or transfers
- During inventory reconciliation
- When investigating potential losses or gains

## Recording Physical Stock

### Opening Stock Entry

#### Step-by-Step Process:

1. **Navigate to Tank Stock Management**
   - Go to Tank Stock → Opening Stock

2. **Select Date and Time**
   - Choose the date for the stock reading
   - Time should reflect when measurement was taken

3. **Select Site and Tank**
   - Choose the appropriate site
   - Select the specific tank

4. **Review Current Information**
   - The form will display the current book balance
   - This helps you compare with your physical measurement

5. **Enter Physical Measurement**
   - Input the actual measured stock level in liters
   - Use tank gauges, dip sticks, or other measurement tools

6. **Review Discrepancy**
   - The system will automatically calculate and display:
     - Physical stock amount
     - Current book balance
     - Difference in liters and percentage
     - Color-coded indicator (green = good, red = significant discrepancy)

7. **Submit Entry**
   - Click Submit to record the physical stock
   - If there's a significant discrepancy, you may get a warning

#### What Happens After Submission:
- Physical stock value is updated in the tank record
- Timestamp of measurement is recorded
- Book balance is updated (if UseBookKeeping is enabled)
- Transaction is recorded in tank volume history

### Closing Stock Entry

#### Process:
The closing stock entry follows the same process as opening stock:

1. Navigate to Tank Stock → Closing Stock
2. Select date, site, and tank
3. Review current book balance
4. Enter physical measurement
5. Review discrepancy information
6. Submit entry

#### Purpose of Closing Stock:
- Provides end-of-day physical snapshot
- Enables daily reconciliation analysis
- Helps identify losses or gains during the day

## Understanding Discrepancies

### Discrepancy Indicators

The system uses color-coded indicators to highlight discrepancy severity:

- **Green**: Discrepancy ≤ 2.5% (Normal variance)
- **Yellow**: Discrepancy 2.5% - 5% (Moderate - review recommended)
- **Orange**: Discrepancy 5% - 10% (High - investigation needed)
- **Red**: Discrepancy > 10% (Critical - immediate attention required)

### Common Causes of Discrepancies

#### Positive Discrepancies (Physical > Book):
- Unrecorded deliveries
- Temperature expansion
- Meter calibration issues
- Data entry errors in sales records

#### Negative Discrepancies (Physical < Book):
- Unrecorded sales or dispensing
- Tank leakage
- Theft or unauthorized withdrawals
- Evaporation losses
- Meter over-reading

### Investigating Discrepancies

#### When Discrepancy is > 5%:
1. **Verify Measurement**
   - Re-measure the tank to confirm reading
   - Check calibration of measurement equipment

2. **Review Recent Transactions**
   - Check for unrecorded deliveries
   - Verify all sales have been recorded
   - Look for transfer activities

3. **Check for System Issues**
   - Verify meter readings and calibration
   - Check for data synchronization issues

4. **Physical Inspection**
   - Inspect tank for leaks
   - Check piping and connections
   - Look for signs of unauthorized access

## Using Physical Stock Information

### During Deliveries

When recording deliveries, the system now displays:
- Current book balance
- Current physical stock (if recently measured)
- Current discrepancy status

This information helps you:
- Verify tank capacity before delivery
- Understand actual vs calculated stock levels
- Make informed decisions about delivery quantities

### Benefits for Operations

#### Daily Management:
- Better inventory accuracy
- Early detection of losses
- Improved reconciliation processes
- Enhanced operational control

#### Decision Making:
- Informed delivery scheduling
- Accurate capacity planning
- Timely maintenance identification
- Loss prevention measures

## Best Practices

### Measurement Accuracy

1. **Consistent Timing**
   - Take measurements at consistent times daily
   - Record immediately after measurement
   - Ensure tanks are settled (not during active operations)

2. **Proper Equipment**
   - Use calibrated measurement tools
   - Maintain equipment regularly
   - Train staff on proper measurement techniques

3. **Environmental Considerations**
   - Account for temperature variations
   - Consider product characteristics
   - Note weather conditions that might affect readings

### Recording Practices

1. **Regular Schedule**
   - Record opening stock daily
   - Record closing stock daily
   - Take measurements after major transactions

2. **Prompt Entry**
   - Enter measurements immediately after taking them
   - Don't rely on memory for later entry
   - Use mobile devices for field entry when possible

3. **Review and Verification**
   - Review discrepancies immediately
   - Investigate significant variances
   - Document explanations for unusual readings

### Discrepancy Management

1. **Threshold Monitoring**
   - Pay attention to discrepancies > 2.5%
   - Investigate immediately if > 5%
   - Escalate if > 10%

2. **Trend Analysis**
   - Look for patterns in discrepancies
   - Identify recurring issues
   - Track improvement over time

3. **Documentation**
   - Document investigation findings
   - Record corrective actions taken
   - Maintain logs for audit purposes

## Troubleshooting

### Common Issues

#### "Large Discrepancy" Warning
- **Cause**: Physical measurement significantly different from book balance
- **Action**: Verify measurement accuracy, review recent transactions
- **Prevention**: Regular calibration, consistent measurement practices

#### Negative Physical Stock
- **Cause**: Tank actually empty but system shows stock
- **Action**: Investigate all transactions, check for system errors
- **Prevention**: Regular reconciliation, proper transaction recording

#### Missing Book Balance Display
- **Cause**: Tank not selected or no previous transactions
- **Action**: Ensure tank is properly selected, check tank configuration
- **Prevention**: Verify tank setup and transaction history

### Getting Help

#### System Issues:
- Contact IT support for technical problems
- Report calculation errors immediately
- Request calibration if measurements seem inconsistent

#### Operational Questions:
- Consult operations manager for process questions
- Review training materials for measurement procedures
- Escalate significant discrepancies to management

## Reporting and Analytics

### Available Information

The system tracks and can report on:
- Historical physical stock measurements
- Discrepancy trends over time
- Tank-specific accuracy patterns
- Site-wide inventory accuracy

### Using Reports

- Monitor discrepancy trends
- Identify problematic tanks
- Track improvement initiatives
- Support compliance requirements

## Integration with Existing Processes

### Volume History
- Physical stock entries are recorded in tank volume history
- Maintains full audit trail of all stock changes
- Integrates with existing reporting systems

### Future Records Validation
- Physical stock entries respect historical data policies
- Warnings provided for entries that affect future calculations
- Maintains data integrity across all operations

### Automated Reconciliation
- System continues to perform automated book balance reconciliation
- Physical stock provides additional data point for accuracy verification
- Enhanced monitoring capabilities for operational excellence

## Training and Support

### Initial Training
- Measurement technique training required
- System navigation and entry procedures
- Discrepancy investigation protocols

### Ongoing Support
- Regular refresher training
- Equipment calibration schedules
- Process improvement reviews

This feature significantly enhances your ability to manage tank inventory accurately and detect issues early, leading to better operational control and reduced losses.
