/**
 * File: VehicleTripClusterPreviewPage.js
 * Purpose: Hosts the redesigned cluster preview workspace with integrated GPS preview and always-visible detection thresholds.
 * Dependencies: React, ClusterDetectionPreviewPanel, navigation helper, permissions.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - VehicleTripClusterPreviewPage(): Renders the standalone cluster preview workspace.
 */
import React from "react";
import Button from "devextreme-react/button";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import ClusterDetectionPreviewPanel from "./components/ClusterDetectionPreviewPanel";
import { vehicleRoutes } from "../utils/navigationHelper";

const VehicleTripClusterPreviewPage = () => {
    const navigate = useNavigate();
    const { hasAnyPermission } = usePermissions();
    const canViewTrips = hasAnyPermission(["_Read_VehicleTrips", "_Read_Vehicle"]);

    if (!canViewTrips) {
        return (
            <div className="tw-rounded-2xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-6 tw-shadow-sm">
                <h1 className="tw-text-xl tw-font-semibold tw-text-amber-900">Cluster preview access required</h1>
                <p className="tw-mt-2 tw-text-sm tw-text-amber-800">
                    You need Vehicle Trips read access to open the standalone cluster preview workspace.
                </p>
            </div>
        );
    }

    return (
        <div className="tw-space-y-6">
            <section className="tw-rounded-3xl tw-border tw-border-slate-200 tw-bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#f8fafc_100%)] tw-p-6 tw-shadow-sm">
                <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
                    <div className="tw-max-w-3xl">
                        <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-sky-200 tw-bg-white/80 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-sky-700">
                            <i className="fa-light fa-route-highway" />
                            Vehicle Trips / Cluster Preview
                        </div>
                        <h1 className="tw-mt-4 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-slate-900">Cluster preview workspace</h1>
                        <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
                            Dry-run cluster detection against a vehicle and time window. Adjust thresholds and replay without persisting.
                        </p>
                    </div>

                    <div className="tw-flex tw-flex-wrap tw-gap-3">
                        <Button
                            text="Trip groups"
                            icon="fa-light fa-table-list"
                            stylingMode="outlined"
                            onClick={() => navigate(vehicleRoutes.trips)}
                        />
                        <Button
                            text="Trip settings"
                            icon="fa-light fa-sliders"
                            stylingMode="outlined"
                            onClick={() => navigate(vehicleRoutes.tripSettings)}
                        />
                    </div>
                </div>
            </section>

            <ClusterDetectionPreviewPanel />
        </div>
    );
};

export default VehicleTripClusterPreviewPage;