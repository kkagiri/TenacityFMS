/**
 * WidgetContainer - Base container component for all dashboard widgets
 *
 * Provides standardized layout, loading states, error handling, and edit controls.
 * All dashboard widgets should use this as their base container.
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import LoadingIndicator from 'devextreme-react/loading-panel';

/**
 * WidgetContainer Component
 */
const WidgetContainer = ({
  widgetId,
  title,
  icon,
  subtitle,
  children,
  isLoading,
  error,
  isEmpty,
  isEditMode,
  isDragging,
  showRefresh,
  showSettings,
  className,
  headerActions,
  onRefresh,
  onRemove,
  onSettings,
  onConfigChange,
  customHeader,
  fullHeight
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh action
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Widget refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Widget header controls
  const renderHeaderControls = () => {
    const controls = [];

    // Refresh button
    if (showRefresh && onRefresh && !isEditMode) {
      controls.push(
        <button
          key="refresh"
          onClick={handleRefresh}
          disabled={isRefreshing || isDragging}
          className="widget-control-btn widget-control-btn--refresh"
          title="Refresh widget data"
        >
          <i className={`fa-light fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
        </button>
      );
    }

    // Settings button
    if (showSettings && onSettings && !isEditMode) {
      controls.push(
        <button
          key="settings"
          onClick={onSettings}
          disabled={isDragging}
          className="widget-control-btn widget-control-btn--settings"
          title="Widget settings"
        >
          <i className="fa-light fa-cog"></i>
        </button>
      );
    }

    // Custom header actions
    if (headerActions && !isEditMode) {
      headerActions.forEach((action, index) => {
        controls.push(
          <button
            key={`custom-${index}`}
            onClick={action.onClick}
            disabled={isDragging}
            className={`widget-control-btn ${action.className || ''}`}
            title={action.title}
          >
            <i className={`fa-light ${action.icon}`}></i>
          </button>
        );
      });
    }

    // Edit mode controls
    if (isEditMode) {
      if (onRemove) {
        controls.push(
          <button
            key="remove"
            onClick={onRemove}
            className="widget-control-btn widget-control-btn--remove"
            title="Remove widget"
          >
            <i className="fa-light fa-trash"></i>
          </button>
        );
      }
    }

    return controls;
  };

  // Widget header
  const renderHeader = () => {
    if (customHeader) {
      return customHeader;
    }

    return (
      <div className="widget-header">
        <div className="widget-title">
          {icon && (
            <i className={`widget-icon fa-light ${icon}`}></i>
          )}
          <span>{title}</span>
          {subtitle && (
            <span className="tw-text-sm tw-text-gray-500 tw-ml-2">
              {subtitle}
            </span>
          )}
        </div>

        <div className="widget-controls">
          {renderHeaderControls()}
        </div>
      </div>
    );
  };

  // Loading state
  const renderLoading = () => (
    <div className="widget-content widget-content--loading">
      <LoadingIndicator
        visible={true}
        message="Loading..."
        className="loading-spinner"
      />
    </div>
  );

  // Error state
  const renderError = () => (
    <div className="widget-content widget-content--error">
      <i className="error-icon fa-light fa-exclamation-triangle"></i>
      <p className="error-message">
        {typeof error === 'string' ? error : 'An error occurred while loading widget data'}
      </p>
      {onRefresh && (
        <button
          onClick={handleRefresh}
          className="tw-mt-3 tw-px-3 tw-py-1 tw-bg-red-100 tw-text-red-700 tw-rounded tw-text-sm hover:tw-bg-red-200 tw-transition-colors"
        >
          <i className="fa-light fa-redo tw-mr-1"></i>
          Try Again
        </button>
      )}
    </div>
  );

  // Empty state
  const renderEmpty = () => (
    <div className="widget-content widget-content--empty">
      <i className="empty-icon fa-light fa-inbox"></i>
      <p className="empty-message">No data available</p>
      {onRefresh && (
        <button
          onClick={handleRefresh}
          className="tw-mt-3 tw-px-3 tw-py-1 tw-bg-gray-100 tw-text-gray-700 tw-rounded tw-text-sm hover:tw-bg-gray-200 tw-transition-colors"
        >
          <i className="fa-light fa-sync tw-mr-1"></i>
          Refresh
        </button>
      )}
    </div>
  );

  // Main content
  const renderContent = () => {
    if (isLoading && !isRefreshing) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    if (isEmpty) {
      return renderEmpty();
    }

    return (
      <div className={`widget-content ${fullHeight ? 'tw-h-full' : ''}`}>
        {children}
      </div>
    );
  };

  // Compute container classes
  const containerClasses = useMemo(() => {
    const classes = [
      'dashboard-widget-container',
      className || ''
    ];

    if (isEditMode) {
      classes.push('widget-container--edit-mode');
    }

    if (isDragging) {
      classes.push('widget-container--dragging');
    }

    if (error) {
      classes.push('widget-container--error');
    }

    if (isLoading) {
      classes.push('widget-container--loading');
    }

    return classes.filter(Boolean).join(' ');
  }, [className, isEditMode, isDragging, error, isLoading]);

  return (
    <div
      className={containerClasses}
      data-widget-id={widgetId}
    >
      {renderHeader()}
      {renderContent()}

      {/* Loading overlay for refresh */}
      {isRefreshing && (
        <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-10">
          <LoadingIndicator
            visible={true}
            message="Refreshing..."
          />
        </div>
      )}

      {/* Edit mode overlay */}
      {isEditMode && (
        <div className="tw-absolute tw-top-2 tw-left-2 tw-bg-blue-600 tw-text-white tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-z-10">
          Edit Mode
        </div>
      )}
    </div>
  );
};

WidgetContainer.propTypes = {
  widgetId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  isEmpty: PropTypes.bool,
  isEditMode: PropTypes.bool,
  isDragging: PropTypes.bool,
  showRefresh: PropTypes.bool,
  showSettings: PropTypes.bool,
  className: PropTypes.string,
  headerActions: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string,
    className: PropTypes.string
  })),
  onRefresh: PropTypes.func,
  onRemove: PropTypes.func,
  onSettings: PropTypes.func,
  onConfigChange: PropTypes.func,
  customHeader: PropTypes.node,
  fullHeight: PropTypes.bool
};

WidgetContainer.defaultProps = {
  icon: null,
  subtitle: null,
  children: null,
  isLoading: false,
  error: null,
  isEmpty: false,
  isEditMode: false,
  isDragging: false,
  showRefresh: true,
  showSettings: false,
  className: '',
  headerActions: [],
  onRefresh: null,
  onRemove: null,
  onSettings: null,
  onConfigChange: () => {},
  customHeader: null,
  fullHeight: false
};

export default WidgetContainer;