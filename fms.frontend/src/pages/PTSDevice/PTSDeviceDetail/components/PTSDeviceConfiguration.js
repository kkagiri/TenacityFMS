import React from "react";
import { Button } from "devextreme-react/button";
import "./PTSDeviceConfiguration.scss";

/**
 * PTSDeviceConfiguration - Configuration management page
 * Placeholder for future firmware-based configuration features
 * Will include: pump service, tank configuration, reader settings, etc.
 */
const PTSDeviceConfiguration = ({ device, isConnected }) => {
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
        {isConnected && (
          <div className="connection-badge">
            <i className="fa-light fa-circle-check tw-mr-2"></i>
            Connected
          </div>
        )}
      </div>

      <div className="info-banner">
        <i className="fa-light fa-circle-info"></i>
        <div>
          <h4 className="tw-font-semibold tw-mb-1">Configuration Management - Coming Soon</h4>
          <p className="tw-text-sm">
            This section will allow you to configure device settings based on firmware version
            and capabilities. Configuration requests and responses will follow the PTS protocol
            documented in the system documentation.
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
