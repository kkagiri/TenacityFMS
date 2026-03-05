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

const TABS = [
  { key: "live", label: "Live Info", icon: "fa-light fa-signal-stream" },
  { key: "terminal", label: "Terminal", icon: "fa-light fa-terminal" },
  { key: "settings", label: "Device Settings", icon: "fa-light fa-gear" },
  { key: "config", label: "Configuration", icon: "fa-light fa-sliders" },
];

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
  const { deviceid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [device, setDevice] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tabLoadingStates, setTabLoadingStates] = useState({ 0: true });
  const [tabDataLoaded, setTabDataLoaded] = useState({});

  const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);
  const realtimeStatus = useSelector((state) => state.realtimeStatus);

  // Reset when device ID changes
  useEffect(() => {
    setDataLoaded(false);
    setDevice(null);
    setTabDataLoaded({});
    setTabLoadingStates({ 0: true });
    setActiveTab(0);
  }, [deviceid]);

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
        setTabLoadingStates((p) => ({ ...p, 0: false }));
        setTabDataLoaded((p) => ({ ...p, 0: true }));
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
    setActiveTab(idx);
    if (!tabDataLoaded[idx]) {
      setTabLoadingStates((p) => ({ ...p, [idx]: true }));
      setTimeout(() => {
        setTabLoadingStates((p) => ({ ...p, [idx]: false }));
        setTabDataLoaded((p) => ({ ...p, [idx]: true }));
      }, 500);
    }
  }, [tabDataLoaded]);

  const handleBackToList = useCallback(() => navigate("/admin/ptsdevice"), [navigate]);

  const handleDeviceSave = useCallback(() => {
    dispatch(getPTSDeviceById(deviceid));
    notify("Device settings updated successfully", "success", 3000);
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
    return device?.webSocketCapable === 1 && device?.connectionStatus === "Connected";
  }, [device?.webSocketCapable, device?.connectionStatus]);

  // ── Metric items (for FluentStat tiles) ──
  const metrics = useMemo(() => {
    if (!device) return [];
    return [
      {
        label: "Connection", value: isWebSocketConnected ? "Connected" : "Disconnected",
        color: isWebSocketConnected ? "green" : "red",
        icon: isWebSocketConnected ? "fa-light fa-circle-check" : "fa-light fa-circle-xmark"
      },
      { label: "IP Address", value: device.ipaddress || "N/A", color: "blue", icon: "fa-light fa-network-wired" },
      {
        label: "Status", value: device.isActive ? "Active" : "Inactive",
        color: device.isActive ? "green" : "red",
        icon: "fa-light fa-circle-dot"
      },
      { label: "Port", value: device.port || device.portNumber || "N/A", color: "gray", icon: "fa-light fa-plug" },
      {
        label: "Last Activity", value: device.lastActivity ? new Date(device.lastActivity).toLocaleString() : "N/A",
        color: "orange", icon: "fa-light fa-clock"
      },
      { label: "Communication", value: device.communicationType || "Unknown", color: "blue", icon: "fa-light fa-satellite-dish" },
    ];
  }, [device, isWebSocketConnected]);

  // ── Loading spinner ──
  const loadingSpinner = (title) => (
    <div className="m365-detail-loader">
      <i className="fa-light fa-spinner fa-spin"></i>
      <span>Loading {title}…</span>
    </div>
  );

  // ── Tab content ──
  const renderTabContent = () => {
    if (!device) return null;
    switch (activeTab) {
      case 0:
        return tabLoadingStates[0] ? loadingSpinner("live information") : (
          <PTSDeviceLiveInfo key={`live-${device.ptsid}`} device={device} liveData={liveData} isConnected={isWebSocketConnected} />
        );
      case 1:
        return tabLoadingStates[1] ? loadingSpinner("terminal") : (
          <PTSDeviceTerminal key={`term-${device.ptsid}`} device={device} isConnected={isWebSocketConnected} />
        );
      case 2:
        return tabLoadingStates[2] ? loadingSpinner("device settings") : (
          <PTSDeviceEditForm key={`edit-${device.ptsid}`} device={device} onSave={handleDeviceSave} />
        );
      case 3:
        return tabLoadingStates[3] ? loadingSpinner("configuration") : (
          <PTSDeviceConfiguration key={`cfg-${device.ptsid}`} device={device} isConnected={isWebSocketConnected} />
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
  if (!device) {
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
            ID: {device.ptsid} &middot; {device.siteNavigation?.name || "Unknown Site"}
          </div>
        </div>
        <div className="m365-detail-header__title-row">
          <div className="m365-detail-header__info">
            <h1 className="m365-detail-header__title">{device.ptsName || device.ptsid}</h1>
          </div>
          <div className="m365-detail-header__actions">
            <button
              className="m365-btn m365-btn--text"
              onClick={() => navigate(`/fueling/${device.ptsid}`)}
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
      {device.tanks && device.tanks.length > 0 && (
        <div className="m365-detail-tanks">
          <h3 className="m365-detail-tanks__heading">
            <i className="fa-light fa-database"></i>
            Connected Tanks ({device.tanks.length})
          </h3>
          <div className="m365-detail-tanks__grid">
            {device.tanks.map((tank) => (
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
