import React from 'react';
import './FuelComparisonMetricCard.scss';

/**
 * FuelComparisonMetricCard - Metric card component for fuel comparison dashboard
 *
 * Displays a single metric with icon, value, and optional trend indicator.
 * Uses Tailwind CSS with tw- prefix and FontAwesome Light icons.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.icon - FontAwesome icon class (e.g., 'fa-light fa-chart-line')
 * @param {string} props.tone - Color tone (success, warning, negative, info, delivery)
 * @param {number} props.value - Main metric value
 * @param {string} props.unit - Optional unit label (e.g., 'L', '%', 'records')
 * @param {string} props.subtitle - Optional subtitle text
 * @param {Function} props.formatValue - Optional value formatter function
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} Metric card component
 */
const FuelComparisonMetricCard = ({
  title,
  icon,
  tone = 'info',
  value,
  unit,
  subtitle,
  formatValue = (val) => val?.toLocaleString() || '0',
  isLoading = false
}) => {
  // Gradient color class mapping
  const getGradientClass = (tone) => {
    switch (tone) {
      case 'success':
        return 'tw-from-green-400 tw-to-green-600';
      case 'negative':
        return 'tw-from-red-400 tw-to-red-600';
      case 'warning':
        return 'tw-from-yellow-400 tw-to-yellow-600';
      case 'delivery':
        return 'tw-from-blue-400 tw-to-blue-600';
      case 'info':
        return 'tw-from-indigo-400 tw-to-indigo-600';
      default:
        return 'tw-from-gray-400 tw-to-gray-600';
    }
  };

  const gradientClass = getGradientClass(tone);

  return (
    <div className="fuel-comparison-metric-card tw-relative tw-bg-white tw-rounded-xl tw-shadow-lg tw-border tw-border-gray-200 tw-overflow-hidden tw-transition-all tw-duration-300 tw-hover:shadow-xl tw-hover:scale-105">
      {/* Background gradient overlay */}
      <div className={`tw-absolute tw-top-0 tw-right-0 tw-w-20 tw-h-20 tw-bg-gradient-to-br ${gradientClass} tw-opacity-10 tw-rounded-bl-full`}></div>

      <div className="tw-flex tw-items-center tw-p-4">
        {/* Icon */}
        <div className={`tw-flex tw-items-center tw-justify-center tw-w-12 tw-h-12 tw-rounded-full tw-bg-gradient-to-br ${gradientClass} tw-text-white tw-shadow-md`}>
          {isLoading ? (
            <i className="fa-light fa-spinner fa-spin tw-text-lg"></i>
          ) : (
            <i className={`${icon} tw-text-lg`}></i>
          )}
        </div>

        {/* Content */}
        <div className="tw-flex-1 tw-ml-4">
          <div className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide tw-mb-1">
            {title}
          </div>
          <div className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {isLoading ? (
              <span className="tw-text-gray-400">--</span>
            ) : (
              <>
                {formatValue(value)}
                {unit && (
                  <span className="tw-text-sm tw-font-normal tw-text-gray-500 tw-ml-1">
                    {unit}
                  </span>
                )}
              </>
            )}
          </div>
          {subtitle && (
            <div className="tw-text-sm tw-text-gray-400 tw-mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`tw-h-1 tw-bg-gradient-to-r ${gradientClass}`}></div>
    </div>
  );
};

export default FuelComparisonMetricCard;
