/**
 * File: StepRecipients.js
 * Purpose: Step 4 of Event Expression form — Recipients (users/roles) and
 *          message templates. These fields become part of the linked NotificationPolicy.
 * Dependencies: devextreme-react TagBox/TextArea, notificationsApi for user/role search
 * Last Modified: 2026-02-14
 *
 * Key Props:
 * - selectedUserIds / onUserIdsChange: user recipient state
 * - selectedRoleIds / onRoleIdsChange: role recipient state
 * - users: available users list
 * - roles: available roles list
 * - policyData: policy state (titleTemplate, messageTemplate)
 * - onPolicyChange(field, value): updates a policy field
 * - formData: expression-level messageTemplate override
 * - onFieldChange: expression field updater
 */

import React from 'react';
import { TagBox } from 'devextreme-react/tag-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';

const PLACEHOLDERS = [
    'alarmType', 'severity', 'priority', 'siteName',
    'tankId', 'siteId', 'timestamp', 'TankName',
    'ActualValue', 'ThresholdValue'
];

const StepRecipients = ({
    selectedUserIds,
    onUserIdsChange,
    selectedRoleIds,
    onRoleIdsChange,
    users,
    roles,
    policyData,
    onPolicyChange,
    formData,
    onFieldChange,
    loadingData
}) => {
    return (
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6">
            {/* Left: Recipients */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-users tw-mr-2 tw-text-indigo-500" />
                    Who Gets Notified
                </h4>

                <div className="tw-mb-4">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        <i className="fa-light fa-user tw-mr-1" /> Users
                    </label>
                    <TagBox
                        items={users}
                        displayExpr="text"
                        valueExpr="value"
                        value={selectedUserIds}
                        onValueChanged={(e) => onUserIdsChange(e.value || [])}
                        searchEnabled={true}
                        showSelectionControls={true}
                        placeholder="Search and select users..."
                        multiline={false}
                        width="100%"
                        noDataText={loadingData ? 'Loading users...' : 'No users found'}
                    />
                    <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                        {selectedUserIds.length} user(s) selected
                    </p>
                </div>

                <div className="tw-mb-3">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        <i className="fa-light fa-shield tw-mr-1" /> Roles
                    </label>
                    <TagBox
                        items={roles}
                        displayExpr="text"
                        valueExpr="value"
                        value={selectedRoleIds}
                        onValueChanged={(e) => onRoleIdsChange(e.value || [])}
                        searchEnabled={true}
                        showSelectionControls={true}
                        placeholder="Search and select roles..."
                        multiline={false}
                        width="100%"
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
                            No recipients selected. Notifications won't be delivered until recipients are configured.
                        </p>
                    </div>
                )}
            </div>

            {/* Right: Templates */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-file-lines tw-mr-2 tw-text-teal-500" />
                    Message Templates
                </h4>

                <div className="tw-mb-3">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Title Template
                    </label>
                    <TextBox
                        value={policyData.titleTemplate}
                        onValueChanged={(e) => onPolicyChange('titleTemplate', e.value)}
                        placeholder="e.g., Alert: {{alarmType}} - {{severity}}"
                        width="100%"
                    />
                </div>

                <div className="tw-mb-3">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Message Template
                    </label>
                    <TextArea
                        value={formData.messageTemplate}
                        onValueChanged={(e) => onFieldChange('messageTemplate', e.value)}
                        placeholder="e.g., Tank {TankName} volume is {ActualValue}L (threshold: {ThresholdValue}L)"
                        height={80}
                        width="100%"
                    />
                </div>

                <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3">
                    <h5 className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-2">Available Placeholders</h5>
                    <div className="tw-flex tw-flex-wrap tw-gap-1">
                        {PLACEHOLDERS.map((ph) => (
                            <span
                                key={ph}
                                className="tw-inline-block tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-px-2 tw-py-0.5 tw-text-xs tw-text-gray-600 tw-font-mono"
                            >
                                {`{{${ph}}}`}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepRecipients;
