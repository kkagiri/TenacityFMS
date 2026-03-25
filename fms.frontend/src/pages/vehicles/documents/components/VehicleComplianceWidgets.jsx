/**
 * File: VehicleComplianceWidgets.jsx
 * Purpose: Dashboard-style widgets and requirement summaries for compliance reporting.
 * Dependencies: React.
 * Last Modified: 2026-03-25
 */

import React from "react";

const renderRows = (rows) => (
  rows.length > 0 ? rows.slice(0, 6).map((row) => (
    <tr key={row.groupName}>
      <td>{row.groupName}</td>
      <td>{row.completedCount}</td>
      <td>{row.dueCount}</td>
      <td>{row.expiringSoonCount}</td>
      <td>{row.expiredCount}</td>
      <td>{row.missingCount}</td>
    </tr>
  )) : (
    <tr>
      <td colSpan="6" className="vehicle-documents-page__muted">No compliance data available yet.</td>
    </tr>
  )
);

const VehicleComplianceWidgets = ({ dashboard, requirements }) => {
  const activeRequirements = requirements.filter((requirement) => requirement.isActive);

  return (
    <div className="vehicle-compliance-widgets">
      <div className="vehicle-compliance-widgets__hero">
        <div className="vehicle-compliance-widgets__hero-card">
          <span>Applicable requirements</span>
          <strong>{dashboard?.totalApplicableRequirements ?? 0}</strong>
          <small>Assignments expanded across site and vehicle-type scope</small>
        </div>
        <div className="vehicle-compliance-widgets__hero-card">
          <span>Completed</span>
          <strong>{dashboard?.completedCount ?? 0}</strong>
          <small>Latest documents are still valid</small>
        </div>
        <div className="vehicle-compliance-widgets__hero-card vehicle-compliance-widgets__hero-card--warning">
          <span>Due</span>
          <strong>{dashboard?.dueCount ?? 0}</strong>
          <small>Expiring, expired, or missing assignments</small>
        </div>
      </div>

      <div className="vehicle-compliance-widgets__grid">
        <section className="vehicle-compliance-widgets__panel">
          <div className="vehicle-compliance-widgets__panel-header">
            <h3>Due and completed by site</h3>
            <span>{dashboard?.bySite?.length ?? 0} site groups</span>
          </div>
          <table className="vehicle-compliance-widgets__table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Done</th>
                <th>Due</th>
                <th>Due soon</th>
                <th>Expired</th>
                <th>Missing</th>
              </tr>
            </thead>
            <tbody>{renderRows(dashboard?.bySite ?? [])}</tbody>
          </table>
        </section>

        <section className="vehicle-compliance-widgets__panel">
          <div className="vehicle-compliance-widgets__panel-header">
            <h3>Due and completed by vehicle type</h3>
            <span>{dashboard?.byVehicleType?.length ?? 0} type groups</span>
          </div>
          <table className="vehicle-compliance-widgets__table">
            <thead>
              <tr>
                <th>Vehicle Type</th>
                <th>Done</th>
                <th>Due</th>
                <th>Due soon</th>
                <th>Expired</th>
                <th>Missing</th>
              </tr>
            </thead>
            <tbody>{renderRows(dashboard?.byVehicleType ?? [])}</tbody>
          </table>
        </section>

        <section className="vehicle-compliance-widgets__panel">
          <div className="vehicle-compliance-widgets__panel-header">
            <h3>Due and completed by document type</h3>
            <span>{dashboard?.byDocumentType?.length ?? 0} compliance categories</span>
          </div>
          <table className="vehicle-compliance-widgets__table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Done</th>
                <th>Due</th>
                <th>Due soon</th>
                <th>Expired</th>
                <th>Missing</th>
              </tr>
            </thead>
            <tbody>{renderRows(dashboard?.byDocumentType ?? [])}</tbody>
          </table>
        </section>
      </div>

      <section className="vehicle-compliance-widgets__panel">
        <div className="vehicle-compliance-widgets__panel-header">
          <h3>Active requirement assignments</h3>
          <span>{activeRequirements.length} active assignments</span>
        </div>
        <div className="vehicle-compliance-widgets__requirement-list">
          {activeRequirements.length > 0 ? activeRequirements.slice(0, 8).map((requirement) => (
            <article key={requirement.id} className="vehicle-compliance-widgets__requirement-card">
              <strong>{requirement.name}</strong>
              <span>{requirement.complianceCategoryName}</span>
              <small>{requirement.targetTypeName}: {requirement.siteName || requirement.vehicleTypeName || "Unassigned"}</small>
              <small>{requirement.alertLeadDays} day alert window</small>
            </article>
          )) : <p className="vehicle-documents-page__muted">No compliance requirements have been assigned yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default VehicleComplianceWidgets;
