/**
 * File: IssueTrackerDetailPage.js
 * Purpose: Displays detailed issue information with tabs for Activity Stream, Linked Issues,
 *          inline edit mode, vehicle activity heatmap, and print/share functionality
 * Dependencies: React, react-router-dom, DevExtreme chart/button/load-indicator/tabs, issueTrackerService
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - IssueTrackerDetailPage: Issue detail screen with tabbed interface
 * - Overview Tab: Issue details, activity heatmap, quick actions
 * - Activity Stream Tab: Chronological activity log with timeline display
 * - Linked Issues Tab: DataGrid of issues with same template/category
 * - Print/Share: Popup dialog for printing issue details with activity stream
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import Tabs from 'devextreme-react/tabs';
import notify from 'devextreme/ui/notify';
import { saveAs } from 'file-saver';
import issueTrackerService from '../../services/issueTrackerService';
import IssuePriorityBadge from './components/IssuePriorityBadge';
import IssueStatusIndicator from './components/IssueStatusIndicator';
import IssueActivityStream from './components/IssueActivityStream';
import IssueActivityHeatmap from './components/IssueActivityHeatmap';
import LinkedIssuesGrid from './components/LinkedIssuesGrid';
import IssuePrintPopup from './components/IssuePrintPopup';
import IssueActionPopup from './components/IssueActionPopup';
import { normalizeIssueDisplay } from './utils/issueDisplayUtils';
import { usePermissions } from '../../hooks/usePermissions';
import './styles/IssueTrackerDetailPage.scss';

const ATTACHMENT_CATEGORIES = ['Installation', 'Calibration', 'General'];
const ISSUE_DELETE_PERMISSION = '_Delete_Issues';

const parseDateSafe = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDateTime = (value) => {
  const parsedDate = parseDateSafe(value);
  if (!parsedDate) {
    return 'Not available';
  }

  return parsedDate.toLocaleString();
};

const toDateInputValue = (value) => {
  const parsedDate = parseDateSafe(value);
  if (!parsedDate) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toNullableInt = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const getCategoryLabel = (category) => category?.name || category?.categoryName || '';
const getPriorityLabel = (priority) => priority?.name || priority?.priorityName || priority?.priority || '';
const getStatusLabel = (status) => status?.status || status?.name || status?.statusName || '';

const findStatusByKeywords = (items, keywords) => {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.find((item) => {
    const normalizedLabel = getStatusLabel(item).toLowerCase();
    return keywords.some((keyword) => normalizedLabel.includes(keyword));
  }) || null;
};

const findPriorityByKeywords = (items, keywords) => {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.find((item) => {
    const normalizedLabel = getPriorityLabel(item).toLowerCase();
    return keywords.some((keyword) => normalizedLabel.includes(keyword));
  }) || null;
};

const normalizeIssueListResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const normalizeLookupResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const IssueTrackerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, hasPermission } = usePermissions();
  const canDeleteIssue = hasRole('Admin') || hasPermission(ISSUE_DELETE_PERMISSION);

  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState(null);
  const [vehicleIssues, setVehicleIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState(null);

  // Tab and Print states
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [activityRefreshFn, setActivityRefreshFn] = useState(null);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Action popup states
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false);

  // Attachment states
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);

  const displayIssue = useMemo(() => normalizeIssueDisplay(issue), [issue]);

  const initializeEditData = (issueData) => {
    if (!issueData) {
      setEditData(null);
      return;
    }

    setEditData({
      problemTitle: issueData.problemTitle || '',
      problemDescription: issueData.problemDescription || '',
      issueCategoryId: issueData.issueCategoryId || null,
      priority: issueData.priority ?? null,
      status: issueData.status ?? null,
      dueDate: toDateInputValue(issueData.dueDate),
      relatedIssue: issueData.relatedIssue ?? null
    });
  };

  useEffect(() => {
    const loadIssueDetails = async () => {
      try {
        setLoading(true);
        const [issueData, categoriesData, prioritiesData, statusesData, followStatus] = await Promise.all([
          issueTrackerService.getIssueById(id),
          issueTrackerService.getIssueCategories(),
          issueTrackerService.getIssuePriorities(),
          issueTrackerService.getIssueStatuses(),
          issueTrackerService.isFollowingIssue(id)
        ]);

        setCategories(normalizeLookupResponse(categoriesData));
        setPriorities(normalizeLookupResponse(prioritiesData));
        setStatuses(normalizeLookupResponse(statusesData));
        setIssue(issueData);
        initializeEditData(issueData);
        setIsEditMode(false);
        setIsFollowing(followStatus?.isFollowing || false);

        if (issueData?.vehicleId) {
          const vehicleIssueResponse = await issueTrackerService.getIssuesByVehicle(issueData.vehicleId);
          setVehicleIssues(normalizeIssueListResponse(vehicleIssueResponse));
        } else {
          setVehicleIssues([]);
        }
      } catch (error) {
        console.error(`Error loading issue details for issue ${id}:`, error);
        notify({
          message: 'Unable to load issue details.',
          type: 'error',
          displayTime: 3000
        });
        setIssue(null);
      } finally {
        setLoading(false);
      }
    };

    loadIssueDetails();
  }, [id]);

  const handleEditFieldChange = (fieldName, value) => {
    setEditData((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleEnableEditMode = () => {
    initializeEditData(issue);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    initializeEditData(issue);
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!issue || !editData) {
      return;
    }

    if (!editData.problemTitle.trim()) {
      notify({
        message: 'Title is required.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    try {
      setIsSaving(true);

      const dueDateIso = editData.dueDate ? new Date(`${editData.dueDate}T00:00:00`).toISOString() : null;
      const payload = {
        Id: issue.id,
        IssueCategory: editData.issueCategoryId ?? issue.issueCategoryId,
        Site: issue.siteId,
        Openby: '',
        RelatedIssue: editData.relatedIssue,
        ProblemDescription: editData.problemDescription.trim(),
        ProblemTitle: editData.problemTitle.trim(),
        Status: editData.status,
        Priority: editData.priority,
        DueDate: dueDateIso,
        OpenDate: issue.openDate ? new Date(issue.openDate).toISOString() : null,
        ClosingDate: issue.closingDate ? new Date(issue.closingDate).toISOString() : null,
        LastModfield: new Date().toISOString(),
        Vehicle: issue.vehicleId,
        Device: issue.deviceId ?? null,
        DeviceType: issue.deviceType ?? null,
        AssignTo: ''
      };

      await issueTrackerService.updateIssue(issue.id, payload);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
      // Refresh activity stream to show the edit action
      refreshActivityStream();
    } catch (error) {
      console.error(`Error updating issue ${issue.id}:`, error);
      notify({
        message: 'Unable to save issue changes.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Follow/Unfollow handler
  const handleToggleFollow = async () => {
    if (!issue?.id) return;

    try {
      setIsFollowLoading(true);
      if (isFollowing) {
        await issueTrackerService.unfollowIssue(issue.id);
        setIsFollowing(false);
      } else {
        await issueTrackerService.followIssue(issue.id);
        setIsFollowing(true);
      }
      // Refresh activity stream to show follow/unfollow action
      refreshActivityStream();
    } catch (error) {
      console.error('Error toggling follow status:', error);
      notify({
        message: error?.message || 'Unable to update follow preference.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const updateIssueWithOverrides = async (overrides = {}) => {
    if (!issue) {
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        Id: issue.id,
        IssueCategory: issue.issueCategoryId,
        Site: issue.siteId,
        Openby: '',
        RelatedIssue: issue.relatedIssue,
        ProblemDescription: issue.problemDescription || '',
        ProblemTitle: issue.problemTitle || '',
        Status: issue.status,
        Priority: issue.priority,
        DueDate: issue.dueDate ? new Date(issue.dueDate).toISOString() : null,
        OpenDate: issue.openDate ? new Date(issue.openDate).toISOString() : null,
        ClosingDate: issue.closingDate ? new Date(issue.closingDate).toISOString() : null,
        LastModfield: new Date().toISOString(),
        Vehicle: issue.vehicleId,
        Device: issue.deviceId ?? null,
        DeviceType: issue.deviceType ?? null,
        AssignTo: '',
        ...overrides
      };

      await issueTrackerService.updateIssue(issue.id, payload);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
    } catch (error) {
      console.error(`Error applying quick update for issue ${issue.id}:`, error);
      notify({
        message: 'Unable to apply quick update.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const heatmapDates = useMemo(() => {
    return vehicleIssues.map((vi) => vi.openDate).filter(Boolean);
  }, [vehicleIssues]);

  const priorityDisplay = issue?.priorityName || (issue?.priority !== null && issue?.priority !== undefined ? `Priority ${issue.priority}` : null);
  const statusDisplay = issue?.statusName || (issue?.status !== null && issue?.status !== undefined ? `Status ${issue.status}` : null);

  const editingPriorityDisplay = useMemo(() => {
    if (!isEditMode || !editData) {
      return priorityDisplay;
    }

    const selectedPriority = priorities.find((item) => item.id === editData.priority);
    return getPriorityLabel(selectedPriority) || priorityDisplay;
  }, [isEditMode, editData, priorities, priorityDisplay]);

  const editingStatusDisplay = useMemo(() => {
    if (!isEditMode || !editData) {
      return statusDisplay;
    }

    const selectedStatus = statuses.find((item) => item.id === editData.status);
    return getStatusLabel(selectedStatus) || statusDisplay;
  }, [isEditMode, editData, statuses, statusDisplay]);

  const editingCategoryDisplay = useMemo(() => {
    if (!isEditMode || !editData) {
      return issue?.categoryName || '';
    }

    const selectedCategory = categories.find((item) => item.id === editData.issueCategoryId);
    return getCategoryLabel(selectedCategory) || issue?.categoryName || '';
  }, [isEditMode, editData, categories, issue]);

  const completeStatusOption = useMemo(
    () => findStatusByKeywords(statuses, ['complete', 'completed', 'closed', 'resolved', 'done']),
    [statuses]
  );
  const highPriorityOption = useMemo(
    () => findPriorityByKeywords(priorities, ['high']),
    [priorities]
  );
  const isAlreadyComplete = Boolean(completeStatusOption && issue?.status === completeStatusOption.id);
  const isAlreadyHigh = Boolean(highPriorityOption && issue?.priority === highPriorityOption.id);

  const tabItems = useMemo(() => ([
    { key: 'overview', text: 'Overview', icon: 'fa-light fa-info-circle' },
    { key: 'activity', text: 'Activity Stream', icon: 'fa-light fa-clock-rotate-left' },
    { key: 'linked', text: 'Linked Issues', icon: 'fa-light fa-link' },
    { key: 'attachments', text: `Attachments (${attachments.length})`, icon: 'fa-light fa-paperclip' }
  ]), [attachments.length]);

  const renderTabItem = useCallback((item) => (
    <div className="issue-detail-tabs__item">
      <i className={item.icon}></i>
      <span>{item.text}</span>
    </div>
  ), []);

  const handleTabSelectionChange = useCallback((e) => {
    if (typeof e.itemIndex === 'number') {
      setSelectedTabIndex(e.itemIndex);
    }
  }, []);

  // Activity refresh callback
  const handleActivityRefreshCallback = useCallback((refreshFn) => {
    setActivityRefreshFn(() => refreshFn);
  }, []);

  // Refresh activity stream after changes
  const refreshActivityStream = useCallback(() => {
    if (activityRefreshFn) {
      activityRefreshFn();
    }
  }, [activityRefreshFn]);

  const handleQuickMarkComplete = async (notes) => {
    if (!completeStatusOption) {
      notify({
        message: 'No complete/closed status configured.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    try {
      setIsSaving(true);
      // Use new quick action API that sends notification to issue opener
      await issueTrackerService.markIssueComplete(issue.id, notes || null);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
      setShowCompletePopup(false);
      refreshActivityStream();
    } catch (error) {
      console.error(`Error marking issue ${issue.id} as complete:`, error);
      notify({
        message: 'Unable to mark issue as complete.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickMarkHighPriority = async () => {
    if (!highPriorityOption) {
      notify({
        message: 'No high priority option configured.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    try {
      setIsSaving(true);
      // Use new quick action API that sends notification to assignee
      await issueTrackerService.escalateIssuePriority(issue.id);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
      refreshActivityStream();
    } catch (error) {
      console.error(`Error escalating issue ${issue.id} priority:`, error);
      notify({
        message: 'Unable to escalate issue priority.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ===== ATTACHMENT HANDLERS =====
  const loadAttachments = useCallback(async () => {
    if (!id) return;
    setAttachmentsLoading(true);
    try {
      const data = await issueTrackerService.getAttachments(id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [id]);

  // Load attachments when issue loads
  useEffect(() => {
    if (issue) {
      loadAttachments();
    }
  }, [issue, loadAttachments]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await issueTrackerService.uploadAttachment(id, files[i], uploadCategory);
      }
      notify({ message: `${files.length} file(s) uploaded successfully.`, type: 'success', displayTime: 2500 });
      await loadAttachments();
      refreshActivityStream();
    } catch (err) {
      notify({ message: err?.message || 'Failed to upload file(s).', type: 'error', displayTime: 3000 });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId, fileName) => {
    if (!window.confirm(`Delete attachment "${fileName}"?`)) return;
    try {
      await issueTrackerService.deleteAttachment(id, attachmentId);
      notify({ message: 'Attachment deleted.', type: 'success', displayTime: 2000 });
      await loadAttachments();
      refreshActivityStream();
    } catch (err) {
      notify({ message: 'Failed to delete attachment.', type: 'error', displayTime: 3000 });
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    if (!attachment?.id) return;

    try {
      setDownloadingAttachmentId(attachment.id);
      const result = await issueTrackerService.downloadAttachment(id, attachment.id);
      const fileName = result?.fileName || attachment.fileName || `attachment-${attachment.id}`;
      saveAs(result.blob, fileName);
    } catch (err) {
      notify({ message: err?.message || 'Failed to download attachment.', type: 'error', displayTime: 3000 });
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  // ===== CLOSE ISSUE =====
  const handleCloseIssue = async (notes) => {
    setIsClosing(true);
    try {
      await issueTrackerService.closeIssue(issue.id, notes || null);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
      setShowClosePopup(false);
      refreshActivityStream();
    } catch (_) {
      // Error notification is handled inside issueTrackerService.closeIssue
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue?.id) {
      return;
    }

    const shouldDelete = window.confirm(`Are you sure you want to delete issue #${issue.id}? This action cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    try {
      setIsSaving(true);
      await issueTrackerService.deleteIssue(issue.id);
      navigate('/issue-tracker/tickets');
    } catch (error) {
      notify({
        message: error?.message || 'Unable to delete issue.',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getCategoryIcon = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'installation': return 'fa-light fa-camera';
      case 'calibration': return 'fa-light fa-ruler-combined';
      default: return 'fa-light fa-file';
    }
  };

  const getCategoryColor = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'installation': return 'tw-bg-green-100 tw-text-green-700';
      case 'calibration': return 'tw-bg-orange-100 tw-text-orange-700';
      default: return 'tw-bg-gray-100 tw-text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-600">Loading issue details...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-max-w-2xl tw-mx-auto tw-mt-8">
        <h2 className="tw-text-xl tw-font-semibold tw-text-red-600 tw-mb-2">Issue not found</h2>
        <p className="tw-text-gray-600 tw-mb-4">The issue may have been deleted or the link is invalid.</p>
        <button
          type="button"
          className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded"
          onClick={() => navigate('/issue-tracker/tickets')}
        >
          Back to Issues
        </button>
      </div>
    );
  }

  return (
    <div className="issue-tracker-detail-page tw-space-y-6">
      <div className="issue-tracker-detail-page__header tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start lg:tw-justify-between tw-gap-4">
        <div className="issue-tracker-detail-page__title-group tw-space-y-3">
          <div className="issue-tracker-detail-page__back-slot">
            <Button
              text="Back to Tickets"
              icon="fa-light fa-arrow-left"
              stylingMode="outlined"
              type="default"
              onClick={() => navigate('/issue-tracker/tickets')}
              className="user-details__action-btn user-details__action-btn--first user-details__action-btn--last"
            />
          </div>

          <div className="issue-tracker-detail-page__title-slot">
            <p className="tw-text-sm tw-text-gray-500">Issue #{issue.id}</p>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">{displayIssue?.problemTitle || issue.problemTitle || 'Untitled Issue'}</h1>
            <div className="issue-tracker-detail-page__follow-row">
              <Button
                icon={isFollowing ? 'fa-light fa-bell-on' : 'fa-light fa-bell'}
                stylingMode="outlined"
                type="default"
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
                hint={isFollowing ? 'Click to unfollow and stop receiving notifications' : 'Follow this issue to receive activity notifications'}
                className={`issue-tracker-detail-page__follow-icon ${isFollowing ? 'issue-tracker-detail-page__follow-icon--active' : ''}`}
                elementAttr={{
                  'aria-label': isFollowing ? 'Unfollow issue notifications' : 'Follow issue notifications'
                }}
              />
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
                className={`issue-tracker-detail-page__follow-text ${isFollowing ? 'issue-tracker-detail-page__follow-text--active' : ''}`}
              >
                {isFollowing ? 'Receiving notifications on updates' : 'Receive notifications on updates'}
              </button>
            </div>
          </div>
        </div>

        <div className="issue-tracker-detail-page__actions-slot tw-flex tw-flex-wrap tw-gap-2 lg:tw-justify-end">
          {!isEditMode && (
            <div className="user-details__action-buttons">
              <Button
                text="Print / Share"
                icon="fa-light fa-print"
                stylingMode="outlined"
                type="default"
                className="user-details__action-btn user-details__action-btn--first"
                onClick={() => setShowPrintPopup(true)}
              />
              <Button
                text={isAlreadyComplete ? 'Completed' : 'Mark as Complete'}
                icon="fa-light fa-circle-check"
                stylingMode="outlined"
                type="default"
                onClick={() => setShowCompletePopup(true)}
                disabled={isSaving || isAlreadyComplete}
                className="user-details__action-btn"
              />
              <Button
                text={isAlreadyHigh ? 'Priority: High' : 'Change to High'}
                icon="fa-light fa-arrow-up"
                stylingMode="outlined"
                type="default"
                onClick={handleQuickMarkHighPriority}
                disabled={isSaving || isAlreadyHigh}
                className="user-details__action-btn"
              />
              {!isAlreadyComplete && (
                <Button
                  text={isClosing ? 'Closing...' : 'Close Issue'}
                  icon="fa-light fa-lock"
                  stylingMode="outlined"
                  type="default"
                  onClick={() => setShowClosePopup(true)}
                  disabled={isSaving || isClosing || isAlreadyComplete}
                  hint="Close this issue with approval notes"
                  className="user-details__action-btn"
                />
              )}
              <Button
                text="Edit Issue"
                icon="fa-light fa-pen-to-square"
                type="default"
                stylingMode="outlined"
                onClick={handleEnableEditMode}
                disabled={isAlreadyComplete}
                hint={isAlreadyComplete ? 'This issue is closed and cannot be edited' : 'Edit issue details'}
                className={`user-details__action-btn ${canDeleteIssue ? '' : 'user-details__action-btn--last'}`}
              />
              {canDeleteIssue && (
                <Button
                  text={isSaving ? 'Deleting...' : 'Delete Issue'}
                  icon="fa-light fa-trash"
                  type="danger"
                  stylingMode="outlined"
                  onClick={handleDeleteIssue}
                  disabled={isSaving}
                  className="user-details__action-btn user-details__action-btn--last"
                />
              )}
            </div>
          )}
          {isEditMode && (
            <div className="user-details__action-buttons">
              <Button
                text="Cancel"
                icon="fa-light fa-xmark"
                stylingMode="outlined"
                type="default"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="user-details__action-btn user-details__action-btn--first"
              />
              <Button
                text={isSaving ? 'Saving...' : 'Save Changes'}
                icon="fa-light fa-floppy-disk"
                type="default"
                stylingMode="outlined"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="user-details__action-btn user-details__action-btn--last"
              />
            </div>
          )}
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-mb-4">
          <IssuePriorityBadge priority={editingPriorityDisplay} />
          <IssueStatusIndicator status={editingStatusDisplay} />
          {editingCategoryDisplay && (
            <span className="tw-inline-flex tw-items-center tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-font-medium tw-px-3 tw-py-1 tw-rounded-full">
              <i className="fa-light fa-tag tw-mr-1"></i>
              {editingCategoryDisplay}
            </span>
          )}
        </div>

        {isEditMode && editData ? (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mb-6">
            <div className="tw-col-span-1 lg:tw-col-span-2">
              <label htmlFor="issue-title" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Issue Title
              </label>
              <input
                id="issue-title"
                type="text"
                maxLength={255}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500"
                value={editData.problemTitle}
                onChange={(event) => handleEditFieldChange('problemTitle', event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="issue-category" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Category
              </label>
              <select
                id="issue-category"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500"
                value={editData.issueCategoryId ?? ''}
                onChange={(event) => handleEditFieldChange('issueCategoryId', toNullableInt(event.target.value))}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="issue-priority" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Priority
              </label>
              <select
                id="issue-priority"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500"
                value={editData.priority ?? ''}
                onChange={(event) => handleEditFieldChange('priority', toNullableInt(event.target.value))}
              >
                <option value="">Select priority</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {getPriorityLabel(priority)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="issue-status" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Status
              </label>
              <select
                id="issue-status"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500"
                value={editData.status ?? ''}
                onChange={(event) => handleEditFieldChange('status', toNullableInt(event.target.value))}
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="issue-due-date" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Due Date
              </label>
              <input
                id="issue-due-date"
                type="date"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500"
                value={editData.dueDate}
                onChange={(event) => handleEditFieldChange('dueDate', event.target.value)}
              />
            </div>

            <div className="tw-col-span-1 lg:tw-col-span-2">
              <label htmlFor="issue-description" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                Description
              </label>
              <div
                className="tw-w-full tw-border tw-border-gray-200 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-600 tw-bg-gray-50 tw-whitespace-pre-wrap tw-min-h-[80px]"
              >
                {editData.problemDescription || 'No description provided.'}
              </div>
              <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                <i className="fa-light fa-lock tw-mr-1"></i>
                Description cannot be edited after creation
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-3">
              {displayIssue?.problemTitle || issue.problemTitle || 'Untitled Issue'}
            </h2>
            <p className="tw-text-gray-700 tw-leading-relaxed tw-whitespace-pre-wrap">
              {displayIssue?.problemDescription || issue.problemDescription || 'No description provided.'}
            </p>
          </>
        )}

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4 tw-mt-6">
          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500">Assigned To</p>
            <p className="tw-font-medium tw-text-gray-800">{issue.assignToUserName || 'Unassigned'}</p>
            {issue.assignToEmail && <p className="tw-text-sm tw-text-gray-500">{issue.assignToEmail}</p>}
          </div>

          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500">Opened By</p>
            <p className="tw-font-medium tw-text-gray-800">{issue.openbyUserName || 'Unknown'}</p>
            {issue.openbyEmail && <p className="tw-text-sm tw-text-gray-500">{issue.openbyEmail}</p>}
          </div>

          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Vehicle</p>
            <p className="tw-font-medium tw-text-gray-800">{issue.vehicleHyoungNo || issue.vehicleNumber || 'Not linked'}</p>
            {issue.vehicleId && (
              <button
                type="button"
                className="tw-mt-2 tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 hover:tw-underline tw-flex tw-items-center tw-gap-1"
                onClick={() => navigate('/issue-tracker', {
                  state: {
                    applyFilters: { vehicleId: issue.vehicleId },
                    filterLabel: `Vehicle: ${issue.vehicleHyoungNo || issue.vehicleNumber}`
                  }
                })}
              >
                <i className="fa-light fa-history"></i>
                View Vehicle Issue History
              </button>
            )}
          </div>

          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Site</p>
            <p className="tw-font-medium tw-text-gray-800">{issue.siteName || 'Not specified'}</p>
            {issue.siteId && (
              <button
                type="button"
                className="tw-mt-2 tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 hover:tw-underline tw-flex tw-items-center tw-gap-1"
                onClick={() => navigate('/issue-tracker', {
                  state: {
                    applyFilters: { siteId: issue.siteId },
                    filterLabel: `Site: ${issue.siteName}`
                  }
                })}
              >
                <i className="fa-light fa-history"></i>
                View Site Issue History
              </button>
            )}
          </div>

          {(issue.deviceId || issue.deviceTypeName) && (
            <div className="tw-bg-gray-50 tw-rounded tw-p-3">
              <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Device</p>
              <p className="tw-font-medium tw-text-gray-800">{issue.deviceTypeName || `Device #${issue.deviceId}`}</p>
              {issue.deviceId && (
                <button
                  type="button"
                  className="tw-mt-2 tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 hover:tw-underline tw-flex tw-items-center tw-gap-1"
                  onClick={() => navigate('/issue-tracker', {
                    state: {
                      applyFilters: { deviceId: issue.deviceId },
                      filterLabel: `Device: ${issue.deviceTypeName || issue.deviceId}`
                    }
                  })}
                >
                  <i className="fa-light fa-history"></i>
                  View Device Issue History
                </button>
              )}
            </div>
          )}

          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500">Opened</p>
            <p className="tw-font-medium tw-text-gray-800">{formatDateTime(issue.openDate)}</p>
          </div>

          <div className="tw-bg-gray-50 tw-rounded tw-p-3">
            <p className="tw-text-xs tw-text-gray-500">Due Date</p>
            <p className="tw-font-medium tw-text-gray-800">{formatDateTime(issue.dueDate)}</p>
          </div>

          {issue.completionNotes && (
            <div className="tw-col-span-1 md:tw-col-span-2 xl:tw-col-span-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-3">
              <p className="tw-text-xs tw-text-green-600 tw-font-semibold tw-uppercase tw-mb-1">
                <i className="fa-light fa-circle-check tw-mr-1"></i>
                Completion Notes
              </p>
              <p className="tw-text-sm tw-text-gray-800 tw-whitespace-pre-wrap">{issue.completionNotes}</p>
            </div>
          )}

          {issue.closingNotes && (
            <div className="tw-col-span-1 md:tw-col-span-2 xl:tw-col-span-3 tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded tw-p-3">
              <p className="tw-text-xs tw-text-amber-600 tw-font-semibold tw-uppercase tw-mb-1">
                <i className="fa-light fa-lock tw-mr-1"></i>
                Closing Notes
              </p>
              <p className="tw-text-sm tw-text-gray-800 tw-whitespace-pre-wrap">{issue.closingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-overflow-hidden">
        <div className="issue-detail-tabs">
          <Tabs
            dataSource={tabItems}
            selectedIndex={selectedTabIndex}
            onItemClick={handleTabSelectionChange}
            itemRender={renderTabItem}
            width="100%"
            showNavButtons={true}
            scrollingEnabled={true}
          />
        </div>

        <div className="issue-detail-tabs__content">
          {selectedTabIndex === 0 && (
            <div className="tw-p-6 tw-space-y-6">
              {/* Vehicle Issue Activity Heatmap */}
              <div>
                <IssueActivityHeatmap
                  dates={heatmapDates}
                  weeks={26}
                  title={`Vehicle Issue Activity (${vehicleIssues.length} issues)`}
                  highlightDate={issue?.openDate}
                  colorScheme="blue"
                  showSummary={true}
                />
              </div>
            </div>
          )}

          {selectedTabIndex === 1 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-purple-600"></i>
                  Activity Stream
                </h2>
                <span className="tw-text-xs tw-text-gray-500">
                  Issue timeline and updates from backend activity log
                </span>
              </div>
              <IssueActivityStream issueId={id} onRefresh={handleActivityRefreshCallback} />
            </div>
          )}

          {selectedTabIndex === 2 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-link tw-mr-2 tw-text-indigo-600"></i>
                  Linked Issues
                </h2>
                <span className="tw-text-xs tw-text-gray-500">
                  Issues using the same template or category
                </span>
              </div>
              <LinkedIssuesGrid issueId={id} currentIssue={issue} />
            </div>
          )}

          {selectedTabIndex === 3 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-paperclip tw-mr-2 tw-text-teal-600"></i>
                  Attachments
                </h2>
                <span className="tw-text-xs tw-text-gray-500">
                  Installation photos, calibration docs, and general files
                </span>
              </div>

              {/* Upload Section */}
              <div className="tw-border tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-4 tw-mb-6">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                  <div>
                    <label htmlFor="attach-category" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                      Category
                    </label>
                    <select
                      id="attach-category"
                      className="tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                    >
                      {ATTACHMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="tw-flex-1">
                    <label htmlFor="attach-file" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">
                      Select File(s)
                    </label>
                    <input
                      id="attach-file"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                      className="tw-text-sm tw-text-gray-700"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600">
                      <LoadIndicator height={20} width={20} />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachment List */}
              {attachmentsLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
                  <LoadIndicator />
                  <span className="tw-ml-2 tw-text-gray-500">Loading attachments...</span>
                </div>
              ) : attachments.length === 0 ? (
                <p className="tw-text-sm tw-text-gray-500 tw-text-center tw-py-8">
                  No attachments yet. Upload installation photos, calibration documents, or other files above.
                </p>
              ) : (
                <div className="tw-space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="tw-flex tw-items-center tw-gap-3 tw-border tw-border-gray-200 tw-rounded tw-p-3 hover:tw-bg-gray-50">
                      <div className={`tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center ${getCategoryColor(att.attachmentCategory)}`}>
                        <i className={getCategoryIcon(att.attachmentCategory)}></i>
                      </div>
                      <div className="tw-flex-1 tw-min-w-0">
                        <p className="tw-font-medium tw-text-gray-800 tw-truncate">{att.fileName}</p>
                        <p className="tw-text-xs tw-text-gray-500">
                          {att.attachmentCategory} &middot; {formatFileSize(att.fileSize)} &middot;
                          Uploaded by {att.uploadedByUserName || att.uploadedBy} &middot; {formatDateTime(att.uploadedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="tw-text-blue-600 hover:tw-text-blue-800 tw-text-sm tw-flex tw-items-center tw-gap-2 disabled:tw-opacity-60"
                        onClick={() => handleDownloadAttachment(att)}
                        disabled={downloadingAttachmentId === att.id}
                        title="Download attachment"
                      >
                        {downloadingAttachmentId === att.id ? (
                          <>
                            <LoadIndicator height={16} width={16} />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-light fa-download"></i>
                            <span>Download</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="tw-text-red-500 hover:tw-text-red-700 tw-text-sm"
                        onClick={() => handleDeleteAttachment(att.id, att.fileName)}
                      >
                        <i className="fa-light fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mark as Complete Popup */}
      <IssueActionPopup
        visible={showCompletePopup}
        onHide={() => setShowCompletePopup(false)}
        onConfirm={handleQuickMarkComplete}
        title="Mark Issue as Complete"
        subtitle="This will update the status and notify the issue opener."
        confirmText="Mark Complete"
        confirmIcon="fa-light fa-circle-check"
        confirmType="success"
        placeholder="Enter completion notes — these will be saved to the activity log and sent to the issue opener..."
        isProcessing={isSaving}
        icon="fa-light fa-circle-check"
        iconColor="tw-text-green-600"
      />

      {/* Close Issue Popup */}
      <IssueActionPopup
        visible={showClosePopup}
        onHide={() => setShowClosePopup(false)}
        onConfirm={handleCloseIssue}
        title="Close Issue"
        subtitle="Add closing notes before marking this issue as closed."
        confirmText="Close Issue"
        confirmIcon="fa-light fa-lock"
        confirmType="default"
        placeholder="Enter closing / approval notes..."
        isProcessing={isClosing}
        icon="fa-light fa-lock"
        iconColor="tw-text-amber-600"
      />

      {/* Print/Share Popup */}
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
    </div>
  );
};

export default IssueTrackerDetailPage;
