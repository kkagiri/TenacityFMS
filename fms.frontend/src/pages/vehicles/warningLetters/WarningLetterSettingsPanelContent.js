/**
 * File: WarningLetterSettingsPanelContent.js
 * Purpose: Reusable warning letter settings editor for slide panels and embedded pages.
 * Dependencies: React, warningLetterService, devextreme notify
 * Last Modified: 2026-04-08
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import {
    getWarningLetterSettings,
    updateWarningLetterSettings,
} from "./warningLetterService";

const WarningLetterSettingsPanelContent = ({ canEdit = false, onSaved = null }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        fuelPricePerLitre: "",
        issuerName: "",
        issuerTitle: "",
        maxWarningCountBeforeLast: "3",
    });
    const [persistedSettings, setPersistedSettings] = useState({
        fuelPricePerLitre: 0,
        issuerName: "",
        issuerTitle: "",
        maxWarningCountBeforeLast: 3,
    });
    const [error, setError] = useState("");

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getWarningLetterSettings();
            const price = Number(data?.fuelPricePerLitre ?? 0);
            const issuerName = (data?.issuerName || "").toString();
            const issuerTitle = (data?.issuerTitle || "").toString();
            const maxWarningCountBeforeLast = Number(data?.maxWarningCountBeforeLast ?? 3);

            setPersistedSettings({
                fuelPricePerLitre: Number.isFinite(price) ? price : 0,
                issuerName,
                issuerTitle,
                maxWarningCountBeforeLast: Number.isFinite(maxWarningCountBeforeLast) && maxWarningCountBeforeLast > 0 ? maxWarningCountBeforeLast : 3,
            });
            setSettings({
                fuelPricePerLitre: price > 0 ? String(price) : "",
                issuerName,
                issuerTitle,
                maxWarningCountBeforeLast: String(Number.isFinite(maxWarningCountBeforeLast) && maxWarningCountBeforeLast > 0 ? maxWarningCountBeforeLast : 3),
            });
        } catch (err) {
            const message = err.message || "Failed to load warning letter settings.";
            setError(message);
            notify(message, "error", 3000);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canEdit) {
            return;
        }

        const parsedFuelPrice = Number(settings.fuelPricePerLitre);
        if (!Number.isFinite(parsedFuelPrice) || parsedFuelPrice < 0) {
            setError("Please enter a valid non-negative fuel price.");
            return;
        }

        const parsedMaxWarningCount = Number(settings.maxWarningCountBeforeLast);
        if (!Number.isInteger(parsedMaxWarningCount) || parsedMaxWarningCount <= 0) {
            setError("Please enter a valid maximum warning count greater than zero.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            const result = await updateWarningLetterSettings({
                fuelPricePerLitre: parsedFuelPrice,
                issuerName: settings.issuerName.trim(),
                issuerTitle: settings.issuerTitle.trim(),
                maxWarningCountBeforeLast: parsedMaxWarningCount,
            });
            const persistedFuelPrice = Number(result?.fuelPricePerLitre ?? parsedFuelPrice);
            const persistedIssuerName = (result?.issuerName ?? settings.issuerName).toString();
            const persistedIssuerTitle = (result?.issuerTitle ?? settings.issuerTitle).toString();
            const persistedMaxWarningCount = Number(result?.maxWarningCountBeforeLast ?? parsedMaxWarningCount);

            setPersistedSettings({
                fuelPricePerLitre: persistedFuelPrice,
                issuerName: persistedIssuerName,
                issuerTitle: persistedIssuerTitle,
                maxWarningCountBeforeLast: persistedMaxWarningCount,
            });
            setSettings({
                fuelPricePerLitre: String(persistedFuelPrice),
                issuerName: persistedIssuerName,
                issuerTitle: persistedIssuerTitle,
                maxWarningCountBeforeLast: String(persistedMaxWarningCount),
            });
            notify("Warning letter settings saved.", "success", 2500);
            onSaved?.(result);
        } catch (err) {
            const message = err.message || "Failed to save warning letter settings.";
            setError(message);
            notify(message, "error", 3000);
        } finally {
            setSaving(false);
        }
    };

    const isDirty = useMemo(() => {
        const normalizedFuelPrice = Number(settings.fuelPricePerLitre || 0);
        const normalizedMaxWarningCount = Number(settings.maxWarningCountBeforeLast || 0);

        return normalizedFuelPrice !== Number(persistedSettings.fuelPricePerLitre)
            || settings.issuerName !== persistedSettings.issuerName
            || settings.issuerTitle !== persistedSettings.issuerTitle
            || normalizedMaxWarningCount !== Number(persistedSettings.maxWarningCountBeforeLast);
    }, [persistedSettings, settings]);

    return (
        <form className="warning-letter-settings__form warning-letter-settings__form--panel" onSubmit={handleSubmit}>
            <div className="warning-letter-settings__section">
                <h3 className="warning-letter-settings__section-title">Excess Fuel Consumption</h3>
                <p className="warning-letter-settings__section-hint">
                    These values are applied automatically to every new Excess Fuel Consumption warning letter.
                    <br />
                    <strong>Excess Cost</strong> is calculated as <code>Fuel Lost x Fuel Price per Litre</code>.
                </p>

                <label className="warning-letter-page__field warning-letter-settings__field">
                    <span>Fuel Price per Litre</span>
                    <div className="warning-letter-settings__input-wrap">
                        <input
                            type="number"
                            className="m365-input"
                            value={settings.fuelPricePerLitre}
                            onChange={(event) => setSettings((prev) => ({ ...prev, fuelPricePerLitre: event.target.value }))}
                            min="0"
                            step="0.0001"
                            disabled={!canEdit || loading || saving}
                            placeholder="0.00"
                        />
                    </div>
                    <small className="warning-letter-settings__hint">
                        Currently persisted:&nbsp;
                        <strong>{persistedSettings.fuelPricePerLitre > 0 ? persistedSettings.fuelPricePerLitre.toFixed(4) : "Not set"}</strong>
                    </small>
                </label>
            </div>

            <div className="warning-letter-settings__section">
                <h3 className="warning-letter-settings__section-title">Issuer Defaults</h3>
                <p className="warning-letter-settings__section-hint">
                    These values are injected into the warning letter sign-off block and used as the fixed issuer details in step 3.
                </p>

                <label className="warning-letter-page__field warning-letter-settings__field">
                    <span>Issuer Name</span>
                    <div className="warning-letter-settings__input-wrap">
                        <input
                            type="text"
                            className="m365-input"
                            value={settings.issuerName}
                            onChange={(event) => setSettings((prev) => ({ ...prev, issuerName: event.target.value }))}
                            disabled={!canEdit || loading || saving}
                            placeholder="Enter fixed issuer name"
                        />
                    </div>
                </label>

                <label className="warning-letter-page__field warning-letter-settings__field">
                    <span>Issuer Title</span>
                    <div className="warning-letter-settings__input-wrap">
                        <input
                            type="text"
                            className="m365-input"
                            value={settings.issuerTitle}
                            onChange={(event) => setSettings((prev) => ({ ...prev, issuerTitle: event.target.value }))}
                            disabled={!canEdit || loading || saving}
                            placeholder="Enter fixed issuer title"
                        />
                    </div>
                </label>
            </div>

            <div className="warning-letter-settings__section">
                <h3 className="warning-letter-settings__section-title">Warning Sequence</h3>
                <p className="warning-letter-settings__section-hint">
                    The subject line uses the same-type warning count for the employee. When the count reaches this value, the subject switches to <strong>LAST WARNING LETTER</strong>.
                </p>

                <label className="warning-letter-page__field warning-letter-settings__field">
                    <span>Maximum Warning Count Before Last</span>
                    <div className="warning-letter-settings__input-wrap">
                        <input
                            type="number"
                            className="m365-input"
                            value={settings.maxWarningCountBeforeLast}
                            onChange={(event) => setSettings((prev) => ({ ...prev, maxWarningCountBeforeLast: event.target.value }))}
                            min="1"
                            step="1"
                            disabled={!canEdit || loading || saving}
                            placeholder="3"
                        />
                    </div>
                    <small className="warning-letter-settings__hint">
                        Currently persisted:&nbsp;
                        <strong>{persistedSettings.maxWarningCountBeforeLast}</strong>
                    </small>
                </label>
            </div>

            {!canEdit && (
                <div className="m365-info-banner m365-info-banner--warning">
                    <i className="fa-light fa-lock m365-info-banner__icon" />
                    <span className="m365-info-banner__text">You do not have permission to update warning letter settings.</span>
                </div>
            )}

            {error && (
                <div className="warning-letter-settings__error" role="alert">
                    <i className="fa-light fa-circle-exclamation" /> {error}
                </div>
            )}

            <div className="warning-letter-settings__footer">
                <button
                    type="button"
                    className="m365-btn m365-btn--ghost"
                    onClick={loadSettings}
                    disabled={loading || saving}
                >
                    <i className="fa-light fa-rotate-right" /> Reload
                </button>
                <button
                    type="submit"
                    className="m365-btn m365-btn--primary"
                    disabled={!canEdit || loading || saving || !isDirty}
                >
                    <i className="fa-light fa-floppy-disk" /> {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </form>
    );
};

export default WarningLetterSettingsPanelContent;