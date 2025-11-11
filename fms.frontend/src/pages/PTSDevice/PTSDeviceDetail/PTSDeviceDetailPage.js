import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Tabs } from "devextreme-react/tabs";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import { getPTSDeviceById } from "../../../redux/actions/ptsActions/ptsDeviceActions";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import PTSDeviceLiveInfo from "./components/PTSDeviceLiveInfo";
import PTSDeviceTerminal from "./components/PTSDeviceTerminal";
import PTSDeviceEditForm from "./components/PTSDeviceEditForm";
import PTSDeviceConfiguration from "./components/PTSDeviceConfiguration";
import "./PTSDeviceDetailPage.scss";

/**
 * PTSDeviceDetailPage - Comprehensive device detail view
 * Route: /admin/ptsdevice/{deviceid}
 *
 * Features:
 * 1. Live information from SignalR (when WebSocket connected)
 * 2. Terminal-like panel for viewing device data
 * 3. Device edit form
 * 4. Configuration page (placeholder for future firmware-based config)
 */
const PTSDeviceDetailPage = () => {
  const { deviceid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);

  const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);
  const realtimeStatus = useSelector((state) => state.realtimeStatus);

  // Load device data on mount
  useEffect(() => {
    const loadDevice = async () => {
      setLoading(true);
      try {
        await dispatch(getPTSDeviceById(deviceid));
        setLoading(false);
      } catch (error) {
        notify(`Failed to load device: ${error.message}`, "error", 3000);
        setLoading(false);
        navigate("/admin/ptsdevice");
      }
    };

    loadDevice();
  }, [deviceid, dispatch, navigate]);

  // Subscribe to SignalR updates for this device
  useEffect(() => {
    if (!deviceid || !realtimeStatus.isLiveDataEnabled) return;

    const handleDeviceUpdate = (data) => {
      console.log(`[PTSDeviceDetail] Received update for device ${deviceid}:`, data);

      // Update live data if this update is for our device
      if (data.deviceId === deviceid || data.ptsid === deviceid) {
        setLiveData(data);
      }
    };

    // Subscribe to device-specific updates
    const unsubscribeUploadStatus = ptsSignalRService.on(
      "UploadStatus",
      handleDeviceUpdate
    );

    const unsubscribeDeviceStatus = ptsSignalRService.on(
      "deviceStatusUpdate",
      handleDeviceUpdate
    );

    return () => {
      unsubscribeUploadStatus();
      unsubscribeDeviceStatus();
    };
  }, [deviceid, realtimeStatus.isLiveDataEnabled]);

  // Handle tab change
  const handleTabChange = useCallback((e) => {
    setActiveTab(e.value);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate("/admin/ptsdevice");
  }, [navigate]);

  // Check if device is connected via WebSocket
  const isWebSocketConnected = useCallback(() => {
    return currentDevice?.webSocketCapable === 1 &&
           currentDevice?.connectionStatus === "Connected";
  }, [currentDevice]);

  const tabs = [
    { text: "Live Info", icon: "fa-light fa-signal-stream" },
    { text: "Terminal", icon: "fa-light fa-terminal" },
    { text: "Device Settings", icon: "fa-light fa-gear" },
    { text: "Configuration", icon: "fa-light fa-sliders" },
  ];

  if (loading) {
    return <LoadPanel visible={true} message="Loading device..." />;
  }

  if (!currentDevice) {
    return (
      <div className="content-block">
        <div className="tw-text-center tw-py-8">
          <p className="tw-text-gray-600">Device not found</p>
          <Button text="Back to Devices" onClick={handleBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-detail-page content-block">
      {/* Header */}
      <div className="device-detail-header">
        <div className="tw-flex tw-items-center tw-gap-4">
          <Button
            icon="back"
            onClick={handleBack}
            stylingMode="text"
            hint="Back to device list"
          />
          <div>
            <h2 className="tw-text-2xl tw-font-semibold tw-mb-1">
              {currentDevice.ptsid}
            </h2>
            <p className="tw-text-sm tw-text-gray-600">
              {currentDevice.siteNavigation?.name || "Unknown Site"}
              {" • "}
              <span className={`connection-status ${
                isWebSocketConnected() ? "connected" : "disconnected"
              }`}>
                {isWebSocketConnected() ? (
                  <>
                    <i className="fa-light fa-circle-check tw-mr-1"></i>
                    WebSocket Connected
                  </>
                ) : (
                  <>
                    <i className="fa-light fa-circle-xmark tw-mr-1"></i>
                    Disconnected
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Device quick info */}
        <div className="device-quick-info">
          <div className="quick-info-item">
            <label>IP Address</label>
            <span>{currentDevice.ipaddress || "N/A"}</span>
          </div>
          <div className="quick-info-item">
            <label>Last Activity</label>
            <span>
              {currentDevice.lastActivity
                ? new Date(currentDevice.lastActivity).toLocaleString()
                : "N/A"}
            </span>
          </div>
          <div className="quick-info-item">
            <label>Status</label>
            <span className={currentDevice.isActive ? "tw-text-green-600" : "tw-text-red-600"}>
              {currentDevice.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        dataSource={tabs}
        selectedIndex={activeTab}
        onItemClick={handleTabChange}
        width="100%"
        className="device-detail-tabs"
      />

      {/* Tab Content */}
      <div className="device-detail-content">
        {activeTab === 0 && (
          <PTSDeviceLiveInfo
            device={currentDevice}
            liveData={liveData}
            isConnected={isWebSocketConnected()}
          />
        )}
        {activeTab === 1 && (
          <PTSDeviceTerminal
            device={currentDevice}
            isConnected={isWebSocketConnected()}
          />
        )}
        {activeTab === 2 && (
          <PTSDeviceEditForm
            device={currentDevice}
            onSave={() => {
              dispatch(getPTSDeviceById(deviceid));
              notify("Device settings updated successfully", "success", 3000);
            }}
          />
        )}
        {activeTab === 3 && (
          <PTSDeviceConfiguration
            device={currentDevice}
            isConnected={isWebSocketConnected()}
          />
        )}
      </div>
    </div>
  );
};

export default PTSDeviceDetailPage;
