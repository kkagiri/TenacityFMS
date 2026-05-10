import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import {
  fetchIssues,
  fetchIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  fetchDashboardStats,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses,
  setCurrentIssue,
  clearCurrentIssue,
  setFilters,
  clearFilters,
  setSelectedIssues,
  clearSelectedIssues,
  clearError,
  bulkAssignIssues,
  bulkUpdateStatus
} from '../redux/actions/issueTrackerActions';

/**
 * Custom hook for Issue Tracker operations
 * Provides centralized access to issue-related state and operations
 */
const useIssueTracker = () => {
  const dispatch = useDispatch();

  // Select state from Redux store
  const issueTrackerState = useSelector(state => state.issueTracker);

  const {
    issues,
    currentIssue,
    vehicleIssues,
    totalCount,
    categories,
    priorities,
    statuses,
    analytics,
    dashboardStats,
    filters,
    selectedIssues,
    formData,
    formErrors,
    isFormDirty,
    loading,
    error,
    operationErrors,
    successMessage,
    exportData,
    lastUpdate,
    notifications
  } = issueTrackerState;

  // Memoized computed values
  const computedValues = useMemo(() => {
    return {
      // Statistics
      openIssuesCount: issues.filter(issue => issue.status === 'Open').length,
      criticalIssuesCount: issues.filter(issue => issue.priority === 'Critical').length,
      unassignedIssuesCount: issues.filter(issue => !issue.assignedTo).length,

      // Filtering
      hasActiveFilters: Object.values(filters).some(value =>
        value !== null && value !== '' && value !== undefined
      ),

      // Loading states
      isLoadingAny: Object.values(loading).some(isLoading => isLoading),

      // Selection
      hasSelectedIssues: selectedIssues.length > 0,
      selectedIssuesCount: selectedIssues.length,

      // Validation
      hasErrors: Object.keys(formErrors).length > 0 || !!error,

      // Reference data availability
      hasReferenceData: categories.length > 0 && priorities.length > 0 && statuses.length > 0
    };
  }, [issues, filters, loading, selectedIssues, formErrors, error, categories, priorities, statuses]);

  // CRUD Operations
  const operations = useMemo(() => ({

    // Fetch operations
    loadIssues: (queryFilters = {}) => dispatch(fetchIssues(queryFilters)),
    loadIssueById: (id) => dispatch(fetchIssueById(id)),
    loadDashboardStats: () => dispatch(fetchDashboardStats()),

    // CRUD operations
    createNewIssue: (issueData) => dispatch(createIssue(issueData)),
    updateExistingIssue: (id, issueData) => dispatch(updateIssue(id, issueData)),
    removeIssue: (id) => dispatch(deleteIssue(id)),

    // Reference data
    loadCategories: () => dispatch(fetchIssueCategories()),
    loadPriorities: () => dispatch(fetchIssuePriorities()),
    loadStatuses: () => dispatch(fetchIssueStatuses()),

    // Bulk operations
    assignIssuesBulk: (bulkData) => dispatch(bulkAssignIssues(bulkData)),
    updateStatusBulk: (bulkData) => dispatch(bulkUpdateStatus(bulkData)),

    // State management
    selectIssue: (issue) => dispatch(setCurrentIssue(issue)),
    clearSelectedIssue: () => dispatch(clearCurrentIssue()),
    updateFilters: (newFilters) => dispatch(setFilters(newFilters)),
    resetFilters: () => dispatch(clearFilters()),
    selectIssues: (issues) => dispatch(setSelectedIssues(issues)),
    clearSelection: () => dispatch(clearSelectedIssues()),
    clearErrorState: () => dispatch(clearError())

  }), [dispatch]);

  // Helper functions
  const helpers = useMemo(() => ({

    // Filter helpers
    applyQuickFilter: (filterType, filterValue) => {
      const newFilters = { ...filters, [filterType]: filterValue };
      dispatch(setFilters(newFilters));
      dispatch(fetchIssues(newFilters));
    },

    // Get issues by status
    getIssuesByStatus: (status) => {
      return issues.filter(issue => issue.status === status);
    },

    // Get issues by priority
    getIssuesByPriority: (priority) => {
      return issues.filter(issue => issue.priority === priority);
    },

    // Get issues by vehicle
    getIssuesByVehicle: (vehicleId) => {
      return vehicleIssues[vehicleId] || [];
    },

    // Check if issue is selected
    isIssueSelected: (issueId) => {
      return selectedIssues.some(issue => issue.id === issueId);
    },

    // Toggle issue selection
    toggleIssueSelection: (issue) => {
      const isSelected = selectedIssues.some(selected => selected.id === issue.id);
      let newSelection;

      if (isSelected) {
        newSelection = selectedIssues.filter(selected => selected.id !== issue.id);
      } else {
        newSelection = [...selectedIssues, issue];
      }

      dispatch(setSelectedIssues(newSelection));
    },

    // Select all visible issues
    selectAllVisible: () => {
      dispatch(setSelectedIssues(issues));
    },

    // Format issue for display
    formatIssueForDisplay: (issue) => {
      return {
        ...issue,
        createdDateFormatted: new Date(issue.createdDate).toLocaleDateString(),
        updatedDateFormatted: issue.updatedDate ? new Date(issue.updatedDate).toLocaleDateString() : null,
        hasGPS: !!(issue.gpsLatitude && issue.gpsLongitude),
        isOverdue: issue.dueDate && new Date(issue.dueDate) < new Date(),
        daysSinceCreated: Math.floor((new Date() - new Date(issue.createdDate)) / (1000 * 60 * 60 * 24))
      };
    },

    // Validation helpers
    validateIssueData: (issueData) => {
      const errors = {};

      if (!issueData.title || issueData.title.trim().length === 0) {
        errors.title = 'Title is required';
      }

      if (!issueData.description || issueData.description.trim().length === 0) {
        errors.description = 'Description is required';
      }

      if (!issueData.priority) {
        errors.priority = 'Priority is required';
      }

      if (!issueData.category) {
        errors.category = 'Category is required';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }

  }), [issues, vehicleIssues, selectedIssues, filters, dispatch]);

  // Initialize reference data on mount
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchIssueCategories());
    }
    if (priorities.length === 0) {
      dispatch(fetchIssuePriorities());
    }
    if (statuses.length === 0) {
      dispatch(fetchIssueStatuses());
    }
  }, [dispatch, categories.length, priorities.length, statuses.length]);

  // Auto-refresh dashboard stats periodically
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      dispatch(fetchDashboardStats());
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [dispatch]);

  // Return the hook interface
  return {
    // State
    issues,
    currentIssue,
    vehicleIssues,
    totalCount,
    categories,
    priorities,
    statuses,
    analytics,
    dashboardStats,
    filters,
    selectedIssues,
    formData,
    formErrors,
    isFormDirty,
    loading,
    error,
    operationErrors,
    successMessage,
    exportData,
    lastUpdate,
    notifications,

    // Computed values
    ...computedValues,

    // Operations
    ...operations,

    // Helpers
    ...helpers
  };
};

export default useIssueTracker;
