/**
 * File: useImporterState.js
 * Purpose: Centralized state management for FuelReportImporter
 * Extracted from: FuelReportImporter.js
 */

import { useState, useRef } from "react";

/**
 * Hook containing all state declarations for the Fuel Report Importer
 * Organized by category for easier maintenance
 */
const useImporterState = () => {
  // ===== File and Import Settings =====
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

  // ===== Data and Validation =====
  const [parsedData, setParsedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [validationErrors, setValidationErrors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  // ===== Toast/Notification UI State =====
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  // ===== Selection State =====
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // ===== Preview State =====
  const [previewedOnce, setPreviewedOnce] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // ===== Dialog/Popup Visibility =====
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showPopover, setShowPopover] = useState(null);
  const [showDuplicateErrors, setShowDuplicateErrors] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // ===== Pagination State =====
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizes] = useState([20, 35, 50, 100, "all"]);

  // ===== Import Result State =====
  const [importSuccessInfo, setImportSuccessInfo] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // ===== Filter State =====
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [hideLoadingPanel, setHideLoadingPanel] = useState(false);
  const [hideProgressPanel, setHideProgressPanel] = useState(false);

  // ===== Row Tracking State =====
  // Track rows that have been fixed/edited (rowIndex -> fixed status)
  const [fixedRows, setFixedRows] = useState(new Set());

  // ===== Refs =====
  const dataGridRef = useRef(null);
  const fileInputRef = useRef(null);
  // Ref to store submitted data mapping for error handling
  const submittedDataMapRef = useRef({});

  return {
    // File and Import Settings
    selectedSite,
    setSelectedSite,
    reportType,
    setReportType,
    file,
    setFile,
    fileName,
    setFileName,
    skipRows,
    setSkipRows,
    clearAfterImport,
    setClearAfterImport,
    duplicateHandling,
    setDuplicateHandling,
    detectedSite,
    setDetectedSite,
    showSiteConfirmation,
    setShowSiteConfirmation,
    siteSelectionMode,
    setSiteSelectionMode,

    // Data and Validation
    parsedData,
    setParsedData,
    filteredData,
    setFilteredData,
    selectedDate,
    setSelectedDate,
    dateRange,
    setDateRange,
    validationErrors,
    setValidationErrors,
    availableDates,
    setAvailableDates,

    // Toast/Notification UI State
    toastVisible,
    setToastVisible,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,

    // Selection State
    selectedRows,
    setSelectedRows,
    selectedRowKeys,
    setSelectedRowKeys,

    // Preview State
    previewedOnce,
    setPreviewedOnce,
    previewData,
    setPreviewData,

    // Dialog/Popup Visibility
    showImportConfirmation,
    setShowImportConfirmation,
    showValidationErrors,
    setShowValidationErrors,
    showPopover,
    setShowPopover,
    showDuplicateErrors,
    setShowDuplicateErrors,
    showCalendarPopup,
    setShowCalendarPopup,
    showResultDialog,
    setShowResultDialog,

    // Pagination State
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,

    // Import Result State
    importSuccessInfo,
    setImportSuccessInfo,
    importResult,
    setImportResult,

    // Filter State
    filterErrorsOnly,
    setFilterErrorsOnly,
    hideLoadingPanel,
    setHideLoadingPanel,
    hideProgressPanel,
    setHideProgressPanel,

    // Row Tracking State
    fixedRows,
    setFixedRows,

    // Refs
    dataGridRef,
    fileInputRef,
    submittedDataMapRef,
  };
};

export default useImporterState;
