import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './EmergencyResponsePanel.scss';

//Cursor - Emergency Response Panel - Crisis management tools for tank operations
const EmergencyResponsePanel = ({ activeIncidents = [], selectedSite }) => {
  const [responseLevel, setResponseLevel] = useState('normal');
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const getResponseLevelInfo = () => {
    if (activeIncidents.length === 0) {
      return {
        level: 'normal',
        color: 'tw-bg-green-500',
        icon: 'fa-check-circle',
        message: 'All systems operational'
      };
    } else if (activeIncidents.length < 3) {
      return {
        level: 'elevated',
        color: 'tw-bg-yellow-500',
        icon: 'fa-exclamation-triangle',
        message: `${activeIncidents.length} active incident${activeIncidents.length > 1 ? 's' : ''}`
      };
    } else {
      return {
        level: 'critical',
        color: 'tw-bg-red-500',
        icon: 'fa-triangle-exclamation',
        message: `${activeIncidents.length} critical incidents - Emergency protocols active`
      };
    }
  };

  const responseInfo = getResponseLevelInfo();

  const emergencyActions = [
    {
      id: 'alert_team',
      label: 'Alert Response Team',
      icon: 'fa-users',
      color: 'tw-bg-red-600',
      onClick: () => console.log('Alerting response team...')
    },
    {
      id: 'shutdown_operations',
      label: 'Emergency Shutdown',
      icon: 'fa-power-off',
      color: 'tw-bg-red-700',
      requiresConfirmation: true,
      onClick: () => console.log('Emergency shutdown initiated...')
    },
    {
      id: 'contact_authorities',
      label: 'Contact Authorities',
      icon: 'fa-phone',
      color: 'tw-bg-red-500',
      onClick: () => console.log('Contacting authorities...')
    },
    {
      id: 'evacuate_area',
      label: 'Evacuation Protocol',
      icon: 'fa-door-open',
      color: 'tw-bg-red-800',
      requiresConfirmation: true,
      onClick: () => console.log('Evacuation protocol activated...')
    }
  ];

  const handleEmergencyAction = async (action) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(`Are you sure you want to ${action.label.toLowerCase()}? This action cannot be undone.`);
      if (!confirmed) return;
    }

    try {
      if (action.onClick) {
        await action.onClick();
      }
    } catch (error) {
      console.error(`Error executing emergency action ${action.label}:`, error);
    }
  };

  if (responseInfo.level === 'normal') {
    return (
      <div className="emergency-response-panel tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
        <div className="tw-flex tw-items-center tw-space-x-3">
          <i className={`fa-light ${responseInfo.icon} tw-text-green-600 tw-text-xl`}></i>
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-green-800">System Status: Normal</h3>
            <p className="tw-text-green-700 tw-text-sm">{responseInfo.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`emergency-response-panel tw-border tw-rounded-lg tw-p-6 tw-shadow-lg ${
      responseInfo.level === 'critical'
        ? 'tw-bg-red-50 tw-border-red-300'
        : 'tw-bg-yellow-50 tw-border-yellow-300'
    }`}>
      {/* Response Level Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center tw-space-x-3">
          <div className={`tw-p-3 tw-rounded-full ${responseInfo.color} tw-text-white`}>
            <i className={`fa-light ${responseInfo.icon} tw-text-xl`}></i>
          </div>
          <div>
            <h3 className="tw-text-xl tw-font-bold tw-text-gray-900">
              Emergency Response Level: {responseInfo.level.toUpperCase()}
            </h3>
            <p className="tw-text-gray-700">{responseInfo.message}</p>
          </div>
        </div>

        {responseInfo.level === 'critical' && (
          <div className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-animate-pulse">
            <i className="fa-light fa-siren tw-mr-2"></i>
            EMERGENCY
          </div>
        )}
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div className="tw-mb-6">
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
            Active Critical Incidents
          </h4>
          <div className="tw-space-y-3">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className="tw-bg-white tw-border tw-border-red-200 tw-rounded-lg tw-p-4 tw-shadow-sm"
              >
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex tw-items-center tw-space-x-3">
                    <i className="fa-light fa-triangle-exclamation tw-text-red-600 tw-text-lg"></i>
                    <div>
                      <div className="tw-font-semibold tw-text-gray-900">{incident.message}</div>
                      {incident.location && (
                        <div className="tw-text-sm tw-text-gray-600">
                          <i className="fa-light fa-location-dot tw-mr-1"></i>
                          {incident.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {incident.actionRequired && (
                    <button
                      onClick={() => incident.onAction && incident.onAction()}
                      className="tw-bg-red-600 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-text-sm tw-font-medium tw-transition-all tw-hover:bg-red-700"
                    >
                      <i className="fa-light fa-bolt tw-mr-1"></i>
                      Respond
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Actions */}
      {responseInfo.level === 'critical' && (
        <div>
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
            Emergency Actions
          </h4>
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3">
            {emergencyActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleEmergencyAction(action)}
                className={`tw-text-white tw-px-4 tw-py-3 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-hover:opacity-90 tw-flex tw-flex-col tw-items-center tw-space-y-2 ${action.color}`}
              >
                <i className={`fa-light ${action.icon} tw-text-lg`}></i>
                <span className="tw-text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Response Team Contact */}
      <div className="tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-text-sm tw-text-gray-600">
            <i className="fa-light fa-clock tw-mr-1"></i>
            Response time target: &lt;2 minutes
          </div>
          <button
            onClick={() => console.log('Contacting emergency response team...')}
            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-hover:bg-blue-700"
          >
            <i className="fa-light fa-phone tw-mr-2"></i>
            Contact Response Team
          </button>
        </div>
      </div>
    </div>
  );
};

EmergencyResponsePanel.propTypes = {
  activeIncidents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      location: PropTypes.string,
      actionRequired: PropTypes.bool,
      onAction: PropTypes.func
    })
  ),
  selectedSite: PropTypes.string
};

export default EmergencyResponsePanel;