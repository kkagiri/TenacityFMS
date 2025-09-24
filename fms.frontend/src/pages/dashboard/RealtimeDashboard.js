/**
 * RealtimeDashboard - Integrated with existing widget system
 *
 * Uses the existing DashboardWidgetInstance, EnhancedWidgetRenderer, and modal components
 * while maintaining the new service architecture for data management.
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
import { QuickActionButtons } from '../../components/dashboard/QuickActionButtons';
import CategoryGroupedWidgetRenderer from '../../components/dashboard/CategoryGroupedWidgetRenderer';

// Use new header component
import DashboardHeader from './components/DashboardHeader';

// Styles
import './RealtimeDashboard.scss';
// (Grid layout removed: using only category grouped layout)

/**
 * RealtimeDashboard Component
 */
const RealtimeDashboard = () => {
  const { hasPermission } = usePermissions();

  // Redux state
  const currentUser = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);


  // Local state for modals and UI
  const [showWidgetModal, setShowWidgetModal] = useState(false); // legacy widget add (template style)
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false); // widget config modal

  // Legacy / enhanced stats + filters state placeholders (can be wired later)
  // Removed Key Statistics state (stats, metric filters, sites) as feature deprecated

  // Role presentation (fallback mapping)
  const primaryRole = currentUser?.role || currentUser?.primaryRole || 'User';
  const roleConfig = useMemo(() => {
    return {
      name: primaryRole,
      color: '#2563eb',
      permissions: currentUser?.permissions || []
    };
  }, [primaryRole, currentUser]);

  // NOTE: serviceFactory has no global initialize lifecycle; services are lazy-instantiated on first get* call.
  // The previous call to serviceFactory.initialize() caused a runtime TypeError. Removed.

  // Main dashboard hook
  const {
  widgetInstances,
  instancesLoading,
  isEditMode,
  connectionStatus,
  connectionInfo,
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

  // --- Helper & legacy compatibility functions ---
  // Removed previousDayTotals & updateMetricFilter (Key Statistics removed)


  const testWidgetDataRequest = useCallback(async (id) => {
    try {
      const dashboardSvc = serviceFactory.getDashboardService();
      const res = await dashboardSvc.getWidgetData(Number(id));
      console.log('[Debug] Test widget data response:', res);
      notify('Widget data fetched. Check console.', 'success', 2000);
    } catch (e) {
      console.error('[Debug] Test widget data error:', e);
      notify('Failed to fetch widget data', 'error', 3000);
    }
  }, []);

  // Permission check for dashboard access
  useEffect(() => {
    if (isAuthenticated && !hasPermission('_view_dashboard')) {
      notify('Access denied: You do not have permission to view the dashboard', 'error', 5000);
      return;
    }
  }, [isAuthenticated, hasPermission]);

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

  /**
   * Global refresh handler
   */
  const handleGlobalRefresh = useCallback(async () => {
    try {
  await loadWidgetInstances();
      notify('Dashboard refreshed', 'success', 1500);
    } catch (e) {
      console.error('[RealtimeDashboard] Refresh failed:', e);
      notify('Failed to refresh dashboard', 'error', 3000);
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

  if (!hasPermission('_view_dashboard')) {
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
  <div className="realtime-dashboard tw-space-y-6 force-light-theme">
      {/* Connection Status Indicator (legacy restored) */}
      <div className={`connection-status-bar tw-flex tw-items-center tw-gap-2 tw-text-sm tw-rounded tw-px-3 tw-py-2 tw-w-fit ${
        connectionStatus === 'connected' ? 'tw-bg-green-50 tw-text-green-700' : connectionStatus === 'error' ? 'tw-bg-red-50 tw-text-red-700' : 'tw-bg-yellow-50 tw-text-yellow-700'
      }`}>
        <i className={`fa-solid fa-${connectionStatus === 'connected' ? 'wifi' : connectionStatus === 'error' ? 'triangle-exclamation' : 'wifi-slash'}`}></i>
        <span className="tw-font-medium">
          {connectionStatus === 'connected' ? 'Live Updates Active' : connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
        </span>
        {connectionInfo?.connectionId && (
          <span className="tw-text-xs tw-opacity-70">ID: {connectionInfo.connectionId.substring(0, 8)}...</span>
        )}
      </div>

      {/* Dashboard Header (refactored) */}
      <DashboardHeader
        title="Real-time Dashboard"
        subtitle={`Welcome back, ${currentUser?.firstName || 'User'}`}
        connectionStatus={connectionStatus}
        connectionInfo={connectionInfo}
        isEditMode={isEditMode}
        onEditModeToggle={handleEditModeToggle}
        onRefresh={handleGlobalRefresh}
        onSettings={() => console.log('Settings clicked - not implemented yet')}
        onWidgetAdd={() => setWidgetConfigOpen(true)}
        showEditControls={hasPermission('_edit_dashboard')}
        className="tw-mb-2"
      />

      {/* Role Badge */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded tw-bg-blue-50 tw-text-blue-700 tw-px-3 tw-py-1">
          <i className="fa-solid fa-user"></i>
          <span>{roleConfig.name}</span>
          {currentUser?.userName && <span className="tw-text-xs tw-opacity-70">({currentUser.userName})</span>}
        </div>
      </div>

      {/* Debug Test Section (keep for now, can hide in prod) */}
      <div className="tw-border tw-border-gray-200 tw-rounded tw-p-3 tw-bg-gray-50 tw-text-[12px]">
        <strong>Debug Test Controls:</strong>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
          <input id="testWidgetId" type="number" placeholder="Widget ID" className="tw-border tw-rounded tw-text-xs tw-px-2 tw-py-1 tw-w-24" />
          <button
            onClick={() => {
              const v = document.getElementById('testWidgetId').value;
              v ? testWidgetDataRequest(v) : alert('Enter ID');
            }}
            className="tw-bg-blue-600 tw-text-white tw-text-xs tw-rounded tw-px-3 tw-py-1 hover:tw-bg-blue-700"
          >Test Widget Request</button>
          <span className="tw-text-gray-500">Check console for results</span>
        </div>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-[11px] tw-text-gray-600">Quick Tests:</span>
          {[16,17,18].map(id => (
            <button key={id} onClick={() => testWidgetDataRequest(id)} className="tw-bg-red-600 tw-text-white tw-text-[10px] tw-rounded tw-px-2 tw-py-0.5 hover:tw-bg-red-700">Test {id}</button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {canViewWidget('quickActions') && (
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-p-3">
          <QuickActionButtons role={primaryRole} userPermissions={roleConfig.permissions} />
        </div>
      )}


      {/* Main Dashboard Grid (refactored widgets) */}
      <div className="dashboard-main-grid">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <h2 className="tw-text-lg tw-font-semibold tw-flex tw-items-center tw-gap-2">
            <i className="fa-solid fa-cubes"></i>
            Enhanced Widgets (Category Layout)
            {instancesLoading && <span className="tw-text-sm tw-text-gray-500">(Loading...)</span>}
          </h2>
          <div className="tw-flex tw-gap-2">
            <Button
              text={isEditMode ? 'Done Editing' : 'Edit Layout'}
              height={32}
              stylingMode="contained"
              type={isEditMode ? 'default' : 'normal'}
              onClick={() => handleEditModeToggle(!isEditMode)}
            />
            <Button
              text="Add Widget"
              height={32}
              stylingMode="contained"
              type="default"
              onClick={() => setWidgetConfigOpen(true)}
            />
          </div>
        </div>
        <div className="tw-w-full">
          <CategoryGroupedWidgetRenderer
            widgets={widgetInstances.filter(w => canViewWidget(w))}
            widgetData={widgetData}
            isLoading={widgetLoadingStates}
            errors={widgetErrors}
            widgetStaleness={widgetStaleness}
            isEditMode={isEditMode}
            onEditModeComplete={(layoutData) => {
              console.log('[RealtimeDashboard] Category layout saved', layoutData);
              setIsEditMode(false);
            }}
          />
        </div>

        {widgetInstances.length === 0 && !instancesLoading && (
          <div className="tw-text-center tw-py-12">
            <div className="tw-max-w-md tw-mx-auto">
              <i className="fa-light fa-puzzle-piece tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
              <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">No widgets configured</h3>
              <p className="tw-text-gray-500 tw-mb-6">Add widgets to customize your dashboard experience</p>
              <QuickActionButtons role={currentUser?.role || 'user'} userPermissions={currentUser?.permissions || []} />
            </div>
          </div>
        )}
      </div>

      {/* Legacy simple widget add modal */}
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

  {/* Key Statistics visibility modal removed */}

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
