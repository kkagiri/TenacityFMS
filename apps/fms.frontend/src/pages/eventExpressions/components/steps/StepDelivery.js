/**
 * File: StepDelivery.js
 * Purpose: Step 4 of Event Expression form — Notification delivery configuration.
 *          Channels (Email, SMS, In-App), rate limits, cooldown, timing, active event creation.
 *          These fields are saved to the linked NotificationPolicy.
 * Dependencies: devextreme-react NumberBox, parent policyData/handlers via props
 * Last Modified: 2026-02-24
 *
 * Key Props:
 * - policyData: notification policy state (channels, rate limits, etc.)
 * - onPolicyChange(field, value): updates a policy field
 * - formData: expression-level overrides (cooldownMinutes, maxNotificationsPerDay, maxNotificationsPerHour, createActiveEvent)
 * - onFieldChange(field, value): updates expression field
 *
 * Rate limit fields:
 *   formData.cooldownMinutes         — min gap between triggers (per scope)
 *   formData.maxNotificationsPerHour — NEW: hourly cap per tank/site scope
 *   formData.maxNotificationsPerDay  — daily cap per tank/site scope
 *   policyData.maxNotificationsPerHour — policy-level pipeline throttle (delivery channel cap)
 */

import React from 'react';
import { NumberBox } from 'devextreme-react/number-box';
import {
    Validator,
    RangeRule
} from 'devextreme-react/validator';

const DELIVERY_CHANNELS = [
    { field: 'enableEmail', label: 'Email', icon: 'fa-light fa-envelope', description: 'Send email notifications' },
    { field: 'enableSms', label: 'SMS', icon: 'fa-light fa-message-sms', description: 'Send SMS text messages' },
    { field: 'enableSystem', label: 'In-App (SignalR)', icon: 'fa-light fa-bell', description: 'Real-time browser push' },
];

const StepDelivery = ({ policyData, onPolicyChange, formData, onFieldChange }) => {
    return (
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6">
            {/* Left: Channels + Behavior */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-paper-plane tw-mr-2 tw-text-green-500" />
                    Delivery Channels
                </h4>

                <div className="tw-space-y-2 tw-mb-4">
                    {DELIVERY_CHANNELS.map((ch) => (
                        <label
                            key={ch.field}
                            className="tw-flex tw-items-center tw-p-3 tw-border tw-rounded-lg tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={!!policyData[ch.field]}
                                onChange={(e) => onPolicyChange(ch.field, e.target.checked)}
                                className="tw-w-4 tw-h-4 tw-text-blue-600 tw-border-gray-300 tw-rounded focus:tw-ring-blue-500"
                            />
                            <i className={`${ch.icon} tw-mx-3 tw-text-lg tw-text-gray-500`} />
                            <div>
                                <span className="tw-text-sm tw-font-medium tw-text-gray-700">{ch.label}</span>
                                <p className="tw-text-xs tw-text-gray-400">{ch.description}</p>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="tw-border-t tw-border-gray-200 tw-pt-3 tw-mt-3">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                        <div>
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Create Active Event
                            </label>
                            <p className="tw-text-xs tw-text-gray-400">
                                Creates a trackable event record when triggered
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!formData.createActiveEvent}
                            onChange={(e) => onFieldChange('createActiveEvent', e.target.checked)}
                            className="tw-h-4 tw-w-4 tw-cursor-pointer"
                        />
                    </div>

                    <div className="tw-flex tw-items-center tw-justify-between">
                        <div>
                            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Require Acknowledgment
                            </label>
                            <p className="tw-text-xs tw-text-gray-400">
                                Recipients must acknowledge the notification
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={!!policyData.requireAcknowledgment}
                            onChange={(e) => onPolicyChange('requireAcknowledgment', e.target.checked)}
                            className="tw-h-4 tw-w-4 tw-cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Right: Rate Limits */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-gauge-high tw-mr-2 tw-text-orange-500" />
                    Rate Limiting & Timing
                </h4>
                <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                    Control how often notifications are sent for this expression
                </p>

                <div className="tw-space-y-3">
                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Cooldown (minutes, 0 = off)
                        </label>
                        <p className="tw-text-xs tw-text-gray-400 tw-mb-1">
                            Minimum gap between triggers per scope. Tank A and Tank B each have their own independent timer.
                        </p>
                        <NumberBox
                            value={formData.cooldownMinutes}
                            onValueChanged={(e) => onFieldChange('cooldownMinutes', e.value)}
                            min={0}
                            max={10080}
                            showSpinButtons={true}
                            width="100%"
                        />
                    </div>

                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Max per Hour per Scope (0 = unlimited)
                        </label>
                        <p className="tw-text-xs tw-text-gray-400 tw-mb-1">
                            Hourly cap per tank/site. “tank:1” has its own budget — won’t block “tank:2” from also triggering.
                        </p>
                        <NumberBox
                            value={formData.maxNotificationsPerHour}
                            onValueChanged={(e) => onFieldChange('maxNotificationsPerHour', e.value)}
                            min={0}
                            max={100}
                            showSpinButtons={true}
                            width="100%"
                        />
                    </div>

                    <div>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Max per Day per Scope (0 = unlimited)
                        </label>
                        <p className="tw-text-xs tw-text-gray-400 tw-mb-1">
                            Daily cap per tank/site scope.
                        </p>
                        <NumberBox
                            value={formData.maxNotificationsPerDay}
                            onValueChanged={(e) => onFieldChange('maxNotificationsPerDay', e.value)}
                            min={0}
                            max={1000}
                            showSpinButtons={true}
                            width="100%"
                        />
                    </div>

                    <div className="tw-border-t tw-border-gray-100 tw-pt-3">
                        <p className="tw-text-xs tw-text-gray-400 tw-mb-1 tw-font-medium tw-text-gray-500">
                            Policy-level channel throttle
                        </p>
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            Max per Hour (delivery pipeline)
                        </label>
                        <p className="tw-text-xs tw-text-gray-400 tw-mb-1">
                            Hard cap on notification delivery across all channels for this policy.
                        </p>
                        <NumberBox
                            value={policyData.maxNotificationsPerHour}
                            onValueChanged={(e) => onPolicyChange('maxNotificationsPerHour', e.value)}
                            min={0}
                            max={100}
                            showSpinButtons={true}
                            width="100%"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepDelivery;
