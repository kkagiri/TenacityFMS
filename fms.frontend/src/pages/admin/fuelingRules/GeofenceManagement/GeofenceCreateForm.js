/**
 * File: GeofenceCreateForm.js
 * Purpose: Collects new GPSGate geofence details for the geofence management workbench.
 * Dependencies: React, devextreme-react/button.
 * Last Modified: 2026-03-10
 */
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";

const defaultForm = {
    name: "",
    description: "",
    geofenceType: "Circle",
    centerLatitude: "",
    centerLongitude: "",
    radiusMeters: "",
    coordinatesText: "",
    groupIds: [],
};

const formatCoordinateLines = (value) =>
    value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

const parseCoordinates = (value) =>
    formatCoordinateLines(value).map((line, index) => {
        const [lat, lng] = line.split(",").map((item) => Number(item.trim()));
        return {
            latitude: lat,
            longitude: lng,
            order: index,
        };
    });

const GeofenceCreateForm = ({ geofenceGroups = [], saving = false, onCancel, onSubmit }) => {
    const [form, setForm] = useState(defaultForm);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(defaultForm);
        setError("");
    }, [geofenceGroups]);

    const selectedGroups = useMemo(() => new Set(form.groupIds), [form.groupIds]);

    const handleFieldChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        if (error) {
            setError("");
        }
    };

    const handleGroupToggle = (groupId) => {
        setForm((current) => {
            const nextIds = new Set(current.groupIds);
            if (nextIds.has(groupId)) {
                nextIds.delete(groupId);
            } else {
                nextIds.add(groupId);
            }
            return { ...current, groupIds: Array.from(nextIds) };
        });
    };

    const handleSubmit = () => {
        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            geofenceType: form.geofenceType,
            centerLatitude: form.centerLatitude === "" ? null : Number(form.centerLatitude),
            centerLongitude: form.centerLongitude === "" ? null : Number(form.centerLongitude),
            radiusMeters: form.radiusMeters === "" ? null : Number(form.radiusMeters),
            coordinates: ["Polygon", "Route"].includes(form.geofenceType)
                ? parseCoordinates(form.coordinatesText)
                : [],
            groupIds: form.groupIds,
        };

        if (!payload.name) {
            setError("Geofence name is required.");
            return;
        }

        if (payload.geofenceType === "Circle") {
            if (!Number.isFinite(payload.centerLatitude) || !Number.isFinite(payload.centerLongitude)) {
                setError("Circle geofences require a center latitude and longitude.");
                return;
            }
            if (!Number.isFinite(payload.radiusMeters) || payload.radiusMeters <= 0) {
                setError("Circle geofences require a radius greater than zero.");
                return;
            }
        }

        if (payload.geofenceType === "Polygon" && payload.coordinates.length < 3) {
            setError("Polygon geofences require at least three coordinate rows.");
            return;
        }

        if (payload.geofenceType === "Route") {
            if (payload.coordinates.length < 2) {
                setError("Route geofences require at least two coordinate rows.");
                return;
            }
            if (!Number.isFinite(payload.radiusMeters) || payload.radiusMeters <= 0) {
                setError("Route geofences require a corridor width greater than zero.");
                return;
            }
        }

        const hasInvalidCoordinate = payload.coordinates.some(
            (item) => !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)
        );

        if (hasInvalidCoordinate) {
            setError("Each coordinate row must use the format: latitude,longitude");
            return;
        }

        onSubmit?.(payload);
    };

    return (
        <div className="tw-p-5 tw-space-y-5">
            <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Create geofence</h3>
                <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                    Add new GPSGate geofences, optionally place them into synced groups, and use them for trip/worksite detection.
                </p>
            </div>

            {error && (
                <div className="tw-rounded-md tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
                    {error}
                </div>
            )}

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                <label className="tw-flex tw-flex-col tw-gap-1">
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Name</span>
                    <input
                        value={form.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                        placeholder="e.g. Loading Area A"
                    />
                </label>

                <label className="tw-flex tw-flex-col tw-gap-1">
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Type</span>
                    <select
                        value={form.geofenceType}
                        onChange={(e) => handleFieldChange("geofenceType", e.target.value)}
                        className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                    >
                        <option value="Circle">Circle</option>
                        <option value="Polygon">Polygon</option>
                        <option value="Route">Route / Corridor</option>
                    </select>
                </label>
            </div>

            <label className="tw-flex tw-flex-col tw-gap-1">
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Description</span>
                <textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    rows={2}
                    className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                    placeholder="Optional operational notes"
                />
            </label>

            {form.geofenceType === "Circle" && (
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-sm tw-font-medium tw-text-gray-700">Center latitude</span>
                        <input
                            type="number"
                            step="0.000001"
                            value={form.centerLatitude}
                            onChange={(e) => handleFieldChange("centerLatitude", e.target.value)}
                            className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                        />
                    </label>
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-sm tw-font-medium tw-text-gray-700">Center longitude</span>
                        <input
                            type="number"
                            step="0.000001"
                            value={form.centerLongitude}
                            onChange={(e) => handleFieldChange("centerLongitude", e.target.value)}
                            className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                        />
                    </label>
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-sm tw-font-medium tw-text-gray-700">Radius (meters)</span>
                        <input
                            type="number"
                            step="1"
                            min="1"
                            value={form.radiusMeters}
                            onChange={(e) => handleFieldChange("radiusMeters", e.target.value)}
                            className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                        />
                    </label>
                </div>
            )}

            {["Polygon", "Route"].includes(form.geofenceType) && (
                <div className="tw-space-y-3">
                    {form.geofenceType === "Route" && (
                        <label className="tw-flex tw-flex-col tw-gap-1 md:tw-max-w-xs">
                            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Corridor width (meters)</span>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={form.radiusMeters}
                                onChange={(e) => handleFieldChange("radiusMeters", e.target.value)}
                                className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                            />
                        </label>
                    )}
                    <label className="tw-flex tw-flex-col tw-gap-1">
                        <span className="tw-text-sm tw-font-medium tw-text-gray-700">Coordinates</span>
                        <textarea
                            value={form.coordinatesText}
                            onChange={(e) => handleFieldChange("coordinatesText", e.target.value)}
                            rows={8}
                            className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-font-mono tw-text-sm"
                            placeholder={"One row per point\n-1.292100,36.821900\n-1.292210,36.822400\n-1.292350,36.823100"}
                        />
                    </label>
                    <div className="tw-rounded-md tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-blue-700">
                        Enter points in drawing order using <span className="tw-font-semibold">latitude,longitude</span>.
                        For polygons, the backend will close the boundary automatically. For routes, the same points become the corridor centerline.
                    </div>
                </div>
            )}

            <div className="tw-space-y-3">
                <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800">Place geofence into groups</h4>
                    <p className="tw-text-sm tw-text-gray-600">Optional: assign this geofence into one or more synced groups immediately after creation.</p>
                </div>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-2 tw-max-h-48 tw-overflow-y-auto tw-rounded-md tw-border tw-border-gray-200 tw-p-3">
                    {geofenceGroups.length === 0 && (
                        <span className="tw-text-sm tw-text-gray-500">No synced groups available yet. Create or sync groups first.</span>
                    )}
                    {geofenceGroups.map((group) => (
                        <label key={group.id} className="tw-flex tw-items-start tw-gap-2 tw-rounded-md tw-border tw-border-gray-200 tw-p-2">
                            <input
                                type="checkbox"
                                className="tw-mt-1"
                                checked={selectedGroups.has(group.id)}
                                onChange={() => handleGroupToggle(group.id)}
                            />
                            <span>
                                <span className="tw-block tw-text-sm tw-font-medium tw-text-gray-800">{group.name}</span>
                                <span className="tw-block tw-text-xs tw-text-gray-500">{group.geofenceCount || 0} geofences</span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-2">
                <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving} />
                <Button text={saving ? "Saving..." : "Create geofence"} type="default" stylingMode="contained" onClick={handleSubmit} disabled={saving} />
            </div>
        </div>
    );
};

export default GeofenceCreateForm;
