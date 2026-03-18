/**
 * File: VehicleTripOverridePanel.js
 * Purpose: M365 admin side panel for staging trip override requests and exposing mandatory governance fields.
 * Dependencies: React, SlidePanel, notify, vehicleTripUi helpers, vehicleTripService API.
 * Last Modified: 2026-03-13
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../../components/ui/SlidePanel";
import {
    buildDateTimeLocalValue,
    formatDateTime,
    parseDateTimeLocalValue,
} from "../utils/vehicleTripUi";
import {
    splitVehicleTrip,
    mergeVehicleTrips,
    reassignVehicleTripSite,
    addVehicleTrip,
    deleteVehicleTrip,
    adjustVehicleTripTimes,
    fetchVehicleTripOverrideHistory,
    fetchTripSiteLookup,
} from "../services/vehicleTripService";
import VehicleTripRouteMap from "./VehicleTripRouteMap";
import "./VehicleTripOverridePanel.scss";

const OVERRIDE_ACTIONS = [
    { key: "split", label: "Split trip", icon: "fa-light fa-code-commit" },
    { key: "merge", label: "Merge trips", icon: "fa-light fa-link" },
    { key: "reassign", label: "Reassign site", icon: "fa-light fa-location-dot" },
    { key: "add", label: "Add trip", icon: "fa-light fa-plus" },
    { key: "delete", label: "Delete trip", icon: "fa-light fa-trash" },
    { key: "adjust", label: "Adjust times", icon: "fa-light fa-clock" },
];

const ACTION_LABEL_MAP = {
    Split: "Split",
    Merge: "Merge",
    ReassignSite: "Reassign site",
    Add: "Add",
    Delete: "Delete",
    AdjustTimes: "Adjust times",
    0: "Split",
    1: "Merge",
    2: "Reassign site",
    3: "Add",
    4: "Delete",
    5: "Adjust times",
};

const buildInitialFormState = (tripDetail) => ({
    splitAt: buildDateTimeLocalValue(tripDetail?.startTimeUtc),
    splitLegId: tripDetail?.trips?.[0]?.vehicleTripId ? String(tripDetail.trips[0].vehicleTripId) : "",
    splitLatitude: "",
    splitLongitude: "",
    mergePrimaryLegId: tripDetail?.trips?.[0]?.vehicleTripId ? String(tripDetail.trips[0].vehicleTripId) : "",
    mergeSecondaryLegId: tripDetail?.trips?.[1]?.vehicleTripId ? String(tripDetail.trips[1].vehicleTripId) : "",
    originSiteId: tripDetail?.originSiteId ?? null,
    destinationSiteId: tripDetail?.destinationSiteId ?? null,
    addStartTime: buildDateTimeLocalValue(tripDetail?.startTimeUtc),
    addEndTime: buildDateTimeLocalValue(tripDetail?.endTimeUtc),
    addOriginSiteId: tripDetail?.originSiteId ?? null,
    addDestinationSiteId: tripDetail?.destinationSiteId ?? null,
    addStartLatitude: "",
    addStartLongitude: "",
    addEndLatitude: "",
    addEndLongitude: "",
    adjustLegId: tripDetail?.trips?.[0]?.vehicleTripId ? String(tripDetail.trips[0].vehicleTripId) : "",
    adjustStartTime: buildDateTimeLocalValue(tripDetail?.startTimeUtc),
    adjustEndTime: buildDateTimeLocalValue(tripDetail?.endTimeUtc),
    reason: "",
    needsSupervisorApproval: tripDetail?.status === 2 || tripDetail?.status === "Completed",
});

const buildOverridePayload = (activeAction, formState, tripDetail) => {
    const base = {
        reason: formState.reason,
        supervisorApproval: formState.needsSupervisorApproval ? { approved: false } : null,
    };

    const firstLegId = tripDetail?.trips?.[0]?.vehicleTripId || 0;

    switch (activeAction) {
        case "split":
            return {
                ...base,
                vehicleTripGroupId: tripDetail.vehicleTripGroupId,
                vehicleTripId: Number(formState.splitLegId) || firstLegId,
                splitTimeUtc: parseDateTimeLocalValue(formState.splitAt)?.toISOString() || null,
                splitLatitude: formState.splitLatitude === "" ? null : Number(formState.splitLatitude),
                splitLongitude: formState.splitLongitude === "" ? null : Number(formState.splitLongitude),
            };
        case "merge":
            return {
                ...base,
                vehicleTripGroupId: tripDetail.vehicleTripGroupId,
                primaryVehicleTripId: Number(formState.mergePrimaryLegId) || 0,
                secondaryVehicleTripId: Number(formState.mergeSecondaryLegId) || 0,
            };
        case "reassign":
            return {
                ...base,
                vehicleTripGroupId: tripDetail.vehicleTripGroupId,
                overrideOriginSiteId: Number(formState.originSiteId) || null,
                overrideDestinationSiteId: Number(formState.destinationSiteId) || null,
            };
        case "add":
            return {
                ...base,
                vehicleId: tripDetail.vehicleId,
                startTimeUtc: parseDateTimeLocalValue(formState.addStartTime)?.toISOString() || null,
                endTimeUtc: parseDateTimeLocalValue(formState.addEndTime)?.toISOString() || null,
                originSiteId: Number(formState.addOriginSiteId) || null,
                destinationSiteId: Number(formState.addDestinationSiteId) || null,
                startLatitude: Number(formState.addStartLatitude),
                startLongitude: Number(formState.addStartLongitude),
                endLatitude: Number(formState.addEndLatitude),
                endLongitude: Number(formState.addEndLongitude),
                distanceKm: 0,
            };
        case "delete":
            return {
                ...base,
                vehicleTripGroupId: tripDetail.vehicleTripGroupId,
            };
        case "adjust":
            return {
                ...base,
                vehicleTripGroupId: tripDetail.vehicleTripGroupId,
                vehicleTripId: Number(formState.adjustLegId) || firstLegId,
                overrideStartTimeUtc: parseDateTimeLocalValue(formState.adjustStartTime)?.toISOString() || null,
                overrideEndTimeUtc: parseDateTimeLocalValue(formState.adjustEndTime)?.toISOString() || null,
            };
        default:
            return base;
    }
};

const getOverrideServiceFn = (activeAction) => {
    switch (activeAction) {
        case "split": return splitVehicleTrip;
        case "merge": return mergeVehicleTrips;
        case "reassign": return reassignVehicleTripSite;
        case "add": return addVehicleTrip;
        case "delete": return deleteVehicleTrip;
        case "adjust": return adjustVehicleTripTimes;
        default: return null;
    }
};

const Field = ({ label, children, hint }) => (
    <label className="vehicle-trip-override-panel__field">
        <span className="vehicle-trip-override-panel__label">{label}</span>
        {children}
        {hint ? <span className="vehicle-trip-override-panel__hint">{hint}</span> : null}
    </label>
);

const VehicleTripOverridePanel = ({ open, onClose, tripDetail, onOverrideSuccess }) => {
    const [activeAction, setActiveAction] = useState("split");
    const [formState, setFormState] = useState(buildInitialFormState(tripDetail));
    const [mapInteractionMode, setMapInteractionMode] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [overrideHistory, setOverrideHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [siteOptions, setSiteOptions] = useState([]);
    const [isLoadingSites, setIsLoadingSites] = useState(false);

    useEffect(() => {
        if (open) {
            setActiveAction("split");
            setFormState(buildInitialFormState(tripDetail));
            setMapInteractionMode(null);
            setIsSubmitting(false);
        }
    }, [open, tripDetail]);

    useEffect(() => {
        setMapInteractionMode(null);
    }, [activeAction]);

    const loadOverrideHistory = useCallback(async () => {
        if (!tripDetail?.vehicleTripGroupId) {
            setOverrideHistory([]);
            return;
        }

        setIsLoadingHistory(true);
        try {
            const history = await fetchVehicleTripOverrideHistory(tripDetail.vehicleTripGroupId);
            setOverrideHistory(history);
        } catch {
            setOverrideHistory([]);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [tripDetail?.vehicleTripGroupId]);

    useEffect(() => {
        if (open && tripDetail?.vehicleTripGroupId) {
            loadOverrideHistory();
        }
    }, [open, tripDetail?.vehicleTripGroupId, loadOverrideHistory]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        let disposed = false;

        const loadSites = async () => {
            try {
                setIsLoadingSites(true);
                const sites = await fetchTripSiteLookup();
                if (!disposed) {
                    setSiteOptions(sites);
                }
            } catch {
                if (!disposed) {
                    setSiteOptions([]);
                }
            } finally {
                if (!disposed) {
                    setIsLoadingSites(false);
                }
            }
        };

        loadSites();

        return () => {
            disposed = true;
        };
    }, [open]);

    const setField = (field, value) => {
        setFormState((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleMapSelection = useCallback((selection) => {
        if (!selection) {
            return;
        }

        if (activeAction === "split" && mapInteractionMode === "split") {
            setFormState((current) => ({
                ...current,
                splitLatitude: selection.latitude != null ? String(selection.latitude) : current.splitLatitude,
                splitLongitude: selection.longitude != null ? String(selection.longitude) : current.splitLongitude,
                splitAt: selection.estimatedTimeUtc ? buildDateTimeLocalValue(selection.estimatedTimeUtc) : current.splitAt,
                splitLegId: selection.vehicleTripId ? String(selection.vehicleTripId) : current.splitLegId,
            }));
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "adjust" && mapInteractionMode === "adjust-start") {
            setFormState((current) => ({
                ...current,
                adjustStartTime: selection.estimatedTimeUtc ? buildDateTimeLocalValue(selection.estimatedTimeUtc) : current.adjustStartTime,
                adjustLegId: selection.vehicleTripId ? String(selection.vehicleTripId) : current.adjustLegId,
            }));
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "adjust" && mapInteractionMode === "adjust-end") {
            setFormState((current) => ({
                ...current,
                adjustEndTime: selection.estimatedTimeUtc ? buildDateTimeLocalValue(selection.estimatedTimeUtc) : current.adjustEndTime,
                adjustLegId: selection.vehicleTripId ? String(selection.vehicleTripId) : current.adjustLegId,
            }));
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "reassign" && mapInteractionMode === "reassign-origin" && selection.siteId) {
            setField("originSiteId", selection.siteId);
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "reassign" && mapInteractionMode === "reassign-destination" && selection.siteId) {
            setField("destinationSiteId", selection.siteId);
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "add" && mapInteractionMode === "add-start") {
            setFormState((current) => ({
                ...current,
                addOriginSiteId: selection.siteId ?? current.addOriginSiteId,
                addStartLatitude: selection.latitude != null ? String(selection.latitude) : current.addStartLatitude,
                addStartLongitude: selection.longitude != null ? String(selection.longitude) : current.addStartLongitude,
            }));
            setMapInteractionMode(null);
            return;
        }

        if (activeAction === "add" && mapInteractionMode === "add-end") {
            setFormState((current) => ({
                ...current,
                addDestinationSiteId: selection.siteId ?? current.addDestinationSiteId,
                addEndLatitude: selection.latitude != null ? String(selection.latitude) : current.addEndLatitude,
                addEndLongitude: selection.longitude != null ? String(selection.longitude) : current.addEndLongitude,
            }));
            setMapInteractionMode(null);
        }
    }, [activeAction, mapInteractionMode]);

    const syncSiteCoordinates = useCallback((siteId, prefix) => {
        const matchedSite = siteOptions.find((site) => Number(site.siteId) === Number(siteId));

        if (prefix === "origin") {
            setFormState((current) => ({
                ...current,
                addOriginSiteId: siteId ?? null,
                addStartLatitude: matchedSite?.gpsGeofenceCenterLatitude ?? current.addStartLatitude,
                addStartLongitude: matchedSite?.gpsGeofenceCenterLongitude ?? current.addStartLongitude,
            }));
            return;
        }

        setFormState((current) => ({
            ...current,
            addDestinationSiteId: siteId ?? null,
            addEndLatitude: matchedSite?.gpsGeofenceCenterLatitude ?? current.addEndLatitude,
            addEndLongitude: matchedSite?.gpsGeofenceCenterLongitude ?? current.addEndLongitude,
        }));
    }, [siteOptions]);

    const legOptions = useMemo(() => {
        return Array.isArray(tripDetail?.trips)
            ? tripDetail.trips.map((leg) => ({
                value: String(leg.vehicleTripId),
                label: `Leg ${leg.sequenceNo}: ${leg.originDisplayName} → ${leg.destinationDisplayName}`,
            }))
            : [];
    }, [tripDetail]);

    const selectedMapLegId = useMemo(() => {
        if (activeAction === "split") {
            return Number(formState.splitLegId) || null;
        }

        if (activeAction === "adjust") {
            return Number(formState.adjustLegId) || null;
        }

        return null;
    }, [activeAction, formState.adjustLegId, formState.splitLegId]);

    const mapInstruction = useMemo(() => {
        switch (mapInteractionMode) {
            case "split":
                return "Click the selected leg on the map to derive the split coordinates and split timestamp.";
            case "adjust-start":
                return "Click the selected leg to estimate a new departure time from route geometry.";
            case "adjust-end":
                return "Click the selected leg to estimate a new arrival time from route geometry.";
            case "reassign-origin":
                return "Click a site marker to assign the new origin site.";
            case "reassign-destination":
                return "Click a site marker to assign the new destination site.";
            case "add-start":
                return "Click the map or a site marker to choose the new trip start point.";
            case "add-end":
                return "Click the map or a site marker to choose the new trip end point.";
            default:
                return "Use the map tools below to populate timestamps, coordinates, and site selections from route geometry.";
        }
    }, [mapInteractionMode]);

    const payloadPreview = useMemo(() => {
        if (!tripDetail) {
            return null;
        }

        return {
            tripGroupId: tripDetail.vehicleTripGroupId,
            action: activeAction,
            reason: formState.reason,
            supervisorApprovalRequired: Boolean(formState.needsSupervisorApproval),
            requestedChanges:
                activeAction === "split"
                    ? { splitAtUtc: parseDateTimeLocalValue(formState.splitAt)?.toISOString() || null }
                    : activeAction === "merge"
                        ? {
                            primaryVehicleTripId: Number(formState.mergePrimaryLegId || 0) || null,
                            secondaryVehicleTripId: Number(formState.mergeSecondaryLegId || 0) || null,
                        }
                        : activeAction === "reassign"
                            ? {
                                overrideOriginSiteId: Number(formState.originSiteId || 0) || null,
                                overrideDestinationSiteId: Number(formState.destinationSiteId || 0) || null,
                            }
                            : activeAction === "add"
                                ? {
                                    startTimeUtc: parseDateTimeLocalValue(formState.addStartTime)?.toISOString() || null,
                                    endTimeUtc: parseDateTimeLocalValue(formState.addEndTime)?.toISOString() || null,
                                    originSiteId: Number(formState.addOriginSiteId || 0) || null,
                                    destinationSiteId: Number(formState.addDestinationSiteId || 0) || null,
                                    startLatitude: Number(formState.addStartLatitude || 0),
                                    startLongitude: Number(formState.addStartLongitude || 0),
                                    endLatitude: Number(formState.addEndLatitude || 0),
                                    endLongitude: Number(formState.addEndLongitude || 0),
                                }
                                : activeAction === "delete"
                                    ? { deleteTripGroupId: tripDetail.vehicleTripGroupId }
                                    : {
                                        adjustedStartTimeUtc: parseDateTimeLocalValue(formState.adjustStartTime)?.toISOString() || null,
                                        adjustedEndTimeUtc: parseDateTimeLocalValue(formState.adjustEndTime)?.toISOString() || null,
                                    },
        };
    }, [activeAction, formState, tripDetail]);

    const canSubmit = useMemo(() => {
        if (!formState.reason.trim()) {
            return false;
        }

        if (activeAction === "merge") {
            return Boolean(formState.mergePrimaryLegId && formState.mergeSecondaryLegId && formState.mergePrimaryLegId !== formState.mergeSecondaryLegId);
        }

        if (activeAction === "reassign") {
            return Boolean(formState.originSiteId || formState.destinationSiteId);
        }

        if (activeAction === "add") {
            return Boolean(
                formState.addStartTime &&
                formState.addEndTime &&
                formState.addOriginSiteId &&
                formState.addDestinationSiteId &&
                formState.addStartLatitude !== "" &&
                formState.addStartLongitude !== "" &&
                formState.addEndLatitude !== "" &&
                formState.addEndLongitude !== ""
            );
        }

        if (activeAction === "adjust") {
            return Boolean(formState.adjustLegId && formState.adjustStartTime && formState.adjustEndTime);
        }

        if (activeAction === "split") {
            return Boolean(formState.splitLegId && formState.splitAt);
        }

        return true;
    }, [activeAction, formState]);

    const renderMapTools = () => {
        switch (activeAction) {
            case "split":
                return (
                    <div className="vehicle-trip-override-panel__map-toolbar">
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "split" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "split" ? null : "split")}
                        >
                            <i className="fa-light fa-crosshairs-simple" />
                            <span>Pick split point</span>
                        </button>
                    </div>
                );
            case "adjust":
                return (
                    <div className="vehicle-trip-override-panel__map-toolbar">
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "adjust-start" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "adjust-start" ? null : "adjust-start")}
                        >
                            <i className="fa-light fa-play" />
                            <span>Pick start</span>
                        </button>
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "adjust-end" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "adjust-end" ? null : "adjust-end")}
                        >
                            <i className="fa-light fa-flag-checkered" />
                            <span>Pick end</span>
                        </button>
                    </div>
                );
            case "reassign":
                return (
                    <div className="vehicle-trip-override-panel__map-toolbar">
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "reassign-origin" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "reassign-origin" ? null : "reassign-origin")}
                        >
                            <i className="fa-light fa-location-dot" />
                            <span>Pick origin site</span>
                        </button>
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "reassign-destination" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "reassign-destination" ? null : "reassign-destination")}
                        >
                            <i className="fa-light fa-location-dot" />
                            <span>Pick destination site</span>
                        </button>
                    </div>
                );
            case "add":
                return (
                    <div className="vehicle-trip-override-panel__map-toolbar">
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "add-start" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "add-start" ? null : "add-start")}
                        >
                            <i className="fa-light fa-play" />
                            <span>Pick start point</span>
                        </button>
                        <button
                            type="button"
                            className={`vehicle-trip-override-panel__map-toolbar-btn${mapInteractionMode === "add-end" ? " vehicle-trip-override-panel__map-toolbar-btn--active" : ""}`}
                            onClick={() => setMapInteractionMode((current) => current === "add-end" ? null : "add-end")}
                        >
                            <i className="fa-light fa-flag-checkered" />
                            <span>Pick end point</span>
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) {
            if (!canSubmit) {
                notify("Complete the mandatory fields before submitting the override", "warning", 3000);
            }
            return;
        }

        const serviceFn = getOverrideServiceFn(activeAction);
        if (!serviceFn) {
            notify("Unknown override action", "error", 3000);
            return;
        }

        const payload = buildOverridePayload(activeAction, formState, tripDetail);

        setIsSubmitting(true);
        try {
            await serviceFn(payload);
            notify("Override applied successfully", "success", 3000);
            if (onOverrideSuccess) {
                onOverrideSuccess();
            }
            onClose();
        } catch (error) {
            notify(error?.message || "Override request failed", "error", 4500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderActionFields = () => {
        switch (activeAction) {
            case "merge":
                return (
                    <div className="vehicle-trip-override-panel__field-grid">
                        <Field label="Primary leg">
                            <select
                                className="vehicle-trip-override-panel__select"
                                value={formState.mergePrimaryLegId}
                                onChange={(event) => setField("mergePrimaryLegId", event.target.value)}
                            >
                                <option value="">Select a leg</option>
                                {legOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Secondary leg">
                            <select
                                className="vehicle-trip-override-panel__select"
                                value={formState.mergeSecondaryLegId}
                                onChange={(event) => setField("mergeSecondaryLegId", event.target.value)}
                            >
                                <option value="">Select a leg</option>
                                {legOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                );
            case "reassign":
                return (
                    <div className="vehicle-trip-override-panel__field-grid">
                        <Field label="Origin site" hint="Choose a persisted site for the trip origin.">
                            <SelectBox
                                dataSource={siteOptions}
                                valueExpr="siteId"
                                displayExpr="label"
                                value={formState.originSiteId}
                                onValueChanged={(event) => setField("originSiteId", event.value)}
                                searchEnabled={true}
                                showClearButton={true}
                                placeholder={isLoadingSites ? "Loading sites..." : "Select origin site"}
                            />
                        </Field>
                        <Field label="Destination site" hint="Choose a persisted site for the trip destination.">
                            <SelectBox
                                dataSource={siteOptions}
                                valueExpr="siteId"
                                displayExpr="label"
                                value={formState.destinationSiteId}
                                onValueChanged={(event) => setField("destinationSiteId", event.value)}
                                searchEnabled={true}
                                showClearButton={true}
                                placeholder={isLoadingSites ? "Loading sites..." : "Select destination site"}
                            />
                        </Field>
                    </div>
                );
            case "add":
                return (
                    <div className="vehicle-trip-override-panel__field-grid">
                        <Field label="Departure time">
                            <input
                                type="datetime-local"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addStartTime}
                                onChange={(event) => setField("addStartTime", event.target.value)}
                            />
                        </Field>
                        <Field label="Arrival time">
                            <input
                                type="datetime-local"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addEndTime}
                                onChange={(event) => setField("addEndTime", event.target.value)}
                            />
                        </Field>
                        <Field label="Origin site" hint="Selecting a site pre-fills stored geofence centre coordinates when available.">
                            <SelectBox
                                dataSource={siteOptions}
                                valueExpr="siteId"
                                displayExpr="label"
                                value={formState.addOriginSiteId}
                                onValueChanged={(event) => syncSiteCoordinates(event.value, "origin")}
                                searchEnabled={true}
                                showClearButton={true}
                                placeholder={isLoadingSites ? "Loading sites..." : "Select origin site"}
                            />
                        </Field>
                        <Field label="Destination site" hint="Selecting a site pre-fills stored geofence centre coordinates when available.">
                            <SelectBox
                                dataSource={siteOptions}
                                valueExpr="siteId"
                                displayExpr="label"
                                value={formState.addDestinationSiteId}
                                onValueChanged={(event) => syncSiteCoordinates(event.value, "destination")}
                                searchEnabled={true}
                                showClearButton={true}
                                placeholder={isLoadingSites ? "Loading sites..." : "Select destination site"}
                            />
                        </Field>
                        <Field label="Origin latitude">
                            <input
                                type="number"
                                step="0.000001"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addStartLatitude}
                                onChange={(event) => setField("addStartLatitude", event.target.value)}
                            />
                        </Field>
                        <Field label="Origin longitude">
                            <input
                                type="number"
                                step="0.000001"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addStartLongitude}
                                onChange={(event) => setField("addStartLongitude", event.target.value)}
                            />
                        </Field>
                        <Field label="Destination latitude">
                            <input
                                type="number"
                                step="0.000001"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addEndLatitude}
                                onChange={(event) => setField("addEndLatitude", event.target.value)}
                            />
                        </Field>
                        <Field label="Destination longitude">
                            <input
                                type="number"
                                step="0.000001"
                                className="vehicle-trip-override-panel__input"
                                value={formState.addEndLongitude}
                                onChange={(event) => setField("addEndLongitude", event.target.value)}
                            />
                        </Field>
                    </div>
                );
            case "adjust":
                return (
                    <div className="vehicle-trip-override-panel__field-grid">
                        <Field label="Target leg" hint="Select the leg whose start and end times will be adjusted.">
                            <select
                                className="vehicle-trip-override-panel__select"
                                value={formState.adjustLegId}
                                onChange={(event) => setField("adjustLegId", event.target.value)}
                            >
                                <option value="">Select a leg</option>
                                {legOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Adjusted departure time">
                            <input
                                type="datetime-local"
                                className="vehicle-trip-override-panel__input"
                                value={formState.adjustStartTime}
                                onChange={(event) => setField("adjustStartTime", event.target.value)}
                            />
                        </Field>
                        <Field label="Adjusted arrival time">
                            <input
                                type="datetime-local"
                                className="vehicle-trip-override-panel__input"
                                value={formState.adjustEndTime}
                                onChange={(event) => setField("adjustEndTime", event.target.value)}
                            />
                        </Field>
                    </div>
                );
            case "delete":
                return (
                    <div className="vehicle-trip-override-panel__notice vehicle-trip-override-panel__notice--danger">
                        <i className="fa-light fa-triangle-exclamation" />
                        <span>Deleting a trip keeps the original record for audit and marks it as superseded.</span>
                    </div>
                );
            case "split":
            default:
                return (
                    <div className="vehicle-trip-override-panel__field-grid">
                        <Field label="Target leg" hint="Select the leg to split. The map will target this segment.">
                            <select
                                className="vehicle-trip-override-panel__select"
                                value={formState.splitLegId}
                                onChange={(event) => setField("splitLegId", event.target.value)}
                            >
                                <option value="">Select a leg</option>
                                {legOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Split point" hint="Click the route on the map or enter the exact split time manually.">
                            <input
                                type="datetime-local"
                                className="vehicle-trip-override-panel__input"
                                value={formState.splitAt}
                                onChange={(event) => setField("splitAt", event.target.value)}
                            />
                        </Field>
                    </div>
                );
        }
    };

    const renderAuditTrail = () => {
        if (isLoadingHistory) {
            return (
                <div className="vehicle-trip-override-panel__audit-empty">
                    <i className="fa-light fa-spinner fa-spin" />
                    <span>Loading override history...</span>
                </div>
            );
        }

        if (!overrideHistory.length) {
            return (
                <div className="vehicle-trip-override-panel__audit-empty">
                    <i className="fa-light fa-clock-rotate-left" />
                    <span>No override history recorded for this trip.</span>
                </div>
            );
        }

        return (
            <div className="vehicle-trip-override-panel__audit-list">
                {overrideHistory.map((entry) => (
                    <div key={entry.auditId} className="vehicle-trip-override-panel__audit-entry">
                        <div className="vehicle-trip-override-panel__audit-header">
                            <span className="vehicle-trip-override-panel__audit-action">
                                {ACTION_LABEL_MAP[entry.action] || String(entry.action)}
                            </span>
                            <span className="vehicle-trip-override-panel__audit-time">
                                {formatDateTime(entry.requestedAtUtc)}
                            </span>
                        </div>
                        <div className="vehicle-trip-override-panel__audit-meta">
                            <span>{entry.requestedByName || entry.requestedByUserId || "System"}</span>
                            {entry.requiredSupervisorApproval && (
                                <span className="vehicle-trip-override-panel__audit-badge">Supervisor approval</span>
                            )}
                        </div>
                        {entry.reason && (
                            <p className="vehicle-trip-override-panel__audit-reason">{entry.reason}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Trip override"
            width="min(620px, 94vw)"
            panelClassName="vehicle-trip-override-panel-shell"
        >
            <div className="vehicle-trip-override-panel">
                {!tripDetail ? (
                    <div className="vehicle-trip-override-panel__empty">
                        <i className="fa-light fa-split" />
                        <span>Open a trip detail first, then choose an override action.</span>
                    </div>
                ) : (
                    <>
                        <section className="vehicle-trip-override-panel__summary">
                            <span className="vehicle-trip-override-panel__eyebrow">Manual override</span>
                            <h3>
                                {tripDetail.originDisplayName} <span>→</span> {tripDetail.destinationDisplayName}
                            </h3>
                            <p>{formatDateTime(tripDetail.startTimeUtc)} to {formatDateTime(tripDetail.endTimeUtc)}</p>
                        </section>

                        <section className="vehicle-trip-override-panel__section">
                            <div className="vehicle-trip-override-panel__section-header">
                                <h4>Override action</h4>
                                <p>All actions require a reason and keep the auto-detected record intact.</p>
                            </div>
                            <div className="vehicle-trip-override-panel__action-list">
                                {OVERRIDE_ACTIONS.map((action) => (
                                    <button
                                        key={action.key}
                                        type="button"
                                        className={`vehicle-trip-override-panel__action${activeAction === action.key ? " vehicle-trip-override-panel__action--active" : ""}`}
                                        onClick={() => setActiveAction(action.key)}
                                    >
                                        <i className={action.icon} />
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="vehicle-trip-override-panel__map-section">
                                <div className="vehicle-trip-override-panel__section-header">
                                    <div>
                                        <h4>Map editor</h4>
                                        <p>{mapInstruction}</p>
                                    </div>
                                </div>
                                {renderMapTools()}
                                <VehicleTripRouteMap
                                    vehicleTripGroupId={tripDetail.vehicleTripGroupId}
                                    trips={tripDetail.trips}
                                    editable={true}
                                    interactionMode={mapInteractionMode}
                                    selectedLegId={selectedMapLegId}
                                    siteOptions={siteOptions}
                                    onSelectionChange={handleMapSelection}
                                />
                                <div className="vehicle-trip-override-panel__map-status">
                                    {mapInteractionMode
                                        ? `Map tool active: ${mapInteractionMode}`
                                        : "Map tool idle. Choose a map action to populate fields from route geometry or site markers."}
                                </div>
                            </div>

                            <div className="vehicle-trip-override-panel__form">
                                {renderActionFields()}

                                <Field label="Reason" hint="Mandatory for audit trail and supervisor review.">
                                    <textarea
                                        className="vehicle-trip-override-panel__textarea"
                                        rows={4}
                                        value={formState.reason}
                                        onChange={(event) => setField("reason", event.target.value)}
                                        placeholder="Describe why the trip must be corrected"
                                    />
                                </Field>

                                <label className="vehicle-trip-override-panel__checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formState.needsSupervisorApproval)}
                                        onChange={(event) => setField("needsSupervisorApproval", event.target.checked)}
                                    />
                                    <span>Supervisor approval workflow required for completed-period overrides</span>
                                </label>
                            </div>
                        </section>

                        <section className="vehicle-trip-override-panel__section">
                            <div className="vehicle-trip-override-panel__section-header">
                                <h4>Override audit trail</h4>
                                <p>History of manual corrections applied to this trip.</p>
                            </div>
                            {renderAuditTrail()}
                        </section>

                        <section className="vehicle-trip-override-panel__section">
                            <div className="vehicle-trip-override-panel__section-header">
                                <h4>Command preview</h4>
                                <p>Payload that will be sent to the override endpoint.</p>
                            </div>
                            <div className="vehicle-trip-override-panel__preview-grid">
                                <div>
                                    <span className="vehicle-trip-override-panel__label">Trip group</span>
                                    <span className="vehicle-trip-override-panel__value">{payloadPreview?.tripGroupId || "—"}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-override-panel__label">Action</span>
                                    <span className="vehicle-trip-override-panel__value">{payloadPreview?.action || "—"}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-override-panel__label">Reason</span>
                                    <span className="vehicle-trip-override-panel__value">{payloadPreview?.reason || "—"}</span>
                                </div>
                                <div>
                                    <span className="vehicle-trip-override-panel__label">Supervisor approval</span>
                                    <span className="vehicle-trip-override-panel__value">{payloadPreview?.supervisorApprovalRequired ? "Required" : "Not required"}</span>
                                </div>
                            </div>
                        </section>

                        <div className="vehicle-trip-override-panel__footer">
                            <button type="button" className="vehicle-trip-override-panel__btn vehicle-trip-override-panel__btn--ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="vehicle-trip-override-panel__btn vehicle-trip-override-panel__btn--primary"
                                onClick={handleSubmit}
                                disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit override"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </SlidePanel>
    );
};

export default VehicleTripOverridePanel;
