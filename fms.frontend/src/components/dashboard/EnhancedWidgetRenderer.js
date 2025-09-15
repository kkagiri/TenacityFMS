/**
 * Enhanced Widget Renderer Component
 * Handles all widget type rendering with factory pattern support
 * Provides intelligent content adaptation and performance optimization
 */
import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
// DevExtreme UI Components
import { LoadIndicator } from 'devextreme-react/load-indicator';


// Import existing widget components
import AlertWidget from './widgets/AlertWidget';
import BarChartWidget from './widgets/BarChartWidget';
import BigStatCardWidget from './widgets/BigStatCardWidget';
import DataTableWidget from './widgets/DataTableWidget';
import LineChartWidget from './widgets/LineChartWidget';
import PieChartWidget from './widgets/PieChartWidget';
import ProgressListWidget from './widgets/ProgressListWidget';
import TickerWidget from './widgets/TickerWidget';

// Widget type mapping with factory enhancements
const WIDGET_TYPE_MAP = {
  // Chart widgets
  'barchart': BarChartWidget,
  'bar-chart': BarChartWidget,
  'bar_chart': BarChartWidget,
  'BarChart': BarChartWidget,
  'CHART_BAR_COMPARISON': BarChartWidget,
  'chart_bar_comparison': BarChartWidget,
  'chart': BarChartWidget,

  'linechart': LineChartWidget,
  'line-chart': LineChartWidget,
  'line_chart': LineChartWidget,
  'LineChart': LineChartWidget,
  'CHART_LINE_TREND': LineChartWidget,
  'chart_line_trend': LineChartWidget,
  'graph': LineChartWidget,

  'piechart': PieChartWidget,
  'pie-chart': PieChartWidget,
  'pie_chart': PieChartWidget,
  'PieChart': PieChartWidget,
  'CHART_PIE_DISTRIBUTION': PieChartWidget,
  'chart_pie_distribution': PieChartWidget,

  // Data display widgets
  'datatable': DataTableWidget,
  'data-table': DataTableWidget,
  'data_table': DataTableWidget,
  'DataTable': DataTableWidget,
  'DATA_TABLE_DETAILED': DataTableWidget,
  'data_table_detailed': DataTableWidget,
  'table': DataTableWidget,

  'bigstat': BigStatCardWidget,
  'big-stat': BigStatCardWidget,
  'big_stat': BigStatCardWidget,
  'BigStat': BigStatCardWidget,
  'BIG_STAT_CARD': BigStatCardWidget,
  'big_stat_card': BigStatCardWidget,
  'stat': BigStatCardWidget,
  'statcard': BigStatCardWidget,
  'gauge': BigStatCardWidget,
  'gauge_chart': BigStatCardWidget,

  // Interactive widgets
  'progresslist': ProgressListWidget,
  'progress-list': ProgressListWidget,
  'progress_list': ProgressListWidget,
  'ProgressList': ProgressListWidget,
  'PROGRESS_LIST': ProgressListWidget,
  'progress': ProgressListWidget,

  'ticker': TickerWidget,
  'Ticker': TickerWidget,
  'TICKER': TickerWidget,
  'key_stat_ticker': TickerWidget,
  'scroll': TickerWidget,
  'marquee': TickerWidget,

  // Alert widgets
  'alert': AlertWidget,
  'Alert': AlertWidget,
  'ALERT_NOTIFICATION': AlertWidget,
  'alert_notification': AlertWidget,
  'alarm': AlertWidget,
  'notification': AlertWidget
};

/**
 * Enhanced Widget Renderer
 * Intelligently renders widgets based on type, data, and factory metadata
 */
const EnhancedWidgetRenderer = memo(({
  widget,
  category = 'general',
  data = null,
  isLoading = false,
  error = null,
  onRefresh = null,
  onConfigChange = null,
  isEditMode = false,
  hideHeader = false,
  factoryMetadata = null,
  className = '',
  ...otherProps
}) => {
  // Parse widget configuration
  const widgetConfig = useMemo(() => {
    try {
      const config = widget.configurationJson ? JSON.parse(widget.configurationJson) : {};
      const template = widget.template || {};

      return {
        ...config,
        id: widget.id,
        instanceId: widget.instanceId,
        name: widget.customName || template.displayName || config.title || `Widget ${widget.id}`,
        // Prioritize widget's actual type over template type for custom widgets
        type: widget.widgetType || widget.templateType || template.widgetType || config.type || config.visualizationType || 'unknown',
        dataSource: widget.dataSource || template.dataSource || config.dataSource,
        category: widget.category || template.category || config.category || category,
        mode: config.mode || 'cumulative',
        timeRange: config.timeRange || 'yesterday',
        refreshInterval: config.refreshInterval || 30000,
        isCustomWidget: widget.isCustomWidget || false,
        ...template // Include all template properties
      };
    } catch (error) {
      console.warn(`Failed to parse widget configuration for widget ${widget.id}:`, error);
      return {
        id: widget.id,
        name: `Widget ${widget.id}`,
        type: widget.widgetType || 'unknown',
        category: widget.category || 'general',
        mode: 'cumulative',
        isCustomWidget: widget.isCustomWidget || false
      };
    }
  }, [widget, category]);

  // Enhanced data transformation for factory compatibility
  const transformedData = useMemo(() => {
    if (!data) return null;

    // If factory metadata is available, use enhanced data structure
    if (factoryMetadata) {
      return {
        ...data,
        metadata: factoryMetadata,
        isFactoryData: true,
        transformationApplied: factoryMetadata.dataTransformationType || 'none',
        sourceInfo: {
          dataSource: factoryMetadata.dataSource,
          queryType: factoryMetadata.dataQueryType,
          processingTime: factoryMetadata.processingTimeMs
        }
      };
    }

    // Legacy data structure - enhance for backward compatibility
    return {
      ...data,
      isFactoryData: false,
      sourceInfo: {
        dataSource: widgetConfig.dataSource || 'legacy',
        queryType: 'legacy',
        processingTime: null
      }
    };
  }, [data, factoryMetadata, widgetConfig.dataSource]);

  // Determine widget component to render
  const WidgetComponent = useMemo(() => {
    const normalizedType = (widgetConfig.type || '').toString().trim();

    // Try exact match first
    let Component = WIDGET_TYPE_MAP[normalizedType];

    // Try partial matches if exact match fails
    if (!Component) {
      const typeKeys = Object.keys(WIDGET_TYPE_MAP);
      const partialMatch = typeKeys.find(key =>
        normalizedType.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(normalizedType.toLowerCase())
      );

      if (partialMatch) {
        Component = WIDGET_TYPE_MAP[partialMatch];
      }
    }

    return Component;
  }, [widgetConfig.type]);

  // Handle unknown widget types
  const renderUnknownWidget = useCallback(() => (
    <div className="widget-renderer-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '150px',
      padding: '16px',
      textAlign: 'center'
    }}>
      <i className="fa-light fa-puzzle-piece" style={{ fontSize: '2rem', color: '#999', marginBottom: '12px' }}></i>
      <h6 style={{ color: '#666', marginBottom: '8px', fontSize: '1.1rem' }}>
        Unknown Widget Type
      </h6>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '8px' }}>
        Type: "{widgetConfig.type}"
      </p>
      <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
        Available types: {Object.keys(WIDGET_TYPE_MAP).slice(0, 10).join(', ')}...
      </small>
      {isEditMode && onConfigChange && (
        <small style={{ color: '#007bff', display: 'block', marginTop: '8px' }}>
          <i className="fa-light fa-cog"></i> Click settings to configure widget type
        </small>
      )}
    </div>
  ), [widgetConfig.type, isEditMode, onConfigChange]);

  // Handle loading state with intelligent skeletons
  const renderLoadingSkeleton = useCallback(() => {
    const skeletonType = widgetConfig.type?.toLowerCase();

    if (skeletonType?.includes('chart')) {
      return (
        <div style={{ padding: '16px' }}>
          <div style={{
            width: '60%',
            height: '20px',
            backgroundColor: '#f0f0f0',
            marginBottom: '16px',
            borderRadius: '4px'
          }}></div>
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LoadIndicator height={40} width={40} />
          </div>
        </div>
      );
    }

    if (skeletonType?.includes('table')) {
      return (
        <div style={{ padding: '16px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              width: '100%',
              height: '32px',
              backgroundColor: '#f0f0f0',
              marginBottom: '8px',
              borderRadius: '4px'
            }}></div>
          ))}
        </div>
      );
    }

    if (skeletonType?.includes('stat') || skeletonType?.includes('big')) {
      return (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{
            width: '40%',
            height: '16px',
            backgroundColor: '#f0f0f0',
            margin: '0 auto 8px auto',
            borderRadius: '4px'
          }}></div>
          <div style={{
            width: '80%',
            height: '48px',
            backgroundColor: '#f0f0f0',
            margin: '0 auto',
            borderRadius: '4px'
          }}></div>
        </div>
      );
    }

    // Default skeleton
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          width: '60%',
          height: '20px',
          backgroundColor: '#f0f0f0',
          marginBottom: '16px',
          borderRadius: '4px'
        }}></div>
        <div style={{
          width: '100%',
          height: '120px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <LoadIndicator height={30} width={30} />
        </div>
      </div>
    );
  }, [widgetConfig.type]);

  // Render error state
  if (error && !transformedData) {
    return (
      <div className={`widget-renderer error ${className}`} style={{ padding: '16px' }}>
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <i className="fa-light fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          <span style={{ fontSize: '0.9rem' }}>
            {error.message || 'Widget failed to load'}
          </span>
          {factoryMetadata?.errorDetails && (
            <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>
              {factoryMetadata.errorDetails}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading && !transformedData) {
    return (
      <div className={`widget-renderer loading ${className}`}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  // Render unknown widget type
  if (!WidgetComponent) {
    return (
      <div className={`widget-renderer unknown ${className}`}>
        {renderUnknownWidget()}
      </div>
    );
  }

  // Prepare props for widget component
  const widgetProps = {
    // Core widget data
    widget: widgetConfig,
    data: transformedData,

    // State props
    isLoading,
    error,

    // Configuration props
    hideHeader,
    isEditMode,

    // Callback props
    onRefresh,
    onConfigChange,

    // Factory enhancements
    factoryMetadata,
    isFactoryData: !!factoryMetadata,

    // Additional configuration from widget config
    title: widgetConfig.name,
    category: widgetConfig.category,
    mode: widgetConfig.mode,
    timeRange: widgetConfig.timeRange,
    dataSource: widgetConfig.dataSource,

    // Pass through any additional props
    ...otherProps
  };

  // Render the widget component
  return (
    <div
      className={`widget-renderer ${widgetConfig.type} ${className}`}
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <WidgetComponent {...widgetProps} />

      {/* Factory enhancement indicator (development only) */}
      {process.env.NODE_ENV === 'development' && factoryMetadata && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#007bff',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.625rem',
            fontWeight: 'bold',
            opacity: 0.8,
            zIndex: 1000
          }}
        >
          <i className="fa-light fa-magic" style={{ marginRight: '2px' }}></i>F+
        </div>
      )}
    </div>
  );
});

EnhancedWidgetRenderer.displayName = 'EnhancedWidgetRenderer';

EnhancedWidgetRenderer.propTypes = {
  widget: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    instanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customName: PropTypes.string,
    templateType: PropTypes.string,
    configurationJson: PropTypes.string,
    template: PropTypes.object
  }).isRequired,
  category: PropTypes.string,
  data: PropTypes.any,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onRefresh: PropTypes.func,
  onConfigChange: PropTypes.func,
  isEditMode: PropTypes.bool,
  hideHeader: PropTypes.bool,
  factoryMetadata: PropTypes.shape({
    dataSource: PropTypes.string,
    dataQueryType: PropTypes.string,
    dataTransformationType: PropTypes.string,
    processingTimeMs: PropTypes.number,
    errorDetails: PropTypes.string
  }),
  className: PropTypes.string
};

export default EnhancedWidgetRenderer;
