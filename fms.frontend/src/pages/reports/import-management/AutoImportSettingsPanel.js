/**
 * File: AutoImportSettingsPanel.js
 * Purpose: Settings panel for fuel auto-import with per-profile (scan path) configuration.
 *          Each profile card has independent schedule, batch, retry, and notification settings.
 *          M365 Admin Center Fluent design with fixed footer and inline help tooltips.
 * Dependencies: react, useAutoImportSettings, usePermissions
 * Last Modified: 2026-03-03
 *
 * Key Components:
 * - AutoImportSettingsPanel: Master toggle + profile cards + help pane + fixed footer
 * - ProfileCard: Individual profile settings card (uniform sizing)
 * - M365InfoTip: Shared click-to-open info popover (from components/m365)
 * - HelpPane: Collapsible help section explaining file format and procedure
 */

import React, { useState } from "react";
import { usePermissions } from "../../../hooks/usePermissions";
import useAutoImportSettings from "./hooks/useAutoImportSettings";
import M365InfoTip from "../../../components/m365/M365InfoTip";

/* ─── Help Pane ─── */
const HelpPane = () => {
    const [open, setOpen] = useState(false);

    return (
        <div
            style={{
                borderRadius: 8,
                border: "1px solid #e0cffc",
                background: "#faf5ff",
                marginBottom: 16,
                overflow: "hidden",
            }}
        >
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6b21a8",
                }}
            >
                <span>
                    <i className="fa-light fa-circle-question tw-mr-2" />
                    Help &amp; Procedure Guide
                </span>
                <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: 11 }} />
            </button>

            {open && (
                <div style={{ padding: "0 16px 14px", fontSize: 12, lineHeight: 1.7, color: "#4a1d75" }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        <i className="fa-light fa-file-excel tw-mr-1" />
                        Expected File Format
                    </div>
                    <ul style={{ paddingLeft: 18, margin: "0 0 10px" }}>
                        <li>Excel files (<code>.xlsx</code> / <code>.xls</code>) placed in the configured scan path.</li>
                        <li><strong>Heavy Report</strong> — fuel consumption report with <code>km/l</code> unit (kilometres per litre).</li>
                        <li><strong>Truck Report</strong> — fuel consumption report with <code>l/hr</code> unit (litres per hour).</li>
                        <li>Each file must contain columns for vehicle registration, fuel quantity, and date.</li>
                        <li>The system auto-detects the site from the file name or content.</li>
                    </ul>

                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        <i className="fa-light fa-list-ol tw-mr-1" />
                        Import Procedure
                    </div>
                    <ol style={{ paddingLeft: 18, margin: "0 0 10px" }}>
                        <li>Place Excel files in the network share path configured for each profile.</li>
                        <li>The system scans the folder at the configured interval (or on-demand via Refresh).</li>
                        <li>New files are tracked with status <strong>Pending</strong>.</li>
                        <li>Files are parsed, validated, and inserted into the database.</li>
                        <li>Status changes to <strong>Completed</strong> on success or <strong>Failed</strong> on error.</li>
                        <li>Failed files can be retried from the Import Management page.</li>
                    </ol>

                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        <i className="fa-light fa-lightbulb tw-mr-1" />
                        Tips
                    </div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                        <li>Set <strong>Interval</strong> to 0 for manual-only imports (triggered via the Refresh button).</li>
                        <li>Use <strong>Batch Size</strong> to limit how many files are processed per cycle.</li>
                        <li>Enable <strong>Notifications</strong> to receive alerts when imports succeed or fail.</li>
                        <li>Each profile is independent — you can enable/disable them individually.</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

/* ─── Single Profile Card ─── */
const ProfileCard = ({ profile, updateProfileField, removeProfile, canManage }) => {
    const [expanded, setExpanded] = useState(true);

    const update = (field, value) => updateProfileField(profile.id, field, value);

    return (
        <div className="ais-profile-card" data-enabled={profile.enabled}>
            {/* Card Header */}
            <div className="ais-profile-card__header" onClick={() => setExpanded(!expanded)}>
                <div className="tw-flex tw-items-center tw-gap-2">
                    <i
                        className={`fa-light ${expanded ? "fa-chevron-down" : "fa-chevron-right"}`}
                        style={{ fontSize: 12, color: "#605e5c", width: 14 }}
                    />
                    <i className="fa-light fa-folder-open" style={{ color: "#0078d4" }} />
                    <span className="ais-profile-card__title">
                        {profile.name || "Untitled Profile"}
                    </span>
                    {!profile.enabled && (
                        <span className="ais-badge ais-badge--muted">Disabled</span>
                    )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-2" onClick={(e) => e.stopPropagation()}>
                    <label className="m365-checkbox" title="Enable/disable this profile">
                        <input
                            type="checkbox"
                            checked={profile.enabled}
                            onChange={(e) => update("enabled", e.target.checked)}
                        />
                    </label>
                    {canManage && (
                        <button
                            className="m365-icon-btn m365-icon-btn--danger"
                            title="Remove profile"
                            onClick={() => removeProfile(profile.id)}
                        >
                            <i className="fa-light fa-trash" />
                        </button>
                    )}
                </div>
            </div>

            {/* Card Body */}
            {expanded && (
                <div className="ais-profile-card__body">
                    {/* Identity Section */}
                    <div className="ais-field-group">
                        <div className="ais-field">
                            <label className="ais-field__label">
                                Profile Name
                                <M365InfoTip text="A descriptive name for this import profile. Used to identify it in logs and notifications." />
                            </label>
                            <input
                                type="text"
                                className="m365-input tw-w-full"
                                value={profile.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="e.g. Heavy Report"
                            />
                        </div>
                        <div className="ais-field">
                            <label className="ais-field__label">
                                Scan Path
                                <M365InfoTip text="Network share or local folder path where fuel report Excel files (.xlsx/.xls) are placed for automatic pickup." />
                            </label>
                            <input
                                type="text"
                                className="m365-input tw-w-full"
                                value={profile.scanPath}
                                onChange={(e) => update("scanPath", e.target.value)}
                                placeholder="e.g. Z:\Heavy Report"
                            />
                        </div>
                    </div>

                    {/* Schedule & Processing Section */}
                    <div className="ais-section-divider">
                        <i className="fa-light fa-clock tw-mr-1" />
                        Schedule &amp; Processing
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                        <div className="ais-field">
                            <label className="ais-field__label">
                                Interval (min)
                                <M365InfoTip text="How often (in minutes) the system scans this folder for new files. Set to 0 to disable automatic scanning (manual-only mode)." />
                            </label>
                            <input
                                type="number"
                                className="m365-input tw-w-full"
                                min={0}
                                max={1440}
                                value={profile.intervalMinutes}
                                onChange={(e) =>
                                    update("intervalMinutes", parseInt(e.target.value, 10) || 0)
                                }
                            />
                        </div>
                        <div className="ais-field">
                            <label className="ais-field__label">
                                Daily Time
                                <M365InfoTip text="Specific time of day to run the import scan. Leave empty to use interval-based scheduling only." />
                            </label>
                            <input
                                type="time"
                                className="m365-input tw-w-full"
                                value={profile.scheduleTime}
                                onChange={(e) => update("scheduleTime", e.target.value)}
                            />
                        </div>
                        <div className="ais-field">
                            <label className="ais-field__label">
                                Batch Size
                                <M365InfoTip text="Maximum number of files to process in a single scan cycle. Set to 0 for unlimited. Lower values reduce server load." />
                            </label>
                            <input
                                type="number"
                                className="m365-input tw-w-full"
                                min={0}
                                max={500}
                                value={profile.batchSize}
                                onChange={(e) =>
                                    update("batchSize", parseInt(e.target.value, 10) || 0)
                                }
                            />
                        </div>
                        <div className="ais-field tw-flex tw-flex-col tw-justify-end">
                            <label className="m365-checkbox">
                                <input
                                    type="checkbox"
                                    checked={profile.includeRetries}
                                    onChange={(e) => update("includeRetries", e.target.checked)}
                                />
                                <span className="m365-checkbox__label">
                                    Include Retries
                                    <M365InfoTip text="When enabled, previously failed files will be automatically retried during each scan cycle." />
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="ais-section-divider">
                        <i className="fa-light fa-bell tw-mr-1" />
                        Notifications
                    </div>
                    <label className="m365-checkbox tw-mb-2" style={{ display: "flex" }}>
                        <input
                            type="checkbox"
                            checked={profile.notificationsEnabled}
                            onChange={(e) => update("notificationsEnabled", e.target.checked)}
                        />
                        <span className="m365-checkbox__label">
                            Enable Notifications
                            <M365InfoTip text="Send push notifications when this profile's import completes. Configure success and failure notifications independently below." />
                        </span>
                    </label>
                    {profile.notificationsEnabled && (
                        <div className="tw-flex tw-gap-4 tw-ml-6 tw-mt-2">
                            <label className="m365-checkbox">
                                <input
                                    type="checkbox"
                                    checked={profile.notifyOnSuccess}
                                    onChange={(e) => update("notifyOnSuccess", e.target.checked)}
                                />
                                <span className="m365-checkbox__label">On Success</span>
                            </label>
                            <label className="m365-checkbox">
                                <input
                                    type="checkbox"
                                    checked={profile.notifyOnFailure}
                                    onChange={(e) => update("notifyOnFailure", e.target.checked)}
                                />
                                <span className="m365-checkbox__label">On Failure</span>
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Main Settings Panel ─── */
const AutoImportSettingsPanel = ({ onClose }) => {
    const {
        settings,
        loading,
        saving,
        error,
        saveMessage,
        isDirty,
        updateField,
        addProfile,
        removeProfile,
        updateProfileField,
        saveSettings,
        discardChanges,
    } = useAutoImportSettings();

    const { hasPermission } = usePermissions();
    const canManage = hasPermission("_Manage_FuelImport");

    if (loading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
                <i className="fa-light fa-spinner-third fa-spin tw-text-2xl" style={{ color: "#0078d4" }} />
                <span className="tw-ml-3" style={{ color: "#605e5c" }}>Loading settings…</span>
            </div>
        );
    }

    return (
        <fieldset disabled={!canManage} className="ais-panel-wrapper">
            {/* ── Scrollable Content ── */}
            <div className="ais-panel-content">
                {/* Error / Success banners */}
                {error && (
                    <div className="m365-info-banner m365-info-banner--error tw-mb-4">
                        <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                        <div className="m365-info-banner__content">
                            <span className="m365-info-banner__text">{error}</span>
                        </div>
                    </div>
                )}
                {saveMessage && (
                    <div className="m365-info-banner m365-info-banner--success tw-mb-4">
                        <i className="fa-light fa-circle-check m365-info-banner__icon" />
                        <div className="m365-info-banner__content">
                            <span className="m365-info-banner__text">{saveMessage}</span>
                        </div>
                    </div>
                )}

                {/* Help Pane */}
                <HelpPane />

                {/* Section: Master Toggle */}
                <div className="m365-flat-section tw-mb-4">
                    <div className="m365-flat-section__header">
                        <i className="fa-light fa-power-off tw-mr-2" />
                        <span>General</span>
                    </div>
                    <div className="m365-flat-section__body">
                        <label className="auto-import-settings__toggle-row">
                            <span className="auto-import-settings__label">
                                Enable Auto-Import
                                <M365InfoTip text="Master switch for the auto-import system. When disabled, no profiles will scan or process files. Individual profile toggles are ignored when this is off." />
                            </span>
                            <input
                                type="checkbox"
                                className="auto-import-settings__checkbox"
                                checked={settings.enabled}
                                onChange={(e) => updateField("enabled", e.target.checked)}
                            />
                        </label>
                    </div>
                </div>

                {/* Section: Import Profiles */}
                <div className="m365-flat-section">
                    <div className="m365-flat-section__header tw-flex tw-items-center tw-justify-between">
                        <div>
                            <i className="fa-light fa-layer-group tw-mr-2" />
                            <span>Import Profiles</span>
                            <span
                                style={{
                                    marginLeft: 8,
                                    fontSize: 11,
                                    color: "#605e5c",
                                    fontWeight: 400,
                                }}
                            >
                                ({settings.profiles.length})
                            </span>
                        </div>
                        {canManage && (
                            <button className="m365-btn m365-btn--ghost" onClick={addProfile} style={{ height: 28, fontSize: 12 }}>
                                <i className="fa-light fa-plus tw-mr-1" />
                                Add Profile
                            </button>
                        )}
                    </div>
                    <div className="m365-flat-section__body">
                        {settings.profiles.length === 0 ? (
                            <div
                                className="tw-text-center tw-py-8"
                                style={{ color: "#a19f9d", fontSize: 13 }}
                            >
                                <i className="fa-light fa-folder-xmark tw-text-3xl tw-mb-2 tw-block" />
                                No import profiles configured. Click "Add Profile" to create one.
                            </div>
                        ) : (
                            settings.profiles.map((profile) => (
                                <ProfileCard
                                    key={profile.id}
                                    profile={profile}
                                    updateProfileField={updateProfileField}
                                    removeProfile={removeProfile}
                                    canManage={canManage}
                                />
                            ))
                        )}
                    </div>
                </div>

                {!canManage && (
                    <div className="m365-info-banner tw-mt-4">
                        <i className="fa-light fa-lock m365-info-banner__icon" />
                        <div className="m365-info-banner__content">
                            <span className="m365-info-banner__text">
                                You have read-only access. Contact an administrator to modify settings.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Fixed Footer ── */}
            <div className="ais-panel-footer">
                {isDirty && (
                    <span className="ais-panel-footer__dirty">
                        <i className="fa-light fa-circle-dot tw-mr-1" />
                        Unsaved changes
                    </span>
                )}
                <div className="ais-panel-footer__buttons">
                    <button
                        className="m365-btn m365-btn--ghost"
                        onClick={() => {
                            discardChanges();
                            if (onClose) onClose();
                        }}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="m365-btn m365-btn--primary"
                        onClick={saveSettings}
                        disabled={!isDirty || saving}
                    >
                        {saving ? (
                            <>
                                <i className="fa-light fa-spinner-third fa-spin tw-mr-1" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <i className="fa-light fa-floppy-disk tw-mr-1" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </fieldset>
    );
};

export default AutoImportSettingsPanel;
