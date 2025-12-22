/**
 * File: ImportDataGrid.js
 * Purpose: DevExtreme DataGrid component for fuel report data preview
 * Last Modified: 2025-12-16
 */
import React, { memo, useMemo } from "react";
import DataGrid, {
  Column,
  Editing,
  FilterRow,
  HeaderFilter,
  Paging,
  Pager,
  LoadPanel,
  Scrolling,
  Lookup,
} from "devextreme-react/data-grid";
import {
  createSelectionHeaderRenderer,
  createSelectionCellRenderer,
  createStatusCellRenderer,
  createNightShiftCellRenderer,
} from "./gridCellRenderers";

const pageSizes = [20, 50, 100, 200, 500];

/**
 * ImportDataGrid - Core DataGrid component for fuel report preview
 */
const ImportDataGrid = memo(
  ({
    dataGridRef,
    reportType,
    dataSource,
    parsedData,
    selectedRowKeys,
    fixedRows,
    validationErrors,
    vehicles,
    sites,
    pageSize,
    onSelectionChanged,
    onRowPrepared,
    onCellClick,
    onEditorPreparing,
    onRowUpdated,
    onValidateData,
    handleGridInitialized,
    onPageSizeChanged,
    onPageChanged,
    cellRender,
  }) => {
    // Memoize cell renderers to prevent recreation on each render
    const selectionHeaderRenderer = useMemo(
      () =>
        createSelectionHeaderRenderer(
          dataSource,
          selectedRowKeys,
          onSelectionChanged
        ),
      [dataSource, selectedRowKeys, onSelectionChanged]
    );

    const selectionCellRenderer = useMemo(
      () =>
        createSelectionCellRenderer(
          dataSource,
          selectedRowKeys,
          onSelectionChanged
        ),
      [dataSource, selectedRowKeys, onSelectionChanged]
    );

    const statusCellRenderer = useMemo(
      () =>
        createStatusCellRenderer(
          parsedData,
          fixedRows,
          validationErrors,
          onValidateData
        ),
      [parsedData, fixedRows, validationErrors, onValidateData]
    );

    const nightShiftCellRenderer = useMemo(
      () =>
        createNightShiftCellRenderer(
          parsedData,
          validationErrors,
          onValidateData
        ),
      [parsedData, validationErrors, onValidateData]
    );

    return (
      <DataGrid
        ref={dataGridRef}
        key={reportType}
        dataSource={dataSource}
        keyExpr="_rowIndex"
        showBorders={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        allowColumnResizing={true}
        allowColumnReordering={true}
        width="100%"
        height="100vh"
        onSelectionChanged={onSelectionChanged}
        hoverStateEnabled={true}
        rowAlternationEnabled={true}
        selectedRowKeys={selectedRowKeys}
        onRowPrepared={onRowPrepared}
        onInitialized={handleGridInitialized}
        onCellClick={(e) => {
          if (!e.data || typeof e.data._rowIndex === "undefined") return;
          if (onCellClick) onCellClick(e);
        }}
        onEditorPreparing={(e) => {
          if (!e.row?.data || typeof e.row.data._rowIndex === "undefined")
            return;
          if (onEditorPreparing) onEditorPreparing(e);
        }}
        onRowUpdated={onRowUpdated}
        onContentReady={() => {
          // DataGrid handles its own updates when dataSource changes
        }}
        remoteOperations={{
          filtering: false,
          sorting: false,
          paging: false,
        }}
        cacheEnabled={true}
        repaintChangesOnly={true}
        columnMinWidth={80}
        columnHidingEnabled={true}
        renderAsync={true}
      >
        <Editing
          mode="cell"
          allowUpdating={true}
          allowAdding={false}
          allowDeleting={false}
          startEditAction="click"
          selectTextOnEditStart={true}
        />

        <FilterRow visible={true} />
        <HeaderFilter visible={true} allowSearch={true} height={350} />
        <Paging defaultPageSize={pageSize} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={pageSizes}
          showNavigationButtons={true}
          showInfo={true}
          visible={true}
          onPageSizeChange={onPageSizeChanged}
          onPageChange={onPageChanged}
        />
        <LoadPanel enabled={true} />
        <Scrolling mode="virtual" rowRenderingMode="virtual" />

        {/* Selection Column */}
        <Column
          dataField="_rowIndex"
          caption="Select"
          width={50}
          alignment="center"
          allowFiltering={false}
          allowSorting={false}
          headerCellRender={selectionHeaderRenderer}
          cellRender={selectionCellRenderer}
        />

        {/* Status Column */}
        <Column
          caption="Status"
          width={130}
          alignment="center"
          allowFiltering={false}
          allowSorting={false}
          allowEditing={false}
          cellRender={statusCellRenderer}
        />

        {/* Vehicle Column */}
        <Column
          dataField="vehicleName"
          caption="Vehicle"
          allowFiltering={true}
          allowHeaderFiltering={true}
          cellRender={cellRender}
          width={170}
        >
          <Lookup
            dataSource={vehicles}
            valueExpr="hyoungNo"
            displayExpr="hyoungNo"
          />
        </Column>

        {/* Driver Column */}
        <Column
          dataField="driverName"
          caption="Driver"
          allowFiltering={true}
          allowHeaderFiltering={true}
          cellRender={cellRender}
          width={120}
        />

        {/* Date Column */}
        <Column
          dataField="date"
          caption="Date"
          dataType="date"
          format="yyyy-MM-dd"
          allowFiltering={true}
          allowHeaderFiltering={true}
          cellRender={cellRender}
          width={110}
        />

        {/* Site Column */}
        <Column
          dataField="locationName"
          caption="Site"
          allowFiltering={true}
          allowHeaderFiltering={true}
          cellRender={cellRender}
          width={120}
        >
          <Lookup dataSource={sites} valueExpr="name" displayExpr="name" />
        </Column>

        {/* km/l specific columns */}
        <Column
          dataField="totalDistance"
          caption="Distance (km)"
          dataType="number"
          format="#,##0.00"
          allowFiltering={true}
          cellRender={cellRender}
          width={110}
          visible={reportType === "km/l"}
        />

        <Column
          dataField="totalFuel"
          caption="Fuel (l)"
          dataType="number"
          format="#,##0.00"
          allowFiltering={true}
          cellRender={cellRender}
          width={90}
        />

        <Column
          caption="km/l"
          calculateCellValue={(rowData) => {
            if (
              rowData.totalDistance &&
              rowData.totalFuel &&
              rowData.totalFuel > 0
            ) {
              return (rowData.totalDistance / rowData.totalFuel).toFixed(2);
            }
            return null;
          }}
          dataType="number"
          format="#0.00"
          allowFiltering={true}
          width={90}
          visible={reportType === "km/l"}
        />

        <Column
          dataField="maxSpeed"
          caption="Max Speed"
          dataType="number"
          format="#,##0.00"
          allowFiltering={true}
          cellRender={cellRender}
          width={100}
          visible={reportType === "km/l"}
        />

        <Column
          dataField="avgSpeed"
          caption="Avg Speed"
          dataType="number"
          format="#,##0.00"
          allowFiltering={true}
          cellRender={cellRender}
          width={100}
          visible={reportType === "km/l"}
        />

        {/* l/hr specific columns */}
        <Column
          dataField="engHours"
          caption="Runtime Eng Hrs"
          dataType="number"
          format="#,##0.00"
          allowFiltering={true}
          cellRender={cellRender}
          width={130}
          visible={reportType === "l/hr"}
        />

        <Column
          dataField="flowMeterEngineHrs"
          caption="Flow Meter Eng Hrs"
          width={150}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
          visible={reportType === "l/hr"}
        />

        <Column
          dataField="flowMeterFuelUsed"
          caption="Flow Meter Fuel"
          width={150}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
          visible={reportType === "l/hr"}
        />

        <Column
          dataField="flowMeterEffiency"
          caption="Flow Meter Eff"
          width={150}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
          visible={reportType === "l/hr"}
        />

        <Column
          dataField="flowMeterFuelLost"
          caption="Flow Meter Lost"
          width={150}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
          visible={reportType === "l/hr"}
        />

        <Column
          dataField="excessWorkingHrsCost"
          caption="Excess Hrs Cost"
          width={150}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
          visible={reportType === "l/hr"}
        />

        {/* Night Shift Column - Always visible */}
        <Column
          dataField="isNightShift"
          caption="Night Shift"
          width={120}
          dataType="boolean"
          allowEditing={true}
          visible={true}
          cellRender={nightShiftCellRenderer}
        />

        {/* Common columns */}
        <Column
          dataField="fuelEfficiency"
          caption={
            reportType === "km/l" ? "Fuel Eff (km/l)" : "Fuel Eff (l/hr)"
          }
          width={120}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
        />

        <Column
          dataField="workingExpectedAverage"
          caption={
            reportType === "km/l" ? "Expected (km/l)" : "Expected (l/hr)"
          }
          width={120}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
        />

        <Column
          dataField="fuelLost"
          caption="Fuel Lost"
          width={100}
          dataType="number"
          format="#,##0.##"
          allowEditing={false}
        />

        <Column
          dataField="comment"
          caption="Comment"
          width={200}
          allowEditing={false}
        />
      </DataGrid>
    );
  }
);

ImportDataGrid.displayName = "ImportDataGrid";

export default ImportDataGrid;
