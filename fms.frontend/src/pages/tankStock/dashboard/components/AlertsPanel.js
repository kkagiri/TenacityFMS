import React from 'react';
import PropTypes from 'prop-types';

//Cursor - Alerts Panel component for critical notifications (Phase 1 placeholder)
const AlertsPanel = ({ alerts = [], selectedSite }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-check-circle tw-text-green-600 tw-text-xl tw-mr-3"></i>
          <span className="tw-text-green-800 tw-font-medium">
            All tanks are operating normally
          </span>
        </div>
      </div>
    );
  }

  const getSeverityClasses = (severity) => {
    switch (severity) {
      case 'critical':
        return 'tw-bg-red-50 tw-border-red-200 tw-text-red-800';
      case 'warning':
        return 'tw-bg-yellow-50 tw-border-yellow-200 tw-text-yellow-800';
      default:
        return 'tw-bg-blue-50 tw-border-blue-200 tw-text-blue-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'fa-light fa-exclamation-triangle tw-text-red-600';
      case 'warning':
        return 'fa-light fa-exclamation-circle tw-text-yellow-600';
      default:
        return 'fa-light fa-info-circle tw-text-blue-600';
    }
  };

  return (
    <div className="tw-space-y-3">
      <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800">
        <i className="fa-light fa-bell tw-mr-2 tw-text-red-600"></i>
        Critical Alerts ({alerts.length})
      </h2>

      {alerts.map((alert, index) => (
        <div
          key={alert.id || index}
          className={`tw-border tw-rounded-lg tw-p-4 tw-transition-all tw-duration-200 ${getSeverityClasses(alert.severity)}`}
        >
          <div className="tw-flex tw-items-start tw-justify-between">
            <div className="tw-flex tw-items-start">
              <i className={`${getSeverityIcon(alert.severity)} tw-text-xl tw-mr-3 tw-mt-1`}></i>
              <div>
                <div className="tw-font-medium tw-mb-1">
                  {alert.message}
                </div>
                <div className="tw-text-sm tw-opacity-75">
                  {alert.timestamp && new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              className="tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors"
              onClick={() => console.log('Dismiss alert:', alert.id)}
            >
              <i className="fa-light fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

AlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    severity: PropTypes.string,
    message: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  })),
  selectedSite: PropTypes.string
};

export default AlertsPanel;