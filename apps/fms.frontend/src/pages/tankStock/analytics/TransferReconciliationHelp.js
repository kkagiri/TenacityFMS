import React from 'react';

const TransferReconciliationHelp = () => {
  return (
    <div className="transfer-reconciliation-help tw-space-y-6">
      {/* What is Transfer Reconciliation */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-circle-question tw-mr-2 tw-text-blue-600"></i>
          What is Transfer Reconciliation?
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
          Transfer Reconciliation is a period-based analysis that tracks fuel movements between stationary tanks (ST)
          and fuel trucks (FT), helping you detect unexplained losses or gains in stock levels. The system divides your
          timeline into periods based on consecutive stock entries and calculates whether the actual closing stock matches
          the expected closing stock.
        </p>
      </section>

      {/* How Periods are Defined */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-calendar-days tw-mr-2 tw-text-blue-600"></i>
          How Periods are Defined
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed tw-mb-2">
          Each period represents the time span between two consecutive stock entries (Opening or Closing stock records).
          For example:
        </p>
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3 tw-text-xs tw-font-mono">
          <div className="tw-mb-1">Period 1: Jan 1 Opening → Jan 3 Closing</div>
          <div className="tw-mb-1">Period 2: Jan 3 Closing → Jan 7 Opening</div>
          <div>Period 3: Jan 7 Opening → Jan 10 Closing</div>
        </div>
      </section>

      {/* Calculation Formula */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-calculator tw-mr-2 tw-text-blue-600"></i>
          Calculation Formula
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed tw-mb-2">
          For each period, the system calculates:
        </p>
        <div className="tw-bg-gray-50 tw-border tw-border-gray-300 tw-rounded-lg tw-p-4 tw-space-y-2">
          <div className="tw-text-sm tw-font-semibold tw-text-gray-700">
            Expected Closing Stock = Opening Stock + Transfers In - Transfers Out - Dispensing
          </div>
          <div className="tw-text-sm tw-font-semibold tw-text-gray-700">
            Variance = Actual Closing Stock - Expected Closing Stock
          </div>
          <div className="tw-text-xs tw-text-gray-600 tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-300">
            <strong>Positive variance:</strong> More fuel than expected (possible measurement error or unrecorded delivery)
            <br />
            <strong>Negative variance:</strong> Less fuel than expected (possible leak, theft, or unrecorded dispensing)
          </div>
        </div>
      </section>

      {/* Dispensing Sources */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-gas-pump tw-mr-2 tw-text-blue-600"></i>
          Dispensing Data Sources
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed tw-mb-2">
          The system collects dispensing data from multiple sources for accuracy:
        </p>
        <div className="tw-space-y-2">
          <div className="tw-flex tw-items-start tw-text-sm">
            <i className="fa-light fa-hand tw-mr-2 tw-mt-1 tw-text-orange-600"></i>
            <div>
              <strong className="tw-text-gray-700">Manual Aggregate:</strong>
              <span className="tw-text-gray-600"> Manually entered dispensing totals from tank stock records</span>
            </div>
          </div>
          <div className="tw-flex tw-items-start tw-text-sm">
            <i className="fa-light fa-sensor tw-mr-2 tw-mt-1 tw-text-green-600"></i>
            <div>
              <strong className="tw-text-gray-700">Sensor Dispensing:</strong>
              <span className="tw-text-gray-600"> Automated sensor readings from tank volume history</span>
            </div>
          </div>
          <div className="tw-flex tw-items-start tw-text-sm">
            <i className="fa-light fa-robot tw-mr-2 tw-mt-1 tw-text-blue-600"></i>
            <div>
              <strong className="tw-text-gray-700">Automated Dispensing:</strong>
              <span className="tw-text-gray-600"> PTS (Petroleum Transfer System) automated transactions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Severity Levels */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-traffic-light tw-mr-2 tw-text-blue-600"></i>
          Variance Severity Levels
        </h3>
        <div className="tw-space-y-3">
          <div className="tw-flex tw-items-start">
            <div className="tw-w-8 tw-h-8 tw-bg-green-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mr-3 tw-flex-shrink-0">
              <i className="fa-light fa-check tw-text-green-600"></i>
            </div>
            <div>
              <div className="tw-text-sm tw-font-semibold tw-text-gray-700">Acceptable (Green)</div>
              <div className="tw-text-xs tw-text-gray-600">
                Variance is within configured threshold. No action required.
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-start">
            <div className="tw-w-8 tw-h-8 tw-bg-yellow-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mr-3 tw-flex-shrink-0">
              <i className="fa-light fa-exclamation tw-text-yellow-600"></i>
            </div>
            <div>
              <div className="tw-text-sm tw-font-semibold tw-text-gray-700">Moderate (Yellow)</div>
              <div className="tw-text-xs tw-text-gray-600">
                Variance exceeds threshold but is under 2x threshold. Review recommended.
              </div>
            </div>
          </div>
          <div className="tw-flex tw-items-start">
            <div className="tw-w-8 tw-h-8 tw-bg-red-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mr-3 tw-flex-shrink-0">
              <i className="fa-light fa-triangle-exclamation tw-text-red-600"></i>
            </div>
            <div>
              <div className="tw-text-sm tw-font-semibold tw-text-gray-700">High (Red)</div>
              <div className="tw-text-xs tw-text-gray-600">
                Variance exceeds 2x threshold. Investigation required.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interpreting Results */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-magnifying-glass-chart tw-mr-2 tw-text-blue-600"></i>
          Interpreting Results
        </h3>
        <div className="tw-space-y-2 tw-text-sm tw-text-gray-600">
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-circle-check tw-mr-2 tw-mt-1 tw-text-green-600"></i>
            <span><strong>Consistent green periods:</strong> Stock management is accurate and well-controlled</span>
          </div>
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-arrow-trend-down tw-mr-2 tw-mt-1 tw-text-red-600"></i>
            <span><strong>Pattern of negative variance:</strong> May indicate leaks, theft, or unrecorded dispensing</span>
          </div>
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-arrow-trend-up tw-mr-2 tw-mt-1 tw-text-orange-600"></i>
            <span><strong>Pattern of positive variance:</strong> May indicate measurement errors or unrecorded deliveries</span>
          </div>
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-wave-pulse tw-mr-2 tw-mt-1 tw-text-purple-600"></i>
            <span><strong>Fluctuating variance:</strong> May indicate inconsistent data entry or sensor calibration issues</span>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-wrench tw-mr-2 tw-text-blue-600"></i>
          Troubleshooting
        </h3>
        <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-3 tw-space-y-2 tw-text-sm">
          <div className="tw-text-gray-700">
            <strong>No periods found:</strong> Ensure you have at least 2 stock entries (Opening/Closing) in the selected date range.
          </div>
          <div className="tw-text-gray-700">
            <strong>Large variances:</strong> Check for missing transfer records or incomplete dispensing data for the period.
          </div>
          <div className="tw-text-gray-700">
            <strong>Transfer details not showing:</strong> Enable "Include Transfer Details" checkbox and click Apply again.
          </div>
        </div>
      </section>

      {/* Actions to Take */}
      <section>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
          <i className="fa-light fa-list-check tw-mr-2 tw-text-blue-600"></i>
          Actions to Take
        </h3>
        <div className="tw-space-y-2 tw-text-sm tw-text-gray-600">
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">1.</span>
            <span>Review periods with yellow or red severity flags</span>
          </div>
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">2.</span>
            <span>Expand period rows to view dispensing breakdown and transfer details</span>
          </div>
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">3.</span>
            <span>Cross-reference with delivery schedules and maintenance records</span>
          </div>
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">4.</span>
            <span>Investigate recurring patterns (e.g., always negative on weekends)</span>
          </div>
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">5.</span>
            <span>Verify sensor calibration if sensor dispensing values seem incorrect</span>
          </div>
          <div className="tw-flex tw-items-start">
            <span className="tw-font-bold tw-mr-2 tw-text-gray-700">6.</span>
            <span>Export data for detailed offline analysis or reporting to management</span>
          </div>
        </div>
      </section>

      {/* Configuration Note */}
      <section className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
        <div className="tw-flex tw-items-start">
          <i className="fa-light fa-gear tw-mr-2 tw-mt-1 tw-text-blue-600"></i>
          <div className="tw-text-xs tw-text-blue-700">
            <strong>Note:</strong> Variance thresholds can be configured in System Settings under Stock Management.
            Default values are 5% percentage threshold and 50L absolute threshold.
          </div>
        </div>
      </section>
    </div>
  );
};

export default TransferReconciliationHelp;
