/**
 * File: PolicyEdit.js
 * Purpose: Edit notification policy details and ActiveAlarm filter settings.
 * Dependencies: react, react-router-dom, devextreme-react, notification services.
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - PolicyEdit(): Loads a policy and renders edit tabs.
 * - renderActiveAlarmFiltersTab(): Displays ActiveAlarm filter configuration.
 * - savePolicy(): Persists edited policy settings to backend.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
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
import {
  notificationPriorityOptions as priorityOptions,
  notificationTypeOptions
} from '../constants/notificationEnums';
import PolicyTriggersManager from './PolicyTriggersManager';

const parseActiveAlarmFilter = rawFilter => {
  if (!rawFilter || typeof rawFilter !== 'string') {
    return {
      eventType: 'Created',
      alarmType: '',
      minimumSeverity: '',
      siteId: '',
      tankId: '',
      ptsDeviceId: ''
    };
  }

  try {
    const parsed = JSON.parse(rawFilter);
    return {
      eventType: parsed.eventType || 'Created',
      alarmType: parsed.alarmType || '',
      minimumSeverity: parsed.minimumSeverity || '',
      siteId: parsed.siteId ?? '',
      tankId: parsed.tankId ?? '',
      ptsDeviceId: parsed.ptsDeviceId || ''
    };
  } catch {
    return {
      eventType: 'Created',
      alarmType: '',
      minimumSeverity: '',
      siteId: '',
      tankId: '',
      ptsDeviceId: ''
    };
  }
};

const PolicyEdit = () => {
  const params = useParams();
  const location = useLocation();
  let derivedId = params.id;

  if (!derivedId) {
    const parts = location.pathname.split('/').filter(Boolean);
    const pIndex = parts.indexOf('policies');
    if (pIndex !== -1 && parts.length > pIndex + 1) {
      const candidate = parts[pIndex + 1];
      if (/^\d+$/.test(candidate)) {
        derivedId = candidate;
      }
    }
  }

  const id = derivedId;
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
    modifiedBy: '',
    activeAlarmFilter: null
  });

  const [activeAlarmFilter, setActiveAlarmFilter] = useState({
    eventType: 'Created',
    alarmType: '',
    minimumSeverity: '',
    siteId: '',
    tankId: '',
    ptsDeviceId: ''
  });

  const [allGroups, setAllGroups] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await notificationPreferencesApi.getNotificationCategories();
      if (mounted && res.isSuccess) {
        setCategories(res.data || []);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = useMemo(
    () => (categories || []).map(c => ({ value: c.id ?? c.Id, text: c.name ?? c.Name })),
    [categories]
  );

  const recipientOptions = [
    { value: 'admin@company.com', text: 'System Administrator' },
    { value: 'ops@company.com', text: 'Operations Team' },
    { value: 'maintenance@company.com', text: 'Maintenance Team' },
    { value: 'manager@company.com', text: 'Site Manager' },
    { value: 'support@company.com', text: 'Technical Support' }
  ];

  const activeAlarmEventOptions = [
    { value: 'Created', text: 'Created' },
    { value: 'Acknowledged', text: 'Acknowledged' },
    { value: 'Resolved', text: 'Resolved' },
    { value: 'Escalated', text: 'Escalated' },
    { value: 'AutoResolved', text: 'Auto Resolved' }
  ];

  const severityOptions = [
    { value: '', text: 'Any Severity' },
    { value: 'Low', text: 'Low' },
    { value: 'Medium', text: 'Medium' },
    { value: 'High', text: 'High' },
    { value: 'Critical', text: 'Critical' }
  ];

  const tabs = [
    { id: 0, title: 'Basic Information', icon: 'info' },
    { id: 1, title: 'Active Alarm Filters', icon: 'shield-exclamation' },
    { id: 2, title: 'Notification Settings', icon: 'bell' },
    { id: 3, title: 'Recipients', icon: 'users' },
    { id: 4, title: 'Templates', icon: 'edit' },
    { id: 5, title: 'Policy Triggers', icon: 'sliders' }
  ];

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('tab')?.toLowerCase() === 'triggers') {
      setActiveTab(5);
    }
  }, [location.search]);

  useEffect(() => {
    const loadPolicy = async () => {
      if (!id) return;

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
          modifiedBy: p.modifiedBy || p.ModifiedBy || '',
          activeAlarmFilter: p.activeAlarmFilter || null
        }));

        setActiveAlarmFilter(parseActiveAlarmFilter(p.activeAlarmFilter));
        setNotFound(false);
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
      } catch {
        // ignore non-blocking group load failures
      }
    })();
  }, [id]);

  const handlePolicyChange = (field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  };

  const updateActiveAlarmFilter = (field, value) => {
    setActiveAlarmFilter(prev => ({ ...prev, [field]: value }));
  };

  const buildActiveAlarmFilterPayload = () => {
    const payload = {
      source: 'ActiveAlarm',
      eventType: activeAlarmFilter.eventType || 'Created'
    };

    if (activeAlarmFilter.alarmType?.trim()) {
      payload.alarmType = activeAlarmFilter.alarmType.trim();
    }
    if (activeAlarmFilter.minimumSeverity) {
      payload.minimumSeverity = activeAlarmFilter.minimumSeverity;
    }
    if (activeAlarmFilter.siteId !== '' && !Number.isNaN(Number(activeAlarmFilter.siteId))) {
      payload.siteId = Number(activeAlarmFilter.siteId);
    }
    if (activeAlarmFilter.tankId !== '' && !Number.isNaN(Number(activeAlarmFilter.tankId))) {
      payload.tankId = Number(activeAlarmFilter.tankId);
    }
    if (activeAlarmFilter.ptsDeviceId?.trim()) {
      payload.ptsDeviceId = activeAlarmFilter.ptsDeviceId.trim();
    }

    return JSON.stringify(payload);
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
    return true;
  };

  const savePolicy = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: policy.name,
        notificationCategoryId: Number(policy.notificationCategoryId),
        notificationType: policy.notificationType,
        priority: policy.priority,
        enableEmail: !!policy.enableEmail,
        enableSms: !!policy.enableSms,
        enableSystem: !!policy.enableSystem,
        maxNotificationsPerHour: Number(policy.maxNotificationsPerHour) || 0,
        maxNotificationsPerDay: Number(policy.maxNotificationsPerDay) || 0,
        cooldownMinutes: Number(policy.cooldownMinutes) || 0,
        titleTemplate: policy.titleTemplate || null,
        messageTemplate: policy.messageTemplate || null,
        requireAcknowledgment: !!policy.requireAcknowledgment,
        activeAlarmFilter: buildActiveAlarmFilterPayload(),
        isActive: !!policy.isActive
      };

      const response = await notificationsApi.updatePolicy(policy.id || id, payload);
      if (response.isSuccess) {
        notify('Policy updated successfully', 'success', 2500);
        return;
      }

      throw new Error(response.message || 'Failed to update policy');
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
            <TextBox value={policy.name} onValueChanged={e => handlePolicyChange('name', e.value)} height={40} stylingMode="outlined">
              <Validator>
                <RequiredRule message="Policy name is required" />
                <StringLengthRule min={3} max={100} message="Name must be 3-100 characters" />
              </Validator>
            </TextBox>
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Category *</label>
            <SelectBox
              value={policy.notificationCategoryId}
              dataSource={categoryOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handlePolicyChange('notificationCategoryId', e.value)}
              height={40}
              stylingMode="outlined"
            >
              <Validator>
                <RequiredRule message="Category is required" />
              </Validator>
            </SelectBox>
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Priority</label>
            <SelectBox
              value={policy.priority}
              dataSource={priorityOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handlePolicyChange('priority', e.value)}
              height={40}
              stylingMode="outlined"
            />
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Notification Type</label>
            <SelectBox
              value={policy.notificationType}
              dataSource={notificationTypeOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handlePolicyChange('notificationType', e.value)}
              height={40}
              stylingMode="outlined"
            />
          </div>

          <div className="md:tw-col-span-2 tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Description</label>
            <TextArea value={policy.description} onValueChanged={e => handlePolicyChange('description', e.value)} height={100} stylingMode="outlined" />
          </div>
        </div>

        <div className="tw-mt-6">
          <CheckBox text="Activate policy" value={policy.isActive} onValueChanged={e => handlePolicyChange('isActive', e.value)} />
        </div>
      </ValidationGroup>
    </div>
  );

  const renderActiveAlarmFiltersTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Active Alarm Filters</h3>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">These filters determine which ActiveAlarm events this policy should apply to.</p>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Alarm Event</label>
          <SelectBox
            value={activeAlarmFilter.eventType}
            dataSource={activeAlarmEventOptions}
            valueExpr="value"
            displayExpr="text"
            onValueChanged={e => updateActiveAlarmFilter('eventType', e.value)}
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Minimum Severity</label>
          <SelectBox
            value={activeAlarmFilter.minimumSeverity}
            dataSource={severityOptions}
            valueExpr="value"
            displayExpr="text"
            onValueChanged={e => updateActiveAlarmFilter('minimumSeverity', e.value)}
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Alarm Type (optional)</label>
          <TextBox
            value={activeAlarmFilter.alarmType}
            onValueChanged={e => updateActiveAlarmFilter('alarmType', e.value)}
            placeholder="e.g. TankStockDiscrepancy"
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Site Id (optional)</label>
          <NumberBox
            value={activeAlarmFilter.siteId === '' ? null : Number(activeAlarmFilter.siteId)}
            onValueChanged={e => updateActiveAlarmFilter('siteId', e.value ?? '')}
            min={1}
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Tank Id (optional)</label>
          <NumberBox
            value={activeAlarmFilter.tankId === '' ? null : Number(activeAlarmFilter.tankId)}
            onValueChanged={e => updateActiveAlarmFilter('tankId', e.value ?? '')}
            min={1}
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">PTS Device Id (optional)</label>
          <TextBox
            value={activeAlarmFilter.ptsDeviceId}
            onValueChanged={e => updateActiveAlarmFilter('ptsDeviceId', e.value)}
            placeholder="PTS-DEVICE-01"
            height={40}
            stylingMode="outlined"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettingsTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form notification-form">
      <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Delivery Methods</h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <CheckBox text="Email Notifications" value={policy.enableEmail} onValueChanged={e => handlePolicyChange('enableEmail', e.value)} />
          <CheckBox text="SMS Notifications" value={policy.enableSms} onValueChanged={e => handlePolicyChange('enableSms', e.value)} />
          <CheckBox text="System Notifications" value={policy.enableSystem} onValueChanged={e => handlePolicyChange('enableSystem', e.value)} />
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Max Notifications Per Hour</label>
          <NumberBox
            value={policy.maxNotificationsPerHour}
            onValueChanged={e => handlePolicyChange('maxNotificationsPerHour', e.value)}
            min={0}
            max={100}
            showSpinButtons
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Max Notifications Per Day</label>
          <NumberBox
            value={policy.maxNotificationsPerDay}
            onValueChanged={e => handlePolicyChange('maxNotificationsPerDay', e.value)}
            min={0}
            max={1000}
            showSpinButtons
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Cooldown Period (minutes)</label>
          <NumberBox
            value={policy.cooldownMinutes}
            onValueChanged={e => handlePolicyChange('cooldownMinutes', e.value)}
            min={0}
            max={1440}
            showSpinButtons
            height={40}
            stylingMode="outlined"
          />
        </div>

        <div className="tw-flex tw-items-center tw-pt-8">
          <CheckBox text="Require Acknowledgment" value={policy.requireAcknowledgment} onValueChanged={e => handlePolicyChange('requireAcknowledgment', e.value)} />
        </div>
      </div>
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
            showSelectionControls
            multiline={false}
            onValueChanged={e => handlePolicyChange('recipients', e.value)}
          />
          <div className="tw-text-sm tw-text-gray-500 tw-mt-2">Selected recipients will receive notifications for matching active alarms.</div>
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

        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <h4 className="tw-font-medium tw-text-gray-900 tw-mb-3">Map Policy to Group</h4>
          <div className="tw-flex tw-items-end tw-space-x-3">
            <SelectBox
              label="Select Group"
              dataSource={allGroups}
              valueExpr="id"
              displayExpr="name"
              value={selectedGroupId}
              onValueChanged={e => setSelectedGroupId(e.value)}
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
                } catch {
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
      '{{alarmType}}': 'TankStockDiscrepancy',
      '{{siteName}}': 'Main Station',
      '{{severity}}': 'Critical',
      '{{state}}': 'Active',
      '{{triggeredAt}}': new Date().toLocaleString()
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
                  onValueChanged={e => handlePolicyChange('titleTemplate', e.value)}
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
                  onValueChanged={e => handlePolicyChange('messageTemplate', e.value)}
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
                {policy.titleTemplate
                  ? policy.titleTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                      return mockValues[`{{${variable}}}`] || match;
                    })
                  : 'Title will appear here'}
              </div>
              <p className="tw-text-gray-700 tw-text-sm tw-whitespace-pre-line">
                {policy.messageTemplate
                  ? policy.messageTemplate.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
                      return mockValues[`{{${variable}}}`] || match;
                    })
                  : 'Message content will appear here'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTriggersTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <PolicyTriggersManager
        policyId={Number(policy.id || id)}
        categoryId={Number(policy.notificationCategoryId) || null}
      />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderBasicInfoTab();
      case 1:
        return renderActiveAlarmFiltersTab();
      case 2:
        return renderNotificationSettingsTab();
      case 3:
        return renderRecipientsTab();
      case 4:
        return renderTemplatesTab();
      case 5:
        return renderTriggersTab();
      default:
        return renderBasicInfoTab();
    }
  };

  if (loadingPolicy) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
        <LoadIndicator visible />
        <span className="tw-ml-3 tw-text-gray-600">Loading policy...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="tw-p-10 tw-text-center tw-space-y-4">
        <i className="fa-light fa-triangle-exclamation tw-text-red-500 tw-text-5xl" />
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">Policy Not Found</h2>
        <p className="tw-text-gray-600 tw-max-w-md tw-mx-auto">
          The policy with ID {id} could not be located. It may have been deleted or the link is incorrect.
        </p>
        <Link
          to={notificationRoutes.policies}
          className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700"
        >
          <i className="fa-light fa-arrow-left tw-mr-2" /> Back to Policies
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link to={notificationRoutes.policies} className="tw-text-gray-400 hover:tw-text-gray-600">
            <i className="fa-light fa-arrow-left tw-text-xl" />
          </Link>
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Edit Policy</h2>
            <p className="tw-text-gray-600 tw-mt-1">{policy.name || 'Unnamed Policy'}</p>
            <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-mt-2 tw-text-xs tw-text-gray-500">
              <span>ID: <strong>{policy.id}</strong></span>
              <span>
                Category: {categoryOptions.find(c => String(c.value) === String(policy.notificationCategoryId))?.text || '-'}
              </span>
              <span>
                Status:{' '}
                <span
                  className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-[10px] tw-font-medium ${
                    policy.isActive ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-red-100 tw-text-red-800'
                  }`}
                >
                  {policy.isActive ? 'Active' : 'Inactive'}
                </span>
              </span>
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
          <Button text="Save Changes" type="default" stylingMode="contained" onClick={savePolicy} disabled={loading} />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
        <div className="policy-create-tabs">
          <div className="tab-nav-container">
            <div className="tab-nav-wrapper tw-px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <i className={`tab-icon fa-light fa-${tab.icon}`} />
                  <span className="tab-title">{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="policy-form-container">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default PolicyEdit;
