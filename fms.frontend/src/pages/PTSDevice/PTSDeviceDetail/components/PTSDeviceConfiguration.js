import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "devextreme-react/button";
import { Switch } from "devextreme-react/switch";
import { LoadIndicator } from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import ptsConfigService from "../../../../services/ptsConfigService";
import "./PTSDeviceConfiguration.scss";

/**
 * PTSDeviceConfiguration - Configuration management page
 * Allows viewing and modifying PTS device remote server settings,
 * including WebSocket upload configuration.
 *
 * Uses a "Save" button pattern - changes are collected locally and
 * sent in a single API call when Save is clicked.
 */
const PTSDeviceConfiguration = ({ device, isConnected }) => {
  const [saving, setSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [remoteConfig, setRemoteConfig] = useState(null);
  const [wsConfigSummary, setWsConfigSummary] = useState(null);

  // Local state for pending changes (not yet saved)
  const [pendingChanges, setPendingChanges] = useState({});

  // Load remote server configuration
  const loadConfiguration = useCallback(async () => {
    if (!device?.ptsid || !isConnected) return;

    setConfigLoading(true);
    try {
      const result = await ptsConfigService.getRemoteServerConfiguration(device.ptsid);
      if (result.isSuccess) {
        setRemoteConfig(result.data);
        // Also get the summary
        const summary = await ptsConfigService.getWebSocketConfigSummary(device.ptsid);
        setWsConfigSummary(summary);
        // Clear pending changes when config is loaded
        setPendingChanges({});
      } else {
        notify(result.message || "Failed to load configuration", "error", 3000);
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      notify("Error loading device configuration", "error", 3000);
    } finally {
      setConfigLoading(false);
    }
  }, [device?.ptsid, isConnected]);

  useEffect(() => {
    if (isConnected && device?.ptsid) {
      loadConfiguration();
    }
  }, [isConnected, device?.ptsid, loadConfiguration]);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  // Get effective value (pending change or current config value)
  const getEffectiveValue = useCallback((key, currentValue) => {
    if (key in pendingChanges) {
      return pendingChanges[key];
    }
    return currentValue;
  }, [pendingChanges]);

  // Handle local toggle change (doesn't call API yet)
  const handleToggleChange = useCallback((key, newValue, currentValue) => {
    setPendingChanges(prev => {
      const updated = { ...prev };
      // If the new value equals the original, remove the pending change
      if (newValue === currentValue) {
        delete updated[key];
      } else {
        updated[key] = newValue;
      }
      return updated;
    });
  }, []);

  // Cancel pending changes
  const handleCancelChanges = useCallback(() => {
    setPendingChanges({});
    notify("Changes cancelled", "info", 2000);
  }, []);

  // Save all pending changes in a single API call
  const handleSaveChanges = async () => {
    if (!device?.ptsid || !hasChanges) return;

    setSaving(true);
    try {
      // Build the configuration object with all pending changes
      const config = {};

      // Map our UI keys to the API property names
      const keyMapping = {
        uploadStatus: 'websocketsUploadStatus',
        uploadPumpTransactions: 'websocketsUploadPumpTransactions',
        uploadTankMeasurements: 'websocketsUploadTankMeasurements',
        uploadInTankDeliveries: 'websocketsUploadInTankDeliveries',
        uploadGpsRecords: 'websocketsUploadGpsRecords',
        uploadAlertRecords: 'websocketsUploadAlertRecords',
        statusPeriodSeconds: 'websocketsUploadStatusRequestsPeriodSeconds',
      };

      // Convert pending changes to API format
      for (const [key, value] of Object.entries(pendingChanges)) {
        const apiKey = keyMapping[key] || key;
        config[apiKey] = value;
      }

      console.log("Saving configuration changes:", config);

      const result = await ptsConfigService.setRemoteServerConfiguration(device.ptsid, config);

      if (result.isSuccess) {
        notify("Configuration saved successfully! Device may reconnect to apply changes.", "success", 5000);
        // Clear pending changes
        setPendingChanges({});
        // Wait a bit for device to potentially reconnect, then reload
        setTimeout(async () => {
          try {
            await loadConfiguration();
          } catch (e) {
            console.log("Config reload after save - device may still be reconnecting");
          }
        }, 3000);
      } else {
        // Check if error is due to device reconnection (common after config changes)
        const errorMessage = result.message || "";
        if (errorMessage.includes("timeout") || errorMessage.includes("Connection") || errorMessage.includes("closed")) {
          notify(
            "Command sent but device may have restarted to apply changes. Please wait for reconnection and verify settings.",
            "warning",
            8000
          );
          setPendingChanges({});
          // Try to reload after device reconnects
          setTimeout(async () => {
            try {
              await loadConfiguration();
            } catch (e) {
              console.log("Config reload after timeout - device may still be reconnecting");
            }
          }, 10000);
        } else {
          notify(result.message || "Failed to save configuration", "error", 3000);
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      // Check if it's a timeout/connection error (device may have rebooted)
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes("timeout") || errorMessage.includes("Network") || errorMessage.includes("connection")) {
        notify(
          "Configuration command sent. Device may restart to apply changes. Please wait and refresh to verify.",
          "warning",
          8000
        );
        setPendingChanges({});
        setTimeout(async () => {
          try {
            await loadConfiguration();
          } catch (e) {
            console.log("Config reload after error - device may still be reconnecting");
          }
        }, 10000);
      } else {
        notify("Error saving device configuration", "error", 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const configurationSections = [
    {
      title: "Pump Service",
      icon: "fa-light fa-gas-pump",
      description: "Configure pump settings, nozzle mappings, and fueling parameters",
      status: "planned",
    },
    {
      title: "Tank Configuration",
      icon: "fa-light fa-truck-container",
      description: "Set up tank probes, alarms, and capacity settings",
      status: "planned",
    },
    {
      title: "Reader Settings",
      icon: "fa-light fa-tag",
      description: "Configure RFID readers and tag authentication",
      status: "planned",
    },
    {
      title: "Fuel Grades",
      icon: "fa-light fa-dollar-sign",
      description: "Manage fuel grade prices and blending ratios",
      status: "planned",
    },
    {
      title: "Firmware Update",
      icon: "fa-light fa-microchip",
      description: "Check and apply firmware updates",
      status: "planned",
    },
    {
      title: "Network Settings",
      icon: "fa-light fa-network-wired",
      description: "Configure IP address, port, and connection settings",
      status: "planned",
    },
  ];

  return (
    <div className="pts-device-configuration">
      <div className="config-header">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
            Device Configuration
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            Advanced configuration settings based on firmware capabilities
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-4">
          {isConnected && (
            <div className="connection-badge">
              <i className="fa-light fa-circle-check tw-mr-2"></i>
              Connected
            </div>
          )}
          {isConnected && (
            <Button
              text="Refresh Config"
              icon="fa-light fa-sync"
              type="default"
              stylingMode="outlined"
              onClick={loadConfiguration}
              disabled={configLoading}
            />
          )}
        </div>
      </div>

      {/* WebSocket Configuration Section - Active Feature */}
      {isConnected && (
        <div className="websocket-config-section tw-mb-6">
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h4 className="tw-font-semibold tw-text-blue-800">
                <i className="fa-light fa-satellite-dish tw-mr-2"></i>
                WebSocket Upload Configuration
              </h4>
              {/* Save/Cancel buttons */}
              {hasChanges && (
                <div className="tw-flex tw-gap-2">
                  <Button
                    text="Cancel"
                    type="default"
                    stylingMode="outlined"
                    onClick={handleCancelChanges}
                    disabled={saving}
                  />
                  <Button
                    text="Save Changes"
                    type="success"
                    icon="fa-light fa-save"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            {/* Unsaved changes indicator */}
            {hasChanges && (
              <div className="tw-bg-yellow-100 tw-border tw-border-yellow-300 tw-rounded tw-p-2 tw-mb-3 tw-text-sm tw-text-yellow-800">
                <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                You have unsaved changes. Click "Save Changes" to apply them to the device.
              </div>
            )}

            {configLoading ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                <LoadIndicator height={24} width={24} />
                <span className="tw-ml-2 tw-text-gray-600">Loading configuration...</span>
              </div>
            ) : saving ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                <LoadIndicator height={24} width={24} />
                <span className="tw-ml-2 tw-text-gray-600">Saving configuration to device...</span>
              </div>
            ) : wsConfigSummary ? (
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                {/* Upload Status Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadStatus' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">Upload Status</span>
                    <Switch
                      value={getEffectiveValue('uploadStatus', wsConfigSummary.uploads.status.enabled)}
                      onValueChanged={(e) => handleToggleChange('uploadStatus', e.value, wsConfigSummary.uploads.status.enabled)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Period: {wsConfigSummary.uploads.status.periodSeconds || 10}s
                  </p>
                </div>

                {/* Pump Transactions Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadPumpTransactions' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">Pump Transactions</span>
                    <Switch
                      value={getEffectiveValue('uploadPumpTransactions', wsConfigSummary.uploads.pumpTransactions)}
                      onValueChanged={(e) => handleToggleChange('uploadPumpTransactions', e.value, wsConfigSummary.uploads.pumpTransactions)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Send transactions via WebSocket
                  </p>
                </div>

                {/* Tank Measurements Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadTankMeasurements' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">Tank Measurements</span>
                    <Switch
                      value={getEffectiveValue('uploadTankMeasurements', wsConfigSummary.uploads.tankMeasurements)}
                      onValueChanged={(e) => handleToggleChange('uploadTankMeasurements', e.value, wsConfigSummary.uploads.tankMeasurements)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Send tank data via WebSocket
                  </p>
                </div>

                {/* In-Tank Deliveries Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadInTankDeliveries' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">In-Tank Deliveries</span>
                    <Switch
                      value={getEffectiveValue('uploadInTankDeliveries', wsConfigSummary.uploads.inTankDeliveries)}
                      onValueChanged={(e) => handleToggleChange('uploadInTankDeliveries', e.value, wsConfigSummary.uploads.inTankDeliveries)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Send delivery data via WebSocket
                  </p>
                </div>

                {/* Alert Records Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadAlertRecords' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">Alert Records</span>
                    <Switch
                      value={getEffectiveValue('uploadAlertRecords', wsConfigSummary.uploads.alertRecords)}
                      onValueChanged={(e) => handleToggleChange('uploadAlertRecords', e.value, wsConfigSummary.uploads.alertRecords)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Send alerts via WebSocket
                  </p>
                </div>

                {/* GPS Records Toggle */}
                <div className={`tw-bg-white tw-rounded-lg tw-p-3 tw-border ${('uploadGpsRecords' in pendingChanges) ? 'tw-border-yellow-400 tw-bg-yellow-50' : 'tw-border-gray-200'}`}>
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <span className="tw-font-medium tw-text-gray-700">GPS Records</span>
                    <Switch
                      value={getEffectiveValue('uploadGpsRecords', wsConfigSummary.uploads.gpsRecords)}
                      onValueChanged={(e) => handleToggleChange('uploadGpsRecords', e.value, wsConfigSummary.uploads.gpsRecords)}
                      disabled={saving}
                    />
                  </div>
                  <p className="tw-text-xs tw-text-gray-500">
                    Send GPS data via WebSocket
                  </p>
                </div>
              </div>
            ) : (
              <div className="tw-text-center tw-py-4">
                <p className="tw-text-gray-600">
                  Click "Refresh Config" to load WebSocket configuration
                </p>
              </div>
            )}

            {/* Connection Status */}
            {wsConfigSummary && (
              <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-blue-200">
                <div className="tw-flex tw-items-center tw-gap-4 tw-text-sm">
                  <span className="tw-text-gray-600">
                    WebSocket URI: <code className="tw-bg-gray-100 tw-px-1 tw-rounded">{wsConfigSummary.websocketsUri || "N/A"}</code>
                  </span>
                  <span className="tw-text-gray-600">
                    Port: <code className="tw-bg-gray-100 tw-px-1 tw-rounded">{wsConfigSummary.websocketsPort || "N/A"}</code>
                  </span>
                  <span className={wsConfigSummary.isWebsocketsCommunicationSuccessful ? "tw-text-green-600" : "tw-text-red-600"}>
                    <i className={`fa-light ${wsConfigSummary.isWebsocketsCommunicationSuccessful ? "fa-check-circle" : "fa-times-circle"} tw-mr-1`}></i>
                    {wsConfigSummary.isWebsocketsCommunicationSuccessful ? "Communication OK" : "Communication Failed"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="info-banner tw-mb-4">
          <i className="fa-light fa-circle-info"></i>
          <div>
            <h4 className="tw-font-semibold tw-mb-1">Device Not Connected</h4>
            <p className="tw-text-sm">
              Connect to the device via WebSocket to access configuration settings.
            </p>
          </div>
        </div>
      )}

      <div className="info-banner">
        <i className="fa-light fa-circle-info"></i>
        <div>
          <h4 className="tw-font-semibold tw-mb-1">Additional Configuration - Coming Soon</h4>
          <p className="tw-text-sm">
            The following sections will allow you to configure additional device settings based on firmware version
            and capabilities.
          </p>
        </div>
      </div>

      <div className="config-sections">
        {configurationSections.map((section, idx) => (
          <div key={idx} className="config-card">
            <div className="card-icon">
              <i className={section.icon}></i>
            </div>
            <div className="card-content">
              <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                {section.title}
              </h4>
              <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
                {section.description}
              </p>
              <div className="status-badge planned">
                <i className="fa-light fa-clock tw-mr-1"></i>
                Planned Feature
              </div>
            </div>
            <div className="card-actions">
              <Button
                text="Configure"
                type="default"
                stylingMode="outlined"
                disabled
              />
            </div>
          </div>
        ))}
      </div>

      <div className="config-footer">
        <div className="footer-section">
          <h4 className="tw-font-semibold tw-mb-2">
            <i className="fa-light fa-book tw-mr-2"></i>
            Documentation
          </h4>
          <p className="tw-text-sm tw-text-gray-600">
            Configuration requests follow the PTS protocol specification. See
            documentation for details on firmware-specific configuration options.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="tw-font-semibold tw-mb-2">
            <i className="fa-light fa-road-barrier tw-mr-2"></i>
            Prerequisites
          </h4>
          <ul className="tw-text-sm tw-text-gray-600 tw-list-disc tw-list-inside">
            <li>Device must be connected via WebSocket</li>
            <li>Firmware must support configuration protocol</li>
            <li>User must have configuration permissions</li>
          </ul>
        </div>
      </div>

      <div className="current-config">
        <h4 className="tw-font-semibold tw-mb-3">Current Device Information</h4>
        <div className="config-grid">
          <div className="config-item">
            <label>Configuration ID</label>
            <span>{device.configurationId || "N/A"}</span>
          </div>
          <div className="config-item">
            <label>Firmware Date</label>
            <span>
              {device.firmwareDateTime
                ? new Date(device.firmwareDateTime).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="config-item">
            <label>WebSocket Capable</label>
            <span className={device.webSocketCapable ? "tw-text-green-600" : "tw-text-red-600"}>
              {device.webSocketCapable ? "Yes" : "No"}
            </span>
          </div>
          <div className="config-item">
            <label>Direct Commands</label>
            <span className={device.allowedForDirectCommands ? "tw-text-green-600" : "tw-text-red-600"}>
              {device.allowedForDirectCommands ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PTSDeviceConfiguration;
