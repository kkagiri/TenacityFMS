/**
 * File: VehicleTripsPage.js
 * Purpose: Provides a vehicle trip workbench with filtering, anomaly review, reconciliation actions, and drill-down panels.
 * Dependencies: React, axiosInstance, DevExtreme controls, trip service, trip side panels, permissions.
 * Last Modified: 2026-03-12
 *
 * Key Functions:
 * - loadVehicleLookup(): Loads simple vehicle options for trip filtering.
 * - loadTrips(): Retrieves persisted trip groups for the selected filters.
 * - handleRunReconciliation(): Runs preview or persisted reconciliation for the active filter scope.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, { Column, FilterRow, Paging, SearchPanel } from "devextreme-react/data-grid";
import { DateBox } from "devextreme-react/date-box";
import { SelectBox } from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import { usePermissions } from "../../../hooks/usePermissions";
import {
    fetchVehicleTripList,
    reconcileVehicleTrips,
    recomputeVehicleTrips,
} from "./services/vehicleTripService";
import {
    formatDistance,
    formatDuration,
    formatFuel,
    getAnomalyItems,
    getPlanMatchConfig,
} from "./utils/vehicleTripUi";
import { VehicleTripBadgeCluster } from "./components/VehicleTripBadges";
import VehicleTripDetailPanel from "./components/VehicleTripDetailPanel";
import VehicleTripOverridePanel from "./components/VehicleTripOverridePanel";
import VehicleTripPlanningTab from "./components/VehicleTripPlanningTab";
import { getVehicleDetailsRoute, vehicleRoutes } from "../utils/navigationHelper";
import "./VehicleTripsPage.scss";

const movementProfileOptions = [
    { value: null, label: "All Profiles" },
    { value: 1, label: "Geofence" },
    { value: 2, label: "Cluster" },
];

const detectionModeOptions = [
    { value: null, label: "All Modes" },
    { value: "Geofence", label: "Geofence" },
    { value: "Cluster", label: "Cluster" },
    { value: "Realtime", label: "Realtime" },
];

const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: 1, label: "In progress" },
    { value: 2, label: "Completed" },
];

const reconciliationOptions = [
    { value: null, label: "All Reconciliation States" },
    { value: 0, label: "Pending" },
    { value: 1, label: "Confirmed" },
    { value: 2, label: "Split" },
    { value: 3, label: "Merged" },
    { value: 4, label: "Adjusted" },
    { value: 5, label: "Anomaly" },
];

const confidenceBandOptions = [
    { value: null, label: "All Confidence Bands" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
];

const planMatchStatusOptions = [
    { value: null, label: "All Plan Match" },
    { value: "Matched", label: "Matched" },
    { value: "Unmatched", label: "Unmatched" },
    { value: "Partial", label: "Partial" },
];

const productiveOptions = [
    { value: null, label: "All Productive" },
    { value: "yes", label: "Productive" },
    { value: "no", label: "Non-productive" },
];

const SUMMARY_STATES = [
    { key: 0, label: "Pending" },
    { key: 1, label: "Confirmed" },
    { key: 2, label: "Split" },
    { key: 3, label: "Merged" },
    { key: 4, label: "Adjusted" },
    { key: 5, label: "Anomaly" },
];

const SummaryCard = ({ label, value, hint, tone, icon }) => (
    <div className={`tw-rounded-xl tw-border tw-p-4 tw-shadow-sm ${tone === "danger" ? "tw-border-rose-200 tw-bg-rose-50" : tone === "warning" ? "tw-border-amber-200 tw-bg-amber-50" : tone === "success" ? "tw-border-emerald-200 tw-bg-emerald-50" : "tw-border-slate-200 tw-bg-slate-50"}`}>
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <div>
                <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">{label}</div>
                <div className="tw-mt-1 tw-text-2xl tw-font-bold tw-text-slate-900">{value}</div>
                {hint ? <div className="tw-mt-1 tw-text-sm tw-text-slate-600">{hint}</div> : null}
            </div>
            <i className={`${icon} tw-text-lg tw-text-slate-500`} />
        </div>
    </div>
);

const renderClassificationSourceCell = ({ data }) => {
    const isProjectLocation = data?.classificationSourceType === "ProjectLocation";
    const label = isProjectLocation ? "Project location" : "Site";
    const chipClassName = isProjectLocation
        ? "tw-bg-emerald-100 tw-text-emerald-800"
        : "tw-bg-blue-100 tw-text-blue-800";
    const iconClassName = isProjectLocation ? "fa-light fa-diagram-project" : "fa-light fa-building-flag";

    return (
        <div className="tw-flex tw-flex-wrap tw-gap-1 tw-py-1">
            <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${chipClassName}`}>
                <i className={iconClassName} />
                {label}
            </span>
            {data?.classificationSourceLabel ? (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-slate-700">
                    {data.classificationSourceLabel}
                </span>
            ) : null}
        </div>
    );
};

const renderPlanMatchCell = ({ data }) => {
    if (data?.planMatchStatus == null) {
        return <span className="tw-text-xs tw-text-slate-400">—</span>;
    }

    const cfg = getPlanMatchConfig(data.planMatchStatus);
    const toneMap = {
        success: "tw-bg-emerald-100 tw-text-emerald-800",
        warning: "tw-bg-amber-100 tw-text-amber-800",
        danger: "tw-bg-rose-100 tw-text-rose-800",
        neutral: "tw-bg-slate-100 tw-text-slate-700",
    };

    return (
        <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold ${toneMap[cfg.tone] || toneMap.neutral}`}>
            {cfg.label}
            {data.planMatchScore != null ? ` · ${Number(data.planMatchScore).toFixed(2)}` : ""}
        </span>
    );
};

const renderOobCell = ({ data }) => {
    if (!data?.isOutOfBounds) {
        return <span className="tw-text-xs tw-text-slate-400">—</span>;
    }

    return (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-rose-100 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-rose-800">
            <i className="fa-light fa-triangle-exclamation" /> OOB
        </span>
    );
};

const VehicleTripsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { hasAnyPermission } = usePermissions();
    const canViewTrips = hasAnyPermission(["_Read_VehicleTrips", "_Read_Vehicle"]);
    const canManageTrips = hasAnyPermission(["_Edit_VehicleTrips", "_Edit_Vehicle"]);
    const [vehicleOptions, setVehicleOptions] = useState([]);
    const [tripGroups, setTripGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [selectedMovementProfile, setSelectedMovementProfile] = useState(null);
    const [selectedDetectionMode, setSelectedDetectionMode] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedReconciliationStatus, setSelectedReconciliationStatus] = useState(null);
    const [selectedConfidenceBand, setSelectedConfidenceBand] = useState(null);
    const [selectedPlanMatchStatus, setSelectedPlanMatchStatus] = useState(null);
    const [selectedProductive, setSelectedProductive] = useState(null);
    const [showOutOfBoundsOnly, setShowOutOfBoundsOnly] = useState(false);
    const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(searchParams.get("anomalies") === "1");
    const [selectedTripGroupId, setSelectedTripGroupId] = useState(null);
    const [tripDetailForOverride, setTripDetailForOverride] = useState(null);
    const [isOverridePanelOpen, setIsOverridePanelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("trips");
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
            const data = await fetchVehicleTripList({
                vehicleId: selectedVehicleId || undefined,
                fromUtc: fromDate?.toISOString(),
                toUtc: toDate?.toISOString(),
                movementProfile: selectedMovementProfile ?? undefined,
                detectionMode: selectedDetectionMode || undefined,
                status: selectedStatus ?? undefined,
                reconciliationStatus: selectedReconciliationStatus ?? undefined,
            });

            setTripGroups(data);
        } catch (error) {
            notify(error?.message || "Failed to load vehicle trips", "error", 3000);
            setTripGroups([]);
        } finally {
            setLoading(false);
        }
    }, [
        fromDate,
        selectedDetectionMode,
        selectedMovementProfile,
        selectedReconciliationStatus,
        selectedStatus,
        selectedVehicleId,
        toDate,
    ]);

    useEffect(() => {
        loadVehicleLookup();
    }, [loadVehicleLookup]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const filteredTripGroups = useMemo(() => {
        return tripGroups.filter((group) => {
            const anomalyCount = getAnomalyItems(group.anomalyFlags).length;
            const score = Number(group.confidenceScore || 0);

            const matchesConfidence = selectedConfidenceBand == null
                ? true
                : selectedConfidenceBand === "low"
                    ? score < 0.55
                    : selectedConfidenceBand === "medium"
                        ? score >= 0.55 && score < 0.8
                        : score >= 0.8;

            const matchesAnomaly = showAnomaliesOnly
                ? anomalyCount > 0 || Number(group.reconciliationStatus || 0) === 5
                : true;

            const matchesPlanMatch = selectedPlanMatchStatus == null
                ? true
                : String(group.planMatchStatus) === selectedPlanMatchStatus;

            const matchesProductive = selectedProductive == null
                ? true
                : selectedProductive === "yes"
                    ? group.isProductive !== false
                    : group.isProductive === false;

            const matchesOob = showOutOfBoundsOnly ? Boolean(group.isOutOfBounds) : true;

            return matchesConfidence && matchesAnomaly && matchesPlanMatch && matchesProductive && matchesOob;
        });
    }, [selectedConfidenceBand, selectedPlanMatchStatus, selectedProductive, showAnomaliesOnly, showOutOfBoundsOnly, tripGroups]);

    const stats = useMemo(() => {
        const totalGroups = filteredTripGroups.length;
        const uniqueVehicles = new Set(filteredTripGroups.map((group) => group.vehicleId)).size;
        const totalDistanceKm = filteredTripGroups.reduce((sum, group) => sum + Number(group.totalDistanceKm || 0), 0);
        const totalDurationHours = filteredTripGroups.reduce((sum, group) => sum + Number(group.totalDurationMinutes || 0), 0) / 60;
        const totalFuelLitres = filteredTripGroups.reduce((sum, group) => sum + Number(group.totalFuelConsumed || 0), 0);
        const inTransitCount = filteredTripGroups.filter((group) => Number(group.status) === 1).length;
        const anomalyCount = filteredTripGroups.filter((group) => Number(group.reconciliationStatus) === 5 || getAnomalyItems(group.anomalyFlags).length > 0).length;

        return {
            totalGroups,
            uniqueVehicles,
            totalDistanceKm: totalDistanceKm.toFixed(1),
            totalDurationHours: totalDurationHours.toFixed(1),
            totalFuelLitres: totalFuelLitres.toFixed(1),
            inTransitCount,
            anomalyCount,
        };
    }, [filteredTripGroups]);

    const reconciliationSummary = useMemo(() => {
        return filteredTripGroups.reduce((summary, group) => {
            const key = Number(group.reconciliationStatus || 0);
            summary[key] = (summary[key] || 0) + 1;
            return summary;
        }, {});
    }, [filteredTripGroups]);

    const classificationSummary = useMemo(() => {
        return filteredTripGroups.reduce((summary, group) => {
            if (group?.classificationSourceType === "ProjectLocation") {
                summary.projectLocation += 1;
            } else {
                summary.site += 1;
            }

            return summary;
        }, { site: 0, projectLocation: 0 });
    }, [filteredTripGroups]);

    const anomalyReview = useMemo(() => {
        const groups = filteredTripGroups.filter((group) => Number(group.reconciliationStatus) === 5 || getAnomalyItems(group.anomalyFlags).length > 0);
        const breakdown = new Map();

        groups.forEach((group) => {
            getAnomalyItems(group.anomalyFlags).forEach((item) => {
                breakdown.set(item.label, (breakdown.get(item.label) || 0) + 1);
            });
        });

        return {
            groups,
            breakdown: Array.from(breakdown.entries())
                .map(([label, count]) => ({ label, count }))
                .sort((left, right) => right.count - left.count),
        };
    }, [filteredTripGroups]);

    const handleOpenVehicle = useCallback((rowData) => {
        if (!rowData?.vehicleId) {
            return;
        }

        navigate(getVehicleDetailsRoute(rowData.vehicleId));
    }, [navigate]);

    const handleRunReconciliation = useCallback(async (previewOnly) => {
        if (!canManageTrips) {
            notify("Only admins can reconcile trips", "warning", 3000);
            return;
        }

        if (!selectedVehicleId) {
            notify("Select a vehicle before running reconciliation", "warning", 3000);
            return;
        }

        try {
            setIsReconciling(true);
            const result = await reconcileVehicleTrips({
                vehicleId: selectedVehicleId,
                fromUtc: fromDate?.toISOString(),
                toUtc: toDate?.toISOString(),
                previewOnly,
            });
            notify(
                previewOnly
                    ? `Preview complete. ${result?.confirmedGroups || 0} confirmed, ${result?.anomalyGroups || 0} anomalies.`
                    : `Reconciliation complete. ${result?.groupsUpdated || 0} groups updated and ${result?.tripsUpdated || 0} trips touched.`,
                "success",
                5000,
            );
            await loadTrips();
        } catch (error) {
            notify(error?.message || "Trip reconciliation failed", "error", 4000);
        } finally {
            setIsReconciling(false);
        }
    }, [canManageTrips, fromDate, loadTrips, selectedVehicleId, toDate]);

    const handleRecomputePayload = useCallback(async (payload) => {
        if (!canManageTrips) {
            notify("Only admins can recompute trips", "warning", 3000);
            return;
        }

        try {
            setIsRecomputing(true);
            const result = await recomputeVehicleTrips(payload);
            notify(`Recompute complete. ${result?.groupsCreated || 0} groups / ${result?.tripsCreated || 0} trips created.`, "success", 4500);
            await loadTrips();
        } catch (error) {
            notify(error?.message || "Trip recompute failed", "error", 4000);
        } finally {
            setIsRecomputing(false);
        }
    }, [canManageTrips, loadTrips]);

    const handleRecomputeSelectedVehicle = useCallback(async () => {
        if (!selectedVehicleId) {
            notify("Select a vehicle before rerunning trip detection", "warning", 3000);
            return;
        }

        await handleRecomputePayload({
            vehicleId: selectedVehicleId,
            fromUtc: fromDate?.toISOString(),
            toUtc: toDate?.toISOString(),
        });
    }, [fromDate, handleRecomputePayload, selectedVehicleId, toDate]);

    const handleReconcilePayload = useCallback(async (payload) => {
        try {
            setIsReconciling(true);
            const result = await reconcileVehicleTrips({
                vehicleId: payload?.vehicleId,
                fromUtc: payload?.fromUtc,
                toUtc: payload?.toUtc,
                previewOnly: false,
            });
            notify(`Reconciliation complete. ${result?.groupsUpdated || 0} groups updated and ${result?.anomalyGroups || 0} anomalies reviewed.`, "success", 5000);
            await loadTrips();
        } catch (error) {
            notify(error?.message || "Trip reconciliation failed", "error", 4000);
        } finally {
            setIsReconciling(false);
        }
    }, [loadTrips]);

    if (!canViewTrips) {
        return (
            <div className="tw-p-6">
                <div className="tw-rounded-2xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-6 tw-shadow-sm">
                    <div className="tw-flex tw-items-start tw-gap-4">
                        <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-amber-100 tw-text-amber-700">
                            <i className="fa-light fa-lock" />
                        </div>
                        <div className="tw-space-y-2">
                            <h1 className="tw-text-xl tw-font-semibold tw-text-slate-900">Trip management access required</h1>
                            <p className="tw-max-w-2xl tw-text-sm tw-text-slate-700">
                                You need Vehicle Trips read access to view trip groups and reconciliation data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-trips-page">
            <div className="m365-tabs">
                <button
                    type="button"
                    className={`m365-tab${activeTab === "trips" ? " m365-tab--active" : ""}`}
                    onClick={() => setActiveTab("trips")}
                >
                    <i className="fa-light fa-route" />
                    Trip groups
                </button>
                <button
                    type="button"
                    className={`m365-tab${activeTab === "planning" ? " m365-tab--active" : ""}`}
                    onClick={() => setActiveTab("planning")}
                >
                    <i className="fa-light fa-map-location-dot" />
                    Planning zones & boundaries
                </button>
            </div>

            {activeTab === "planning" && (
                <div className="tw-p-6">
                    <VehicleTripPlanningTab />
                </div>
            )}

            {activeTab === "trips" && (
                <div className="tw-p-6 tw-space-y-6">
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-6 tw-gap-4">
                        <SummaryCard label="Trip groups" value={String(stats.totalGroups)} hint="Filtered result set" tone="slate" icon="fa-light fa-route" />
                        <SummaryCard label="Vehicles" value={String(stats.uniqueVehicles)} hint="Vehicles represented" tone="success" icon="fa-light fa-truck-fast" />
                        <SummaryCard label="Distance" value={`${stats.totalDistanceKm} km`} hint="Total filtered distance" tone="warning" icon="fa-light fa-road" />
                        <SummaryCard label="Duration" value={`${stats.totalDurationHours} hrs`} hint="Total filtered duration" tone="slate" icon="fa-light fa-clock" />
                        <SummaryCard label="Fuel" value={`${stats.totalFuelLitres} L`} hint="Telemetry-backed total" tone="success" icon="fa-light fa-gas-pump" />
                        <SummaryCard label="Anomalies" value={String(stats.anomalyCount)} hint="Flags or anomaly reconciliation" tone="danger" icon="fa-light fa-triangle-exclamation" />
                    </div>

                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-5 tw-space-y-4">
                        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-4 tw-gap-4">
                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Vehicle</label>
                                <SelectBox
                                    dataSource={vehicleOptions}
                                    valueExpr="vehicleId"
                                    displayExpr="label"
                                    value={selectedVehicleId}
                                    onValueChanged={(event) => setSelectedVehicleId(event.value)}
                                    placeholder={loadingVehicles ? "Loading vehicles..." : "All vehicles"}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Movement profile</label>
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

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Detection mode</label>
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

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Status</label>
                                <SelectBox
                                    dataSource={statusOptions}
                                    valueExpr="value"
                                    displayExpr="label"
                                    value={selectedStatus}
                                    onValueChanged={(event) => setSelectedStatus(event.value)}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">From</label>
                                <DateBox
                                    type="datetime"
                                    value={fromDate}
                                    onValueChanged={(event) => setFromDate(event.value)}
                                    width="100%"
                                    displayFormat="yyyy-MM-dd HH:mm"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">To</label>
                                <DateBox
                                    type="datetime"
                                    value={toDate}
                                    onValueChanged={(event) => setToDate(event.value)}
                                    width="100%"
                                    displayFormat="yyyy-MM-dd HH:mm"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Reconciliation</label>
                                <SelectBox
                                    dataSource={reconciliationOptions}
                                    valueExpr="value"
                                    displayExpr="label"
                                    value={selectedReconciliationStatus}
                                    onValueChanged={(event) => setSelectedReconciliationStatus(event.value)}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Confidence</label>
                                <SelectBox
                                    dataSource={confidenceBandOptions}
                                    valueExpr="value"
                                    displayExpr="label"
                                    value={selectedConfidenceBand}
                                    onValueChanged={(event) => setSelectedConfidenceBand(event.value)}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Plan match</label>
                                <SelectBox
                                    dataSource={planMatchStatusOptions}
                                    valueExpr="value"
                                    displayExpr="label"
                                    value={selectedPlanMatchStatus}
                                    onValueChanged={(event) => setSelectedPlanMatchStatus(event.value)}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>

                            <div>
                                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Productive</label>
                                <SelectBox
                                    dataSource={productiveOptions}
                                    valueExpr="value"
                                    displayExpr="label"
                                    value={selectedProductive}
                                    onValueChanged={(event) => setSelectedProductive(event.value)}
                                    showClearButton={true}
                                    width="100%"
                                />
                            </div>
                        </div>

                        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
                            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
                                <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={showAnomaliesOnly}
                                        onChange={(event) => setShowAnomaliesOnly(event.target.checked)}
                                    />
                                    <span>Show anomalies only</span>
                                </label>
                                <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={showOutOfBoundsOnly}
                                        onChange={(event) => setShowOutOfBoundsOnly(event.target.checked)}
                                    />
                                    <span>Out-of-bounds only</span>
                                </label>
                            </div>

                            <div className="tw-flex tw-flex-wrap tw-gap-2">
                                <Button
                                    text="Cluster preview"
                                    icon="fa-light fa-chart-scatter-bubble"
                                    stylingMode="outlined"
                                    onClick={() => navigate(vehicleRoutes.tripClusterPreview)}
                                />
                                <Button
                                    text="Trip settings"
                                    icon="fa-light fa-sliders"
                                    stylingMode="outlined"
                                    onClick={() => navigate(vehicleRoutes.tripSettings)}
                                />
                                <Button text="Refresh" icon="refresh" type="default" stylingMode="contained" onClick={loadTrips} />
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
                                        setSelectedStatus(null);
                                        setSelectedReconciliationStatus(null);
                                        setSelectedConfidenceBand(null);
                                        setSelectedPlanMatchStatus(null);
                                        setSelectedProductive(null);
                                        setShowAnomaliesOnly(false);
                                        setShowOutOfBoundsOnly(false);
                                        setFromDate(resetFrom);
                                        setToDate(new Date());
                                    }}
                                />
                                {canManageTrips ? (
                                    <Button
                                        text={isRecomputing ? "Recomputing..." : "Recompute"}
                                        icon="fa-light fa-route"
                                        stylingMode="outlined"
                                        disabled={isRecomputing || !selectedVehicleId}
                                        onClick={handleRecomputeSelectedVehicle}
                                    />
                                ) : null}
                                {canManageTrips ? (
                                    <Button
                                        text={isReconciling ? "Reconciling..." : "Preview reconciliation"}
                                        icon="fa-light fa-shuffle"
                                        stylingMode="outlined"
                                        disabled={isReconciling || !selectedVehicleId}
                                        onClick={() => handleRunReconciliation(true)}
                                    />
                                ) : null}
                                {canManageTrips ? (
                                    <Button
                                        text={isReconciling ? "Reconciling..." : "Run reconciliation"}
                                        icon="fa-light fa-check-double"
                                        type="default"
                                        disabled={isReconciling || !selectedVehicleId}
                                        onClick={() => handleRunReconciliation(false)}
                                    />
                                ) : null}
                            </div>
                        </div>

                        <div className="tw-flex tw-flex-wrap tw-gap-2">
                            <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-blue-50 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-blue-800">
                                <i className="fa-light fa-building-flag" />
                                {classificationSummary.site} site-classified visible
                            </span>
                            <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-emerald-50 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-emerald-800">
                                <i className="fa-light fa-diagram-project" />
                                {classificationSummary.projectLocation} project-location visible
                            </span>
                            <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-slate-100 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-slate-700">
                                <i className="fa-light fa-circle-info" />
                                Project-location counts remain reserved until backend payloads ship them.
                            </span>
                        </div>
                    </div>

                    <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-[1.5fr_1fr] tw-gap-4">
                        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-5 tw-space-y-4">
                            <div>
                                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Reconciliation summary</h3>
                                <p className="tw-text-sm tw-text-gray-600">Trip groups grouped by persisted reconciliation status for the current filter set.</p>
                            </div>
                            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 xl:tw-grid-cols-6 tw-gap-3">
                                {SUMMARY_STATES.map((item) => (
                                    <div key={item.label} className="tw-rounded-lg tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3">
                                        <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">{item.label}</div>
                                        <div className="tw-mt-1 tw-text-xl tw-font-bold tw-text-slate-900">{reconciliationSummary[item.key] || 0}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-5 tw-space-y-4">
                            <div>
                                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Anomaly review</h3>
                                <p className="tw-text-sm tw-text-gray-600">Flag distribution for the active scope, with fast access to the most urgent trip group.</p>
                            </div>
                            <div className="tw-space-y-2">
                                {anomalyReview.breakdown.length === 0 ? (
                                    <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-text-sm tw-text-slate-500">
                                        No anomaly flags detected in the current result set.
                                    </div>
                                ) : anomalyReview.breakdown.slice(0, 6).map((item) => (
                                    <div key={item.label} className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-rose-100 tw-bg-rose-50 tw-p-3">
                                        <span className="tw-text-sm tw-font-medium tw-text-rose-900">{item.label}</span>
                                        <span className="tw-text-sm tw-font-semibold tw-text-rose-700">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="tw-flex tw-flex-wrap tw-gap-2">
                                {canManageTrips ? (
                                    <Button
                                        text={isRecomputing ? "Recomputing..." : "Re-run selected vehicle"}
                                        icon="fa-light fa-arrows-rotate"
                                        stylingMode="outlined"
                                        disabled={isRecomputing || !selectedVehicleId}
                                        onClick={handleRecomputeSelectedVehicle}
                                    />
                                ) : null}
                                <Button
                                    text="Open first anomaly"
                                    icon="fa-light fa-sidebar"
                                    stylingMode="outlined"
                                    disabled={!anomalyReview.groups.length}
                                    onClick={() => setSelectedTripGroupId(anomalyReview.groups[0]?.vehicleTripGroupId || null)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
                        {loading ? (
                            <div className="tw-flex tw-items-center tw-gap-3 tw-pb-4">
                                <LoadIndicator width="24px" height="24px" visible={true} />
                                <span className="tw-text-sm tw-text-gray-600">Loading trip groups...</span>
                            </div>
                        ) : null}

                        <DataGrid
                            dataSource={filteredTripGroups}
                            keyExpr="vehicleTripGroupId"
                            showBorders={true}
                            rowAlternationEnabled={true}
                            hoverStateEnabled={true}
                            columnAutoWidth={true}
                            noDataText="No persisted trips found for the selected filters."
                            onRowClick={(event) => setSelectedTripGroupId(event?.data?.vehicleTripGroupId || null)}
                        >
                            <Paging defaultPageSize={20} />
                            <FilterRow visible={true} />
                            <SearchPanel visible={true} width={280} placeholder="Search trips..." />

                            <Column dataField="vehicleLabel" caption="Vehicle" minWidth={180} />
                            <Column dataField="tripDate" caption="Trip Date" dataType="date" format="yyyy-MM-dd" minWidth={110} />
                            <Column dataField="startTimeUtc" caption="Start" dataType="datetime" format="yyyy-MM-dd HH:mm" minWidth={150} />
                            <Column dataField="endTimeUtc" caption="End" dataType="datetime" format="yyyy-MM-dd HH:mm" minWidth={150} />
                            <Column dataField="originDisplayName" caption="Origin" minWidth={170} />
                            <Column dataField="destinationDisplayName" caption="Destination" minWidth={170} />
                            <Column caption="Classification" minWidth={220} allowFiltering={false} cellRender={renderClassificationSourceCell} />
                            <Column caption="Plan match" minWidth={130} allowFiltering={false} cellRender={renderPlanMatchCell} />
                            <Column caption="OOB" minWidth={80} alignment="center" allowFiltering={false} cellRender={renderOobCell} />
                            <Column dataField="tripCount" caption="Legs" minWidth={80} alignment="center" />
                            <Column caption="Distance" minWidth={110} allowFiltering={false} cellRender={({ data }) => formatDistance(data.totalDistanceKm)} />
                            <Column caption="Duration" minWidth={110} allowFiltering={false} cellRender={({ data }) => formatDuration(data.totalDurationMinutes)} />
                            <Column caption="Fuel" minWidth={100} allowFiltering={false} cellRender={({ data }) => formatFuel(data.totalFuelConsumed)} />
                            <Column dataField="movementProfileLabel" caption="Profile" minWidth={100} />
                            <Column dataField="detectionMode" caption="Mode" minWidth={100} />
                            <Column
                                caption="Badges"
                                minWidth={320}
                                allowFiltering={false}
                                cellRender={({ data }) => (
                                    <VehicleTripBadgeCluster
                                        status={data.status}
                                        reconciliationStatus={data.reconciliationStatus}
                                        confidenceScore={data.confidenceScore}
                                        confidenceBand={data.confidenceBand}
                                        anomalyFlags={data.anomalyFlags}
                                        compact={true}
                                    />
                                )}
                            />
                            <Column
                                caption="Actions"
                                width={190}
                                allowFiltering={false}
                                cellRender={({ data }) => (
                                    <div className="tw-flex tw-flex-wrap tw-gap-2">
                                        <Button
                                            text="Detail"
                                            icon="fa-light fa-sidebar"
                                            stylingMode="text"
                                            onClick={() => setSelectedTripGroupId(data.vehicleTripGroupId)}
                                        />
                                        <Button
                                            text="Vehicle"
                                            icon="fa-light fa-arrow-up-right-from-square"
                                            stylingMode="text"
                                            onClick={() => handleOpenVehicle(data)}
                                        />
                                    </div>
                                )}
                            />
                        </DataGrid>
                    </div>

                </div>
            )}

            <VehicleTripDetailPanel
                open={selectedTripGroupId != null}
                onClose={() => setSelectedTripGroupId(null)}
                vehicleTripGroupId={selectedTripGroupId}
                canManageTrips={canManageTrips}
                onRecompute={handleRecomputePayload}
                onReconcile={handleReconcilePayload}
                onRequestOverride={(detail) => {
                    setTripDetailForOverride(detail);
                    setIsOverridePanelOpen(true);
                }}
            />

            <VehicleTripOverridePanel
                open={isOverridePanelOpen}
                onClose={() => setIsOverridePanelOpen(false)}
                tripDetail={tripDetailForOverride}
                onOverrideSuccess={async () => {
                    await loadTrips();
                }}
            />
        </div>
    );
};

export default VehicleTripsPage;