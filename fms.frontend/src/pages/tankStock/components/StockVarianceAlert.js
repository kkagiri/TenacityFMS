import React, { useState } from 'react';
import { Popover } from 'devextreme-react/popover';
import './StockVarianceAlert.scss';

/**
 * Color-coded alert component showing variance between entered and expected stock
 * Green: Within acceptable variance threshold
 * Yellow: Moderate variance (between threshold and 2x threshold)
 * Red: High variance (> 2x threshold)
 */
const StockVarianceAlert = ({
  expectedStock,
  enteredValue,
  variance,
  variancePercentage,
  severity,
  breakdown,
  loading,
  hasData,
  message,
  thresholds
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverTarget, setPopoverTarget] = useState(null);

  // Don't render if no data or still loading initial state
  if (!hasData && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-bg-gray-50 tw-rounded-md tw-border tw-border-gray-200">
        <i className="fa-light fa-spinner-third fa-spin tw-text-gray-500"></i>
        <span className="tw-text-sm tw-text-gray-600">Calculating expected stock...</span>
      </div>
    );
  }

  // If no previous stock found
  if (!hasData) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-bg-blue-50 tw-rounded-md tw-border tw-border-blue-200">
        <i className="fa-light fa-info-circle tw-text-blue-600"></i>
        <div className="tw-flex-1">
          <p className="tw-text-sm tw-text-blue-800 tw-font-medium">No Previous Stock Data</p>
          <p className="tw-text-xs tw-text-blue-600 tw-mt-1">{message}</p>
        </div>
      </div>
    );
  }

  // No variance to display if user hasn't entered value yet
  if (enteredValue == null || variance == null) {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-bg-gray-50 tw-rounded-md tw-border tw-border-gray-200">
        <i className="fa-light fa-calculator tw-text-gray-500"></i>
        <div className="tw-flex-1">
          <p className="tw-text-sm tw-text-gray-700">
            Expected Stock: <span className="tw-font-semibold">{expectedStock?.toFixed(2)} L</span>
          </p>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Enter stock value to see variance
          </p>
        </div>
      </div>
    );
  }

  // Determine alert styling based on severity
  const severityConfig = {
    acceptable: {
      bgColor: 'tw-bg-green-50',
      borderColor: 'tw-border-green-300',
      iconColor: 'tw-text-green-600',
      textColor: 'tw-text-green-800',
      icon: 'fa-check-circle',
      label: 'Within Threshold',
      description: 'Variance is within acceptable limits'
    },
    moderate: {
      bgColor: 'tw-bg-yellow-50',
      borderColor: 'tw-border-yellow-400',
      iconColor: 'tw-text-yellow-600',
      textColor: 'tw-text-yellow-900',
      icon: 'fa-exclamation-triangle',
      label: 'Moderate Variance',
      description: 'Please review before saving'
    },
    high: {
      bgColor: 'tw-bg-red-50',
      borderColor: 'tw-border-red-400',
      iconColor: 'tw-text-red-600',
      textColor: 'tw-text-red-900',
      icon: 'fa-exclamation-circle',
      label: 'High Variance Detected',
      description: 'Requires confirmation before saving'
    }
  };

  const config = severityConfig[severity] || severityConfig.acceptable;

  const handleInfoClick = (e) => {
    setPopoverTarget(e.currentTarget);
    setPopoverVisible(true);
  };

  return (
    <>
      <div
        className={`stock-variance-alert tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-md tw-border ${config.bgColor} ${config.borderColor}`}
      >
        <i className={`fa-light ${config.icon} tw-text-xl ${config.iconColor}`}></i>

        <div className="tw-flex-1">
          <div className="tw-flex tw-items-center tw-gap-2">
            <p className={`tw-text-sm tw-font-semibold ${config.textColor}`}>
              {config.label}
            </p>
            <button
              type="button"
              className="tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors"
              onClick={handleInfoClick}
              aria-label="View breakdown"
            >
              <i className="fa-light fa-info-circle"></i>
            </button>
          </div>

          <p className={`tw-text-xs ${config.textColor} tw-mt-1`}>
            {config.description}
          </p>

          <div className="tw-flex tw-items-center tw-gap-4 tw-mt-2">
            <div className="tw-text-xs">
              <span className="tw-text-gray-600">Expected:</span>{' '}
              <span className={`tw-font-semibold ${config.textColor}`}>
                {expectedStock?.toFixed(2)} L
              </span>
            </div>

            <div className="tw-text-xs">
              <span className="tw-text-gray-600">Entered:</span>{' '}
              <span className={`tw-font-semibold ${config.textColor}`}>
                {enteredValue?.toFixed(2)} L
              </span>
            </div>

            <div className="tw-text-xs">
              <span className="tw-text-gray-600">Variance:</span>{' '}
              <span className={`tw-font-semibold ${config.textColor}`}>
                {variance > 0 ? '+' : ''}{variance?.toFixed(2)} L
                {' '}({variancePercentage?.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Popover */}
      <Popover
        target={popoverTarget}
        visible={popoverVisible}
        onHiding={() => setPopoverVisible(false)}
        position="bottom"
        width={400}
        showTitle={true}
        title="Stock Calculation Breakdown"
        hideOnOutsideClick={true}
      >
        <div className="tw-p-2">
          {breakdown && (
            <>
              <div className="tw-mb-3">
                <p className="tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-2">
                  Calculation Formula:
                </p>
                <div className="tw-text-xs tw-text-gray-600 tw-bg-gray-50 tw-p-2 tw-rounded tw-font-mono">
                  {breakdown.formula}
                </div>
              </div>

              <div className="tw-space-y-2">
                <div className="tw-flex tw-justify-between tw-text-xs">
                  <span className="tw-text-gray-600">Previous Closing:</span>
                  <span className="tw-font-semibold">
                    {breakdown.previousClosingStock?.toFixed(2)} L
                  </span>
                </div>

                {breakdown.previousClosingDate && (
                  <div className="tw-flex tw-justify-between tw-text-xs">
                    <span className="tw-text-gray-600 tw-pl-4">Date:</span>
                    <span className="tw-text-gray-500">
                      {new Date(breakdown.previousClosingDate).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="tw-flex tw-justify-between tw-text-xs">
                  <span className="tw-text-gray-600">+ Deliveries:</span>
                  <span className="tw-font-semibold tw-text-green-600">
                    +{breakdown.deliveriesSum?.toFixed(2)} L
                    {breakdown.deliveriesCount > 0 && ` (${breakdown.deliveriesCount})`}
                  </span>
                </div>

                <div className="tw-flex tw-justify-between tw-text-xs">
                  <span className="tw-text-gray-600">+ Transfers In:</span>
                  <span className="tw-font-semibold tw-text-green-600">
                    +{breakdown.transfersInSum?.toFixed(2)} L
                    {breakdown.transfersInCount > 0 && ` (${breakdown.transfersInCount})`}
                  </span>
                </div>

                <div className="tw-flex tw-justify-between tw-text-xs">
                  <span className="tw-text-gray-600">- Transfers Out:</span>
                  <span className="tw-font-semibold tw-text-orange-600">
                    -{breakdown.transfersOutSum?.toFixed(2)} L
                    {breakdown.transfersOutCount > 0 && ` (${breakdown.transfersOutCount})`}
                  </span>
                </div>

                <div className="tw-flex tw-justify-between tw-text-xs">
                  <span className="tw-text-gray-600">- Dispensing:</span>
                  <span className="tw-font-semibold tw-text-red-600">
                    -{breakdown.totalDispensing?.toFixed(2)} L
                  </span>
                </div>

                {breakdown.dispensingDetails && (
                  <div className="tw-pl-4 tw-space-y-1 tw-text-xs tw-text-gray-500">
                    <div className="tw-flex tw-justify-between">
                      <span>Manual Aggregate:</span>
                      <span>{breakdown.dispensingDetails.manualAggregate?.toFixed(2)} L</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span>Sensor Dispensing:</span>
                      <span>{breakdown.dispensingDetails.sensorDispensing?.toFixed(2)} L</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span>Automated Dispensing:</span>
                      <span>{breakdown.dispensingDetails.automatedDispensing?.toFixed(2)} L</span>
                    </div>
                  </div>
                )}

                <div className="tw-border-t tw-border-gray-200 tw-mt-2 tw-pt-2">
                  <div className="tw-flex tw-justify-between tw-text-sm tw-font-semibold">
                    <span>Expected Stock:</span>
                    <span className="tw-text-blue-700">
                      {expectedStock?.toFixed(2)} L
                    </span>
                  </div>
                </div>
              </div>

              {thresholds && (
                <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
                  <p className="tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-2">
                    Variance Thresholds:
                  </p>
                  <div className="tw-space-y-1 tw-text-xs tw-text-gray-600">
                    <div className="tw-flex tw-justify-between">
                      <span>Percentage:</span>
                      <span>±{thresholds.percentageThreshold}%</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span>Absolute:</span>
                      <span>±{thresholds.absoluteLitersThreshold} L</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Popover>
    </>
  );
};

export default StockVarianceAlert;
