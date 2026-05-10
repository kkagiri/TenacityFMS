/**
 * DashboardLayout - Grid layout component using existing widget system
 *
 * Integrates with the existing DashboardWidgetInstance and EnhancedWidgetRenderer
 * components for proper widget rendering and management.
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Responsive, WidthProvider } from 'react-grid-layout';

// Use existing widget system
import DashboardWidgetInstance from '../../../components/dashboard/DashboardWidgetInstance';
import { QuickActionButtons } from '../../../components/dashboard/QuickActionButtons';

// Styles
import './DashboardLayout.scss';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * DashboardLayout Component
 */
const DashboardLayout = ({
  layouts,
  layoutSettings,
  isEditMode,
  widgetInstances,
  widgetData,
  widgetErrors,
  widgetLoadingStates,
  realtimeData,
  connectionStatus,
  currentUser,
  onLayoutChange,
  onEditModeToggle,
  onWidgetRefresh,
  onWidgetRemove,
  onWidgetAdd,
  onWidgetConfigure = null,
  canViewWidget,
  className = ''
}) => {
  // Local state
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);

  // Memoized grid settings
  const gridSettings = useMemo(() => ({
    className: `tw-w-full ${className}`,
    rowHeight: layoutSettings.rowHeight || 60,
    margin: layoutSettings.margin || [10, 10],
    containerPadding: layoutSettings.containerPadding || [20, 20],
    breakpoints: layoutSettings.breakpoints || { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: layoutSettings.cols || { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    compactType: layoutSettings.compactType || 'vertical',
    preventCollision: layoutSettings.preventCollision || false,
    useCSSTransforms: layoutSettings.useCSSTransforms !== false,
    resizeHandles: layoutSettings.resizeHandles || ['se'],
    isDraggable: isEditMode,
    isResizable: isEditMode,
    autoSize: true,
    measureBeforeMount: false
  }), [layoutSettings, isEditMode, className]);

  /**
   * Handle layout change events
   */
  const handleLayoutChange = useCallback((layout, layouts) => {
    if (isEditMode && onLayoutChange) {
      onLayoutChange(layout, layouts, currentBreakpoint);
    }
  }, [isEditMode, onLayoutChange, currentBreakpoint]);

  /**
   * Handle breakpoint change
   */
  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((layout, oldItem, newItem, placeholder, e, element) => {
    setIsDragging(true);
    setDraggedWidget(oldItem.i);
  }, []);

  /**
   * Handle drag stop
   */
  const handleDragStop = useCallback((layout, oldItem, newItem, placeholder, e, element) => {
    setIsDragging(false);
    setDraggedWidget(null);
  }, []);

  /**
   * Render individual widget using existing DashboardWidgetInstance
   */
  const renderWidget = useCallback((widgetInstance, widgetData, error, isLoading) => {
    const widgetId = widgetInstance.id || widgetInstance.instanceId;

    return (
      <DashboardWidgetInstance
        key={widgetId}
        widget={widgetInstance}
        isEditMode={isEditMode}
        onRemove={onWidgetRemove}
        onConfigure={onWidgetConfigure}
        enableAutoRefresh={!isEditMode}
        className="dashboard-widget-item"
      />
    );
  }, [isEditMode, onWidgetRemove, onWidgetConfigure]);

  /**
   * Get current layout for grid
   */
  const getCurrentLayout = useCallback(() => {
    if (!layouts || !layouts[currentBreakpoint]) {
      return [];
    }
    return layouts[currentBreakpoint];
  }, [layouts, currentBreakpoint]);

  /**
   * Generate grid items from current layout
   */
  const generateGridItems = useCallback(() => {
    const currentLayout = getCurrentLayout();

    return currentLayout.map((item) => (
      <div
        key={item.i}
        className={`
          dashboard-widget-item
          ${isEditMode ? 'dashboard-widget-item--editable' : ''}
          ${isDragging && draggedWidget === item.i ? 'dashboard-widget-item--dragging' : ''}
        `}
        data-grid={item}
      >
        {renderWidget(item.i)}
      </div>
    ));
  }, [getCurrentLayout, renderWidget, isEditMode, isDragging, draggedWidget]);

  // Edit mode toolbar
  const EditModeToolbar = () => (
    <div className="dashboard-edit-toolbar tw-fixed tw-top-4 tw-right-4 tw-z-50 tw-bg-white tw-shadow-lg tw-rounded-lg tw-p-4 tw-flex tw-items-center tw-gap-3">
      <span className="tw-text-sm tw-font-medium tw-text-gray-700">
        <i className="fa-light fa-edit tw-mr-2"></i>
        Edit Mode
      </span>

      <button
        onClick={() => onWidgetAdd && onWidgetAdd()}
        className="tw-bg-blue-500 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-text-sm hover:tw-bg-blue-600 tw-transition-colors"
        title="Add Widget"
      >
        <i className="fa-light fa-plus tw-mr-1"></i>
        Add Widget
      </button>

      <button
        onClick={() => onEditModeToggle && onEditModeToggle(false)}
        className="tw-bg-green-500 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-text-sm hover:tw-bg-green-600 tw-transition-colors"
        title="Save Changes"
      >
        <i className="fa-light fa-check tw-mr-1"></i>
        Done
      </button>

      <button
        onClick={() => onEditModeToggle && onEditModeToggle(false)}
        className="tw-bg-gray-500 tw-text-white tw-px-3 tw-py-1 tw-rounded tw-text-sm hover:tw-bg-gray-600 tw-transition-colors"
        title="Cancel Changes"
      >
        <i className="fa-light fa-times tw-mr-1"></i>
        Cancel
      </button>
    </div>
  );

  // Connection status indicator
  const ConnectionStatusIndicator = () => (
    <div className={`
      dashboard-connection-status
      tw-fixed tw-bottom-4 tw-right-4 tw-z-40
      tw-px-3 tw-py-2 tw-rounded-full tw-text-sm tw-font-medium
      tw-transition-all tw-duration-300
      ${connectionStatus === 'connected'
        ? 'tw-bg-green-100 tw-text-green-800 tw-border tw-border-green-200'
        : connectionStatus === 'connecting'
        ? 'tw-bg-yellow-100 tw-text-yellow-800 tw-border tw-border-yellow-200'
        : 'tw-bg-red-100 tw-text-red-800 tw-border tw-border-red-200'
      }
    `}>
      <i className={`
        fa-light tw-mr-2
        ${connectionStatus === 'connected'
          ? 'fa-wifi'
          : connectionStatus === 'connecting'
          ? 'fa-spinner fa-spin'
          : 'fa-wifi-slash'
        }
      `}></i>
      {connectionStatus === 'connected' ? 'Live' :
       connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
    </div>
  );

  return (
    <div className={`dashboard-layout ${isEditMode ? 'dashboard-layout--edit-mode' : ''}`}>
      {/* Edit Mode Toolbar */}
      {isEditMode && <EditModeToolbar />}

      {/* Connection Status */}
      <ConnectionStatusIndicator />

      {/* Main Grid Layout */}
      <div className="dashboard-grid-container tw-relative tw-min-h-screen">
        <ResponsiveGridLayout
          {...gridSettings}
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
        >
          {generateGridItems()}
        </ResponsiveGridLayout>
      </div>

      {/* Loading overlay for layout changes */}
            {/* Loading overlay for grid operations */}
      {isDragging && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-10 tw-z-40 tw-pointer-events-none">
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
            <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4">
              <div className="tw-flex tw-items-center tw-space-x-3">
                <div className="tw-animate-spin tw-rounded-full tw-h-5 tw-w-5 tw-border-b-2 tw-border-blue-600"></div>
                <span className="tw-text-gray-700">Rearranging layout...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DashboardLayout.propTypes = {
  layouts: PropTypes.object,
  layoutSettings: PropTypes.object,
  isEditMode: PropTypes.bool,
  widgetInstances: PropTypes.array,
  widgetData: PropTypes.object,
  widgetErrors: PropTypes.object,
  widgetLoadingStates: PropTypes.object,
  realtimeData: PropTypes.object,
  connectionStatus: PropTypes.string,
  currentUser: PropTypes.object,
  onLayoutChange: PropTypes.func,
  onEditModeToggle: PropTypes.func,
  onWidgetRefresh: PropTypes.func,
  onWidgetRemove: PropTypes.func,
  onWidgetAdd: PropTypes.func,
  canViewWidget: PropTypes.func,
  className: PropTypes.string
};

DashboardLayout.defaultProps = {
  layouts: {},
  layoutSettings: {},
  isEditMode: false,
  widgetInstances: [],
  widgetData: {},
  widgetErrors: {},
  widgetLoadingStates: {},
  realtimeData: {},
  connectionStatus: 'disconnected',
  currentUser: null,
  onLayoutChange: () => {},
  onEditModeToggle: () => {},
  onWidgetRefresh: () => {},
  onWidgetRemove: () => {},
  onWidgetAdd: () => {},
  canViewWidget: () => true,
  className: ''
};

export default DashboardLayout;