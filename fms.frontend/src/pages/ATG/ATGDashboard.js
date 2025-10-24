import React, { useEffect, useState } from "react";
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
  MasterDetail,
  Lookup,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { Popup } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import LoadIndicator from "devextreme-react/load-indicator";
import {
  ResponsiveBox,
  Row,
  Col,
  Item,
  Location,
} from "devextreme-react/responsive-box";
import Chart, {
  ArgumentAxis,
  Series,
  Legend,
  ValueAxis,
  Label,
  Title,
} from "devextreme-react/chart";
import { TickerCard } from "../../components/TickerCard/tickerCard";
import PumpTransactionPopup from "../../components/PumpTransactionPopup/PumpTransactionPopup";

// Import selectors and actions
import {
  selectAllDevices,
  selectDashboardMetrics,
} from "../../redux/selectors/deviceSelectors";
import { fetchPTSDeviceList } from "../../redux/actions/ptsActions/ptsDeviceActions";
import {
  fetchFuelRefills,
  fetchFuelRefillsbyDateRange,
} from "../../redux/actions/fuelRefillAction";
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchTanks } from "../../redux/actions/tankActions";

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

  // Pump transaction popup state
  const [showPumpTransactionPopup, setShowPumpTransactionPopup] = useState(false);
  const [selectedDeviceForTransactions, setSelectedDeviceForTransactions] = useState(null);

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

  // Monitor device list and initialize SignalR only if devices exist
  useEffect(() => {
    const deviceCount = ptsDevices?.length || 0;
    const devicesExist = deviceCount > 0;

    console.log(`[ATG Dashboard] Device count: ${deviceCount}, Has devices: ${devicesExist}`);
    setHasDevices(devicesExist);

    // Initialize SignalR only if:
    // 1. We have devices
    // 2. SignalR not already initialized
    // 3. Not in initial loading state
    if (devicesExist && !signalRInitialized && !isInitialLoad) {
      console.log("[ATG Dashboard] Devices detected - Initializing SignalR...");
      initializeSignalR();
    } else if (!devicesExist && signalRInitialized) {
      // Stop SignalR if devices are removed
      console.log("[ATG Dashboard] No devices - Stopping SignalR...");
      cleanupSignalR();
    } else if (!devicesExist && !isInitialLoad) {
      console.log("[ATG Dashboard] No devices detected - SignalR initialization skipped");
    }

    // Cleanup on unmount
    return () => {
      if (signalRInitialized) {
        cleanupSignalR();
      }
    };
  }, [ptsDevices, isInitialLoad, signalRInitialized]);

  // Initialize SignalR connection - Now managed by SignalRConnectionManager
  const initializeSignalR = async () => {
    try {
      // Connection is managed by SignalRConnectionManager based on route
      // Just check if connection exists and is ready
      if (ptsSignalRService.isConnected) {
        console.log("[ATG Dashboard] PTS SignalR connection already active via ConnectionManager");
        setSignalRInitialized(true);
      } else {
        console.log("[ATG Dashboard] Waiting for SignalRConnectionManager to establish connection...");
        // Wait a bit for connection manager to establish connection
        setTimeout(() => {
          if (ptsSignalRService.isConnected) {
            setSignalRInitialized(true);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("[ATG Dashboard] SignalR connection check failed:", error);
      setSignalRInitialized(false);
    }
  };

  // Cleanup SignalR connection - Now managed by SignalRConnectionManager
  const cleanupSignalR = async () => {
    try {
      // Connection lifecycle is managed by SignalRConnectionManager
      // Just reset local state
      console.log("[ATG Dashboard] Cleaning up local SignalR state (connection managed by ConnectionManager)");
      setSignalRInitialized(false);
    } catch (error) {
      console.error("[ATG Dashboard] Error during cleanup:", error);
    }
  };

  const handleStartFueling = (ptsId) => {
    navigate(`/fueling/${ptsId}`);
  };

  const handleViewPumpTransactions = (device) => {
    setSelectedDeviceForTransactions(device);
    setShowPumpTransactionPopup(true);
  };

  // Updated canStartFueling based on selector data
  const canStartFueling = (device) => {
    // Status should be 'Active' or 'Connected'
    const isOnlineStatus =
      device.connectionStatus === "Connected" ||
      device.connectionStatus === "Active";
    // Connection must be WebSocket
    const hasWebSocket = device.connectionType === "WebSocket";
    // Check for recent activity
    let isRecent = false;
    if (device.lastActivity) {
      try {
        const lastActivityDate = new Date(device.lastActivity);
        const now = new Date();
        const diffMinutes =
          (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);
        isRecent = diffMinutes < 10; // within 10 minutes
      } catch (e) {
        console.error(
          "Error parsing lastActivity date:",
          device.lastActivity,
          e
        );
        isRecent = false;
      }
    }

    return isOnlineStatus && hasWebSocket && isRecent;
  };

  // Helper to format the lastActivity timestamp
  const formatLastActivity = (isoTimestamp) => {
    if (!isoTimestamp) return "Never";
    try {
      const date = new Date(isoTimestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activityDate = new Date(isoTimestamp);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === today.getTime()) {
        // It's today, show only time
        return date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else {
        // It's not today, show date and time
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Error formatting date:", isoTimestamp, e);
      return "Invalid Date";
    }
  };

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
        <div style={{ padding: "20px" }}>
          {/* Ticker Cards or other dashboard elements */}

          {/* Show empty state if no devices after initial load */}
          {!isInitialLoad && !hasDevices ? (
            renderEmptyState()
          ) : (
            <div className="dx-card" style={{ marginTop: "20px" }}>
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
                  width={140}
                  alignment="left"
                  cellRender={(data) => {
                    const statusText = data.value || "Disconnected";
                    const connectionType = data.data.connectionType;

                    let iconClass = "dx-icon-clear";
                    let color = "#dc3545";

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
                        break;
                    }

                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: color,
                        }}
                      >
                        <i
                          className={iconClass}
                          style={{ marginRight: "8px", fontSize: "16px" }}
                        />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span
                            style={{ textTransform: "capitalize", fontWeight: 500 }}
                          >
                            {statusText}
                          </span>
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
                  width={180}
                  dataType="datetime"
                  cellRender={(data) => {
                    return <span>{formatLastActivity(data.value)}</span>;
                  }}
                  sortOrder="desc"
                />
                <Column dataField="ipAddress" caption="IP Address" width={130} />
                <Column
                  caption="Actions"
                  width={200}
                  allowHiding={false}
                  cellRender={(cellData) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        text="Start Fueling"
                        icon="chevrondoubleright"
                        type="default"
                        stylingMode="contained"
                        hint="Initiate fueling process for this device"
                        disabled={!canStartFueling(cellData.data)}
                        onClick={() => handleStartFueling(cellData.data.ptsid)}
                      />
                      <Button
                        text="Transactions"
                        icon="orderedlist"
                        type="normal"
                        stylingMode="outlined"
                        hint="View pump transactions for this device"
                        onClick={() => handleViewPumpTransactions(cellData.data)}
                      />
                    </div>
                  )}
                />
              </DataGrid>
            </div>
          )}
        </div>
      </ScrollView>

      {/* Pump Transaction Popup - Moved outside ScrollView to prevent DOM conflicts */}
      <PumpTransactionPopup
        isVisible={showPumpTransactionPopup}
        onClose={() => {
          setShowPumpTransactionPopup(false);
          setSelectedDeviceForTransactions(null);
        }}
        title={`Pump Transactions - ${selectedDeviceForTransactions?.ptsid || 'Device'}`}
        ptsId={selectedDeviceForTransactions?.ptsid}
        width="95%"
        height="90%"
      />
    </>
  );
};

export default ATGDashboard;