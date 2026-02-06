/**
 * File: PolicyCreate.js
 * Purpose: Create notification policies and configure ActiveAlarm-based filters, recipients, and templates.
 * Dependencies: react, devextreme-react, notifications API services.
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - PolicyCreate(): Renders policy creation workflow with tabbed sections.
 * - renderActiveAlarmFiltersTab(): Configures ActiveAlarm filter fields.
 * - savePolicy(): Persists policy settings to backend.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import notificationsApi from '../../../dataservice/notificationsApi';
import notificationPreferencesApi from '../../../dataservice/notificationPreferencesApi';
import {
  notificationPriorityOptions as priorityOptions,
  notificationTypeOptions
} from '../constants/notificationEnums';

const PolicyCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [policy, setPolicy] = useState({
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
    isActive: true,
    emailRecipients: [],
    smsRecipients: [],
    systemRecipients: []
  });

  const [activeAlarmFilter, setActiveAlarmFilter] = useState({
    eventType: 'Created',
    alarmType: '',
    minimumSeverity: '',
    siteId: '',
    tankId: '',
    ptsDeviceId: ''
  });

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

  const tabItems = [
    { title: 'Basic Information' },
    { title: 'Active Alarm Filters' },
    { title: 'Notification Settings' },
    { title: 'Recipients' },
    { title: 'Templates' }
  ];

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
        activeAlarmFilter: buildActiveAlarmFilterPayload()
      };

      const res = await notificationsApi.createPolicy(payload);
      if (res.isSuccess && res.data?.id) {
        const createdPolicyId = Number(res.data.id);
        notify('Policy created. Continue with trigger configuration.', 'success', 3000);
        navigate(`${notificationRoutes.policyEdit(createdPolicyId)}?tab=triggers`);
        return;
      }

      throw new Error(res.message || 'Failed to create policy');
    } catch (error) {
      console.error('Error creating policy:', error);
      notify('Error creating policy', 'error', 3000);
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
            <TextBox
              value={policy.name}
              onValueChanged={e => handlePolicyChange('name', e.value)}
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
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Category *</label>
            <SelectBox
              value={policy.notificationCategoryId}
              dataSource={categoryOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handlePolicyChange('notificationCategoryId', e.value)}
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
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Priority</label>
            <SelectBox
              value={policy.priority}
              dataSource={priorityOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handlePolicyChange('priority', e.value)}
              height={40}
              stylingMode="outlined"
              className="policy-form-field"
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
              className="policy-form-field"
            />
          </div>

          <div className="md:tw-col-span-2 tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Description</label>
            <TextArea
              value={policy.description}
              onValueChanged={e => handlePolicyChange('description', e.value)}
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
            onValueChanged={e => handlePolicyChange('isActive', e.value)}
          />
        </div>
      </ValidationGroup>
    </div>
  );

  const renderActiveAlarmFiltersTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Active Alarm Filters</h3>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
          Define which ActiveAlarm events this policy should respond to.
        </p>
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
          <CheckBox
            text="Email Notifications"
            value={policy.enableEmail}
            onValueChanged={e => handlePolicyChange('enableEmail', e.value)}
          />
          <CheckBox
            text="SMS Notifications"
            value={policy.enableSms}
            onValueChanged={e => handlePolicyChange('enableSms', e.value)}
          />
          <CheckBox
            text="System Notifications"
            value={policy.enableSystem}
            onValueChanged={e => handlePolicyChange('enableSystem', e.value)}
          />
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
            className="policy-form-field"
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
            className="policy-form-field"
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
            className="policy-form-field"
          />
        </div>

        <div className="tw-flex tw-items-center tw-pt-8">
          <CheckBox
            text="Require Acknowledgment"
            value={policy.requireAcknowledgment}
            onValueChanged={e => handlePolicyChange('requireAcknowledgment', e.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderRecipientsTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-space-y-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Email Recipients</label>
          <TagBox
            value={policy.emailRecipients}
            dataSource={recipientOptions}
            valueExpr="value"
            displayExpr="text"
            searchEnabled
            acceptCustomValue
            onValueChanged={e => handlePolicyChange('emailRecipients', e.value)}
            placeholder="Select or enter email addresses"
            multiline={false}
            height={45}
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">SMS Recipients</label>
          <TagBox
            value={policy.smsRecipients}
            searchEnabled
            acceptCustomValue
            onValueChanged={e => handlePolicyChange('smsRecipients', e.value)}
            placeholder="Enter phone numbers"
            multiline={false}
            height={45}
          />
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">System Recipients (User IDs)</label>
          <TagBox
            value={policy.systemRecipients}
            searchEnabled
            acceptCustomValue
            onValueChanged={e => handlePolicyChange('systemRecipients', e.value)}
            placeholder="Enter user IDs"
            multiline={false}
            height={45}
          />
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form notification-form">
      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Title Template *</label>
        <TextBox
          value={policy.titleTemplate}
          onValueChanged={e => handlePolicyChange('titleTemplate', e.value)}
          placeholder="e.g., Active Alarm: {{alarmType}}"
          height={40}
        >
          <Validator>
            <RequiredRule message="Title template is required" />
          </Validator>
        </TextBox>
      </div>

      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Message Template *</label>
        <TextArea
          value={policy.messageTemplate}
          onValueChanged={e => handlePolicyChange('messageTemplate', e.value)}
          placeholder="e.g., {{alarmType}} at {{siteName}} with severity {{severity}}"
          height={120}
        >
          <Validator>
            <RequiredRule message="Message template is required" />
          </Validator>
        </TextArea>
      </div>
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
      default:
        return renderBasicInfoTab();
    }
  };

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link to={notificationRoutes.policies} className="tw-text-gray-400 hover:tw-text-gray-600">
            <i className="fa-light fa-arrow-left tw-text-xl" />
          </Link>
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Create New Policy</h2>
            <p className="tw-text-gray-600 tw-mt-1">Configure a new ActiveAlarm-based notification policy</p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-3">
          <Link
            to={notificationRoutes.policies}
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors tw-duration-200"
          >
            <i className="fa-light fa-arrow-left tw-mr-2" />
            Cancel
          </Link>
          <Button
            text="Save Policy"
            icon="save"
            type="default"
            stylingMode="contained"
            onClick={savePolicy}
            disabled={loading}
          />
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
        <div className="policy-create-tabs">
          <div className="tab-nav-container">
            <div className="tab-nav-wrapper tw-px-6">
              {tabItems.map((tab, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`tab-nav-button ${activeTab === index ? 'active' : ''}`}
                >
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

export default PolicyCreate;
