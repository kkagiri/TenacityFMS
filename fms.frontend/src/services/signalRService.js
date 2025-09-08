//Not in use for the moment
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

/**
 * SignalR Service for Real-time Dashboard Updates
 * Integrates with the backend SignalR hub for live dashboard data
 */
class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  /**
   * Initialize and start the SignalR connection
   * @param {string} hubUrl - The SignalR hub URL (default: '/frontendHub')
   * @returns {Promise<void>}
   */
  async start(hubUrl = null) {
    try {
      if (this.connection) {
        await this.stop();
      }

      // Use environment variable or construct full URL for backend
      const baseURL = process.env.REACT_APP_SIGNALR_URL || 'http://localhost:7009';
      const fullHubUrl = hubUrl || `${baseURL}/frontendHub`;

      console.log('Starting SignalR connection to:', fullHubUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(fullHubUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.elapsedMilliseconds < 60000) {
              // Reconnect within 60 seconds
              return Math.min(this.reconnectDelay * Math.pow(2, retryContext.previousRetryCount), 30000);
            } else {
              // Stop reconnecting after 60 seconds
              return null;
            }
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('SignalR connection established successfully');

      // Notify listeners of connection status
      this.notifyListeners('connectionStatusChanged', true);

    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      this.isConnected = false;
      this.notifyListeners('connectionStatusChanged', false);
      throw error;
    }
  }

  /**
   * Stop the SignalR connection
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      } finally {
        this.connection = null;
        this.isConnected = false;
        this.notifyListeners('connectionStatusChanged', false);
      }
    }
  }

  /**
   * Set up event handlers for the SignalR connection
   */
  setupEventHandlers() {
    if (!this.connection) return;

    // Connection events
    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this.isConnected = false;
      this.notifyListeners('connectionStatusChanged', false);
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connectionStatusChanged', true);
    });

    this.connection.onclose(() => {
      console.log('SignalR connection closed');
      this.isConnected = false;
      this.notifyListeners('connectionStatusChanged', false);
    });

    // Dashboard-specific events


    this.connection.on('ReceiveGraphUpdate', (data) => {
      console.log('Received graph update:', data);
      this.notifyListeners('graphUpdate', data);
    });

    this.connection.on('ReceiveDeviceStatusUpdate', (data) => {
      console.log('Received device status update:', data);
      this.notifyListeners('deviceStatusUpdate', data);
    });

    // Error handling
    this.connection.on('ReceiveError', (error) => {
      console.error('SignalR error received:', error);
      this.notifyListeners('error', error);
    });
  }

  /**
   * Subscribe to specific metrics
   * @param {string[]} metrics - Array of metric names to subscribe to
   * @returns {Promise<void>}
   */
  async subscribeToMetrics(metrics) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('SubscribeToMetrics', metrics);
      console.log('Subscribed to metrics:', metrics);
    } catch (error) {
      console.error('Failed to subscribe to metrics:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from specific metrics
   * @param {string[]} metrics - Array of metric names to unsubscribe from
   * @returns {Promise<void>}
   */
  async unsubscribeFromMetrics(metrics) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('UnsubscribeFromMetrics', metrics);
      console.log('Unsubscribed from metrics:', metrics);
    } catch (error) {
      console.error('Failed to unsubscribe from metrics:', error);
      throw error;
    }
  }

  /**
   * Request all devices status
   * @returns {Promise<object>} Device status summary
   */
  async requestAllDevicesStatus() {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      const result = await this.connection.invoke('RequestAllDevicesStatus');
      console.log('Requested all devices status:', result);
      return result;
    } catch (error) {
      console.error('Failed to request devices status:', error);
      throw error;
    }
  }

  /**
   * Send a custom message to the hub
   * @param {string} methodName - The hub method name
   * @param {...any} args - Arguments to pass to the method
   * @returns {Promise<any>} Response from the hub method
   */
  async send(methodName, ...args) {
    if (!this.connection || !this.isConnected) {
      throw new Error('SignalR connection not established');
    }

    try {
      const result = await this.connection.invoke(methodName, ...args);
      console.log(`Sent ${methodName} with result:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to send ${methodName}:`, error);
      throw error;
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

    // Return function to remove the listener
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
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
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
   * Get connection status
   * @returns {boolean} Whether the connection is established
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Get connection state details
   * @returns {object} Connection state information
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      connectionId: this.connection?.connectionId || null,
      connectionState: this.connection?.state || 'disconnected',
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create and export singleton instance
const signalRService = new SignalRService();
export default signalRService;

// Export the class for testing or multiple instances
export { SignalRService };
