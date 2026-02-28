/**
 * File: EmployeeDetailPanel.js
 * Purpose: Read-only employee detail content shown inside a SlidePanel.
 * Dependencies: react
 * Last Modified: 2026-02-26
 *
 * Props:
 * - employee: selected employee object
 * - sites: all sites for site name resolution
 */
import React, { useMemo } from "react";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const EmployeeDetailPanel = ({ employee, sites = [] }) => {
  const siteName = useMemo(() => {
    if (!employee?.siteId) return "Unassigned";
    const match = (sites || []).find(
      (site) => String(site.id) === String(employee.siteId)
    );
    return match?.name || "Unassigned";
  }, [employee?.siteId, sites]);

  const assignedVehicles = useMemo(() => {
    const ids = Array.isArray(employee?.vehicles) ? employee.vehicles : [];
    if (!ids.length) return [];

    return ids.map((item) => {
      const vehicleId = typeof item === "object" && item !== null
        ? item.vehicleId || item.id
        : item;

      const labelFromObject =
        typeof item === "object" && item !== null
          ? item.hyoungNo || item.numberPlate || item.vehicleName || item.name
          : null;

      return {
        id: vehicleId,
        label: labelFromObject || `Vehicle #${vehicleId}`,
      };
    });
  }, [employee?.vehicles]);

  if (!employee) {
    return (
      <div className="employee-panel employee-panel--detail">
        <div className="employee-panel__empty">
          <p>Select an employee to view details</p>
        </div>
      </div>
    );
  }

  const statusTone =
    String(employee.employeestatus || "").toLowerCase() === "active"
      ? "success"
      : "warning";

  return (
    <div className="employee-panel employee-panel--detail">
      <div
        className="m365-flat-section m365-flat-section--no-border"
        style={{ marginTop: 0, paddingTop: 0 }}
      >
        <div className="m365-flat-section__title-row">
          <h3 className="m365-flat-section__title">Employee Information</h3>
          <span className={`m365-health-pill m365-health-pill--${statusTone}`}>
            {employee.employeestatus || "Unknown"}
          </span>
        </div>

        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Full Name</span>
            <span className="m365-info-cell__value">{employee.fullName || "-"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Work Number</span>
            <span className="m365-info-cell__value">{employee.employeeWorkNo || "-"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Phone Number</span>
            <span className="m365-info-cell__value">{employee.employeephoneNumber || "-"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Site</span>
            <span className="m365-info-cell__value">{siteName}</span>
          </div>
        </div>
      </div>

      <div className="m365-flat-section m365-flat-section--no-border">
        <h3 className="m365-flat-section__title">Assigned Vehicles</h3>
        {assignedVehicles.length > 0 ? (
          <div className="employee-vehicle-tags">
            {assignedVehicles.map((vehicle) => (
              <span key={vehicle.id} className="employee-vehicle-tag">
                {vehicle.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="employee-panel__muted">No default vehicles assigned.</p>
        )}
      </div>

      <div className="m365-flat-section m365-flat-section--no-border">
        <h3 className="m365-flat-section__title">Audit</h3>
        <div className="m365-info-grid">
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Created On</span>
            <span className="m365-info-cell__value">{formatDateTime(employee.dateCreated)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Updated On</span>
            <span className="m365-info-cell__value">{formatDateTime(employee.dateModified)}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Created By</span>
            <span className="m365-info-cell__value">{employee.createdBy || "-"}</span>
          </div>
          <div className="m365-info-cell">
            <span className="m365-info-cell__label">Updated By</span>
            <span className="m365-info-cell__value">{employee.modifiedBy || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPanel;
