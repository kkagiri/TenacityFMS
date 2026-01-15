/**
 * PTSDeviceConfiguration.js
 * Main configuration page for PTS devices
 * Uses refactored configuration components with HTML-based controls
 */

import React, { useCallback, useState } from "react";
import { WebSocketConfig, PumpServiceConfig } from "./configuration";
import { StatusBadge } from "./configuration/controls";
import "./PTSDeviceConfiguration.scss";

const PTSDeviceConfiguration = ({ device, isConnected }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Trigger refresh for all config sections
  const handleConfigChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Planned configuration sections (future features)
  const plannedSections = [
    {
      title: "Tank Configuration",
      icon: "fa-light fa-truck-container",
      description: "Set up tank probes, alarms, and capacity settings",
    },
    {
      title: "Reader Settings",
      icon: "fa-light fa-tag",
      description: "Configure RFID readers and tag authentication",
    },
    {
      title: "Fuel Grades",
      icon: "fa-light fa-dollar-sign",
      description: "Manage fuel grade prices and blending ratios",
    },
    {
      title: "Firmware Update",
      icon: "fa-light fa-microchip",
      description: "Check and apply firmware updates",
    },
    {
      title: "Network Settings",
      icon: "fa-light fa-network-wired",
      description: "Configure IP address, port, and connection settings",
    },
  ];

  // Key mapping for future reference
  const keyMapping = {
    uploadStatus: 'websocketsUploadStatus',
    uploadPumpTransactions: 'websocketsUploadPumpTransactions',
    uploadTankMeasurements: 'websocketsUploadTankMeasurements',
    uploadInTankDeliveries: 'websocketsUploadInTankDeliveries',
    uploadGpsRecords: 'websocketsUploadGpsRecords',
    uploadAlertRecords: 'websocketsUploadAlertRecords',
    statusPeriodSeconds: 'websocketsUploadStatusRequestsPeriodSeconds',
  };

  return (
    <div className="pts-device-configuration">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div>
          <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-1">
            Device Configuration
          </h2>
          <p className="tw-text-sm tw-text-gray-500">
            Advanced configuration settings based on firmware capabilities
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          {isConnected ? (
            <StatusBadge status="success" label="Connected" />
          ) : (
            <StatusBadge status="error" label="Disconnected" />
          )}
        </div>
      </div>

      {/* Not Connected Warning */}
      {!isConnected && (
        <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4 tw-mb-6">
          <div className="tw-flex tw-items-start tw-gap-3">
            <span className="tw-text-yellow-600 tw-text-xl">
              <i className="fa-light fa-circle-exclamation"></i>
            </span>
            <div>
              <h4 className="tw-font-semibold tw-text-yellow-800 tw-mb-1">Device Not Connected</h4>
              <p className="tw-text-sm tw-text-yellow-700">
                Connect to the device via WebSocket to access configuration settings.
                Some features require an active connection to read and modify settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WebSocket Configuration - Active */}
      <WebSocketConfig
        key={`ws-config-${refreshKey}`}
        device={device}
        isConnected={isConnected}
        onConfigChange={handleConfigChange}
      />

      {/* Pump Service Configuration - Active */}
      <PumpServiceConfig
        key={`pump-config-${refreshKey}`}
        device={device}
        isConnected={isConnected}
        onConfigChange={handleConfigChange}
      />

      {/* Planned Features Section */}
      <div className="tw-mt-6">
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <span className="tw-text-blue-600 tw-text-xl">
              <i className="fa-light fa-circle-info"></i>
            </span>
            <div>
              <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-1">Additional Configuration - Coming Soon</h4>
              <p className="tw-text-sm tw-text-blue-700">
                The following sections will allow you to configure additional device settings based on firmware version and capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
          {plannedSections.map((section, idx) => (
            <div
              key={idx}
              className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-opacity-60"
            >
              <div className="tw-flex tw-items-start tw-gap-3">
                <div className="tw-w-10 tw-h-10 tw-bg-gray-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span><i className={`${section.icon} tw-text-gray-500`}></i></span>
                </div>
                <div>
                  <h4 className="tw-font-medium tw-text-gray-800 tw-mb-1">{section.title}</h4>
                  <p className="tw-text-xs tw-text-gray-500 tw-mb-2">{section.description}</p>
                  <StatusBadge status="neutral" label="Planned" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Device Information */}
      <div className="tw-mt-6 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
        <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <span><i className="fa-light fa-info-circle"></i></span>
          Current Device Information
        </h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
          <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
            <span className="tw-text-xs tw-text-gray-500 tw-block tw-mb-1">Configuration ID</span>
            <span className="tw-font-mono tw-text-sm tw-text-gray-800">{device?.configurationId || "N/A"}</span>
          </div>
          <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
            <span className="tw-text-xs tw-text-gray-500 tw-block tw-mb-1">Firmware Date</span>
            <span className="tw-font-mono tw-text-sm tw-text-gray-800">
              {device?.firmwareDateTime ? new Date(device.firmwareDateTime).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
            <span className="tw-text-xs tw-text-gray-500 tw-block tw-mb-1">WebSocket Capable</span>
            <span className={`tw-font-medium tw-text-sm ${device?.webSocketCapable ? "tw-text-green-600" : "tw-text-red-600"}`}>
              {device?.webSocketCapable ? "Yes" : "No"}
            </span>
          </div>
          <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
            <span className="tw-text-xs tw-text-gray-500 tw-block tw-mb-1">Direct Commands</span>
            <span className={`tw-font-medium tw-text-sm ${device?.allowedForDirectCommands ? "tw-text-green-600" : "tw-text-red-600"}`}>
              {device?.allowedForDirectCommands ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        </div>
      </div>

      {/* Documentation Footer */}
      <div className="tw-mt-6 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <span><i className="fa-light fa-book"></i></span>
            Documentation
          </h4>
          <p className="tw-text-sm tw-text-gray-600">
            Configuration requests follow the PTS protocol specification. See documentation for details on firmware-specific configuration options.
          </p>
        </div>
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <span><i className="fa-light fa-road-barrier"></i></span>
            Prerequisites
          </h4>
          <ul className="tw-text-sm tw-text-gray-600 tw-list-disc tw-list-inside tw-space-y-1">
            <li>Device must be connected via WebSocket</li>
            <li>Firmware must support configuration protocol</li>
            <li>User must have configuration permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PTSDeviceConfiguration;
