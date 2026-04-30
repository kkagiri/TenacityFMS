/**
 * File: VehicleTripDetailPanel.js
 * Purpose: Minimal compatibility trip detail panel.
 * Dependencies: React
 * Last Modified: 2026-04-29
 */
import React from "react";

const VehicleTripDetailPanel = ({ open, onClose }) => {
    if (!open) return null;
    return (
        <div className="vehicle-trip-detail-panel">
            <button type="button" onClick={onClose}>Close</button>
            <div>Trip detail is temporarily unavailable.</div>
        </div>
    );
};

export default VehicleTripDetailPanel;