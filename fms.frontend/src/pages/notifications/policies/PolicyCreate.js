/**
 * File: PolicyCreate.js
 * Purpose: Simplified policy creation page. Since notification policies are now
 *          created inline as part of Event Expressions, this page redirects users
 *          to the Event Expression creation flow or allows creating a standalone
 *          policy shell (delivery config only, no trigger logic).
 * Dependencies: react-router-dom, devextreme-react
 * Last Modified: 2026-02-14
 *
 * Architecture Note:
 *   Previously this page mixed trigger logic (alert type, event type, severity)
 *   with delivery config (channels, rate limits, recipients, templates).
 *   Trigger logic now lives in Event Expressions. Policies are auto-created
 *   when saving an expression. This page is kept for standalone policy management.
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
import { Validator, RequiredRule, StringLengthRule } from 'devextreme-react/validator';
import notify from 'devextreme/ui/notify';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';
import './PolicyCreate.scss';
import notificationsApi from '../../../dataservice/notificationsApi';
import {
    notificationPriorityOptions as priorityOptions,
} from '../constants/notificationEnums';

const PolicyCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Core policy state (delivery config only — no trigger logic)
    const [policy, setPolicy] = useState({
        name: '',
        description: '',
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

    // Recipients
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingData(true);
            const [usersRes, rolesRes] = await Promise.all([
                notificationsApi.searchUsers('', 200),
                notificationsApi.searchRoles('', 100),
            ]);
            if (!mounted) return;
            if (usersRes.isSuccess) setUsers(usersRes.data || []);
            if (rolesRes.isSuccess) setRoles(rolesRes.data || []);
            setLoadingData(false);
        })();
        return () => { mounted = false; };
    }, []);

    const userOptions = useMemo(
        () => (users || []).map(u => ({ value: u.id, text: u.userName || u.email || u.id })),
        [users]
    );

    const roleOptions = useMemo(
        () => (roles || []).map(r => ({ value: r.id, text: r.name || r.id })),
        [roles]
    );

    const handlePolicyChange = useCallback((field, value) => {
        setPolicy(prev => ({ ...prev, [field]: value }));
    }, []);

    const savePolicy = async () => {
        if (!policy.name?.trim()) {
            notify('Policy name is required', 'error', 3000);
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: policy.name,
                description: policy.description,
                notificationType: 'Alert',
                priority: policy.priority,
                enableEmail: policy.enableEmail,
                enableSms: policy.enableSms,
                enableSystem: policy.enableSystem,
                maxNotificationsPerHour: Number(policy.maxNotificationsPerHour) || 0,
                maxNotificationsPerDay: Number(policy.maxNotificationsPerDay) || 0,
                cooldownMinutes: Number(policy.cooldownMinutes) || 0,
                titleTemplate: policy.titleTemplate || 'Alert: {{alarmType}} - {{severity}}',
                messageTemplate: policy.messageTemplate || '{{alarmType}} triggered at {{siteName}} with severity {{severity}}',
                requireAcknowledgment: policy.requireAcknowledgment,
                recipientUserIds: selectedUserIds,
                recipientRoleIds: selectedRoleIds,
            };

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

    if (loadingData) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                <LoadIndicator visible={true} />
            </div>
        );
    }

    return (
        <div className="tw-p-6 tw-max-w-4xl tw-mx-auto">
            {/* Header with redirect suggestion */}
            <div className="tw-mb-6">
                <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
                    <i className="fa-light fa-shield-halved tw-mr-2" />
                    Create Notification Policy
                </h2>
                <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                    Configure delivery channels, rate limits, and recipients for notifications.
                </p>
            </div>

            {/* Recommendation banner */}
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-6">
                <div className="tw-flex tw-items-start tw-gap-3">
                    <i className="fa-light fa-lightbulb tw-text-blue-500 tw-text-lg tw-mt-0.5" />
                    <div>
                        <h4 className="tw-text-sm tw-font-semibold tw-text-blue-800">
                            Recommended: Create via Event Expressions
                        </h4>
                        <p className="tw-text-xs tw-text-blue-700 tw-mt-1">
                            Policies are now created automatically when you create an Event Expression.
                            This gives you a complete setup — triggers, scope, delivery, and recipients — in one flow.
                        </p>
                        <Link
                            to="/event-expressions/create"
                            className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-text-blue-600 hover:tw-text-blue-800 tw-mt-2"
                        >
                            <i className="fa-light fa-arrow-right" />
                            Go to Event Expression Creator
                        </Link>
                    </div>
                </div>
            </div>

            {/* Policy Name & Description */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-pen tw-mr-2" />
                    Policy Details
                </h3>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Name <span className="tw-text-red-500">*</span>
                        </label>
                        <TextBox
                            value={policy.name}
                            onValueChanged={e => handlePolicyChange('name', e.value)}
                            placeholder="e.g., Critical Tank Alert Policy"
                            stylingMode="outlined"
                        >
                            <Validator>
                                <RequiredRule message="Policy name is required" />
                                <StringLengthRule max={100} message="Max 100 characters" />
                            </Validator>
                        </TextBox>
                    </div>
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Priority
                        </label>
                        <SelectBox
                            items={priorityOptions}
                            displayExpr="text"
                            valueExpr="value"
                            value={policy.priority}
                            onValueChanged={e => handlePolicyChange('priority', e.value)}
                            stylingMode="outlined"
                        />
                    </div>
                    <div className="md:tw-col-span-2">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Description
                        </label>
                        <TextArea
                            value={policy.description}
                            onValueChanged={e => handlePolicyChange('description', e.value)}
                            placeholder="Describe the purpose of this policy..."
                            height={60}
                            stylingMode="outlined"
                        />
                    </div>
                </div>
            </div>

            {/* Delivery Channels & Rate Limits */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-paper-plane tw-mr-2" />
                    Delivery & Rate Limits
                </h3>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    {/* Channels */}
                    <div className="tw-space-y-2">
                        <label className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide">
                            Channels
                        </label>
                        {[
                            { key: 'enableEmail', label: 'Email', icon: 'fa-envelope' },
                            { key: 'enableSms', label: 'SMS', icon: 'fa-comment-sms' },
                            { key: 'enableSystem', label: 'In-App', icon: 'fa-bell' },
                        ].map(ch => (
                            <div key={ch.key} className="tw-flex tw-items-center tw-justify-between tw-py-1">
                                <label className="tw-text-sm tw-text-gray-700 tw-flex tw-items-center tw-gap-2">
                                    <i className={`fa-light ${ch.icon} tw-text-gray-400 tw-w-4`} />
                                    {ch.label}
                                </label>
                                <input
                                    type="checkbox"
                                    checked={!!policy[ch.key]}
                                    onChange={e => handlePolicyChange(ch.key, e.target.checked)}
                                    className="tw-h-4 tw-w-4 tw-cursor-pointer"
                                />
                            </div>
                        ))}
                        <div className="tw-flex tw-items-center tw-justify-between tw-py-1 tw-mt-2 tw-pt-2 tw-border-t tw-border-gray-100">
                            <label className="tw-text-sm tw-text-gray-700">
                                Require Acknowledgment
                            </label>
                            <input
                                type="checkbox"
                                checked={!!policy.requireAcknowledgment}
                                onChange={e => handlePolicyChange('requireAcknowledgment', e.target.checked)}
                                className="tw-h-4 tw-w-4 tw-cursor-pointer"
                            />
                        </div>
                    </div>
                    {/* Rate limits */}
                    <div className="tw-space-y-3">
                        <label className="tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wide">
                            Rate Limits
                        </label>
                        <div>
                            <label className="tw-text-sm tw-text-gray-700 tw-mb-1 tw-block">Cooldown (min)</label>
                            <NumberBox
                                value={policy.cooldownMinutes}
                                onValueChanged={e => handlePolicyChange('cooldownMinutes', e.value)}
                                min={0} max={1440} showSpinButtons stylingMode="outlined"
                            />
                        </div>
                        <div>
                            <label className="tw-text-sm tw-text-gray-700 tw-mb-1 tw-block">Max / Hour</label>
                            <NumberBox
                                value={policy.maxNotificationsPerHour}
                                onValueChanged={e => handlePolicyChange('maxNotificationsPerHour', e.value)}
                                min={0} max={100} showSpinButtons stylingMode="outlined"
                            />
                        </div>
                        <div>
                            <label className="tw-text-sm tw-text-gray-700 tw-mb-1 tw-block">Max / Day</label>
                            <NumberBox
                                value={policy.maxNotificationsPerDay}
                                onValueChanged={e => handlePolicyChange('maxNotificationsPerDay', e.value)}
                                min={0} max={1000} showSpinButtons stylingMode="outlined"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipients */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-4">
                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-users tw-mr-2" />
                    Recipients
                </h3>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Users
                        </label>
                        <TagBox
                            items={userOptions}
                            displayExpr="text"
                            valueExpr="value"
                            value={selectedUserIds}
                            onValueChanged={e => setSelectedUserIds(e.value || [])}
                            searchEnabled showClearButton multiline={false}
                            showSelectionControls placeholder="Select users..."
                            stylingMode="outlined"
                        />
                    </div>
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Roles
                        </label>
                        <TagBox
                            items={roleOptions}
                            displayExpr="text"
                            valueExpr="value"
                            value={selectedRoleIds}
                            onValueChanged={e => setSelectedRoleIds(e.value || [])}
                            searchEnabled showClearButton multiline={false}
                            showSelectionControls placeholder="Select roles..."
                            stylingMode="outlined"
                        />
                    </div>
                </div>
            </div>

            {/* Templates */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mb-6">
                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-file-lines tw-mr-2" />
                    Templates
                </h3>
                <div className="tw-space-y-3">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Title Template
                        </label>
                        <TextBox
                            value={policy.titleTemplate}
                            onValueChanged={e => handlePolicyChange('titleTemplate', e.value)}
                            placeholder="Alert: {{alarmType}} - {{severity}}"
                            stylingMode="outlined"
                        />
                    </div>
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Message Template
                        </label>
                        <TextArea
                            value={policy.messageTemplate}
                            onValueChanged={e => handlePolicyChange('messageTemplate', e.value)}
                            placeholder="{{alarmType}} triggered at {{siteName}} with severity {{severity}}"
                            height={80}
                            stylingMode="outlined"
                        />
                    </div>
                    <p className="tw-text-xs tw-text-gray-400">
                        Available placeholders: {'{{alarmType}}'}, {'{{severity}}'}, {'{{siteName}}'}, {'{{tankName}}'}, {'{{actualValue}}'}, {'{{thresholdValue}}'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-3">
                <button
                    className="tw-px-4 tw-py-2 tw-text-sm tw-text-gray-700 tw-border tw-border-gray-300 tw-rounded-md hover:tw-bg-gray-50"
                    onClick={() => navigate(notificationRoutes.policies)}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    className="tw-px-4 tw-py-2 tw-text-sm tw-text-white tw-bg-blue-600 tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50"
                    onClick={savePolicy}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="tw-flex tw-items-center tw-gap-2">
                            <LoadIndicator visible={true} height={16} width={16} />
                            Creating...
                        </span>
                    ) : (
                        <>
                            <i className="fa-light fa-check tw-mr-1" />
                            Create Policy
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PolicyCreate;
