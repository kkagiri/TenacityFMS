/**
 * File: TransactionHub.js
 * Purpose: Central tank transaction management hub providing data grids, filtering,
 *          chart views, manual refill workflows, and transaction maintenance actions.
 * Dependencies: react, react-redux, DevExtreme data grid and popup components, exceljs,
 *               Redux tank/site/user actions, custom services/hooks/components.
 * Last Modified: 2025-11-04
 *
 * Key Components:
 * - TransactionHub: Main container orchestrating transaction data loading, filtering,
 *   visualization, exports, and deletion flows with responsive layout considerations.
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import DataGrid, {
  Paging,
  Pager,
  HeaderFilter,
  Toolbar,
  // Item as TBItem, // COMMENTED OUT FOR NOW
  ColumnChooser,
  Position,
  ColumnChooserSelection,
  FilterRow,
  Column,
  Lookup,
  Selection,
  FilterPanel,
  GroupPanel,
  Grouping,
  Summary,
  TotalItem,
  GroupItem
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ScrollView } from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import CheckBox from 'devextreme-react/check-box';
import SelectBox from 'devextreme-react/select-box';
import DateBox from 'devextreme-react/date-box';
// import { DropDownButton } from 'devextreme-react/drop-down-button'; // COMMENTED OUT FOR NOW
import Popup from 'devextreme-react/popup';
import  notify  from 'devextreme/ui/notify';
import { exportTransactionsToExcel } from '../utils/transactionExportUtils';
import { exportAnalysisReport } from '../utils/transactionAnalysisExportUtils';
import { fetchTankVolumeHistoryFiltered } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchVehicleList } from '../../../../redux/actions/vehicleActions';
// import ChartView from './ChartView'; // COMMENTED OUT FOR NOW
import { fetchEmployees } from '../../../../redux/actions/employeeActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import ManualRefillForm from '../../forms/ManualRefillForm';
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

  // Get shared filters from header (site, tank, dates)
  const { startDate: headerStartDate, endDate: headerEndDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Permission checks using JWT token
  const { hasPermission } = usePermissions();
  const canReadTankVolumeHistory = hasPermission('_Read_tankVolumeHistory');
  const canDeleteTankVolumeHistory = hasPermission('_Delete_tankVolumeHistory');

  // Redux state
  const tankVolumeHistoryRaw = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const isLoading = useSelector((state) => state.tankVolumeHistory.isLoading);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);
  const user = useSelector((state) => state.auth.user);

  /**
   * Sort transactions in logical order per day per tank:
   * Date ASC -> Tank -> OpeningStock -> Operations (by timestamp) -> ClosingStock
   * This fixes legacy data where timestamps may be out of order
   * and ensures each tank's transactions are grouped together within a day
   */
  const tankVolumeHistory = useMemo(() => {
    if (!tankVolumeHistoryRaw || tankVolumeHistoryRaw.length === 0) return [];

    // Priority mapping: OpeningStock first, ClosingStock last
    const getTypePriority = (changeReason) => {
      switch (changeReason) {
        case 0: return 0;  // OpeningStock - Always first
        case 2: return 1;  // Delivery
        case 3: return 2;  // TransferIn
        case 4: return 3;  // TransferOut
        case 5: return 4;  // Adjustment
        case 6: return 5;  // Dispensing
        case 7: return 6;  // AutomatedDispensing
        case 8: return 7;  // Reconciliation
        case 9: return 8;  // AutomatedReconciliation
        case 1: return 99; // ClosingStock - Always last
        default: return 50;
      }
    };

    return [...tankVolumeHistoryRaw].sort((a, b) => {
      // 1. First sort by date (day only)
      const dateA = new Date(a.timestamp).toISOString().split('T')[0];
      const dateB = new Date(b.timestamp).toISOString().split('T')[0];

      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // 2. Same day - sort by tank ID to group all tank transactions together
      if (a.tankId !== b.tankId) {
        return a.tankId - b.tankId;
      }

      // 3. Same tank - sort by transaction type priority
      const priorityA = getTypePriority(a.changeReason);
      const priorityB = getTypePriority(b.changeReason);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 4. Same type - sort by timestamp
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }, [tankVolumeHistoryRaw]);

  // Local state
  const [showManualRefillForm, setShowManualRefillForm] = useState(false);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState({ date: false, site: false, tank: false }); // Multi-select grouping
  const [showDispensingTotal, setShowDispensingTotal] = useState(true); // Toggle for dispensing summary
  // const [showChartPopup, setShowChartPopup] = useState(false); // COMMENTED OUT FOR NOW
  // const [selectedChartType, setSelectedChartType] = useState('candlestick'); // COMMENTED OUT FOR NOW

  // Chart type options for dropdown - simplified like stock management
  // COMMENTED OUT FOR NOW
  /*
  const chartTypeOptions = [
    {
      key: 'candlestick',
      text: '📈 Candlestick Chart',
      icon: 'fa-light fa-chart-line'
    },
    {
      key: 'volume',
      text: '📊 Volume Chart',
      icon: 'fa-light fa-chart-bar'
    },
    {
      key: 'multi-series',
      text: '🎯 Multi-Series Line',
      icon: 'fa-light fa-chart-area'
    },
    {
      key: 'ohlc',
      text: '📉 OHLC Bars',
      icon: 'fa-light fa-chart-column'
    }
  ];
  */

  // Function to handle chart type selection
  // COMMENTED OUT FOR NOW
  /*
  const handleChartTypeSelection = useCallback((chartType) => {
    setSelectedChartType(chartType);
    setShowChartPopup(true);
  }, []);
  */

  // TODO: Future implementation - Add chart grouping by site/tank with color-coded lines
  // const [chartGroupBy, setChartGroupBy] = useState('site'); // 'site' or 'tank'
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    visible: false,
    transaction: null,
    validationResult: null,
    isDeleting: false,
    showImpactDetails: false,
    showDetails: false,
    deletionReason: '',
    userConfirmed: false
  });

  // Local filter state - only for user and manual dispensing (site/tank/dates from header)
  const [filterUserId, setFilterUserId] = useState(null);
  const [useManualDispensing, setUseManualDispensing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed filters object - uses header filters for site/tank/dates
  const currentFilters = useMemo(() => ({
    siteId: selectedSiteIds.length === 1 ? selectedSiteIds[0] : null, // Single site or null for all
    tankId: selectedTankIds.length === 1 ? selectedTankIds[0] : null, // Single tank or null for all
    siteIds: selectedSiteIds.length > 0 ? selectedSiteIds : null, // Multi-site support
    tankIds: selectedTankIds.length > 0 ? selectedTankIds : null, // Multi-tank support
    recordedBy: filterUserId,
    startDate: headerStartDate?.toISOString(),
    endDate: headerEndDate?.toISOString(),
    includeVehicleNames: true,
    useManualDispensing: useManualDispensing
  }), [selectedSiteIds, selectedTankIds, filterUserId, headerStartDate, headerEndDate, useManualDispensing]);

  // Filtered tanks based on selected sites from header
  const filteredTanks = useMemo(() =>
    selectedSiteIds.length > 0
      ? tanks.filter(tank => selectedSiteIds.includes(tank.siteId))
      : tanks,
    [selectedSiteIds, tanks]
  );

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

      // Load initial data with default filters (already set by useState)
      dispatch(fetchTankVolumeHistoryFiltered(currentFilters));
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized, currentFilters]);

  // React to header filter changes and reload data
  useEffect(() => {
    if (isInitialized) {
      console.log('Header filters changed, reloading data with:', currentFilters);
      dispatch(fetchTankVolumeHistoryFiltered(currentFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds, isInitialized]);

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

  // Manual refresh function
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

  // Refresh data after successful manual refill
  const handleManualRefillSuccess = useCallback(() => {
    setShowManualRefillForm(false);
    handleRefresh();
    notify({
      message: 'Manual refill recorded successfully',
      type: 'success',
      displayTime: 3000,
      position: 'top center'
    });
  }, [handleRefresh]);

  // Clear local filters only (site/tank/dates are in header)
  const handleClearFilters = useCallback(() => {
    setFilterUserId(null);
    setUseManualDispensing(false);
  }, []);

  // Toggle manual dispensing
  const handleToggleManualDispensing = useCallback((value) => {
    setUseManualDispensing(value);
  }, []);

  // Date navigation removed - dates now controlled by header filters

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
      showDetails: false,
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
          displayTime: 4000,
          position: 'top center'
        });

        // Use timeout to ensure DOM stability before closing
        setTimeout(() => {
          setDeleteConfirmation({
            visible: false,
            transaction: null,
            validationResult: null,
            isDeleting: false,
            showImpactDetails: false,
            showDetails: false,
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
          displayTime: 3000,
          position: 'top center'
        });

        // Close dialog with timeout for DOM stability
        setTimeout(() => {
          setDeleteConfirmation({
            visible: false,
            transaction: null,
            validationResult: null,
            isDeleting: false,
            showImpactDetails: false,
            showDetails: false,
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
        displayTime: 4000,
        position: 'top center'
      });

      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirmation, handleRefresh]);

  // Toggle expand/collapse all groups
  const handleToggleExpandGroups = useCallback(() => {
    const dataGrid = dataGridRef.current?.instance;
    if (dataGrid) {
      if (isGroupsExpanded) {
        dataGrid.collapseAll(-1); // Collapse all group levels
      } else {
        dataGrid.expandAll(-1); // Expand all group levels
      }
      setIsGroupsExpanded(!isGroupsExpanded);
    }
  }, [isGroupsExpanded]);

  // Handle grouping change - stable version
  const handleGroupByChange = useCallback((groupType) => {
    setGroupBy(prev => {
      const newValue = !prev[groupType];
      // Only update if value actually changed
      if (prev[groupType] === newValue) {
        return prev;
      }
      return {
        ...prev,
        [groupType]: newValue
      };
    });
  }, []);

  // Calculate group indices based on active groupings (site > tank > date hierarchy)
  const getGroupIndex = useCallback((columnType) => {
    const activeGroups = [];
    // Order: site first, then tank, then date (date is always last)
    if (groupBy.site) activeGroups.push('site');
    if (groupBy.tank) activeGroups.push('tank');
    if (groupBy.date) activeGroups.push('date');

    const index = activeGroups.indexOf(columnType);
    return index >= 0 ? index : undefined;
  }, [groupBy.site, groupBy.tank, groupBy.date]);

  // Check if any grouping is active
  const hasActiveGrouping = useMemo(() => {
    return groupBy.date || groupBy.site || groupBy.tank;
  }, [groupBy.date, groupBy.site, groupBy.tank]);

  // Create a stable key for DataGrid to force remount when grouping changes
  const dataGridKey = useMemo(() => {
    const parts = [];
    if (groupBy.site) parts.push('site');
    if (groupBy.tank) parts.push('tank');
    if (groupBy.date) parts.push('date');
    return parts.length > 0 ? parts.join('-') : 'no-grouping';
  }, [groupBy.site, groupBy.tank, groupBy.date]);

  // Handle row click to prevent errors with group rows
  const onRowClick = useCallback((e) => {
    // Only process clicks on data rows, not group rows
    if (e.rowType === 'group') {
      // Let DevExtreme handle group row expansion
      return;
    }
    // For data rows, you can add custom logic here if needed
  }, []);

  // Clear all groupings - stable version that prevents infinite loops
  const handleClearGrouping = useCallback(() => {
    setGroupBy(prev => {
      // Only update if there's actually something to clear
      if (!prev.date && !prev.site && !prev.tank) {
        return prev;
      }
      return { date: false, site: false, tank: false };
    });
  }, []);  const handleCancelDelete = useCallback(() => {
    // Use timeout to ensure DOM stability before state change
    setTimeout(() => {
      setDeleteConfirmation({
        visible: false,
        transaction: null,
        validationResult: null,
        isDeleting: false,
        showImpactDetails: false,
        showDetails: false,
        deletionReason: '',
        userConfirmed: false
      });
    }, 50);
  }, []);

  // Stable dialog content with better key management
  const DeleteConfirmationContent = useCallback(() => {
    const { validationResult, transaction, userConfirmed, isDeleting, showDetails } = deleteConfirmation;

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
      <ScrollView height="100%" width="100%" showScrollbar="onScroll">
        <div key="content" className="tw-px-1">
          {/* Transaction Summary - Always Visible */}
          <div className="tw-mb-4">
            <h4 className="tw-text-base tw-font-semibold tw-text-gray-800 tw-mb-2">
              Transaction Summary
            </h4>
            <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg tw-text-sm tw-space-y-1">
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
                  <div className="tw-flex-1">
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
                  <div className="tw-flex-1">
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                      <h5 className="tw-font-semibold tw-text-yellow-800">Warning: Future Records Detected</h5>
                      <Button
                        text={showDetails ? "Hide Details" : "View Details"}
                        icon={showDetails ? "fa-light fa-chevron-up" : "fa-light fa-chevron-down"}
                        stylingMode="text"
                        onClick={() => setDeleteConfirmation(prev => ({
                          ...prev,
                          showDetails: !prev.showDetails
                        }))}
                        elementAttr={{
                          style: { height: '24px', fontSize: '11px' }
                        }}
                      />
                    </div>
                    <p className="tw-text-yellow-700 tw-mb-3">{validationResult.message || 'This action will affect future records'}</p>

                    {showDetails && validationResult.futureRecordsCount > 0 && (
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

                    {showDetails && validationResult.detailedWarning && (
                      <p className="tw-text-yellow-600 tw-text-sm tw-mb-3">
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
                  <div className="tw-flex-1">
                    <h5 className="tw-font-semibold tw-text-green-800 tw-mb-2">Safe to Delete</h5>
                    <p className="tw-text-green-700">{validationResult.message || 'This transaction can be safely deleted'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-2">
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
      </ScrollView>
    );
  }, [deleteConfirmation, VolumeChangeReasonEnum, tanks, executeDelete, handleCancelDelete]);

  // Format timestamp for display (full date and time)
  const formatTime = (cellInfo) => {
    if (!cellInfo.value) return '';
    const date = new Date(cellInfo.value);
    return isNaN(date.getTime()) ? cellInfo.value : date.toLocaleString();
  };

  // Format date only (for grouping) - returns just the date part
  const formatDateOnly = (cellInfo) => {
    if (!cellInfo.value) return '';
    const date = new Date(cellInfo.value);
    if (isNaN(date.getTime())) return cellInfo.value;

    // Format as YYYY-MM-DD for consistent grouping
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate date group value (for grouping by date)
  const calculateDateGroupValue = (rowData) => {
    if (!rowData.timestamp) return '';
    const date = new Date(rowData.timestamp);
    if (isNaN(date.getTime())) return '';

    // Return YYYY-MM-DD format for consistent grouping
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time only (for time column when grouped by date)
  const formatTimeOnly = (cellInfo) => {
    if (!cellInfo.value) return '';
    const date = new Date(cellInfo.value);
    if (isNaN(date.getTime())) return cellInfo.value;
    return date.toLocaleTimeString();
  };

  // Render change reason - just the reason type, no vehicle info
  const changeReasonCellRender = (cellInfo) => {
    const reason = VolumeChangeReasonEnum.find(r => r.id === cellInfo.value);
    return reason ? reason.name : cellInfo.value;
  };

  // Export functionality using external utility
  const onExporting = useCallback(async () => {
    try {
      await exportTransactionsToExcel({
        dataGridInstance: dataGridRef.current?.instance,
        startDate: headerStartDate,
        endDate: headerEndDate,
        userName: user?.userName || user?.username || 'Unknown User',
        volumeChangeReasonEnum: VolumeChangeReasonEnum
      });

      notify({
        message: 'Export completed successfully!',
        type: 'success',
        displayTime: 2000,
        position: 'top center'
      });
    } catch (error) {
      console.error('Export failed:', error);
      notify({
        message: 'Failed to export data. Please try again.',
        type: 'error',
        displayTime: 3000,
        position: 'top center'
      });
    }
  }, [headerStartDate, headerEndDate, user, VolumeChangeReasonEnum]);

  // AI Analysis Report Export
  const onExportingAnalysis = useCallback(async () => {
    try {
      await exportAnalysisReport({
        transactions: tankVolumeHistory,
        tanks: tanks,
        sites: sites,
        startDate: headerStartDate,
        endDate: headerEndDate,
        volumeChangeReasonEnum: VolumeChangeReasonEnum,
        userName: user?.userName || user?.username || 'Unknown User'
      });

      notify({
        message: 'AI-Style Analysis Report generated successfully!',
        type: 'success',
        displayTime: 3000,
        position: 'top center'
      });
    } catch (error) {
      console.error('Analysis export failed:', error);
      notify({
        message: 'Failed to generate analysis report. Please try again.',
        type: 'error',
        displayTime: 3000,
        position: 'top center'
      });
    }
  }, [tankVolumeHistory, tanks, sites, headerStartDate, headerEndDate, VolumeChangeReasonEnum, user]);

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
            {/* All buttons in same container for proper alignment */}
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full sm:tw-w-auto">
              {/* Stock Management - full width on mobile, auto on desktop */}
              <div className="tw-w-full sm:tw-w-auto">
                <QuickActions
                  collapsed={false}
                  onRefreshData={handleRefresh}
                  sites={sites}
                  user={user}
                />
              </div>

              {/* Segmented Button Group: Refresh, Export */}
              <div className="transaction-hub__action-buttons">
                <Button
                  text="Refresh"
                  icon="fa-light fa-refresh"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleRefresh}
                  hint="Refresh data"
                  className="transaction-hub__action-btn transaction-hub__action-btn--first"
                />

                <Button
                  text="Export"
                  icon="fa-light fa-file-excel"
                  type="default"
                  stylingMode="outlined"
                  onClick={onExporting}
                  hint="Export to Excel"
                  className="transaction-hub__action-btn transaction-hub__action-btn--excel"
                />

                <Button
                  text="Analysis Report"
                  icon="fa-light fa-chart-mixed"
                  type="default"
                  stylingMode="outlined"
                  onClick={onExportingAnalysis}
                  hint="Generate AI-style site analysis report"
                  className="transaction-hub__action-btn transaction-hub__action-btn--analysis transaction-hub__action-btn--last"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inline Filter Panel - Only User and Manual Dispensing (Site/Tank/Dates in header) */}
        <div className="tw-mt-4 tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-gap-4">
            {/* User Filter */}
            <div style={{ width: '200px' }}>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Recorded By
              </label>
              <SelectBox
                dataSource={usersForFilter}
                displayExpr="userName"
                valueExpr="userId"
                value={filterUserId}
                onValueChanged={(e) => setFilterUserId(e.value)}
                placeholder="All Users"
                searchEnabled={true}
                showClearButton={true}
              />
            </div>

            {/* Manual Dispensing Checkbox */}
            <div className="tw-flex tw-items-end tw-pb-1">
              <CheckBox
                text="Use Manual Dispensing"
                value={currentFilters.useManualDispensing}
                onValueChanged={(e) => handleToggleManualDispensing(e.value)}
                hint="Show manual dispensing from TankStock instead of sensor dispensing"
              />
            </div>

            {/* Filter Action Buttons */}
            <div className="tw-flex tw-gap-2 tw-items-end">
              <Button
                text="Apply"
                icon="fa-light fa-search"
                type="default"
                stylingMode="contained"
                onClick={handleApplyFilters}
              />
              <Button
                text="Clear"
                icon="fa-light fa-times"
                type="normal"
                stylingMode="outlined"
                onClick={handleClearFilters}
              />
            </div>
          </div>
        </div>

        {/* Current Filters Display - Shows header filters + tab filters */}
        <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3">
            {/* Active filters info */}
            <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-text-sm tw-text-blue-800 tw-gap-2 tw-flex-1">
              <div className="tw-flex tw-items-center tw-flex-shrink-0">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                <span className="tw-font-medium">Active Filters:</span>
              </div>

              {/* Filter tags - responsive wrapping */}
              <div className="tw-flex tw-flex-wrap tw-gap-2 tw-flex-1">
                {/* Site filter from header */}
                {selectedSiteIds && selectedSiteIds.length > 0 ? (
                  selectedSiteIds.length === 1 ? (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                      Site: {sites?.find(s => s.id === selectedSiteIds[0])?.name || 'Unknown'}
                    </span>
                  ) : (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                      Sites: {selectedSiteIds.length} selected
                    </span>
                  )
                ) : (
                  <span className="tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    All Sites
                  </span>
                )}

                {/* Tank filter from header */}
                {selectedTankIds && selectedTankIds.length > 0 && (
                  selectedTankIds.length === 1 ? (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                      Tank: {tanks?.find(t => t.id === selectedTankIds[0])?.name || 'Unknown'}
                    </span>
                  ) : (
                    <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                      Tanks: {selectedTankIds.length} selected
                    </span>
                  )
                )}

                {/* User filter - tab specific */}
                {filterUserId && (
                  <span className="tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    User: {usersForFilter?.find(u => u.userId === filterUserId)?.userName || 'Unknown'}
                  </span>
                )}

                {/* Date range from header */}
                <span className="tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                  {headerStartDate && headerEndDate ? (
                    (() => {
                      const startDay = headerStartDate.toLocaleDateString();
                      const endDay = headerEndDate.toLocaleDateString();

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

                {/* Manual Dispensing indicator */}
                {useManualDispensing && (
                  <span className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                    Manual Dispensing
                  </span>
                )}
              </div>
            </div>

            {/* Reset tab filters button */}
            <div className="tw-flex-shrink-0">
              <Button
                text="Clear Tab Filters"
                onClick={handleClearFilters}
                stylingMode="text"
                className="tw-text-xs tw-text-blue-600 tw-w-full sm:tw-w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Responsive padding */}
      <div className="tw-flex-1 tw-p-2 sm:tw-p-4 tw-overflow-hidden tw-flex tw-flex-col">
        {/* Date navigation removed - dates now controlled by header filters */}

        {/* DataGrid Container */}
        <div className="tw-flex-1 tw-min-h-0">
          <DataGrid
            key={dataGridKey}
            dataSource={tankVolumeHistory}
            keyExpr="id"
            showBorders={true}
            ref={dataGridRef}
            showColumnLines={true}
            showRowLines={true}
            allowColumnResizing={true}
            showColumnHeaders={true}
            className="tw-h-full"
            onRowClick={onRowClick}
          >
          <FilterPanel visible={true} />
          <GroupPanel visible={false} />
          <Grouping visible={true} autoExpandAll={isGroupsExpanded} allowCollapsing={true} />
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
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
            {/* COMMENTED OUT FOR NOW - Chart Views Dropdown */}
            {/*
            <TBItem
              location="after"
              render={() => (
                <DropDownButton
                  text="📊 Chart Views"
                  icon="fa-light fa-chart-line"
                  dropDownOptions={{
                    width: 250,
                  }}
                  items={chartTypeOptions}
                  keyExpr="key"
                  displayExpr="text"
                  onItemClick={(e) => handleChartTypeSelection(e.itemData.key)}
                  splitButton={false}
                  useSelectMode={false}
                  stylingMode="contained"
                  type="default"
                  elementAttr={{
                    class: 'chart-dropdown-button',
                    style: { marginRight: '8px' }
                  }}
                />
              )}
            />
            */}
          </Toolbar>

          {/* Columns */}
          <Column dataField="id" caption="ID" visible={false} defaultSortOrder="desc" />
          <Column
            dataField="timestamp"
            caption={groupBy.date ? 'Date' : 'Date & Time'}
            cellRender={groupBy.date ? formatDateOnly : formatTime}
            minWidth={150}
            defaultSortOrder="desc"
            sortIndex={0}
            groupIndex={getGroupIndex('date')}
            calculateGroupValue={groupBy.date ? calculateDateGroupValue : undefined}
            allowGrouping={true}
          />
          {groupBy.date && (
            <Column
              dataField="timestamp"
              caption="Time"
              cellRender={formatTimeOnly}
              minWidth={100}
              allowGrouping={false}
              allowFiltering={false}
            />
          )}
          <Column
            dataField="site"
            caption="Site"
            groupIndex={getGroupIndex('site')}
            allowGrouping={true}
          />
          <Column
            dataField="tankId"
            caption="Tank"
            groupIndex={getGroupIndex('tank')}
            allowGrouping={true}
          >
            <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="changeReason"
            caption="Transaction Type"
            minWidth={130}
            cellRender={changeReasonCellRender}
            allowGrouping={true}
          >
            <Lookup dataSource={VolumeChangeReasonEnum} valueExpr="id" displayExpr="name" />
          </Column>
          <Column
            dataField="vehicleName"
            caption="Vehicle"
            minWidth={120}
            visible={true}
          />
          <Column
            dataField="vehicleType"
            caption="Vehicle Type"
            minWidth={120}
            visible={true}
          />
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
             <ColumnChooser
          height='340px'
          enabled={true}
          mode='selection'
        >
             <ColumnChooserSelection
            allowSelectAll={true}
            selectByClick={true}
            recursive= 'true' />
           <Position
            my="right top"
            at="right bottom"
            of=".dx-datagrid-column-chooser-button"
          />
        </ColumnChooser>

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
          <Summary calculateCustomSummary={(options) => {
            // Custom summary calculation for dispensing in groups and totals
            if (showDispensingTotal && (options.name === 'GroupDispensing' || options.name === 'TotalDispensing')) {
              if (options.summaryProcess === 'start') {
                options.totalValue = 0;
              } else if (options.summaryProcess === 'calculate') {
                // Only sum dispensing transactions (changeReason === 6)
                if (options.value.changeReason === 6) {
                  options.totalValue += Math.abs(options.value.volumeChange || 0);
                }
              }
            }
          }}>
            {/* Group-level summaries (shown in each group footer) */}
            {/* <GroupItem
              column="volumeChange"
              summaryType="sum"
              valueFormat="#,##0"
              displayFormat="Dispense: {0}L"
              alignByColumn={true}
            /> */}
            {showDispensingTotal && (
              <GroupItem
                name="GroupDispensing"
                summaryType="custom"
                customizeText={(data) => {
                  return `Dispensing: ${data.value?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'} L`;
                }}
                alignByColumn={true}
                showInGroupFooter={false}
              />
            )}
            <GroupItem
              column="id"
              summaryType="count"
              displayFormat="Transactions: {0}"
              alignByColumn={true}
            />

            {/* Total-level summaries (shown at the bottom of entire grid) */}
            <TotalItem
              column="volumeChange"
              summaryType="sum"
              valueFormat="#,##0.00"
              displayFormat="Total Volume Change: {0}L"
            />
            {showDispensingTotal && (
              <TotalItem
                name="TotalDispensing"
                summaryType="custom"
                customizeText={(data) => {
                  return `Total Dispensing: ${data.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}L`;
                }}
              />
            )}
            <TotalItem
              column="id"
              summaryType="count"
              displayFormat="Total Transactions: {0}"
            />
          </Summary>
        </DataGrid>
        </div>

        {/* Group Control Buttons */}
        <div className="tw-mt-3 tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
          <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-gap-3">
            {/* Grouping Options */}
            <div className="tw-flex tw-items-center tw-gap-4">
              <label className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center">
                <i className="fa-light fa-layer-group tw-mr-2"></i>
                Group By:
              </label>

              {/* Date Checkbox */}
              <div className="tw-flex tw-items-center">
                <CheckBox
                  text="Date"
                  value={groupBy.date}
                  onValueChanged={() => handleGroupByChange('date')}
                  elementAttr={{
                    class: 'tw-flex tw-items-center'
                  }}
                />
                <i className="fa-light fa-calendar tw-ml-1 tw-text-gray-500"></i>
              </div>

              {/* Site Checkbox */}
              <div className="tw-flex tw-items-center">
                <CheckBox
                  text="Site"
                  value={groupBy.site}
                  onValueChanged={() => handleGroupByChange('site')}
                  elementAttr={{
                    class: 'tw-flex tw-items-center'
                  }}
                />
                <i className="fa-light fa-building tw-ml-1 tw-text-gray-500"></i>
              </div>

              {/* Tank Checkbox */}
              <div className="tw-flex tw-items-center">
                <CheckBox
                  text="Tank"
                  value={groupBy.tank}
                  onValueChanged={() => handleGroupByChange('tank')}
                  elementAttr={{
                    class: 'tw-flex tw-items-center'
                  }}
                />
                <i className="fa-light fa-gas-pump tw-ml-1 tw-text-gray-500"></i>
              </div>

              {/* Clear Grouping Button */}
              {hasActiveGrouping && (
                <Button
                  text="Clear"
                  icon="fa-light fa-times"
                  onClick={handleClearGrouping}
                  stylingMode="text"
                  type="danger"
                  elementAttr={{
                    class: 'tw-text-sm'
                  }}
                  hint="Clear all groupings"
                />
              )}
            </div>

            {/* Group Controls */}
            {hasActiveGrouping && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-border-l tw-border-gray-300 tw-pl-4">
                <Button
                  text={isGroupsExpanded ? "Collapse All" : "Expand All"}
                  icon={isGroupsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
                  onClick={handleToggleExpandGroups}
                  stylingMode="outlined"
                  type="default"
                  elementAttr={{
                    class: 'tw-text-sm'
                  }}
                />
                <Button
                  text={showDispensingTotal ? "Hide Dispensing" : "Show Dispensing"}
                  icon={showDispensingTotal ? "fa-light fa-eye-slash" : "fa-light fa-eye"}
                  onClick={() => setShowDispensingTotal(!showDispensingTotal)}
                  stylingMode="outlined"
                  type="default"
                  elementAttr={{
                    class: 'tw-text-sm'
                  }}
                  hint={showDispensingTotal ? "Hide dispensing totals in summaries" : "Show dispensing totals in summaries"}
                />
              </div>
            )}

            {/* Active Grouping Indicator */}
            {hasActiveGrouping && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600 tw-ml-auto">
                <i className="fa-light fa-info-circle"></i>
                <span>
                  Grouped by: {[
                    groupBy.date && 'Date',
                    groupBy.site && 'Site',
                    groupBy.tank && 'Tank'
                  ].filter(Boolean).join(' → ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Refill Popup */}
      <Popup
        visible={showManualRefillForm}
        onHiding={() => setShowManualRefillForm(false)}
        showTitle={true}
        title="Manual Fuel Refill"
        width={1040}
        height={780}
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

      {/* Delete Confirmation Dialog - FIXED VERSION */}
      <Popup
        visible={deleteConfirmation.visible}
        onHiding={handleCancelDelete}
        showTitle={true}
        title="Delete Transaction"
        width={() => window.innerWidth <= 768 ? '98%' : 600}
        height={500}
        showCloseButton={true}
        dragEnabled={true}
        hideOnOutsideClick={false}
      >
        <div className="tw-h-full tw-flex tw-flex-col">
          <DeleteConfirmationContent />
        </div>
      </Popup>

      {/* Chart View Component - COMMENTED OUT FOR NOW */}
      {/* <ChartView
        visible={showChartPopup}
        onClose={() => setShowChartPopup(false)}
        tankVolumeHistory={tankVolumeHistory}
        tanks={tanks}
        sites={sites}
        currentFilters={currentFilters}
        selectedChartType={selectedChartType}
      /> */}

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
