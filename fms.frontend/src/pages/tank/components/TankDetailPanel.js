/**
 * File:          TankDetailPanel.js
 * Purpose:       Read-only tank detail view using M365 info-grid / info-cell / flat-section
 *                pattern — matches the Users page design system.
 * Dependencies:  M365ProgressBar, ptsConfigService, m365-shared.scss
 * Last Modified: 2026-03-02
 *
 * Props:
 * - tank             (object): Tank entity
 * - liveStatus       (object): UploadStatus entry from realtimeStatus redux
 * - connectionStatus (object): Device connection status from deviceConnections redux
 * - onEdit           (func):   Open edit panel
 * - onHistory        (func):   Open history panel
 * - onLinkPTS        (func):   Open PTS link panel
 */
import React, { useEffect, useMemo, useState } from "react";
import M365ProgressBar from "../../../components/m365/M365ProgressBar";
import TankLocationMap from "./TankLocationMap";
import ptsConfigService from "../../../services/ptsConfigService";
import "../tankPage.scss";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const getStatusLevel = (pct) => {
  if (pct < 20) return { text: "Critical", cls: "m365-badge--danger" };
  if (pct < 50) return { text: "Low", cls: "m365-badge--warning" };
  if (pct < 80) return { text: "Normal", cls: "m365-badge--success" };
  return { text: "Full", cls: "m365-badge--info" };
};

const fmt = (d) => (d ? new Date(d).toLocaleString() : "N/A");

const fmtNumber = (v, digits = 0) =>
  Number.isFinite(Number(v)) ? Number(v).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) : "N/A";

const normalizeRecords = (records, limit = 5) =>
  Array.isArray(records) ? records.slice(0, limit) : [];

const getCalibrationBadge = (count) => {
  if (count > 0) return { text: "Available", cls: "m365-badge--success" };
  return { text: "Empty", cls: "m365-badge--warning" };
};

const getHealthQualityBadge = (quality) => {
  switch (quality) {
    case "Good":
      return { text: "Good", cls: "m365-badge--success" };
    case "Acceptable":
      return { text: "Acceptable", cls: "m365-badge--info" };
    case "Poor":
      return { text: "Poor", cls: "m365-badge--danger" };
    default:
      return { text: quality || "Insufficient", cls: "m365-badge--neutral" };
  }
};

const getPhysicalStockOwnerLabel = (value) => {
  switch ((value || "").toLowerCase()) {
    case "upload-status":
      return "UploadStatus probe readings";
    case "tank-measurement":
      return "Tank measurement pipeline";
    default:
      return "System default";
  }
};

const getCalibrationSourceLabel = (value) => {
  switch ((value || "").toLowerCase()) {
    case "manual":
      return "Manual chart";
    case "automatic":
      return "PTS automatic chart";
    case "interval-volume":
      return "Interval-volume chart";
    case "fms-learned":
      return "FMS learned chart";
    default:
      return "Auto priority";
  }
};

const getProductVolumeSourceLabel = (value) => {
  switch ((value || "").toLowerCase()) {
    case "pts":
      return "PTS product volume";
    case "fms-calibrated":
      return "FMS calibrated volume";
    default:
      return "System default";
  }
};

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
const TABS = [
  { id: 'details', label: 'Details', icon: 'fa-light fa-circle-info' },
  { id: 'map', label: 'Map', icon: 'fa-light fa-map' },
];

const TankDetailPanel = ({ tank, liveStatus, connectionStatus, onEdit, onHistory, onLinkPTS }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [calibrationLoading, setCalibrationLoading] = useState(false);
  const [calibrationGenerating, setCalibrationGenerating] = useState(false);
  const [calibrationError, setCalibrationError] = useState(null);
  const [calibrationData, setCalibrationData] = useState(null);

  const probeReadings = useMemo(() => extractProbeReadings(liveStatus), [liveStatus]);

  const selectedProbe = useMemo(() => {
    if (probeReadings.length === 0) return null;
    return tank?.probeNumber
      ? probeReadings.find((r) => r.probeNumber === tank.probeNumber) || null
      : probeReadings[0];
  }, [probeReadings, tank?.probeNumber]);

  const linkedProbeNumber = tank?.probeNumber || null;
  const currentHeight = selectedProbe?.productHeight != null
    ? Math.max(0, Math.round(Number(selectedProbe.productHeight)))
    : null;

  useEffect(() => {
    let active = true;

    const loadCalibration = async () => {
      if (!tank?.ptsId || !linkedProbeNumber) {
        if (active) {
          setCalibrationData(null);
          setCalibrationError(null);
          setCalibrationLoading(false);
        }
        return;
      }

      setCalibrationLoading(true);
      setCalibrationError(null);

      try {
        const requests = [
          ptsConfigService.getTankCalibrationChartTotalRecords(tank.ptsId, linkedProbeNumber),
          ptsConfigService.getTankCalibrationChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
          ptsConfigService.getTankIntervalVolumeChartTotalRecords(tank.ptsId, linkedProbeNumber),
          ptsConfigService.getTankIntervalVolumeChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
          ptsConfigService.getTankAutomaticCalibrationChartTotalRecords(tank.ptsId, linkedProbeNumber),
          ptsConfigService.getTankAutomaticCalibrationChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
        ];

        const hasHeightRequest = currentHeight != null;

        if (hasHeightRequest) {
          requests.push(
            ptsConfigService.getTankVolumeForHeight(
              tank.ptsId,
              linkedProbeNumber,
              currentHeight
            )
          );
        }

        // Calibration health (tank-scoped, independent of PTS device)
        requests.push(
          ptsConfigService.getTankCalibrationHealth(tank.id).catch(() => null)
        );

        const results = await Promise.all(requests);

        if (!active) return;

        const manualTotalResult = results[0];
        const manualRecordsResult = results[1];
        const intervalTotalResult = results[2];
        const intervalRecordsResult = results[3];
        const automaticTotalResult = results[4];
        const automaticRecordsResult = results[5];
        const heightVolumeResult = hasHeightRequest ? results[6] : null;
        const healthResult = results[results.length - 1];

        setCalibrationData({
          manualTotal: manualTotalResult?.data?.totalNumber ?? 0,
          manualRecords: normalizeRecords(manualRecordsResult?.data?.records),
          intervalTotal: intervalTotalResult?.data?.totalNumber ?? 0,
          intervalRecords: normalizeRecords(intervalRecordsResult?.data?.records),
          automaticTotal: automaticTotalResult?.data?.totalNumber ?? 0,
          automaticRecords: normalizeRecords(automaticRecordsResult?.data?.records),
          heightVolume: heightVolumeResult?.data ?? null,
          health: healthResult?.data ?? null,
        });
      } catch (error) {
        if (active) {
          setCalibrationError(
            error?.response?.data?.message || error?.message || "Failed to load PTS calibration data"
          );
          setCalibrationData(null);
        }
      } finally {
        if (active) setCalibrationLoading(false);
      }
    };

    loadCalibration();

    return () => {
      active = false;
    };
  }, [tank?.ptsId, linkedProbeNumber, currentHeight]);

  const handleRefreshCalibration = async () => {
    if (!tank?.ptsId || !linkedProbeNumber) return;
    setCalibrationData((prev) => prev ? { ...prev } : prev);
    setCalibrationError(null);
    setCalibrationLoading(true);
    try {
      const [
        manualTotalResult,
        manualRecordsResult,
        intervalTotalResult,
        intervalRecordsResult,
        automaticTotalResult,
        automaticRecordsResult,
        heightVolumeResult,
      ] = await Promise.all([
        ptsConfigService.getTankCalibrationChartTotalRecords(tank.ptsId, linkedProbeNumber),
        ptsConfigService.getTankCalibrationChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
        ptsConfigService.getTankIntervalVolumeChartTotalRecords(tank.ptsId, linkedProbeNumber),
        ptsConfigService.getTankIntervalVolumeChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
        ptsConfigService.getTankAutomaticCalibrationChartTotalRecords(tank.ptsId, linkedProbeNumber),
        ptsConfigService.getTankAutomaticCalibrationChartRecords(tank.ptsId, linkedProbeNumber, 1, 5),
        currentHeight != null
          ? ptsConfigService.getTankVolumeForHeight(tank.ptsId, linkedProbeNumber, currentHeight)
          : Promise.resolve({ data: null }),
      ]);

      setCalibrationData({
        manualTotal: manualTotalResult?.data?.totalNumber ?? 0,
        manualRecords: normalizeRecords(manualRecordsResult?.data?.records),
        intervalTotal: intervalTotalResult?.data?.totalNumber ?? 0,
        intervalRecords: normalizeRecords(intervalRecordsResult?.data?.records),
        automaticTotal: automaticTotalResult?.data?.totalNumber ?? 0,
        automaticRecords: normalizeRecords(automaticRecordsResult?.data?.records),
        heightVolume: heightVolumeResult?.data ?? null,
      });
    } catch (error) {
      setCalibrationError(
        error?.response?.data?.message || error?.message || "Failed to refresh PTS calibration data"
      );
    } finally {
      setCalibrationLoading(false);
    }
  };

  const handleGenerateAutomaticChart = async () => {
    if (!tank?.ptsId || !linkedProbeNumber) return;
    setCalibrationGenerating(true);
    setCalibrationError(null);

    try {
      const result = await ptsConfigService.generateTankAutomaticCalibrationChart(
        tank.ptsId,
        linkedProbeNumber
      );

      if (!result?.isSuccess) {
        throw new Error(result?.message || "Failed to generate PTS automatic calibration chart");
      }

      await handleRefreshCalibration();
    } catch (error) {
      setCalibrationError(
        error?.response?.data?.message || error?.message || "Failed to generate PTS automatic calibration chart"
      );
    } finally {
      setCalibrationGenerating(false);
    }
  };

  if (!tank) return null;

  const fillPct = tank.tankVolume > 0 ? ((tank.currentStock || 0) / tank.tankVolume) * 100 : 0;
  const status = getStatusLevel(fillPct);

  return (
    <div className="m365-tank-detail">

      {/* ── Tab bar ── */}
      <div className="tdp-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tdp-tab${activeTab === t.id ? ' tdp-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <i className={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Map tab ── */}
      {activeTab === 'map' && (
        <TankLocationMap tank={tank} liveStatus={liveStatus} />
      )}

      {/* ── Details tab ── */}
      {activeTab === 'details' && (<>

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
              <span className="m365-info-cell__label">Mapped PTS Tank</span>
              <span className="m365-info-cell__value">{tank.ptsTankId || "Not Set"}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Auto Stock Updates</span>
              <span className="m365-info-cell__value">{enabledBadge(tank.usePtsProbeReadings)}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Physical Stock Owner</span>
              <span className="m365-info-cell__value">{getPhysicalStockOwnerLabel(tank.probePhysicalStockUpdateSource)}</span>
            </div>
            <div className="m365-info-cell">
              <span className="m365-info-cell__label">Stored Product Volume</span>
              <span className="m365-info-cell__value">{getProductVolumeSourceLabel(tank.productVolumeSource)}</span>
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

        {/* ── PTS Calibration ── */}
        <div className="m365-flat-section">
          <h3 className="m365-flat-section__title">
            <i className="fa-light fa-ruler-combined" /> PTS Calibration
          </h3>

          {!tank.ptsId || !linkedProbeNumber ? (
            <div className="m365-tank-detail__calibration-empty">
              Link a PTS device and mapped probe to inspect PTS calibration charts. Current PTS tank mapping: {tank.ptsTankId || "Not Set"}.
            </div>
          ) : (
            <>
              <div className="m365-tank-detail__calibration-actions">
                <button
                  className="m365-btn m365-btn--ghost"
                  type="button"
                  onClick={handleRefreshCalibration}
                  disabled={calibrationLoading || calibrationGenerating}
                >
                  <i className={`fa-light fa-rotate-right${calibrationLoading ? " fa-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  className="m365-btn m365-btn--primary"
                  type="button"
                  onClick={handleGenerateAutomaticChart}
                  disabled={calibrationLoading || calibrationGenerating}
                >
                  <i className={`fa-light ${calibrationGenerating ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} />
                  {calibrationGenerating ? "Generating..." : "Generate PTS Auto Chart"}
                </button>
              </div>

              {calibrationError && (
                <div className="m365-tank-detail__calibration-error">{calibrationError}</div>
              )}

              <div className="m365-info-grid">
                {[
                  { label: "PTS Manual Chart", total: calibrationData?.manualTotal ?? 0 },
                  { label: "PTS Interval Volume", total: calibrationData?.intervalTotal ?? 0 },
                  { label: "PTS Automatic Chart", total: calibrationData?.automaticTotal ?? 0 },
                ].map((item) => {
                  const badge = getCalibrationBadge(item.total);
                  return (
                    <div className="m365-info-cell" key={item.label}>
                      <span className="m365-info-cell__label">{item.label}</span>
                      <span className="m365-info-cell__value">
                        <span className={`m365-badge ${badge.cls}`}>{badge.text}</span>
                        <span className="m365-tank-detail__calibration-count">{fmtNumber(item.total)} records</span>
                      </span>
                    </div>
                  );
                })}
                <div className="m365-info-cell">
                  <span className="m365-info-cell__label">Current Height Lookup</span>
                  <span className="m365-info-cell__value">
                    {currentHeight != null && calibrationData?.heightVolume
                      ? `${fmtNumber(calibrationData.heightVolume.volume)} L at ${fmtNumber(calibrationData.heightVolume.height)} mm`
                      : "Unavailable"}
                  </span>
                </div>
                <div className="m365-info-cell">
                  <span className="m365-info-cell__label">Local Chart Preference</span>
                  <span className="m365-info-cell__value">{getCalibrationSourceLabel(tank.calibrationChartSource)}</span>
                </div>
                {calibrationData?.health && (
                  <>
                    <div className="m365-info-cell">
                      <span className="m365-info-cell__label">PTS Calibration Quality</span>
                      <span className="m365-info-cell__value">
                        {(() => {
                          const qb = getHealthQualityBadge(calibrationData.health.overallQuality);
                          return <span className={`m365-badge ${qb.cls}`}>{qb.text}</span>;
                        })()}
                      </span>
                    </div>
                    <div className="m365-info-cell">
                      <span className="m365-info-cell__label">Avg Variance</span>
                      <span className="m365-info-cell__value">
                        {calibrationData.health.averageVariancePercent != null
                          ? `${calibrationData.health.averageVariancePercent.toFixed(2)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {calibrationData?.health?.recommendRecalibration && (
                <div className="m365-tank-detail__calibration-warning">
                  <i className="fa-light fa-triangle-exclamation"></i>
                  <span>
                    <strong>PTS recalibration recommended</strong>
                    {calibrationData.health.recommendationNotes && (
                      <> — {calibrationData.health.recommendationNotes}</>
                    )}
                  </span>
                </div>
              )}

              <div className="m365-tank-detail__calibration-previews">
                <div className="m365-tank-detail__calibration-card">
                  <div className="m365-tank-detail__calibration-card-title">PTS Manual Chart Preview</div>
                  {calibrationLoading ? (
                    <div className="m365-tank-detail__calibration-muted">Loading...</div>
                  ) : calibrationData?.manualRecords?.length ? (
                    calibrationData.manualRecords.map((record) => (
                      <div className="m365-tank-detail__calibration-row" key={`manual-${record.height}`}>
                        <span>{fmtNumber(record.height)} mm</span>
                        <span>{fmtNumber(record.volume)} L</span>
                      </div>
                    ))
                  ) : (
                    <div className="m365-tank-detail__calibration-muted">No PTS manual calibration rows found.</div>
                  )}
                </div>

                <div className="m365-tank-detail__calibration-card">
                  <div className="m365-tank-detail__calibration-card-title">PTS Interval Volume Preview</div>
                  {calibrationLoading ? (
                    <div className="m365-tank-detail__calibration-muted">Loading...</div>
                  ) : calibrationData?.intervalRecords?.length ? (
                    calibrationData.intervalRecords.map((record) => (
                      <div className="m365-tank-detail__calibration-row" key={`interval-${record.height}`}>
                        <span>{fmtNumber(record.height)} mm</span>
                        <span>{fmtNumber(record.volume)} L</span>
                        <span>{fmtNumber(record.passesNumber)} pass(es)</span>
                      </div>
                    ))
                  ) : (
                    <div className="m365-tank-detail__calibration-muted">No PTS interval-volume rows found.</div>
                  )}
                </div>

                <div className="m365-tank-detail__calibration-card">
                  <div className="m365-tank-detail__calibration-card-title">PTS Automatic Chart Preview</div>
                  {calibrationLoading ? (
                    <div className="m365-tank-detail__calibration-muted">Loading...</div>
                  ) : calibrationData?.automaticRecords?.length ? (
                    calibrationData.automaticRecords.map((record) => (
                      <div className="m365-tank-detail__calibration-row" key={`automatic-${record.height}`}>
                        <span>{fmtNumber(record.height)} mm</span>
                        <span>{fmtNumber(record.volume)} L</span>
                      </div>
                    ))
                  ) : (
                    <div className="m365-tank-detail__calibration-muted">No PTS automatic calibration rows found.</div>
                  )}
                </div>
              </div>
            </>
          )}
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

      </>)}

    </div>
  );
};

export default TankDetailPanel;
