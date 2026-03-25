/**
 * File: VehicleDocumentsFilterBar.jsx
 * Purpose: Compact M365 filter bar for document compliance records.
 * Dependencies: React.
 * Last Modified: 2026-03-25
 */

import React from "react";
import { COMPLIANCE_CATEGORY_OPTIONS, STATUS_FILTER_OPTIONS } from "../VehicleDocuments.shared";

const VehicleDocumentsFilterBar = ({
  fixedVehicleId,
  vehicles,
  siteOptions,
  vehicleTypeOptions,
  selectedVehicleId,
  selectedSiteId,
  selectedVehicleTypeId,
  selectedComplianceCategory,
  selectedStatus,
  onVehicleChange,
  onSiteChange,
  onVehicleTypeChange,
  onComplianceCategoryChange,
  onStatusChange,
}) => (
  <div className="vehicle-documents-page__toolbar">
    {!fixedVehicleId ? (
      <label className="vehicle-documents-page__field">
        <span>Vehicle</span>
        <select className="vehicle-documents-page__select" value={selectedVehicleId} onChange={(event) => onVehicleChange(event.target.value)}>
          <option value="all">All vehicles</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.label}</option>
          ))}
        </select>
      </label>
    ) : null}

    <label className="vehicle-documents-page__field">
      <span>Site</span>
      <select className="vehicle-documents-page__select" value={selectedSiteId} onChange={(event) => onSiteChange(event.target.value)} disabled={fixedVehicleId !== null}>
        <option value="all">All sites</option>
        {siteOptions.map((site) => (
          <option key={site.siteId} value={site.siteId}>{site.label}</option>
        ))}
      </select>
    </label>

    <label className="vehicle-documents-page__field">
      <span>Vehicle type</span>
      <select className="vehicle-documents-page__select" value={selectedVehicleTypeId} onChange={(event) => onVehicleTypeChange(event.target.value)} disabled={fixedVehicleId !== null}>
        <option value="all">All vehicle types</option>
        {vehicleTypeOptions.map((vehicleType) => (
          <option key={vehicleType.vehicleTypeId} value={vehicleType.vehicleTypeId}>{vehicleType.label}</option>
        ))}
      </select>
    </label>

    <label className="vehicle-documents-page__field">
      <span>Compliance category</span>
      <select className="vehicle-documents-page__select" value={selectedComplianceCategory} onChange={(event) => onComplianceCategoryChange(event.target.value)}>
        <option value="all">All categories</option>
        {COMPLIANCE_CATEGORY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>

    <label className="vehicle-documents-page__field">
      <span>Status</span>
      <select className="vehicle-documents-page__select" value={selectedStatus} onChange={(event) => onStatusChange(event.target.value)}>
        {STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  </div>
);

export default VehicleDocumentsFilterBar;
