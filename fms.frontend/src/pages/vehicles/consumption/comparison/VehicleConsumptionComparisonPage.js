/**
 * File: VehicleConsumptionComparisonPage.js
 * Purpose: Compares vehicle consumption performance by vehicle, site, or vehicle type using vehicleconsumption source rows.
 * Dependencies: React, DevExtreme DataGrid, usePermissions, local consumption service/components
 * Last Modified: 2026-04-20
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataGrid, { Column, FilterRow, HeaderFilter, Pager, Paging, SearchPanel } from "devextreme-react/data-grid";
import { usePermissions } from "../../../../hooks/usePermissions";
import VehicleConsumptionFilterBar from "../components/VehicleConsumptionFilterBar";
import VehicleConsumptionEmptyState from "../components/VehicleConsumptionEmptyState";
import {
  formatDisplayDate,
  formatNumber,
  getDefaultConsumptionFilters,
  getVehicleConsumptionComparisonData,
  getVehicleConsumptionFilterOptions,
} from "../vehicleConsumptionService";
import "../VehicleConsumptionModule.scss";

const sumField = (items, field) => items.reduce((sum, item) => sum + Number(item?.[field] || 0), 0);

const GROUP_OPTIONS = [
  { value: "vehicle", label: "Compare vehicles" },
  { value: "site", label: "Compare sites" },
  { value: "vehicleType", label: "Compare vehicle types" },
];

const VehicleConsumptionComparisonPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canReadConsumption = hasPermission("_Read_VehicleConsumptionReport");

  const [filters, setFilters] = useState(getDefaultConsumptionFilters);
  const [sites, setSites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [groupBy, setGroupBy] = useState("vehicle");
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
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load filter options.");
    }
  }, []);

  const loadComparisonData = useCallback(async () => {
    if (!canReadConsumption) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getVehicleConsumptionComparisonData(filters);
      setRecords(result.records);
    } catch (requestError) {
      setRecords([]);
      setError(requestError?.response?.data?.message || requestError.message || "Failed to load comparison data.");
    } finally {
      setLoading(false);
    }
  }, [canReadConsumption, filters]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((current) => {
      const next = { ...current, [name]: value };
      if (name === "siteId" || name === "vehicleTypeId") {
        next.vehicleId = "";
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setFilters(getDefaultConsumptionFilters());
  }, []);

  const comparisonRows = useMemo(() => {
    const keyed = new Map();

    records.forEach((record) => {
      const key =
        groupBy === "site"
          ? `site-${record.siteId}`
          : groupBy === "vehicleType"
            ? `type-${record.vehicleTypeId}`
            : `vehicle-${record.vehicleId}`;

      const label =
        groupBy === "site"
          ? record.siteName || "Unknown Site"
          : groupBy === "vehicleType"
            ? record.vehicleTypeName || "Unknown Type"
            : record.hyoungNo || record.numberPlate || `Vehicle ${record.vehicleId}`;

      const secondaryLabel =
        groupBy === "site"
          ? `${record.vehicleTypeName || "Unknown Type"}`
          : groupBy === "vehicleType"
            ? `${record.siteName || "Unknown Site"}`
            : `${record.siteName || "Unknown Site"} • ${record.numberPlate || "No plate"}`;

      const current = keyed.get(key) || {
        groupKey: key,
        groupBy,
        label,
        secondaryLabel,
        unitLabel: record.unitLabel,
        recordCount: 0,
        uniqueVehicleIds: new Set(),
        uniqueSiteIds: new Set(),
        totalFuel: 0,
        totalFuelLost: 0,
        totalDistance: 0,
        totalEngineHours: 0,
        totalActualEfficiency: 0,
        totalExpectedAverage: 0,
        totalAvgSpeed: 0,
        maxSpeed: 0,
        latestDate: record.date,
      };

      current.recordCount += 1;
      current.uniqueVehicleIds.add(record.vehicleId);
      current.uniqueSiteIds.add(record.siteId);
      current.totalFuel += Number(record.totalFuel || 0);
      current.totalFuelLost += Number(record.fuelLost || 0);
      current.totalDistance += Number(record.totalDistance || 0);
      current.totalEngineHours += Number(record.engineHours || 0);
      current.totalActualEfficiency += Number(record.actualEfficiency || 0);
      current.totalExpectedAverage += Number(record.expectedAverage || 0);
      current.totalAvgSpeed += Number(record.avgSpeed || 0);
      current.maxSpeed = Math.max(current.maxSpeed, Number(record.maxSpeed || 0));

      if (record.date && (!current.latestDate || new Date(record.date) > new Date(current.latestDate))) {
        current.latestDate = record.date;
      }

      keyed.set(key, current);
    });

    return Array.from(keyed.values())
      .map((row) => ({
        groupKey: row.groupKey,
        label: row.label,
        secondaryLabel: row.secondaryLabel,
        recordCount: row.recordCount,
        vehicleCount: row.uniqueVehicleIds.size,
        siteCount: row.uniqueSiteIds.size,
        totalFuel: row.totalFuel,
        totalFuelLost: row.totalFuelLost,
        totalDistance: row.totalDistance,
        totalEngineHours: row.totalEngineHours,
        actualEfficiency: row.recordCount > 0 ? row.totalActualEfficiency / row.recordCount : 0,
        expectedAverage: row.recordCount > 0 ? row.totalExpectedAverage / row.recordCount : 0,
        efficiencyDelta: row.recordCount > 0 ? (row.totalActualEfficiency - row.totalExpectedAverage) / row.recordCount : 0,
        avgSpeed: row.recordCount > 0 ? row.totalAvgSpeed / row.recordCount : 0,
        maxSpeed: row.maxSpeed,
        latestDate: row.latestDate,
        unitLabel: row.unitLabel,
      }))
      .sort((left, right) => right.totalFuel - left.totalFuel);
  }, [groupBy, records]);

  const topFuelGroup = comparisonRows[0] || null;
  const highestLossGroup = [...comparisonRows].sort((left, right) => right.totalFuelLost - left.totalFuelLost)[0] || null;

  const stats = useMemo(() => {
    return {
      groupsCompared: comparisonRows.length,
      totalFuel: sumField(comparisonRows, "totalFuel"),
      totalFuelLost: sumField(comparisonRows, "totalFuelLost"),
      totalRecords: sumField(comparisonRows, "recordCount"),
    };
  }, [comparisonRows]);

  if (!canReadConsumption) {
    return (
      <div className="vehicle-consumption-module">
        <div className="m365-info-banner m365-info-banner--warning">
          <i className="fa-light fa-lock m365-info-banner__icon" />
          <span className="m365-info-banner__text">You do not have permission to compare vehicle consumption data.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-consumption-module">
      <section className="vehicle-consumption-module__panel">
        <div className="m365-page-header">
          <div className="m365-page-header__left vehicle-consumption-module__header-copy">
            <div className="vehicle-consumption-module__eyebrow">Comparison workspace</div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-scale-balanced m365-page-header__icon" />
              <h2 className="m365-page-header__title">Consumption Comparison</h2>
            </div>
            <p className="vehicle-consumption-module__subtitle">
              Compare vehicles, sites, or vehicle types using only rows sourced from the vehicle consumption table.
            </p>
          </div>
          <div className="vehicle-consumption-module__header-actions">
            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/vehicles/consumption")}>
              <i className="fa-light fa-arrow-left" />
              Back to module
            </button>
            <button type="button" className="m365-btn m365-btn--ghost" onClick={loadComparisonData} disabled={loading}>
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

      <VehicleConsumptionFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onApply={loadComparisonData}
        onReset={handleReset}
        sites={sites}
        vehicles={filteredVehicles}
        vehicleTypes={vehicleTypes}
        loading={loading}
        actions={
          <div className="vehicle-consumption-module__field">
            <label htmlFor="consumption-group-by">Compare by</label>
            <select
              id="consumption-group-by"
              className="m365-select"
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value)}
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        }
      />

      <section className="vehicle-consumption-module__compare-stats">
        <article className="vehicle-consumption-module__stat-block">
          <span>Total Fuel</span>
          <strong>{formatNumber(stats.totalFuel)} L</strong>
          <small>Across all compared groups</small>
        </article>
        <article className="vehicle-consumption-module__stat-block">
          <span>Total Fuel Lost</span>
          <strong>{formatNumber(stats.totalFuelLost)} L</strong>
          <small>Loss reported in source rows</small>
        </article>
        <article className="vehicle-consumption-module__stat-block">
          <span>Source Records</span>
          <strong>{stats.totalRecords}</strong>
          <small>Vehicle consumption rows in scope</small>
        </article>
        <article className="vehicle-consumption-module__stat-block">
          <span>Compared Groups</span>
          <strong>{stats.groupsCompared}</strong>
          <small>{GROUP_OPTIONS.find((option) => option.value === groupBy)?.label || "Comparison view"}</small>
        </article>
      </section>

      {comparisonRows.length > 0 ? (
        <>
          <section className="vehicle-consumption-module__comparison-grid">
            <article className="vehicle-consumption-module__compare-card">
              <div className="vehicle-consumption-module__comparison-title">
                <div>
                  <h3>Highest Fuel Use</h3>
                  <p>Largest grouped fuel total in the current comparison scope.</p>
                </div>
              </div>
              {topFuelGroup ? (
                <div className="vehicle-consumption-module__detail-grid">
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Group</span><span className="vehicle-consumption-module__info-value">{topFuelGroup.label}</span><span className="vehicle-consumption-module__info-note">{topFuelGroup.secondaryLabel}</span></div>
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Total Fuel</span><span className="vehicle-consumption-module__info-value">{formatNumber(topFuelGroup.totalFuel)} L</span><span className="vehicle-consumption-module__info-note">{topFuelGroup.recordCount} source rows</span></div>
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Average Efficiency</span><span className="vehicle-consumption-module__info-value">{formatNumber(topFuelGroup.actualEfficiency)} {topFuelGroup.unitLabel}</span><span className="vehicle-consumption-module__info-note">Expected {formatNumber(topFuelGroup.expectedAverage)} {topFuelGroup.unitLabel}</span></div>
                </div>
              ) : null}
            </article>

            <article className="vehicle-consumption-module__compare-card">
              <div className="vehicle-consumption-module__comparison-title">
                <div>
                  <h3>Highest Fuel Loss</h3>
                  <p>Group with the largest fuel loss reported by vehicle consumption rows.</p>
                </div>
              </div>
              {highestLossGroup ? (
                <div className="vehicle-consumption-module__detail-grid">
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Group</span><span className="vehicle-consumption-module__info-value">{highestLossGroup.label}</span><span className="vehicle-consumption-module__info-note">{highestLossGroup.secondaryLabel}</span></div>
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Fuel Lost</span><span className="vehicle-consumption-module__info-value vehicle-consumption-module__accent-danger">{formatNumber(highestLossGroup.totalFuelLost)} L</span><span className="vehicle-consumption-module__info-note">Total fuel {formatNumber(highestLossGroup.totalFuel)} L</span></div>
                  <div className="vehicle-consumption-module__info-cell"><span className="vehicle-consumption-module__info-label">Latest Record</span><span className="vehicle-consumption-module__info-value">{formatDisplayDate(highestLossGroup.latestDate)}</span><span className="vehicle-consumption-module__info-note">{highestLossGroup.recordCount} source rows</span></div>
                </div>
              ) : null}
            </article>
          </section>

          <section className="vehicle-consumption-module__panel">
            <div className="vehicle-consumption-module__comparison-title">
              <div>
                <h3>Comparison Grid</h3>
                <p>Grouped comparison built directly from `/Consumption/records` and the `vehicleconsumption` table.</p>
              </div>
            </div>
            <DataGrid dataSource={comparisonRows} keyExpr="groupKey" showBorders={true} rowAlternationEnabled={true} hoverStateEnabled={true} columnAutoWidth={true}>
              <SearchPanel visible={true} width={260} placeholder="Search comparison rows" />
              <FilterRow visible={true} />
              <HeaderFilter visible={true} />
              <Paging defaultPageSize={20} />
              <Pager visible={true} showNavigationButtons={true} showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} showInfo={true} />
              <Column dataField="label" caption={groupBy === "site" ? "Site" : groupBy === "vehicleType" ? "Vehicle Type" : "Vehicle"} minWidth={160} />
              <Column dataField="secondaryLabel" caption="Context" minWidth={180} />
              <Column dataField="recordCount" caption="Rows" minWidth={80} alignment="right" />
              <Column dataField="vehicleCount" caption="Vehicles" minWidth={90} alignment="right" />
              <Column dataField="siteCount" caption="Sites" minWidth={80} alignment="right" />
              <Column dataField="expectedAverage" caption="Expected Avg" cellRender={({ data }) => `${formatNumber(data.expectedAverage)} ${data.unitLabel}`} />
              <Column dataField="actualEfficiency" caption="Actual Avg" cellRender={({ data }) => `${formatNumber(data.actualEfficiency)} ${data.unitLabel}`} />
              <Column dataField="efficiencyDelta" caption="Actual - Expected" cellRender={({ data }) => `${formatNumber(data.efficiencyDelta)} ${data.unitLabel}`} />
              <Column dataField="totalFuel" caption="Fuel" cellRender={({ value }) => `${formatNumber(value)} L`} />
              <Column dataField="totalFuelLost" caption="Fuel Lost" cellRender={({ value }) => `${formatNumber(value)} L`} />
              <Column dataField="totalDistance" caption="Distance" cellRender={({ value }) => `${formatNumber(value)} km`} />
              <Column dataField="totalEngineHours" caption="Engine Hrs" cellRender={({ value }) => `${formatNumber(value)} hr`} />
              <Column dataField="avgSpeed" caption="Avg Speed" cellRender={({ value }) => `${formatNumber(value)} km/h`} />
              <Column dataField="maxSpeed" caption="Max Speed" cellRender={({ value }) => `${formatNumber(value)} km/h`} />
              <Column dataField="latestDate" caption="Latest Record" calculateDisplayValue={(row) => formatDisplayDate(row.latestDate)} />
            </DataGrid>
          </section>
        </>
      ) : (
        <VehicleConsumptionEmptyState
          title="No comparison data for the current scope"
          description="Apply a date range and operating scope so the grouped comparison can be built from vehicle consumption source rows."
          icon="fa-light fa-scale-unbalanced-flip"
        />
      )}
    </div>
  );
};

export default VehicleConsumptionComparisonPage;
