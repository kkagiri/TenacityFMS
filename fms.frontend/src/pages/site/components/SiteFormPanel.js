/**
 * File:          SiteFormPanel.js
 * Purpose:       Create / Edit form rendered inside a SlidePanel.
 *                Flat M365 sections matching UserDetailPanel edit mode.
 * Dependencies:  devextreme-react/select-box, SitePage.scss
 * Last Modified: 2026-02-26
 *
 * Props:
 * - mode          ("create" | "edit"):  Form mode
 * - site          (object | null):       Site being edited (null for create)
 * - users         (array):              All users for administrator dropdown
 * - gpsGateTags   (array):              GPSGate tags [{id, name, color}]
 * - loadingTags   (bool):               Whether tags are still loading
 * - geofences     (array):              GPS geofences [{id, name, geofenceType, centerLatitude, centerLongitude}]
 * - loadingGeofences (bool):            Whether geofences are still loading
 * - saving        (bool):               Disables submit while saving
 * - onCreate      (func):               async (formData) => result
 * - onUpdate      (func):               async (siteId, formData) => result
 * - onClose       (func):               Close the panel
 */
import React, { useState, useEffect, useMemo } from "react";
import SiteGeofenceMapPopup from "./SiteGeofenceMapPopup";

const EMPTY_FORM = {
    name: "",
    isActive: true,
    siteAdministratorId: "",
    gpsGateTagId: null,
    gpsGateTagName: "",
    gpsGeofenceId: null,
    gpsGeofenceName: "",
    gpsGeofenceType: "",
    gpsGeofenceCenterLatitude: null,
    gpsGeofenceCenterLongitude: null,
    autoUpdateGpsGateTag: true,
};

const SiteFormPanel = ({
    mode = "create",
    site,
    users,
    gpsGateTags,
    loadingTags,
    geofences,
    loadingGeofences,
    saving,
    onCreate,
    onUpdate,
    onClose,
}) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [nameError, setNameError] = useState("");
    const [geofenceError, setGeofenceError] = useState("");
    const [showGeofenceMap, setShowGeofenceMap] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (mode === "edit" && site) {
            setFormData({
                name: site.name || "",
                isActive: site.isActive ?? true,
                siteAdministratorId: site.siteAdministratorId || "",
                gpsGateTagId: site.gpsGateTagId || null,
                gpsGateTagName: site.gpsGateTagName || "",
                gpsGeofenceId: site.gpsGeofenceId || null,
                gpsGeofenceName: site.gpsGeofenceName || "",
                gpsGeofenceType: site.gpsGeofenceType || "",
                gpsGeofenceCenterLatitude: site.gpsGeofenceCenterLatitude ?? null,
                gpsGeofenceCenterLongitude: site.gpsGeofenceCenterLongitude ?? null,
                autoUpdateGpsGateTag: site.autoUpdateGpsGateTag ?? true,
            });
        } else if (mode === "create") {
            setFormData(EMPTY_FORM);
        }
    }, [mode, site]);

    // Search state for searchable dropdowns
    const [adminSearch, setAdminSearch] = useState("");
    const [tagSearch, setTagSearch] = useState("");
    const [geofenceSearch, setGeofenceSearch] = useState("");

    // Derive display text for admin
    const adminDisplayText = useMemo(() => {
        if (!formData.siteAdministratorId) return "";
        const u = (users || []).find((usr) => String(usr.id) === String(formData.siteAdministratorId));
        return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() + ` (${u.userName || u.email || ""})` : "";
    }, [formData.siteAdministratorId, users]);

    // Derive display text for tag
    const tagDisplayText = useMemo(() => {
        if (!formData.gpsGateTagId) return "";
        const t = (gpsGateTags || []).find((tag) => String(tag.id) === String(formData.gpsGateTagId));
        return t ? t.name : "";
    }, [formData.gpsGateTagId, gpsGateTags]);

    // Derive display text for geofence
    const geofenceDisplayText = useMemo(() => {
        if (!formData.gpsGeofenceId) return formData.gpsGeofenceName || "";
        const g = (geofences || []).find((geo) => String(geo.id) === String(formData.gpsGeofenceId));
        return g ? g.name : formData.gpsGeofenceName || "";
    }, [formData.gpsGeofenceId, formData.gpsGeofenceName, geofences]);

    const selectedGeofence = useMemo(() => {
        if (!formData.gpsGeofenceId) return null;
        return (geofences || []).find((geo) => String(geo.id) === String(formData.gpsGeofenceId)) || null;
    }, [formData.gpsGeofenceId, geofences]);

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === "name") setNameError("");
    };

    // Match admin input to a user from datalist
    const handleAdminInput = (inputValue) => {
        setAdminSearch(inputValue);
        const matched = (users || []).find((u) => {
            const display = `${u.firstName || ""} ${u.lastName || ""}`.trim() + ` (${u.userName || u.email || ""})`;
            return display === inputValue;
        });
        handleFieldChange("siteAdministratorId", matched ? matched.id : "");
    };

    // Match tag input to a tag from datalist
    const handleTagInput = (inputValue) => {
        setTagSearch(inputValue);
        const matched = (gpsGateTags || []).find((t) => t.name === inputValue);
        setFormData((prev) => ({
            ...prev,
            gpsGateTagId: matched ? matched.id : null,
            gpsGateTagName: matched ? matched.name : "",
        }));
    };

    // Match geofence input to a geofence from datalist
    const handleGeofenceInput = (inputValue) => {
        setGeofenceSearch(inputValue);
        setGeofenceError("");
        const matched = (geofences || []).find((g) => g.name === inputValue);
        setFormData((prev) => ({
            ...prev,
            gpsGeofenceId: matched ? matched.id : null,
            gpsGeofenceName: matched ? matched.name : "",
            gpsGeofenceType: matched ? matched.geofenceType || "" : "",
            gpsGeofenceCenterLatitude: matched ? matched.centerLatitude ?? null : null,
            gpsGeofenceCenterLongitude: matched ? matched.centerLongitude ?? null : null,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim()) {
            setNameError("Site name is required");
            return;
        }

        if (formData.gpsGeofenceId && String(formData.gpsGeofenceType || "").toLowerCase() !== "polygon") {
            setGeofenceError("Only Polygon geofences can be mapped to a site");
            return;
        }

        let result;
        if (mode === "create") {
            result = await onCreate(formData);
        } else {
            result = await onUpdate(site.id, formData);
        }

        if (result?.success) {
            onClose();
        }
    };

    const isCreate = mode === "create";

    return (
        <div className="m365-edit-form">
            {/* ── Site Information ── */}
            <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <h3 className="m365-flat-section__title">Site Information</h3>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label m365-field__label--required">Site Name</label>
                        <input
                            className={`m365-input${nameError ? " m365-input--error" : ""}`}
                            placeholder="Enter site name"
                            value={formData.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            maxLength={255}
                            autoComplete="off"
                        />
                        {nameError && (
                            <span className="m365-field__error">{nameError}</span>
                        )}
                    </div>

                    <div className="m365-field">
                        <label className="m365-field__label">Site Administrator</label>
                        <input
                            className="m365-input"
                            list="site-admin-list"
                            placeholder="Search administrator…"
                            value={adminSearch || adminDisplayText}
                            onChange={(e) => handleAdminInput(e.target.value)}
                            onFocus={() => setAdminSearch(adminDisplayText)}
                            onBlur={() => setAdminSearch("")}
                            autoComplete="off"
                        />
                        <datalist id="site-admin-list">
                            {(users || []).map((u) => (
                                <option key={u.id} value={`${u.firstName || ""} ${u.lastName || ""}`.trim() + ` (${u.userName || u.email || ""})`} />
                            ))}
                        </datalist>
                    </div>
                </div>
            </div>

            {/* ── GPSGate Tag Configuration ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">GPSGate Tag Configuration</h3>
                <div className="m365-edit-fields">
                    <div className="m365-field">
                        <label className="m365-field__label">GPSGate Tag</label>
                        <input
                            className="m365-input"
                            list="site-tag-list"
                            placeholder={loadingTags ? "Loading tags\u2026" : "Search GPSGate tag\u2026"}
                            value={tagSearch || tagDisplayText}
                            onChange={(e) => handleTagInput(e.target.value)}
                            onFocus={() => setTagSearch(tagDisplayText)}
                            onBlur={() => setTagSearch("")}
                            disabled={loadingTags}
                            autoComplete="off"
                        />
                        <datalist id="site-tag-list">
                            {(gpsGateTags || []).map((tag) => (
                                <option key={tag.id} value={tag.name} />
                            ))}
                        </datalist>
                        <span className="m365-field__hint">
                            Vehicles transferred to this site will be assigned this GPSGate tag
                        </span>
                    </div>

                    <div className="m365-field">
                        <label className="m365-field__label">GPSGate Geofence</label>
                        <input
                            className="m365-input"
                            list="site-geofence-list"
                            placeholder={loadingGeofences ? "Loading polygon geofences..." : "Search polygon geofence..."}
                            value={geofenceSearch || geofenceDisplayText}
                            onChange={(e) => handleGeofenceInput(e.target.value)}
                            onFocus={() => setGeofenceSearch(geofenceDisplayText)}
                            onBlur={() => setGeofenceSearch("")}
                            disabled={loadingGeofences}
                            autoComplete="off"
                        />
                        <datalist id="site-geofence-list">
                            {(geofences || []).map((geo) => (
                                <option key={geo.id} value={geo.name} />
                            ))}
                        </datalist>
                        <span className="m365-field__hint">
                            Select the polygon GPSGate geofence for this site project location.
                        </span>
                        {geofenceError && (
                            <span className="m365-field__error">{geofenceError}</span>
                        )}
                        {formData.gpsGeofenceId && (
                            <>
                                <span className="m365-field__hint">
                                    Type: {formData.gpsGeofenceType || "-"} | Center:{" "}
                                    {formData.gpsGeofenceCenterLatitude != null &&
                                    formData.gpsGeofenceCenterLongitude != null
                                        ? `${Number(formData.gpsGeofenceCenterLatitude).toFixed(5)}, ${Number(formData.gpsGeofenceCenterLongitude).toFixed(5)}`
                                        : "Not available"}
                                </span>
                                {selectedGeofence && (
                                    <button
                                        type="button"
                                        className="m365-btn m365-btn--ghost"
                                        onClick={() => setShowGeofenceMap(true)}
                                        style={{ width: "fit-content", marginTop: 8 }}
                                    >
                                        <i className="fa-light fa-draw-polygon"></i>
                                        View boundary map
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Settings ── */}
            <div className="m365-flat-section">
                <h3 className="m365-flat-section__title">Settings</h3>
                <div className="m365-edit-fields">
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => handleFieldChange("isActive", e.target.checked)}
                        />
                        <span className="m365-checkbox__label">Active</span>
                    </label>
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.autoUpdateGpsGateTag}
                            onChange={(e) => handleFieldChange("autoUpdateGpsGateTag", e.target.checked)}
                        />
                        <span className="m365-checkbox__label">Auto-update vehicle GPSGate tags</span>
                    </label>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="m365-panel-footer">
                <button className="m365-btn m365-btn--ghost" onClick={onClose} disabled={saving}>
                    Cancel
                </button>
                <button
                    className="m365-btn m365-btn--primary"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving
                        ? (isCreate ? "Creating\u2026" : "Saving\u2026")
                        : (isCreate ? "Create Site" : "Save changes")}
                </button>
            </div>

            <SiteGeofenceMapPopup
                visible={showGeofenceMap}
                onClose={() => setShowGeofenceMap(false)}
                geofence={selectedGeofence}
            />
        </div>
    );
};

export default SiteFormPanel;
