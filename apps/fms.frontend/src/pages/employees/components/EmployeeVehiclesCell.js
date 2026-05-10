/**
 * File: EmployeeVehiclesCell.js
 * Purpose: Compact default-vehicle text cell for the employee grid.
 * Dependencies: React, employeePage.scss muted text class.
 * Last Modified: 2026-04-25
 *
 * Key Components:
 * - EmployeeVehiclesCell(): Renders assigned vehicle labels or a muted empty marker.
 */
import React from "react";

const EmployeeVehiclesCell = ({ text }) => {
    if (!text) return <span className="employee-grid__muted">-</span>;
    return <span title={text}>{text}</span>;
};

export default EmployeeVehiclesCell;