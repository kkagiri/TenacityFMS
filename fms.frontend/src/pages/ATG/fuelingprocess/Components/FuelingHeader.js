import React, { useState, useEffect } from "react";
import { Button } from "devextreme-react/button";
import { SelectBox } from "devextreme-react/select-box";
import { useSelector } from "react-redux";
import tankService from "../../../../services/tankService";

//cluade import needed components
import "./FuelingHeader.scss";
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
  // Tank selection props
  selectedTankId,
  setSelectedTankId,
  availableTanks,
  setAvailableTanks,
  isLoadingTanks,
  setIsLoadingTanks,
}) => {
  const { isSmall, isMedium } = useScreenSize(); //Cursor
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [tanksWithProbeData, setTanksWithProbeData] = useState([]);
  const userPermissions = useSelector(
    (state) => state.auth?.user?.permissions || []
  );

  // Load tanks when component mounts or site changes (ONLY when site ID changes)
  useEffect(() => {
    const loadTanks = async () => {
      if (!ptsDevice?.site) {
        console.log("[FuelingHeader] No site ID found on device");
        return;
      }

      console.log("[FuelingHeader] Loading tanks for site:", ptsDevice.site);
      setIsLoadingTanks(true);
      try {
        const tanks = await tankService.getTanksBySite(ptsDevice.site);
        console.log("[FuelingHeader] Tanks loaded:", tanks);
        setAvailableTanks(Array.isArray(tanks) ? tanks : []);
      } catch (error) {
        console.error("[FuelingHeader] Error loading tanks:", error);
        setAvailableTanks([]);
      } finally {
        setIsLoadingTanks(false);
      }
    };

    loadTanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptsDevice?.site]); // Only reload when site ID actually changes

  // Enrich tanks with real-time probe data whenever uploadStatus updates
  useEffect(() => {
    // Add debouncing to prevent rapid updates
    const timeoutId = setTimeout(() => {
      if (availableTanks && availableTanks.length > 0) {
        // Filter out tanks starting with "FT"
        const filteredTanks = availableTanks.filter(
          tank => !tank.name?.toUpperCase().startsWith('FT')
        );

        const enriched = tankService.enrichTanksWithProbeData(
          rawUploadStatus,
          filteredTanks
        );
        setTanksWithProbeData(enriched);
      } else {
        // Clear enriched data when no tanks available
        setTanksWithProbeData([]);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [rawUploadStatus, availableTanks]);

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
        {/* Top Row: Back button, Site Name, and Action Buttons */}
        <div className="header-top-row">
          {/* Left: Back button and device info */}
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

          {/* Right: Action Buttons */}
          <div className="header-actions">
            <div className="fueling-header__action-buttons">
              {isDeviceDisconnected && hasDeviceSettingsPermission && (
                <Button
                  icon="fa-light fa-cog"
                  text="Settings"
                  type="danger"
                  stylingMode="outlined"
                  onClick={() =>
                    handleNavigation(
                      `/ptsdevice/${ptsDevice.ptsid || ptsDevice.deviceId}`
                    )
                  }
                  hint="Check Device Settings"
                  className="fueling-header__action-btn fueling-header__action-btn--first fueling-header__action-btn--last"
                />
              )}

              {!isDeviceDisconnected && (
                <Button
                  icon="fa-light fa-list"
                  text={activeFuelingProcesses && activeFuelingProcesses.length > 0 ? `Active (${activeFuelingProcesses.length})` : "Active"}
                  type="default"
                  stylingMode="outlined"
                  onClick={() => setShowAllFuelingPopup(true)}
                  disabled={!activeFuelingProcesses || activeFuelingProcesses.length === 0}
                  hint={activeFuelingProcesses && activeFuelingProcesses.length > 0 ? `${activeFuelingProcesses.length} active fueling process(es)` : "No active fueling"}
                  className="fueling-header__action-btn fueling-header__action-btn--first"
                />
              )}

              <Button
                icon="orderedlist"
                text="Transactions"
                type="normal"
                stylingMode="outlined"
                onClick={handleViewPumpTransactions}
                hint="View pump transaction history"
                className="fueling-header__action-btn"
              />

              {!isDeviceDisconnected && hasDeviceSettingsPermission && (
                <Button
                  icon="fa-light fa-exclamation-triangle"
                  text="Stuck TX"
                  type="danger"
                  stylingMode="outlined"
                  onClick={() => {
                    if (window.openStuckTransactionManager) {
                      window.openStuckTransactionManager();
                    }
                  }}
                  hint="View and clear stuck transactions (Admin only)"
                  className="fueling-header__action-btn"
                />
              )}

              <Button
                icon="plus"
                text="New Fueling"
                type="success"
                stylingMode="contained"
                onClick={startNewFueling}
                disabled={isDeviceDisconnected || noPumpsAvailable}
                hint={
                  isDeviceDisconnected
                    ? "Cannot start new fueling while device is disconnected"
                    : noPumpsAvailable
                    ? "No pumps available for this device"
                    : "Start a new fueling process"
                }
                className="fueling-header__action-btn fueling-header__action-btn--last fueling-header__action-btn--new"
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Tank Selection, Connection Status, and System Icons */}
        <div className="header-bottom-row">
          {/* Left: Tank Selection */}
          <div className="header-tank-section">
            <div className="tank-selector-container">
              <label className="tw-text-xs tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                <i className="fa-light fa-gas-pump tw-mr-1 tw-text-sm"></i>
                Select Tank
              </label>
              {isLoadingTanks ? (
                <div className="tw-flex tw-items-center tw-gap-2 tw-p-3 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200" key="loading">
                  <i className="fa-light fa-spinner fa-spin tw-text-blue-500" key="spinner-icon"></i>
                  <span className="tw-text-xs tw-text-gray-600">Loading tanks for site {ptsDevice.site}...</span>
                </div>
              ) : tanksWithProbeData && tanksWithProbeData.length > 0 ? (
                <div key="tank-select-wrapper">
                  <SelectBox
                    dataSource={tanksWithProbeData}
                    displayExpr={(tank) => tankService.formatTankDisplay(tank)}
                    valueExpr="id"
                    value={selectedTankId}
                    onValueChanged={(e) => setSelectedTankId(e.value)}
                    placeholder="Select a tank..."
                    searchEnabled={true}
                    searchMode="contains"
                    searchExpr={["name", "id"]}
                    width="100%"
                    itemRender={(tank) => (
                      <div className="tw-flex tw-items-center tw-justify-between tw-py-1" key={`tank-item-${tank.id}`}>
                        <div className="tw-flex-1">
                          <div className="tw-font-medium tw-text-sm">{tank.name}</div>
                          <div className="tw-text-xs tw-text-gray-500">
                            {tank.currentLevel?.toLocaleString() || 0}L / {tank.capacity?.toLocaleString() || 0}L
                          </div>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-text-xs tw-font-medium">
                            {tank.fillingPercentage || 0}%
                          </div>
                          <div
                            className={`tw-w-2 tw-h-2 tw-rounded-full ${
                              tank.fillingPercentage > 60
                                ? "tw-bg-green-500"
                                : tank.fillingPercentage > 30
                                ? "tw-bg-yellow-500"
                                : "tw-bg-red-500"
                            }`}
                            title={`Tank ${tankService.getTankStatusColor(tank.fillingPercentage)} level`}
                          ></div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <div className="tw-flex tw-flex-col tw-gap-2 tw-p-3 tw-bg-yellow-50 tw-rounded tw-border tw-border-yellow-200" key="no-tanks">
                  <div className="tw-flex tw-items-center tw-gap-2">
                    <i className="fa-light fa-triangle-exclamation tw-text-yellow-600" key="warning-icon"></i>
                    <span className="tw-text-xs tw-font-medium tw-text-yellow-800">
                      No tanks configured for site {ptsDevice.site}
                    </span>
                  </div>
                  <span className="tw-text-xs tw-text-yellow-700">
                    Please configure tanks in Tank Management for this site.
                  </span>
                </div>
              )}
            </div>

            {/* Show selected tank details inline */}
            {selectedTankId && tanksWithProbeData && tanksWithProbeData.length > 0 && (() => {
              const selectedTank = tanksWithProbeData.find(t => t.id === selectedTankId);
              return selectedTank ? (
                <div className="tank-balance-display">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-flex tw-flex-col">
                      <span className="tw-text-xs tw-text-gray-500">Level</span>
                      <span className="tw-text-sm tw-font-semibold">
                        {(selectedTank.currentLevel || 0).toLocaleString()}L
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-col">
                      <span className="tw-text-xs tw-text-gray-500">Capacity</span>
                      <span className="tw-text-sm tw-font-semibold">
                        {(selectedTank.capacity || 0).toLocaleString()}L
                      </span>
                    </div>
                    <div className="tw-flex tw-flex-col">
                      <span className="tw-text-xs tw-text-gray-500">Status</span>
                      <span
                        className={`tw-text-sm tw-font-semibold ${
                          selectedTank.fillingPercentage > 60
                            ? "tw-text-green-600"
                            : selectedTank.fillingPercentage > 30
                            ? "tw-text-yellow-600"
                            : "tw-text-red-600"
                        }`}
                      >
                        {selectedTank.fillingPercentage || 0}%
                        {selectedTank.probeOnline && (
                          <i className="fa-light fa-signal tw-text-green-500 tw-ml-1 tw-text-xs" title="Real-time"></i>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Compact progress bar */}
                  <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-1 tw-mt-2">
                    <div
                      className={`tw-h-1 tw-rounded-full tw-transition-all ${
                        selectedTank.fillingPercentage > 60
                          ? "tw-bg-green-500"
                          : selectedTank.fillingPercentage > 30
                          ? "tw-bg-yellow-500"
                          : "tw-bg-red-500"
                      }`}
                      style={{ width: `${Math.min(selectedTank.fillingPercentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Right: Connection Status, Pump Indicators and System Icons */}
          <div className="header-status-section">
            <div className="connection-and-pumps">
              <ConnectionStatus
                deviceId={ptsDevice.ptsid || ptsDevice.deviceId}
                lastUpdated={lastUpdated}
                onStatusChange={setConnectionStatus}
              />

              {/* Pump busy indicators */}
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
                        className="fa-light fa-fire-flame-curved"
                        style={{ marginRight: "4px" }}
                      ></i>
                      Pump {process.pumpId}: Busy
                    </span>
                  ))}
              </div>
            </div>

            {/* System Status Icons */}
            <div className={`system-status-icons ${isSmall ? "tw-justify-start tw-flex-wrap" : ""}`}>
              <div className="status-icon tw-text-center" title="Battery Status">
                <i className="fa-light fa-battery-full"></i>
                <span className="status-value tw-text-xs tw-mt-1">
                  {getStatusValue("batteryVoltage", "V", 1)}
                </span>
              </div>
              <div className="status-icon tw-text-center" title="CPU Temperature">
                <i className="fa-light fa-temperature-high"></i>
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
                <i className="fa-light fa-plug"></i>
                <span className="status-value tw-text-xs tw-mt-1">
                  {rawUploadStatus?.ptsPowerDownDetected ? "Loss" : "OK"}
                </span>
              </div>
              <div
                className={`status-icon tw-text-center ${
                  rawUploadStatus?.sdMounted ? "" : "alert"
                }`}
                title="Storage Status"
              >
                <i className="fa-light fa-sd-card"></i>
                <span className="status-value tw-text-xs tw-mt-1">
                  {rawUploadStatus?.sdMounted ? "OK" : "Error"}
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
                  <i className="fa-light fa-triangle-exclamation"></i>
                  <span className="status-value tw-text-xs tw-mt-1">
                    {systemAlerts.length}
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
                <i
                  className={`fa-light ${
                    connectionStatus === "connected"
                      ? "fa-signal"
                      : connectionStatus === "connecting"
                      ? "fa-spinner fa-spin"
                      : connectionStatus === "delayed"
                      ? "fa-clock"
                      : "fa-plug"
                  }`}
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
                    ? "OK"
                    : connectionStatus === "connecting"
                    ? "..."
                    : connectionStatus === "delayed"
                    ? "Delay"
                    : "Off"}
                </span>
              </div>
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
            <i className="fa-light fa-wifi tw-mr-2"></i>
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
