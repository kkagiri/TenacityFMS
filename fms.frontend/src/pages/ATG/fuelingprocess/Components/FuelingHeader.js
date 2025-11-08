import React, { useState, useEffect } from "react";
import { Button } from "devextreme-react/button";
import { useSelector } from "react-redux";

//cluade import needed components
import "./../fuelingprocess.scss";
import ConnectionStatus from "./ConnectionStatus";
import { useScreenSize } from "../../../../utils/media-query"; //Cursor

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
  availablePumps, // New prop to check if pumps are available
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

  // Helper to determine if device is in unstable state (delayed/reconnecting)
  const isConnectionUnstable = connectionStatus === "delayed" || connectionStatus === "connecting";

  // Check if pumps are available
  const noPumpsAvailable = !availablePumps || availablePumps.length === 0;

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
        {/* Header Left - Back button and device info */}
        <div className="header-left">
          <Button
            icon="arrowleft"
            onClick={() => handleNavigation("/atg")}
            type="normal"
            stylingMode="text"
            hint="Back to ATG Dashboard"
          />
          <div className="header-info">
            <h2 className="tw-text-lg md:tw-text-xl lg:tw-text-2xl tw-font-semibold tw-mb-1">
              {siteName || ptsDevice.name}
            </h2>
            <p className="dx-field-description tw-text-xs md:tw-text-sm">
              Device ID: {ptsDevice.ptsid || ptsDevice.deviceId}
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

            <div className={`action-buttons ${isSmall ? "tw-w-full tw-flex-col" : ""}`}>
              {isDeviceDisconnected && hasDeviceSettingsPermission && (
                <Button
                  icon="fas fa-cog"
                  text={isSmall ? "Settings" : "Check Device Settings"}
                  type="danger"
                  stylingMode="outlined"
                  width={isSmall ? "100%" : undefined}
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
                    text={`Active (${activeFuelingProcesses.length})`}
                    type="default"
                    stylingMode="outlined"
                    width={isSmall ? "100%" : undefined}
                    onClick={() => setShowAllFuelingPopup(true)}
                  />
                )}

              <Button
                icon="orderedlist"
                text={isSmall ? "Transactions" : "Pump Transactions"}
                type="normal"
                stylingMode="outlined"
                width={isSmall ? "100%" : undefined}
                onClick={handleViewPumpTransactions}
                hint="View pump transaction history"
              />

              <Button
                icon="plus"
                text="New Fueling"
                type="success"
                stylingMode="contained"
                width={isSmall ? "100%" : undefined}
                onClick={startNewFueling}
                disabled={isDeviceDisconnected || noPumpsAvailable}
                hint={
                  isDeviceDisconnected
                    ? "Cannot start new fueling while device is disconnected"
                    : noPumpsAvailable
                    ? "No pumps available for this device"
                    : "Start a new fueling process"
                }
              />
            </div>
          </div>
        </div>

        {/* Right header section with system status and connection indicator */}
        <div className={`header-right ${isSmall ? "tw-w-full" : ""}`}>
          <div className={`system-status-icons ${isSmall ? "tw-justify-start tw-flex-wrap" : ""}`}>
            <div className="status-icon tw-text-center" title="Battery Status">
              <i className="fa-solid fa-battery-full tw-text-lg"></i>
              <span className="status-value tw-text-xs tw-mt-1">
                {getStatusValue("batteryVoltage", "V", 1)}
              </span>
            </div>
            <div className="status-icon tw-text-center" title="CPU Temperature">
              <i className="fa-solid fa-temperature-high tw-text-lg"></i>
              <span className="status-value tw-text-xs tw-mt-1">
                {getStatusValue("cpuTemperature", "°C")}
              </span>
            </div>
            <div
              className={`status-icon tw-text-center ${
                rawUploadStatus?.ptsPowerDownDetected ? "alert" : ""
              }`}
              title="Power Status"
            >
              <i className="fa-solid fa-plug tw-text-lg"></i>
              <span className="status-value tw-text-xs tw-mt-1">
                {rawUploadStatus?.ptsPowerDownDetected ? "Power Loss" : "Normal"}
              </span>
            </div>
            <div
              className={`status-icon tw-text-center ${
                rawUploadStatus?.sdMounted ? "" : "alert"
              }`}
              title="Storage Status"
            >
              <i className="fa-solid fa-sd-card tw-text-lg"></i>
              <span className="status-value tw-text-xs tw-mt-1">
                {rawUploadStatus?.sdMounted ? "Mounted" : "Not Mounted"}
              </span>
            </div>

            {/* System alerts section */}
            {systemAlerts.length > 0 && (
              <div
                className="status-icon alert tw-text-center"
                title={systemAlerts
                  .map(
                    (alert) =>
                      `${alert.type}${
                        alert.message ? ` ${alert.message}` : ""
                      } (${alert.count})`
                  )
                  .join(", ")}
              >
                <i className="fa-solid fa-triangle-exclamation tw-text-lg"></i>
                <span className="status-value tw-text-xs tw-mt-1">
                  {systemAlerts.length}{" "}
                  {systemAlerts.length === 1 ? "Alert" : "Alerts"}
                </span>
              </div>
            )}

            {/* Connection Status Indicator */}
            <div
              className="status-icon tw-text-center"
              title={
                connectionStatus === "connected"
                  ? "Device Connected"
                  : connectionStatus === "connecting"
                  ? "Connecting to Device"
                  : connectionStatus === "delayed"
                  ? "Connection Delayed"
                  : "Device Disconnected"
              }
            >
              {isSmall ? (
                // Mobile: Show only colored icon
                <i
                  className={`fa-solid fa-circle tw-text-lg ${
                    connectionStatus === "connected"
                      ? "tw-text-green-500"
                      : connectionStatus === "connecting"
                      ? "tw-text-yellow-500"
                      : connectionStatus === "delayed"
                      ? "tw-text-yellow-500"
                      : "tw-text-red-500"
                  }`}
                ></i>
              ) : (
                // Desktop: Show icon with text
                <>
                  <i
                    className={`fa-solid ${
                      connectionStatus === "connected"
                        ? "fa-signal"
                        : connectionStatus === "connecting"
                        ? "fa-spinner fa-spin"
                        : connectionStatus === "delayed"
                        ? "fa-clock"
                        : "fa-plug"
                    } tw-text-lg`}
                    style={{
                      color:
                        connectionStatus === "connected"
                          ? "#198754"
                          : connectionStatus === "connecting"
                          ? "#6c757d"
                          : connectionStatus === "delayed"
                          ? "#ffc107"
                          : "#dc3545",
                    }}
                  ></i>
                  <span className="status-value tw-text-xs tw-mt-1">
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                      ? "Connecting"
                      : connectionStatus === "delayed"
                      ? "Delayed"
                      : "Disconnected"}
                  </span>
                </>
              )}
            </div>
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
            Fueling operations are disabled until connection is restored. The system will automatically reconnect when the device comes back online.
          </span>
        </div>
      )}

      {/* Connection unstable info banner - shows during grace period */}
      {!isDeviceDisconnected && isConnectionUnstable && activeFuelingProcesses?.some(p => p.status === "fueling") && (
        <div
          className="tw-bg-yellow-50 tw-border tw-border-yellow-300 tw-text-yellow-800 tw-px-4 tw-py-3 tw-rounded tw-mt-2 tw-mb-2 tw-relative"
          role="alert"
        >
          <strong className="tw-font-bold">
            <i className="fa-solid fa-wifi tw-mr-2"></i>
            Connection Unstable
          </strong>
          <span className="tw-block sm:tw-inline tw-ml-2">
            Brief connection issues detected. Active fueling will continue, but if connection doesn't stabilize within 60 seconds, operations may be affected.
          </span>
        </div>
      )}

      {/* No pumps warning banner */}
      {!isDeviceDisconnected && noPumpsAvailable && (
        <div
          className="tw-bg-yellow-100 tw-border tw-border-yellow-400 tw-text-yellow-700 tw-px-4 tw-py-3 tw-rounded tw-mt-2 tw-mb-2 tw-relative"
          role="alert"
        >
          <strong className="tw-font-bold">No Pumps Available!</strong>
          <span className="tw-block sm:tw-inline tw-ml-2">
            Please check device configuration or connection status.
          </span>
        </div>
      )}
    </div>
  );
};

export default FuelingHeader;
