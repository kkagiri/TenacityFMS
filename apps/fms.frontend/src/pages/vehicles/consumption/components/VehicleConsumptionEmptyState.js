/**
 * File: VehicleConsumptionEmptyState.js
 * Purpose: Renders a consistent empty state for vehicle consumption pages.
 * Dependencies: React
 * Last Modified: 2026-04-20
 */
import React from "react";

const VehicleConsumptionEmptyState = ({ title, description, icon = "fa-light fa-chart-line-down" }) => {
    return (
        <section className="vehicle-consumption-module__panel vehicle-consumption-module__empty">
            <span className="vehicle-consumption-module__empty-icon">
                <i className={icon} />
            </span>
            <div className="vehicle-consumption-module__empty-title">{title}</div>
            <div>{description}</div>
        </section>
    );
};

export default VehicleConsumptionEmptyState;