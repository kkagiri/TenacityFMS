/**
 * File: AlertTypeCard.js
 * Purpose: Renders a single alert type configuration card with toggle, parameter
 *          editing, and reset-to-defaults capability. Used inside AlertConfiguration page.
 * Dependencies: DevExtreme (Switch, NumberBox, Button, TextBox), alertConfigurationApi
 * Last Modified: 2026-02-02
 *
 * Key Components:
 * - AlertTypeCard: Card component for one alert type with inline editing
 */

import React, { useState, useCallback } from 'react';
import NumberBox from 'devextreme-react/number-box';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';
import { confirm } from 'devextreme/ui/dialog';
import notify from 'devextreme/ui/notify';
import alertConfigurationApi from '../../../dataservice/alertConfigurationApi';

const AlertTypeCard = ({ alertConfig, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [editValues, setEditValues] = useState({});

    const handleToggle = useCallback(
        async (newValue) => {
            setIsToggling(true);
            try {
                const result = await alertConfigurationApi.toggleAlert(
                    alertConfig.key,
                    newValue
                );
                if (result.isSuccess) {
                    notify(result.message, 'success', 2000);
                    onRefresh?.();
                } else {
                    notify(result.message, 'error', 3000);
                }
            } catch {
                notify('Failed to toggle alert', 'error', 3000);
            } finally {
                setIsToggling(false);
            }
        },
        [alertConfig.key, onRefresh]
    );

    const startEditing = useCallback(() => {
        const values = {};
        (alertConfig.parameters || []).forEach((p) => {
            values[p.name] = p.currentValue ?? p.defaultValue;
        });
        setEditValues(values);
        setIsEditing(true);
    }, [alertConfig.parameters]);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setEditValues({});
    }, []);

    const handleParamChange = useCallback((paramName, value) => {
        setEditValues((prev) => ({ ...prev, [paramName]: String(value) }));
    }, []);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await alertConfigurationApi.updateAlertConfiguration(
                alertConfig.key,
                editValues
            );
            if (result.isSuccess) {
                notify(result.message, 'success', 2000);
                setIsEditing(false);
                onRefresh?.();
            } else {
                notify(result.message, 'error', 3000);
            }
        } catch {
            notify('Failed to save configuration', 'error', 3000);
        } finally {
            setIsSaving(false);
        }
    }, [alertConfig.key, editValues, onRefresh]);

    const handleReset = useCallback(async () => {
        const result = await confirm(
            `Reset "${alertConfig.displayName}" to factory defaults?`,
            'Confirm Reset'
        );
        if (!result) return;

        try {
            const res = await alertConfigurationApi.resetAlertDefaults(
                alertConfig.key
            );
            if (res.isSuccess) {
                notify(res.message, 'success', 2000);
                setIsEditing(false);
                onRefresh?.();
            } else {
                notify(res.message, 'error', 3000);
            }
        } catch {
            notify('Failed to reset defaults', 'error', 3000);
        }
    }, [alertConfig.key, alertConfig.displayName, onRefresh]);

    const renderParamInput = (param) => {
        const value = isEditing
            ? editValues[param.name] ?? param.currentValue ?? param.defaultValue
            : param.currentValue ?? param.defaultValue;

        const numericValue = parseFloat(value) || 0;

        switch (param.dataType?.toLowerCase()) {
            case 'decimal':
            case 'int':
                return (
                    <NumberBox
                        value={numericValue}
                        onValueChanged={(e) =>
                            handleParamChange(param.name, e.value)
                        }
                        disabled={!isEditing}
                        format={param.dataType === 'decimal' ? '#,##0.##' : '#,##0'}
                        step={param.dataType === 'decimal' ? 0.1 : 1}
                        width="100%"
                        stylingMode="outlined"
                    />
                );
            case 'bool':
                return (
                    <label className="tw-inline-flex tw-items-center tw-cursor-pointer">
                        <input
                            type="checkbox"
                            className="tw-sr-only tw-peer"
                            checked={String(value).toLowerCase() === 'true'}
                            onChange={(e) =>
                                handleParamChange(param.name, e.target.checked)
                            }
                            disabled={!isEditing}
                        />
                        <div className="tw-relative tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-2 peer-focus:tw-ring-blue-300 tw-rounded-full peer-checked:after:tw-translate-x-full rtl:peer-checked:after:tw--translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-blue-600 peer-disabled:tw-opacity-50"></div>
                    </label>
                );
            default:
                return (
                    <TextBox
                        value={String(value)}
                        onValueChanged={(e) =>
                            handleParamChange(param.name, e.value)
                        }
                        disabled={!isEditing}
                        stylingMode="outlined"
                    />
                );
        }
    };

    const isEnabled = alertConfig.enabled;

    return (
        <div
            className={`tw-bg-white tw-rounded-lg tw-border tw-p-5 tw-transition-all tw-duration-200 ${isEnabled
                ? 'tw-border-gray-200 hover:tw-shadow-md'
                : 'tw-border-gray-100 tw-opacity-60'
                }`}
        >
            {/* Header */}
            <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
                <div className="tw-flex-1 tw-mr-4">
                    <h3 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-mb-1">
                        {alertConfig.displayName}
                    </h3>
                    <p className="tw-text-sm tw-text-gray-500">
                        {alertConfig.description}
                    </p>
                </div>
                <label className="tw-inline-flex tw-items-center tw-cursor-pointer" title={isEnabled ? 'Disable alert' : 'Enable alert'}>
                    <input
                        type="checkbox"
                        className="tw-sr-only tw-peer"
                        checked={isEnabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={isToggling}
                    />
                    <div className="tw-relative tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-2 peer-focus:tw-ring-blue-300 tw-rounded-full peer-checked:after:tw-translate-x-full rtl:peer-checked:after:tw--translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-blue-600 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
            </div>

            {/* Parameters */}
            {alertConfig.parameters?.length > 0 && (
                <div className="tw-border-t tw-border-gray-100 tw-pt-4 tw-mt-2">
                    <div className="tw-grid tw-gap-3">
                        {alertConfig.parameters.map((param) => (
                            <div
                                key={param.name}
                                className="tw-flex tw-items-center tw-gap-3"
                            >
                                <div className="tw-flex-1 tw-min-w-0">
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
                                        {param.displayName}
                                        {param.unit && (
                                            <span className="tw-text-gray-400 tw-ml-1">
                                                ({param.unit})
                                            </span>
                                        )}
                                    </label>
                                    {param.description && (
                                        <span className="tw-text-xs tw-text-gray-400">
                                            {param.description}
                                        </span>
                                    )}
                                </div>
                                <div className="tw-w-40">{renderParamInput(param)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
                {isEditing ? (
                    <>
                        <Button
                            text="Cancel"
                            type="normal"
                            stylingMode="text"
                            onClick={cancelEditing}
                        />
                        <Button
                            text="Save"
                            type="default"
                            stylingMode="contained"
                            onClick={handleSave}
                            disabled={isSaving}
                            icon={isSaving ? 'fa-light fa-spinner fa-spin' : undefined}
                        />
                    </>
                ) : (
                    <>
                        <Button
                            text="Reset Defaults"
                            type="normal"
                            stylingMode="text"
                            onClick={handleReset}
                            hint="Reset to factory defaults"
                            icon="fa-light fa-rotate-left"
                        />
                        <Button
                            text="Edit"
                            type="default"
                            stylingMode="outlined"
                            onClick={startEditing}
                            disabled={!alertConfig.enabled}
                            icon="fa-light fa-pen-to-square"
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertTypeCard;
