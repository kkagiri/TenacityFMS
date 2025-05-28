//Cursor: New component for displaying real-time transaction monitoring
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Badge } from 'devextreme-react/badge';
import { Button } from 'devextreme-react/button';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { Tooltip } from 'devextreme-react/tooltip';
import { LoadPanel } from 'devextreme-react/load-panel';
import SignalRService from '../../signalR/SignalRService';
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

  // Get real-time data from Redux
  const uploadStatus = useSelector(state =>
    state.realtimeStatus.deviceStatuses[deviceId]?.status
  );

  useEffect(() => {
    if (!isVisible || !transactionId) return;

    // Set up SignalR listener for transaction monitoring updates
    const handleTransactionMonitoringUpdate = (data) => {
      if (data.deviceId === deviceId && data.transactionId === transactionId) {
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
      }
    };

    const handleTransactionCompleted = (data) => {
      if (data.deviceId === deviceId && data.pump === pumpId) {
        setMonitoringData(prev => ({
          ...prev,
          status: 'Completed',
          finalData: data
        }));
        setLastUpdated(new Date());
      }
    };

    // Register SignalR event handlers
    if (SignalRService.connection) {
      SignalRService.connection.on('TransactionMonitoringUpdate', handleTransactionMonitoringUpdate);
      SignalRService.connection.on('TransactionCompleted', handleTransactionCompleted);
    }

    // Cleanup
    return () => {
      if (SignalRService.connection) {
        SignalRService.connection.off('TransactionMonitoringUpdate', handleTransactionMonitoringUpdate);
        SignalRService.connection.off('TransactionCompleted', handleTransactionCompleted);
      }
    };
  }, [isVisible, deviceId, pumpId, transactionId]);

  // Get current pump status from upload status
  const getCurrentPumpStatus = () => {
    if (!uploadStatus?.pumps) return null;

    // Check various status types
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
  };

  const currentPumpStatus = getCurrentPumpStatus();

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

  const canCancel = () => {
    const status = monitoringData?.status?.toLowerCase();
    return status && !['completed', 'cancelled', 'error'].includes(status);
  };

  const canComplete = () => {
    const status = monitoringData?.status?.toLowerCase();
    return status === 'awaitingmanualcompletion' ||
           (currentPumpStatus?.type === 'endOfTransaction' && connectionType !== 'HTTPPolling');
  };

  const handleCancelTransaction = async () => {
    if (!canCancel()) return;

    setIsLoading(true);
    try {
      await onCancel(transactionId, 'User cancelled');
    } catch (error) {
      console.error('Error cancelling transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!canComplete()) return;

    setIsLoading(true);
    try {
      await onComplete(transactionId);
    } catch (error) {
      console.error('Error completing transaction:', error);
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
          <Badge
            text={`#${transactionId}`}
            type="default"
            className="tw-transaction-badge"
          />
        </h4>
        <div className="tw-connection-info">
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
                <span className="tw-data-value">{monitoringData.volume} L</span>
              </div>
            )}
            {monitoringData.amount && (
              <div className="tw-data-row">
                <span className="tw-data-label">Amount:</span>
                <span className="tw-data-value">${monitoringData.amount}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Upload Status Data */}
        {currentPumpStatus && (
          <div className="tw-live-status">
            <div className="tw-live-status-header">
              <span className="tw-live-status-title">Live Status:</span>
              <Badge
                text={currentPumpStatus.type.toUpperCase()}
                type={currentPumpStatus.type === 'filling' ? 'success' : 'default'}
              />
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
                </div>
              ))}
            </div>
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
            disabled={isLoading}
            className="tw-cancel-button"
          />
        )}

        {canComplete() && (
          <Button
            text="Complete Transaction"
            type="success"
            onClick={handleCompleteTransaction}
            disabled={isLoading}
            className="tw-complete-button"
          />
        )}
      </div>
    </div>
  );
};

export default TransactionMonitoringStatus;