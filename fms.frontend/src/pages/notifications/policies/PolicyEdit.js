import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  TextBox,
  TextArea,
  SelectBox,
  NumberBox,
  CheckBox,
  Button,
  ValidationGroup,
  Validator,
  TagBox,
  LoadIndicator
} from 'devextreme-react';
import { RequiredRule, StringLengthRule } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';

// Mock policy data for demonstration
const mockPolicies = {
  '1': {
    id: '1',
    name: 'Low Fuel Alert',
    description: 'Alert when fuel level is critically low',
    category: 'Tank Monitoring',
    priority: 'Critical',
    notificationType: 'Alert',
    enableEmail: true,
    enableSms: true,
    enableSystem: true,
    maxNotificationsPerHour: 5,
    maxNotificationsPerDay: 25,
    cooldownMinutes: 15,
    titleTemplate: 'Critical: Low Fuel Level at {{siteName}}',
    messageTemplate: 'Tank {{tankName}} at {{siteName}} has reached a critically low fuel level of {{currentLevel}}%. Immediate attention required.',
    requireAcknowledgment: true,
    escalationEnabled: true,
    escalationMinutes: 30,
    recipients: ['admin@company.com', 'ops@company.com'],
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'System Administrator',
    lastModified: '2024-02-10T14:22:00Z',
    lastModifiedBy: 'Operations Manager'
  },
  '2': {
    id: '2',
    name: 'Daily Operations Report',
    description: 'Daily summary of system operations',
    category: 'System Reports',
    priority: 'Low',
    notificationType: 'Report',
    enableEmail: true,
    enableSms: false,
    enableSystem: false,
    maxNotificationsPerHour: 1,
    maxNotificationsPerDay: 1,
    cooldownMinutes: 1440, // 24 hours
    titleTemplate: 'Daily Operations Report - {{date}}',
    messageTemplate: 'Daily operations summary for {{date}}:\n\nTotal transactions: {{totalTransactions}}\nFuel dispensed: {{fuelDispensed}} gallons\nSystem uptime: {{uptime}}%',
    requireAcknowledgment: false,
    escalationEnabled: false,
    escalationMinutes: 0,
    recipients: ['manager@company.com', 'ops@company.com'],
    isActive: true,
    createdAt: '2024-01-20T09:15:00Z',
    createdBy: 'System Administrator',
    lastModified: '2024-02-05T11:45:00Z',
    lastModifiedBy: 'Site Manager'
  }
};

const mockConditions = {
  '1': [
    {
      id: 1,
      field: 'tankLevel',
      operator: 'lessThan',
      value: '10',
      unit: 'percent'
    },
    {
      id: 2,
      field: 'pumpStatus',
      operator: 'equals',
      value: 'offline',
      unit: ''
    }
  ],
  '2': [
    {
      id: 1,
      field: 'time',
      operator: 'equals',
      value: '08:00',
      unit: 'daily'
    }
  ]
};

const PolicyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [policy, setPolicy] = useState({
    id: '',
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

  const [conditions, setConditions] = useState([]);

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
    { value: 'flowRate', text: 'Flow Rate' },
    { value: 'time', text: 'Time' }
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

  const tabs = [
    { id: 0, title: 'Basic Information', icon: 'info' },
    { id: 1, title: 'Notification Settings', icon: 'bell' },
    { id: 2, title: 'Conditions & Rules', icon: 'list' },
    { id: 3, title: 'Recipients', icon: 'group' },
    { id: 4, title: 'Templates', icon: 'edit' }
  ];

  useEffect(() => {
    const loadPolicy = async () => {
      setLoadingPolicy(true);
      try {
        // Simulate API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const policyData = mockPolicies[id];
        const conditionsData = mockConditions[id] || [];

        if (policyData) {
          setPolicy(policyData);
          setConditions(conditionsData);
        } else {
          notify('Policy not found', 'error', 3000);
          navigate('..');
        }
      } catch (error) {
        console.error('Error loading policy:', error);
        notify('Error loading policy', 'error', 3000);
      } finally {
        setLoadingPolicy(false);
      }
    };

    loadPolicy();
  }, [id, navigate]);

  const handlePolicyChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (id, field, value) => {
    setConditions(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
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
        lastModified: new Date(),
        lastModifiedBy: 'Current User'
      };

      // Simulate API call - replace with actual API call
      const response = await fetch(`/api/notifications/policies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      if (response.ok) {
        notify('Policy updated successfully', 'success', 3000);
        navigate('..');
      } else {
        throw new Error('Failed to update policy');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      notify('Error updating policy', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfoTab = () => (
    <div className="tw-p-6">
      <ValidationGroup>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div>
            <TextBox
              label="Policy Name"
              value={policy.name}
              onValueChanged={(e) => handlePolicyChange('name', e.value)}
              placeholder="Enter policy name"
            >
              <Validator>
                <RequiredRule message="Policy name is required" />
                <StringLengthRule min={3} max={100} message="Name must be 3-100 characters" />
              </Validator>
            </TextBox>
          </div>

          <div>
            <SelectBox
              label="Category"
              value={policy.category}
              dataSource={categoryOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('category', e.value)}
              placeholder="Select category"
            >
              <Validator>
                <RequiredRule message="Category is required" />
              </Validator>
            </SelectBox>
          </div>

          <div>
            <SelectBox
              label="Priority"
              value={policy.priority}
              dataSource={priorityOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('priority', e.value)}
            />
          </div>

          <div>
            <SelectBox
              label="Notification Type"
              value={policy.notificationType}
              dataSource={notificationTypeOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => handlePolicyChange('notificationType', e.value)}
            />
          </div>

          <div className="md:tw-col-span-2">
            <TextArea
              label="Description"
              value={policy.description}
              onValueChanged={(e) => handlePolicyChange('description', e.value)}
              placeholder="Describe this policy's purpose and conditions"
              height={100}
            />
          </div>

          <div className="md:tw-col-span-2">
            <CheckBox
              text="Active"
              value={policy.isActive}
              onValueChanged={(e) => handlePolicyChange('isActive', e.value)}
            />
          </div>
        </div>
      </ValidationGroup>
    </div>
  );

  const renderNotificationSettingsTab = () => (
    <div className="tw-p-6">
      <div className="tw-space-y-6">
        <div>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-4">Delivery Channels</h3>
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

        <div>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-4">Rate Limiting</h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
            <NumberBox
              label="Max Notifications per Hour"
              value={policy.maxNotificationsPerHour}
              onValueChanged={(e) => handlePolicyChange('maxNotificationsPerHour', e.value)}
              min={1}
              max={100}
            />
            <NumberBox
              label="Max Notifications per Day"
              value={policy.maxNotificationsPerDay}
              onValueChanged={(e) => handlePolicyChange('maxNotificationsPerDay', e.value)}
              min={1}
              max={1000}
            />
            <NumberBox
              label="Cooldown Period (minutes)"
              value={policy.cooldownMinutes}
              onValueChanged={(e) => handlePolicyChange('cooldownMinutes', e.value)}
              min={0}
              max={1440}
            />
          </div>
        </div>

        <div>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-4">Response Requirements</h3>
          <div className="tw-space-y-4">
            <CheckBox
              text="Require Acknowledgment"
              value={policy.requireAcknowledgment}
              onValueChanged={(e) => handlePolicyChange('requireAcknowledgment', e.value)}
            />

            <div className="tw-flex tw-items-center tw-space-x-4">
              <CheckBox
                text="Enable Escalation"
                value={policy.escalationEnabled}
                onValueChanged={(e) => handlePolicyChange('escalationEnabled', e.value)}
              />
              {policy.escalationEnabled && (
                <NumberBox
                  label="Escalation Time (minutes)"
                  value={policy.escalationMinutes}
                  onValueChanged={(e) => handlePolicyChange('escalationMinutes', e.value)}
                  min={5}
                  max={1440}
                  width={200}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConditionsTab = () => (
    <div className="tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h3 className="tw-text-lg tw-font-medium tw-text-gray-900">Conditions & Rules</h3>
        <Button
          text="Add Condition"
          icon="plus"
          type="default"
          stylingMode="contained"
          onClick={addCondition}
        />
      </div>

      {conditions.length === 0 ? (
        <div className="tw-text-center tw-py-8">
          <i className="fa-light fa-list tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <p className="tw-text-gray-500">No conditions defined yet</p>
          <p className="tw-text-sm tw-text-gray-400">Add conditions to specify when this policy should trigger</p>
        </div>
      ) : (
        <div className="tw-space-y-4">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h4 className="tw-font-medium tw-text-gray-900">Condition {index + 1}</h4>
                <Button
                  icon="trash"
                  stylingMode="text"
                  onClick={() => removeCondition(condition.id)}
                />
              </div>

              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
                <SelectBox
                  label="Field"
                  value={condition.field}
                  dataSource={fieldOptions}
                  valueExpr="value"
                  displayExpr="text"
                  onValueChanged={(e) => handleConditionChange(condition.id, 'field', e.value)}
                />

                <SelectBox
                  label="Operator"
                  value={condition.operator}
                  dataSource={operatorOptions}
                  valueExpr="value"
                  displayExpr="text"
                  onValueChanged={(e) => handleConditionChange(condition.id, 'operator', e.value)}
                />

                <TextBox
                  label="Value"
                  value={condition.value}
                  onValueChanged={(e) => handleConditionChange(condition.id, 'value', e.value)}
                />

                <TextBox
                  label="Unit"
                  value={condition.unit}
                  onValueChanged={(e) => handleConditionChange(condition.id, 'unit', e.value)}
                  placeholder="e.g., %, psi, °F"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecipientsTab = () => (
    <div className="tw-p-6">
      <div className="tw-space-y-6">
        <div>
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-4">Notification Recipients</h3>
          <TagBox
            dataSource={recipientOptions}
            value={policy.recipients}
            valueExpr="value"
            displayExpr="text"
            placeholder="Select recipients"
            showSelectionControls={true}
            multiline={false}
            onValueChanged={(e) => handlePolicyChange('recipients', e.value)}
          />
          <div className="tw-text-sm tw-text-gray-500 tw-mt-2">
            Selected recipients will receive notifications when this policy triggers
          </div>
        </div>

        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-medium tw-text-gray-900 tw-mb-3">Current Recipients</h4>
          {policy.recipients.length === 0 ? (
            <p className="tw-text-gray-500 tw-text-sm">No recipients selected</p>
          ) : (
            <div className="tw-space-y-2">
              {policy.recipients.map(recipient => {
                const recipientInfo = recipientOptions.find(opt => opt.value === recipient);
                return (
                  <div key={recipient} className="tw-flex tw-items-center tw-justify-between tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-px-3 tw-py-2">
                    <div>
                      <div className="tw-font-medium tw-text-sm">{recipientInfo?.text || recipient}</div>
                      <div className="tw-text-xs tw-text-gray-500">{recipient}</div>
                    </div>
                    <Button
                      icon="close"
                      stylingMode="text"
                      onClick={() => {
                        const newRecipients = policy.recipients.filter(r => r !== recipient);
                        handlePolicyChange('recipients', newRecipients);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => {
    const mockValues = {
      '{{siteName}}': 'Main Station',
      '{{tankName}}': 'Tank #1',
      '{{currentLevel}}': '8',
      '{{date}}': new Date().toLocaleDateString(),
      '{{totalTransactions}}': '142',
      '{{fuelDispensed}}': '2,847',
      '{{uptime}}': '99.2'
    };

    return (
      <div className="tw-p-6">
        <div className="tw-space-y-6">
          <div>
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-4">Message Templates</h3>
            <div className="tw-grid tw-grid-cols-1 tw-gap-6">
              <div>
                <TextBox
                  label="Notification Title Template"
                  value={policy.titleTemplate}
                  onValueChanged={(e) => handlePolicyChange('titleTemplate', e.value)}
                  placeholder="Enter title template (use {{variableName}} for dynamic content)"
                >
                  <Validator>
                    <RequiredRule message="Title template is required" />
                  </Validator>
                </TextBox>
              </div>

              <div>
                <TextArea
                  label="Message Template"
                  value={policy.messageTemplate}
                  onValueChanged={(e) => handlePolicyChange('messageTemplate', e.value)}
                  placeholder="Enter message template (use {{variableName}} for dynamic content)"
                  height={150}
                >
                  <Validator>
                    <RequiredRule message="Message template is required" />
                  </Validator>
                </TextArea>
              </div>
            </div>
          </div>

          <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <h4 className="tw-font-medium tw-text-gray-900 tw-mb-3">Template Preview</h4>
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-p-4">
              <div className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                {policy.titleTemplate ? policy.titleTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                  return mockValues[variable] || match;
                }) : 'Title will appear here'}
              </div>
              <p className="tw-text-gray-700 tw-text-sm tw-whitespace-pre-line">
                {policy.messageTemplate ? policy.messageTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                  return mockValues[variable] || match;
                }) : 'Message content will appear here'}
              </p>
            </div>
          </div>

          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <h4 className="tw-font-medium tw-text-blue-900 tw-mb-2">Available Variables</h4>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2 tw-text-sm">
              {Object.keys(mockValues).map(variable => (
                <code key={variable} className="tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded">
                  {variable}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  if (loadingPolicy) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
        <LoadIndicator visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading policy...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link
            to={notificationRoutes.policies}
            className="tw-text-gray-400 hover:tw-text-gray-600"
          >
            <i className="fa-light fa-arrow-left tw-text-xl"></i>
          </Link>
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Edit Policy</h2>
            <p className="tw-text-gray-600 tw-mt-1">{policy.name}</p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-3">
          <Link
            to={notificationRoutes.policies}
            className="tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50"
          >
            Cancel
          </Link>
          <Button
            text="Save Changes"
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
        <div className="tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-space-x-8 tw-px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tw-py-4 tw-px-1 tw-border-b-2 tw-font-medium tw-text-sm tw-flex tw-items-center tw-space-x-2 ${
                  activeTab === tab.id
                    ? 'tw-border-blue-500 tw-text-blue-600'
                    : 'tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700 hover:tw-border-gray-300'
                }`}
              >
                <i className={`fa-light fa-${tab.icon}`}></i>
                <span>{tab.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tw-min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Policy Information Footer */}
      <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mt-6">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-text-sm tw-text-gray-600">
          <div>
            <span className="tw-font-medium">Created:</span><br />
            {new Date(policy.createdAt).toLocaleDateString()} by {policy.createdBy}
          </div>
          <div>
            <span className="tw-font-medium">Last Modified:</span><br />
            {new Date(policy.lastModified).toLocaleDateString()} by {policy.lastModifiedBy}
          </div>
          <div>
            <span className="tw-font-medium">Policy ID:</span><br />
            {policy.id}
          </div>
          <div>
            <span className="tw-font-medium">Status:</span><br />
            <span className={`tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${
              policy.isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
            }`}>
              {policy.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyEdit;
