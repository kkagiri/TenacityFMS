/**
 * File: TransactionMonitoringStatus.js
 * Purpose: Real-time transaction monitoring component using PTS SignalR
 * Dependencies: ptsSignalRService, Redux, DevExtreme
 * Last Modified: 2025-10-22
 *
 * Key Functions:
 * - Monitors real-time transaction status via PTS SignalR
 * - Displays live fueling data (volume, amount, pump status)
 * - Handles transaction cancellation and completion
 * - Shows status history and progress indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { LoadPanel } from 'devextreme-react/load-panel';
import ptsSignalRService from '../../../signalR/ptsSignalRService';
import './TransactionMonitoringStatus.scss';

const TransactionMonitoringStatus = ({
  deviceId,
  pumpId,
  transactionId,
  isVisible,
  onCancel,
  onComplete,
  connectionType = 'Unknown'
}) => {
  const [monitoringData, setMonitoringData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Get real-time data from Redux
  const uploadStatus = useSelector(state =>
    state.realtimeStatus?.deviceStatuses?.[deviceId]?.status
  );

  const deviceStatus = useSelector(state =>
    state.realtimeStatus?.deviceStatuses?.[deviceId]
  );

  /**
   * Handle connection status changes
   */
  useEffect(() => {
    const handleConnectionStatusChange = (connected) => {
      setIsConnected(connected);
      if (!connected) {
        console.warn('[TransactionMonitoring] PTS SignalR disconnected');
      } else {
        console.log('[TransactionMonitoring] PTS SignalR connected');
      }
    };

    // Subscribe to connection status
    const unsubscribe = ptsSignalRService.on('connectionStatusChanged', handleConnectionStatusChange);

    // Set initial connection status
    setIsConnected(ptsSignalRService.isConnected);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /**
   * Handle transaction monitoring updates
   */
  const handleTransactionMonitoringUpdate = useCallback((data) => {
    if (!data || data.deviceId !== deviceId || data.transactionId !== transactionId) {
      return;
    }

    console.log('[TransactionMonitoring] Update received:', data);

    setMonitoringData(data);
    setLastUpdated(new Date());

    // Add to status history
    setStatusHistory(prev => {
      const newEntry = {
        timestamp: new Date(),
        status: data.status,
        volume: data.volume,
        amount: data.amount
      };
      return [...prev.slice(-4), newEntry]; // Keep last 5 entries
    });
  }, [deviceId, transactionId]);

  /**
   * Handle transaction completion
   */
  const handleTransactionCompleted = useCallback((data) => {
    if (!data || data.deviceId !== deviceId || data.pump !== pumpId) {
      return;
    }

    console.log('[TransactionMonitoring] Transaction completed:', data);

    setMonitoringData(prev => ({
      ...prev,
      status: 'Completed',
      finalData: data
    }));
    setLastUpdated(new Date());

    // Add completion to history
    setStatusHistory(prev => [
      ...prev.slice(-4),
      {
        timestamp: new Date(),
        status: 'Completed',
        volume: data.volume || data.transactionData?.volume,
        amount: data.amount || data.transactionData?.amount
      }
    ]);
  }, [deviceId, pumpId]);

  /**
   * Handle filling status updates
   */
  const handleFillingStatus = useCallback((data) => {
    if (!data || data.deviceId !== deviceId) {
      return;
    }

    console.log('[TransactionMonitoring] Filling status:', data);

    // Update monitoring data with real-time filling info
    setMonitoringData(prev => ({
      ...prev,
      status: 'Filling',
      volume: data.fillingData?.volume,
      amount: data.fillingData?.amount,
      lastUpdate: new Date()
    }));
    setLastUpdated(new Date());
  }, [deviceId]);

  /**
   * Handle fueling events
   */
  const handleFuelingEvent = useCallback((data) => {
    if (!data || data.deviceId !== deviceId) {
      return;
    }

    console.log('[TransactionMonitoring] Fueling event:', data);

    // Update based on event type
    const eventType = data.fuelingData?.type || data.type;

    if (eventType === 'TransactionStarted' || eventType === 'FuelingStarted') {
      setMonitoringData(prev => ({
        ...prev,
        status: 'InProgress',
        startTime: new Date()
      }));
    } else if (eventType === 'TransactionCompleted' || eventType === 'FuelingCompleted') {
      setMonitoringData(prev => ({
        ...prev,
        status: 'Completed',
        endTime: new Date()
      }));
    }

    setLastUpdated(new Date());
  }, [deviceId]);

  /**
   * Handle upload status updates
   */
  const handleUploadStatusUpdate = useCallback((data) => {
    if (!data || data.deviceId !== deviceId) {
      return;
    }

    console.log('[TransactionMonitoring] Upload status update:', data);
    setLastUpdated(new Date());
  }, [deviceId]);

  /**
   * Set up PTS SignalR event handlers
   */
  useEffect(() => {
    if (!isVisible || !transactionId) return;

    console.log('[TransactionMonitoring] Setting up event handlers for transaction:', transactionId);

    // Register all relevant event handlers
    const unsubscribers = [
      ptsSignalRService.on('pumpTransactionCompleted', handleTransactionCompleted),
      ptsSignalRService.on('fillingStatus', handleFillingStatus),
      ptsSignalRService.on('fuelingEvent', handleFuelingEvent),
      ptsSignalRService.on('uploadStatusUpdate', handleUploadStatusUpdate)
    ];

    // Request initial status if connected
    if (ptsSignalRService.isConnected) {
      ptsSignalRService.requestDeviceStatus(deviceId).catch(err => {
        console.error('[TransactionMonitoring] Failed to request device status:', err);
      });
    }

    // Cleanup function
    return () => {
      console.log('[TransactionMonitoring] Cleaning up event handlers');
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [
    isVisible,
    deviceId,
    pumpId,
    transactionId,
    handleTransactionCompleted,
    handleFillingStatus,
    handleFuelingEvent,
    handleUploadStatusUpdate
  ]);

  /**
   * Get current pump status from upload status
   */
  const getCurrentPumpStatus = useCallback(() => {
    if (!uploadStatus?.pumps) return null;

    const checkStatusType = (statusType, statusKey) => {
      const status = uploadStatus.pumps[statusType];
      if (!status?.ids) return null;

      const pumpIndex = status.ids.findIndex(id => id === pumpId);
      if (pumpIndex === -1) return null;

      return {
        type: statusKey,
        index: pumpIndex,
        data: status
      };
    };

    return (
      checkStatusType('idleStatus', 'idle') ||
      checkStatusType('fillingStatus', 'filling') ||
      checkStatusType('endOfTransactionStatus', 'endOfTransaction') ||
      checkStatusType('offlineStatus', 'offline')
    );
  }, [uploadStatus, pumpId]);

  const currentPumpStatus = getCurrentPumpStatus();

  /**
   * Get status color based on current status
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'authorized': return '#2196F3';
      case 'monitoring': return '#FF9800';
      case 'inprogress': return '#4CAF50';
      case 'filling': return '#4CAF50';
      case 'completed': return '#8BC34A';
      case 'awaitingmanualcompletion': return '#FFC107';
      case 'cancelled': return '#F44336';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  /**
   * Get human-readable status text
   */
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'authorized': return 'Authorized';
      case 'monitoring': return 'Monitoring';
      case 'inprogress': return 'Fueling In Progress';
      case 'filling': return 'Fueling In Progress';
      case 'completed': return 'Completed';
      case 'awaitingmanualcompletion': return 'Awaiting Manual Completion';
      case 'cancelled': return 'Cancelled';
      case 'error': return 'Error';
      default: return status || 'Unknown';
    }
  };

  /**
   * Calculate progress value based on status
   */
  const getProgressValue = () => {
    if (!monitoringData) return 0;

    const status = monitoringData.status?.toLowerCase();
    switch (status) {
      case 'authorized': return 10;
      case 'monitoring': return 25;
      case 'inprogress':
      case 'filling': return 60;
      case 'completed': return 100;
      case 'awaitingmanualcompletion': return 90;
      case 'cancelled':
      case 'error': return 0;
      default: return 20;
    }
  };

  /**
   * Check if transaction can be cancelled
   */
  const canCancel = () => {
    const status = monitoringData?.status?.toLowerCase();
    return status && !['completed', 'cancelled', 'error'].includes(status);
  };

  /**
   * Check if transaction can be completed manually
   */
  const canComplete = () => {
    const status = monitoringData?.status?.toLowerCase();
    return status === 'awaitingmanualcompletion' ||
           (currentPumpStatus?.type === 'endOfTransaction' && connectionType !== 'HTTPPolling');
  };

  /**
   * Handle cancel transaction action
   */
  const handleCancelTransaction = async () => {
    if (!canCancel()) return;

    setIsLoading(true);
    try {
      await onCancel(transactionId, 'User cancelled');
      setMonitoringData(prev => ({
        ...prev,
        status: 'Cancelled'
      }));
    } catch (error) {
      console.error('[TransactionMonitoring] Error cancelling transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle complete transaction action
   */
  const handleCompleteTransaction = async () => {
    if (!canComplete()) return;

    setIsLoading(true);
    try {
      await onComplete(transactionId);
      setMonitoringData(prev => ({
        ...prev,
        status: 'Completed'
      }));
    } catch (error) {
      console.error('[TransactionMonitoring] Error completing transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="tw-transaction-monitoring-status">
      <LoadPanel visible={isLoading} message="Processing..." />

      <div className="tw-monitoring-header">
        <h4 className="tw-monitoring-title">
          Transaction Monitoring
          <span className="tw-transaction-badge">
            #{transactionId}
          </span>
        </h4>
        <div className="tw-connection-info">
          <span className={`tw-connection-status ${isConnected ? 'tw-connected' : 'tw-disconnected'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
          <span className="tw-connection-type">{connectionType}</span>
          {lastUpdated && (
            <span className="tw-last-updated">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="tw-monitoring-body">
        {/* Current Status */}
        <div className="tw-status-section">
          <div className="tw-status-display">
            <div
              className="tw-status-indicator"
              style={{ backgroundColor: getStatusColor(monitoringData?.status) }}
            />
            <span className="tw-status-text">
              {getStatusText(monitoringData?.status)}
            </span>
          </div>

          <ProgressBar
            value={getProgressValue()}
            showStatus={false}
            className="tw-transaction-progress"
          />
        </div>

        {/* Real-time Data */}
        {monitoringData && (
          <div className="tw-realtime-data">
            <div className="tw-data-row">
              <span className="tw-data-label">Device:</span>
              <span className="tw-data-value">{deviceId}</span>
            </div>
            <div className="tw-data-row">
              <span className="tw-data-label">Pump:</span>
              <span className="tw-data-value">#{pumpId}</span>
            </div>
            {monitoringData.volume && (
              <div className="tw-data-row">
                <span className="tw-data-label">Volume:</span>
                <span className="tw-data-value">{Number(monitoringData.volume).toFixed(2)} L</span>
              </div>
            )}
            {monitoringData.amount && (
              <div className="tw-data-row">
                <span className="tw-data-label">Amount:</span>
                <span className="tw-data-value">${Number(monitoringData.amount).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Upload Status Data */}
        {currentPumpStatus && (
          <div className="tw-live-status">
            <div className="tw-live-status-header">
              <span className="tw-live-status-title">Live Status:</span>
              <span className="tw-live-status-badge">
                {currentPumpStatus.type.toUpperCase()}
              </span>
            </div>

            {currentPumpStatus.type === 'filling' && currentPumpStatus.data.volumes && (
              <div className="tw-live-data">
                <div className="tw-live-row">
                  <span>Volume: {currentPumpStatus.data.volumes[currentPumpStatus.index]?.toFixed(2) || '0.00'} L</span>
                </div>
                <div className="tw-live-row">
                  <span>Amount: ${currentPumpStatus.data.amounts?.[currentPumpStatus.index]?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            )}

            {currentPumpStatus.type === 'endOfTransaction' && (
              <div className="tw-live-data">
                <div className="tw-live-row">
                  <span className="tw-completion-message">
                    Transaction ready for completion
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status History */}
        {statusHistory.length > 0 && (
          <div className="tw-status-history">
            <h5 className="tw-history-title">Recent Updates</h5>
            <div className="tw-history-list">
              {statusHistory.slice().reverse().map((entry, index) => (
                <div key={index} className="tw-history-entry">
                  <div className="tw-history-time">
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="tw-history-status">
                    {getStatusText(entry.status)}
                  </div>
                  {entry.volume && (
                    <div className="tw-history-data">
                      {Number(entry.volume).toFixed(2)} L
                      {entry.amount && ` - $${Number(entry.amount).toFixed(2)}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Warning */}
        {!isConnected && (
          <div className="tw-connection-warning">
            <i className="fa-light fa-exclamation-triangle"></i>
            <span>Real-time updates unavailable - PTS SignalR disconnected</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="tw-monitoring-actions">
        {canCancel() && (
          <Button
            text="Cancel Transaction"
            type="default"
            stylingMode="outlined"
            onClick={handleCancelTransaction}
            disabled={isLoading || !isConnected}
            className="tw-cancel-button"
          />
        )}

        {canComplete() && (
          <Button
            text="Complete Transaction"
            type="success"
            onClick={handleCompleteTransaction}
            disabled={isLoading || !isConnected}
            className="tw-complete-button"
          />
        )}
      </div>
    </div>
  );
};

export default TransactionMonitoringStatus;