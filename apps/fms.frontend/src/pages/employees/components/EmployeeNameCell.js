/**
 * File: EmployeeNameCell.js
 * Purpose: Formatted employee identity cell with initials and work number.
 * Dependencies: React, employeePage.scss name-cell classes.
 * Last Modified: 2026-04-25
 *
 * Key Components:
 * - EmployeeNameCell(): Renders the employee name in the compact grid identity format.
 */
import React from "react";

const normalizeText = (value) => String(value || "").trim();

const AVATAR_PALETTE = [
  { background: "#0078d4", color: "#ffffff" },
  { background: "#107c10", color: "#ffffff" },
  { background: "#ca5010", color: "#ffffff" },
  { background: "#8764b8", color: "#ffffff" },
  { background: "#038387", color: "#ffffff" },
  { background: "#d13438", color: "#ffffff" },
];

const getEmployeeInitials = (name) => {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "?";
};

const getAvatarStyle = (seedValue) => {
  const seed = normalizeText(seedValue);

  if (!seed) {
    return {
      "--employee-avatar-bg": AVATAR_PALETTE[0].background,
      "--employee-avatar-color": AVATAR_PALETTE[0].color,
    };
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) >>> 0;
  }

  const paletteEntry = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return {
    "--employee-avatar-bg": paletteEntry.background,
    "--employee-avatar-color": paletteEntry.color,
  };
};

const EmployeeNameCell = ({ employee }) => {
  const fullName = normalizeText(employee?.fullName) || "Unnamed employee";
  const workNo = normalizeText(employee?.employeeWorkNo);
  const avatarStyle = getAvatarStyle(`${fullName}|${workNo}`);

  return (
    <div className="employee-grid__name-cell">
      <span className="employee-grid__avatar" style={avatarStyle} aria-hidden="true">
        {getEmployeeInitials(fullName)}
      </span>
      <span className="employee-grid__name-copy">
        <span className="employee-grid__name-text" title={fullName}>{fullName}</span>
        {workNo ? <span className="employee-grid__name-meta">Work no. {workNo}</span> : null}
      </span>
    </div>
  );
};

export default EmployeeNameCell;