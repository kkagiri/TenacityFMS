/**
 * File: useModuleDashboard.js
 * Purpose: Custom hook for module-scoped dashboards reusing the main dashboard widget infrastructure.
 * Dependencies: useRealtimeDashboard, DashboardService (via ServiceFactory)
 * Last Modified: 2026-03-20
 *
 * Key Functions:
 * - Loads widget instances filtered by moduleId categories
 * - Auto-seeds default widgets when a module has none
 * - Delegates data fetching, real-time updates, and layout to useRealtimeDashboard
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRealtimeDashboard } from './useRealtimeDashboard';
import serviceFactory from '../services/core/ServiceFactory';
import { MODULE_DEFAULT_WIDGETS, MODULE_CATEGORY_MAP } from '../config/moduleDefaultWidgets';

/**
 * Hook providing module-scoped dashboard state by wrapping useRealtimeDashboard
 * and filtering widget instances to the target module.
 *
 * @param {object} options
 * @param {string} options.moduleId - Module identifier (e.g. 'vehicle', 'issue_tracker')
 * @param {boolean} [options.enableRealtime=false] - Enable SignalR real-time updates
 * @param {number} [options.refreshInterval=60000] - Refresh interval in ms
 * @param {boolean} [options.autoSeedDefaults=true] - Auto-create default widgets if none exist
 * @returns {object} Module dashboard state and actions
 */
export function useModuleDashboard({
  moduleId,
  enableRealtime = false,
  refreshInterval = 60000,
  autoSeedDefaults = true
} = {}) {
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState(null);
  const seededRef = useRef(false);

  // Get categories that belong to this module
  const moduleCategories = useMemo(
    () => MODULE_CATEGORY_MAP[moduleId] || [moduleId],
    [moduleId]
  );

  // Delegate to the main dashboard hook
  const dashboard = useRealtimeDashboard({
    enableRealtime,
    refreshInterval,
    autoLoad: true
  });

  const {
    widgetInstances: allWidgets,
    instancesLoading,
    widgetData,
    widgetErrors,
    widgetLoadingStates,
    widgetStaleness,
    isEditMode,
    layoutSettings,
    loadWidgetInstances,
    setIsEditMode,
    handleLayoutSettingsChange,
    canViewWidget
  } = dashboard;

  // Filter widgets to this module's categories
  const moduleWidgets = useMemo(() => {
    if (!allWidgets || !allWidgets.length) return [];
    return allWidgets.filter(widget => {
      const category = (widget.category || '').toLowerCase();
      const dataSource = (widget.dataSource || widget.settings?.dataSource || '').toLowerCase();
      return moduleCategories.some(cat => {
        const catLower = cat.toLowerCase();
        return category === catLower || category.startsWith(catLower) || dataSource.startsWith(catLower);
      });
    });
  }, [allWidgets, moduleCategories]);

  // Auto-seed default widgets when module has none
  const seedDefaultWidgets = useCallback(async () => {
    if (seededRef.current || !autoSeedDefaults) return;
    if (!MODULE_DEFAULT_WIDGETS[moduleId]) return;

    const defaults = MODULE_DEFAULT_WIDGETS[moduleId];
    if (!defaults || defaults.length === 0) return;

    seededRef.current = true;
    setSeeding(true);
    setSeedError(null);

    try {
      const dashboardSvc = serviceFactory.getDashboardService();
      for (const widgetConfig of defaults) {
        await dashboardSvc.createWidgetInstance({
          ...widgetConfig,
          customName: widgetConfig.name || widgetConfig.customName,
          widgetType: widgetConfig.widgetType,
          category: widgetConfig.category,
          dataSource: widgetConfig.dataSource,
          settings: widgetConfig.settings || {},
          filters: widgetConfig.filters || {}
        });
      }
      // Reload after seeding
      await loadWidgetInstances();
    } catch (error) {
      console.error(`[useModuleDashboard] Error seeding defaults for ${moduleId}:`, error);
      setSeedError(error.message || 'Failed to create default widgets');
    } finally {
      setSeeding(false);
    }
  }, [moduleId, autoSeedDefaults, loadWidgetInstances]);

  // Trigger seeding when widgets are loaded and module has none
  useEffect(() => {
    if (instancesLoading || seededRef.current) return;
    if (moduleWidgets.length === 0 && allWidgets && allWidgets.length >= 0) {
      seedDefaultWidgets();
    }
  }, [instancesLoading, moduleWidgets.length, allWidgets, seedDefaultWidgets]);

  // Module-scoped layout settings
  const moduleLayoutKey = `module_${moduleId}`;
  const moduleLayoutSettings = useMemo(() => {
    const stored = layoutSettings || {};
    return stored[moduleLayoutKey] || stored;
  }, [layoutSettings, moduleLayoutKey]);

  const handleModuleLayoutSettingsChange = useCallback((nextSettings) => {
    handleLayoutSettingsChange({
      ...(layoutSettings || {}),
      ...nextSettings,
      groupOrders: {
        ...(layoutSettings?.groupOrders || {}),
        ...(nextSettings?.groupOrders || {})
      }
    });
  }, [handleLayoutSettingsChange, layoutSettings]);

  // Viewable module widgets
  const viewableWidgets = useMemo(
    () => moduleWidgets.filter(w => canViewWidget(w)),
    [moduleWidgets, canViewWidget]
  );

  return {
    // Module-scoped data
    moduleId,
    moduleWidgets: viewableWidgets,
    moduleCategories,

    // Widget data (keyed by widget instance ID)
    widgetData,
    widgetErrors,
    widgetLoadingStates,
    widgetStaleness,

    // State
    isLoading: instancesLoading || seeding,
    isSeeding: seeding,
    seedError,
    isEditMode,
    layoutSettings: moduleLayoutSettings,

    // Actions
    loadWidgetInstances,
    setIsEditMode,
    handleLayoutSettingsChange: handleModuleLayoutSettingsChange,
    canViewWidget,

    // Raw access
    allWidgets,
    dashboard
  };
}

export default useModuleDashboard;
