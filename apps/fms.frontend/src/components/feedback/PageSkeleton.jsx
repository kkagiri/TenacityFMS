/**
 * File:          PageSkeleton.jsx
 * Purpose:       Layout-stable placeholder shown during initial data load,
 *                preventing layout-shift "flash of empty content". PRD §7.1 L5.
 * Dependencies:  React
 * Last Modified: 2026-05-16
 *
 * Props:
 * - variant  "table" | "form" | "card-grid" — picks a sensible row layout
 * - rows     Number of placeholder rows (default 5)
 */

import React from "react";
import "./feedback.scss";

export default function PageSkeleton({ variant = "table", rows = 5 }) {
  return (
    <div
      className="fms-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="fms-skeleton__bar fms-skeleton__bar--title" />
      <div className="fms-skeleton__bar fms-skeleton__bar--meta" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className={`fms-skeleton__bar fms-skeleton__bar--row fms-skeleton__bar--${variant}`}
        />
      ))}
    </div>
  );
}
