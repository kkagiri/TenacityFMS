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
  Item
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import notify from 'devextreme/ui/notify';
import EditGpsEntryModal from '../modals/EditGpsEntryModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { usePermissions } from '../../../../hooks/usePermissions';
import './ComparisonDataGrid.scss';

/**
 * ComparisonDataGrid - DevExtreme DataGrid for Fuel Data Comparison
 *
 * Features:
 * - 11 columns with proper formatting
 * - Row highlighting: RED (variance > threshold), YELLOW (variance > 50% threshold)
 * - Edit/Delete actions for GPS entries
 * - Export to Excel
 * - Sorting, filtering, column chooser
 *
 * @param {Array} data - Array of FuelDataComparisonDto
 * @param {number} varianceThreshold - User's variance threshold (liters)
 * @param {Function} onRefresh - Callback to refresh data after edit/delete
 * @returns {JSX.Element} Comparison Data Grid
 */
const ComparisonDataGrid = ({ data, varianceThreshold, onRefresh }) => {
  const dataGridRef = useRef(null);
  const [selectedRowForEdit, setSelectedRowForEdit] = useState(null);
  const [selectedRowForDelete, setSelectedRowForDelete] = useState(null);

  // Get permissions from hook
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('_Update_tankStock');
  const canDelete = hasPermission('_Delete_tankStock');

  /**
   * Calculate row class based on variance threshold
   */
  const onRowPrepared = useCallback((e) => {
    if (e.rowType === 'data') {
      const variance = e.data.totalVariance || 0;
      const yellowThreshold = varianceThreshold * 0.5;

      if (variance > varianceThreshold) {
        // RED: Exceeds threshold
        e.rowElement.classList.add('high-variance-row');
      } else if (variance > yellowThreshold) {
        // YELLOW: Exceeds 50% of threshold
        e.rowElement.classList.add('medium-variance-row');
      }
    }
  }, [varianceThreshold]);

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
   * Format variance percentage with 1 decimal place
   */
  const formatVariancePercent = useCallback((value) => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  }, []);

  /**
   * Render status badge with color coding
   */
  const renderStatusBadge = useCallback((cellData) => {
    const status = cellData.value;
    let badgeClass = 'status-badge';
    let icon = '';

    switch (status) {
      case 'Complete':
        badgeClass += ' status-complete';
        icon = 'fa-light fa-circle-check';
        break;
      case 'Partial':
        badgeClass += ' status-partial';
        icon = 'fa-light fa-circle-half-stroke';
        break;
      case 'Single':
        badgeClass += ' status-single';
        icon = 'fa-light fa-circle';
        break;
      case 'HighVariance':
        badgeClass += ' status-high-variance';
        icon = 'fa-light fa-triangle-exclamation';
        break;
      default:
        badgeClass += ' status-default';
        icon = 'fa-light fa-question-circle';
    }

    return (
      <span className={badgeClass}>
        <i className={icon}></i>
        <span>{status}</span>
      </span>
    );
  }, []);

  /**
   * Render action buttons (Edit/Delete)
   */
  const renderActionButtons = useCallback((cellData) => {
    const row = cellData.data;
    const hasGpsEntry = row.gpsEntryId > 0;

    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        {canUpdate && (
          <Button
            icon="fa-light fa-pen-to-square"
            hint="Edit GPS Entry"
            onClick={() => setSelectedRowForEdit(row)}
            disabled={!hasGpsEntry}
            type="default"
            stylingMode="text"
            className="tw-text-blue-600 hover:tw-text-blue-800"
          />
        )}
        {canDelete && (
          <Button
            icon="fa-light fa-trash"
            hint="Delete GPS Entry"
            onClick={() => setSelectedRowForDelete(row)}
            disabled={!hasGpsEntry}
            type="danger"
            stylingMode="text"
            className="tw-text-red-600 hover:tw-text-red-800"
          />
        )}
      </div>
    );
  }, [canUpdate, canDelete]);

  /**
   * Export to Excel
   */
  const handleExport = useCallback(() => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Fuel Comparison');

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          const variance = gridCell.data.totalVariance || 0;
          const yellowThreshold = varianceThreshold * 0.5;

          // Apply background color based on variance
          if (variance > varianceThreshold) {
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC0CB' } // Light red
            };
          } else if (variance > yellowThreshold) {
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF99' } // Light yellow
            };
          }
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `FuelComparison_${new Date().toISOString().split('T')[0]}.xlsx`
        );
      });
      notify('Exported to Excel successfully', 'success', 3000);
    });
  }, [varianceThreshold]);

  /**
   * Handle edit complete
   */
  const handleEditComplete = () => {
    setSelectedRowForEdit(null);
    onRefresh();
  };

  /**
   * Handle delete complete
   */
  const handleDeleteComplete = () => {
    setSelectedRowForDelete(null);
    onRefresh();
  };

  return (
    <div className="comparison-data-grid">
      <DataGrid
        ref={dataGridRef}
        dataSource={data}
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        rowAlternationEnabled={false}
        onRowPrepared={onRowPrepared}
        columnAutoWidth={true}
        wordWrapEnabled={false}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnResizingMode="widget"
      >
        {/* Scrolling */}
        <Scrolling mode="standard" />

        {/* Paging */}
        <Paging enabled={true} defaultPageSize={20} />
        <Pager
          visible={true}
          showPageSizeSelector={true}
          allowedPageSizes={[20, 50, 100, 200]}
          showInfo={true}
          showNavigationButtons={true}
        />

        {/* Filtering */}
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />

        {/* Search */}
        <SearchPanel visible={true} width={240} placeholder="Search..." />

        {/* Column Chooser */}
        <ColumnChooser enabled={true} mode="select" />

        {/* Export */}
        <Export enabled={true} allowExportSelectedData={false} />

        {/* Toolbar */}
        <Toolbar>
          <Item name="searchPanel" />
          <Item name="columnChooserButton" />
          <Item location="after">
            <Button
              icon="fa-light fa-file-excel"
              text="Export to Excel"
              onClick={handleExport}
              type="success"
              stylingMode="outlined"
            />
          </Item>
        </Toolbar>

        {/* Columns */}
        <Column
          dataField="vehicleId"
          caption="Vehicle ID"
          dataType="number"
          width={100}
          alignment="center"
        />
        <Column
          dataField="vehicleName"
          caption="Vehicle Name"
          dataType="string"
          width={120}
        />
        <Column
          dataField="siteName"
          caption="Site"
          dataType="string"
          width={120}
        />
        <Column
          dataField="vehicleTypeName"
          caption="Vehicle Type"
          dataType="string"
          width={120}
        />
        <Column
          dataField="dispenseDate"
          caption="Dispense Date"
          dataType="date"
          width={120}
          customizeText={({ value }) => formatDate(value)}
        />
        <Column
          dataField="manualVolume"
          caption="Manual Vol (L)"
          dataType="number"
          width={120}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        />
        <Column
          dataField="ptsVolume"
          caption="PTS Vol (L)"
          dataType="number"
          width={120}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        />
        <Column
          dataField="gpsVolume"
          caption="GPS Vol (L)"
          dataType="number"
          width={120}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        />
        <Column
          dataField="effectiveGpsVolume"
          caption="Effective GPS (L)"
          dataType="number"
          width={140}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        />
        <Column
          dataField="totalVariance"
          caption="Variance (L)"
          dataType="number"
          width={120}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        />
        <Column
          dataField="variancePercent"
          caption="Variance %"
          dataType="number"
          width={110}
          alignment="right"
          customizeText={({ value }) => formatVariancePercent(value)}
        />
        <Column
          dataField="status"
          caption="Status"
          dataType="string"
          width={140}
          cellRender={renderStatusBadge}
        />
        <Column
          caption="Actions"
          width={120}
          alignment="center"
          cellRender={renderActionButtons}
          allowExporting={false}
          allowFiltering={false}
          allowSorting={false}
        />
      </DataGrid>

      {/* Edit GPS Entry Modal */}
      {selectedRowForEdit && (
        <EditGpsEntryModal
          visible={true}
          gpsEntry={selectedRowForEdit}
          onClose={() => setSelectedRowForEdit(null)}
          onSave={handleEditComplete}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedRowForDelete && (
        <DeleteConfirmationModal
          visible={true}
          gpsEntry={selectedRowForDelete}
          onClose={() => setSelectedRowForDelete(null)}
          onDelete={handleDeleteComplete}
        />
      )}
    </div>
  );
};

export default ComparisonDataGrid;
