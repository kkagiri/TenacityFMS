/**
 * DashboardWidgetInstance
 * Clean re-created component after previous merge corruption.
 * - No experimental factory hook usage (can be re-added later)
 * - Integrates with existing EnhancedWidgetRenderer and tailwind classes
 * - Provides loading, error, and standard header controls
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import EnhancedWidgetRenderer from './EnhancedWidgetRenderer';

const DashboardWidgetInstance = ({
  widget,
  isEditMode = false,
  onRemove = null,
  onConfigure = null,
  enableAutoRefresh = true,
  className = '',
  ...otherProps
}) => {
  // Local transient state (simplified)
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Extract widget information
  const widgetInfo = useMemo(() => {
    const template = widget?.template || {};
    return {
      id: widget?.id || widget?.instanceId || 'unknown',
      name: widget?.customName || template?.displayName || template?.name || 'Unnamed Widget',
      type: template?.widgetType || template?.type || 'unknown',
      category: template?.category || 'general',
    };
  }, [widget]);

  // Handle configuration
  const handleConfigure = useCallback(() => {
    setIsConfiguring(true);
    if (onConfigure) {
      onConfigure(widget, {
        onComplete: (newConfig) => {
          setIsConfiguring(false);
          if (newConfig) {
            setLastUpdated(new Date());
          }
        },
        onCancel: () => {
          setIsConfiguring(false);
        }
      });
    }
  }, [widget, onConfigure]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastUpdated(new Date());
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div
      className={`widget-instance ${isEditMode ? 'edit-mode' : ''} ${className} tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-h-full tw-flex tw-flex-col tw-relative ${isLoading ? 'tw-opacity-70' : ''}`}
      style={{ transition: 'opacity 0.3s ease' }}
    >
      {/* Header */}
      <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-justify-between tw-items-start">
          <div className="tw-flex-1 tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-2">
              <h6 className="tw-text-gray-900 tw-font-medium tw-text-sm tw-truncate">
                {widgetInfo.name}
              </h6>
              {isLoading && <LoadIndicator height={16} width={16} />}
            </div>
            {lastUpdated && (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="tw-flex tw-items-center tw-gap-1">
            <button
              onClick={handleRefresh}
              className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-blue-600 hover:tw-bg-blue-50"
              title="Refresh"
            >
              <i className="fa-light fa-refresh tw-text-sm"></i>
            </button>
            {onConfigure && (
              <button
                onClick={handleConfigure}
                className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-purple-600 hover:tw-bg-purple-50"
                title="Configure"
              >
                <i className="fa-light fa-cog tw-text-sm"></i>
              </button>
            )}
            {isEditMode && onRemove && (
              <button
                onClick={() => onRemove(widget)}
                className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-red-600 hover:tw-bg-red-50"
                title="Remove widget"
              >
                <i className="fa-light fa-times tw-text-sm"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="tw-flex-1 tw-pt-0 tw-pb-1">
        <EnhancedWidgetRenderer
          widget={widget}
          category={widgetInfo.category}
          data={null}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          onConfigChange={handleConfigure}
          isEditMode={isEditMode}
          hideHeader
          {...otherProps}
        />
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="tw-px-4 tw-py-2 tw-border-t tw-border-gray-100 tw-text-xs tw-text-gray-500 tw-bg-gray-50">
          ID: {widgetInfo.id}
        </div>
      )}
    </div>
  );
};

DashboardWidgetInstance.propTypes = {
  widget: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool,
  onRemove: PropTypes.func,
  onConfigure: PropTypes.func,
  enableAutoRefresh: PropTypes.bool,
  className: PropTypes.string,
};

export default DashboardWidgetInstance;

