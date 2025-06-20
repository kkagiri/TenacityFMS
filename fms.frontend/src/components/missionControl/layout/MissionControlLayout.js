import React from 'react';
import PropTypes from 'prop-types';
import CriticalAlertBanner from './CriticalAlertBanner';
import LiveMetricsHeader from './LiveMetricsHeader';
import QuickActionPanel from './QuickActionPanel';
import './MissionControlLayout.scss';

//Cursor - Mission Control Layout - Unified foundation for tank operations and reconciliation
const MissionControlLayout = ({
  children,
  title,
  criticalAlerts = [],
  liveMetrics = {},
  quickActions = [],
  showAlerts = true,
  showMetrics = true,
  showQuickActions = true,
  additionalHeaderContent,
  className = ""
}) => {
  return (
    <div className={`mission-control-layout tw-min-h-screen tw-bg-gray-50 ${className}`}>
      {/* Critical Alert Banner - Always visible when alerts exist */}
      {showAlerts && criticalAlerts.length > 0 && (
        <CriticalAlertBanner alerts={criticalAlerts} />
      )}

      {/* Mission Control Header */}
      <header className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-space-x-4">
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-flex tw-items-center">
              <i className="fa-light fa-satellite-dish tw-mr-3 tw-text-blue-600"></i>
              {title}
            </h1>
            <div className="tw-bg-blue-50 tw-text-blue-700 tw-border tw-border-blue-200 tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium">
              <i className="fa-light fa-circle tw-mr-1 tw-text-green-500"></i>
              Mission Control Active
            </div>
          </div>
          {additionalHeaderContent}
        </div>

        {/* Live Metrics Header */}
        {showMetrics && (
          <LiveMetricsHeader metrics={liveMetrics} />
        )}
      </header>

      {/* Quick Action Panel */}
      {showQuickActions && quickActions.length > 0 && (
        <QuickActionPanel actions={quickActions} />
      )}

      {/* Main Content Area */}
      <main className="tw-px-6 tw-py-6">
        {children}
      </main>
    </div>
  );
};

MissionControlLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  criticalAlerts: PropTypes.array,
  liveMetrics: PropTypes.object,
  quickActions: PropTypes.array,
  showAlerts: PropTypes.bool,
  showMetrics: PropTypes.bool,
  showQuickActions: PropTypes.bool,
  additionalHeaderContent: PropTypes.node,
  className: PropTypes.string
};

export default MissionControlLayout;