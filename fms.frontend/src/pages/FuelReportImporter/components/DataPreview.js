/**
 * File: DataPreview.js
 * Purpose: Data grid preview component for fuel report import with validation filtering
 * Dependencies: react, react-bootstrap, devextreme-react/data-grid, devextreme-react/button
 * Last Modified: 2025-12-01
 */
import React, { memo, useMemo } from "react";
import { Form, Badge } from "react-bootstrap";
import Button from "devextreme-react/button";
import {
  DataGrid,
  Paging,
  Pager,
  HeaderFilter,
  FilterRow,
  Scrolling,
  LoadPanel,
  Editing,
  Lookup,
  Column,
  ColumnFixing

} from "devextreme-react/data-grid";
import "./DataPreview.scss";

const DataPreview = memo(({
  filteredData,
  dataGridRef,
  parsedData,
  reportType,
  selectedRowKeys,
  onSelectionChanged,
  onRowPrepared,
  handleGridInitialized,
  pageSize,
  pageSizes,
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
  // Include filterErrorsOnly and showValidationErrors in dependencies to re-compute when filters change
  const memoizedDataSource = useMemo(() => {
    return getFilteredData();
  }, [getFilteredData, filterErrorsOnly, showValidationErrors, showDuplicateErrors, validationErrors]);

  return (
    <div className="data-preview tw-mt-6">
      {/* Header Row */}
      <div className="tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-mb-4 tw-pb-3 tw-border-b tw-border-gray-200 tw-gap-3">
        <h5 className="tw-text-lg tw-font-semibold tw-flex tw-items-center tw-gap-2 tw-text-gray-800">
          <i className="fa-light fa-table tw-mr-2 tw-text-blue-500"></i>
          Data Preview
          <span className="tw-bg-blue-100 tw-text-blue-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
            {memoizedDataSource.length} rows
            {filterErrorsOnly && parsedData.length !== memoizedDataSource.length && (
              <span className="tw-text-blue-600"> of {parsedData.length}</span>
            )}
          </span>
          {/* Status Summary */}
          {validationErrors.some(err => err.isBackendError) && (
            <span className="tw-bg-red-100 tw-text-red-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-server tw-mr-1"></i>
              {validationErrors.filter(err => err.isBackendError).length} server error{validationErrors.filter(err => err.isBackendError).length !== 1 ? 's' : ''}
            </span>
          )}
          {validationErrors.filter(err => !err.isBackendError && !err.isDuplicate).length > 0 && (
            <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
              {validationErrors.filter(err => !err.isBackendError && !err.isDuplicate).length} issue{validationErrors.filter(err => !err.isBackendError && !err.isDuplicate).length !== 1 ? 's' : ''}
            </span>
          )}
          {fixedRows.size > 0 && (
            <span className="tw-bg-emerald-100 tw-text-emerald-800 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              <i className="fa-light fa-check-double tw-mr-1"></i>
              {fixedRows.size} fixed
            </span>
          )}
        </h5>

        {/* Selection Info */}
        {selectedRows.length > 0 && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-bg-gray-50 tw-px-3 tw-py-1.5 tw-rounded-md tw-border tw-border-gray-200">
            <i className="fa-light fa-check-square tw-text-blue-500"></i>
            <span className="tw-text-sm tw-text-gray-700 tw-font-medium">
              {selectedRows.length} selected
            </span>
            {countSelectedRowsErrors() > 0 && (
              <span className="tw-text-xs tw-text-red-500 tw-font-medium">
                ({countSelectedRowsErrors()} issues)
              </span>
            )}
            <button
              onClick={clearSelections}
              className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-800 tw-underline tw-ml-1"
              title="Clear selection"
            >
              Clear
            </button>
            {onDeleteSelectedRows && (
              <button
                onClick={onDeleteSelectedRows}
                className="tw-ml-2 tw-px-2 tw-py-1 tw-bg-red-100 tw-text-red-700 tw-rounded tw-text-xs tw-font-medium hover:tw-bg-red-200 tw-border tw-border-red-300 tw-transition-colors"
                title={`Delete ${selectedRows.length} selected row(s)`}
              >
                <i className="fa-light fa-trash tw-mr-1"></i>
                Delete ({selectedRows.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-3">
          {/* Validation Filter Button Group - Show for l/hr reports OR when backend errors exist */}
          {((reportType === "l/hr" && validationErrors.length > 0) ||
            validationErrors.some(err => err.isBackendError)) && (
            <div className="data-preview__filter-buttons">
              <Button
                text={filterErrorsOnly ? "Showing Issues" : "Show Issues"}
                icon="fa-light fa-triangle-exclamation"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  if (!filterErrorsOnly) {
                    setFilterErrorsOnly(true);
                    handleToggleValidationFilter({ target: { checked: true } });
                  }
                }}
                hint="Filter to show only rows with validation issues"
                className={`data-preview__filter-btn data-preview__filter-btn--first ${
                  filterErrorsOnly ? "data-preview__filter-btn--active" : ""
                }`}
              />
              <Button
                text="Show All"
                icon="fa-light fa-list"
                type="default"
                stylingMode="outlined"
                onClick={() => {
                  setFilterErrorsOnly(false);
                  handleToggleValidationFilter({ target: { checked: false } });
                }}
                hint="Show all rows"
                className={`data-preview__filter-btn data-preview__filter-btn--last ${
                  !filterErrorsOnly ? "data-preview__filter-btn--active" : ""
                }`}
              />
            </div>
          )}

          {/* Validation Issues Badge */}
          {validationErrors.length > 0 && (
            <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-3 tw-py-1.5 tw-rounded-md tw-text-xs tw-font-semibold tw-flex tw-items-center tw-gap-1.5 tw-border tw-border-amber-200">
              <i className="fa-light fa-triangle-exclamation"></i>
              {validationErrors.length} validation issue{validationErrors.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Duplicates Filter - Only if duplicates exist */}
          {validationErrors.some((err) => err.isDuplicate) && (
            <Button
              text={showDuplicateErrors ? "Showing Duplicates" : "Show Duplicates"}
              icon="fa-light fa-copy"
              type={showDuplicateErrors ? "danger" : "default"}
              stylingMode={showDuplicateErrors ? "contained" : "outlined"}
              onClick={() => {
                handleToggleDuplicateFilter({
                  target: { checked: !showDuplicateErrors }
                });
              }}
              hint="Filter to show only duplicate records"
              className="data-preview__duplicate-btn"
            />
          )}

          {/* km/l reports: Checkbox-based filters */}
          {reportType !== "l/hr" && validationErrors.length > 0 && (
            <>
              <Form.Check
                type="checkbox"
                id="validation-filter"
                label={
                  <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                    <i className={`fa-light fa-triangle-exclamation ${showValidationErrors ? "tw-text-red-500" : "tw-text-amber-500"}`}></i>
                    Show validation issues
                    <Badge bg="warning" className="tw-ml-1">{validationErrors.length}</Badge>
                  </span>
                }
                checked={showValidationErrors}
                onChange={(e) => {
                  setTimeout(() => handleToggleValidationFilter(e), 0);
                }}
                className="tw-text-sm"
              />
              <Form.Check
                type="checkbox"
                id="filter-errors"
                label={
                  <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                    <i className={`fa-light ${filterErrorsOnly ? "fa-filter-circle-xmark tw-text-red-500" : "fa-filter tw-text-gray-500"}`}></i>
                    Filter rows with errors
                  </span>
                }
                checked={filterErrorsOnly}
                onChange={(e) => {
                  setTimeout(() => {
                    setFilterErrorsOnly(e.target.checked);
                    if (e.target.checked && !showValidationErrors) {
                      handleToggleValidationFilter({ target: { checked: true } });
                    }
                  }, 10);
                }}
                className="tw-text-sm"
              />
            </>
          )}
        </div>

        {/* Select Valid Rows Button */}
        <div className="tw-flex tw-items-center tw-gap-2">
          {/* Validate Data Button - Re-run validation after edits */}
          {onValidateData && (
            <Button
              text="Validate Data"
              icon="fa-light fa-clipboard-check"
              type="default"
              stylingMode="outlined"
              onClick={onValidateData}
              hint="Re-validate data after making edits to check for remaining issues"
              className="data-preview__validate-btn"
            />
          )}
          {validationErrors.length > 0 && (
            <Button
              text="Select Valid Rows"
              icon="fa-light fa-filter-circle-check"
              type="default"
              stylingMode="outlined"
              onClick={selectValidRowsOnly}
              hint="Select only rows without validation errors"
              className="data-preview__select-valid-btn"
            />
          )}
        </div>
      </div>

      <div className="tw-border tw-rounded-md tw-overflow-hidden tw-overflow-x-auto">
        <DataGrid
          ref={dataGridRef}
          key={reportType}
          dataSource={memoizedDataSource}
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
            if (!e.data || typeof e.data._rowIndex === 'undefined') return;
            if (onCellClick) onCellClick(e);
          }}
          onEditorPreparing={(e) => {
            if (!e.row?.data || typeof e.row.data._rowIndex === 'undefined') return;
            if (onEditorPreparing) onEditorPreparing(e);
          }}
          onRowUpdated={onRowUpdated}
          onContentReady={(e) => {
            // Remove the refresh call that was causing infinite re-rendering
            // The DataGrid will handle its own updates when dataSource changes
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
          <Column
            dataField="_rowIndex"
            caption="Select"
            width={50}
            alignment="center"
            allowFiltering={false}
            allowSorting={false}
            headerCellRender={() => {
              // Use memoizedDataSource for consistent filtering with the grid data
              const currentData = memoizedDataSource;
              const allSelected = currentData && currentData.length > 0 &&
                currentData.every(row => row && selectedRowKeys.includes(row._rowIndex));

              return (
                <div className="tw-flex tw-justify-center">
                  <input
                    type="checkbox"
                    className="tw-w-4 tw-h-4"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        onSelectionChanged && onSelectionChanged({
                          selectedRowKeys: [],
                          selectedRowsData: []
                        });
                      } else {
                        const validRows = currentData.filter(row => row && typeof row._rowIndex !== 'undefined');
                        const allKeys = validRows.map(row => row._rowIndex);

                        onSelectionChanged && onSelectionChanged({
                          selectedRowKeys: allKeys,
                          selectedRowsData: validRows
                        });
                      }
                    }}
                  />
                </div>
              );
            }}
            cellRender={(cellData) => {
              const isSelected = selectedRowKeys.includes(cellData.data._rowIndex);
              return (
                <div className="tw-flex tw-justify-center">
                  <input
                    type="checkbox"
                    className="tw-w-4 tw-h-4"
                    checked={isSelected}
                    onChange={() => {
                      const newSelectedKeys = isSelected
                        ? selectedRowKeys.filter(key => key !== cellData.data._rowIndex)
                        : [...selectedRowKeys, cellData.data._rowIndex];

                      if (onSelectionChanged) {
                        // Create a safe filtered list of selected rows using memoizedDataSource
                        const selectedRowsData = [];
                        const currentData = memoizedDataSource;
                        if (currentData && Array.isArray(currentData)) {
                          for (let i = 0; i < currentData.length; i++) {
                            const row = currentData[i];
                            if (row && typeof row._rowIndex !== 'undefined' &&
                                newSelectedKeys.includes(row._rowIndex)) {
                              selectedRowsData.push(row);
                            }
                          }
                        }

                        // Call selection changed with safely constructed data
                        onSelectionChanged({
                          selectedRowKeys: newSelectedKeys,
                          selectedRowsData: selectedRowsData
                        });
                      }
                    }}
                  />
                </div>
              );
            }}
          />

          {/* Status Column - Shows validation status and fix button */}
          <Column
            caption="Status"
            width={130}
            alignment="center"
            allowFiltering={false}
            allowSorting={false}
            allowEditing={false}
            cellRender={(cellData) => {
              const { data, component, rowIndex } = cellData;
              if (!data) return null;

              const dataRowIndex = parsedData.findIndex(
                (item) => item._rowIndex === data._rowIndex
              );

              // Check if this row has been fixed
              const isFixed = fixedRows.has(data._rowIndex) || data._isFixed;

              // Check if this row has any validation error
              const rowErrors = validationErrors.filter(
                (err) => err.rowIndex === dataRowIndex
              );

              // Row is valid (no errors and not previously had errors)
              if (rowErrors.length === 0 && !isFixed) {
                return (
                  <span className="tw-inline-flex tw-items-center tw-gap-1 tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
                    <i className="fa-light fa-check-circle"></i>
                    Valid
                  </span>
                );
              }

              // Row was fixed (errors were resolved)
              if (rowErrors.length === 0 && isFixed) {
                return (
                  <span className="tw-inline-flex tw-items-center tw-gap-1 tw-bg-emerald-100 tw-text-emerald-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
                    <i className="fa-light fa-check-double"></i>
                    Fixed
                  </span>
                );
              }

              // Determine error type for styling
              const duplicateError = rowErrors.find(err => err.isDuplicate);
              const isDuplicate = !!duplicateError;
              const duplicateWithRows = duplicateError?.duplicateWithRows || [];
              const errorFields = [...new Set(rowErrors.map(err => err.field))];

              // For duplicates, show which rows conflict
              if (isDuplicate) {
                return (
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
                    <span className="tw-text-[10px] tw-text-rose-600 tw-font-medium">
                      <i className="fa-light fa-copy tw-mr-1"></i>
                      Dup w/ Row {duplicateWithRows.map(i => i + 1).join(", ")}
                    </span>
                    <button
                      className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-rose-100 tw-text-rose-700 hover:tw-bg-rose-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          // For duplicates, edit isNightShift
                          const colIndex = component.getVisibleColumnIndex("isNightShift");
                          if (colIndex >= 0) {
                            setTimeout(() => {
                              try {
                                component.editCell(rowIndex, colIndex);
                              } catch (err) {
                                console.warn("Could not edit cell:", err);
                              }
                            }, 50);
                          }
                        } catch (err) {
                          console.warn("Error handling fix click:", err);
                        }
                      }}
                      title="Toggle Night Shift to differentiate from duplicate"
                    >
                      <i className="fa-light fa-moon"></i>
                      Set Shift
                    </button>
                  </div>
                );
              }

              // Check if this is a backend error
              const isBackendError = rowErrors.some(err => err.isBackendError);

              // Backend server errors - show in red
              if (isBackendError) {
                return (
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
                    <span className="tw-text-[10px] tw-text-red-600 tw-font-medium">
                      <i className="fa-light fa-server tw-mr-1"></i>
                      Server Error
                    </span>
                    <button
                      className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-red-100 tw-text-red-700 hover:tw-bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const editableFields = ["vehicleName", "locationName", "driverName", "date", "isNightShift"];
                          const firstEditableError = errorFields.find(f => editableFields.includes(f));
                          if (firstEditableError) {
                            const colIndex = component.getVisibleColumnIndex(firstEditableError);
                            if (colIndex >= 0) {
                              setTimeout(() => {
                                try {
                                  component.editCell(rowIndex, colIndex);
                                } catch (err) {
                                  console.warn("Could not edit cell:", err);
                                }
                              }, 50);
                            }
                          }
                        } catch (err) {
                          console.warn("Error handling fix click:", err);
                        }
                      }}
                      title={`Click to fix: ${rowErrors.map(e => e.message).join('; ')}`}
                    >
                      <i className="fa-light fa-edit"></i>
                      Fix
                    </button>
                  </div>
                );
              }

              // Non-duplicate frontend errors
              return (
                <button
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-amber-100 tw-text-amber-700 hover:tw-bg-amber-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      // Find the first editable error field and edit it
                      const editableFields = ["vehicleName", "locationName", "driverName", "date", "isNightShift"];
                      const firstEditableError = errorFields.find(f => editableFields.includes(f));
                      if (firstEditableError) {
                        const colIndex = component.getVisibleColumnIndex(firstEditableError);
                        if (colIndex >= 0) {
                          setTimeout(() => {
                            try {
                              component.editCell(rowIndex, colIndex);
                            } catch (err) {
                              console.warn("Could not edit cell:", err);
                            }
                          }, 50);
                        }
                      }
                    } catch (err) {
                      console.warn("Error handling fix click:", err);
                    }
                  }}
                  title={`Click to fix: ${rowErrors.map(e => e.message).join('; ')}`}
                >
                  <i className="fa-light fa-edit"></i>
                  Fix ({rowErrors.length})
                </button>
              );
            }}
          />

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

          <Column
            dataField="driverName"
            caption="Driver"
            allowFiltering={true}
            allowHeaderFiltering={true}
            cellRender={cellRender}
            width={120}
          />

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

          <Column
            dataField="locationName"
            caption="Site"
            allowFiltering={true}
            allowHeaderFiltering={true}
            cellRender={cellRender}
            width={120}
          >
            <Lookup
              dataSource={sites}
              valueExpr="name"
              displayExpr="name"
            />
          </Column>

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
              if (rowData.totalDistance && rowData.totalFuel && rowData.totalFuel > 0) {
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

          <Column
            dataField="isNightShift"
            caption="Night Shift"
            width={120}
            dataType="boolean"
            allowEditing={true}
            visible={reportType === "l/hr"}
            cellRender={(cellData) => {
              const { data, component, rowIndex } = cellData;
              if (!data) return null;

              const dataRowIndex = parsedData.findIndex(
                (item) => item._rowIndex === data._rowIndex
              );

              // Check if this row has a duplicate error
              const duplicateError = validationErrors.find(
                (err) => err.rowIndex === dataRowIndex && err.isDuplicate
              );
              const hasDuplicateError = !!duplicateError;

              // If has duplicate error, show toggle button
              if (hasDuplicateError) {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    <button
                      className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-border tw-cursor-pointer tw-transition-all ${
                        data.isNightShift
                          ? "tw-bg-indigo-500 tw-text-white tw-border-indigo-600 hover:tw-bg-indigo-600"
                          : "tw-bg-amber-500 tw-text-white tw-border-amber-600 hover:tw-bg-amber-600"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle the isNightShift value
                        const newValue = !data.isNightShift;
                        component.cellValue(rowIndex, "isNightShift", newValue);
                        // Trigger save
                        component.saveEditData();
                      }}
                      title={`Click to set as ${data.isNightShift ? "Day" : "Night"} shift`}
                    >
                      <i className={`fa-light ${data.isNightShift ? "fa-sun" : "fa-moon"} tw-mr-1`}></i>
                      {data.isNightShift ? "→ Day" : "→ Night"}
                    </button>
                  </div>
                );
              }

              // Normal display
              return (
                <div className="tw-flex tw-items-center tw-justify-center">
                  {data.isNightShift ? (
                    <span className="tw-bg-indigo-100 tw-text-indigo-800 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
                      <i className="fa-light fa-moon tw-mr-1"></i>Night
                    </span>
                  ) : (
                    <span className="tw-bg-amber-50 tw-text-amber-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
                      <i className="fa-light fa-sun tw-mr-1"></i>Day
                    </span>
                  )}
                </div>
              );
            }}
          />

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
      </div>
    </div>
  );
});

DataPreview.displayName = 'DataPreview';

export default DataPreview;
