/**
 * File: PolicyCreate.js
 * Purpose: Create notification policies linked 1:1 to an alert type from AlertConfigurationConstants.
 *          Uses FMS user management for recipient selection, links to alert configuration for thresholds.
 * Dependencies: react, devextreme-react, alertConfigurationApi, notificationsApi
 * Last Modified: 2026-02-09
 *
 * Key Functions:
 * - PolicyCreate(): Renders policy creation with tabbed sections
 * - Alert type dropdown populated from enabled-types endpoint
 * - Recipients pulled from FMS user/role management
 * - Preview tab shows full policy summary
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextBox,
  TextArea,
  SelectBox,
  NumberBox,
  TagBox,
  LoadIndicator,
} from 'devextreme-react';
import { Validator } from 'devextreme-react/validator';
import { RequiredRule, StringLengthRule } from 'devextreme-react/validator';
import notify from 'devextreme/ui/notify';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';
import './PolicyCreate.scss';
import notificationsApi from '../../../dataservice/notificationsApi';
import alertConfigurationApi from '../../../dataservice/alertConfigurationApi';
import {
  notificationPriorityOptions as priorityOptions,
} from '../constants/notificationEnums';

const PolicyCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Core policy state
  const [policy, setPolicy] = useState({
    name: '',
    description: '',
    alertTypeKey: '',
    priority: 'Medium',
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
  });

  // Trigger filters
  const [triggerFilter, setTriggerFilter] = useState({
    eventType: 'Created',
    minimumSeverity: '',
  });

  // Recipients — user IDs and role IDs
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // Data sources
  const [enabledAlertTypes, setEnabledAlertTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load enabled alert types + users + roles on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingData(true);
      const [alertRes, usersRes, rolesRes] = await Promise.all([
        alertConfigurationApi.getEnabledAlertTypes(),
        notificationsApi.searchUsers('', 200),
        notificationsApi.searchRoles('', 100),
      ]);
      if (!mounted) return;
      if (alertRes.isSuccess) setEnabledAlertTypes(alertRes.data || []);
      if (usersRes.isSuccess) setUsers(usersRes.data || []);
      if (rolesRes.isSuccess) setRoles(rolesRes.data || []);
      setLoadingData(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Alert type dropdown options
  const alertTypeOptions = useMemo(() =>
    (enabledAlertTypes || []).map(at => ({
      value: at.key,
      text: `${at.displayName} (${at.group})`,
      group: at.group,
      description: at.description,
      thresholdSummary: at.thresholdSummary,
    })),
    [enabledAlertTypes]
  );

  // Selected alert type details
  const selectedAlertType = useMemo(
    () => enabledAlertTypes.find(at => at.key === policy.alertTypeKey),
    [enabledAlertTypes, policy.alertTypeKey]
  );

  const userOptions = useMemo(
    () => (users || []).map(u => ({ value: u.id, text: u.userName || u.email || u.id })),
    [users]
  );

  const roleOptions = useMemo(
    () => (roles || []).map(r => ({ value: r.id, text: r.name || r.id })),
    [roles]
  );

  const eventTypeOptions = [
    { value: 'Created', text: 'Alarm Created' },
    { value: 'Acknowledged', text: 'Alarm Acknowledged' },
    { value: 'Resolved', text: 'Alarm Resolved' },
    { value: 'Escalated', text: 'Alarm Escalated' },
    { value: 'AutoResolved', text: 'Auto Resolved' },
  ];

  const severityOptions = [
    { value: '', text: 'Any Severity' },
    { value: 'Low', text: 'Low' },
    { value: 'Medium', text: 'Medium' },
    { value: 'High', text: 'High' },
    { value: 'Critical', text: 'Critical' },
  ];

  const tabItems = [
    { title: 'Alert Type & Trigger', icon: 'fa-light fa-bell' },
    { title: 'Delivery & Limits', icon: 'fa-light fa-sliders' },
    { title: 'Recipients', icon: 'fa-light fa-users' },
    { title: 'Templates', icon: 'fa-light fa-file-lines' },
    { title: 'Preview', icon: 'fa-light fa-eye' },
  ];

  const handlePolicyChange = useCallback((field, value) => {
    setPolicy(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTriggerChange = useCallback((field, value) => {
    setTriggerFilter(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = () => {
    if (!policy.name?.trim()) {
      notify('Policy name is required', 'error', 3000);
      return false;
    }
    if (!policy.alertTypeKey) {
      notify('Please select an alert type', 'error', 3000);
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    // Build activeAlarmFilter JSON from selections
    const filterObj = {
      source: 'ActiveAlarm',
      eventType: triggerFilter.eventType || 'Created',
      alarmType: policy.alertTypeKey,
    };
    if (triggerFilter.minimumSeverity) {
      filterObj.minimumSeverity = triggerFilter.minimumSeverity;
    }

    return {
      name: policy.name,
      alertTypeKey: policy.alertTypeKey,
      notificationCategoryId: 0,
      notificationType: 'Alert',
      priority: policy.priority,
      enableEmail: policy.enableEmail,
      enableSms: policy.enableSms,
      enableSystem: policy.enableSystem,
      maxNotificationsPerHour: Number(policy.maxNotificationsPerHour) || 0,
      maxNotificationsPerDay: Number(policy.maxNotificationsPerDay) || 0,
      cooldownMinutes: Number(policy.cooldownMinutes) || 0,
      titleTemplate: policy.titleTemplate || `Alert: {{alarmType}} - {{severity}}`,
      messageTemplate: policy.messageTemplate || `{{alarmType}} triggered at {{siteName}} with severity {{severity}}`,
      requireAcknowledgment: policy.requireAcknowledgment,
      activeAlarmFilter: JSON.stringify(filterObj),
      description: policy.description,
    };
  };

  const savePolicy = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = buildPayload();
      const res = await notificationsApi.createPolicy(payload);
      if (res.isSuccess && res.data?.id) {
        notify('Policy created successfully', 'success', 3000);
        navigate(notificationRoutes.policies);
        return;
      }
      throw new Error(res.message || 'Failed to create policy');
    } catch (error) {
      console.error('Error creating policy:', error);
      notify(error.message || 'Error creating policy', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  // ─── Tab 1: Alert Type & Trigger ───
  const renderAlertTypeTriggerTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
          <i className="fa-light fa-bell tw-mr-2 tw-text-blue-500" />
          Select Alert Type
        </h3>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
          Each policy is linked to one alert type. The alert type determines what triggers notifications.
        </p>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        {/* Policy Name */}
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Policy Name *</label>
          <TextBox
            value={policy.name}
            onValueChanged={e => handlePolicyChange('name', e.value)}
            placeholder="e.g. Low Tank Level Alert"
            height={40}
            stylingMode="outlined"
          />
        </div>

        {/* Alert Type Dropdown */}
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Alert Type *</label>
          <SelectBox
            value={policy.alertTypeKey}
            dataSource={alertTypeOptions}
            valueExpr="value"
            displayExpr="text"
            searchEnabled
            onValueChanged={e => {
              handlePolicyChange('alertTypeKey', e.value);
              const alertType = enabledAlertTypes.find(at => at.key === e.value);
              if (alertType && !policy.name) {
                handlePolicyChange('name', `${alertType.displayName} Policy`);
              }
            }}
            placeholder="Select alert type..."
            height={40}
            stylingMode="outlined"
            noDataText={loadingData ? 'Loading alert types...' : 'No enabled alert types. Seed defaults first.'}
          />
        </div>

        {/* Description */}
        <div className="md:tw-col-span-2 tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Description</label>
          <TextArea
            value={policy.description}
            onValueChanged={e => handlePolicyChange('description', e.value)}
            placeholder="Describe what this policy does..."
            height={80}
            stylingMode="outlined"
          />
        </div>
      </div>

      {/* Alert Type Info Card */}
      {selectedAlertType && (
        <div className="tw-mt-6 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-justify-between">
            <div>
              <h4 className="tw-font-semibold tw-text-blue-800">{selectedAlertType.displayName}</h4>
              <p className="tw-text-sm tw-text-blue-600 tw-mt-1">{selectedAlertType.description}</p>
              <div className="tw-mt-2">
                <span className="tw-inline-block tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-700 tw-px-2 tw-py-1 tw-rounded">
                  Group: {selectedAlertType.group}
                </span>
              </div>
              {selectedAlertType.thresholdSummary && (
                <p className="tw-text-xs tw-text-blue-600 tw-mt-2">
                  <i className="fa-light fa-gauge tw-mr-1" />
                  Current thresholds: {selectedAlertType.thresholdSummary}
                </p>
              )}
            </div>
            <Link
              to={notificationRoutes.alertConfiguration}
              className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800 tw-underline tw-flex tw-items-center tw-shrink-0"
            >
              <i className="fa-light fa-sliders tw-mr-1" />
              Configure Thresholds
            </Link>
          </div>
        </div>
      )}

      {/* Trigger Conditions */}
      <div className="tw-mt-8">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
          <i className="fa-light fa-filter tw-mr-2 tw-text-purple-500" />
          Trigger Conditions
        </h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">When alarm event is</label>
            <SelectBox
              value={triggerFilter.eventType}
              dataSource={eventTypeOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handleTriggerChange('eventType', e.value)}
              height={40}
              stylingMode="outlined"
            />
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Minimum severity</label>
            <SelectBox
              value={triggerFilter.minimumSeverity}
              dataSource={severityOptions}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={e => handleTriggerChange('minimumSeverity', e.value)}
              height={40}
              stylingMode="outlined"
            />
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

          <div className="tw-flex tw-items-center tw-pt-8">
            <label className="tw-inline-flex tw-items-center tw-cursor-pointer">
              <input
                type="checkbox"
                checked={policy.isActive}
                onChange={e => handlePolicyChange('isActive', e.target.checked)}
                className="tw-sr-only tw-peer"
              />
              <div className="tw-relative tw-w-11 tw-h-6 tw-bg-gray-200 tw-rounded-full tw-peer peer-checked:tw-bg-blue-600 peer-focus:tw-ring-2 peer-focus:tw-ring-blue-300 after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border after:tw-border-gray-300 after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white" />
              <span className="tw-ml-3 tw-text-sm tw-font-medium tw-text-gray-700">
                Activate policy immediately
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Tab 2: Delivery & Limits ───
  const renderDeliveryTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form notification-form">
      <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          <i className="fa-light fa-paper-plane tw-mr-2 tw-text-green-500" />
          Delivery Channels
        </h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          {[
            { field: 'enableEmail', label: 'Email', icon: 'fa-light fa-envelope' },
            { field: 'enableSms', label: 'SMS', icon: 'fa-light fa-message-sms' },
            { field: 'enableSystem', label: 'In-App (SignalR)', icon: 'fa-light fa-bell' },
          ].map(ch => (
            <label key={ch.field} className="tw-flex tw-items-center tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-100 tw-transition-colors">
              <input
                type="checkbox"
                checked={policy[ch.field]}
                onChange={e => handlePolicyChange(ch.field, e.target.checked)}
                className="tw-w-4 tw-h-4 tw-text-blue-600 tw-border-gray-300 tw-rounded focus:tw-ring-blue-500"
              />
              <i className={`${ch.icon} tw-mx-3 tw-text-lg tw-text-gray-500`} />
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">{ch.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4">
          <i className="fa-light fa-gauge tw-mr-2 tw-text-orange-500" />
          Rate Limits
        </h3>
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Max per hour</label>
            <NumberBox
              value={policy.maxNotificationsPerHour}
              onValueChanged={e => handlePolicyChange('maxNotificationsPerHour', e.value)}
              min={0} max={100} showSpinButtons height={40} stylingMode="outlined"
            />
          </div>
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Max per day</label>
            <NumberBox
              value={policy.maxNotificationsPerDay}
              onValueChanged={e => handlePolicyChange('maxNotificationsPerDay', e.value)}
              min={0} max={1000} showSpinButtons height={40} stylingMode="outlined"
            />
          </div>
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Cooldown (minutes)</label>
            <NumberBox
              value={policy.cooldownMinutes}
              onValueChanged={e => handlePolicyChange('cooldownMinutes', e.value)}
              min={0} max={1440} showSpinButtons height={40} stylingMode="outlined"
            />
          </div>
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-pt-2">
        <label className="tw-inline-flex tw-items-center tw-cursor-pointer">
          <input
            type="checkbox"
            checked={policy.requireAcknowledgment}
            onChange={e => handlePolicyChange('requireAcknowledgment', e.target.checked)}
            className="tw-w-4 tw-h-4 tw-text-blue-600 tw-border-gray-300 tw-rounded focus:tw-ring-blue-500"
          />
          <span className="tw-ml-2 tw-text-sm tw-font-medium tw-text-gray-700">
            Require recipient acknowledgment
          </span>
        </label>
      </div>

      {/* Escalation placeholder */}
      <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4 tw-mt-4">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-clock tw-text-yellow-500 tw-mr-2" />
          <span className="tw-text-sm tw-text-yellow-700 tw-font-medium">
            Escalation chain configuration — coming soon
          </span>
        </div>
        <p className="tw-text-xs tw-text-yellow-600 tw-mt-1">
          Multi-level escalation (L1 → L2 → L3) will be available in a future update.
        </p>
      </div>
    </div>
  );

  // ─── Tab 3: Recipients ───
  const renderRecipientsTab = () => (
    <div className="tw-p-6 policy-create-form notification-form">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
          <i className="fa-light fa-users tw-mr-2 tw-text-indigo-500" />
          Notification Recipients
        </h3>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
          Select users and/or roles from the FMS system who should receive notifications.
        </p>
      </div>

      <div className="tw-space-y-6">
        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-user tw-mr-1" /> Users
          </label>
          <TagBox
            value={selectedUserIds}
            dataSource={userOptions}
            valueExpr="value"
            displayExpr="text"
            searchEnabled
            showSelectionControls
            onValueChanged={e => setSelectedUserIds(e.value || [])}
            placeholder="Search and select users..."
            multiline={false}
            height={45}
            noDataText={loadingData ? 'Loading users...' : 'No users found'}
          />
          <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
            {selectedUserIds.length} user(s) selected
          </p>
        </div>

        <div className="tw-space-y-1">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            <i className="fa-light fa-shield tw-mr-1" /> Roles
          </label>
          <TagBox
            value={selectedRoleIds}
            dataSource={roleOptions}
            valueExpr="value"
            displayExpr="text"
            searchEnabled
            showSelectionControls
            onValueChanged={e => setSelectedRoleIds(e.value || [])}
            placeholder="Search and select roles..."
            multiline={false}
            height={45}
            noDataText={loadingData ? 'Loading roles...' : 'No roles found'}
          />
          <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
            {selectedRoleIds.length} role(s) selected — all users with selected roles will receive notifications
          </p>
        </div>

        {selectedUserIds.length === 0 && selectedRoleIds.length === 0 && (
          <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-3">
            <p className="tw-text-sm tw-text-amber-700">
              <i className="fa-light fa-triangle-exclamation tw-mr-1" />
              No recipients selected. Policy will be created but notifications won't be delivered until recipients are configured.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Tab 4: Templates ───
  const renderTemplatesTab = () => (
    <div className="tw-p-6 tw-space-y-6 policy-create-form notification-form">
      <div className="tw-mb-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
          <i className="fa-light fa-file-lines tw-mr-2 tw-text-teal-500" />
          Notification Templates
        </h3>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
          Use placeholders like <code className="tw-bg-gray-100 tw-px-1 tw-rounded tw-text-xs">{'{{alarmType}}'}</code>,{' '}
          <code className="tw-bg-gray-100 tw-px-1 tw-rounded tw-text-xs">{'{{severity}}'}</code>,{' '}
          <code className="tw-bg-gray-100 tw-px-1 tw-rounded tw-text-xs">{'{{siteName}}'}</code> in your templates.
        </p>
      </div>

      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Title Template</label>
        <TextBox
          value={policy.titleTemplate}
          onValueChanged={e => handlePolicyChange('titleTemplate', e.value)}
          placeholder="e.g. Alert: {{alarmType}} - {{severity}}"
          height={40}
          stylingMode="outlined"
        />
      </div>

      <div className="tw-space-y-1">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Message Template</label>
        <TextArea
          value={policy.messageTemplate}
          onValueChanged={e => handlePolicyChange('messageTemplate', e.value)}
          placeholder="e.g. {{alarmType}} triggered at {{siteName}} with severity {{severity}}"
          height={120}
          stylingMode="outlined"
        />
      </div>

      <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-600 tw-mb-2">Available Placeholders</h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2">
          {['alarmType', 'severity', 'priority', 'siteName', 'tankId', 'siteId', 'timestamp', 'policyName'].map(ph => (
            <span key={ph} className="tw-inline-block tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-px-2 tw-py-1 tw-text-xs tw-text-gray-600 tw-font-mono">
              {`{{${ph}}}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Tab 5: Preview ───
  const renderPreviewTab = () => {
    const channels = [
      policy.enableEmail && 'Email',
      policy.enableSms && 'SMS',
      policy.enableSystem && 'In-App',
    ].filter(Boolean);
    const userNames = selectedUserIds.map(id => {
      const u = users.find(usr => usr.id === id);
      return u?.userName || u?.email || id;
    });
    const roleNames = selectedRoleIds.map(id => {
      const r = roles.find(rl => rl.id === id);
      return r?.name || id;
    });

    return (
      <div className="tw-p-6 policy-create-form notification-form">
        <div className="tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-eye tw-mr-2 tw-text-gray-500" />
            Policy Summary
          </h3>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            Review your policy configuration before saving.
          </p>
        </div>

        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-divide-y tw-divide-gray-100">
          {/* Trigger */}
          <div className="tw-p-4">
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">Trigger</h4>
            <p className="tw-text-sm tw-text-gray-800">
              When <span className="tw-font-semibold tw-text-blue-600">{selectedAlertType?.displayName || policy.alertTypeKey || '—'}</span> alarm
              {' '}is <span className="tw-font-semibold">{triggerFilter.eventType}</span>
              {triggerFilter.minimumSeverity && (
                <> with severity ≥ <span className="tw-font-semibold tw-text-orange-600">{triggerFilter.minimumSeverity}</span></>
              )}
            </p>
            {selectedAlertType?.thresholdSummary && (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                <i className="fa-light fa-gauge tw-mr-1" />
                Thresholds: {selectedAlertType.thresholdSummary}
              </p>
            )}
          </div>

          {/* Delivery */}
          <div className="tw-p-4">
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">Delivery</h4>
            <p className="tw-text-sm tw-text-gray-800">
              Send via <span className="tw-font-semibold">{channels.join(', ') || 'No channels selected'}</span>
            </p>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Rate: max {policy.maxNotificationsPerHour}/hr, {policy.maxNotificationsPerDay}/day, {policy.cooldownMinutes}min cooldown
            </p>
          </div>

          {/* Recipients */}
          <div className="tw-p-4">
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">Recipients</h4>
            {userNames.length > 0 && (
              <p className="tw-text-sm tw-text-gray-800">
                <i className="fa-light fa-user tw-mr-1 tw-text-gray-400" />
                Users: <span className="tw-font-medium">{userNames.join(', ')}</span>
              </p>
            )}
            {roleNames.length > 0 && (
              <p className="tw-text-sm tw-text-gray-800 tw-mt-1">
                <i className="fa-light fa-shield tw-mr-1 tw-text-gray-400" />
                Roles: <span className="tw-font-medium">{roleNames.join(', ')}</span>
              </p>
            )}
            {userNames.length === 0 && roleNames.length === 0 && (
              <p className="tw-text-sm tw-text-amber-600">
                <i className="fa-light fa-triangle-exclamation tw-mr-1" />
                No recipients configured
              </p>
            )}
          </div>

          {/* Templates */}
          <div className="tw-p-4">
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">Templates</h4>
            <p className="tw-text-sm tw-text-gray-800">
              <span className="tw-font-medium">Title:</span>{' '}
              {policy.titleTemplate || <span className="tw-text-gray-400 tw-italic">Auto-generated</span>}
            </p>
            <p className="tw-text-sm tw-text-gray-800 tw-mt-1">
              <span className="tw-font-medium">Message:</span>{' '}
              {policy.messageTemplate || <span className="tw-text-gray-400 tw-italic">Auto-generated</span>}
            </p>
          </div>

          {/* Status */}
          <div className="tw-p-4">
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-400 tw-uppercase tw-tracking-wider tw-mb-2">Status</h4>
            <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${policy.isActive ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-gray-100 tw-text-gray-600'}`}>
              {policy.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="tw-ml-2 tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-bg-blue-100 tw-text-blue-700">
              Priority: {policy.priority}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderAlertTypeTriggerTab();
      case 1: return renderDeliveryTab();
      case 2: return renderRecipientsTab();
      case 3: return renderTemplatesTab();
      case 4: return renderPreviewTab();
      default: return renderAlertTypeTriggerTab();
    }
  };

  if (loadingData) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-500">Loading configuration data...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-8">
        <div className="tw-flex tw-items-center tw-space-x-4">
          <Link to={notificationRoutes.policies} className="tw-text-gray-400 hover:tw-text-gray-600">
            <i className="fa-light fa-arrow-left tw-text-xl" />
          </Link>
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Create Notification Policy</h2>
            <p className="tw-text-gray-500 tw-mt-1">Link an alert type to delivery channels and recipients</p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-3">
          <Link
            to={notificationRoutes.policies}
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={savePolicy}
            disabled={loading}
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-bg-blue-600 tw-border tw-border-transparent tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50"
          >
            {loading ? <LoadIndicator height={16} width={16} /> : <i className="fa-light fa-floppy-disk tw-mr-2" />}
            Save Policy
          </button>
        </div>
      </div>

      {/* Tab Container */}
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
                  <i className={`${tab.icon} tw-mr-2`} />
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
