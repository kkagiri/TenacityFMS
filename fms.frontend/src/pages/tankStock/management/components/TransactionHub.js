import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Paging,
  Pager,
  HeaderFilter,
  SearchPanel,
  Toolbar,
  Item as TBItem,
  FilterRow,
  Column,
  Lookup,
  Selection,
  FilterPanel,
  GroupPanel,
  Grouping,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import  notify  from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { fetchTankVolumeHistoryFiltered } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../../redux/actions/vehicleActions';
import ChartView from './ChartView';
import { fetchEmployees } from '../../../../redux/actions/employeeActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import ManualRefillForm from '../../forms/ManualRefillForm';
import TransactionFilterPopup from './TransactionFilterPopup';
import QuickActions from '../../components/QuickActions';
import { usePermissions } from '../../../../hooks/usePermissions';
import './TransactionHub.scss';

// Import service with fallback
let transactionDeleteService;
try {
  transactionDeleteService = require('../../../../services/transactionDeleteService').default;
} catch (error) {
  console.warn('transactionDeleteService not available:', error.message);
  // Create a fallback service
  transactionDeleteService = {
    validateDelete: async () => {
      throw new Error('Delete validation service is not available');
    },
    deleteTransaction: async () => {
      throw new Error('Delete service is not available');
    }
  };
}

const TransactionHub = ({ selectedSite, dateRange }) => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Permission checks using JWT token
  const { hasPermission } = usePermissions();
  const canReadTankVolumeHistory = hasPermission('_Read_tankVolumeHistory');
  const canDeleteTankVolumeHistory = hasPermission('_Delete_tankVolumeHistory');

  // Redux state
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const isLoading = useSelector((state) => state.tankVolumeHistory.isLoading);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);
  const user = useSelector((state) => state.auth.user);

  // Local state
  const [showManualRefillForm, setShowManualRefillForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showChartPopup, setShowChartPopup] = useState(false);
  // TODO: Future implementation - Add chart grouping by site/tank with color-coded lines
  // const [chartGroupBy, setChartGroupBy] = useState('site'); // 'site' or 'tank'
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    visible: false,
    transaction: null,
    validationResult: null,
    isDeleting: false,
    showImpactDetails: false,
    deletionReason: '',
    userConfirmed: false
  });

  // Default to today's data only - ALWAYS start with ALL sites
  const [currentFilters, setCurrentFilters] = useState(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return {
      siteId: null, // Always start with ALL sites
      tankId: null,
      recordedBy: null,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      includeVehicleNames: true
    };
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Volume Change Reason Enum mapping
  const VolumeChangeReasonEnum = useMemo(() => [
    { id: 0, name: 'OpeningStock' },
    { id: 1, name: 'ClosingStock' },
    { id: 2, name: 'Delivery' },
    { id: 3, name: 'TransferIn' },
    { id: 4, name: 'TransferOut' },
    { id: 5, name: 'Adjustment' },
    { id: 6, name: 'Dispensing' },
    { id: 7, name: 'ManualRefill' }
  ], []);

  // Load transaction data with filters
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

  // Initialize data and load sites - only run once
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing TransactionHub...');
      dispatch(fetchTanks());
      dispatch(fetchSiteList());
      dispatch(fetchVehicleList());
      dispatch(fetchEmployees());
      dispatch(fetchUsersForFilter());

      // Create default filters inline - ALWAYS start with ALL sites
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const defaultFilters = {
        siteId: null, // Always start with ALL sites
        tankId: null,
        recordedBy: null,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        includeVehicleNames: true
      };

      setCurrentFilters(defaultFilters);
      dispatch(fetchTankVolumeHistoryFiltered(defaultFilters));
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]); // Remove selectedSite dependency

  // Handle prop changes separately to avoid infinite loops
  useEffect(() => {
    // DISABLED: TransactionHub should always start with "All Sites" and ignore parent selectedSite prop
    // This prevents the parent's selectedSite from overriding our "All Sites" default

    /*
    if (isInitialized && selectedSite !== undefined) {
      const newSiteId = selectedSite && selectedSite !== 'all' ? parseInt(selectedSite) : null;
      const currentSiteId = currentFilters.siteId;

      // Only apply prop changes if:
      // 1. The site actually changed
      // 2. We're not trying to override an intentional "All Sites" selection (null)
      // 3. We have a valid selectedSite prop that should take precedence
      if (newSiteId !== currentSiteId && selectedSite !== undefined && selectedSite !== 'all') {
        const updatedFilters = {
          ...currentFilters,
          siteId: newSiteId
        };
        setCurrentFilters(updatedFilters);
        dispatch(fetchTankVolumeHistoryFiltered(updatedFilters));
      }
    }
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite, isInitialized]);

  // Apply filters from popup
  const handleApplyFilters = useCallback(async (filters) => {
    console.log('Applying new filters:', filters);
    setCurrentFilters(filters);

    try {
      await loadTransactionData(filters);
      console.log('Filters applied successfully');

      // Show success notification
      notify({
        message: 'Filters applied successfully!',
        type: 'success',
        displayTime: 2000
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      notify({
        message: 'Failed to load transaction data. Please try again.',
        type: 'error',
        displayTime: 4000
      });
    }
  }, [loadTransactionData]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    try {
      await loadTransactionData(currentFilters);
      notify({
        message: 'Data refreshed successfully!',
        type: 'success',
        displayTime: 2000
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      notify({
        message: 'Failed to refresh data. Please try again.',
        type: 'error',
        displayTime: 3000
      });
    }
  }, [loadTransactionData, currentFilters]);

  // Refresh data after successful manual refill
  const handleManualRefillSuccess = useCallback(() => {
    setShowManualRefillForm(false);
    handleRefresh();
    notify({
      message: 'Manual refill recorded successfully',
      type: 'success',
      displayTime: 3000
    });
  }, [handleRefresh]);

  // Clear all filters and reset to today with ALL sites
  const handleClearFilters = useCallback(() => {
    // Create default filters inline - ALWAYS reset to ALL sites (null)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const defaultFilters = {
      siteId: null, // Always reset to ALL sites
      tankId: null,
      recordedBy: null,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      includeVehicleNames: true
    };

    handleApplyFilters(defaultFilters);
  }, [handleApplyFilters]);

  // Date navigation functions - Enhanced to work with any date range
  // This allows cycling through single days even when a custom date range was previously selected
  const handlePreviousDay = useCallback(() => {
    if (!currentFilters.startDate || !currentFilters.endDate) return;

    // Get the current start date and move it back by 1 day
    const currentStart = new Date(currentFilters.startDate);
    const newStart = new Date(currentStart);
    newStart.setDate(newStart.getDate() - 1);
    newStart.setHours(0, 0, 0, 0);

    // Set end date to end of the same day
    const newEnd = new Date(newStart);
    newEnd.setHours(23, 59, 59, 999);

    const updatedFilters = {
      ...currentFilters,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString()
    };

    handleApplyFilters(updatedFilters);

    // Show feedback notification
    const dateStr = newStart.toLocaleDateString();
    notify({
      message: `Viewing transactions for ${dateStr}`,
      type: 'info',
      displayTime: 1500
    });
  }, [currentFilters, handleApplyFilters]);

  const handleNextDay = useCallback(() => {
    if (!currentFilters.startDate || !currentFilters.endDate) return;

    // Get the current start date and move it forward by 1 day
    const currentStart = new Date(currentFilters.startDate);
    const today = new Date();

    // Don't allow going beyond today
    const nextDay = new Date(currentStart);
    nextDay.setDate(nextDay.getDate() + 1);

    if (nextDay.toDateString() > today.toDateString()) {
      notify({
        message: 'Cannot navigate beyond today',
        type: 'warning',
        displayTime: 2000
      });
      return;
    }

    const newStart = new Date(nextDay);
    newStart.setHours(0, 0, 0, 0);

    // Set end date to end of the same day, but don't go beyond today
    const newEnd = new Date(newStart);
    newEnd.setHours(23, 59, 59, 999);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (newEnd > todayEnd) {
      newEnd.setTime(todayEnd.getTime());
    }

    const updatedFilters = {
      ...currentFilters,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString()
    };

    handleApplyFilters(updatedFilters);

    // Show feedback notification
    const dateStr = newStart.toLocaleDateString();
    const isToday = newStart.toDateString() === new Date().toDateString();
    notify({
      message: `Viewing transactions for ${isToday ? 'Today' : dateStr}`,
      type: 'info',
      displayTime: 1500
    });
  }, [currentFilters, handleApplyFilters]);

  const isNextDayDisabled = useCallback(() => {
    if (!currentFilters.startDate) return true;

    const currentStart = new Date(currentFilters.startDate);
    const nextDay = new Date(currentStart);
    nextDay.setDate(nextDay.getDate() + 1);

    const today = new Date();

    // Disable if next day would be beyond today
    return nextDay.toDateString() > today.toDateString();
  }, [currentFilters.startDate]);

  // Delete transaction handlers - FIXED VERSION with stable state management
  const handleDeleteTransaction = useCallback(async (transaction) => {
    console.log('Delete transaction initiated:', transaction);

    // Set initial state with loading
    setDeleteConfirmation({
      visible: true,
      transaction,
      validationResult: null,
      isDeleting: false,
      showImpactDetails: false,
      deletionReason: '',
      userConfirmed: false
    });

    // Use a timeout to ensure DOM is stable before async operations
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

        // Update only the validation result to avoid full re-render
        setDeleteConfirmation(prev => ({
          ...prev,
          validationResult: validation.data
        }));

      } catch (error) {
        console.error('Error validating deletion:', error);
        notify({
          message: `Failed to validate deletion: ${error.message}`,
          type: 'error',
          displayTime: 4000
        });

        // Use timeout to ensure DOM stability before closing
        setTimeout(() => {
          setDeleteConfirmation({
            visible: false,
            transaction: null,
            validationResult: null,
            isDeleting: false,
            showImpactDetails: false,
            deletionReason: '',
            userConfirmed: false
          });
        }, 100);
      }
    }, 50);
  }, []);

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
          displayTime: 3000
        });

        // Close dialog with timeout for DOM stability
        setTimeout(() => {
          setDeleteConfirmation({
            visible: false,
            transaction: null,
            validationResult: null,
            isDeleting: false,
            showImpactDetails: false,
            deletionReason: '',
            userConfirmed: false
          });

          // Refresh data after dialog is closed
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
        displayTime: 4000
      });

      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirmation, handleRefresh]);  const handleCancelDelete = useCallback(() => {
    // Use timeout to ensure DOM stability before state change
    setTimeout(() => {
      setDeleteConfirmation({
        visible: false,
        transaction: null,
        validationResult: null,
        isDeleting: false,
        showImpactDetails: false,
        deletionReason: '',
        userConfirmed: false
      });
    }, 50);
  }, []);

  // Stable dialog content with better key management
  const DeleteConfirmationContent = useCallback(() => {
    const { validationResult, transaction, userConfirmed, isDeleting } = deleteConfirmation;

    // Loading state
    if (!validationResult) {
      return (
        <div key="loading" className="tw-flex tw-items-center tw-justify-center tw-py-8">
          <div className="tw-text-center">
            <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-text-blue-600 tw-mb-3"></i>
            <p className="tw-text-gray-600">Validating deletion...</p>
          </div>
        </div>
      );
    }

    // Content with stable keys
    const transactionDate = transaction ? new Date(transaction.timestamp).toLocaleString() : '';
    const transactionType = transaction ? VolumeChangeReasonEnum.find(r => r.id === transaction.changeReason)?.name || 'Unknown' : '';
    const tankName = tanks?.find(t => t.id === transaction?.tankId)?.name || 'Unknown';
    const volumeChange = transaction?.volumeChange || 0;

    return (
      <div key="content">
        {/* Transaction Details */}
        <div className="tw-mb-6">
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
            Transaction to Delete
          </h4>
          <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-space-y-2">
            <div className="tw-flex tw-justify-between">
              <span className="tw-font-medium">Date:</span>
              <span>{transactionDate}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-font-medium">Type:</span>
              <span>{transactionType}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-font-medium">Volume Change:</span>
              <span className={`tw-font-medium ${volumeChange >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                {volumeChange.toLocaleString()} L
              </span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-font-medium">Tank:</span>
              <span>{tankName}</span>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        <div className="tw-mb-6">
          {!validationResult.isAllowed ? (
            <div key="blocked" className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mr-3 tw-mt-1"></i>
                <div>
                  <h5 className="tw-font-semibold tw-text-red-800 tw-mb-2">Delete Blocked</h5>
                  <p className="tw-text-red-700">{validationResult.message || 'Cannot delete this transaction'}</p>
                  {validationResult.detailedWarning && (
                    <p className="tw-text-red-600 tw-text-sm tw-mt-2">
                      {validationResult.detailedWarning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : validationResult.requiresUserConfirmation ? (
            <div key="warning" className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mr-3 tw-mt-1"></i>
                <div>
                  <h5 className="tw-font-semibold tw-text-yellow-800 tw-mb-2">Warning: Future Records Detected</h5>
                  <p className="tw-text-yellow-700 tw-mb-3">{validationResult.message || 'This action will affect future records'}</p>

                  {validationResult.futureRecordsCount > 0 && (
                    <div className="tw-bg-white tw-p-3 tw-rounded tw-border tw-mb-3">
                      <div className="tw-text-sm tw-space-y-1">
                        <div className="tw-flex tw-justify-between">
                          <span>Future Records:</span>
                          <span className="tw-font-medium">{validationResult.futureRecordsCount}</span>
                        </div>
                        {validationResult.earliestFutureRecord && (
                          <div className="tw-flex tw-justify-between">
                            <span>Earliest:</span>
                            <span className="tw-font-medium">
                              {new Date(validationResult.earliestFutureRecord).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {validationResult.latestFutureRecord && (
                          <div className="tw-flex tw-justify-between">
                            <span>Latest:</span>
                            <span className="tw-font-medium">
                              {new Date(validationResult.latestFutureRecord).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {validationResult.detailedWarning && (
                    <p className="tw-text-yellow-600 tw-text-sm">
                      {validationResult.detailedWarning}
                    </p>
                  )}

                  <div className="tw-mt-4">
                    <label className="tw-flex tw-items-center tw-space-x-2">
                      <input
                        type="checkbox"
                        checked={userConfirmed}
                        onChange={(e) => setDeleteConfirmation(prev => ({
                          ...prev,
                          userConfirmed: e.target.checked
                        }))}
                        className="tw-w-4 tw-h-4"
                      />
                      <span className="tw-text-sm tw-text-gray-700">
                        I understand the impact and want to proceed with the deletion
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div key="safe" className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-check-circle tw-text-green-600 tw-mr-3 tw-mt-1"></i>
                <div>
                  <h5 className="tw-font-semibold tw-text-green-800 tw-mb-2">Safe to Delete</h5>
                  <p className="tw-text-green-700">{validationResult.message || 'This transaction can be safely deleted'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-space-x-3">
          <Button
            text="Cancel"
            onClick={handleCancelDelete}
            stylingMode="outlined"
            disabled={isDeleting}
          />
          {validationResult.isAllowed && (
            <Button
              text={isDeleting ? "Deleting..." : "Delete Transaction"}
              onClick={executeDelete}
              type="default"
              disabled={
                isDeleting ||
                (validationResult.requiresUserConfirmation && !userConfirmed)
              }
              className="tw-bg-red-600 hover:tw-bg-red-700"
            />
          )}
        </div>
      </div>
    );
  }, [deleteConfirmation, VolumeChangeReasonEnum, tanks, executeDelete, handleCancelDelete]);

  // Format timestamp for display
  const formatTime = (cellInfo) => {
    const date = new Date(cellInfo.value);
    return date.toLocaleString();
  };

  // Render change reason with additional info
  const changeReasonCellRender = (cellInfo) => {
    const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
    if (reason) {
      if (reason.name === 'Dispensing' && cellInfo.data.vehicleName) {
        return `${reason.name} - ${cellInfo.data.vehicleName}`;
      }
      return reason.name;
    }
    return cellInfo.value;
  };

  // Export functionality
  const onExporting = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Transaction History');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.column.dataField === 'changeReason') {
          const reason = VolumeChangeReasonEnum.find(r => r.id === gridCell.value);
          if (reason) {
            excelCell.value = reason.name;
          }
        }
        if (gridCell.column.dataField === 'timestamp') {
          if (gridCell.value instanceof Date) {
            excelCell.value = gridCell.value.toLocaleString();
          }
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_history_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
    });
    e.cancel = true;
  }, [VolumeChangeReasonEnum]);

  // Early return if no read permission (after all hooks are defined)
  if (!canReadTankVolumeHistory) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">Access Denied</h3>
          <p className="tw-text-gray-500">You don't have permission to view tank volume history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-hub tw-h-full tw-flex tw-flex-col">
      {/* Header with actions */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200">
        {/* Header content - responsive layout */}
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          {/* Title section */}
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-exchange-alt tw-mr-2 tw-text-blue-600"></i>
              Transaction Hub
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Unified view of all tank transactions (Default: Today's data)
            </p>
          </div>

          {/* Actions section - responsive */}
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
            {/* Quick Actions */}
            <div className="tw-flex-shrink-0 tw-w-full sm:tw-w-auto sm:tw-min-w-48">
              <QuickActions
                collapsed={false}
                onRefreshData={handleRefresh}
                sites={sites}
                user={user}
              />
            </div>



            {/* Filters and Refresh */}
            <div className="tw-flex tw-gap-2 tw-flex-shrink-0">
              <Button
                text="Filters"
                icon="fa-light fa-filter"
                onClick={() => setShowFilterPopup(true)}
                stylingMode="outlined"
                className="tw-flex-1 sm:tw-flex-initial tw-min-w-24"
              />

              <Button
                text="Refresh"
                icon="fa-light fa-refresh"
                onClick={handleRefresh}
                stylingMode="outlined"
                className="tw-flex-1 sm:tw-flex-initial"
              />
            </div>
          </div>
        </div>

        {/* Current Filters Display - Mobile Responsive */}
        <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3">
            {/* Active filters info */}
            <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-text-sm tw-text-blue-800 tw-gap-2">
              <div className="tw-flex tw-items-center tw-flex-shrink-0">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                <span className="tw-font-medium">Active Filters:</span>
              </div>

              {/* Filter tags - responsive wrapping */}
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {currentFilters.siteId ? (
                  <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    Site: {sites?.find(s => s.id === currentFilters.siteId)?.name || 'Unknown'}
                  </span>
                ) : (
                  <span className="tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    All Sites
                  </span>
                )}
                {currentFilters.tankId && (
                  <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                  </span>
                )}
                {currentFilters.recordedBy && (
                  <span className="tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    User: {usersForFilter?.find(u => u.id === currentFilters.recordedBy)?.userName || 'Unknown'}
                  </span>
                )}
                <span className="tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                  {currentFilters.startDate && currentFilters.endDate ? (
                    (() => {
                      const startDate = new Date(currentFilters.startDate);
                      const endDate = new Date(currentFilters.endDate);
                      const startDay = startDate.toLocaleDateString();
                      const endDay = endDate.toLocaleDateString();

                      // Check if it's the same day (single day filter)
                      if (startDay === endDay) {
                        const today = new Date().toLocaleDateString();
                        const isToday = startDay === today;
                        return `📅 ${startDay}${isToday ? ' (Today)' : ''}`;
                      } else {
                        return `📅 ${startDay} - ${endDay}`;
                      }
                    })()
                  ) : (
                    '📅 Today'
                  )}
                </span>
              </div>
            </div>

            {/* Reset button */}
            <div className="tw-flex-shrink-0">
              <Button
                text="Reset to All Sites"
                onClick={handleClearFilters}
                stylingMode="text"
                className="tw-text-xs tw-text-blue-600 tw-w-full sm:tw-w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Responsive padding */}
      <div className="tw-flex-1 tw-p-2 sm:tw-p-4">
        <DataGrid
          dataSource={tankVolumeHistory}
          keyExpr="id"
          showBorders={true}
          ref={dataGridRef}
          showColumnLines={true}
          showRowLines={true}
          allowColumnResizing={true}
          showColumnHeaders={true}
          className="tw-h-full"
        >
          <FilterPanel visible={true} />
          <GroupPanel visible={true} />
          <Grouping visible={true} autoExpandAll={false} />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <SearchPanel visible={true} placeholder="Search transactions..." />
          <Paging enabled={true} defaultPageSize={100} />
          <Pager
            visible={true}
            allowedPageSizes={[50, 100, 200, 500]}
            displayMode="full"
            showPageSizeSelector={true}
            showInfo={true}
            showNavigationButtons={true}
          />
          <Selection mode="multiple" />

          <Toolbar>
            <TBItem
              location="before"
              widget="dxButton"
              options={{
                text: '← Previous Day',
                onClick: handlePreviousDay,
                stylingMode: 'outlined',
                hint: 'Go to previous day',
                elementAttr: {
                  class: 'date-nav-btn date-nav-prev'
                }
              }}
            />
            <TBItem
              location="before"
              widget="dxButton"
              options={{
                text: 'Next Day →',
                onClick: handleNextDay,
                stylingMode: 'outlined',
                hint: 'Go to next day',
                disabled: isNextDayDisabled(),
                elementAttr: {
                  class: 'date-nav-btn date-nav-next'
                }
              }}
            />
            <TBItem
              location="after"
              widget="dxButton"
              options={{
                text: 'Chart View',
                onClick: () => setShowChartPopup(true),
                elementAttr: {
                  class: 'chart-view-button'
                }
              }}
            />
            <TBItem
              location="after"
              widget="dxButton"
              options={{
                text: 'Export',
                onClick: onExporting
              }}
            />
          </Toolbar>

          {/* Columns */}
          <Column dataField="id" caption="ID" visible={false} defaultSortOrder="desc" />
          <Column
            dataField="timestamp"
            caption="Date & Time"
            cellRender={formatTime}
            minWidth={150}
            sortOrder="desc"
          />
          <Column dataField="site" caption="Site" groupIndex={0} />
          <Column dataField="tankId" caption="Tank" groupIndex={1}>
            <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="changeReason"
            caption="Transaction Type"
            minWidth={130}
            cellRender={changeReasonCellRender}
          >
            <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="volumeChange"
            caption="Volume Change (L)"
            minWidth={150}
            format="#,##0.00"
          />
          <Column
            dataField="newVolume"
            caption="New Volume (L)"
            minWidth={120}
            format="#,##0.00"
          />
          <Column
            dataField="recordedByUserName"
            caption="Recorded By"
            minWidth={120}
          />

          {/* Actions Column */}
          <Column
            type="buttons"
            width={100}
            caption="Actions"
            allowSorting={false}
            allowGrouping={false}
            allowFiltering={false}
            cellRender={(cellData) => (
              <div className="tw-flex tw-space-x-2">
                {canDeleteTankVolumeHistory && (
                  <Button
                    icon="fa-light fa-trash"
                    stylingMode="text"
                    onClick={() => handleDeleteTransaction(cellData.data)}
                    className="tw-text-red-600 hover:tw-text-red-800"
                    hint="Delete Transaction"
                    disabled={isLoading || deleteConfirmation.isDeleting}
                  />
                )}
                {!canDeleteTankVolumeHistory && (
                  <span className="tw-text-gray-400 tw-text-xs" title="No delete permission">
                    <i className="fa-light fa-lock"></i>
                  </span>
                )}
              </div>
            )}
          />

          {/* Summary for grouped data */}
          <Summary>
            <TotalItem
              column="volumeChange"
              summaryType="sum"
              valueFormat="#,##0.00"
              displayFormat="Total Volume Change: {0}L"
            />
            <TotalItem
              column="id"
              summaryType="count"
              displayFormat="Total Transactions: {0}"
            />
          </Summary>
        </DataGrid>
      </div>

      {/* Manual Refill Popup */}
      <Popup
        visible={showManualRefillForm}
        onHiding={() => setShowManualRefillForm(false)}
        showTitle={true}
        title="Manual Fuel Refill"
        width={800}
        height={600}
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={true}
        className="manual-refill-popup"
      >
        <ManualRefillForm
          onCancel={() => setShowManualRefillForm(false)}
          onSuccess={handleManualRefillSuccess}
        />
      </Popup>

      {/* Transaction Filter Popup */}
      <TransactionFilterPopup
        visible={showFilterPopup}
        onHiding={() => setShowFilterPopup(false)}
        currentFilters={currentFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Delete Confirmation Dialog - FIXED VERSION */}
      <Popup
        visible={deleteConfirmation.visible}
        onHiding={handleCancelDelete}
        showTitle={true}
        title="Delete Transaction"
        width={600}
        height="auto"
        showCloseButton={true}
        dragEnabled={true}
        hideOnOutsideClick={false}
      >
        <div className="tw-p-6">
          <DeleteConfirmationContent />
        </div>
      </Popup>

      {/* Chart View Component */}
      <ChartView
        visible={showChartPopup}
        onClose={() => setShowChartPopup(false)}
        tankVolumeHistory={tankVolumeHistory}
        tanks={tanks}
        sites={sites}
        currentFilters={currentFilters}
      />

      {/* Page-level LoadPanel */}
      <LoadPanel
        visible={isLoading}
        showIndicator={true}
        showPane={true}
        text="Loading transaction data..."
        position="center"
      />
    </div>
  );
};

export default TransactionHub;
