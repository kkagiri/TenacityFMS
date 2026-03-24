/**
 * File: PTSDeviceDetailPage.js
 * Purpose: M365-styled PTS device detail view with FluentStat summary tiles and underline-only tabs
 * Dependencies: ptsDeviceActions, ptsSignalRService, m365-shared
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - FluentStat tiles: Large summary cards for Connection, IP, Status, Port, Activity, Communication
 * - M365 Tab Bar: Underline-only active indicator (no background)
 * - Lazy-loaded tab content: Live Info, Terminal, Settings, Configuration
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import { confirm } from "devextreme/ui/dialog";
import { getPTSDeviceById, deletePTSDevice } from "../../../redux/actions/ptsActions/ptsDeviceActions";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import PTSDeviceLiveInfo from "./components/PTSDeviceLiveInfo";
import PTSDeviceTerminal from "./components/PTSDeviceTerminal";
import PTSDeviceEditForm from "./components/PTSDeviceEditForm";
import PTSDeviceConfiguration from "./components/PTSDeviceConfiguration";
import "./PTSDeviceDetailPage.scss";

const LIVE_STATUS_TTL_MS = 5000;

const isLiveConnectionOnline = (connectionStatus, now) => {
  if (!connectionStatus?.lastActivity) {
    return false;
  }

  const lastActivityMs = new Date(connectionStatus.lastActivity).getTime();
  if (Number.isNaN(lastActivityMs)) {
    return false;
  }

  return now - lastActivityMs <= LIVE_STATUS_TTL_MS
    && String(connectionStatus.status || "").toLowerCase() !== "disconnected";
};

const TABS = [
  { key: "liveinfo", label: "Live Info", icon: "fa-light fa-signal-stream" },
  { key: "terminal", label: "Terminal", icon: "fa-light fa-terminal" },
  { key: "devicesettings", label: "Device Settings", icon: "fa-light fa-gear" },
  { key: "configuration", label: "Configuration", icon: "fa-light fa-sliders" },
];

const TAB_ROUTE_ALIASES = {
  live: "liveinfo",
  liveinfo: "liveinfo",
  terminal: "terminal",
  settings: "devicesettings",
  devicesettings: "devicesettings",
  config: "configuration",
  configuration: "configuration",
};

const DEFAULT_TAB_KEY = TABS[0].key;

const getCanonicalTabKey = (tabPath) => {
  const routeSegment = (tabPath || "").split("/")[0]?.toLowerCase();
  return TAB_ROUTE_ALIASES[routeSegment] || DEFAULT_TAB_KEY;
};

const getTabIndex = (tabKey) => {
  const index = TABS.findIndex((tab) => tab.key === tabKey);
  return index === -1 ? 0 : index;
};

/* ─── FluentStat — large summary tile (detail page) ─── */
const FluentStat = ({ label, value, color = "blue", icon }) => {
  const barColors = {
    blue: "#0078D4", green: "#107C10", orange: "#CA5010", red: "#D13438", gray: "#C8C6C4",
  };
  const textColors = {
    blue: "#0078D4", green: "#107C10", orange: "#CA5010", red: "#D13438", gray: "#605E5C",
  };

  return (
    <div className="pts-detail-stat">
      <div className="pts-detail-stat__bar" style={{ background: barColors[color] || barColors.blue }} />
      <div className="pts-detail-stat__label">{label}</div>
      <div className="pts-detail-stat__value" style={{ color: textColors[color] || textColors.blue }}>{value}</div>
      {icon && (
        <div className="pts-detail-stat__ghost">
          <i className={icon} />
        </div>
      )}
    </div>
  );
};

const PTSDeviceDetailPage = () => {
  const { deviceid, "*": tabPath = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [device, setDevice] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tabLoadingStates, setTabLoadingStates] = useState({ 0: true });
  const [tabDataLoaded, setTabDataLoaded] = useState({});
  const [statusTick, setStatusTick] = useState(() => Date.now());

  const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);
  const realtimeStatus = useSelector((state) => state.realtimeStatus);
  const connectionStatuses = useSelector((state) => state.deviceConnections?.connectionStatuses || {});
  const activeTabKey = useMemo(() => getCanonicalTabKey(tabPath), [tabPath]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStatusTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Reset when device ID changes
  useEffect(() => {
    setDataLoaded(false);
    setDevice(null);
    setLiveData(null);
    setTabDataLoaded({});
    setTabLoadingStates({});
    setActiveTab(0);
  }, [deviceid]);

  useEffect(() => {
    const nextTabIndex = getTabIndex(activeTabKey);
    setActiveTab(nextTabIndex);
  }, [activeTabKey]);

  useEffect(() => {
    if (!deviceid) {
      return;
    }

    const currentSegment = (tabPath || "").split("/")[0]?.toLowerCase() || "";
    if (currentSegment !== activeTabKey) {
      navigate(`/admin/ptsdevice/${deviceid}/${activeTabKey}`, { replace: true });
    }
  }, [activeTabKey, deviceid, navigate, tabPath]);

  // Load device data
  useEffect(() => {
    const loadDevice = async () => {
      if (dataLoaded) return;
      setIsLoading(true);
      try {
        if (!ptsSignalRService.getConnectionStatus()) {
          try { await ptsSignalRService.start(); } catch (e) {
            console.warn("[PTSDeviceDetail] SignalR start failed:", e);
          }
        }
        await dispatch(getPTSDeviceById(deviceid));
        setDataLoaded(true);
      } catch (error) {
        notify(`Failed to load device: ${error.message}`, "error", 3000);
        navigate("/admin/ptsdevice");
      } finally {
        setIsLoading(false);
      }
    };
    if (deviceid && !dataLoaded) loadDevice();
  }, [deviceid, dispatch, navigate, dataLoaded]);

  useEffect(() => { if (currentDevice) setDevice(currentDevice); }, [currentDevice]);

  const resolvedDevice = useMemo(() => {
    if (!device) {
      return null;
    }

    const liveConnection = connectionStatuses[device.ptsid || device.id];
    const liveOnline = isLiveConnectionOnline(liveConnection, statusTick);
    const lastActivity = liveConnection?.lastActivity || device.lastActivity || null;

    return {
      ...device,
      connectionStatus: liveOnline ? (liveConnection?.status || "Active") : "Disconnected",
      connectionType: liveOnline
        ? (liveConnection?.connectionType || device.communicationType || ((device.webSocketCapable === 1 || device.webSocketCapable === true) ? "WebSocket" : "HTTP"))
        : (device.communicationType || ((device.webSocketCapable === 1 || device.webSocketCapable === true) ? "WebSocket" : "HTTP")),
      lastActivity,
      ipaddress: liveConnection?.ipAddress || device.ipaddress,
    };
  }, [connectionStatuses, device, statusTick]);

  useEffect(() => {
    if (!device || tabDataLoaded[activeTab]) {
      return;
    }

    setTabLoadingStates((prev) => ({ ...prev, [activeTab]: true }));

    const timerId = setTimeout(() => {
      setTabLoadingStates((prev) => ({ ...prev, [activeTab]: false }));
      setTabDataLoaded((prev) => ({ ...prev, [activeTab]: true }));
    }, 250);

    return () => clearTimeout(timerId);
  }, [activeTab, device, tabDataLoaded]);

  // SignalR subscriptions — only on Live Info tab
  useEffect(() => {
    if (!deviceid || !realtimeStatus.isLiveDataEnabled || activeTab !== 0) return;
    const handler = (data) => {
      const matchesDevice =
        data?.deviceId === deviceid ||
        data?.ptsid === deviceid ||
        data?.DeviceId === deviceid;

      if (!matchesDevice) {
        return;
      }

      setLiveData((prev) => {
        const previous = prev || {};
        const incoming = data || {};
        const previousStatus = previous.status || previous.Status || {};
        const incomingStatus = incoming.status || incoming.Status || {};

        return {
          ...previous,
          ...incoming,
          status: {
            ...previousStatus,
            ...incomingStatus,
          },
          receivedAt:
            incoming.receivedAt ||
            incoming.dateTime ||
            incomingStatus.dateTime ||
            previous.receivedAt ||
            null,
          deviceId:
            incoming.deviceId ||
            incoming.ptsid ||
            incoming.DeviceId ||
            previous.deviceId ||
            deviceid,
        };
      });
    };
    const u1 = ptsSignalRService.on("uploadStatusUpdate", handler);
    const u2 = ptsSignalRService.on("deviceStatusUpdate", handler);
    return () => { u1(); u2(); };
  }, [deviceid, realtimeStatus.isLiveDataEnabled, activeTab]);

  // Tab change with lazy loading
  const handleTabClick = useCallback((idx) => {
    const nextTabKey = TABS[idx]?.key;

    if (!nextTabKey || nextTabKey === activeTabKey) {
      return;
    }

    navigate(`/admin/ptsdevice/${deviceid}/${nextTabKey}`);
  }, [activeTabKey, deviceid, navigate]);

  const handleBackToList = useCallback(() => navigate("/admin/ptsdevice"), [navigate]);

  const handleDeviceSave = useCallback(async () => {
    await dispatch(getPTSDeviceById(deviceid));
  }, [dispatch, deviceid]);

  const handleDeleteDevice = useCallback(async () => {
    const result = await confirm(
      `Are you sure you want to delete ${device?.ptsName || device?.ptsid}? This action cannot be undone.`,
      "Delete Device"
    );
    if (result) {
      try {
        await dispatch(deletePTSDevice(deviceid));
        notify("Device deleted successfully", "success", 3000);
        navigate("/admin/ptsdevice");
      } catch (error) {
        notify(`Failed to delete device: ${error.message}`, "error", 3000);
      }
    }
  }, [dispatch, deviceid, device, navigate]);

  const isWebSocketConnected = useMemo(() => {
    if (!resolvedDevice) {
      return false;
    }

    const liveConnection = connectionStatuses[resolvedDevice.ptsid || resolvedDevice.id];
    return (resolvedDevice.webSocketCapable === 1 || resolvedDevice.webSocketCapable === true)
      && isLiveConnectionOnline(liveConnection, statusTick);
  }, [connectionStatuses, resolvedDevice, statusTick]);

  // ── Metric items (for FluentStat tiles) ──
  const metrics = useMemo(() => {
    if (!resolvedDevice) return [];
    return [
      {
        label: "Connection", value: isWebSocketConnected ? "Connected" : "Disconnected",
        color: isWebSocketConnected ? "green" : "red",
        icon: isWebSocketConnected ? "fa-light fa-circle-check" : "fa-light fa-circle-xmark"
      },
      { label: "IP Address", value: resolvedDevice.ipaddress || "N/A", color: "blue", icon: "fa-light fa-network-wired" },
      {
        label: "Status", value: isWebSocketConnected ? "Online" : "Offline",
        color: isWebSocketConnected ? "green" : "red",
        icon: "fa-light fa-circle-dot"
      },
      { label: "Port", value: resolvedDevice.port || resolvedDevice.portNumber || "N/A", color: "gray", icon: "fa-light fa-plug" },
      {
        label: "Last Activity", value: resolvedDevice.lastActivity ? new Date(resolvedDevice.lastActivity).toLocaleString() : "N/A",
        color: "orange", icon: "fa-light fa-clock"
      },
      { label: "Communication", value: resolvedDevice.connectionType || resolvedDevice.communicationType || "Unknown", color: "blue", icon: "fa-light fa-satellite-dish" },
    ];
  }, [resolvedDevice, isWebSocketConnected]);

  // ── Loading spinner ──
  const loadingSpinner = (title) => (
    <div className="m365-detail-loader">
      <i className="fa-light fa-spinner fa-spin"></i>
      <span>Loading {title}…</span>
    </div>
  );

  // ── Tab content ──
  const renderTabContent = () => {
    if (!resolvedDevice) return null;
    switch (activeTab) {
      case 0:
        return tabLoadingStates[0] ? loadingSpinner("live information") : (
          <PTSDeviceLiveInfo key={`live-${resolvedDevice.ptsid}`} device={resolvedDevice} liveData={liveData} isConnected={isWebSocketConnected} />
        );
      case 1:
        return tabLoadingStates[1] ? loadingSpinner("terminal") : (
          <PTSDeviceTerminal key={`term-${resolvedDevice.ptsid}`} device={resolvedDevice} isConnected={isWebSocketConnected} />
        );
      case 2:
        return tabLoadingStates[2] ? loadingSpinner("device settings") : (
          <PTSDeviceEditForm key={`edit-${resolvedDevice.ptsid}`} device={resolvedDevice} onSave={handleDeviceSave} />
        );
      case 3:
        return tabLoadingStates[3] ? loadingSpinner("configuration") : (
          <PTSDeviceConfiguration key={`cfg-${resolvedDevice.ptsid}`} device={resolvedDevice} isConnected={isWebSocketConnected} />
        );
      default:
        return null;
    }
  };

  // ── Page loading state ──
  if (isLoading) {
    return (
      <div className="m365-detail-page-loading">
        <i className="fa-light fa-spinner fa-spin"></i>
        <span>Loading device…</span>
      </div>
    );
  }

  // ── Not found state ──
  if (!resolvedDevice) {
    return (
      <div className="m365-detail-empty">
        <i className="fa-light fa-exclamation-triangle"></i>
        <h2>Device Not Found</h2>
        <p>The requested device could not be found.</p>
        <button className="m365-btn m365-btn--primary" onClick={handleBackToList}>
          <i className="fa-light fa-arrow-left"></i> Back to Device List
        </button>
      </div>
    );
  }

  return (
    <div className="m365-detail-page">
      {/* ── Header ── */}
      <div className="m365-detail-header">
        <div className="m365-detail-header__nav">
          <button className="m365-btn m365-btn--text" onClick={handleBackToList}>
            <i className="fa-light fa-arrow-left"></i>
            <span>PTS Devices</span>
          </button>
          <div className="m365-detail-header__subtitle">
            ID: {resolvedDevice.ptsid} &middot; {resolvedDevice.siteNavigation?.name || "Unknown Site"}
          </div>
        </div>
        <div className="m365-detail-header__title-row">
          <div className="m365-detail-header__info">
            <h1 className="m365-detail-header__title">{resolvedDevice.ptsName || resolvedDevice.ptsid}</h1>
          </div>
          <div className="m365-detail-header__actions">
            <button
              className="m365-btn m365-btn--text"
              onClick={() => navigate(`/fueling/${resolvedDevice.ptsid}`)}
            >
              <i className="fa-light fa-gas-pump"></i> Start Fueling
            </button>
            <button className="m365-btn m365-btn--text m365-btn--text-danger" onClick={handleDeleteDevice}>
              <i className="fa-light fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stat Tiles ── */}
      <div className="pts-detail-stat-section">
        <div className="pts-detail-stat-grid">
          {metrics.map((m, i) => (
            <FluentStat key={i} label={m.label} value={m.value} color={m.color} icon={m.icon} />
          ))}
        </div>
      </div>

      {/* ── Connected Tanks ── */}
      {resolvedDevice.tanks && resolvedDevice.tanks.length > 0 && (
        <div className="m365-detail-tanks">
          <h3 className="m365-detail-tanks__heading">
            <i className="fa-light fa-database"></i>
            Connected Tanks ({resolvedDevice.tanks.length})
          </h3>
          <div className="m365-detail-tanks__grid">
            {resolvedDevice.tanks.map((tank) => (
              <div key={tank.id} className="m365-tank-card">
                <div className="m365-tank-card__header">
                  <i className="fa-light fa-oil-can"></i>
                  <span>{tank.name}</span>
                </div>
                <div className="m365-tank-card__details">
                  <div><span className="m365-tank-card__label">Capacity:</span> {tank.tankVolume?.toLocaleString() || "N/A"} L</div>
                  {tank.fuelGradeName && <div><span className="m365-tank-card__label">Fuel:</span> {tank.fuelGradeName}</div>}
                  {tank.currentStock != null && <div><span className="m365-tank-card__label">Stock:</span> {tank.currentStock?.toLocaleString() || "0"} L</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── M365 Tab Bar (underline only, no background) ── */}
      <div className="m365-tabs">
        {TABS.map((tab, idx) => (
          <button
            key={tab.key}
            className={`m365-tab${activeTab === idx ? " m365-tab--active" : ""}`}
            onClick={() => handleTabClick(idx)}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="m365-detail-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PTSDeviceDetailPage;
