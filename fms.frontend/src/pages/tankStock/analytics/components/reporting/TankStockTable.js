/**
 * File: TankStockTable.js
 * Purpose: Manage tank stock records in a grid with resilient lookup loading and CRUD permissions
 * Dependencies: React, Redux, DevExtreme DataGrid, tank stock APIs, StockFilterContext
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - TankStockTable(): Renders editable Tank Stock grid with lookup data and export support
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  SearchPanel,
  Export,
  Editing,
  Popup,
  Form,
  Toolbar,
  Item,
  Summary,
  TotalItem,
  Lookup
} from 'devextreme-react/data-grid';
import { Item as FormItem, Label, RequiredRule } from 'devextreme-react/form';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import TankStockReportsService from '../../../../../services/tankStockReportsService';
import axiosInstance from '../../../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';
import { useStockFilters } from '../../../shared/context/StockFilterContext';
import { fetchSiteList } from '../../../../../redux/actions/siteActions';
import { fetchTanks } from '../../../../../redux/actions/tankActions';
import { fetchUsersForFilter } from '../../../../../redux/actions/userActions';
import { usePermissions } from '../../../../../hooks/usePermissions';

/**
 * TankStockTable - Displays and manages TankStock data in an editable data grid
 * Features:
 * - Filter by date range, site, and tank using header filters
 * - Add, Edit, Delete tank stock records
 * - Export to Excel
 * - Shows site name, tank name, and user name (resolved from IDs)
 */
const TankStockTable = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const dataGridRef = useRef(null);

  // Get filters from shared context
  const { startDate, endDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // Get permissions from hook
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('_Create_TankStock');
  const canUpdate = hasPermission('_Update_TankStock');
  const canDelete = hasPermission('_Delete_TankStock');

  // Get lookup data from Redux store
  const sites = useSelector(state => state.site.sites || []);
  const tanks = useSelector(state => state.tank.tanks || []);
  const users = useSelector(state => state.user.users || []);
  const usersForFilter = useSelector(state => state.user.usersForFilter || []);

  const userLookupData = useMemo(() => {
    if (usersForFilter.length > 0) {
      return usersForFilter.map((u) => ({
        userId: u.userId,
        userName: u.userName
      }));
    }

    return users.map((u) => ({
      userId: u.id,
      userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || u.username || `User ${u.id}`
    }));
  }, [usersForFilter, users]);

  // Load lookup data using Redux actions
  const loadLookupData = useCallback(async () => {
    const lookupResults = await Promise.allSettled([
      dispatch(fetchSiteList()),
      dispatch(fetchTanks()),
      dispatch(fetchUsersForFilter())
    ]);

    const failedCount = lookupResults.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      console.warn(`TankStockTable: ${failedCount} lookup sources failed to load.`);
    }
  }, [dispatch]);

  // Load tank stock data
  const loadData = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    setLoading(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const params = {
        startDate: startDateStr,
        endDate: endDateStr,
        siteIds: selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds : undefined,
        tankIds: selectedTankIds && selectedTankIds.length > 0 ? selectedTankIds : undefined
      };

      const result = await TankStockReportsService.getTankStockData(params);

      if (result.success) {
        // Filter out soft-deleted records by default
        const activeRecords = (result.data || []).filter(record => !record.isDeleted);
        setData(activeRecords);

        const deletedCount = (result.data?.length || 0) - activeRecords.length;
        const message = deletedCount > 0
          ? `Loaded ${activeRecords.length} tank stock records (${deletedCount} deleted records hidden)`
          : `Loaded ${activeRecords.length} tank stock records`;

        notify({
          message,
          type: 'success',
          displayTime: 3000
        });
      } else {
        notify({
          message: `Failed to load tank stock data: ${result.error}`,
          type: 'error',
          displayTime: 5000
        });
        setData([]);
      }
    } catch (error) {
      console.error('Error loading tank stock data:', error);
      notify({
        message: `Failed to load tank stock data: ${error.message}`,
        type: 'error',
        displayTime: 5000
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedSiteIds, selectedTankIds]);

  // Load lookup data on mount
  useEffect(() => {
    loadLookupData();
  }, [loadLookupData]);

  // Load data when filters are available (triggered by Apply button)
  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [loadData, startDate, endDate]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const shouldProcessHistoryForUpdate = useCallback((record) => {
    const entryType = (record?.entryType || '').toLowerCase();
    if (entryType !== 'openingstock' && entryType !== 'closingstock') {
      return false;
    }

    if (!record?.entryDate) {
      return false;
    }

    const entryDate = new Date(record.entryDate);
    if (Number.isNaN(entryDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entryDate.setHours(0, 0, 0, 0);

    return entryDate < today;
  }, []);

  // Handle row insertion
  const handleRowInserting = useCallback(async (e) => {
    try {
      const newRecord = {
        tankId: e.data.tankId,
        siteId: e.data.siteId,
        entryDate: e.data.entryDate,
        entryType: e.data.entryType || 'OpeningStock',
        manualOpeningLevel: e.data.manualOpeningLevel || null,
        manualClosingLevel: e.data.manualClosingLevel || null,
        manualAmount: e.data.manualAmount || null,
        openingMeter: e.data.openingMeter || null,
        closingMeter: e.data.closingMeter || null,
        recordedBy: e.data.recordedBy,
        comment: e.data.comment || null
      };

      const response = await axiosInstance.post('/tankstock', newRecord);

      if (response.status === 201 || response.status === 200) {
        notify({
          message: 'Tank stock record created successfully',
          type: 'success',
          displayTime: 3000
        });
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error creating tank stock record:', error);
      notify({
        message: `Failed to create record: ${error.response?.data?.message || error.message}`,
        type: 'error',
        displayTime: 5000
      });
      e.cancel = true; // Cancel the insert operation
    }
  }, [loadData]);

  // Handle row updating
  const handleRowUpdating = useCallback(async (e) => {
    try {
      const updatedRecord = {
        ...e.oldData,
        ...e.newData
      };

      const shouldProcessHistory = shouldProcessHistoryForUpdate(updatedRecord);
      const requestUrl = shouldProcessHistory
        ? `/tankstock/${e.key}?processHistory=true`
        : `/tankstock/${e.key}`;

      const response = await axiosInstance.put(requestUrl, updatedRecord);

      if (response.status === 200) {
        notify({
          message: 'Tank stock record updated successfully',
          type: 'success',
          displayTime: 3000
        });
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error updating tank stock record:', error);
      notify({
        message: `Failed to update record: ${error.response?.data?.message || error.message}`,
        type: 'error',
        displayTime: 5000
      });
      e.cancel = true; // Cancel the update operation
    }
  }, [loadData, shouldProcessHistoryForUpdate]);

  // Handle row removal
  const handleRowRemoving = useCallback(async (e) => {
    try {
      const response = await axiosInstance.delete(`/tankstock/${e.key}`);

      if (response.status === 200) {
        notify({
          message: 'Tank stock record deleted successfully',
          type: 'success',
          displayTime: 3000
        });
        loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error deleting tank stock record:', error);
      notify({
        message: `Failed to delete record: ${error.response?.data?.message || error.message}`,
        type: 'error',
        displayTime: 5000
      });
      e.cancel = true; // Cancel the delete operation
    }
  }, [loadData]);

  // Export handler
  const onExporting = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('TankStock');

    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          // Format numbers
          if (typeof gridCell.value === 'number') {
            excelCell.numFmt = '#,##0.00';
          }
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `TankStock_${new Date().toISOString().split('T')[0]}.xlsx`);
      });
    });
  }, []);

  // Entry type options
  const entryTypeOptions = [
    { value: 'OpeningStock', text: 'Opening Stock' },
    { value: 'ClosingStock', text: 'Closing Stock' },
    { value: 'Delivery', text: 'Delivery' },
    { value: 'TransferIn', text: 'Transfer In' },
    { value: 'TransferOut', text: 'Transfer Out' },
    { value: 'Dispensing', text: 'Dispensing' },
    { value: 'Adjustment', text: 'Adjustment' }
  ];

  return (
    <div className="tw-flex tw-flex-col tw-h-full tw-rounded-lg tw-shadow tw-p-4 tank-stock-table-wrap" style={{ background: 'var(--fms-surface, #ffffff)' }}>
      {/* Header with refresh button */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4 tw-pb-3 tw-border-b tank-stock-table__header">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-mt-0" style={{ color: 'var(--fms-text-primary, #1f2937)' }}>
            <i className="fa-light fa-table tw-mr-2 tw-text-blue-600"></i>
            Tank Stock Data Management
          </h3>
          <p className="tw-text-sm tw-mt-1" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>
            <i className="fa-light fa-info-circle tw-mr-1"></i>
            View, add, edit, and delete tank stock records. Use the "Apply" button in the header to filter data.
          </p>
        </div>
        <Button
          icon="fa-light fa-refresh"
          text="Refresh"
          type="default"
          stylingMode="outlined"
          onClick={handleRefresh}
          disabled={loading || !startDate || !endDate}
        />
      </div>

      {loading && (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
          <LoadIndicator visible={true} />
          <span className="tw-ml-3" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>Loading tank stock data...</span>
        </div>
      )}

      {!loading && (
        <div style={{ height: '750px', display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            ref={dataGridRef}
            dataSource={data}
            keyExpr="entryId"
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            wordWrapEnabled={false}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnResizingMode="widget"
            height="100%"
            onExporting={onExporting}
            onRowInserting={handleRowInserting}
            onRowUpdating={handleRowUpdating}
            onRowRemoving={handleRowRemoving}
          >
            {/* Enable editing */}
            <Editing
              mode="popup"
              allowAdding={canCreate}
              allowUpdating={canUpdate}
              allowDeleting={canDelete}
              useIcons={true}
            >
              <Popup
                title="Tank Stock Entry"
                showTitle={true}
                width={700}
                height={600}
              />
              <Form>
                <FormItem itemType="group" colCount={2} colSpan={2}>
                  <FormItem dataField="siteId">
                    <RequiredRule message="Site is required" />
                  </FormItem>
                  <FormItem dataField="tankId">
                    <RequiredRule message="Tank is required" />
                  </FormItem>
                  <FormItem dataField="entryDate">
                    <RequiredRule message="Entry Date is required" />
                  </FormItem>
                  <FormItem dataField="entryType">
                    <RequiredRule message="Entry Type is required" />
                  </FormItem>
                  <FormItem dataField="manualOpeningLevel" />
                  <FormItem dataField="manualClosingLevel" />
                  <FormItem dataField="openingMeter" />
                  <FormItem dataField="closingMeter" />
                  <FormItem dataField="manualAmount" />
                  <FormItem dataField="recordedBy">
                    <RequiredRule message="Recorded By is required" />
                  </FormItem>
                  <FormItem dataField="comment" colSpan={2} editorType="dxTextArea" />
                </FormItem>
              </Form>
            </Editing>

            <SearchPanel visible={true} width={240} placeholder="Search..." />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={50} />
            <Pager
              visible={true}
              allowedPageSizes={[20, 50, 100, 200]}
              showPageSizeSelector={true}
              showInfo={true}
              showNavigationButtons={true}
            />
            <Export enabled={true} allowExportSelectedData={false} />

            {/* Columns - NO grouping */}
            <Column
              dataField="siteId"
              caption="Site"
              width={200}
            >
              <Lookup
                dataSource={sites}
                valueExpr="id"
                displayExpr="name"
              />
            </Column>
            <Column
              dataField="tankId"
              caption="Tank"
              width={150}
            >
              <Lookup
                dataSource={tanks}
                valueExpr="id"
                displayExpr="name"
              />
            </Column>
            <Column
              dataField="entryDate"
              caption="Entry Date"
              dataType="date"
              format="dd/MM/yyyy HH:mm"
              width={150}
            />
            <Column
              dataField="entryType"
              caption="Entry Type"
              width={150}
            >
              <Lookup
                dataSource={entryTypeOptions}
                valueExpr="value"
                displayExpr="text"
              />
            </Column>
            <Column
              dataField="manualOpeningLevel"
              caption="Opening Level"
              dataType="number"
              format="#,##0.00"
              width={130}
            />
            <Column
              dataField="manualClosingLevel"
              caption="Closing Level"
              dataType="number"
              format="#,##0.00"
              width={130}
            />
            <Column
              dataField="manualAmount"
              caption="Amount"
              dataType="number"
              format="#,##0.00"
              width={120}
            />
            <Column
              dataField="openingMeter"
              caption="Opening Meter"
              dataType="number"
              format="#,##0.00"
              width={130}
            />
            <Column
              dataField="closingMeter"
              caption="Closing Meter"
              dataType="number"
              format="#,##0.00"
              width={130}
            />
            <Column
              dataField="recordedBy"
              caption="Recorded By"
              width={200}
            >
              <Lookup
                dataSource={userLookupData}
                valueExpr="userId"
                displayExpr="userName"
              />
            </Column>
            <Column
              dataField="comment"
              caption="Comment"
              width={200}
            />

            <Summary>
              <TotalItem
                column="manualAmount"
                summaryType="sum"
                valueFormat="#,##0.00"
                displayFormat="Total: {0}"
              />
            </Summary>

            <Toolbar>
              {canCreate && <Item name="addRowButton" />}
              <Item name="searchPanel" />
              <Item name="exportButton" />
            </Toolbar>
          </DataGrid>
        </div>
      )}

      {!loading && !startDate && !endDate && (
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-calendar tw-text-4xl tw-text-blue-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-mb-2" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>
            Select Date Range
          </h3>
          <p style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>
            Please select a date range from the header filters and click "Apply" to load tank stock data.
          </p>
        </div>
      )}

      {!loading && startDate && endDate && data.length === 0 && (
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-table tw-text-4xl tw-mb-4" style={{ color: 'var(--fms-text-tertiary, #9ca3af)' }}></i>
          <h3 className="tw-text-xl tw-font-semibold tw-mb-2" style={{ color: 'var(--fms-text-secondary, #4b5563)' }}>
            No Data Available
          </h3>
          <p style={{ color: 'var(--fms-text-tertiary, #6b7280)' }}>
            No tank stock records found for the selected date range. Try adjusting your filters or add a new record.
          </p>
        </div>
      )}
    </div>
  );
};

export default TankStockTable;
