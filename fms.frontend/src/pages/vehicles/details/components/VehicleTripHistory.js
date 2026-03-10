/**
 * File: VehicleTripHistory.js
 * Purpose: Displays persisted vehicle trip history and allows manual trip recomputation.
 * Dependencies: React, axiosInstance, DevExtreme DateBox/Button, notify.
 * Last Modified: 2026-03-10
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DateBox } from "devextreme-react/date-box";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";

const MOVEMENT_PROFILE_LABELS = {
    0: "Undefined",
    1: "Geofence",
    2: "Cluster",
};

const formatRouteName = (group, direction) => {
    const displayName = direction === "origin"
        ? group.originDisplayName || group.originSiteName
        : group.destinationDisplayName || group.destinationSiteName;

    if (displayName) {
        return displayName;
    }

    return group.detectionMode === "Cluster" ? "Detected cluster" : "Unknown";
};

const VehicleTripHistory = ({ vehicleId, canRecompute = false }) => {
    const [dateFrom, setDateFrom] = useState(
        new Date(new Date().setDate(new Date().getDate() - 7))
    );
    const [dateTo, setDateTo] = useState(new Date());
    const [tripGroups, setTripGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecomputing, setIsRecomputing] = useState(false);

    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams();
        if (dateFrom) params.append("fromUtc", dateFrom.toISOString());
        if (dateTo) params.append("toUtc", dateTo.toISOString());
        return params.toString();
    }, [dateFrom, dateTo]);

    const loadTrips = useCallback(async () => {
        if (!vehicleId) return;

        try {
            setIsLoading(true);
            const queryString = buildQueryString();
            const response = await axiosInstance.get(
                `/vehicletrips/vehicle/${vehicleId}${queryString ? `?${queryString}` : ""}`
            );

            if (response?.data?.isSuccess) {
                setTripGroups(response.data.data || []);
            } else {
                throw new Error(response?.data?.message || "Failed to load trip history");
            }
        } catch (error) {
            console.error("Error loading vehicle trip history:", error);
            notify(error.message || "Failed to load trip history", "error", 3000);
            setTripGroups([]);
        } finally {
            setIsLoading(false);
        }
    }, [buildQueryString, vehicleId]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const handleRecompute = async () => {
        if (!canRecompute) {
            notify("Only admins can recompute trips", "warning", 3000);
            return;
        }

        try {
            setIsRecomputing(true);
            const response = await axiosInstance.post(`/vehicletrips/recompute`, {
                vehicleId: Number(vehicleId),
                fromUtc: dateFrom?.toISOString(),
                toUtc: dateTo?.toISOString(),
            });

            if (response?.data?.isSuccess) {
                const result = response.data.data;
                notify(
                    `Recompute finished. ${result?.groupsCreated || 0} groups / ${result?.tripsCreated || 0} trips created.`,
                    "success",
                    4000
                );
                await loadTrips();
            } else {
                throw new Error(response?.data?.message || "Trip recompute failed");
            }
        } catch (error) {
            console.error("Error recomputing trips:", error);
            notify(error.message || "Trip recompute failed", "error", 3000);
        } finally {
            setIsRecomputing(false);
        }
    };

    const summary = useMemo(() => {
        if (!tripGroups.length) {
            return { totalGroups: 0, totalTrips: 0, totalDistanceKm: 0 };
        }

        return {
            totalGroups: tripGroups.length,
            totalTrips: tripGroups.reduce((sum, item) => sum + (item.tripCount || 0), 0),
            totalDistanceKm: tripGroups.reduce(
                (sum, item) => sum + Number(item.totalDistanceKm || 0),
                0
            ),
        };
    }, [tripGroups]);

    const formatDateTime = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleString();
    };

    return (
        <div className="tw-space-y-4">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-end lg:tw-justify-between tw-gap-4">
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-3 tw-flex-1">
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            From
                        </label>
                        <DateBox
                            type="datetime"
                            value={dateFrom}
                            onValueChanged={(e) => setDateFrom(e.value)}
                            displayFormat="dd/MM/yyyy HH:mm"
                            stylingMode="outlined"
                        />
                    </div>
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            To
                        </label>
                        <DateBox
                            type="datetime"
                            value={dateTo}
                            onValueChanged={(e) => setDateTo(e.value)}
                            displayFormat="dd/MM/yyyy HH:mm"
                            stylingMode="outlined"
                        />
                    </div>
                    <div className="tw-flex tw-items-end tw-gap-2">
                        <Button
                            text="Load Trips"
                            icon="fa-light fa-rotate-right"
                            onClick={loadTrips}
                            disabled={isLoading || isRecomputing}
                            type="default"
                            stylingMode="contained"
                        />
                        <Button
                            text={isRecomputing ? "Recomputing..." : "Recompute Trips"}
                            icon="fa-light fa-route"
                            onClick={handleRecompute}
                            disabled={isLoading || isRecomputing || !canRecompute}
                            type="normal"
                            stylingMode="outlined"
                        />
                    </div>
                </div>
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
                <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                    <div className="tw-text-sm tw-text-gray-500">Route Groups</div>
                    <div className="tw-text-2xl tw-font-semibold tw-text-gray-900">{summary.totalGroups}</div>
                </div>
                <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                    <div className="tw-text-sm tw-text-gray-500">Detected Trips</div>
                    <div className="tw-text-2xl tw-font-semibold tw-text-gray-900">{summary.totalTrips}</div>
                </div>
                <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                    <div className="tw-text-sm tw-text-gray-500">Distance</div>
                    <div className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                        {summary.totalDistanceKm.toFixed(2)} km
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="tw-flex tw-justify-center tw-items-center tw-h-48">
                    <LoadIndicator width="40px" height="40px" visible={true} />
                </div>
            ) : tripGroups.length === 0 ? (
                <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-gray-300 tw-bg-gray-50 tw-p-8 tw-text-center">
                    <i className="fa-light fa-route tw-text-3xl tw-text-gray-400 tw-mb-3"></i>
                    <p className="tw-text-gray-600">No persisted trips were found for the selected period.</p>
                </div>
            ) : (
                <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-gray-200">
                    <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                        <thead className="tw-bg-gray-50">
                            <tr>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Start</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">End</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Route</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Trips</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Distance</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Duration</th>
                                <th className="tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-600">Profile</th>
                            </tr>
                        </thead>
                        <tbody className="tw-divide-y tw-divide-gray-200 tw-bg-white">
                            {tripGroups.map((group) => (
                                <tr key={group.vehicleTripGroupId}>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">{formatDateTime(group.startTimeUtc)}</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">{formatDateTime(group.endTimeUtc)}</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">
                                        {formatRouteName(group, "origin")} <span className="tw-text-gray-400">→</span> {formatRouteName(group, "destination")}
                                    </td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">{group.tripCount}</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">{Number(group.totalDistanceKm || 0).toFixed(2)} km</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">{Number(group.totalDurationMinutes || 0).toFixed(0)} min</td>
                                    <td className="tw-px-4 tw-py-3 tw-text-sm tw-text-gray-700">
                                        {MOVEMENT_PROFILE_LABELS[group.movementProfile] || group.detectionMode}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VehicleTripHistory;
