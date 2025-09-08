/**
 * Enhanced Dashboard Widget Instance Component
 * Integrates Widget Factory pattern with legacy system
 * Provides intelligent data acquisition, caching, and real-time updates
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
// DevExtreme Components (only what we actually use)
import { LoadIndicator } from 'devextreme-react/load-indicator';
// Font Awesome Icons
import 'fontawesome/css/all.css';
import EnhancedWidgetRenderer from './EnhancedWidgetRenderer';
import useEnhancedWidgetData from '../hooks/useEnhancedWidgetData';
import signalRService from '../services/signalRService';

/**
 * Enhanced Dashboard Widget Instance
 * Next-generation widget component with factory pattern integration
 */
const DashboardWidgetInstance = ({
  widget,
  position,
  size,
  isEditMode = false,
  onRemove = null,
  onConfigure = null,
  onPositionChange = null,
  onSizeChange = null,
  enableAutoRefresh = true,
  className = '',
  ...otherProps
}) => {
  // Local state
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  // Enhanced data hook with factory integration
  const {
    data,
    isLoading,
    error,
    lastUpdated,
    factoryMetadata,
    refresh,
    updateConfiguration,
    isUsingFactory,
    retryCount
  } = useEnhancedWidgetData(widget, {
    enableAutoRefresh,
    refreshInterval: 30000,
    maxRetries: 3,
    useFactory: 'auto', // Auto-detect factory compatibility
    fallbackToLegacy: true,
    onDataUpdate: useCallback((newData, context) => {
      // Track performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        lastFetchTime: Date.now(),
        source: context.source,
        dataSize: JSON.stringify(newData || {}).length
      }));
    }, []),
    onError: useCallback((error, context) => {
      console.warn(`Widget ${context.widgetId} error (retry ${context.retryCount}):`, error);
    }, [])
  });

  // Extract widget information
  const widgetInfo = useMemo(() => {
    const template = widget.template || {};
    const config = widget.configurationJson ?
      (() => {
        try {
          return JSON.parse(widget.configurationJson);
        } catch {
          return {};
        }
      })() : {};

    return {
      id: widget.id,
      instanceId: widget.instanceId,
      name: widget.customName || template.displayName || `Widget ${widget.id}`,
      type: template.type || template.widgetType || widget.templateType || 'unknown',
      category: template.category || config.category || 'general',
      dataSource: template.dataSource || config.dataSource,
      mode: config.mode || 'cumulative',
      timeRange: config.timeRange || 'yesterday',
      isFactoryCompatible: isUsingFactory
    };
  }, [widget, isUsingFactory]);

  // Real-time connection management
  useEffect(() => {
    const setupRealTime = async () => {
      if (widgetInfo.mode === 'live' && signalRService.isConnected()) {
        try {
          // Subscribe to real-time updates for this widget
          await signalRService.subscribeToWidget(widgetInfo.id);

          // Subscribe to the specific metric type if available
          if (widgetInfo.dataSource) {
            await signalRService.subscribeToMetric(widgetInfo.dataSource);
          }

          setRealTimeConnected(true);
          console.log(`Real-time setup completed for widget ${widgetInfo.id}`);
        } catch (error) {
          console.warn(`Failed to setup real-time for widget ${widgetInfo.id}:`, error);
          setRealTimeConnected(false);
        }
      }
    };

    setupRealTime();

    return () => {
      if (realTimeConnected) {
        signalRService.unsubscribeFromWidget?.(widgetInfo.id);
        if (widgetInfo.dataSource) {
          signalRService.unsubscribeFromMetric?.(widgetInfo.dataSource);
        }
      }
    };
  }, [widgetInfo.mode, widgetInfo.id, widgetInfo.dataSource, realTimeConnected]);

  // Handle configuration changes
  const handleConfigure = useCallback(() => {
    setIsConfiguring(true);
    if (onConfigure) {
      onConfigure(widget, {
        onComplete: (newConfig) => {
          setIsConfiguring(false);
          if (newConfig) {
            updateConfiguration(newConfig);
          }
        },
        onCancel: () => {
          setIsConfiguring(false);
        }
      });
    }
  }, [widget, onConfigure, updateConfiguration]);

  // Handle refresh with performance tracking
  const handleRefresh = useCallback(async () => {
    const startTime = Date.now();
    try {
      await refresh();
      setPerformanceMetrics(prev => ({
        ...prev,
        lastRefreshDuration: Date.now() - startTime
      }));
    } catch (error) {
      console.error(`Failed to refresh widget ${widgetInfo.id}:`, error);
    }
  }, [refresh, widgetInfo.id]);

  // Render widget status indicators
  const renderStatusIndicators = () => (
    <div className="tw-flex tw-gap-2 tw-items-center">
      {/* Factory vs Legacy indicator */}
      <div title={isUsingFactory ?
        `Using Factory System - ${factoryMetadata?.dataQueryType || 'Enhanced'}` :
        'Using Legacy System'
      }>
        <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
          isUsingFactory ?
          'tw-bg-blue-100 tw-text-blue-800 tw-border tw-border-blue-200' :
          'tw-bg-gray-100 tw-text-gray-800 tw-border tw-border-gray-200'
        }`}>
          {isUsingFactory ? 'F' : 'L'}
        </span>
      </div>

      {/* Real-time connection indicator */}
      {widgetInfo.mode === 'live' && (
        <div title={realTimeConnected ? 'Real-time Connected' : 'Real-time Disconnected'}>
          <i className={`fa-light fa-signal tw-text-sm ${
            realTimeConnected ? 'tw-text-green-600' : 'tw-text-gray-400'
          }`}></i>
        </div>
      )}

      {/* Performance indicator */}
      {performanceMetrics.lastRefreshDuration && (
        <div title={`Last refresh: ${performanceMetrics.lastRefreshDuration}ms`}>
          <i className={`fa-light fa-tachometer-alt tw-text-sm ${
            performanceMetrics.lastRefreshDuration < 1000 ? 'tw-text-green-600' : 'tw-text-yellow-600'
          }`}></i>
        </div>
      )}

      {/* Error retry indicator */}
      {retryCount > 0 && (
        <div title={`Retried ${retryCount} times`}>
          <span className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-bg-yellow-100 tw-text-yellow-800 tw-border tw-border-yellow-200">
            <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
            {retryCount}
          </span>
        </div>
      )}
    </div>
  );  // Render loading state
  if (isLoading && !data) {
    return (
      <div className={`widget-instance loading ${className} tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200`}>
        <div className="tw-flex tw-justify-center tw-items-center tw-min-h-[200px] tw-p-4">
          <div className="tw-text-center">
            <LoadIndicator height={40} width={40} />
            <div className="tw-mt-3 tw-text-gray-600 tw-text-sm">
              Loading {widgetInfo.name}...
            </div>
            {isUsingFactory && (
              <div className="tw-mt-1 tw-text-blue-600 tw-text-xs">
                Using Factory System
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !data) {
    return (
      <div className={`widget-instance error ${className} tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200`}>
        {/* Header */}
        <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
          <div>
            <h6 className="tw-text-gray-900 tw-font-medium tw-text-sm">{widgetInfo.name}</h6>
            <p className="tw-text-gray-500 tw-text-xs tw-mt-1">Error in {widgetInfo.type} widget</p>
          </div>
          {renderStatusIndicators()}
        </div>

        {/* Content */}
        <div className="tw-p-4">
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-3">
            <div className="tw-flex tw-items-start">
              <div className="tw-flex-shrink-0">
                <i className="fa-light fa-exclamation-triangle tw-text-red-400"></i>
              </div>
              <div className="tw-ml-3 tw-flex-1">
                <p className="tw-text-sm tw-text-red-800">
                  {error.message || 'Failed to load widget data'}
                </p>
                {retryCount > 0 && (
                  <p className="tw-text-xs tw-text-red-600 tw-mt-1">
                    Attempted {retryCount} retries
                  </p>
                )}
              </div>
              <div className="tw-ml-auto tw-flex-shrink-0">
                <button
                  onClick={handleRefresh}
                  className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-border tw-border-transparent tw-text-xs tw-font-medium tw-rounded tw-text-red-700 tw-bg-red-100 hover:tw-bg-red-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-red-500"
                >
                  <i className="fa-light fa-refresh tw-mr-1"></i>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`widget-instance ${isEditMode ? 'edit-mode' : ''} ${className} tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-h-full tw-flex tw-flex-col tw-relative ${isLoading ? 'tw-opacity-70' : ''}`}
      style={{
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* Widget Header */}
      <div className="tw-px-4 tw-py-3 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-justify-between tw-items-start">
          <div className="tw-flex-1 tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-2">
              <h6 className="tw-text-gray-900 tw-font-medium tw-text-sm tw-truncate">
                {widgetInfo.name}
              </h6>
              {isLoading && (
                <LoadIndicator height={16} width={16} />
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
              <p className="tw-text-gray-500 tw-text-xs">
                {widgetInfo.type} • {widgetInfo.dataSource || 'No data source'}
              </p>
              {lastUpdated && (
                <p className="tw-text-gray-500 tw-text-xs">
                  • Updated {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2 tw-ml-4">
            {renderStatusIndicators()}

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-gray-600 hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
              title="Refresh widget"
            >
              <i className="fa-light fa-refresh tw-text-sm"></i>
            </button>

            {onConfigure && (
              <button
                onClick={handleConfigure}
                disabled={isConfiguring}
                className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-gray-600 hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-blue-500 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                title="Configure widget"
              >
                <i className="fa-light fa-cog tw-text-sm"></i>
              </button>
            )}

            {isEditMode && onRemove && (
              <button
                onClick={() => onRemove(widget)}
                className="tw-inline-flex tw-items-center tw-p-1 tw-border tw-border-transparent tw-text-gray-400 tw-rounded hover:tw-text-red-600 hover:tw-bg-red-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-red-500"
                title="Remove widget"
              >
                <i className="fa-light fa-times tw-text-sm"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="tw-flex-1 tw-pt-0 tw-pb-1">
        <EnhancedWidgetRenderer
          widget={widget}
          category={widgetInfo.category}
          data={data}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          onConfigChange={handleConfigure}
          isEditMode={isEditMode}
          hideHeader={true}
          factoryMetadata={factoryMetadata}
          {...otherProps}
        />
      </div>

      {/* Debug Panel (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="tw-px-4 tw-py-2 tw-border-t tw-border-gray-100 tw-text-xs tw-text-gray-500 tw-bg-gray-50">
          ID: {widgetInfo.id} |
          Factory: {isUsingFactory ? 'Yes' : 'No'} |
          Source: {performanceMetrics.source || 'Unknown'} |
          Size: {performanceMetrics.dataSize ? `${Math.round(performanceMetrics.dataSize / 1024)}KB` : 'Unknown'}
        </div>
      )}
    </div>
  );
};

DashboardWidgetInstance.propTypes = {
  widget: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    instanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customName: PropTypes.string,
    templateType: PropTypes.string,
    configurationJson: PropTypes.string,
    template: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      widgetType: PropTypes.string,
      displayName: PropTypes.string,
      category: PropTypes.string,
      dataSource: PropTypes.string
    })
  }).isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  isEditMode: PropTypes.bool,
  onRemove: PropTypes.func,
  onConfigure: PropTypes.func,
  onPositionChange: PropTypes.func,
  onSizeChange: PropTypes.func,
  enableAutoRefresh: PropTypes.bool,
  className: PropTypes.string
};

export default DashboardWidgetInstance;
