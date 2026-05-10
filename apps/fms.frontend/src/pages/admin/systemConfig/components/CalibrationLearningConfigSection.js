/**
 * File: CalibrationLearningConfigSection.js
 * Purpose: Surfaces FMS learned calibration system settings and bootstrap actions inside the admin system configuration page.
 * Dependencies: React, PropTypes, devextreme-react/button
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - renders calibration-learning definitions with current/default values
 * - highlights missing Calibration.* rows that still need initialization
 * - provides quick actions to filter to Calibration category and seed missing keys
 */
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Button from "devextreme-react/button";

export const CALIBRATION_LEARNING_CONFIG_DEFINITIONS = [
    {
        configurationKey: "Calibration.LearningEnabled",
        title: "Learning Enabled",
        description: "Global toggle for FMS learned and detected calibration workflows.",
        dataType: "Boolean",
        category: "Calibration",
        defaultValue: "false",
        validationPattern: "^(true|false|1|0)$",
    },
    {
        configurationKey: "Calibration.HeightIntervalMm",
        title: "Height Interval",
        description: "Height bucket size, in millimetres, used when grouping learned calibration observations.",
        dataType: "Integer",
        category: "Calibration",
        defaultValue: "50",
        minValue: 1,
        maxValue: 1000,
        validationPattern: "^[0-9]+$",
    },
    {
        configurationKey: "Calibration.MinObservationsPerInterval",
        title: "Minimum Observations",
        description: "Minimum number of observations required before an interval can contribute to a learned chart.",
        dataType: "Integer",
        category: "Calibration",
        defaultValue: "5",
        minValue: 1,
        maxValue: 1000,
        validationPattern: "^[0-9]+$",
    },
    {
        configurationKey: "Calibration.StabilityWindowMinutes",
        title: "Stability Window",
        description: "Required quiet period before and after an event to treat probe readings as stable.",
        dataType: "Integer",
        category: "Calibration",
        defaultValue: "5",
        minValue: 1,
        maxValue: 1440,
        validationPattern: "^[0-9]+$",
    },
    {
        configurationKey: "Calibration.MaxHeightVarianceMm",
        title: "Max Height Variance",
        description: "Maximum allowed probe fluctuation, in millimetres, inside the stability window.",
        dataType: "Decimal",
        category: "Calibration",
        defaultValue: "2.0",
        minValue: 0,
        maxValue: 100,
        validationPattern: "^([0-9]+)(\\.[0-9]+)?$",
    },
    {
        configurationKey: "Calibration.MinVolumeChangeLitres",
        title: "Minimum Volume Change",
        description: "Minimum usable volume change, in litres, to accept an event for calibration learning.",
        dataType: "Decimal",
        category: "Calibration",
        defaultValue: "10.0",
        minValue: 0,
        maxValue: 100000,
        validationPattern: "^([0-9]+)(\\.[0-9]+)?$",
    },
    {
        configurationKey: "Calibration.BackgroundTriggerThreshold",
        title: "Background Trigger Threshold",
        description: "Number of newly accumulated learning data points required before recalculation availability should be raised.",
        dataType: "Integer",
        category: "Calibration",
        defaultValue: "10",
        minValue: 1,
        maxValue: 100000,
        validationPattern: "^[0-9]+$",
    },
];

const CalibrationLearningConfigSection = ({
    configurations,
    loading,
    saving,
    onEdit,
    onInitializeMissing,
    onFilterToCalibration,
}) => {
    const configByKey = useMemo(() => {
        const loadedItems = Array.isArray(configurations) ? configurations : [];
        return loadedItems.reduce((lookup, config) => {
            if (config?.configurationKey) {
                lookup[config.configurationKey] = config;
            }
            return lookup;
        }, {});
    }, [configurations]);

    const missingCount = useMemo(
        () => CALIBRATION_LEARNING_CONFIG_DEFINITIONS.filter((item) => !configByKey[item.configurationKey]).length,
        [configByKey]
    );

    return (
        <div className="tw-mb-6 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-5 tw-shadow-sm">
            <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
                <div>
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-900">
                        <i className="fa-light fa-brain-circuit tw-text-blue-600"></i>
                        FMS Learned Calibration Settings
                    </div>
                    <p className="tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-gray-600">
                        These settings control the new FMS-side learned and detected calibration workflow. The current tank workspace remains PTS calibration. Use this section to initialize or edit the Calibration.* keys defined for Phase 9.
                    </p>
                </div>

                <div className="tw-flex tw-flex-wrap tw-gap-2">
                    <Button
                        text="Filter To Calibration"
                        icon="fa-light fa-filter"
                        type="normal"
                        stylingMode="outlined"
                        onClick={onFilterToCalibration}
                        disabled={loading}
                    />
                    <Button
                        text={missingCount > 0 ? `Initialize Missing (${missingCount})` : "All Keys Initialized"}
                        icon="fa-light fa-sparkles"
                        type="default"
                        stylingMode="contained"
                        onClick={onInitializeMissing}
                        disabled={loading || saving || missingCount === 0}
                    />
                </div>
            </div>

            <div className="tw-mt-4 tw-rounded-md tw-border tw-border-blue-100 tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-blue-900">
                Current values shown below come from the loaded SystemConfiguration rows on this page. If you want the page scoped only to calibration settings, use Filter To Calibration first.
            </div>

            <div className="tw-mt-5 tw-grid tw-grid-cols-1 tw-gap-4 xl:tw-grid-cols-2">
                {CALIBRATION_LEARNING_CONFIG_DEFINITIONS.map((definition) => {
                    const config = configByKey[definition.configurationKey] || null;
                    const currentValue = config?.configurationValue ?? definition.defaultValue;

                    return (
                        <div
                            key={definition.configurationKey}
                            className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4"
                        >
                            <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                                <div>
                                    <div className="tw-text-sm tw-font-semibold tw-text-gray-900">{definition.title}</div>
                                    <div className="tw-mt-1 tw-font-mono tw-text-xs tw-text-gray-500">{definition.configurationKey}</div>
                                </div>
                                <span
                                    className={`tw-inline-flex tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${config
                                        ? "tw-bg-green-100 tw-text-green-800"
                                        : "tw-bg-amber-100 tw-text-amber-800"}`}
                                >
                                    {config ? "Initialized" : "Missing"}
                                </span>
                            </div>

                            <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-gray-600">{definition.description}</p>

                            <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
                                <div>
                                    <div className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-500">Current Value</div>
                                    <div className="tw-mt-1 tw-text-sm tw-font-semibold tw-text-gray-900">{String(currentValue)}</div>
                                </div>
                                <div>
                                    <div className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-500">Default</div>
                                    <div className="tw-mt-1 tw-text-sm tw-text-gray-800">{definition.defaultValue}</div>
                                </div>
                                <div>
                                    <div className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-gray-500">Type</div>
                                    <div className="tw-mt-1 tw-text-sm tw-text-gray-800">{definition.dataType}</div>
                                </div>
                            </div>

                            <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between tw-gap-3">
                                <div className="tw-text-xs tw-text-gray-500">
                                    Category: {definition.category}
                                </div>
                                {config ? (
                                    <Button
                                        text="Edit"
                                        icon="fa-light fa-pen"
                                        type="normal"
                                        stylingMode="outlined"
                                        onClick={() => onEdit(config)}
                                        disabled={saving}
                                    />
                                ) : (
                                    <span className="tw-text-xs tw-font-medium tw-text-amber-700">Initialize this key to edit it.</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

CalibrationLearningConfigSection.propTypes = {
    configurations: PropTypes.array,
    loading: PropTypes.bool,
    saving: PropTypes.bool,
    onEdit: PropTypes.func.isRequired,
    onInitializeMissing: PropTypes.func.isRequired,
    onFilterToCalibration: PropTypes.func.isRequired,
};

CalibrationLearningConfigSection.defaultProps = {
    configurations: [],
    loading: false,
    saving: false,
};

export default CalibrationLearningConfigSection;