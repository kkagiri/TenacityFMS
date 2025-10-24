import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { TickerCard } from "../../components/TickerCard/tickerCard";
import PTSDeviceList from "../../components/PTSDevice/PTSDeviceList";
import {
  fetchDashboardMetrics,
  fetchPTSDeviceList,
} from "../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
//import SignalRService from "../../signalR/SignalRService";
import LiveStatusControl from "../../components/LiveStatus/LiveStatusControl";
import "./PTSDashboard.scss";

const PTSDashboard = () => {
  const deviceData = useSelector((state) => state.ptsDevice);
  const realtimeStatus = useSelector((state) => state.realtimeStatus);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  // Handle actions for PTS device
  const handleAddPTS = useCallback(() => {
    console.log("Add PTS clicked");
    navigate("/ptsdevice/edit/new");
  }, [navigate]);

  const handleEditDevice = useCallback(
    (deviceId) => {
      console.log("Edit device clicked", deviceId);
      navigate(`/admin/ptsdevice/edit/${deviceId}`);
    },
    [navigate]
  );

  const handlePumpService = useCallback(
    (deviceId) => {
      console.log("Pump service clicked", deviceId);
      navigate(`/ATG`);
    },
    [navigate]
  );

  const handleDiagnose = useCallback((deviceId) => {
    console.log("Diagnose clicked", deviceId);
    // Here you would show the diagnose popup
    alert("Diagnose actions popup would show here (not created yet)");
  }, []);

  // Memoize the refresh handler to avoid recreating it on every render
  const handleRefresh = useCallback(() => {
    setIsLoading(true);

    // First fetch metrics which is faster
    dispatch(fetchDashboardMetrics());

    // Then fetch device list and update loading state when done
    dispatch(fetchPTSDeviceList())
      .then(() => {
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  useEffect(() => {
    //const signalRService = SignalRService; switch to ptssignalrservice later

    const initializeConnection = async () => {
      setIsLoading(true);

      // First load the metrics
      dispatch(fetchDashboardMetrics());

      // Then load the device list and sites
      Promise.all([dispatch(fetchPTSDeviceList()), dispatch(fetchSiteList())])
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });

      try {
        //await signalRService.startConnection(); switch to ptssignalrservice later
        console.log("SignalR connected");
      } catch (error) {
        console.error("Failed to connect to SignalR:", error);
      }
    };

    initializeConnection();

    // Use a less frequent refresh interval for metrics to prevent too many re-renders
    const refreshInterval = setInterval(() => {
      // Just refresh metrics, let SignalR handle device updates
      if (realtimeStatus.isLiveDataEnabled) {
        dispatch(fetchDashboardMetrics());
      }
    }, 15000); // Increased to 15 seconds from 5 seconds

    return () => {
      //signalRService.stopConnection(); //switch to ptssignalrservice later
      clearInterval(refreshInterval);
    };
  }, [dispatch, realtimeStatus.isLiveDataEnabled]);

  // Get metrics from state
  const dashboardMetrics = deviceData?.dashboardMetrics || {};
  const ptsDeviceList = deviceData?.ptsDeviceList || [];

  // Prepare devices data with correct structure for the detail view
  const formattedDevices = useMemo(() => {
    return ptsDeviceList.map((device) => {
      // Ensure each device has a proper ID for tracking expanded rows
      const deviceId = device.ptsid || device.id;

      // Get realtime updates for this device if available //Cursor
      // Try both sources: ptsDevice.uploadStatusUpdates (legacy) and realtimeStatus.uploadStatusByDevice (new)
      const realtimeUpdate = deviceData.uploadStatusUpdates?.[deviceId] ||
                            realtimeStatus.uploadStatusByDevice?.[deviceId];

      // Attempt to match our device data with the structure needed for details component
      const defaultTanks = []; // We'll populate this if we have tank info

      // Check if we have tanks information in the original device data
      if (device.tanks) {
        defaultTanks.push(...device.tanks);
      }

      // Start with the base device data
      const formattedDevice = {
        id: deviceId, // Ensure consistent ID field for the keyExpr
        ptsid: device.ptsid,
        siteName: device.site?.name || "Unknown Site",
        status: device.isActive ? "online" : "offline",
        lastUpdated: device.lastActivity
          ? new Date(device.lastActivity).toLocaleString()
          : "Unknown",
        batteryVoltage: device.batteryVoltage || 12.5,
        cpuTemperature: device.cpuTemperature || 35,
        sdMounted: device.sdMounted || true,
        ptsPowerDownDetected: device.ptsPowerDownDetected || false,
        startupSeconds: device.startupSeconds || 3600,
        firmwareDateTime: device.firmwareDateTime || new Date(),
        configurationId: device.configurationId || `CONF-${device.ptsid}`,
        isActive: device.isActive || false,
        ipaddress: device.ipaddress,
        portNumber: device.portNumber,
        connectionType: device.connectionType,
        isAuthenticated: device.isAuthenticated,
        webSocketCapable: device.webSocketCapable,
        allowedForDirectCommands: device.allowedForDirectCommands,
        protocolSecurityType: device.protocolSecurityType,
        authenticationType: device.authenticationType,
        tanks: defaultTanks,
      };

      // If we have realtime data, overlay it onto the device //Cursor
      if (realtimeUpdate && realtimeStatus.isLiveDataEnabled) {
        // Update the device with realtime data
        // Handle different data structures:
        // - ptsDevice.uploadStatusUpdates: direct status object with lastUpdated
        // - realtimeStatus.uploadStatusByDevice: { status: rawStatus, receivedAt: timestamp }
        const rawStatus = realtimeUpdate.status || realtimeUpdate; // Handle both structures
        const lastUpdated = realtimeUpdate.receivedAt || realtimeUpdate.lastUpdated;

        return {
          ...formattedDevice,
          lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleString() : formattedDevice.lastUpdated,
          batteryVoltage:
            rawStatus?.batteryVoltage || formattedDevice.batteryVoltage,
          cpuTemperature:
            rawStatus?.cpuTemperature || formattedDevice.cpuTemperature,
          sdMounted: rawStatus?.sdMounted ?? formattedDevice.sdMounted,
          ptsPowerDownDetected:
            rawStatus?.ptsPowerDownDetected ??
            formattedDevice.ptsPowerDownDetected,
          configurationId:
            rawStatus?.configurationId || formattedDevice.configurationId,
          pumps: rawStatus?.pumps || formattedDevice.pumps,
          probes: rawStatus?.probes || formattedDevice.probes,
          readers: rawStatus?.readers || formattedDevice.readers,
          // Add more fields as needed
        };
      }

      return formattedDevice;
    });
  }, [
    ptsDeviceList,
    deviceData.uploadStatusUpdates, //Cursor - legacy source
    realtimeStatus.uploadStatusByDevice, //Cursor - new source
    realtimeStatus.isLiveDataEnabled,
  ]);

  return (
    <div className="pts-dashboard content-block">
      <div className="dashboard-header">
        <h2>PTS Device Dashboard</h2>
        <LiveStatusControl />
      </div>

      {/* Metrics Cards */}
      <div className="cards compact">
        <TickerCard
          title="Total Connected Devices"
          icon={`fa-solid fa-server`}
          value={dashboardMetrics.totalConnectedDevices || 0}
          tone={`success`}
        />
        <TickerCard
          title="WebSocket / HTTP Devices"
          icon={`fa-solid fa-webhook`}
          value={dashboardMetrics.httpDevicesCount || 0}
          total={dashboardMetrics.webSocketDevicesCount || 0}
          tone={`amber`}
        />
        <TickerCard
          title="Registered Devices Online"
          icon={`fa-solid fa-signal`}
          value={dashboardMetrics.validatedOnline || 0}
          total={dashboardMetrics.totalRegistered || 0}
          percentage={
            dashboardMetrics.totalRegistered
              ? (dashboardMetrics.validatedOnline /
                  dashboardMetrics.totalRegistered) *
                100
              : 0
          }
        />
        <TickerCard
          title="Unknown Online Devices"
          icon={`fa-solid fa-question`}
          value={dashboardMetrics.unknownOnline || 0}
          tone={`warning`}
        />
        <TickerCard
          title="Offline Registered Devices"
          icon={`fa-solid fa-user-slash`}
          value={dashboardMetrics.offlineRegistered || 0}
          tone={`negative`}
        />
      </div>

      {/* PTS Device List with Master-Detail */}
      <PTSDeviceList
        devices={formattedDevices}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onAddDevice={handleAddPTS}
        onEdit={handleEditDevice}
        onPumpService={handlePumpService}
        onDiagnose={handleDiagnose}
      />
    </div>
  );
};

export default React.memo(PTSDashboard);
