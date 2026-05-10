/**
 * File: PTSDeviceConfiguration.js
 * Purpose: M365-styled configuration page with collapsible accordion sections
 * Dependencies: WebSocketConfig, PumpServiceConfig, StatusBadge, m365-shared
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - AccordionSection: Reusable collapsible section with M365 styling
 * - WebSocketConfig / PumpServiceConfig: Active config sections
 * - Planned sections: Future configuration features
 */
import React, { useCallback, useState } from "react";
import { WebSocketConfig, PumpServiceConfig } from "./configuration";
import { StatusBadge } from "./configuration/controls";
import "./PTSDeviceConfiguration.scss";

/** Reusable M365-styled accordion section */
const AccordionSection = ({ title, icon, badge, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`m365-accordion${isOpen ? " m365-accordion--open" : ""}`}>
      <button
        className="m365-accordion__header"
        onClick={() => setIsOpen((p) => !p)}
        type="button"
      >
        <div className="m365-accordion__title">
          {icon && <i className={icon}></i>}
          <span>{title}</span>
          {badge && <span className="m365-accordion__badge">{badge}</span>}
        </div>
        <i className={`fa-light fa-chevron-${isOpen ? "up" : "down"} m365-accordion__chevron`}></i>
      </button>
      {isOpen && <div className="m365-accordion__body">{children}</div>}
    </div>
  );
};

const PTSDeviceConfiguration = ({ device, isConnected }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConfigChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const plannedSections = [
    { title: "Tank Configuration", icon: "fa-light fa-truck-container", description: "Set up tank probes, alarms, and capacity settings" },
    { title: "Reader Settings", icon: "fa-light fa-tag", description: "Configure RFID readers and tag authentication" },
    { title: "Fuel Grades", icon: "fa-light fa-dollar-sign", description: "Manage fuel grade prices and blending ratios" },
    { title: "Firmware Update", icon: "fa-light fa-microchip", description: "Check and apply firmware updates" },
    { title: "Network Settings", icon: "fa-light fa-network-wired", description: "Configure IP address, port, and connection settings" },
  ];

  return (
    <div className="m365-device-config">
      {/* Section Header */}
      <div className="m365-device-config__header">
        <div>
          <h2 className="m365-device-config__title">Device Configuration</h2>
          <p className="m365-device-config__subtitle">
            Advanced configuration settings based on firmware capabilities
          </p>
        </div>
        <div className="m365-device-config__status">
          {isConnected ? (
            <StatusBadge status="success" label="Connected" />
          ) : (
            <StatusBadge status="error" label="Disconnected" />
          )}
        </div>
      </div>

      {/* Disconnected Warning */}
      {!isConnected && (
        <div className="m365-device-config__warning">
          <i className="fa-light fa-circle-exclamation"></i>
          <div>
            <strong>Device Not Connected</strong>
            <p>Connect to the device via WebSocket to access configuration settings.</p>
          </div>
        </div>
      )}

      {/* Active Config Sections — Accordion */}
      <AccordionSection
        title="WebSocket Configuration"
        icon="fa-light fa-plug"
        badge={isConnected ? "Active" : null}
        defaultOpen={true}
      >
        <WebSocketConfig
          key={`ws-config-${refreshKey}`}
          device={device}
          isConnected={isConnected}
          onConfigChange={handleConfigChange}
        />
      </AccordionSection>

      <AccordionSection
        title="Pump Service Configuration"
        icon="fa-light fa-gas-pump"
        badge={isConnected ? "Active" : null}
        defaultOpen={true}
      >
        <PumpServiceConfig
          key={`pump-config-${refreshKey}`}
          device={device}
          isConnected={isConnected}
          onConfigChange={handleConfigChange}
        />
      </AccordionSection>

      {/* Planned Features — Accordion */}
      <AccordionSection
        title="Additional Configuration"
        icon="fa-light fa-circle-info"
        badge="Coming Soon"
        defaultOpen={false}
      >
        <div className="m365-device-config__info-banner">
          The following sections will allow you to configure additional device settings
          based on firmware version and capabilities.
        </div>
        <div className="m365-device-config__planned-grid">
          {plannedSections.map((section, idx) => (
            <div key={idx} className="m365-planned-card">
              <div className="m365-planned-card__icon">
                <i className={section.icon}></i>
              </div>
              <div className="m365-planned-card__body">
                <h4>{section.title}</h4>
                <p>{section.description}</p>
                <StatusBadge status="neutral" label="Planned" />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Device Information — Accordion */}
      <AccordionSection
        title="Current Device Information"
        icon="fa-light fa-info-circle"
        defaultOpen={false}
      >
        <div className="m365-device-config__info-grid">
          <div className="m365-info-item">
            <span className="m365-info-item__label">Configuration ID</span>
            <span className="m365-info-item__value">{device?.configurationId || "N/A"}</span>
          </div>
          <div className="m365-info-item">
            <span className="m365-info-item__label">Firmware Date</span>
            <span className="m365-info-item__value">
              {device?.firmwareDateTime ? new Date(device.firmwareDateTime).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div className="m365-info-item">
            <span className="m365-info-item__label">WebSocket Capable</span>
            <span className={`m365-info-item__value ${device?.webSocketCapable ? "m365-info-item__value--success" : "m365-info-item__value--error"}`}>
              {device?.webSocketCapable ? "Yes" : "No"}
            </span>
          </div>
          <div className="m365-info-item">
            <span className="m365-info-item__label">Direct Commands</span>
            <span className={`m365-info-item__value ${device?.allowedForDirectCommands ? "m365-info-item__value--success" : "m365-info-item__value--error"}`}>
              {device?.allowedForDirectCommands ? "Allowed" : "Not Allowed"}
            </span>
          </div>
        </div>
      </AccordionSection>

      {/* Documentation Footer — Accordion */}
      <AccordionSection
        title="Documentation & Prerequisites"
        icon="fa-light fa-book"
        defaultOpen={false}
      >
        <div className="m365-device-config__docs-grid">
          <div className="m365-doc-card">
            <h4><i className="fa-light fa-book"></i> Documentation</h4>
            <p>Configuration requests follow the PTS protocol specification. See documentation for details on firmware-specific configuration options.</p>
          </div>
          <div className="m365-doc-card">
            <h4><i className="fa-light fa-road-barrier"></i> Prerequisites</h4>
            <ul>
              <li>Device must be connected via WebSocket</li>
              <li>Firmware must support configuration protocol</li>
              <li>User must have configuration permissions</li>
            </ul>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
};

export default PTSDeviceConfiguration;
