/**
 * File: VehicleConsumptionFilterBar.js
 * Purpose: Renders the shared filter bar for vehicle consumption pages using native M365-style controls.
 * Dependencies: React
 * Last Modified: 2026-04-20
 */
import React from "react";

const VehicleConsumptionFilterBar = ({
    filters,
    onChange,
    onApply,
    onReset,
    sites,
    vehicles,
    vehicleTypes,
    loading,
    actions,
}) => {
    const handleChange = (event) => {
        const { name, value } = event.target;
        onChange(name, value);
    };

    return (
        <section className="vehicle-consumption-module__panel">
            <div className="vehicle-consumption-module__grid-title">
                <div>
                    <h3>Filters</h3>
                    <p>Scope the module by date, site, vehicle, vehicle type, and operating mode.</p>
                </div>
            </div>

            <div className="vehicle-consumption-module__filter-grid">
                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-start-date">Start date</label>
                    <input
                        id="consumption-start-date"
                        className="m365-date"
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-end-date">End date</label>
                    <input
                        id="consumption-end-date"
                        className="m365-date"
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleChange}
                    />
                </div>

                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-site">Site</label>
                    <select id="consumption-site" className="m365-select" name="siteId" value={filters.siteId} onChange={handleChange}>
                        <option value="">All sites</option>
                        {sites.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                    </select>
                </div>

                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-vehicle-type">Vehicle type</label>
                    <select
                        id="consumption-vehicle-type"
                        className="m365-select"
                        name="vehicleTypeId"
                        value={filters.vehicleTypeId}
                        onChange={handleChange}
                    >
                        <option value="">All types</option>
                        {vehicleTypes.map((vehicleType) => (
                            <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                        ))}
                    </select>
                </div>

                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-vehicle">Vehicle</label>
                    <select id="consumption-vehicle" className="m365-select" name="vehicleId" value={filters.vehicleId} onChange={handleChange}>
                        <option value="">All vehicles</option>
                        {vehicles.map((vehicle) => (
                            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                                {(vehicle.hyoungNo || vehicle.numberPlate || `Vehicle ${vehicle.vehicleId}`).trim()}
                                {vehicle.numberPlate ? ` • ${vehicle.numberPlate}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="vehicle-consumption-module__field">
                    <label htmlFor="consumption-mode">Consumption mode</label>
                    <select id="consumption-mode" className="m365-select" name="averageKmL" value={filters.averageKmL} onChange={handleChange}>
                        <option value="">All modes</option>
                        <option value="true">km/L vehicles</option>
                        <option value="false">L/hr equipment</option>
                    </select>
                </div>
            </div>

            <div className="vehicle-consumption-module__filter-actions">
                {actions}
                <button type="button" className="m365-btn m365-btn--ghost" onClick={onReset} disabled={loading}>
                    <i className="fa-light fa-rotate-left" />
                    Reset
                </button>
                <button type="button" className="m365-btn m365-btn--primary" onClick={onApply} disabled={loading}>
                    <i className="fa-light fa-filter" />
                    Apply filters
                </button>
            </div>
        </section>
    );
};

export default VehicleConsumptionFilterBar;