/**
 * File: GeofenceWorksiteForm.js
 * Purpose: Assigns or removes a geofence from a site so it is classified as a worksite.
 * Dependencies: React, devextreme-react/button.
 * Last Modified: 2026-03-10
 */
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "devextreme-react/button";

const GeofenceWorksiteForm = ({ geofence, sites = [], saving = false, onCancel, onSubmit }) => {
    const [siteId, setSiteId] = useState("");

    useEffect(() => {
        setSiteId(geofence?.siteId ? String(geofence.siteId) : "");
    }, [geofence]);

    const sortedSites = useMemo(
        () => [...sites].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))),
        [sites]
    );

    return (
        <div className="tw-p-5 tw-space-y-5">
            <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Classify as worksite</h3>
                <p className="tw-mt-1 tw-text-sm tw-text-gray-600">
                    Link <span className="tw-font-semibold">{geofence?.name || "selected geofence"}</span> to a site. Linked geofences are treated as worksite boundaries in the operations model.
                </p>
            </div>

            {geofence?.siteName && (
                <div className="tw-rounded-md tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-blue-700">
                    Currently linked to site: <span className="tw-font-semibold">{geofence.siteName}</span>
                </div>
            )}

            <label className="tw-flex tw-flex-col tw-gap-1">
                <span className="tw-text-sm tw-font-medium tw-text-gray-700">Site</span>
                <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2"
                >
                    <option value="">Not linked to a site</option>
                    {sortedSites.map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                </select>
            </label>

            <div className="tw-rounded-md tw-bg-gray-50 tw-p-3 tw-text-sm tw-text-gray-600">
                If you choose a different site, the geofence will be detached from its current site first and then linked to the new one.
            </div>

            <div className="tw-flex tw-justify-end tw-gap-3">
                <Button text="Cancel" stylingMode="outlined" onClick={onCancel} disabled={saving} />
                <Button text={saving ? "Saving..." : "Save classification"} type="default" stylingMode="contained" onClick={() => onSubmit?.(siteId ? Number(siteId) : null)} disabled={saving} />
            </div>
        </div>
    );
};

export default GeofenceWorksiteForm;
