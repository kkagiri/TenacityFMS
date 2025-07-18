import React, { useState, useEffect } from "react";
import { Button } from "devextreme-react/button";
import { useSelector } from "react-redux";

//cluade import needed components
import "./fuelingprocess.scss";
import ConnectionStatus from "./ConnectionStatus";
import { useScreenSize } from "../../utils/media-query"; //Cursor

const FuelingHeader = ({
  ptsDevice,
  lastUpdated,
  activeFuelingProcesses,
  setShowAllFuelingPopup,
  startNewFueling,
  handleNavigation,
  rawUploadStatus,
  siteName, // Added siteName prop
  onConnectionStatusChange, // New prop to communicate connection status to parent
  handleViewPumpTransactions, // New prop for viewing pump transactions
}) => {
  const { isSmall, isMedium } = useScreenSize(); //Cursor
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const userPermissions = useSelector(
    (state) => state.auth?.user?.permissions || []
  );

  // Check if user has permission to access device settings
  const hasDeviceSettingsPermission =
    userPermissions.includes("_readPtsdevice") ||
    userPermissions.includes("_updatePtsdevice");

  // Helper to determine if device is disconnected
  const isDeviceDisconnected = connectionStatus === "disconnected";

  // Effect to notify parent of connection status changes
  useEffect(() => {
    if (onConnectionStatusChange) {
      onConnectionStatusChange(connectionStatus);
    }
  }, [connectionStatus, onConnectionStatusChange]);

  // Helper to get status values safely
  const getStatusValue = (field, unit = "", precision = 0) => {
    const value = rawUploadStatus?.[field];
    if (typeof value === "number") {
      let formattedValue = value;
      // Properly format battery voltage - divide by 1000 //Cursor
      if (field === "batteryVoltage") {
        formattedValue = value / 1000;
        precision = 2; // Show battery voltage with 2 decimal places
      }

      return `${formattedValue.toFixed(precision)}${unit}`;
    }
    return "N/A";
  };

  // Calculate system alert status based on offline components //Cursor
  const getAlertStatus = () => {
    const alerts = [];

    // Check for offline probes
    if (rawUploadStatus?.probes?.offlineStatus?.ids?.length > 0) {
      alerts.push({
        type: "Probe",
        count: rawUploadStatus.probes.offlineStatus.ids.length,
        severity: "warning",
      });
    }

    // Check for offline readers
    if (rawUploadStatus?.readers?.offlineStatus?.ids?.length > 0) {
      alerts.push({
        type: "Reader",
        count: rawUploadStatus.readers.offlineStatus.ids.length,
        severity: "warning",
      });
    }

    // Check for offline pumps
    if (rawUploadStatus?.pumps?.offlineStatus?.ids?.length > 0) {
      alerts.push({
        type: "Pump",
        count: rawUploadStatus.pumps.offlineStatus.ids.length,
        severity: "warning",
      });
    }

    // Check for probe alarms
    const probeOnlineStatus = rawUploadStatus?.probes?.onlineStatus;
    if (probeOnlineStatus) {
      // Critical high product alarms
      if (probeOnlineStatus.criticalHighProductAlarms?.length > 0) {
        alerts.push({
          type: "Tank",
          message: "Critical High Level",
          count: probeOnlineStatus.criticalHighProductAlarms.length,
          severity: "danger",
        });
      }

      // Critical low product alarms
      if (probeOnlineStatus.criticalLowProductAlarms?.length > 0) {
        alerts.push({
          type: "Tank",
          message: "Critical Low Level",
          count: probeOnlineStatus.criticalLowProductAlarms.length,
          severity: "danger",
        });
      }

      // High water alarms
      if (probeOnlineStatus.highWaterAlarms?.length > 0) {
        alerts.push({
          type: "Tank",
          message: "High Water Level",
          count: probeOnlineStatus.highWaterAlarms.length,
          severity: "warning",
        });
      }

      // Tank leakage alarms
      if (probeOnlineStatus.tankLeakageAlarms?.length > 0) {
        alerts.push({
          type: "Tank",
          message: "Possible Leakage",
          count: probeOnlineStatus.tankLeakageAlarms.length,
          severity: "danger",
        });
      }
    }

    return alerts;
  };

  const systemAlerts = getAlertStatus();

  // Derive isAnyPumpFueling within the header if needed
  const isAnyPumpFueling = activeFuelingProcesses?.some(
    (p) => p.status === "fueling"
  );

  return (
    <div className="dx-card responsive-paddings header-card">
      <div className={`header-content ${isSmall ? "mobile-layout" : ""}`}>
        <div className="header-left">
          <Button
            icon="arrowleft"
            onClick={() => handleNavigation("/atg")}
            type="normal"
            stylingMode="text"
          />
          <div className="header-info">
            <h2>
              {/* Display the site name if available, otherwise fallback to device name */}
              {siteName || ptsDevice.name}
            </h2>
            <p className="dx-field-description">
              Device ID: {ptsDevice.ptsid || ptsDevice.deviceId}
              {/* Firmware info removed */}
            </p>
          </div>
        </div>

        {/* Middle header section with status, pumps, and actions */}
        <div className="header-middle">
          <div className="status-actions-row">
            <div className="device-status-and-pumps">
              <div className="connection-status-wrapper">
                <ConnectionStatus
                  deviceId={ptsDevice.ptsid || ptsDevice.deviceId}
                  lastUpdated={lastUpdated}
                  onStatusChange={setConnectionStatus}
                />
              </div>

              {/* Move pump busy indicators next to connection status */}
              <div className="active-pumps-wrapper">
                {activeFuelingProcesses
                  ?.filter((p) => p.status === "fueling")
                  ?.map((process) => (
                    <span
                      key={process.key || process.pumpId}
                      className="active-pump-indicator"
                      title={`Pump ${process.pumpId} is actively fueling`}
                    >
                      <i
                        className="fa-solid fa-fire-flame-curved"
                        style={{ marginRight: "4px" }}
                      ></i>
                      Pump {process.pumpId}: Busy
                    </span>
                  ))}
              </div>
            </div>

            <div className="action-buttons">
              {isDeviceDisconnected && hasDeviceSettingsPermission && (
                <Button
                  icon="fas fa-cog"
                  text="Check Device Settings"
                  type="danger"
                  stylingMode="outlined"
                  onClick={() =>
                    handleNavigation(
                      `/ptsdevice/${ptsDevice.ptsid || ptsDevice.deviceId}`
                    )
                  }
                />
              )}

              {!isDeviceDisconnected &&
                activeFuelingProcesses &&
                activeFuelingProcesses.length > 0 && (
                  <Button
                    icon="fas fa-list"
                    text={`Active Processes (${activeFuelingProcesses.length})`}
                    type="default"
                    stylingMode="outlined"
                    onClick={() => setShowAllFuelingPopup(true)}
                  />
                )}

              <Button
                icon="orderedlist"
                text="Pump Transactions"
                type="normal"
                stylingMode="outlined"
                onClick={handleViewPumpTransactions}
                title="View pump transaction history"
              />

              <Button
                icon="plus"
                text="New Fueling"
                type="success"
                stylingMode="contained"
                onClick={startNewFueling}
                disabled={isDeviceDisconnected}
                title={
                  isDeviceDisconnected
                    ? "Cannot start new fueling while device is disconnected"
                    : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Right header section with system status */}
        <div className="header-right">
          <div className="system-status-icons">
            <div className="status-icon" title="Battery Status">
              <i className="fa-solid fa-battery-full"></i>
              <span className="status-value">
                {getStatusValue("batteryVoltage", "V", 1)}
              </span>
            </div>
            <div className="status-icon" title="CPU Temperature">
              <i className="fa-solid fa-temperature-high"></i>
              <span className="status-value">
                {getStatusValue("cpuTemperature", "°C")}
              </span>
            </div>
            <div
              className={`status-icon ${
                rawUploadStatus?.ptsPowerDownDetected ? "alert" : ""
              }`}
              title="Power Status"
            >
              <i className="fa-solid fa-plug"></i>
              <span className="status-value">
                {rawUploadStatus?.ptsPowerDownDetected
                  ? "Power Loss"
                  : "Normal"}
              </span>
            </div>
            <div
              className={`status-icon ${
                rawUploadStatus?.sdMounted ? "" : "alert"
              }`}
              title="Storage Status"
            >
              <i className="fa-solid fa-sd-card"></i>
              <span className="status-value">
                {rawUploadStatus?.sdMounted ? "Mounted" : "Not Mounted"}
              </span>
            </div>

            {/* System alerts section */}
            {systemAlerts.length > 0 && (
              <div
                className="status-icon alert"
                title={systemAlerts
                  .map(
                    (alert) =>
                      `${alert.type}${
                        alert.message ? ` ${alert.message}` : ""
                      } (${alert.count})`
                  )
                  .join(", ")}
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span className="status-value">
                  {systemAlerts.length}{" "}
                  {systemAlerts.length === 1 ? "Alert" : "Alerts"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnection warning banner */}
      {isDeviceDisconnected && (
        <div
          className="tw-bg-red-100 tw-border tw-border-red-400 tw-text-red-700 tw-px-4 tw-py-3 tw-rounded tw-mt-2 tw-mb-2 tw-relative"
          role="alert"
        >
          <strong className="tw-font-bold">Device Disconnected!</strong>
          <span className="tw-block sm:tw-inline tw-ml-2">
            Fueling operations are disabled until connection is restored.
          </span>
        </div>
      )}
    </div>
  );
};

export default FuelingHeader;
