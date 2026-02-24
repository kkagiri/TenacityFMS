/**
 * File: useIssueDetail.js
 * Purpose: Custom hook encapsulating all state, data-fetching, and handlers for the Issue Detail page
 * Dependencies: React, react-router-dom, redux, issueTrackerService, issueDetailUtils
 * Last Modified: 2026-02-23
 *
 * Key Exports:
 * - useIssueDetail(): Returns issue state, computed values, edit/action/attachment handlers
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';
import useIssueAttachments from './useIssueAttachments';
import { normalizeIssueDisplay } from '../utils/issueDisplayUtils';
import { normalizeCollection } from '../forms/issueCreateFormUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import { fetchUsers } from '../../../redux/actions/userActions';
import {
    toDateInputValue,
    toNullableInt,
    getCategoryLabel,
    getPriorityLabel,
    getStatusLabel,
    normalizeIssueTags,
    findStatusByKeywords,
    findPriorityByKeywords,
    includesKeyword,
    normalizeIssueListResponse,
    normalizeLookupResponse,
    ISSUE_DELETE_PERMISSION
} from './issueDetailUtils';

const useIssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { hasRole, hasPermission } = usePermissions();
    const canDeleteIssue = hasRole('Admin') || hasPermission(ISSUE_DELETE_PERMISSION);

    // Redux selectors
    const usersState = useSelector((state) => state.user?.users);
    const vehiclesState = useSelector((state) => state.vehicle?.vehicles);
    const users = useMemo(() => normalizeCollection(usersState), [usersState]);
    const vehicles = useMemo(() => normalizeCollection(vehiclesState), [vehiclesState]);

    // Core state
    const [loading, setLoading] = useState(true);
    const [issue, setIssue] = useState(null);
    const [vehicleIssues, setVehicleIssues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState(null);

    // Tab & Print states
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

    const [isClosing, setIsClosing] = useState(false);

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

    // Normalized display issue
    const displayIssue = useMemo(() => normalizeIssueDisplay(issue), [issue]);

    // ===== INIT / LOAD =====
    const initializeEditData = useCallback((issueData) => {
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
    }, []);

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
                    notify({ message: 'Unable to load issue details.', type: 'error', displayTime: 3000 });
                }
                setIssue(null);
            } finally {
                setLoading(false);
            }
        };
        loadIssueDetails();
    }, [id, initializeEditData]);

    // Fetch users for reassign popup
    useEffect(() => {
        if (!usersState || (Array.isArray(usersState) && usersState.length === 0)) {
            dispatch(fetchUsers());
        }
    }, [dispatch, usersState]);

    // ===== ACTIVITY REFRESH =====
    const handleActivityRefreshCallback = useCallback((refreshFn) => {
        setActivityRefreshFn(() => refreshFn);
    }, []);

    const refreshActivityStream = useCallback(() => {
        if (activityRefreshFn) activityRefreshFn();
    }, [activityRefreshFn]);

    // ===== EDIT HANDLERS =====
    const handleEditFieldChange = useCallback((fieldName, value) => {
        setEditData((prev) => ({ ...prev, [fieldName]: value }));
    }, []);

    const handleEnableEditMode = useCallback(() => {
        initializeEditData(issue);
        setIsEditMode(true);
    }, [issue, initializeEditData]);

    const handleCancelEdit = useCallback(() => {
        initializeEditData(issue);
        setIsEditMode(false);
    }, [issue, initializeEditData]);

    const handleSaveEdit = useCallback(async () => {
        if (!issue || !editData) return;
        if (!editData.problemTitle.trim()) {
            notify({ message: 'Title is required.', type: 'warning', displayTime: 3000 });
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
            refreshActivityStream();
        } catch (error) {
            console.error(`Error updating issue ${issue.id}:`, error);
            notify({ message: 'Unable to save issue changes.', type: 'error', displayTime: 3000 });
        } finally {
            setIsSaving(false);
        }
    }, [issue, editData, initializeEditData, refreshActivityStream]);

    // ===== FOLLOW =====
    const handleToggleFollow = useCallback(async () => {
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
            refreshActivityStream();
        } catch (error) {
            console.error('Error toggling follow status:', error);
            notify({ message: error?.message || 'Unable to update follow preference.', type: 'error', displayTime: 3000 });
        } finally {
            setIsFollowLoading(false);
        }
    }, [issue, isFollowing, refreshActivityStream]);

    // ===== QUICK UPDATE =====
    const updateIssueWithOverrides = useCallback(async (overrides = {}) => {
        if (!issue) return;
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
            notify({ message: 'Unable to apply quick update.', type: 'error', displayTime: 3000 });
        } finally {
            setIsSaving(false);
        }
    }, [issue, initializeEditData]);

    // ===== COMPUTED VALUES =====
    const heatmapDates = useMemo(() => vehicleIssues.map((vi) => vi.openDate).filter(Boolean), [vehicleIssues]);

    const priorityDisplay = issue?.priorityName || (issue?.priority !== null && issue?.priority !== undefined ? `Priority ${issue.priority}` : null);
    const statusDisplay = issue?.statusName || (issue?.status !== null && issue?.status !== undefined ? `Status ${issue.status}` : null);

    const editingPriorityDisplay = useMemo(() => {
        if (!isEditMode || !editData) return priorityDisplay;
        const selectedPriority = priorities.find((item) => item.id === editData.priority);
        return getPriorityLabel(selectedPriority) || priorityDisplay;
    }, [isEditMode, editData, priorities, priorityDisplay]);

    const editingStatusDisplay = useMemo(() => {
        if (!isEditMode || !editData) return statusDisplay;
        const selectedStatus = statuses.find((item) => item.id === editData.status);
        return getStatusLabel(selectedStatus) || statusDisplay;
    }, [isEditMode, editData, statuses, statusDisplay]);

    const editingCategoryDisplay = useMemo(() => {
        if (!isEditMode || !editData) return normalizeIssueTags(issue).join(', ');
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
        if (!issue) return '';
        if (issue.statusName) return issue.statusName;
        const matchedStatus = statuses.find((s) => s.id === issue.status);
        return getStatusLabel(matchedStatus) || '';
    }, [issue, statuses]);

    const isAlreadyClosed = useMemo(() => {
        if (!issue) return false;
        if (closedStatusOption && issue.status === closedStatusOption.id) return true;
        return includesKeyword(currentStatusLabel, ['close', 'closed']);
    }, [issue, closedStatusOption, currentStatusLabel]);

    const isAlreadyComplete = useMemo(() => {
        if (!issue || isAlreadyClosed) return false;
        if (completeStatusOption && issue.status === completeStatusOption.id) return true;
        return includesKeyword(currentStatusLabel, ['complete', 'completed', 'resolved', 'done']);
    }, [issue, completeStatusOption, currentStatusLabel, isAlreadyClosed]);

    const isTerminalStatus = isAlreadyClosed || isAlreadyComplete;
    const isAlreadyHigh = Boolean(highPriorityOption && issue?.priority === highPriorityOption.id);
    const canUploadAttachments = !isAlreadyClosed;

    const priorityAccentClass = useMemo(() => {
        const p = (priorityDisplay || '').toLowerCase();
        if (p.includes('critical')) return 'ihc__accent--critical';
        if (p.includes('high')) return 'ihc__accent--high';
        if (p.includes('medium') || p.includes('med')) return 'ihc__accent--medium';
        if (p.includes('low')) return 'ihc__accent--low';
        return 'ihc__accent--default';
    }, [priorityDisplay]);

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

    // ===== ATTACHMENTS (delegated to useIssueAttachments) =====
    const {
        attachments, attachmentsLoading, uploadCategory, setUploadCategory,
        isUploading, downloadingAttachmentId,
        handleFileUpload, handleDeleteAttachment, handleDownloadAttachment
    } = useIssueAttachments(id, issue, refreshActivityStream);

    // ===== TAB ITEMS =====
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
        if (typeof e.itemIndex === 'number') setSelectedTabIndex(e.itemIndex);
    }, []);

    // ===== ACTION HANDLERS =====
    const handleQuickMarkComplete = useCallback(async (notes) => {
        if (isAlreadyClosed || isAlreadyComplete) return;
        if (!completeStatusOption) {
            notify({ message: 'No complete/closed status configured.', type: 'warning', displayTime: 3000 });
            return;
        }
        try {
            setIsSaving(true);
            await issueTrackerService.markIssueComplete(issue.id, notes || null);
            const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
            setIssue(refreshedIssue);
            initializeEditData(refreshedIssue);
            setIsEditMode(false);
            setShowCompletePopup(false);
            refreshActivityStream();
        } catch (error) {
            console.error(`Error marking issue ${issue.id} as complete:`, error);
            notify({ message: 'Unable to mark issue as complete.', type: 'error', displayTime: 3000 });
        } finally {
            setIsSaving(false);
        }
    }, [issue, isAlreadyClosed, isAlreadyComplete, completeStatusOption, initializeEditData, refreshActivityStream]);

    const handleCompletionWithActionsSuccess = useCallback(async () => {
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
    }, [issue, initializeEditData, refreshActivityStream]);

    const handleReassignSuccess = useCallback(async () => {
        try {
            const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
            setIssue(refreshedIssue);
            initializeEditData(refreshedIssue);
            setShowReassignPopup(false);
            refreshActivityStream();
            notify({ message: 'Issue reassigned successfully.', type: 'success', displayTime: 3000 });
        } catch (error) {
            console.error('Error refreshing after reassignment:', error);
        }
    }, [issue, initializeEditData, refreshActivityStream]);

    const handleOpenCompletePopup = useCallback(() => {
        setShowCompletionWithActionsPopup(true);
    }, []);

    const handleQuickMarkHighPriority = useCallback(async () => {
        if (isAlreadyClosed || isAlreadyComplete) return;
        if (!highPriorityOption) {
            notify({ message: 'No high priority option configured.', type: 'warning', displayTime: 3000 });
            return;
        }
        try {
            setIsSaving(true);
            await issueTrackerService.escalateIssuePriority(issue.id);
            const refreshedIssue = await issueTrackerService.getIssueById(issue.id);
            setIssue(refreshedIssue);
            initializeEditData(refreshedIssue);
            setIsEditMode(false);
            refreshActivityStream();
        } catch (error) {
            console.error(`Error escalating issue ${issue.id} priority:`, error);
            notify({ message: 'Unable to escalate issue priority.', type: 'error', displayTime: 3000 });
        } finally {
            setIsSaving(false);
        }
    }, [issue, isAlreadyClosed, isAlreadyComplete, highPriorityOption, initializeEditData, refreshActivityStream]);

    // ===== CLOSE / DELETE =====
    const handleCloseIssue = useCallback(async (notes) => {
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
    }, [issue, initializeEditData, refreshActivityStream]);

    const handleDeleteIssue = useCallback(async () => {
        if (!issue?.id) return;
        if (isAlreadyClosed) {
            notify({ message: 'Closed issues cannot be deleted.', type: 'warning', displayTime: 3000 });
            return;
        }
        const shouldDelete = window.confirm(`Are you sure you want to delete issue #${issue.id}? This action cannot be undone.`);
        if (!shouldDelete) return;
        try {
            setIsSaving(true);
            await issueTrackerService.deleteIssue(issue.id);
            navigate('/issue-tracker/tickets');
        } catch (error) {
            notify({ message: error?.message || 'Unable to delete issue.', type: 'error', displayTime: 3000 });
        } finally {
            setIsSaving(false);
        }
    }, [issue, isAlreadyClosed, navigate]);

    // ===== RETURN =====
    return {
        // Route
        id, navigate,
        // Core data
        loading, issue, displayIssue, vehicleIssues,
        // Lookups
        categories, priorities, statuses,
        users, vehicles,
        // Edit
        isEditMode, isSaving, editData,
        handleEditFieldChange, handleEnableEditMode, handleCancelEdit, handleSaveEdit,
        // Follow
        isFollowing, isFollowLoading, handleToggleFollow,
        // Computed
        priorityDisplay, statusDisplay,
        editingPriorityDisplay, editingStatusDisplay, editingCategoryDisplay,
        issueTagNames, heatmapDates,
        priorityAccentClass, dueDateUrgency,
        isAlreadyClosed, isAlreadyComplete, isTerminalStatus, isAlreadyHigh,
        canUploadAttachments, canDeleteIssue,
        // Tabs
        tabItems, selectedTabIndex, renderTabItem, handleTabSelectionChange,
        // Popups
        showCompletePopup, setShowCompletePopup,
        showClosePopup, setShowClosePopup,
        showReassignPopup, setShowReassignPopup,
        showCompletionWithActionsPopup, setShowCompletionWithActionsPopup,
        showPrintPopup, setShowPrintPopup,
        // Actions
        handleQuickMarkComplete, handleCompletionWithActionsSuccess,
        handleReassignSuccess, handleOpenCompletePopup, handleQuickMarkHighPriority,
        handleCloseIssue, handleDeleteIssue,
        // Actions dropdown
        actionsDropdownOpen, setActionsDropdownOpen, actionsDropdownRef,
        // Attachments
        attachments, attachmentsLoading, uploadCategory, setUploadCategory,
        isUploading, isClosing, downloadingAttachmentId,
        handleFileUpload, handleDeleteAttachment, handleDownloadAttachment,
        // Activity
        handleActivityRefreshCallback
    };
};

export default useIssueDetail;
