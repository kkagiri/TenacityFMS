import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './CriticalAlertBanner.scss';

//Cursor - Critical Alert Banner - Top-level critical notifications for mission control
const CriticalAlertBanner = ({ alerts = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'fa-triangle-exclamation';
      case 'warning':
        return 'fa-exclamation-circle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-bell';
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'tw-bg-red-600 tw-text-white';
      case 'warning':
        return 'tw-bg-yellow-500 tw-text-white';
      case 'info':
        return 'tw-bg-blue-600 tw-text-white';
      default:
        return 'tw-bg-gray-600 tw-text-white';
    }
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="critical-alert-banner tw-relative tw-z-50">
      {activeAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`alert-item tw-px-6 tw-py-3 tw-flex tw-items-center tw-justify-between ${getAlertStyles(alert.severity)}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="tw-flex tw-items-center tw-space-x-3">
            <i className={`fa-light ${getAlertIcon(alert.severity)} tw-text-lg tw-animate-pulse`}></i>
            <div>
              <span className="tw-font-semibold tw-text-sm tw-uppercase tw-tracking-wide">
                {alert.severity} Alert
              </span>
              <div className="tw-text-lg tw-font-medium">
                {alert.message}
              </div>
              {alert.location && (
                <div className="tw-text-sm tw-opacity-90">
                  <i className="fa-light fa-location-dot tw-mr-1"></i>
                  {alert.location}
                </div>
              )}
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-space-x-3">
            {alert.actionRequired && (
              <button
                className="tw-bg-white tw-bg-opacity-20 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-hover:bg-opacity-30"
                onClick={() => alert.onAction && alert.onAction()}
              >
                <i className="fa-light fa-bolt tw-mr-2"></i>
                Take Action
              </button>
            )}
            <button
              onClick={() => handleDismiss(alert.id)}
              className="tw-text-white tw-hover:bg-white tw-hover:bg-opacity-20 tw-p-2 tw-rounded-lg tw-transition-all"
              aria-label="Dismiss alert"
            >
              <i className="fa-light fa-times tw-text-lg"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

CriticalAlertBanner.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      severity: PropTypes.oneOf(['critical', 'warning', 'info']).isRequired,
      location: PropTypes.string,
      actionRequired: PropTypes.bool,
      onAction: PropTypes.func
    })
  )
};

export default CriticalAlertBanner;