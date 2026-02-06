import React, { useState, useCallback, useRef } from "react";
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
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";
import { exportDataGrid } from "devextreme/excel_exporter";
import notify from "devextreme/ui/notify";
import EditGpsEntryModal from "../modals/EditGpsEntryModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import GpsFuelLevelChartModal from "../../../../components/charts/GpsFuelLevelChartModal";
import { usePermissions } from "../../../../hooks/usePermissions";
import "./ComparisonDataGrid.scss";

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
  const [selectedRowForChart, setSelectedRowForChart] = useState(null);
  const [filterPartial, setFilterPartial] = useState(false);

  // Get permissions from hook
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("_Update_TankStock");
  const canDelete = hasPermission("_Delete_TankStock");

  /**
   * Calculate row class based on variance threshold
   */
  const onRowPrepared = useCallback(
    (e) => {
      if (e.rowType === "data") {
        const variance = e.data.totalVariance || 0;
        const yellowThreshold = varianceThreshold * 0.5;

        if (variance > varianceThreshold) {
          // RED: Exceeds threshold
          e.rowElement.classList.add("high-variance-row");
        } else if (variance > yellowThreshold) {
          // YELLOW: Exceeds 50% of threshold
          e.rowElement.classList.add("medium-variance-row");
        }
      }
    },
    [varianceThreshold]
  );

  /**
   * Format date as DD/MM/YYYY
   */
  const formatDate = useCallback((value) => {
    if (!value) return "";
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  /**
   * Format volume with 2 decimal places
   */
  const formatVolume = useCallback((value) => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(2);
  }, []);

  /**
   * Format variance percentage with 1 decimal place
   */
  const formatVariancePercent = useCallback((value) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(1)}%`;
  }, []);

  /**
   * Render status badge with color coding
   */
  const renderStatusBadge = useCallback((cellData) => {
    const status = cellData.value;
    let badgeClass = "status-badge";
    let icon = "";

    switch (status) {
      case "Complete":
        badgeClass += " status-complete";
        icon = "fa-light fa-circle-check";
        break;
      case "Partial":
        badgeClass += " status-partial";
        icon = "fa-light fa-circle-half-stroke";
        break;
      case "Single":
        badgeClass += " status-single";
        icon = "fa-light fa-circle";
        break;
      case "HighVariance":
        badgeClass += " status-high-variance";
        icon = "fa-light fa-triangle-exclamation";
        break;
      default:
        badgeClass += " status-default";
        icon = "fa-light fa-question-circle";
    }

    return (
      <span className={badgeClass}>
        <i className={icon}></i>
        <span>{status}</span>
      </span>
    );
  }, []);

  /**
   * Render action buttons (Edit/Delete/GPS Details)
   */
  const renderActionButtons = useCallback(
    (cellData) => {
      const row = cellData.data;
      const hasGpsEntry = row.gpsEntryId > 0;
      const hasGpsGateVehicle = row.gpsGateVehicleId > 0 || row.vehicleId > 0;

      return (
        <div className="tw-flex tw-items-center tw-gap-1 tw-justify-center">
          {/* GPS Details Button */}
          <button
            type="button"
            title="View GPS Fuel Level Details"
            onClick={() => setSelectedRowForChart(row)}
            disabled={!hasGpsGateVehicle}
            className="action-btn tw-text-purple-600 hover:tw-text-purple-800 hover:tw-bg-purple-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
          >
            <i className="fa-light fa-chart-line"></i>
          </button>
          {canUpdate && (
            <button
              type="button"
              title="Edit GPS Entry"
              onClick={() => setSelectedRowForEdit(row)}
              disabled={!hasGpsEntry}
              className="action-btn tw-text-blue-600 hover:tw-text-blue-800 hover:tw-bg-blue-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
            >
              <i className="fa-light fa-pen-to-square"></i>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              title="Delete GPS Entry"
              onClick={() => setSelectedRowForDelete(row)}
              disabled={!hasGpsEntry}
              className="action-btn tw-text-red-600 hover:tw-text-red-800 hover:tw-bg-red-50 disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
            >
              <i className="fa-light fa-trash"></i>
            </button>
          )}
        </div>
      );
    },
    [canUpdate, canDelete]
  );

  /**
   * Export to Excel
   */
  const handleExport = useCallback(() => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Fuel Comparison");

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === "data") {
          const variance = gridCell.data.totalVariance || 0;
          const yellowThreshold = varianceThreshold * 0.5;

          // Apply background color based on variance
          if (variance > varianceThreshold) {
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFC0CB" }, // Light red
            };
          } else if (variance > yellowThreshold) {
            excelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFF99" }, // Light yellow
            };
          }
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          `FuelComparison_${new Date().toISOString().split("T")[0]}.xlsx`
        );
      });
      notify("Exported to Excel successfully", "success", 3000);
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

  /**
   * Toggle filter for Partial status
   */
  const handleFilterPartial = useCallback(() => {
    const gridInstance = dataGridRef.current?.instance;
    if (gridInstance) {
      if (filterPartial) {
        // Clear the filter
        gridInstance.clearFilter();
        setFilterPartial(false);
      } else {
        // Apply filter for Partial status
        gridInstance.filter(["status", "=", "Partial"]);
        setFilterPartial(true);
      }
    }
  }, [filterPartial]);

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
              icon={
                filterPartial
                  ? "fa-light fa-filter-circle-xmark"
                  : "fa-light fa-filter"
              }
              text={filterPartial ? "Clear Filter" : "Filter Partial"}
              onClick={handleFilterPartial}
              type={filterPartial ? "danger" : "default"}
              stylingMode={filterPartial ? "contained" : "outlined"}
            />
          </Item>
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
          fixed={true}
          fixedPosition="left"
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
        {/* ToDo: add later <Column
          dataField="ptsVolume"
          caption="PTS Vol (L)"
          dataType="number"
          width={120}
          alignment="right"
          customizeText={({ value }) => formatVolume(value)}
        /> */}
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
          width={150}
          alignment="center"
          cellRender={renderActionButtons}
          allowExporting={false}
          allowFiltering={false}
          allowSorting={false}
          fixed={true}
          fixedPosition="right"
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

      {/* GPS Fuel Level Chart Modal */}
      {selectedRowForChart &&
        console.log("Chart popup row data:", {
          row: selectedRowForChart,
          vehicleId: selectedRowForChart.vehicleId,
          gpsGateVehicleId: selectedRowForChart.gpsGateVehicleId,
          dispenseDate: selectedRowForChart.dispenseDate,
          gpsStartTime: selectedRowForChart.gpsStartTime,
          gpsDuration: selectedRowForChart.gpsDuration,
          gpsFuelBefore: selectedRowForChart.gpsFuelBefore,
          gpsFuelAfter: selectedRowForChart.gpsFuelAfter,
          gpsVolume: selectedRowForChart.gpsVolume,
          effectiveGpsVolume: selectedRowForChart.effectiveGpsVolume,
          manualVolume: selectedRowForChart.manualVolume,
          gpsEntryId: selectedRowForChart.gpsEntryId,
        })}
      {selectedRowForChart && (
        <GpsFuelLevelChartModal
          visible={true}
          vehicleId={selectedRowForChart.vehicleId}
          vehicleName={
            selectedRowForChart.vehicleName ||
            `Vehicle ${selectedRowForChart.vehicleId}`
          }
          date={selectedRowForChart.dispenseDate}
          siteName={selectedRowForChart.siteName || ""}
          manualVolume={selectedRowForChart.manualVolume}
          gpsRefuelingEntry={(() => {
            const hasGpsMeta =
              selectedRowForChart.gpsStartTime ||
              selectedRowForChart.gpsDuration ||
              (selectedRowForChart.gpsFuelBefore !== null &&
                selectedRowForChart.gpsFuelBefore !== undefined) ||
              (selectedRowForChart.gpsFuelAfter !== null &&
                selectedRowForChart.gpsFuelAfter !== undefined) ||
              (selectedRowForChart.effectiveGpsVolume !== null &&
                selectedRowForChart.effectiveGpsVolume !== undefined) ||
              (selectedRowForChart.gpsVolume !== null &&
                selectedRowForChart.gpsVolume !== undefined);

            if (!hasGpsMeta) return null;

            return {
              startTime: selectedRowForChart.gpsStartTime,
              duration: selectedRowForChart.gpsDuration,
              fuelBefore: selectedRowForChart.gpsFuelBefore,
              fuelAfter: selectedRowForChart.gpsFuelAfter,
              volume:
                selectedRowForChart.effectiveGpsVolume ||
                selectedRowForChart.gpsVolume,
              dispenseDate: selectedRowForChart.dispenseDate,
            };
          })()}
          onEdit={
            canUpdate
              ? () => {
                setSelectedRowForEdit(selectedRowForChart);
                setSelectedRowForChart(null);
              }
              : null
          }
          isEditDisabled={!((selectedRowForChart.gpsEntryId || 0) > 0)}
          onClose={() => setSelectedRowForChart(null)}
        />
      )}
    </div>
  );
};

export default ComparisonDataGrid;
