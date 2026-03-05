/**
 * File: IssueDetailPopups.js
 * Purpose: All popup dialogs for the Issue Detail page (complete, close, print, completion-with-actions, reassign)
 * Dependencies: React, IssueActionPopup, IssuePrintPopup, IssueCompletionPopup, IssueReassignPopup
 * Last Modified: 2026-02-23
 */
import React from 'react';
import IssueActionPopup from '../components/IssueActionPopup';
import IssuePrintPopup from '../components/IssuePrintPopup';
import IssueCompletionPopup from '../components/IssueCompletionPopup';
import IssueReassignPopup from '../components/IssueReassignPopup';

const IssueDetailPopups = ({
  issue, displayIssue,
  // Complete
  showCompletePopup, setShowCompletePopup, handleQuickMarkComplete, isSaving,
  // Close
  showClosePopup, setShowClosePopup, handleCloseIssue, isClosing,
  // Print
  showPrintPopup, setShowPrintPopup,
  // Completion with actions
  showCompletionWithActionsPopup, setShowCompletionWithActionsPopup,
  handleCompletionWithActionsSuccess, vehicles,
  // Reassign
  showReassignPopup, setShowReassignPopup, handleReassignSuccess, users
}) => {
  return (
    <>
      <IssueActionPopup
        visible={showCompletePopup}
        onHide={() => setShowCompletePopup(false)}
        onConfirm={handleQuickMarkComplete}
        title="Mark Issue as Complete"
        subtitle="This will update the status and notify the issue opener."
        confirmText="Mark Complete"
        confirmIcon="fa-light fa-circle-check"
        confirmType="success"
        placeholder="Enter completion notes…"
        isProcessing={isSaving}
        icon="fa-light fa-circle-check"
        iconColor="tw-text-green-600"
        asPanel={true}
        panelWidth={1000}
      />
      <IssueActionPopup
        visible={showClosePopup}
        onHide={() => setShowClosePopup(false)}
        onConfirm={handleCloseIssue}
        title="Close Issue"
        subtitle="Add closing notes before marking this issue as closed."
        confirmText="Close Issue"
        confirmIcon="fa-light fa-lock"
        confirmType="default"
        placeholder="Enter closing / approval notes…"
        isProcessing={isClosing}
        icon="fa-light fa-lock"
        iconColor="tw-text-amber-600"
      />
      <IssuePrintPopup
        visible={showPrintPopup}
        onHide={() => setShowPrintPopup(false)}
        issue={{
          id: issue.id,
          title: displayIssue?.problemTitle || issue.problemTitle,
          description: displayIssue?.problemDescription || issue.problemDescription,
          status: issue.statusName || `Status ${issue.status}`,
          priority: issue.priorityName || `Priority ${issue.priority}`,
          assigneeName: issue.assignToUserName,
          openerName: issue.openbyUserName,
          dueDate: issue.dueDate,
          createdAt: issue.openDate,
          templateName: issue.templateName,
          vehicleHyoungNumber: issue.vehicleHyoungNo || issue.vehicleNumber
        }}
      />
      <IssueCompletionPopup
        visible={showCompletionWithActionsPopup}
        onHide={() => setShowCompletionWithActionsPopup(false)}
        onComplete={handleCompletionWithActionsSuccess}
        issueId={issue.id}
        issueTemplateId={issue.issueTemplateId}
        isProcessing={isSaving}
        vehicles={vehicles}
      />
      <IssueReassignPopup
        visible={showReassignPopup}
        onHide={() => setShowReassignPopup(false)}
        onReassigned={handleReassignSuccess}
        issueId={issue.id}
        currentAssigneeId={issue.assignTo}
        users={users}
        isProcessing={isSaving}
      />
    </>
  );
};

export default IssueDetailPopups;
