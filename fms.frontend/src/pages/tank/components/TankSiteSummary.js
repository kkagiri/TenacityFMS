/**
 * File:          TankSiteSummary.js
 * Purpose:       Summary view rendered when a site node is selected in the tree.
 *                Shows site totals, fuel-grade breakdown, and structured tank cards.
 * Dependencies:  M365ProgressBar, TankComponents
 * Last Modified: 2026-03-24
 *
 * Props:
 * - site           (object): Site entity
 * - siteSummary    (object): { totalVolume, totalStock, fillPct, tankCount, gradeBreakdown }
 * - tanks          (array):  Tanks belonging to this site
 * - onSelectTank   (func):   Navigate to a specific tank
 */
import React from "react";
import M365ProgressBar from "../../../components/m365/M365ProgressBar";
import { LorryTanker, StationaryTank } from "../../tankStock/dashboard/TankComponents";

const getLevelColor = (pct) => {
  if (pct < 20) return "#f87171";
  if (pct < 50) return "#fb923c";
  if (pct < 80) return "#60a5fa";
  return "#4ade80";
};

const getStatusBadge = (pct) => {
  if (pct < 20) return { text: "Critical", cls: "m365-badge--danger" };
  if (pct < 50) return { text: "Low", cls: "m365-badge--warning" };
  if (pct < 80) return { text: "Normal", cls: "m365-badge--info" };
  return { text: "Full", cls: "m365-badge--success" };
};

const TankSiteSummary = ({ site, siteSummary, tanks, onSelectTank }) => {
  if (!site) return null;

  const {
    totalVolume = 0,
    totalStock = 0,
    fillPct = 0,
    tankCount = 0,
    gradeBreakdown = [],
  } = siteSummary || {};

  const siteName = site.siteName || site.name;
  const availableCapacity = Math.max(totalVolume - totalStock, 0);
  const overallStatus = getStatusBadge(fillPct);

  const statCards = [
    {
      label: "Tanks",
      value: tankCount.toLocaleString(),
      meta: "Registered at this site",
      icon: "fa-light fa-gas-pump",
    },
    {
      label: "Total Stock",
      value: `${totalStock.toLocaleString()} L`,
      meta: "Current fuel on hand",
      icon: "fa-light fa-gauge-high",
    },
    {
      label: "Capacity",
      value: `${totalVolume.toLocaleString()} L`,
      meta: `${availableCapacity.toLocaleString()} L available`,
      icon: "fa-light fa-cube",
    },
    {
      label: "Fill Level",
      value: `${fillPct.toFixed(1)}%`,
      meta: `${overallStatus.text} overall`,
      icon: "fa-light fa-chart-line",
    },
  ];

  return (
    <div className="m365-tank-site-summary">
      {/* ── Site Header ── */}
      <div className="m365-tank-site-summary__hero">
        <div className="m365-tank-site-summary__hero-main">
          <div className="m365-tank-site-summary__icon-circle">
            <i className="fa-light fa-location-dot" />
          </div>
          <div className="m365-tank-site-summary__title-block">
            <h2 className="m365-tank-site-summary__name">{siteName}</h2>
            <div className="m365-tank-site-summary__meta">
              <span className="m365-badge m365-badge--info">{tankCount} tank(s)</span>
              <span className={`m365-badge ${overallStatus.cls}`}>{overallStatus.text}</span>
              <span className="m365-tank-site-summary__count">{fillPct.toFixed(1)}% overall</span>
            </div>
          </div>
        </div>

        <div className="m365-tank-site-summary__hero-side">
          <span className="m365-tank-site-summary__hero-label">Available Capacity</span>
          <span className="m365-tank-site-summary__hero-value">{availableCapacity.toLocaleString()} L</span>
        </div>
      </div>

      {/* ── Overall Volume ── */}
      <div className="m365-tank-site-summary__volume">
        <div className="m365-tank-site-summary__volume-top">
          <span className="m365-tank-site-summary__volume-copy">
            {totalStock.toLocaleString()} L of {totalVolume.toLocaleString()} L
          </span>
          <span className="m365-tank-site-summary__volume-pct">{fillPct.toFixed(1)}%</span>
        </div>
        <M365ProgressBar percentage={fillPct} height={8} />
        <div className="m365-tank-site-summary__volume-subtext">
          Available: {availableCapacity.toLocaleString()} L
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="m365-tank-site-summary__stats-grid">
        {statCards.map((item) => (
          <div className="m365-tank-site-summary__stat-card" key={item.label}>
            <div className="m365-tank-site-summary__stat-top">
              <span className="m365-tank-site-summary__stat-label">{item.label}</span>
              <i className={item.icon} />
            </div>
            <div className="m365-tank-site-summary__stat-value">{item.value}</div>
            <div className="m365-tank-site-summary__stat-meta">{item.meta}</div>
          </div>
        ))}
      </div>

      {/* ── Fuel Grade Breakdown ── */}
      {gradeBreakdown.length > 0 && (
        <div className="m365-flat-section">
          <h3 className="m365-flat-section__title">
            <i className="fa-light fa-droplet" /> Fuel Grade Breakdown
          </h3>
          <div className="m365-info-grid">
            {gradeBreakdown.map((g) => (
              <div key={g.grade} className="m365-info-cell">
                <span className="m365-info-cell__label">{g.grade}</span>
                <span className="m365-info-cell__value">
                  {g.stock.toLocaleString()} / {g.volume.toLocaleString()} L
                </span>
                <span style={{ fontSize: 11, color: "var(--m365-text-tertiary)" }}>
                  {g.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tank Cards ── */}
      <div className="m365-flat-section">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-gas-pump" /> Tanks at this Site
        </h3>
        <div className="m365-site-tank-cards">
          {(tanks || []).map((t, idx) => {
            const pct =
              t.tankVolume > 0
                ? ((t.currentStock || 0) / t.tankVolume) * 100
                : 0;
            const isMobile = t.tankType === "MobileTanker";
            const status = getStatusBadge(pct);
            const fuelColor = getLevelColor(pct);
            const clipId = `site-tank-${t.tankId ?? t.id ?? idx}`;

            return (
              <button
                key={t.tankId ?? t.id ?? idx}
                className="m365-site-tank-card"
                type="button"
                onClick={() => onSelectTank && onSelectTank(t)}
              >
                <div className="m365-site-tank-card__header">
                  <span className="m365-site-tank-card__name">
                    <i className={`fa-light ${isMobile ? "fa-truck-moving" : "fa-gas-pump"}`} />
                    {t.name}
                  </span>
                  <span className={`m365-badge ${status.cls}`}>{status.text}</span>
                </div>

                <div className="m365-site-tank-card__meta">
                  <span>{t.siteName || site.siteName || site.name || "No Site"}</span>
                  <span>{t.fuelGradeName || "No Fuel Grade"}</span>
                  {t.ptsId && (
                    <span className="m365-site-tank-card__pts">
                      <i className="fa-light fa-satellite-dish" /> PTS
                    </span>
                  )}
                </div>

                <div className="m365-site-tank-card__visual">
                  {isMobile ? (
                    <LorryTanker level={pct} fuelColor={fuelColor} clipId={`${clipId}-lorry`} />
                  ) : (
                    <StationaryTank level={pct} fuelColor={fuelColor} clipId={`${clipId}-stationary`} />
                  )}
                </div>

                <div className="m365-site-tank-card__footer">
                  <span>
                    {(t.currentStock || 0).toLocaleString()} L / {(t.tankVolume || 0).toLocaleString()} L
                  </span>
                  <span
                    className="m365-site-tank-card__pct"
                    style={{
                      color: pct < 20 ? "#d13438" : pct < 50 ? "#ca5010" : pct < 80 ? "#0078d4" : "#107c10",
                    }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>

                <div className="m365-site-tank-card__actions">
                  <span className="m365-site-tank-card__action-link">
                    <i className="fa-light fa-eye" /> View details
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TankSiteSummary;
