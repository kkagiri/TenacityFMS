/**
 * File: CalibrationLearningSettingsPanel.js
 * Purpose: Side-panel editor for the global FMS learned calibration system settings from the tank calibration workspace.
 * Dependencies: React, react-redux, SlidePanel, systemConfigActions, notify
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - loadSettings(): Loads Calibration.* system configuration rows into local panel state
 * - handleInitializeMissing(): Creates any missing learned-calibration settings with defaults
 * - handleSaveAll(): Validates and persists changed settings back to SystemConfiguration
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";

import SlidePanel from "../../../components/ui/SlidePanel";
import {
    createSystemConfiguration,
    fetchSystemConfigurations,
    updateSystemConfiguration,
} from "../../../redux/actions/systemConfigActions";
import { CALIBRATION_LEARNING_CONFIG_DEFINITIONS } from "../../admin/systemConfig/components/CalibrationLearningConfigSection";
import "./CalibrationLearningSettingsPanel.scss";

const getLoadedItems = (result) => {
    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result)) {
        return result;
    }

    return [];
};

const normalizeValue = (value, fallback) => {
    if (value === null || value === undefined || value === "") {
        return String(fallback ?? "");
    }

    return String(value);
};

const validateSetting = (definition, rawValue) => {
    const value = normalizeValue(rawValue, definition.defaultValue).trim();

    if (!value) {
        return "A value is required.";
    }

    if (definition.validationPattern) {
        const regex = new RegExp(definition.validationPattern);
        if (!regex.test(value)) {
            return `Value must match ${definition.dataType.toLowerCase()} format.`;
        }
    }

    if (definition.dataType === "Integer" || definition.dataType === "Decimal") {
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return `Value must be a valid ${definition.dataType.toLowerCase()}.`;
        }

        if (definition.minValue !== undefined && definition.minValue !== null && numericValue < Number(definition.minValue)) {
            return `Value must be at least ${definition.minValue}.`;
        }

        if (definition.maxValue !== undefined && definition.maxValue !== null && numericValue > Number(definition.maxValue)) {
            return `Value must be no more than ${definition.maxValue}.`;
        }
    }

    return null;
};

const buildPayload = (definition, existingConfig, configurationValue) => ({
    ...(existingConfig || {}),
    configurationKey: definition.configurationKey,
    configurationValue: normalizeValue(configurationValue, definition.defaultValue),
    description: definition.description,
    dataType: definition.dataType,
    category: definition.category,
    isActive: existingConfig?.isActive ?? true,
    isEditable: existingConfig?.isEditable ?? true,
    validationPattern: definition.validationPattern || "",
    defaultValue: definition.defaultValue,
    minValue: definition.minValue ?? null,
    maxValue: definition.maxValue ?? null,
});

const CalibrationLearningSettingsPanel = ({ open, onClose, onSaved }) => {
    const dispatch = useDispatch();
    const [loadedConfigurations, setLoadedConfigurations] = useState([]);
    const [draftValues, setDraftValues] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const configByKey = useMemo(
        () => loadedConfigurations.reduce((lookup, item) => {
            if (item?.configurationKey) {
                lookup[item.configurationKey] = item;
            }
            return lookup;
        }, {}),
        [loadedConfigurations]
    );

    const missingDefinitions = useMemo(
        () => CALIBRATION_LEARNING_CONFIG_DEFINITIONS.filter(
            (definition) => !configByKey[definition.configurationKey]
        ),
        [configByKey]
    );

    const changedCount = useMemo(
        () => CALIBRATION_LEARNING_CONFIG_DEFINITIONS.filter((definition) => {
            const existingValue = normalizeValue(
                configByKey[definition.configurationKey]?.configurationValue,
                definition.defaultValue
            );
            const draftValue = normalizeValue(
                draftValues[definition.configurationKey],
                definition.defaultValue
            );
            return existingValue !== draftValue;
        }).length,
        [configByKey, draftValues]
    );

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await dispatch(
                fetchSystemConfigurations({
                    category: "Calibration",
                    page: 1,
                    pageSize: 100,
                })
            );

            const items = getLoadedItems(result);
            const filteredItems = items.filter((item) =>
                CALIBRATION_LEARNING_CONFIG_DEFINITIONS.some(
                    (definition) => definition.configurationKey === item?.configurationKey
                )
            );

            setLoadedConfigurations(filteredItems);
            setDraftValues(
                CALIBRATION_LEARNING_CONFIG_DEFINITIONS.reduce((lookup, definition) => {
                    const existing = filteredItems.find(
                        (item) => item.configurationKey === definition.configurationKey
                    );
                    lookup[definition.configurationKey] = normalizeValue(
                        existing?.configurationValue,
                        definition.defaultValue
                    );
                    return lookup;
                }, {})
            );
            setValidationErrors({});
        } catch (error) {
            notify("Failed to load calibration learning settings.", "error", 4000);
            setLoadedConfigurations([]);
            setDraftValues({});
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        if (!open) {
            return;
        }

        loadSettings();
    }, [loadSettings, open]);

    const handleDraftChange = useCallback((configurationKey, value) => {
        setDraftValues((previous) => ({
            ...previous,
            [configurationKey]: String(value ?? ""),
        }));

        setValidationErrors((previous) => {
            if (!previous[configurationKey]) {
                return previous;
            }

            const next = { ...previous };
            delete next[configurationKey];
            return next;
        });
    }, []);

    const validateAll = useCallback(() => {
        const nextErrors = {};

        CALIBRATION_LEARNING_CONFIG_DEFINITIONS.forEach((definition) => {
            const message = validateSetting(
                definition,
                draftValues[definition.configurationKey]
            );
            if (message) {
                nextErrors[definition.configurationKey] = message;
            }
        });

        setValidationErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [draftValues]);

    const handleInitializeMissing = useCallback(async () => {
        if (missingDefinitions.length === 0) {
            notify("All learned calibration settings are already initialized.", "info", 2500);
            return;
        }

        setSaving(true);
        try {
            for (const definition of missingDefinitions) {
                await dispatch(
                    createSystemConfiguration(
                        buildPayload(definition, null, definition.defaultValue)
                    )
                );
            }

            notify(
                `Initialized ${missingDefinitions.length} learned calibration setting${missingDefinitions.length === 1 ? "" : "s"}.`,
                "success",
                3000
            );
            await loadSettings();
            onSaved?.();
        } catch (error) {
            notify("Failed to initialize learned calibration settings.", "error", 4000);
        } finally {
            setSaving(false);
        }
    }, [dispatch, loadSettings, missingDefinitions, onSaved]);

    const handleSaveAll = useCallback(async () => {
        if (!validateAll()) {
            notify("Fix the validation errors before saving settings.", "error", 3500);
            return;
        }

        const changedDefinitions = CALIBRATION_LEARNING_CONFIG_DEFINITIONS.filter((definition) => {
            const existingValue = normalizeValue(
                configByKey[definition.configurationKey]?.configurationValue,
                definition.defaultValue
            );
            const draftValue = normalizeValue(
                draftValues[definition.configurationKey],
                definition.defaultValue
            );
            return existingValue !== draftValue || !configByKey[definition.configurationKey];
        });

        if (changedDefinitions.length === 0) {
            notify("There are no calibration-setting changes to save.", "info", 2500);
            return;
        }

        setSaving(true);
        try {
            for (const definition of changedDefinitions) {
                const existingConfig = configByKey[definition.configurationKey] || null;
                const payload = buildPayload(
                    definition,
                    existingConfig,
                    draftValues[definition.configurationKey]
                );

                if (existingConfig?.id) {
                    await dispatch(updateSystemConfiguration(payload));
                } else {
                    await dispatch(createSystemConfiguration(payload));
                }
            }

            notify(
                `Saved ${changedDefinitions.length} learned calibration setting${changedDefinitions.length === 1 ? "" : "s"}.`,
                "success",
                3000
            );
            await loadSettings();
            onSaved?.();
        } catch (error) {
            notify("Failed to save learned calibration settings.", "error", 4000);
        } finally {
            setSaving(false);
        }
    }, [configByKey, dispatch, draftValues, loadSettings, onSaved, validateAll]);

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="FMS Learned Calibration Settings"
            width={720}
            panelClassName="m365-calibration-settings-panel-shell"
        >
            <div className="m365-calibration-settings-panel">
                <div className="m365-calibration-settings-panel__content">


                    <div className="m365-calibration-settings-panel__notice">
                        Use these values to control interval bucketing, stability windows, minimum usable events, and readiness thresholds for FMS learned calibration.
                    </div>

                    <div className="m365-calibration-settings-panel__list">
                        {CALIBRATION_LEARNING_CONFIG_DEFINITIONS.map((definition) => {
                            const config = configByKey[definition.configurationKey] || null;
                            const value = normalizeValue(
                                draftValues[definition.configurationKey],
                                definition.defaultValue
                            );
                            const error = validationErrors[definition.configurationKey];
                            const isBoolean = definition.dataType === "Boolean";
                            const isNumeric = definition.dataType === "Integer" || definition.dataType === "Decimal";

                            return (
                                <section key={definition.configurationKey} className="m365-calibration-settings-panel__row">
                                    <div className="m365-calibration-settings-panel__row-main">
                                        <div className="m365-calibration-settings-panel__row-header">
                                            <div className="m365-calibration-settings-panel__row-title-group">
                                                <h4>{definition.title}</h4>
                                                <button
                                                    type="button"
                                                    className="m365-calibration-settings-panel__info-btn"
                                                    aria-label={`About ${definition.title}`}
                                                >
                                                    <i className="fa-light fa-circle-info"></i>
                                                    <span className="m365-calibration-settings-panel__tooltip" role="tooltip">
                                                        {definition.description}
                                                    </span>
                                                </button>
                                            </div>
                                            <span className={`m365-badge ${config ? "m365-badge--success" : "m365-badge--warning"}`}>
                                                {config ? "Initialized" : "Missing"}
                                            </span>
                                        </div>

                                        <div className="m365-calibration-settings-panel__key">{definition.configurationKey}</div>

                                        <div className="m365-calibration-settings-panel__meta">
                                            <span>Default: {definition.defaultValue}</span>
                                            {definition.minValue !== undefined && definition.minValue !== null && (
                                                <span>Min: {definition.minValue}</span>
                                            )}
                                            {definition.maxValue !== undefined && definition.maxValue !== null && (
                                                <span>Max: {definition.maxValue}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="m365-calibration-settings-panel__field-wrap">
                                        <div className="m365-calibration-settings-panel__field">
                                            <label className="m365-field__label" htmlFor={definition.configurationKey}>
                                                Current Value
                                            </label>

                                            {isBoolean ? (
                                                <select
                                                    id={definition.configurationKey}
                                                    className="m365-select"
                                                    value={value.toLowerCase()}
                                                    onChange={(event) => handleDraftChange(definition.configurationKey, event.target.value)}
                                                    disabled={loading || saving}
                                                >
                                                    <option value="true">true</option>
                                                    <option value="false">false</option>
                                                </select>
                                            ) : (
                                                <input
                                                    id={definition.configurationKey}
                                                    className={`m365-input ${error ? "m365-calibration-settings-panel__input--error" : ""}`.trim()}
                                                    type={isNumeric ? "number" : "text"}
                                                    step={definition.dataType === "Decimal" ? "0.1" : "1"}
                                                    min={definition.minValue ?? undefined}
                                                    max={definition.maxValue ?? undefined}
                                                    value={value}
                                                    onChange={(event) => handleDraftChange(definition.configurationKey, event.target.value)}
                                                    disabled={loading || saving}
                                                />
                                            )}

                                            {error ? (
                                                <div className="m365-calibration-settings-panel__error">{error}</div>
                                            ) : (
                                                <div className="m365-field__hint">
                                                    {config ? "Loaded from SystemConfiguration." : "This key will be created when you save or initialize missing keys."}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>

                <div className="m365-calibration-settings-panel__footer">
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={loadSettings}
                        disabled={loading || saving}
                    >
                        <i className="fa-light fa-rotate-right"></i>
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={handleInitializeMissing}
                        disabled={loading || saving || missingDefinitions.length === 0}
                    >
                        <i className="fa-light fa-sparkles"></i>
                        {missingDefinitions.length > 0 ? `Initialize Missing (${missingDefinitions.length})` : "All Keys Initialized"}
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--primary"
                        onClick={handleSaveAll}
                        disabled={loading || saving}
                    >
                        <i className="fa-light fa-floppy-disk"></i>
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

CalibrationLearningSettingsPanel.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func,
};

CalibrationLearningSettingsPanel.defaultProps = {
    open: false,
    onSaved: null,
};

export default CalibrationLearningSettingsPanel;
