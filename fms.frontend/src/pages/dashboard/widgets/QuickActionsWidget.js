/**
 * QuickActionsWidget - Dashboard widget for quick action buttons
 *
 * Displays commonly used action buttons with role-based permissions.
 * Demonstrates the standardized widget architecture pattern.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import WidgetContainer from './WidgetContainer';

// Quick action configurations
const QUICK_ACTIONS = [
  {
    id: 'vehicle-tracking',
    label: 'Vehicle Tracking',
    icon: 'fa-car',
    route: '/vehicles/tracking',
    permission: '_Read_Vehicle',
    color: 'blue'
  },
  {
    id: 'fuel-management',
    label: 'Fuel Management',
    icon: 'fa-gas-pump',
    route: '/fuel/management',
    permission: 'FuelRefil',
    color: 'green'
  },
  {
    id: 'tank-stock',
    label: 'Tank Stock',
    icon: 'fa-oil-can',
    route: '/tankstock',
    permission: 'TankStockModule',
    color: 'purple'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'fa-chart-bar',
    route: '/reports',
    permission: '_View_Dashboard',
    color: 'orange'
  },
  {
    id: 'events',
    label: 'Active Events',
    icon: 'fa-exclamation-triangle',
    route: '/event-expressions',
    permission: ['_Read_EventExpression', '_Manage_ATG'],
    color: 'red'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'fa-cog',
    route: '/settings',
    permission: 'SystemConfiguration',
    color: 'gray'
  }
];

/**
 * QuickActionsWidget Component
 */
const QuickActionsWidget = ({
  widgetId,
  widgetInstance,
  data,
  realtimeData,
  isLoading,
  error,
  connectionStatus,
  currentUser,
  isEditMode,
  isDragging,
  onRefresh,
  onRemove,
  onConfigChange
}) => {
  const navigate = useNavigate();
  const { hasAnyPermission, hasPermission } = usePermissions();

  // Filter actions based on user permissions
  const availableActions = useMemo(() => {
    return QUICK_ACTIONS.filter((action) => (
      Array.isArray(action.permission)
        ? hasAnyPermission(action.permission)
        : hasPermission(action.permission)
    ));
  }, [hasAnyPermission, hasPermission]);

  // Handle action click
  const handleActionClick = (action) => {
    if (isDragging || isEditMode) return;

    try {
      navigate(action.route);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Render action button
  const renderActionButton = (action) => (
    <button
      key={action.id}
      onClick={() => handleActionClick(action)}
      disabled={isDragging || isEditMode}
      className={`
        action-button
        tw-p-3 tw-rounded-lg tw-text-center tw-transition-all tw-duration-200
        tw-border tw-border-gray-200 hover:tw-shadow-md hover:tw-scale-105
        tw-bg-gradient-to-br tw-from-${action.color}-50 tw-to-${action.color}-100
        hover:tw-from-${action.color}-100 hover:tw-to-${action.color}-200
        ${isDragging || isEditMode ? 'tw-cursor-not-allowed tw-opacity-50' : 'tw-cursor-pointer'}
        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-${action.color}-300
      `}
      title={action.label}
    >
      <div className={`action-icon tw-text-2xl tw-text-${action.color}-600 tw-mb-2`}>
        <i className={`fa-light ${action.icon}`}></i>
      </div>
      <div className="action-label tw-text-sm tw-font-medium tw-text-gray-700">
        {action.label}
      </div>
    </button>
  );

  // Widget content
  const widgetContent = () => {
    if (availableActions.length === 0) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-400">
          <i className="fa-light fa-lock tw-text-3xl tw-mb-3"></i>
          <p className="tw-text-sm tw-text-center">No actions available</p>
          <p className="tw-text-xs tw-text-center tw-mt-1">Check your permissions</p>
        </div>
      );
    }

    return (
      <div className={`
        action-grid
        tw-grid tw-gap-3 tw-h-full
        ${availableActions.length <= 2 ? 'tw-grid-cols-1' :
          availableActions.length <= 4 ? 'tw-grid-cols-2' :
            'tw-grid-cols-3'}
      `}>
        {availableActions.map(renderActionButton)}
      </div>
    );
  };

  return (
    <WidgetContainer
      widgetId={widgetId}
      title="Quick Actions"
      icon="fa-bolt"
      isLoading={isLoading}
      error={error}
      isEmpty={availableActions.length === 0}
      isEditMode={isEditMode}
      isDragging={isDragging}
      onRefresh={onRefresh}
      onRemove={onRemove}
      onConfigChange={onConfigChange}
      className="widget-quick-actions"
    >
      {widgetContent()}
    </WidgetContainer>
  );
};

QuickActionsWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  widgetInstance: PropTypes.object,
  data: PropTypes.object,
  realtimeData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  connectionStatus: PropTypes.string,
  currentUser: PropTypes.object,
  isEditMode: PropTypes.bool,
  isDragging: PropTypes.bool,
  onRefresh: PropTypes.func,
  onRemove: PropTypes.func,
  onConfigChange: PropTypes.func
};

QuickActionsWidget.defaultProps = {
  widgetInstance: {},
  data: null,
  realtimeData: {},
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',
  currentUser: null,
  isEditMode: false,
  isDragging: false,
  onRefresh: () => { },
  onRemove: null,
  onConfigChange: () => { }
};

export default QuickActionsWidget;