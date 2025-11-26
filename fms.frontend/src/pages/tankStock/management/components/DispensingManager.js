/**
 * DispensingManager Component
 * Purpose: Manage bulk fuel dispensing volume entries - Create, Edit, Delete
 * Features: Filterable datagrid, printable, filter by tank/user/site
 * Styling: Inspired by TransactionHub
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Paging,
  Pager,
  HeaderFilter,
  SearchPanel,
  FilterRow,
  Column,
  Lookup,
  Editing,
  Toolbar,
  Item as ToolbarItem,
  Export
} from 'devextreme-react/data-grid';
import { LoadPanel } from 'devextreme-react/load-panel';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import Popup from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { exportDataGrid } from 'devextreme/excel_exporter';
import {
  fetchDispensingVolumes,
  createDispensingVolume,
  updateDispensingVolume,
  deleteDispensingVolume
} from '../../../../redux/actions/tankStockAction';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import { usePermissions } from '../../../../hooks/usePermissions';
import DispensingForm from './DispensingForm';
import './DispensingManager.scss';

const DispensingManager = () => {
  const dispatch = useDispatch();
  const dataGridRef = useRef(null);

  // Permission checks
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('_Create_tankStock');
  const canUpdate = hasPermission('_Update_tankStock');
  const canDelete = hasPermission('_Delete_tankStock');

  // Redux state
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);

  // Local state
  const [dispensingData, setDispensingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filter state - default to today's data with ALL sites
  const [filterSiteId, setFilterSiteId] = useState(null);
  const [filterTankId, setFilterTankId] = useState(null);
  const [filterUserId, setFilterUserId] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  });

  // Computed filters object
  const currentFilters = {
    siteId: filterSiteId,
    tankId: filterTankId,
    recordedBy: filterUserId,
    startDate: filterStartDate?.toISOString(),
    endDate: filterEndDate?.toISOString()
  };

  // Filtered tanks based on selected site
  const filteredTanks = filterSiteId
    ? tanks.filter(tank => tank.siteId === filterSiteId)
    : tanks;

  // Load data with filters
  const loadDispensingData = useCallback(async (filters) => {
    setIsLoading(true);
    try {
      const result = await dispatch(fetchDispensingVolumes(filters));
      if (result.success) {
        setDispensingData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading dispensing data:', error);
      notify({
        message: 'Failed to load dispensing data',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Initialize
  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchTanks());
      dispatch(fetchSiteList());
      dispatch(fetchUsersForFilter());
      loadDispensingData(currentFilters);
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized, currentFilters, loadDispensingData]);

  // Handle filter apply
  const handleApplyFilters = useCallback(() => {
    loadDispensingData(currentFilters);
  }, [loadDispensingData, currentFilters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadDispensingData(currentFilters);
    notify({
      message: 'Data refreshed successfully',
      type: 'success',
      displayTime: 2000
    });
  }, [loadDispensingData, currentFilters]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilterSiteId(null);
    setFilterTankId(null);
    setFilterUserId(null);
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    setFilterStartDate(startOfDay);
    setFilterEndDate(endOfDay);
  }, []);

  // Handle create
  const handleCreate = useCallback(() => {
    setSelectedRecord(null);
    setShowForm(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((record) => {
    setSelectedRecord(record);
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (record) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this dispensing record?\n\nTank: ${record.tankName}\nVolume: ${record.dispensedVolume}L\nDate: ${new Date(record.entryDate).toLocaleString()}`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await dispatch(deleteDispensingVolume(record.entryId));
      if (result.success) {
        notify({
          message: 'Dispensing record deleted successfully',
          type: 'success',
          displayTime: 3000
        });
        await loadDispensingData(currentFilters);
      } else {
        notify({
          message: result.message || 'Failed to delete record',
          type: 'error',
          displayTime: 4000
        });
      }
    } catch (error) {
      notify({
        message: 'Error deleting record',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, loadDispensingData, currentFilters]);

  // Handle form submit
  const handleFormSubmit = useCallback(async () => {
    setShowForm(false);
    await loadDispensingData(currentFilters);
  }, [loadDispensingData, currentFilters]);

  // Export functionality
  const onExporting = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Dispensing Volumes');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet: worksheet,
      autoFilterEnabled: true
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dispensing_volumes_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
    });
    e.cancel = true;
  }, []);

  // Format timestamp
  const formatTime = (cellInfo) => {
    const date = new Date(cellInfo.value);
    return date.toLocaleString();
  };

  // Actions cell render
  const actionsCellRender = (cellData) => {
    return (
      <div className="tw-flex tw-space-x-2">
        {canUpdate && (
          <Button
            icon="fa-light fa-edit"
            stylingMode="text"
            onClick={() => handleEdit(cellData.data)}
            hint="Edit Record"
            className="tw-text-blue-600 hover:tw-text-blue-800"
          />
        )}
        {canDelete && (
          <Button
            icon="fa-light fa-trash"
            stylingMode="text"
            onClick={() => handleDelete(cellData.data)}
            hint="Delete Record"
            className="tw-text-red-600 hover:tw-text-red-800"
          />
        )}
      </div>
    );
  };

  return (
    <div className="dispensing-manager tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          {/* Title */}
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-gas-pump tw-mr-2 tw-text-blue-600"></i>
              Dispensing Volume Management
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Manage bulk fuel dispensing volume entries
            </p>
          </div>

          {/* Actions */}
          <div className="tw-flex tw-gap-2">
            {canCreate && (
              <Button
                text="Add Aggregate Dispensing"
                icon="fa-light fa-plus"
                type="default"
                stylingMode="contained"
                onClick={handleCreate}
                hint="Add new aggregate dispensing record"
              />
            )}
            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              type="default"
              stylingMode="outlined"
              onClick={handleRefresh}
              hint="Refresh data"
            />
            <Button
              text="Export"
              icon="fa-light fa-file-excel"
              type="default"
              stylingMode="outlined"
              onClick={onExporting}
              hint="Export to Excel"
            />
          </div>
        </div>

        {/* Independent Filter Controls */}
        <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
          <div className="tw-flex tw-items-center tw-mb-3">
            <i className="fa-light fa-filter tw-mr-2 tw-text-blue-600"></i>
            <span className="tw-font-semibold tw-text-gray-700">Filters</span>
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4">
            {/* Site Filter */}
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Site
              </label>
              <SelectBox
                dataSource={sites}
                displayExpr="name"
                valueExpr="id"
                value={filterSiteId}
                onValueChanged={(e) => {
                  setFilterSiteId(e.value);
                  // Clear tank filter if site changes
                  if (filterTankId && e.value) {
                    const tankExists = tanks.some(t => t.id === filterTankId && t.siteId === e.value);
                    if (!tankExists) setFilterTankId(null);
                  }
                }}
                placeholder="All Sites"
                searchEnabled={true}
                showClearButton={true}
              />
            </div>

            {/* Tank Filter */}
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Tank
              </label>
              <SelectBox
                dataSource={filteredTanks}
                displayExpr="name"
                valueExpr="id"
                value={filterTankId}
                onValueChanged={(e) => setFilterTankId(e.value)}
                placeholder="All Tanks"
                searchEnabled={true}
                showClearButton={true}
              />
            </div>

            {/* User Filter */}
            <div>
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

            {/* Start Date Filter */}
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Start Date
              </label>
              <DateBox
                value={filterStartDate}
                onValueChanged={(e) => setFilterStartDate(e.value)}
                type="date"
                displayFormat="dd/MM/yyyy"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                End Date
              </label>
              <DateBox
                value={filterEndDate}
                onValueChanged={(e) => setFilterEndDate(e.value)}
                type="date"
                displayFormat="dd/MM/yyyy"
              />
            </div>
          </div>

          {/* Filter Action Buttons */}
          <div className="tw-flex tw-gap-2 tw-mt-4">
            <Button
              text="Apply Filters"
              icon="fa-light fa-search"
              type="default"
              stylingMode="contained"
              onClick={handleApplyFilters}
            />
            <Button
              text="Clear Filters"
              icon="fa-light fa-times"
              type="normal"
              stylingMode="outlined"
              onClick={handleClearFilters}
            />
          </div>
        </div>
      </div>

      {/* DataGrid */}
      <div className="tw-flex-1 tw-p-4 tw-overflow-hidden">
        <DataGrid
          dataSource={dispensingData}
          keyExpr="entryId"
          showBorders={true}
          ref={dataGridRef}
          showColumnLines={true}
          showRowLines={true}
          allowColumnResizing={true}
          className="tw-h-full"
        >
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <SearchPanel visible={true} />
          <Paging enabled={true} defaultPageSize={50} />
          <Pager
            visible={true}
            allowedPageSizes={[25, 50, 100, 200]}
            displayMode="full"
            showPageSizeSelector={true}
            showInfo={true}
            showNavigationButtons={true}
          />

          <Column dataField="entryId" caption="ID" visible={false} />
          <Column
            dataField="entryDate"
            caption="Date & Time"
            cellRender={formatTime}
            minWidth={150}
            sortOrder="desc"
          />
          <Column dataField="siteName" caption="Site" minWidth={120} />
          <Column dataField="tankName" caption="Tank" minWidth={120} />
          <Column
            dataField="dispensedVolume"
            caption="Dispensed Volume (L)"
            minWidth={150}
            format="#,##0.00"
            dataType="number"
          />
          <Column dataField="recordedByName" caption="Recorded By" minWidth={120} />
          <Column dataField="notes" caption="Notes" minWidth={200} />
          <Column
            type="buttons"
            width={100}
            caption="Actions"
            allowSorting={false}
            allowFiltering={false}
            cellRender={actionsCellRender}
          />

          <Export enabled={true} allowExportSelectedData={false} />
        </DataGrid>
      </div>

      {/* Dispensing Form Popup */}
      <Popup
        visible={showForm}
        onHiding={() => setShowForm(false)}
        showTitle={true}
        title={selectedRecord ? "Edit Dispensing Volume" : "Add Dispensing Volume"}
        width={600}
        height="auto"
        showCloseButton={true}
        dragEnabled={true}
      >
        <DispensingForm
          record={selectedRecord}
          onCancel={() => setShowForm(false)}
          onSuccess={handleFormSubmit}
        />
      </Popup>

      {/* Loading Panel */}
      <LoadPanel
        visible={isLoading}
        showIndicator={true}
        showPane={true}
        text="Loading..."
        position="center"
      />
    </div>
  );
};

export default DispensingManager;
