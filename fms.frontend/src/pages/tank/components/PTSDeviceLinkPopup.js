import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { RadioGroup } from 'devextreme-react/radio-group';
import notify from 'devextreme/ui/notify';
import { useDeviceData } from '../../../signalR/hooks/useDeviceData';
import { createOpeningStock, createClosingStock, createTankTransfer } from '../../../redux/actions/tankStockAction';
import { fetchPTSDevices } from '../../../redux/actions/ptsActions/ptsDeviceActions';

const PTSDeviceLinkPopup = ({ visible, tank, onClose }) => {
  const dispatch = useDispatch();
  const { ptsDevices } = useSelector(state => state.ptsDevice);
  const { tanks } = useSelector(state => state.tank);

  const [selectedDeviceId, setSelectedDeviceId] = useState(tank?.ptsId || null);
  const [actionType, setActionType] = useState('read'); // 'read', 'openingStock', 'closingStock', 'transfer', 'delivery'
  const [currentVolume, setCurrentVolume] = useState(0);
  const [targetTankId, setTargetTankId] = useState(null);
  const [transferAmount, setTransferAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    uploadStatus,
    isConnected,
    isConnecting,
    refreshConnection,
    startConnection,
    stopConnection
  } = useDeviceData(selectedDeviceId);

  useEffect(() => {
    if (!ptsDevices || ptsDevices.length === 0) {
      dispatch(fetchPTSDevices());
    }
  }, [dispatch, ptsDevices]);

  useEffect(() => {
    if (selectedDeviceId && uploadStatus?.probeData) {
      const probeVolume = uploadStatus.probeData.volume || 0;
      setCurrentVolume(probeVolume);
    }
  }, [selectedDeviceId, uploadStatus]);

  const actionOptions = [
    { value: 'read', text: 'Read Current Volume' },
    { value: 'openingStock', text: 'Create Opening Stock' },
    { value: 'closingStock', text: 'Create Closing Stock' },
    { value: 'transfer', text: 'Tank Transfer' },
    { value: 'delivery', text: 'Record Delivery' }
  ];

  const handleDeviceChange = (value) => {
    setSelectedDeviceId(value);
    if (!isConnected && value) {
      // Try to start connection if not connected
      startConnection();
    }
  };

  const handleConnectToSignalR = async () => {
    try {
      if (!isConnected && !isConnecting) {
        await startConnection();
        notify('Connecting to real-time data...', 'info');
      } else if (isConnected) {
        await refreshConnection();
        notify('Connection refreshed', 'success');
      }
    } catch (error) {
      notify('Failed to connect to real-time data', 'error');
    }
  };

  const handleAction = async () => {
    if (!selectedDeviceId) {
      notify('Please select a PTS device', 'warning');
      return;
    }

    if (currentVolume <= 0) {
      notify('No volume data available from device', 'warning');
      return;
    }

    setLoading(true);
    try {
      switch (actionType) {
        case 'read':
          notify(`Current volume: ${currentVolume.toFixed(2)} L`, 'info');
          break;

        case 'openingStock':
          const openingResult = await dispatch(createOpeningStock(tank.id, currentVolume, new Date()));
          if (openingResult.success) {
            notify('Opening stock created successfully', 'success');
            onClose();
          } else {
            notify(openingResult.message || 'Error creating opening stock', 'error');
          }
          break;

        case 'closingStock':
          const closingResult = await dispatch(createClosingStock(tank.id, currentVolume, new Date()));
          if (closingResult.success) {
            notify('Closing stock created successfully', 'success');
            onClose();
          } else {
            notify(closingResult.message || 'Error creating closing stock', 'error');
          }
          break;

        case 'transfer':
          if (!targetTankId || transferAmount <= 0) {
            notify('Please select target tank and enter transfer amount', 'warning');
            return;
          }
          const transferData = {
            sourceTankId: tank.id,
            destinationTankId: targetTankId,
            amount: transferAmount,
            transferDate: new Date()
          };
          const transferResult = await dispatch(createTankTransfer(transferData));
          if (transferResult.success) {
            notify('Tank transfer recorded successfully', 'success');
            onClose();
          } else {
            notify(transferResult.message || 'Error recording transfer', 'error');
          }
          break;

        case 'delivery':
          // TODO: Implement delivery recording
          notify('Delivery recording not yet implemented', 'info');
          break;
      }
    } catch (error) {
      notify(error.message || 'Error performing action', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderProbeStatus = () => {
    if (!selectedDeviceId || !uploadStatus) {
      return null;
    }

    const probeData = uploadStatus.probeData;
    if (!probeData) {
      return (
        <div className="tw-text-yellow-600 tw-p-4 tw-bg-yellow-50 tw-rounded-lg tw-mt-4">
          <i className="fas fa-exclamation-triangle tw-mr-2"></i>
          No probe data available from device
        </div>
      );
    }

    return (
      <div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-rounded-lg">
        <h4 className="tw-font-semibold tw-mb-2">Probe Reading</h4>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <div>
            <span className="tw-text-gray-600">Volume:</span>
            <span className="tw-ml-2 tw-font-medium">{currentVolume.toFixed(2)} L</span>
          </div>
          <div>
            <span className="tw-text-gray-600">Temperature:</span>
            <span className="tw-ml-2 tw-font-medium">{probeData.temperature || 'N/A'} °C</span>
          </div>
          <div>
            <span className="tw-text-gray-600">Height:</span>
            <span className="tw-ml-2 tw-font-medium">{probeData.height || 'N/A'} mm</span>
          </div>
          <div>
            <span className="tw-text-gray-600">Water Level:</span>
            <span className="tw-ml-2 tw-font-medium">{probeData.waterLevel || '0'} mm</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={true}
      showTitle={true}
      title={`PTS Device Link - ${tank?.name || 'Tank'}`}
      width={500}
      height="auto"
      showCloseButton = {true}

    >
      <div className="tw-p-4">
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
            Select PTS Device
          </label>
          <SelectBox
            dataSource={ptsDevices}
            displayExpr={(item) => item ? `${item.name} (${item.ptsid})` : ''}
            valueExpr="ptsid"
            value={selectedDeviceId}
            onValueChanged={(e) => handleDeviceChange(e.value)}
            placeholder="Select a PTS device"
            searchEnabled={true}
            width="100%"
          />
        </div>

        {selectedDeviceId && (
          <>
            <div className="tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center">
                  <span className="tw-text-sm tw-font-medium tw-mr-2">Real-time Connection:</span>
                  <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                    isConnected ? 'tw-bg-green-100 tw-text-green-800' :
                    isConnecting ? 'tw-bg-yellow-100 tw-text-yellow-800' :
                    'tw-bg-red-100 tw-text-red-800'
                  }`}>
                    {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                  </span>
                </div>
                <Button
                  text={isConnected ? 'Refresh' : 'Connect'}
                  icon={isConnecting ? 'fas fa-spinner fa-spin' : isConnected ? 'fas fa-sync' : 'fas fa-plug'}
                  onClick={handleConnectToSignalR}
                  disabled={isConnecting}
                  type="normal"
                  stylingMode="text"
                />
              </div>
            </div>

            <div className="tw-mb-4">
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Select Action
              </label>
              <RadioGroup
                dataSource={actionOptions}
                displayExpr="text"
                valueExpr="value"
                value={actionType}
                onValueChanged={(e) => setActionType(e.value)}
                layout="vertical"
              />
            </div>

            {renderProbeStatus()}

            {actionType === 'transfer' && (
              <div className="tw-mt-4 tw-space-y-4">
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                    Target Tank
                  </label>
                  <SelectBox
                    dataSource={tanks.filter(t => t.id !== tank?.id)}
                    displayExpr="name"
                    valueExpr="id"
                    value={targetTankId}
                    onValueChanged={(e) => setTargetTankId(e.value)}
                    placeholder="Select target tank"
                    width="100%"
                  />
                </div>
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                    Transfer Amount (L)
                  </label>
                  <NumberBox
                    value={transferAmount}
                    onValueChanged={(e) => setTransferAmount(e.value)}
                    min={0}
                    max={currentVolume}
                    format="#,##0.00"
                    showSpinButtons={true}
                    width="100%"
                  />
                </div>
              </div>
            )}

            <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
              <Button
                text="Cancel"
                onClick={onClose}
                type="normal"
              />
              <Button
                text={actionType === 'read' ? 'Close' : 'Execute'}
                onClick={handleAction}
                type="default"
                disabled={loading || !isConnected}
                icon={loading ? 'fas fa-spinner fa-spin' : null}
              />
            </div>
          </>
        )}
      </div>
    </Popup>
  );
};

export default PTSDeviceLinkPopup;