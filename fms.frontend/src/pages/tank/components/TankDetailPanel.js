/**
 * File:          TankDetailPanel.js
 * Purpose:       Read-only tank detail view using M365 info-grid / info-cell / flat-section
 *                pattern — matches the Users page design system.
 * Dependencies:  M365ProgressBar, m365-shared.scss
 * Last Modified: 2026-02-26
 *
 * Props:
 * - tank             (object): Tank entity
 * - liveStatus       (object): UploadStatus entry from realtimeStatus redux
 * - connectionStatus (object): Device connection status from deviceConnections redux
 * - onEdit           (func):   Open edit panel
 * - onHistory        (func):   Open history panel
 * - onLinkPTS        (func):   Open PTS link panel
 */
import React, { useMemo } from "react";
import M365ProgressBar from "../../../components/m365/M365ProgressBar";
import "../tankPage.scss";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const getStatusLevel = (pct) => {
  if (pct < 20) return { text: "Critical", cls: "m365-badge--danger" };
  if (pct < 50) return { text: "Low", cls: "m365-badge--warning" };
  if (pct < 80) return { text: "Normal", cls: "m365-badge--success" };
  return { text: "Full", cls: "m365-badge--info" };
};

const fmt = (d) => (d ? new Date(d).toLocaleString() : "N/A");

const enabledBadge = (v) =>
  v
    ? <span className="m365-badge m365-badge--success">Enabled</span>
    : <span className="m365-badge m365-badge--neutral">Disabled</span>;

const extractProbeReadings = (liveStatus) => {
  const probes = liveStatus?.status?.probes;
  const onlineStatus = probes?.onlineStatus || probes?.OnlineStatus;
  if (!onlineStatus) return [];

  const measurements = onlineStatus.measurements || onlineStatus.Measurements || [];
  const ids = onlineStatus.ids || onlineStatus.Ids || [];

  if (Array.isArray(measurements) && measurements.length > 0) {
    return measurements
      .map((m, i) => {
        const pn = Number(m?.probeNumber ?? m?.ProbeNumber ?? ids[i] ?? 0) || 0;
        if (pn <= 0) return null;
        return {
          probeNumber: pn,
          productVolume: m?.productVolume ?? m?.ProductVolume ?? null,
          productHeight: m?.productHeight ?? m?.ProductHeight ?? null,
          waterHeight: m?.waterHeight ?? m?.WaterHeight ?? null,
          temperature: m?.temperature ?? m?.Temperature ?? null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.probeNumber - b.probeNumber);
  }

  return (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id || 0))
    .filter((id) => id > 0)
    .map((pn) => ({
      probeNumber: pn, productVolume: null, productHeight: null,
      waterHeight: null, temperature: null,
    }));
};

/* ── Component ───────────────────────────────────────────────────────────── */
const TankDetailPanel = ({ tank, liveStatus, connectionStatus, onEdit, onHistory, onLinkPTS }) => {
  const probeReadings = useMemo(() => extractProbeReadings(liveStatus), [liveStatus]);

  const selectedProbe = useMemo(() => {
    if (probeReadings.length === 0) return null;
    return tank?.probeNumber
      ? probeReadings.find((r) => r.probeNumber === tank.probeNumber) || null
      : probeReadings[0];
  }, [probeReadings, tank?.probeNumber]);

  if (!tank) return null;

  const fillPct = tank.tankVolume > 0 ? ((tank.currentStock || 0) / tank.tankVolume) * 100 : 0;
  const status = getStatusLevel(fillPct);

  return (
    <div className="m365-tank-detail">

      {/* ── Command bar ── */}
      <div className="m365-tank-detail__cmd">
        <button className="m365-action-link" onClick={onHistory}>
          <i className="fa-light fa-arrow-right-arrow-left" />
          <span>View transactions</span>
        </button>
        {onEdit && (
          <button className="m365-action-link" onClick={onEdit}>
            <i className="fa-light fa-pen-to-square" />
            <span>Edit tank</span>
          </button>
        )}
        {onLinkPTS && (
          <button className="m365-action-link" onClick={onLinkPTS}>
            <i className="fa-light fa-link" />
            <span>Link PTS</span>
          </button>
        )}
      </div>

      {/* ── Meta strip (name is already in SlidePanel title bar) ── */}
      <div className="m365-tank-detail__strip">
        <div className={`m365-tank-detail__icon-circle ${tank.tankType === "MobileTanker"
            ? "m365-tank-detail__icon-circle--mobile"
            : "m365-tank-detail__icon-circle--stationary"
          }`}>
          <i className={tank.tankType === "MobileTanker" ? "fa-light fa-truck-moving" : "fa-light fa-gas-pump"} />
        </div>
        <span className={`m365-badge ${status.cls}`}>{status.text}</span>
        <span className="m365-tank-detail__strip-site">{tank.siteName || "No Site"}</span>
        <span className="m365-tank-detail__strip-type">
          {tank.tankType === "MobileTanker" ? "Mobile Tanker" : "Stationary"}
        </span>
        {tank.ptsId && (
          <span className="m365-tank-detail__strip-pts">PTS {tank.ptsId}</span>
        )}
      </div>

      {/* ── Volume Bar ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: "var(--m365-text-secondary)" }}>
            {(tank.currentStock || 0).toLocaleString()} L of {tank.tankVolume.toLocaleString()} L
          </span>
          <span style={{ fontWeight: 600 }}>{fillPct.toFixed(1)}%</span>
        </div>
        <M365ProgressBar percentage={fillPct} height={8} />
        <div style={{ fontSize: 12, color: "var(--m365-text-tertiary)", marginTop: 4 }}>
          Available: {(tank.tankVolume - (tank.currentStock || 0)).toLocaleString()} L
        </div>
      </div>

      {/* ── Configuration ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-sliders" /> Configuration
        </h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Book Keeping</span>
            <span className="m365-info-cell__value">{enabledBadge(tank.useBookKeeping)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Auto Book Keeping</span>
            <span className="m365-info-cell__value">{enabledBadge(tank.hasAutomaticBookKeeping)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Priority</span>
            <span className="m365-info-cell__value">
              {tank.priority ? (
                <span className={`m365-badge ${tank.priority === "High" ? "m365-badge--danger" :
                  tank.priority === "Medium" ? "m365-badge--warning" : "m365-badge--neutral"
                  }`}>{tank.priority}</span>
              ) : "Not Set"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Fuel Grade</span>
            <span className="m365-info-cell__value">{tank.fuelGradeName || "Not Set"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Discrepancy Threshold</span>
            <span className="m365-info-cell__value">
              {tank.discrepancyThreshold ? `${tank.discrepancyThreshold} L` : "Not Set"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dimensions ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-ruler-combined" /> Dimensions
        </h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Height</span>
            <span className="m365-info-cell__value">{tank.tankHeight ? `${tank.tankHeight} m` : "N/A"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Length</span>
            <span className="m365-info-cell__value">{tank.tankLength ? `${tank.tankLength} m` : "N/A"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Total Capacity</span>
            <span className="m365-info-cell__value">{tank.tankVolume.toLocaleString()} L</span>
          </div>
        </div>
      </div>

      {/* ── Stock Status ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-chart-line" /> Stock Status
        </h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Last Book Update</span>
            <span className="m365-info-cell__value">{fmt(tank.lastStockUpdate)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Physical Stock</span>
            <span className="m365-info-cell__value">
              {tank.physicalStockValue != null ? `${tank.physicalStockValue.toLocaleString()} L` : "N/A"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Physical Updated</span>
            <span className="m365-info-cell__value">{fmt(tank.lastPhysicalStockUpdate)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Stock Source</span>
            <span className="m365-info-cell__value">{tank.physicalStockSource || "System"}</span>
          </div>
        </div>
      </div>

      {/* ── PTS Live Data ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-satellite-dish" /> PTS Live Data
        </h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Connection</span>
            <span className="m365-info-cell__value">
              {tank.ptsId ? (
                <span className={`m365-badge ${connectionStatus?.status && connectionStatus.status !== "Disconnected"
                  ? "m365-badge--success" : "m365-badge--warning"
                  }`}>
                  {connectionStatus?.status || "Awaiting signal"}
                </span>
              ) : "Not Linked"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Mapped Probe</span>
            <span className="m365-info-cell__value">{tank.probeNumber || "Not Set"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Auto Stock Updates</span>
            <span className="m365-info-cell__value">{enabledBadge(tank.usePtsProbeReadings)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Live Volume</span>
            <span className="m365-info-cell__value">
              {selectedProbe?.productVolume != null
                ? `${Number(selectedProbe.productVolume).toFixed(2)} L` : "N/A"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Last Upload</span>
            <span className="m365-info-cell__value">{fmt(liveStatus?.receivedAt)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Temperature</span>
            <span className="m365-info-cell__value">
              {selectedProbe?.temperature != null
                ? `${Number(selectedProbe.temperature).toFixed(1)} °C` : "N/A"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Product Height</span>
            <span className="m365-info-cell__value">
              {selectedProbe?.productHeight != null
                ? `${Number(selectedProbe.productHeight).toFixed(1)} mm` : "N/A"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Water Height</span>
            <span className="m365-info-cell__value">
              {selectedProbe?.waterHeight != null
                ? `${Number(selectedProbe.waterHeight).toFixed(1)} mm` : "N/A"}
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Probe Channels</span>
            <span className="m365-info-cell__value">{probeReadings.length} channel(s)</span>
          </div>
        </div>
      </div>

      {/* ── Location Validation ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className={tank.tankType === "MobileTanker" ? "fa-light fa-truck" : "fa-light fa-map-pin"} />{" "}
          Location Validation
        </h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Tank Type</span>
            <span className="m365-info-cell__value">
              <span className={`m365-badge ${tank.tankType === "MobileTanker" ? "m365-badge--warning" : "m365-badge--info"}`}>
                {tank.tankType === "MobileTanker" ? "Mobile Tanker" : "Stationary"}
              </span>
            </span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Validation Radius</span>
            <span className="m365-info-cell__value">{tank.locationValidationRadius || 100} m</span>
          </div>
          {tank.tankType === "MobileTanker" ? (
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Linked Vehicle</span>
              <span className="m365-info-cell__value">
                {tank.linkedVehicleName || tank.linkedVehicleId
                  ? tank.linkedVehicleName || `ID: ${tank.linkedVehicleId}`
                  : "Not Linked"}
              </span>
            </div>
          ) : (
            <>
              <div className="m365-info-cell">
                <span className="m365-info-cell__label">Latitude</span>
                <span className="m365-info-cell__value">{tank.latitude ?? "Not Set"}</span>
              </div>
              <div className="m365-info-cell">
                <span className="m365-info-cell__label">Longitude</span>
                <span className="m365-info-cell__value">{tank.longitude ?? "Not Set"}</span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default TankDetailPanel;
