/**
 * RealtimeDashboard - Integrated with existing widget system
 *
 * Uses the existing DashboardWidgetInstance, EnhancedWidgetRenderer, and modal components
 * while maintaining the new service architecture for data management.
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';

// Hooks and services
import { useRealtimeDashboard } from '../../hooks/useRealtimeDashboard';
import { usePermissions } from '../../hooks/usePermissions';
import serviceFactory from '../../services/core/ServiceFactory';

// Use existing components instead of new ones
import CustomWidgetDialog from '../../components/dashboard/ModalPopup/CustomWidgetDialog';
import WidgetConfigModal from '../../components/dashboard/ModalPopup/WidgetConfigModal';
import Button from 'devextreme-react/button';
import CategoryGroupedWidgetRenderer from '../../components/dashboard/CategoryGroupedWidgetRenderer';

// Styles
import './RealtimeDashboard.scss';
// (Grid layout removed: using only category grouped layout)

/**
 * RealtimeDashboard Component
 */
const RealtimeDashboard = () => {
  const { hasPermission, permissionsLoaded } = usePermissions();

  // Redux state
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // Local state for modals and UI
  const [showWidgetModal, setShowWidgetModal] = useState(false); // legacy widget add (template style)
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false); // widget config modal
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [layoutSaveRequestVersion, setLayoutSaveRequestVersion] = useState(0);
  const actionsMenuRef = useRef(null);

  // NOTE: serviceFactory has no global initialize lifecycle; services are lazy-instantiated on first get* call.
  // The previous call to serviceFactory.initialize() caused a runtime TypeError. Removed.

  // Main dashboard hook
  const {
    widgetInstances,
    instancesLoading,
    isEditMode,
    widgetData,
    widgetErrors,
    widgetLoadingStates,
    widgetStaleness,
    loadWidgetInstances,
    setIsEditMode,
    canViewWidget
  } = useRealtimeDashboard({
    enableRealtime: true,
    refreshInterval: 30000,
    autoLoad: true
  });

  // Permission check for dashboard access (only after permissions are loaded)
  useEffect(() => {
    if (isAuthenticated && permissionsLoaded && !hasPermission('_View_Dashboard')) {
      notify('Access denied: You do not have permission to view the dashboard', 'error', 5000);
    }
  }, [isAuthenticated, permissionsLoaded, hasPermission]);

  /**
   * Handle layout changes from grid
   */
  // (Removed grid layout change handler)

  /**
   * Handle edit mode toggle
   */
  const handleEditModeToggle = useCallback(async (enabled) => {
    // CategoryGroupedWidgetRenderer has explicit Save Changes button; toggle just sets mode
    setIsEditMode(enabled);
  }, [setIsEditMode]);

  const handleOpenWidgetManager = useCallback(() => {
    setActionsMenuOpen(false);
    setWidgetConfigOpen(true);
  }, []);

  const handleStartLayoutEdit = useCallback(() => {
    setActionsMenuOpen(false);
    handleEditModeToggle(true);
  }, [handleEditModeToggle]);

  const handleSaveLayout = useCallback(() => {
    setLayoutSaveRequestVersion(previous => previous + 1);
  }, []);

  useEffect(() => {
    if (!actionsMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [actionsMenuOpen]);

  // (Removed legacy handleWidgetAdd - using header onWidgetAdd -> widgetConfigOpen)

  /**
   * Handle widget removal
   */
  // (Widget remove handler removed with grid layout; category view currently has no direct remove control)

  /**
   * Handle widget configuration from legacy simple modal
   */
  const handleWidgetModalSubmit = useCallback(async (widgetConfigData) => {
    try {
      const dashboardSvc = serviceFactory.getDashboardService();
      const result = await dashboardSvc.createWidgetInstance(widgetConfigData);
      if (result.success) {
        await loadWidgetInstances();
        setShowWidgetModal(false);
        notify('Widget added successfully', 'success', 2000);
      } else {
        throw new Error(result.message || 'Failed to create widget');
      }
    } catch (error) {
      console.error('[RealtimeDashboard] Error creating widget:', error);
      notify('Failed to add widget', 'error', 3000);
    }
  }, [loadWidgetInstances]);

  // Authentication & permission gating
  if (!isAuthenticated) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen">
        <div className="tw-text-center tw-text-gray-500 tw-text-lg">Please sign in to access the dashboard</div>
      </div>
    );
  }

  if (!permissionsLoaded) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen">
        <div className="tw-text-center">
          <div className="tw-animate-spin tw-rounded-full tw-h-10 tw-w-10 tw-border-b-2 tw-border-blue-600 tw-mx-auto tw-mb-4"></div>
          <p className="tw-text-gray-500">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('_View_Dashboard')) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-screen">
        <div className="tw-text-center tw-text-red-600">
          <i className="fa-light fa-lock tw-text-4xl tw-mb-4"></i>
          <h2 className="tw-text-xl tw-font-semibold tw-mb-2">Access Denied</h2>
          <p className="tw-text-gray-600">You do not have permission to view this dashboard</p>
        </div>
      </div>
    );
  }

  // Main return
  return (
    <div className="realtime-dashboard-container">
      {/* Dashboard Header with Controls */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <i className="fa-solid fa-gauge-high"></i>
          <span className="dashboard-title-text">Hyoung FMS Real-time Dashboard</span>
        </h1>

        {/* Header Controls - Right Side */}
        <div className="dashboard-header-controls">
          {isEditMode && (
            <button
              type="button"
              className="dashboard-save-btn"
              onClick={handleSaveLayout}
            >
              Save layout
            </button>
          )}

          <div className="dashboard-actions-menu" ref={actionsMenuRef}>
            <button
              type="button"
              className="dashboard-meatball-btn"
              aria-label="Dashboard actions"
              aria-expanded={actionsMenuOpen}
              onClick={() => setActionsMenuOpen(previous => !previous)}
            >
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>

            {actionsMenuOpen && (
              <div className="dashboard-actions-menu__panel">
                {!isEditMode && (
                  <button
                    type="button"
                    className="dashboard-actions-menu__item"
                    onClick={handleStartLayoutEdit}
                  >
                    Edit layout
                  </button>
                )}
                <button
                  type="button"
                  className="dashboard-actions-menu__item"
                  onClick={handleOpenWidgetManager}
                >
                  Edit widgets
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Widgets Section */}
      <div className="enhanced-widgets-section">
        {widgetInstances && widgetInstances.length > 0 ? (
          <CategoryGroupedWidgetRenderer
            widgets={widgetInstances.filter(w => canViewWidget(w))}
            widgetData={widgetData}
            isLoading={widgetLoadingStates}
            errors={widgetErrors}
            widgetStaleness={widgetStaleness}
            isEditMode={isEditMode}
            saveRequestVersion={layoutSaveRequestVersion}
            onEditModeComplete={(layoutData) => {
              console.log('[RealtimeDashboard] Category layout saved', layoutData);
              setIsEditMode(false);
            }}
          />
        ) : (
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-8 tw-text-center">
            <i className="fa-solid fa-cube tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No Enhanced Widgets</h3>
            <p className="tw-text-gray-600 tw-mb-4">
              Create your first enhanced widget to get started with the new dashboard experience.
            </p>
            <Button
              text="Add Widget"
              icon="fa-solid fa-plus"
              type="default"
              stylingMode="contained"
              height={36}
              onClick={() => setWidgetConfigOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Configuration Modals */}
      {showWidgetModal && (
        <CustomWidgetDialog
          visible={showWidgetModal}
          onHiding={() => setShowWidgetModal(false)}
          onWidgetAdd={handleWidgetModalSubmit}
          currentWidgets={widgetInstances}
        />
      )}

      {/* Enhanced widget configuration modal */}
      {widgetConfigOpen && (
        <WidgetConfigModal
          open={widgetConfigOpen}
          onClose={() => setWidgetConfigOpen(false)}
          onWidgetAdded={async () => { await loadWidgetInstances(); }}
          onWidgetUpdated={async () => { await loadWidgetInstances(); }}
          onWidgetDeleted={async () => { await loadWidgetInstances(); }}
        />
      )}

      {/* Loading overlay */}
      {instancesLoading && (
        <div className="tw-fixed tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-text-center">
            <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-blue-600 tw-mx-auto tw-mb-4"></div>
            <p className="tw-text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeDashboard;
