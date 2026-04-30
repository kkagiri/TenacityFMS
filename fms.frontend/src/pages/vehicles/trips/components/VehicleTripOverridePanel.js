/**
 * File: VehicleTripOverridePanel.js
 * Purpose: Minimal compatibility trip override panel.
 * Dependencies: React
 * Last Modified: 2026-04-29
 */
import React from "react";

const VehicleTripOverridePanel = ({ open, onClose }) => {
    if (!open) return null;
    return (
        <div className="vehicle-trip-override-panel">
            <button type="button" onClick={onClose}>Close</button>
            <div>Trip override is temporarily unavailable.</div>
        </div>
    );
};

export default VehicleTripOverridePanel;