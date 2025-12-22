/**
 * File: DataPreview.js
 * Purpose: Data grid preview component for fuel report import with validation filtering
 * Dependencies: react, DataPreviewHeader, DataPreviewActions, ImportDataGrid
 * Last Modified: 2025-12-16
 * 
 * Refactored to use smaller, focused components:
 * - DataPreviewHeader: Title, badges, selection info
 * - DataPreviewActions: Filter buttons, validate/select buttons
 * - ImportDataGrid: DevExtreme DataGrid with all columns
 */
import React, { memo, useMemo } from "react";
import DataPreviewHeader from "./DataPreviewHeader";
import DataPreviewActions from "./DataPreviewActions";
import ImportDataGrid from "./ImportDataGrid";
import "./DataPreview.scss";

const pageSizes = [20, 50, 100, 200, 500];

/**
 * DataPreview - Main container component for fuel report data preview
 * Composes DataPreviewHeader, DataPreviewActions, and ImportDataGrid
 */
const DataPreview = memo(
  ({
    filteredData,
    dataGridRef,
    parsedData,
    reportType,
    selectedRowKeys,
    onSelectionChanged,
    onRowPrepared,
    handleGridInitialized,
    pageSize,
    onPageChanged,
    onPageSizeChanged,
    onCellClick,
    onEditorPreparing,
    onRowUpdated,
    cellRender,
    showValidationErrors,
    handleToggleValidationFilter,
    showDuplicateErrors,
    handleToggleDuplicateFilter,
    filterErrorsOnly,
    setFilterErrorsOnly,
    selectedRows,
    clearSelections,
    countSelectedRowsErrors,
    validationErrors,
    getFilteredData,
    selectValidRowsOnly,
    vehicles,
    sites,
    fixedRows = new Set(),
    onDeleteSelectedRows,
    onValidateData,
  }) => {
    // Memoize the data source to prevent unnecessary re-renders
    const memoizedDataSource = useMemo(() => {
      return getFilteredData();
    }, [getFilteredData]);

    return (
      <div className="data-preview tw-mt-6">
        {/* Header Row */}
        <DataPreviewHeader
          rowCount={memoizedDataSource.length}
          totalRows={parsedData.length}
          filterErrorsOnly={filterErrorsOnly}
          validationErrors={validationErrors}
          fixedRows={fixedRows}
          selectedRows={selectedRows}
          countSelectedRowsErrors={countSelectedRowsErrors}
          clearSelections={clearSelections}
          onDeleteSelectedRows={onDeleteSelectedRows}
        />

        {/* Action Buttons Row */}
        <DataPreviewActions
          reportType={reportType}
          validationErrors={validationErrors}
          filterErrorsOnly={filterErrorsOnly}
          setFilterErrorsOnly={setFilterErrorsOnly}
          showValidationErrors={showValidationErrors}
          handleToggleValidationFilter={handleToggleValidationFilter}
          showDuplicateErrors={showDuplicateErrors}
          handleToggleDuplicateFilter={handleToggleDuplicateFilter}
          onValidateData={onValidateData}
          selectValidRowsOnly={selectValidRowsOnly}
        />

        {/* DataGrid */}
        <div className="tw-border tw-rounded-md tw-overflow-hidden tw-overflow-x-auto">
          <ImportDataGrid
            dataGridRef={dataGridRef}
            reportType={reportType}
            dataSource={memoizedDataSource}
            parsedData={parsedData}
            selectedRowKeys={selectedRowKeys}
            fixedRows={fixedRows}
            validationErrors={validationErrors}
            vehicles={vehicles}
            sites={sites}
            pageSize={pageSize}
            onSelectionChanged={onSelectionChanged}
            onRowPrepared={onRowPrepared}
            onCellClick={onCellClick}
            onEditorPreparing={onEditorPreparing}
            onRowUpdated={onRowUpdated}
            onValidateData={onValidateData}
            handleGridInitialized={handleGridInitialized}
            onPageSizeChanged={onPageSizeChanged}
            onPageChanged={onPageChanged}
            cellRender={cellRender}
          />
        </div>
      </div>
    );
  }
);

DataPreview.displayName = "DataPreview";

export default DataPreview;
