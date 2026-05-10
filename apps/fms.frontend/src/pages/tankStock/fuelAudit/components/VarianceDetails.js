import React, { useMemo } from 'react';

/**
 * VarianceDetails Component
 * Displays detailed breakdown of fuel audit variances
 */
const VarianceDetails = ({ variances = [], thresholds = {} }) => {
  const defaultThresholds = useMemo(() => ({
    acceptable: thresholds.acceptable || 0.5,
    warning: thresholds.warning || 1.0,
    critical: thresholds.critical || 2.0
  }), [thresholds]);

  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return '-';
    const sign = volume >= 0 ? '+' : '';
    return `${sign}${volume.toLocaleString()} L`;
  };

  const formatPercentage = (pct) => {
    if (pct === null || pct === undefined) return '-';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  const getVarianceLevel = (percentage) => {
    const abs = Math.abs(percentage || 0);
    if (abs <= defaultThresholds.acceptable) return 'acceptable';
    if (abs <= defaultThresholds.warning) return 'warning';
    if (abs <= defaultThresholds.critical) return 'critical';
    return 'severe';
  };

  const getVarianceConfig = (level) => {
    const configs = {
      acceptable: {
        className: 'tw-bg-green-50 tw-border-green-200',
        textColor: 'tw-text-green-700',
        icon: 'fa-check-circle',
        iconColor: 'tw-text-green-500',
        label: 'Acceptable'
      },
      warning: {
        className: 'tw-bg-yellow-50 tw-border-yellow-200',
        textColor: 'tw-text-yellow-700',
        icon: 'fa-triangle-exclamation',
        iconColor: 'tw-text-yellow-500',
        label: 'Warning'
      },
      critical: {
        className: 'tw-bg-orange-50 tw-border-orange-200',
        textColor: 'tw-text-orange-700',
        icon: 'fa-exclamation-circle',
        iconColor: 'tw-text-orange-500',
        label: 'Critical'
      },
      severe: {
        className: 'tw-bg-red-50 tw-border-red-200',
        textColor: 'tw-text-red-700',
        icon: 'fa-octagon-exclamation',
        iconColor: 'tw-text-red-500',
        label: 'Severe'
      }
    };
    return configs[level] || configs.acceptable;
  };

  const summary = useMemo(() => {
    if (!variances.length) return null;

    const totalExpected = variances.reduce((sum, v) => sum + (v.expectedValue || 0), 0);
    const totalActual = variances.reduce((sum, v) => sum + (v.actualValue || 0), 0);
    const totalVariance = totalActual - totalExpected;
    const totalPercentage = totalExpected ? (totalVariance / totalExpected) * 100 : 0;

    return {
      totalExpected,
      totalActual,
      totalVariance,
      totalPercentage,
      level: getVarianceLevel(totalPercentage)
    };
  }, [variances]);

  if (!variances.length) {
    return (
      <div className="variance-details tw-text-center tw-py-8">
        <i className="fa-light fa-chart-mixed tw-text-4xl tw-text-gray-300 tw-mb-3"></i>
        <p className="tw-text-gray-500">No variance data available</p>
        <p className="tw-text-sm tw-text-gray-400">Calculate the audit to see variances</p>
      </div>
    );
  }

  return (
    <div className="variance-details">
      {/* Summary Card */}
      {summary && (
        <div className={`summary-card tw-rounded-xl tw-border tw-p-6 tw-mb-6 ${getVarianceConfig(summary.level).className}`}>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
              Overall Variance Summary
            </h3>
            <span className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium ${getVarianceConfig(summary.level).className} ${getVarianceConfig(summary.level).textColor}`}>
              <i className={`fa-light ${getVarianceConfig(summary.level).icon}`}></i>
              {getVarianceConfig(summary.level).label}
            </span>
          </div>

          <div className="tw-grid tw-grid-cols-4 tw-gap-4">
            <div>
              <div className="tw-text-sm tw-text-gray-500">Expected</div>
              <div className="tw-text-xl tw-font-bold tw-text-gray-800">
                {summary.totalExpected.toLocaleString()} L
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Actual</div>
              <div className="tw-text-xl tw-font-bold tw-text-gray-800">
                {summary.totalActual.toLocaleString()} L
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Variance</div>
              <div className={`tw-text-xl tw-font-bold ${getVarianceConfig(summary.level).textColor}`}>
                {formatVolume(summary.totalVariance)}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-500">Variance %</div>
              <div className={`tw-text-xl tw-font-bold ${getVarianceConfig(summary.level).textColor}`}>
                {formatPercentage(summary.totalPercentage)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thresholds Legend */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-mb-4 tw-text-xs">
        <span className="tw-text-gray-500">Thresholds:</span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-green-500"></span>
          <span className="tw-text-gray-600">≤{defaultThresholds.acceptable}% Acceptable</span>
        </span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-yellow-500"></span>
          <span className="tw-text-gray-600">≤{defaultThresholds.warning}% Warning</span>
        </span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-orange-500"></span>
          <span className="tw-text-gray-600">≤{defaultThresholds.critical}% Critical</span>
        </span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-red-500"></span>
          <span className="tw-text-gray-600">&gt;{defaultThresholds.critical}% Severe</span>
        </span>
      </div>

      {/* Individual Variances */}
      <div className="tw-space-y-3">
        {variances.map((variance, index) => {
          const level = getVarianceLevel(variance.variancePercentage);
          const config = getVarianceConfig(level);

          return (
            <div
              key={index}
              className={`variance-item tw-rounded-lg tw-border tw-p-4 ${config.className}`}
            >
              <div className="tw-flex tw-items-start tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className={`tw-w-10 tw-h-10 tw-rounded-lg tw-flex tw-items-center tw-justify-center ${
                    level === 'acceptable' ? 'tw-bg-green-100' :
                    level === 'warning' ? 'tw-bg-yellow-100' :
                    level === 'critical' ? 'tw-bg-orange-100' : 'tw-bg-red-100'
                  }`}>
                    <i className={`fa-light ${config.icon} ${config.iconColor}`}></i>
                  </div>
                  <div>
                    <div className="tw-font-medium tw-text-gray-800">
                      {variance.varianceType || 'Fuel Variance'}
                    </div>
                    <div className="tw-text-sm tw-text-gray-500">
                      {variance.tankName || `Tank ${variance.tankId}`}
                      {variance.fuelType && ` • ${variance.fuelType}`}
                    </div>
                  </div>
                </div>

                <div className="tw-text-right">
                  <div className={`tw-text-lg tw-font-bold ${config.textColor}`}>
                    {formatVolume(variance.varianceAmount)}
                  </div>
                  <div className={`tw-text-sm ${config.textColor}`}>
                    {formatPercentage(variance.variancePercentage)}
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200 tw-border-opacity-50">
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Expected</div>
                  <div className="tw-font-medium tw-text-gray-700">
                    {variance.expectedValue?.toLocaleString() || 0} L
                  </div>
                </div>
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Actual</div>
                  <div className="tw-font-medium tw-text-gray-700">
                    {variance.actualValue?.toLocaleString() || 0} L
                  </div>
                </div>
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Opening</div>
                  <div className="tw-font-medium tw-text-gray-700">
                    {variance.openingVolume?.toLocaleString() || '-'} L
                  </div>
                </div>
                <div>
                  <div className="tw-text-xs tw-text-gray-500">Closing</div>
                  <div className="tw-font-medium tw-text-gray-700">
                    {variance.closingVolume?.toLocaleString() || '-'} L
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {(variance.deliveries || variance.sales || variance.transfers) && (
                <div className="tw-flex tw-items-center tw-gap-4 tw-mt-3 tw-text-xs">
                  {variance.deliveries !== undefined && (
                    <span className="tw-text-gray-600">
                      <i className="fa-light fa-truck tw-mr-1"></i>
                      Deliveries: +{variance.deliveries?.toLocaleString() || 0} L
                    </span>
                  )}
                  {variance.sales !== undefined && (
                    <span className="tw-text-gray-600">
                      <i className="fa-light fa-gas-pump tw-mr-1"></i>
                      Sales: -{variance.sales?.toLocaleString() || 0} L
                    </span>
                  )}
                  {variance.transfers !== undefined && (
                    <span className="tw-text-gray-600">
                      <i className="fa-light fa-arrow-right-arrow-left tw-mr-1"></i>
                      Transfers: {formatVolume(variance.transfers)}
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              {variance.notes && (
                <div className="tw-mt-3 tw-text-sm tw-text-gray-600 tw-italic">
                  <i className="fa-light fa-note tw-mr-1"></i>
                  {variance.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          <i className="fa-light fa-circle-info tw-mr-2"></i>
          Understanding Variances
        </h4>
        <ul className="tw-text-xs tw-text-gray-500 tw-space-y-1">
          <li>• <strong>Positive variance (+):</strong> More fuel than expected (possible meter error or unreported delivery)</li>
          <li>• <strong>Negative variance (-):</strong> Less fuel than expected (possible theft, leakage, or measurement error)</li>
          <li>• <strong>Expected:</strong> Opening + Deliveries - Sales ± Transfers</li>
          <li>• <strong>Actual:</strong> Physical measurement or ATG reading at period end</li>
        </ul>
      </div>
    </div>
  );
};

export default VarianceDetails;
