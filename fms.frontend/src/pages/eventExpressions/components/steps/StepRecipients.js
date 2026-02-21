/**
 * File: StepRecipients.js
 * Purpose: Step 5 of Event Expression form — Recipients (users/roles) selection.
 *          These fields become part of the linked NotificationPolicy.
 *          Message templates have been moved to StepMessageTemplate (Step 6).
 * Dependencies: devextreme-react TagBox
 * Last Modified: 2026-02-19
 *
 * Key Props:
 * - selectedUserIds / onUserIdsChange: user recipient state
 * - selectedRoleIds / onRoleIdsChange: role recipient state
 * - users: available users list
 * - roles: available roles list
 * - loadingData: whether user/role data is loading
 */

import React from 'react';
import { TagBox } from 'devextreme-react/tag-box';

const StepRecipients = ({
    selectedUserIds,
    onUserIdsChange,
    selectedRoleIds,
    onRoleIdsChange,
    users,
    roles,
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

            {/* Right: Helpful info */}
            <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
                    <i className="fa-light fa-circle-info tw-mr-2 tw-text-blue-500" />
                    Recipient Configuration
                </h4>
                <div className="tw-bg-blue-50 tw-rounded-lg tw-p-3">
                    <ul className="tw-text-xs tw-text-blue-700 tw-space-y-2">
                        <li>
                            <i className="fa-light fa-user tw-mr-1" />
                            <strong>Users</strong> — Individual users who will receive notifications directly.
                        </li>
                        <li>
                            <i className="fa-light fa-shield tw-mr-1" />
                            <strong>Roles</strong> — All users assigned to the selected roles will automatically receive notifications.
                        </li>
                        <li>
                            <i className="fa-light fa-arrow-right tw-mr-1" />
                            Configure <strong>message templates</strong> in the next step (Step 6).
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StepRecipients;
