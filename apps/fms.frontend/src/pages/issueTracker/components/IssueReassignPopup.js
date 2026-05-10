/**
 * File: IssueReassignPopup.js
 * Purpose: Popup for reassigning an issue to a different user.
 *          Shows a searchable user dropdown and optional notes.
 *          Sends notification ONLY to the new assignee.
 * Dependencies: React, DevExtreme (Popup, Button, SelectBox, TextArea, LoadIndicator),
 *               issueTrackerV2Service
 * Last Modified: 2026-02-21
 *
 * Key Components:
 * - IssueReassignPopup: Modal with user picker, notes field, and submit/cancel buttons.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Popup from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import SelectBox from 'devextreme-react/select-box';
import TextArea from 'devextreme-react/text-area';
import LoadIndicator from 'devextreme-react/load-indicator';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {Function} props.onHide
 * @param {Function} props.onReassigned - Called after successful reassignment
 * @param {number} props.issueId
 * @param {string|null} props.currentAssigneeId - Current assignee user ID (to exclude from list)
 * @param {Array} props.users - All available users [{ id, userName, email, ... }]
 * @param {boolean} [props.isProcessing]
 */
const IssueReassignPopup = ({
    visible,
    onHide,
    onReassigned,
    issueId,
    currentAssigneeId = null,
    users = [],
    isProcessing: externalProcessing = false
}) => {
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isProcessing = externalProcessing || isSubmitting;

    // Reset form when popup opens
    useEffect(() => {
        if (visible) {
            setSelectedUserId(null);
            setNotes('');
        }
    }, [visible]);

    // Build user data source excluding current assignee
    const userDataSource = useMemo(() => {
        return users
            .filter(u => {
                const uid = u.id || u.userId;
                return uid !== currentAssigneeId;
            })
            .map(u => ({
                id: u.id || u.userId,
                userName: u.userName || u.username || '',
                email: u.email || '',
                displayName: `${u.userName || u.username || 'Unknown'}${u.email ? ` (${u.email})` : ''}`
            }));
    }, [users, currentAssigneeId]);

    const selectedUser = useMemo(
        () => userDataSource.find(u => u.id === selectedUserId),
        [userDataSource, selectedUserId]
    );

    const canSubmit = !isProcessing && selectedUserId;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            setIsSubmitting(true);
            const reassignData = {
                newAssigneeUserId: selectedUserId,
                newAssigneeUserName: selectedUser?.userName || null,
                notes: notes.trim() || null
            };

            await issueTrackerV2Service.reassignIssue(issueId, reassignData);
            if (onReassigned) onReassigned();
        } catch (error) {
            console.error('Error reassigning issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = useCallback(() => {
        if (!isProcessing && onHide) {
            onHide();
        }
    }, [isProcessing, onHide]);

    return (
        <Popup
            visible={visible}
            onHiding={handleCancel}
            dragEnabled={false}
            showCloseButton={!isProcessing}
            showTitle={false}
            width={520}
            height="auto"
            maxHeight="80vh"
            shading={true}
            shadingColor="rgba(0,0,0,0.4)"
            wrapperAttr={{ class: 'issue-reassign-popup' }}
        >
            <div className="tw-p-6">
                {/* Header */}
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-5">
                    <div className="tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-blue-100 tw-text-blue-600">
                        <i className="fa-light fa-user-pen tw-text-lg"></i>
                    </div>
                    <div>
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-leading-tight">
                            Reassign Issue
                        </h3>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-0.5">
                            Select a new assignee. They will receive a notification.
                        </p>
                    </div>
                </div>

                {/* User Selection */}
                <div className="tw-mb-4">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        New Assignee <span className="tw-text-red-500">*</span>
                    </label>
                    <SelectBox
                        dataSource={userDataSource}
                        value={selectedUserId}
                        onValueChanged={(e) => setSelectedUserId(e.value)}
                        valueExpr="id"
                        displayExpr="displayName"
                        searchEnabled={true}
                        searchExpr={['userName', 'email', 'displayName']}
                        placeholder="Search and select a user..."
                        showClearButton={true}
                        disabled={isProcessing}
                        stylingMode="outlined"
                        noDataText="No users available"
                    />
                </div>

                {/* Notes */}
                <div className="tw-mb-5">
                    <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                        Reassignment Notes
                    </label>
                    <TextArea
                        value={notes}
                        onValueChanged={(e) => setNotes(e.value)}
                        placeholder="Why is this being reassigned? (optional)"
                        height={80}
                        maxLength={2000}
                        disabled={isProcessing}
                        stylingMode="outlined"
                    />
                </div>

                {/* Footer */}
                <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-4 tw-border-t">
                    <Button
                        text="Cancel"
                        stylingMode="outlined"
                        type="default"
                        onClick={handleCancel}
                        disabled={isProcessing}
                    />
                    <Button
                        text={isProcessing ? 'Reassigning...' : 'Reassign'}
                        icon="fa-light fa-user-pen"
                        type="default"
                        stylingMode="contained"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {isProcessing && <LoadIndicator visible={true} height={16} width={16} />}
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default IssueReassignPopup;
