/**
 * File: VehicleGeofenceManagementPage.js
 * Purpose: Hosts the shared geofence management workbench as a full vehicle-module page.
 * Dependencies: React Router, shared GeofenceManagement component.
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - VehicleGeofenceManagementPage(): Resolves route state for create-mode map viewport handoff from tracking.
 */
import React from "react";
import { useLocation } from "react-router-dom";
import { GeofenceManagement } from "../../../components/geofenceManagement";

const VehicleGeofenceManagementPage = () => {
    const location = useLocation();
    const routeState = location.state || {};
    const initialCreateViewport = routeState?.createViewport || null;
    const autoOpenCreateOnMount = routeState?.openCreate === true;

    return (
        <GeofenceManagement
            title="Vehicle geofence management"
            description="Create route, polygon, or circle geofences for fleet monitoring, fueling route validation, and vehicle trip classification from a dedicated vehicle workspace."
            createPanelWidth="min(1320px, 98vw)"
            getCreateMapViewport={() => initialCreateViewport}
            autoOpenCreateOnMount={autoOpenCreateOnMount}
        />
    );
};

export default VehicleGeofenceManagementPage;