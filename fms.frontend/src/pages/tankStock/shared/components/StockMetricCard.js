import React from 'react';
import PropTypes from 'prop-types';

//Cursor - Shared component for displaying stock metrics across tank stock pages
const StockMetricCard = ({
  title,
  value,
  unit = '',
  icon,
  status = 'normal',
  trend = null,
  onClick = null,
  className = ''
}) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'critical':
        return 'tw-border-red-200 tw-bg-red-50 tw-text-red-800';
      case 'warning':
        return 'tw-border-yellow-200 tw-bg-yellow-50 tw-text-yellow-800';
      case 'success':
        return 'tw-border-green-200 tw-bg-green-50 tw-text-green-800';
      default:
        return 'tw-border-blue-200 tw-bg-blue-50 tw-text-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend > 0) {
      return <i className="fa-light fa-arrow-up tw-text-green-600 tw-ml-2"></i>;
    } else if (trend < 0) {
      return <i className="fa-light fa-arrow-down tw-text-red-600 tw-ml-2"></i>;
    }
    return <i className="fa-light fa-minus tw-text-gray-400 tw-ml-2"></i>;
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={`tw-border-2 tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 ${getStatusClasses()} ${
        onClick ? 'tw-cursor-pointer hover:tw-shadow-md' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center">
          {icon && (
            <div className="tw-mr-3">
              <i className={`${icon} tw-text-2xl`}></i>
            </div>
          )}
          <div>
            <h3 className="tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-1">
              {title}
            </h3>
            <div className="tw-flex tw-items-center">
              <span className="tw-text-2xl tw-font-bold">
                {formatValue(value)}
              </span>
              {unit && (
                <span className="tw-text-sm tw-text-gray-500 tw-ml-1">
                  {unit}
                </span>
              )}
              {getTrendIcon()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

StockMetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  icon: PropTypes.string,
  status: PropTypes.oneOf(['normal', 'success', 'warning', 'critical']),
  trend: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default StockMetricCard;