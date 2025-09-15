import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadDashboardLayout, updateDashboardLayout } from '../../redux/actions/dashboardLayoutActions';
import signalRService from '../../signalR/dashboardSignalRService';
import dashboardService from '../../services/dashboardService';
import dataSourceService from '../../services/dataSourceService'; // Phase 2 unified service
import './RealtimeDashboard.scss';


// Import existing components
import { StatsCards } from './widget/StatsCards';
import { Button } from 'devextreme-react/button';
import WidgetConfigModal from './ModalPopup/WidgetConfigModal';
import WidgetVisibilityModal from './ModalPopup/WidgetVisibilityModal';

import { SystemModules } from './widget/SystemModules';
// import DashboardAlarmWidget from './widget/DashboardAlarmWidget';
import { QuickActionButtons } from './QuickActionButtons';
import axiosInstance from '../../api/axiosInstance';

// Enhanced Widget System
import CategoryGroupedWidgetRenderer from './CategoryGroupedWidgetRenderer';

/**
 * Real-time Dashboard Component
 * Enhanced version with grid-based widget positioning
 * Supports dynamic widget placement based on saved layout configuration
 */
export default function RealtimeDashboard() {
  // Redux state
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  // Ref to track active streams for cleanup
  const activeStreamsRef = useRef(new Map());

  // Real-time connection state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    keyStatistics: {},
    tickers: {},
    graphs: {},
    deviceStatus: {}
  });

  // Dashboard configuration state
  const [widgetConfig, setWidgetConfig] = useState({
    key_statistics: [],
    system_alerts: [],
    performance_metrics: [],
    issue_tracking: [],
    tank_levels: [],
    pump_status: []
  });

  // Widget instances from backend
  const [widgetInstances, setWidgetInstances] = useState([]);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [widgetData, setWidgetData] = useState({});
  const [widgetErrors, setWidgetErrors] = useState({});
  const [widgetLoadingStates, setWidgetLoadingStates] = useState({});
  const [layoutSettings, setLayoutSettings] = useState({});

  const [metricFilters, setMetricFilters] = useState({
    key_statistics: {
      fuel_dispense: { mode: 'live', datePreset: 'today', sitesMode: 'all', siteIds: [] },
      fuel_used_gps: { mode: 'cumulative', datePreset: 'yesterday', sitesMode: 'all', siteIds: [] },
      engine_hours: { mode: 'live', datePreset: 'today', sitesMode: 'all', siteIds: [] },
      km_travel: { mode: 'live', datePreset: 'today', sitesMode: 'all', siteIds: [] },
      idling: { mode: 'live', datePreset: 'today', sitesMode: 'all', siteIds: [] }
    }
  });

  // Modal states
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false);
  const [widgetVisibilityOpen, setWidgetVisibilityOpen] = useState(false);

  // Sites data
  const [sites, setSites] = useState([]);

  // Grid layout state
  const [isEditMode, setIsEditMode] = useState(false);

  // Stats data (fallback for when real-time is unavailable)
  const [stats] = useState({
    activeTags: 4,
    activeAlerts: 2,
    todayTransactions: 28,
    todayVolume: 1245.67,
    tankLevels: [
      { id: 1, name: 'Regular Unleaded', level: 77, volume: 15420 },
      { id: 2, name: 'Premium Unleaded', level: 65, volume: 12980 },
      { id: 3, name: 'Diesel', level: 42, volume: 8450 },
    ],
    pumpStatus: [
      { id: 1, status: 'Idle' },
      { id: 2, status: 'Filling' },
      { id: 3, status: 'Idle' },
      { id: 4, status: 'Offline' },
    ],
  });

  // Role-based configuration (same as original)
  const ROLE_CONFIG = {
    admin: {
      name: 'Administrator',
      color: '#d32f2f',
      widgets: ['quickActions', 'stats', 'alarms', 'performance', 'fuelManagement', 'tankStatus', 'systemModules', 'issues'],
      permissions: ['all'],
      modules: [
        {
          name: 'User Management',
          icon: 'users',
          path: '/admin/users',
          description: 'Manage system users and permissions',
          stat: '24 Active Users',
          priority: 1
        },
        {
          name: 'System Configuration',
          icon: 'cogs',
          path: '/admin/config',
          description: 'Configure system settings and parameters',
          stat: 'All Settings',
          priority: 2
        },
        {
          name: 'Audit Logs',
          icon: 'history',
          path: '/admin/audit',
          description: 'View system audit trails and logs',
          stat: 'Security Monitoring',
          priority: 3
        },
        {
          name: 'Database Management',
          icon: 'database',
          path: '/admin/database',
          description: 'Database backup and maintenance',
          stat: 'DB Health: Good',
          priority: 4
        },
        {
          name: 'Reports & Analytics',
          icon: 'chart-bar',
          path: '/admin/reports',
          description: 'Generate comprehensive system reports',
          stat: 'Advanced Reports',
          priority: 5
        },
        {
          name: 'Tag Management',
          icon: 'tag',
          path: '/tag-management',
          description: 'Manage RFID tags for vehicles and drivers',
          stat: '4 Active Tags',
          priority: 6
        },
        {
          name: 'Alerts Monitor',
          icon: 'warning',
          path: '/alerts',
          description: 'View and manage system alerts',
          stat: '2 Active Alerts',
          highlight: true,
          priority: 7
        },
        {
          name: 'PTS Devices',
          icon: 'car',
          path: '/pts-devices',
          description: 'Manage PTS devices and configuration',
          stat: 'Device Management',
          priority: 8
        }
      ]
    },
    management: {
      name: 'Management',
      color: '#1976d2',
      widgets: ['quickActions', 'stats', 'performance', 'fuelManagement', 'tankStatus', 'systemModules'],
      permissions: ['view_reports', 'manage_operations'],
      modules: [
        {
          name: 'Performance Reports',
          icon: 'chart-line',
          path: '/reports/performance',
          description: 'View performance metrics and KPIs',
          stat: 'Monthly Reports',
          priority: 1
        },
        {
          name: 'Fuel Analytics',
          icon: 'gas-pump',
          path: '/reports/fuel',
          description: 'Detailed fuel consumption analytics',
          stat: 'Cost Analysis',
          priority: 2
        },
        {
          name: 'Fleet Overview',
          icon: 'truck',
          path: '/fleet/overview',
          description: 'Overall fleet performance monitoring',
          stat: '48 Vehicles',
          priority: 3
        },
        {
          name: 'Financial Dashboard',
          icon: 'chart-pie',
          path: '/finance/dashboard',
          description: 'Cost analysis and budget tracking',
          stat: '$45K This Month',
          priority: 4
        },
        {
          name: 'Operations Monitor',
          icon: 'clipboard-check',
          path: '/operations',
          description: 'Monitor daily operations and efficiency',
          stat: 'Daily Operations',
          priority: 5
        },
        {
          name: 'Tank Monitoring',
          icon: 'database',
          path: '/tank-monitoring',
          description: 'Monitor tank levels and status',
          stat: '3 Tanks',
          priority: 6
        }
      ]
    },
    user: {
      name: 'Fuel Operator',
      color: '#388e3c',
      widgets: ['quickActions', 'stats', 'tankStatus', 'systemModules'],
      permissions: ['view_operations', 'basic_reports'],
      modules: [
        {
          name: 'Issue Fuel',
          icon: 'gas-pump',
          path: '/atg',
          description: 'Use PTS system for fuel dispensing',
          stat: 'PTS Ready',
          priority: 1
        },
        {
          name: 'View Stock Analysis',
          icon: 'chart-line',
          path: '/tankstock/stock-analytics',
          description: 'Analyze stock levels and trends',
          stat: 'Analytics',
          priority: 2
        },
        {
          name: 'View Reports',
          icon: 'file-text',
          path: '/reports',
          description: 'Generate and view operational reports',
          stat: 'Reports',
          priority: 3
        }
      ]
    },
    guest: {
      name: 'Guest',
      color: '#757575',
      widgets: ['stats', 'tankStatus'],
      permissions: ['view_basic'],
      modules: [
        {
          name: 'System Overview',
          icon: 'chart-simple',
          path: '/overview',
          description: 'Basic system status overview',
          stat: 'Read Only',
          priority: 1
        },
        {
          name: 'Public Reports',
          icon: 'file',
          path: '/reports/public',
          description: 'View public operational reports',
          stat: 'Limited Access',
          priority: 2
        },
        {
          name: 'Tank Status',
          icon: 'gauge',
          path: '/tanks/status',
          description: 'View current tank status',
          stat: 'View Only',
          priority: 3
        }
      ]
    }
  };

  // Get user role
  const userRoles = currentUser?.roles || currentUser?.Roles || [];
  const primaryRole = userRoles.length > 0 ? userRoles[0].toLowerCase() : 'guest';
  const roleConfig = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.guest;

  // Helper function to check if widget should use incremental loading
  const shouldUseIncrementalLoading = useCallback((widget) => {
    try {
      const config = JSON.parse(widget.configurationJson || '{}');
      // Any widget in "live" mode should use incremental loading
      return config.mode === 'live' || config.settings?.mode === 'live';
    } catch (e) {
      return false;
    }
  }, []);

  // Helper function to check if widget is a chart type
  const isChartWidget = useCallback((widgetType) => {
    const chartTypes = [
      'CHART_LINE_TREND', 'CHART_BAR_COMPARISON', 'CHART_PIE_DISTRIBUTION',
      'LINECHART', 'BARCHART', 'PIECHART'
    ];
    return chartTypes.includes(widgetType?.toUpperCase());
  }, []);

  // Helper function to append incremental data to existing data
  const appendIncrementalData = useCallback((existingData, newData, widgetType) => {
    if (!existingData) {
      // If no existing data, use new data as initial
      return newData;
    }

    if (!newData) {
      // If no new data, keep existing
      return existingData;
    }

    // For different widget types, handle data appending differently
    const type = widgetType?.toUpperCase();

    if (type?.includes('CHART') || type?.includes('GRAPH')) {
      // Chart widgets: append to chartData array
      const existingChartData = existingData.chartData || [];
      const newChartData = newData.chartData || [];

      if (newChartData.length > 0) {
        const combinedData = [...existingChartData, ...newChartData];

        // Remove duplicates based on timestamp/argument
        const uniqueData = combinedData.filter((item, index, self) =>
          index === self.findIndex(t =>
            (t.timestamp && t.timestamp === item.timestamp) ||
            (t.argument && t.argument === item.argument) ||
            (t.date && t.date === item.date)
          )
        );

        // Sort by timestamp
        uniqueData.sort((a, b) => {
          const aTime = new Date(a.timestamp || a.argument || a.date);
          const bTime = new Date(b.timestamp || b.argument || b.date);
          return aTime - bTime;
        });

        return {
          ...newData,
          chartData: uniqueData,
          lastUpdated: newData.lastUpdated || new Date().toISOString()
        };
      }
    }

    if (type?.includes('TABLE') || type?.includes('LIST')) {
      // Table/List widgets: append to data array
      const existingRows = existingData.data || existingData.items || [];
      const newRows = newData.data || newData.items || [];

      if (newRows.length > 0) {
        const combinedRows = [...existingRows, ...newRows];

        // Remove duplicates based on ID or unique field
        const uniqueRows = combinedRows.filter((item, index, self) =>
          index === self.findIndex(t =>
            (t.id && t.id === item.id) ||
            (t.key && t.key === item.key) ||
            (t.timestamp && t.timestamp === item.timestamp)
          )
        );

        return {
          ...newData,
          data: uniqueRows,
          items: uniqueRows,
          lastUpdated: newData.lastUpdated || new Date().toISOString()
        };
      }
    }

    if (type?.includes('STAT') || type?.includes('TICKER') || type?.includes('GAUGE')) {
      // Stat widgets: update current value but keep history
      const existingHistory = existingData.history || [];
      const currentValue = newData.value || newData.current || 0;

      // Add current value to history
      const newHistoryEntry = {
        value: currentValue,
        timestamp: newData.lastUpdated || new Date().toISOString()
      };

      const updatedHistory = [...existingHistory, newHistoryEntry];

      // Keep only last 100 history entries
      if (updatedHistory.length > 100) {
        updatedHistory.splice(0, updatedHistory.length - 100);
      }

      return {
        ...newData,
        history: updatedHistory,
        lastUpdated: newData.lastUpdated || new Date().toISOString()
      };
    }

    // Default: replace data for other widget types
    return {
      ...newData,
      lastUpdated: newData.lastUpdated || new Date().toISOString()
    };
  }, []);

  // Load initial metrics data using SignalR only (no REST API calls)
  const loadInitialMetrics = useCallback(async () => {
    try {
      console.log('Loading initial metrics using SignalR only...');

      // Check if SignalR is connected
      if (!signalRService.getConnectionStatus()) {
        console.log('SignalR not connected, waiting for connection before loading metrics...');
        return;
      }

      // Define the metrics to load via SignalR
      const metricsToLoad = [
        { dataSource: 'fuel_dispense', mode: 'live', datePreset: 'today' },
        { dataSource: 'engine_hours', mode: 'live', datePreset: 'today' },
        { dataSource: 'km_travel', mode: 'historical', datePreset: 'today' },
        { dataSource: 'fuel_used_gps', mode: 'historical', datePreset: 'today' }
      ];

      // Load metrics via SignalR in parallel
      const metricPromises = metricsToLoad.map(async (metric) => {
        try {
          // Use SignalR to request initial data
          const data = await signalRService.requestInitialData(metric.dataSource, {
            mode: metric.mode,
            datePreset: metric.datePreset,
            sitesMode: 'all',
            siteIds: []
          });

          return {
            dataSource: metric.dataSource,
            success: data?.success !== false,
            value: data?.data?.value || data?.value,
            error: data?.error
          };
        } catch (error) {
          console.warn(`Failed to load ${metric.dataSource} via SignalR:`, error);
          return {
            dataSource: metric.dataSource,
            success: false,
            error: error.message
          };
        }
      });

      // Wait for all metrics to load
      const results = await Promise.all(metricPromises);

      // Update state with successful results
      const updatedKeyStatistics = {};
      results.forEach(result => {
        if (result.success && result.value != null) {
          updatedKeyStatistics[result.dataSource] = result.value;
        } else if (result.error) {
          console.warn(`Metric ${result.dataSource} returned error:`, result.error);
        }
      });

      // Update realtime data if we have any successful results
      if (Object.keys(updatedKeyStatistics).length > 0) {
        setRealtimeData(prev => ({
          ...prev,
          keyStatistics: {
            ...prev.keyStatistics,
            ...updatedKeyStatistics
          }
        }));
      }

      console.log('Initial metrics loaded via SignalR:', updatedKeyStatistics);
    } catch (error) {
      console.error('Failed to load initial metrics via SignalR:', error);
    }
  }, []);  // Initialize SignalR connection with enhanced error handling and retry logic
  useEffect(() => {
    const initializeRealtimeConnection = async () => {
      try {
        console.log('[SignalR] Attempting to start SignalR connection...');
        await signalRService.start('/dashboardHub');
        console.log('[SignalR] SignalR connection established successfully');

        // Subscribe only to metrics that are actually used in live mode widgets
        const liveMetrics = ['fuel_dispense', 'fuel_dispensed', 'fuel_used_gps', 'engine_hours', 'km_travel', 'idling'];
        for (const metric of liveMetrics) {
          try {
            await signalRService.subscribeToMetric(metric);
            console.log(`[SignalR] Subscribed to metric: ${metric}`);
          } catch (error) {
            console.warn(`Failed to subscribe to metric ${metric}:`, error);
          }
        }

        // Note: RequestKeyStatistics removed as it's not implemented on server
        console.log('[SignalR] Skipping key statistics request - not implemented on server');

        // Load initial metrics data using DashboardMetricsService
        try {
          await loadInitialMetrics();
        } catch (error) {
          console.warn('Failed to load initial metrics data:', error);
        }

        console.log('[SignalR] Real-time dashboard connection established with optimized subscriptions');
        setConnectionStatus('connected');
      } catch (error) {
        console.error('[SignalR] Failed to initialize real-time connection:', error);
        setConnectionStatus('error');

        // Retry SignalR connection after 5 seconds
        console.log('[SignalR] Retrying SignalR connection in 5 seconds...');
        setTimeout(async () => {
          try {
            console.log('[SignalR] Retry attempt...');
            await signalRService.start('/dashboardHub');
            console.log('[SignalR] Retry successful!');
            setConnectionStatus('connected');
          } catch (retryError) {
            console.error('[SignalR] Retry failed:', retryError);
            setConnectionStatus('error');
          }
        }, 5000);
      }
    };

    if (isAuthenticated && currentUser) {
      initializeRealtimeConnection();
    }

    // Cleanup on unmount
    return () => {
      signalRService.stop();
    };
  }, [isAuthenticated, currentUser, loadInitialMetrics]);

  // Set up SignalR connection (only once)
  useEffect(() => {
    const handleConnectionStatusChange = (connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      setConnectionInfo(signalRService.getConnectionInfo());
    };

    const handleKeyStatisticsUpdate = (data) => {
      setRealtimeData(prev => ({
        ...prev,
        keyStatistics: { ...prev.keyStatistics, ...data }
      }));
    };

    const handleTickerUpdate = (data) => {
      setRealtimeData(prev => ({
        ...prev,
        tickers: { ...prev.tickers, ...data }
      }));
    };

    const handleGraphUpdate = (data) => {
      setRealtimeData(prev => ({
        ...prev,
        graphs: { ...prev.graphs, ...data }
      }));
    };

    const handleDeviceStatusUpdate = (data) => {
      setRealtimeData(prev => ({
        ...prev,
        deviceStatus: { ...prev.deviceStatus, ...data }
      }));
    };

    // Set up basic SignalR event listeners (not widget-specific)
    const unsubscribeConnection = signalRService.on('connectionStatusChanged', handleConnectionStatusChange);
    const unsubscribeKeyStats = signalRService.on('keyStatisticsUpdate', handleKeyStatisticsUpdate);
    const unsubscribeTickers = signalRService.on('tickerUpdate', handleTickerUpdate);
    const unsubscribeGraphs = signalRService.on('graphUpdate', handleGraphUpdate);
    const unsubscribeDevices = signalRService.on('deviceStatusUpdate', handleDeviceStatusUpdate);

    // Cleanup only basic event listeners
    return () => {
      try {
        unsubscribeConnection && unsubscribeConnection();
        unsubscribeKeyStats && unsubscribeKeyStats();
        unsubscribeTickers && unsubscribeTickers();
        unsubscribeGraphs && unsubscribeGraphs();
        unsubscribeDevices && unsubscribeDevices();
      } catch (error) {
        console.warn('Error during SignalR cleanup:', error);
      }
    };
  }, []); // Empty dependency array - only run once

  // Set up widget-specific SignalR event listeners
  useEffect(() => {
    if (!widgetInstances || widgetInstances.length === 0) {
      return; // No cleanup needed if no widgets
    }

    // Handle widget data updates from SignalR (STREAMING/INCREMENTAL UPDATES)
    const handleWidgetDataUpdate = (data) => {
      if (data && data.widgetId) {
        const widget = widgetInstances.find(w => w.id === data.widgetId);
        const widgetType = widget?.widgetType || widget?.template?.widgetType;
        const isIncrementalWidget = shouldUseIncrementalLoading(widget);

        setWidgetData(prev => {
          const existingWidgetData = prev[data.widgetId];

          if (isIncrementalWidget && data.updateType !== 'full') {
            // For widgets in live mode, append incremental data
            const updatedData = appendIncrementalData(existingWidgetData, data.data, widgetType);
            console.log(`[Live Widget ${data.widgetId}] Appending incremental data`, {
              widgetType: widgetType,
              existingDataSize: existingWidgetData?.chartData?.length || existingWidgetData?.data?.length || 0,
              newDataSize: data.data?.chartData?.length || data.data?.data?.length || 0,
              totalSize: updatedData?.chartData?.length || updatedData?.data?.length || 0
            });

            return {
              ...prev,
              [data.widgetId]: {
                ...updatedData,
                lastUpdated: data.timestamp || new Date().toISOString(),
                isIncremental: true,
                updateType: data.updateType || 'incremental'
              }
            };
          } else {
            // For non-live widgets or full updates, replace data as usual
            return {
              ...prev,
              [data.widgetId]: {
                ...data.data,
                lastUpdated: data.timestamp || new Date().toISOString(),
                updateType: data.updateType || 'full'
              }
            };
          }
        });

        // Clear any loading states and errors
        setWidgetLoadingStates(prev => ({ ...prev, [data.widgetId]: false }));
        setWidgetErrors(prev => ({ ...prev, [data.widgetId]: null }));
      }
    };

    // Handle enhanced widget data updates from new DataSourceManager
    const handleEnhancedWidgetDataUpdate = (data) => {
      if (data && data.widgetInstanceId) {
        setWidgetData(prev => ({
          ...prev,
          [data.widgetInstanceId]: {
            ...data.data,
            lastUpdated: data.timestamp || new Date().toISOString(),
            isLiveData: data.isLiveData || false,
            metadata: data.metadata
          }
        }));

        setWidgetLoadingStates(prev => ({ ...prev, [data.widgetInstanceId]: false }));
        setWidgetErrors(prev => ({ ...prev, [data.widgetInstanceId]: null }));
      }
    };

    // Handle data source updates (for direct data source subscriptions)
    const handleDataSourceUpdate = (data) => {
      if (data && data.dataSource) {
        // Update all widgets that use this data source
        const affectedWidgets = widgetInstances.filter(w =>
          w.template?.dataSource === data.dataSource
        );

        affectedWidgets.forEach(widget => {
          setWidgetData(prev => ({
            ...prev,
            [widget.id]: {
              ...data.data,
              lastUpdated: data.timestamp || new Date().toISOString(),
              dataSource: data.dataSource,
              metadata: data.metadata
            }
          }));
        });
      }
    };

    // Handle metric data updates (from live broadcast service)
    const handleMetricDataUpdate = (data) => {
      if (data && data.dataSource) {
        // Find widgets that use this data source
        const affectedWidgets = widgetInstances.filter(w =>
          w.template?.dataSource === data.dataSource
        );

        affectedWidgets.forEach(widget => {
          // Only update if widget is in live mode
          try {
            const config = JSON.parse(widget.configurationJson || '{}');
            if (config.mode === 'live') {
              setWidgetData(prev => ({
                ...prev,
                [widget.id]: {
                  ...data.data,
                  lastUpdated: data.timestamp || new Date().toISOString(),
                  isLiveUpdate: true
                }
              }));

              setWidgetLoadingStates(prev => ({ ...prev, [widget.id]: false }));
            }
          } catch (e) {
            console.warn('Failed to parse widget config for live update:', e);
          }
        });
      }
    };

    // Handle initial widget data response (INITIAL DATA LOAD)
    const handleInitialWidgetDataResponse = (data) => {
      if (data && data.widgetInstanceId) {
        if (data.error) {
          setWidgetErrors(prev => ({
            ...prev,
            [data.widgetInstanceId]: data.error
          }));
        } else {
          const widget = widgetInstances.find(w => w.id === data.widgetInstanceId);
          const widgetType = widget?.widgetType || widget?.template?.widgetType;

          console.log(`[Initial Data] Loading widget ${data.widgetInstanceId} (${widgetType})`, {
            isChart: isChartWidget(widgetType),
            dataPoints: data.data?.chartData?.length || 0
          });

          // For initial data load, always replace existing data (fresh start)
          setWidgetData(prev => ({
            ...prev,
            [data.widgetInstanceId]: {
              ...data.data,
              lastUpdated: data.timestamp || new Date().toISOString(),
              metadata: data.metadata,
              isInitialLoad: true
            }
          }));
        }

        setWidgetLoadingStates(prev => ({ ...prev, [data.widgetInstanceId]: false }));
      }
    };    const handleError = (error) => {
      console.error('SignalR error:', error);
      setConnectionStatus('error');
    };

    // Register ONLY widget-specific event listeners (not basic ones)
    const unsubscribeWidgetData = signalRService.on('widgetDataUpdate', handleWidgetDataUpdate);
    const unsubscribeEnhancedWidgetData = signalRService.on('enhancedWidgetDataUpdate', handleEnhancedWidgetDataUpdate);
    const unsubscribeDataSourceUpdate = signalRService.on('dataSourceUpdate', handleDataSourceUpdate);
    const unsubscribeMetricDataUpdate = signalRService.on('metricDataUpdate', handleMetricDataUpdate);
    const unsubscribeInitialWidgetData = signalRService.on('initialWidgetDataResponse', handleInitialWidgetDataResponse);
    const unsubscribeErrors = signalRService.on('error', handleError);

    // Cleanup widget-specific handlers
    return () => {
      try {
        unsubscribeWidgetData && unsubscribeWidgetData();
        unsubscribeEnhancedWidgetData && unsubscribeEnhancedWidgetData();
        unsubscribeDataSourceUpdate && unsubscribeDataSourceUpdate();
        unsubscribeMetricDataUpdate && unsubscribeMetricDataUpdate();
        unsubscribeInitialWidgetData && unsubscribeInitialWidgetData();
        unsubscribeErrors && unsubscribeErrors();
      } catch (error) {
        console.warn('Error during widget-specific SignalR cleanup:', error);
      }
    };
  }, [widgetInstances, shouldUseIncrementalLoading, appendIncrementalData, isChartWidget]);

  // Hybrid function to fetch widget data using SignalR (primary) + REST API (fallback)
  const fetchWidgetDataFromDataSource = useCallback(async (widgetInstanceId, widget, config) => {
    try {
      console.log(`[Widget] Fetching data for widget ${widgetInstanceId} using Hybrid approach`);

      // Extract data source from widget template or configuration
      const dataSource = widget.template?.dataSource || widget.dataSource || config.dataSource;
      if (!dataSource) {
        throw new Error('No data source specified for widget');
      }

      // Determine data loading strategy - prioritize SignalR when REST API is unreliable
      const isSignalRConnected = signalRService.getConnectionStatus();
      const connectionDetails = signalRService.getDetailedConnectionStatus();

      console.log(`[Widget] Connection details for widget ${widgetInstanceId}:`, connectionDetails);

      // Use SignalR first if connected, regardless of mode (since REST API is timing out)
      const useSignalR = isSignalRConnected;
      const strategy = useSignalR ? 'SignalR-First' : 'REST-API-Fallback';

      console.log(`[Widget] Strategy for widget ${widgetInstanceId}: ${strategy} (SignalR connected: ${isSignalRConnected})`);

      if (useSignalR) {
        // PRIMARY: Use SignalR two-phase loading for live widgets
        console.log(`[Widget] Using SignalR two-phase loading for widget ${widgetInstanceId}`);

        const isLiveWidget = shouldUseIncrementalLoading(widget);

        // Set up one-time listener for this specific widget response
        const responseHandler = (data) => {
          if (data.widgetId === widgetInstanceId || data.widgetInstanceId === widgetInstanceId) {
            console.log(`[Widget] Received SignalR data for widget ${widgetInstanceId}:`, data);

            if (data.error) {
              setWidgetErrors(prev => ({
                ...prev,
                [widgetInstanceId]: data.error
              }));
            } else {
              setWidgetData(prev => ({
                ...prev,
                [widgetInstanceId]: {
                  ...data.data,
                  lastUpdated: new Date().toISOString(),
                  dataSource: dataSource,
                  isFromSignalR: true,
                  isLiveData: data.isLiveData || true
                }
              }));

              // Clear any previous errors
              setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: null }));
            }
          }
        };

        // Subscribe to widget updates for ongoing streaming
        try {
          signalRService.on('widgetDataUpdate', responseHandler);

          // Subscribe to live updates for this widget
          await signalRService.subscribeToWidget(widgetInstanceId);

          // PHASE 1: Request INITIAL aggregate/historical data first
          console.log(`[Widget ${widgetInstanceId}] Phase 1: Requesting initial aggregate data (${isLiveWidget ? 'live mode' : 'static mode'})`);
          await signalRService.requestInitialWidgetData(widgetInstanceId);

          // PHASE 2: For live widgets, set up streaming for incremental updates
          if (isLiveWidget) {
            console.log(`[Live Widget ${widgetInstanceId}] Phase 2: Setting up streaming for incremental updates`);

            // Subscribe to enhanced widget streaming with configuration
            const streamingOptions = {
              mode: 'live',
              updateInterval: 30000, // 30 seconds
              incrementalOnly: true // Only send new data points, not full dataset
            };

            await signalRService.connection.invoke('SubscribeToEnhancedWidgetStreaming',
              widgetInstanceId, streamingOptions);
          } else {
            console.log(`[Static Widget ${widgetInstanceId}] No streaming needed for cumulative mode`);
          }

          // Request widget data via SignalR with retry logic (fallback if initial load fails)
          let retryCount = 0;
          const maxRetries = 2;

          const requestWithRetry = async () => {
            try {
              // Send widget configuration along with the request
              const requestPayload = {
                widgetInstanceId: widgetInstanceId,
                configuration: {
                  mode: config.mode || 'cumulative',
                  datePreset: config.datePreset || 'yesterday',
                  sitesMode: config.sitesMode || 'all',
                  siteIds: config.siteIds || [],
                  vehicleIds: config.vehicleIds || [],
                  vehicleTypeIds: config.vehicleTypeIds || [],
                  intervalHours: config.intervalHours || 1,
                  // Include settings if available (for nested configuration)
                  settings: config.settings || {}
                }
              };

              await signalRService.connection.invoke('RequestWidgetData', requestPayload);
              console.log(`[Widget] SignalR request sent for widget ${widgetInstanceId} with config:`, requestPayload);
            } catch (invokeError) {
              retryCount++;
              if (retryCount < maxRetries) {
                console.log(`[Widget] SignalR request failed, retrying... (${retryCount}/${maxRetries})`);
                setTimeout(() => requestWithRetry(), 1000 * retryCount);
              } else {
                throw invokeError;
              }
            }
          };

          await requestWithRetry();

          // REMOVED: Aggressive 3-second timeout fallback that was causing REST API calls
          // Let SignalR handle the response naturally without forcing REST API fallback
          console.log(`[Widget] SignalR request sent for widget ${widgetInstanceId}, waiting for response...`);

        } catch (signalRError) {
          console.warn(`[Widget] SignalR error for widget ${widgetInstanceId}:`, signalRError);
          setWidgetErrors(prev => ({
            ...prev,
            [widgetInstanceId]: `SignalR error: ${signalRError.message}`
          }));
        }

      } else {
        // DISABLED: REST API fallback removed - use SignalR only
        console.log(`[Widget] SignalR not connected for widget ${widgetInstanceId}, waiting for connection...`);
        setWidgetErrors(prev => ({
          ...prev,
          [widgetInstanceId]: 'SignalR not connected. Please wait for connection...'
        }));
      }

    } catch (error) {
      console.error(`Error in SignalR-only data fetch for widget ${widgetInstanceId}:`, error);
      setWidgetErrors(prev => ({
        ...prev,
        [widgetInstanceId]: error.message || 'Data fetch error'
      }));
    }
  }, [shouldUseIncrementalLoading]);

  // Helper function to determine optimal data loading strategy
  const getOptimalDataLoadingStrategy = useCallback((config, dataSource) => {
    const isSignalRConnected = signalRService.getConnectionStatus();
    const isRealTimeDataSource = ['fuel_dispense', 'fuel_dispensed', 'engine_hours', 'km_travel', 'fuel_used_gps', 'fuel_lost_gps'].includes(dataSource);

    // Prioritize SignalR when connected due to REST API timeout issues
    const useSignalR = isSignalRConnected;
    const strategy = useSignalR ? 'SignalR-First' : 'REST-API-Only';

    return {
      useSignalR: useSignalR,
      useRestApi: !isSignalRConnected, // Only use REST API if SignalR not available
      isOptimalForRealTime: isSignalRConnected && isRealTimeDataSource,
      strategy: strategy,
      fallbackAvailable: true,
      reason: isSignalRConnected ? 'SignalR available - avoiding REST API timeouts' : 'SignalR not connected - using REST API'
    };
  }, []);  // Helper function to setup live widget subscription for ongoing updates
  const setupLiveWidgetSubscription = useCallback(async (widgetInstanceId, dataSource) => {
    if (signalRService.getConnectionStatus()) {
      try {
        // Subscribe to live updates for this widget
        await signalRService.subscribeToWidget(widgetInstanceId);

        // Also subscribe to data source updates
        await signalRService.subscribeToMetric(dataSource);

        console.log(`[Widget] Setup live subscription for widget ${widgetInstanceId} (${dataSource})`);
      } catch (error) {
        console.warn(`[Widget] Failed to setup live subscription for widget ${widgetInstanceId}:`, error);
      }
    }
  }, []);

  // Fetch data for a specific widget
  const fetchWidgetData = useCallback(async (widgetInstanceId) => {
    try {
      // Set loading state
      setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: true }));
      setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: null }));

      // Find widget configuration
      const widget = widgetInstances.find(w => w.id === widgetInstanceId);
      if (!widget) {
        setWidgetErrors(prev => ({ ...prev, [widgetInstanceId]: 'Widget not found' }));
        return;
      }

      // Parse widget configuration
      let config = {};
      try {
        config = JSON.parse(widget.configurationJson || '{}');
      } catch (e) {
        console.warn('Failed to parse widget configuration:', e);
      }

      const mode = config.mode || 'cumulative';
      const dataSource = widget.template?.dataSource || widget.dataSource || config.dataSource;

      // Get optimal data loading strategy
      const strategy = getOptimalDataLoadingStrategy(config, dataSource);
      console.log(`[Widget] Strategy for widget ${widgetInstanceId}:`, strategy);

      // Use hybrid approach - primary method based on strategy
      await fetchWidgetDataFromDataSource(widgetInstanceId, widget, config);

      // After initial load, setup live subscription if optimal for real-time
      if (strategy.isOptimalForRealTime && dataSource) {
        await setupLiveWidgetSubscription(widgetInstanceId, dataSource);
      }

      // For live mode widgets, also set up streaming using DataSourceService if SignalR fails
      if (mode === 'live') {
        try {
          // Extract data source from widget
          const dataSource = widget.template?.dataSource || widget.dataSource || config.dataSource;

          if (dataSource) {
            // Start streaming using DataSourceService
            const streamId = await dataSourceService.startStreaming(
              dataSource,
              (streamData) => {
                // Handle streaming data updates
                if (streamData && streamData.success) {
                  setWidgetData(prev => ({
                    ...prev,
                    [widgetInstanceId]: {
                      ...streamData.data,
                      lastUpdated: new Date().toISOString(),
                      isLiveStream: true,
                      streamId: streamId
                    }
                  }));
                  setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: false }));
                }
              },
              {
                refreshInterval: 30000, // 30 seconds
                enableLiveData: true,
                retryOnError: true
              }
            );

            // Track the stream in our ref for cleanup
            activeStreamsRef.current.set(widgetInstanceId, streamId);

            // Store stream ID for cleanup
            setWidgetData(prev => ({
              ...prev,
              [widgetInstanceId]: {
                loading: true,
                isLive: true,
                streamId: streamId,
                lastUpdated: new Date().toISOString()
              }
            }));

            console.log(`Set up streaming for widget ${widgetInstanceId} with stream ID: ${streamId}`);
          } else {
            console.warn(`No data source found for widget ${widgetInstanceId}, falling back to API`);
            await fetchWidgetDataFromDataSource(widgetInstanceId, widget, config);
          }

        } catch (error) {
          console.warn('Failed to set up streaming, falling back to data source API:', error);
          // Fallback to DataSourceService API call
          await fetchWidgetDataFromDataSource(widgetInstanceId, widget, config);
        }
      } else {
        // For cumulative/historical data, use DataSourceService API
        await fetchWidgetDataFromDataSource(widgetInstanceId, widget, config);
      }

    } catch (error) {
      console.error(`Error setting up data for widget ${widgetInstanceId}:`, error);
      setWidgetErrors(prev => ({
        ...prev,
        [widgetInstanceId]: error.message || 'Setup error'
      }));
    } finally {
      setWidgetLoadingStates(prev => ({ ...prev, [widgetInstanceId]: false }));
    }
  }, [widgetInstances, fetchWidgetDataFromDataSource, getOptimalDataLoadingStrategy, setupLiveWidgetSubscription]);

  // Load widget instances from backend
  useEffect(() => {
    const loadWidgetInstances = async () => {
      try {
        setInstancesLoading(true);
        const result = await dashboardService.getWidgetInstances();
        if (result.success && result.data) {
          setWidgetInstances(result.data);

          // Initialize loading states for each widget
          const loadingStates = {};
          result.data.forEach(widget => {
            loadingStates[widget.id] = true;
          });
          setWidgetLoadingStates(loadingStates);

          // Note: Widget data fetching will be handled by separate effect
          // to avoid dependency issues

          // Sync widget instances to widgetConfig format for StatsCards
          const syncedConfig = {
            key_statistics: [],
            system_alerts: [],
            performance_metrics: [],
            issue_tracking: [],
            tank_levels: [],
            pump_status: []
          };

          // Map widget instances to widgetConfig format
          result.data.forEach(instance => {
            const category = instance.category || 'key_statistics';
            if (syncedConfig[category]) {
              // Convert widget instance to widgetConfig format
              const widgetConfigItem = {
                id: instance.id.toString(),
                label: instance.customName || instance.name || 'Unnamed Widget',
                enabled: instance.enabled !== false, // Default to true if not specified
                templateId: instance.templateId,
                customName: instance.customName,
                positionX: instance.positionX || 0,
                positionY: instance.positionY || 0,
                width: instance.width || 4,
                height: instance.height || 3,
                settings: instance.settings || {},
                filters: instance.filters || {},
                visualizationType: instance.visualizationType || 'default',
                // Legacy fields for backward compatibility
                category: category,
                metric: instance.settings?.dataSource || instance.metric || 'fuel_dispense',
                name: instance.customName || instance.name,
                mode: instance.settings?.defaultMode || instance.mode || 'live',
                datePreset: instance.settings?.defaultDatePreset || instance.datePreset || 'today',
                sitesMode: instance.filters?.sitesMode || instance.sitesMode || 'all',
                siteIds: instance.filters?.siteIds || instance.siteIds || []
              };

              syncedConfig[category].push(widgetConfigItem);
            }
          });

          // Update widgetConfig state
          setWidgetConfig(syncedConfig);

          console.log('Loaded and synced widget instances:', result.data);
          console.log('Synced widget config:', syncedConfig);
        } else {
          console.error('Failed to load widget instances:', result.message);
        }
      } catch (error) {
        console.error('Error loading widget instances:', error);
      } finally {
        setInstancesLoading(false);
      }
    };

    if (isAuthenticated && currentUser) {
      loadWidgetInstances();
    }
  }, [isAuthenticated, currentUser]);

  // Separate effect to load widget data after instances are loaded
  useEffect(() => {
    const currentStreams = activeStreamsRef.current;

    if (widgetInstances.length > 0) {
      widgetInstances.forEach(widget => {
        fetchWidgetData(widget.id);
      });
    }

    // Cleanup function to stop streams when widgets change
    return () => {
      // Stop all active streams when widgets change
      currentStreams.forEach((streamId, widgetId) => {
        dataSourceService.stopStreaming(streamId)
          .catch(error => console.warn(`Error stopping stream for widget ${widgetId}:`, error));
      });
      currentStreams.clear();
    };
  }, [widgetInstances, fetchWidgetData]);

  // Cleanup all streams when component unmounts
  useEffect(() => {
    return () => {
      dataSourceService.stopAllStreams()
        .catch(error => console.warn('Error stopping all streams on unmount:', error));
    };
  }, []);

  // Handle widget refresh
  const handleRefreshWidget = useCallback(async (widgetInstanceId) => {
    console.log(`[Hybrid] Refreshing widget ${widgetInstanceId} using hybrid approach`);

    // Stop existing stream if any
    const existingStreamId = activeStreamsRef.current.get(widgetInstanceId);
    if (existingStreamId) {
      try {
        await dataSourceService.stopStreaming(existingStreamId);
        activeStreamsRef.current.delete(widgetInstanceId);
        console.log(`[Hybrid] Stopped existing stream ${existingStreamId} for widget ${widgetInstanceId}`);
      } catch (error) {
        console.warn('Error stopping existing stream during refresh:', error);
      }
    }

    // Fetch fresh data using hybrid approach
    await fetchWidgetData(widgetInstanceId);
  }, [fetchWidgetData]);

  // Handle widget configuration changes
  const handleConfigChange = useCallback((widget) => {
    console.log('Configure widget:', widget);
    setWidgetConfigOpen(true);
  }, []);

  // Handle edit mode completion and save
  const handleEditModeComplete = useCallback(async (layoutData) => {
    try {
      // Update Redux store with new layout data
      dispatch(updateDashboardLayout(layoutData));

      // Exit edit mode
      setIsEditMode(false);

      console.log('Edit mode completed, layout saved:', layoutData);
    } catch (error) {
      console.error('Error completing edit mode:', error);
    }
  }, [dispatch]);

  // Handle layout settings change
  const handleLayoutSettingsChange = useCallback((newLayoutSettings) => {
    setLayoutSettings(newLayoutSettings);
    // Save to localStorage
    localStorage.setItem('fms_dashboard_layouts', JSON.stringify(newLayoutSettings));
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

  // Load sites data
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axiosInstance.get('/site/getsitebyuserid');
        const data = Array.isArray(response.data) ? response.data : [];
        setSites(data.map((s, idx) => ({
          id: s.id || s.siteId || idx,
          name: s.name || s.siteName || `Site ${idx + 1}`
        })));
      } catch (error) {
        console.error('Error loading sites:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      fetchSites();
    }
  }, [isAuthenticated, currentUser]);

  // Load dashboard layout from Redux
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      dispatch(loadDashboardLayout());
    }
  }, [isAuthenticated, currentUser, dispatch]);

  // Debug function to test hybrid approach (can be called from browser console)
  React.useEffect(() => {
    window.testHybridApproach = (widgetInstanceId) => {
      console.log('=== SIGNALR-FIRST HYBRID APPROACH TEST ===');
      console.log(`Testing widget ${widgetInstanceId}`);

      const connectionDetails = signalRService.getDetailedConnectionStatus();
      console.log('SignalR Connection Details:', connectionDetails);

      const widget = widgetInstances.find(w => w.id === parseInt(widgetInstanceId));
      if (widget) {
        let config = {};
        try {
          config = JSON.parse(widget.configurationJson || '{}');
        } catch (e) {
          config = {};
        }

        const strategy = getOptimalDataLoadingStrategy(config, widget.template?.dataSource);
        console.log('Strategy:', strategy);
        console.log('Widget config:', config);
        console.log('Widget data source:', widget.template?.dataSource);

        console.log('--- Starting widget refresh with SignalR-first approach ---');
        handleRefreshWidget(parseInt(widgetInstanceId));
      } else {
        console.log('Widget not found. Available widgets:', widgetInstances.map(w => ({ id: w.id, name: w.customName || w.name })));
      }
    };

    // Also add a function to force SignalR connection
    window.forceSignalRConnection = async () => {
      console.log('=== FORCING SIGNALR CONNECTION ===');
      try {
        const result = await signalRService.ensureConnection();
        console.log('Connection result:', result);
        console.log('Connection details:', signalRService.getDetailedConnectionStatus());
      } catch (error) {
        console.error('Failed to force SignalR connection:', error);
      }
    };

    // Test direct SignalR request
    window.testDirectSignalR = async (widgetInstanceId) => {
      console.log('=== DIRECT SIGNALR REQUEST TEST ===');
      try {
        await signalRService.requestWidgetData(parseInt(widgetInstanceId));
        console.log(`Direct SignalR request sent for widget ${widgetInstanceId}`);
      } catch (error) {
        console.error('Direct SignalR request failed:', error);
      }
    };
  }, [widgetInstances, getOptimalDataLoadingStrategy, handleRefreshWidget]);  // Update widget configuration
  const updateWidgetConfig = useCallback((category, items) => {
    setWidgetConfig(prev => ({ ...prev, [category]: items }));
  }, []);

  // Update metric filters
  const updateMetricFilter = useCallback((categoryKey, metricKey, partial) => {
    setMetricFilters(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [metricKey]: { ...prev[categoryKey][metricKey], ...partial }
      }
    }));
  }, []);

  // Duplicate fuel widget
  const duplicateTodayFuel = useCallback(() => {
    setWidgetConfig(prev => {
      const list = prev.key_statistics;
      const existingIds = list.filter(i => i.id.startsWith('today_fuel')).map(i => i.id);
      let idx = 2;
      while (existingIds.includes(`today_fuel_${idx}`)) idx++;
      const newId = `today_fuel_${idx}`;
      return {
        ...prev,
        key_statistics: [...list, {
          id: newId,
          label: `Today Fuel Dispensed (Live) ${idx}`,
          enabled: true
        }]
      };
    });

    setMetricFilters(prev => {
      const ks = { ...(prev.key_statistics || {}) };
      let idx = 2;
      while (ks[`fuel_dispense_${idx}`]) idx++;
      ks[`fuel_dispense_${idx}`] = {
        mode: 'live',
        datePreset: 'today',
        sitesMode: 'all',
        siteIds: []
      };
      return { ...prev, key_statistics: ks };
    });
  }, []);

  // Get filtered modules based on role
  const getFilteredModules = useCallback(() => {
    return roleConfig.modules
      .filter(module => {
        if (primaryRole === 'admin') return true;
        if (primaryRole === 'management') {
          return !['User Management', 'System Configuration', 'Audit Logs', 'Database Management'].includes(module.name);
        }
        if (primaryRole === 'user') {
          return !['User Management', 'System Configuration', 'Audit Logs', 'Database Management', 'Financial Dashboard'].includes(module.name);
        }
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [roleConfig.modules, primaryRole]);

  // Previous day totals (mock data)
  const previousDayTotals = useCallback(() => ({
    consumption: 1543.2,
    hours: 89.5,
    distance: 1240,
  }), []);

  // Check widget permissions
  const canViewWidget = useCallback((widgetName) => {
    return roleConfig.widgets.includes(widgetName);
  }, [roleConfig.widgets]);

  // Test function for debugging widget data requests
  const testWidgetDataRequest = useCallback(async (widgetId) => {
    console.log(`Testing widget data request for widget ID: ${widgetId}`);

    try {
      // Attempt to get widget data through SignalR
      await signalRService.connection.invoke('RequestWidgetData', parseInt(widgetId));
      console.log(`Widget data request sent for ID: ${widgetId}`);
    } catch (error) {
      console.error(`Error testing widget data request for ID ${widgetId}:`, error);
    }
  }, []);

  // Loading state
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Loading Real-time Dashboard...</h1>
          <p>Please wait while we establish connection and load your dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-dashboard-container">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionStatus}`}>
        <div className="status-indicator">
          <i className={`fa-solid fa-${connectionStatus === 'connected' ? 'wifi' : connectionStatus === 'error' ? 'exclamation-triangle' : 'wifi-slash'}`}></i>
        </div>
        <span className="status-text">
          {connectionStatus === 'connected' ? 'Live Updates Active' :
           connectionStatus === 'error' ? 'Connection Error' :
           'Connecting...'}
        </span>
        {connectionInfo && (
          <span className="connection-details">
            {connectionInfo.connectionId ? `ID: ${connectionInfo.connectionId.substring(0, 8)}...` : ''}
          </span>
        )}
      </div>

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">
            <i className="fa-solid fa-gauge-high"></i>
            Hyoung FMS Real-time Dashboard
          </h1>
          <div className="role-badge" style={{ backgroundColor: roleConfig.color }}>
            <i className="fa-solid fa-user"></i>
            <span>{roleConfig.name}</span>
            <span className="role-user">({currentUser.userName})</span>
          </div>
        </div>
      </div>

      {/* Debug Test Section - Remove in production */}
      <div style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '5px',
        margin: '10px 0',
        fontSize: '12px'
      }}>
        <strong>Debug Test Controls:</strong>
        <div style={{ marginTop: '5px' }}>
          <input
            type="number"
            placeholder="Widget ID"
            id="testWidgetId"
            style={{
              width: '80px',
              padding: '2px 5px',
              marginRight: '5px',
              fontSize: '12px'
            }}
          />
          <button
            onClick={() => {
              const widgetId = document.getElementById('testWidgetId').value;
              if (widgetId) {
                testWidgetDataRequest(widgetId);
              } else {
                alert('Please enter a widget ID');
              }
            }}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Test Widget Request
          </button>
          <span style={{ marginLeft: '10px', color: '#666' }}>
            Check console for results
          </span>
        </div>
        <div style={{ marginTop: '5px' }}>
          <span style={{ fontSize: '11px', color: '#666' }}>Quick Tests: </span>
          {[16, 17, 18].map(id => (
            <button
              key={id}
              onClick={() => testWidgetDataRequest(id)}
              style={{
                padding: '1px 4px',
                fontSize: '10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                marginLeft: '2px'
              }}
            >
              Test {id}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {canViewWidget('quickActions') && (
        <div className="quick-actions-ticker">
          <QuickActionButtons role={primaryRole} userPermissions={roleConfig.permissions} />
        </div>
      )}


      {/* Key Statistics */}
      {canViewWidget('stats') && (
        <>
          <h2 className="section-title">
            <span>
              <i className="fa-solid fa-chart-line"></i>
              Key Statistics
            </span>
            <div className="section-controls">
              <Button
                onClick={() => setWidgetConfigOpen(true)}
                stylingMode="outlined"
                type="default"
                icon="preferences"
                className="config-button"
                text="Configure"
              />
              {connectionStatus === 'connected' && (
                <span className="live-indicator">
                  <i className="fa-solid fa-circle"></i>
                  Live
                </span>
              )}
            </div>
          </h2>
          <StatsCards
            pdTotals={previousDayTotals()}
            stats={stats}
            filterConfig={widgetConfig.key_statistics}
            filters={{}}
            sites={sites}
            metricFilters={metricFilters}
            realtimeData={realtimeData}
          />
        </>
      )}


      {/* Enhanced Widget Instances */}
      <div className="enhanced-widgets-section">
        <div className="section-header">
          <h2 className="section-title">
            <span>
              <i className="fa-solid fa-cubes"></i>
              Enhanced Widgets
              {instancesLoading && <span className="tw-text-sm tw-text-gray-500">(Loading...)</span>}
            </span>
          </h2>
          <div className="section-controls">
            <Button
              text={isEditMode ? "Done Editing" : "Edit Layout"}
              icon={isEditMode ? "fa-solid fa-check" : "fa-solid fa-edit"}
              type={isEditMode ? "default" : "normal"}
              stylingMode="contained"
              height={32}
              onClick={() => setIsEditMode(!isEditMode)}
            />
            <Button
              text="Add Widget"
              icon="fa-solid fa-plus"
              type="default"
              stylingMode="contained"
              height={32}
              onClick={() => setWidgetConfigOpen(true)}
            />
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-p-3 tw-rounded tw-mb-4">
            <div className="tw-text-xs tw-text-yellow-800">
              <strong>Debug Info:</strong>
              Widget Instances: {widgetInstances.length},
              Loading: {instancesLoading.toString()},
              Authenticated: {isAuthenticated.toString()},
              Active Streams: {activeStreamsRef.current.size},
              Data Source Service Stats: {JSON.stringify(dataSourceService.getStreamingStats())}
            </div>
          </div>
        )}



        {widgetInstances && widgetInstances.length > 0 ? (
          <CategoryGroupedWidgetRenderer
            widgets={widgetInstances}
            widgetData={widgetData}
            isLoading={widgetLoadingStates}
            errors={widgetErrors}
            onRefresh={handleRefreshWidget}
            onConfigChange={handleConfigChange}
            isEditMode={isEditMode}
            onEditModeComplete={handleEditModeComplete}
            layoutSettings={layoutSettings}
            onLayoutSettingsChange={handleLayoutSettingsChange}
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



      {/* System Modules */}
      {canViewWidget('systemModules') && (
        <>
          <h2 className="section-title">
            <i className="fa-solid fa-cubes"></i>
            System Modules
          </h2>
          <SystemModules modules={getFilteredModules()} />
        </>
      )}

      {/* Configuration Modals */}
      <WidgetConfigModal
        open={widgetConfigOpen}
        onClose={() => setWidgetConfigOpen(false)}
        onWidgetAdded={async (newWidget) => {
          // Reload widget instances when a new widget is created
          try {
            setInstancesLoading(true);
            const result = await dashboardService.getWidgetInstances();
            const data = result?.data || result;
            setWidgetInstances(Array.isArray(data) ? data : (data?.items || []));
            console.log('Widget instances reloaded after creation:', data);
          } catch (error) {
            console.error('Error reloading widget instances:', error);
          } finally {
            setInstancesLoading(false);
          }
        }}
        onWidgetUpdated={async (updatedWidget) => {
          // Reload widget instances when a widget is updated
          try {
            setInstancesLoading(true);
            const result = await dashboardService.getWidgetInstances();
            const data = result?.data || result;
            setWidgetInstances(Array.isArray(data) ? data : (data?.items || []));
          } catch (error) {
            console.error('Error reloading widget instances:', error);
          } finally {
            setInstancesLoading(false);
          }
        }}
        onWidgetDeleted={async (deletedWidgetId) => {
          // Remove the widget from local state
          setWidgetInstances(prev => prev.filter(w => w.id !== deletedWidgetId));
        }}
      />

      <WidgetVisibilityModal
        open={widgetVisibilityOpen}
        onClose={() => setWidgetVisibilityOpen(false)}
        category="key_statistics"
        widgetConfig={widgetConfig}
        metricFilters={metricFilters}
        onDuplicateFuel={duplicateTodayFuel}
        onUpdateWidgetConfig={updateWidgetConfig}
        onUpdateMetricFilter={updateMetricFilter}
      />
    </div>
  );
}
