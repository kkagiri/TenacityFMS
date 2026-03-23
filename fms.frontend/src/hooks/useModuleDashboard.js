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
import {
  MODULE_DEFAULT_WIDGETS,
  buildModuleWidgetSignature,
  getModuleScopeCategories,
  isModuleScopedMatch,
  normalizeDashboardDataSourceId
} from '../config/moduleDefaultWidgets';

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
  const migratedRef = useRef(false);

  // Get categories that belong to this module
  const moduleCategories = useMemo(
    () => getModuleScopeCategories(moduleId),
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
    hasLoadedInstances,
    widgetInstancesLoadSucceeded,
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
      return isModuleScopedMatch({
        moduleCategories,
        candidates: [
          widget.category,
          widget.template?.category,
          widget.dataSource,
          widget.settings?.dataSource,
          widget.template?.dataSource
        ]
      });
    });
  }, [allWidgets, moduleCategories]);

  const dedupedModuleWidgets = useMemo(() => {
    const defaults = MODULE_DEFAULT_WIDGETS[moduleId] || [];
    const defaultSignatures = new Set(defaults.map(widget => buildModuleWidgetSignature({
      ...widget,
      customName: widget.name || widget.customName,
      visualizationType: widget.visualizationType || widget.widgetType,
      dataSource: normalizeDashboardDataSourceId(widget.dataSource),
      settings: {
        ...(widget.settings || {}),
        dataSource: normalizeDashboardDataSourceId(widget.dataSource)
      },
      filters: widget.filters || {}
    })));

    const seenDefaultSignatures = new Set();

    return moduleWidgets.filter(widget => {
      const signature = buildModuleWidgetSignature({
        ...widget,
        customName: widget.customName || widget.template?.displayName,
        visualizationType: widget.widgetType || widget.visualizationType || widget.template?.widgetType,
        dataSource: normalizeDashboardDataSourceId(widget.dataSource || widget.settings?.dataSource || widget.template?.dataSource),
        settings: widget.settings || {},
        filters: widget.filters || {}
      });

      if (!defaultSignatures.has(signature)) {
        return true;
      }

      if (seenDefaultSignatures.has(signature)) {
        return false;
      }

      seenDefaultSignatures.add(signature);
      return true;
    });
  }, [moduleId, moduleWidgets]);

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
      const existingSignatures = new Set(moduleWidgets.map(widget => buildModuleWidgetSignature({
        ...widget,
        customName: widget.customName || widget.template?.displayName,
        visualizationType: widget.widgetType || widget.visualizationType || widget.template?.widgetType,
        dataSource: normalizeDashboardDataSourceId(widget.dataSource || widget.settings?.dataSource || widget.template?.dataSource),
        settings: widget.settings || {},
        filters: widget.filters || {}
      })));

      for (const widgetConfig of defaults) {
        const normalizedDataSource = normalizeDashboardDataSourceId(widgetConfig.dataSource);
        const normalizedPayload = {
          ...widgetConfig,
          customName: widgetConfig.name || widgetConfig.customName,
          visualizationType: widgetConfig.visualizationType || widgetConfig.widgetType,
          category: widgetConfig.category,
          dataSource: normalizedDataSource,
          settings: {
            ...(widgetConfig.settings || {}),
            dataSource: normalizedDataSource
          },
          filters: widgetConfig.filters || {}
        };
        const signature = buildModuleWidgetSignature(normalizedPayload);

        if (existingSignatures.has(signature)) {
          continue;
        }

        const response = await dashboardSvc.createWidgetInstance({
          ...normalizedPayload
        });

        if (!response?.success) {
          throw new Error(response?.message || `Failed to create default widget: ${widgetConfig.name || widgetConfig.customName || widgetConfig.dataSource}`);
        }

        existingSignatures.add(signature);
      }
      // Reload after seeding
      await loadWidgetInstances();
    } catch (error) {
      console.error(`[useModuleDashboard] Error seeding defaults for ${moduleId}:`, error);
      setSeedError(error.message || 'Failed to create default widgets');
    } finally {
      setSeeding(false);
    }
  }, [moduleId, autoSeedDefaults, loadWidgetInstances, moduleWidgets]);

  // Trigger seeding when widgets are loaded and module has none
  useEffect(() => {
    if (instancesLoading || seededRef.current || !hasLoadedInstances || !widgetInstancesLoadSucceeded) return;
    if (moduleWidgets.length === 0) {
      seedDefaultWidgets();
    }
  }, [instancesLoading, hasLoadedInstances, moduleWidgets.length, seedDefaultWidgets, widgetInstancesLoadSucceeded]);

  useEffect(() => {
    if (instancesLoading || migratedRef.current || moduleWidgets.length === 0) {
      return;
    }

    const migrateWidgets = async () => {
      const dashboardSvc = serviceFactory.getDashboardService();
      const pendingUpdates = [];

      if (moduleId === 'tank_stock') {
        moduleWidgets.forEach(widget => {
          const widgetName = String(widget.customName || widget.template?.displayName || '').trim().toLowerCase();
          const widgetType = String(widget.widgetType || widget.visualizationType || widget.template?.widgetType || '').trim().toUpperCase();
          const normalizedDataSource = normalizeDashboardDataSourceId(widget.dataSource || widget.settings?.dataSource || widget.template?.dataSource);
          const currentSettings = { ...(widget.settings || {}) };

          if (widgetName === 'tank levels overview' && widgetType === 'BIG_STAT_CARD' && normalizedDataSource === 'tank_level') {
            pendingUpdates.push({
              id: widget.id,
              payload: {
                customName: widget.customName || 'Tank Levels Overview',
                visualizationType: 'BIG_STAT_CARD',
                category: widget.category || widget.template?.category || 'tankstock_monitoring',
                dataSource: 'tankstock_overview',
                settings: {
                  ...currentSettings,
                  mode: 'live',
                  datePreset: 'today',
                  dataSource: 'tankstock_overview',
                  unit: 'percent',
                  variant: 'fill_percentage',
                  showTrend: false,
                  icon: currentSettings.icon || 'fa-gas-pump',
                  color: currentSettings.color || '#0078d4'
                },
                filters: widget.filters || {}
              }
            });
            return;
          }

          const shouldNormalizeLivePreset =
            widgetType === 'BIG_STAT_CARD' || widgetType === 'DATA_TABLE_DETAILED';
          const isTankStockLiveDefault = [
            'active fueling',
            'tank levels table',
            'recent pump transactions'
          ].includes(widgetName);

          if (isTankStockLiveDefault && shouldNormalizeLivePreset && currentSettings.mode === 'live' && (!currentSettings.datePreset || currentSettings.datePreset === 'yesterday')) {
            pendingUpdates.push({
              id: widget.id,
              payload: {
                customName: widget.customName || widget.template?.displayName || '',
                visualizationType: widgetType,
                category: widget.category || widget.template?.category || 'tankstock_monitoring',
                dataSource: normalizedDataSource,
                settings: {
                  ...currentSettings,
                  dataSource: normalizedDataSource,
                  datePreset: 'today'
                },
                filters: widget.filters || {}
              }
            });
          }
        });
      }

      migratedRef.current = true;

      if (pendingUpdates.length === 0) {
        return;
      }

      for (const update of pendingUpdates) {
        const response = await dashboardSvc.updateWidgetInstance(update.id, update.payload);
        if (!response?.success) {
          throw new Error(response?.message || `Failed to migrate widget ${update.id}`);
        }
      }

      await loadWidgetInstances();
    };

    migrateWidgets().catch(error => {
      console.error(`[useModuleDashboard] Error migrating widgets for ${moduleId}:`, error);
    });
  }, [instancesLoading, loadWidgetInstances, moduleId, moduleWidgets]);

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
    () => dedupedModuleWidgets.filter(w => canViewWidget(w)),
    [dedupedModuleWidgets, canViewWidget]
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
