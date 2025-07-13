//Cursor - System Configuration Form Component
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Popup from 'devextreme-react/popup';
import Form, {
  SimpleItem,
  GroupItem,
  TabbedItem,
  Tab,
  RequiredRule,
  StringLengthRule,
  Label
} from 'devextreme-react/form';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

const SystemConfigForm = ({ visible, config, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    configurationKey: '',
    configurationValue: '',
    description: '',
    dataType: 'String',
    category: 'General',
    isActive: true,
    isEditable: true,
    validationPattern: '',
    defaultValue: '',
    minValue: null,
    maxValue: null,
    possibleValues: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Data type options
  const dataTypeOptions = [
    { value: 'String', text: 'String' },
    { value: 'Integer', text: 'Integer' },
    { value: 'Decimal', text: 'Decimal' },
    { value: 'Boolean', text: 'Boolean' },
    { value: 'DateTime', text: 'DateTime' },
    { value: 'Json', text: 'JSON' },
    { value: 'Url', text: 'URL' },
    { value: 'Email', text: 'Email' },
    { value: 'Password', text: 'Password' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'General', text: 'General' },
    { value: 'System', text: 'System' },
    { value: 'Security', text: 'Security' },
    { value: 'Database', text: 'Database' },
    { value: 'API', text: 'API' },
    { value: 'UI', text: 'User Interface' },
    { value: 'Performance', text: 'Performance' },
    { value: 'Logging', text: 'Logging' },
    { value: 'Notification', text: 'Notification' },
    { value: 'Integration', text: 'Integration' }
  ];

  useEffect(() => {
    if (config) {
      setFormData({
        configurationKey: config.configurationKey || '',
        configurationValue: config.configurationValue || '',
        description: config.description || '',
        dataType: config.dataType || 'String',
        category: config.category || 'General',
        isActive: config.isActive !== undefined ? config.isActive : true,
        isEditable: config.isEditable !== undefined ? config.isEditable : true,
        validationPattern: config.validationPattern || '',
        defaultValue: config.defaultValue || '',
        minValue: config.minValue || null,
        maxValue: config.maxValue || null,
        possibleValues: config.possibleValues || ''
      });
    } else {
      // Reset for new configuration
      setFormData({
        configurationKey: '',
        configurationValue: '',
        description: '',
        dataType: 'String',
        category: 'General',
        isActive: true,
        isEditable: true,
        validationPattern: '',
        defaultValue: '',
        minValue: null,
        maxValue: null,
        possibleValues: ''
      });
    }
    setValidationErrors({});
  }, [config, visible]);

  const handleValueChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required field validations
    if (!formData.configurationKey.trim()) {
      errors.configurationKey = 'Configuration key is required';
    } else if (formData.configurationKey.length > 255) {
      errors.configurationKey = 'Configuration key must be 255 characters or less';
    }

    if (!formData.configurationValue.trim()) {
      errors.configurationValue = 'Configuration value is required';
    } else if (formData.configurationValue.length > 1000) {
      errors.configurationValue = 'Configuration value must be 1000 characters or less';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    // Data type specific validations
    if (formData.dataType === 'Integer') {
      const intValue = parseInt(formData.configurationValue);
      if (isNaN(intValue)) {
        errors.configurationValue = 'Value must be a valid integer';
      }
    } else if (formData.dataType === 'Decimal') {
      const decValue = parseFloat(formData.configurationValue);
      if (isNaN(decValue)) {
        errors.configurationValue = 'Value must be a valid decimal number';
      }
    } else if (formData.dataType === 'Boolean') {
      const lowerValue = formData.configurationValue.toLowerCase();
      if (!['true', 'false', '1', '0'].includes(lowerValue)) {
        errors.configurationValue = 'Value must be true/false or 1/0';
      }
    } else if (formData.dataType === 'Email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.configurationValue)) {
        errors.configurationValue = 'Value must be a valid email address';
      }
    } else if (formData.dataType === 'Url') {
      try {
        new URL(formData.configurationValue);
      } catch {
        errors.configurationValue = 'Value must be a valid URL';
      }
    }

    // Min/Max value validations for numeric types
    if (['Integer', 'Decimal'].includes(formData.dataType)) {
      if (formData.minValue !== null && formData.maxValue !== null) {
        if (parseFloat(formData.minValue) >= parseFloat(formData.maxValue)) {
          errors.minValue = 'Minimum value must be less than maximum value';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      notify('Please fix validation errors before saving', 'error', 3000);
      return;
    }

    const saveData = { ...formData };

    // Convert string values to appropriate types
    if (formData.dataType === 'Integer') {
      saveData.configurationValue = parseInt(formData.configurationValue).toString();
    } else if (formData.dataType === 'Decimal') {
      saveData.configurationValue = parseFloat(formData.configurationValue).toString();
    } else if (formData.dataType === 'Boolean') {
      const lowerValue = formData.configurationValue.toLowerCase();
      saveData.configurationValue = (['true', '1'].includes(lowerValue)).toString();
    }

    onSave(saveData);
  };

  const isEditMode = !!config;
  const title = isEditMode ? 'Edit System Configuration' : 'Create System Configuration';

  return (
    <Popup
      visible={visible}
      onHiding={onCancel}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={true}
      title={title}
      width="800px"
      height="700px"
      showCloseButton={true}
    >
      <div className="tw-p-6">
        <Form formData={formData} labelLocation="top" showColonAfterLabel={false}>
          <TabbedItem>
            <Tab title="Basic Information">
              <GroupItem colCount={2}>
                <SimpleItem
                  dataField="configurationKey"
                  isRequired={true}
                  editorOptions={{
                    placeholder: "e.g., System.WebSocketTimeout",
                    disabled: isEditMode, // Keys shouldn't be editable
                    onValueChanged: (e) => handleValueChange('configurationKey', e.value)
                  }}
                >
                  <Label text="Configuration Key" />
                  <RequiredRule message="Configuration key is required" />
                  <StringLengthRule max={255} message="Configuration key must be 255 characters or less" />
                </SimpleItem>

                <SimpleItem
                  dataField="category"
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: categoryOptions,
                    valueExpr: "value",
                    displayExpr: "text",
                    onValueChanged: (e) => handleValueChange('category', e.value)
                  }}
                >
                  <Label text="Category" />
                </SimpleItem>
              </GroupItem>

              <SimpleItem
                dataField="description"
                editorType="dxTextArea"
                editorOptions={{
                  placeholder: "Describe what this configuration does...",
                  height: 80,
                  onValueChanged: (e) => handleValueChange('description', e.value)
                }}
              >
                <Label text="Description" />
                <StringLengthRule max={500} message="Description must be 500 characters or less" />
              </SimpleItem>

              <GroupItem colCount={2}>
                <SimpleItem
                  dataField="dataType"
                  editorType="dxSelectBox"
                  editorOptions={{
                    dataSource: dataTypeOptions,
                    valueExpr: "value",
                    displayExpr: "text",
                    onValueChanged: (e) => handleValueChange('dataType', e.value)
                  }}
                >
                  <Label text="Data Type" />
                </SimpleItem>

                <SimpleItem
                  dataField="configurationValue"
                  isRequired={true}
                  editorOptions={{
                    placeholder: "Enter configuration value...",
                    onValueChanged: (e) => handleValueChange('configurationValue', e.value)
                  }}
                >
                  <Label text="Configuration Value" />
                  <RequiredRule message="Configuration value is required" />
                  <StringLengthRule max={1000} message="Configuration value must be 1000 characters or less" />
                </SimpleItem>
              </GroupItem>

              <GroupItem colCount={2}>
                <SimpleItem
                  dataField="isActive"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "Configuration is active",
                    onValueChanged: (e) => handleValueChange('isActive', e.value)
                  }}
                >
                  <Label text="Status" />
                </SimpleItem>

                <SimpleItem
                  dataField="isEditable"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "Configuration can be edited",
                    onValueChanged: (e) => handleValueChange('isEditable', e.value)
                  }}
                >
                  <Label text="Editability" />
                </SimpleItem>
              </GroupItem>
            </Tab>

            <Tab title="Validation & Constraints">
              <SimpleItem
                dataField="defaultValue"
                editorOptions={{
                  placeholder: "Default value if not set...",
                  onValueChanged: (e) => handleValueChange('defaultValue', e.value)
                }}
              >
                <Label text="Default Value" />
              </SimpleItem>

              <SimpleItem
                dataField="validationPattern"
                editorOptions={{
                  placeholder: "Regular expression pattern for validation...",
                  onValueChanged: (e) => handleValueChange('validationPattern', e.value)
                }}
              >
                <Label text="Validation Pattern (Regex)" />
              </SimpleItem>

              {['Integer', 'Decimal'].includes(formData.dataType) && (
                <GroupItem colCount={2}>
                  <SimpleItem
                    dataField="minValue"
                    editorType="dxNumberBox"
                    editorOptions={{
                      placeholder: "Minimum value",
                      onValueChanged: (e) => handleValueChange('minValue', e.value)
                    }}
                  >
                    <Label text="Minimum Value" />
                  </SimpleItem>

                  <SimpleItem
                    dataField="maxValue"
                    editorType="dxNumberBox"
                    editorOptions={{
                      placeholder: "Maximum value",
                      onValueChanged: (e) => handleValueChange('maxValue', e.value)
                    }}
                  >
                    <Label text="Maximum Value" />
                  </SimpleItem>
                </GroupItem>
              )}

              <SimpleItem
                dataField="possibleValues"
                editorType="dxTextArea"
                editorOptions={{
                  placeholder: "Comma-separated list of possible values (optional)...",
                  height: 80,
                  onValueChanged: (e) => handleValueChange('possibleValues', e.value)
                }}
              >
                <Label text="Possible Values" />
              </SimpleItem>
            </Tab>
          </TabbedItem>
        </Form>

        {/* Validation Errors Display */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="tw-mt-4 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
            <h4 className="tw-text-red-800 tw-font-semibold tw-mb-2">
              Please fix the following errors:
            </h4>
            <ul className="tw-list-disc tw-list-inside tw-text-red-700">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Cancel"
            type="normal"
            onClick={onCancel}
            disabled={saving}
          />
          <Button
            text={isEditMode ? "Update Configuration" : "Create Configuration"}
            type="success"
            onClick={handleSave}
            disabled={saving}
            icon={saving ? "fa fa-spinner fa-spin" : undefined}
          />
        </div>
      </div>
    </Popup>
  );
};

SystemConfigForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  config: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool
};

SystemConfigForm.defaultProps = {
  config: null,
  saving: false
};

export default SystemConfigForm;
