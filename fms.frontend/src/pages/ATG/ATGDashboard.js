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

const ATGDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use the updated selector
  const ptsDevices = useSelector(selectAllDevices);
  const sites = useSelector((state) => state.site.sites);

  // Track loading state
  const isDeviceListLoading = useSelector((state) => state.ptsDevice.loading);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pump transaction popup state
  const [showPumpTransactionPopup, setShowPumpTransactionPopup] = useState(false);
  const [selectedDeviceForTransactions, setSelectedDeviceForTransactions] = useState(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchPTSDeviceList());
    dispatch(fetchSiteList()); // Assuming sites are needed for lookup
    // Set initial load flag to false after a delay or when data arrives
    const timer = setTimeout(() => setIsInitialLoad(false), 1500); // Adjust delay as needed
    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleStartFueling = (ptsId) => {
    navigate(`/fueling/${ptsId}`);
  };

  const handleViewPumpTransactions = (device) => {
    setSelectedDeviceForTransactions(device);
    setShowPumpTransactionPopup(true);
  };

  // Updated canStartFueling based on selector data
  const canStartFueling = (device) => {
    //console.log("canStartFueling Device ", device);
    // console.log(
    //   "Checking canStartFueling for:",
    //   device.ptsid,
    //   "Status:",
    //   device.connectionStatus,
    //   "Type:",
    //   device.connectionType
    // );

    // Status should be 'Active' or 'Connected' (as strings from selector use connectionStatus instead of status)
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
        isRecent = diffMinutes < 10; // e.g., within 10 minutes
        console.log(
          `Device ${device.ptsid}: Last activity ${diffMinutes.toFixed(
            1
          )} mins ago. Recent: ${isRecent}`
        );
      } catch (e) {
        console.error(
          "Error parsing lastActivity date:",
          device.lastActivity,
          e
        );
        isRecent = false; // Treat as not recent if date parsing fails
      }
    } else {
      console.log(`Device ${device.ptsid}: No last activity found.`);
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

  return (
    <>
      <ScrollView className="content-block">
        {isInitialLoad && (
          <LoadPanel visible={true} message="Loading Devices..." />
        )}
        <div style={{ padding: "20px" }}>
          {/* ... Ticker Cards or other dashboard elements ... */}

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
              <i className="dx-icon-car" style={{ fontSize: "24px" }}></i>{" "}
              {/* Changed icon */}
              <h3 style={{ margin: 0 }}>PTS Devices Status</h3>
            </div>

            <DataGrid
              dataSource={ptsDevices}
              keyExpr="ptsid" // Use ptsid as key if unique
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
              <LoadPanel enabled={isDeviceListLoading && !isInitialLoad} />{" "}
              {/* Show load panel only during background updates */}
              <Column
                dataField="site"
                caption="Site Name"
                minWidth={200} // Adjusted width
                allowHiding={false}
                sortOrder="asc"
              >
                <Lookup dataSource={sites} valueExpr="id" displayExpr="name" />
              </Column>
              <Column dataField="ptsid" caption="Device ID" minWidth={150} />
              <Column
                dataField="connectionStatus" // This now comes directly from the live status map
                caption="Status"
                width={140} // Increased width slightly
                alignment="left"
                cellRender={(data) => {
                  const statusText = data.value || "Disconnected"; // Default to Disconnected
                  const connectionType = data.data.connectionType;

                  let iconClass = "dx-icon-clear";
                  let color = "#dc3545"; // Red for disconnected

                  switch (statusText) {
                    case "Active":
                      iconClass = "dx-icon-check";
                      color = "#198754"; // Green
                      break;
                    case "Connected":
                      iconClass = "dx-icon-check";
                      color = "#0dcaf0"; // Cyan/Info for connected but maybe not active message
                      break;
                    case "Idle":
                      iconClass = "dx-icon-clock";
                      color = "#ffc107"; // Yellow/Warning for idle
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
                dataField="lastActivity" // This comes from the live status map
                caption="Last Activity"
                width={180} // Adjusted width
                dataType="datetime"
                cellRender={(data) => {
                  return <span>{formatLastActivity(data.value)}</span>;
                }}
                sortOrder="desc" // Sort by last activity descending by default
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
