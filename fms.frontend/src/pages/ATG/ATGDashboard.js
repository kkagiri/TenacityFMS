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

// Sample data - To be replaced with live data from API/Redux
const tickerData = {
  fuelDispensed: { value: "12,450", unit: "L", change: "+2.5%" },
  tankLevels: { value: "45,000", unit: "L", change: "-1.2%" },
  fuelPrice: { value: "1.85", unit: "$/L", change: "+0.3%" },
  onlinePumps: { value: "24", unit: "Active", change: "96%" },
};

const ptsList = [
  {
    id: 1,
    name: "Main Site PTS",
    deviceId: "PTS001",
    status: "online",
    lastSync: "2 mins ago",
    tanks: 4,
    pumps: 8,
    tankLevel: 75,
  },
  {
    id: 2,
    name: "North Station",
    deviceId: "PTS002",
    status: "online",
    lastSync: "5 mins ago",
    tanks: 2,
    pumps: 4,
    tankLevel: 60,
  },
  {
    id: 3,
    name: "South Terminal",
    deviceId: "PTS003",
    status: "offline",
    lastSync: "1 hour ago",
    tanks: 3,
    pumps: 6,
    tankLevel: 45,
  },
];

const ATGDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // In a real implementation, this would come from Redux
  // const ptsDevices = useSelector(state => state.ptsDevice.devices);
  const [ptsDevices, setPtsDevices] = useState([]);

  // Simulating API call to fetch PTS devices
  useEffect(() => {
    // In a real implementation, this would be:
    // dispatch(fetchPTSDevices())
    //   .then(() => setIsLoading(false))
    //   .catch(error => {
    //     notify(error.message, 'error', 3000);
    //     setIsLoading(false);
    //   });

    setTimeout(() => {
      setPtsDevices(ptsList);
      setIsLoading(false);
    }, 1000);
  }, [dispatch]);

  const handleStartFueling = (ptsId) => {
    navigate(`/atg/${ptsId}`);
  };

  // Function to check if the device is suitable for action (only online devices can be used)
  const canStartFueling = (device) => {
    return device.status === "online";
  };

  // Main render
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadIndicator width={60} height={60} />
      </div>
    );
  }

  // Add media queries for mobile responsiveness
  const styles = {
    "@media (max-width: 768px)": {
      ".ticker-card": {
        flexDirection: "column",
        alignItems: "center",
      },
      ".ticker-icon": {
        marginBottom: "10px",
      },
    },
  };

  return (
    <ScrollView className="content-block" style={styles}>
      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="content-block-header">Fuel Management Dashboard</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", color: "#6c757d" }}>
              Last updated: Just now
            </span>
            <Button
              icon="refresh"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
            />
          </div>
        </div>

        {/* Ticker Cards */}
        <div className="cards compact">
          <TickerCard
            title="Fuel Dispensed Today"
            icon="fa-light fa-fuel"
            value={tickerData.fuelDispensed.value}
            tone="success"
          />
          <TickerCard
            title="Tank Levels"
            icon="fa-light fa-product"
            value={tickerData.tankLevels.value}
            tone="warning"
          />
          <TickerCard
            title="Current Fuel Price"
            icon="fa-light fa-money"
            value={tickerData.fuelPrice.value}
            tone="info"
          />
          <TickerCard
            title="Pumps Online"
            icon="fa-light fa-preferences"
            value={tickerData.onlinePumps.value}
            tone="success"
          />
        </div>

        {/* PTS Devices Section */}
        <div className="dx-card " style={{ marginTop: "20px" }}>
          <div
            className="responsive-paddings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <i className="dx-icon-home" style={{ fontSize: "24px" }}></i>
            <h3 style={{ margin: 0 }}>PTS Devices</h3>
          </div>

          <DataGrid
            dataSource={ptsDevices}
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            columnHidingEnabled={true}
            width="100%"
            adaptColumnWidthByRatio={true}
          >
            <LoadPanel enabled={true} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={10} />

            <Column
              dataField="name"
              caption="Site Name"
              hidingPriority={9}
              minWidth={250}
              allowHiding={false}
              sortOrder="asc"
            />

            <Column
              dataField="deviceId"
              caption="Device ID"
              hidingPriority={3}
              minWidth={150}
            />
            <Column
              dataField="status"
              caption="Status"
              hidingPriority={7}
              width={120}
              cellRender={(data) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: data.value === "online" ? "#198754" : "#dc3545",
                  }}
                >
                  <i
                    className={`dx-icon-${
                      data.value === "online" ? "check" : "clear"
                    }`}
                    style={{ marginRight: "5px" }}
                  ></i>
                  <span style={{ textTransform: "capitalize" }}>
                    {data.value}
                  </span>
                </div>
              )}
            />
            <Column
              dataField="lastSync"
              caption="Last Sync"
              hidingPriority={6}
              width={150}
            />
            <Column
              dataField="tanks"
              caption="Tanks"
              hidingPriority={5}
              width={100}
            />
            <Column
              dataField="pumps"
              caption="Pumps"
              hidingPriority={4}
              width={100}
            />
            <Column
              dataField="tankLevel"
              caption="Tank Level"
              hidingPriority={9}
              width={150}
              cellRender={(data) => (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "10px",
                      backgroundColor: "#e9ecef",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${data.value}%`,
                        height: "100%",
                        backgroundColor:
                          data.value > 70
                            ? "#198754"
                            : data.value > 30
                            ? "#ffc107"
                            : "#dc3545",
                      }}
                    ></div>
                  </div>
                  <span style={{ marginLeft: "10px" }}>{data.value}%</span>
                </div>
              )}
            />
            <Column
              caption="Actions"
              hidingPriority={8}
              width={150}
              allowHiding={false}
              cellRender={(cellData) => (
                <Button
                  text="Start Fueling"
                  type="default"
                  stylingMode="contained"
                  disabled={!canStartFueling(cellData.data)}
                  onClick={() => handleStartFueling(cellData.data.id)}
                />
              )}
            />
          </DataGrid>
        </div>
      </div>
    </ScrollView>
  );
};

export default ATGDashboard;
