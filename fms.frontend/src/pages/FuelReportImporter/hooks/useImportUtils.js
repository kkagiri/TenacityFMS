/**
 * File: useImportUtils.js (Refactored)
 * Purpose: Facade hook that composes specialized hooks for import functionality
 * 
 * This hook has been decomposed into smaller, focused hooks:
 * - useFileHandling: File selection and toast messages
 * - useExcelParsing: Excel parsing and data mapping
 * - useDataValidation: Data validation logic
 * - useImportSubmission: Import submission and retry logic
 * 
 * This facade maintains backward compatibility with existing components.
 */

import useFileHandling from "./useFileHandling";
import useExcelParsing from "./useExcelParsing";
import useDataValidation from "./useDataValidation";
import useImportSubmission from "./useImportSubmission";
import { cleanNumericValue, formatDate } from "../utils/formatting";

/**
 * Facade hook that composes all import functionality
 * Maintains backward compatibility with existing component usage
 */
const useImportUtils = ({
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
  setFixedRows,
  submittedDataMapRef,
}) => {
  // Initialize file handling hook
  const {
    showToast,
    handleFileChange,
    handleClearPreview,
    setDetectedSiteInfo,
  } = useFileHandling({
    sites,
    reportType,
    siteSelectionMode,
    setParsedData,
    setFilteredData,
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
    setShowDuplicateErrors,
    setShowValidationErrors,
    setDetectedSite,
    setSiteSelectionMode,
    fileInputRef,
  });

  // Initialize validation hook
  const {
    validateData,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
    getRowErrors,
    rowHasErrors,
  } = useDataValidation({
    sites,
    vehicles,
    reportType,
    selectedSite,
    parsedData,
  });

  // Initialize Excel parsing hook
  const {
    processPreview,
    mapKmLData,
    mapLHrData,
    isRowComplete,
    findVehicleByName,
    findSiteByName,
  } = useExcelParsing({
    sites,
    vehicles,
    skipRows,
    reportType,
    selectedSite,
    file,
    setParsedData,
    setPreviewedOnce,
    showToast,
    handleClearPreview,
    validateData,
  });

  // Initialize submission hook
  const {
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
  } = useImportSubmission({
    sites,
    selectedSite,
    filteredData,
    validationErrors,
    selectedRowKeys,
    selectedRows,
    duplicateHandling,
    dispatch,
    showToast,
    selectedRowsHaveErrors: () => selectedRowsHaveErrors(selectedRowKeys),
    countSelectedRowsErrors: () => countSelectedRowsErrors(selectedRowKeys),
    setShowImportConfirmation,
    submittedDataMapRef,
  });

  /**
   * Handles data preview - wrapper that triggers processPreview
   */
  const handlePreviewData = () => {
    if (!file) {
      showToast("Please select a file first", "warning");
      return;
    }
    if (!reportType) {
      showToast("Please select a report type first", "warning");
      return;
    }
    if (reportType === "km/l" && !selectedSite) {
      showToast("Please select a site first for km/l reports", "warning");
      return;
    }
    processPreview();
  };

  /**
   * Gets filtered data
   */
  const getFilteredData = () => {
    return filteredData;
  };

  // Return all functions for backward compatibility
  return {
    // Toast
    showToast,
    
    // File handling
    handleFileChange,
    handleClearPreview,
    setDetectedSiteInfo,
    
    // Preview & parsing
    handlePreviewData,
    processPreview,
    mapKmLData,
    mapLHrData,
    isRowComplete,
    
    // Validation
    validateData,
    selectedRowsHaveErrors: () => selectedRowsHaveErrors(selectedRowKeys),
    countSelectedRowsErrors: () => countSelectedRowsErrors(selectedRowKeys),
    getRowErrors,
    rowHasErrors,
    
    // Import
    handlePrepareImport,
    handleSubmitData,
    handleRetryWithoutDuplicates,
    handleRetryWithOverwrite,
    
    // Lookup helpers
    findVehicleByName,
    findSiteByName,
    
    // Formatting utilities (re-exported for convenience)
    cleanNumericValue,
    formatDate,
    
    // Data access
    getFilteredData,
  };
};

export default useImportUtils;
