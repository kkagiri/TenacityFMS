/**
 * File: PTSDashboard.js
 * Purpose: PTS Device list page — M365 Admin Center layout with large summary tiles,
 *          Card/List view toggle, per-device stat cards, simple DataGrid list, sorting,
 *          search, and SlidePanel for add/edit
 * Dependencies: M365PageHeader, SlidePanel, DataGrid, ptsDeviceActions, siteActions
 * Last Modified: 2026-02-27
 *
 * Key Sections:
 * - M365PageHeader: Title, device count, command bar
 * - Summary stat tiles: Large FluentStat-style cards (Total, Connected, Unknown, Offline)
 * - Tab bar: All / Online / Offline filter
 * - Search + Sort controls + Card/List view toggle
 * - Device card grid (card view) or DataGrid (list view)
 * - SlidePanel: Add/Edit device form & Unknown devices
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LoadPanel } from "devextreme-react/load-panel";
import DataGrid, { Column, Paging, Pager, Selection } from "devextreme-react/data-grid";

import M365PageHeader from "../../components/m365/M365PageHeader";
import SlidePanel from "../../components/ui/SlidePanel";
import PTSDeviceFormPanel from "./components/PTSDeviceFormPanel";
import {
  fetchDashboardMetrics,
  fetchPTSDeviceList,
  fetchUnknownDevices,
} from "../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import "./PTSDashboard.scss";

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

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { value: "ptsName", label: "Name" },
  { value: "siteName", label: "Site" },
  { value: "status", label: "Status" },
  { value: "lastActivity", label: "Last Activity" },
  { value: "ipaddress", label: "IP Address" },
];

/* ─── FluentStat — large summary tile ─── */
const FluentStat = ({ label, value, sub, color = "blue", icon, onClick }) => {
  const barColors = {
    blue: "#0078D4", green: "#107C10", orange: "#CA5010", red: "#D13438", gray: "#C8C6C4",
  };
  const textColors = {
    blue: "#0078D4", green: "#107C10", orange: "#CA5010", red: "#D13438", gray: "#605E5C",
  };

  return (
    <div
      className="pts-stat"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="pts-stat__bar" style={{ background: barColors[color] }} />
      <div className="pts-stat__label">{label}</div>
      <div className="pts-stat__value" style={{ color: textColors[color] }}>{value}</div>
      {sub && <div className="pts-stat__sub">{sub}</div>}
      {icon && (
        <div className="pts-stat__ghost">
          <i className={icon} />
        </div>
      )}
    </div>
  );
};

const PTSDashboard = () => {
  const deviceData = useSelector((state) => state.ptsDevice);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [unknownPopupOpen, setUnknownPopupOpen] = useState(false);
  const [unknownDevices, setUnknownDevices] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("ptsName");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("card");
  const [statusTick, setStatusTick] = useState(() => Date.now());

  const connectionStatuses = useSelector((state) => state.deviceConnections?.connectionStatuses || {});

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStatusTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // ── Handlers ──
  const handleAddPTS = useCallback((prefillDeviceId = null) => {
    setEditingDeviceId(prefillDeviceId);
    setFormOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    dispatch(fetchDashboardMetrics());
    dispatch(fetchPTSDeviceList())
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, [dispatch]);

  // Load data on mount
  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchDashboardMetrics());
    Promise.all([dispatch(fetchPTSDeviceList()), dispatch(fetchSiteList())])
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, [dispatch]);

  const dashboardMetrics = deviceData?.dashboardMetrics || {};

  const ptsDeviceList = useMemo(() => {
    return deviceData?.ptsDeviceList || [];
  }, [deviceData?.ptsDeviceList]);

  // Format devices
  const formattedDevices = useMemo(() => {
    return ptsDeviceList.map((device) => {
      const deviceId = device.ptsid || device.id;
      const liveConnection = connectionStatuses[deviceId];
      const liveOnline = isLiveConnectionOnline(liveConnection, statusTick);
      const liveLastActivity = liveConnection?.lastActivity || null;
      const lastActivity = liveLastActivity || device.lastActivity || null;
      const connectionType = liveOnline
        ? (liveConnection?.connectionType || (device.webSocketCapable ? "WebSocket" : "HTTP"))
        : (device.webSocketCapable ? "WebSocket" : "HTTP");

      return {
        id: deviceId,
        ptsid: device.ptsid,
        ptsName: device.ptsName || device.ptsid,
        siteName: device.siteNavigation?.name || device.site?.name || "—",
        status: liveOnline ? "online" : "offline",
        connectionType,
        lastActivity,
        lastUpdated: lastActivity
          ? new Date(lastActivity).toLocaleString()
          : "Never",
        isActive: device.isActive || false,
        ipaddress: device.ipaddress || "—",
        portNumber: device.portNumber || "—",
        webSocketCapable: device.webSocketCapable,
      };
    });
  }, [connectionStatuses, ptsDeviceList, statusTick]);

  // Filtered & sorted devices
  const filteredDevices = useMemo(() => {
    let list = formattedDevices;

    // Status tab filter
    if (statusFilter === "online") list = list.filter((d) => d.status === "online");
    else if (statusFilter === "offline") list = list.filter((d) => d.status === "offline");

    // Search filter
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (d) =>
          (d.ptsName || "").toLowerCase().includes(q) ||
          (d.ptsid || "").toLowerCase().includes(q) ||
          (d.siteName || "").toLowerCase().includes(q) ||
          (d.ipaddress || "").toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "lastActivity") {
        aVal = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        bVal = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      } else {
        aVal = (a[sortBy] || "").toString().toLowerCase();
        bVal = (b[sortBy] || "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [formattedDevices, statusFilter, searchText, sortBy, sortDir]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: formattedDevices.length,
    online: formattedDevices.filter((d) => d.status === "online").length,
    offline: formattedDevices.filter((d) => d.status === "offline").length,
  }), [formattedDevices]);

  // WebSocket capable count
  const wsCount = useMemo(() => formattedDevices.filter((d) => d.webSocketCapable).length, [formattedDevices]);

  const handleFormSave = useCallback(() => {
    dispatch(fetchPTSDeviceList());
    dispatch(fetchDashboardMetrics());
  }, [dispatch]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingDeviceId(null);
  }, []);

  const handleFetchUnknownDevices = useCallback(async () => {
    const devices = await dispatch(fetchUnknownDevices());
    setUnknownDevices(devices || []);
    setUnknownPopupOpen(true);
  }, [dispatch]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  // ── Time ago helper ──
  const timeAgo = (dateStr) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="m365-pts-page">
      {/* Header */}
      <M365PageHeader title="PTS Devices" icon="fa-light fa-microchip" count={tabCounts.all}>
        <div className="m365-pts-command-bar">
          <button className="m365-btn m365-btn--ghost" onClick={handleFetchUnknownDevices}>
            <i className="fa-light fa-question-circle"></i>
            Unknown
          </button>
          <button className="m365-btn m365-btn--ghost" onClick={handleRefresh} disabled={isLoading}>
            <i className="fa-light fa-rotate-right"></i>
            Refresh
          </button>
          <button className="m365-btn m365-btn--primary" onClick={() => handleAddPTS()}>
            <i className="fa-light fa-plus"></i>
            Add Device
          </button>
        </div>
      </M365PageHeader>

      {/* ── Large Summary Stat Tiles ── */}
      <div className="pts-stat-section">
        <div className="pts-stat-grid">
          <FluentStat
            label="Total Devices"
            value={tabCounts.all}
            sub={`${wsCount} WebSocket capable`}
            color="blue"
            icon="fa-light fa-microchip"
            onClick={() => setStatusFilter("all")}
          />
          <FluentStat
            label="Connected"
            value={dashboardMetrics.totalConnectedDevices ?? dashboardMetrics.totalOnline ?? 0}
            sub={`${dashboardMetrics.validatedOnline || 0} validated online`}
            color="green"
            icon="fa-light fa-server"
            onClick={() => setStatusFilter("online")}
          />
          <FluentStat
            label="Unknown Online"
            value={dashboardMetrics.unknownOnline || 0}
            sub="Unregistered connections"
            color="orange"
            icon="fa-light fa-circle-question"
            onClick={handleFetchUnknownDevices}
          />
          <FluentStat
            label="Offline"
            value={dashboardMetrics.offlineRegistered || 0}
            sub="Not responding"
            color="red"
            icon="fa-light fa-circle-xmark"
            onClick={() => setStatusFilter("offline")}
          />
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="m365-tabs">
        {[
          { key: "all", label: "All devices", count: tabCounts.all },
          { key: "online", label: "Online", count: tabCounts.online },
          { key: "offline", label: "Offline", count: tabCounts.offline },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`m365-tab ${statusFilter === tab.key ? "m365-tab--active" : ""}`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
            <span className="m365-tab__count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── Search + Sort Bar ── */}
      <div className="m365-filters">
        <div className="m365-search">
          <i className="fa-light fa-magnifying-glass m365-search__icon"></i>
          <input
            className="m365-search__input"
            placeholder="Search by name, ID, site, or IP…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              className="m365-search__clear"
              onClick={() => setSearchText("")}
              title="Clear search"
            >
              <i className="fa-light fa-xmark" />
            </button>
          )}
        </div>
        <div className="pts-sort-controls">
          <label className="pts-sort-controls__label">
            <i className="fa-light fa-arrow-up-arrow-down" />
            Sort by
          </label>
          <select
            className="m365-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            className="m365-btn m365-btn--ghost pts-sort-controls__dir"
            onClick={toggleSortDir}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            <i className={`fa-light ${sortDir === "asc" ? "fa-arrow-up-short-wide" : "fa-arrow-down-wide-short"}`} />
          </button>
        </div>
        <span className="pts-result-count">
          {filteredDevices.length} device{filteredDevices.length !== 1 ? "s" : ""}
        </span>
        <div className="pts-view-toggle">
          <button
            className={`pts-view-toggle__btn${viewMode === "card" ? " pts-view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("card")}
            title="Card view"
          >
            <i className="fa-light fa-grid-2" />
          </button>
          <button
            className={`pts-view-toggle__btn${viewMode === "list" ? " pts-view-toggle__btn--active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <i className="fa-light fa-list" />
          </button>
        </div>
      </div>

      {/* ── Device Grid / List ── */}
      <div className="pts-device-grid-area">
        {filteredDevices.length === 0 ? (
          <div className="pts-empty-state">
            <i className="fa-light fa-microchip" />
            <p>No devices found</p>
            <span>Try adjusting your search or filters</span>
          </div>
        ) : viewMode === "list" ? (
          /* ── Simple DataGrid List View ── */
          <div className="pts-list-view">
            <DataGrid
              dataSource={filteredDevices}
              keyExpr="id"
              showBorders={false}
              showColumnLines={false}
              rowAlternationEnabled={false}
              hoverStateEnabled
              columnAutoWidth
              wordWrapEnabled={false}
              onRowClick={(e) => navigate(`/admin/ptsdevice/${e.data.id}`)}
              className="pts-list-datagrid"
            >
              <Selection mode="none" />
              <Paging defaultPageSize={20} />
              <Pager showPageSizeSelector allowedPageSizes={[10, 20, 50]} showInfo showNavigationButtons />
              <Column
                dataField="ptsName"
                caption="Device Name"
                cellRender={({ data }) => (
                  <div className="pts-list-name">
                    <span className="pts-list-name__text">{data.ptsName}</span>
                    <span className="pts-list-name__id">{data.ptsid}</span>
                  </div>
                )}
              />
              <Column dataField="siteName" caption="Site" width={160} />
              <Column dataField="ipaddress" caption="IP Address" width={140} />
              <Column dataField="portNumber" caption="Port" width={80} alignment="center" />
              <Column
                dataField="status"
                caption="Status"
                width={110}
                alignment="center"
                cellRender={({ data }) => {
                  const isOnline = data.status === "online";
                  return (
                    <span className={`m365-badge ${isOnline ? "m365-badge--success" : "m365-badge--error"}`}>
                      <i className={`fa-light ${isOnline ? "fa-circle-check" : "fa-circle-xmark"}`} />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  );
                }}
              />
              <Column
                dataField="webSocketCapable"
                caption="Protocol"
                width={120}
                alignment="center"
                cellRender={({ data }) => (
                  <span className={`m365-badge ${String(data.connectionType || "").toLowerCase().includes("websocket") ? "m365-badge--primary" : "m365-badge--neutral"}`}>
                    <i className="fa-light fa-bolt" />
                    {data.connectionType || (data.webSocketCapable ? "WebSocket" : "HTTP")}
                  </span>
                )}
              />
              <Column
                dataField="lastActivity"
                caption="Last Activity"
                width={140}
                cellRender={({ data }) => (
                  <span className="pts-list-activity">{timeAgo(data.lastActivity)}</span>
                )}
              />
            </DataGrid>
          </div>
        ) : (
          /* ── Card View ── */
          <div className="pts-device-grid">
            {filteredDevices.map((device) => {
              const isOnline = device.status === "online";
              return (
                <div
                  key={device.id}
                  className={`pts-device-card ${isOnline ? "pts-device-card--online" : "pts-device-card--offline"}`}
                  onClick={() => navigate(`/admin/ptsdevice/${device.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Accent bar */}
                  <div className="pts-device-card__bar" />

                  {/* Header row */}
                  <div className="pts-device-card__header">
                    <div className="pts-device-card__title-group">
                      <span className="pts-device-card__name">{device.ptsName}</span>
                      <span className="pts-device-card__id">{device.ptsid}</span>
                    </div>
                    <span className={`m365-badge ${isOnline ? "m365-badge--success" : "m365-badge--error"}`}>
                      <i className={`fa-light ${isOnline ? "fa-circle-check" : "fa-circle-xmark"}`} />
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="pts-device-card__stats">
                    <div className="pts-device-card__stat">
                      <i className="fa-light fa-location-dot" />
                      <div>
                        <span className="pts-device-card__stat-label">Site</span>
                        <span className="pts-device-card__stat-value">{device.siteName}</span>
                      </div>
                    </div>
                    <div className="pts-device-card__stat">
                      <i className="fa-light fa-network-wired" />
                      <div>
                        <span className="pts-device-card__stat-label">IP Address</span>
                        <span className="pts-device-card__stat-value">{device.ipaddress}</span>
                      </div>
                    </div>
                    <div className="pts-device-card__stat">
                      <i className="fa-light fa-plug" />
                      <div>
                        <span className="pts-device-card__stat-label">Port</span>
                        <span className="pts-device-card__stat-value">{device.portNumber}</span>
                      </div>
                    </div>
                    <div className="pts-device-card__stat">
                      <i className="fa-light fa-clock" />
                      <div>
                        <span className="pts-device-card__stat-label">Last Activity</span>
                        <span className="pts-device-card__stat-value">{timeAgo(device.lastActivity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pts-device-card__footer">
                    <span className={`m365-badge ${String(device.connectionType || "").toLowerCase().includes("websocket") ? "m365-badge--primary" : "m365-badge--neutral"}`}>
                      <i className="fa-light fa-bolt" />
                      {device.connectionType || (device.webSocketCapable ? "WebSocket" : "HTTP")}
                    </span>
                    <span className="pts-device-card__activity-ts">{device.lastUpdated}</span>
                  </div>

                  {/* Ghost icon */}
                  <div className="pts-device-card__ghost">
                    <i className="fa-light fa-microchip" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unknown Devices SlidePanel */}
      <SlidePanel
        open={unknownPopupOpen}
        onClose={() => setUnknownPopupOpen(false)}
        title="Unknown Connected Devices"
        width={480}
      >
        <div style={{ padding: 20 }}>
          {unknownDevices && unknownDevices.length > 0 ? (
            <>
              <div className="m365-info-banner" style={{ margin: "0 0 16px" }}>
                <i className="fa-light fa-circle-info m365-info-banner__icon"></i>
                <span className="m365-info-banner__text">
                  These devices are connected but not registered in the system.
                </span>
              </div>
              {unknownDevices.map((did, i) => (
                <div key={did || i} className="m365-unknown-row">
                  <div className="m365-unknown-row__left">
                    <i className="fa-light fa-microchip" style={{ color: "#ca5010" }}></i>
                    <span>{did}</span>
                  </div>
                  <button
                    className="m365-btn m365-btn--ghost"
                    onClick={() => {
                      setUnknownPopupOpen(false);
                      handleAddPTS(did);
                    }}
                  >
                    <i className="fa-light fa-plus"></i>
                    Register
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <i className="fa-light fa-circle-check" style={{ fontSize: 40, color: "#107c10", display: "block", marginBottom: 12 }}></i>
              <p style={{ color: "#605e5c", fontSize: 13 }}>No unknown devices connected.</p>
            </div>
          )}
        </div>
      </SlidePanel>

      {/* Add/Edit Device SlidePanel */}
      <SlidePanel
        open={formOpen}
        onClose={handleFormClose}
        title={editingDeviceId ? "Edit PTS Device" : "Add PTS Device"}
        width={520}
      >
        <PTSDeviceFormPanel
          deviceId={editingDeviceId}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      </SlidePanel>

      <LoadPanel visible={isLoading} message="Loading devices…" position={{ my: "center", at: "center", of: window }} />
    </div>
  );
};

export default React.memo(PTSDashboard);
