/**
 * File: IssueAssignmentResponsePage.js
 * Purpose: Allow assigned worker to respond to an issue assignment:
 *   1. Mark as Ongoing (I'm working on it)
 *   2. Reschedule / extend deadline (suppresses re-triggering until deadline)
 *   3. Change vehicle status (ParkedYard/Workshop suppresses GPS offline alerts)
 * Dependencies: React, react-router-dom, issueTrackerService
 * Last Modified: 2026-02-16
 *
 * Key Functions/Components:
 * - IssueAssignmentResponsePage: Full response form for assignment links from email/mobile
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../services/issueTrackerService';

/** Vehicle status enum matching backend VehicleStatus */
const VEHICLE_STATUS = [
  { value: 0, key: 'Working', label: 'Working', icon: 'fa-light fa-truck-moving', color: 'green', description: 'Actively in use — GPS alerts enabled' },
  { value: 1, key: 'ParkedYard', label: 'Parked Yard', icon: 'fa-light fa-square-parking', color: 'blue', description: 'Parked in yard — GPS alerts paused' },
  { value: 2, key: 'Workshop', label: 'Workshop', icon: 'fa-light fa-wrench', color: 'orange', description: 'In workshop — GPS alerts paused' },
];

/** Get today as YYYY-MM-DD string */
const todayStr = () => new Date().toISOString().split('T')[0];

const IssueAssignmentResponsePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [issue, setIssue] = useState(null);
  const [note, setNote] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  // Vehicle status — null means "don't change"
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [initialVehicleStatus, setInitialVehicleStatus] = useState(null);

  // Deadline — empty means "don't change"
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    const loadIssue = async () => {
      try {
        setLoading(true);
        const issueData = await issueTrackerService.getIssueById(id);
        setIssue(issueData);

        // Pre-populate vehicle status from issue response
        if (issueData?.vehicleStatusValue !== undefined && issueData?.vehicleStatusValue !== null) {
          setVehicleStatus(issueData.vehicleStatusValue);
          setInitialVehicleStatus(issueData.vehicleStatusValue);
        }

        // Pre-fill due date if already set
        if (issueData?.dueDate) {
          const d = typeof issueData.dueDate === 'string'
            ? issueData.dueDate.slice(0, 10)
            : new Date(issueData.dueDate).toISOString().split('T')[0];
          setNewDueDate(d);
        }
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

  const vehicleStatusChanged = useMemo(() => {
    return vehicleStatus !== null && vehicleStatus !== initialVehicleStatus;
  }, [vehicleStatus, initialVehicleStatus]);

  const dueDateChanged = useMemo(() => {
    if (!newDueDate) return false;
    if (!issue?.dueDate) return true;
    const existing = typeof issue.dueDate === 'string'
      ? issue.dueDate.slice(0, 10)
      : new Date(issue.dueDate).toISOString().split('T')[0];
    return newDueDate !== existing;
  }, [newDueDate, issue]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const payload = {
        action: 'confirm',
        note: note || null,
        vehicleStatusChange: vehicleStatusChanged ? vehicleStatus : null,
        newDueDate: dueDateChanged ? newDueDate : null,
      };

      const response = await issueTrackerService.respondToIssueAssignment(id, payload);
      setSubmittedMessage(response?.message || 'Assignment response submitted successfully.');
    } catch (error) {
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

  const currentStatusInfo = VEHICLE_STATUS.find(s => s.value === initialVehicleStatus);

  return (
    <div className="tw-max-w-3xl tw-mx-auto tw-bg-white tw-rounded-xl tw-shadow tw-mt-6 tw-mb-10">
      {/* Header */}
      <div className="tw-px-6 tw-py-5 tw-border-b tw-bg-gradient-to-r tw-from-blue-50 tw-to-white tw-rounded-t-xl">
        <h1 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-clipboard-check tw-text-blue-600"></i>
          Issue Assignment Response
        </h1>
        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
          Respond to your assigned issue. You can change the vehicle status, reschedule the deadline, and confirm you are working on it.
        </p>
      </div>

      {/* Issue Details Card */}
      <div className="tw-px-6 tw-pt-5">
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-justify-between tw-mb-2">
            <p className="tw-text-xs tw-text-gray-400 tw-font-mono">Issue #{issue.id}</p>
            <span className={`tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium ${
              issue.statusName === 'Open' ? 'tw-bg-blue-100 tw-text-blue-700' :
              issue.statusName === 'In Progress' ? 'tw-bg-yellow-100 tw-text-yellow-700' :
              'tw-bg-gray-100 tw-text-gray-600'
            }`}>
              {issue.statusName || issue.status || 'Unknown'}
            </span>
          </div>
          <h2 className="tw-text-base tw-font-semibold tw-text-gray-900 tw-mb-1">{issue.problemTitle}</h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-3 tw-line-clamp-3">{issue.problemDescription}</p>

          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3 tw-text-xs tw-text-gray-500">
            <div>
              <span className="tw-block tw-text-gray-400">Assigned To</span>
              <strong className="tw-text-gray-700">{issue.assignToUserName || 'Unknown'}</strong>
            </div>
            <div>
              <span className="tw-block tw-text-gray-400">Due Date</span>
              <strong className="tw-text-gray-700">{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'Not set'}</strong>
            </div>
            <div>
              <span className="tw-block tw-text-gray-400">Vehicle</span>
              <strong className="tw-text-gray-700">{issue.vehicleHyoungNo || issue.vehicleNumber || '—'}</strong>
            </div>
            <div>
              <span className="tw-block tw-text-gray-400">Vehicle Status</span>
              <strong className="tw-text-gray-700">{currentStatusInfo?.label || 'Unknown'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Success state */}
      {submittedMessage ? (
        <div className="tw-px-6 tw-py-5">
          <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-5">
            <div className="tw-flex tw-items-start tw-gap-3">
              <i className="fa-light fa-circle-check tw-text-green-500 tw-text-xl tw-mt-0.5"></i>
              <div>
                <p className="tw-text-green-800 tw-font-medium tw-mb-1">Response Submitted</p>
                <p className="tw-text-sm tw-text-green-700">{submittedMessage}</p>
              </div>
            </div>
            <div className="tw-flex tw-gap-2 tw-mt-4">
              <button
                type="button"
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded tw-text-sm hover:tw-bg-blue-700"
                onClick={() => navigate(`/issue-tracker/details/${issue.id}`)}
              >
                <i className="fa-light fa-arrow-up-right-from-square tw-mr-1.5"></i>
                Open Issue
              </button>
              <button
                type="button"
                className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-sm tw-text-gray-700 hover:tw-bg-gray-50"
                onClick={() => navigate('/issue-tracker')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="tw-px-6 tw-py-5 tw-space-y-5">

          {/* ===== 1. Vehicle Status ===== */}
          <div>
            <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-car tw-mr-1.5 tw-text-gray-400"></i>
              Vehicle Status
            </label>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {VEHICLE_STATUS.map(status => {
                const isSelected = vehicleStatus === status.value;

                return (
                  <button
                    key={status.value}
                    type="button"
                    className={[
                      'tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2.5 tw-rounded-lg tw-border tw-text-sm tw-cursor-pointer tw-transition-all tw-select-none',
                      isSelected
                        ? 'tw-border-blue-500 tw-bg-blue-50 tw-text-blue-700 tw-ring-1 tw-ring-blue-200'
                        : 'tw-border-gray-200 tw-bg-white tw-text-gray-600 hover:tw-border-gray-300 hover:tw-bg-gray-50',
                    ].join(' ')}
                    onClick={() => setVehicleStatus(status.value)}
                  >
                    <i className={status.icon}></i>
                    <span className="tw-font-medium">{status.label}</span>
                    {isSelected && <i className="fa-light fa-check tw-ml-1"></i>}
                  </button>
                );
              })}
            </div>
            {vehicleStatusChanged && (
              <p className="tw-text-xs tw-mt-1.5 tw-text-amber-600">
                <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
                {vehicleStatus === 1 || vehicleStatus === 2
                  ? 'GPS offline alerts will be paused for this vehicle while in this status.'
                  : 'GPS offline alerts will resume for this vehicle.'}
              </p>
            )}
            {!vehicleStatusChanged && (
              <p className="tw-text-xs tw-mt-1.5 tw-text-gray-400">
                Parked Yard or Workshop status pauses GPS offline monitoring for this vehicle.
              </p>
            )}
          </div>

          {/* ===== 2. Reschedule Deadline ===== */}
          <div>
            <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-calendar-clock tw-mr-1.5 tw-text-gray-400"></i>
              Deadline
            </label>
            <input
              type="date"
              className="tw-w-full md:tw-w-64 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-400 tw-outline-none"
              value={newDueDate}
              min={todayStr()}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            {dueDateChanged && (
              <p className="tw-text-xs tw-mt-1.5 tw-text-blue-600">
                <i className="fa-light fa-shield-check tw-mr-1"></i>
                No new alerts will be created for this vehicle until <strong>{new Date(newDueDate + 'T00:00:00').toLocaleDateString()}</strong>.
              </p>
            )}
            {!dueDateChanged && (
              <p className="tw-text-xs tw-mt-1.5 tw-text-gray-400">
                Set or extend the deadline. While the deadline is in the future, duplicate alerts for this vehicle are suppressed.
              </p>
            )}
          </div>

          {/* ===== 3. Note ===== */}
          <div>
            <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
              <i className="fa-light fa-message-lines tw-mr-1.5 tw-text-gray-400"></i>
              Note
              <span className="tw-font-normal tw-text-gray-400 tw-ml-1">(Optional)</span>
            </label>
            <textarea
              rows={3}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-400 tw-outline-none tw-resize-y"
              placeholder="Add a note about what you're doing, estimated timeline, etc."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* ===== Action buttons ===== */}
          <div className="tw-flex tw-flex-wrap tw-gap-2 tw-pt-2 tw-border-t tw-border-gray-100">
            <button
              type="button"
              className="tw-px-5 tw-py-2.5 tw-bg-blue-600 tw-text-white tw-rounded-lg tw-text-sm tw-font-medium hover:tw-bg-blue-700 disabled:tw-opacity-60 tw-transition-colors tw-flex tw-items-center tw-gap-2"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fa-light fa-spinner-third fa-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fa-light fa-paper-plane"></i>
                  Submit Response
                </>
              )}
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2.5 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm tw-text-gray-700 hover:tw-bg-gray-50 tw-transition-colors tw-flex tw-items-center tw-gap-2"
              onClick={() => navigate(`/issue-tracker/details/${issue.id}`)}
              disabled={submitting}
            >
              <i className="fa-light fa-arrow-up-right-from-square"></i>
              Open Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueAssignmentResponsePage;
