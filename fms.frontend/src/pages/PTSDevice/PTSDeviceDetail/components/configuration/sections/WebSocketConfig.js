/**
 * WebSocketConfig.js
 * WebSocket upload configuration section
 * Manages device WebSocket communication settings
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import notify from "devextreme/ui/notify";
import ptsConfigService from "../../../../../../services/ptsConfigService";
import {
  Toggle,
  Slider,
  ConfigCard,
  ConfigSection,
  StatusBadge,
} from "../controls/ConfigControls";
import "./WebSocketConfig.scss";

const WebSocketConfig = ({ device, isConnected, onConfigChange }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  // Load configuration
  const loadConfig = useCallback(async () => {
    if (!device?.ptsid || !isConnected) return;

    setLoading(true);
    try {
      const summary = await ptsConfigService.getWebSocketConfigSummary(device.ptsid);
      setConfig(summary);
      setPendingChanges({});
    } catch (error) {
      console.error("Error loading WebSocket config:", error);
      notify("Failed to load WebSocket configuration", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [device?.ptsid, isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadConfig();
    }
  }, [isConnected, loadConfig]);

  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  // Get effective value
  const getEffectiveValue = useCallback((key, currentValue) => {
    return key in pendingChanges ? pendingChanges[key] : currentValue;
  }, [pendingChanges]);

  // Handle toggle change
  const handleChange = useCallback((key, newValue, currentValue) => {
    setPendingChanges(prev => {
      const updated = { ...prev };
      if (newValue === currentValue) {
        delete updated[key];
      } else {
        updated[key] = newValue;
      }
      return updated;
    });
  }, []);

  // Cancel changes
  const handleCancel = useCallback(() => {
    setPendingChanges({});
    notify("Changes cancelled", "info", 2000);
  }, []);

  // Save changes
  const handleSave = async () => {
    if (!device?.ptsid || !hasChanges) return;

    setSaving(true);
    try {
      const apiConfig = {};
      const keyMapping = {
        uploadStatus: 'websocketsUploadStatus',
        uploadPumpTransactions: 'websocketsUploadPumpTransactions',
        uploadTankMeasurements: 'websocketsUploadTankMeasurements',
        uploadInTankDeliveries: 'websocketsUploadInTankDeliveries',
        uploadGpsRecords: 'websocketsUploadGpsRecords',
        uploadAlertRecords: 'websocketsUploadAlertRecords',
        statusPeriodSeconds: 'websocketsUploadStatusRequestsPeriodSeconds',
      };

      for (const [key, value] of Object.entries(pendingChanges)) {
        const apiKey = keyMapping[key] || key;
        apiConfig[apiKey] = value;
      }

      const result = await ptsConfigService.setRemoteServerConfiguration(device.ptsid, apiConfig);

      if (result.isSuccess) {
        notify("Configuration saved successfully!", "success", 3000);
        setPendingChanges({});
        onConfigChange?.();
        setTimeout(loadConfig, 3000);
      } else {
        notify(result.message || "Failed to save configuration", "error", 3000);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      notify("Error saving configuration", "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isConnected) {
    return (
      <ConfigSection
        title="WebSocket Configuration"
        icon="fa-light fa-satellite-dish"
        description="Configure WebSocket communication settings"
      >
        <div className="tw-text-center tw-py-6 tw-text-gray-500">
          <span><i className="fa-light fa-plug-circle-xmark tw-text-4xl tw-mb-3 tw-block"></i></span>
          <p>Device must be connected to configure WebSocket settings</p>
        </div>
      </ConfigSection>
    );
  }

  if (loading) {
    return (
      <ConfigSection
        title="WebSocket Configuration"
        icon="fa-light fa-satellite-dish"
        description="Configure WebSocket communication settings"
      >
        <div className="tw-flex tw-items-center tw-justify-center tw-py-6">
          <span><i className="fa-light fa-spinner fa-spin tw-text-2xl tw-text-blue-500"></i></span>
          <span className="tw-ml-3 tw-text-gray-600">Loading configuration...</span>
        </div>
      </ConfigSection>
    );
  }

  return (
    <ConfigSection
      title="WebSocket Configuration"
      icon="fa-light fa-satellite-dish"
      description="Configure WebSocket communication settings"
      actions={
        <div className="tw-flex tw-items-center tw-gap-2">
          {config && (
            <StatusBadge
              status={config.isWebsocketsCommunicationSuccessful ? "success" : "error"}
              label={config.isWebsocketsCommunicationSuccessful ? "Connected" : "Disconnected"}
            />
          )}
          <button
            type="button"
            onClick={loadConfig}
            disabled={loading}
            className="tw-p-2 tw-text-gray-500 hover:tw-text-gray-700 hover:tw-bg-gray-200 tw-rounded tw-transition-colors"
            title="Refresh configuration"
          >
            <span><i className={`fa-light fa-sync ${loading ? "fa-spin" : ""}`}></i></span>
          </button>
        </div>
      }
    >
      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="tw-bg-yellow-50 tw-border tw-border-yellow-300 tw-rounded-lg tw-p-3 tw-mb-4 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-yellow-800">
            <span><i className="fa-light fa-exclamation-triangle"></i></span>
            <span className="tw-text-sm">You have unsaved changes</span>
          </div>
          <div className="tw-flex tw-gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="tw-px-3 tw-py-1 tw-text-sm tw-text-gray-600 tw-border tw-border-gray-300 tw-rounded hover:tw-bg-gray-100 tw-transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="tw-px-3 tw-py-1 tw-text-sm tw-text-white tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors tw-flex tw-items-center tw-gap-2"
            >
              {saving && <span><i className="fa-light fa-spinner fa-spin"></i></span>}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {config ? (
        <>
          {/* Connection Info */}
          <div className="tw-bg-gray-100 tw-rounded-lg tw-p-3 tw-mb-4 tw-text-sm">
            <div className="tw-flex tw-flex-wrap tw-gap-4">
              <span className="tw-text-gray-600">
                URI: <code className="tw-bg-white tw-px-1 tw-rounded">{config.websocketsUri || "N/A"}</code>
              </span>
              <span className="tw-text-gray-600">
                Port: <code className="tw-bg-white tw-px-1 tw-rounded">{config.websocketsPort || "N/A"}</code>
              </span>
            </div>
          </div>

          {/* Upload Settings Grid */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            <ConfigCard
              title="Upload Status"
              icon="fa-light fa-chart-line"
              hasChanges={'uploadStatus' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadStatus', config.uploads?.status?.enabled)}
                onChange={(v) => handleChange('uploadStatus', v, config.uploads?.status?.enabled)}
                disabled={saving}
                label="Enable Status Uploads"
              />
              {config.uploads?.status?.enabled && (
                <div className="tw-mt-3">
                  <Slider
                    value={getEffectiveValue('statusPeriodSeconds', config.uploads?.status?.periodSeconds || 10)}
                    onChange={(v) => handleChange('statusPeriodSeconds', v, config.uploads?.status?.periodSeconds)}
                    min={5}
                    max={60}
                    step={5}
                    unit="s"
                    label="Upload Period"
                    disabled={saving}
                  />
                </div>
              )}
            </ConfigCard>

            <ConfigCard
              title="Pump Transactions"
              icon="fa-light fa-gas-pump"
              hasChanges={'uploadPumpTransactions' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadPumpTransactions', config.uploads?.pumpTransactions)}
                onChange={(v) => handleChange('uploadPumpTransactions', v, config.uploads?.pumpTransactions)}
                disabled={saving}
                label="Enable"
                description="Send transactions via WebSocket"
              />
            </ConfigCard>

            <ConfigCard
              title="Tank Measurements"
              icon="fa-light fa-truck-container"
              hasChanges={'uploadTankMeasurements' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadTankMeasurements', config.uploads?.tankMeasurements)}
                onChange={(v) => handleChange('uploadTankMeasurements', v, config.uploads?.tankMeasurements)}
                disabled={saving}
                label="Enable"
                description="Send tank data via WebSocket"
              />
            </ConfigCard>

            <ConfigCard
              title="In-Tank Deliveries"
              icon="fa-light fa-truck-ramp-box"
              hasChanges={'uploadInTankDeliveries' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadInTankDeliveries', config.uploads?.inTankDeliveries)}
                onChange={(v) => handleChange('uploadInTankDeliveries', v, config.uploads?.inTankDeliveries)}
                disabled={saving}
                label="Enable"
                description="Send delivery data via WebSocket"
              />
            </ConfigCard>

            <ConfigCard
              title="Alert Records"
              icon="fa-light fa-bell"
              hasChanges={'uploadAlertRecords' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadAlertRecords', config.uploads?.alertRecords)}
                onChange={(v) => handleChange('uploadAlertRecords', v, config.uploads?.alertRecords)}
                disabled={saving}
                label="Enable"
                description="Send alerts via WebSocket"
              />
            </ConfigCard>

            <ConfigCard
              title="GPS Records"
              icon="fa-light fa-location-dot"
              hasChanges={'uploadGpsRecords' in pendingChanges}
            >
              <Toggle
                value={getEffectiveValue('uploadGpsRecords', config.uploads?.gpsRecords)}
                onChange={(v) => handleChange('uploadGpsRecords', v, config.uploads?.gpsRecords)}
                disabled={saving}
                label="Enable"
                description="Send GPS data via WebSocket"
              />
            </ConfigCard>
          </div>
        </>
      ) : (
        <div className="tw-text-center tw-py-6 tw-text-gray-500">
          <p>Click refresh to load configuration</p>
        </div>
      )}
    </ConfigSection>
  );
};

export default WebSocketConfig;
