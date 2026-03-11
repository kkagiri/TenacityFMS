/**
 * File: VehicleTripsPage.js
 * Purpose: Provides a vehicle trip management workbench reachable from the vehicle module and app drawer routes.
 * Dependencies: React, axiosInstance, DevExtreme DataGrid/DateBox/SelectBox/Button, notify.
 * Last Modified: 2026-03-10
 *
 * Key Functions:
 * - loadVehicleLookup(): Loads simple vehicle options for trip filtering.
 * - loadTrips(): Retrieves persisted trip groups for the selected filters.
 * - handleOpenVehicle(): Navigates to the selected vehicle details page.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, { Column, FilterRow, Paging, SearchPanel } from "devextreme-react/data-grid";
import { DateBox } from "devextreme-react/date-box";
import { SelectBox } from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { getVehicleDetailsRoute } from "../utils/navigationHelper";

const movementProfileOptions = [
    { value: null, label: "All Profiles" },
    { value: 1, label: "Geofence" },
    { value: 2, label: "Cluster" },
];

const detectionModeOptions = [
    { value: null, label: "All Modes" },
    { value: "Geofence", label: "Geofence" },
    { value: "Cluster", label: "Cluster" },
];

const normalizeResponseData = (payload) => {
    const normalized = payload?.data ?? payload?.Data ?? payload ?? [];
    return Array.isArray(normalized) ? normalized : [];
};
const getMovementProfileLabel = (movementProfile) => {
    if (movementProfile === 2 || movementProfile === "Cluster") {
        return "Cluster";
    }

    return "Geofence";
};

const mapTripGroup = (group) => ({
    vehicleTripGroupId: group.vehicleTripGroupId ?? group.VehicleTripGroupId,
    vehicleId: group.vehicleId ?? group.VehicleId,
    vehicleLabel: group.vehicleLabel ?? group.VehicleLabel ?? "Unknown Vehicle",
    tripDate: group.tripDate ?? group.TripDate,
    startTimeUtc: group.startTimeUtc ?? group.StartTimeUtc,
    endTimeUtc: group.endTimeUtc ?? group.EndTimeUtc,
    originDisplayName: group.originDisplayName ?? group.OriginDisplayName ?? "Unknown",
    destinationDisplayName: group.destinationDisplayName ?? group.DestinationDisplayName ?? "Unknown",
    tripCount: group.tripCount ?? group.TripCount ?? 0,
    totalDistanceKm: Number(group.totalDistanceKm ?? group.TotalDistanceKm ?? 0),
    totalDurationMinutes: Number(group.totalDurationMinutes ?? group.TotalDurationMinutes ?? 0),
    movementProfile: group.movementProfile ?? group.MovementProfile,
    movementProfileLabel: getMovementProfileLabel(group.movementProfile ?? group.MovementProfile),
    detectionMode: group.detectionMode ?? group.DetectionMode ?? "Geofence",
});

const VehicleTripsPage = () => {
    const navigate = useNavigate();
    const [vehicleOptions, setVehicleOptions] = useState([]);
    const [tripGroups, setTripGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [selectedMovementProfile, setSelectedMovementProfile] = useState(null);
    const [selectedDetectionMode, setSelectedDetectionMode] = useState(null);
    const [fromDate, setFromDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
    });
    const [toDate, setToDate] = useState(() => new Date());

    const loadVehicleLookup = useCallback(async () => {
        setLoadingVehicles(true);

        try {
            const response = await axiosInstance.get("/vehicle/simple");
            const rawVehicles = Array.isArray(response.data) ? response.data : [];
            const mappedVehicles = rawVehicles.map((vehicle) => ({
                vehicleId: vehicle.vehicleId ?? vehicle.VehicleId,
                label: vehicle.hyoungNo ?? vehicle.HyoungNo,
            }));

            setVehicleOptions(mappedVehicles);
        } catch (error) {
            notify(error?.message || "Failed to load vehicles", "error", 3000);
        } finally {
            setLoadingVehicles(false);
        }
    }, []);

    const loadTrips = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axiosInstance.get("/vehicletrips", {
                params: {
                    vehicleId: selectedVehicleId || undefined,
                    fromUtc: fromDate?.toISOString(),
                    toUtc: toDate?.toISOString(),
                    movementProfile: selectedMovementProfile ?? undefined,
                    detectionMode: selectedDetectionMode || undefined,
                },
            });

            setTripGroups(normalizeResponseData(response.data).map(mapTripGroup));
        } catch (error) {
            notify(error?.message || "Failed to load vehicle trips", "error", 3000);
            setTripGroups([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, selectedDetectionMode, selectedMovementProfile, selectedVehicleId, toDate]);

    useEffect(() => {
        loadVehicleLookup();
    }, [loadVehicleLookup]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const stats = useMemo(() => {
        const totalGroups = tripGroups.length;
        const uniqueVehicles = new Set(tripGroups.map((group) => group.vehicleId)).size;
        const totalDistanceKm = tripGroups.reduce((sum, group) => sum + Number(group.totalDistanceKm || 0), 0);
        const totalDurationHours = tripGroups.reduce((sum, group) => sum + Number(group.totalDurationMinutes || 0), 0) / 60;

        return {
            totalGroups,
            uniqueVehicles,
            totalDistanceKm: totalDistanceKm.toFixed(1),
            totalDurationHours: totalDurationHours.toFixed(1),
        };
    }, [tripGroups]);

    const handleOpenVehicle = (rowData) => {
        if (!rowData?.vehicleId) {
            return;
        }

        navigate(getVehicleDetailsRoute(rowData.vehicleId));
    };

    return (
        <div className="tw-p-6 tw-space-y-6">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-4 tw-gap-4">
                <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-xl tw-p-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <i className="fa-light fa-route tw-text-2xl tw-text-blue-600"></i>
                        <div>
                            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-blue-600">Trip Groups</div>
                            <div className="tw-text-2xl tw-font-bold tw-text-blue-900">{stats.totalGroups}</div>
                        </div>
                    </div>
                </div>

                <div className="tw-bg-emerald-50 tw-border tw-border-emerald-200 tw-rounded-xl tw-p-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <i className="fa-light fa-truck-fast tw-text-2xl tw-text-emerald-600"></i>
                        <div>
                            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-emerald-600">Vehicles</div>
                            <div className="tw-text-2xl tw-font-bold tw-text-emerald-900">{stats.uniqueVehicles}</div>
                        </div>
                    </div>
                </div>

                <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-xl tw-p-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <i className="fa-light fa-road tw-text-2xl tw-text-amber-600"></i>
                        <div>
                            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-amber-600">Distance</div>
                            <div className="tw-text-2xl tw-font-bold tw-text-amber-900">{stats.totalDistanceKm} km</div>
                        </div>
                    </div>
                </div>

                <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-xl tw-p-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <i className="fa-light fa-clock tw-text-2xl tw-text-purple-600"></i>
                        <div>
                            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-purple-600">Duration</div>
                            <div className="tw-text-2xl tw-font-bold tw-text-purple-900">{stats.totalDurationHours} hrs</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-5 tw-space-y-4">
                <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-end tw-gap-4">
                    <div className="tw-flex-1">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Vehicle</label>
                        <SelectBox
                            dataSource={vehicleOptions}
                            valueExpr="vehicleId"
                            displayExpr="label"
                            value={selectedVehicleId}
                            onValueChanged={(event) => setSelectedVehicleId(event.value)}
                            placeholder={loadingVehicles ? "Loading vehicles..." : "All Vehicles"}
                            showClearButton={true}
                            width="100%"
                        />
                    </div>

                    <div className="tw-flex-1">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Movement Profile</label>
                        <SelectBox
                            dataSource={movementProfileOptions}
                            valueExpr="value"
                            displayExpr="label"
                            value={selectedMovementProfile}
                            onValueChanged={(event) => setSelectedMovementProfile(event.value)}
                            showClearButton={true}
                            width="100%"
                        />
                    </div>

                    <div className="tw-flex-1">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Detection Mode</label>
                        <SelectBox
                            dataSource={detectionModeOptions}
                            valueExpr="value"
                            displayExpr="label"
                            value={selectedDetectionMode}
                            onValueChanged={(event) => setSelectedDetectionMode(event.value)}
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                </div>

                <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-end tw-gap-4">
                    <div className="tw-flex-1">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">From</label>
                        <DateBox
                            type="datetime"
                            value={fromDate}
                            onValueChanged={(event) => setFromDate(event.value)}
                            width="100%"
                            displayFormat="yyyy-MM-dd HH:mm"
                        />
                    </div>

                    <div className="tw-flex-1">
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">To</label>
                        <DateBox
                            type="datetime"
                            value={toDate}
                            onValueChanged={(event) => setToDate(event.value)}
                            width="100%"
                            displayFormat="yyyy-MM-dd HH:mm"
                        />
                    </div>

                    <div className="tw-flex tw-items-center tw-gap-3">
                        <Button
                            text="Refresh"
                            icon="refresh"
                            type="default"
                            stylingMode="contained"
                            onClick={loadTrips}
                        />
                        <Button
                            text="Reset"
                            icon="revert"
                            stylingMode="outlined"
                            onClick={() => {
                                const resetFrom = new Date();
                                resetFrom.setDate(resetFrom.getDate() - 7);
                                setSelectedVehicleId(null);
                                setSelectedMovementProfile(null);
                                setSelectedDetectionMode(null);
                                setFromDate(resetFrom);
                                setToDate(new Date());
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
                {loading && (
                    <div className="tw-flex tw-items-center tw-gap-3 tw-pb-4">
                        <LoadIndicator width="24px" height="24px" visible={true} />
                        <span className="tw-text-sm tw-text-gray-600">Loading trip groups...</span>
                    </div>
                )}

                <DataGrid
                    dataSource={tripGroups}
                    keyExpr="vehicleTripGroupId"
                    showBorders={true}
                    rowAlternationEnabled={true}
                    hoverStateEnabled={true}
                    columnAutoWidth={true}
                    noDataText="No persisted trips found for the selected filters."
                >
                    <Paging defaultPageSize={20} />
                    <FilterRow visible={true} />
                    <SearchPanel visible={true} width={280} placeholder="Search trips..." />

                    <Column dataField="vehicleLabel" caption="Vehicle" minWidth={180} />
                    <Column dataField="tripDate" caption="Trip Date" dataType="date" format="yyyy-MM-dd" minWidth={110} />
                    <Column dataField="startTimeUtc" caption="Start" dataType="datetime" format="yyyy-MM-dd HH:mm" minWidth={150} />
                    <Column dataField="endTimeUtc" caption="End" dataType="datetime" format="yyyy-MM-dd HH:mm" minWidth={150} />
                    <Column dataField="originDisplayName" caption="Origin" minWidth={180} />
                    <Column dataField="destinationDisplayName" caption="Destination" minWidth={180} />
                    <Column dataField="tripCount" caption="Legs" minWidth={80} alignment="center" />
                    <Column dataField="totalDistanceKm" caption="Distance (km)" format={{ type: "fixedPoint", precision: 2 }} minWidth={120} />
                    <Column dataField="totalDurationMinutes" caption="Duration (min)" format={{ type: "fixedPoint", precision: 1 }} minWidth={130} />
                    <Column dataField="movementProfileLabel" caption="Profile" minWidth={110} />
                    <Column dataField="detectionMode" caption="Mode" minWidth={110} />
                    <Column
                        caption="Actions"
                        width={140}
                        cellRender={({ data }) => (
                            <Button
                                text="Open Vehicle"
                                icon="fa-light fa-arrow-up-right-from-square"
                                stylingMode="text"
                                onClick={() => handleOpenVehicle(data)}
                            />
                        )}
                    />
                </DataGrid>
            </div>
        </div>
    );
};

export default VehicleTripsPage;