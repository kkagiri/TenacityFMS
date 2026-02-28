/**
 * File: PTSDeviceFormPanel.js
 * Purpose: M365-styled form panel for create/edit PTS device (rendered inside SlidePanel)
 * Dependencies: ptsDeviceActions, siteActions, m365-shared
 * Last Modified: 2026-02-27
 *
 * Key Functions:
 * - handleSubmit(): Creates or updates PTS device
 * - handleFieldChange(): Updates form state for each field
 */
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import {
    createPTSDevice,
    updatePTSDevice,
    getPTSDeviceById,
} from "../../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import "./PTSDeviceFormPanel.scss";

const PTSDeviceFormPanel = ({ deviceId = null, onSave, onClose }) => {
    const dispatch = useDispatch();
    const isEditMode = deviceId !== null && deviceId !== "new";
    const sites = useSelector((state) => state.site?.siteList || state.site?.sites || []);
    const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        ptsid: deviceId && deviceId !== "new" ? "" : (deviceId || ""),
        ptsName: "",
        ipaddress: "",
        portNumber: 80,
        login: "",
        password: "",
        protocolSecurityType: "None",
        authenticationType: "Basic",
        site: null,
        isActive: 1,
        isAuthenticated: 0,
        webSocketCapable: 0,
        allowedForDirectCommands: 0,
        autoAssignUserMasterTag: 0,
    });

    // Load sites
    useEffect(() => {
        dispatch(fetchSiteList());
    }, [dispatch]);

    // Load device for edit
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            dispatch(getPTSDeviceById(deviceId))
                .then(() => setLoading(false))
                .catch(() => {
                    setLoading(false);
                    notify("Failed to load device data", "error", 3000);
                });
        }
    }, [dispatch, deviceId, isEditMode]);

    // Populate form when device loads
    useEffect(() => {
        if (currentDevice && isEditMode) {
            setFormData({
                ptsid: currentDevice.ptsid || "",
                ptsName: currentDevice.ptsName || "",
                ipaddress: currentDevice.ipaddress || "",
                portNumber: currentDevice.portNumber || 80,
                login: currentDevice.login || "",
                password: currentDevice.password || "",
                protocolSecurityType: currentDevice.protocolSecurityType || "None",
                authenticationType: currentDevice.authenticationType || "Basic",
                site: currentDevice.site || null,
                isActive: currentDevice.isActive ?? 1,
                isAuthenticated: currentDevice.isAuthenticated ?? 0,
                webSocketCapable: currentDevice.webSocketCapable ?? 0,
                allowedForDirectCommands: currentDevice.allowedForDirectCommands ?? 0,
                autoAssignUserMasterTag: currentDevice.autoAssignUserMasterTag ?? 0,
            });
        }
    }, [currentDevice, isEditMode]);

    // Pre-fill ptsid for unknown device registration
    useEffect(() => {
        if (deviceId && !isEditMode) {
            setFormData((prev) => ({ ...prev, ptsid: deviceId }));
        }
    }, [deviceId, isEditMode]);

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.ptsid) {
            notify("PTS ID is required", "warning", 3000);
            return;
        }
        setSaving(true);
        try {
            const data = { ...formData };
            if (isEditMode) {
                await dispatch(updatePTSDevice(deviceId, data));
                notify("PTS Device updated successfully", "success", 3000);
            } else {
                await dispatch(createPTSDevice(data));
                notify("PTS Device created successfully", "success", 3000);
            }
            if (onSave) onSave();
            if (onClose) onClose();
        } catch (error) {
            notify(`Error: ${error.message}`, "error", 3000);
        } finally {
            setSaving(false);
        }
    };

    const siteOptions = Array.isArray(sites)
        ? sites.map((s) => ({ id: s.id, name: s.name }))
        : [];

    if (loading) {
        return (
            <div className="m365-form-loading">
                <i className="fa-light fa-spinner fa-spin" style={{ fontSize: 24, color: "#0078d4" }}></i>
                <span>Loading device…</span>
            </div>
        );
    }

    return (
        <form className="m365-device-form" onSubmit={handleSubmit}>
            {/* Connection Details */}
            <div className="m365-form-section">
                <h4 className="m365-form-section__title">
                    <i className="fa-light fa-plug"></i>
                    Connection Details
                </h4>

                <div className="m365-field">
                    <label className="m365-field__label">PTS ID <span style={{ color: "#d13438" }}>*</span></label>
                    <input
                        className="m365-input"
                        value={formData.ptsid}
                        onChange={(e) => handleChange("ptsid", e.target.value)}
                        placeholder="Enter PTS ID"
                        readOnly={isEditMode}
                        required
                    />
                </div>

                <div className="m365-field">
                    <label className="m365-field__label">PTS Name</label>
                    <input
                        className="m365-input"
                        value={formData.ptsName}
                        onChange={(e) => handleChange("ptsName", e.target.value)}
                        placeholder="Enter friendly name"
                    />
                </div>

                <div className="m365-form-row">
                    <div className="m365-field">
                        <label className="m365-field__label">IP Address</label>
                        <input
                            className="m365-input"
                            value={formData.ipaddress}
                            onChange={(e) => handleChange("ipaddress", e.target.value)}
                            placeholder="e.g. 192.168.1.100"
                        />
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Port Number</label>
                        <input
                            className="m365-input"
                            type="number"
                            value={formData.portNumber}
                            onChange={(e) => handleChange("portNumber", parseInt(e.target.value) || 80)}
                            min={1}
                            max={65535}
                        />
                    </div>
                </div>

                <div className="m365-field">
                    <label className="m365-field__label">Site</label>
                    <select
                        className="m365-select"
                        value={formData.site || ""}
                        onChange={(e) => handleChange("site", e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">Select Site</option>
                        {siteOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Authentication */}
            <div className="m365-form-section">
                <h4 className="m365-form-section__title">
                    <i className="fa-light fa-shield-halved"></i>
                    Authentication
                </h4>

                <div className="m365-form-row">
                    <div className="m365-field">
                        <label className="m365-field__label">Login</label>
                        <input
                            className="m365-input"
                            value={formData.login}
                            onChange={(e) => handleChange("login", e.target.value)}
                            placeholder="Enter login"
                        />
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Password</label>
                        <input
                            className="m365-input"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                </div>

                <div className="m365-form-row">
                    <div className="m365-field">
                        <label className="m365-field__label">Protocol Security</label>
                        <select
                            className="m365-select"
                            value={formData.protocolSecurityType}
                            onChange={(e) => handleChange("protocolSecurityType", e.target.value)}
                        >
                            <option value="None">None</option>
                            <option value="SSL">SSL</option>
                            <option value="TLS">TLS</option>
                        </select>
                    </div>
                    <div className="m365-field">
                        <label className="m365-field__label">Authentication Type</label>
                        <select
                            className="m365-select"
                            value={formData.authenticationType}
                            onChange={(e) => handleChange("authenticationType", e.target.value)}
                        >
                            <option value="Basic">Basic</option>
                            <option value="Digest">Digest</option>
                            <option value="NTLM">NTLM</option>
                            <option value="Kerberos">Kerberos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Capabilities */}
            <div className="m365-form-section">
                <h4 className="m365-form-section__title">
                    <i className="fa-light fa-toggle-on"></i>
                    Capabilities
                </h4>

                <div className="m365-form-checks">
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.isActive === 1}
                            onChange={(e) => handleChange("isActive", e.target.checked ? 1 : 0)}
                        />
                        <span>Active</span>
                    </label>
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.isAuthenticated === 1}
                            onChange={(e) => handleChange("isAuthenticated", e.target.checked ? 1 : 0)}
                        />
                        <span>Authenticated</span>
                    </label>
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.webSocketCapable === 1}
                            onChange={(e) => handleChange("webSocketCapable", e.target.checked ? 1 : 0)}
                        />
                        <span>WebSocket Capable</span>
                    </label>
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.allowedForDirectCommands === 1}
                            onChange={(e) => handleChange("allowedForDirectCommands", e.target.checked ? 1 : 0)}
                        />
                        <span>Direct Commands</span>
                    </label>
                    <label className="m365-checkbox">
                        <input
                            type="checkbox"
                            checked={formData.autoAssignUserMasterTag === 1}
                            onChange={(e) => handleChange("autoAssignUserMasterTag", e.target.checked ? 1 : 0)}
                        />
                        <span>Auto-assign User Master Tag</span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="m365-form-actions">
                <button type="button" className="m365-btn m365-btn--ghost" onClick={onClose} disabled={saving}>
                    Cancel
                </button>
                <button type="submit" className="m365-btn m365-btn--primary" disabled={saving}>
                    {saving && <i className="fa-light fa-spinner fa-spin"></i>}
                    {isEditMode ? "Update" : "Create"}
                </button>
            </div>
        </form>
    );
};

export default PTSDeviceFormPanel;
