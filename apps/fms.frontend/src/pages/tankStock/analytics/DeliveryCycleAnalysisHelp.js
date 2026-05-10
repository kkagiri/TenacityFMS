import React from 'react';

const DeliveryCycleAnalysisHelp = () => {
  return (
    <div className="help-content">
      <section className="help-section">
        <h3>Overview</h3>
        <p>
          Delivery Cycle Analysis tracks fuel consumption patterns and stock behavior between
          deliveries, providing insights into consumption rates, stock adequacy, and operational efficiency.
          The analysis supports both single tank and multi-tank views for site-level insights.
        </p>
      </section>

      <section className="help-section">
        <h3>Dispensing Data Sources</h3>
        <div className="help-subsection">
          <h4><i className="fa-light fa-satellite-dish tw-mr-2 tw-text-blue-500"></i>Sensor Data (Automated)</h4>
          <p>
            Uses automated sensor readings from TankVolumeHistory. Includes both:
          </p>
          <ul>
            <li><strong>AutomatedDispensing:</strong> PTS pump transactions from automated systems</li>
            <li><strong>Dispensing:</strong> Manual fuel refills recorded via FuelRefill forms</li>
          </ul>
          <p className="tw-mt-2">
            <strong>Best for:</strong> Real-time accuracy, detailed transaction history, automated pump systems
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-pen-to-square tw-mr-2 tw-text-green-500"></i>Manual Entries (Aggregate)</h4>
          <p>
            Uses daily aggregate entries from TankStock table. Manual dispensing records combine
            multiple transactions into daily summaries.
          </p>
          <p className="tw-mt-2">
            <strong>Best for:</strong> Sites with manual bookkeeping, daily summary reporting, simplified view
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-layer-group tw-mr-2 tw-text-purple-500"></i>Combined (Auto + Manual Fill)</h4>
          <p>
            Hybrid approach using TankVolumeHistory as primary source, filling data gaps with
            TankStock entries. Provides complete coverage when sensor data has gaps.
          </p>
          <p className="tw-mt-2">
            <strong>Best for:</strong> Mixed environments, systems transitioning to automation, maximum data coverage
          </p>
        </div>
      </section>

      <section className="help-section">
        <h3>Multi-Tank Analysis</h3>
        <p>
          Select multiple tanks from the same site to analyze aggregate consumption patterns.
          This provides site-level insights for better operational planning.
        </p>
        <div className="help-subsection">
          <h4>What You'll See:</h4>
          <ul>
            <li><strong>Combined Volumes:</strong> Aggregated delivery, dispensing, and stock levels across all selected tanks</li>
            <li><strong>Site Consumption:</strong> Total daily/monthly consumption for the entire site</li>
            <li><strong>Site-Wide Trends:</strong> Overall consumption patterns and variance</li>
            <li><strong>Planning Insights:</strong> Better forecasting for site-level fuel procurement</li>
          </ul>
        </div>
        <div className="help-info">
          <i className="fa-light fa-circle-info tw-mr-2"></i>
          <strong>Tip:</strong> Use multi-tank analysis for site budgeting and bulk delivery planning
        </div>
      </section>

      <section className="help-section">
        <h3>Analysis Types</h3>
        <div className="help-subsection">
          <h4><i className="fa-light fa-truck tw-mr-2 tw-text-blue-500"></i>Between Deliveries</h4>
          <p>
            Analyzes complete cycles from one delivery to the next. Each cycle starts with a delivery
            and ends just before the next delivery. Ideal for understanding consumption between refills.
          </p>
        </div>
        <div className="help-subsection">
          <h4><i className="fa-light fa-calendar-days tw-mr-2 tw-text-green-500"></i>Monthly</h4>
          <p>
            Divides the date range into calendar months. Each cycle represents one month's activity,
            useful for comparing month-over-month consumption patterns and trends.
          </p>
        </div>
        <div className="help-subsection">
          <h4><i className="fa-light fa-forward tw-mr-2 tw-text-purple-500"></i>Until Next Delivery</h4>
          <p>
            Tracks consumption from the start date until each subsequent delivery. Shows cumulative
            consumption leading up to each refill event.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h3>Key Metrics Explained</h3>

        <div className="help-metric">
          <h4>Consumption Per Day</h4>
          <div className="help-formula">
            Consumption Per Day = Total Dispensing ÷ Days in Cycle
          </div>
          <p>
            Average daily fuel consumption during the cycle. This metric normalizes consumption
            across cycles of different lengths, making it easier to spot trends and anomalies.
          </p>
        </div>

        <div className="help-metric">
          <h4>Consumption Per Month (Projected)</h4>
          <div className="help-formula">
            Consumption Per Month = Consumption Per Day × 30
          </div>
          <p>
            Projected monthly consumption based on the daily rate. Useful for forecasting and
            budget planning. Note: This is a projection, not actual monthly consumption.
          </p>
        </div>

        <div className="help-metric">
          <h4>Actual Monthly Consumption</h4>
          <div className="help-formula">
            Actual Monthly = Total Dispensing (if cycle ≥ 28 days)
          </div>
          <p>
            Only shown for cycles that span at least 28 days (near full month). Represents
            true monthly consumption, not a projection. Visible in "Monthly" analysis type.
          </p>
        </div>

        <div className="help-metric">
          <h4>Days to Stockout</h4>
          <div className="help-formula">
            Days to Stockout = Closing Stock ÷ Consumption Per Day
          </div>
          <p>
            Estimated days remaining until tank runs out based on current consumption rate.
            Critical for preventing stockouts and planning deliveries.
          </p>
          <div className="help-warning">
            <i className="fa-light fa-triangle-exclamation tw-mr-2"></i>
            <strong>Warning:</strong> Days ≤ 3 require immediate attention (critical)
          </div>
          <div className="help-info">
            <i className="fa-light fa-circle-info tw-mr-2"></i>
            <strong>Caution:</strong> Days ≤ 7 warrant close monitoring (warning)
          </div>
        </div>

        <div className="help-metric">
          <h4>Stock Turnover Rate</h4>
          <div className="help-formula">
            Turnover Rate = Total Dispensing ÷ Average Stock Level
          </div>
          <p>
            Measures how efficiently stock is utilized. Higher values indicate faster stock
            rotation, lower values suggest overstocking or slow consumption.
          </p>
        </div>

        <div className="help-metric">
          <h4>Variance</h4>
          <div className="help-formula">
            Variance = Closing Stock - Expected Closing Stock
          </div>
          <div className="help-formula">
            Expected Closing = Opening + Delivery - Dispensing
          </div>
          <p className="tw-mt-2">
            Difference between actual and expected closing stock. Positive variance indicates
            surplus, negative indicates shortage or possible losses.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h3>Understanding the Data</h3>

        <div className="help-example">
          <h4>Sample Cycle</h4>
          <table className="help-table">
            <tbody>
              <tr>
                <td><strong>Opening Stock:</strong></td>
                <td>5,000 L</td>
              </tr>
              <tr>
                <td><strong>Delivery Received:</strong></td>
                <td>20,000 L</td>
              </tr>
              <tr>
                <td><strong>Stock After Delivery:</strong></td>
                <td>25,000 L</td>
              </tr>
              <tr>
                <td><strong>Total Dispensing:</strong></td>
                <td>18,500 L</td>
              </tr>
              <tr>
                <td><strong>Days in Cycle:</strong></td>
                <td>15 days</td>
              </tr>
              <tr>
                <td><strong>Closing Stock:</strong></td>
                <td>6,400 L</td>
              </tr>
              <tr>
                <td><strong>Expected Closing:</strong></td>
                <td>6,500 L (5,000 + 20,000 - 18,500)</td>
              </tr>
            </tbody>
          </table>

          <h5 className="tw-mt-3">Calculated Metrics:</h5>
          <ul>
            <li><strong>Daily Consumption:</strong> 18,500 ÷ 15 = 1,233.33 L/day</li>
            <li><strong>Monthly Consumption:</strong> 1,233.33 × 30 = 37,000 L/month</li>
            <li><strong>Days to Stockout:</strong> 6,400 ÷ 1,233.33 ≈ 5 days (warning!)</li>
            <li><strong>Variance:</strong> 6,400 - 6,500 = -100 L (shortage)</li>
            <li><strong>Average Stock:</strong> (25,000 + 6,400) ÷ 2 = 15,700 L</li>
            <li><strong>Turnover Rate:</strong> 18,500 ÷ 15,700 = 1.18</li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h3>Color Coding Guide</h3>

        <div className="help-subsection">
          <h4>Consumption Rate Colors</h4>
          <ul>
            <li>
              <span className="tw-text-red-600 tw-font-semibold">Red:</span>
              High consumption (&gt;20% above average) - investigate causes
            </li>
            <li>
              <span className="tw-text-green-600 tw-font-semibold">Green:</span>
              Normal consumption (within ±20% of average)
            </li>
            <li>
              <span className="tw-text-blue-600 tw-font-semibold">Blue:</span>
              Low consumption (&lt;20% below average) - check for issues
            </li>
          </ul>
        </div>

        <div className="help-subsection">
          <h4>Days to Stockout Colors</h4>
          <ul>
            <li>
              <span className="tw-text-red-600 tw-font-semibold">Red (Critical):</span>
              ≤ 3 days - immediate delivery required
            </li>
            <li>
              <span className="tw-text-orange-500 tw-font-semibold">Orange (Warning):</span>
              4-7 days - plan delivery soon
            </li>
            <li>
              <span className="tw-text-green-600 tw-font-semibold">Green (Safe):</span>
              &gt; 7 days - adequate stock
            </li>
          </ul>
        </div>

        <div className="help-subsection">
          <h4>Variance Colors</h4>
          <ul>
            <li>
              <span className="tw-text-green-600 tw-font-semibold">Green:</span>
              Positive variance (surplus) - more stock than expected
            </li>
            <li>
              <span className="tw-text-red-600 tw-font-semibold">Red:</span>
              Negative variance (shortage) - less stock than expected
            </li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h3>Chart Visualizations</h3>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-line tw-mr-2"></i>Consumption Rates</h4>
          <p>
            Line chart showing daily and monthly consumption rates across cycles. Includes
            average daily consumption baseline for comparison. Use this to identify trends
            and seasonal variations.
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-area tw-mr-2"></i>Stock Levels</h4>
          <p>
            Tracks opening stock, closing stock, and average stock levels through cycles.
            Helps visualize stock adequacy and identify patterns in stock management.
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-column tw-mr-2"></i>Variance Trends</h4>
          <p>
            Bar chart showing variance (positive or negative) for each cycle. Consistent
            negative variance may indicate leakage or measurement issues.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h3>Reading the Charts - What to Look For</h3>

        <div className="help-subsection">
          <h4>Consumption Rates Chart</h4>
          <ul className="tw-space-y-2">
            <li>
              <i className="fa-light fa-arrow-trend-up tw-text-red-500 tw-mr-2"></i>
              <strong>Upward Trends:</strong> Increasing consumption over time - could indicate:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Growing fleet or operations</li>
                <li>Seasonal peak periods</li>
                <li>Possible leakage if unexpected</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-arrow-trend-down tw-text-blue-500 tw-mr-2"></i>
              <strong>Downward Trends:</strong> Decreasing consumption - investigate:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Reduced operational activity</li>
                <li>Efficiency improvements</li>
                <li>Measurement system issues</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-chart-mixed tw-text-green-500 tw-mr-2"></i>
              <strong>Stable Patterns:</strong> Consistent consumption = healthy operations
            </li>
            <li>
              <i className="fa-light fa-chart-scatter tw-text-orange-500 tw-mr-2"></i>
              <strong>Spikes/Drops:</strong> Sudden changes require immediate investigation
            </li>
          </ul>
        </div>

        <div className="help-subsection">
          <h4>Stock Levels Chart</h4>
          <ul className="tw-space-y-2">
            <li>
              <i className="fa-light fa-wave-square tw-text-purple-500 tw-mr-2"></i>
              <strong>Sawtooth Pattern:</strong> Normal - stock depletes then refills with deliveries
            </li>
            <li>
              <i className="fa-light fa-angles-down tw-text-red-500 tw-mr-2"></i>
              <strong>Declining Closing Stock:</strong> Warning - may indicate:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Increasing consumption without delivery frequency adjustment</li>
                <li>Approaching stockout - review delivery schedule</li>
                <li>Need for larger delivery volumes</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-wave-triangle tw-text-blue-500 tw-mr-2"></i>
              <strong>High Average Stock:</strong> Could mean:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Over-ordering (capital tied up)</li>
                <li>Lower consumption than expected</li>
                <li>Opportunity to optimize delivery schedule</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-dash tw-text-orange-500 tw-mr-2"></i>
              <strong>Low Stock After Delivery:</strong> Risk indicator:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Delivery volumes too small</li>
                <li>Stockout risk if unexpected demand surge</li>
                <li>Consider increasing delivery quantity</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="help-subsection">
          <h4>Variance Trends Chart</h4>
          <ul className="tw-space-y-2">
            <li>
              <i className="fa-light fa-square-check tw-text-green-500 tw-mr-2"></i>
              <strong>Near-Zero Variance:</strong> Excellent - accurate bookkeeping and measurements
            </li>
            <li>
              <i className="fa-light fa-plus tw-text-blue-500 tw-mr-2"></i>
              <strong>Consistent Positive:</strong> May indicate:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Conservative dispensing estimates</li>
                <li>Temperature variations (volume expansion)</li>
                <li>Measurement calibration needed</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-minus tw-text-red-500 tw-mr-2"></i>
              <strong>Consistent Negative:</strong> Red flag - investigate:
              <ul className="tw-ml-6 tw-mt-1">
                <li>Possible fuel losses (leakage, theft)</li>
                <li>Unrecorded dispensing transactions</li>
                <li>Temperature effects (volume contraction)</li>
                <li>Sensor calibration issues</li>
              </ul>
            </li>
            <li>
              <i className="fa-light fa-arrows-up-down tw-text-orange-500 tw-mr-2"></i>
              <strong>Erratic Swings:</strong> Indicates inconsistent data entry or measurement problems
            </li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h3>Reading the Datagrid - What to Look For</h3>

        <div className="help-subsection">
          <h4>Key Columns to Monitor</h4>

          <div className="tw-mb-3">
            <strong className="tw-text-blue-600">Days in Cycle:</strong>
            <ul className="tw-ml-4">
              <li>Short cycles (&lt; 7 days): Frequent deliveries may indicate undersized tank or high demand</li>
              <li>Long cycles (&gt; 30 days): Verify adequate stock levels throughout cycle</li>
              <li>Irregular cycles: May need delivery schedule optimization</li>
            </ul>
          </div>

          <div className="tw-mb-3">
            <strong className="tw-text-green-600">Consumption Per Day:</strong>
            <ul className="tw-ml-4">
              <li>Compare across cycles to identify trends</li>
              <li>Look for outliers (color-coded red/blue)</li>
              <li>Use as baseline for delivery planning</li>
            </ul>
          </div>

          <div className="tw-mb-3">
            <strong className="tw-text-orange-600">Days to Stockout:</strong>
            <ul className="tw-ml-4">
              <li className="tw-text-red-600 tw-font-semibold">0-3 days: URGENT - Order immediately</li>
              <li className="tw-text-orange-500 tw-font-semibold">4-7 days: PLAN - Schedule delivery</li>
              <li className="tw-text-green-600">8+ days: SAFE - Monitor regularly</li>
            </ul>
          </div>

          <div className="tw-mb-3">
            <strong className="tw-text-purple-600">Stock Turnover Rate:</strong>
            <ul className="tw-ml-4">
              <li>&lt; 0.5: Possible overstocking or slow consumption</li>
              <li>0.5 - 2.0: Healthy turnover range</li>
              <li>&gt; 2.0: Very fast consumption - check for adequacy</li>
            </ul>
          </div>

          <div className="tw-mb-3">
            <strong className="tw-text-red-600">Cycle Variance:</strong>
            <ul className="tw-ml-4">
              <li>±100L or &lt; 2%: Normal measurement variation</li>
              <li>-500L or &gt; 5%: Investigate for issues</li>
              <li>Pattern of negative variance: System check required</li>
            </ul>
          </div>
        </div>

        <div className="help-subsection">
          <h4>Delivery Details Expansion</h4>
          <p>
            Click on any cycle row to expand and see delivery details:
          </p>
          <ul>
            <li><strong>Date:</strong> When delivery occurred</li>
            <li><strong>Volume:</strong> Quantity delivered</li>
            <li><strong>Before Delivery:</strong> Stock level before refill</li>
            <li><strong>After Delivery:</strong> Stock level after refill</li>
            <li><strong>Reference:</strong> Delivery note or invoice number</li>
          </ul>
          <div className="help-info tw-mt-2">
            <i className="fa-light fa-lightbulb tw-mr-2"></i>
            <strong>Insight:</strong> Multiple deliveries in one cycle may indicate demand variability or tank capacity constraints
          </div>
        </div>
      </section>

      <section className="help-section">
        <h3>Common Patterns and What They Mean</h3>

        <div className="help-subsection">
          <h4>Healthy Operations</h4>
          <ul className="tw-space-y-1">
            <li>✓ Consistent consumption rates across cycles (±10-15%)</li>
            <li>✓ Variance within ±100L or 2%</li>
            <li>✓ Days to stockout always &gt; 7 days</li>
            <li>✓ Smooth sawtooth pattern in stock levels chart</li>
            <li>✓ Regular delivery intervals</li>
          </ul>
        </div>

        <div className="help-warning tw-mt-3">
          <h4><i className="fa-light fa-triangle-exclamation tw-mr-2"></i>Warning Signs</h4>
          <ul className="tw-space-y-1">
            <li>⚠ Increasing consumption trend without operational changes</li>
            <li>⚠ Consistent negative variance (&gt; -200L)</li>
            <li>⚠ Days to stockout dropping below 7 regularly</li>
            <li>⚠ Erratic consumption spikes</li>
            <li>⚠ Stock turnover rate increasing rapidly</li>
          </ul>
        </div>

        <div className="help-danger tw-mt-3">
          <h4><i className="fa-light fa-octagon-exclamation tw-mr-2"></i>Critical Issues</h4>
          <ul className="tw-space-y-1">
            <li>🚨 Days to stockout &lt; 3 days</li>
            <li>🚨 Variance &gt; -500L or &lt; -10%</li>
            <li>🚨 Sudden 50%+ consumption increase</li>
            <li>🚨 Closing stock approaching zero</li>
            <li>🚨 Missing delivery records with depleted stock</li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h3>Chart Visualizations</h3>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-line tw-mr-2"></i>Consumption Rates</h4>
          <p>
            Line chart showing daily and monthly consumption rates across cycles. Includes
            average daily consumption baseline for comparison. Use this to identify trends
            and seasonal variations.
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-area tw-mr-2"></i>Stock Levels</h4>
          <p>
            Tracks opening stock, closing stock, and average stock levels through cycles.
            Helps visualize stock adequacy and identify patterns in stock management.
          </p>
        </div>

        <div className="help-subsection">
          <h4><i className="fa-light fa-chart-column tw-mr-2"></i>Variance Trends</h4>
          <p>
            Bar chart showing variance (positive or negative) for each cycle. Consistent
            negative variance may indicate leakage or measurement issues.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h3>Best Practices</h3>
        <ul>
          <li>
            <strong>Regular Monitoring:</strong> Review consumption rates weekly to catch
            anomalies early
          </li>
          <li>
            <strong>Delivery Planning:</strong> Use "Days to Stockout" to schedule deliveries
            proactively, maintaining at least 7 days buffer
          </li>
          <li>
            <strong>Variance Investigation:</strong> Investigate cycles with variance &gt; ±5%
            to identify potential issues
          </li>
          <li>
            <strong>Trend Analysis:</strong> Compare monthly analysis across quarters to
            identify seasonal patterns
          </li>
          <li>
            <strong>Consumption Forecasting:</strong> Use average monthly consumption for
            budget planning and procurement
          </li>
          <li>
            <strong>Efficiency Optimization:</strong> Monitor turnover rate to optimize stock
            levels - avoid both overstocking and understocking
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Troubleshooting</h3>

        <div className="help-warning">
          <h4><i className="fa-light fa-triangle-exclamation tw-mr-2"></i>No Cycles Displayed</h4>
          <ul>
            <li>Ensure date range includes at least one delivery event</li>
            <li>Check that selected tank has stock records in the period</li>
            <li>Try "Monthly" analysis type for longer periods with few deliveries</li>
          </ul>
        </div>

        <div className="help-warning">
          <h4><i className="fa-light fa-triangle-exclamation tw-mr-2"></i>Unusual Consumption Rates</h4>
          <ul>
            <li>Verify dispensing data accuracy for the period</li>
            <li>Check for system downtime affecting recorded volumes</li>
            <li>Investigate tank for potential leaks or measurement errors</li>
          </ul>
        </div>

        <div className="help-warning">
          <h4><i className="fa-light fa-triangle-exclamation tw-mr-2"></i>High Negative Variance</h4>
          <ul>
            <li>Possible fuel losses (leakage, spillage, theft)</li>
            <li>Inaccurate opening/closing stock measurements</li>
            <li>Missing delivery or transfer records</li>
            <li>Temperature compensation issues</li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h3>Summary Metrics</h3>
        <p>
          The summary cards at the top provide aggregated statistics across all cycles:
        </p>
        <ul>
          <li><strong>Total Cycles:</strong> Number of complete cycles in analysis period</li>
          <li><strong>Avg Daily Consumption:</strong> Mean daily consumption across all cycles</li>
          <li><strong>Avg Monthly Consumption:</strong> Mean monthly consumption (projected)</li>
          <li><strong>Avg Variance:</strong> Average variance indicating overall accuracy</li>
        </ul>
      </section>

      <section className="help-section">
        <h3>Tips for Effective Analysis</h3>
        <ul>
          <li>Use <strong>"Between Deliveries"</strong> for operational insights</li>
          <li>Use <strong>"Monthly"</strong> for financial planning and budgeting</li>
          <li>Use <strong>"Until Next Delivery"</strong> for cumulative tracking</li>
          <li>Export data grid for deeper analysis in Excel/reporting tools</li>
          <li>Compare multiple tanks to identify outliers</li>
          <li>Track trends over time to optimize delivery schedules</li>
        </ul>
      </section>
    </div>
  );
};

export default DeliveryCycleAnalysisHelp;
