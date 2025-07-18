import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Card } from "react-bootstrap";
import ScrollView from "devextreme-react/scroll-view";
import { Toast } from "devextreme-react/toast";
import { Popup } from "devextreme-react/popup";

// Components
import ImportForm from "./components/ImportForm";
import ImportConfirmation from "./components/ImportConfirmation";
import ImportProgress from "./components/ImportProgress";
import SuccessAlert from "./components/SuccessAlert";
import ValidationAlerts from "./components/ValidationAlerts";
import DataPreview from "./components/DataPreview";
import SiteConfirmation from "./components/SiteConfirmation";

// Hooks and Utilities
import useImportUtils from "./hooks/useImportUtils";
import useDataProcessing from "./hooks/useDataProcessing";
import useValidation from "./hooks/useValidation";
import useToastMessages from "./hooks/useToastMessages";

// Redux Actions
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import { showNotification } from "../../redux/actions/notificationActions"; //Cursor
import {
  uploadFuelReport,
  clearFuelReportStatus,
  setupFuelImportProgressListener,
  removeFuelImportProgressListener,
  retryFuelReportWithOverwrite,
  retryFuelReportExcludingDuplicates,
  resetImportProgress,
} from "../../redux/actions/fuelReportActions";
import { safeResetAllNotifications } from "../../redux/actions/notificationActions";

import "./FuelReportImporter.css";

const reportTypes = [
  { value: "km/l", name: "km/l" },
  { value: "l/hr", name: "l/hr" },
];

const FuelReportImporter = () => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const {
    loading: fuelReportLoading,
    error: fuelReportError,
    success: fuelReportSuccess,
    reportId: uploadedReportId,
    importProgress,
  } = useSelector((state) => state.fuelReport);

  // State for file and import settings
  const [selectedSite, setSelectedSite] = useState("");
  const [reportType, setReportType] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [skipRows, setSkipRows] = useState(0);
  const [clearAfterImport, setClearAfterImport] = useState(false);
  const [duplicateHandling, setDuplicateHandling] = useState("fail");
  const [detectedSite, setDetectedSite] = useState(null);
  const [showSiteConfirmation, setShowSiteConfirmation] = useState(false);
  const [siteSelectionMode, setSiteSelectionMode] = useState("auto");

  // State for data and validation
  const [parsedData, setParsedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [validationErrors, setValidationErrors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  // UI state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [selectedRows, setSelectedRows] = useState([]);
  const [previewedOnce, setPreviewedOnce] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showPopover, setShowPopover] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizes] = useState([20, 35, 50, 100, "all"]);
  const [showDuplicateErrors, setShowDuplicateErrors] = useState(false);
  const [importSuccessInfo, setImportSuccessInfo] = useState(null);
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [hideLoadingPanel, setHideLoadingPanel] = useState(false);
  const [hideProgressPanel, setHideProgressPanel] = useState(false);

  const dataGridRef = useRef(null);
  const fileInputRef = useRef(null);

  // Import utility hooks
  const {
    showToast,
    handleFileChange,
    handlePreviewData,
    processPreview,
    handleClearPreview,
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
    findVehicleByName,
    findSiteByName,
    setDetectedSiteInfo,
  } = useImportUtils({
    sites,
    vehicles,
    skipRows,
    reportType,
    selectedSite,
    file,
    fileName,
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    validationErrors,
    setValidationErrors,
    setDateRange,
    setPreviewedOnce,
    setFile,
    setFileName,
    setSelectedSite,
    setReportType,
    setToastVisible,
    setToastMessage,
    setToastType,
    setShowImportConfirmation,
    setShowDuplicateErrors,
    setShowValidationErrors,
    fileInputRef,
    dispatch,
    duplicateHandling,
    clearAfterImport,
    fuelReportLoading,
    dataGridRef,
    selectedRowKeys,
    selectedRows,
    setDetectedSite,
    setShowSiteConfirmation,
    siteSelectionMode,
    setSiteSelectionMode,
  });

  // Data processing and validation hook
  const {
    formatDate,
    cleanNumericValue,
    formatNumericValue,
    mapKmLData,
    mapLHrData,
    validateData,
    getFilteredData,
    getImportSummary,
    getSelectedRowsCount,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
  } = useDataProcessing({
    parsedData,
    filteredData,
    selectedSite,
    sites,
    vehicles,
    skipRows,
    validationErrors,
    selectedRowKeys,
    findVehicleByName,
    findSiteByName,
  });

  // Grid related hooks
  const {
    onSelectionChanged,
    onRowPrepared,
    onCellClick,
    onEditorPreparing,
    onRowUpdated,
    cellRender,
    onPageChanged,
    onPageSizeChanged,
    clearSelections,
    onFilterValueChanged,
    handleToggleValidationFilter,
    handleToggleDuplicateFilter,
    selectValidRowsOnly,
    handleGridInitialized,
  } = useValidation({
    dataGridRef,
    parsedData,
    validationErrors,
    setSelectedRowKeys,
    setSelectedRows,
    selectedRowKeys,
    setCurrentPage,
    setPageSize,
    setShowValidationErrors,
    setFilterErrorsOnly,
    setShowDuplicateErrors,
    setValidationErrors,
    setParsedData,
    showValidationErrors,
    showDuplicateErrors,
    filterErrorsOnly,
    vehicles,
    sites,
    reportType,
    filteredData,
    setShowPopover,
  });

  // Initialize data & set up listeners
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchVehicleList());

    // Set up the SignalR listener for import progress
    dispatch(setupFuelImportProgressListener());

    // Show a message that import progress is now displayed in the global notification center
    showToast(
      "Import progress updates are now displayed in the notification center at the top-right of the screen.",
      "info"
    );

    return () => {
      dispatch(clearFuelReportStatus());
      dispatch(removeFuelImportProgressListener());
    };
  }, [dispatch]);

  // Handle error state changes
  useEffect(() => {
    if (fuelReportError) {
      if (Array.isArray(fuelReportError)) {
        setValidationErrors(fuelReportError);
        showToast(
          `Import failed due to ${fuelReportError.length} validation issues. Please review the grid.`,
          "error"
        );
      } else if (
        typeof fuelReportError === "object" &&
        fuelReportError.validationErrors
      ) {
        // Handle FMSResponse format with validationErrors array
        const errorArray = Array.isArray(fuelReportError.validationErrors)
          ? fuelReportError.validationErrors
          : [fuelReportError.validationErrors];

        // Convert simple string errors to properly formatted validation errors
        const formattedErrors = errorArray.map((err, index) => {
          if (typeof err === "string") {
            // Extract row number if present in the error message (e.g., "Row 1: Vehicle ID is missing")
            const rowMatch = err.match(/Row (\d+):/);
            const rowIndex = rowMatch ? parseInt(rowMatch[1]) - 1 : index;

            return {
              rowIndex: rowIndex,
              field: "vehicleName", // Default to vehicleName as a general field
              message: err,
            };
          }
          return err;
        });

        setValidationErrors(formattedErrors);
        showToast(
          `Import failed: ${fuelReportError.message || "Validation failed"}`,
          "error"
        );
        setShowValidationErrors(true);
      } else if (fuelReportError.duplicateErrors) {
        // Handle duplicate errors specifically
        const duplicateErrors = fuelReportError.duplicateErrors;

        // Format duplicate errors for validation display
        const formattedDuplicates = duplicateErrors.map((duplicate) => ({
          rowIndex: duplicate.rowIndex !== undefined ? duplicate.rowIndex : -1,
          field: "vehicleName",
          message: duplicate.message || `Duplicate record found for vehicle`,
          isDuplicate: true,
          vehicleId: duplicate.vehicleId,
          date: duplicate.date,
          isNightShift: duplicate.isNightShift,
        }));

        setValidationErrors(formattedDuplicates);
        showToast(
          `Import failed: ${
            fuelReportError.message || "Duplicate records found"
          }`,
          "error"
        );
        setShowDuplicateErrors(true);
        setShowValidationErrors(true);
      } else {
        // Display the error message directly
        const errorMessage =
          typeof fuelReportError === "object"
            ? fuelReportError.message || "An unknown error occurred"
            : fuelReportError;

        showToast(errorMessage, "error");

        // Check if the response contains validation errors in another format
        if (typeof fuelReportError === "object" && fuelReportError.errors) {
          setValidationErrors(fuelReportError.errors);
          setShowValidationErrors(true);
        } else {
          setValidationErrors([]);
        }
      }
    }
  }, [fuelReportError]);

  // Handle duplicate errors highlighting
  useEffect(() => {
    // Get all duplicate errors from validationErrors
    const duplicateErrors = validationErrors.filter((err) => err.isDuplicate);

    if (duplicateErrors && duplicateErrors.length > 0 && showDuplicateErrors) {
      // Apply styling to the grid to highlight duplicates
      if (dataGridRef.current) {
        setTimeout(() => {
          if (dataGridRef.current?.instance) {
            dataGridRef.current.instance.refresh();
          }
        }, 100);
      }
    }
  }, [validationErrors, showDuplicateErrors]);

  // Handle successful import
  useEffect(() => {
    if (fuelReportSuccess && uploadedReportId) {
      // Store success information
      setImportSuccessInfo({
        reportId: uploadedReportId,
        message: fuelReportSuccess.message || `Successfully imported data.`,
        consumptions: fuelReportSuccess.consumptions || [],
      });

      if (clearAfterImport) {
        handleClearPreview();
        setFile(null);
        setFileName("");
        setSelectedSite("");
        setReportType("");
        setPreviewedOnce(false);
      }

      // Ensure loading indicator is cleared
      dispatch(clearFuelReportStatus());
    }
  }, [fuelReportSuccess, uploadedReportId, dispatch, clearAfterImport]);

  // Handle import progress completion
  useEffect(() => {
    if (
      importProgress &&
      (importProgress.status === "Completed" ||
        importProgress.status.includes("Failed"))
    ) {
      // After a brief delay to allow user to see final status,
      // ensure loading indicator is cleared if it's still showing
      const timer = setTimeout(() => {
        if (fuelReportLoading) {
          dispatch(clearFuelReportStatus());
        }
      }, 1500); // Short delay to show completion status

      return () => clearTimeout(timer);
    }
  }, [importProgress, fuelReportLoading, dispatch]);

  // Set default skip rows based on report type
  useEffect(() => {
    if (reportType === "km/l") {
      setSkipRows(8);
    } else if (reportType === "l/hr") {
      setSkipRows(6);
      setSelectedSite("");
    } else {
      setSkipRows(null);
    }
  }, [reportType]);

  // Filter data based on date range and validation errors
  useEffect(() => {
    if (parsedData.length > 0) {
      let filtered = [...parsedData];

      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((row) => {
          if (!row.date) return false;
          const rowDate = new Date(row.date);
          return !isNaN(rowDate) && rowDate >= startDate;
        });
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((row) => {
          if (!row.date) return false;
          const rowDate = new Date(row.date);
          return !isNaN(rowDate) && rowDate <= endDate;
        });
      }

      if (
        showValidationErrors &&
        validationErrors.length > 0 &&
        filterErrorsOnly
      ) {
        const errorRowIndices = validationErrors.map((err) => err.rowIndex);
        filtered = filtered.filter((row) => {
          const dataRowIndex = parsedData.findIndex(
            (item) => item._rowIndex === row._rowIndex
          );
          return errorRowIndices.includes(dataRowIndex);
        });
      }

      setFilteredData(filtered);

      if (availableDates.length === 0) {
        const dates = parsedData
          .map((row) => (row.date ? new Date(row.date) : null))
          .filter((date) => date && !isNaN(date.getTime()));

        if (dates.length > 0) {
          setAvailableDates(dates);
        }
      }
    } else {
      setFilteredData([]);
      setAvailableDates([]);
    }
  }, [
    parsedData,
    dateRange,
    showValidationErrors,
    validationErrors,
    filterErrorsOnly,
  ]);

  // Reset page index when data or validation changes
  useEffect(() => {
    if (dataGridRef.current) {
      dataGridRef.current.instance.pageIndex(0);
      setCurrentPage(0);
    }
  }, [parsedData.length, showValidationErrors]);

  // Reset filter states when data changes
  useEffect(() => {
    // When parsed data changes (new file loaded or preview cleared),
    // reset the filter states to avoid filter initialization errors
    if (parsedData.length === 0) {
      setFilterErrorsOnly(false);
      setShowValidationErrors(false);
      setShowDuplicateErrors(false);
    }
  }, [parsedData]); //Cursor

  // Reset panel visibility when import starts
  useEffect(() => {
    if (fuelReportLoading) {
      setHideLoadingPanel(false);
      setHideProgressPanel(false);
    }
  }, [fuelReportLoading]);

  // Refresh grid when filters change
  useEffect(() => {
    // When filter states change, refresh the grid
    if (dataGridRef.current?.instance) {
      setTimeout(() => {
        try {
          dataGridRef.current.instance.refresh();

          // Reset to page 1 when filters change
          dataGridRef.current.instance.pageIndex(0);
          setCurrentPage(0);

          // Clear any existing selection
          if (showValidationErrors || filterErrorsOnly || showDuplicateErrors) {
            clearSelections();
          }
        } catch (err) {
          console.error("Error refreshing grid:", err);
        }
      }, 100);
    }
  }, [showValidationErrors, filterErrorsOnly, showDuplicateErrors]);

  // Handle site confirmation
  const handleSiteConfirmation = () => {
    setShowSiteConfirmation(false);
    // If a site was selected, proceed with preview
    if (selectedSite) {
      handlePreviewData();
    }
  };

  return (
    <ScrollView className="view-wrapper-scroll">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        displayTime={
          toastType === "error" || toastType === "warning" ? 6000 : 3000
        }
        onHiding={() => setToastVisible(false)}
        position={{ my: "top right", at: "top right", offset: "-10 10" }}
        width={400}
        height="auto"
        minHeight={50}
        contentComponent={(props) => {
          const { message } = props;
          return typeof message === "string" ? <div>{message}</div> : message;
        }}
      />

      <Popup
        visible={showImportConfirmation}
        onHiding={() => setShowImportConfirmation(false)}
        dragEnabled={false}
        showCloseButton
={true}
        showTitle={true}
        title="Confirm Import"
        width={550}
        height="auto"
        className="tw-bg-white tw-shadow-xl tw-rounded-lg"
      >
        <ImportConfirmation
          duplicateHandling={duplicateHandling}
          setDuplicateHandling={setDuplicateHandling}
          clearAfterImport={clearAfterImport}
          setClearAfterImport={setClearAfterImport}
          setShowImportConfirmation={setShowImportConfirmation}
          handleSubmitData={handleSubmitData}
          fuelReportLoading={fuelReportLoading}
        />
      </Popup>

      <Card className="tw-shadow-lg tw-rounded-lg tw-mb-5">
        <Card.Header className="tw-bg-gray-50 tw-p-4 tw-border-b">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-file-import tw-text-xl tw-text-blue-600"></i>
              <h3 className="tw-text-xl tw-font-bold tw-m-0 tw-text-gray-800">
                Fuel Report Importer
              </h3>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="tw-p-6">
          <ImportForm
            reportTypes={reportTypes}
            reportType={reportType}
            setReportType={setReportType}
            selectedSite={selectedSite}
            setSelectedSite={setSelectedSite}
            skipRows={skipRows}
            setSkipRows={setSkipRows}
            fileName={fileName}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleClearPreview={handleClearPreview}
            handlePreviewData={handlePreviewData}
            handlePrepareImport={handlePrepareImport}
            parsedData={parsedData}
            previewedOnce={previewedOnce}
            file={file}
            sites={sites}
            filteredData={filteredData}
            selectedRowsHaveErrors={selectedRowsHaveErrors}
            validationErrors={validationErrors}
            getSelectedRowsCount={getSelectedRowsCount}
            fuelReportLoading={fuelReportLoading}
            setFile={setFile}
            setFileName={setFileName}
            siteSelectionMode={siteSelectionMode}
            setSiteSelectionMode={setSiteSelectionMode}
          />

          {importProgress &&
            importProgress.inProgress &&
            !hideProgressPanel && (
            <ImportProgress
              importProgress={importProgress}
              setHideProgressPanel={setHideProgressPanel}
              handleRetryWithoutDuplicates={handleRetryWithoutDuplicates}
              handleRetryWithOverwrite={handleRetryWithOverwrite}
              fuelReportLoading={fuelReportLoading}
            />
            )}

          {importSuccessInfo && (
            <SuccessAlert
              importSuccessInfo={importSuccessInfo}
              setImportSuccessInfo={setImportSuccessInfo}
            />
          )}

          <ValidationAlerts
            validationErrors={validationErrors}
            fuelReportLoading={fuelReportLoading}
            showDuplicateErrors={showDuplicateErrors}
          />

          {parsedData.length > 0 && (
            <DataPreview
              filteredData={filteredData}
              dataGridRef={dataGridRef}
              parsedData={parsedData}
              reportType={reportType}
              selectedRowKeys={selectedRowKeys}
              onSelectionChanged={onSelectionChanged}
              onRowPrepared={onRowPrepared}
              handleGridInitialized={handleGridInitialized}
              pageSize={pageSize}
              pageSizes={pageSizes}
              onPageChanged={onPageChanged}
              onPageSizeChanged={onPageSizeChanged}
              onCellClick={onCellClick}
              onEditorPreparing={onEditorPreparing}
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
            />
          )}

          {/* Site Confirmation Dialog */}
          <SiteConfirmation
            isVisible={showSiteConfirmation}
            onHide={() => setShowSiteConfirmation(false)}
            detectedSite={detectedSite}
            selectedSite={selectedSite}
            sites={sites}
            onConfirm={handleSiteConfirmation}
            onSiteChange={setSelectedSite}
            setSiteSelectionMode={setSiteSelectionMode}
          />
        </Card.Body>
      </Card>
    </ScrollView>
  );
};

export default FuelReportImporter;
