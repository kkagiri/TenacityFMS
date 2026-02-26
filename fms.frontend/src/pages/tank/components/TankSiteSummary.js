/**
 * File:          TankSiteSummary.js
 * Purpose:       Summary view rendered when a site node is selected in the tree.
 *                Shows site totals, fuel-grade breakdown, and compact tank cards.
 * Dependencies:  M365ProgressBar
 * Last Modified: 2026-02-26
 *
 * Props:
 * - site           (object): Site entity
 * - siteSummary    (object): { totalVolume, totalStock, fillPct, tankCount, gradeBreakdown }
 * - tanks          (array):  Tanks belonging to this site
 * - onSelectTank   (func):   Navigate to a specific tank
 */
import React from "react";
import M365ProgressBar from "../../../components/m365/M365ProgressBar";

const TankSiteSummary = ({ site, siteSummary, tanks, onSelectTank }) => {
  if (!site) return null;

  const {
    totalVolume = 0,
    totalStock = 0,
    fillPct = 0,
    tankCount = 0,
    gradeBreakdown = [],
  } = siteSummary || {};

  return (
    <div className="m365-tank-site-summary">
      {/* ── Site Header ── */}
      <div className="m365-tank-site-summary__header">
        <div className="m365-tank-site-summary__title-block">
          <h2 className="m365-tank-site-summary__name">{site.siteName || site.name}</h2>
          <div className="m365-tank-detail__meta">
            <span className="m365-badge m365-badge--info">{tankCount} tank(s)</span>
            <span className="m365-tank-site-summary__count">{fillPct.toFixed(1)}% overall</span>
          </div>
        </div>
      </div>

      {/* ── Overall Volume ── */}
      <div className="m365-tank-detail__volume">
        <div className="tw-flex tw-justify-between tw-mb-1" style={{ fontSize: 13 }}>
          <span style={{ color: "var(--m365-text-secondary)" }}>
            {totalStock.toLocaleString()} L of {totalVolume.toLocaleString()} L
          </span>
          <span style={{ fontWeight: 600 }}>{fillPct.toFixed(1)}%</span>
        </div>
        <M365ProgressBar percentage={fillPct} height={8} />
      </div>

      {/* ── Stats Grid ── */}
      <div className="m365-info-grid" style={{ marginBottom: 8 }}>
        <div className="m365-info-cell">
          <span className="m365-info-cell__label">Tanks</span>
          <span className="m365-info-cell__value" style={{ fontSize: 18, fontWeight: 700 }}>{tankCount}</span>
        </div>
        <div className="m365-info-cell">
          <span className="m365-info-cell__label">Total Stock</span>
          <span className="m365-info-cell__value" style={{ fontSize: 18, fontWeight: 700 }}>{totalStock.toLocaleString()} L</span>
        </div>
        <div className="m365-info-cell">
          <span className="m365-info-cell__label">Capacity</span>
          <span className="m365-info-cell__value" style={{ fontSize: 18, fontWeight: 700 }}>{totalVolume.toLocaleString()} L</span>
        </div>
        <div className="m365-info-cell">
          <span className="m365-info-cell__label">Fill %</span>
          <span className="m365-info-cell__value" style={{ fontSize: 18, fontWeight: 700 }}>{fillPct.toFixed(1)}%</span>
        </div>
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
        <div className="m365-tank-cards">
          {(tanks || []).map((t, idx) => {
            const pct =
              t.tankVolume > 0
                ? ((t.currentStock || 0) / t.tankVolume) * 100
                : 0;
            return (
              <button
                key={t.tankId ?? t.id ?? idx}
                className="m365-tank-card"
                onClick={() => onSelectTank && onSelectTank(t)}
              >
                <div className="m365-tank-card__header">
                  <i
                    className={
                      t.tankType === "MobileTanker"
                        ? "fa-light fa-truck-moving"
                        : "fa-light fa-gas-pump"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <span className="m365-tank-card__name">{t.name}</span>
                </div>
                <M365ProgressBar percentage={pct} height={6} />
                <div className="m365-tank-card__footer">
                  <span>{(t.currentStock || 0).toLocaleString()} L</span>
                  <span>{pct.toFixed(0)}%</span>
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
