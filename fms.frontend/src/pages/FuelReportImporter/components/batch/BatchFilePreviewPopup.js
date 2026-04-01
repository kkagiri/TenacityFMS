/**
 * File: BatchFilePreviewPopup.js
 * Purpose: Full-featured file preview popup for batch import with validation, editing, and row selection
 * Dependencies: DevExtreme Popup, DataPreview, useValidation hook
 * Last Modified: 2025-12-16
 *
 * Features:
 * - Same validation as single file import
 * - Select valid rows only
 * - Edit cells to fix issues
 * - View flow/validation issues
 * - Re-validate after edits
 */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import * as XLSX from "xlsx";
import DataPreview from "../DataPreview";
import {
  normalizeParsedRowsForFile,
  validateBatchImportData,
} from "./batchImportUtils";

const BatchFilePreviewPopup = ({
  visible,
  onHiding,
  fileData,
  onUpdateFileData, // Callback to update parsedData in parent
  onImportFile, // Optional: trigger import directly from preview
}) => {
  const sites = useSelector((state) => state.site.sites) || [];
  const vehicles = useSelector((state) => state.vehicle.vehicles) || [];

  // Local state for preview
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showDuplicateErrors, setShowDuplicateErrors] = useState(false);
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [fixedRows, setFixedRows] = useState(new Set());

  const dataGridRef = useRef(null);

  // Parse file when popup opens
  useEffect(() => {
    if (!visible || !fileData) {
      return;
    }

    if (Array.isArray(fileData.parsedData)) {
      initializePreviewData(fileData.parsedData);
      return;
    }

    if (fileData.file) {
      parseFile(fileData.file, fileData.skipRows || 8);
    }
  }, [visible, fileData, vehicles]);

  const initializePreviewData = (rows) => {
    const normalizedData = normalizeParsedRowsForFile(rows, fileData);
    const errors = validateBatchImportData(
      normalizedData,
      fileData?.reportType || "km/l",
      vehicles,
      { returnObjects: true }
    );

    setParsedData(normalizedData);
    setFilteredData(normalizedData);
    setSelectedRowKeys(normalizedData.map((row) => row._rowIndex));
    setSelectedRows(normalizedData);
    setValidationErrors(errors);
    setFixedRows(new Set());
  };

  // Parse file and run validation
  const parseFile = async (file, skipRows) => {
    setLoading(true);
    try {
      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        range: skipRows,
        raw: false,
        defval: "",
      });

      const reportType = fileData?.reportType || "km/l";
      const mappedData = mapExcelData(jsonData, reportType);
      initializePreviewData(mappedData);
    } catch (error) {
      console.error("Failed to parse file:", error);
    } finally {
      setLoading(false);
    }
  };

  // Read file as array buffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Map Excel data to our format
  const mapExcelData = (jsonData, reportType) => {
    // Get site from fileData (detected from filename) - this takes priority
    const fileSiteId = fileData?.siteId || null;
    const fileSite = fileSiteId ? sites.find((s) => s.id === fileSiteId) : null;
    const fileSiteName = fileSite?.name || fileData?.siteName || "";

    return jsonData.map((row, index) => {
      // Vehicle name - handle common typos
      const vehicleName =
        row["Vehicle Name"] ||
        row["Vehice Name"] || // Typo in L/Hr template
        row["Vehicle"] ||
        row["VEHICLE"] ||
        row["Hyoung No"] ||
        row["Reg#"] ||
        "";
      const matchedVehicle = vehicles.find(
        (v) => v.hyoungNo?.toLowerCase() === vehicleName?.toLowerCase()
      );

      // Driver name
      const driverName = row["Driver Name"] || row["Driver"] || "";

      // Site: prefer fileData site (from filename), fallback to Excel row data
      const rowLocationName = row["Location"] || row["Site"] || "";
      const locationName = fileSiteName || rowLocationName;
      const siteId =
        fileSiteId ||
        sites.find(
          (s) => s.name?.toLowerCase() === rowLocationName?.toLowerCase()
        )?.id ||
        null;

      // Parse date - Handle Date objects, Excel serial numbers, and strings
      let dateValue = row["Date"] || "";
      let formattedDate = "";

      if (dateValue) {
        // If already a Date object (from XLSX parsing)
        if (dateValue instanceof Date) {
          formattedDate = !isNaN(dateValue.getTime())
            ? dateValue.toISOString().split("T")[0]
            : "";
        } else {
          // Try to parse as Excel serial number
          const numericValue = parseFloat(dateValue);
          if (!isNaN(numericValue) && numericValue > 25569) {
            const parsedDate = new Date((numericValue - 25569) * 86400 * 1000);
            formattedDate = parsedDate.toISOString().split("T")[0];
          } else {
            // Try to parse as date string
            const parsedDate = new Date(dateValue);
            formattedDate = !isNaN(parsedDate.getTime())
              ? parsedDate.toISOString().split("T")[0]
              : String(dateValue); // Convert to string to be safe
          }
        }
      }

      // Common fields
      const commentText = row["Comments"] || row["Comment"] || "";
      const isNightShift = (
        row["Shift"]?.toLowerCase() ||
        commentText.toLowerCase() ||
        ""
      ).includes("night");

      // km/l specific fields - match single file import column names
      const totalDistance =
        parseFloat(
          row["Total Distance (GPS)"] ||
            row["Total Distance"] ||
            row["Km Covered"] ||
            row["Distance"] ||
            0
        ) || 0;
      const maxSpeed =
        parseFloat(
          row["Max Speed"] || row["Maximum Speed"] || row["MAX SPEED"] || 0
        ) || 0;
      const avgSpeed =
        parseFloat(
          row["Avg Speed"] ||
            row["Average Speed"] ||
            row["Avg. Speed"] ||
            row["AVG SPEED"] ||
            0
        ) || 0;

      // l/hr specific fields - match L/Hr Excel template columns
      const engHours =
        parseFloat(
          row["Runtime Eng hrs"] || // L/Hr template
            row["Working Hrs"] ||
            row["Engine Hours"] ||
            0
        ) || 0;
      const totalFuel =
        parseFloat(
          row["Total fuel"] || // L/Hr template (lowercase 'f')
            row["Total Fuel"] ||
            row["Fuel Used"] ||
            row["Fuel Consumption"] ||
            row["Fuel"] ||
            0
        ) || 0;
      const fuelEfficiency =
        parseFloat(
          row["Fue Eff (/hr)"] || // L/Hr template (typo - missing 'l')
            row["Fuel Eff (/hr)"] ||
            row["Fuel Eff (l/hr)"] ||
            row["Fuel Efficiency"] ||
            row["Efficiency"] ||
            row["Km/ Litre"] ||
            row["Ltr/Hr"] ||
            row["Fuel Efficient Based on Distance km/l"] || // L/Hr template
            0
        ) || 0;
      const flowMeterEngineHrs =
        parseFloat(
          row["Flow meter Eng Hrs"] || // L/Hr template
            row["Flow Meter Engine Hrs"] ||
            row["Flow Meter Engine Hours"] ||
            0
        ) || 0;
      const flowMeterFuelUsed =
        parseFloat(
          row["Flow meter Total fuel"] || // L/Hr template
            row["Flow Meter Fuel Used"] ||
            row["Flow Meter Fuel"] ||
            0
        ) || 0;
      const flowMeterEffiency =
        parseFloat(
          row["Flow meter Fuel eff"] || // L/Hr template
            row["Flow Meter Efficiency"] ||
            row["Flow Meter Fuel Efficiency"] ||
            0
        ) || 0;
      const flowMeterFuelLost =
        parseFloat(
          row["Flow meter Fuel lost"] || // L/Hr template
            row["Flow Meter Fuel Lost"] ||
            0
        ) || 0;
      const excessWorkingHrsCost =
        parseFloat(
          row["Excessive Hours (10)"] || // L/Hr template
            row["Excess Working Hrs Cost"] ||
            row["Excess Working Hours Cost"] ||
            0
        ) || 0;
      const workingExpectedAverage =
        parseFloat(
          row["Expected Fuel Eff"] || // L/Hr template
            row["Expected Average"] ||
            0
        ) || 0;
      const fuelLost =
        parseFloat(
          row["Fuel lost"] || // L/Hr template
            row["Fuel Lost"] ||
            0
        ) || 0;
      const diff = parseFloat(row["DIFF"] || 0) || 0;

      return {
        _rowIndex: index,
        vehicleName: vehicleName,
        vehicleId: matchedVehicle?.vehicleId || null,
        driverName: driverName,
        employeeNo: row["Empoyee No"] || row["Employee No"] || "", // L/Hr template (typo)
        phoneNo: row["Phone No"] || row["Phone"] || "",
        locationName: locationName,
        siteId: siteId,
        date: formattedDate,
        isNightShift: isNightShift,
        totalDistance: totalDistance,
        totalFuel: totalFuel,
        fuelEfficiency: fuelEfficiency,
        engHours: engHours,
        maxSpeed: maxSpeed,
        avgSpeed: avgSpeed,
        flowMeterEngineHrs: flowMeterEngineHrs,
        flowMeterFuelUsed: flowMeterFuelUsed,
        flowMeterEffiency: flowMeterEffiency,
        flowMeterFuelLost: flowMeterFuelLost,
        excessWorkingHrsCost: excessWorkingHrsCost,
        workingExpectedAverage: workingExpectedAverage,
        fuelLost: fuelLost,
        diff: diff,
        comment: commentText,
      };
    });
  };

  // Validate data - use shared validation function
  const validateData = (data, reportType) => {
    return validateBatchImportData(data, reportType, vehicles, {
      returnObjects: true,
    });
  };

  // Get filtered data based on current filter state
  const getFilteredData = useCallback(() => {
    let result = parsedData;

    if (filterErrorsOnly || showValidationErrors) {
      const errorRowIndices = new Set(validationErrors.map((e) => e.rowIndex));
      result = parsedData.filter((row) => errorRowIndices.has(row._rowIndex));
    }

    if (showDuplicateErrors) {
      const duplicateRowIndices = new Set(
        validationErrors.filter((e) => e.isDuplicate).map((e) => e.rowIndex)
      );
      result = parsedData.filter((row) =>
        duplicateRowIndices.has(row._rowIndex)
      );
    }

    return result;
  }, [
    parsedData,
    filterErrorsOnly,
    showValidationErrors,
    showDuplicateErrors,
    validationErrors,
  ]);

  // Handle selection change
  const onSelectionChanged = (e) => {
    setSelectedRowKeys(e.selectedRowKeys || []);
    setSelectedRows(e.selectedRowsData || []);
  };

  // Row styling based on validation
  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      const rowErrors = validationErrors.filter(
        (err) => err.rowIndex === e.data._rowIndex
      );

      if (rowErrors.length > 0) {
        if (rowErrors.some((err) => err.isDuplicate)) {
          e.rowElement.classList.add("duplicate-row");
        } else {
          e.rowElement.classList.add("error-row");
        }
      }
    }
  };

  // Cell render with error highlighting
  const cellRender = useCallback(
    (cellData) => {
      const { data, column } = cellData;
      if (!data) return null;

      const error = validationErrors.find(
        (err) =>
          err.rowIndex === data._rowIndex && err.field === column.dataField
      );

      const cellStyle = error
        ? {
            color: error.isDuplicate ? "#9f1239" : "#dc2626",
            fontWeight: "bold",
            backgroundColor: error.isDuplicate
              ? "rgba(255, 228, 230, 0.7)"
              : "rgba(254, 243, 199, 0.5)",
            border: error.isDuplicate
              ? "1px solid #be185d"
              : "1px solid #f59e0b",
            padding: "2px 4px",
            borderRadius: "2px",
          }
        : {};

      // Ensure displayValue is always a string (not a Date object)
      let displayValue = cellData.displayValue;
      if (displayValue instanceof Date) {
        displayValue = !isNaN(displayValue.getTime())
          ? displayValue.toISOString().split("T")[0]
          : "";
      } else if (
        displayValue !== null &&
        displayValue !== undefined &&
        typeof displayValue === "object"
      ) {
        displayValue = String(displayValue);
      }

      return (
        <div
          style={cellStyle}
          title={error?.message || ""}
          className={error ? "tw-relative" : ""}
        >
          {displayValue}
          {error && (
            <span className="tw-absolute tw-right-1 tw-top-1/2 tw--translate-y-1/2 tw-text-red-500 tw-opacity-80">
              <i
                className={`fa-solid ${
                  error.isDuplicate ? "fa-copy" : "fa-circle-exclamation"
                } tw-text-xs`}
              />
            </span>
          )}
        </div>
      );
    },
    [validationErrors]
  );

  // Select only valid rows
  const selectValidRowsOnly = () => {
    const errorRowIndices = new Set(validationErrors.map((e) => e.rowIndex));
    const validRows = parsedData.filter(
      (row) => !errorRowIndices.has(row._rowIndex)
    );
    setSelectedRowKeys(validRows.map((row) => row._rowIndex));
    setSelectedRows(validRows);
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  // Count errors in selected rows
  const countSelectedRowsErrors = () => {
    const selectedIndices = new Set(selectedRowKeys);
    return validationErrors.filter((err) => selectedIndices.has(err.rowIndex))
      .length;
  };

  // Toggle validation filter
  const handleToggleValidationFilter = (e) => {
    setShowValidationErrors(e.target.checked);
    if (!e.target.checked) {
      setFilterErrorsOnly(false);
    }
  };

  // Toggle duplicate filter
  const handleToggleDuplicateFilter = (e) => {
    setShowDuplicateErrors(e.target.checked);
  };

  // Re-validate data
  const handleValidateData = () => {
    const errors = validateData(parsedData, fileData?.reportType || "km/l");
    setValidationErrors(errors);
  };

  // Delete selected rows
  const handleDeleteSelectedRows = () => {
    const selectedSet = new Set(selectedRowKeys);
    const newData = normalizeParsedRowsForFile(
      parsedData.filter((row) => !selectedSet.has(row._rowIndex)),
      fileData
    );
    setParsedData(newData);
    setFilteredData(newData);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    // Re-validate
    const errors = validateData(newData, fileData?.reportType || "km/l");
    setValidationErrors(errors);
  };

  // Handle row update (inline editing)
  const onRowUpdated = (e) => {
    const updatedData = [...parsedData];
    const rowIndex = updatedData.findIndex(
      (row) => row._rowIndex === e.data._rowIndex
    );
    if (rowIndex !== -1) {
      updatedData[rowIndex] = { ...updatedData[rowIndex], ...e.data };

      // Re-match vehicle if vehicleName changed
      if (Object.prototype.hasOwnProperty.call(e.data, "vehicleName")) {
        const matchedVehicle = vehicles.find(
          (v) => v.hyoungNo?.toLowerCase() === e.data.vehicleName?.toLowerCase()
        );
        updatedData[rowIndex].vehicleId = matchedVehicle
          ? matchedVehicle.vehicleId
          : null;
      }

      setParsedData(updatedData);
      setSelectedRows(
        updatedData.filter((row) => selectedRowKeys.includes(row._rowIndex))
      );
      setFixedRows((prev) => new Set([...prev, e.data._rowIndex]));

      // Re-validate
      const errors = validateData(updatedData, fileData?.reportType || "km/l");
      setValidationErrors(errors);
    }
  };

  // Save changes and close
  const handleSaveAndClose = () => {
    if (onUpdateFileData && fileData) {
      const normalizedData = normalizeParsedRowsForFile(parsedData, fileData);
      onUpdateFileData(fileData.id, {
        parsedData: normalizedData,
        validationErrors: validationErrors,
        recordCount: normalizedData.length,
      });
    }
    onHiding();
  };

  // Import selected rows
  const handleImportSelected = () => {
    if (onImportFile && fileData) {
      onImportFile(
        fileData.id,
        selectedRows.length > 0 ? selectedRows : parsedData
      );
    }
    onHiding();
  };

  const reportType = fileData?.reportType || "km/l";
  const hasErrors = validationErrors.length > 0;
  const hasSelectedErrors = countSelectedRowsErrors() > 0;

  // Custom title render for Popup
  const renderTitle = useCallback(() => {
    return (
      <div className="tw-flex tw-items-center tw-gap-3">
        <i className="fa-light fa-file-excel tw-text-green-600"></i>
        <span>Preview: {fileData?.fileName || "File"}</span>
        {hasErrors && (
          <span className="tw-bg-amber-100 tw-text-amber-800 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
            {validationErrors.length} issue
            {validationErrors.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }, [fileData?.fileName, hasErrors, validationErrors.length]);

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={true}
      titleRender={renderTitle}
      showCloseButton={true}
      width="95%"
      height="90%"
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        {/* Summary Bar */}
        <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-items-center tw-gap-4">
            <span className="tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-table tw-mr-1"></i>
              {parsedData.length} rows
            </span>
            <span className="tw-text-sm tw-text-gray-600">
              <i className="fa-light fa-check-square tw-mr-1"></i>
              {selectedRows.length} selected
            </span>
            {hasSelectedErrors && (
              <span className="tw-text-sm tw-text-amber-600">
                <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>
                {countSelectedRowsErrors()} issues in selection
              </span>
            )}
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <Button
              text="Close"
              icon="fa-light fa-times"
              type="normal"
              stylingMode="outlined"
              onClick={onHiding}
            />
            <Button
              text="Save Changes"
              icon="fa-light fa-save"
              type="default"
              stylingMode="outlined"
              onClick={handleSaveAndClose}
            />
            {onImportFile && (
              <Button
                text={`Import ${selectedRows.length || parsedData.length} Rows`}
                icon="fa-light fa-upload"
                type="success"
                stylingMode="contained"
                disabled={
                  hasSelectedErrors || (selectedRows.length === 0 && hasErrors)
                }
                onClick={handleImportSelected}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="tw-flex-1 tw-overflow-auto tw-p-4">
          {loading ? (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
              <LoadPanel visible={true} message="Loading file..." />
            </div>
          ) : (
            <DataPreview
              filteredData={getFilteredData()}
              dataGridRef={dataGridRef}
              parsedData={parsedData}
              reportType={reportType}
              selectedRowKeys={selectedRowKeys}
              onSelectionChanged={onSelectionChanged}
              onRowPrepared={onRowPrepared}
              handleGridInitialized={() => {}}
              pageSize={50}
              pageSizes={[20, 50, 100, "all"]}
              onPageChanged={() => {}}
              onPageSizeChanged={() => {}}
              onCellClick={() => {}}
              onEditorPreparing={() => {}}
              onRowUpdated={onRowUpdated}
              cellRender={cellRender}
              showValidationErrors={showValidationErrors}
              handleToggleValidationFilter={handleToggleValidationFilter}
              showDuplicateErrors={showDuplicateErrors}
              handleToggleDuplicateFilter={handleToggleDuplicateFilter}
              filterErrorsOnly={filterErrorsOnly}
              setFilterErrorsOnly={setFilterErrorsOnly}
              selectedRows={selectedRows}
              clearSelections={clearSelections}
              countSelectedRowsErrors={countSelectedRowsErrors}
              validationErrors={validationErrors}
              getFilteredData={getFilteredData}
              selectValidRowsOnly={selectValidRowsOnly}
              vehicles={vehicles}
              sites={sites}
              fixedRows={fixedRows}
              onDeleteSelectedRows={handleDeleteSelectedRows}
              onValidateData={handleValidateData}
            />
          )}
        </div>
      </div>
    </Popup>
  );
};

export default BatchFilePreviewPopup;
