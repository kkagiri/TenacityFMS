/**
 * File: IssueCreateForm.js
 * Purpose: Issue creation form with Microsoft Fluent Design — 2-column layout, BEM cards, sidebar checklist/summary
 * Dependencies: React, Redux, Router, DevExtreme (SelectBox, TagBox, Button), SlidePanel, IssueCreateForm.scss
 * Last Modified: 2026-03-05
 *
 * Key Functions/Components:
 * - IssueCreateForm: Fluent-themed issue creation with breadcrumb, progress bar, form cards, sidebar
 * - handleTemplateSelected: Pre-fills issue fields from selected template
 * - handleSubmit: Saves issue and navigates to details when backend confirms success
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { Button } from 'devextreme-react/button';
import SlidePanel from '../../../components/ui/SlidePanel';
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
import './IssueCreateForm.scss';

const pad2 = (value) => String(value).padStart(2, '0');
const toDateTimeLocalValue = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }

  const year = value.getFullYear();
  const month = pad2(value.getMonth() + 1);
  const day = pad2(value.getDate());
  const hours = pad2(value.getHours());
  const minutes = pad2(value.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const normalizeToken = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const isFuelActivityToken = (value) => normalizeToken(value) === 'fuel_activity';
const getDeviceTypeLabel = (item) => {
  if (!item || typeof item !== 'object') {
    return '';
  }

  const label = item.name || item.typeName;
  return typeof label === 'string' ? label : '';
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
  const userDataSource = useMemo(() => users.map(user => ({
    id: user.id,
    userName: getUserName(user),
    email: getUserEmail(user),
    displayName: `${getUserName(user)}${getUserEmail(user) ? ` (${getUserEmail(user)})` : ''}`
  })), [users]);
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
  const [localCategoryOptions, setLocalCategoryOptions] = useState([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [creatingTagLabel, setCreatingTagLabel] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagContainerRef = useRef(null);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categoryOptions = useMemo(() => {
    const merged = [...categories, ...localCategoryOptions];
    const unique = [];
    const seen = new Set();

    merged.forEach((item) => {
      const key = item?.id ?? `${normalizeToken(item?.name)}-${item?.description || ''}`;
      if (key === null || key === undefined || seen.has(key)) {
        return;
      }

      seen.add(key);
      unique.push(item);
    });

    return unique;
  }, [categories, localCategoryOptions]);

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
          setDeviceTypes(types.filter((type) => !isFuelActivityToken(type?.name || type?.typeName)));
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
        setTemplates(templateList.filter((t) => t.isActive && !isFuelActivityToken(t?.name || t?.titleTemplate)));
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
      setTemplates(templateList.filter((t) => t.isActive && !isFuelActivityToken(t?.name || t?.titleTemplate)));

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

  const newTagSuggestions = useMemo(() => {
    const query = newTagInput.trim().toLowerCase();
    return categoryOptions.filter((item) => {
      const name = (item?.name || '').toLowerCase();
      if (categoryIds.includes(item.id)) return false;
      if (!query) return true;
      return name.includes(query);
    });
  }, [newTagInput, categoryOptions, categoryIds]);

  const newTagExactMatch = useMemo(() => {
    const query = normalizeToken(newTagInput);
    if (!query) return null;
    return categoryOptions.find((item) => normalizeToken(item?.name) === query) || null;
  }, [newTagInput, categoryOptions]);

  const handleAddNewTag = async () => {
    const tagName = newTagInput.trim();
    if (!tagName) return;

    // If exact match exists, just select it
    if (newTagExactMatch?.id) {
      setCategoryIds((prev) => Array.from(new Set([...prev, newTagExactMatch.id])));
      setNewTagInput('');
      setTagDropdownOpen(false);
      return;
    }

    try {
      setIsCreatingTag(true);
      setCreatingTagLabel(tagName);

      const createResult = await issueTrackerService.createIssueCategory({
        name: tagName,
        description: `Tag: ${tagName}`
      });

      const rawId = createResult?.id ?? createResult?.data?.id ?? null;
      const newTagId = typeof rawId === 'number' && rawId > 0 ? rawId : null;

      if (newTagId) {
        setLocalCategoryOptions((prev) => ([...prev, { id: newTagId, name: tagName, description: `Tag: ${tagName}` }]));
        setCategoryIds((prev) => Array.from(new Set([...prev, newTagId])));
      } else {
        // Backend returned id:0 or no id — re-fetch categories to resolve actual id
        const refreshResult = await dispatch(fetchIssueCategories());
        const refreshed = Array.isArray(refreshResult?.payload) ? refreshResult.payload
          : Array.isArray(refreshResult) ? refreshResult : [];
        const created = refreshed.find((c) => normalizeToken(c?.name) === normalizeToken(tagName));
        if (created?.id) {
          setLocalCategoryOptions((prev) => ([...prev, { id: created.id, name: tagName, description: `Tag: ${tagName}` }]));
          setCategoryIds((prev) => Array.from(new Set([...prev, created.id])));
        }
      }

      setNewTagInput('');
      setTagDropdownOpen(false);
      notify({ message: `Tag "${tagName}" created and added.`, type: 'success', displayTime: 2000 });
    } catch (error) {
      console.error('Error creating tag:', error);
      notify({ message: error?.message || 'Failed to create tag.', type: 'error', displayTime: 3000 });
    } finally {
      setIsCreatingTag(false);
      setCreatingTagLabel('');
    }
  };

  const handleSelectSuggestion = (tagId) => {
    setCategoryIds((prev) => Array.from(new Set([...prev, tagId])));
    setNewTagInput('');
    setTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagId) => {
    setCategoryIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleTemplateTagCustomItem = async (event) => {
    const rawText = event?.text || '';
    const candidate = rawText.trim();
    if (!candidate) {
      event.customItem = null;
      return;
    }

    const existing = categoryOptions.find((item) => normalizeToken(item?.name) === normalizeToken(candidate));
    if (existing?.id) {
      event.customItem = existing;
      return;
    }

    event.customItem = (async () => {
      try {
        const createResult = await issueTrackerService.createIssueCategory({
          name: candidate,
          description: `Tag: ${candidate}`
        });
        const newTagId = Number(createResult?.id || createResult?.data?.id || 0);
        if (newTagId > 0) {
          const newTag = { id: newTagId, name: candidate, description: `Tag: ${candidate}` };
          setLocalCategoryOptions((prev) => ([...prev, newTag]));
          notify({ message: `Tag "${candidate}" created.`, type: 'success', displayTime: 2000 });
          return newTag;
        }
      } catch (error) {
        console.error('Error creating tag in template popup:', error);
        notify({ message: error?.message || 'Failed to create tag.', type: 'error', displayTime: 3000 });
      }
      return null;
    })();
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
    hasAssignedTo: Array.isArray(formData.assignToUsers) && formData.assignToUsers.length > 0,
    hasStatus: Boolean(formData.statusId)
  }), [categoryIds.length, descriptionLength, formData.assignToUsers, formData.deviceTypeId, formData.issueTemplateId, formData.siteId, formData.statusId, formData.vehicleId, titleLength]);

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
      IssueCategory: categoryIds[0] || categoryOptions[0]?.id,
      IssueCategoryTags: categoryIds,
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
      AssignTo: (formData.assignToUsers || []).join(','),
      CompletionNotes: (formData.statusName || '').toLowerCase() === 'complete' ? (formData.completionNotes || '').trim() || null : null
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

      // Upload attachments as a single batch after issue is created
      if (formData.attachments && formData.attachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          formData.attachments.map((file) => {
            const category = file._category || 'General';
            return issueTrackerService.uploadAttachment(issueId, file, category);
          })
        );

        const failedUploads = uploadResults
          .map((result, index) => ({ result, file: formData.attachments[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, file }) => ({
            name: file?.name || 'Unknown file',
            error:
              result?.reason?.response?.data?.message ||
              result?.reason?.message ||
              'Upload failed'
          }));

        if (failedUploads.length > 0) {
          const errorDetails = failedUploads.map(f => `${f.name}: ${f.error}`).join('; ');
          notify({
            message: `Issue created but ${failedUploads.length} attachment(s) failed to upload. ${errorDetails}`,
            type: 'warning',
            displayTime: 5000
          });
        }
      }

      // Follow issue if checkbox is checked
      if (formData.followIssue) {
        try {
          await issueTrackerService.followIssue(issueId, { notifyByEmail: true, notifyByPush: true });
        } catch (followErr) {
          console.warn('Failed to follow issue:', followErr);
        }
      }

      // Create due-date reminder if enabled
      if (formData.reminderEnabled && formData.dueDate) {
        try {
          await issueTrackerService.createIssueReminder(issueId, {
            reminderType: 'OnceBeforeDue',
            daysBefore: formData.reminderDaysBefore,
            notifyAssignee: true,
            notifyOpener: true,
            isActive: true
          });
        } catch (reminderErr) {
          console.warn('Failed to create reminder:', reminderErr);
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
    <div className="issue-create-form">
      {/* Breadcrumb */}
      <div className="issue-create-form__breadcrumb">
        <span className="issue-create-form__breadcrumb-link" onClick={() => navigate('/issue-tracker')}>Issues</span>
        <i className="fa-light fa-chevron-right"></i>
        <span>Create New Issue</span>
      </div>

      {/* Page Header */}
      <div className="issue-create-form__page-header">
        <div>
          <p className="issue-create-form__eyebrow">Issue Tracker</p>
          <h1 className="issue-create-form__title">Create New Issue</h1>
          <p className="issue-create-form__subtitle">
            Follow the workflow: Device Type → Template → Details → Assignment → Timeline
          </p>
        </div>
        <span className={`issue-create-form__ready-chip ${isReadyToSubmit ? 'is-ready' : 'is-pending'}`}>
          <i className={`fa-light ${isReadyToSubmit ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {isReadyToSubmit ? 'Ready to Submit' : 'Incomplete'}
        </span>
      </div>

      {/* Progress Tracker */}
      <div className="issue-create-form__progress-track">
        {processSteps.map((step, index) => (
          <div
            key={step.label}
            className={`issue-create-form__progress-step${step.isComplete ? ' is-done' : ''}${step.isActive ? ' is-active' : ''}`}
          >
            <span className="issue-create-form__ps-num">
              {step.isComplete ? <i className="fa-light fa-check"></i> : index + 1}
            </span>
            <span className="issue-create-form__ps-label">{step.label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="issue-create-form__layout">
          <div className="issue-create-form__main">
            {/* Section 1: Device & Template */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-microchip"></i>
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
                    displayExpr={getDeviceTypeLabel}
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
                    Template Tags
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
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-file-lines"></i>
                Issue Details
              </h2>

              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-4">
                <div className="md:tw-col-span-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Issue Tags <span className="tw-text-red-500">*</span>
                  </label>

                  {/* Selected tags as removable pills */}
                  {categoryIds.length > 0 && (
                    <div className="tw-flex tw-flex-wrap tw-gap-1.5 tw-mb-2">
                      {categoryIds.map((tagId) => {
                        const tag = categoryOptions.find((c) => c.id === tagId);
                        return (
                          <span
                            key={tagId}
                            className="tw-inline-flex tw-items-center tw-gap-1 tw-pl-2.5 tw-pr-1 tw-py-1 tw-bg-blue-100 tw-text-blue-800 tw-text-xs tw-font-medium tw-rounded-full tw-border tw-border-blue-200"
                          >
                            <i className="fa-light fa-tag"></i>
                            {tag?.name || `Tag #${tagId}`}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tagId)}
                              className="tw-ml-0.5 tw-flex tw-items-center tw-justify-center tw-text-blue-400 hover:tw-text-red-500 tw-transition-colors tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer"
                              title="Remove tag"
                            >
                              <i className="fa-light fa-xmark tw-text-xs"></i>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Unified search / create input */}
                  <div className="tw-relative" ref={tagContainerRef}>
                    <div className="tw-relative">
                      <i className="fa-light fa-search tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400 tw-text-sm tw-pointer-events-none"></i>
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => {
                          setNewTagInput(e.target.value);
                          setTagDropdownOpen(true);
                        }}
                        onFocus={() => setTagDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagExactMatch) {
                              handleSelectSuggestion(newTagExactMatch.id);
                            } else if (newTagInput.trim()) {
                              handleAddNewTag();
                            }
                          }
                          if (e.key === 'Escape') {
                            setTagDropdownOpen(false);
                          }
                        }}
                        placeholder={!formData.issueTemplateId ? 'Select template first' : 'Search or create a tag...'}
                        disabled={!formData.issueTemplateId || isCreatingTag}
                        className="tw-w-full tw-pl-9 tw-pr-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 disabled:tw-bg-gray-50 disabled:tw-text-gray-400"
                      />
                    </div>

                    {/* Dropdown panel */}
                    {tagDropdownOpen && formData.issueTemplateId && (
                      <div className="tw-absolute tw-z-20 tw-left-0 tw-right-0 tw-mt-1 tw-bg-white tw-rounded-lg tw-shadow-lg tw-overflow-y-auto" style={{ maxHeight: '210px' }}>
                        {/* Add New Tag option — always at top */}
                        {!newTagExactMatch && newTagInput.trim() && (
                          <button
                            type="button"
                            onClick={() => handleAddNewTag()}
                            disabled={isCreatingTag}
                            className="tw-w-full tw-text-left tw-px-3 tw-py-2.5 tw-text-sm tw-bg-white tw-border-0 hover:tw-bg-blue-50 tw-flex tw-items-center tw-gap-2 tw-transition-colors tw-text-blue-600 tw-font-medium"
                          >
                            {isCreatingTag ? (
                              <><i className="fa-light fa-spinner fa-spin"></i> Creating "{creatingTagLabel}"...</>
                            ) : (
                              <><i className="fa-light fa-plus"></i> Add New Tag</>)}
                          </button>
                        )}

                        {/* Existing tag matches */}
                        {newTagSuggestions.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(tag.id)}
                            className="tw-w-full tw-text-left tw-px-3 tw-py-2.5 tw-text-sm tw-text-gray-700 tw-bg-white tw-border-0 hover:tw-bg-blue-50 tw-flex tw-items-center tw-gap-2 tw-transition-colors"
                          >
                            <i className="fa-light fa-tag tw-text-gray-400"></i>
                            <span>{tag.name}</span>
                            {normalizeToken(tag.name) === normalizeToken(newTagInput) && (
                              <span className="tw-ml-auto tw-text-xs tw-text-green-600 tw-font-medium">Exact match</span>
                            )}
                          </button>
                        ))}

                        {/* Create new entry at bottom */}
                        {!newTagExactMatch && newTagInput.trim() && (
                          <div className="tw-px-3 tw-py-2 tw-text-xs tw-text-gray-400">
                            Press Enter or click "Add New Tag" to create <strong>"{newTagInput.trim()}"</strong>
                          </div>
                        )}

                        {newTagSuggestions.length === 0 && newTagExactMatch && (
                          <button
                            type="button"
                            onClick={() => handleSelectSuggestion(newTagExactMatch.id)}
                            className="tw-w-full tw-text-left tw-px-3 tw-py-2.5 tw-text-sm tw-text-gray-700 tw-bg-white tw-border-0 hover:tw-bg-blue-50 tw-flex tw-items-center tw-gap-2 tw-transition-colors"
                          >
                            <i className="fa-light fa-tag tw-text-gray-400"></i>
                            <span>{newTagExactMatch.name}</span>
                            <span className="tw-ml-auto tw-text-xs tw-text-green-600 tw-font-medium">Exact match</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Creating indicator */}
                  {isCreatingTag && (
                    <p className="tw-text-xs tw-text-blue-500 tw-mt-1.5">
                      <i className="fa-light fa-spinner fa-spin tw-mr-1"></i>
                      Creating tag: {creatingTagLabel}...
                    </p>
                  )}

                  {!formData.issueTemplateId && (
                    <p className="tw-text-xs tw-text-blue-500 tw-mt-1">
                      <i className="fa-light fa-info-circle tw-mr-1"></i>
                      Select an issue template first to enable tag selection
                    </p>
                  )}
                  {attemptedSubmit && formData.issueTemplateId && !validationState.hasCategory && (
                    <p className="tw-text-xs tw-text-red-500 tw-mt-1">At least one tag is required</p>
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
                  maxLength={255}
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
                  <span className="tw-text-xs tw-text-gray-400 tw-ml-auto">{titleLength}/255</span>
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
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-user-check"></i>
                Assignment
              </h2>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Assign To (Multiple) <span className="tw-text-red-500">*</span>
                </label>
                <TagBox
                  value={formData.assignToUsers || []}
                  dataSource={userDataSource}
                  displayExpr="displayName"
                  valueExpr="userName"
                  placeholder="Select one or more users..."
                  searchEnabled={true}
                  searchExpr={['userName', 'email']}
                  showSelectionControls={true}
                  applyValueMode="instantly"
                  multiline={true}
                  showClearButton={true}
                  onValueChanged={(e) => {
                    const selectedUsers = e.value || [];
                    handleFieldChange('assignToUsers', selectedUsers);
                    handleFieldChange('assignTo', selectedUsers[0] || '');
                  }}
                />
                {attemptedSubmit && !validationState.hasAssignedTo && (
                  <p className="tw-text-xs tw-text-red-500 tw-mt-1">At least one assignee is required</p>
                )}
              </div>
            </div>

            {/* Section 4: Timeline */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-calendar"></i>
                Timeline
              </h2>

              <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-4">
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
                  <select
                    value={formData.statusId ?? ''}
                    onChange={(e) => {
                      const selectedId = e.target.value ? parseInt(e.target.value, 10) : null;
                      const selectedStatus = statuses.find((s) => s.id === selectedId);
                      handleFieldChange('statusId', selectedId);
                      handleFieldChange('statusName', selectedStatus?.status || selectedStatus?.name || '');
                    }}
                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
                  >
                    <option value="">Select status...</option>
                    {statuses
                      .filter((s) => {
                        const label = String(s.status || s.name || '').toLowerCase().trim();
                        return ['open', 'ongoing', 'complete'].includes(label);
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.status || s.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Open Date</label>
                  <input
                    type="datetime-local"
                    value={toDateTimeLocalValue(formData.openDate)}
                    onChange={(e) => {
                      const nextValue = e.target.value ? new Date(e.target.value) : null;
                      handleFieldChange('openDate', nextValue);
                    }}
                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
                  />
                  <p className="tw-text-xs tw-text-gray-400 tw-mt-1">This sets the issue creation time used in reports and timelines.</p>
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

              {/* Completion Notes — only visible when status is Complete */}
              {(formData.statusName || '').toLowerCase() === 'complete' && (
                <div className="tw-mt-4">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    <i className="fa-light fa-clipboard-check tw-mr-1 tw-text-green-600"></i>
                    Completion Notes
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Enter completion notes or resolution summary..."
                    value={formData.completionNotes || ''}
                    onChange={(e) => handleFieldChange('completionNotes', e.target.value)}
                    className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500 tw-resize-none"
                  />
                </div>
              )}
            </div>

            {/* Section 5: Notifications */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-bell"></i>
                Notifications
              </h2>

              {/* Follow checkbox */}
              <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-3">
                <input
                  type="checkbox"
                  checked={formData.followIssue}
                  onChange={(e) => handleFieldChange('followIssue', e.target.checked)}
                  className="tw-w-4 tw-h-4 tw-text-blue-600 tw-rounded tw-border-gray-300 focus:tw-ring-blue-500"
                />
                <span className="tw-text-sm tw-text-gray-700">
                  <i className="fa-light fa-eye tw-mr-1"></i>
                  Follow this issue — receive notifications on changes
                </span>
              </label>

              {/* Due date reminder — only shown when due date is set and is in the future */}
              {formData.dueDate && (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const due = new Date(`${formData.dueDate}T00:00:00`);
                return due > today;
              })() && (
                  <div className="tw-mt-3 tw-pl-6 tw-border-l-2 tw-border-blue-100">
                    <label className="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-mb-2">
                      <input
                        type="checkbox"
                        checked={formData.reminderEnabled}
                        onChange={(e) => handleFieldChange('reminderEnabled', e.target.checked)}
                        className="tw-w-4 tw-h-4 tw-text-blue-600 tw-rounded tw-border-gray-300 focus:tw-ring-blue-500"
                      />
                      <span className="tw-text-sm tw-text-gray-700">
                        <i className="fa-light fa-clock tw-mr-1"></i>
                        Receive reminder before due date
                      </span>
                    </label>

                    {formData.reminderEnabled && (
                      <div className="tw-flex tw-items-center tw-gap-2 tw-mt-2 tw-ml-6">
                        <span className="tw-text-sm tw-text-gray-600">Remind</span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={formData.reminderDaysBefore}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
                            handleFieldChange('reminderDaysBefore', val);
                          }}
                          className="tw-w-16 tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm tw-text-center focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
                        />
                        <span className="tw-text-sm tw-text-gray-600">day(s) before due date</span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Section 6: Attachments */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-paperclip"></i>
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

          </div>{/* end __main */}

          {/* Sidebar */}
          <div className="issue-create-form__sidebar">
            {/* Requirements Checklist */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-clipboard-check"></i>
                Requirements
              </h2>
              <div className="issue-create-form__checklist">
                {[
                  { label: 'Device Type', done: validationState.hasDeviceType },
                  { label: 'Template', done: validationState.hasTemplate },
                  { label: 'Category', done: validationState.hasCategory },
                  { label: 'Title', done: validationState.hasTitle },
                  { label: 'Description', done: validationState.hasDescription },
                  { label: 'Location / Site', done: validationState.hasLocation },
                  { label: 'Vehicle', done: validationState.hasVehicle },
                  { label: 'Assigned To', done: validationState.hasAssignedTo },
                  { label: 'Status', done: validationState.hasStatus },
                ].map((item) => (
                  <div className="issue-create-form__cl-item" key={item.label}>
                    <span className={`issue-create-form__cl-dot ${item.done ? 'issue-create-form__cl-dot--done' : 'issue-create-form__cl-dot--pending'}`}>
                      {item.done && <i className="fa-light fa-check"></i>}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="issue-create-form__card">
              <h2 className="issue-create-form__card-title">
                <i className="fa-light fa-info-circle"></i>
                Summary
              </h2>
              <div className="issue-create-form__summary">
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Device Type</span>
                  <span className="issue-create-form__s-val">
                    {deviceTypes.find(d => d.id === formData.deviceTypeId)?.name
                      || deviceTypes.find(d => d.id === formData.deviceTypeId)?.typeName
                      || '\u2014'}
                  </span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Template</span>
                  <span className="issue-create-form__s-val">
                    {templates.find(t => t.id === formData.issueTemplateId)?.name || '\u2014'}
                  </span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Title</span>
                  <span className="issue-create-form__s-val">{formData.title || '\u2014'}</span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Priority</span>
                  <span className="issue-create-form__s-val">
                    {priorities.find(p => p.id === formData.priorityId)?.name || '\u2014'}
                  </span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Site</span>
                  <span className="issue-create-form__s-val">
                    {sites.find(s => s.id === formData.siteId)?.name || '\u2014'}
                  </span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Status</span>
                  <span className="issue-create-form__s-val">
                    {statuses.find(s => s.id === formData.statusId)?.status
                      || statuses.find(s => s.id === formData.statusId)?.name
                      || '\u2014'}
                  </span>
                </div>
                <div className="issue-create-form__summary-row">
                  <span className="issue-create-form__s-label">Assigned</span>
                  <span className="issue-create-form__s-val">
                    {formData.assignToUsers?.length || 0} user(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="issue-create-form__card">
              <div className="issue-create-form__btn-grp">
                <button
                  type="submit"
                  className="issue-create-form__btn issue-create-form__btn--primary"
                  disabled={!isReadyToSubmit || isSubmitting}
                >
                  <i className={isSubmitting ? 'fa-light fa-spinner fa-spin' : 'fa-light fa-save'}></i>
                  {isSubmitting ? 'Creating\u2026' : 'Create Issue'}
                </button>
                <button
                  type="button"
                  className="issue-create-form__btn-text"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="issue-create-form__btn-text"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>{/* end __sidebar */}
        </div>{/* end __layout */}
      </form>

      {/* Template Creation — SlidePanel */}
      <SlidePanel
        open={isTemplatePopupVisible}
        onClose={() => !isCreatingTemplate && setIsTemplatePopupVisible(false)}
        title="Create Issue Template"
        width={520}
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
              dataSource={categoryOptions}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select or type tags"
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
              value={templateDraft.categoryIds || []}
              onValueChanged={(e) => setTemplateDraft(prev => ({ ...prev, categoryIds: e.value }))}
              acceptCustomValue={true}
              customItemCreateEvent="change"
              onCustomItemCreating={handleTemplateTagCustomItem}
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
            <Button
              text="Cancel"
              stylingMode="text"
              onClick={() => setIsTemplatePopupVisible(false)}
              disabled={isCreatingTemplate}
            />
            <Button
              text={isCreatingTemplate ? 'Saving...' : 'Save Template'}
              icon="fa-light fa-save"
              type="default"
              stylingMode="contained"
              onClick={handleCreateTemplate}
              disabled={isCreatingTemplate}
            />
          </div>
        </div>
      </SlidePanel>
    </div>
  );
};

export default IssueCreateForm;
