/**
 * File: ClusterDetectionPreviewResults.js
 * Purpose: Displays tabbed stop, cluster, and trip-leg results for a cluster preview run and syncs row selection back to the map.
 *          Clusters tab includes an action to create a GPSGate geofence from a detected cluster.
 * Dependencies: React, DevExtreme DataGrid, CreateGeofenceFromClusterModal.
 * Last Modified: 2026-03-17
 *
 * Key Functions:
 * - ClusterDetectionPreviewResults(): Renders the result tabs and interactive data grids for preview output.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, { Column, Paging, Scrolling } from "devextreme-react/data-grid";
import CreateGeofenceFromClusterModal from "./CreateGeofenceFromClusterModal";

const GRID_HEIGHT = 380;

const CLUSTER_COLORS = {
    Parking: "#0ea5e9",
    Load: "#16a34a",
    Dump: "#dc2626",
    Transit: "#f59e0b",
    Unknown: "#6b7280",
};

const CLASSIFICATION_COLORS = {
    Parking: "#0ea5e9",
    Load: "#16a34a",
    Dump: "#dc2626",
    Fuel: "#f59e0b",
    Workshop: "#8b5cf6",
    Unknown: "#6b7280",
};

const RESULT_TABS = [
    { id: "stops", label: "Stops", icon: "fa-light fa-circle-stop" },
    { id: "clusters", label: "Clusters", icon: "fa-light fa-circle-nodes" },
    { id: "tripLegs", label: "Trip legs", icon: "fa-light fa-route" },
];

const GEOFENCE_RESULT_TABS = [
    { id: "siteVisits", label: "Site visits", icon: "fa-light fa-building" },
    { id: "tripLegs", label: "Trip legs", icon: "fa-light fa-route" },
];

const StatusBadge = ({ value }) => {
    const color = CLUSTER_COLORS[value] || CLUSTER_COLORS.Unknown;

    return (
        <span
            className="tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold"
            style={{
                backgroundColor: `${color}18`,
                color,
            }}
        >
            {value || "Unknown"}
        </span>
    );
};

const ClassificationBadge = ({ value }) => {
    const color = CLASSIFICATION_COLORS[value] || CLASSIFICATION_COLORS.Unknown;

    return (
        <span
            className="tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold"
            style={{
                backgroundColor: `${color}18`,
                color,
            }}
        >
            {value || "Unknown"}
        </span>
    );
};

const enrichTripLegsWithClusterTypes = (tripLegs, stops) => {
    if (!tripLegs?.length || !stops?.length) {
        return tripLegs || [];
    }

    return tripLegs.map((leg) => {
        const origin = stops.find(
            (stop) => Math.abs(Number(stop.latitude) - Number(leg.startLatitude)) < 0.0001
                && Math.abs(Number(stop.longitude) - Number(leg.startLongitude)) < 0.0001
        );
        const destination = stops.find(
            (stop) => Math.abs(Number(stop.latitude) - Number(leg.endLatitude)) < 0.0001
                && Math.abs(Number(stop.longitude) - Number(leg.endLongitude)) < 0.0001
        );

        return {
            ...leg,
            originClusterType: origin?.clusterType,
            destinationClusterType: destination?.clusterType,
        };
    });
};

const ClusterDetectionPreviewResults = ({ preview = null, selection = null, onSelectionChange, playbackStopIndex = -1, detectionMode = "cluster" }) => {
    const isGeofence = detectionMode === "geofence";
    const tabs = isGeofence ? GEOFENCE_RESULT_TABS : RESULT_TABS;
    const defaultTab = isGeofence ? "siteVisits" : "stops";
    const [activeResultTab, setActiveResultTab] = useState(defaultTab);
    const [createGeofenceCluster, setCreateGeofenceCluster] = useState(null);

    const clusterRadiusMeters = useMemo(
        () => Math.round(Number(preview?.settingsClusterRadiusMeters || 150)),
        [preview?.settingsClusterRadiusMeters]
    );

    const handleCreateGeofenceClick = useCallback((e, cluster) => {
        e.stopPropagation();
        setCreateGeofenceCluster(cluster);
    }, []);

    useEffect(() => {
        setActiveResultTab(isGeofence ? "siteVisits" : "stops");
    }, [preview, isGeofence]);

    useEffect(() => {
        if (playbackStopIndex >= 0) setActiveResultTab(isGeofence ? "siteVisits" : "stops");
    }, [playbackStopIndex, isGeofence]);

    const tripLegRows = useMemo(() => {
        return enrichTripLegsWithClusterTypes(preview?.tripLegs, preview?.stops);
    }, [preview]);

    if (!preview) {
        return null;
    }

    return (
        <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm">
            <div className="tw-flex tw-flex-col tw-gap-3 tw-border-b tw-border-slate-200 tw-px-4 tw-py-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                <div>
                    <h3 className="tw-text-base tw-font-semibold tw-text-slate-900">
                        <i className="fa-light fa-table-list tw-mr-2 tw-text-violet-600" />
                        Preview results
                    </h3>
                    <p className="tw-mt-1 tw-text-sm tw-text-slate-500">Select a row to highlight it on the map.</p>
                </div>

                {selection ? (
                    <button
                        type="button"
                        onClick={() => onSelectionChange?.(null)}
                        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-slate-600 hover:tw-bg-slate-50"
                    >
                        <i className="fa-light fa-xmark" />
                        Clear map focus
                    </button>
                ) : null}
            </div>

            <div className="tw-flex tw-items-center tw-border-b tw-border-slate-200 tw-px-1">
                {tabs.map((tab) => {
                    const count = (preview?.[tab.id] || []).length;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveResultTab(tab.id)}
                            className={`tw-inline-flex tw-items-center tw-gap-2 tw-border-b-2 tw-px-5 tw-py-3 tw-text-sm tw-font-medium tw-transition-colors ${activeResultTab === tab.id
                                ? "tw-border-blue-600 tw-bg-blue-50/60 tw-text-blue-700"
                                : "tw-border-transparent tw-text-slate-500 hover:tw-bg-slate-50 hover:tw-text-slate-700"
                                }`}
                        >
                            <i className={tab.icon} />
                            {tab.label}
                            <span className="tw-rounded-full tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-text-slate-600">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="tw-p-4">
                <p className="tw-mb-3 tw-text-xs tw-text-slate-400">
                    <i className="fa-light fa-hand-pointer tw-mr-1" />
                    Click a data row to focus the corresponding {isGeofence ? "site visit or trip leg" : "stop, cluster, or trip leg"} on the GPS preview map.
                </p>

                {/* ─── Geofence mode: Site Visits ─── */}
                {isGeofence && activeResultTab === "siteVisits" ? (
                    <DataGrid
                        dataSource={preview.siteVisits || []}
                        height={GRID_HEIGHT}
                        showBorders={false}
                        columnAutoWidth
                        wordWrapEnabled
                        rowAlternationEnabled
                        noDataText="No site visits detected."
                        focusedRowEnabled={playbackStopIndex >= 0}
                        focusedRowIndex={playbackStopIndex >= 0 ? playbackStopIndex : -1}
                        onRowClick={(event) => {
                            if (event.rowType === "data") {
                                onSelectionChange?.({ type: "siteVisits", index: event.rowIndex });
                            }
                        }}
                    >
                        <Scrolling mode="virtual" showScrollbar="always" useNative />
                        <Paging enabled={false} />
                        <Column dataField="label" caption="Site" width={140} />
                        <Column dataField="classification" caption="Type" width={100} cellRender={({ value }) => <ClassificationBadge value={value} />} />
                        <Column dataField="entryLatitude" caption="Entry lat" format="#0.######" width={110} />
                        <Column dataField="entryLongitude" caption="Entry lng" format="#0.######" width={110} />
                        <Column dataField="entryTime" caption="Entry (UTC)" dataType="datetime" width={170} />
                        <Column dataField="exitTime" caption="Exit (UTC)" dataType="datetime" width={170} />
                        <Column dataField="durationMinutes" caption="Duration (min)" format="#0.#" width={110} />
                        <Column dataField="pointCount" caption="Points" width={75} />
                    </DataGrid>
                ) : null}

                {/* ─── Geofence mode: Trip Legs ─── */}
                {isGeofence && activeResultTab === "tripLegs" ? (
                    <DataGrid
                        dataSource={preview.tripLegs || []}
                        height={GRID_HEIGHT}
                        showBorders={false}
                        columnAutoWidth
                        wordWrapEnabled
                        rowAlternationEnabled
                        noDataText="No trip legs detected."
                        onRowClick={(event) => {
                            if (event.rowType === "data") {
                                onSelectionChange?.({ type: "tripLegs", index: event.rowIndex });
                            }
                        }}
                    >
                        <Scrolling mode="virtual" showScrollbar="always" useNative />
                        <Paging enabled={false} />
                        <Column dataField="originLabel" caption="Origin" width={120} />
                        <Column dataField="originClassification" caption="From type" width={100} cellRender={({ value }) => <ClassificationBadge value={value} />} />
                        <Column dataField="destinationLabel" caption="Destination" width={120} />
                        <Column dataField="destinationClassification" caption="To type" width={100} cellRender={({ value }) => <ClassificationBadge value={value} />} />
                        <Column dataField="startTimeUtc" caption="Depart (UTC)" dataType="datetime" width={170} />
                        <Column dataField="endTimeUtc" caption="Arrive (UTC)" dataType="datetime" width={170} />
                        <Column dataField="distanceKm" caption="Distance (km)" format="#0.##" width={110} />
                        <Column dataField="durationMinutes" caption="Duration (min)" format="#0.#" width={110} />
                        <Column dataField="maxSpeedKph" caption="Max speed (km/h)" format="#0.#" width={130} />
                        <Column dataField="status" caption="Status" width={90} />
                    </DataGrid>
                ) : null}

                {/* ─── Cluster mode: Stops ─── */}
                {!isGeofence && activeResultTab === "stops" ? (
                    <DataGrid
                        dataSource={preview.stops || []}
                        height={GRID_HEIGHT}
                        showBorders={false}
                        columnAutoWidth
                        wordWrapEnabled
                        rowAlternationEnabled
                        noDataText="No stops detected."
                        focusedRowEnabled={playbackStopIndex >= 0}
                        focusedRowIndex={playbackStopIndex >= 0 ? playbackStopIndex : -1}
                        onRowClick={(event) => {
                            if (event.rowType === "data") {
                                onSelectionChange?.({ type: "stops", index: event.rowIndex });
                            }
                        }}
                    >
                        <Scrolling mode="virtual" showScrollbar="always" useNative />
                        <Paging enabled={false} />
                        <Column dataField="sequenceNo" caption="#" width={50} />
                        <Column dataField="clusterType" caption="Type" width={90} cellRender={({ value }) => <StatusBadge value={value} />} />
                        <Column dataField="clusterLabel" caption="Cluster" width={120} />
                        <Column dataField="latitude" caption="Latitude" format="#0.######" width={110} />
                        <Column dataField="longitude" caption="Longitude" format="#0.######" width={110} />
                        <Column dataField="startTimeUtc" caption="Start (UTC)" dataType="datetime" width={170} />
                        <Column dataField="endTimeUtc" caption="End (UTC)" dataType="datetime" width={170} />
                        <Column dataField="durationMinutes" caption="Duration (min)" format="#0.#" width={110} />
                    </DataGrid>
                ) : null}

                {!isGeofence && activeResultTab === "clusters" ? (
                    <DataGrid
                        dataSource={preview.clusters || []}
                        height={GRID_HEIGHT}
                        showBorders={false}
                        columnAutoWidth
                        wordWrapEnabled
                        rowAlternationEnabled
                        noDataText="No clusters formed."
                        onRowClick={(event) => {
                            if (event.rowType === "data") {
                                onSelectionChange?.({ type: "clusters", index: event.rowIndex });
                            }
                        }}
                    >
                        <Scrolling mode="virtual" showScrollbar="always" useNative />
                        <Paging enabled={false} />
                        <Column dataField="clusterId" caption="ID" width={55} />
                        <Column dataField="clusterType" caption="Type" width={120} cellRender={({ value }) => <StatusBadge value={value} />} />
                        <Column dataField="label" caption="Label" width={140} />
                        <Column dataField="latitude" caption="Latitude" format="#0.######" width={110} />
                        <Column dataField="longitude" caption="Longitude" format="#0.######" width={110} />
                        <Column dataField="visitCount" caption="Visits" width={75} />
                        <Column dataField="averageDwellMinutes" caption="Avg dwell (min)" format="#0.#" width={130} />
                        <Column
                            caption=""
                            width={42}
                            allowSorting={false}
                            cellRender={({ data }) => (
                                <button
                                    type="button"
                                    title="Create geofence from this cluster"
                                    onClick={(e) => handleCreateGeofenceClick(e, data)}
                                    className="tw-flex tw-h-[28px] tw-w-[28px] tw-items-center tw-justify-center tw-rounded-full tw-text-[13px] tw-text-[#a19f9d] tw-border-[1.5px] tw-border-transparent tw-bg-transparent tw-transition-all hover:tw-text-[#0078d4] hover:tw-bg-[#deecf9] hover:tw-border-[#0078d4]"
                                >
                                    <i className="fa-light fa-draw-polygon" />
                                </button>
                            )}
                        />
                    </DataGrid>
                ) : null}

                {!isGeofence && activeResultTab === "tripLegs" ? (
                    <DataGrid
                        dataSource={tripLegRows}
                        height={GRID_HEIGHT}
                        showBorders={false}
                        columnAutoWidth
                        wordWrapEnabled
                        rowAlternationEnabled
                        noDataText="No trip legs detected."
                        onRowClick={(event) => {
                            if (event.rowType === "data") {
                                onSelectionChange?.({ type: "tripLegs", index: event.rowIndex });
                            }
                        }}
                    >
                        <Scrolling mode="virtual" showScrollbar="always" useNative />
                        <Paging enabled={false} />
                        <Column dataField="originClusterType" caption="From" width={90} cellRender={({ value }) => <StatusBadge value={value} />} />
                        <Column dataField="destinationClusterType" caption="To" width={90} cellRender={({ value }) => <StatusBadge value={value} />} />
                        <Column dataField="startTimeUtc" caption="Start (UTC)" dataType="datetime" width={170} />
                        <Column dataField="endTimeUtc" caption="End (UTC)" dataType="datetime" width={170} />
                        <Column dataField="distanceKm" caption="Distance (km)" format="#0.##" width={110} />
                        <Column dataField="durationMinutes" caption="Duration (min)" format="#0.#" width={110} />
                        <Column dataField="confidenceScore" caption="Confidence" format="#0.##" width={100} />
                        <Column dataField="confidenceBand" caption="Band" width={80} />
                    </DataGrid>
                ) : null}
            </div>

            {createGeofenceCluster && (
                <CreateGeofenceFromClusterModal
                    cluster={createGeofenceCluster}
                    defaultRadiusMeters={clusterRadiusMeters}
                    onClose={() => setCreateGeofenceCluster(null)}
                    onCreated={() => setCreateGeofenceCluster(null)}
                />
            )}
        </section>
    );
};

export { CreateGeofenceFromClusterModal };
export default ClusterDetectionPreviewResults;