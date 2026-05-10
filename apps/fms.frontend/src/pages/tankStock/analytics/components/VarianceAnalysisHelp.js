import React from 'react';

/**
 * Help content for Variance Analysis component
 */
const VarianceAnalysisHelp = () => {
  return (
    <div>
      <h1>Variance Analysis Help</h1>

      <div className="help-section">
        <h2>Overview</h2>
        <p>
          The Variance Analysis tool helps you track and analyze the difference between expected
          and actual stock levels in your tanks over time. This is critical for identifying
          potential losses, theft, leaks, measurement errors, or unrecorded transactions.
        </p>
      </div>

      <div className="help-section">
        <h2>How to Use</h2>
        <ol>
          <li>
            <strong>Apply Filters:</strong> Use the filters at the top of the page to select:
            <ul>
              <li>Date range for analysis</li>
              <li>Sites to include</li>
              <li>Tanks to analyze</li>
            </ul>
            Click "Apply" to filter the available tanks.
          </li>
          <li>
            <strong>Select Tank:</strong> From the filtered tanks, choose a specific tank for detailed variance analysis.
          </li>
          <li>
            <strong>Load Analysis:</strong> Click the "Load Analysis" button to fetch and display the variance data.
          </li>
        </ol>
      </div>

      <div className="help-section">
        <h2>Understanding the Chart</h2>
        <p>The variance analysis chart displays four key metrics:</p>

        <table className="help-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Color</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Expected Stock</strong></td>
              <td>Blue Line</td>
              <td>Calculated stock level based on opening stock plus all transactions (deliveries, dispensing, transfers)</td>
            </tr>
            <tr>
              <td><strong>Actual Stock</strong></td>
              <td>Red Line</td>
              <td>Physical stock measurement from manual readings or sensors</td>
            </tr>
            <tr>
              <td><strong>Daily Variance</strong></td>
              <td>Green/Red Bars</td>
              <td>Daily difference between actual and expected (Green = surplus, Red = shortage)</td>
            </tr>
            <tr>
              <td><strong>Cumulative Variance</strong></td>
              <td>Orange Line</td>
              <td>Running total of all daily variances over the selected period</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="help-section">
        <h2>Key Calculations</h2>

        <div className="help-formula">
          <h3>Expected Closing Stock</h3>
          <p>Expected Closing = Opening Stock + (Deliveries + Transfer In) - (Dispensing + Transfer Out)</p>
        </div>

        <div className="help-formula">
          <h3>Daily Variance</h3>
          <p>Daily Variance = Actual Closing Stock - Expected Closing Stock</p>
        </div>

        <div className="help-formula">
          <h3>Cumulative Variance</h3>
          <p>Cumulative Variance = Sum of all Daily Variances from start to current date</p>
        </div>

        <div className="help-formula">
          <h3>Variance Percentage</h3>
          <p>Variance % = (Daily Variance ÷ Expected Closing) × 100</p>
        </div>
      </div>

      <div className="help-section">
        <h2>Interpreting Variance</h2>

        <div className="help-warning">
          <h4><i className="fa-light fa-triangle-exclamation"></i> Negative Variance (-)</h4>
          <p>Indicates <strong>stock shortage</strong> - actual stock is less than expected.</p>
          <p><strong>Possible causes:</strong></p>
          <ul>
            <li>Fuel theft or pilferage</li>
            <li>Tank leaks or evaporation</li>
            <li>Unrecorded dispensing</li>
            <li>Measurement errors (sensors need calibration)</li>
            <li>Missed recording of outgoing transfers</li>
          </ul>
        </div>

        <div className="help-info">
          <h4><i className="fa-light fa-circle-plus"></i> Positive Variance (+)</h4>
          <p>Indicates <strong>stock surplus</strong> - actual stock is more than expected.</p>
          <p><strong>Possible causes:</strong></p>
          <ul>
            <li>Unrecorded deliveries</li>
            <li>Missed recording of incoming transfers</li>
            <li>Measurement errors</li>
            <li>Temperature-related expansion</li>
          </ul>
        </div>

        <div className="help-example">
          <h4><i className="fa-light fa-circle-check"></i> Zero Variance (0)</h4>
          <p>Indicates <strong>perfect match</strong> - actual stock equals expected.</p>
          <p>This is the ideal scenario showing accurate record-keeping and no losses.</p>
        </div>
      </div>

      <div className="help-section">
        <h2>Statistics Explained</h2>
        <p>The summary statistics panel shows:</p>
        <ul>
          <li><strong>Final Cumulative Variance:</strong> Total variance accumulated over the entire period</li>
          <li><strong>Average Daily Variance:</strong> Average absolute variance per day</li>
          <li><strong>Maximum Variance:</strong> Highest cumulative variance reached during the period</li>
          <li><strong>Total Delivery:</strong> Sum of all fuel deliveries in the period</li>
          <li><strong>Total Dispensing:</strong> Sum of all fuel dispensed/sold in the period</li>
          <li><strong>Expected vs Actual Closing:</strong> Final stock levels at the end of the period</li>
          <li><strong>Stock Accuracy %:</strong> (Actual ÷ Expected) × 100 - closer to 100% is better</li>
        </ul>
      </div>

      <div className="help-section">
        <h2>Example Scenario</h2>
        <div className="help-example">
          <h4>Day 1 Analysis</h4>
          <p><strong>Opening Stock:</strong> 1000 liters</p>
          <p><strong>Delivery:</strong> +500 liters</p>
          <p><strong>Dispensing:</strong> -300 liters</p>
          <p><strong>Transfer In:</strong> +200 liters</p>
          <p><strong>Transfer Out:</strong> -100 liters</p>

          <p className="tw-mt-3"><strong>Calculation:</strong></p>
          <p>Expected Closing = 1000 + (500 + 200) - (300 + 100) = 1300 liters</p>
          <p>Actual Closing = 1280 liters (from physical measurement)</p>
          <p><strong>Daily Variance = 1280 - 1300 = -20 liters (shortage)</strong></p>
          <p>Variance % = (-20 ÷ 1300) × 100 = -1.54%</p>
        </div>
      </div>

      <div className="help-section">
        <h2>Best Practices</h2>
        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Regular Monitoring:</strong> Review variance analysis daily or weekly to catch issues early.
          </div>
        </div>
        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Investigate Patterns:</strong> Consistent negative variance indicates systematic problems (leaks, theft).
          </div>
        </div>
        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Calibrate Sensors:</strong> Large variances may indicate sensor calibration is needed.
          </div>
        </div>
        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Accurate Recording:</strong> Ensure all transactions (deliveries, transfers) are recorded promptly.
          </div>
        </div>
        <div className="help-tip">
          <i className="fa-light fa-lightbulb"></i>
          <div>
            <strong>Set Thresholds:</strong> Define acceptable variance ranges and investigate when exceeded.
          </div>
        </div>
      </div>

      <div className="help-section">
        <h2>Data Requirements</h2>
        <p>For accurate variance analysis, ensure you have:</p>
        <ul>
          <li>Daily opening and closing stock readings</li>
          <li>Complete transaction records (deliveries, dispensing, transfers)</li>
          <li>Calibrated sensors or accurate manual measurements</li>
          <li>Consistent recording practices</li>
        </ul>
      </div>

      <div className="help-section">
        <h2>Troubleshooting</h2>
        <table className="help-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Solution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No data displayed</td>
              <td>Ensure tank stock data exists for the selected date range. Check that opening/closing stock entries are recorded.</td>
            </tr>
            <tr>
              <td>Large unexpected variance</td>
              <td>Verify all transactions are recorded. Check sensor calibration. Review manual measurement accuracy.</td>
            </tr>
            <tr>
              <td>Chart not loading</td>
              <td>Refresh the page. Ensure filters are applied before selecting a tank.</td>
            </tr>
            <tr>
              <td>Inconsistent data</td>
              <td>Verify that opening stock of day N+1 matches closing stock of day N.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="help-section">
        <h2>Related Documentation</h2>
        <p>For more detailed technical information, see:</p>
        <ul>
          <li><code>Documentation/Features/TankStock/VARIANCE_CALCULATION_EXPLAINED.md</code></li>
          <li>Tank Stock Management user guide</li>
          <li>Bulk Import documentation</li>
        </ul>
      </div>
    </div>
  );
};

export default VarianceAnalysisHelp;
