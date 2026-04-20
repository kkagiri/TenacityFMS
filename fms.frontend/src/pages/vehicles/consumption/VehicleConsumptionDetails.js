/**
 * File: VehicleConsumptionDetails.js
 * Purpose: Displays raw vehicle consumption row detail with source-driver, mode, and reporting metadata.
 * Dependencies: React, react-router-dom, usePermissions, local consumption service
 * Last Modified: 2026-04-20
 */
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import VehicleConsumptionEmptyState from "./components/VehicleConsumptionEmptyState";
import {
  formatDisplayDate,
  formatNumber,
  getModeLabel,
  getVehicleConsumptionRecordDetail,
} from "./vehicleConsumptionService";
import "./VehicleConsumptionModule.scss";

const VehicleConsumptionDetails = () => {
  const { consumptionId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canReadConsumption = hasPermission("_Read_VehicleConsumptionReport");

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!consumptionId || !canReadConsumption) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getVehicleConsumptionRecordDetail(consumptionId);
      setDetail(result);
    } catch (requestError) {
      setDetail(null);
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load the consumption record.");
    } finally {
      setLoading(false);
    }
  }, [canReadConsumption, consumptionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!canReadConsumption) {
    return (
      <div className="vehicle-consumption-module">
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-lock m365-info-banner__icon" />
          <span className="m365-info-banner__text">You do not have permission to view vehicle consumption detail.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-consumption-module">
      <section className="vehicle-consumption-module__panel">
        <div className="m365-page-header">
          <div className="m365-page-header__left vehicle-consumption-module__header-copy">
            <div className="vehicle-consumption-module__eyebrow">Record detail</div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-file-magnifying-glass m365-page-header__icon" />
              <h2 className="m365-page-header__title">Consumption Record Detail</h2>
            </div>
            <p className="vehicle-consumption-module__subtitle">
              Raw row values from the vehicle consumption source, preserved without reinterpreting calendar dates or units.
            </p>
          </div>
          <div className="vehicle-consumption-module__header-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/vehicles/consumption")}>
              <i className="fa-light fa-arrow-left" />
              Back to module
            </button>
            <button type="button" className="m365-btn m365-btn--ghost" onClick={loadDetail} disabled={loading}>
              <i className={`fa-light fa-arrows-rotate${loading ? " tw-animate-spin" : ""}`} />
              Refresh
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

      {detail ? (
        <>
          <section className="vehicle-consumption-module__summary-grid">
            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Actual Efficiency</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-gauge-high" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">
                {formatNumber(detail.actualEfficiency)}
                <span className="vehicle-consumption-module__summary-unit">{getModeLabel(detail.isKmPerLiter)}</span>
              </div>
              <div className="vehicle-consumption-module__summary-meta">Expected {formatNumber(detail.expectedAverage)} {getModeLabel(detail.isKmPerLiter)}</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Total Fuel</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-gas-pump" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatNumber(detail.totalFuel)}<span className="vehicle-consumption-module__summary-unit">L</span></div>
              <div className="vehicle-consumption-module__summary-meta">Fuel lost {formatNumber(detail.fuelLost)} L</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Distance</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-route" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatNumber(detail.totalDistance)}<span className="vehicle-consumption-module__summary-unit">km</span></div>
              <div className="vehicle-consumption-module__summary-meta">Engine hours {formatNumber(detail.engineHours)} hr</div>
            </article>

            <article className="vehicle-consumption-module__summary-card">
              <div className="vehicle-consumption-module__summary-top">
                <span className="vehicle-consumption-module__summary-label">Record Date</span>
                <span className="vehicle-consumption-module__summary-icon"><i className="fa-light fa-calendar-day" /></span>
              </div>
              <div className="vehicle-consumption-module__summary-value">{formatDisplayDate(detail.date)}</div>
              <div className="vehicle-consumption-module__summary-meta">Mode {getModeLabel(detail.isKmPerLiter)}</div>
            </article>
          </section>

          <section className="m365-section-group vehicle-consumption-module__panel">
            <div className="m365-section-group__header">
              <i className="fa-light fa-truck-front m365-section-group__icon" />
              <h3 className="m365-section-group__title">Vehicle Context</h3>
            </div>
            <div className="m365-section-group__body vehicle-consumption-module__detail-grid">
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Vehicle</span><span className="vehicle-consumption-module__info-value">{detail.hyoungNo || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Plate</span><span className="vehicle-consumption-module__info-value">{detail.numberPlate || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Type</span><span className="vehicle-consumption-module__info-value">{detail.vehicleTypeName || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Model</span><span className="vehicle-consumption-module__info-value">{detail.vehicleModelName || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Manufacturer</span><span className="vehicle-consumption-module__info-value">{detail.manufacturerName || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Site</span><span className="vehicle-consumption-module__info-value">{detail.siteName || "-"}</span></div>
            </div>
          </section>

          <section className="m365-section-group vehicle-consumption-module__panel">
            <div className="m365-section-group__header">
              <i className="fa-light fa-user-helmet-safety m365-section-group__icon" />
              <h3 className="m365-section-group__title">Driver And Source</h3>
            </div>
            <div className="m365-section-group__body vehicle-consumption-module__detail-grid">
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Source Driver</span><span className="vehicle-consumption-module__info-value">{detail.sourceDriverName || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Assigned Vehicle Employee</span><span className="vehicle-consumption-module__info-value">{detail.assignedEmployeeName || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Report Reference</span><span className="vehicle-consumption-module__info-value">{detail.reportReference || "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Modified</span><span className="vehicle-consumption-module__info-value">{detail.isModified ? "Yes" : "No"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Modified Date</span><span className="vehicle-consumption-module__info-value">{detail.modifiedDate ? formatDisplayDate(detail.modifiedDate) : "-"}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Comments</span><span className="vehicle-consumption-module__info-note">{detail.comments || "-"}</span></div>
            </div>
          </section>

          <section className="m365-section-group vehicle-consumption-module__panel">
            <div className="m365-section-group__header">
              <i className="fa-light fa-chart-column m365-section-group__icon" />
              <h3 className="m365-section-group__title">Operational Metrics</h3>
            </div>
            <div className="m365-section-group__body vehicle-consumption-module__detail-grid">
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Expected Average</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.expectedAverage)} {getModeLabel(detail.isKmPerLiter)}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Actual Efficiency</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.actualEfficiency)} {getModeLabel(detail.isKmPerLiter)}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Total Fuel</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.totalFuel)} L</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Fuel Lost</span><span className="vehicle-consumption-module__info-value vehicle-consumption-module__accent-danger">{formatNumber(detail.fuelLost)} L</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Distance</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.totalDistance)} km</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Engine Hours</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.engineHours)} hr</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Average Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.avgSpeed)} km/h</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Max Speed</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.maxSpeed)} km/h</span></div>
            </div>
          </section>

          <section className="m365-section-group vehicle-consumption-module__panel">
            <div className="m365-section-group__header">
              <i className="fa-light fa-waveform-lines m365-section-group__icon" />
              <h3 className="m365-section-group__title">Flow Meter Values</h3>
            </div>
            <div className="m365-section-group__body vehicle-consumption-module__detail-grid">
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Fuel Used</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterFuelUsed)} L</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Fuel Lost</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterFuelLost)} L</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Efficiency</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterEfficiency)} {getModeLabel(detail.isKmPerLiter)}</span></div>
              <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Flow Meter Engine Hours</span><span className="vehicle-consumption-module__info-value">{formatNumber(detail.flowMeterEngineHours)} hr</span></div>
            </div>
          </section>
        </>
      ) : (
        <VehicleConsumptionEmptyState
          title="Consumption detail unavailable"
          description={loading ? "Loading the selected record..." : "The selected record could not be loaded with the current permissions or filters."}
          icon="fa-light fa-file-circle-question"
        />
      )}
    </div>
  );
};

export default VehicleConsumptionDetails;