/**
 * StuckTransactionManager.js
 *
 * Component for managing stuck transactions in the PTS system.
 * Provides UI for:
 * - Viewing active transactions for a device
 * - Clearing stuck transactions (emergency cleanup)
 * - Monitoring transaction health
 *
 * Used as admin/diagnostic tool when transactions don't complete properly.
 */

import React, { useState, useEffect } from 'react';
import { Popup, Button, LoadPanel, DataGrid, ScrollView } from 'devextreme-react';
import { Column, Paging, Pager, SearchPanel } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import pumpControlService from '../../../../services/pumpControlService';

const StuckTransactionManager = ({ deviceId, isVisible, onClose }) => {
  const [activeTransactions, setActiveTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Load active transactions when popup opens
  useEffect(() => {
    if (isVisible && deviceId) {
      loadActiveTransactions();
    }
  }, [isVisible, deviceId]);

  const loadActiveTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await pumpControlService.api.getActiveTransactions(deviceId);

      if (response && response.transactions) {
        // Parse transaction data from Redis keys
        const parsedTransactions = response.transactions.map(tx => {
          try {
            const data = typeof tx.data === 'string' ? JSON.parse(tx.data) : tx.data;
            return {
              key: tx.key,
              transactionId: data.TransactionId,
              pumpId: data.PumpId,
              tankId: data.TankId,
              vehicleId: data.VehicleId,
              startTime: new Date(data.StartTime || data.AuthorizedAt),
              age: tx.expiresIn,
              connectionType: data.ConnectionType,
              autoClose: data.AutoCloseTransaction,
              rawData: tx.data
            };
          } catch (error) {
            console.error('Error parsing transaction data:', error, tx);
            return null;
          }
        }).filter(tx => tx !== null);

        setActiveTransactions(parsedTransactions);

        if (parsedTransactions.length === 0) {
          notify('No active transactions found for this device', 'success', 3000);
        } else {
          notify(`Found ${parsedTransactions.length} active transaction(s)`, 'info', 2000);
        }
      }
    } catch (error) {
      console.error('Error loading active transactions:', error);
      notify(`Error loading active transactions: ${error.message}`, 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStuckTransactions = async (pumpId = null) => {
    const confirmMessage = pumpId
      ? `Clear stuck transaction for Pump ${pumpId}?`
      : 'Clear ALL stuck transactions for this device?';

    const confirmed = window.confirm(
      `${confirmMessage}\n\nWARNING: This will force-clear transaction context from Redis. Use only if transactions are truly stuck.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      const response = await pumpControlService.api.clearStuckTransactions(deviceId, pumpId);

      if (response && response.message) {
        notify(response.message, 'success', 3000);
        console.log('[Cleanup] Cleared keys:', response.clearedKeys);

        // Reload active transactions to reflect changes
        await loadActiveTransactions();
      } else {
        notify('Cleanup completed but no response received', 'warning', 3000);
      }
    } catch (error) {
      console.error('Error clearing stuck transactions:', error);
      notify(`Error clearing stuck transactions: ${error.message}`, 'error', 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '<1 min';
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  };

  const getStatusColor = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMins = (now - start) / 60000;

    if (diffMins < 2) return 'tw-text-green-600'; // Normal
    if (diffMins < 5) return 'tw-text-yellow-600'; // Warning
    return 'tw-text-red-600'; // Stuck
  };

  const getStatusText = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMins = (now - start) / 60000;

    if (diffMins < 2) return 'Active';
    if (diffMins < 5) return 'Warning';
    return 'STUCK';
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      dragEnabled={true}
      closeOnOutsideClick={false}
      showTitle={true}
      title="Stuck Transaction Manager"
      width="90%"
      height="80%"
    >
      <LoadPanel visible={isLoading} />

      <div className="tw-p-4">
        {/* Header Actions */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
              Device: {deviceId}
            </h3>
            <p className="tw-text-sm tw-text-gray-600">
              Active Transactions: {activeTransactions.length}
            </p>
          </div>

          <div className="tw-flex tw-gap-2">
            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              onClick={loadActiveTransactions}
              type="default"
              stylingMode="outlined"
            />

            {activeTransactions.length > 0 && (
              <Button
                text="Clear All Stuck"
                icon="fa-light fa-broom"
                onClick={() => clearStuckTransactions()}
                type="danger"
                stylingMode="outlined"
              />
            )}
          </div>
        </div>

        {/* Warning Banner for Stuck Transactions */}
        {activeTransactions.some(tx => getStatusText(tx.startTime) === 'STUCK') && (
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4 tw-mb-4">
            <div className="tw-flex tw-items-start">
              <i className="fa-light fa-triangle-exclamation tw-text-red-600 tw-text-2xl tw-mr-3"></i>
              <div>
                <h4 className="tw-font-semibold tw-text-red-800 tw-mb-1">
                  Stuck Transactions Detected!
                </h4>
                <p className="tw-text-sm tw-text-red-700">
                  One or more transactions have been active for over 2 minutes without completion.
                  This may indicate missing EndOfTransaction packets or device communication issues.
                  Consider using the emergency cleanup if these transactions are blocking new authorizations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Grid */}
        <ScrollView height="calc(80vh - 250px)">
          {activeTransactions.length === 0 ? (
            <div className="tw-text-center tw-py-12 tw-text-gray-500">
              <i className="fa-light fa-check-circle tw-text-6xl tw-mb-4"></i>
              <p className="tw-text-lg">No active transactions found</p>
              <p className="tw-text-sm">All pumps are available for authorization</p>
            </div>
          ) : (
            <DataGrid
              dataSource={activeTransactions}
              showBorders={true}
              columnAutoWidth={true}
              hoverStateEnabled={true}
              onSelectionChanged={(e) => setSelectedTransaction(e.selectedRowsData[0])}
            >
              <SearchPanel visible={true} />
              <Paging enabled={false} />

              <Column
                dataField="transactionId"
                caption="Transaction ID"
                width={120}
              />

              <Column
                dataField="pumpId"
                caption="Pump"
                width={80}
                alignment="center"
              />

              <Column
                dataField="tankId"
                caption="Tank ID"
                width={100}
              />

              <Column
                dataField="vehicleId"
                caption="Vehicle ID"
                width={100}
              />

              <Column
                dataField="startTime"
                caption="Start Time"
                dataType="datetime"
                format="shortTime"
                width={120}
              />

              <Column
                caption="Age"
                width={100}
                cellRender={(data) => (
                  <span className={getStatusColor(data.data.startTime)}>
                    {calculateAge(data.data.startTime)}
                  </span>
                )}
              />

              <Column
                caption="Status"
                width={100}
                cellRender={(data) => {
                  const status = getStatusText(data.data.startTime);
                  const colorClass = status === 'STUCK'
                    ? 'tw-bg-red-100 tw-text-red-700'
                    : status === 'Warning'
                    ? 'tw-bg-yellow-100 tw-text-yellow-700'
                    : 'tw-bg-green-100 tw-text-green-700';

                  return (
                    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${colorClass}`}>
                      {status}
                    </span>
                  );
                }}
              />

              <Column
                dataField="connectionType"
                caption="Connection"
                width={120}
              />

              <Column
                caption="Actions"
                width={120}
                cellRender={(data) => (
                  <Button
                    text="Clear"
                    icon="fa-light fa-trash"
                    onClick={() => clearStuckTransactions(data.data.pumpId)}
                    type="danger"
                    stylingMode="text"
                    hint={`Clear transaction ${data.data.transactionId} for Pump ${data.data.pumpId}`}
                  />
                )}
              />
            </DataGrid>
          )}
        </ScrollView>

        {/* Selected Transaction Details */}
        {selectedTransaction && (
          <div className="tw-mt-4 tw-border-t tw-pt-4">
            <h4 className="tw-font-semibold tw-mb-2">Transaction Details:</h4>
            <pre className="tw-bg-gray-100 tw-p-3 tw-rounded tw-text-xs tw-overflow-auto tw-max-h-32">
              {JSON.stringify(selectedTransaction, null, 2)}
            </pre>
          </div>
        )}

        {/* Help Text */}
        <div className="tw-mt-4 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded">
          <p className="tw-text-xs tw-text-blue-800">
            <strong>Note:</strong> Transactions older than 2 minutes are considered "stuck" and should be investigated.
            The system will automatically attempt to complete stuck transactions, but manual cleanup may be needed if
            EndOfTransaction packets are not received. Use "Clear All Stuck" only if transactions are blocking pump operations.
          </p>
        </div>
      </div>
    </Popup>
  );
};

export default StuckTransactionManager;
