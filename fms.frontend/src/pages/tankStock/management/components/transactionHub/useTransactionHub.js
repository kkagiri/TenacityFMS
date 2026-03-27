/**
 * File: useTransactionHub.js
 * Purpose: Custom hooks for TransactionHub component - data loading, state management
 * Last Modified: 2025-12-01
 *
 * Key Hooks:
 * - useTransactionData: Data loading and filtering
 * - useDeleteTransaction: Delete functionality with validation
 * - useEditTransaction: Edit functionality with form routing
 * - useDataGridGrouping: DataGrid grouping controls
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
import { useStockFilters } from '../../../shared/context/StockFilterContext';
import { fetchTankVolumeHistoryFiltered } from '../../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../../../redux/actions/vehicleActions';
import { fetchEmployees } from '../../../../../redux/actions/employeeActions';
import { fetchUsersForFilter } from '../../../../../redux/actions/userActions';
import { sortTransactions, buildFiltersObject } from './transactionHubUtils';
import { defaultBulkDeleteConfirmationState, defaultDeleteConfirmationState, defaultGroupByState, defaultEditState } from './transactionHubConstants';

// Import service with fallback
let transactionDeleteService;
try {
  transactionDeleteService = require('../../../../../services/transactionDeleteService').default;
} catch (error) {
  console.warn('transactionDeleteService not available:', error.message);
  transactionDeleteService = {
    validateDelete: async () => {
      throw new Error('Delete validation service is not available');
    },
    deleteTransaction: async () => {
      throw new Error('Delete service is not available');
    },
    validateBulkDelete: async () => {
      throw new Error('Bulk delete validation service is not available');
    },
    bulkDeleteTransactions: async () => {
      throw new Error('Bulk delete service is not available');
    }
  };
}

/**
 * Hook for managing transaction data loading and filtering
 */
export const useTransactionData = () => {
  const dispatch = useDispatch();

  // Get shared filters from header
  const { startDate: headerStartDate, endDate: headerEndDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Redux state
  const tankVolumeHistoryRaw = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const isLoading = useSelector((state) => state.tankVolumeHistory.isLoading);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);
  const user = useSelector((state) => state.auth.user);

  // Local filter state
  const [filterUserId, setFilterUserId] = useState(null);
  const [useManualDispensing, setUseManualDispensing] = useState(false);
  const [showGpsVolume, setShowGpsVolume] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sorted transactions
  const tankVolumeHistory = useMemo(() =>
    sortTransactions(tankVolumeHistoryRaw),
    [tankVolumeHistoryRaw]
  );

  // Computed filters object
  const currentFilters = useMemo(() => buildFiltersObject({
    selectedSiteIds,
    selectedTankIds,
    filterUserId,
    headerStartDate,
    headerEndDate,
    useManualDispensing,
    showGpsVolume
  }), [selectedSiteIds, selectedTankIds, filterUserId, headerStartDate, headerEndDate, useManualDispensing, showGpsVolume]);

  // Load transaction data
  const loadTransactionData = useCallback(async (filters) => {
    console.log('Loading transaction data with filters:', filters);
    try {
      const result = await dispatch(fetchTankVolumeHistoryFiltered(filters));
      console.log('Data loaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error loading transaction data:', error);
      throw error;
    }
  }, [dispatch]);

  // Initialize data
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing TransactionHub...');
      dispatch(fetchTanks());
      dispatch(fetchSiteList());
      dispatch(fetchVehicleList());
      dispatch(fetchEmployees());
      dispatch(fetchUsersForFilter());
      dispatch(fetchTankVolumeHistoryFiltered(currentFilters));
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized, currentFilters]);

  // React to header filter changes
  useEffect(() => {
    if (isInitialized) {
      console.log('Header filters changed, reloading data with:', currentFilters);
      dispatch(fetchTankVolumeHistoryFiltered(currentFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds, isInitialized]);

  // React to GPS toggle changes
  useEffect(() => {
    if (isInitialized) {
      console.log('[GPS Volume] Toggle changed, reloading data with includeGpsData:', showGpsVolume);
      dispatch(fetchTankVolumeHistoryFiltered(currentFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGpsVolume, isInitialized]);

  // Apply filters
  const handleApplyFilters = useCallback(async () => {
    console.log('Applying filters:', currentFilters);
    try {
      await loadTransactionData(currentFilters);
      notify({
        message: 'Filters applied successfully!',
        type: 'success',
        displayTime: 2000,
        position: 'top center'
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      notify({
        message: 'Failed to load transaction data. Please try again.',
        type: 'error',
        displayTime: 4000,
        position: 'top center'
      });
    }
  }, [loadTransactionData, currentFilters]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    try {
      await loadTransactionData(currentFilters);
      notify({
        message: 'Data refreshed successfully!',
        type: 'success',
        displayTime: 2000,
        position: 'top center'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      notify({
        message: 'Failed to refresh data. Please try again.',
        type: 'error',
        displayTime: 3000,
        position: 'top center'
      });
    }
  }, [loadTransactionData, currentFilters]);

  // Clear local filters
  const handleClearFilters = useCallback(() => {
    setFilterUserId(null);
    setUseManualDispensing(false);
  }, []);

  return {
    // Data
    tankVolumeHistory,
    tanks,
    sites,
    isLoading,
    usersForFilter,
    user,
    // Filters
    filterUserId,
    setFilterUserId,
    useManualDispensing,
    setUseManualDispensing,
    showGpsVolume,
    setShowGpsVolume,
    currentFilters,
    // Header filters (from context)
    headerStartDate,
    headerEndDate,
    selectedSiteIds,
    selectedTankIds,
    // Actions
    handleApplyFilters,
    handleRefresh,
    handleClearFilters
  };
};

/**
 * Hook for managing delete transaction functionality
 */
export const useDeleteTransaction = (handleRefresh) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState(defaultDeleteConfirmationState);

  // Handle delete initiation
  const handleDeleteTransaction = useCallback(async (transaction) => {
    console.log('Delete transaction initiated:', transaction);

    setDeleteConfirmation({
      ...defaultDeleteConfirmationState,
      visible: true,
      transaction
    });

    setTimeout(async () => {
      try {
        const validation = await transactionDeleteService.validateDelete({
          tankId: transaction.tankId,
          entryDate: transaction.timestamp,
          entryType: transaction.changeReason
        });

        console.log('Delete validation result:', validation);

        if (!validation?.success) {
          throw new Error(validation?.error || 'Validation failed');
        }

        setDeleteConfirmation(prev => ({
          ...prev,
          validationResult: validation.data
        }));

      } catch (error) {
        console.error('Error validating deletion:', error);
        notify({
          message: `Failed to validate deletion: ${error.message}`,
          type: 'error',
          displayTime: 4000,
          position: 'top center'
        });

        setTimeout(() => {
          setDeleteConfirmation(defaultDeleteConfirmationState);
        }, 100);
      }
    }, 50);
  }, []);

  // Execute delete
  const executeDelete = useCallback(async () => {
    const { transaction, userConfirmed, deletionReason } = deleteConfirmation;

    if (!transaction) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      const result = await transactionDeleteService.deleteTransaction(
        transaction.id,
        userConfirmed,
        deletionReason
      );

      if (result?.success) {
        notify({
          message: 'Transaction deleted successfully!',
          type: 'success',
          displayTime: 3000,
          position: 'top center'
        });

        setTimeout(() => {
          setDeleteConfirmation(defaultDeleteConfirmationState);
          setTimeout(() => {
            handleRefresh();
          }, 100);
        }, 100);

      } else {
        throw new Error(result?.error || 'Failed to delete transaction');
      }

    } catch (error) {
      console.error('Error deleting transaction:', error);
      notify({
        message: `Failed to delete transaction: ${error.message}`,
        type: 'error',
        displayTime: 4000,
        position: 'top center'
      });

      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirmation, handleRefresh]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setTimeout(() => {
      setDeleteConfirmation(defaultDeleteConfirmationState);
    }, 50);
  }, []);

  // Toggle details
  const handleToggleDetails = useCallback(() => {
    setDeleteConfirmation(prev => ({
      ...prev,
      showDetails: !prev.showDetails
    }));
  }, []);

  // Update user confirmed
  const handleConfirmChange = useCallback((confirmed) => {
    setDeleteConfirmation(prev => ({
      ...prev,
      userConfirmed: confirmed
    }));
  }, []);

  return {
    deleteConfirmation,
    handleDeleteTransaction,
    executeDelete,
    handleCancelDelete,
    handleToggleDetails,
    handleConfirmChange
  };
};

export const useBulkDeleteTransaction = (handleRefresh, clearSelection) => {
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(defaultBulkDeleteConfirmationState);

  const handleBulkDeleteTransactions = useCallback(async (transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      notify({
        message: 'Select at least one transaction to delete.',
        type: 'warning',
        displayTime: 3000,
        position: 'top center'
      });
      return;
    }

    const transactionIds = transactions
      .map((transaction) => transaction?.id)
      .filter((id) => Number.isFinite(id));

    setBulkDeleteConfirmation({
      ...defaultBulkDeleteConfirmationState,
      visible: true,
      transactions
    });

    setTimeout(async () => {
      try {
        const validation = await transactionDeleteService.validateBulkDelete(transactionIds);

        if (validation?.success) {
          setBulkDeleteConfirmation((prev) => ({
            ...prev,
            validationResult: validation.data
          }));
          return;
        }

        if (validation?.details) {
          setBulkDeleteConfirmation((prev) => ({
            ...prev,
            validationResult: validation.details
          }));
          return;
        }

        throw new Error(validation?.error || 'Bulk validation failed');
      } catch (error) {
        console.error('Error validating bulk delete:', error);
        notify({
          message: `Failed to validate bulk delete: ${error.message}`,
          type: 'error',
          displayTime: 4000,
          position: 'top center'
        });

        setTimeout(() => {
          setBulkDeleteConfirmation(defaultBulkDeleteConfirmationState);
        }, 100);
      }
    }, 50);
  }, []);

  const executeBulkDelete = useCallback(async () => {
    const transactionIds = bulkDeleteConfirmation.transactions
      .map((transaction) => transaction?.id)
      .filter((id) => Number.isFinite(id));

    if (transactionIds.length === 0) {
      return;
    }

    setBulkDeleteConfirmation((prev) => ({ ...prev, isDeleting: true }));

    try {
      const result = await transactionDeleteService.bulkDeleteTransactions(
        transactionIds,
        bulkDeleteConfirmation.userConfirmed
      );

      if (result?.success) {
        notify({
          message: result.data?.summaryMessage || `Deleted ${result.data?.deletedTransactionCount || transactionIds.length} transaction(s) successfully.`,
          type: 'success',
          displayTime: 3500,
          position: 'top center'
        });

        clearSelection?.();
        setBulkDeleteConfirmation(defaultBulkDeleteConfirmationState);
        setTimeout(() => {
          handleRefresh();
        }, 100);
        return;
      }

      if (result?.details) {
        setBulkDeleteConfirmation((prev) => ({
          ...prev,
          isDeleting: false,
          validationResult: result.details
        }));

        notify({
          message: result.error || result.details?.summaryMessage || 'Bulk delete could not be completed.',
          type: 'warning',
          displayTime: 4000,
          position: 'top center'
        });
        return;
      }

      throw new Error(result?.error || 'Failed to delete selected transactions');
    } catch (error) {
      console.error('Error deleting selected transactions:', error);
      notify({
        message: `Failed to delete selected transactions: ${error.message}`,
        type: 'error',
        displayTime: 4000,
        position: 'top center'
      });

      setBulkDeleteConfirmation((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [bulkDeleteConfirmation.transactions, bulkDeleteConfirmation.userConfirmed, clearSelection, handleRefresh]);

  const handleCancelBulkDelete = useCallback(() => {
    setBulkDeleteConfirmation(defaultBulkDeleteConfirmationState);
  }, []);

  const handleBulkConfirmChange = useCallback((confirmed) => {
    setBulkDeleteConfirmation((prev) => ({
      ...prev,
      userConfirmed: confirmed
    }));
  }, []);

  return {
    bulkDeleteConfirmation,
    handleBulkDeleteTransactions,
    executeBulkDelete,
    handleCancelBulkDelete,
    handleBulkConfirmChange
  };
};

/**
 * Hook for managing edit transaction functionality
 * Opens the appropriate form based on transaction type
 */
export const useEditTransaction = (handleRefresh) => {
  const [editState, setEditState] = useState(defaultEditState);

  // Non-editable transaction types
  const NON_EDITABLE_TYPES = [7, 8, 9]; // AutomatedDispensing, Reconciliation, AutomatedReconciliation

  // Check if transaction is editable
  const isTransactionEditable = useCallback((transaction) => {
    if (!transaction) return false;
    return !NON_EDITABLE_TYPES.includes(transaction.changeReason);
  }, []);

  // Handle edit initiation
  const handleEditTransaction = useCallback((transaction) => {
    console.log('Edit transaction initiated:', transaction);

    if (!isTransactionEditable(transaction)) {
      notify({
        message: 'This transaction type cannot be edited.',
        type: 'warning',
        displayTime: 3000,
        position: 'top center'
      });
      return;
    }

    setEditState({
      visible: true,
      transaction,
      isLoading: false
    });
  }, [isTransactionEditable]);

  // Handle successful edit
  const handleEditSuccess = useCallback((updatedData) => {
    console.log('Edit successful:', updatedData);

    setEditState(defaultEditState);

    // Refresh data after successful edit
    if (handleRefresh) {
      setTimeout(() => {
        handleRefresh();
      }, 100);
    }
  }, [handleRefresh]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditState(defaultEditState);
  }, []);

  // Handle dialog hiding
  const handleEditDialogHiding = useCallback(() => {
    setEditState(defaultEditState);
  }, []);

  return {
    editState,
    isTransactionEditable,
    handleEditTransaction,
    handleEditSuccess,
    handleCancelEdit,
    handleEditDialogHiding
  };
};

/**
 * Hook for managing DataGrid grouping
 */
export const useDataGridGrouping = (dataGridRef) => {
  const [groupBy, setGroupBy] = useState(defaultGroupByState);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [showDispensingTotal, setShowDispensingTotal] = useState(true);

  const hasActiveGrouping = useMemo(() => {
    return groupBy.date || groupBy.site || groupBy.tank;
  }, [groupBy.date, groupBy.site, groupBy.tank]);

  // Handle grouping change using DataGrid API
  const handleGroupByChange = useCallback((groupType) => {
    const dataGrid = dataGridRef.current?.instance;
    if (!dataGrid) return;

    const newGroupBy = { ...groupBy };
    newGroupBy[groupType] = !newGroupBy[groupType];

    // Clear all grouping first
    dataGrid.clearGrouping();

    // Apply new grouping using DataGrid API
    let groupIndex = 0;
    if (newGroupBy.site) {
      dataGrid.columnOption('site', 'groupIndex', groupIndex++);
    }
    if (newGroupBy.tank) {
      dataGrid.columnOption('tankId', 'groupIndex', groupIndex++);
    }
    if (newGroupBy.date) {
      dataGrid.columnOption('timestamp', 'groupIndex', groupIndex++);
    }

    setGroupBy(newGroupBy);
  }, [groupBy, dataGridRef]);

  // Clear all groupings
  const handleClearGrouping = useCallback(() => {
    const dataGrid = dataGridRef.current?.instance;
    if (!dataGrid) return;

    if (!groupBy.date && !groupBy.site && !groupBy.tank) {
      return;
    }

    dataGrid.clearGrouping();
    setGroupBy(defaultGroupByState);
  }, [groupBy.date, groupBy.site, groupBy.tank, dataGridRef]);

  // Toggle expand/collapse all groups
  const handleToggleExpandGroups = useCallback(() => {
    const dataGrid = dataGridRef.current?.instance;
    if (dataGrid) {
      if (isGroupsExpanded) {
        dataGrid.collapseAll(-1);
      } else {
        dataGrid.expandAll(-1);
      }
      setIsGroupsExpanded(!isGroupsExpanded);
    }
  }, [isGroupsExpanded, dataGridRef]);

  // Toggle dispensing total display
  const handleToggleDispensingTotal = useCallback(() => {
    setShowDispensingTotal(prev => !prev);
  }, []);

  return {
    groupBy,
    isGroupsExpanded,
    showDispensingTotal,
    hasActiveGrouping,
    handleGroupByChange,
    handleClearGrouping,
    handleToggleExpandGroups,
    handleToggleDispensingTotal
  };
};
