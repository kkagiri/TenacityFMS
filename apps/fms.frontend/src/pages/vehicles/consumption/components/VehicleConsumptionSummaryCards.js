/**
 * File: VehicleConsumptionSummaryCards.js
 * Purpose: Displays summary cards for vehicle consumption module analytics.
 * Dependencies: React, vehicleConsumptionService helpers
 * Last Modified: 2026-04-20
 */
import React from "react";
import { formatNumber, getModeLabel } from "../vehicleConsumptionService";

const VehicleConsumptionSummaryCards = ({ analytics, filters, recordCount }) => {
    const modeLabel =
        filters.averageKmL === "true"
            ? getModeLabel(true)
            : filters.averageKmL === "false"
                ? getModeLabel(false)
                : "Mixed";

    const cards = [
        {
            key: "fuel",
            icon: "fa-light fa-gas-pump",
            label: "Total Fuel",
            value: formatNumber(analytics.totalFuel),
            unit: "L",
            meta: `${formatNumber(analytics.totalFuelLost)} L lost`,
        },
        {
            key: "distance",
            icon: "fa-light fa-route",
            label: "Total Distance",
            value: formatNumber(analytics.totalDistance),
            unit: "km",
            meta: `${analytics.totalVehicles || 0} vehicles`,
        },
        {
            key: "hours",
            icon: "fa-light fa-engine",
            label: "Engine Hours",
            value: formatNumber(analytics.totalEngHours),
            unit: "hr",
            meta: `${recordCount} records`,
        },
        {
            key: "efficiency",
            icon: "fa-light fa-gauge-high",
            label: "Average Efficiency",
            value: formatNumber(analytics.avgConsumption),
            unit: modeLabel,
            meta: `${formatNumber(analytics.avgSpeed)} km/h avg speed`,
        },
        {
            key: "loss",
            icon: "fa-light fa-droplet-slash",
            label: "Fuel Lost",
            value: formatNumber(analytics.totalFuelLost),
            unit: "L",
            meta: analytics.totalFuelLost > 0 ? "Track source variance in record detail" : "No reported losses in period",
        },
        {
            key: "records",
            icon: "fa-light fa-table-list",
            label: "Record Count",
            value: formatNumber(recordCount, 0),
            unit: "rows",
            meta: `${analytics.totalRecords || recordCount} rows in source summary`,
        },
    ];

    return (
        <section className="vehicle-consumption-module__summary-grid">
            {cards.map((card) => (
                <article key={card.key} className="vehicle-consumption-module__summary-card">
                    <div className="vehicle-consumption-module__summary-top">
                        <span className="vehicle-consumption-module__summary-label">{card.label}</span>
                        <span className="vehicle-consumption-module__summary-icon">
                            <i className={card.icon} />
                        </span>
                    </div>
                    <div className="vehicle-consumption-module__summary-value">
                        {card.value}
                        <span className="vehicle-consumption-module__summary-unit">{card.unit}</span>
                    </div>
                    <div className="vehicle-consumption-module__summary-meta">{card.meta}</div>
                </article>
            ))}
        </section>
    );
};

export default VehicleConsumptionSummaryCards;