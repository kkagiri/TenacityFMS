import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  LoadPanel,
} from "devextreme-react/data-grid";
import { ResponsiveBox, Row, Col, Item } from "devextreme-react/responsive-box";
import { Button } from "devextreme-react/button";
import { CircularGauge } from "devextreme-react/circular-gauge";
import SignalRService from "../../signalR/SignalRService";
import {
  fetchDashboardMetrics,
  fetchPTSDeviceList,
} from "../../redux/actions/ptsActions/ptsDeviceActions";
import { TickerCard } from "../../components/TickerCard/tickerCard";

const DeviceDashboard = () => {
  const deviceData = useSelector((state) => state.ptsDevice);
  const dispatch = useDispatch();

  // Define handler for Add PTS button
  const handleAddPTS = () => {
    console.log("Add PTS clicked");
    // TODO: Open modal or navigate to PTS device creation form
  };

  useEffect(() => {
    const signalRService = SignalRService;
    const initializeConnection = async () => {
      dispatch(fetchDashboardMetrics());
      dispatch(fetchPTSDeviceList());
      try {
        await signalRService.startConnection();
        console.log("SignalR connected");
      } catch (error) {
        console.error("Failed to connect to SignalR:", error);
      }
    };
    initializeConnection();
    const refreshInterval = setInterval(() => {
      dispatch(fetchDashboardMetrics());
    }, 3000);
    return () => {
      signalRService.stopConnection();
      clearInterval(refreshInterval);
    };
  }, [dispatch]);

  const getConnectionTypeText = (type) => {
    return type === "websocket" ? "WebSocket" : "HTTP";
  };

  const webSocketConnections =
    deviceData?.onlineDevices?.webSocketConnections || [];
  const httpConnections = deviceData?.onlineDevices?.httpConnections || [];
  const totalConnectedDevices =
    deviceData?.onlineDevices?.totalConnectedDevices || 0;
  const ptsDeviceList = deviceData?.ptsDeviceList || [];
  const dashboardMetrics = deviceData?.dashboardMetrics || {};
  const totalRegistered = dashboardMetrics?.totalRegistered || 0;
  const validatedOnline = dashboardMetrics?.validatedOnline || 0;
  const unknownOnline = dashboardMetrics?.unknownOnline || 0;
  const offlineRegistered = dashboardMetrics?.offlineRegistered || 0;
  const webSocketDevicesCount = dashboardMetrics?.webSocketDevicesCount || 0;
  const httpDevicesCount = dashboardMetrics?.httpDevicesCount || 0;

  const allDevices = [
    ...webSocketConnections.map((device) => ({
      ...device,
      connectionType: "websocket",
      lastActivity: device.lastMessageAt,
    })),
    ...httpConnections.map((device) => ({
      ...device,
      connectionType: "http",
      lastActivity: device.lastPollTime,
    })),
  ];

  return (
    <div className="content-block">
      {/* Header with title and Add PTS button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Device Connection Dashboard</h2>
        <Button text="Add PTS" onClick={handleAddPTS} />
      </div>

      {/* Gauges Row */}
      <div className="cards compact">
        <TickerCard
          title="Total All Online Devices"
          icon={`fa-light fa-server`}
          value={totalConnectedDevices}
          tone={`success`}
        />
        <TickerCard
          title="All  Websocket / HTTP Devices"
          icon={`fa-light fa-webhook`}
          value={httpDevicesCount}
          total={webSocketDevicesCount}
          tone={`amber`}
        />
        <TickerCard
          title="Registered Devices Online"
          icon={`fa-light fa-signal`}
          value={validatedOnline}
          total={totalRegistered}
          percentage={(validatedOnline / totalRegistered) * 100}
        />
        <TickerCard
          title="Unknown Online Devices"
          icon={`fa-light fa-question`}
          value={unknownOnline}
          tone={`warning`}
        />
        <TickerCard
          title="Offline Registered Devices"
          icon={`fa-light fa-user-slash`}
          value={offlineRegistered}
          tone={`negative`}
        />
      </div>

      <div className="online-devices-dashboard">
        {/* Existing DataGrid for online devices */}
        <div style={{ marginTop: "30px" }}>
          <DataGrid
            dataSource={allDevices}
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height={500}
          >
            <Paging defaultPageSize={10} />
            <Pager
              showPageSizeSelector={true}
              allowedPageSizes={[5, 10, 20]}
              showInfo={true}
            />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Column dataField="deviceId" caption="Device ID" width={150} />
            <Column
              dataField="connectionType"
              caption="Connection Type"
              calculateCellValue={(data) =>
                getConnectionTypeText(data.connectionType)
              }
            />
            <Column
              dataField="lastActivity"
              caption="Last Activity"
              dataType="datetime"
              format="yyyy-MM-dd HH:mm:ss"
            />
            <Column dataField="status" caption="Status" />
          </DataGrid>
        </div>
      </div>

      {/* New DataGrid for PTS Devices */}
      <div style={{ marginTop: "30px" }}>
        <h3>PTS Devices</h3>
        <DataGrid
          dataSource={ptsDeviceList}
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height={500}
        >
          <Paging defaultPageSize={10} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[5, 10, 20]}
            showInfo={true}
          />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Column dataField="ptsid" caption="PTS ID" width={100} />
          <Column dataField="ipaddress" caption="IP Address" />
          <Column dataField="portNumber" caption="Port" />
          <Column dataField="login" caption="Login" />
          <Column
            dataField="lastActivity"
            caption="Last Activity"
            dataType="datetime"
            format="yyyy-MM-dd HH:mm:ss"
          />
        </DataGrid>
      </div>
    </div>
  );
};

export default DeviceDashboard;
