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
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
import IssueCompletionPopup from './components/IssueCompletionPopup';
import IssueReassignPopup from './components/IssueReassignPopup';
import IssueCompletionRecords from './components/IssueCompletionRecords';
import { normalizeIssueDisplay } from './utils/issueDisplayUtils';
import { normalizeCollection } from './forms/issueCreateFormUtils';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchUsers } from '../../redux/actions/userActions';
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
const normalizeIssueTags = (issueData) => {
  if (!issueData) {
    return [];
  }

  if (Array.isArray(issueData.issueCategoryTagNames) && issueData.issueCategoryTagNames.length > 0) {
    return issueData.issueCategoryTagNames;
  }

  if (issueData.categoryName) {
    return [issueData.categoryName];
  }

  return [];
};

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

const includesKeyword = (value, keywords) => {
  const normalizedValue = (value || '').toLowerCase();
  return keywords.some((keyword) => normalizedValue.includes(keyword));
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
  const dispatch = useDispatch();
  const { hasRole, hasPermission } = usePermissions();
  const canDeleteIssue = hasRole('Admin') || hasPermission(ISSUE_DELETE_PERMISSION);

  // Redux selectors for users + vehicles (needed by reassign & completion popups)
  const usersState = useSelector((state) => state.user?.users);
  const vehiclesState = useSelector((state) => state.vehicle?.vehicles);
  const users = useMemo(() => normalizeCollection(usersState), [usersState]);
  const vehicles = useMemo(() => normalizeCollection(vehiclesState), [vehiclesState]);

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
  const [showReassignPopup, setShowReassignPopup] = useState(false);
  const [showCompletionWithActionsPopup, setShowCompletionWithActionsPopup] = useState(false);

  // Attachment states
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);

  // Actions dropdown state
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef(null);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setActionsDropdownOpen(false);
      }
    };
    if (actionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsDropdownOpen]);

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
      issueCategoryTags: Array.isArray(issueData.issueCategoryTags) && issueData.issueCategoryTags.length > 0
        ? issueData.issueCategoryTags
        : (issueData.issueCategoryId ? [issueData.issueCategoryId] : []),
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
        if (!error?.isNotFound && error?.status !== 404) {
          notify({
            message: 'Unable to load issue details.',
            type: 'error',
            displayTime: 3000
          });
        }
        setIssue(null);
      } finally {
        setLoading(false);
      }
    };

    loadIssueDetails();
  }, [id]);

  // Fetch users for the reassign popup (if not already in Redux)
  useEffect(() => {
    if (!usersState || (Array.isArray(usersState) && usersState.length === 0)) {
      dispatch(fetchUsers());
    }
  }, [dispatch, usersState]);

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
        IssueCategoryTags: (editData.issueCategoryTags && editData.issueCategoryTags.length > 0)
          ? editData.issueCategoryTags
          : (issue.issueCategoryTags || (issue.issueCategoryId ? [issue.issueCategoryId] : [])),
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
        IssueCategoryTags: issue.issueCategoryTags || (issue.issueCategoryId ? [issue.issueCategoryId] : []),
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
      return normalizeIssueTags(issue).join(', ');
    }

    const selectedCategory = categories.find((item) => item.id === editData.issueCategoryId);
    return getCategoryLabel(selectedCategory) || normalizeIssueTags(issue).join(', ');
  }, [isEditMode, editData, categories, issue]);

  const issueTagNames = useMemo(() => normalizeIssueTags(issue), [issue]);

  const completeStatusOption = useMemo(
    () => findStatusByKeywords(statuses, ['complete', 'completed', 'resolved', 'done']),
    [statuses]
  );
  const closedStatusOption = useMemo(
    () => findStatusByKeywords(statuses, ['close', 'closed']),
    [statuses]
  );
  const highPriorityOption = useMemo(
    () => findPriorityByKeywords(priorities, ['high']),
    [priorities]
  );

  const currentStatusLabel = useMemo(() => {
    if (!issue) {
      return '';
    }

    if (issue.statusName) {
      return issue.statusName;
    }

    const matchedStatus = statuses.find((status) => status.id === issue.status);
    return getStatusLabel(matchedStatus) || '';
  }, [issue, statuses]);

  const isAlreadyClosed = useMemo(() => {
    if (!issue) {
      return false;
    }

    if (closedStatusOption && issue.status === closedStatusOption.id) {
      return true;
    }

    return includesKeyword(currentStatusLabel, ['close', 'closed']);
  }, [issue, closedStatusOption, currentStatusLabel]);

  const isAlreadyComplete = useMemo(() => {
    if (!issue || isAlreadyClosed) {
      return false;
    }

    if (completeStatusOption && issue.status === completeStatusOption.id) {
      return true;
    }

    return includesKeyword(currentStatusLabel, ['complete', 'completed', 'resolved', 'done']);
  }, [issue, completeStatusOption, currentStatusLabel, isAlreadyClosed]);

  const isTerminalStatus = isAlreadyClosed || isAlreadyComplete;
  const isAlreadyHigh = Boolean(highPriorityOption && issue?.priority === highPriorityOption.id);
  const canUploadAttachments = !isAlreadyClosed;

  const tabItems = useMemo(() => ([
    { key: 'overview', text: 'Overview', icon: 'fa-light fa-info-circle' },
    { key: 'activity', text: 'Activity Stream', icon: 'fa-light fa-clock-rotate-left' },
    { key: 'completion', text: 'Completion', icon: 'fa-light fa-clipboard-check' },
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
    if (isAlreadyClosed || isAlreadyComplete) {
      return;
    }

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

  // Handler: structured completion with actions (V2)
  const handleCompletionWithActionsSuccess = async () => {
    try {
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
      setShowCompletionWithActionsPopup(false);
      refreshActivityStream();
    } catch (error) {
      console.error('Error refreshing after completion:', error);
    }
  };

  // Handler: reassignment success (V2)
  const handleReassignSuccess = async () => {
    try {
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setShowReassignPopup(false);
      refreshActivityStream();
      notify({
        message: 'Issue reassigned successfully.',
        type: 'success',
        displayTime: 3000
      });
    } catch (error) {
      console.error('Error refreshing after reassignment:', error);
    }
  };

  // Always open the wizard-based completion popup (handles both templated and non-templated issues)
  const handleOpenCompletePopup = useCallback(() => {
    setShowCompletionWithActionsPopup(true);
  }, []);

  const handleQuickMarkHighPriority = async () => {
    if (isAlreadyClosed || isAlreadyComplete) {
      return;
    }

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

    if (isAlreadyClosed) {
      notify({
        message: 'Closed issues cannot be deleted.',
        type: 'warning',
        displayTime: 3000
      });
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

  // Priority accent colour for the header card top bar
  const priorityAccentClass = useMemo(() => {
    const p = (priorityDisplay || '').toLowerCase();
    if (p.includes('critical')) return 'ihc__accent--critical';
    if (p.includes('high'))     return 'ihc__accent--high';
    if (p.includes('medium') || p.includes('med')) return 'ihc__accent--medium';
    if (p.includes('low'))      return 'ihc__accent--low';
    return 'ihc__accent--default';
  }, [priorityDisplay]);

  // Due-date urgency indicator
  const dueDateUrgency = useMemo(() => {
    if (!issue?.dueDate) return null;
    const due = new Date(issue.dueDate);
    const now = new Date();
    const diffMs = due - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffMs < 0) return 'overdue';
    if (diffDays <= 2) return 'soon';
    return null;
  }, [issue]);

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

  const issueTitle = displayIssue?.problemTitle || issue.problemTitle || 'Untitled Issue';
  const openerInitial = (issue.openbyUserName || '?')[0].toUpperCase();
  const assigneeInitial = (issue.assignToUserName || '?')[0].toUpperCase();

  return (
    <div className="issue-tracker-detail-page">

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HEADER CARD  (Fluent Design)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="ihc">
        {/* Coloured priority accent bar */}
        <div className={`ihc__accent ${priorityAccentClass}`}></div>

        <div className="ihc__body">

          {/* â”€â”€ Row 1: Breadcrumb + segmented button group â”€â”€ */}
          <div className="ihc__top">
            <nav className="ihc__breadcrumb" aria-label="breadcrumb">
              <button
                type="button"
                className="ihc__bc-home"
                onClick={() => navigate('/issue-tracker/tickets')}
              >
                <i className="fa-light fa-layer-group"></i>
                <span>Issues</span>
              </button>
              <span className="ihc__bc-sep" aria-hidden="true">â€º</span>
              <span className="ihc__bc-current">
                #{issue.id} Â· {issueTitle.length > 40 ? `${issueTitle.slice(0, 40)}â€¦` : issueTitle}
              </span>
            </nav>

            {/* Segmented action group */}
            <div className="ihc__btn-group" role="toolbar" aria-label="Issue actions">
              {!isEditMode ? (
                <>
                  {/* Follow */}
                  <button
                    type="button"
                    className={`ihc__btn ${isFollowing ? 'ihc__btn--follow-active' : ''}`}
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    title={isFollowing ? 'Unfollow this issue' : 'Follow to receive notifications'}
                  >
                    <i className={`fa-light ${isFollowing ? 'fa-bell-on' : 'fa-bell'}`}></i>
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    className="ihc__btn ihc__btn--edit"
                    onClick={handleEnableEditMode}
                    disabled={isTerminalStatus}
                    title={isTerminalStatus ? 'Cannot edit closed/completed issues' : 'Edit issue'}
                  >
                    <i className="fa-light fa-pen-to-square"></i>
                    <span>Edit</span>
                  </button>

                  {/* Print */}
                  <button
                    type="button"
                    className="ihc__btn"
                    onClick={() => setShowPrintPopup(true)}
                    title="Print or share this issue"
                  >
                    <i className="fa-light fa-print"></i>
                    <span>Print</span>
                  </button>

                  {/* Actions dropdown */}
                  <div className="ihc__dropdown" ref={actionsDropdownRef}>
                    <button
                      type="button"
                      className={`ihc__btn ihc__btn--actions ${actionsDropdownOpen ? 'ihc__btn--pressed' : ''}`}
                      onClick={() => setActionsDropdownOpen((prev) => !prev)}
                      aria-haspopup="true"
                      aria-expanded={actionsDropdownOpen}
                    >
                      <i className="fa-solid fa-ellipsis"></i>
                      <span>Actions</span>
                      <i className={`fa-light fa-chevron-${actionsDropdownOpen ? 'up' : 'down'} ihc__chevron`}></i>
                    </button>

                    {actionsDropdownOpen && (
                      <div className="ihc__menu" role="menu">
                        <button
                          type="button"
                          className="ihc__menu-item"
                          role="menuitem"
                          onClick={() => { handleOpenCompletePopup(); setActionsDropdownOpen(false); }}
                          disabled={isSaving || isAlreadyComplete || isAlreadyClosed}
                        >
                          <i className="fa-light fa-circle-check"></i>
                          <span>{isAlreadyComplete ? 'Completed' : 'Mark as Complete'}</span>
                        </button>
                        <button
                          type="button"
                          className="ihc__menu-item"
                          role="menuitem"
                          onClick={() => { setShowReassignPopup(true); setActionsDropdownOpen(false); }}
                          disabled={isSaving || isAlreadyClosed}
                        >
                          <i className="fa-light fa-user-pen"></i>
                          <span>Reassign</span>
                        </button>
                        <button
                          type="button"
                          className="ihc__menu-item"
                          role="menuitem"
                          onClick={() => { handleQuickMarkHighPriority(); setActionsDropdownOpen(false); }}
                          disabled={isSaving || isAlreadyHigh || isAlreadyComplete || isAlreadyClosed}
                        >
                          <i className="fa-light fa-arrow-up"></i>
                          <span>{isAlreadyHigh ? 'Priority: High' : 'Escalate to High'}</span>
                        </button>
                        {!isAlreadyClosed && (
                          <button
                            type="button"
                            className="ihc__menu-item ihc__menu-item--warn"
                            role="menuitem"
                            onClick={() => { setShowClosePopup(true); setActionsDropdownOpen(false); }}
                            disabled={isSaving || isClosing || isAlreadyClosed}
                          >
                            <i className="fa-light fa-lock"></i>
                            <span>{isClosing ? 'Closingâ€¦' : 'Close Issue'}</span>
                          </button>
                        )}
                        {canDeleteIssue && (
                          <>
                            <div className="ihc__menu-divider"></div>
                            <button
                              type="button"
                              className="ihc__menu-item ihc__menu-item--danger"
                              role="menuitem"
                              onClick={() => { handleDeleteIssue(); setActionsDropdownOpen(false); }}
                              disabled={isSaving || isAlreadyClosed}
                            >
                              <i className="fa-light fa-trash"></i>
                              <span>{isSaving ? 'Deletingâ€¦' : 'Delete Issue'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="ihc__btn ihc__btn--cancel"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <i className="fa-light fa-xmark"></i>
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    className="ihc__btn ihc__btn--save"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    <i className="fa-light fa-floppy-disk"></i>
                    <span>{isSaving ? 'Savingâ€¦' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* â”€â”€ Row 2: Badges + Title â”€â”€ */}
          <div className="ihc__title-section">
            <div className="ihc__badges">
              <span className="ihc__issue-id">Issue #{issue.id}</span>
              <IssueStatusIndicator status={editingStatusDisplay} />
              <IssuePriorityBadge priority={editingPriorityDisplay} />
              {!isEditMode && issueTagNames.map((tag) => (
                <span key={tag} className="ihc__tag">
                  <i className="fa-light fa-tag"></i>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="ihc__title">{issueTitle}</h1>
          </div>

          {/* â”€â”€ Row 3: Metadata strip â”€â”€ */}
          <div className="ihc__meta-strip">
            <span className="ihc__meta-item">
              <i className="fa-light fa-calendar-day"></i>
              <span>{formatDateTime(issue.openDate)}</span>
            </span>
            <span className="ihc__meta-sep" aria-hidden="true">Â·</span>
            <span className="ihc__meta-item">
              <span className="ihc__avatar ihc__avatar--blue" aria-hidden="true">{openerInitial}</span>
              <span className="ihc__meta-name">{issue.openbyUserName || 'Unknown'}</span>
              <span className="ihc__meta-muted">opened</span>
            </span>
            {issue.dueDate && (
              <>
                <span className="ihc__meta-spacer" aria-hidden="true"></span>
                <span className={`ihc__meta-item ${dueDateUrgency === 'overdue' ? 'ihc__meta-due--overdue' : dueDateUrgency === 'soon' ? 'ihc__meta-due--soon' : ''}`}>
                  <i className="fa-light fa-clock"></i>
                  <span>Due {formatDateTime(issue.dueDate)}</span>
                  {dueDateUrgency && (
                    <span className={`ihc__due-pill ihc__due-pill--${dueDateUrgency}`}>
                      {dueDateUrgency === 'overdue' ? 'Overdue' : 'Due soon'}
                    </span>
                  )}
                </span>
              </>
            )}
          </div>

        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          DESCRIPTION + DETAILS CARD
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="idc">

        {/* â”€â”€ Description â”€â”€ */}
        <div className="idc__section-title">Description</div>
        <div className="idc__description">
          {isEditMode && editData ? (
            <p className="tw-text-sm tw-text-gray-600 tw-whitespace-pre-wrap tw-leading-relaxed">
              {editData.problemDescription || 'No description provided.'}
            </p>
          ) : (
            <p className="tw-text-sm tw-text-gray-700 tw-whitespace-pre-wrap tw-leading-relaxed">
              {displayIssue?.problemDescription || issue.problemDescription || 'No description provided.'}
            </p>
          )}
          {isEditMode && (
            <p className="tw-text-xs tw-text-gray-400 tw-mt-2">
              <i className="fa-light fa-lock tw-mr-1"></i>
              Description cannot be edited after creation.
            </p>
          )}
        </div>

        {/* â”€â”€ Details section label â”€â”€ */}
        <div className="idc__section-title idc__section-title--bordered">Details</div>

        {/* â”€â”€ Edit form (replaces grid when in edit mode) â”€â”€ */}
        {isEditMode && editData ? (
          <div className="idc__edit-form">
            <div className="idc__edit-grid">
              <div className="idc__edit-field idc__edit-field--span2">
                <label htmlFor="issue-title" className="idc__edit-label">Issue Title</label>
                <input
                  id="issue-title"
                  type="text"
                  maxLength={255}
                  className="idc__edit-input"
                  value={editData.problemTitle}
                  onChange={(e) => handleEditFieldChange('problemTitle', e.target.value)}
                />
              </div>
              <div className="idc__edit-field">
                <label htmlFor="issue-category" className="idc__edit-label">Category</label>
                <select
                  id="issue-category"
                  className="idc__edit-select"
                  value={editData.issueCategoryId ?? ''}
                  onChange={(e) => {
                    const v = toNullableInt(e.target.value);
                    handleEditFieldChange('issueCategoryId', v);
                    handleEditFieldChange('issueCategoryTags', v ? [v] : []);
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{getCategoryLabel(c)}</option>)}
                </select>
              </div>
              <div className="idc__edit-field">
                <label htmlFor="issue-priority" className="idc__edit-label">Priority</label>
                <select
                  id="issue-priority"
                  className="idc__edit-select"
                  value={editData.priority ?? ''}
                  onChange={(e) => handleEditFieldChange('priority', toNullableInt(e.target.value))}
                >
                  <option value="">Select priority</option>
                  {priorities.map((p) => <option key={p.id} value={p.id}>{getPriorityLabel(p)}</option>)}
                </select>
              </div>
              <div className="idc__edit-field">
                <label htmlFor="issue-status" className="idc__edit-label">Status</label>
                <select
                  id="issue-status"
                  className="idc__edit-select"
                  value={editData.status ?? ''}
                  onChange={(e) => handleEditFieldChange('status', toNullableInt(e.target.value))}
                >
                  <option value="">Select status</option>
                  {statuses.map((s) => <option key={s.id} value={s.id}>{getStatusLabel(s)}</option>)}
                </select>
              </div>
              <div className="idc__edit-field">
                <label htmlFor="issue-due-date" className="idc__edit-label">Due Date</label>
                <input
                  id="issue-due-date"
                  type="date"
                  className="idc__edit-input"
                  value={editData.dueDate}
                  onChange={(e) => handleEditFieldChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* â”€â”€ Property grid (view mode) â”€â”€ */
          <div className="idc__grid">

            {/* LEFT COLUMN */}
            <div className="idc__col">
              {/* Assigned To */}
              <div className="idc__prop">
                <div className="idc__prop-label">Assigned To</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span className="idc__avatar idc__avatar--green">{assigneeInitial}</span>
                    <div>
                      <div className="idc__prop-name">{issue.assignToUserName || 'Unassigned'}</div>
                      {issue.assignToEmail && <div className="idc__prop-sub">{issue.assignToEmail}</div>}
                    </div>
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>

              {/* Site */}
              <div className="idc__prop">
                <div className="idc__prop-label">Site</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span>{issue.siteName || 'Not specified'}</span>
                    {issue.siteId && (
                      <button
                        type="button"
                        className="idc__history-link"
                        onClick={() => navigate('/issue-tracker/tickets', {
                          state: { applyFilters: { siteId: issue.siteId }, filterLabel: `Site: ${issue.siteName}` }
                        })}
                      >
                        <i className="fa-light fa-rotate-left"></i>
                        View History
                      </button>
                    )}
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>

              {/* Vehicle */}
              <div className="idc__prop">
                <div className="idc__prop-label">Vehicle</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span>{issue.vehicleHyoungNo || issue.vehicleNumber || 'Not linked'}</span>
                    {issue.vehicleId && (
                      <button
                        type="button"
                        className="idc__history-link"
                        onClick={() => navigate('/issue-tracker/tickets', {
                          state: { applyFilters: { vehicleId: issue.vehicleId }, filterLabel: `Vehicle: ${issue.vehicleHyoungNo || issue.vehicleNumber}` }
                        })}
                      >
                        <i className="fa-light fa-rotate-left"></i>
                        View History
                      </button>
                    )}
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>

              {/* Tags */}
              {issueTagNames.length > 0 && (
                <div className="idc__prop">
                  <div className="idc__prop-label">Tags</div>
                  <div className="idc__prop-value">
                    <div className="idc__prop-inner idc__prop-inner--wrap">
                      {issueTagNames.map((tag) => (
                        <span key={tag} className="idc__tag-chip">
                          <i className="fa-light fa-tag"></i>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <i className="fa-light fa-chevron-down idc__chevron"></i>
                  </div>
                </div>
              )}

              {/* Device (if present) */}
              {(issue.deviceId || issue.deviceTypeName) && (
                <div className="idc__prop">
                  <div className="idc__prop-label">Device</div>
                  <div className="idc__prop-value">
                    <div className="idc__prop-inner">
                      <span>{issue.deviceTypeName || `Device #${issue.deviceId}`}</span>
                      {issue.deviceId && (
                        <button
                          type="button"
                          className="idc__history-link"
                          onClick={() => navigate('/issue-tracker/tickets', {
                            state: { applyFilters: { deviceId: issue.deviceId }, filterLabel: `Device: ${issue.deviceTypeName || issue.deviceId}` }
                          })}
                        >
                          <i className="fa-light fa-rotate-left"></i>
                          View History
                        </button>
                      )}
                    </div>
                    <i className="fa-light fa-chevron-down idc__chevron"></i>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="idc__col">
              {/* Opened By */}
              <div className="idc__prop">
                <div className="idc__prop-label">
                  Opened By
                  <i className="fa-light fa-circle-info idc__info-icon" title="The user who created this issue"></i>
                </div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span className="idc__avatar idc__avatar--blue">{openerInitial}</span>
                    <div>
                      <div className="idc__prop-name">{issue.openbyUserName || 'Unknown'}</div>
                      {issue.openbyEmail && <div className="idc__prop-sub">{issue.openbyEmail}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority / Severity */}
              <div className="idc__prop">
                <div className="idc__prop-label">Severity</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <span className={`idc__priority-dot idc__priority-dot--${(priorityDisplay || '').toLowerCase().replace(/\s+/g, '-')}`}></span>
                    <span>{priorityDisplay || 'â€”'}</span>
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>

              {/* Opened date */}
              <div className="idc__prop">
                <div className="idc__prop-label">Opened</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <i className="fa-light fa-clock idc__row-icon"></i>
                    {formatDateTime(issue.openDate)}
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className={`idc__prop ${dueDateUrgency ? `idc__prop--due-${dueDateUrgency}` : ''}`}>
                <div className="idc__prop-label">Due Date</div>
                <div className="idc__prop-value">
                  <div className="idc__prop-inner">
                    <i className="fa-light fa-clock idc__row-icon"></i>
                    {issue.dueDate ? formatDateTime(issue.dueDate) : 'â€”'}
                    {dueDateUrgency && (
                      <span className={`idc__due-pill idc__due-pill--${dueDateUrgency}`}>
                        {dueDateUrgency === 'overdue' ? 'Overdue' : 'Due soon'}
                      </span>
                    )}
                  </div>
                  <i className="fa-light fa-chevron-down idc__chevron"></i>
                </div>
              </div>

              {/* Template / Classification */}
              {issue.templateName && (
                <div className="idc__prop">
                  <div className="idc__prop-label">Template</div>
                  <div className="idc__prop-value">
                    <div className="idc__prop-inner">{issue.templateName}</div>
                    <i className="fa-light fa-chevron-down idc__chevron"></i>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Completion / Closing banners */}
        {issue.completionNotes && (
          <div className="idc__banner idc__banner--success">
            <i className="fa-light fa-circle-check"></i>
            <div>
              <p className="idc__banner-label">Completion Notes</p>
              <p className="idc__banner-text">{issue.completionNotes}</p>
            </div>
          </div>
        )}
        {issue.closingNotes && (
          <div className="idc__banner idc__banner--warn">
            <i className="fa-light fa-lock"></i>
            <div>
              <p className="idc__banner-label">Closing Notes</p>
              <p className="idc__banner-text">{issue.closingNotes}</p>
            </div>
          </div>
        )}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TABS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
              <IssueActivityHeatmap
                dates={heatmapDates}
                weeks={26}
                title={`Vehicle Issue Activity (${vehicleIssues.length} issues)`}
                highlightDate={issue?.openDate}
                colorScheme="blue"
                showSummary={true}
              />
            </div>
          )}
          {selectedTabIndex === 1 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-purple-600"></i>
                  Activity Stream
                </h2>
                <span className="tw-text-xs tw-text-gray-500">Issue timeline and updates</span>
              </div>
              <IssueActivityStream issueId={id} onRefresh={handleActivityRefreshCallback} />
            </div>
          )}
          {selectedTabIndex === 2 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-clipboard-check tw-mr-2 tw-text-green-600"></i>
                  Completion Records
                </h2>
                <span className="tw-text-xs tw-text-gray-500">Structured actions recorded during completion</span>
              </div>
              <IssueCompletionRecords issueId={id} />
            </div>
          )}
          {selectedTabIndex === 3 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-link tw-mr-2 tw-text-indigo-600"></i>
                  Linked Issues
                </h2>
                <span className="tw-text-xs tw-text-gray-500">Issues using the same template or category</span>
              </div>
              <LinkedIssuesGrid issueId={id} currentIssue={issue} />
            </div>
          )}
          {selectedTabIndex === 4 && (
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-paperclip tw-mr-2 tw-text-teal-600"></i>
                  Attachments
                </h2>
                <span className="tw-text-xs tw-text-gray-500">Installation photos, calibration docs, and general files</span>
              </div>
              {/* Upload */}
              <div className="tw-border tw-border-dashed tw-border-gray-300 tw-rounded-lg tw-p-4 tw-mb-6">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                  <div>
                    <label htmlFor="attach-category" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">Category</label>
                    <select
                      id="attach-category"
                      className="tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                    >
                      {ATTACHMENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="tw-flex-1">
                    <label htmlFor="attach-file" className="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-mb-1">Select File(s)</label>
                    <input
                      id="attach-file"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
                      className="tw-text-sm tw-text-gray-700"
                      onChange={handleFileUpload}
                      disabled={isUploading || !canUploadAttachments}
                    />
                    {!canUploadAttachments && (
                      <p className="tw-text-xs tw-text-amber-600 tw-mt-1">
                        <i className="fa-light fa-lock tw-mr-1"></i>Closed issues do not allow new attachments.
                      </p>
                    )}
                  </div>
                  {isUploading && (
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600">
                      <LoadIndicator height={20} width={20} />
                      <span>Uploadingâ€¦</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Attachment list */}
              {attachmentsLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
                  <LoadIndicator /><span className="tw-ml-2 tw-text-gray-500">Loading attachmentsâ€¦</span>
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
                          {att.attachmentCategory} &middot; {formatFileSize(att.fileSize)} &middot; {att.uploadedByUserName || att.uploadedBy} &middot; {formatDateTime(att.uploadedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="tw-text-blue-600 hover:tw-text-blue-800 tw-text-sm tw-flex tw-items-center tw-gap-2 disabled:tw-opacity-60"
                        onClick={() => handleDownloadAttachment(att)}
                        disabled={downloadingAttachmentId === att.id}
                      >
                        {downloadingAttachmentId === att.id ? <><LoadIndicator height={16} width={16} /><span>Downloadingâ€¦</span></> : <><i className="fa-light fa-download"></i><span>Download</span></>}
                      </button>
                      <button type="button" className="tw-text-red-500 hover:tw-text-red-700" onClick={() => handleDeleteAttachment(att.id, att.fileName)}>
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

      {/* â”€â”€â”€ Popups â”€â”€â”€ */}
      <IssueActionPopup
        visible={showCompletePopup}
        onHide={() => setShowCompletePopup(false)}
        onConfirm={handleQuickMarkComplete}
        title="Mark Issue as Complete"
        subtitle="This will update the status and notify the issue opener."
        confirmText="Mark Complete"
        confirmIcon="fa-light fa-circle-check"
        confirmType="success"
        placeholder="Enter completion notesâ€¦"
        isProcessing={isSaving}
        icon="fa-light fa-circle-check"
        iconColor="tw-text-green-600"
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
        placeholder="Enter closing / approval notesâ€¦"
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
    </div>
  );
};

export default IssueTrackerDetailPage;
