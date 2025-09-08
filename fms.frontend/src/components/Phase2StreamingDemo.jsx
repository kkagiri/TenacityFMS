import React, { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import dataSourceService from '../services/dataSourceService';
import dashboardSignalRService from '../signalR/dashboardSignalRService';

/**
 * Phase 2 Demo Component
 * Demonstrates the new streaming data capabilities
 */
const Phase2StreamingDemo = () => {
  const [streamingData, setStreamingData] = useState({});
  const [activeStreams, setActiveStreams] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [streamingStats, setStreamingStats] = useState({});
  const [availableDataSources, setAvailableDataSources] = useState([]);

  // Initialize component
  useEffect(() => {
    initializeDemo();
    return () => cleanup();
  }, []);

  const initializeDemo = async () => {
    try {
      console.log('Phase 2 Demo: Initializing...');

      // Get available data sources
      const dataSources = await dataSourceService.getAvailableDataSources();
      setAvailableDataSources(dataSources);
      console.log('Available data sources:', dataSources);

      // Connect to SignalR
      await dashboardSignalRService.start();
      setConnectionStatus('connected');

      // Listen for connection status changes
      const unsubscribe = dashboardSignalRService.on('connectionStatusChanged', (isConnected) => {
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      });

      console.log('Phase 2 Demo: Initialized successfully');
      return unsubscribe;

    } catch (error) {
      console.error('Phase 2 Demo: Initialization error:', error);
      setConnectionStatus('error');
    }
  };

  const cleanup = async () => {
    console.log('Phase 2 Demo: Cleaning up...');

    // Stop all streams
    for (const [dataSource, streamId] of activeStreams) {
      try {
        await dataSourceService.stopStreaming(streamId);
      } catch (error) {
        console.error(`Error stopping stream for ${dataSource}:`, error);
      }
    }

    // Clear states
    setActiveStreams(new Map());
    setStreamingData({});

    // Cleanup services
    await dashboardService.cleanup();
  };

  const startStreaming = async (dataSource) => {
    try {
      console.log(`Phase 2 Demo: Starting stream for ${dataSource}`);

      // Check if already streaming
      if (activeStreams.has(dataSource)) {
        console.log(`Stream for ${dataSource} already active`);
        return;
      }

      // Get initial data
      const initialData = await dataSourceService.getInitialData(dataSource, {}, {
        mode: 'live',
        datePreset: 'today'
      });

      // Update state with initial data
      setStreamingData(prev => ({
        ...prev,
        [dataSource]: {
          ...initialData,
          isStreaming: true,
          streamStartTime: new Date(),
          updateCount: 1
        }
      }));

      // Start streaming
      const streamId = await dataSourceService.startStreaming(
        dataSource,
        (dataUpdate) => {
          console.log(`Phase 2 Demo: Stream update for ${dataSource}:`, dataUpdate);

          setStreamingData(prev => ({
            ...prev,
            [dataSource]: {
              ...dataUpdate,
              isStreaming: true,
              streamStartTime: prev[dataSource]?.streamStartTime || new Date(),
              updateCount: (prev[dataSource]?.updateCount || 0) + 1,
              lastUpdate: new Date()
            }
          }));
        },
        {
          refreshInterval: 5000, // 5 seconds for demo
          enableLiveData: true,
          retryOnError: true,
          maxRetries: 3
        }
      );

      // Track active stream
      setActiveStreams(prev => new Map(prev.set(dataSource, streamId)));

      console.log(`Phase 2 Demo: Stream started for ${dataSource} with ID: ${streamId}`);

    } catch (error) {
      console.error(`Phase 2 Demo: Error starting stream for ${dataSource}:`, error);

      // Update state to show error
      setStreamingData(prev => ({
        ...prev,
        [dataSource]: {
          error: error.message,
          isStreaming: false,
          lastUpdate: new Date()
        }
      }));
    }
  };

  const stopStreaming = async (dataSource) => {
    try {
      console.log(`Phase 2 Demo: Stopping stream for ${dataSource}`);

      const streamId = activeStreams.get(dataSource);
      if (!streamId) {
        console.log(`No active stream for ${dataSource}`);
        return;
      }

      // Stop the stream
      await dataSourceService.stopStreaming(streamId);

      // Update states
      setActiveStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(dataSource);
        return newMap;
      });

      setStreamingData(prev => ({
        ...prev,
        [dataSource]: {
          ...prev[dataSource],
          isStreaming: false,
          streamEndTime: new Date()
        }
      }));

      console.log(`Phase 2 Demo: Stream stopped for ${dataSource}`);

    } catch (error) {
      console.error(`Phase 2 Demo: Error stopping stream for ${dataSource}:`, error);
    }
  };

  const refreshStats = useCallback(() => {
    const stats = dataSourceService.getStreamingStats();
    setStreamingStats(stats);
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(refreshStats, 2000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const getDataSourceMetadata = async (dataSource) => {
    try {
      const metadata = await dataSourceService.getDataSourceMetadata(dataSource);
      console.log(`Metadata for ${dataSource}:`, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error getting metadata for ${dataSource}:`, error);
      return null;
    }
  };

  const testAggregatedData = async (dataSource) => {
    try {
      console.log(`Testing aggregated data for ${dataSource}`);

      const aggregatedData = await dataSourceService.getAggregatedData(
        dataSource,
        'hourly',
        {
          mode: 'historical',
          datePreset: 'last7days'
        }
      );

      console.log(`Aggregated data for ${dataSource}:`, aggregatedData);
      return aggregatedData;
    } catch (error) {
      console.error(`Error getting aggregated data for ${dataSource}:`, error);
      return null;
    }
  };

  return (
    <div className="phase2-streaming-demo" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Phase 2: Streaming Data Service Demo</h1>

      {/* Connection Status */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Status</h3>
        <div style={{
          padding: '10px',
          borderRadius: '5px',
          backgroundColor: connectionStatus === 'connected' ? '#d4edda' : '#f8d7da',
          color: connectionStatus === 'connected' ? '#155724' : '#721c24'
        }}>
          Status: {connectionStatus.toUpperCase()}
        </div>
      </div>

      {/* Available Data Sources */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Available Data Sources</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {availableDataSources.map((dataSource) => (
            <div key={dataSource} style={{
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '15px',
              backgroundColor: activeStreams.has(dataSource) ? '#e8f5e8' : '#f8f9fa'
            }}>
              <h4>{dataSource}</h4>
              <div style={{ marginBottom: '10px' }}>
                {streamingData[dataSource] && (
                  <div>
                    <p><strong>Status:</strong> {streamingData[dataSource].isStreaming ? 'Streaming' : 'Stopped'}</p>
                    <p><strong>Updates:</strong> {streamingData[dataSource].updateCount || 0}</p>
                    {streamingData[dataSource].lastUpdate && (
                      <p><strong>Last Update:</strong> {streamingData[dataSource].lastUpdate.toLocaleTimeString()}</p>
                    )}
                    {streamingData[dataSource].error && (
                      <p style={{ color: 'red' }}><strong>Error:</strong> {streamingData[dataSource].error}</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => startStreaming(dataSource)}
                  disabled={activeStreams.has(dataSource)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: activeStreams.has(dataSource) ? 'not-allowed' : 'pointer',
                    opacity: activeStreams.has(dataSource) ? 0.6 : 1
                  }}
                >
                  Start Stream
                </button>

                <button
                  onClick={() => stopStreaming(dataSource)}
                  disabled={!activeStreams.has(dataSource)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: !activeStreams.has(dataSource) ? 'not-allowed' : 'pointer',
                    opacity: !activeStreams.has(dataSource) ? 0.6 : 1
                  }}
                >
                  Stop Stream
                </button>

                <button
                  onClick={() => getDataSourceMetadata(dataSource)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Get Metadata
                </button>

                <button
                  onClick={() => testAggregatedData(dataSource)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffc107',
                    color: 'black',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Test Aggregation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streaming Statistics */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Streaming Statistics</h3>
        <div style={{
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          backgroundColor: '#f8f9fa'
        }}>
          <p><strong>Total Streams:</strong> {streamingStats.totalStreams || 0}</p>
          <p><strong>Active Streams:</strong> {streamingStats.activeStreams || 0}</p>
          <p><strong>Cache Size:</strong> {streamingStats.cacheSize || 0}</p>
          <p><strong>Retry Queue:</strong> {streamingStats.retryQueue || 0}</p>

          {streamingStats.dataSourceBreakdown && (
            <div>
              <p><strong>Breakdown by Data Source:</strong></p>
              <ul style={{ marginLeft: '20px' }}>
                {Object.entries(streamingStats.dataSourceBreakdown).map(([dataSource, count]) => (
                  <li key={dataSource}>{dataSource}: {count}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Current Data Display */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Streaming Data</h3>
        <div style={{
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          backgroundColor: '#f8f9fa',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0, fontSize: '12px' }}>
            {JSON.stringify(streamingData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Control Panel */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Control Panel</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => startStreaming('fuel_dispense')}
            style={{
              padding: '10px 15px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Fuel Dispense Stream
          </button>

          <button
            onClick={cleanup}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Stop All Streams
          </button>

          <button
            onClick={refreshStats}
            style={{
              padding: '10px 15px',
              backgroundColor: '#20c997',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
};

export default Phase2StreamingDemo;
