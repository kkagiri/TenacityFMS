/**
 * File: CreateGeofenceFromClusterModal.js
 * Purpose: Modal dialog allowing users to create a GPSGate circle geofence from a detected cluster in the preview.
 * Dependencies: React, geofenceService (createGeofence), vehicleTripService (fetchGeofenceGroups).
 * Last Modified: 2026-03-17
 *
 * Key Functions:
 * - CreateGeofenceFromClusterModal(): Renders overlay with pre-populated form from cluster data. Calls existing createGeofence API.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createGeofence } from "../../../../api/geofenceService";
import { fetchGeofenceGroups } from "../services/vehicleTripService";

const CLASSIFICATION_OPTIONS = ["Unknown", "Parking", "Load", "Dump", "Fuel", "Workshop"];

const mapClusterTypeToClassification = (clusterType) => {
    const normalized = (clusterType || "").trim();
    if (CLASSIFICATION_OPTIONS.some((opt) => opt.toLowerCase() === normalized.toLowerCase())) {
        return CLASSIFICATION_OPTIONS.find((opt) => opt.toLowerCase() === normalized.toLowerCase());
    }
    return "Unknown";
};

const CreateGeofenceFromClusterModal = ({ cluster, defaultRadiusMeters = 150, onClose, onCreated }) => {
    const [name, setName] = useState(cluster?.label || "");
    const [description, setDescription] = useState("");
    const [radiusMeters, setRadiusMeters] = useState(defaultRadiusMeters);
    const [classification, setClassification] = useState(() => mapClusterTypeToClassification(cluster?.clusterType));
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const centerLat = useMemo(() => Number(cluster?.latitude), [cluster]);
    const centerLng = useMemo(() => Number(cluster?.longitude), [cluster]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingGroups(true);
            try {
                const result = await fetchGeofenceGroups();
                if (!cancelled) setGroups(result);
            } catch {
                /* groups are optional - user can skip */
            } finally {
                if (!cancelled) setLoadingGroups(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = useCallback(async () => {
        setError("");
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Geofence name is required.");
            return;
        }
        if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
            setError("Invalid cluster coordinates.");
            return;
        }
        const radius = Number(radiusMeters);
        if (!Number.isFinite(radius) || radius <= 0) {
            setError("Radius must be a positive number.");
            return;
        }

        const payload = {
            name: trimmedName,
            description: description.trim() || null,
            geofenceType: "Circle",
            centerLatitude: centerLat,
            centerLongitude: centerLng,
            radiusMeters: radius,
            coordinates: [],
            groupIds: selectedGroupId ? [Number(selectedGroupId)] : [],
            classification: classification || "Unknown",
        };

        setSaving(true);
        try {
            const result = await createGeofence(payload);
            if (result?.success === false) {
                setError(result?.message || "Failed to create geofence.");
                return;
            }
            setSuccess(`Geofence "${trimmedName}" created successfully.`);
            onCreated?.(result?.data ?? result);
            setTimeout(() => onClose?.(), 1200);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to create geofence.");
        } finally {
            setSaving(false);
        }
    }, [name, description, centerLat, centerLng, radiusMeters, classification, selectedGroupId, onClose, onCreated]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget && !saving) onClose?.();
    }, [saving, onClose]);

    if (!cluster) return null;

    return (
        <div
            className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-black/40"
            onClick={handleBackdropClick}
        >
            <div className="tw-w-full tw-max-w-[420px] tw-rounded-lg tw-border tw-border-[#edebe9] tw-bg-white tw-shadow-xl">
                {/* Header */}
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-[#edebe9] tw-px-5 tw-py-3">
                    <h3 className="tw-text-[15px] tw-font-semibold tw-text-[#201f1e]">
                        <i className="fa-light fa-draw-polygon tw-mr-2 tw-text-[#0078d4]" />
                        Create geofence from cluster
                    </h3>
                    <button
                        type="button"
                        onClick={() => !saving && onClose?.()}
                        className="tw-flex tw-h-[28px] tw-w-[28px] tw-items-center tw-justify-center tw-rounded tw-text-[#a19f9d] hover:tw-bg-[#f3f2f1] hover:tw-text-[#201f1e]"
                    >
                        <i className="fa-light fa-xmark" />
                    </button>
                </div>

                {/* Body */}
                <div className="tw-space-y-3 tw-px-5 tw-py-4">
                    {error && (
                        <div className="tw-rounded tw-border tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-[12px] tw-text-[#d13438]">
                            <i className="fa-light fa-circle-exclamation tw-mr-1" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="tw-rounded tw-border tw-border-green-200 tw-bg-green-50 tw-px-3 tw-py-2 tw-text-[12px] tw-text-[#107c10]">
                            <i className="fa-light fa-circle-check tw-mr-1" />
                            {success}
                        </div>
                    )}

                    {/* Cluster info badge */}
                    <div className="tw-flex tw-items-center tw-gap-2 tw-rounded tw-border tw-border-[#edebe9] tw-bg-[#faf9f8] tw-px-3 tw-py-2">
                        <i className="fa-light fa-circle-nodes tw-text-[#0078d4]" />
                        <span className="tw-text-[12px] tw-text-[#605e5c]">
                            Cluster <span className="tw-font-semibold tw-text-[#201f1e]">{cluster.label || `#${cluster.clusterId}`}</span>
                            {" · "}
                            {cluster.visitCount} visit{cluster.visitCount !== 1 ? "s" : ""}
                            {" · "}
                            {Number(centerLat).toFixed(6)}, {Number(centerLng).toFixed(6)}
                        </span>
                    </div>

                    {/* Name */}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Name</span>
                        <input
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(""); }}
                            disabled={saving || !!success}
                            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4] disabled:tw-bg-[#f3f2f1] disabled:tw-text-[#a19f9d]"
                            placeholder="e.g. Loading Area A"
                        />
                    </label>

                    {/* Classification */}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Classification</span>
                        <select
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                            disabled={saving || !!success}
                            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4] disabled:tw-bg-[#f3f2f1] disabled:tw-text-[#a19f9d]"
                        >
                            {CLASSIFICATION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>

                    {/* Radius */}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Radius (meters)</span>
                        <input
                            type="number"
                            min="1"
                            step="10"
                            value={radiusMeters}
                            onChange={(e) => { setRadiusMeters(e.target.value === "" ? "" : Number(e.target.value)); setError(""); }}
                            disabled={saving || !!success}
                            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4] disabled:tw-bg-[#f3f2f1] disabled:tw-text-[#a19f9d]"
                        />
                    </label>

                    {/* Group */}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Geofence group</span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            disabled={saving || !!success || loadingGroups}
                            className="tw-h-[32px] tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4] disabled:tw-bg-[#f3f2f1] disabled:tw-text-[#a19f9d]"
                        >
                            <option value="">{loadingGroups ? "Loading groups..." : "No group (optional)"}</option>
                            {groups.map((g) => (
                                <option key={g.groupId ?? g.id ?? g.Id} value={g.groupId ?? g.id ?? g.Id}>
                                    {g.groupName ?? g.name ?? g.Name ?? `Group ${g.groupId ?? g.id}`}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Description */}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-[12px] tw-font-medium tw-text-[#605e5c]">Description</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            disabled={saving || !!success}
                            className="tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-2.5 tw-py-1.5 tw-text-[13px] tw-text-[#201f1e] focus:tw-border-[#0078d4] focus:tw-outline-none focus:tw-shadow-[0_0_0_1px_#0078d4] disabled:tw-bg-[#f3f2f1] disabled:tw-text-[#a19f9d]"
                            placeholder="Optional operational notes"
                        />
                    </label>

                    {/* Coordinate preview */}
                    <div className="tw-rounded tw-border tw-border-[#edebe9] tw-bg-[#faf9f8] tw-p-2.5">
                        <div className="tw-mb-1.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-[#605e5c]">
                            GPSGate payload preview
                        </div>
                        <div className="tw-grid tw-grid-cols-[80px,1fr] tw-gap-x-2 tw-gap-y-1 tw-text-[12px]">
                            <span className="tw-text-[#605e5c]">Type</span>
                            <span className="tw-font-medium tw-text-[#201f1e]">Circle</span>
                            <span className="tw-text-[#605e5c]">Latitude</span>
                            <span className="tw-font-medium tw-text-[#201f1e]">{Number(centerLat).toFixed(6)}</span>
                            <span className="tw-text-[#605e5c]">Longitude</span>
                            <span className="tw-font-medium tw-text-[#201f1e]">{Number(centerLng).toFixed(6)}</span>
                            <span className="tw-text-[#605e5c]">Radius</span>
                            <span className="tw-font-medium tw-text-[#201f1e]">{Number(radiusMeters) > 0 ? `${Math.round(Number(radiusMeters))} m` : "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="tw-flex tw-justify-end tw-gap-2 tw-border-t tw-border-[#edebe9] tw-px-5 tw-py-3">
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        disabled={saving}
                        className="tw-inline-flex tw-h-[32px] tw-items-center tw-gap-1.5 tw-rounded-[4px] tw-border tw-border-[#c8c6c4] tw-bg-white tw-px-4 tw-text-[13px] tw-font-medium tw-text-[#323130] hover:tw-bg-[#f3f2f1] disabled:tw-opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving || !!success}
                        className="tw-inline-flex tw-h-[32px] tw-items-center tw-gap-1.5 tw-rounded-[4px] tw-bg-[#0078d4] tw-px-4 tw-text-[13px] tw-font-medium tw-text-white hover:tw-bg-[#106ebe] disabled:tw-opacity-40"
                    >
                        {saving ? (
                            <>
                                <i className="fa-light fa-spinner-third tw-animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <i className="fa-light fa-draw-polygon" />
                                Create geofence
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGeofenceFromClusterModal;
