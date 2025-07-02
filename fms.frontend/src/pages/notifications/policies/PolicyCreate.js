import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextBox,
  TextArea,
  SelectBox,
  NumberBox,
  CheckBox,
  Button,
  ValidationGroup,
  Validator,
  TagBox
} from 'devextreme-react';
import { RequiredRule, StringLengthRule } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';
import './PolicyCreate.scss';

const PolicyCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [policy, setPolicy] = useState({
    name: '',
    description: '',
    category: '',
    priority: 'Medium',
    notificationType: 'Alert',
    enableEmail: true,
    enableSms: false,
    enableSystem: true,
    maxNotificationsPerHour: 10,
    maxNotificationsPerDay: 50,
    cooldownMinutes: 30,
    titleTemplate: '',
    messageTemplate: '',
    requireAcknowledgment: false,
    escalationEnabled: false,
    escalationMinutes: 60,
    recipients: [],
    conditions: [],
    isActive: true
  });

  const [conditions, setConditions] = useState([
    {
      id: 1,
      field: 'tankLevel',
      operator: 'lessThan',
      value: '10',
      unit: 'percent'
    }
  ]);

  const categoryOptions = [
    { value: 'Tank Monitoring', text: 'Tank Monitoring' },
    { value: 'Maintenance', text: 'Maintenance' },
    { value: 'Device Monitoring', text: 'Device Monitoring' },
    { value: 'System Reports', text: 'System Reports' },
    { value: 'Emergency', text: 'Emergency' },
    { value: 'Custom', text: 'Custom' }
  ];

  const priorityOptions = [
    { value: 'Critical', text: 'Critical' },
    { value: 'High', text: 'High' },
    { value: 'Medium', text: 'Medium' },
    { value: 'Low', text: 'Low' }
  ];

  const notificationTypeOptions = [
    { value: 'Alert', text: 'Alert' },
    { value: 'Warning', text: 'Warning' },
    { value: 'Information', text: 'Information' },
    { value: 'Report', text: 'Report' }
  ];

  const recipientOptions = [
    { value: 'admin@company.com', text: 'System Administrator' },
    { value: 'ops@company.com', text: 'Operations Team' },
    { value: 'maintenance@company.com', text: 'Maintenance Team' },
    { value: 'manager@company.com', text: 'Site Manager' },
    { value: 'support@company.com', text: 'Technical Support' }
  ];

  const fieldOptions = [
    { value: 'tankLevel', text: 'Tank Level' },
    { value: 'pumpStatus', text: 'Pump Status' },
    { value: 'deviceConnection', text: 'Device Connection' },
    { value: 'temperature', text: 'Temperature' },
    { value: 'pressure', text: 'Pressure' },
    { value: 'flowRate', text: 'Flow Rate' }
  ];

  const operatorOptions = [
    { value: 'equals', text: 'Equals' },
    { value: 'notEquals', text: 'Not Equals' },
    { value: 'lessThan', text: 'Less Than' },
    { value: 'lessThanOrEqual', text: 'Less Than or Equal' },
    { value: 'greaterThan', text: 'Greater Than' },
    { value: 'greaterThanOrEqual', text: 'Greater Than or Equal' },
    { value: 'contains', text: 'Contains' },
    { value: 'startsWith', text: 'Starts With' }
  ];

  const handlePolicyChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const addCondition = () => {
    const newCondition = {
      id: Math.max(...conditions.map(c => c.id), 0) + 1,
      field: 'tankLevel',
      operator: 'lessThan',
      value: '',
      unit: 'percent'
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id, field, value) => {
    setConditions(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCondition = (id) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const validateForm = () => {
    if (!policy.name) {
      notify('Policy name is required', 'error', 3000);
      return false;
    }
    if (!policy.category) {
      notify('Category is required', 'error', 3000);
      return false;
    }
    if (!policy.titleTemplate) {
      notify('Title template is required', 'error', 3000);
      return false;
    }
    if (!policy.messageTemplate) {
      notify('Message template is required', 'error', 3000);
      return false;
    }
    if (policy.recipients.length === 0) {
      notify('At least one recipient is required', 'error', 3000);
      return false;
    }
    if (conditions.length === 0) {
      notify('At least one condition is required', 'error', 3000);
      return false;
    }
    return true;
  };

  const savePolicy = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const policyData = {
        ...policy,
        conditions,
        createdAt: new Date(),
        createdBy: 'Current User'
      };

      // Simulate API call - replace with actual API call
      const response = await fetch('/api/notifications/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      if (response.ok) {
        notify('Policy created successfully', 'success', 3000);
        navigate('..');
      } else {
        throw new Error('Failed to create policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      notify('Error creating policy', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      title: 'Basic Information',
      icon: 'info'
    },
    {
      title: 'Notification Settings',
      icon: 'bell'
    },
    {
      title: 'Conditions & Rules',
      icon: 'list'
    },
    {
      title: 'Recipients',
      icon: 'users'
    },
    {
      title: 'Templates',
      icon: 'edit'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfoTab();
      case 1:
        return renderNotificationSettingsTab();
      case 2:
        return renderConditionsTab();
      case 3:
        return renderRecipientsTab();
      case 4:
        return renderTemplatesTab();
      default:
        return renderBasicInfoTab();
    }
  };

  const renderBasicInfoTab = () => (
    <div className="tw-p-6 policy-create-form">
      <ValidationGroup>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Policy Name *
            </label>
            <TextBox
              value={policy.name}
              onValueChanged={(e) => handlePolicyChange('name', e.value)}
              placeholder="Enter policy name"
              height={40}
              stylingMode="outlined"
              className="policy-form-field"
            >
              <Validator>
                <RequiredRule message="Policy name is required" />
                <StringLengthRule min={3} max={100} message="Name must be 3-100 characters" />
              </Validator>
            </TextBox>
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Category *
            </label>
            <SelectBox
              value={policy.category}
              dataSource={categoryOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('category', e.value)}
              placeholder="Select category"
              height={40}
              stylingMode="outlined"
              className="policy-form-field"
            >
              <Validator>
                <RequiredRule message="Category is required" />
              </Validator>
            </SelectBox>
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Priority
            </label>
            <SelectBox
              value={policy.priority}
              dataSource={priorityOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('priority', e.value)}
              height={40}
              stylingMode="outlined"
              className="policy-form-field"
            />
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Notification Type
            </label>
            <SelectBox
              value={policy.notificationType}
              dataSource={notificationTypeOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('notificationType', e.value)}
              height={40}
              stylingMode="outlined"
              className="policy-form-field"
            />
          </div>

          <div className="md:tw-col-span-2 tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Description
            </label>
            <TextArea
              value={policy.description}
              onValueChanged={(e) => handlePolicyChange('description', e.value)}
              //placeholder="Enter policy description"
              height={100}
              stylingMode="outlined"
              className="policy-form-field"
            />
          </div>
        </div>

        <div className="tw-mt-6">
          <CheckBox
            text="Activate policy immediately"
            value={policy.isActive}
            onValueChanged={(e) => handlePolicyChange('isActive', e.value)}
          />
        </div>
      </ValidationGroup>
    </div>
  );

  const renderNotificationSettingsTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form">
      <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Delivery Methods</h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <CheckBox
            text="Email Notifications"
            value={policy.enableEmail}
            onValueChanged={(e) => handlePolicyChange('enableEmail', e.value)}
          />
          <CheckBox
            text="SMS Notifications"
            value={policy.enableSms}
            onValueChanged={(e) => handlePolicyChange('enableSms', e.value)}
          />
          <CheckBox
            text="System Notifications"
            value={policy.enableSystem}
            onValueChanged={(e) => handlePolicyChange('enableSystem', e.value)}
          />
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Max Notifications Per Hour
          </label>
          <NumberBox
            value={policy.maxNotificationsPerHour}
            onValueChanged={(e) => handlePolicyChange('maxNotificationsPerHour', e.value)}
            min={1}
            max={100}
            showSpinButtons={true}
            height={40}
            stylingMode="outlined"
            className="policy-form-field"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Max Notifications Per Day
          </label>
          <NumberBox
            value={policy.maxNotificationsPerDay}
            onValueChanged={(e) => handlePolicyChange('maxNotificationsPerDay', e.value)}
            min={1}
            max={1000}
            showSpinButtons={true}
            height={40}
            stylingMode="outlined"
            className="policy-form-field"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Cooldown Period (minutes)
          </label>
          <NumberBox
            value={policy.cooldownMinutes}
            onValueChanged={(e) => handlePolicyChange('cooldownMinutes', e.value)}
            min={0}
            max={1440}
            showSpinButtons={true}
            height={40}
            stylingMode="outlined"
            className="policy-form-field"
          />
        </div>

        <div className="tw-flex tw-items-center tw-pt-8">
          <CheckBox
            text="Require Acknowledgment"
            value={policy.requireAcknowledgment}
            onValueChanged={(e) => handlePolicyChange('requireAcknowledgment', e.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderConditionsTab = () => (
    <div className="tw-p-6 policy-create-form">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold">Trigger Conditions</h3>
        <Button
          text="Add Condition"
          icon="fa-solid fa-plus"
          type="default"
          stylingMode="contained"
          onClick={addCondition}
        />
      </div>

      <div className="tw-space-y-4">
        {conditions.map((condition) => (
          <div key={condition.id} className="condition-card">
            <div className="condition-fields">
              <div className="tw-space-y-1">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Field
                </label>
                <SelectBox
                  value={condition.field}
                  dataSource={fieldOptions}
                  valueExpr="value"
                  displayExpr="text"
                  onValueChanged={(e) => updateCondition(condition.id, 'field', e.value)}
                  height={40}
                />
              </div>
              <div className="tw-space-y-1">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Operator
                </label>
                <SelectBox
                  value={condition.operator}
                  dataSource={operatorOptions}
                  valueExpr="value"
                  displayExpr="text"
                  onValueChanged={(e) => updateCondition(condition.id, 'operator', e.value)}
                  height={40}
                />
              </div>
              <div className="tw-space-y-1">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Value
                </label>
                <TextBox
                  value={condition.value}
                  onValueChanged={(e) => updateCondition(condition.id, 'value', e.value)}
                  placeholder="Enter value"
                  height={40}
                />
              </div>
              <div className="tw-space-y-1">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  Unit
                </label>
                <TextBox
                  value={condition.unit}
                  onValueChanged={(e) => updateCondition(condition.id, 'unit', e.value)}
                  placeholder="e.g., %, L, °C"
                  height={40}
                />
              </div>
              <div className="tw-flex tw-justify-center tw-pt-8">
                <button
                  className="remove-condition-btn"
                  onClick={() => removeCondition(condition.id)}
                  type="button"
                >
                  <i className="fa-light fa-trash tw-text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {conditions.length === 0 && (
        <div className="empty-state">
          <i className="empty-icon fa-light fa-list"></i>
          <div className="empty-message">No conditions defined</div>
          <div className="empty-description">Click "Add Condition" to create trigger rules.</div>
        </div>
      )}
    </div>
  );

  const renderRecipientsTab = () => (
    <div className="tw-p-6 policy-create-form">
      <div className="tw-space-y-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Email Recipients
          </label>
          <TagBox
            value={policy.emailRecipients}
            dataSource={recipientOptions}
            valueExpr="value"
            displayExpr="text"
            searchEnabled={true}
            acceptCustomValue={true}
            onValueChanged={(e) => handlePolicyChange('emailRecipients', e.value)}
            placeholder="Select or enter email addresses"
            multiline={false}
            height={45}
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            SMS Recipients
          </label>
          <TagBox
            value={policy.smsRecipients}
            searchEnabled={true}
            acceptCustomValue={true}
            onValueChanged={(e) => handlePolicyChange('smsRecipients', e.value)}
            placeholder="Enter phone numbers"
            multiline={false}
            height={45}
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            System Recipients (User IDs)
          </label>
          <TagBox
            value={policy.systemRecipients}
            searchEnabled={true}
            acceptCustomValue={true}
            onValueChanged={(e) => handlePolicyChange('systemRecipients', e.value)}
            placeholder="Enter user IDs"
            multiline={false}
            height={45}
          />
        </div>

        <div className="info-panel info">
          <div className="tw-flex tw-items-start tw-space-x-3">
            <i className="info-icon fa-light fa-info-circle tw-text-lg tw-mt-1"></i>
            <div>
              <h4 className="info-title">Recipient Guidelines</h4>
              <ul className="info-content tw-list-disc tw-list-inside tw-text-sm tw-mt-2 tw-space-y-1">
                <li>Email addresses must be valid format (e.g., user@company.com)</li>
                <li>SMS numbers should include country code (e.g., +1234567890)</li>
                <li>System recipients are internal user IDs</li>
                <li>You can type custom values or select from the dropdown</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form">
      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Title Template *
        </label>
        <TextBox
          value={policy.titleTemplate}
          onValueChanged={(e) => handlePolicyChange('titleTemplate', e.value)}
          placeholder="e.g., ALERT: {field} {operator} {value}"
          height={40}
        >
          <Validator>
            <RequiredRule message="Title template is required" />
          </Validator>
        </TextBox>
      </div>

      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Message Template *
        </label>
        <TextArea
          value={policy.messageTemplate}
          onValueChanged={(e) => handlePolicyChange('messageTemplate', e.value)}
          placeholder="e.g., Tank {tankNumber} level is {currentLevel}% which is {operator} the threshold of {thresholdValue}%"
          height={120}
        >
          <Validator>
            <RequiredRule message="Message template is required" />
          </Validator>
        </TextArea>
      </div>

      <div className="info-panel warning">
        <div className="tw-flex tw-items-start tw-space-x-3">
          <i className="info-icon fa-light fa-lightbulb tw-text-lg tw-mt-1"></i>
          <div>
            <h4 className="info-title">Template Variables</h4>
            <p className="info-content tw-text-sm tw-mt-2">
              You can use the following variables in your templates:
            </p>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 tw-mt-3 tw-text-sm">
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{field}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{operator}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{value}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{unit}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{tankNumber}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{deviceId}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{timestamp}'}</code>
              <code className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded">{'{siteId}'}</code>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="tw-font-semibold tw-mb-3">Preview</h4>
        <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
          <div className="tw-mb-2">
            <span className="tw-font-medium">Title:</span>
            <div className="tw-text-sm tw-text-gray-700 tw-mt-1">
              {policy.titleTemplate || 'Enter a title template above'}
            </div>
          </div>
          <div>
            <span className="tw-font-medium">Message:</span>
            <div className="tw-text-sm tw-text-gray-700 tw-mt-1">
              {policy.messageTemplate || 'Enter a message template above'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link
            to={notificationRoutes.policies}
            className="tw-text-gray-400 hover:tw-text-gray-600"
          >
            <i className="fa-solid fa-arrow-left tw-text-xl"></i>
          </Link>
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Create New Policy</h2>
            <p className="tw-text-gray-600 tw-mt-1">Configure a new notification policy</p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-3">
          <Link
            to={notificationRoutes.policies}
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors tw-duration-200"
          >
            <i className="fa-light fa-arrow-left tw-mr-2"></i>
            Cancel
          </Link>
          <Button
            text="Save Policy"
            icon="fa-light fa-save"
            type="default"
            stylingMode="contained"
            onClick={savePolicy}
            disabled={loading}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
        {/* Tab Navigation */}
        <div className="policy-create-tabs">
          <div className="tab-nav-container">
            <div className="tab-nav-wrapper tw-px-6">
              {tabItems.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`tab-nav-button ${activeTab === index ? 'active' : ''}`}
                >
                  <i className={`tab-icon fa-light fa-${tab.icon}`}></i>
                  <span className="tab-title">{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tw-min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PolicyCreate;
