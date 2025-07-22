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
import { fetchEmployees } from '../../../../redux/actions/employeeActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import ManualRefillForm from '../../forms/ManualRefillForm';
import TransactionFilterPopup from './TransactionFilterPopup';
import transactionDeleteService from '../../../../services/transactionDeleteService';

const TransactionHub = ({ selectedSite, dateRange }) => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Redux state
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const isLoading = useSelector((state) => state.tankVolumeHistory.isLoading);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);

  // Local state
  const [showManualRefillForm, setShowManualRefillForm] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
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

  // Delete transaction handlers
  const handleDeleteTransaction = useCallback(async (transaction) => {
    console.log('Delete transaction initiated:', transaction);

    try {
      // Set initial state
      setDeleteConfirmation({
        visible: true,
        transaction,
        validationResult: null,
        isDeleting: false,
        showImpactDetails: false,
        deletionReason: '',
        userConfirmed: false
      });

      // Validate deletion with future records service
      const validation = await transactionDeleteService.validateDelete({
        tankId: transaction.tankId,
        entryDate: transaction.timestamp,
        entryType: transaction.changeReason
      });

      console.log('Delete validation result:', validation);

      if (!validation.success) {
        throw new Error(validation.error || 'Validation failed');
      }

      // Update state with validation result
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

      // Close dialog on error
      setDeleteConfirmation({
        visible: false,
        transaction: null,
        validationResult: null,
        isDeleting: false,
        showImpactDetails: false,
        deletionReason: '',
        userConfirmed: false
      });
    }
  }, []);

  const executeDelete = useCallback(async () => {
    const { transaction, userConfirmed, deletionReason } = deleteConfirmation;

    if (!transaction) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      // Call delete API endpoint using the new service
      const result = await transactionDeleteService.deleteTransaction(
        transaction.id,
        userConfirmed,
        deletionReason
      );

      if (result.success) {
        notify({
          message: 'Transaction deleted successfully!',
          type: 'success',
          displayTime: 3000
        });

        // Close dialog and refresh data
        setDeleteConfirmation({
          visible: false,
          transaction: null,
          validationResult: null,
          isDeleting: false,
          showImpactDetails: false,
          deletionReason: '',
          userConfirmed: false
        });

        // Refresh the transaction data
        await handleRefresh();

      } else {
        throw new Error(result.error || 'Failed to delete transaction');
      }

    } catch (error) {
      console.error('Error deleting transaction:', error);
      notify({
        message: `Failed to delete transaction: ${error.message}`,
        type: 'error',
        displayTime: 4000
      });
    } finally {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirmation, handleRefresh]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmation({
      visible: false,
      transaction: null,
      validationResult: null,
      isDeleting: false,
      showImpactDetails: false,
      deletionReason: '',
      userConfirmed: false
    });
  }, []);

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
                <Button
                  icon="fa-light fa-trash"
                  stylingMode="text"
                  onClick={() => handleDeleteTransaction(cellData.data)}
                  className="tw-text-red-600 hover:tw-text-red-800"
                  hint="Delete Transaction"
                  disabled={isLoading || deleteConfirmation.isDeleting}
                />
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

      {/* Delete Confirmation Dialog */}
      <Popup
        visible={deleteConfirmation.visible}
        onHiding={handleCancelDelete}
        showTitle={true}
        title="Delete Transaction"
        width={600}
        height="auto"
        showCloseButton={true}
        dragEnabled={true}
        contentRender={() => (
          <div className="tw-p-6">
            {deleteConfirmation.validationResult ? (
              <div>
                {/* Transaction Details */}
                <div className="tw-mb-6">
                  <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
                    Transaction to Delete
                  </h4>
                  <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-space-y-2">
                    <div className="tw-flex tw-justify-between">
                      <span className="tw-font-medium">Date:</span>
                      <span>{deleteConfirmation.transaction ? new Date(deleteConfirmation.transaction.timestamp).toLocaleString() : ''}</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span className="tw-font-medium">Type:</span>
                      <span>{deleteConfirmation.transaction ? VolumeChangeReasonEnum.find(r => r.id === deleteConfirmation.transaction.changeReason)?.name : ''}</span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span className="tw-font-medium">Volume Change:</span>
                      <span className={`tw-font-medium ${(deleteConfirmation.transaction?.volumeChange || 0) >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                        {deleteConfirmation.transaction?.volumeChange?.toLocaleString()} L
                      </span>
                    </div>
                    <div className="tw-flex tw-justify-between">
                      <span className="tw-font-medium">Tank:</span>
                      <span>{tanks?.find(t => t.id === deleteConfirmation.transaction?.tankId)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Validation Results */}
                {!deleteConfirmation.validationResult.isAllowed ? (
                  <div className="tw-mb-6">
                    <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                      <div className="tw-flex tw-items-start">
                        <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mr-3 tw-mt-1"></i>
                        <div>
                          <h5 className="tw-font-semibold tw-text-red-800 tw-mb-2">Delete Blocked</h5>
                          <p className="tw-text-red-700">{deleteConfirmation.validationResult.message}</p>
                          {deleteConfirmation.validationResult.detailedWarning && (
                            <p className="tw-text-red-600 tw-text-sm tw-mt-2">
                              {deleteConfirmation.validationResult.detailedWarning}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : deleteConfirmation.validationResult.requiresUserConfirmation ? (
                  <div className="tw-mb-6">
                    <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4">
                      <div className="tw-flex tw-items-start">
                        <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mr-3 tw-mt-1"></i>
                        <div>
                          <h5 className="tw-font-semibold tw-text-yellow-800 tw-mb-2">Warning: Future Records Detected</h5>
                          <p className="tw-text-yellow-700 tw-mb-3">{deleteConfirmation.validationResult.message}</p>

                          {deleteConfirmation.validationResult.futureRecordsCount > 0 && (
                            <div className="tw-bg-white tw-p-3 tw-rounded tw-border tw-mb-3">
                              <div className="tw-text-sm tw-space-y-1">
                                <div className="tw-flex tw-justify-between">
                                  <span>Future Records:</span>
                                  <span className="tw-font-medium">{deleteConfirmation.validationResult.futureRecordsCount}</span>
                                </div>
                                {deleteConfirmation.validationResult.earliestFutureRecord && (
                                  <div className="tw-flex tw-justify-between">
                                    <span>Earliest:</span>
                                    <span className="tw-font-medium">
                                      {new Date(deleteConfirmation.validationResult.earliestFutureRecord).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {deleteConfirmation.validationResult.latestFutureRecord && (
                                  <div className="tw-flex tw-justify-between">
                                    <span>Latest:</span>
                                    <span className="tw-font-medium">
                                      {new Date(deleteConfirmation.validationResult.latestFutureRecord).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {deleteConfirmation.validationResult.detailedWarning && (
                            <p className="tw-text-yellow-600 tw-text-sm">
                              {deleteConfirmation.validationResult.detailedWarning}
                            </p>
                          )}

                          <div className="tw-mt-4">
                            <label className="tw-flex tw-items-center tw-space-x-2">
                              <input
                                type="checkbox"
                                checked={deleteConfirmation.userConfirmed}
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
                  </div>
                ) : (
                  <div className="tw-mb-6">
                    <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
                      <div className="tw-flex tw-items-start">
                        <i className="fa-light fa-check-circle tw-text-green-600 tw-mr-3 tw-mt-1"></i>
                        <div>
                          <h5 className="tw-font-semibold tw-text-green-800 tw-mb-2">Safe to Delete</h5>
                          <p className="tw-text-green-700">{deleteConfirmation.validationResult.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="tw-flex tw-justify-end tw-space-x-3">
                  <Button
                    text="Cancel"
                    onClick={handleCancelDelete}
                    stylingMode="outlined"
                    disabled={deleteConfirmation.isDeleting}
                  />
                  {deleteConfirmation.validationResult.isAllowed && (
                    <Button
                      text={deleteConfirmation.isDeleting ? "Deleting..." : "Delete Transaction"}
                      onClick={executeDelete}
                      type="default"
                      disabled={
                        deleteConfirmation.isDeleting ||
                        (deleteConfirmation.validationResult.requiresUserConfirmation && !deleteConfirmation.userConfirmed)
                      }
                      className="tw-bg-red-600 hover:tw-bg-red-700"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
                <div className="tw-text-center">
                  <i className="fa-light fa-spinner tw-animate-spin tw-text-2xl tw-text-blue-600 tw-mb-3"></i>
                  <p className="tw-text-gray-600">Validating deletion...</p>
                </div>
              </div>
            )}
          </div>
        )}
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
