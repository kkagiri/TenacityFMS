/**
 * File: SystemConfigTypedValueEditor.js
 * Purpose: Renders the correct value editor for a system configuration based on its declared data type.
 * Dependencies: react, prop-types, devextreme-react controls, SystemConfigForm helpers
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - SystemConfigTypedValueEditor: Chooses a data-aware control and supporting helper text for a configuration field
 */
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import DateBox from "devextreme-react/date-box";
import NumberBox from "devextreme-react/number-box";
import SelectBox from "devextreme-react/select-box";
import TextArea from "devextreme-react/text-area";
import TextBox from "devextreme-react/text-box";

import {
    getDataTypeDescriptor,
    normalizeBooleanString,
    parseAllowedValues,
} from "./SystemConfigForm.utils";

const toNumericValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? null : parsedValue;
};

const SystemConfigTypedValueEditor = ({
    dataType,
    value,
    onChange,
    minValue,
    maxValue,
    possibleValues,
    placeholder,
    disabled,
    error,
    allowEmpty,
}) => {
    const descriptor = useMemo(() => getDataTypeDescriptor(dataType), [dataType]);
    const allowedItems = useMemo(() => parseAllowedValues(possibleValues), [possibleValues]);
    const effectivePlaceholder = placeholder || descriptor.placeholder;

    const renderBooleanEditor = () => {
        const normalizedValue = normalizeBooleanString(value);

        return (
            <div className="system-config-boolean-group" role="radiogroup" aria-label="Boolean value selector">
                {[
                    { value: "true", label: "True", icon: "fa-check" },
                    { value: "false", label: "False", icon: "fa-xmark" },
                ].map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={normalizedValue === item.value}
                        className={`system-config-boolean-option ${normalizedValue === item.value ? "system-config-boolean-option--active" : ""}`}
                        onClick={() => onChange(item.value)}
                        disabled={disabled}
                    >
                        <i className={`fa-light ${item.icon}`}></i>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    const renderAllowedValuesEditor = () => (
        <SelectBox
            value={value || null}
            onValueChanged={(event) => onChange(event.value || "")}
            dataSource={allowedItems}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            stylingMode="outlined"
            searchEnabled={allowedItems.length > 8}
        />
    );

    const renderNumericEditor = () => (
        <NumberBox
            value={toNumericValue(value)}
            onValueChanged={(event) => onChange(event.value === null || event.value === undefined ? "" : String(event.value))}
            min={minValue ?? undefined}
            max={maxValue ?? undefined}
            step={descriptor.kind === "integer" ? 1 : 0.01}
            showSpinButtons={true}
            stylingMode="outlined"
            disabled={disabled}
            placeholder={effectivePlaceholder}
            format={descriptor.kind === "integer" ? "#0" : "#0.########"}
        />
    );

    const renderDateTimeEditor = () => (
        <DateBox
            type="datetime"
            value={value || null}
            onValueChanged={(event) => onChange(event.value || "")}
            displayFormat="yyyy-MM-dd HH:mm"
            useMaskBehavior={true}
            disabled={disabled}
            stylingMode="outlined"
            placeholder={effectivePlaceholder}
        />
    );

    const renderTimeSpanEditor = () => (
        <input
            type="time"
            step="1"
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className={`system-config-native-input ${error ? "system-config-native-input--error" : ""}`}
        />
    );

    const renderJsonEditor = () => (
        <TextArea
            value={value}
            onValueChanged={(event) => onChange(event.value || "")}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            stylingMode="outlined"
            height={160}
            className="system-config-json-editor"
        />
    );

    const renderTextEditor = () => {
        if (descriptor.kind === "password") {
            return (
                <TextBox
                    value={value}
                    onValueChanged={(event) => onChange(event.value || "")}
                    mode="password"
                    placeholder={effectivePlaceholder}
                    disabled={disabled}
                    stylingMode="outlined"
                />
            );
        }

        const inputType = descriptor.kind === "email" ? "email" : descriptor.kind === "url" ? "url" : "text";

        return (
            <input
                type={inputType}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                placeholder={effectivePlaceholder}
                className={`system-config-native-input ${error ? "system-config-native-input--error" : ""}`}
                autoComplete={descriptor.kind === "email" ? "email" : "off"}
            />
        );
    };

    const renderEditor = () => {
        if (descriptor.kind === "boolean") {
            return renderBooleanEditor();
        }

        if (allowedItems.length > 0) {
            return renderAllowedValuesEditor();
        }

        if (["integer", "decimal"].includes(descriptor.kind)) {
            return renderNumericEditor();
        }

        if (descriptor.kind === "datetime") {
            return renderDateTimeEditor();
        }

        if (descriptor.kind === "timespan") {
            return renderTimeSpanEditor();
        }

        if (descriptor.kind === "json") {
            return renderJsonEditor();
        }

        return renderTextEditor();
    };

    return (
        <div className="system-config-typed-editor">
            <div className="system-config-typed-editor__surface">{renderEditor()}</div>
            <div className="system-config-typed-editor__meta">
                <div className="system-config-typed-editor__badge">
                    <i className={`fa-light ${descriptor.icon}`}></i>
                    <span>{descriptor.title}</span>
                </div>
                <p className="system-config-typed-editor__description">
                    {descriptor.description}
                    {!allowEmpty ? " This field is required." : " Leave blank to omit a default."}
                </p>
            </div>
        </div>
    );
};

SystemConfigTypedValueEditor.propTypes = {
    dataType: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    minValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    possibleValues: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
    error: PropTypes.string,
    allowEmpty: PropTypes.bool,
};

SystemConfigTypedValueEditor.defaultProps = {
    dataType: "String",
    value: "",
    minValue: null,
    maxValue: null,
    possibleValues: "",
    placeholder: "",
    disabled: false,
    error: "",
    allowEmpty: false,
};

export default SystemConfigTypedValueEditor;