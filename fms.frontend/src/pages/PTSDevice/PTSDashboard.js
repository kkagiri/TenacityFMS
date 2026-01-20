import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { TickerCard } from "../../components/TickerCard/tickerCard";
import PTSDeviceList from "../../components/PTSDevice/PTSDeviceList";
import PTSDeviceForm from "../../components/PTSDevice/PTSDeviceForm/PTSDeviceForm";
import {
  fetchDashboardMetrics,
  fetchPTSDeviceList,
  fetchUnknownDevices,
} from "../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import "./PTSDashboard.scss";

const PTSDashboard = () => {
  const deviceData = useSelector((state) => state.ptsDevice);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [unknownDevices, setUnknownDevices] = useState([]);

  // Handle actions for PTS device
  const handleAddPTS = useCallback((prefillDeviceId = null) => {
    console.log("Add PTS clicked", prefillDeviceId);
    setEditingDeviceId(prefillDeviceId);
    setFormVisible(true);
  }, []);

  const handleViewDetails = useCallback(
    (deviceId) => {
      console.log("View details clicked", deviceId);
      navigate(`/admin/ptsdevice/${deviceId}`);
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

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Load metrics and device list
      dispatch(fetchDashboardMetrics());

      Promise.all([dispatch(fetchPTSDeviceList()), dispatch(fetchSiteList())])
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    };

    loadData();
  }, [dispatch]);

  // Get metrics from state
  const dashboardMetrics = deviceData?.dashboardMetrics || {};

  // Memoize ptsDeviceList to prevent unnecessary re-renders
  const ptsDeviceList = React.useMemo(() => {
    return deviceData?.ptsDeviceList || [];
  }, [deviceData?.ptsDeviceList]);

  // Prepare devices data with correct structure for the detail view
  const formattedDevices = useMemo(() => {
    return ptsDeviceList.map((device) => {
      // Ensure each device has a proper ID for tracking expanded rows
      const deviceId = device.ptsid || device.id;

      // Attempt to match our device data with the structure needed for details component
      const defaultTanks = []; // We'll populate this if we have tank info

      // Check if we have tanks information in the original device data
      if (device.tanks) {
        defaultTanks.push(...device.tanks);
      }

      // Return the formatted device data
      return {
        id: deviceId, // Ensure consistent ID field for the keyExpr
        ptsid: device.ptsid,
        ptsName: device.ptsName || device.ptsid,
        siteName: device.siteNavigation?.name || device.site?.name || "Unknown Site",
        status: device.isActive ? "online" : "offline",
        lastUpdated: device.lastActivity
          ? new Date(device.lastActivity).toLocaleString()
          : "Unknown",
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
    });
  }, [ptsDeviceList]);

  // Handle form save
  const handleFormSave = useCallback(() => {
    // Refresh device list after save
    dispatch(fetchPTSDeviceList());
    dispatch(fetchDashboardMetrics());
  }, [dispatch]);

  // Handle form close
  const handleFormClose = useCallback(() => {
    setFormVisible(false);
    setEditingDeviceId(null);
  }, []);

  // Handle fetch unknown devices
  const handleFetchUnknownDevices = useCallback(async () => {
    const devices = await dispatch(fetchUnknownDevices());
    setUnknownDevices(devices || []);
  }, [dispatch]);

  return (
    <div className="pts-dashboard content-block">
      <div className="dashboard-header">
        <h2>PTS Device Dashboard</h2>
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
          title="Registered Devices"
          icon={`fa-solid fa-signal`}
          value={dashboardMetrics.validatedOnline || 0}
          total={dashboardMetrics.totalRegistered || 0}
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
        onViewDetails={handleViewDetails}
        onPumpService={handlePumpService}
        unknownDevices={unknownDevices}
        onFetchUnknownDevices={handleFetchUnknownDevices}
      />

      {/* PTS Device Form Popup */}
      <PTSDeviceForm
        visible={formVisible}
        onClose={handleFormClose}
        deviceId={editingDeviceId}
        onSave={handleFormSave}
      />
    </div>
  );
};

export default React.memo(PTSDashboard);
