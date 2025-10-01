/**
 * DashboardHeader - Header component for the real-time dashboard
 *
 * Displays dashboard title, connection status, and action controls.
 * Includes edit mode toggle, refresh, settings, and widget management controls.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * DashboardHeader Component
 */
const DashboardHeader = ({
  title,
  subtitle,
  connectionStatus,
  connectionInfo,
  isEditMode,
  showEditControls,
  onEditModeToggle,
  onRefresh,
  onSettings,
  onWidgetAdd,
  className
}) => {
  // Connection status display
  const connectionDisplay = useMemo(() => {
    const statusConfig = {
      connected: {
        icon: 'fa-wifi',
        text: 'Live',
        color: 'green',
        bgColor: 'tw-bg-green-100 tw-text-green-800 tw-border-green-200'
      },
      connecting: {
        icon: 'fa-spinner fa-spin',
        text: 'Connecting...',
        color: 'yellow',
        bgColor: 'tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-200'
      },
      disconnected: {
        icon: 'fa-wifi-slash',
        text: 'Offline',
        color: 'red',
        bgColor: 'tw-bg-red-100 tw-text-red-800 tw-border-red-200'
      },
      error: {
        icon: 'fa-exclamation-triangle',
        text: 'Error',
        color: 'red',
        bgColor: 'tw-bg-red-100 tw-text-red-800 tw-border-red-200'
      }
    };

    return statusConfig[connectionStatus] || statusConfig.disconnected;
  }, [connectionStatus]);

  // Format connection info
  const connectionDetails = useMemo(() => {
    if (!connectionInfo) return null;

    return {
      uptime: connectionInfo.connectedAt
        ? Math.floor((Date.now() - new Date(connectionInfo.connectedAt).getTime()) / 1000 / 60)
        : 0,
      lastUpdate: connectionInfo.lastActivity
        ? new Date(connectionInfo.lastActivity).toLocaleTimeString()
        : null
    };
  }, [connectionInfo]);

  return (
    <div className={`
      dashboard-header
      tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4
      tw-flex tw-items-center tw-justify-between tw-shadow-sm
      ${className || ''}
    `}>
      {/* Left Section - Title and Status */}
      <div className="tw-flex tw-items-center tw-space-x-6">
        {/* Title Section */}
        <div className="tw-flex tw-flex-col">
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-flex tw-items-center">
            <i className="fa-light fa-tachometer-alt tw-mr-3 tw-text-blue-600"></i>
            {title}
            {isEditMode && (
              <span className="tw-ml-3 tw-px-2 tw-py-1 tw-bg-orange-100 tw-text-orange-800 tw-text-sm tw-font-medium tw-rounded">
                Edit Mode
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{subtitle}</p>
          )}
        </div>

        {/* Connection Status */}
        <div className="tw-flex tw-items-center tw-space-x-3">
          <div className={`
            tw-flex tw-items-center tw-px-3 tw-py-2 tw-rounded-full tw-border
            tw-text-sm tw-font-medium tw-transition-colors
            ${connectionDisplay.bgColor}
          `}>
            <i className={`fa-light ${connectionDisplay.icon} tw-mr-2`}></i>
            {connectionDisplay.text}
          </div>

          {connectionDetails && connectionStatus === 'connected' && (
            <div className="tw-text-xs tw-text-gray-500">
              <div>Connected for {connectionDetails.uptime}m</div>
              {connectionDetails.lastUpdate && (
                <div>Last update: {connectionDetails.lastUpdate}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Action Controls */}
      <div className="tw-flex tw-items-center tw-space-x-3">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isEditMode}
          className="
            tw-inline-flex tw-items-center tw-px-3 tw-py-2 tw-border tw-border-gray-300
            tw-rounded-md tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white
            hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500
            disabled:tw-opacity-50 disabled:tw-cursor-not-allowed
            tw-transition-colors
          "
          title="Refresh all widgets"
        >
          <i className="fa-light fa-sync-alt tw-mr-2"></i>
          Refresh
        </button>

        {/* Settings Button */}
        <button
          onClick={onSettings}
          disabled={isEditMode}
          className="
            tw-inline-flex tw-items-center tw-px-3 tw-py-2 tw-border tw-border-gray-300
            tw-rounded-md tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white
            hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500
            disabled:tw-opacity-50 disabled:tw-cursor-not-allowed
            tw-transition-colors
          "
          title="Dashboard settings"
        >
          <i className="fa-light fa-cog tw-mr-2"></i>
          Settings
        </button>

        {/* Edit Mode Controls */}
        {showEditControls && (
          <>
            {/* Add Widget Button (Edit Mode Only) */}
            {isEditMode && (
              <button
                onClick={onWidgetAdd}
                className="
                  tw-inline-flex tw-items-center tw-px-3 tw-py-2 tw-border tw-border-blue-300
                  tw-rounded-md tw-text-sm tw-font-medium tw-text-blue-700 tw-bg-blue-50
                  hover:tw-bg-blue-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500
                  tw-transition-colors
                "
                title="Add new widget"
              >
                <i className="fa-light fa-plus tw-mr-2"></i>
                Add Widget
              </button>
            )}

            {/* Edit Mode Toggle */}
            <button
              onClick={() => onEditModeToggle(!isEditMode)}
              className={`
                tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-border tw-rounded-md
                tw-text-sm tw-font-medium focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500
                tw-transition-colors
                ${isEditMode
                  ? 'tw-border-green-300 tw-text-green-700 tw-bg-green-50 hover:tw-bg-green-100 focus:tw-ring-green-500'
                  : 'tw-border-orange-300 tw-text-orange-700 tw-bg-orange-50 hover:tw-bg-orange-100 focus:tw-ring-orange-500'
                }
              `}
              title={isEditMode ? 'Save changes and exit edit mode' : 'Enter edit mode to customize layout'}
            >
              <i className={`fa-light ${isEditMode ? 'fa-check' : 'fa-edit'} tw-mr-2`}></i>
              {isEditMode ? 'Done Editing' : 'Edit Layout'}
            </button>
          </>
        )}

        {/* User Menu (if needed) */}
        <div className="tw-relative">
          {/* User avatar or menu trigger can go here */}
        </div>
      </div>
    </div>
  );
};

DashboardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  connectionStatus: PropTypes.oneOf(['connected', 'connecting', 'disconnected', 'error']),
  connectionInfo: PropTypes.object,
  isEditMode: PropTypes.bool,
  showEditControls: PropTypes.bool,
  onEditModeToggle: PropTypes.func,
  onRefresh: PropTypes.func,
  onSettings: PropTypes.func,
  onWidgetAdd: PropTypes.func,
  className: PropTypes.string
};

DashboardHeader.defaultProps = {
  subtitle: null,
  connectionStatus: 'disconnected',
  connectionInfo: null,
  isEditMode: false,
  showEditControls: true,
  onEditModeToggle: () => {},
  onRefresh: () => {},
  onSettings: () => {},
  onWidgetAdd: () => {},
  className: ''
};

export default DashboardHeader;