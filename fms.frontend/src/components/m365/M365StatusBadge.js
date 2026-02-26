/**
 * File:          M365StatusBadge.js
 * Purpose:       Active / Inactive pill badge — M365 Admin Center style
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - isActive (bool):   true → green "Active", false → gray "Inactive"
 * - label    (string): Optional custom label text override
 */
import React from "react";

const M365StatusBadge = ({ isActive, label }) => (
    <span className={`m365-badge ${isActive ? "m365-badge--success" : "m365-badge--neutral"}`}>
        {label || (isActive ? "Active" : "Inactive")}
    </span>
);

export default M365StatusBadge;
