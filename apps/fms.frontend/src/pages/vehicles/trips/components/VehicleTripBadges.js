/**
 * File: VehicleTripBadges.js
 * Purpose: Minimal compatibility badges for trip panels.
 * Dependencies: React
 * Last Modified: 2026-04-29
 */
import React from "react";

export const VehicleTripBadgeCluster = ({ status, reconciliationStatus, compact = false }) => (
    <div className={`vehicle-trip-badge-cluster${compact ? " vehicle-trip-badge-cluster--compact" : ""}`}>
        <span>{status || "Trip"}</span>
        {reconciliationStatus ? <span>{reconciliationStatus}</span> : null}
    </div>
);