import React, { useState, useRef } from "react";
import { Popup } from "devextreme-react/popup";
import { DataGrid } from "devextreme-react/data-grid";
import { Column, Selection, Paging, Pager, Editing } from "devextreme-react/data-grid";
import { SelectBox } from "devextreme-react/select-box";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import * as XLSX from "xlsx";
import DataPreview from "./DataPreview";
import "./BatchImportPopup.scss";

const BatchImportPopup = ({ visible, onHiding, sites = [], reportTypes = [], onBatchImport, vehicles = [] }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [duplicateHandling, setDuplicateHandling] = useState("fail");
  const [showInstructions, setShowInstructions] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [errorDetailsVisible, setErrorDetailsVisible] = useState(false);
  const [selectedFileError, setSelectedFileError] = useState(null);
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);
  const previewGridRef = useRef(null);

  // Handle multiple file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) return;

    const newFiles = selectedFiles.map((file, index) => {
      // Try to detect site from filename
      const detectedSite = detectSiteFromFilename(file.name, sites);

      // Try to detect month from filename (e.g., "January", "Jan", "01-2025")
      const detectedMonth = detectMonthFromFilename(file.name);

      return {
        id: Date.now() + index,
        file: file,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        siteId: detectedSite?.id || null,
        siteName: detectedSite?.name || "Not detected",
        reportType: "km/l", // Default
        month: detectedMonth,
        skipRows: 8, // Default for km/l
        status: "Pending",
        statusIcon: "fa-light fa-clock",
        statusColor: "tw-text-gray-500",
      };
    });

    setFiles((prev) => [...prev, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    notify(`${selectedFiles.length} file(s) added`, "success", 2000);
  };

  // Detect site from filename (e.g., "IP Fuel Report MAY 2025.xlsx" -> Industrial Plot)
  const detectSiteFromFilename = (filename, sites) => {
    // Extract site name from filename pattern: SITENAME Fuel Report MONTH YEAR.xlsx
    const fileNamePattern = /^(.*?)(?:\s+)?Fuel Report/i;
    const match = filename.match(fileNamePattern);

    if (match && match[1]) {
      let siteName = match[1].trim();

      // Special case for FOOTBRIDGE which should map to BRIDGE
      if (siteName.toUpperCase() === "FOOTBRIDGE") {
        siteName = "BRIDGE";
      }
      // Special case for IP which should map to Industrial Plot
      else if (siteName.toUpperCase() === "IP") {
        siteName = "Industrial Plot";
      }

      // Find site by name (case-insensitive)
      const detectedSite = sites.find(
        site => site.name.toUpperCase() === siteName.toUpperCase()
      );

      return detectedSite;
    }

    // Fallback: try simple includes check
    const lowerFilename = filename.toLowerCase();
    for (const site of sites) {
      const siteName = site.name.toLowerCase();
      if (lowerFilename.includes(siteName)) {
        return site;
      }
    }

    return null;
  };

  // Detect month from filename
  const detectMonthFromFilename = (filename) => {
    const months = {
      january: "01", jan: "01",
      february: "02", feb: "02",
      march: "03", mar: "03",
      april: "04", apr: "04",
      may: "05",
      june: "06", jun: "06",
      july: "07", jul: "07",
      august: "08", aug: "08",
      september: "09", sep: "09",
      october: "10", oct: "10",
      november: "11", nov: "11",
      december: "12", dec: "12",
    };

    const lowerFilename = filename.toLowerCase();

    // Try to find month name
    for (const [monthName, monthNum] of Object.entries(months)) {
      if (lowerFilename.includes(monthName)) {
        // Try to extract year (e.g., "2025")
        const yearMatch = filename.match(/20\d{2}/);
        const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
        return `${year}-${monthNum}`;
      }
    }

    // Try pattern like "01-2025" or "01_2025"
    const datePattern = /(\d{2})[-_]?(20\d{2})/;
    const match = filename.match(datePattern);
    if (match) {
      return `${match[2]}-${match[1]}`;
    }

    return null;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Handle site change for a file
  const onSiteChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              siteId: e.value,
              siteName: sites.find((s) => s.id === e.value)?.name || "",
            }
          : f
      )
    );
  };

  // Handle report type change
  const onReportTypeChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              reportType: e.value,
              skipRows: e.value === "km/l" ? 8 : 6,
            }
          : f
      )
    );
  };

  // Handle month change
  const onMonthChanged = (e, fileId) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, month: e.target.value } : f))
    );
  };

  // Handle skip rows change
  const onSkipRowsChanged = (e, fileId) => {
    const value = parseInt(e.target.value);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, skipRows: isNaN(value) ? 0 : Math.max(0, value) }
          : f
      )
    );
  };

  // Remove file from list
  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    notify("File removed", "info", 2000);
  };

  // Clear all files
  const handleClearAll = () => {
    setFiles([]);
    notify("All files cleared", "info", 2000);
  };

  // Validate files before import
  const validateFiles = () => {
    const errors = [];

    files.forEach((file, index) => {
      if (!file.siteId) {
        errors.push(`Row ${index + 1}: Site not selected`);
      }
      if (!file.reportType) {
        errors.push(`Row ${index + 1}: Report type not selected`);
      }
      if (file.reportType === "km/l" && !file.siteId) {
        errors.push(`Row ${index + 1}: km/l reports require site selection`);
      }
    });

    return errors;
  };

  // Start batch import
  const handleStartImport = async () => {
    const errors = validateFiles();

    if (errors.length > 0) {
      notify(
        <div>
          <strong>Validation Errors:</strong>
          <ul className="tw-mt-2 tw-pl-4">
            {errors.map((err, i) => (
              <li key={i} className="tw-text-sm">{err}</li>
            ))}
          </ul>
        </div>,
        "error",
        5000
      );
      return;
    }

    if (files.length === 0) {
      notify("No files to import", "warning", 3000);
      return;
    }

    setLoading(true);

    // Track results for summary
    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      setProcessingIndex(i);

      // Update status to processing
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i
            ? {
                ...f,
                status: "Processing",
                statusIcon: "fa-light fa-spinner fa-spin",
                statusColor: "tw-text-blue-500",
              }
            : f
        )
      );

      try {
        // Call the import callback with file data and duplicate handling setting
        const result = await onBatchImport({
          ...files[i],
          duplicateHandling: duplicateHandling
        });

        // Track success
        successCount++;
        results.push({ fileName: files[i].fileName, success: true, result });

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "Success",
                  statusIcon: "fa-light fa-check-circle",
                  statusColor: "tw-text-green-500",
                }
              : f
          )
        );
      } catch (error) {
        console.error(`Error importing file ${files[i].fileName}:`, error);

        // Track failure
        failedCount++;
        results.push({ fileName: files[i].fileName, success: false, error: error.message });

        // Update status to failed with full error details
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "Failed",
                  statusIcon: "fa-light fa-exclamation-circle",
                  statusColor: "tw-text-red-500",
                  error: error.message || "Import failed",
                  errorDetails: {
                    message: error.message || "Import failed",
                    siteName: error.siteName || f.siteName || "Unknown Site",
                    duplicates: error.duplicates || [],
                    skippedCount: error.skippedCount || 0
                  }
                }
              : f
          )
        );
      }
    }

    setLoading(false);
    setProcessingIndex(-1);

    // Show summary notification
    const totalFiles = files.length;
    let summaryMessage = `Batch import completed: `;
    let summaryType = "success";

    if (failedCount === 0) {
      summaryMessage += `All ${successCount} file(s) imported successfully!`;
      summaryType = "success";
    } else if (successCount === 0) {
      summaryMessage += `All ${failedCount} file(s) failed to import.`;
      summaryType = "error";
    } else {
      summaryMessage += `${successCount} succeeded, ${failedCount} failed out of ${totalFiles} file(s).`;
      summaryType = "warning";
    }

    notify(summaryMessage, summaryType, 5000);
  };

  // Custom cell render for site
  const siteCellRender = (data) => {
    return (
      <SelectBox
        dataSource={sites}
        displayExpr="name"
        valueExpr="id"
        value={data.value}
        onValueChanged={(e) => onSiteChanged(e, data.data.id)}
        placeholder="Select site..."
        showClearButton={false}
        disabled={loading}
      />
    );
  };

  // Custom cell render for report type
  const reportTypeCellRender = (data) => {
    return (
      <SelectBox
        dataSource={reportTypes}
        displayExpr="name"
        valueExpr="value"
        value={data.value}
        onValueChanged={(e) => onReportTypeChanged(e, data.data.id)}
        placeholder="Select type..."
        disabled={loading}
      />
    );
  };

  // Custom cell render for month
  const monthCellRender = (data) => {
    return (
      <input
        type="month"
        value={data.value || ""}
        onChange={(e) => onMonthChanged(e, data.data.id)}
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1"
        disabled={loading}
      />
    );
  };

  // Custom cell render for skip rows
  const skipRowsCellRender = (data) => {
    return (
      <input
        type="number"
        value={data.value}
        onChange={(e) => onSkipRowsChanged(e, data.data.id)}
        min="0"
        className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1"
        disabled={loading}
      />
    );
  };

  // Custom cell render for status
  const statusCellRender = (data) => {
    const hasError = data.data.status === "Failed" && data.data.error;

    return (
      <div className="tw-flex tw-flex-col tw-gap-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className={`${data.data.statusIcon} ${data.data.statusColor}`}></i>
          <span className={data.data.statusColor}>{data.value}</span>
        </div>
        {hasError && (
          <div className="tw-text-xs tw-text-red-600 tw-mt-1 tw-p-2 tw-bg-red-50 tw-rounded tw-border tw-border-red-200">
            <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
            {data.data.error}
          </div>
        )}
      </div>
    );
  };

  // Handle preview file
  const handlePreviewFile = async (fileData) => {
    try {
      // Clear previous preview data
      setPreviewData(null);
      setPreviewFileName(fileData.fileName);
      setPreviewVisible(true);

      // Read and parse the Excel file
      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Parse Excel data with appropriate options
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: fileData.skipRows || 8,
            raw: false,
            defval: "",
          });

          console.log(`[Preview] Parsed ${jsonData.length} rows from ${fileData.fileName}`);
          console.log(`[Preview] First row sample:`, jsonData[0]);
          console.log(`[Preview] Report Type: ${fileData.reportType}`);

          // Helper function to ensure all values are primitives (not objects)
          const ensureString = (value) => {
            if (value === null || value === undefined) return "";
            if (typeof value === 'string') return value;
            if (typeof value === 'number') return value;
            if (typeof value === 'boolean') return value;
            // Convert any object (including Date) to string
            return String(value);
          };

          // Parse and format date - ensure it's ALWAYS a string or null
          const parseDate = (dateValue) => {
            if (!dateValue) return null;
            // If it's a Date object from XLSX, format it to YYYY-MM-DD string
            if (dateValue instanceof Date) {
              return dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
              // Already a string, keep as is
              return dateValue.trim();
            } else {
              // Fallback: convert to string
              return String(dateValue);
            }
          };

          // Map to format expected by DataPreview based on report type
          const mappedData = jsonData.map((row, index) => {
            // Common fields for both types
            const vehicleName = row["Vehicle Name"] || row["Vehicle"] || row["VEHICLE"] || "";
            const vehicle = vehicles.find(
              (v) => v.hyoungNo?.toLowerCase() === vehicleName.toLowerCase()
            );
            const site = sites.find((s) => s.id === fileData.siteId);
            const dateValue = parseDate(row["Date"] || row["DATE"]);

            // Map based on report type
            if (fileData.reportType === "l/hr") {
              // l/hr specific mapping
              return {
                _rowIndex: index,
                vehicleName: ensureString(vehicleName),
                vehicleId: vehicle?.vehicleId || null,
                driverName: ensureString(row["Driver"] || row["Driver Name"] || row["DRIVER"] || ""),
                date: dateValue,
                locationName: ensureString(site?.name || fileData.siteName || ""),
                locationId: fileData.siteId || null,
                engHours: parseFloat(row["Working Hrs"] || row["Runtime Eng hrs"] || row["Engine Hours"] || 0) || 0,
                totalFuel: parseFloat(row["Total fuel"] || row["Total Fuel"] || row["Fuel"] || 0) || 0,
                fuelEfficiency: parseFloat(row["Fuel Eff (l/hr)"] || row["Ltr/Hr"] || row["Fuel Efficiency"] || 0) || 0,
                workingExpectedAverage: parseFloat(row["Expected Fuel Eff"] || row["Expected Average"] || 0) || 0,
                fuelLost: parseFloat(row["Fuel lost"] || row["Fuel Lost"] || 0) || 0,
                flowMeterEngineHrs: parseFloat(row["Flow meter Eng Hrs"] || row["Flow Meter Engine Hrs"] || 0) || 0,
                flowMeterFuelUsed: parseFloat(row["Flow meter Total fuel"] || row["Flow Meter Fuel Used"] || 0) || 0,
                flowMeterEffiency: parseFloat(row["Flow meter Fuel eff"] || row["Flow Meter Efficiency"] || 0) || 0,
                flowMeterFuelLost: parseFloat(row["Flow meter Fuel lost"] || row["Flow Meter Fuel Lost"] || 0) || 0,
                excessWorkingHrsCost: parseFloat(row["Excessive Hours (10)"] || row["Excess Working Hrs Cost"] || 0) || 0,
                isNightShift: (row["Shift"]?.toLowerCase() || row["Comments"]?.toLowerCase() || "").includes("night"),
                comment: ensureString(row["Comments"] || row["Comment"] || row["COMMENT"] || ""),
                totalDistance: 0,
                maxSpeed: 0,
                avgSpeed: 0,
              };
            } else {
              // km/l specific mapping
              return {
                _rowIndex: index,
                vehicleName: ensureString(vehicleName),
                vehicleId: vehicle?.vehicleId || null,
                driverName: ensureString(row["Driver"] || row["DRIVER"] || ""),
                date: dateValue,
                locationName: ensureString(site?.name || fileData.siteName || ""),
                locationId: fileData.siteId || null,
                totalDistance: parseFloat(row["Total Distance"] || row["TOTAL DISTANCE"] || row["Km Covered"] || 0) || 0,
                totalFuel: parseFloat(row["Total Fuel"] || row["TOTAL FUEL"] || row["Fuel"] || 0) || 0,
                maxSpeed: parseFloat(row["Max Speed"] || row["MAX SPEED"] || 0) || 0,
                avgSpeed: parseFloat(row["Avg Speed"] || row["AVG SPEED"] || 0) || 0,
                engineHours: parseFloat(row["Engine Hours"] || row["ENGINE HOURS"] || 0) || 0,
                flowMeterEngineHrs: parseFloat(row["Flow Meter Engine Hrs"] || 0) || 0,
                flowMeterFuelUsed: parseFloat(row["Flow Meter Fuel Used"] || 0) || 0,
                flowMeterEffiency: parseFloat(row["Flow Meter Effiency"] || 0) || 0,
                flowMeterFuelLost: parseFloat(row["Flow Meter Fuel Lost"] || 0) || 0,
                excessWorkingHrsCost: parseFloat(row["Excess Working Hrs Cost"] || 0) || 0,
                isNightShift: (row["Shift"]?.toLowerCase() || "").includes("night") || row["Is Night Shift"] === "Yes",
                fuelEfficiency: parseFloat(row["Fuel Efficiency"] || row["Km/ Litre"] || 0) || 0,
                workingExpectedAverage: parseFloat(row["Working Expected Average"] || 0) || 0,
                fuelLost: parseFloat(row["Fuel Lost"] || 0) || 0,
                comment: ensureString(row["Comment"] || row["COMMENT"] || ""),
                engHours: 0,
              };
            }
          });

          console.log(`[Preview] Mapped ${mappedData.length} rows. First mapped row:`, mappedData[0]);

          // Check for any Date objects in the mapped data
          if (mappedData[0]) {
            Object.keys(mappedData[0]).forEach(key => {
              const value = mappedData[0][key];
              if (value instanceof Date) {
                console.error(`[Preview] WARNING: Found Date object in field '${key}':`, value);
              }
            });
          }

          setPreviewData(mappedData);
        } catch (error) {
          console.error(`[Preview] Error parsing file:`, error);
          notify(`Failed to parse file: ${error.message}`, "error", 5000);
          setPreviewVisible(false);
        }
      };

      fileReader.onerror = () => {
        notify("Failed to read file", "error", 3000);
        setPreviewVisible(false);
      };

      fileReader.readAsArrayBuffer(fileData.file);
    } catch (error) {
      console.error(`[Preview] Error reading file:`, error);
      notify(`Failed to preview file: ${error.message}`, "error", 5000);
    }
  };

  // Custom cell render for actions
  const actionsCellRender = (data) => {
    const hasError = data.data.status === "Failed" && data.data.error;

    return (
      <div className="tw-flex tw-gap-1">
        {hasError && (
          <Button
            icon="info"
            onClick={() => {
              setSelectedFileError({
                fileName: data.data.fileName,
                error: data.data.error,
                siteName: data.data.siteName
              });
              setErrorDetailsVisible(true);
            }}
            disabled={loading}
            stylingMode="text"
            type="danger"
            hint="View error details"
          />
        )}
        <Button
          icon="search"
          onClick={() => handlePreviewFile(data.data)}
          disabled={loading}
          stylingMode="text"
          type="default"
          hint="Preview file data"
        />
        <Button
          icon="trash"
          onClick={() => handleRemoveFile(data.data.id)}
          disabled={loading}
          stylingMode="text"
          type="danger"
          hint="Remove file"
        />
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={true}
      title="Batch Import - Multiple Files"
      showCloseButton={true}
      width="95%"
      height="90%"
      className="batch-import-popup"
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        {/* Header Actions */}
        <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center tw-flex-shrink-0">
          <div className="tw-flex tw-gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              multiple
              onChange={handleFileSelect}
              className="tw-hidden"
              id="batch-file-input"
            />
            <Button
              text="Add Files"
              icon="plus"
              type="default"
              stylingMode="contained"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            />
            <Button
              text="Clear All"
              icon="clear"
              type="normal"
              stylingMode="outlined"
              onClick={handleClearAll}
              disabled={loading || files.length === 0}
            />
          </div>

          <div className="tw-flex tw-gap-3">
            <div className="tw-text-sm tw-text-gray-600 tw-flex tw-items-center">
              <i className="fa-light fa-files tw-mr-2"></i>
              {files.length} file(s) ready
            </div>
            <Button
              text="Start Import"
              icon="upload"
              type="success"
              stylingMode="contained"
              onClick={handleStartImport}
              disabled={loading || files.length === 0}
            />
          </div>
        </div>

        {/* Files Grid */}
        <div className="tw-flex-1 tw-overflow-hidden">
          <LoadPanel visible={loading} />
          <DataGrid
            ref={gridRef}
            dataSource={files}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            height="100%"
          >
            <Paging enabled={true} defaultPageSize={20} />
            <Pager
              visible={true}
              showPageSizeSelector={true}
              allowedPageSizes={[10, 20, 50, 100]}
              showInfo={true}
            />

            <Column
              dataField="fileName"
              caption="File Name"
              width={250}
              allowEditing={false}
            />

            <Column
              dataField="fileSize"
              caption="Size"
              width={80}
              allowEditing={false}
              alignment="right"
            />

            <Column
              dataField="siteId"
              caption="Site"
              width={200}
              cellRender={siteCellRender}
            />

            <Column
              dataField="reportType"
              caption="Report Type"
              width={120}
              cellRender={reportTypeCellRender}
            />

            <Column
              dataField="month"
              caption="Month"
              width={150}
              cellRender={monthCellRender}
            />

            <Column
              dataField="skipRows"
              caption="Skip Rows"
              width={100}
              cellRender={skipRowsCellRender}
              alignment="center"
            />

            <Column
              dataField="status"
              caption="Status"
              width={300}
              cellRender={statusCellRender}
              allowEditing={false}
            />

            <Column
              caption="Actions"
              width={120}
              cellRender={actionsCellRender}
              allowEditing={false}
              alignment="center"
            />
          </DataGrid>
        </div>

        {/* Import Settings */}
        <div className="tw-mt-4 tw-p-4 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 tw-flex-shrink-0">
          <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-cog tw-mr-2"></i>
            Import Settings
          </h4>
          <div className="tw-mb-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Duplicate Record Handling:
            </label>
            <div className="tw-flex tw-flex-col tw-gap-2">
              <label className="tw-flex tw-items-center tw-cursor-pointer">
                <input
                  type="radio"
                  name="duplicateHandling"
                  value="fail"
                  checked={duplicateHandling === "fail"}
                  onChange={(e) => setDuplicateHandling(e.target.value)}
                  className="tw-mr-2"
                  disabled={loading}
                />
                <span className="tw-text-sm tw-text-gray-700">
                  Stop on duplicates (default)
                </span>
              </label>
              <label className="tw-flex tw-items-center tw-cursor-pointer">
                <input
                  type="radio"
                  name="duplicateHandling"
                  value="skip"
                  checked={duplicateHandling === "skip"}
                  onChange={(e) => setDuplicateHandling(e.target.value)}
                  className="tw-mr-2"
                  disabled={loading}
                />
                <span className="tw-text-sm tw-text-gray-700">
                  Skip duplicate records (continue import for non-duplicates)
                </span>
              </label>
              <label className="tw-flex tw-items-center tw-cursor-pointer">
                <input
                  type="radio"
                  name="duplicateHandling"
                  value="overwrite"
                  checked={duplicateHandling === "overwrite"}
                  onChange={(e) => setDuplicateHandling(e.target.value)}
                  className="tw-mr-2"
                  disabled={loading}
                />
                <span className="tw-text-sm tw-text-gray-700">
                  Overwrite existing records (replace duplicates)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Import Instructions */}
        <div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-rounded tw-border tw-border-blue-200 tw-flex-shrink-0">
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
            <h4 className="tw-font-semibold tw-text-blue-800 tw-m-0">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Batch Import Instructions
            </h4>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-blue-800 hover:tw-text-blue-600 tw-cursor-pointer tw-transition-colors"
              title={showInstructions ? "Hide instructions" : "Show instructions"}
            >
              <i className={`fa-light ${showInstructions ? 'fa-times' : 'fa-question-circle'} tw-text-lg`}></i>
            </button>
          </div>
          {showInstructions && (
            <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1 tw-mb-0">
              <li>• Click "Add Files" to select multiple Excel files (.xlsx)</li>
              <li>• Site will be auto-detected from filename if possible</li>
              <li>• Month will be auto-detected from filename patterns (e.g., "Jan2025", "01-2025")</li>
              <li>• Review and adjust Site, Report Type, Month, and Skip Rows for each file</li>
              <li>• Select duplicate handling strategy above</li>
              <li>• Click "Start Import" to process all files sequentially</li>
              <li>• Each file will be imported one at a time with progress tracking</li>
            </ul>
          )}
        </div>
      </div>

      {/* Preview Popup */}
      <Popup
        visible={previewVisible}
        onHiding={() => {
          setPreviewVisible(false);
          setPreviewData(null);
          setPreviewFileName("");
        }}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title={`Preview: ${previewFileName}`}
        showCloseButton={true}
        width="95%"
        height="90%"
        className="batch-preview-popup"
      >
        <div className="tw-h-full tw-overflow-auto">
          {previewData ? (
            <DataPreview
              filteredData={previewData}
              dataGridRef={previewGridRef}
              parsedData={previewData}
              reportType={files.find(f => f.fileName === previewFileName)?.reportType || "km/l"}
              selectedRowKeys={[]}
              onSelectionChanged={() => {}}
              onRowPrepared={() => {}}
              handleGridInitialized={() => {}}
              pageSize={20}
              pageSizes={[10, 20, 50, 100]}
              onPageChanged={() => {}}
              onPageSizeChanged={() => {}}
              onCellClick={() => {}}
              onEditorPreparing={() => {}}
              onRowUpdated={() => {}}
              cellRender={(cellData) => {
                // Ensure we never try to render Date objects
                let displayValue = cellData.value;

                // Handle null/undefined
                if (displayValue === null || displayValue === undefined) {
                  return <span></span>;
                }

                // Convert Date objects to strings
                if (displayValue instanceof Date) {
                  displayValue = displayValue.toISOString().split('T')[0];
                }

                // Handle objects that aren't React elements
                if (typeof displayValue === 'object' && !React.isValidElement(displayValue)) {
                  displayValue = String(displayValue);
                }

                return <span>{displayValue}</span>;
              }}
              showValidationErrors={false}
              handleToggleValidationFilter={() => {}}
              showDuplicateErrors={false}
              handleToggleDuplicateFilter={() => {}}
              filterErrorsOnly={false}
              setFilterErrorsOnly={() => {}}
              selectedRows={[]}
              clearSelections={() => {}}
              countSelectedRowsErrors={() => 0}
              validationErrors={[]}
              getFilteredData={() => previewData}
              selectValidRowsOnly={() => {}}
              vehicles={vehicles}
              sites={sites}
            />
          ) : (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-full">
              <LoadPanel visible={true} />
            </div>
          )}
        </div>
      </Popup>

      {/* Error Details Popup */}
      <Popup
        visible={errorDetailsVisible}
        onHiding={() => {
          setErrorDetailsVisible(false);
          setSelectedFileError(null);
        }}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Import Error Details"
        showCloseButton={true}
        width={600}
        height="auto"
        className="error-details-popup"
      >
        {selectedFileError && (
          <div className="tw-p-4">
            <div className="tw-mb-4 tw-pb-3 tw-border-b tw-border-gray-200">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-file-excel tw-text-2xl tw-text-red-500 tw-mt-1"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-1">
                    {selectedFileError.fileName}
                  </h4>
                  <div className="tw-text-sm tw-text-gray-600">
                    <i className="fa-light fa-location-dot tw-mr-1"></i>
                    Site: {selectedFileError.errorDetails?.siteName || selectedFileError.siteName}
                  </div>
                </div>
              </div>
            </div>

            <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4 tw-mb-4">
              <div className="tw-flex tw-items-start tw-gap-2">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-text-lg tw-mt-0.5"></i>
                <div className="tw-flex-1">
                  <h5 className="tw-font-semibold tw-text-red-800 tw-mb-2">Error Message</h5>
                  <p className="tw-text-sm tw-text-red-700 tw-whitespace-pre-wrap tw-mb-0">
                    {selectedFileError.errorDetails?.message || selectedFileError.error}
                  </p>
                </div>
              </div>
            </div>

            {/* Show duplicate records if they exist */}
            {selectedFileError.errorDetails?.duplicates && selectedFileError.errorDetails.duplicates.length > 0 && (
              <div className="tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-4 tw-mb-4">
                <h5 className="tw-font-semibold tw-text-yellow-800 tw-mb-3">
                  <i className="fa-light fa-copy tw-mr-2"></i>
                  Duplicate Records ({selectedFileError.errorDetails.skippedCount || selectedFileError.errorDetails.duplicates.length})
                </h5>
                <div className="tw-max-h-60 tw-overflow-y-auto">
                  <table className="tw-w-full tw-text-sm">
                    <thead className="tw-bg-yellow-100 tw-sticky tw-top-0">
                      <tr>
                        <th className="tw-text-left tw-p-2 tw-font-semibold tw-text-yellow-900">Vehicle</th>
                        <th className="tw-text-left tw-p-2 tw-font-semibold tw-text-yellow-900">Date</th>
                        <th className="tw-text-left tw-p-2 tw-font-semibold tw-text-yellow-900">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFileError.errorDetails.duplicates.slice(0, 10).map((dup, idx) => {
                        const date = new Date(dup.date).toLocaleDateString('en-GB');
                        const shift = dup.isNightShift ? "Night" : "Day";
                        return (
                          <tr key={idx} className="tw-border-b tw-border-yellow-200">
                            <td className="tw-p-2 tw-text-yellow-900">{dup.vehicleName}</td>
                            <td className="tw-p-2 tw-text-yellow-900">{date}</td>
                            <td className="tw-p-2 tw-text-yellow-900">{shift}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {selectedFileError.errorDetails.duplicates.length > 10 && (
                    <div className="tw-text-center tw-text-xs tw-text-yellow-700 tw-mt-2">
                      ...and {selectedFileError.errorDetails.duplicates.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="tw-pt-3 tw-border-t tw-border-gray-200">
              <h5 className="tw-font-semibold tw-text-gray-800 tw-mb-2">
                <i className="fa-light fa-lightbulb tw-mr-2 tw-text-yellow-600"></i>
                Troubleshooting Tips
              </h5>
              <ul className="tw-text-sm tw-text-gray-700 tw-space-y-2 tw-mb-0">
                {(selectedFileError.error?.includes("duplicate") || selectedFileError.errorDetails?.duplicates?.length > 0) && (
                  <>
                    <li className="tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                      <span>Use "Skip duplicates" mode to import non-duplicate records</span>
                    </li>
                    <li className="tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                      <span>Use "Overwrite" mode to replace existing records</span>
                    </li>
                  </>
                )}
                {selectedFileError.error?.includes("unmatched vehicle") && (
                  <>
                    <li className="tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                      <span>Check that vehicle names in Excel match exactly with system records</span>
                    </li>
                    <li className="tw-flex tw-items-start tw-gap-2">
                      <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                      <span>Use the preview feature to verify vehicle names before importing</span>
                    </li>
                  </>
                )}
                {selectedFileError.error?.includes("missing dates") && (
                  <li className="tw-flex tw-items-start tw-gap-2">
                    <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                    <span>Ensure all rows have valid dates in the Date column</span>
                  </li>
                )}
                <li className="tw-flex tw-items-start tw-gap-2">
                  <i className="fa-light fa-check tw-text-green-600 tw-mt-1"></i>
                  <span>Click "Preview" to review the file data before importing</span>
                </li>
              </ul>
            </div>

            <div className="tw-mt-4 tw-flex tw-justify-end">
              <Button
                text="Close"
                type="normal"
                stylingMode="contained"
                onClick={() => {
                  setErrorDetailsVisible(false);
                  setSelectedFileError(null);
                }}
              />
            </div>
          </div>
        )}
      </Popup>
    </Popup>
  );
};

export default BatchImportPopup;
