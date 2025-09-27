import { HubConnectionBuilder, LogLevel, HubConnectionState, HttpTransportType } from '@microsoft/signalr';
import { debounce } from 'lodash';
import store from '../store';

// Connection state enum
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
  PAUSED: 'paused'
};

// Error types
export const SignalRError = {
  CONNECTION_FAILED: 'connection_failed',
  RECONNECTION_FAILED: 'reconnection_failed',
  HANDLER_ERROR: 'handler_error',
  AUTHENTICATION_FAILED: 'authentication_failed'
};

// Create dynamic debounce functions based on current state
const createDynamicDebouncedHandler = (handlerFn, defaultDebounceMs = 500) => {
  let currentDebounceMs = defaultDebounceMs;
  let debouncedFn = debounce((args) => {
    handlerFn(args);
  }, currentDebounceMs);

  const handler = (...args) => {
    const state = store.getState();
    const { isLiveDataEnabled = true, updateFrequency = 1 } = state.dashboard || {};

    const minUpdateFrequency = 1000;
    const actualFrequency = Math.max(
      minUpdateFrequency,
      updateFrequency * 1000
    );

    if (isLiveDataEnabled) {
      debouncedFn(...args);
    } else {
      console.log('[Dashboard SignalR] Live data disabled');
    }
  };

  return handler;
};

/**
 * Dashboard SignalR Service
 * Handles dashboard-specific real-time updates
 */
class DashboardSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.listeners = new Map();
    this.handlers = new Map();
    this._isStarting = false; // guard against concurrent start()
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.healthCheckInterval = null;
    this.lastSuccessfulHealthCheck = null;
    this.lastMetricsUpdate = null;
  this.hasReceivedInitialBatch = false; // gate streaming until initial batch arrives

    // Protocol negotiation state (for envelope v2 support)
    this.protocol = {
      version: 1,
      serverVersion: 1,
      legacySuppressed: false,
      features: [],
      negotiated: false,
      telemetry: null
    };

    // Optional override flag (QA / fallback) force legacy handling
    this.forceLegacy = localStorage.getItem('forceLegacy') === 'true';
  }

  /**
   * Safely invoke a hub method with lightweight handling for transient closure
   * Returns true if the invoke succeeded, false if skipped/failed due to connection issues
   */
  async invokeSafe(methodName, ...args) {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      return false;
    }
    try {
      await this.connection.invoke(methodName, ...args);
      return true;
    } catch (err) {
      const msg = err?.message || '';
      // Swallow transient cancellations that happen when the connection is closing
      if (/invocation canceled/i.test(msg) || /underlying connection.*closed/i.test(msg)) {
        console.debug(`[Dashboard SignalR] invokeSafe: ${methodName} canceled during close; retrying once...`);
        // Small delay then one retry if connected again
        await new Promise(r => setTimeout(r, 500));
        if (this.connection && this.connection.state === HubConnectionState.Connected) {
          try {
            await this.connection.invoke(methodName, ...args);
            return true;
          } catch (retryErr) {
            console.warn(`[Dashboard SignalR] invokeSafe retry failed for ${methodName}:`, retryErr);
            return false;
          }
        }
        return false;
      }
      throw err;
    }
  }

  // Getter for connection state
  get state() {
    return this.connectionState;
  }

  // Setter for connection state with logging
  set state(newState) {
    this.connectionState = newState;
    console.log(`[Dashboard SignalR] State: ${newState}`);
  }

  // Getter for isConnected compatibility
  get isConnected() {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Get authentication token for SignalR connection
   * @returns {string|null} Bearer token or null
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Get base URL for SignalR connection
   * @returns {string} Base URL
   */
  getBaseUrl() {
    // Use the same environment variable pattern as axiosInstance
    const candidates = [
      process.env.REACT_APP_API_URL,
      process.env.REACT_APP_FMS_API_URL,
      process.env.REACT_APP_PUBLIC_FMS_API_URL,
      process.env.REACT_APP_FMS_API_URL_DEV,
      process.env.REACT_APP_FMS_API_URL_PROD,
      process.env.REACT_APP_SIGNALR_URL
    ].filter(Boolean);

    let baseUrl = candidates[0];

    if (!baseUrl) {
      // Fallback to window origin
      baseUrl = window.location.origin;
      console.warn(`SignalR base URL not configured via env. Falling back to ${baseUrl}`);
    }

    // Remove /api suffix if present for SignalR hubs
    if (baseUrl.endsWith('/api') || baseUrl.endsWith('/api/')) {
      baseUrl = baseUrl.replace(/\/api\/?$/, '');
    }

    return baseUrl;
  }

  /**
   * Initialize and start the SignalR connection
   * @param {string} hubUrl - The SignalR hub URL
   * @returns {Promise<void>}
   */
  async start(hubUrl = null) {
    const connectionId = Math.random().toString(36).substring(2, 15);
    console.log(`[Dashboard SignalR] Starting connection attempt (ID: ${connectionId})...`);

    // Re-entrancy and state guard to avoid AbortError from overlapping starts
    if (this._isStarting) {
      console.log('[Dashboard SignalR] Start already in progress, skipping');
      return;
    }
    const currentState = this.connection?.state;
    if (currentState === HubConnectionState.Connected) {
      console.log('[Dashboard SignalR] Already connected');
      return;
    }
    if (currentState === HubConnectionState.Connecting || currentState === HubConnectionState.Reconnecting) {
      console.log('[Dashboard SignalR] Connection is in progress, skipping start');
      return;
    }

    this.state = ConnectionState.CONNECTING;

    try {
      this._isStarting = true;
      if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
        await this.stop();
      }

      const baseURL = this.getBaseUrl();
      const fullHubUrl = hubUrl ? `${baseURL}${hubUrl}` : `${baseURL}/dashboardHub`;

  const tokenPreview = (this.getAuthToken() || '').slice(0, 12);
  console.log('[Dashboard SignalR] Connecting to:', fullHubUrl, 'tokenPresent:', !!tokenPreview);

      // Build connection with authentication token
      this.connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          // Force WebSockets and skip negotiation to avoid transport downgrade / abort loops
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
          accessTokenFactory: () => {
            const token = this.getAuthToken();
            if (token) {
              return token; // don't log full token
            }
            console.warn('[Dashboard SignalR] No authentication token available');
            return null;
          }
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      this.setupConnectionHandlers();

      // Start connection first
      await this.connection.start();
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;

      console.log(`[Dashboard SignalR] Connected successfully (ID: ${connectionId})`);

      // Negotiate protocol (v2 & features) before registering handlers so we can suppress legacy
      try {
        await this.negotiateProtocol();
      } catch (negErr) {
        console.warn('[Dashboard SignalR] Protocol negotiation failed, continuing with legacy compatibility', negErr);
      }

      // Now register event handlers based on negotiated protocol
      this.setupEventHandlers();

      // Start health checks after successful connection
      this.startHealthChecks();

      // Notify listeners
      this.notifyListeners('connectionStatusChanged', true);

      // Request initial dashboard data - methods now handle errors gracefully
      await this.requestDashboardMetrics();
      // Note: RequestKeyStatistics removed as it's not implemented on server

    } catch (error) {
      console.error(`[Dashboard SignalR] Connection error (ID: ${connectionId}):`, error);
      this.handleConnectionError(error);
      throw error;
    } finally {
      this._isStarting = false;
    }
  }

  /**
   * Perform protocol negotiation with server (AcceptProtocolAdvanced -> AcceptProtocol fallback)
   */
  async negotiateProtocol() {
    if (!this.connection) return;
    // Skip if already negotiated (reconnections will re-run though)
    try {
      const negotiationPayload = { maxVersion: 2, features: ['initialBatch','streaming'] };
      let response = null;
      try {
        response = await this.connection.invoke('AcceptProtocolAdvanced', negotiationPayload);
      } catch (advErr) {
        // Fallback to simple AcceptProtocol
        try {
          const v = await this.connection.invoke('AcceptProtocol', 2);
          response = { acceptedVersion: v, serverVersion: 2, legacySuppressed: v >= 2 };
        } catch (simpleErr) {
          console.warn('[Dashboard SignalR] Both advanced & simple protocol negotiation failed; staying legacy.', simpleErr);
          this.protocol.negotiated = false;
          return;
        }
      }
      if (response) {
        this.protocol.version = response.acceptedVersion ?? response.negotiatedVersion ?? 1;
        this.protocol.serverVersion = response.serverVersion ?? 1;
        this.protocol.legacySuppressed = !!response.legacySuppressed && !this.forceLegacy;
        this.protocol.features = response.features || [];
        this.protocol.negotiated = true;
        console.log('[Dashboard SignalR] Protocol negotiated', this.protocol);
        this.notifyListeners('protocolNegotiated', { ...this.protocol });
        // Optionally fetch telemetry immediately for diagnostics
        this.requestProtocolTelemetry().catch(()=>{});
      }
    } catch (err) {
      console.warn('[Dashboard SignalR] Unexpected error during protocol negotiation', err);
    }
  }

  /**
   * Request protocol telemetry from server (v2 adoption metrics)
   */
  async requestProtocolTelemetry() {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    try {
      // Hub method returns via a pushed event 'ProtocolTelemetry'
      // We invoke then rely on event handler to populate state
      await this.connection.invoke('GetProtocolTelemetry');
    } catch (err) {
      // Silently ignore on older servers
      if (!/does not exist/i.test(err?.message || '')) {
        console.debug('[Dashboard SignalR] Protocol telemetry request failed', err);
      }
    }
  }

  /**
   * Handle connection errors with exponential backoff retry
   * @param {Error} error - Connection error
   */
  handleConnectionError = (error) => {
    console.error('[Dashboard SignalR] Connection error:', error);
    this.state = ConnectionState.ERROR;

    // Immediate retry for network errors
    if (error.message?.includes('network') || error.message?.includes('connection')) {
      console.log('[Dashboard SignalR] Network error detected, attempting immediate reconnect');
      setTimeout(() => this.start(), 1000);
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(
        `[Dashboard SignalR] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );

      setTimeout(async () => {
        try {
          await this.start();
        } catch (error) {
          console.error('[Dashboard SignalR] Reconnection attempt failed:', error);
        }
      }, delay);
    } else {
      console.error('[Dashboard SignalR] Max reconnection attempts reached');
      if (store) {
        store.dispatch({
          type: 'DASHBOARD_SIGNALR_CONNECTION_ERROR',
          payload: {
            type: SignalRError.CONNECTION_FAILED,
            message: 'Failed to establish Dashboard SignalR connection after multiple attempts'
          }
        });
      }
    }
  };

  /**
   * Stop the SignalR connection
   * @returns {Promise<void>}
   */
  async stop() {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this._isStarting = false;

    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('[Dashboard SignalR] Connection stopped');
      } catch (error) {
        console.error('[Dashboard SignalR] Error stopping connection:', error);
      } finally {
        this.connection = null;
        this.state = ConnectionState.DISCONNECTED;
        this.notifyListeners('connectionStatusChanged', false);
      }
    }
  }

  /**
   * Setup connection lifecycle handlers
   */
  setupConnectionHandlers = () => {
    if (!this.connection) return;

    this.connection.onreconnecting(() => {
      this.state = ConnectionState.RECONNECTING;
      console.log('[Dashboard SignalR] Reconnecting...');
      this.notifyListeners('connectionStatusChanged', false);
      if (store) {
        store.dispatch({
          type: 'DASHBOARD_SIGNALR_STATE_CHANGED',
          payload: { state: 'reconnecting', timestamp: Date.now() }
        });
      }
    });

    this.connection.onreconnected(async () => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log('[Dashboard SignalR] Reconnected successfully');

      try {
        // Request fresh data after reconnection - methods handle errors gracefully
        await this.requestDashboardMetrics();
        // Note: RequestKeyStatistics removed as it's not implemented on server

        this.notifyListeners('connectionStatusChanged', true);

        if (store) {
          store.dispatch({
            type: 'DASHBOARD_SIGNALR_STATE_CHANGED',
            payload: { state: 'connected', timestamp: Date.now() }
          });
        }
      } catch (error) {
        console.error('[Dashboard SignalR] Error requesting fresh data:', error);
      }
    });

    this.connection.onclose(() => {
      this.state = ConnectionState.DISCONNECTED;
      console.log('[Dashboard SignalR] Connection closed');
      this.notifyListeners('connectionStatusChanged', false);

      // Attempt to reconnect if not manually stopped
      if (this.connectionState !== ConnectionState.DISCONNECTED) {
        this.handleConnectionError(new Error('Connection closed'));
      }
    });
  };

  /**
   * Set up event handlers for dashboard-specific events
   */
  setupEventHandlers() {
    if (!this.connection) return;

    // Helper function to register event with cleanup and debouncing
    const registerEvent = (eventName, handler, debounceMs = 500) => {
      this.connection.off(eventName); // Remove existing handlers
      const debouncedHandler = debounceMs > 0
        ? createDynamicDebouncedHandler(handler, debounceMs)
        : handler;
      this.connection.on(eventName, debouncedHandler);
    };

    // Always listen for protocol accepted (server push) and telemetry updates
    this.connection.off('ProtocolAccepted');
    this.connection.on('ProtocolAccepted', (info) => {
      if (info) {
        this.protocol.version = info.acceptedVersion ?? info.negotiatedVersion ?? this.protocol.version;
        this.protocol.serverVersion = info.serverVersion ?? this.protocol.serverVersion;
        // Respect forceLegacy override
        this.protocol.legacySuppressed = !!info.legacySuppressed && !this.forceLegacy;
        this.protocol.features = info.features || this.protocol.features;
        this.protocol.negotiated = true;
        console.log('[Dashboard SignalR] ProtocolAccepted event', this.protocol);
        this.notifyListeners('protocolNegotiated', { ...this.protocol });
      }
    });
    this.connection.off('ProtocolTelemetry');
    this.connection.on('ProtocolTelemetry', (telemetry) => {
      this.protocol.telemetry = telemetry;
      this.notifyListeners('protocolTelemetry', telemetry);
    });

    // Decide whether to register legacy events
    const allowLegacy = !this.protocol.legacySuppressed;

    // Dashboard-specific events with debouncing
    registerEvent('KeyStatisticsUpdate', (data) => {
      if (data) {
        this.notifyListeners('keyStatisticsUpdate', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_KEY_STATISTICS',
            payload: data
          });
        }
      }
    }, 1000); // Higher debounce for statistics

    // Enhanced Widget Update events
    registerEvent('EnhancedWidgetDataUpdate', (data) => {
      if (data && data.widgetInstanceId) {
        this.notifyListeners('enhancedWidgetDataUpdate', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_ENHANCED_WIDGET_DATA',
            payload: {
              widgetInstanceId: data.widgetInstanceId,
              data: data.data,
              timestamp: Date.now()
            }
          });
        }
      }
    });

    registerEvent('WidgetConfigurationUpdate', (data) => {
      if (data && data.widgetInstanceId) {
        this.notifyListeners('widgetConfigurationUpdate', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_WIDGET_CONFIGURATION',
            payload: data
          });
        }
      }
    }, 0); // No debounce for configuration changes

    registerEvent('CategoryWidgetUpdate', (data) => {
      if (data && data.category) {
        this.notifyListeners('categoryWidgetUpdate', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_CATEGORY_WIDGETS',
            payload: {
              category: data.category,
              widgets: data.widgets,
              timestamp: Date.now()
            }
          });
        }
      }
    });

    registerEvent('WidgetValidationUpdate', (data) => {
      if (data) {
        this.notifyListeners('widgetValidationUpdate', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_WIDGET_VALIDATION',
            payload: data
          });
        }
      }
    }, 0); // No debounce for validation updates

    if (allowLegacy) {
      registerEvent('WidgetDataUpdate', (data) => {
        if (data) {
          this.notifyListeners('widgetDataUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_WIDGET_DATA',
              payload: data
            });
          }
        }
      });
    }

    // Additional events for hybrid data loading approach
    if (allowLegacy) {
      registerEvent('InitialWidgetDataResponse', (data) => {
        if (data) {
          this.notifyListeners('initialWidgetDataResponse', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_INITIAL_WIDGET_DATA',
              payload: data
            });
          }
        }
      }, 0); // No debounce for initial data responses
    }

    // Batch initial data response (new)
    if (allowLegacy) {
      registerEvent('InitialWidgetsDataBatch', (data) => {
        if (data && data.widgets) {
          this.notifyListeners('initialWidgetsDataBatch', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_INITIAL_WIDGETS_DATA_BATCH',
              payload: data
            });
          }
        }
      }, 0);
    }

    // Protocol v2 unified envelope (single) - light debounce to reduce dispatch pressure
    registerEvent('WidgetDataEnvelope', (data) => {
      if (data) {
        // Drop non-initial single frames until initial batch arrives to avoid startup thrash
        if (!this.hasReceivedInitialBatch && !data.isInitialLoad) {
          return;
        }
        this.notifyListeners('widgetDataEnvelope', data);
        if (store) {
          store.dispatch({ type: 'WIDGET_DATA_ENVELOPE_V2', payload: data });
        }
      }
    }, 150);

    // Protocol v2 unified envelope (batch) - debounce to allow batching in Redux too
    registerEvent('WidgetDataEnvelopeBatch', (data) => {
      if (data) {
        this.notifyListeners('widgetDataEnvelopeBatch', data);
        if (store) {
          store.dispatch({ type: 'WIDGET_DATA_ENVELOPE_BATCH_V2', payload: data });
        }
        this.hasReceivedInitialBatch = true;
      }
    }, 250);

    if (allowLegacy) {
      registerEvent('DataSourceUpdate', (data) => {
        if (data) {
          this.notifyListeners('dataSourceUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_DATA_SOURCE',
              payload: data
            });
          }
        }
      });

      registerEvent('MetricDataUpdate', (data) => {
        if (data) {
          this.notifyListeners('metricDataUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_METRIC_DATA',
              payload: data
            });
          }
        }
      });

      registerEvent('TickerUpdate', (data) => {
        if (data) {
          this.notifyListeners('tickerUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_TICKER_DATA',
              payload: data
            });
          }
        }
      }, 2000); // Higher debounce for ticker

      registerEvent('GraphUpdate', (data) => {
        if (data) {
          this.notifyListeners('graphUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_GRAPH_DATA',
              payload: data
            });
          }
        }
      }, 1000);

      registerEvent('DashboardLayoutUpdate', (data) => {
        if (data) {
          this.notifyListeners('dashboardLayoutUpdate', data);
          if (store) {
            store.dispatch({
              type: 'UPDATE_DASHBOARD_LAYOUT',
              payload: data
            });
          }
        }
      }, 0); // No debounce for layout changes

      registerEvent('DashboardMetricsUpdate', (data) => {
        if (data) {
          this.notifyListeners('dashboardMetricsUpdate', data);
          this.lastMetricsUpdate = Date.now();
          if (store) {
            store.dispatch({
              type: 'FETCH_DASHBOARD_METRICS_SUCCESS',
              payload: data
            });
          }
        }
      });
    }

    // Fuel dispensed increment events
    registerEvent('FuelDispensedIncrement', (data) => {
      if (data) {
        this.notifyListeners('FuelDispensedIncrement', data);
        if (store) {
          store.dispatch({
            type: 'INCREMENT_FUEL_DISPENSED',
            payload: data
          });
        }
      }
    }, 100); // Low debounce for real-time increments

    // Notification events
    registerEvent('DashboardNotification', (notification) => {
      if (notification && notification.message) {
        this.notifyListeners('dashboardNotification', notification);
        if (store) {
          store.dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
              id: notification.id || `dashboard-${Date.now()}`,
              title: notification.title || 'Dashboard Notification',
              message: notification.message,
              type: notification.type || 'info',
              timestamp: Date.now(),
              autoClose: notification.autoClose !== false
            }
          });
        }
      }
    }, 0); // No debounce for notifications

    // Active Alarm events for dashboard
    registerEvent('ActiveAlarmSummary', (data) => {
      if (data) {
        this.notifyListeners('activeAlarmSummary', data);
        if (store) {
          store.dispatch({
            type: 'UPDATE_ACTIVE_ALARM_SUMMARY',
            payload: data
          });
        }
      }
    }, 2000);
  }

  /**
   * Subscribe to enhanced widget updates
   * @param {number} widgetInstanceId - Enhanced widget instance ID to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToEnhancedWidget(widgetInstanceId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('SubscribeToEnhancedWidgetUpdates', widgetInstanceId);
      console.log('Subscribed to enhanced widget updates:', widgetInstanceId);
    } catch (error) {
      console.error('Failed to subscribe to enhanced widget updates:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from enhanced widget updates
   * @param {number} widgetInstanceId - Enhanced widget instance ID to unsubscribe from
   * @returns {Promise<void>}
   */
  async unsubscribeFromEnhancedWidget(widgetInstanceId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('UnsubscribeFromEnhancedWidgetUpdates', widgetInstanceId);
      console.log('Unsubscribed from enhanced widget updates:', widgetInstanceId);
    } catch (error) {
      console.error('Failed to unsubscribe from enhanced widget updates:', error);
      throw error;
    }
  }

  /**
   * Subscribe to category widget updates
   * @param {string} category - Widget category to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToCategoryUpdates(category) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('SubscribeToCategoryUpdates', category);
      console.log('Subscribed to category updates:', category);
    } catch (error) {
      console.error('Failed to subscribe to category updates:', error);
      throw error;
    }
  }

  /**
   * Request enhanced widget data refresh
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<void>}
   */
  async requestEnhancedWidgetRefresh(widgetInstanceId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('RequestEnhancedWidgetRefresh', widgetInstanceId);
      console.log('Requested enhanced widget refresh:', widgetInstanceId);
    } catch (error) {
      console.error('Failed to request enhanced widget refresh:', error);
      throw error;
    }
  }

    /**
   * Request widget data via SignalR (for hybrid approach)
   * @param {number} widgetInstanceId - Widget instance ID to request data for
   * @param {Object} configuration - Widget configuration parameters
   * @returns {Promise<void>}
   */
  async requestWidgetData(widgetInstanceId, configuration = {}) {
    // Ensure connection before making request
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      throw new Error('SignalR connection not available');
    }

    try {
      console.log(`[Dashboard SignalR] Requesting widget data for widget ${widgetInstanceId} with config:`, configuration);

      // Prepare request payload
      const requestPayload = {
        widgetInstanceId: widgetInstanceId,
        configuration: {
          mode: configuration.mode || 'cumulative',
          datePreset: configuration.datePreset || 'yesterday',
          sitesMode: configuration.sitesMode || 'all',
          siteIds: configuration.siteIds || [],
          vehicleIds: configuration.vehicleIds || [],
          vehicleTypeIds: configuration.vehicleTypeIds || [],
          intervalHours: configuration.intervalHours || 1,
          settings: configuration.settings || {}
        }
      };

      await this.connection.invoke('RequestWidgetData', requestPayload);
      console.log(`[Dashboard SignalR] Widget data request sent for widget ${widgetInstanceId}`);
    } catch (error) {
      console.error(`[Dashboard SignalR] Error requesting widget data for widget ${widgetInstanceId}:`, error);
      throw error;
    }
  }

  /**
   * Request initial widget data via SignalR (alternative method)
   * @param {number} widgetInstanceId - Widget instance ID to request initial data for
   * @returns {Promise<void>}
   */
  async requestInitialWidgetData(widgetInstanceId) {
    // Ensure connection before making request
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      throw new Error('SignalR connection could not be established');
    }

    try {
      const ok = await this.invokeSafe('GetInitialWidgetData', widgetInstanceId);
      if (!ok) return; // Skip noisy errors if connection not ready
      console.log(`[SignalR] Requested initial widget data for: ${widgetInstanceId}`);
    } catch (error) {
      console.error(`[SignalR] Failed to request initial widget data for ${widgetInstanceId}:`, error);
      throw error;
    }
  }

  /**
   * Batch request of initial widget data for multiple widgets.
   * @param {number[]} widgetInstanceIds array of widget instance ids
   */
  async requestInitialWidgetsData(widgetInstanceIds = []) {
    if (!Array.isArray(widgetInstanceIds) || widgetInstanceIds.length === 0) return;
    const isConnected = await this.ensureConnection();
    if (!isConnected) throw new Error('SignalR connection could not be established');
    try {
      const ok = await this.invokeSafe('GetInitialWidgetsData', widgetInstanceIds);
      if (!ok) return; // Connection likely closing; skip
      console.log('[SignalR] Requested batch initial widget data:', widgetInstanceIds);
    } catch (error) {
      // Fallback: server version might not yet have batch method deployed
      if (error?.message?.toLowerCase().includes('does not exist')) {
        console.warn('[SignalR] Batch method GetInitialWidgetsData unavailable on server. Falling back to per-widget calls.');
        for (const wid of widgetInstanceIds) {
          try {
            const ok2 = await this.invokeSafe('GetInitialWidgetData', wid);
            if (!ok2) continue;
            console.log(`[SignalR] Fallback initial data request sent for widget ${wid}`);
          } catch (innerErr) {
            console.error(`[SignalR] Fallback initial data request failed for widget ${wid}:`, innerErr);
          }
        }
      } else {
        console.error('[SignalR] Failed batch initial widget data request:', error);
        throw error;
      }
    }
  }

  /**
   * Request data source data via SignalR with parameters
   * @param {string} dataSource - Data source identifier
   * @param {Object} params - Request parameters
   * @returns {Promise<void>}
   */
  async requestDataSourceData(dataSource, params = {}) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      const ok = await this.invokeSafe('RequestDataSourceData', dataSource, params);
      if (!ok) return;
      console.log(`[SignalR] Requested data source data for: ${dataSource}`, params);
    } catch (error) {
      console.error(`[SignalR] Failed to request data source data for ${dataSource}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to widget updates
   * @param {number} widgetId - Widget ID to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToWidget(widgetId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('SubscribeToWidgetUpdates', widgetId);
      console.log('Subscribed to widget updates:', widgetId);
    } catch (error) {
      console.error('Failed to subscribe to widget updates:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from widget updates
   * @param {number} widgetId - Widget ID to unsubscribe from
   * @returns {Promise<void>}
   */
  async unsubscribeFromWidget(widgetId) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('UnsubscribeFromWidgetUpdates', widgetId);
      console.log('Unsubscribed from widget updates:', widgetId);
    } catch (error) {
      console.error('Failed to unsubscribe from widget updates:', error);
      throw error;
    }
  }

  /**
   * Subscribe to metric updates
   * @param {string} metricType - Metric type to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToMetric(metricType) {
    if (!this.connection || !this.isConnected) {
      throw new Error('Dashboard SignalR connection not established');
    }

    try {
      await this.connection.invoke('SubscribeToMetricUpdates', metricType);
      console.log('Subscribed to metric updates:', metricType);
    } catch (error) {
      console.error('Failed to subscribe to metric updates:', error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple metrics
   * @param {Array<string>} metricTypes - Array of metric types to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToMetrics(metricTypes) {
    if (!Array.isArray(metricTypes)) {
      throw new Error('Metric types must be an array');
    }

    const promises = metricTypes.map(metricType =>
      this.subscribeToMetric(metricType).catch(error => {
        console.warn(`Failed to subscribe to metric ${metricType}:`, error);
        return null; // Don't fail the entire batch for one metric
      })
    );

    await Promise.all(promises);
    console.log('Batch subscription completed for metrics:', metricTypes);
  }

  /**
   * Request dashboard metrics
   * @returns {Promise<void>}
   */
  async requestDashboardMetrics() {
    if (!this.connection || !this.isConnected) {
      return; // Silently return if not connected
    }

    try {
      const ok = await this.invokeSafe('RequestDashboardMetrics');
      if (!ok) return;
      console.log('[Dashboard SignalR] Requested dashboard metrics');
    } catch (error) {
      // Don't log errors for methods that don't exist on server
      if (error.message?.includes('Method does not exist')) {
        console.debug('[Dashboard SignalR] RequestDashboardMetrics method not implemented on server side');
        return;
      }
      console.error('[Dashboard SignalR] Failed to request dashboard metrics:', error);
      // Don't throw - allow graceful degradation
    }
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Function to remove the listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  notifyListeners(event, ...args) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status with detailed info
   * @returns {boolean} Whether the connection is established
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get detailed connection status for debugging
   * @returns {Object} Detailed connection information
   */
  getDetailedConnectionStatus() {
    const connectionInfo = this.getConnectionInfo();
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      connectionInfo,
      canUseSignalR: this.isConnected && this.connection,
      lastHealthCheck: this.lastSuccessfulHealthCheck,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Force reconnection if needed
   * @returns {Promise<boolean>} Whether reconnection was successful
   */
  async ensureConnection() {
    if (this.isConnected && this.connection) {
      return true;
    }

    console.log('[SignalR] Ensuring connection...');
    try {
      await this.start();
      return this.isConnected;
    } catch (error) {
      console.error('[SignalR] Failed to ensure connection:', error);
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks = () => {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.connection?.state === HubConnectionState.Connected) {
        try {
          // Try to ping the server first
          try {
            await this.connection.invoke('Ping');
            this.lastSuccessfulHealthCheck = new Date();
          } catch (pingError) {
            // If Ping method doesn't exist, that's okay - not all hubs implement it
            console.debug('[Dashboard SignalR] Ping method not available, using alternative health check');
            this.lastSuccessfulHealthCheck = new Date();
          }

          // Request fresh metrics if needed (but don't fail if method doesn't exist)
          const timeSinceLastUpdate = Date.now() - (this.lastMetricsUpdate || 0);
          if (timeSinceLastUpdate > 30000) { // 30 seconds
            try {
              await this.requestDashboardMetrics();
              this.lastMetricsUpdate = Date.now();
            } catch (metricsError) {
              if (!metricsError.message?.includes('Method does not exist')) {
                console.warn('[Dashboard SignalR] Health check metrics request failed:', metricsError);
              }
            }
          }
        } catch (error) {
          console.error('[Dashboard SignalR] Health check failed:', error);
          // Only attempt reconnect if we haven't had a successful health check recently
          if (!this.lastSuccessfulHealthCheck ||
              Date.now() - this.lastSuccessfulHealthCheck > 60000) {
            await this.refreshConnection();
          }
        }
      }
    }, 30000); // Check every 30 seconds
  };

  /**
   * Refresh the SignalR connection
   * @returns {Promise<void>}
   */
  async refreshConnection() {
    console.log('[Dashboard SignalR] Attempting to refresh connection...');
    if (this.connection) {
      try {
        if (this.connection.state === HubConnectionState.Connected) {
          await this.connection.stop();
        }
        await this.connection.start();

        // Request data after refresh - methods handle errors gracefully
        await this.requestDashboardMetrics();
        // Note: RequestKeyStatistics removed as it's not implemented on server

        console.log('[Dashboard SignalR] Connection refreshed successfully');
      } catch (error) {
        console.error('[Dashboard SignalR] Error refreshing connection:', error);
        this.handleConnectionError(error);
      }
    }
  }

  /**
   * Get detailed connection information
   * @returns {Object|null} Connection details
   */
  getConnectionInfo() {
    if (!this.connection || !this.isConnected) {
      return null;
    }

    return {
      connectionId: this.connection.connectionId,
      state: this.connection.state,
      transport: this.connection.transport?.name || 'unknown',
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      url: this.connection.baseUrl,
      lastHealthCheck: this.lastSuccessfulHealthCheck,
      lastMetricsUpdate: this.lastMetricsUpdate
    };
  }
}

const dashboardSignalRService = new DashboardSignalRService();
export default dashboardSignalRService;
