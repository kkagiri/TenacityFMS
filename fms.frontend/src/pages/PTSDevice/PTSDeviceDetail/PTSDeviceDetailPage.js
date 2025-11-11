import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Tabs from "devextreme-react/tabs";
import { Button } from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
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

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [device, setDevice] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tabLoadingStates, setTabLoadingStates] = useState({
    0: true, // Live Info tab starts loading
  });
  const [tabDataLoaded, setTabDataLoaded] = useState({});

  const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);
  const realtimeStatus = useSelector((state) => state.realtimeStatus);

  // Reset component state when device ID changes
  useEffect(() => {
    setDataLoaded(false);
    setDevice(null);
    setTabDataLoaded({});
    setTabLoadingStates({
      0: true,
    });
    setActiveTab(0);
  }, [deviceid]);

  // Load device data on mount
  useEffect(() => {
    const loadDevice = async () => {
      if (dataLoaded) return; // Prevent re-loading

      setIsLoading(true);
      try {
        await dispatch(getPTSDeviceById(deviceid));
        setDataLoaded(true);

        // Mark first tab as loaded
        setTabLoadingStates((prev) => ({
          ...prev,
          0: false,
        }));

        setTabDataLoaded((prev) => ({
          ...prev,
          0: true,
        }));
      } catch (error) {
        notify(`Failed to load device: ${error.message}`, "error", 3000);
        navigate("/admin/ptsdevice");
      } finally {
        setIsLoading(false);
      }
    };

    if (deviceid && !dataLoaded) {
      loadDevice();
    }
  }, [deviceid, dispatch, navigate, dataLoaded]);

  // Update local device state when Redux state changes
  useEffect(() => {
    if (currentDevice) {
      setDevice(currentDevice);
    }
  }, [currentDevice]);

  // Subscribe to SignalR updates for this device
  // Only when Live Info tab is active to prevent conflicts with Terminal tab
  useEffect(() => {
    if (!deviceid || !realtimeStatus.isLiveDataEnabled) return;

    // Only subscribe when Live Info tab (index 0) is active
    if (activeTab !== 0) {
      console.log(`[PTSDeviceDetail] Live Info not active - skipping parent subscriptions`);
      return;
    }

    console.log(`[PTSDeviceDetail] Live Info active - subscribing to device updates for ${deviceid}`);

    const handleDeviceUpdate = (data) => {
      //console.log(`[PTSDeviceDetail] Received update for device ${deviceid}:`, data);

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
      console.log(`[PTSDeviceDetail] Cleaning up Live Info subscriptions`);
      unsubscribeUploadStatus();
      unsubscribeDeviceStatus();
    };
  }, [deviceid, realtimeStatus.isLiveDataEnabled, activeTab]);

  // Handle tab change with lazy loading
  const handleTabSelectionChange = useCallback(
    (e) => {
      const newTabIndex = e.itemIndex;
      setActiveTab(newTabIndex);

      // Only set loading state if we haven't loaded this tab's data before
      if (!tabDataLoaded[newTabIndex]) {
        setTabLoadingStates((prev) => ({
          ...prev,
          [newTabIndex]: true,
        }));

        // Mark tab as loaded after a short delay
        setTimeout(() => {
          setTabLoadingStates((prev) => ({
            ...prev,
            [newTabIndex]: false,
          }));

          setTabDataLoaded((prev) => ({
            ...prev,
            [newTabIndex]: true,
          }));
        }, 500);
      }
    },
    [tabDataLoaded]
  );

  // Handle back navigation
  const handleBackToList = useCallback(() => {
    navigate("/admin/ptsdevice");
  }, [navigate]);

  // Handle device save
  const handleDeviceSave = useCallback(() => {
    dispatch(getPTSDeviceById(deviceid));
    notify("Device settings updated successfully", "success", 3000);
  }, [dispatch, deviceid]);

  // Check if device is connected via WebSocket
  const isWebSocketConnected = useMemo(() => {
    return device?.webSocketCapable === 1 &&
           device?.connectionStatus === "Connected";
  }, [device?.webSocketCapable, device?.connectionStatus]);

  // Memoize tab components
  const liveInfoComponent = useMemo(() => {
    if (!device || tabLoadingStates[0] || activeTab !== 0) return null;
    return (
      <PTSDeviceLiveInfo
        key={`live-info-${device?.ptsid}`}
        device={device}
        liveData={liveData}
        isConnected={isWebSocketConnected}
      />
    );
  }, [device, liveData, isWebSocketConnected, tabLoadingStates, activeTab]);

  const terminalComponent = useMemo(() => {
    if (!device || tabLoadingStates[1] || activeTab !== 1) return null;

    // Only render terminal when tab is active to prevent subscription conflicts
    return (
      <PTSDeviceTerminal
        key={`terminal-${device?.ptsid}`}
        device={device}
        isConnected={isWebSocketConnected}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.ptsid, isWebSocketConnected, tabLoadingStates, activeTab]);

  const settingsComponent = useMemo(() => {
    if (!device || tabLoadingStates[2] || activeTab !== 2) return null;
    return (
      <PTSDeviceEditForm
        key={`settings-${device?.ptsid}`}
        device={device}
        onSave={handleDeviceSave}
      />
    );
  }, [device, handleDeviceSave, tabLoadingStates, activeTab]);

  const configurationComponent = useMemo(() => {
    if (!device || tabLoadingStates[3] || activeTab !== 3) return null;
    return (
      <PTSDeviceConfiguration
        key={`config-${device?.ptsid}`}
        device={device}
        isConnected={isWebSocketConnected}
      />
    );
  }, [device, isWebSocketConnected, tabLoadingStates, activeTab]);

  // Tab items with icons and components
  const tabItems = useMemo(() => {
    if (!device) return [];

    const loadingSpinner = (title) => (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading {title.toLowerCase()}...</p>
        </div>
      </div>
    );

    return [
      {
        title: "Live Info",
        icon: "fa-solid fa-signal-stream",
        component: tabLoadingStates[0]
          ? loadingSpinner("live information")
          : liveInfoComponent,
      },
      {
        title: "Terminal",
        icon: "fa-solid fa-terminal",
        component: tabLoadingStates[1]
          ? loadingSpinner("terminal")
          : terminalComponent,
      },
      {
        title: "Device Settings",
        icon: "fa-solid fa-gear",
        component: tabLoadingStates[2]
          ? loadingSpinner("device settings")
          : settingsComponent,
      },
      {
        title: "Configuration",
        icon: "fa-solid fa-sliders",
        component: tabLoadingStates[3]
          ? loadingSpinner("configuration")
          : configurationComponent,
      },
    ];
  }, [
    device,
    liveInfoComponent,
    terminalComponent,
    settingsComponent,
    configurationComponent,
    tabLoadingStates,
  ]);

  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span className="tw-hidden md:tw-inline">{item.title}</span>
      </div>
    );
  };

  const renderContent = () => {
    const activeComponent = tabItems[activeTab]?.component;

    // Important: Only render the active tab's component
    // This ensures only one tab is mounted at a time, preventing SignalR subscription conflicts
    return activeComponent ? (
      <div className="tw-p-4 md:tw-p-6">{activeComponent}</div>
    ) : null;
  };

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
        <LoadIndicator width="48px" height="48px" visible={true} />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="tw-p-6">
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            Device Not Found
          </h2>
          <p className="tw-text-gray-600 tw-mb-6">
            The requested device could not be found.
          </p>
          <Button
            text="Back to Device List"
            icon="fa-light fa-arrow-left"
            onClick={handleBackToList}
            type="default"
            stylingMode="contained"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-detail-page tw-p-2 md:tw-p-6">
      {/* Header Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4 md:tw-p-6 tw-mb-6">
        {/* Back Button */}
        <div className="tw-mb-4">
          <Button
            icon="fa-light fa-arrow-left"
            onClick={handleBackToList}
            stylingMode="text"
            hint="Back to Device List"
          />
        </div>

        <div className="tw-relative tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start lg:tw-justify-between tw-gap-4 tw-mb-4">
          {/* Device Info Section */}
          <div className="tw-flex-1">
            <h1 className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
              {device.ptsid}
            </h1>
            <p className="tw-text-sm md:tw-text-base tw-text-gray-600">
              {device.siteNavigation?.name || "Unknown Site"}
            </p>
          </div>
        </div>

        {/* Device Metrics Dashboard */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
          {/* Connection Status Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className={`fa-light ${
                  isWebSocketConnected
                    ? "fa-circle-check tw-text-green-600"
                    : "fa-circle-xmark tw-text-red-600"
                }`}></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Connection</div>
                <div className="tw-font-semibold tw-text-gray-800">
                  {isWebSocketConnected ? "WebSocket Connected" : "Disconnected"}
                </div>
              </div>
            </div>
          </div>

          {/* IP Address Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className="fa-light fa-network-wired tw-text-blue-600"></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">IP Address</div>
                <div className="tw-font-semibold tw-text-gray-800">
                  {device.ipaddress || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className={`fa-light fa-circle-dot ${
                  device.isActive ? "tw-text-green-600" : "tw-text-red-600"
                }`}></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Status</div>
                <div className="tw-font-semibold tw-text-gray-800">
                  {device.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          {/* Last Activity Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className="fa-light fa-clock tw-text-purple-600"></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Last Activity</div>
                <div className="tw-font-semibold tw-text-gray-800 tw-text-sm">
                  {device.lastActivity
                    ? new Date(device.lastActivity).toLocaleString()
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Communication Type Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className="fa-light fa-satellite-dish tw-text-indigo-600"></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Communication</div>
                <div className="tw-font-semibold tw-text-gray-800">
                  {device.communicationType || "Unknown"}
                </div>
              </div>
            </div>
          </div>

          {/* Port Card */}
          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-text-2xl">
                <i className="fa-light fa-plug tw-text-orange-600"></i>
              </div>
              <div>
                <div className="tw-text-xs tw-text-gray-500 tw-mb-1">Port</div>
                <div className="tw-font-semibold tw-text-gray-800">
                  {device.port || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
        <Tabs
          dataSource={tabItems}
          selectedIndex={activeTab}
          onItemClick={handleTabSelectionChange}
          width="100%"
          className="tw-mb-4"
          itemRender={renderTabItem}
        />
        <div className="tw-p-4">{renderContent()}</div>
      </div>
    </div>
  );
};

export default PTSDeviceDetailPage;
