/**
 * DataStreamService - Real-time data streaming service
 *
 * Manages real-time data streams, WebSocket connections, and data aggregation
 * for dashboard widgets. Provides caching, buffering, and subscription management.
 */

import BaseService from '../core/BaseService';

export class DataStreamService extends BaseService {
  constructor(config = {}) {
    super({
      ...config,
      serviceName: 'DataStreamService'
    });

    // Stream management
    this.activeStreams = new Map();
    this.streamSubscriptions = new Map();
    this.streamBuffers = new Map();
    this.connectionStates = new Map();

    // Configuration
    this.bufferSize = config.bufferSize || 100;
    this.reconnectDelay = config.reconnectDelay || 5000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.heartbeatInterval = config.heartbeatInterval || 30000;

    // Event handlers
    this.eventHandlers = new Map();
    this.dataTransformers = new Map();

    // Metrics tracking
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      reconnectAttempts: 0,
      errors: 0
    };
  }

  /**
   * Create a new data stream
   * @param {string} streamId - Unique stream identifier
   * @param {Object} config - Stream configuration
   * @returns {Promise<Object>} Stream instance
   */
  async createStream(streamId, config = {}) {
    try {
      if (this.activeStreams.has(streamId)) {
        this.logger.warn(`Stream ${streamId} already exists`);
        return this.activeStreams.get(streamId);
      }

      const streamConfig = {
        id: streamId,
        type: config.type || 'signalr', // signalr, websocket, sse
        url: config.url,
        hubName: config.hubName,
        method: config.method || 'dataUpdate',
        autoReconnect: config.autoReconnect !== false,
        bufferData: config.bufferData !== false,
        transformData: config.transformData || false,
        filters: config.filters || {},
        ...config
      };

      const stream = {
        id: streamId,
        config: streamConfig,
        connection: null,
        subscribers: new Set(),
        buffer: [],
        state: 'disconnected',
        lastData: null,
        lastUpdate: null,
        reconnectAttempts: 0,
        heartbeatTimer: null
      };

      this.activeStreams.set(streamId, stream);
      this.streamBuffers.set(streamId, []);
      this.connectionStates.set(streamId, 'disconnected');

      // Initialize connection based on type
      await this.initializeConnection(stream);

      this.logger.info(`Stream ${streamId} created successfully`);
      return stream;

    } catch (error) {
      this.logger.error(`Error creating stream ${streamId}:`, error);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Initialize connection for a stream
   * @param {Object} stream - Stream instance
   */
  async initializeConnection(stream) {
    try {
      switch (stream.config.type) {
        case 'signalr':
          await this.initializeSignalRStream(stream);
          break;
        case 'websocket':
          await this.initializeWebSocketStream(stream);
          break;
        case 'sse':
          await this.initializeSSEStream(stream);
          break;
        default:
          throw new Error(`Unsupported stream type: ${stream.config.type}`);
      }
    } catch (error) {
      this.logger.error(`Error initializing ${stream.config.type} stream ${stream.id}:`, error);
      stream.state = 'error';
      this.connectionStates.set(stream.id, 'error');
      throw error;
    }
  }

  /**
   * Initialize SignalR stream
   * @param {Object} stream - Stream instance
   */
  async initializeSignalRStream(stream) {
    try {
      // Get SignalR service from service factory
      const serviceFactory = (await import('./ServiceFactory')).default;
      await serviceFactory.initialize();
      const signalRService = serviceFactory.getSignalRService();

      // Connect to hub
      await signalRService.start(stream.config.hubName);
      stream.connection = signalRService;
      stream.state = 'connected';
      this.connectionStates.set(stream.id, 'connected');
      this.metrics.activeConnections++;

      // Set up data handler
      const dataHandler = (data) => {
        this.handleStreamData(stream.id, data);
      };

      // Subscribe to data updates
      const unsubscribe = signalRService.on(stream.config.method, dataHandler);
      this.streamSubscriptions.set(`${stream.id}-${stream.config.method}`, unsubscribe);

      // Set up connection state handlers
      const connectionHandler = (connected) => {
        stream.state = connected ? 'connected' : 'disconnected';
        this.connectionStates.set(stream.id, stream.state);

        if (!connected && stream.config.autoReconnect) {
          this.scheduleReconnect(stream);
        }
      };

      const connectionUnsubscribe = signalRService.on('connectionStatusChanged', connectionHandler);
      this.streamSubscriptions.set(`${stream.id}-connection`, connectionUnsubscribe);

      this.logger.info(`SignalR stream ${stream.id} initialized`);

    } catch (error) {
      this.logger.error(`Error initializing SignalR stream ${stream.id}:`, error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket stream
   * @param {Object} stream - Stream instance
   */
  async initializeWebSocketStream(stream) {
    try {
      const ws = new WebSocket(stream.config.url);

      ws.onopen = () => {
        stream.state = 'connected';
        this.connectionStates.set(stream.id, 'connected');
        this.metrics.activeConnections++;
        this.logger.info(`WebSocket stream ${stream.id} connected`);

        // Start heartbeat if configured
        if (stream.config.heartbeat) {
          this.startHeartbeat(stream, ws);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleStreamData(stream.id, data);
        } catch (error) {
          this.logger.error(`Error parsing WebSocket message for ${stream.id}:`, error);
        }
      };

      ws.onclose = () => {
        stream.state = 'disconnected';
        this.connectionStates.set(stream.id, 'disconnected');
        this.metrics.activeConnections--;
        this.stopHeartbeat(stream);

        if (stream.config.autoReconnect) {
          this.scheduleReconnect(stream);
        }
      };

      ws.onerror = (error) => {
        this.logger.error(`WebSocket error for ${stream.id}:`, error);
        this.metrics.errors++;
        stream.state = 'error';
        this.connectionStates.set(stream.id, 'error');
      };

      stream.connection = ws;

    } catch (error) {
      this.logger.error(`Error initializing WebSocket stream ${stream.id}:`, error);
      throw error;
    }
  }

  /**
   * Initialize Server-Sent Events stream
   * @param {Object} stream - Stream instance
   */
  async initializeSSEStream(stream) {
    try {
      const eventSource = new EventSource(stream.config.url);

      eventSource.onopen = () => {
        stream.state = 'connected';
        this.connectionStates.set(stream.id, 'connected');
        this.metrics.activeConnections++;
        this.logger.info(`SSE stream ${stream.id} connected`);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleStreamData(stream.id, data);
        } catch (error) {
          this.logger.error(`Error parsing SSE message for ${stream.id}:`, error);
        }
      };

      eventSource.onerror = (error) => {
        this.logger.error(`SSE error for ${stream.id}:`, error);
        this.metrics.errors++;

        if (eventSource.readyState === EventSource.CLOSED) {
          stream.state = 'disconnected';
          this.connectionStates.set(stream.id, 'disconnected');
          this.metrics.activeConnections--;

          if (stream.config.autoReconnect) {
            this.scheduleReconnect(stream);
          }
        }
      };

      stream.connection = eventSource;

    } catch (error) {
      this.logger.error(`Error initializing SSE stream ${stream.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming stream data
   * @param {string} streamId - Stream ID
   * @param {Object} data - Incoming data
   */
  handleStreamData(streamId, data) {
    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        this.logger.warn(`Received data for unknown stream: ${streamId}`);
        return;
      }

      this.metrics.messagesReceived++;

      // Apply data transformation if configured
      let transformedData = data;
      if (stream.config.transformData && this.dataTransformers.has(streamId)) {
        const transformer = this.dataTransformers.get(streamId);
        transformedData = transformer(data);
      }

      // Apply filters if configured
      if (stream.config.filters && !this.passesFilters(transformedData, stream.config.filters)) {
        return; // Data doesn't pass filters
      }

      // Update stream state
      stream.lastData = transformedData;
      stream.lastUpdate = new Date();

      // Buffer data if enabled
      if (stream.config.bufferData) {
        this.addToBuffer(streamId, transformedData);
      }

      // Notify subscribers
      stream.subscribers.forEach(callback => {
        try {
          callback(transformedData, streamId);
        } catch (error) {
          this.logger.error(`Error in stream subscriber callback:`, error);
        }
      });

      // Emit global event
      this.emit('dataReceived', { streamId, data: transformedData });

    } catch (error) {
      this.logger.error(`Error handling stream data for ${streamId}:`, error);
      this.metrics.errors++;
    }
  }

  /**
   * Subscribe to a data stream
   * @param {string} streamId - Stream ID
   * @param {Function} callback - Data callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(streamId, callback) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    stream.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      stream.subscribers.delete(callback);
    };
  }

  /**
   * Get stream status
   * @param {string} streamId - Stream ID
   * @returns {Object|null} Stream status
   */
  getStreamStatus(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) {
      return null;
    }

    return {
      id: streamId,
      state: stream.state,
      lastUpdate: stream.lastUpdate,
      subscriberCount: stream.subscribers.size,
      reconnectAttempts: stream.reconnectAttempts,
      bufferSize: this.streamBuffers.get(streamId)?.length || 0
    };
  }

  /**
   * Get buffered data for a stream
   * @param {string} streamId - Stream ID
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Buffered data
   */
  getBufferedData(streamId, limit = null) {
    const buffer = this.streamBuffers.get(streamId) || [];
    return limit ? buffer.slice(-limit) : [...buffer];
  }

  /**
   * Add data to stream buffer
   * @param {string} streamId - Stream ID
   * @param {Object} data - Data to buffer
   */
  addToBuffer(streamId, data) {
    let buffer = this.streamBuffers.get(streamId) || [];

    buffer.push({
      data: data,
      timestamp: new Date(),
      streamId: streamId
    });

    // Maintain buffer size
    if (buffer.length > this.bufferSize) {
      buffer = buffer.slice(-this.bufferSize);
    }

    this.streamBuffers.set(streamId, buffer);
  }

  /**
   * Check if data passes filters
   * @param {Object} data - Data to check
   * @param {Object} filters - Filter configuration
   * @returns {boolean} True if data passes filters
   */
  passesFilters(data, filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        if (!value.includes(data[key])) {
          return false;
        }
      } else if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Register a data transformer for a stream
   * @param {string} streamId - Stream ID
   * @param {Function} transformer - Data transformation function
   */
  registerDataTransformer(streamId, transformer) {
    this.dataTransformers.set(streamId, transformer);
  }

  /**
   * Schedule reconnection for a stream
   * @param {Object} stream - Stream instance
   */
  scheduleReconnect(stream) {
    if (stream.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(`Max reconnect attempts reached for stream ${stream.id}`);
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, stream.reconnectAttempts); // Exponential backoff

    setTimeout(async () => {
      try {
        stream.reconnectAttempts++;
        this.metrics.reconnectAttempts++;
        this.logger.info(`Attempting to reconnect stream ${stream.id} (attempt ${stream.reconnectAttempts})`);

        await this.initializeConnection(stream);
        stream.reconnectAttempts = 0; // Reset on successful connection

      } catch (error) {
        this.logger.error(`Reconnection failed for stream ${stream.id}:`, error);

        if (stream.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(stream);
        }
      }
    }, delay);
  }

  /**
   * Start heartbeat for WebSocket connection
   * @param {Object} stream - Stream instance
   * @param {WebSocket} ws - WebSocket connection
   */
  startHeartbeat(stream, ws) {
    this.stopHeartbeat(stream); // Clear existing heartbeat

    stream.heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat for a stream
   * @param {Object} stream - Stream instance
   */
  stopHeartbeat(stream) {
    if (stream.heartbeatTimer) {
      clearInterval(stream.heartbeatTimer);
      stream.heartbeatTimer = null;
    }
  }

  /**
   * Close a data stream
   * @param {string} streamId - Stream ID
   * @returns {Promise<boolean>} True if closed successfully
   */
  async closeStream(streamId) {
    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        this.logger.warn(`Stream ${streamId} not found for closing`);
        return false;
      }

      // Stop heartbeat
      this.stopHeartbeat(stream);

      // Close connection based on type
      if (stream.connection) {
        switch (stream.config.type) {
          case 'signalr':
            // SignalR cleanup handled by SignalRService
            break;
          case 'websocket':
            if (stream.connection.readyState === WebSocket.OPEN) {
              stream.connection.close();
            }
            break;
          case 'sse':
            stream.connection.close();
            break;
        }
      }

      // Cleanup subscriptions
      for (const [key, unsubscribe] of this.streamSubscriptions) {
        if (key.startsWith(streamId)) {
          try {
            unsubscribe && unsubscribe();
          } catch (error) {
            this.logger.warn(`Error unsubscribing from ${key}:`, error);
          }
          this.streamSubscriptions.delete(key);
        }
      }

      // Clear stream data
      this.activeStreams.delete(streamId);
      this.streamBuffers.delete(streamId);
      this.connectionStates.delete(streamId);
      this.dataTransformers.delete(streamId);

      if (stream.state === 'connected') {
        this.metrics.activeConnections--;
      }

      this.logger.info(`Stream ${streamId} closed successfully`);
      return true;

    } catch (error) {
      this.logger.error(`Error closing stream ${streamId}:`, error);
      return false;
    }
  }

  /**
   * Get all active streams
   * @returns {Array} Array of stream status objects
   */
  getAllStreams() {
    const streams = [];
    for (const streamId of this.activeStreams.keys()) {
      streams.push(this.getStreamStatus(streamId));
    }
    return streams;
  }

  /**
   * Get service metrics
   * @returns {Object} Service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeStreams: this.activeStreams.size,
      totalBufferedItems: Array.from(this.streamBuffers.values())
        .reduce((total, buffer) => total + buffer.length, 0)
    };
  }

  /**
   * Clear all stream buffers
   */
  clearAllBuffers() {
    this.streamBuffers.clear();
  }

  /**
   * Event emitter functionality
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        this.logger.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Subscribe to service events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event).push(handler);

    return () => {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup service resources
   */
  async cleanup() {
    // Close all streams
    const streamIds = Array.from(this.activeStreams.keys());
    await Promise.all(streamIds.map(id => this.closeStream(id)));

    // Clear all data
    this.activeStreams.clear();
    this.streamSubscriptions.clear();
    this.streamBuffers.clear();
    this.connectionStates.clear();
    this.eventHandlers.clear();
    this.dataTransformers.clear();

    super.cleanup && super.cleanup();
  }
}

export default DataStreamService;