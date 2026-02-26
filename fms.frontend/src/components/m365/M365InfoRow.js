/**
 * File:          M365InfoRow.js
 * Purpose:       Reusable label–value row with optional icon, M365 Admin Center style
 * Dependencies:  m365-shared.scss
 * Last Modified: 2026-02-25
 *
 * Props:
 * - label (string):   Left-side label text
 * - value (node):     Right-side value (string or JSX)
 * - icon  (string):   Optional FontAwesome class, e.g. "fa-light fa-building"
 */
import React from "react";

const M365InfoRow = ({ label, value, icon }) => (
    <div className="m365-info-row">
        <span className="m365-info-row__label">
            {icon && <i className={icon}></i>}
            {label}
        </span>
        <span className="m365-info-row__value">{value ?? "–"}</span>
    </div>
);

export default M365InfoRow;
