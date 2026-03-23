/**
 * useRealtimeDashboard Hook
 *
 * Centralized hook for real-time dashboard state management using enterprise service architecture.
 * Combines widget management, real-time updates, and role-based configuration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadDashboardLayout, updateDashboardLayout } from '../redux/actions/dashboardLayoutActions';
import serviceFactory from '../services/core/ServiceFactory';
import signalRService from '../signalR/dashboardSignalRService';
import { usePermissions } from './usePermissions';

/**
 * Main hook for real-time dashboard functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Dashboard state and methods
 */
export const useRealtimeDashboard = (options = {}) => {
  const {
    enableRealtime = true,
    autoLoad = true
  } = options;

  // Services
  const dashboardService = serviceFactory.getDashboardService();
  // Use the imported signalRService directly (singleton instance)

  // Redux state
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // Permissions
  const { hasPermission } = usePermissions();

  // Real-time connection state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionInfo, setConnectionInfo] = useState(null);

  // Widget instances and data
  const [widgetInstances, setWidgetInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [hasLoadedInstances, setHasLoadedInstances] = useState(false);
  const [widgetInstancesLoadSucceeded, setWidgetInstancesLoadSucceeded] = useState(false);
  const [widgetData, setWidgetData] = useState({});
  const [widgetErrors, setWidgetErrors] = useState({});
  const [widgetLoadingStates, setWidgetLoadingStates] = useState({});
  const [widgetStaleness, setWidgetStaleness] = useState({}); // track last update timestamps

  // Real-time data
  const [realtimeData, setRealtimeData] = useState({
    keyStatistics: {},
    tickers: {},
    graphs: {},
    deviceStatus: {}
  });

  // Dashboard configuration
  const [widgetConfig, setWidgetConfig] = useState({
    key_statistics: [],
    system_alerts: [],
    performance_metrics: [],
    issue_tracking: [],
    tank_levels: [],
    pump_status: []
  });

  // Layout and UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({});

  // Refs for cleanup
  const activeStreamsRef = useRef(new Map());
  const signalRListenersRef = useRef(new Map());
  const widgetInstancesRef = useRef([]);

  /**
   * Load widget instances from backend
   */
  const loadWidgetInstances = useCallback(async () => {
    try {
      setInstancesLoading(true);
      setWidgetInstancesLoadSucceeded(false);
      dashboardService.clearCache?.();
      const result = await dashboardService.getWidgetInstances();

      if (result.success && result.data) {
        setWidgetInstances(result.data);
        widgetInstancesRef.current = result.data;
        setWidgetInstancesLoadSucceeded(true);

        // Initialize loading states
        const loadingStates = {};
        result.data.forEach(widget => {
          loadingStates[widget.id] = true;
        });
        setWidgetLoadingStates(loadingStates);

        // Sync to widget config format
        const syncedConfig = {
          key_statistics: [],
          system_alerts: [],
          performance_metrics: [],
          issue_tracking: [],
          tank_levels: [],
          pump_status: []
        };

        result.data.forEach(instance => {
          const category = instance.category || 'key_statistics';
          if (syncedConfig[category]) {
            syncedConfig[category].push({
              id: instance.id.toString(),
              label: instance.customName || instance.name || 'Unnamed Widget',
              enabled: instance.enabled !== false,
              templateId: instance.templateId,
              customName: instance.customName,
              positionX: instance.positionX || 0,
              positionY: instance.positionY || 0,
              width: instance.width || 4,
              height: instance.height || 3,
              settings: instance.settings || {},
              filters: instance.filters || {},
              category: category,
              metric: instance.settings?.dataSource || instance.metric || 'fuel_dispense',
              mode: instance.settings?.defaultMode || instance.mode || 'live',
              datePreset: instance.settings?.defaultDatePreset || instance.datePreset || 'today',
              sitesMode: instance.filters?.sitesMode || instance.sitesMode || 'all',
              siteIds: instance.filters?.siteIds || instance.siteIds || []
            });
          }
        });

        setWidgetConfig(syncedConfig);
        console.log('Widget instances loaded and synced:', result.data);
      } else {
        setWidgetInstances([]);
        widgetInstancesRef.current = [];
      }
    } catch (error) {
      console.error('Error loading widget instances:', error);
    } finally {
      setHasLoadedInstances(true);
      setInstancesLoading(false);
    }
  }, [dashboardService]);

  /**
   * Fetch data for a specific widget
   */
  const determineWidgetMode = (widget, parsedConfig) => {
    // Priority: settings.mode -> root.mode -> default 'live'
    try {
      if (parsedConfig?.settings?.mode) return parsedConfig.settings.mode;
      if (parsedConfig?.mode) return parsedConfig.mode;
    } catch (_) { /* ignore */ }
    return 'live';
  };

  const mergeCumulativeData = (existing, incoming) => {
    if (!existing) return incoming;
    const merged = { ...existing, ...incoming };

    // Merge primary value (support delta / increment fields)
    const existingValue = existing.value ?? existing.total ?? existing.amount;
    const incomingDelta = incoming.delta ?? incoming.increment ?? null;
    if (existingValue != null && incomingDelta != null) {
      const targetKey = existing.value != null ? 'value' : existing.total != null ? 'total' : 'amount';
      merged[targetKey] = existingValue + incomingDelta;
    }

    // Merge time series arrays if present
    const existingSeries = existing.timeSeries || existing.series || [];
    const incomingSeries = incoming.timeSeries || incoming.series || [];
    if (incomingSeries.length > 0) {
      const map = new Map();
      existingSeries.forEach(p => p && map.set(p.timestamp || p.t || p.time, p));
      incomingSeries.forEach(p => p && map.set(p.timestamp || p.t || p.time, p));
      const combined = Array.from(map.values())
        .filter(Boolean)
        .sort((a, b) => (new Date(a.timestamp || a.t || a.time) - new Date(b.timestamp || b.t || b.time)));
      if (existing.timeSeries) merged.timeSeries = combined;
      else if (existing.series) merged.series = combined;
      else merged.timeSeries = combined; // fallback
    }

    return merged;
  };

  const fetchWidgetData = useCallback(async (widgetInstanceId) => {
    try {
      setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: true }));
      setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: null }));

      const widget = widgetInstances.find(w => w.id === widgetInstanceId);
      if (!widget) {
        setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: 'Widget not found' }));
        return;
      }

      let config = {};
      try {
        config = JSON.parse(widget.configurationJson || '{}');
      } catch (e) {
        console.warn('Failed to parse widget configuration:', e);
      }

      // Use dashboard service to get widget data
      const response = await dashboardService.getWidgetData(widgetInstanceId, config);

      if (response.success) {
        const mode = determineWidgetMode(widget, config);
        setWidgetData(prev => ({
          ...prev,
          [widgetInstanceId]: {
            ...response.data,
            mode,
            lastUpdated: new Date().toISOString(),
            isRealtime: false,
            origin: 'initial'
          }
        }));
        setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: null }));
      } else {
        setWidgetErrors(prev => ({
          ...prev,
          [widgetInstanceId]: response.message || 'Failed to load widget data'
        }));
      }

    } catch (error) {
      console.error(`Error fetching data for widget ${widgetInstanceId}:`, error);
      setWidgetErrors(prev => ({
        ...prev,
        [widgetInstanceId]: error.message || 'Data fetch error'
      }));
    } finally {
      setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: false }));
    }
  }, [widgetInstances, dashboardService]);

  /**
   * Refresh specific widget
   */
  const refreshWidget = useCallback(async (widgetInstanceId) => {
    console.log(`Refreshing widget ${widgetInstanceId}`);
    await fetchWidgetData(widgetInstanceId);
  }, [fetchWidgetData]);

  /**
   * Refresh all widgets
   */
  const refreshAllWidgets = useCallback(async () => {
    console.log('Refreshing all widgets');
    const refreshPromises = widgetInstances.map(widget => fetchWidgetData(widget.id));
    await Promise.allSettled(refreshPromises);
  }, [widgetInstances, fetchWidgetData]);

  /**
   * Initialize SignalR connection
   */
  const initializeSignalR = useCallback(async () => {
    if (!enableRealtime) return;

    try {
      console.log('[SignalR] Initializing real-time connection...');

      // Start connection
      await signalRService.start('/dashboardHub');
      setConnectionStatus('connected');
      setConnectionInfo(signalRService.getConnectionInfo());

      // Set up event listeners
      const handleConnectionStatusChange = (connected) => {
        setConnectionStatus(connected ? 'connected' : 'disconnected');
        setConnectionInfo(signalRService.getConnectionInfo());
      };

      const handleWidgetDataUpdate = (payload) => {
        if (payload && payload.widgetId) {
          const { widgetId } = payload;
          const incoming = payload.data || {};
          setWidgetData(prev => {
            const existing = prev[widgetId];
            let merged;
            const mode = existing?.mode || incoming.mode; // prefer stored mode
            if (mode === 'cumulative') {
              merged = mergeCumulativeData(existing, incoming);
            } else {
              merged = { ...existing, ...incoming }; // replace/augment for live widgets
            }
            return {
              ...prev,
              [widgetId]: {
                ...merged,
                mode: mode || 'live',
                lastUpdated: payload.timestamp || new Date().toISOString(),
                isRealtime: true,
                origin: existing ? 'merge' : 'stream'
              }
            };
          });
        }
      };

      const handleRealtimeDataUpdate = (data) => {
        setRealtimeData(prev => ({
          ...prev,
          ...data
        }));
      };

      // Register listeners
      // Support both camelCase (old) and PascalCase (server emits PascalCase)
      const handleInitialWidgetDataResponse = (payload) => {
        if (!payload) return;
        const wid = payload.widgetInstanceId;
        if (!wid) return;
        const metadata = payload.metadata || {};
        const incoming = payload.data || {};
        const payloadWidgetType = payload.widgetType || metadata.widgetType || metadata.type;
        if (payloadWidgetType && payloadWidgetType.toLowerCase() === 'dashboard_overview') {
          const updated = signalRService.setDashboardOverviewWidgetId?.(wid);
          if (updated) {
            signalRService.requestDashboardMetrics?.(wid);
          }
        }
        setWidgetData(prev => {
          const existing = prev[wid];
          const mode = existing?.mode || metadata.mode || 'cumulative';
          return {
            ...prev,
            [wid]: {
              ...incoming,
              mode,
              timeRange: metadata.timeRange || incoming.timeRange || existing?.timeRange,
              lastUpdated: metadata.lastUpdated || payload.timestamp || new Date().toISOString(),
              isRealtime: false,
              origin: 'initial'
            }
          };
        });
        setWidgetLoadingStates(prev => ({ ...prev, [wid]: false }));
        setWidgetErrors(prev => ({ ...prev, [wid]: payload.error || null }));
        setWidgetStaleness(prev => ({ ...prev, [wid]: Date.now() }));
      };

      const handleInitialWidgetsBatch = (batchPayload) => {
        if (!batchPayload?.widgets) return;
        batchPayload.widgets.forEach(w => handleInitialWidgetDataResponse(w));
      };

      // --- Protocol v2 Envelope Handling (Phase 2 Option A) ---
      const normalizeEnvelope = (envelope) => {
        if (!envelope || typeof envelope !== 'object') return null;
        const {
          widgetInstanceId: envelopeWidgetInstanceId,
          widgetType,
          dataSource,
          category,
          mode,
          timeRange,
          aggregation,
          updateType,
          data,
          errors,
          metadata,
          protocolVersion = 2,
          timestamp
        } = envelope;

        let resolvedWidgetInstanceId = envelopeWidgetInstanceId;

        if (!resolvedWidgetInstanceId || resolvedWidgetInstanceId === 0) {
          const availableInstances = Array.isArray(widgetInstancesRef.current) ? widgetInstancesRef.current : [];
          const target = availableInstances.find(instance => {
            if (!instance) return false;
            const instanceType = instance.widgetType || instance.templateWidgetType || instance.template?.widgetType;
            const instanceDataSource = instance.dataSource || instance.templateDataSource || instance.template?.dataSource;
            const typeMatches = widgetType && instanceType && instanceType.toLowerCase() === widgetType.toLowerCase();
            const dataSourceMatches = dataSource && instanceDataSource && instanceDataSource.toLowerCase() === dataSource.toLowerCase();
            return typeMatches || dataSourceMatches;
          });

          if (target) {
            resolvedWidgetInstanceId = target.id;
            if (widgetType && widgetType.toLowerCase() === 'dashboard_overview') {
              const updated = signalRService.setDashboardOverviewWidgetId?.(target.id);
              if (updated) {
                signalRService.requestDashboardMetrics?.(target.id);
              }
            }
          }
        }

        if (!resolvedWidgetInstanceId) return null;

        if (widgetType && widgetType.toLowerCase() === 'dashboard_overview') {
          signalRService.setDashboardOverviewWidgetId?.(resolvedWidgetInstanceId);
        }

        return {
          widgetId: resolvedWidgetInstanceId,
          widgetInstanceId: resolvedWidgetInstanceId,
          widgetType,
          dataSource,
          category,
          mode: mode || metadata?.mode || 'cumulative',
          timeRange,
          aggregation,
          updateType: updateType || 'initial',
          protocolVersion,
          timestamp: timestamp || new Date().toISOString(),
          errors: errors || null,
          metadata: metadata || {},
          data: data || null
        };
      };

      const applyEnvelope = (normalized) => {
        if (!normalized) return;
        const { widgetInstanceId: wid, data, mode, timestamp, errors, updateType, timeRange } = normalized;
        setWidgetData(prev => {
          const existing = prev[wid];
          let merged;
          if (updateType === 'increment' && existing) {
            merged = mergeCumulativeData(existing, data || {});
          } else if (mode === 'cumulative' && existing && updateType === 'merge') {
            merged = mergeCumulativeData(existing, data || {});
          } else {
            merged = { ...(existing || {}), ...(data || {}) };
          }
          return {
            ...prev,
            [wid]: {
              ...merged,
              mode: mode || existing?.mode || 'cumulative',
              timeRange: timeRange || existing?.timeRange,
              lastUpdated: timestamp,
              isRealtime: updateType !== 'initial',
              origin: `envelope-${updateType || 'initial'}`
            }
          };
        });
        if (errors) {
          setWidgetErrors(prev => ({ ...prev, [wid]: errors.join?.('\n') || errors.toString() }));
        } else {
          setWidgetErrors(prev => ({ ...prev, [wid]: null }));
        }
        // Mark loading state false for initial
        if (updateType === 'initial') {
          setWidgetLoadingStates(prev => ({ ...prev, [wid]: false }));
        }
        setWidgetStaleness(prev => ({ ...prev, [wid]: Date.now() }));
      };

      const handleWidgetDataEnvelope = (envelope) => {
        const normalized = normalizeEnvelope(envelope);
        applyEnvelope(normalized);
      };

      const handleWidgetDataEnvelopeBatch = (batch) => {
        if (!batch) return;
        const list = batch.widgets || batch.Widgets || [];
        list.forEach(env => {
          const normalized = normalizeEnvelope(env);
          applyEnvelope(normalized);
        });
      };

      const listeners = new Map([
        ['connectionStatusChanged', handleConnectionStatusChange],
        // Widget data updates
        ['widgetDataUpdate', handleWidgetDataUpdate],
        ['WidgetDataUpdate', handleWidgetDataUpdate],
        ['initialWidgetDataResponse', handleInitialWidgetDataResponse],
        ['InitialWidgetDataResponse', handleInitialWidgetDataResponse],
        ['initialWidgetsDataBatch', handleInitialWidgetsBatch],
        ['InitialWidgetsDataBatch', handleInitialWidgetsBatch],
        // Protocol v2 unified envelope events
        ['widgetDataEnvelope', handleWidgetDataEnvelope],
        ['WidgetDataEnvelope', handleWidgetDataEnvelope],
        ['widgetDataEnvelopeBatch', handleWidgetDataEnvelopeBatch],
        ['WidgetDataEnvelopeBatch', handleWidgetDataEnvelopeBatch],
        // Key statistics (legacy; may be removed server-side)
        ['keyStatisticsUpdate', (data) => handleRealtimeDataUpdate({ keyStatistics: data })],
        ['KeyStatisticsUpdate', (data) => handleRealtimeDataUpdate({ keyStatistics: data })],
        // Ticker updates
        ['tickerUpdate', (data) => handleRealtimeDataUpdate({ tickers: data })],
        ['TickerUpdate', (data) => handleRealtimeDataUpdate({ tickers: data })],
        // Device status (defensive dual registration)
        ['deviceStatusUpdate', (data) => handleRealtimeDataUpdate({ deviceStatus: data })],
        ['DeviceStatusUpdate', (data) => handleRealtimeDataUpdate({ deviceStatus: data })]
      ]);

      listeners.forEach((handler, event) => {
        const unsubscribe = signalRService.on(event, handler);
        signalRListenersRef.current.set(event, unsubscribe);
      });

      console.log('[SignalR] Real-time connection established');

    } catch (error) {
      console.error('[SignalR] Failed to initialize connection:', error);
      setConnectionStatus('error');

      // Retry after delay
      setTimeout(() => {
        console.log('[SignalR] Retrying connection...');
        initializeSignalR();
      }, 5000);
    }
  }, [enableRealtime]);

  /**
   * Update widget configuration
   */
  const updateWidgetConfig = useCallback((category, items) => {
    setWidgetConfig(prev => ({ ...prev, [category]: items }));
  }, []);

  /**
   * Handle edit mode changes
   */
  const handleEditModeComplete = useCallback(async (layoutData) => {
    try {
      dispatch(updateDashboardLayout(layoutData));
      setIsEditMode(false);
      console.log('Layout updated:', layoutData);
    } catch (error) {
      console.error('Error updating layout:', error);
    }
  }, [dispatch]);

  /**
   * Handle layout settings change
   */
  const handleLayoutSettingsChange = useCallback((newLayoutSettings) => {
    setLayoutSettings(newLayoutSettings);
    localStorage.setItem('fms_dashboard_layouts', JSON.stringify(newLayoutSettings));
  }, []);

  /**
   * Check if user can view specific widget
   */
  const canViewWidget = useCallback((widgetName) => {
    // Map widget names to permissions
    const widgetPermissions = {
      'quickActions': '_View_Dashboard',
      'stats': '_View_Dashboard',
      'systemModules': 'Dashboard Module',
      'events': '_Read_EventExpression',
      'performance': '_View_Dashboard',
      'fuelManagement': 'FuelRefil',
      'tankStatus': 'TankStockModule'
    };

    const permission = widgetPermissions[widgetName];
    return permission ? hasPermission(permission) : true;
  }, [hasPermission]);

  // Initialize on mount
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadWidgetInstances();
      initializeSignalR();
      dispatch(loadDashboardLayout());
    }
  }, [isAuthenticated, currentUser, loadWidgetInstances, initializeSignalR, dispatch]);

  // Load widget data after instances are loaded (batch hub method)
  useEffect(() => {
    if (widgetInstances.length === 0 || !autoLoad) return;
    // Only proceed when connected
    if (!(enableRealtime && connectionStatus === 'connected')) {
      // If we've hit an error state, we could consider adding a future REST fallback here.
      return;
    }

    const ids = widgetInstances.map(w => w.id);
    // Mark all as loading
    setWidgetLoadingStates(prev => ids.reduce((acc, id) => { acc[id] = true; return acc; }, { ...prev }));
    try {
      console.log('[useRealtimeDashboard] Requesting batch initial widget data for ids:', ids);
      signalRService.requestInitialWidgetsData(ids);
    } catch (e) {
      console.error('[RealtimeDashboard] Batch initial load failed (no REST fallback):', e);
    }
  }, [widgetInstances, autoLoad, enableRealtime, connectionStatus]);

  // Staleness monitor (flag widgets stale if no update for >60s)
  useEffect(() => {
    const interval = setInterval(() => {
      setWidgetStaleness(prev => ({ ...prev })); // trigger rerender; consumers compute freshness
    }, 15000); // check every 15s
    return () => clearInterval(interval);
  }, []);

  // Load layout settings from localStorage
  useEffect(() => {
    const savedLayouts = localStorage.getItem('fms_dashboard_layouts');
    if (savedLayouts) {
      try {
        setLayoutSettings(JSON.parse(savedLayouts));
      } catch (e) {
        console.warn('Failed to parse saved layout settings');
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    // Snapshot refs now
    const listenersSnapshot = signalRListenersRef.current;
    const activeStreamsSnapshot = activeStreamsRef.current;
    return () => {
      try {
        listenersSnapshot.forEach((unsubscribe, event) => {
          try { unsubscribe && unsubscribe(); } catch (error) { console.warn(`Error cleaning up ${event} listener:`, error); }
        });
      } catch (e) { /* ignore */ }
      if (enableRealtime) {
        try { signalRService.stop(); } catch (e) { console.warn('Error stopping SignalR:', e); }
      }
      try { activeStreamsSnapshot.clear(); } catch (e) { /* ignore */ }
    };
  }, [enableRealtime]);

  return {
    // State
    widgetInstances,
    instancesLoading,
    hasLoadedInstances,
    widgetInstancesLoadSucceeded,
    widgetData,
    widgetErrors,
    widgetLoadingStates,
    widgetStaleness,
    realtimeData,
    widgetConfig,
    isEditMode,
    layoutSettings,
    connectionStatus,
    connectionInfo,
    currentUser,
    isAuthenticated,

    // Actions
    loadWidgetInstances,
    fetchWidgetData,
    refreshWidget,
    refreshAllWidgets,
    updateWidgetConfig,
    setIsEditMode,
    handleEditModeComplete,
    handleLayoutSettingsChange,

    // Utilities
    canViewWidget
  };
};

export default useRealtimeDashboard;
