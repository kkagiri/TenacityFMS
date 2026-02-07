/**
 * File: IssueCreateForm.js
 * Purpose: Standardized issue creation form with Tailwind CSS layout (matching vehicle module patterns)
 * Dependencies: React, Redux, Router, DevExtreme notify, createIssue action
 * Last Modified: 2026-02-05
 *
 * Key Functions/Components:
 * - IssueCreateForm: Captures issue creation data using standardized FMS form layout
 * - handleTemplateSelected: Pre-fills issue fields from selected template
 * - handleSubmit: Saves issue and navigates to details when backend confirms success
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { Popup } from 'devextreme-react/popup';
import VehicleSearchableSelector from '../../../components/selectors/VehicleSearchableSelector';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetchUsers } from '../../../redux/actions/userActions';
import {
  createIssue,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses
} from '../../../redux/actions/issueTrackerActions';
import {
  createInitialFormState,
  getUserEmail,
  getUserName,
  normalizeCollection,
  PROCESS_STEP_LABELS,
  resolveIssueId
} from './issueCreateFormUtils';
import issueTrackerService from '../../../services/issueTrackerService';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

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
  const [isLoading, setIsLoading] = useState(true);
  const [categoryIds, setCategoryIds] = useState([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isTemplatePopupVisible, setIsTemplatePopupVisible] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({ name: '', titleTemplate: '', descriptionTemplate: '', isActive: true, categoryIds: [] });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [deviceTypesRes] = await Promise.allSettled([
          issueTrackerV2Service.getDeviceTypes(),
          dispatch(fetchUsers()),
          dispatch(fetchSiteList()),
          dispatch(fetchIssueCategories()),
          dispatch(fetchIssueStatuses()),
          dispatch(fetchIssuePriorities())
        ]);

        if (deviceTypesRes.status === 'fulfilled') {
          const types = Array.isArray(deviceTypesRes.value)
            ? deviceTypesRes.value
            : deviceTypesRes.value?.data || [];
          setDeviceTypes(types);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
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

  const handleDeviceTypeChange = async (e) => {
    const newDeviceTypeId = e?.target?.value ? parseInt(e.target.value, 10) : null;

    setFormData((prev) => ({
      ...prev,
      deviceTypeId: newDeviceTypeId,
      deviceType: null,
      issueTemplateId: null,
      issueTemplate: null,
      priorityId: null,
      canAutoClose: false
    }));

    setCategoryIds([]);

    // Load templates for selected device type
    if (newDeviceTypeId) {
      try {
        setLoadingTemplates(true);
        const response = await issueTrackerV2Service.getTemplatesByDeviceType(newDeviceTypeId);
        const templateList = Array.isArray(response) ? response : response?.data || [];
        setTemplates(templateList.filter(t => t.isActive));
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    } else {
      setTemplates([]);
    }
  };

  const handleTemplateChange = (e) => {
    const value = e?.target?.value;

    // Check if "Add New Template" option was selected
    if (value === '__add_new__') {
      if (!formData.deviceTypeId) {
        notify({
          message: 'Please select a Device Type first.',
          type: 'warning',
          displayTime: 2500
        });
        return;
      }
      setIsTemplatePopupVisible(true);
      return;
    }

    const templateId = value ? parseInt(value, 10) : null;
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      setFormData((prev) => ({
        ...prev,
        issueTemplateId: null,
        issueTemplate: null
      }));
      setCategoryIds([]);
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

    // Set categoryIds from template if available
    if (template.categoryIds && template.categoryIds.length > 0) {
      setCategoryIds(template.categoryIds);
    } else {
      setCategoryIds([]);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.deviceTypeId) {
      notify({
        message: 'Device Type is required before creating a template.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    const normalizedName = templateDraft.name.trim();
    if (!normalizedName) {
      notify({
        message: 'Template name is required.',
        type: 'warning',
        displayTime: 2500
      });
      return;
    }

    try {
      setIsCreatingTemplate(true);

      const createResponse = await issueTrackerV2Service.createTemplate({
        deviceTypeId: formData.deviceTypeId,
        name: normalizedName,
        titleTemplate: templateDraft.titleTemplate?.trim() || null,
        descriptionTemplate: templateDraft.descriptionTemplate?.trim() || null,
        defaultPriorityId: templateDraft.defaultPriorityId ? Number(templateDraft.defaultPriorityId) : null,
        defaultStatusId: templateDraft.defaultStatusId ? Number(templateDraft.defaultStatusId) : null,
        isActive: templateDraft.isActive,
        categoryIds: templateDraft.categoryIds || []
      });

      const createdTemplate = Array.isArray(createResponse) ? createResponse[0] : createResponse?.data || createResponse;

      // Reload templates
      const response = await issueTrackerV2Service.getTemplatesByDeviceType(formData.deviceTypeId);
      const templateList = Array.isArray(response) ? response : response?.data || [];
      setTemplates(templateList.filter(t => t.isActive));

      // Close popup and reset
      setIsTemplatePopupVisible(false);
      setTemplateDraft({ name: '', titleTemplate: '', descriptionTemplate: '', isActive: true, categoryIds: [] });

      // Select the newly created template
      if (createdTemplate?.id) {
        setFormData((prev) => ({
          ...prev,
          issueTemplateId: createdTemplate.id,
          issueTemplate: createdTemplate,
          issueTitle: prev.issueTitle || createdTemplate.titleTemplate || '',
          issueDescription: prev.issueDescription || createdTemplate.descriptionTemplate || '',
          priorityId: prev.priorityId || createdTemplate.defaultPriorityId || null
        }));

        if (createdTemplate.categoryIds && createdTemplate.categoryIds.length > 0) {
          setCategoryIds(createdTemplate.categoryIds);
        }
      }

      notify({
        message: 'Template created successfully!',
        type: 'success',
        displayTime: 2000
      });
    } catch (error) {
      console.error('Error creating template:', error);
      notify({
        message: error?.message || 'Failed to create template',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsCreatingTemplate(false);
    }
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

  const handleCancel = () => {
    navigate('/issue-tracker');
  };

  const titleLength = useMemo(() => formData.issueTitle.trim().length, [formData.issueTitle]);
  const descriptionLength = useMemo(() => formData.issueDescription.trim().length, [formData.issueDescription]);

  const validationState = useMemo(() => ({
    hasDeviceType: Boolean(formData.deviceTypeId),
    hasTemplate: Boolean(formData.issueTemplateId),
    hasCategory: categoryIds.length > 0,
    hasTitle: titleLength >= 5,
    hasDescription: descriptionLength >= 15,
    hasLocation: Boolean(formData.siteId),
    hasVehicle: Boolean(formData.vehicleId),
    hasAssignedTo: Boolean(formData.assignTo),
    hasStatus: Boolean(formData.statusId)
  }), [categoryIds.length, descriptionLength, formData.assignTo, formData.deviceTypeId, formData.issueTemplateId, formData.siteId, formData.statusId, formData.vehicleId, titleLength]);

  const isReadyToSubmit = (
    validationState.hasDeviceType &&
    validationState.hasTemplate &&
    validationState.hasCategory &&
    validationState.hasTitle &&
    validationState.hasDescription &&
    validationState.hasLocation &&
    validationState.hasVehicle &&
    validationState.hasAssignedTo &&
    validationState.hasStatus
  );

  const processSteps = useMemo(() => {
    const completionFlags = [
      validationState.hasDeviceType,
      validationState.hasTemplate,
      validationState.hasCategory && validationState.hasTitle && validationState.hasDescription && validationState.hasLocation && validationState.hasVehicle,
      validationState.hasAssignedTo,
      validationState.hasStatus,
      true,
      isReadyToSubmit
    ];

    const activeIndex = completionFlags.findIndex((flag) => !flag);
    const normalizedActiveIndex = activeIndex === -1 ? PROCESS_STEP_LABELS.length - 1 : activeIndex;

    return PROCESS_STEP_LABELS.map((label, index) => ({
      label,
      isComplete: completionFlags[index],
      isActive: index === normalizedActiveIndex
    }));
  }, [isReadyToSubmit, validationState]);

  const openDateDisplay = useMemo(() => (
    formData.openDate instanceof Date
      ? formData.openDate.toLocaleString()
      : 'Not available'
  ), [formData.openDate]);

  const attachmentCount = formData.attachments.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!isReadyToSubmit || isSubmitting) {
      return;
    }

    const payload = {
      IssueCategory: categoryIds[0] || categories[0]?.id,
      IssueTemplateId: formData.issueTemplateId,
      DeviceTypeId: formData.deviceTypeId,
      CanAutoClose: Boolean(formData.canAutoClose),
      IsAutoCreated: false,
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

      // Upload attachments if any were selected
      if (formData.attachments && formData.attachments.length > 0) {
        let uploadedCount = 0;
        const failedUploads = [];

        for (const file of formData.attachments) {
          try {
            const category = file._category || 'General';
            await issueTrackerService.uploadAttachment(issueId, file, category);
            uploadedCount++;
          } catch (uploadErr) {
            console.error('Failed to upload attachment:', file.name, uploadErr);
            failedUploads.push({
              name: file.name,
              error: uploadErr?.response?.data?.message || uploadErr?.message || 'Upload failed'
            });
          }
        }

        if (failedUploads.length > 0) {
          const errorDetails = failedUploads.map(f => `${f.name}: ${f.error}`).join('; ');
          notify({
            message: `Issue created but ${failedUploads.length} attachment(s) failed to upload. ${errorDetails}`,
            type: 'warning',
            displayTime: 5000
          });
        }
      }

      notify({
        message: 'Issue created successfully.',
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

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-4 tw-max-w-6xl tw-mx-auto">
      {/* Header */}
      <div className="tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <div>
            <p className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-gray-500 tw-font-semibold tw-mb-1">
              Issue Tracker
            </p>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">Create New Issue</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              Follow the workflow: Device Type → Template → Details → Assignment → Timeline
            </p>
          </div>
          <span className={`tw-px-4 tw-py-2 tw-rounded-full tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide ${isReadyToSubmit
            ? 'tw-bg-green-100 tw-text-green-700 tw-border tw-border-green-200'
            : 'tw-bg-gray-100 tw-text-gray-600 tw-border tw-border-gray-200'
            }`}>
            {isReadyToSubmit ? 'Ready to Submit' : 'Incomplete'}
          </span>
        </div>

        {/* Progress Steps */}
        <div className="tw-flex tw-gap-2 tw-mt-4 tw-overflow-x-auto tw-pb-2">
          {processSteps.map((step, index) => (
            <div
              key={step.label}
              className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-whitespace-nowrap tw-transition-all ${step.isComplete
                ? 'tw-bg-green-100 tw-text-green-700'
                : step.isActive
                  ? 'tw-bg-blue-100 tw-text-blue-700 tw-ring-2 tw-ring-blue-300'
                  : 'tw-bg-gray-100 tw-text-gray-500'
                }`}
            >
              <span className={`tw-w-5 tw-h-5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-font-bold ${step.isComplete
                ? 'tw-bg-green-600 tw-text-white'
                : step.isActive
                  ? 'tw-bg-blue-600 tw-text-white'
                  : 'tw-bg-gray-300 tw-text-gray-600'
                }`}>
                {step.isComplete ? <i className="fa-light fa-check"></i> : index + 1}
              </span>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Device Type & Template */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-mb-4 tw-shadow-sm">
          <h2 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-microchip tw-text-blue-600"></i>
            Device & Template Selection
          </h2>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Device Type <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                value={formData.deviceTypeId}
                dataSource={deviceTypes}
                displayExpr={(item) => item?.name || item?.typeName || `Device Type ${item?.id}`}
                valueExpr="id"
                placeholder="Select device type..."
                searchEnabled={true}
                showClearButton={false}
                disabled={isLoading}
                onValueChanged={(e) => {
                  const event = { target: { value: e.value } };
                  handleDeviceTypeChange(event);
                }}
              />
              {attemptedSubmit && !validationState.hasDeviceType && (
                <p className="tw-text-xs tw-text-red-500 tw-mt-1">Device type is required</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Issue Template <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                value={formData.issueTemplateId}
                dataSource={[
                  ...(formData.deviceTypeId ? [{ id: '__add_new__', name: '+ Add New Template', isSpecial: true }] : []),
                  ...templates
                ]}
                displayExpr="name"
                valueExpr="id"
                placeholder={
                  !formData.deviceTypeId
                    ? 'Select device type first...'
                    : loadingTemplates
                      ? 'Loading templates...'
                      : 'Select issue template...'
                }
                searchEnabled={true}
                showClearButton={false}
                disabled={!formData.deviceTypeId || loadingTemplates}
                onValueChanged={(e) => {
                  const event = { target: { value: e.value } };
                  handleTemplateChange(event);
                }}
                itemRender={(item) => {
                  if (item?.isSpecial) {
                    return (
                      <div className="tw-flex tw-items-center tw-gap-2 tw-py-1 tw-text-blue-600 tw-font-medium">
                        <i className="fa-light fa-plus tw-w-4"></i>
                        <span>Add New Template</span>
                      </div>
                    );
                  }
                  return (
                    <div className="tw-py-1">
                      <div className="tw-font-medium tw-text-gray-700">{item?.name}</div>
                      {(item?.titleTemplate || item?.descriptionTemplate) && (
                        <div className="tw-text-xs tw-text-gray-500 tw-mt-0.5 tw-truncate">
                          {item.titleTemplate?.substring(0, 50) || item.descriptionTemplate?.split(' ').slice(0, 4).join(' ')}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {attemptedSubmit && !validationState.hasTemplate && (
                <p className="tw-text-xs tw-text-red-500 tw-mt-1">Issue template is required</p>
              )}
            </div>
          </div>

          {/* Show template categories if available */}
          {formData.issueTemplate && formData.issueTemplate.categories && formData.issueTemplate.categories.length > 0 && (
            <div className="tw-col-span-2 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
              <p className="tw-text-xs tw-font-semibold tw-text-blue-700 tw-mb-2">
                <i className="fa-light fa-tags tw-mr-1"></i>
                Template Categories
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {formData.issueTemplate.categories.map((category) => (
                  <span
                    key={category.id}
                    className="tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-700 tw-text-xs tw-font-medium tw-rounded-full"
                  >
                    <i className="fa-light fa-tag tw-mr-1"></i>
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Issue Details */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-mb-4 tw-shadow-sm">
          <h2 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-file-lines tw-text-blue-600"></i>
            Issue Details
          </h2>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Issue Categories <span className="tw-text-red-500">*</span>
              </label>
              <TagBox
                value={categoryIds}
                dataSource={categories}
                displayExpr="name"
                valueExpr="id"
                placeholder={formData.issueTemplateId ? "Select categories..." : "Select template first"}
                searchEnabled={true}
                showSelectionControls={true}
                applyValueMode="useButtons"
                onValueChanged={(e) => setCategoryIds(e.value || [])}
                disabled={!formData.issueTemplateId}
              />
              {!formData.issueTemplateId && (
                <p className="tw-text-xs tw-text-blue-500 tw-mt-1">
                  <i className="fa-light fa-info-circle tw-mr-1"></i>
                  Select an issue template first to enable category selection
                </p>
              )}
              {attemptedSubmit && formData.issueTemplateId && !validationState.hasCategory && (
                <p className="tw-text-xs tw-text-red-500 tw-mt-1">At least one category is required</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Priority
              </label>
              <SelectBox
                value={formData.priorityId}
                dataSource={priorities}
                displayExpr="name"
                valueExpr="id"
                placeholder="Select priority..."
                searchEnabled={true}
                showClearButton={true}
                onValueChanged={(e) => handleFieldChange('priorityId', e.value)}
              />
            </div>
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Issue Title <span className="tw-text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={160}
              placeholder="Example: Fuel pump pressure drop on lane 2"
              value={formData.issueTitle}
              onChange={(e) => handleFieldChange('issueTitle', e.target.value)}
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
            />
            <div className="tw-flex tw-justify-between tw-mt-1">
              {attemptedSubmit && (
                <p className={`tw-text-xs ${validationState.hasTitle ? 'tw-text-green-600' : 'tw-text-red-500'}`}>
                  {validationState.hasTitle ? '✓ Valid title' : 'Minimum 5 characters required'}
                </p>
              )}
              <span className="tw-text-xs tw-text-gray-400 tw-ml-auto">{titleLength}/160</span>
            </div>
          </div>

          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description <span className="tw-text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              placeholder="Share what happened, where it happened, and any immediate impact."
              value={formData.issueDescription}
              onChange={(e) => handleFieldChange('issueDescription', e.target.value)}
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 tw-resize-none"
            />
            <div className="tw-flex tw-justify-between tw-mt-1">
              {attemptedSubmit && (
                <p className={`tw-text-xs ${validationState.hasDescription ? 'tw-text-green-600' : 'tw-text-red-500'}`}>
                  {validationState.hasDescription ? '✓ Valid description' : 'Minimum 15 characters required'}
                </p>
              )}
              <span className="tw-text-xs tw-text-gray-400 tw-ml-auto">{descriptionLength}/2000</span>
            </div>
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Site / Location <span className="tw-text-red-500">*</span>
              </label>
              <SelectBox
                value={formData.siteId}
                dataSource={sites}
                displayExpr="name"
                valueExpr="id"
                placeholder="Select site..."
                searchEnabled={true}
                onValueChanged={(e) => handleFieldChange('siteId', e.value)}
              />
              {attemptedSubmit && !validationState.hasLocation && (
                <p className="tw-text-xs tw-text-red-500 tw-mt-1">Site is required</p>
              )}
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Vehicle <span className="tw-text-red-500">*</span>
              </label>
              <VehicleSearchableSelector
                value={formData.vehicleId}
                onValueChanged={(e) => handleFieldChange('vehicleId', e?.value ?? null)}
                placeholder="Type to search vehicle"
                width="100%"
              />
              {attemptedSubmit && !validationState.hasVehicle && (
                <p className="tw-text-xs tw-text-red-500 tw-mt-1">Vehicle is required</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Assignment */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-mb-4 tw-shadow-sm">
          <h2 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-user-check tw-text-blue-600"></i>
            Assignment
          </h2>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Assign To <span className="tw-text-red-500">*</span>
            </label>
            <SelectBox
              value={formData.assignTo}
              dataSource={users.map(user => ({
                id: user.id,
                userName: getUserName(user),
                email: getUserEmail(user),
                displayName: `${getUserName(user)}${getUserEmail(user) ? ` (${getUserEmail(user)})` : ''}`
              }))}
              displayExpr="displayName"
              valueExpr="userName"
              placeholder="Select user..."
              searchEnabled={true}
              searchExpr={['userName', 'email']}
              onValueChanged={(e) => handleFieldChange('assignTo', e.value)}
            />
            {attemptedSubmit && !validationState.hasAssignedTo && (
              <p className="tw-text-xs tw-text-red-500 tw-mt-1">Assignee is required</p>
            )}
          </div>
        </div>

        {/* Section 4: Timeline */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-mb-4 tw-shadow-sm">
          <h2 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-calendar tw-text-blue-600"></i>
            Timeline
          </h2>

          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Opened By</label>
              <input
                type="text"
                value={formData.openBy}
                readOnly
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-200 tw-rounded-md tw-text-sm tw-bg-gray-50 tw-text-gray-600"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Status</label>
              <input
                type="text"
                value={formData.statusName || 'Open'}
                readOnly
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-200 tw-rounded-md tw-text-sm tw-bg-gray-50 tw-text-gray-600"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Target Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Timeline Notes</label>
            <textarea
              rows={2}
              maxLength={1000}
              placeholder="Optional: add timeline checkpoints, ETA, or dependencies."
              value={formData.timelineNotes}
              onChange={(e) => handleFieldChange('timelineNotes', e.target.value)}
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 tw-resize-none"
            />
          </div>
        </div>

        {/* Section 5: Attachments */}
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-5 tw-mb-6 tw-shadow-sm">
          <h2 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-paperclip tw-text-blue-600"></i>
            Attachments
          </h2>
          <p className="tw-text-xs tw-text-gray-500 tw-mb-4">
            Installation photos, calibration docs, and general files
          </p>

          <div className="tw-border-2 tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-4 tw-text-center tw-bg-gray-50">
            <input
              type="file"
              id="attachments"
              multiple
              accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
              onChange={handleAttachmentsChanged}
              className="tw-hidden"
            />
            <label
              htmlFor="attachments"
              className="tw-cursor-pointer tw-flex tw-flex-col tw-items-center tw-gap-2"
            >
              <i className="fa-light fa-cloud-upload tw-text-3xl tw-text-gray-400"></i>
              <span className="tw-text-sm tw-text-gray-600">Click to upload files</span>
              <span className="tw-text-xs tw-text-gray-400">Accepted: Images, PDF, Excel, Word</span>
            </label>
          </div>

          {attachmentCount > 0 && (
            <div className="tw-mt-4 tw-space-y-3">
              {formData.attachments.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="tw-flex tw-items-start tw-gap-3 tw-px-4 tw-py-3 tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg hover:tw-shadow-sm tw-transition-shadow"
                >
                  <div className="tw-flex-shrink-0 tw-mt-1">
                    <div className={`tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center ${file._category === 'Installation'
                        ? 'tw-bg-purple-100 tw-text-purple-600'
                        : file._category === 'Calibration'
                          ? 'tw-bg-orange-100 tw-text-orange-600'
                          : 'tw-bg-blue-100 tw-text-blue-600'
                      }`}>
                      <i className={`fa-light ${file._category === 'Installation'
                          ? 'fa-screwdriver-wrench'
                          : file._category === 'Calibration'
                            ? 'fa-gauge'
                            : 'fa-file'
                        }`}></i>
                    </div>
                  </div>

                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                      <p className="tw-font-medium tw-text-gray-800 tw-truncate">{file.name}</p>
                      <span className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${file._category === 'Installation'
                          ? 'tw-bg-purple-100 tw-text-purple-700'
                          : file._category === 'Calibration'
                            ? 'tw-bg-orange-100 tw-text-orange-700'
                            : 'tw-bg-blue-100 tw-text-blue-700'
                        }`}>
                        {file._category || 'General'}
                      </span>
                    </div>
                    <p className="tw-text-xs tw-text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="tw-flex-shrink-0">
                    <select
                      className="tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-1.5 tw-text-sm tw-bg-white focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
                      value={file._category || 'General'}
                      onChange={(e) => {
                        setFormData((prev) => {
                          const updatedFiles = [...prev.attachments];
                          updatedFiles[index] = Object.assign(updatedFiles[index], { _category: e.target.value });
                          return { ...prev, attachments: updatedFiles };
                        });
                      }}
                    >
                      <option value="Installation">Installation</option>
                      <option value="Calibration">Calibration</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="tw-flex-shrink-0 tw-text-red-500 hover:tw-text-red-700 tw-p-2 tw-rounded hover:tw-bg-red-50 tw-transition-colors"
                    title="Remove attachment"
                  >
                    <i className="fa-light fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-4 tw-border-t tw-border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="tw-px-4 tw-py-2 tw-text-gray-600 tw-bg-white tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors tw-shadow-sm"
            disabled={isSubmitting}
          >
            <i className="fa-light fa-times tw-mr-2"></i>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="tw-px-4 tw-py-2 tw-text-gray-600 tw-bg-white tw-rounded-md hover:tw-bg-gray-50 tw-transition-colors tw-shadow-sm"
            disabled={isSubmitting}
          >
            <i className="fa-light fa-rotate tw-mr-2"></i>
            Reset
          </button>
          <button
            type="submit"
            disabled={!isReadyToSubmit || isSubmitting}
            className="tw-px-6 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors tw-shadow-sm"
          >
            {isSubmitting ? (
              <>
                <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fa-light fa-save tw-mr-2"></i>
                Create Issue
              </>
            )}
          </button>
        </div>
      </form>

      {/* Template Creation Popup */}
      <Popup
        visible={isTemplatePopupVisible}
        onHiding={() => !isCreatingTemplate && setIsTemplatePopupVisible(false)}
        showTitle={true}
        title="Create Issue Template"
        width={600}
        height="auto"
        dragEnabled={false}
        hideOnOutsideClick={!isCreatingTemplate}
      >
        <div className="tw-p-4 tw-space-y-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Template Name <span className="tw-text-red-500">*</span>
            </label>
            <input
              type="text"
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Enter template name"
              value={templateDraft.name}
              onChange={(e) => setTemplateDraft(prev => ({ ...prev, name: e.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Title Template
            </label>
            <input
              type="text"
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Optional title template"
              value={templateDraft.titleTemplate}
              onChange={(e) => setTemplateDraft(prev => ({ ...prev, titleTemplate: e.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Description Template
            </label>
            <textarea
              rows={4}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
              placeholder="Optional description template"
              value={templateDraft.descriptionTemplate}
              onChange={(e) => setTemplateDraft(prev => ({ ...prev, descriptionTemplate: e.target.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Categories / Tags
            </label>
            <TagBox
              dataSource={categories}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select categories"
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
              value={templateDraft.categoryIds || []}
              onValueChanged={(e) => setTemplateDraft(prev => ({ ...prev, categoryIds: e.value }))}
              disabled={isCreatingTemplate}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Priority
            </label>
            <select
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-bg-white"
              value={templateDraft.defaultPriorityId ?? ''}
              onChange={(e) => setTemplateDraft(prev => ({
                ...prev,
                defaultPriorityId: e.target.value ? Number(e.target.value) : null
              }))}
              disabled={isCreatingTemplate}
            >
              <option value="">None</option>
              {priorities.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Status
            </label>
            <select
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-bg-white"
              value={templateDraft.defaultStatusId ?? ''}
              onChange={(e) => setTemplateDraft(prev => ({
                ...prev,
                defaultStatusId: e.target.value ? Number(e.target.value) : null
              }))}
              disabled={isCreatingTemplate}
            >
              <option value="">None</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.status || status.name || `Status ${status.id}`}
                </option>
              ))}
            </select>
          </div>

          <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
            <input
              type="checkbox"
              className="tw-h-4 tw-w-4"
              checked={templateDraft.isActive}
              onChange={(e) => setTemplateDraft(prev => ({ ...prev, isActive: e.target.checked }))}
              disabled={isCreatingTemplate}
            />
            Active template
          </label>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded tw-text-gray-700 hover:tw-bg-gray-50"
              onClick={() => setIsTemplatePopupVisible(false)}
              disabled={isCreatingTemplate}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-bg-orange-600 tw-text-white tw-rounded hover:tw-bg-orange-700 disabled:tw-opacity-60"
              onClick={handleCreateTemplate}
              disabled={isCreatingTemplate}
            >
              {isCreatingTemplate ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default IssueCreateForm;
