/**
 * File: IssueCreateForm.js
 * Purpose: Guided issue creation form with backend save and redirect to details on success
 * Dependencies: React, Redux, Router, DevExtreme notify, createIssue action, IssueCreateForm.scss
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - IssueCreateForm: Captures issue creation data in the requested UX flow
 * - handleTemplateSelected: Pre-fills issue fields from selected template
 * - handleSubmit: Saves issue and navigates to details when backend confirms success
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import VehicleSearchableSelector from '../../../components/selectors/VehicleSearchableSelector';
import DeviceTypeDropdown from '../components/DeviceTypeDropdown';
import IssueTemplateDropdown from '../components/IssueTemplateDropdown';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import {
  createIssue,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import './IssueCreateForm.scss';

const createInitialFormState = (openByUserName, openStatus) => ({
  deviceTypeId: null,
  deviceType: null,
  issueTemplateId: null,
  issueTemplate: null,
  issueCategoryId: null,
  siteId: null,
  vehicleId: null,
  assignTo: '',
  openBy: openByUserName || 'System',
  statusId: openStatus?.id ?? null,
  statusName: openStatus?.status || openStatus?.name || 'Open',
  openDate: new Date(),
  dueDate: '',
  timelineNotes: '',
  priorityId: null,
  canAutoClose: false,
  issueTitle: '',
  issueDescription: '',
  attachments: []
});

const normalizeCollection = (source) => {
  if (Array.isArray(source)) {
    return source;
  }

  if (Array.isArray(source?.data)) {
    return source.data;
  }

  return [];
};

const getUserName = (user) => user?.userName || user?.username || user?.UserName || '';
const getUserEmail = (user) => user?.email || user?.Email || '';
const resolveIssueId = (response) => {
  if (typeof response === 'number' && Number.isFinite(response)) {
    return response;
  }

  if (typeof response === 'string' && response.trim() && !Number.isNaN(Number(response))) {
    return Number(response);
  }

  if (!response || typeof response !== 'object') {
    return null;
  }

  return (
    resolveIssueId(response.id) ||
    resolveIssueId(response.Id) ||
    resolveIssueId(response.issueId) ||
    resolveIssueId(response.IssueId) ||
    resolveIssueId(response.data) ||
    resolveIssueId(response.Data)
  );
};

const IssueCreateForm = ({ onSubmit = null }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);
  const usersState = useSelector((state) => state.user?.users);
  const sitesState = useSelector((state) => state.site?.sites);
  const categoriesState = useSelector((state) => state.issueTracker?.categories);
  const prioritiesState = useSelector((state) => state.issueTracker?.priorities);
  const statusesState = useSelector((state) => state.issueTracker?.statuses);

  const users = useMemo(() => normalizeCollection(usersState), [usersState]);
  const sites = useMemo(() => normalizeCollection(sitesState), [sitesState]);
  const categories = useMemo(() => normalizeCollection(categoriesState), [categoriesState]);
  const priorities = useMemo(() => normalizeCollection(prioritiesState), [prioritiesState]);
  const statuses = useMemo(() => normalizeCollection(statusesState), [statusesState]);

  const loggedInUserName = useMemo(() => (
    authUser?.userName ||
    authUser?.username ||
    authUser?.UserName ||
    authUser?.name ||
    authUser?.Name ||
    'System'
  ), [authUser]);

  const openStatus = useMemo(() => {
    const exactOpenStatus = statuses.find((item) => {
      const label = String(item?.status || item?.name || '').trim().toLowerCase();
      return label === 'open';
    });

    if (exactOpenStatus) {
      return exactOpenStatus;
    }

    return statuses.find((item) => {
      const label = String(item?.status || item?.name || '').trim().toLowerCase();
      return label.includes('open');
    }) || null;
  }, [statuses]);

  const [formData, setFormData] = useState(() => createInitialFormState(loggedInUserName, openStatus));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      dispatch(fetchUsers()),
      dispatch(fetchSiteList()),
      dispatch(fetchIssueCategories()),
      dispatch(fetchIssueStatuses()),
      dispatch(fetchIssuePriorities())
    ]);
  }, [dispatch]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      openBy: loggedInUserName || 'System'
    }));
  }, [loggedInUserName]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      statusId: openStatus?.id ?? null,
      statusName: openStatus?.status || openStatus?.name || 'Open'
    }));
  }, [openStatus]);

  useEffect(() => {
    if (!formData.issueCategoryId && categories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        issueCategoryId: categories[0].id
      }));
    }
  }, [categories, formData.issueCategoryId]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeviceTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      deviceTypeId: e?.value ?? null,
      deviceType: e?.deviceType ?? null,
      issueTemplateId: null,
      issueTemplate: null,
      priorityId: null,
      canAutoClose: false
    }));
  };

  const handleTemplateSelected = (template) => {
    if (!template) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      issueTemplateId: template.id,
      issueTemplate: template,
      issueTitle: prev.issueTitle || template.titleTemplate || '',
      issueDescription: prev.issueDescription || template.descriptionTemplate || '',
      priorityId: prev.priorityId || template.defaultPriorityId || null,
      canAutoClose: Boolean(template.autoCloseEnabled)
    }));
  };

  const handleAttachmentsChanged = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: selectedFiles
    }));
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, fileIndex) => fileIndex !== indexToRemove)
    }));
  };

  const handleReset = () => {
    setFormData(createInitialFormState(loggedInUserName, openStatus));
  };

  const titleLength = useMemo(() => formData.issueTitle.trim().length, [formData.issueTitle]);
  const descriptionLength = useMemo(() => formData.issueDescription.trim().length, [formData.issueDescription]);

  const validationState = useMemo(() => ({
    hasDeviceType: Boolean(formData.deviceTypeId),
    hasTemplate: Boolean(formData.issueTemplateId),
    hasTitle: titleLength >= 5,
    hasDescription: descriptionLength >= 15,
    hasLocation: Boolean(formData.siteId),
    hasVehicle: Boolean(formData.vehicleId),
    hasAssignedTo: Boolean(formData.assignTo),
    hasStatus: Boolean(formData.statusId)
  }), [descriptionLength, formData.assignTo, formData.deviceTypeId, formData.issueTemplateId, formData.siteId, formData.statusId, formData.vehicleId, titleLength]);

  const isReadyToSubmit = (
    validationState.hasDeviceType &&
    validationState.hasTemplate &&
    validationState.hasTitle &&
    validationState.hasDescription &&
    validationState.hasLocation &&
    validationState.hasVehicle &&
    validationState.hasAssignedTo &&
    validationState.hasStatus
  );

  const openDateDisplay = useMemo(() => (
    formData.openDate instanceof Date
      ? formData.openDate.toLocaleString()
      : 'Not available'
  ), [formData.openDate]);

  const attachmentCount = formData.attachments.length;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isReadyToSubmit || isSubmitting) {
      return;
    }

    const payload = {
      IssueCategory: formData.issueCategoryId || categories[0]?.id,
      Site: formData.siteId,
      Openby: formData.openBy || 'System',
      RelatedIssue: null,
      ProblemDescription: formData.issueDescription.trim(),
      ProblemTitle: formData.issueTitle.trim(),
      Status: formData.statusId,
      Priority: formData.priorityId,
      DueDate: formData.dueDate ? new Date(`${formData.dueDate}T00:00:00`).toISOString() : null,
      OpenDate: formData.openDate ? formData.openDate.toISOString() : new Date().toISOString(),
      ClosingDate: null,
      LastModfield: new Date().toISOString(),
      Vehicle: formData.vehicleId,
      Device: null,
      DeviceType: formData.deviceTypeId,
      AssignTo: formData.assignTo
    };

    try {
      setIsSubmitting(true);
      let saveResponse = null;

      if (onSubmit) {
        saveResponse = await Promise.resolve(onSubmit(payload));
      } else {
        saveResponse = await dispatch(createIssue(payload));
      }

      const issueId = resolveIssueId(saveResponse);
      if (!issueId) {
        throw new Error('Issue saved but no issue ID was returned from backend.');
      }

      notify({
        message: 'Issue saved successfully.',
        type: 'success',
        displayTime: 2500
      });
      navigate(`/issue-tracker/details/${issueId}`);
      return;
    } catch (error) {
      notify({
        message: error?.message || 'Failed to save issue.',
        type: 'error',
        displayTime: 3500
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="issue-create-form">
      <form className="issue-create-form__card" onSubmit={handleSubmit}>
        <header className="issue-create-form__header">
          <div>
            <p className="issue-create-form__eyebrow">Issue Tracker</p>
            <h2>Create New Issue</h2>
            <p className="issue-create-form__subtitle">
              Follow the workflow: Device Type - Template - Issue Details - Assigned To - Timeline - Attachments.
            </p>
          </div>
          <span className={`issue-create-form__status-chip ${isReadyToSubmit ? 'is-ready' : 'is-pending'}`}>
            {isReadyToSubmit ? 'Ready to submit' : 'Incomplete'}
          </span>
        </header>

        <div className="issue-create-form__layout">
          <div className="issue-create-form__fields">
            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">1. Select Device Type</h3>
              <DeviceTypeDropdown
                value={formData.deviceTypeId}
                onValueChanged={handleDeviceTypeChange}
                placeholder="Select device type..."
                isRequired={true}
                label="Device Type"
              />
              {!validationState.hasDeviceType && (
                <small className="issue-create-form__helper">Device type is required.</small>
              )}
            </div>

            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">2. Select Issue Template</h3>
              <IssueTemplateDropdown
                value={formData.issueTemplateId}
                deviceTypeId={formData.deviceTypeId}
                priorities={priorities}
                statuses={statuses}
                onValueChanged={(e) => handleFieldChange('issueTemplateId', e?.value ?? null)}
                onTemplateSelected={handleTemplateSelected}
                showClearButton={false}
                isRequired={true}
                placeholder="Select issue template..."
                label="Issue Template"
              />
              {!validationState.hasTemplate && (
                <small className="issue-create-form__helper">Issue template is required.</small>
              )}
            </div>

            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">3. Issue Details</h3>
              <label htmlFor="issueTitle">Issue Title</label>
              <input
                id="issueTitle"
                type="text"
                maxLength={160}
                placeholder="Example: Fuel pump pressure drop on lane 2"
                value={formData.issueTitle}
                onChange={(event) => handleFieldChange('issueTitle', event.target.value)}
              />
              <div className="issue-create-form__meta-row">
                <small className={`issue-create-form__helper ${validationState.hasTitle ? 'is-valid' : ''}`}>
                  Minimum 5 characters
                </small>
                <span>{titleLength}/160</span>
              </div>
            </div>

            <div className="issue-create-form__field">
              <label htmlFor="issueDescription">Description</label>
              <textarea
                id="issueDescription"
                rows={5}
                maxLength={2000}
                placeholder="Share what happened, where it happened, and any immediate impact."
                value={formData.issueDescription}
                onChange={(event) => handleFieldChange('issueDescription', event.target.value)}
              />
              <div className="issue-create-form__meta-row">
                <small className={`issue-create-form__helper ${validationState.hasDescription ? 'is-valid' : ''}`}>
                  Minimum 15 characters
                </small>
                <span>{descriptionLength}/2000</span>
              </div>
            </div>

            <div className="issue-create-form__field">
              <label htmlFor="issueLocation">Location (Site)</label>
              <select
                id="issueLocation"
                value={formData.siteId ?? ''}
                onChange={(event) => handleFieldChange('siteId', event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">Select site...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {!validationState.hasLocation && (
                <small className="issue-create-form__helper">Location is required.</small>
              )}
            </div>

            <div className="issue-create-form__field">
              <label>Vehicle</label>
              <VehicleSearchableSelector
                value={formData.vehicleId}
                onValueChanged={(e) => handleFieldChange('vehicleId', e?.value ?? null)}
                placeholder="Type to search vehicle"
                width="100%"
              />
              {!validationState.hasVehicle && (
                <small className="issue-create-form__helper">Vehicle is required.</small>
              )}
            </div>

            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">4. Assigned To</h3>
              <label htmlFor="assignedTo">Assigned To</label>
              <select
                id="assignedTo"
                value={formData.assignTo}
                onChange={(event) => handleFieldChange('assignTo', event.target.value)}
              >
                <option value="">Select user...</option>
                {users.map((user) => {
                  const userName = getUserName(user);
                  const email = getUserEmail(user);
                  return (
                    <option key={`${user.id || userName}-${email}`} value={userName}>
                      {userName}{email ? ` (${email})` : ''}
                    </option>
                  );
                })}
              </select>
              {!validationState.hasAssignedTo && (
                <small className="issue-create-form__helper">Assignee is required.</small>
              )}
            </div>

            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">5. Timeline</h3>

              <div className="issue-create-form__split-grid">
                <div>
                  <label htmlFor="openedBy">Opened By</label>
                  <input
                    id="openedBy"
                    type="text"
                    value={formData.openBy}
                    readOnly
                    className="issue-create-form__readonly"
                  />
                </div>
                <div>
                  <label htmlFor="issueStatus">Status</label>
                  <input
                    id="issueStatus"
                    type="text"
                    value={formData.statusName || 'Open'}
                    readOnly
                    className="issue-create-form__readonly"
                  />
                </div>
              </div>

              <div className="issue-create-form__split-grid">
                <div>
                  <label htmlFor="openDate">Open Date</label>
                  <input
                    id="openDate"
                    type="text"
                    value={openDateDisplay}
                    readOnly
                    className="issue-create-form__readonly"
                  />
                </div>
                <div>
                  <label htmlFor="dueDate">Target Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => handleFieldChange('dueDate', event.target.value)}
                  />
                </div>
              </div>

              <small className="issue-create-form__helper issue-create-form__helper--muted">
                Status is locked to Open at creation time and cannot be set to Closed from this form.
              </small>
              {!validationState.hasStatus && (
                <small className="issue-create-form__helper">Open status is loading. Please wait.</small>
              )}

              <label htmlFor="timelineNotes">Timeline Notes</label>
              <textarea
                id="timelineNotes"
                rows={3}
                maxLength={1000}
                placeholder="Optional: add timeline checkpoints, ETA, or dependencies."
                value={formData.timelineNotes}
                onChange={(event) => handleFieldChange('timelineNotes', event.target.value)}
              />
            </div>

            <div className="issue-create-form__field">
              <h3 className="issue-create-form__section-title">6. Attachments</h3>
              <label htmlFor="issueAttachments">Upload files</label>
              <input
                id="issueAttachments"
                type="file"
                multiple
                onChange={handleAttachmentsChanged}
              />

              {attachmentCount > 0 && (
                <div className="issue-create-form__attachments">
                  {formData.attachments.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="issue-create-form__attachment-item">
                      <span>{file.name}</span>
                      <button type="button" onClick={() => handleRemoveAttachment(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="issue-create-form__actions">
          <button
            type="button"
            className="issue-create-form__btn issue-create-form__btn--ghost"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="issue-create-form__btn issue-create-form__btn--primary"
            disabled={!isReadyToSubmit || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : '7. Save Issue'}
          </button>
        </footer>
      </form>
    </section>
  );
};

export default IssueCreateForm;
