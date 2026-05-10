/**
 * File: VehicleConsumptionPage.js
 * Purpose: Renders the vehicle consumption module landing page with shared filters, summary cards, and drill-down grid.
 * Dependencies: React, react-router-dom, usePermissions, local consumption service/components
 * Last Modified: 2026-04-20
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import VehicleConsumptionFilterBar from "./components/VehicleConsumptionFilterBar";
import VehicleConsumptionSummaryCards from "./components/VehicleConsumptionSummaryCards";
import VehicleConsumptionGrid from "./components/VehicleConsumptionGrid";
import VehicleConsumptionEmptyState from "./components/VehicleConsumptionEmptyState";
import {
  getDefaultConsumptionFilters,
  getVehicleConsumptionFilterOptions,
  getVehicleConsumptionModuleData,
} from "./vehicleConsumptionService";
import "./VehicleConsumptionModule.scss";

const VehicleConsumptionPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canReadConsumption = hasPermission("_Read_VehicleConsumptionReport");

  const [filters, setFilters] = useState(getDefaultConsumptionFilters);
  const [analytics, setAnalytics] = useState({});
  const [records, setRecords] = useState([]);
  const [sites, setSites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const siteMatch = !filters.siteId || String(vehicle.siteId) === String(filters.siteId);
      const typeMatch = !filters.vehicleTypeId || String(vehicle.vehicleTypeId) === String(filters.vehicleTypeId);
      const modeMatch =
        !filters.averageKmL ||
        (filters.averageKmL === "true" && vehicle.averageKmL) ||
        (filters.averageKmL === "false" && !vehicle.averageKmL);

      return siteMatch && typeMatch && modeMatch;
    });
  }, [filters.averageKmL, filters.siteId, filters.vehicleTypeId, vehicles]);

  const loadReferenceData = useCallback(async () => {
    try {
      const options = await getVehicleConsumptionFilterOptions();
      setSites(options.sites);
      setVehicles(options.vehicles);
      setVehicleTypes(options.vehicleTypes);
    } catch (requestError) {
      setSites([]);
      setVehicles([]);
      setVehicleTypes([]);
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load filter options.");
    }
  }, []);

  const loadModuleData = useCallback(async () => {
    if (!canReadConsumption) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getVehicleConsumptionModuleData(filters);
      setAnalytics(result.analytics);
      setRecords(result.records);
    } catch (requestError) {
      setAnalytics({});
      setRecords([]);
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load vehicle consumption data.");
    } finally {
      setLoading(false);
    }
  }, [canReadConsumption, filters]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadModuleData();
  }, [loadModuleData]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((current) => {
      const next = { ...current, [name]: value };

      if (name === "siteId") {
        next.vehicleId = "";
      }

      if (name === "vehicleTypeId") {
        next.vehicleId = "";
      }

      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setFilters(getDefaultConsumptionFilters());
  }, []);

  if (!canReadConsumption) {
    return (
      <div className="vehicle-consumption-module">
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-lock m365-info-banner__icon" />
          <span className="m365-info-banner__text">You do not have permission to view vehicle consumption data.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-consumption-module">
      <section className="vehicle-consumption-module__panel">
        <div className="m365-page-header">
          <div className="m365-page-header__left vehicle-consumption-module__header-copy">
            <div className="vehicle-consumption-module__eyebrow">Vehicle operations</div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-gas-pump m365-page-header__icon" />
              <h2 className="m365-page-header__title">Vehicle Consumption Module</h2>
            </div>
            <p className="vehicle-consumption-module__subtitle">
              Review raw consumption rows, highlight loss, and move directly into record detail without leaving the vehicle workspace.
            </p>
          </div>
          <div className="vehicle-consumption-module__header-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={loadModuleData} disabled={loading}>
              <i className={`fa-light fa-arrows-rotate${loading ? " tw-animate-spin" : ""}`} />
              Refresh
            </button>
            <button type="button" className="m365-btn m365-btn--primary" onClick={() => navigate("/vehicles/consumption-comparison")}>
              <i className="fa-light fa-scale-balanced" />
              Comparison
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      ) : null}

      <VehicleConsumptionFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={loadModuleData}
        onReset={handleReset}
        sites={sites}
        vehicles={filteredVehicles}
        vehicleTypes={vehicleTypes}
        loading={loading}
      />

      <VehicleConsumptionSummaryCards analytics={analytics} filters={filters} recordCount={records.length} />

      {records.length > 0 ? (
        <VehicleConsumptionGrid
          records={records}
          loading={loading}
          onRowClick={(row) => navigate(`/vehicles/${row.vehicleId}/consumption/${row.id}/details`)}
        />
      ) : (
        <VehicleConsumptionEmptyState
          title="No consumption rows for the current filter set"
          description="Adjust the date range, site, vehicle, or mode filters, then apply the filter again."
        />
      )}
    </div>
  );
};

export default VehicleConsumptionPage;
