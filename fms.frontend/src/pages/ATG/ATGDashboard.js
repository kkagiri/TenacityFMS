import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// DevExtreme components
import ScrollView from "devextreme-react/scroll-view";
import {
  DataGrid,
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  LoadPanel,
  Lookup,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";

// Import selectors and actions
import {
  selectAllDevices,
} from "../../redux/selectors/deviceSelectors";
import { fetchPTSDeviceList } from "../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import {
  updateSingleDeviceStatus,
  receiveConnectedDevicesStatus,
} from "../../redux/actions/ptsActions/deviceConnectionActions";

// Import SignalR service
import ptsSignalRService from "../../signalR/ptsSignalRService";

const ATGDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use the updated selector
  const ptsDevices = useSelector(selectAllDevices);
  const sites = useSelector((state) => state.site.sites);

  // Track loading state
  const isDeviceListLoading = useSelector((state) => state.ptsDevice.loading);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasDevices, setHasDevices] = useState(false);
  const [signalRInitialized, setSignalRInitialized] = useState(false);
  const [statusStable, setStatusStable] = useState(false);

  // Load initial data and check for devices
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Fetch device list first
        await dispatch(fetchPTSDeviceList());
        await dispatch(fetchSiteList());

        // Set initial load flag to false after a delay
        setTimeout(() => setIsInitialLoad(false), 1500);
      } catch (error) {
        console.error("[ATG Dashboard] Error loading initial data:", error);
        setIsInitialLoad(false);
      }
    };

    initializeDashboard();
  }, [dispatch]);

  // Setup SignalR event listeners for real-time device status updates
  const setupSignalRListeners = useCallback(() => {
    console.log("[ATG Dashboard] Setting up SignalR event listeners");

    // Listen for bulk device status updates
    const unsubscribeConnectedDevices = ptsSignalRService.on(
      "connectedDevicesStatus",
      (data) => {
        console.log("[ATG Dashboard] Received connected devices status:", data);
        dispatch(receiveConnectedDevicesStatus(data));
      }
    );

    // Listen for individual device status updates
    const unsubscribeDeviceStatus = ptsSignalRService.on(
      "deviceStatusUpdate",
      (data) => {
        console.log("[ATG Dashboard] Received device status update:", {
          raw: data,
          deviceId: data.deviceId || data.DeviceId,
          status: data.status || data.Status,
          connectionStatus: data.connectionStatus || data.ConnectionStatus,
          connectionType: data.connectionType || data.ConnectionType,
        });
        dispatch(updateSingleDeviceStatus(data));
      }
    );

    // Store unsubscribe functions for cleanup
    return () => {
      console.log("[ATG Dashboard] Cleaning up SignalR listeners");
      if (unsubscribeConnectedDevices) unsubscribeConnectedDevices();
      if (unsubscribeDeviceStatus) unsubscribeDeviceStatus();
    };
  }, [dispatch]);

  // Monitor device list and initialize SignalR only if devices exist
  useEffect(() => {
    const deviceCount = ptsDevices?.length || 0;
    const devicesExist = deviceCount > 0;

    console.log(`[ATG Dashboard] Device count: ${deviceCount}, Has devices: ${devicesExist}`);
    setHasDevices(devicesExist);

    let cleanupListeners = null;

    // Initialize SignalR only if:
    // 1. We have devices
    // 2. SignalR not already initialized
    // 3. Not in initial loading state
    if (devicesExist && !signalRInitialized && !isInitialLoad) {
      console.log("[ATG Dashboard] Devices detected - Initializing SignalR...");

      const initSignalR = async () => {
        try {
          if (ptsSignalRService.isConnected) {
            console.log("[ATG Dashboard] PTS SignalR connection already active");
            cleanupListeners = setupSignalRListeners();
            setSignalRInitialized(true);
            // Mark status as stable after a short delay
            setTimeout(() => setStatusStable(true), 2000);
          } else {
            console.log("[ATG Dashboard] Waiting for SignalR connection...");
            setTimeout(() => {
              if (ptsSignalRService.isConnected) {
                cleanupListeners = setupSignalRListeners();
                setSignalRInitialized(true);
                setTimeout(() => setStatusStable(true), 2000);
              }
            }, 1000);
          }
        } catch (error) {
          console.error("[ATG Dashboard] SignalR initialization failed:", error);
          setSignalRInitialized(false);
          setStatusStable(false);
        }
      };

      initSignalR();
    } else if (!devicesExist && signalRInitialized) {
      // Stop SignalR if devices are removed
      console.log("[ATG Dashboard] No devices - Stopping SignalR...");
      cleanupSignalR();
    } else if (!devicesExist && !isInitialLoad) {
      console.log("[ATG Dashboard] No devices detected - SignalR initialization skipped");
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, [ptsDevices, isInitialLoad, signalRInitialized, setupSignalRListeners]);

  // Cleanup SignalR connection - Now managed by SignalRConnectionManager
  const cleanupSignalR = async () => {
    try {
      // Connection lifecycle is managed by SignalRConnectionManager
      // Just reset local state
      console.log("[ATG Dashboard] Cleaning up local SignalR state (connection managed by ConnectionManager)");
      setSignalRInitialized(false);
      setStatusStable(false);
    } catch (error) {
      console.error("[ATG Dashboard] Error during cleanup:", error);
    }
  };

  const handleStartFueling = (ptsId) => {
    navigate(`/fueling/${ptsId}`);
  };

  // Updated canStartFueling based on selector data with stability checks
  const canStartFueling = (device) => {
    // Don't allow fueling during initial load or status instability
    if (isInitialLoad || !statusStable) {
      return false;
    }

    // Ensure device has required properties
    if (!device || !device.connectionStatus || !device.connectionType) {
      return false;
    }

    // Status should be 'Active' or 'Connected'
    const isOnlineStatus =
      device.connectionStatus === "Connected" ||
      device.connectionStatus === "Active";

    // Connection must be WebSocket
    const hasWebSocket = device.connectionType === "WebSocket";

    // Check for recent activity (within 5 minutes for stricter validation)
    let isRecent = false;
    if (device.lastActivity) {
      try {
        const lastActivityDate = new Date(device.lastActivity);
        const now = new Date();
        const diffMinutes =
          (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);
        isRecent = diffMinutes < 5; // Tightened to 5 minutes for fueling

        // Log activity age for debugging
        if (!isRecent) {
          console.log(
            `[ATG Dashboard] Device ${device.ptsid} activity too old: ${diffMinutes.toFixed(1)} minutes`
          );
        }
      } catch (e) {
        console.error(
          "Error parsing lastActivity date:",
          device.lastActivity,
          e
        );
        isRecent = false;
      }
    }

    const canFuel = isOnlineStatus && hasWebSocket && isRecent;

    // Log status for debugging
    if (!canFuel) {
      console.log(
        `[ATG Dashboard] Device ${device.ptsid} cannot start fueling:`,
        { isOnlineStatus, hasWebSocket, isRecent, status: device.connectionStatus }
      );
    }

    return canFuel;
  };

  // Helper to format the lastActivity timestamp with live countdown
  const formatLastActivity = (isoTimestamp) => {
    if (!isoTimestamp) return { text: "Never", color: "#dc3545" };

    try {
      const activityDate = new Date(isoTimestamp);
      const now = new Date();
      const diffMs = now.getTime() - activityDate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      let text = "";
      let color = "#28a745"; // Green for recent

      if (diffSeconds < 30) {
        text = "Just now";
        color = "#28a745";
      } else if (diffSeconds < 60) {
        text = `${diffSeconds}s ago`;
        color = "#28a745";
      } else if (diffMinutes < 5) {
        const seconds = diffSeconds % 60;
        text = `${diffMinutes}m ${seconds}s ago`;
        color = "#28a745";
      } else if (diffMinutes < 15) {
        text = `${diffMinutes} min ago`;
        color = "#ffc107"; // Yellow for moderate
      } else if (diffMinutes < 60) {
        text = `${diffMinutes} min ago`;
        color = "#fd7e14"; // Orange for concerning
      } else if (diffHours < 24) {
        text = `${diffHours}h ago`;
        color = "#dc3545"; // Red for old
      } else {
        text = `${diffDays}d ago`;
        color = "#6c757d"; // Gray for very old
      }

      return { text, color, timestamp: activityDate.toLocaleString() };
    } catch (e) {
      console.error("Error formatting date:", isoTimestamp, e);
      return { text: "Invalid", color: "#dc3545" };
    }
  };

  // Live timer update for lastActivity
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    // Update timer every second for live countdown
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Render empty state when no devices
  const renderEmptyState = () => (
    <div className="dx-card" style={{ marginTop: "20px", padding: "40px", textAlign: "center" }}>
      <i className="dx-icon-warning" style={{ fontSize: "48px", color: "#ffc107", marginBottom: "20px" }}></i>
      <h3 style={{ margin: "0 0 10px 0", color: "#6c757d" }}>No PTS Devices Configured</h3>
      <p style={{ color: "#6c757d", marginBottom: "20px" }}>
        There are no PTS devices registered in the system. Please configure devices to start monitoring.
      </p>
      <Button
        text="Configure PTS Devices"
        icon="plus"
        type="default"
        stylingMode="contained"
        onClick={() => navigate("/admin/pts-devices")}
      />
    </div>
  );

  return (
    <>
      <ScrollView className="content-block">
        {isInitialLoad && (
          <LoadPanel visible={true} message="Loading Devices..." />
        )}
        <div style={{ padding: "0px" }}>
          {/* Ticker Cards or other dashboard elements */}

          {/* Show empty state if no devices after initial load */}
          {!isInitialLoad && !hasDevices ? (
            renderEmptyState()
          ) : (
            <div className="dx-card" style={{ marginTop: "10px" }}>
              <div
                className="responsive-paddings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <i className="dx-icon-car" style={{ fontSize: "24px" }}></i>
                <h3 style={{ margin: 0 }}>PTS Devices Status</h3>
                {signalRInitialized && (
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "4px 12px",
                      backgroundColor: "#198754",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    <i className="dx-icon-check" style={{ marginRight: "4px" }}></i>
                    Live Updates Active
                  </span>
                )}
              </div>

              <DataGrid
                dataSource={ptsDevices}
                keyExpr="ptsid"
                showBorders={true}
                columnAutoWidth={true}
                rowAlternationEnabled={true}
                columnHidingEnabled={true}
                width="100%"
                noDataText="No PTS devices found or still loading..."
              >
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={10} />
                <LoadPanel enabled={isDeviceListLoading && !isInitialLoad} />
                <Column
                  dataField="site"
                  caption="Site Name"
                  minWidth={200}
                  allowHiding={false}
                  sortOrder="asc"
                >
                  <Lookup dataSource={sites} valueExpr="id" displayExpr="name" />
                </Column>
                <Column dataField="ptsid" caption="Device ID" minWidth={150} />
                <Column
                  dataField="connectionStatus"
                  caption="Status"
                  width={160}
                  alignment="left"
                  cellRender={(data) => {
                    const statusText = data.value || "Disconnected";
                    const connectionType = data.data.connectionType;
                    const lastActivity = data.data.lastActivity;

                    let iconClass = "dx-icon-clear";
                    let color = "#dc3545";
                    let pulseAnimation = false;

                    // Calculate connection health based on last activity
                    let healthIndicator = null;
                    if (lastActivity) {
                      const diffMs = new Date() - new Date(lastActivity);
                      const diffMinutes = diffMs / (1000 * 60);

                      if (diffMinutes < 1) {
                        healthIndicator = { icon: "●", color: "#28a745", title: "Excellent connection" };
                        pulseAnimation = true;
                      } else if (diffMinutes < 5) {
                        healthIndicator = { icon: "●", color: "#28a745", title: "Good connection" };
                      } else if (diffMinutes < 15) {
                        healthIndicator = { icon: "●", color: "#ffc107", title: "Moderate connection" };
                      } else {
                        healthIndicator = { icon: "●", color: "#dc3545", title: "Poor connection" };
                      }
                    }

                    switch (statusText) {
                      case "Active":
                        iconClass = "dx-icon-check";
                        color = "#198754";
                        break;
                      case "Connected":
                        iconClass = "dx-icon-check";
                        color = "#0dcaf0";
                        break;
                      case "Idle":
                        iconClass = "dx-icon-clock";
                        color = "#ffc107";
                        break;
                      case "Disconnected":
                      default:
                        iconClass = "dx-icon-clear";
                        color = "#dc3545";
                        healthIndicator = null; // No health indicator for disconnected
                        break;
                    }

                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: color,
                          gap: "8px",
                        }}
                      >
                        <i
                          className={iconClass}
                          style={{ fontSize: "16px" }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
                              {statusText}
                            </span>
                            {healthIndicator && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: healthIndicator.color,
                                  animation: pulseAnimation ? "pulse 2s infinite" : "none",
                                }}
                                title={healthIndicator.title}
                              >
                                {healthIndicator.icon}
                              </span>
                            )}
                          </div>
                          {connectionType && (
                            <span style={{ fontSize: "0.8em", color: "#6c757d" }}>
                              via {connectionType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Column
                  dataField="lastActivity"
                  caption="Last Activity"
                  width={200}
                  alignment="left"
                  cellRender={(data) => {
                    const formattedActivity = formatLastActivity(data.value);
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <span
                          style={{
                            color: formattedActivity.color,
                            fontWeight: 500,
                            fontSize: "0.95em",
                          }}
                          title={formattedActivity.timestamp}
                        >
                          {formattedActivity.text}
                        </span>
                        {formattedActivity.timestamp && (
                          <span
                            style={{
                              fontSize: "0.75em",
                              color: "#6c757d",
                              marginTop: "2px",
                            }}
                          >
                            {new Date(formattedActivity.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    );
                  }}
                  sortOrder="desc"
                />
                <Column dataField="ipAddress" caption="IP Address" width={130} />
                <Column
                  caption="Actions"
                  width={120}
                  allowHiding={false}
                  cellRender={(cellData) => (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <Button
                        text="Fuel"
                        icon="chevrondoubleright"
                        type="default"
                        stylingMode="contained"
                        hint="Initiate fueling process for this device"
                        disabled={!canStartFueling(cellData.data)}
                        onClick={() => handleStartFueling(cellData.data.ptsid)}
                        width={100}
                      />
                    </div>
                  )}
                />
              </DataGrid>
            </div>
          )}
        </div>
      </ScrollView>
    </>
  );
};

export default ATGDashboard;