import React from 'react';

const TransferReconciliationSummary = ({ summary }) => {
  if (!summary) {
    return (
      <div className="tw-text-center tw-text-gray-500 tw-p-4">
        No summary data available
      </div>
    );
  }

  // Helper to format numbers
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return Number(num).toFixed(decimals);
  };

  // Helper to format variance with sign and color
  const formatVariance = (value) => {
    if (value === null || value === undefined) return '-';
    const num = Number(value);
    const sign = num >= 0 ? '+' : '';
    const colorClass = num > 0 ? 'tw-text-orange-600' : num < 0 ? 'tw-text-red-600' : 'tw-text-green-600';
    return <span className={`tw-font-semibold ${colorClass}`}>{sign}{formatNumber(num)} L</span>;
  };

  // Calculate percentage of periods within threshold
  const thresholdPercentage = summary.totalPeriods > 0
    ? ((summary.periodsWithinThreshold / summary.totalPeriods) * 100).toFixed(1)
    : 0;

  // Determine largest absolute variance
  const largestAbsVariance = Math.max(
    Math.abs(summary.largestPositiveVariance || 0),
    Math.abs(summary.largestNegativeVariance || 0)
  );

  const cards = [
    {
      title: 'Total Periods',
      value: summary.totalPeriods,
      icon: 'fa-calendar-days',
      iconColor: 'tw-text-blue-600',
      bgColor: 'tw-bg-blue-50',
      subtitle: 'Analyzed'
    },
    {
      title: 'Transfers In',
      value: `${formatNumber(summary.totalTransfersIn)} L`,
      icon: 'fa-arrow-down-to-line',
      iconColor: 'tw-text-green-600',
      bgColor: 'tw-bg-green-50',
      subtitle: `${summary.transferInCount || 0} transactions`
    },
    {
      title: 'Transfers Out',
      value: `${formatNumber(summary.totalTransfersOut)} L`,
      icon: 'fa-arrow-up-from-line',
      iconColor: 'tw-text-orange-600',
      bgColor: 'tw-bg-orange-50',
      subtitle: `${summary.transferOutCount || 0} transactions`
    },
    {
      title: 'Total Dispensing',
      value: `${formatNumber(summary.totalDispensing)} L`,
      icon: 'fa-gas-pump',
      iconColor: 'tw-text-purple-600',
      bgColor: 'tw-bg-purple-50',
      subtitle: 'All sources'
    },
    {
      title: 'Average Variance',
      value: formatVariance(summary.averageVariance),
      icon: 'fa-chart-line',
      iconColor: 'tw-text-indigo-600',
      bgColor: 'tw-bg-indigo-50',
      subtitle: 'Per period'
    },
    {
      title: 'Within Threshold',
      value: `${summary.periodsWithinThreshold || 0}`,
      icon: 'fa-circle-check',
      iconColor: thresholdPercentage >= 80 ? 'tw-text-green-600' : thresholdPercentage >= 60 ? 'tw-text-yellow-600' : 'tw-text-red-600',
      bgColor: thresholdPercentage >= 80 ? 'tw-bg-green-50' : thresholdPercentage >= 60 ? 'tw-bg-yellow-50' : 'tw-bg-red-50',
      subtitle: `${thresholdPercentage}% of periods`
    }
  ];

  return (
    <div className="transfer-reconciliation-summary">
      {/* Summary Cards Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 tw-mb-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow"
          >
            <div className="tw-flex tw-items-start tw-justify-between">
              <div className="tw-flex-1">
                <div className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-mb-1">
                  {card.title}
                </div>
                <div className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-1">
                  {card.value}
                </div>
                <div className="tw-text-xs tw-text-gray-600">
                  {card.subtitle}
                </div>
              </div>
              <div className={`tw-w-12 tw-h-12 tw-rounded-full ${card.bgColor} tw-flex tw-items-center tw-justify-center tw-flex-shrink-0`}>
                <i className={`fa-light ${card.icon} tw-text-2xl ${card.iconColor}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Summary Information */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
        {/* Variance Breakdown */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-chart-mixed tw-mr-2 tw-text-blue-600"></i>
            Variance Breakdown
          </h4>
          <div className="tw-space-y-2">
            <div className="tw-flex tw-justify-between tw-items-center tw-text-sm">
              <span className="tw-text-gray-600">Largest Positive:</span>
              <span className="tw-font-semibold tw-text-orange-600">
                +{formatNumber(summary.largestPositiveVariance || 0)} L
              </span>
            </div>
            <div className="tw-flex tw-justify-between tw-items-center tw-text-sm">
              <span className="tw-text-gray-600">Largest Negative:</span>
              <span className="tw-font-semibold tw-text-red-600">
                {formatNumber(summary.largestNegativeVariance || 0)} L
              </span>
            </div>
            <div className="tw-flex tw-justify-between tw-items-center tw-text-sm tw-pt-2 tw-border-t tw-border-gray-200">
              <span className="tw-text-gray-600">Largest Absolute:</span>
              <span className="tw-font-semibold tw-text-gray-900">
                {formatNumber(largestAbsVariance)} L
              </span>
            </div>
            {summary.periodWithLargestVariance && (
              <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-gray-200">
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Period with Largest Variance:</div>
                <div className="tw-text-sm tw-font-semibold tw-text-gray-700">
                  Period #{summary.periodWithLargestVariance.periodNumber}
                </div>
                <div className="tw-text-xs tw-text-gray-600">
                  {new Date(summary.periodWithLargestVariance.startDate).toLocaleDateString()} - {new Date(summary.periodWithLargestVariance.endDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Period Status Breakdown */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-traffic-light tw-mr-2 tw-text-blue-600"></i>
            Period Status
          </h4>
          <div className="tw-space-y-3">
            {/* Acceptable */}
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center">
                <div className="tw-w-3 tw-h-3 tw-bg-green-500 tw-rounded-full tw-mr-2"></div>
                <span className="tw-text-sm tw-text-gray-600">Acceptable</span>
              </div>
              <div className="tw-flex tw-items-center">
                <span className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mr-2">
                  {summary.periodsWithinThreshold || 0}
                </span>
                <span className="tw-text-xs tw-text-gray-500">
                  ({summary.totalPeriods > 0 ? ((summary.periodsWithinThreshold / summary.totalPeriods) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>

            {/* Moderate */}
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center">
                <div className="tw-w-3 tw-h-3 tw-bg-yellow-500 tw-rounded-full tw-mr-2"></div>
                <span className="tw-text-sm tw-text-gray-600">Moderate</span>
              </div>
              <div className="tw-flex tw-items-center">
                <span className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mr-2">
                  {summary.periodsWithModerateVariance || 0}
                </span>
                <span className="tw-text-xs tw-text-gray-500">
                  ({summary.totalPeriods > 0 ? ((summary.periodsWithModerateVariance / summary.totalPeriods) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>

            {/* High */}
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center">
                <div className="tw-w-3 tw-h-3 tw-bg-red-500 tw-rounded-full tw-mr-2"></div>
                <span className="tw-text-sm tw-text-gray-600">High Variance</span>
              </div>
              <div className="tw-flex tw-items-center">
                <span className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mr-2">
                  {summary.periodsWithHighVariance || 0}
                </span>
                <span className="tw-text-xs tw-text-gray-500">
                  ({summary.totalPeriods > 0 ? ((summary.periodsWithHighVariance / summary.totalPeriods) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispensing Breakdown (if available) */}
        {summary.totalDispensingBreakdown && (
          <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-shadow-sm lg:tw-col-span-2">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
              <i className="fa-light fa-gas-pump tw-mr-2 tw-text-blue-600"></i>
              Dispensing Sources Breakdown
            </h4>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <div className="tw-flex tw-items-center tw-justify-between tw-bg-orange-50 tw-rounded-lg tw-p-3">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Manual Aggregate</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {formatNumber(summary.totalDispensingBreakdown.manualAggregate)} L
                  </div>
                </div>
                <i className="fa-light fa-hand tw-text-2xl tw-text-orange-600"></i>
              </div>
              <div className="tw-flex tw-items-center tw-justify-between tw-bg-green-50 tw-rounded-lg tw-p-3">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Sensor Dispensing</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {formatNumber(summary.totalDispensingBreakdown.sensorDispensing)} L
                  </div>
                </div>
                <i className="fa-light fa-sensor tw-text-2xl tw-text-green-600"></i>
              </div>
              <div className="tw-flex tw-items-center tw-justify-between tw-bg-blue-50 tw-rounded-lg tw-p-3">
                <div>
                  <div className="tw-text-xs tw-text-gray-600 tw-mb-1">Automated (PTS)</div>
                  <div className="tw-text-lg tw-font-bold tw-text-gray-900">
                    {formatNumber(summary.totalDispensingBreakdown.automatedDispensing)} L
                  </div>
                </div>
                <i className="fa-light fa-robot tw-text-2xl tw-text-blue-600"></i>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferReconciliationSummary;
