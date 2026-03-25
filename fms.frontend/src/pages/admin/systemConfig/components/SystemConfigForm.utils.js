/**
 * File: SystemConfigForm.utils.js
 * Purpose: Shared datatype metadata, editor normalization, and validation helpers for the system configuration form.
 * Dependencies: none
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - getDataTypeDescriptor(): Maps stored data type labels to a normalized editor strategy
 * - validateConfiguredValue(): Applies datatype, range, regex, and allowed-value validation
 * - serializeConfiguredValue(): Normalizes structured values before they are sent to the API
 */

const DATA_TYPE_ALIAS_MAP = {
    string: "string",
    int: "integer",
    int32: "integer",
    integer: "integer",
    long: "integer",
    number: "decimal",
    double: "decimal",
    decimal: "decimal",
    float: "decimal",
    bool: "boolean",
    boolean: "boolean",
    datetime: "datetime",
    date: "datetime",
    timespan: "timespan",
    time: "timespan",
    json: "json",
    object: "json",
    url: "url",
    uri: "url",
    email: "email",
    password: "password",
};

const DATA_TYPE_DESCRIPTORS = {
    string: {
        kind: "string",
        title: "Plain text",
        icon: "fa-input-text",
        description: "Best for free-form text values and named settings.",
        placeholder: "Enter text",
    },
    integer: {
        kind: "integer",
        title: "Whole number",
        icon: "fa-hashtag",
        description: "Only whole numbers are accepted.",
        placeholder: "Enter a whole number",
    },
    decimal: {
        kind: "decimal",
        title: "Decimal number",
        icon: "fa-chart-line",
        description: "Accepts fractional numeric values.",
        placeholder: "Enter a decimal number",
    },
    boolean: {
        kind: "boolean",
        title: "True or false",
        icon: "fa-toggle-on",
        description: "Rendered as an explicit on or off choice.",
        placeholder: "Choose true or false",
    },
    datetime: {
        kind: "datetime",
        title: "Date and time",
        icon: "fa-calendar-clock",
        description: "Stores a full timestamp value.",
        placeholder: "Select a date and time",
    },
    timespan: {
        kind: "timespan",
        title: "Time value",
        icon: "fa-clock",
        description: "Use HH:mm or HH:mm:ss format for time-based settings.",
        placeholder: "HH:mm",
    },
    json: {
        kind: "json",
        title: "JSON document",
        icon: "fa-brackets-curly",
        description: "Valid JSON is required before save.",
        placeholder: '{"key":"value"}',
    },
    url: {
        kind: "url",
        title: "URL",
        icon: "fa-link",
        description: "Use a fully qualified URL, including protocol.",
        placeholder: "https://example.com",
    },
    email: {
        kind: "email",
        title: "Email address",
        icon: "fa-envelope",
        description: "Accepts standard mailbox addresses.",
        placeholder: "name@example.com",
    },
    password: {
        kind: "password",
        title: "Secret value",
        icon: "fa-key",
        description: "Input is masked to reduce accidental disclosure.",
        placeholder: "Enter secret value",
    },
};

export const BASE_DATA_TYPE_OPTIONS = [
    { value: "String", text: "String" },
    { value: "Int32", text: "Int32" },
    { value: "Double", text: "Double" },
    { value: "Boolean", text: "Boolean" },
    { value: "DateTime", text: "DateTime" },
    { value: "TimeSpan", text: "TimeSpan" },
    { value: "Json", text: "JSON" },
    { value: "Url", text: "URL" },
    { value: "Email", text: "Email" },
    { value: "Password", text: "Password" },
];

const BOOLEAN_TRUE_VALUES = new Set(["true", "1", "yes", "on"]);
const BOOLEAN_FALSE_VALUES = new Set(["false", "0", "no", "off"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_SPAN_REGEX = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const padNumber = (value) => String(value).padStart(2, "0");

const toStringValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
};

const toLocalDateTimeString = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return "";
    }

    return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}T${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
};

export const normalizeDataType = (value) => {
    const key = toStringValue(value).trim().toLowerCase();
    return DATA_TYPE_ALIAS_MAP[key] || "string";
};

export const getDataTypeDescriptor = (value) => {
    return DATA_TYPE_DESCRIPTORS[normalizeDataType(value)] || DATA_TYPE_DESCRIPTORS.string;
};

export const getDataTypeOptions = (currentType) => {
    const normalizedCurrent = toStringValue(currentType).trim();
    if (!normalizedCurrent) {
        return BASE_DATA_TYPE_OPTIONS;
    }

    const exists = BASE_DATA_TYPE_OPTIONS.some(
        (option) => option.value.toLowerCase() === normalizedCurrent.toLowerCase()
    );

    if (exists) {
        return BASE_DATA_TYPE_OPTIONS;
    }

    return [
        ...BASE_DATA_TYPE_OPTIONS,
        { value: normalizedCurrent, text: normalizedCurrent },
    ].sort((left, right) => left.text.localeCompare(right.text));
};

export const parseAllowedValues = (value) => {
    return toStringValue(value)
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
};

export const normalizeBooleanString = (value) => {
    const rawValue = toStringValue(value).trim().toLowerCase();

    if (BOOLEAN_TRUE_VALUES.has(rawValue)) {
        return "true";
    }

    if (BOOLEAN_FALSE_VALUES.has(rawValue)) {
        return "false";
    }

    return "";
};

export const prepareValueForEditor = (value, dataType) => {
    const rawValue = toStringValue(value);
    if (!rawValue) {
        return "";
    }

    const descriptor = getDataTypeDescriptor(dataType);

    if (descriptor.kind === "boolean") {
        return normalizeBooleanString(rawValue) || rawValue;
    }

    if (descriptor.kind === "datetime") {
        const parsedDate = new Date(rawValue);
        return Number.isNaN(parsedDate.getTime()) ? rawValue : toLocalDateTimeString(parsedDate);
    }

    if (descriptor.kind === "timespan") {
        const trimmed = rawValue.trim();
        const match = trimmed.match(TIME_SPAN_REGEX);
        if (!match) {
            return trimmed;
        }

        return `${padNumber(match[1])}:${padNumber(match[2])}${match[3] ? `:${padNumber(match[3].replace(":", ""))}` : ""}`;
    }

    if (descriptor.kind === "json") {
        try {
            return JSON.stringify(JSON.parse(rawValue), null, 2);
        } catch {
            return rawValue;
        }
    }

    return rawValue;
};

export const serializeConfiguredValue = (value, dataType) => {
    const rawValue = toStringValue(value);
    const descriptor = getDataTypeDescriptor(dataType);

    if (!rawValue.trim()) {
        return "";
    }

    if (descriptor.kind === "integer") {
        return String(parseInt(rawValue, 10));
    }

    if (descriptor.kind === "decimal") {
        return String(Number(rawValue));
    }

    if (descriptor.kind === "boolean") {
        return normalizeBooleanString(rawValue);
    }

    if (descriptor.kind === "datetime") {
        const parsedDate = new Date(rawValue);
        if (Number.isNaN(parsedDate.getTime())) {
            return rawValue.trim();
        }

        return `${parsedDate.getFullYear()}-${padNumber(parsedDate.getMonth() + 1)}-${padNumber(parsedDate.getDate())}T${padNumber(parsedDate.getHours())}:${padNumber(parsedDate.getMinutes())}:${padNumber(parsedDate.getSeconds())}`;
    }

    if (descriptor.kind === "timespan") {
        return rawValue.trim();
    }

    if (descriptor.kind === "json") {
        return JSON.stringify(JSON.parse(rawValue));
    }

    if (["url", "email"].includes(descriptor.kind)) {
        return rawValue.trim();
    }

    return rawValue;
};

export const validateConfiguredValue = ({
    fieldLabel,
    rawValue,
    dataType,
    minValue,
    maxValue,
    validationPattern,
    possibleValues,
    allowEmpty = false,
}) => {
    const value = toStringValue(rawValue);
    const trimmedValue = value.trim();
    const descriptor = getDataTypeDescriptor(dataType);

    if (!trimmedValue) {
        return allowEmpty ? null : `${fieldLabel} is required`;
    }

    if (descriptor.kind === "integer") {
        if (!/^-?\d+$/.test(trimmedValue)) {
            return `${fieldLabel} must be a valid integer`;
        }

        const numericValue = Number(trimmedValue);
        if (minValue !== null && minValue !== undefined && numericValue < Number(minValue)) {
            return `${fieldLabel} must be at least ${minValue}`;
        }

        if (maxValue !== null && maxValue !== undefined && numericValue > Number(maxValue)) {
            return `${fieldLabel} must be no more than ${maxValue}`;
        }
    }

    if (descriptor.kind === "decimal") {
        const numericValue = Number(trimmedValue);
        if (Number.isNaN(numericValue)) {
            return `${fieldLabel} must be a valid decimal number`;
        }

        if (minValue !== null && minValue !== undefined && numericValue < Number(minValue)) {
            return `${fieldLabel} must be at least ${minValue}`;
        }

        if (maxValue !== null && maxValue !== undefined && numericValue > Number(maxValue)) {
            return `${fieldLabel} must be no more than ${maxValue}`;
        }
    }

    if (descriptor.kind === "boolean" && !normalizeBooleanString(trimmedValue)) {
        return `${fieldLabel} must be true or false`;
    }

    if (descriptor.kind === "datetime") {
        const parsedDate = new Date(trimmedValue);
        if (Number.isNaN(parsedDate.getTime())) {
            return `${fieldLabel} must be a valid date and time`;
        }
    }

    if (descriptor.kind === "timespan" && !TIME_SPAN_REGEX.test(trimmedValue)) {
        return `${fieldLabel} must use HH:mm or HH:mm:ss format`;
    }

    if (descriptor.kind === "json") {
        try {
            JSON.parse(trimmedValue);
        } catch {
            return `${fieldLabel} must contain valid JSON`;
        }
    }

    if (descriptor.kind === "url") {
        try {
            new URL(trimmedValue);
        } catch {
            return `${fieldLabel} must be a valid URL`;
        }
    }

    if (descriptor.kind === "email" && !EMAIL_REGEX.test(trimmedValue)) {
        return `${fieldLabel} must be a valid email address`;
    }

    const allowedItems = parseAllowedValues(possibleValues);
    if (allowedItems.length > 0 && !allowedItems.includes(trimmedValue)) {
        return `${fieldLabel} must match one of the allowed values`;
    }

    if (validationPattern) {
        try {
            const regex = new RegExp(validationPattern);
            if (!regex.test(trimmedValue)) {
                return `${fieldLabel} does not match the configured validation pattern`;
            }
        } catch {
            return null;
        }
    }

    return null;
};

export const validateRegexPattern = (value) => {
    const pattern = toStringValue(value).trim();
    if (!pattern) {
        return null;
    }

    try {
        new RegExp(pattern);
        return null;
    } catch {
        return "Validation pattern must be a valid regular expression";
    }
};