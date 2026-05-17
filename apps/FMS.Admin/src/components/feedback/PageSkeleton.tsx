/**
 * File:          PageSkeleton.tsx (FMS.Admin)
 * Purpose:       Loading-state placeholder. TS twin of fms.frontend
 *                PageSkeleton.jsx. PRD §7.1 L5.
 */

import React from "react";
import "./feedback.scss";

interface PageSkeletonProps {
  variant?: "table" | "form" | "card-grid";
  rows?: number;
}

export default function PageSkeleton({
  variant = "table",
  rows = 5,
}: PageSkeletonProps) {
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
