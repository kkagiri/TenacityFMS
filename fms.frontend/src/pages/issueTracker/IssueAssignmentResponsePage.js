/**
 * File: IssueAssignmentResponsePage.js
 * Purpose: Allow assigned worker to confirm work or schedule a working date for an issue
 * Dependencies: React, react-router-dom, issueTrackerService
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueAssignmentResponsePage: Responds to assignment links from email notifications
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../services/issueTrackerService';

const IssueAssignmentResponsePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialAction = searchParams.get('action') === 'schedule' ? 'schedule' : 'confirm';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState(null);
  const [actionMode, setActionMode] = useState(initialAction);
  const [scheduledDate, setScheduledDate] = useState('');
  const [note, setNote] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  useEffect(() => {
    const loadIssue = async () => {
      try {
        setLoading(true);
        const issueData = await issueTrackerService.getIssueById(id);
        setIssue(issueData);
      } catch (error) {
        notify({
          message: 'Unable to load issue details from assignment link.',
          type: 'error',
          displayTime: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    loadIssue();
  }, [id]);

  const dueDateMax = useMemo(() => {
    if (!issue?.dueDate) {
      return undefined;
    }

    if (typeof issue.dueDate === 'string' && issue.dueDate.length >= 10) {
      return issue.dueDate.slice(0, 10);
    }

    const dueDate = new Date(issue.dueDate);
    return Number.isNaN(dueDate.getTime()) ? undefined : dueDate.toISOString().split('T')[0];
  }, [issue]);

  const handleSubmit = async () => {
    if (actionMode === 'schedule' && !scheduledDate) {
      notify({
        message: 'Please select a scheduled date.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        action: actionMode,
        scheduledDate: actionMode === 'schedule' ? scheduledDate : null,
        note: note || null
      };

      const response = await issueTrackerService.respondToIssueAssignment(id, payload);
      setSubmittedMessage(response?.message || 'Assignment response submitted successfully.');
    } catch (error) {
      // Error notification handled by service
      console.error('Failed to submit assignment response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-600">Loading issue...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="tw-max-w-2xl tw-mx-auto tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mt-6">
        <h2 className="tw-text-xl tw-font-semibold tw-text-red-600 tw-mb-2">Issue not found</h2>
        <p className="tw-text-gray-600 tw-mb-4">The assignment link is invalid or the issue no longer exists.</p>
        <button
          type="button"
          className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded"
          onClick={() => navigate('/issue-tracker')}
        >
          Back to Issue Tracker
        </button>
      </div>
    );
  }

  return (
    <div className="tw-max-w-3xl tw-mx-auto tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mt-6">
      <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-1">Issue Assignment Response</h1>
      <p className="tw-text-gray-600 tw-mb-6">Confirm that you are working on this issue or schedule a working date.</p>

      <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded tw-p-4 tw-mb-5">
        <p className="tw-text-sm tw-text-gray-600">Issue #{issue.id}</p>
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">{issue.problemTitle}</h2>
        <p className="tw-text-sm tw-text-gray-700 tw-mt-1">{issue.problemDescription}</p>
        <div className="tw-text-sm tw-text-gray-600 tw-mt-3">
          <p>Assigned To: <strong>{issue.assignToUserName || 'Unknown'}</strong></p>
          <p>Due Date: <strong>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'Not set'}</strong></p>
          <p>Status: <strong>{issue.statusName || issue.status || 'Unknown'}</strong></p>
        </div>
      </div>

      {submittedMessage ? (
        <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-4">
          <p className="tw-text-green-700 tw-font-medium">{submittedMessage}</p>
          <div className="tw-flex tw-gap-2 tw-mt-3">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded"
              onClick={() => navigate(`/issue-tracker/details/${issue.id}`)}
            >
              Open Issue
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-gray-700"
              onClick={() => navigate('/issue-tracker')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="tw-space-y-4">
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3">
            <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
              <input
                type="radio"
                name="issue-assignment-action"
                value="confirm"
                checked={actionMode === 'confirm'}
                onChange={() => setActionMode('confirm')}
              />
              I confirm I am working on this issue
            </label>

            <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
              <input
                type="radio"
                name="issue-assignment-action"
                value="schedule"
                checked={actionMode === 'schedule'}
                onChange={() => setActionMode('schedule')}
              />
              I want to schedule my working date
            </label>
          </div>

          {actionMode === 'schedule' && (
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Scheduled Working Date
              </label>
              <input
                type="date"
                className="tw-w-full md:tw-w-64 tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                value={scheduledDate}
                max={dueDateMax}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
              {dueDateMax && (
                <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                  Must be on or before due date ({new Date(issue.dueDate).toLocaleDateString()})
                </p>
              )}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Note (Optional)
            </label>
            <textarea
              rows={3}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Add any note for this response..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="tw-flex tw-gap-2">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded hover:tw-bg-orange-700 disabled:tw-opacity-60"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-gray-700"
              onClick={() => navigate(`/issue-tracker/details/${issue.id}`)}
              disabled={submitting}
            >
              Open Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueAssignmentResponsePage;
