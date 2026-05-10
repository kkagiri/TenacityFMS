/**
 * File: SystemConfigForm.js
 * Purpose: System configuration create/edit form rendered inside the global SlidePanel.
 * Dependencies: react, prop-types, devextreme-react controls, SlidePanel, typed editor helpers
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - validateForm(): Validates required, datatype, regex, and allowed-value constraints
 * - handleSave(): Normalizes values by data type and submits payload
 */
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import TextBox from "devextreme-react/text-box";
import TextArea from "devextreme-react/text-area";
import SelectBox from "devextreme-react/select-box";
import NumberBox from "devextreme-react/number-box";
import Button from "devextreme-react/button";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../../components/ui/SlidePanel";
import SystemConfigTypedValueEditor from "./SystemConfigTypedValueEditor";
import {
  getDataTypeDescriptor,
  getDataTypeOptions,
  prepareValueForEditor,
  serializeConfiguredValue,
  validateConfiguredValue,
  validateRegexPattern,
} from "./SystemConfigForm.utils";

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, colorScheme = "blue" }) => {
  const colors = {
    blue: { bg: "tw-bg-blue-500", ring: "focus:tw-ring-blue-300" },
    green: { bg: "tw-bg-green-500", ring: "focus:tw-ring-green-300" },
    purple: { bg: "tw-bg-purple-500", ring: "focus:tw-ring-purple-300" },
  };
  const color = colors[colorScheme] || colors.blue;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 ${color.ring
        } ${checked ? color.bg : "tw-bg-gray-200"}`}
    >
      <span
        className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${checked ? "tw-translate-x-5" : "tw-translate-x-0"
          }`}
      />
    </button>
  );
};

const createEmptyFormData = () => ({
  configurationKey: "",
  configurationValue: "",
  description: "",
  dataType: "String",
  category: "General",
  isActive: true,
  isEditable: true,
  validationPattern: "",
  defaultValue: "",
  minValue: null,
  maxValue: null,
  possibleValues: "",
});

const renderFieldError = (message) => {
  if (!message) {
    return null;
  }

  return <p className="system-config-inline-error">{message}</p>;
};

const SystemConfigForm = ({ visible, config, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState(createEmptyFormData);

  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // Base category options
  const baseCategoryOptions = [
    { value: "General", text: "General" },
    { value: "System", text: "System" },
    { value: "Security", text: "Security" },
    { value: "Database", text: "Database" },
    { value: "API", text: "API" },
    { value: "UI", text: "User Interface" },
    { value: "Performance", text: "Performance" },
    { value: "Logging", text: "Logging" },
    { value: "Notification", text: "Notification" },
    { value: "Integration", text: "Integration" },
    { value: "TankStock", text: "Tank Stock" },
    { value: "Tank Management", text: "Tank Management" },
    { value: "DeviceActivity", text: "Device Activity" },
    { value: "WorkSchedule", text: "Work Schedule" },
    { value: "CommandExecution", text: "Command Execution" },
    { value: "Maintenance", text: "Maintenance" },
    { value: "Calibration", text: "Calibration" },
    { value: "Reconciliation", text: "Reconciliation" },
    { value: "Email", text: "Email" },
    { value: "ConnectionThresholds", text: "Connection Thresholds" },
    { value: "FuelingRules", text: "Fueling Rules" },
    { value: "PTS", text: "PTS" },
    { value: "WebSocket", text: "WebSocket" },
    { value: "Mobile", text: "Mobile" },
    { value: "Reports", text: "Reports" },
  ];

  const valueTypeDescriptor = useMemo(
    () => getDataTypeDescriptor(formData.dataType),
    [formData.dataType]
  );

  const dataTypeOptions = useMemo(
    () => getDataTypeOptions(config?.dataType || formData.dataType),
    [config?.dataType, formData.dataType]
  );

  // Dynamic category options - include config's category if not in the list
  const categoryOptions = useMemo(() => {
    if (config?.category) {
      const existingCategory = baseCategoryOptions.find(
        (opt) => opt.value.toLowerCase() === config.category.toLowerCase()
      );
      if (!existingCategory) {
        // Add the config's category to the list
        return [
          ...baseCategoryOptions,
          { value: config.category, text: config.category },
        ].sort((a, b) => a.text.localeCompare(b.text));
      }
    }
    return baseCategoryOptions;
  }, [config]);

  useEffect(() => {
    if (config) {
      const matchedCategory = categoryOptions.find(
        (opt) =>
          opt.value.toLowerCase() === (config.category || "").toLowerCase()
      );

      setFormData({
        configurationKey: config.configurationKey || "",
        configurationValue: prepareValueForEditor(
          config.configurationValue,
          config.dataType
        ),
        description: config.description || "",
        dataType: config.dataType || "String",
        category: matchedCategory
          ? matchedCategory.value
          : config.category || "General",
        isActive: config.isActive !== undefined ? config.isActive : true,
        isEditable: config.isEditable !== undefined ? config.isEditable : true,
        validationPattern: config.validationPattern || "",
        defaultValue: prepareValueForEditor(config.defaultValue, config.dataType),
        minValue:
          config.minValue !== undefined && config.minValue !== null
            ? config.minValue
            : null,
        maxValue:
          config.maxValue !== undefined && config.maxValue !== null
            ? config.maxValue
            : null,
        possibleValues: config.possibleValues || "",
      });
    } else {
      setFormData(createEmptyFormData());
    }
    setValidationErrors({});
    setActiveTab(0);
  }, [categoryOptions, config, visible]);

  const handleValueChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDataTypeChange = (nextDataType) => {
    setFormData((prev) => ({
      ...prev,
      dataType: nextDataType,
      configurationValue: prepareValueForEditor(prev.configurationValue, nextDataType),
      defaultValue: prepareValueForEditor(prev.defaultValue, nextDataType),
    }));

    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.configurationValue;
      delete nextErrors.defaultValue;
      return nextErrors;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.configurationKey.trim()) {
      errors.configurationKey = "Configuration key is required";
    } else if (formData.configurationKey.length > 255) {
      errors.configurationKey =
        "Configuration key must be 255 characters or less";
    }

    if (!formData.configurationValue.trim()) {
      errors.configurationValue = "Configuration value is required";
    } else if (formData.configurationValue.length > 1000) {
      errors.configurationValue =
        "Configuration value must be 1000 characters or less";
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = "Description must be 500 characters or less";
    }

    if (formData.defaultValue && formData.defaultValue.length > 1000) {
      errors.defaultValue = "Default value must be 1000 characters or less";
    }

    const regexError = validateRegexPattern(formData.validationPattern);
    if (regexError) {
      errors.validationPattern = regexError;
    }

    const configurationValueError = validateConfiguredValue({
      fieldLabel: "Configuration value",
      rawValue: formData.configurationValue,
      dataType: formData.dataType,
      minValue: formData.minValue,
      maxValue: formData.maxValue,
      validationPattern: formData.validationPattern,
      possibleValues: formData.possibleValues,
    });
    if (configurationValueError) {
      errors.configurationValue = configurationValueError;
    }

    const defaultValueError = validateConfiguredValue({
      fieldLabel: "Default value",
      rawValue: formData.defaultValue,
      dataType: formData.dataType,
      minValue: formData.minValue,
      maxValue: formData.maxValue,
      validationPattern: formData.validationPattern,
      possibleValues: formData.possibleValues,
      allowEmpty: true,
    });
    if (defaultValueError) {
      errors.defaultValue = defaultValueError;
    }

    if (["integer", "decimal"].includes(valueTypeDescriptor.kind)) {
      if (formData.minValue !== null && formData.maxValue !== null) {
        if (parseFloat(formData.minValue) >= parseFloat(formData.maxValue)) {
          errors.minValue = "Minimum value must be less than maximum value";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      notify("Please fix validation errors before saving", "error", 3000);
      return;
    }

    const saveData = {
      ...formData,
      configurationValue: serializeConfiguredValue(
        formData.configurationValue,
        formData.dataType
      ),
      defaultValue: formData.defaultValue
        ? serializeConfiguredValue(formData.defaultValue, formData.dataType)
        : "",
      validationPattern: formData.validationPattern.trim(),
      possibleValues: formData.possibleValues,
    };

    onSave(saveData);
  };

  const isEditMode = !!config;
  const title = isEditMode ? "Edit Configuration" : "New Configuration";

  const tabs = [
    { id: 0, title: "Basic Info", icon: "fa-light fa-info-circle" },
    { id: 1, title: "Validation", icon: "fa-light fa-shield-check" },
  ];

  const renderHeader = () => (
    <div className="tw-flex tw-items-center tw-gap-3 tw-mb-6">
      <div
        className={`tw-w-12 tw-h-12 tw-rounded-xl tw-flex tw-items-center tw-justify-center ${isEditMode ? "tw-bg-blue-100" : "tw-bg-green-100"
          }`}
      >
        <i
          className={`fa-light ${isEditMode ? "fa-pen-to-square" : "fa-plus"
            } tw-text-xl ${isEditMode ? "tw-text-blue-600" : "tw-text-green-600"
            }`}
        ></i>
      </div>
      <div>
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
          {title}
        </h2>
        <p className="tw-text-sm tw-text-gray-500 tw-m-0">
          {isEditMode
            ? "Modify the configuration settings below"
            : "Fill in the details to create a new configuration"}
        </p>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="m365-detail-tabs tw-mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`m365-detail-tab ${activeTab === tab.id ? "m365-detail-tab--active" : ""}`}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );

  const renderBasicInfoTab = () => (
    <div className="tw-space-y-5">
      <div className="tw-grid tw-grid-cols-2 tw-gap-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
            Configuration Key <span className="tw-text-red-500">*</span>
          </label>
          <TextBox
            value={formData.configurationKey}
            onValueChanged={(e) =>
              handleValueChange("configurationKey", e.value)
            }
            placeholder="e.g., System.WebSocketTimeout"
            disabled={isEditMode}
            stylingMode="outlined"
            className={isEditMode ? "tw-opacity-60" : ""}
          />
          {renderFieldError(validationErrors.configurationKey)}
          {isEditMode && (
            <p className="tw-text-xs tw-text-gray-400 tw-mt-1 tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-lock tw-text-xs"></i> Key cannot be
              changed
            </p>
          )}
        </div>
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
            Category
          </label>
          <SelectBox
            value={formData.category}
            onValueChanged={(e) => handleValueChange("category", e.value)}
            dataSource={categoryOptions}
            valueExpr="value"
            displayExpr="text"
            placeholder="Select or type category..."
            stylingMode="outlined"
            searchEnabled={true}
            acceptCustomValue={true}
            onCustomItemCreating={(e) => {
              if (e.text) {
                const newItem = { value: e.text, text: e.text };
                e.customItem = newItem;
              }
            }}
          />
        </div>
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
          Description
        </label>
        <TextArea
          value={formData.description}
          onValueChanged={(e) => handleValueChange("description", e.value)}
          placeholder="Describe what this configuration does..."
          height={80}
          stylingMode="outlined"
        />
        {renderFieldError(validationErrors.description)}
      </div>

      <div className="tw-grid tw-grid-cols-2 tw-gap-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
            Data Type
          </label>
          <SelectBox
            value={formData.dataType}
            onValueChanged={(e) => handleDataTypeChange(e.value)}
            dataSource={dataTypeOptions}
            valueExpr="value"
            displayExpr="text"
            stylingMode="outlined"
          />
          <div className="system-config-type-summary">
            <div className="system-config-type-summary__pill">
              <i className={`fa-light ${valueTypeDescriptor.icon}`}></i>
              <span>{valueTypeDescriptor.title}</span>
            </div>
            <p className="system-config-type-summary__text">
              {valueTypeDescriptor.description}
            </p>
          </div>
        </div>
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
            Configuration Value <span className="tw-text-red-500">*</span>
          </label>
          <SystemConfigTypedValueEditor
            dataType={formData.dataType}
            value={formData.configurationValue}
            onChange={(value) => handleValueChange("configurationValue", value)}
            minValue={formData.minValue}
            maxValue={formData.maxValue}
            possibleValues={formData.possibleValues}
            error={validationErrors.configurationValue}
          />
          {renderFieldError(validationErrors.configurationValue)}
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-pt-2">
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-100 hover:tw-border-gray-200 tw-transition-colors">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div
              className={`tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-transition-colors ${formData.isActive ? "tw-bg-green-100" : "tw-bg-gray-200"
                }`}
            >
              <i
                className={`fa-light fa-power-off tw-text-sm tw-transition-colors ${formData.isActive ? "tw-text-green-600" : "tw-text-gray-400"
                  }`}
              ></i>
            </div>
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-m-0">
                Active Status
              </p>
              <p className="tw-text-xs tw-text-gray-500 tw-m-0">
                {formData.isActive ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={formData.isActive}
            onChange={(value) => handleValueChange("isActive", value)}
            colorScheme="green"
          />
        </div>
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-100 hover:tw-border-gray-200 tw-transition-colors">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div
              className={`tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-transition-colors ${formData.isEditable ? "tw-bg-blue-100" : "tw-bg-gray-200"
                }`}
            >
              <i
                className={`fa-light fa-pen tw-text-sm tw-transition-colors ${formData.isEditable ? "tw-text-blue-600" : "tw-text-gray-400"
                  }`}
              ></i>
            </div>
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-800 tw-m-0">
                Editable
              </p>
              <p className="tw-text-xs tw-text-gray-500 tw-m-0">
                {formData.isEditable ? "Can be modified" : "Read-only"}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={formData.isEditable}
            onChange={(value) => handleValueChange("isEditable", value)}
            colorScheme="blue"
          />
        </div>
      </div>
    </div>
  );

  const renderValidationTab = () => (
    <div className="tw-space-y-5">
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
          <i className="fa-light fa-rotate-left tw-mr-1.5 tw-text-gray-400"></i>
          Default Value
        </label>
        <SystemConfigTypedValueEditor
          dataType={formData.dataType}
          value={formData.defaultValue}
          onChange={(value) => handleValueChange("defaultValue", value)}
          minValue={formData.minValue}
          maxValue={formData.maxValue}
          possibleValues={formData.possibleValues}
          error={validationErrors.defaultValue}
          allowEmpty={true}
        />
        {renderFieldError(validationErrors.defaultValue)}
        <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
          Used when configuration value is empty or invalid
        </p>
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
          <i className="fa-light fa-code tw-mr-1.5 tw-text-gray-400"></i>
          Validation Pattern (Regex)
        </label>
        <TextBox
          value={formData.validationPattern}
          onValueChanged={(e) =>
            handleValueChange("validationPattern", e.value)
          }
          placeholder="e.g., ^[a-zA-Z0-9]+$"
          stylingMode="outlined"
        />
        {renderFieldError(validationErrors.validationPattern)}
        <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
          Regular expression to validate the configuration value
        </p>
      </div>

      {["integer", "decimal"].includes(valueTypeDescriptor.kind) && (
        <div className="tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-100">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-3">
            <i className="fa-light fa-sliders tw-text-blue-600"></i>
            <span className="tw-text-sm tw-font-medium tw-text-blue-800">
              Numeric Range Constraints
            </span>
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                Minimum Value
              </label>
              <NumberBox
                value={formData.minValue}
                onValueChanged={(e) => handleValueChange("minValue", e.value)}
                placeholder="Min"
                stylingMode="outlined"
              />
              {renderFieldError(validationErrors.minValue)}
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                Maximum Value
              </label>
              <NumberBox
                value={formData.maxValue}
                onValueChanged={(e) => handleValueChange("maxValue", e.value)}
                placeholder="Max"
                stylingMode="outlined"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
          <i className="fa-light fa-list-check tw-mr-1.5 tw-text-gray-400"></i>
          Allowed Values
        </label>
        <TextArea
          value={formData.possibleValues}
          onValueChanged={(e) => handleValueChange("possibleValues", e.value)}
          placeholder="Enter comma-separated list of allowed values..."
          height={80}
          stylingMode="outlined"
        />
        <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
          Comma-separated or newline-separated values. When provided, the value editor becomes a pick list.
        </p>
      </div>
    </div>
  );

  const renderValidationErrors = () => {
    if (Object.keys(validationErrors).length === 0) return null;

    return (
      <div className="tw-mt-5 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-flex tw-items-start tw-gap-3">
        <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-red-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
          <i className="fa-light fa-exclamation-triangle tw-text-red-600"></i>
        </div>
        <div>
          <p className="tw-text-sm tw-font-medium tw-text-red-800 tw-m-0 tw-mb-1">
            Please fix the following errors:
          </p>
          <ul className="tw-list-disc tw-list-inside tw-text-sm tw-text-red-700 tw-m-0 tw-pl-0">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <div className="tw-flex tw-items-center tw-justify-between tw-mt-6 tw-pt-5 tw-border-t tw-border-gray-200">
      <div className="tw-text-xs tw-text-gray-400">
        <i className="fa-light fa-info-circle tw-mr-1"></i>
        Fields marked with <span className="tw-text-red-500">*</span> are
        required
      </div>
      <div className="tw-flex tw-gap-3">
        <Button
          text="Cancel"
          type="normal"
          stylingMode="outlined"
          onClick={onCancel}
          disabled={saving}
          icon="fa-light fa-times"
        />
        <Button
          text={saving ? "Saving..." : isEditMode ? "Save Changes" : "Create"}
          type="default"
          stylingMode="contained"
          onClick={handleSave}
          disabled={saving}
          icon={
            saving
              ? "fa-light fa-spinner fa-spin"
              : isEditMode
                ? "fa-light fa-check"
                : "fa-light fa-plus"
          }
        />
      </div>
    </div>
  );

  return (
    <SlidePanel open={visible} onClose={onCancel} title={title} width={760}>
      <div className="system-config-m365-form tw-p-6">
        {renderHeader()}
        {renderTabs()}

        <div className="tw-min-h-[320px]">
          {activeTab === 0 && renderBasicInfoTab()}
          {activeTab === 1 && renderValidationTab()}
        </div>

        {renderValidationErrors()}
        {renderFooter()}
      </div>
    </SlidePanel>
  );
};

SystemConfigForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  config: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

SystemConfigForm.defaultProps = {
  config: null,
  saving: false,
};

export default SystemConfigForm;
