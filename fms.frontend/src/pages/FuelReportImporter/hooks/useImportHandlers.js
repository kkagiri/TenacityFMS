/**
 * File: useImportHandlers.js
 * Purpose: Handler functions for FuelReportImporter
 * Extracted from: FuelReportImporter.js
 *
 * Contains handlers for:
 * - Row deletion
 * - Data validation
 * - Site confirmation
 * - Navigation to specific rows
 */

/**
 * Hook containing handler functions for the Fuel Report Importer
 */
const useImportHandlers = ({
  // State
  parsedData,
  setParsedData,
  filteredData,
  validationErrors,
  setValidationErrors,
  selectedRowKeys,
  setSelectedRowKeys,
  selectedRows,
  setSelectedRows,
  selectedSite,
  setSelectedSite,
  fixedRows,
  setFixedRows,
  // Refs
  dataGridRef,
  // Handlers
  showToast,
  handlePreviewData,
  validateData,
  setShowSiteConfirmation,
}) => {
  /**
   * Handle site confirmation from auto-detection dialog
   */
  const handleSiteConfirmation = () => {
    setShowSiteConfirmation(false);
    // If a site was selected, proceed with preview
    if (selectedSite) {
      handlePreviewData();
    }
  };

  /**
   * Handle deletion of selected rows
   */
  const handleDeleteSelectedRows = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      showToast("No rows selected for deletion", "warning");
      return;
    }

    // Create a Set of selected row keys for faster lookup
    const selectedKeysSet = new Set(selectedRowKeys);

    // Filter out selected rows from parsedData
    const newParsedData = parsedData.filter(
      (row) => !selectedKeysSet.has(row._rowIndex)
    );

    // Get indices of deleted rows for cleanup
    const deletedRowIndices = parsedData
      .map((row, index) => (selectedKeysSet.has(row._rowIndex) ? index : -1))
      .filter((index) => index !== -1);

    // Remove validation errors for deleted rows
    const newValidationErrors = validationErrors.filter((err) => {
      // Check if error belongs to a deleted row
      return !deletedRowIndices.includes(err.rowIndex);
    });

    // Adjust row indices in remaining validation errors
    // (since rows were removed, indices shift)
    const adjustedValidationErrors = newValidationErrors.map((err) => {
      let adjustedIndex = err.rowIndex;
      // Count how many deleted rows were before this error's row
      const deletedBefore = deletedRowIndices.filter(
        (deletedIdx) => deletedIdx < err.rowIndex
      ).length;
      adjustedIndex = err.rowIndex - deletedBefore;
      return {
        ...err,
        rowIndex: adjustedIndex,
      };
    });

    // Remove deleted rows from fixedRows set
    const newFixedRows = new Set(fixedRows);
    selectedRowKeys.forEach((key) => {
      newFixedRows.delete(key);
    });

    // Update states
    setParsedData(newParsedData);
    setValidationErrors(adjustedValidationErrors);
    setFixedRows(newFixedRows);

    // Clear selection
    setSelectedRowKeys([]);
    setSelectedRows([]);

    // Clear grid selection
    if (dataGridRef.current?.instance) {
      try {
        dataGridRef.current.instance.clearSelection();
      } catch (err) {
        console.warn("Error clearing grid selection:", err);
      }
    }

    // Show success message
    showToast(
      `Successfully deleted ${selectedRowKeys.length} row(s)`,
      "success"
    );
  };

  /**
   * Handle re-validation of data after user edits
   */
  const handleValidateData = () => {
    if (!parsedData || parsedData.length === 0) {
      showToast("No data to validate", "warning");
      return;
    }

    // Re-run validation on the current parsed data
    const newValidationErrors = validateData(parsedData);
    setValidationErrors(newValidationErrors);

    // Refresh the grid to update cell styling
    if (dataGridRef.current?.instance) {
      try {
        dataGridRef.current.instance.refresh();
      } catch (err) {
        console.warn("Error refreshing grid:", err);
      }
    }

    // Show result message
    if (newValidationErrors.length === 0) {
      showToast(
        `All ${parsedData.length} rows validated successfully! No issues found.`,
        "success"
      );
    } else {
      const duplicateErrors = newValidationErrors.filter(
        (err) => err.isDuplicate
      );
      const fieldErrors = newValidationErrors.filter((err) => !err.isDuplicate);

      let message = `Found ${newValidationErrors.length} validation issue(s)`;
      if (duplicateErrors.length > 0 && fieldErrors.length > 0) {
        message = `Found ${fieldErrors.length} field issue(s) and ${duplicateErrors.length} duplicate(s)`;
      } else if (duplicateErrors.length > 0) {
        message = `Found ${duplicateErrors.length} duplicate record(s)`;
      } else {
        message = `Found ${fieldErrors.length} field issue(s) - please fix and validate again`;
      }

      showToast(message, "warning");
    }
  };

  /**
   * Navigate to a specific row in the grid
   */
  const handleGoToRow = (rowIndex) => {
    if (dataGridRef.current?.instance) {
      try {
        const grid = dataGridRef.current.instance;
        const targetRow = parsedData[rowIndex];
        if (targetRow) {
          // Calculate page and navigate
          const rowsPerPage = grid.pageSize() || 20;
          const pageIndex = Math.floor(rowIndex / rowsPerPage);
          grid.pageIndex(pageIndex);

          // After page change, scroll to and select the row
          setTimeout(() => {
            try {
              grid.selectRows([targetRow._rowIndex], false);
              // Try to scroll to the row
              const rowElement = grid.getRowElement(rowIndex % rowsPerPage);
              if (rowElement && rowElement[0]) {
                rowElement[0].scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                // Flash highlight
                rowElement[0].style.backgroundColor = "#fef3c7";
                setTimeout(() => {
                  rowElement[0].style.backgroundColor = "";
                }, 2000);
              }
            } catch (err) {
              console.warn("Could not scroll to row:", err);
            }
          }, 100);
        }
      } catch (err) {
        console.warn("Could not navigate to row:", err);
      }
    }
  };

  return {
    handleSiteConfirmation,
    handleDeleteSelectedRows,
    handleValidateData,
    handleGoToRow,
  };
};

export default useImportHandlers;
