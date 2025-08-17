import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
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
import notificationGroupsApi from '../../../dataservice/notificationGroupsApi';
import notificationsApi from '../../../dataservice/notificationsApi';
import notificationPreferencesApi from '../../../dataservice/notificationPreferencesApi';
import alarmHandlerApi from '../../../dataservice/alarmHandlerApi';
import { notificationPriorityOptions as priorityOptions, notificationTypeOptions } from '../constants/notificationEnums';
import TriggerCreate from './TriggerCreate';

const PolicyEdit = () => {
  // Try to get id from react-router params (will be undefined with current custom routing)
  const params = useParams();
  const location = useLocation();
  let derivedId = params.id;
  if (!derivedId) {
    // Fallback: parse pathname e.g. /notifications/policies/5/edit
    const parts = location.pathname.split('/').filter(Boolean);
    const pIndex = parts.indexOf('policies');
    if (pIndex !== -1 && parts.length > pIndex + 1) {
      const candidate = parts[pIndex + 1];
      if (/^\d+$/.test(candidate)) derivedId = candidate;
    }
  }
  const id = derivedId; // keep previous variable name usage
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [notFound, setNotFound] = useState(false);

  const [policy, setPolicy] = useState({
    id: '',
    name: '',
    description: '',
    notificationCategoryId: '',
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
    isActive: true,
    createdAt: null,
    createdBy: '',
    modifiedAt: null,
    modifiedBy: ''
  });

  const [conditions, setConditions] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Categories from API (same approach as create)
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await notificationPreferencesApi.getNotificationCategories();
      if (mounted && res.isSuccess) setCategories(res.data || []);
    })();
    return () => { mounted = false; };
  }, []);

  const categoryOptions = useMemo(() => (categories || []).map(c => ({ value: c.id ?? c.Id, text: c.name ?? c.Name })), [categories]);

  // Using shared enums (priorityOptions, notificationTypeOptions imported)

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
    { id: 1, title: 'Triggers', icon: 'bolt' },
    { id: 2, title: 'Notification Settings', icon: 'bell' },
    { id: 3, title: 'Condition', icon: 'list' },
    { id: 4, title: 'Recipients', icon: 'users' },
    { id: 5, title: 'Templates', icon: 'edit' }
  ];

  // Triggers state
  const [triggers, setTriggers] = useState([]);

  // Refresh triggers after creation/delete
  const refreshTriggers = async (policyIdToUse) => {
    if (!policyIdToUse) return;
    try {
      const res = await alarmHandlerApi.getAlarmHandlers(policyIdToUse);
      const trigData = Array.isArray(res) ? res : (res?.data || []);
      setTriggers(trigData);
    } catch {
      setTriggers([]);
    }
  };

  const handleTriggerCreated = async () => {
    await refreshTriggers(policy.id || id);
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!triggerId) return;
    try {
      await alarmHandlerApi.deleteAlarmHandler(triggerId);
      await refreshTriggers(policy.id || id);
      notify('Trigger deleted', 'success', 2000);
    } catch (e) {
      notify('Failed to delete trigger', 'error', 3000);
    }
  };

  useEffect(() => {
    const loadPolicy = async () => {
      if (!id) return; // wait until we have an id
      setLoadingPolicy(true);
      try {
        const res = await notificationsApi.getPolicy(id);
        if (!res.isSuccess || !res.data) {
          setNotFound(true);
          return;
        }
        const p = res.data;
        setPolicy(prev => ({
          ...prev,
          id: p.id || p.policyId || id,
            name: p.name || '',
            description: p.description || '',
            notificationCategoryId: p.notificationCategoryId || p.categoryId || '',
            priority: p.priority || p.severity || 'Medium',
            notificationType: p.notificationType || 'Alert',
            enableEmail: p.enableEmail ?? true,
            enableSms: p.enableSms ?? false,
            enableSystem: p.enableSystem ?? true,
            maxNotificationsPerHour: p.maxNotificationsPerHour ?? 10,
            maxNotificationsPerDay: p.maxNotificationsPerDay ?? 50,
            cooldownMinutes: p.cooldownMinutes ?? 30,
            titleTemplate: p.titleTemplate || '',
            messageTemplate: p.messageTemplate || '',
            requireAcknowledgment: p.requireAcknowledgment ?? false,
            escalationEnabled: p.escalationEnabled ?? false,
            escalationMinutes: p.escalationMinutes ?? 60,
            recipients: p.recipients || [],
            isActive: p.isActive !== false,
            createdAt: p.createdAt || p.CreatedAt || null,
            createdBy: p.createdBy || p.CreatedBy || '',
            modifiedAt: p.modifiedAt || p.ModifiedAt || null,
            modifiedBy: p.modifiedBy || p.ModifiedBy || ''
        }));
        setConditions(Array.isArray(p.conditions) ? p.conditions : []);
        setNotFound(false);
        try {
          const trigRes = await alarmHandlerApi.getAlarmHandlers(p.id || p.policyId);
          const trigData = Array.isArray(trigRes) ? trigRes : (trigRes?.data || []);
          setTriggers(trigData);
        } catch { setTriggers([]); }
      } catch (error) {
        console.error('Error loading policy:', error);
        setNotFound(true);
      } finally {
        setLoadingPolicy(false);
      }
    };

    loadPolicy();
    (async () => {
      try {
        const res = await notificationGroupsApi.getGroups();
        if (res.isSuccess) {
          setAllGroups((res.data || []).map(g => ({ id: g.id, name: g.name })));
        }
      } catch {}
    })();
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

  // removed unused updateCondition

  const removeCondition = (id) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const validateForm = () => {
    if (!policy.name) {
      notify('Policy name is required', 'error', 3000);
      return false;
    }
    if (!policy.notificationCategoryId) {
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
  // Placeholder until backend update endpoint exists
  notify('Update endpoint not implemented yet', 'warning', 3000);
    } catch (error) {
      console.error('Error updating policy:', error);
      notify('Error updating policy', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfoTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <ValidationGroup>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Policy Name *</label>
            <TextBox value={policy.name} onValueChanged={(e) => handlePolicyChange('name', e.value)} height={40} stylingMode="outlined">
              <Validator>
                <RequiredRule message="Policy name is required" />
                <StringLengthRule min={3} max={100} message="Name must be 3-100 characters" />
              </Validator>
            </TextBox>
          </div>
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Category *</label>
            <SelectBox value={policy.notificationCategoryId} dataSource={categoryOptions} valueExpr="value" displayExpr="text" onValueChanged={(e) => handlePolicyChange('notificationCategoryId', e.value)} height={40} stylingMode="outlined">
              <Validator>
                <RequiredRule message="Category is required" />
              </Validator>
            </SelectBox>
          </div>
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Priority</label>
            <SelectBox value={policy.priority} dataSource={priorityOptions} valueExpr="value" displayExpr="text" onValueChanged={(e) => handlePolicyChange('priority', e.value)} height={40} stylingMode="outlined" />
          </div>
            <div className="tw-space-y-1">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Notification Type</label>
              <SelectBox value={policy.notificationType} dataSource={notificationTypeOptions} valueExpr="value" displayExpr="text" onValueChanged={(e) => handlePolicyChange('notificationType', e.value)} height={40} stylingMode="outlined" />
            </div>
            <div className="md:tw-col-span-2 tw-space-y-1">
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Description</label>
              <TextArea value={policy.description} onValueChanged={(e) => handlePolicyChange('description', e.value)} height={100} stylingMode="outlined" />
            </div>
        </div>
        <div className="tw-mt-6">
          <CheckBox text="Activate policy" value={policy.isActive} onValueChanged={(e) => handlePolicyChange('isActive', e.value)} />
        </div>
      </ValidationGroup>
    </div>
  );

  const renderNotificationSettingsTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form notification-form">
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
  );

  const renderConditionsTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h3 className="tw-text-lg tw-font-medium tw-text-gray-900">Condition</h3>
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
    <div className="tw-p-6 policy-create-form notification-form">
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

        {/* Map Policy to Group */}
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-medium tw-text-gray-900 tw-mb-3">Map Policy to Group</h4>
          <div className="tw-flex tw-items-end tw-space-x-3">
            <SelectBox
              label="Select Group"
              dataSource={allGroups}
              valueExpr="id"
              displayExpr="name"
              value={selectedGroupId}
              onValueChanged={(e) => setSelectedGroupId(e.value)}
              width={300}
            />
            <Button
              text="Map"
              type="default"
              disabled={!selectedGroupId || mappingLoading}
              onClick={async () => {
                if (!selectedGroupId) return;
                setMappingLoading(true);
                try {
                  const res = await notificationGroupsApi.mapPolicyGroup(Number(id), { groupId: selectedGroupId });
                  if (res.isSuccess) {
                    notify('Policy mapped to group', 'success', 2500);
                  } else {
                    notify(res.message || 'Failed to map policy', 'error', 3000);
                  }
                } catch (e) {
                  notify('Failed to map policy', 'error', 3000);
                } finally {
                  setMappingLoading(false);
                }
              }}
            />
          </div>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-2">This links the policy to a notification group; recipients are resolved dynamically.</p>
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
  <div className="tw-p-6 policy-create-form notification-form">
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

  const renderTriggersTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Triggers for this Policy {policy.id && <span className="tw-text-xs tw-text-gray-500">(ID: {policy.id})</span>}</h3>
      <div className="tw-space-y-2 tw-mb-6">
        {triggers.length === 0 && <div className="tw-text-sm tw-text-gray-500">{policy.id ? 'No triggers yet.' : 'Policy not loaded.'}</div>}
        {triggers.map(t => {
          const cfg = typeof t.config === 'string' ? t.config : (t.config ? JSON.stringify(t.config) : (t.triggerConfig ? JSON.stringify(t.triggerConfig) : ''));
          return (
            <div key={t.id} className="tw-border tw-border-gray-200 tw-rounded tw-p-3 tw-flex tw-items-start tw-justify-between tw-gap-4">
              <div className="tw-space-y-1 tw-text-xs">
                <div className="tw-font-medium tw-text-gray-900 tw-text-sm">{t.type || t.alarmType}</div>
                <div className="tw-text-gray-600 break-all">{cfg}</div>
                <div className="tw-text-gray-500">Priority: {t.priority} | Cooldown: {t.cooldownMinutes}m | Max/Day: {t.maxNotificationsPerDay || '∞'}</div>
                {(t.siteId || t.tankId || t.deviceId) && (
                  <div className="tw-text-gray-500">Scope: {t.siteId && `Site:${t.siteId} `}{t.tankId && `Tank:${t.tankId} `}{t.deviceId && `Device:${t.deviceId}`}</div>
                )}
              </div>
              <button
                className="tw-text-red-500 tw-text-xs"
                onClick={() => handleDeleteTrigger(t.id)}
                title="Delete trigger"
              >
                <i className="fa-light fa-trash" /> Delete
              </button>
            </div>
          );
        })}
      </div>
      {policy.id && (
        <TriggerCreate
          policyId={policy.id}
          categoryId={policy.notificationCategoryId}
          onCreated={handleTriggerCreated}
        />
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfoTab();
      case 1:
        return renderTriggersTab();
      case 2:
        return renderNotificationSettingsTab();
      case 3:
        return renderConditionsTab();
      case 4:
        return renderRecipientsTab();
      case 5:
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

  if (notFound) {
    return (
      <div className="tw-p-10 tw-text-center tw-space-y-4">
        <i className="fa-light fa-triangle-exclamation tw-text-red-500 tw-text-5xl" />
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">Policy Not Found</h2>
        <p className="tw-text-gray-600 tw-max-w-md tw-mx-auto">The policy with ID {id} could not be located. It may have been deleted or the link is incorrect.</p>
        <Link to={notificationRoutes.policies} className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700">
          <i className="fa-light fa-arrow-left tw-mr-2" /> Back to Policies
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
  <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link
            to={notificationRoutes.policies}
            className="tw-text-gray-400 hover:tw-text-gray-600"
          >
            <i className="fa-light fa-arrow-left tw-text-xl"></i>
          </Link>
          <div>
    <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Edit Policy</h2>
    <p className="tw-text-gray-600 tw-mt-1">{policy.name || 'Unnamed Policy'}</p>
    <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-mt-2 tw-text-xs tw-text-gray-500">
      <span>ID: <strong>{policy.id}</strong></span>
      <span>Category: {categoryOptions.find(c => String(c.value) === String(policy.notificationCategoryId))?.text || '—'}</span>
      <span>Status: <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[10px] tw-font-medium ${policy.isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'}`}>{policy.isActive ? 'Active' : 'Inactive'}</span></span>
      <span>Created: {policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : '—'}{policy.createdBy && ` by ${policy.createdBy}`}</span>
      <span>Modified: {policy.modifiedAt ? new Date(policy.modifiedAt).toLocaleDateString() : '—'}{policy.modifiedBy && ` by ${policy.modifiedBy}`}</span>
    </div>
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
        <div className="policy-create-tabs">
          <div className="tab-nav-container">
            <div className="tab-nav-wrapper tw-px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <i className={`tab-icon fa-light fa-${tab.icon}`}></i>
                  <span className="tab-title">{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="policy-form-container">
          {renderTabContent()}
        </div>
      </div>

  {/* Footer removed; info moved to header */}
    </div>
  );
};

export default PolicyEdit;
