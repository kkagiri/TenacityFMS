import React from "react";
import { Form, Badge } from "react-bootstrap";
import Button from "devextreme-react/button"; //Cursor
import {
  DataGrid,
  Paging,
  Pager,
  HeaderFilter,
  Selection,
  FilterRow,
  Scrolling,
  LoadPanel,
  Editing,
  Lookup,
  Column,
} from "devextreme-react/data-grid";

const DataPreview = ({
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
}) => {
  return (
    <div className="tw-mt-6">
      <div className="tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-gap-3">
        <h5 className="tw-text-lg tw-font-medium tw-flex tw-items-center tw-text-gray-800">
          <i className="fa-light fa-table tw-mr-2 tw-text-blue-500"></i>
          Data Preview
          <span className="tw-ml-2 tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs">
            {filteredData.length} rows in grid
          </span>
        </h5>
        <div className="tw-flex tw-items-center tw-gap-4">
          <Form.Check
            type="checkbox"
            id="validation-filter"
            label={
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                <i
                  className={`fa-light fa-triangle-exclamation ${
                    showValidationErrors
                      ? "tw-text-red-500"
                      : "tw-text-amber-500"
                  }`}
                ></i>
                {showValidationErrors
                  ? "Validation issues filter active"
                  : "Show validation issues"}
                {showValidationErrors && validationErrors.length > 0 && (
                  <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-1.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                    {validationErrors.length}
                  </span>
                )}
              </span>
            }
            checked={showValidationErrors}
            onChange={(e) => {
              setTimeout(() => {
                handleToggleValidationFilter(e);
              }, 0);
            }}
            disabled={validationErrors.length === 0}
            className={`tw-text-sm ${
              showValidationErrors ? "tw-font-medium" : ""
            }`}
          />
          {validationErrors.some((err) => err.isDuplicate) && (
            <Form.Check
              type="checkbox"
              id="duplicate-filter"
              label={
                <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                  <i className="fa-light fa-copy tw-text-rose-500"></i>
                  Show only duplicates
                  {showDuplicateErrors && (
                    <span className="tw-bg-rose-100 tw-text-rose-800 tw-px-1.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                      {validationErrors.filter((err) => err.isDuplicate).length}
                    </span>
                  )}
                </span>
              }
              checked={showDuplicateErrors}
              onChange={(e) => {
                setTimeout(() => {
                  handleToggleDuplicateFilter(e);
                }, 0);
              }}
              disabled={!validationErrors.some((err) => err.isDuplicate)}
              className="tw-text-sm"
            />
          )}
          {selectedRows.length > 0 && (
            <div className="tw-text-sm tw-text-gray-600 tw-flex tw-items-center">
              <i className="fa-light fa-check-square tw-mr-1"></i>
              {selectedRows.length} rows selected
              {selectedRows.length > 0 && countSelectedRowsErrors() > 0 && (
                <span className="tw-ml-2 tw-text-red-500">
                  ({countSelectedRowsErrors()} validation issues)
                </span>
              )}
              <Button
                stylingMode="text"
                type="normal"
                text="(Clear)"
                onClick={clearSelections}
                elementAttr={{
                  class: "tw-ml-1 tw-text-blue-500 hover:tw-text-blue-700",
                  title: "Clear selection",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center">
          <Form.Check
            type="checkbox"
            id="filter-errors"
            label={
              <span className="tw-flex tw-items-center tw-gap-1 tw-text-xs tw-font-medium">
                <i
                  className={`fa-light ${
                    filterErrorsOnly
                      ? "fa-filter-circle-xmark tw-text-red-500"
                      : "fa-filter tw-text-gray-500"
                  }`}
                ></i>
                Show only rows with errors
                {filterErrorsOnly && validationErrors.length > 0 && (
                  <Badge bg="danger" className="tw-ml-2 tw-font-medium">
                    {validationErrors.length}
                  </Badge>
                )}
              </span>
            }
            checked={filterErrorsOnly}
            onChange={(e) => {
              setTimeout(() => {
                try {
                  setFilterErrorsOnly(e.target.checked);

                  if (e.target.checked && !showValidationErrors) {
                    handleToggleValidationFilter({
                      target: { checked: true }
                    });
                  }
                } catch (err) {
                  console.error("Error toggling filter:", err);
                }
              }, 10);
            }}
            disabled={validationErrors.length === 0}
            className={`tw-text-sm ${filterErrorsOnly ? "tw-font-medium" : ""}`}
          />
          {showDuplicateErrors && (
            <Badge bg="danger" className="tw-font-semibold tw-ml-2">
              {validationErrors.filter((err) => err.isDuplicate).length}{" "}
              Duplicate Records
            </Badge>
          )}
          {(showValidationErrors || filterErrorsOnly) &&
            validationErrors.length > 0 && (
              <div className="tw-ml-3 tw-text-red-600 tw-text-sm tw-flex tw-items-center">
                <i className="fa-solid fa-triangle-exclamation tw-mr-1"></i>
                Showing {getFilteredData().length} of {parsedData.length} rows
              </div>
            )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {validationErrors.length > 0 && (
            <Button
              stylingMode="outlined"
              type="default"
              text="Select Valid Rows Only"
              icon="filter"
              onClick={selectValidRowsOnly}
              hint="Select only rows without validation errors"
            />
          )}
          <span
            className={
              validationErrors.length > 0
                ? "tw-text-red-600 tw-font-medium tw-ml-2"
                : "tw-hidden"
            }
          >
            {validationErrors.length} validation issues found
          </span>
        </div>
      </div>

      <div className="tw-border tw-rounded-md tw-overflow-hidden tw-overflow-x-auto">
        <DataGrid
          ref={dataGridRef}
          key={reportType}
          dataSource={getFilteredData()}
          keyExpr="_rowIndex"
          showBorders={true}
          columnAutoWidth={true}
          wordWrapEnabled={true}
          allowColumnResizing={true}
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
            setTimeout(() => {
              if (dataGridRef.current?.instance) {
                dataGridRef.current.instance.refresh();
              }
            }, 100);
          }}

          remoteOperations={{
            filtering: false,
            sorting: true,
            paging: true,
          }}
          cacheEnabled={true}
          repaintChangesOnly={true}
          columnMinWidth={80}
          columnHidingEnabled={true}
          renderAsync={true}
        >
          <Editing
            mode="row"
            allowUpdating={true}
            allowAdding={false}
            allowDeleting={false}
            startEditAction="click"
          />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} allowSearch={true} />
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
              const allSelected = filteredData && filteredData.length > 0 &&
                filteredData.every(row => row && selectedRowKeys.includes(row._rowIndex));

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
                        const validRows = filteredData.filter(row => row && typeof row._rowIndex !== 'undefined');
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
                        // Create a safe filtered list of selected rows
                        const selectedRowsData = [];
                        if (filteredData && Array.isArray(filteredData)) {
                          for (let i = 0; i < filteredData.length; i++) {
                            const row = filteredData[i];
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
            dataField="engineHours"
            caption="Engine Hours"
            dataType="number"
            format="#,##0.00"
            allowFiltering={true}
            cellRender={cellRender}
            width={110}
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
            width={100}
            dataType="boolean"
            allowEditing={false}
            visible={reportType === "l/hr"}
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
};

export default DataPreview;
