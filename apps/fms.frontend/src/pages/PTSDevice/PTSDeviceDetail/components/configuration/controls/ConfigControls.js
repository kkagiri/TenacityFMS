/**
 * ConfigControls.js
 * Reusable HTML-based form controls for PTS device configuration
 * Uses native HTML elements with Tailwind styling (tw- prefix)
 */

import React, { useState } from "react";
import "./ConfigControls.scss";

/**
 * Toggle Switch - HTML-based toggle control
 */
export const Toggle = ({
  value,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  className = "",
}) => {
  const sizeClasses = {
    sm: "tw-w-8 tw-h-4",
    md: "tw-w-11 tw-h-6",
    lg: "tw-w-14 tw-h-7",
  };

  const dotSizeClasses = {
    sm: "tw-w-3 tw-h-3",
    md: "tw-w-5 tw-h-5",
    lg: "tw-w-6 tw-h-6",
  };

  const translateClasses = {
    sm: "tw-translate-x-4",
    md: "tw-translate-x-5",
    lg: "tw-translate-x-7",
  };

  return (
    <label className={`config-toggle tw-flex tw-items-center tw-gap-3 ${disabled ? "tw-opacity-50 tw-cursor-not-allowed" : "tw-cursor-pointer"} ${className}`}>
      <div className="tw-relative">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="tw-sr-only"
        />
        <div
          className={`toggle-track ${sizeClasses[size]} tw-rounded-full tw-transition-colors tw-duration-200 ${
            value ? "tw-bg-blue-600" : "tw-bg-gray-400"
          }`}
        />
        <div
          className={`toggle-dot ${dotSizeClasses[size]} tw-absolute tw-top-0.5 tw-left-0.5 tw-bg-white tw-rounded-full tw-shadow tw-transition-transform tw-duration-200 ${
            value ? translateClasses[size] : "tw-translate-x-0"
          }`}
        />
      </div>
      {(label || description) && (
        <div className="tw-flex tw-flex-col">
          {label && <span className="tw-text-sm tw-font-medium tw-text-gray-700">{label}</span>}
          {description && <span className="tw-text-xs tw-text-gray-500">{description}</span>}
        </div>
      )}
    </label>
  );
};

/**
 * Checkbox - HTML-based checkbox control
 */
export const Checkbox = ({
  value,
  onChange,
  disabled = false,
  label,
  description,
  className = "",
}) => {
  return (
    <label className={`config-checkbox tw-flex tw-items-start tw-gap-3 ${disabled ? "tw-opacity-50 tw-cursor-not-allowed" : "tw-cursor-pointer"} ${className}`}>
      <div className="tw-relative tw-mt-0.5">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="tw-w-4 tw-h-4 tw-rounded tw-border-gray-300 tw-text-blue-600 focus:tw-ring-blue-500 focus:tw-ring-2"
        />
      </div>
      {(label || description) && (
        <div className="tw-flex tw-flex-col">
          {label && <span className="tw-text-sm tw-font-medium tw-text-gray-700">{label}</span>}
          {description && <span className="tw-text-xs tw-text-gray-500">{description}</span>}
        </div>
      )}
    </label>
  );
};

/**
 * Slider - HTML-based range slider control
 */
export const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = true,
  unit = "",
  className = "",
}) => {
  return (
    <div className={`config-slider ${disabled ? "tw-opacity-50" : ""} ${className}`}>
      {(label || showValue) && (
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
          {label && <span className="tw-text-sm tw-font-medium tw-text-gray-700">{label}</span>}
          {showValue && (
            <span className="tw-text-sm tw-font-mono tw-text-blue-600 tw-bg-blue-50 tw-px-2 tw-py-0.5 tw-rounded">
              {value}{unit}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => !disabled && onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="tw-w-full tw-h-2 tw-bg-gray-200 tw-rounded-lg tw-appearance-none tw-cursor-pointer slider-input"
      />
      <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-400 tw-mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

/**
 * NumberInput - HTML-based number input with +/- buttons
 */
export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  label,
  unit = "",
  className = "",
}) => {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className={`config-number-input ${disabled ? "tw-opacity-50" : ""} ${className}`}>
      {label && <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">{label}</label>}
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-bg-gray-100 tw-border tw-border-gray-300 tw-rounded hover:tw-bg-gray-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          <span><i className="fa-light fa-minus tw-text-sm"></i></span>
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => !disabled && onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="tw-w-20 tw-text-center tw-border tw-border-gray-300 tw-rounded tw-py-1 tw-px-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
        />
        {unit && <span className="tw-text-sm tw-text-gray-500">{unit}</span>}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-bg-gray-100 tw-border tw-border-gray-300 tw-rounded hover:tw-bg-gray-200 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          <span><i className="fa-light fa-plus tw-text-sm"></i></span>
        </button>
      </div>
    </div>
  );
};

/**
 * Select - HTML-based dropdown select
 */
export const Select = ({
  value,
  onChange,
  options = [],
  disabled = false,
  label,
  placeholder = "Select...",
  className = "",
}) => {
  return (
    <div className={`config-select ${disabled ? "tw-opacity-50" : ""} ${className}`}>
      {label && <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">{label}</label>}
      <select
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-py-2 tw-px-3 tw-text-sm tw-bg-white focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * TextInput - HTML-based text input
 */
export const TextInput = ({
  value,
  onChange,
  disabled = false,
  label,
  placeholder = "",
  type = "text",
  className = "",
}) => {
  return (
    <div className={`config-text-input ${disabled ? "tw-opacity-50" : ""} ${className}`}>
      {label && <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-py-2 tw-px-3 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
      />
    </div>
  );
};

/**
 * ConfigCard - Wrapper card for configuration items
 */
export const ConfigCard = ({
  title,
  icon,
  description,
  children,
  hasChanges = false,
  className = "",
}) => {
  return (
    <div className={`config-card tw-bg-white tw-rounded-lg tw-border ${hasChanges ? "tw-border-yellow-400 tw-bg-yellow-50" : "tw-border-gray-200"} tw-p-4 ${className}`}>
      {(title || icon) && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
          {icon && <span><i className={`${icon} tw-text-gray-600`}></i></span>}
          {title && <h4 className="tw-font-medium tw-text-gray-800">{title}</h4>}
        </div>
      )}
      {description && <p className="tw-text-xs tw-text-gray-500 tw-mb-3">{description}</p>}
      {children}
    </div>
  );
};

/**
 * ConfigSection - Section wrapper with header
 */
export const ConfigSection = ({
  title,
  icon,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  actions,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`config-section tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-mb-4 ${className}`}>
      <div
        className={`tw-flex tw-items-center tw-justify-between tw-p-4 ${collapsible ? "tw-cursor-pointer hover:tw-bg-gray-100" : ""}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="tw-flex tw-items-center tw-gap-3">
          {icon && <span><i className={`${icon} tw-text-xl tw-text-blue-600`}></i></span>}
          <div>
            {title && <h3 className="tw-font-semibold tw-text-gray-800">{title}</h3>}
            {description && <p className="tw-text-sm tw-text-gray-500">{description}</p>}
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {actions}
          {collapsible && (
            <span className="tw-text-gray-400">
              <i className={`fa-light ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
            </span>
          )}
        </div>
      </div>
      {(!collapsible || isExpanded) && (
        <div className="tw-p-4 tw-pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * StatusBadge - Display status indicator
 */
export const StatusBadge = ({ status, label, className = "" }) => {
  const statusStyles = {
    success: "tw-bg-green-100 tw-text-green-800 tw-border-green-200",
    warning: "tw-bg-yellow-100 tw-text-yellow-800 tw-border-yellow-200",
    error: "tw-bg-red-100 tw-text-red-800 tw-border-red-200",
    info: "tw-bg-blue-100 tw-text-blue-800 tw-border-blue-200",
    neutral: "tw-bg-gray-100 tw-text-gray-800 tw-border-gray-200",
  };

  const statusIcons = {
    success: "fa-check-circle",
    warning: "fa-exclamation-triangle",
    error: "fa-times-circle",
    info: "fa-info-circle",
    neutral: "fa-circle",
  };

  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-rounded-full tw-border ${statusStyles[status] || statusStyles.neutral} ${className}`}>
      <span><i className={`fa-light ${statusIcons[status] || statusIcons.neutral}`}></i></span>
      {label}
    </span>
  );
};

export default {
  Toggle,
  Checkbox,
  Slider,
  NumberInput,
  Select,
  TextInput,
  ConfigCard,
  ConfigSection,
  StatusBadge,
};
