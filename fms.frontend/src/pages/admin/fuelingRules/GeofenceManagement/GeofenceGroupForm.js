/**
 * File: GeofenceGroupForm.js
 * Purpose: Creates and edits GPSGate geofence groups from the management workbench.
 * Dependencies: React, devextreme-react/button.
 * Last Modified: 2026-03-10
 */
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";

const buildForm = (group) => ({
    name: group?.name || "",
    description: group?.description || "",
    colour: group?.colour || "#0078d4",
    isPinned: Boolean(group?.isPinned),
    useInGeocoding: Boolean(group?.useInGeocoding),
    geofenceIds: Array.isArray(group?.geofences) ? group.geofences.map((item) => item.id) : [],
});

const GeofenceGroupForm = ({ group = null, geofences = [], saving = false, deleting = false, onCancel, onDelete, onSubmit }) => {
    const [form, setForm] = useState(buildForm(group));
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(buildForm(group));
        setError("");
    }, [group]);

    const selectedGeofences = useMemo(() => new Set(form.geofenceIds), [form.geofenceIds]);

    const handleFieldChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        if (error) {
            setError("");
        }
    };

    const handleGeofenceToggle = (geofenceId) => {
        setForm((current) => {
            const nextIds = new Set(current.geofenceIds);
            if (nextIds.has(geofenceId)) {
                nextIds.delete(geofenceId);
            } else {
                nextIds.add(geofenceId);
            }
            return { ...current, geofenceIds: Array.from(nextIds) };
        });
    };

    const handleSubmit = () => {
        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            colour: form.colour.trim() || null,
            isPinned: form.isPinned,
            useInGeocoding: form.useInGeocoding,
            geofenceIds: form.geofenceIds,
        };

        if (!payload.name) {
            setError("Group name is required.");
            return;
        }

        onSubmit?.(payload);
    };

    return (
        <div className="tw-p-5 tw-space-y-5">
            <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">{group ? "Edit geofence group" : "Create geofence group"}</h3>
                <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                    Use groups to organize worksites, operational zones, or trip-detection regions and keep memberships synced with GPSGate.
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
                        placeholder="e.g. Active Worksites"
                    />
                </label>
                <label className="tw-flex tw-flex-col tw-gap-1">
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Colour</span>
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <input type="color" value={form.colour || "#0078d4"} onChange={(e) => handleFieldChange("colour", e.target.value)} className="tw-h-10 tw-w-14 tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-p-1" />
                        <input value={form.colour} onChange={(e) => handleFieldChange("colour", e.target.value)} className="tw-flex-1 tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2" placeholder="#0078d4" />
                    </div>
                </label>
            </div>

            <label className="tw-flex tw-flex-col tw-gap-1">
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Description</span>
                <textarea value={form.description} onChange={(e) => handleFieldChange("description", e.target.value)} rows={2} className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2" placeholder="Optional operational purpose" />
            </label>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
                <label className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-gray-200 tw-p-3">
                    <input type="checkbox" checked={form.isPinned} onChange={(e) => handleFieldChange("isPinned", e.target.checked)} />
                    <span className="tw-text-sm tw-text-gray-700">Pin this group in GPSGate</span>
                </label>
                <label className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-gray-200 tw-p-3">
                    <input type="checkbox" checked={form.useInGeocoding} onChange={(e) => handleFieldChange("useInGeocoding", e.target.checked)} />
                    <span className="tw-text-sm tw-text-gray-700">Use this group in geocoding</span>
                </label>
            </div>

            <div className="tw-space-y-3">
                <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800">Group memberships</h4>
                    <p className="tw-text-sm tw-text-gray-600">Select which synced geofences belong to this group.</p>
                </div>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-2 tw-max-h-72 tw-overflow-y-auto tw-rounded-md tw-border tw-border-gray-200 tw-p-3">
                    {geofences.length === 0 && <span className="tw-text-sm tw-text-gray-500">Sync or create geofences first.</span>}
                    {geofences.map((geofence) => (
                        <label key={geofence.id} className="tw-flex tw-items-start tw-gap-2 tw-rounded-md tw-border tw-border-gray-200 tw-p-2">
                            <input type="checkbox" checked={selectedGeofences.has(geofence.id)} onChange={() => handleGeofenceToggle(geofence.id)} className="tw-mt-1" />
                            <span>
                                <span className="tw-block tw-text-sm tw-font-medium tw-text-gray-800">{geofence.name}</span>
                                <span className="tw-block tw-text-xs tw-text-gray-500">{geofence.geofenceType}{geofence.siteName ? ` • linked to ${geofence.siteName}` : ""}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="tw-flex tw-justify-between tw-gap-3 tw-pt-2">
                <div>
                    {group && (
                        <Button text={deleting ? "Deleting..." : "Delete group"} stylingMode="text" type="danger" onClick={() => onDelete?.(group)} disabled={saving || deleting} />
                    )}
                </div>
                <div className="tw-flex tw-gap-3">
                    <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving || deleting} />
                    <Button text={saving ? "Saving..." : group ? "Save changes" : "Create group"} type="default" stylingMode="contained" onClick={handleSubmit} disabled={saving || deleting} />
                </div>
            </div>
        </div>
    );
};

export default GeofenceGroupForm;
