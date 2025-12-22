/**
 * File: useFileHandling.js
 * Purpose: Hook for file selection and handling operations
 * Extracted from: useImportUtils.js
 */

/**
 * Hook for file handling functionality
 */
const useFileHandling = ({
  sites,
  reportType,
  siteSelectionMode,
  setSiteSelectionMode,
  setFile,
  setFileName,
  setSelectedSite,
  setDetectedSite,
  setParsedData,
  setFilteredData,
  setValidationErrors,
  setDateRange,
  setPreviewedOnce,
  setShowValidationErrors,
  setShowDuplicateErrors,
  setFixedRows,
  setToastVisible,
  setToastMessage,
  setToastType,
  fileInputRef,
  dataGridRef,
}) => {
  /**
   * Shows a toast message with the specified type
   */
  const showToast = (message, type = "info") => {
    if (!message) {
      setToastVisible(false);
      return;
    }
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  /**
   * Detects site from filename and sets up confirmation dialog
   */
  const setDetectedSiteInfo = (filename) => {
    if (!filename || !reportType || reportType !== "km/l") return null;

    // Only perform detection if in auto mode
    if (siteSelectionMode !== "auto") return null;

    // Extract site name from filename pattern: SITENAME Fuel Report MONTH YEAR.xlsx
    const fileNamePattern = /^(.*?)(?:\s+)?Fuel Report/i;
    const match = filename.match(fileNamePattern);

    if (match && match[1]) {
      let siteName = match[1].trim();
      let originalName = siteName;

      // Special case for FOOTBRIDGE which should map to BRIDGE
      if (siteName.toUpperCase() === "FOOTBRIDGE") {
        siteName = "BRIDGE";
      }
      // Special case for IP which should map to Industrial Plot
      else if (siteName.toUpperCase() === "IP") {
        siteName = "Industrial Plot";
      }

      // Find site by name
      const detectedSite = sites.find(
        (site) => site.name.toUpperCase() === siteName.toUpperCase()
      );

      if (detectedSite) {
        // Set the detected site in state with additional context info
        setDetectedSite({
          ...detectedSite,
          originalFileName: filename,
          extractedName: originalName,
          mappedName: siteName !== originalName ? siteName : null,
        });

        // Pre-select the site in the dropdown
        setSelectedSite(detectedSite.id);

        // Show a helpful toast message
        const displayName =
          siteName !== originalName
            ? `${originalName} → ${siteName}`
            : siteName;
        showToast(
          `Auto-detected site: ${displayName}. You can change it in the dropdown if needed.`,
          "success"
        );

        return detectedSite;
      } else {
        // If we can't detect the site but we're in auto mode, show a warning
        showToast(
          `Could not automatically detect site from filename. Please check that the filename follows the pattern "SITE_NAME Fuel Report..."`,
          "warning"
        );

        // Switch to manual mode if detection fails
        setSiteSelectionMode("manual");
      }
    } else {
      // If filename doesn't match pattern in auto mode, show a warning
      showToast(
        `Filename pattern not recognized. Please name your file as "SITE_NAME Fuel Report..."`,
        "warning"
      );

      // Switch to manual mode if detection fails
      setSiteSelectionMode("manual");
    }
    return null;
  };

  /**
   * Handles file selection change
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files && e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
      setFile(selectedFile);
      setFileName(selectedFile.name);

      // Auto-detect site from filename if report type is km/l and we're in auto mode
      if (reportType === "km/l" && siteSelectionMode === "auto") {
        setDetectedSiteInfo(selectedFile.name);
      }

      // Reset only necessary states without affecting site selection
      setParsedData([]);
      setFilteredData([]);
      setValidationErrors([]);
      setDateRange({ start: null, end: null });
      setPreviewedOnce(false);
      setShowValidationErrors(false);
      setShowDuplicateErrors(false);

      showToast("");
    } else {
      setFile(null);
      setFileName("");
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Please select a valid Excel (.xlsx) file", "warning");
    }
  };

  /**
   * Clears the preview and resets state
   */
  const handleClearPreview = () => {
    // Reset all data state
    setParsedData([]);
    setFilteredData([]);
    setValidationErrors([]);
    setDateRange({ start: null, end: null });
    setPreviewedOnce(false);

    // Reset fixed rows tracking
    if (setFixedRows) {
      setFixedRows(new Set());
    }

    // Reset UI state
    setShowValidationErrors(false);
    setShowDuplicateErrors(false);

    // If we're in manual mode, reset the site selection
    // Don't reset site if in auto mode to preserve detection
    if (siteSelectionMode === "manual") {
      setSelectedSite("");
    }

    // Delay grid operations to ensure the component has time to re-render
    setTimeout(() => {
      if (dataGridRef.current && dataGridRef.current.instance) {
        try {
          dataGridRef.current.instance.clearSelection();
          dataGridRef.current.instance.clearFilter();
          dataGridRef.current.instance.pageIndex(0);
        } catch (err) {
          console.error("Error resetting grid:", err);
        }
      }
    }, 50);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Show toast after delay to ensure UI is updated
    setTimeout(() => {
      showToast("Data preview cleared.", "info");
    }, 100);
  };

  return {
    showToast,
    handleFileChange,
    handleClearPreview,
    setDetectedSiteInfo,
  };
};

export default useFileHandling;
