/**
 * File:          M365ProgressBar.js
 * Purpose:       Linear progress bar with M365 status colours.
 *                Red < 20%, Amber < 50%, Green < 80%, Blue >= 80%.
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-26
 *
 * Props:
 * - percentage (number): Fill percentage 0-100
 * - height     (number): Bar height in px — default 6
 * - showLabel  (bool):   Show percentage text to the right — default false
 */
import React from "react";

const getStatusColor = (pct) => {
  if (pct < 20) return "var(--m365-danger, #d13438)";
  if (pct < 50) return "var(--m365-warning, #ffaa44)";
  if (pct < 80) return "var(--m365-success, #0e7a0d)";
  return "var(--m365-primary, #0078d4)";
};

const M365ProgressBar = ({ percentage = 0, height = 6, showLabel = false }) => {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className="m365-progress-bar" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        className="m365-progress-bar__track"
        style={{
          flex: 1,
          height,
          borderRadius: height / 2,
          background: "var(--m365-bg-hover, #f3f2f1)",
          overflow: "hidden",
        }}
      >
        <div
          className="m365-progress-bar__fill"
          style={{
            width: `${clamped}%`,
            height: "100%",
            borderRadius: height / 2,
            background: getStatusColor(clamped),
            transition: "width 0.4s ease",
          }}
        />
      </div>
      {showLabel && (
        <span
          className="m365-progress-bar__label"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--m365-text-secondary, #605e5c)",
            minWidth: 36,
            textAlign: "right",
          }}
        >
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

export default M365ProgressBar;
