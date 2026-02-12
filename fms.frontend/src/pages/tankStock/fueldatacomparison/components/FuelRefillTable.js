/**
 * FuelRefillTable - DataGrid component for displaying and managing fuel refill data
 *
 * Features:
 * - Display fuel refill data with filters (date range, site, tank)
 * - Edit fuel refill records (admin only)
 * - Delete fuel refill records (admin only)
 * - Export to Excel
 * - Search, sorting, filtering, column chooser
 *
 * @param {Array} data - Array of fuel refill records
 * @param {boolean} isLoading - Loading state
 * @param {Function} onRefresh - Callback to refresh data
 * @param {Array} sites - Available sites for display
 * @param {Array} vehicles - Available vehicles for display
 * @returns {JSX.Element} Fuel Refill Table Grid
 */

import React, { useState, useCallback, useRef } from 'react';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  Export,
  SearchPanel,
  ColumnChooser,
  Scrolling,
  Toolbar,
  Item,
  Selection
} from 'devextreme-react/data-grid';
import { Button, LoadPanel } from 'devextreme-react';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import notify from 'devextreme/ui/notify';
import { usePermissions } from '../../../../hooks/usePermissions';
import { deleteFuelRefill } from '../../../../api/fuelRefillClient';
import FuelRefillEditModal from '../modals/FuelRefillEditModal';
import FuelRefillDeleteModal from '../modals/FuelRefillDeleteModal';
import './FuelRefillTable.scss';

const FuelRefillTable = ({ data = [], isLoading = false, onRefresh, sites = [], vehicles = [] }) => {
  const dataGridRef = useRef(null);
  const [selectedRowForEdit, setSelectedRowForEdit] = useState(null);
  const [selectedRowForDelete, setSelectedRowForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get permissions from hook
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('_Update_TankStock');
  const canDelete = hasPermission('_Delete_TankStock');

  /**
   * Format date as DD/MM/YYYY
   */
  const formatDate = useCallback((value) => {
    if (!value) return '';
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  /**
   * Format volume with 2 decimal places
   */
  const formatVolume = useCallback((value) => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
  }, []);

  /**
   * Get site name by ID
   */
  const getSiteName = useCallback((siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : `Site ${siteId}`;
  }, [sites]);

  /**
   * Get vehicle number by ID or use HyoungNo from data
   */
  const getVehicleNo = useCallback((vehicleId, hyoungNo) => {
    // Prefer HyoungNo from the response
    if (hyoungNo) return hyoungNo;
    // Fallback to vehicle lookup
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.vehicleNo : `Vehicle ${vehicleId}`;
  }, [vehicles]);

  /**
   * Render action buttons (Edit/Delete)
   */
  const renderActionButtons = useCallback((cellData) => {
    const row = cellData.data;

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        {canEdit && (
          <Button
            icon="fa-light fa-pen-to-square"
            hint="Edit Fuel Refill"
            onClick={() => setSelectedRowForEdit(row)}
            type="default"
            stylingMode="text"
            className="tw-text-blue-600 hover:tw-text-blue-800"
          />
        )}
        {canDelete && (
          <Button
            icon="fa-light fa-trash"
            hint="Delete Fuel Refill"
            onClick={() => setSelectedRowForDelete(row)}
            type="default"
            stylingMode="text"
            className="tw-text-red-600 hover:tw-text-red-800"
          />
        )}
      </div>
    );
  }, [canEdit, canDelete]);

  /**
   * Handle export to Excel
   */
  const handleExportToExcel = useCallback(() => {
    if (!dataGridRef.current?.instance) return;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Fuel Refills');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'header') {
          excelCell.font = { bold: true };
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `FuelRefills_${new Date().toISOString().split('T')[0]}.xlsx`
        );
      });
    });
  }, []);

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = async (deleteReason) => {
    if (!selectedRowForDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteFuelRefill(selectedRowForDelete.id);

      if (response?.success || response?.isSuccess) {
        notify({
          message: 'Fuel refill deleted successfully',
          type: 'success',
          displayTime: 3000
        });
        setSelectedRowForDelete(null);
        onRefresh?.();
      } else {
        notify({
          message: 'Failed to delete fuel refill',
          type: 'error',
          displayTime: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting fuel refill:', error);
      notify({
        message: error?.response?.data?.message || 'Error deleting fuel refill',
        type: 'error',
        displayTime: 3000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <LoadPanel visible={isLoading} />

      <DataGrid
        ref={dataGridRef}
        dataSource={data}
        keyExpr="rowKey"
        showBorders={true}
        columnAutoWidth={false}
        rowAlternationEnabled={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnResizingMode="nextColumn"
        searchPanel={{
          visible: true,
          placeholder: 'Search...'
        }}
        filterRow={{
          visible: true,
          applyFilter: 'auto'
        }}
        headerFilter={{
          visible: true
        }}
        columnChooser={{
          enabled: true,
          mode: 'select'
        }}
        scrolling={{
          mode: 'standard'
        }}
        paging={{
          pageSize: 20,
          enabled: true
        }}
        pager={{
          visible: true,
          allowedPageSizes: [10, 20, 50, 100],
          displayMode: 'full',
          showPageSizeSelector: true,
          showInfo: true,
          showNavigationButtons: true
        }}
        export={{
          enabled: true,
          formats: ['xlsx'],
          allowExportSelectedData: false
        }}
        toolbar={
          <Toolbar>
            <Item name="searchPanel" />
            <Item name="columnChooserButton" />
            <Item
              widget="dxButton"
              options={{
                icon: 'exportxlsx',
                hint: 'Export to Excel',
                onClick: handleExportToExcel
              }}
              location="after"
            />
          </Toolbar>
        }
      >
        <Selection mode="single" />

        <Column
          dataField="id"
          caption="ID"
          width={70}
          allowHeaderFiltering={false}
          allowSearch={false}
        />

        <Column
          dataField="vehicleId"
          caption="Vehicle"
          width={120}
          cellRender={(cellData) => getVehicleNo(cellData.value, cellData.data.hyoungNo)}
          alignment="left"
        />

        <Column
          dataField="siteId"
          caption="Site"
          width={120}
          cellRender={(cellData) => getSiteName(cellData.value)}
          alignment="left"
        />

        <Column
          dataField="date"
          caption="Date"
          width={100}
          dataType="date"
          cellRender={(cellData) => formatDate(cellData.value)}
          alignment="center"
        />

        <Column
          dataField="manualFuelrefillAmount"
          caption="Amount (L)"
          width={100}
          dataType="number"
          cellRender={(cellData) => formatVolume(cellData.value)}
          alignment="right"
        />

        <Column
          dataField="previousMeterReading"
          caption="Prev. Meter"
          width={110}
          dataType="number"
          cellRender={(cellData) => formatVolume(cellData.value)}
          alignment="right"
        />

        <Column
          dataField="currentMeterReading"
          caption="Current Meter"
          width={110}
          dataType="number"
          cellRender={(cellData) => formatVolume(cellData.value)}
          alignment="right"
        />

        <Column
          dataField="consumption"
          caption="Consumption (L)"
          width={120}
          dataType="number"
          cellRender={(cellData) => formatVolume(cellData.value)}
          alignment="right"
        />

        <Column
          dataField="driverId"
          caption="Driver ID"
          width={80}
          alignment="center"
        />

        <Column
          dataField="tagId"
          caption="Tag ID"
          width={80}
          alignment="center"
        />

        <Column
          dataField="comment"
          caption="Comment"
          width={150}
          alignment="left"
        />

        <Column
          dataField="dateCreated"
          caption="Created"
          width={130}
          dataType="date"
          cellRender={(cellData) => formatDate(cellData.value)}
          alignment="center"
        />

        <Column
          caption="Actions"
          width={100}
          allowFiltering={false}
          allowHeaderFiltering={false}
          allowSearch={false}
          cellRender={renderActionButtons}
          alignment="center"
          fixed={true}
          fixedPosition="right"
        />
      </DataGrid>

      {/* Edit Modal */}
      {selectedRowForEdit && (
        <FuelRefillEditModal
          fuelRefill={selectedRowForEdit}
          onClose={() => setSelectedRowForEdit(null)}
          onSave={() => {
            setSelectedRowForEdit(null);
            onRefresh?.();
          }}
          sites={sites}
          vehicles={vehicles}
        />
      )}

      {/* Delete Modal */}
      {selectedRowForDelete && (
        <FuelRefillDeleteModal
          fuelRefill={selectedRowForDelete}
          isLoading={isDeleting}
          onClose={() => setSelectedRowForDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default FuelRefillTable;
