/**
 * File: VehicleTripPlanningTab.js
 * Purpose: Planning zones & boundaries tab content for VehicleTripsPage — wraps existing GeofenceManagement workbench
 *          with trip-planning context (governance thresholds, matching config).
 * Dependencies: React, GeofenceManagement.
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - VehicleTripPlanningTab: Embeds the shared GeofenceManagement workbench with planning-specific guidance cards.
 */
import React from "react";
import { GeofenceManagement } from "../../../../components/geofenceManagement";

const VehicleTripPlanningTab = () => {
    return (
        <div className="tw-space-y-6">
            <GeofenceManagement
                title="Planning zones & boundaries"
                description="Manage geofences synced from GPSGate. Assign them to groups for fueling validation, or link them to sites for trip classification."
            />

            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
                    <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Out-of-bounds governance</div>
                    <div className="tw-mt-2 tw-space-y-2 tw-text-sm tw-text-slate-500">
                        <div>Time threshold (minutes): <span className="tw-font-mono">—</span></div>
                        <div>Distance threshold (km): <span className="tw-font-mono">—</span></div>
                        <div>Enable out-of-bounds events: <span className="tw-font-mono">—</span></div>
                        <div>Exclude non-productive trips: <span className="tw-font-mono">—</span></div>
                    </div>
                </div>
                <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
                    <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Trip-to-plan matching</div>
                    <div className="tw-mt-2 tw-space-y-2 tw-text-sm tw-text-slate-500">
                        <div>Auto-match trips to nearest zone: <span className="tw-font-mono">—</span></div>
                        <div>Match radius (m): <span className="tw-font-mono">—</span></div>
                        <div>Require project assignment: <span className="tw-font-mono">—</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleTripPlanningTab;
