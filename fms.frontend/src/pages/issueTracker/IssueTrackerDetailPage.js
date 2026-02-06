/**
 * File: IssueTrackerDetailPage.js
 * Purpose: Displays detailed issue information with tabs for Activity Stream, Linked Issues,
 *          inline edit mode, vehicle timeline histogram, and print/share functionality
 * Dependencies: React, react-router-dom, DevExtreme chart/button/load-indicator/tabs, issueTrackerService
 * Last Modified: 2026-02-05
 *
 * Key Functions/Components:
 * - IssueTrackerDetailPage: Issue detail screen with tabbed interface
 * - Overview Tab: Issue details, timeline histogram, quick actions
 * - Activity Stream Tab: Chronological activity log with timeline display
 * - Linked Issues Tab: DataGrid of issues with same template/category
 * - Print/Share: Popup dialog for printing issue details with activity stream
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import TabPanel, { Item as TabItem } from 'devextreme-react/tab-panel';
import {
  Chart,
  Series,
  CommonSeriesSettings,
  ArgumentAxis,
  ValueAxis,
  Tooltip,
  Legend
} from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../services/issueTrackerService';
import IssuePriorityBadge from './components/IssuePriorityBadge';
import IssueStatusIndicator from './components/IssueStatusIndicator';
import IssueActivityStream from './components/IssueActivityStream';
import LinkedIssuesGrid from './components/LinkedIssuesGrid';
import IssuePrintPopup from './components/IssuePrintPopup';
import './styles/IssueTrackerDetailPage.scss';

const TIMELINE_DAYS_WINDOW = 14;

const parseDateSafe = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const toLocalDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    if (!editData.problemTitle.trim() || !editData.problemDescription.trim()) {
      notify({
        message: 'Title and description are required.',
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

  const timelineHistogramData = useMemo(() => {
    if (!issue) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [];
    const bucketCountByDay = {};

    for (let dayOffset = TIMELINE_DAYS_WINDOW - 1; dayOffset >= 0; dayOffset -= 1) {
      const bucketDate = new Date(today);
      bucketDate.setDate(today.getDate() - dayOffset);

      const key = toLocalDateKey(bucketDate);
      buckets.push({
        key,
        label: bucketDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: 0,
        isCurrentIssueDay: false
      });
      bucketCountByDay[key] = 0;
    }

    vehicleIssues.forEach((vehicleIssue) => {
      const openedDate = parseDateSafe(vehicleIssue.openDate);
      if (!openedDate) {
        return;
      }

      const dayKey = toLocalDateKey(openedDate);
      if (Object.prototype.hasOwnProperty.call(bucketCountByDay, dayKey)) {
        bucketCountByDay[dayKey] += 1;
      }
    });

    const currentIssueOpenedDate = parseDateSafe(issue.openDate);
    const currentIssueDayKey = currentIssueOpenedDate ? toLocalDateKey(currentIssueOpenedDate) : null;

    return buckets.map((bucket) => ({
      ...bucket,
      count: bucketCountByDay[bucket.key] ?? 0,
      isCurrentIssueDay: Boolean(currentIssueDayKey && currentIssueDayKey === bucket.key)
    }));
  }, [issue, vehicleIssues]);

  const timelineEvents = useMemo(() => {
    if (!issue) {
      return [];
    }

    const events = [
      {
        label: 'Issue Opened',
        value: issue.openDate,
        icon: 'fa-light fa-circle-plus',
        accentClass: 'tw-text-green-600'
      },
      {
        label: 'Last Updated',
        value: issue.lastModfield,
        icon: 'fa-light fa-pen-to-square',
        accentClass: 'tw-text-blue-600'
      },
      {
        label: 'Due Date',
        value: issue.dueDate,
        icon: 'fa-light fa-calendar-clock',
        accentClass: 'tw-text-orange-600'
      },
      {
        label: 'Closed',
        value: issue.closingDate,
        icon: 'fa-light fa-circle-check',
        accentClass: 'tw-text-gray-600'
      }
    ]
      .filter((event) => Boolean(event.value))
      .map((event) => ({ ...event, parsedDate: parseDateSafe(event.value) }))
      .filter((event) => Boolean(event.parsedDate))
      .sort((left, right) => left.parsedDate - right.parsedDate);

    return events;
  }, [issue]);

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

  // Tab change handler
  const handleTabChange = useCallback((e) => {
    setSelectedTabIndex(e.component.option('selectedIndex'));
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

  const handleQuickMarkComplete = async () => {
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
      await issueTrackerService.markIssueComplete(issue.id);
      const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
      setIssue(refreshedIssue);
      initializeEditData(refreshedIssue);
      setIsEditMode(false);
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
    <div className="tw-space-y-6">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-3">
        <div>
          <p className="tw-text-sm tw-text-gray-500">Issue #{issue.id}</p>
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">{issue.problemTitle || 'Untitled Issue'}</h1>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {!isEditMode && (
            <>
              <Button
                text={isFollowing ? 'Following' : 'Follow'}
                icon={isFollowing ? 'fa-light fa-bell-on' : 'fa-light fa-bell'}
                stylingMode={isFollowing ? 'contained' : 'outlined'}
                type={isFollowing ? 'success' : 'default'}
                onClick={handleToggleFollow}
                disabled={isFollowLoading}
                hint={isFollowing ? 'Click to unfollow and stop receiving notifications' : 'Follow this issue to receive activity notifications'}
              />
              <Button
                text="Print / Share"
                icon="fa-light fa-print"
                stylingMode="outlined"
                onClick={() => setShowPrintPopup(true)}
              />
              <Button
                text={isAlreadyComplete ? 'Completed' : 'Mark as Complete'}
                icon="fa-light fa-circle-check"
                stylingMode="outlined"
                onClick={handleQuickMarkComplete}
                disabled={isSaving || isAlreadyComplete}
              />
              <Button
                text={isAlreadyHigh ? 'Priority: High' : 'Change to High'}
                icon="fa-light fa-arrow-up"
                stylingMode="outlined"
                onClick={handleQuickMarkHighPriority}
                disabled={isSaving || isAlreadyHigh}
              />
            </>
          )}
          <Button
            text="Back to Tickets"
            icon="fa-light fa-arrow-left"
            stylingMode="outlined"
            onClick={() => navigate('/issue-tracker/tickets')}
          />
          {isEditMode ? (
            <>
              <Button
                text="Cancel"
                icon="fa-light fa-xmark"
                stylingMode="outlined"
                onClick={handleCancelEdit}
                disabled={isSaving}
              />
              <Button
                text={isSaving ? 'Saving...' : 'Save Changes'}
                icon="fa-light fa-floppy-disk"
                type="default"
                stylingMode="contained"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="tw-bg-blue-600 tw-text-white"
              />
            </>
          ) : (
            <Button
              text="Edit Issue"
              icon="fa-light fa-pen-to-square"
              type="default"
              stylingMode="contained"
              onClick={handleEnableEditMode}
              className="tw-bg-blue-600 tw-text-white"
            />
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
              <textarea
                id="issue-description"
                rows={5}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-text-gray-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 focus:tw-border-blue-500 tw-whitespace-pre-wrap"
                value={editData.problemDescription}
                onChange={(event) => handleEditFieldChange('problemDescription', event.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-3">
              {issue.problemTitle || 'Untitled Issue'}
            </h2>
            <p className="tw-text-gray-700 tw-leading-relaxed tw-whitespace-pre-wrap">
              {issue.problemDescription || 'No description provided.'}
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
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm">
        <TabPanel
          selectedIndex={selectedTabIndex}
          onOptionChanged={handleTabChange}
          animationEnabled={true}
          swipeEnabled={false}
          className="issue-detail-tabs"
        >
          {/* Overview Tab */}
          <TabItem title="Overview" icon="fa-light fa-info-circle">
            <div className="tw-p-6 tw-space-y-6">
              {/* Vehicle Issue Timeline Histogram */}
              <div>
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-4">
                  <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                    <i className="fa-light fa-chart-column tw-mr-2 tw-text-blue-600"></i>
                    Vehicle Issue Timeline Histogram (Last {TIMELINE_DAYS_WINDOW} Days)
                  </h2>
                  <span className="tw-text-xs tw-text-gray-500">
                    Current issue open day is highlighted in orange
                  </span>
                </div>

                <Chart dataSource={timelineHistogramData} height={300}>
                  <CommonSeriesSettings argumentField="label" type="bar" />
                  <Series
                    valueField="count"
                    name="Issues Opened"
                    color="#60a5fa"
                    customizePoint={(point) => (point.data.isCurrentIssueDay ? { color: '#f97316' } : null)}
                  />
                  <ArgumentAxis />
                  <ValueAxis allowDecimals={false} />
                  <Legend visible={false} />
                  <Tooltip
                    enabled={true}
                    customizeTooltip={(pointInfo) => ({
                      text: `${pointInfo.argument}: ${pointInfo.valueText} issue(s) opened`
                    })}
                  />
                </Chart>
              </div>

              {/* Issue Timeline Events */}
              <div>
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
                  <i className="fa-light fa-timeline tw-mr-2 tw-text-orange-600"></i>
                  Issue Timeline
                </h2>

                {timelineEvents.length === 0 ? (
                  <p className="tw-text-sm tw-text-gray-500">No timeline events are available yet.</p>
                ) : (
                  <div className="tw-space-y-3">
                    {timelineEvents.map((event) => (
                      <div key={`${event.label}-${event.value}`} className="tw-flex tw-items-start tw-gap-3 tw-border-b tw-border-gray-100 tw-pb-3">
                        <div className={`tw-w-8 tw-h-8 tw-rounded-full tw-bg-gray-100 tw-flex tw-items-center tw-justify-center ${event.accentClass}`}>
                          <i className={event.icon}></i>
                        </div>
                        <div>
                          <p className="tw-font-medium tw-text-gray-800">{event.label}</p>
                          <p className="tw-text-sm tw-text-gray-500">{formatDateTime(event.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabItem>

          {/* Activity Stream Tab */}
          <TabItem title="Activity Stream" icon="fa-light fa-clock-rotate-left">
            <div className="tw-p-6">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-purple-600"></i>
                  Activity Stream
                </h2>
                <span className="tw-text-xs tw-text-gray-500">
                  All changes and updates to this issue
                </span>
              </div>
              <IssueActivityStream issueId={id} onRefresh={handleActivityRefreshCallback} />
            </div>
          </TabItem>

          {/* Linked Issues Tab */}
          <TabItem title="Linked Issues" icon="fa-light fa-link">
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
          </TabItem>
        </TabPanel>
      </div>

      {/* Print/Share Popup */}
      <IssuePrintPopup
        visible={showPrintPopup}
        onHide={() => setShowPrintPopup(false)}
        issue={{
          id: issue.id,
          title: issue.problemTitle,
          description: issue.problemDescription,
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
