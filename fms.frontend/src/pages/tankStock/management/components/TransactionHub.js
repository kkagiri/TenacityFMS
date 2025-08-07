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
import { ScrollView } from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import { Chart, Series, CommonSeriesSettings, Legend, ValueAxis, ArgumentAxis, Label, Tooltip } from 'devextreme-react/chart';
import  notify  from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { fetchTankVolumeHistoryFiltered } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../../redux/actions/vehicleActions';
import { fetchEmployees } from '../../../../redux/actions/employeeActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import ManualRefillForm from '../../forms/ManualRefillForm';
import TransactionFilterPopup from './TransactionFilterPopup';
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

  // TODO: Future implementation - Chart data processing with grouping functions
  // This will be enhanced to support grouping by site/tank with color-coded lines
  const getChartData = useMemo(() => {
    if (!tankVolumeHistory || tankVolumeHistory.length === 0) return [];

    console.log('🔍 Chart Data Debug - Raw data:', tankVolumeHistory);

    // Sort data by timestamp for simple line chart
    const sortedData = [...tankVolumeHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('🔍 Chart Data Debug - Sorted data:', sortedData);
    return sortedData;
  }, [tankVolumeHistory]);

  // TODO: Future implementation - Generate colors for chart series when grouping is implemented

  // Chart tooltip customization function
  const customizeTooltip = useCallback((pointInfo) => {
    console.log('🔍 Chart Tooltip Debug - pointInfo:', pointInfo);

    const { argument, value, point } = pointInfo;
    console.log('🔍 Chart Tooltip Debug - point.data:', point?.data);

    if (!point || !point.data) {
      console.warn('⚠️ Chart Tooltip Warning: No point data available');
      return {
        html: `<div style="padding: 10px; background: #ffffff; border: 1px solid #d1d5db;">
          <strong>Tank Volume:</strong> ${value?.toLocaleString() || 'N/A'} L<br/>
          <strong>Date:</strong> ${new Date(argument).toLocaleDateString()}
        </div>`
      };
    }

    const { changeReason, vehicleName, volumeChange, recordedByUserName, site, referenceType, referenceId, tankId } = point.data;
    const date = new Date(argument);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const formattedTime = date.toLocaleTimeString();

    // Reason names mapping
    const reasonNames = {
      0: 'Opening Stock',
      1: 'Closing Stock',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Adjustment',
      6: 'Dispensing',
      7: 'Manual Refill'
    };

    const changeReasonText = reasonNames[changeReason] || 'Unknown';
    const volumeChangeValue = volumeChange || 0;
    const changeSymbol = volumeChangeValue > 0 ? '+' : '';

    // Get tank name
    const tankName = tanks?.find(t => t.id === tankId)?.name || `Tank ${tankId}`;

    let tooltipHtml = `
      <div style="
        padding: 12px;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: Arial, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        text-align: left;
        min-width: 220px;
        max-width: 300px;
        color: #000000;
      ">
        <div style="font-weight: bold; color: #1f2937; margin-bottom: 10px; text-align: center; font-size: 14px;">
          Transaction Details
        </div>

        <div style="margin-bottom: 8px;">
          <span style="color: #000000;"><strong>Date:</strong></span> <span style="color: #000000;">${formattedDate}</span><br/>
          <span style="color: #000000;"><strong>Time:</strong></span> <span style="color: #000000;">${formattedTime}</span>
        </div>

        <div style="margin-bottom: 8px;">
          <span style="color: #000000;"><strong>Tank:</strong></span> <span style="color: #000000;">${tankName}</span><br/>
          <span style="color: #000000;"><strong>Volume:</strong></span> <span style="color: #059669; font-weight: 600;">${value.toLocaleString()} L</span>
        </div>

        <div style="margin-bottom: 8px;">
          <span style="color: #000000;"><strong>Change:</strong></span>
          <span style="color: ${volumeChangeValue >= 0 ? '#059669' : '#dc2626'}; font-weight: 600;">
            ${changeSymbol}${volumeChangeValue.toFixed(2)} L
          </span><br/>
          <span style="color: #000000;"><strong>Type:</strong></span>
          <span style="background: #f3f4f6; color: #000000; padding: 2px 6px; border-radius: 4px; font-weight: 500;">
            ${changeReasonText}
          </span>
        </div>
    `;

    // Add vehicle name for all transactions, especially dispensing
    if (vehicleName && vehicleName !== 'N/A' && vehicleName.trim() !== '') {
      tooltipHtml += `
        <div style="margin-bottom: 6px;">
          <span style="color: #000000;"><strong>Vehicle:</strong></span>
          <span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 500;">
            ${vehicleName}
          </span>
        </div>`;
    } else if (changeReason === 6) {
      // Show "No Vehicle" for dispensing transactions without vehicle name
      tooltipHtml += `
        <div style="margin-bottom: 6px;">
          <span style="color: #000000;"><strong>Vehicle:</strong></span>
          <span style="background: #f3f4f6; color: #6b7280; padding: 2px 6px; border-radius: 4px; font-style: italic;">
            No Vehicle Assigned
          </span>
        </div>`;
    }

    // Add site information
    if (site && site.trim() !== '') {
      tooltipHtml += `
        <div style="margin-bottom: 6px;">
          <span style="color: #000000;"><strong>Site:</strong></span> <span style="color: #000000;">${site}</span>
        </div>`;
    }

    // Add user information
    let userName = '';
    if (recordedByUserName && recordedByUserName.trim() !== '') {
      userName = recordedByUserName;
    }

    if (userName) {
      tooltipHtml += `
        <div style="margin-bottom: 6px;">
          <span style="color: #000000;"><strong>Recorded By:</strong></span> <span style="color: #000000;">${userName}</span>
        </div>`;
    }

    // Add reference information if available
    if (referenceType && referenceId) {
      tooltipHtml += `
        <div style="margin-bottom: 6px;">
          <span style="color: #000000;"><strong>Reference:</strong></span> <span style="color: #000000;">${referenceType} #${referenceId}</span>
        </div>`;
    }

    tooltipHtml += '</div>';

    console.log('✅ Chart Tooltip HTML generated successfully');
    return { html: tooltipHtml };
  }, [tanks]);

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
        <div className="tw-flex tw-justify-between tw-items-center">
          <div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-exchange-alt tw-mr-2 tw-text-blue-600"></i>
              Transaction Hub
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Unified view of all tank transactions (Default: Today's data)
            </p>
          </div>
          <div className="tw-flex tw-space-x-2">
            <Button
              text="Filters"
              icon="fa-light fa-filter"
              onClick={() => setShowFilterPopup(true)}
              stylingMode="outlined"
              className="tw-min-w-24"
            />

            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              onClick={handleRefresh}
              stylingMode="outlined"
            />
          </div>
        </div>

        {/* Current Filters Display */}
        <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-text-sm tw-text-blue-800">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              <span className="tw-font-medium">Active Filters:</span>
              <div className="tw-ml-2 tw-flex tw-flex-wrap tw-gap-2">
                {currentFilters.siteId ? (
                  <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                    Site: {sites?.find(s => s.id === currentFilters.siteId)?.name || 'Unknown'}
                  </span>
                ) : (
                  <span className="tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                    All Sites
                  </span>
                )}
                {currentFilters.tankId && (
                  <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                    Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                  </span>
                )}
                {currentFilters.recordedBy && (
                  <span className="tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                    User: {usersForFilter?.find(u => u.id === currentFilters.recordedBy)?.userName || 'Unknown'}
                  </span>
                )}
                <span className="tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs">
                  {currentFilters.startDate && currentFilters.endDate ? (
                    `${new Date(currentFilters.startDate).toLocaleDateString()} - ${new Date(currentFilters.endDate).toLocaleDateString()}`
                  ) : (
                    'Today'
                  )}
                </span>
              </div>
            </div>
            <Button
              text="Reset to All Sites"
              onClick={handleClearFilters}
              stylingMode="text"
              className="tw-text-xs tw-text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="tw-flex-1 tw-p-4">
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
              location="after"
              widget="dxButton"
              options={{
                icon: 'fa-light fa-chart-line',
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
                icon: 'fa-light fa-file-export',
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

      {/* Chart View Popup */}
      <Popup
        visible={showChartPopup}
        onHiding={() => setShowChartPopup(false)}
        showTitle={true}
        title="Transaction Volume Chart"
        width="95%"
        height="85%"
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={false}
        className="chart-popup"
      >
        <ScrollView
          height="100%"
          showScrollbar="always"
          bounceEnabled={false}
        >
          <div className="tw-p-4">
            {/* Chart Controls */}
            <div className="chart-controls tw-mb-4 tw-flex tw-items-center tw-gap-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              {/* Data summary */}
              <div className="tw-flex tw-items-center tw-gap-4 tw-text-xs tw-text-gray-600">
                <span className="tw-font-medium">Data:</span>
                <span className="tw-px-2 tw-py-1 tw-rounded tw-bg-white tw-border tw-border-gray-200">
                  {getChartData.length} transactions
                </span>
              </div>

              {/* Instructions */}
              <div className="tw-text-xs tw-text-blue-600 tw-italic">
                💡 Hover over points to see transaction details
              </div>
            </div>

            <div className="chart-info-panel tw-mb-4">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-text-sm">
                <span className="tw-flex tw-items-center tw-font-medium tw-text-gray-700">
                  <i className="fa-light fa-chart-bar tw-mr-2 tw-text-blue-600"></i>
                  <strong>{tankVolumeHistory?.length || 0}</strong> transactions
                </span>

                {/* Show data range info */}
                {currentFilters.startDate && currentFilters.endDate && (
                  <span className="tw-flex tw-items-center tw-text-gray-600">
                    <i className="fa-light fa-calendar tw-mr-2 tw-text-green-600"></i>
                    {new Date(currentFilters.startDate).toLocaleDateString()} - {new Date(currentFilters.endDate).toLocaleDateString()}
                  </span>
                )}

                {currentFilters.siteId ? (
                  <span className="tw-flex tw-items-center tw-text-gray-600">
                    <i className="fa-light fa-map-marker tw-mr-2 tw-text-purple-600"></i>
                    Site: {sites?.find(s => s.id === currentFilters.siteId)?.name || 'Unknown'}
                  </span>
                ) : (
                  <span className="tw-flex tw-items-center tw-text-gray-600">
                    <i className="fa-light fa-globe tw-mr-2 tw-text-purple-600"></i>
                    All Sites
                  </span>
                )}
                {currentFilters.tankId && (
                  <span className="tw-flex tw-items-center tw-text-gray-600">
                    <i className="fa-light fa-oil-can tw-mr-2 tw-text-orange-600"></i>
                    Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                  </span>
                )}
              </div>
            </div>            <Chart
              height={500}
              dataSource={getChartData}
              title={{
                text: "Tank Volume Changes Over Time",
                font: {
                  size: 18,
                  weight: 600
                }
              }}
              tooltip={{
                enabled: true,
                format: "fixedPoint",
                precision: 2,
                container: "body"
              }}
              crosshair={{
                enabled: true,
                color: '#949494',
                width: 1,
                dashStyle: 'dash'
              }}
              adaptiveLayout={{
                width: 80,
                height: 80,
                keepLabels: true
              }}
              onInitialized={(e) => {
                console.log('🎨 Chart initialized:', e);
                console.log('🎨 Chart data:', getChartData);
                console.log('🎨 Total data points:', getChartData.length);

                // Log sample data for debugging
                if (getChartData.length > 0) {
                  console.log('🎨 Sample data point:', getChartData[0]);
                  console.log('🎨 Timestamp:', getChartData[0]?.timestamp);
                  console.log('🎨 NewVolume:', getChartData[0]?.newVolume);
                }

                // Debug series rendering
                setTimeout(() => {
                  const chartElement = e.element;
                  const seriesElements = chartElement.querySelectorAll('.dx-chart-series, path[class*="dx-chart-series"], .dx-chart-series-line');
                  console.log('🎨 Found series elements:', seriesElements.length);

                  seriesElements.forEach((element, index) => {
                    console.log(`🎨 Series ${index}:`, element);
                    // Force visibility
                    element.style.strokeWidth = '4px';
                    element.style.strokeOpacity = '1';
                    element.style.opacity = '1';
                    element.style.visibility = 'visible';
                    element.style.display = 'block';
                    element.style.stroke = '#3b82f6';
                  });
                }, 500);

                // Fix tooltip z-index after chart initialization
                setTimeout(() => {
                  const tooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper, div[class*="tooltip"]');
                  tooltips.forEach(tooltip => {
                    tooltip.style.zIndex = '99999';
                    tooltip.style.position = 'fixed';
                  });
                }, 100);

                // Set up mutation observer to catch dynamically created tooltips
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) { // Element node
                        const tooltips = node.querySelectorAll?.('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper') || [];
                        tooltips.forEach(tooltip => {
                          tooltip.style.zIndex = '99999';
                          tooltip.style.position = 'fixed';
                        });

                        // Check if the node itself is a tooltip
                        if (node.classList && (node.classList.contains('dx-chart-tooltip') || node.classList.contains('dx-tooltip'))) {
                          node.style.zIndex = '99999';
                          node.style.position = 'fixed';
                        }
                      }
                    });
                  });
                });

                observer.observe(document.body, { childList: true, subtree: true });
              }}
            >
              <CommonSeriesSettings argumentField="timestamp" type="line" />
              <Series
                valueField="newVolume"
                name="Tank Volume"
                color="#3b82f6"
                point={{
                  visible: true,
                  size: 8,
                  symbol: 'circle',
                  color: '#1d4ed8',
                  border: {
                    visible: true,
                    width: 2,
                    color: '#ffffff'
                  }
                }}
                width={3}
              />
              <ValueAxis>
                <Label format="#,##0 L" />
              </ValueAxis>
              <ArgumentAxis>
                <Label
                  customizeText={(e) => {
                    const date = new Date(e.value);
                    return date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) + '\n' + date.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  }}
                  rotationAngle={45}
                />
              </ArgumentAxis>
              <Legend visible={true} />
              <Tooltip
                enabled={true}
                customizeTooltip={customizeTooltip}
                onTooltipShown={(e) => {
                  // Ensure tooltip has the highest z-index when shown
                  console.log('Tooltip shown event:', e);
                  if (e.element) {
                    e.element.style.zIndex = '99999';
                    e.element.style.position = 'fixed';
                  }

                  // Also check for parent elements that might be tooltip containers
                  let parent = e.element?.parentElement;
                  while (parent && parent !== document.body) {
                    if (parent.classList && (parent.classList.contains('dx-tooltip') || parent.classList.contains('dx-chart-tooltip'))) {
                      parent.style.zIndex = '99999';
                      parent.style.position = 'fixed';
                    }
                    parent = parent.parentElement;
                  }

                  // Force immediate DOM update
                  setTimeout(() => {
                    const allTooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, div[class*="tooltip"]');
                    allTooltips.forEach(tooltip => {
                      tooltip.style.zIndex = '99999';
                      tooltip.style.position = 'fixed';
                    });
                  }, 0);
                }}
              />
            </Chart>

            <div className="chart-guide tw-mt-4">
              <div className="tw-flex tw-items-center tw-mb-3">
                <i className="fa-light fa-lightbulb tw-mr-2 tw-text-blue-600"></i>
                <strong className="tw-text-gray-800">Chart Guide:</strong>
              </div>
              <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-mouse tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                  <span>Hover over data points to see detailed transaction information</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-search-plus tw-mr-2 tw-mt-1 tw-text-green-500"></i>
                  <span>Use mouse wheel to zoom in/out on the chart</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-arrows tw-mr-2 tw-mt-1 tw-text-purple-500"></i>
                  <span>Click and drag to pan around the chart when zoomed</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-chart-line tw-mr-2 tw-mt-1 tw-text-orange-500"></i>
                  <span>Volume increases show as upward trends, decreases as downward trends</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-layer-group tw-mr-2 tw-mt-1 tw-text-indigo-500"></i>
                  <span>Single line shows all tank volume changes chronologically</span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollView>
      </Popup>

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
