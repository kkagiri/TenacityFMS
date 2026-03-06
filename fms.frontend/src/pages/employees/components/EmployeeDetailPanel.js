/**
 * File: EmployeeDetailPanel.js
 * Purpose: Read-only employee detail content shown inside a SlidePanel.
 *          Follows M365 Detail Panel standard (SKILL.md §13).
 * Dependencies: react, react-router-dom
 * Last Modified: 2026-03-02
 *
 * Props:
 * - employee: selected employee object
 * - sites: all sites for site name resolution
 * - onEdit: callback to open edit form
 * - onDelete: callback to delete employee
 */
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeDetailsRoute } from "../utils/navigationHelper";

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const EmployeeDetailPanel = ({ employee, sites = [], onEdit, onDelete }) => {
  const navigate = useNavigate();
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

      const plate = typeof item === "object" && item !== null ? item.numberPlate : null;
      const hyoung = typeof item === "object" && item !== null ? item.hyoungNo : null;

      return {
        id: vehicleId,
        label: labelFromObject || `Vehicle #${vehicleId}`,
        plate,
        hyoung,
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

  const isActive = String(employee.employeestatus || "").toLowerCase() === "active";
  const statusTone = isActive ? "success" : "warning";

  return (
    <div className="employee-panel employee-panel--detail">

      {/* ── Header ── */}
      <div className="m365-detail-header">
        <div className="m365-detail-header__icon-circle"
          style={{ background: '#deecf9', color: '#0078d4' }}>
          <i className="fa-light fa-user-hard-hat" />
        </div>
        <div className="m365-detail-header__title-block">
          <span className="m365-detail-header__eyebrow">Employee overview</span>
          <div className="m365-detail-header__meta">
            <span className={`m365-badge m365-badge--${statusTone}`}>
              {employee.employeestatus || "Unknown"}
            </span>
            <span>{siteName}</span>
            {employee.employeeWorkNo && <span>Work No: {employee.employeeWorkNo}</span>}
          </div>
          <p className="m365-detail-header__description">
            Review employment details, assigned vehicles, and audit information from a single workspace.
          </p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="emp-panel-actions">
        {onEdit && (
          <button className="m365-action-link" onClick={onEdit}>
            <i className="fa-light fa-pen-to-square" /> Edit
          </button>
        )}
        {onDelete && (
          <button className="m365-action-link m365-action-link--danger" onClick={onDelete}>
            <i className="fa-light fa-trash-can" /> Delete
          </button>
        )}
        <button
          className="m365-action-link"
          style={{ marginLeft: 'auto' }}
          onClick={() => navigate(getEmployeeDetailsRoute(employee.id))}
        >
          <i className="fa-light fa-arrow-up-right-from-square" /> Full Page
        </button>
      </div>

      {/* ── Summary Tiles ── */}
      <div className="emp-detail-tiles">
        <div className="emp-detail-tile">
          <div className="emp-detail-tile__bar emp-detail-tile__bar--blue" />
          <i className="fa-light fa-phone emp-detail-tile__icon" style={{ color: '#0078d4' }} />
          <div className="emp-detail-tile__body">
            <span className="emp-detail-tile__val">{employee.employeephoneNumber || "—"}</span>
            <span className="emp-detail-tile__lbl">Phone</span>
          </div>
        </div>
        <div className="emp-detail-tile">
          <div className="emp-detail-tile__bar emp-detail-tile__bar--orange" />
          <i className="fa-light fa-id-badge emp-detail-tile__icon" style={{ color: '#ca5010' }} />
          <div className="emp-detail-tile__body">
            <span className="emp-detail-tile__val">{employee.employeeWorkNo || "—"}</span>
            <span className="emp-detail-tile__lbl">Work No</span>
          </div>
        </div>
        <div className="emp-detail-tile">
          <div className={`emp-detail-tile__bar emp-detail-tile__bar--${isActive ? 'green' : 'gray'}`} />
          <i className={`fa-light ${isActive ? 'fa-circle-check' : 'fa-circle-xmark'} emp-detail-tile__icon`}
            style={{ color: isActive ? '#107c10' : '#a19f9d' }} />
          <div className="emp-detail-tile__body">
            <span className={`emp-detail-tile__val m365-badge m365-badge--${statusTone}`} style={{ display: 'inline-flex', width: 'fit-content' }}>
              {employee.employeestatus || "Unknown"}
            </span>
            <span className="emp-detail-tile__lbl">Status</span>
          </div>
        </div>
        <div className="emp-detail-tile">
          <div className="emp-detail-tile__bar emp-detail-tile__bar--teal" />
          <i className="fa-light fa-truck emp-detail-tile__icon" style={{ color: '#008272' }} />
          <div className="emp-detail-tile__body">
            <span className="emp-detail-tile__val">{assignedVehicles.length}</span>
            <span className="emp-detail-tile__lbl">Vehicles</span>
          </div>
        </div>
      </div>

      {/* ── Employee Information ── */}
      <div className="emp-panel-section">
        <h3 className="emp-panel-section__title">
          <i className="fa-light fa-id-card" /> Employee Information
        </h3>
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

      {/* ── Assigned Vehicles ── */}
      <div className="emp-panel-section">
        <div className="emp-panel-section__title-row">
          <h3 className="emp-panel-section__title">
            <i className="fa-light fa-truck" /> Assigned Vehicles
          </h3>
          {assignedVehicles.length > 0 && (
            <span className="m365-badge m365-badge--primary">{assignedVehicles.length}</span>
          )}
        </div>
        {assignedVehicles.length > 0 ? (
          <div className="emp-vehicle-cards">
            {assignedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="emp-vehicle-card">
                <div className="emp-vehicle-card__icon">
                  <i className="fa-light fa-truck" />
                </div>
                <div className="emp-vehicle-card__info">
                  <span className="emp-vehicle-card__name">{vehicle.label}</span>
                  {(vehicle.hyoung || vehicle.plate) && (
                    <span className="emp-vehicle-card__sub">
                      {[vehicle.hyoung, vehicle.plate].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="employee-panel__muted">No default vehicles assigned.</p>
        )}
      </div>

      {/* ── Audit ── */}
      <div className="emp-panel-section">
        <h3 className="emp-panel-section__title">
          <i className="fa-light fa-clock-rotate-left" /> Audit
        </h3>
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
