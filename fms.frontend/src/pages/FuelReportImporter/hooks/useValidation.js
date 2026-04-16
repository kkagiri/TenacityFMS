import React, { useState, useCallback, useRef, useMemo } from "react";
import { toLocalDateString } from "../utils/formatting";

/**
 * Hook for grid validation and interaction
 */
const useValidation = ({
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
  fixedRows,
  setFixedRows,
}) => {
  // Ref to track pending updates to avoid multiple re-renders
  const pendingUpdatesRef = useRef(false);
  // Track the current popover being shown
  const [showPopover, setInternalShowPopover] = useState(null);

  /**
   * Displays an error tooltip for cell validation errors
   */
  const ErrorTooltip = ({ message }) => {
    if (!message) return null;

    return (
      <div
        className="tw-absolute tw-z-50 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-3 tw-shadow-lg tw-max-w-md"
        style={{ left: "105%", top: "0" }}
      >
        <div className="tw-flex tw-items-start">
          <i className="fa-light fa-circle-exclamation tw-text-red-500 tw-text-xl tw-mr-2 tw-mt-0.5" />
          <div className="tw-text-red-700 tw-text-sm tw-font-medium">
            {message}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders a cell with validation highlighting
   * Optimized to minimize re-computations
   */
  const cellRender = useCallback(
    (cellData) => {
      const { data, column } = cellData;
      if (!data) return null;

      // Use the _rowIndex directly from data to avoid expensive findIndex
      const rowKey = data._rowIndex;
      const fieldName = column.dataField;

      // Check if row is fixed
      const isRowFixed = data._isFixed;

      // Find error for this specific cell
      const error = validationErrors.find((err) => {
        // Match by _rowIndex in parsedData
        const errRowKey = parsedData[err.rowIndex]?._rowIndex;
        return errRowKey === rowKey && err.field === fieldName;
      });

      const isDuplicate = error?.isDuplicate || false;

      const cellStyle = error
        ? {
          color: isDuplicate ? "#9f1239" : "#dc2626",
          fontWeight: "bold",
          backgroundColor: isDuplicate
            ? "rgba(255, 228, 230, 0.7)"
            : "rgba(254, 243, 199, 0.5)",
          border: isDuplicate ? "1px solid #be185d" : "1px solid #f59e0b",
          padding: "2px 4px",
          borderRadius: "2px",
        }
        : isRowFixed
          ? {
            backgroundColor: "rgba(209, 250, 229, 0.3)",
          }
          : {};

      const errorMessage = error?.message || "";

      // Ensure displayValue is always a string (not a Date object)
      let displayValue = cellData.displayValue;

      // Handle date columns specially
      if (column.dataType === "date" && data[fieldName]) {
        const dateVal = data[fieldName];
        if (dateVal instanceof Date) {
          displayValue = !isNaN(dateVal.getTime())
            ? dateVal.toLocaleDateString()
            : "";
        } else {
          const parsedDate = new Date(dateVal);
          displayValue = !isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleDateString()
            : String(dateVal);
        }
      } else if (displayValue instanceof Date) {
        displayValue = !isNaN(displayValue.getTime())
          ? displayValue.toLocaleDateString()
          : "";
      } else if (
        displayValue !== null &&
        displayValue !== undefined &&
        typeof displayValue === "object"
      ) {
        displayValue = String(displayValue);
      }

      if (["vehicleName", "locationName", "driverName"].includes(fieldName)) {
        displayValue = data[fieldName] || "";
      }

      if (column.dataType === "number") {
        const value = data[fieldName];
        if (value === 0 || value === 0.0) {
          displayValue = "0.00";
        } else if (value === null || value === undefined) {
          displayValue = "";
        }
      }

      return (
        <div
          style={cellStyle}
          title={errorMessage}
          className={error ? "tw-relative" : ""}
        >
          {displayValue}
          {error && (
            <span className="tw-absolute tw-right-1 tw-top-1/2 tw--translate-y-1/2 tw-text-red-500 tw-opacity-80">
              <i
                className={`fa-solid ${isDuplicate ? "fa-copy" : "fa-circle-exclamation"
                  } tw-text-xs`}
              />
            </span>
          )}
        </div>
      );
    },
    [validationErrors, parsedData]
  );

  /**
   * Handles cell mouse enter event for showing popovers
   */
  const handleCellMouseEnter = (cellId) => {
    setInternalShowPopover(cellId);
    if (setShowPopover) {
      setShowPopover(cellId);
    }
  };

  /**
   * Handles cell mouse leave event for hiding popovers
   */
  const handleCellMouseLeave = () => {
    setInternalShowPopover(null);
    if (setShowPopover) {
      setShowPopover(null);
    }
  };

  /**
   * Handles row selection changes
   */
  const onSelectionChanged = (e) => {
    if (!e || e.selectedRowKeys === undefined) {
      return;
    }

    // Store the selected row keys
    setSelectedRowKeys(e.selectedRowKeys || []);

    // Safely handle selectedRowsData which might be undefined in some versions of DevExtreme
    if (e.selectedRowsData && Array.isArray(e.selectedRowsData)) {
      setSelectedRows(e.selectedRowsData);
    } else {
      // When using filtered data, we need to be careful to get the proper subset
      // Get filtered data first
      const currentFilteredDataSource = filteredData;

      // Now find the selected rows from this filtered dataset
      const selectedData =
        e.selectedRowKeys
          ?.map((key) =>
            currentFilteredDataSource.find((row) => row._rowIndex === key)
          )
          .filter(Boolean) || [];

      setSelectedRows(selectedData);
    }

    // Force a re-render of components that depend on selection state
    if (dataGridRef.current) {
      // Note: repaintRows call caused dxCheckBox initialization issues in virtual scrolling mode.
      // Commented out to prevent E0009 error.
      // setTimeout(() => {
      //   if (dataGridRef.current?.instance) {
      //     dataGridRef.current.instance.repaintRows(e.selectedRowKeys);
      //   }
      // }, 10);
    }
  };

  /**
   * Sets up row styling based on validation state
   */
  const onRowPrepared = (e) => {
    if (e.rowType === "data") {
      const dataRowIndex = parsedData.findIndex(
        (item) => item._rowIndex === e.data._rowIndex
      );

      // Find validation errors for this row
      const rowErrors = validationErrors.filter(
        (err) => err.rowIndex === dataRowIndex
      );

      // Has any errors
      if (rowErrors.length > 0) {
        // Duplicate entry - highlight in red
        if (rowErrors.some((err) => err.isDuplicate)) {
          e.rowElement.classList.add("duplicate-row");
          e.rowElement.title = "Duplicate entry found";
        }
        // Other errors - general error styling
        else {
          e.rowElement.classList.add("error-row");
          const errorMessages = rowErrors
            .map((err) => err.error || err.message)
            .join("; ");
          e.rowElement.title = errorMessages;
        }
      }
    }
  };

  /**
   * Handle cell click to enable editing for cells with validation errors
   */
  const onCellClick = (e) => {
    if (e.rowType !== "data") return;
    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === e.data._rowIndex
    );
    const hasErrorForField = validationErrors.some(
      (err) => err.rowIndex === dataRowIndex && err.field === e.column.dataField
    );
    if (hasErrorForField) {
      e.component.editCell(e.rowIndex, e.columnIndex);
    }
  };

  /**
   * Configure editors for editable fields
   * Now allows editing for ALL rows on key fields (not restricted to error rows only)
   * This allows users to fix data even after validation or if marked as valid/fixed
   */
  const onEditorPreparing = (e) => {
    if (e.parentType !== "dataRow" || !e.row?.data) return;

    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === e.row.data._rowIndex
    );

    // Define always-editable fields - users can edit these on ANY row
    const alwaysEditableFields = [
      "vehicleName",
      "locationName",
      "driverName",
      "date",
      "isNightShift",
    ];

    // Allow editing if field is in the editable list
    const canEdit = alwaysEditableFields.includes(e.dataField);

    if (!canEdit) {
      e.cancel = true;
      return;
    }

    if (e.dataField === "vehicleName") {
      e.editorName = "dxSelectBox";
      e.editorOptions.dataSource = vehicles;
      e.editorOptions.valueExpr = "hyoungNo";
      e.editorOptions.displayExpr = "hyoungNo";
      e.editorOptions.searchEnabled = true;
      e.editorOptions.onValueChanged = (args) => {
        const selectedVehicle = vehicles.find((v) => v.hyoungNo === args.value);
        if (selectedVehicle) {
          updateRowData(dataRowIndex, e.row.rowIndex, e.component, {
            vehicleName: selectedVehicle.hyoungNo,
            vehicleId: selectedVehicle.vehicleId,
          });
        }
      };
    }

    if (e.dataField === "locationName" && reportType === "l/hr") {
      e.editorName = "dxSelectBox";
      e.editorOptions.dataSource = sites;
      e.editorOptions.valueExpr = "name";
      e.editorOptions.displayExpr = "name";
      e.editorOptions.searchEnabled = true;
      e.editorOptions.onValueChanged = (args) => {
        const selectedSite = sites.find((s) => s.name === args.value);
        if (selectedSite) {
          updateRowData(dataRowIndex, e.row.rowIndex, e.component, {
            locationName: selectedSite.name,
            siteId: selectedSite.id,
          });
        }
      };
    } else if (e.dataField === "locationName" && reportType === "km/l") {
      e.cancel = true;
    }

    if (e.dataField === "driverName") {
      e.editorName = "dxTextBox";
      e.editorOptions.onValueChanged = (args) => {
        updateRowData(dataRowIndex, e.row.rowIndex, e.component, {
          driverName: args.value,
        });
      };
    }

    if (e.dataField === "date") {
      e.editorName = "dxDateBox";
      e.editorOptions.type = "date";
      e.editorOptions.displayFormat = "yyyy-MM-dd";
      e.editorOptions.onValueChanged = (args) => {
        const newDate = args.value ? new Date(args.value) : null;
        updateRowData(dataRowIndex, e.row.rowIndex, e.component, {
          date: newDate,
        });
      };
    }

    if (e.dataField === "isNightShift") {
      e.editorName = "dxCheckBox";
      e.editorOptions.onValueChanged = (args) => {
        updateRowData(dataRowIndex, e.row.rowIndex, e.component, {
          isNightShift: args.value,
        });
      };
    }
  };

  /**
   * Helper function to update row data and remove validation errors
   * Uses batching to prevent multiple re-renders
   */
  const updateRowData = useCallback(
    (dataRowIndex, gridRowIndex, gridComponent, updates) => {
      if (dataRowIndex < 0 || pendingUpdatesRef.current) return;

      // Prevent multiple simultaneous updates
      pendingUpdatesRef.current = true;

      // Get the current row's _rowIndex for tracking
      const rowKey = parsedData[dataRowIndex]?._rowIndex;

      // Batch all state updates together
      requestAnimationFrame(() => {
        // Update parsed data (immutable update on specific row only)
        const newParsedData = [...parsedData];
        newParsedData[dataRowIndex] = {
          ...newParsedData[dataRowIndex],
          ...updates,
          _isFixed: true, // Mark as fixed
        };
        setParsedData(newParsedData);

        // Remove validation errors for the updated fields
        const updatedFields = Object.keys(updates);
        const newValidationErrors = validationErrors.filter((err) => {
          if (err.rowIndex !== dataRowIndex) return true;
          // Remove error if field was updated
          if (updatedFields.includes(err.field)) return false;
          return true;
        });

        // Check if all errors for this row are resolved
        const remainingRowErrors = newValidationErrors.filter(
          (err) => err.rowIndex === dataRowIndex
        );

        // If all errors for this row are fixed, add to fixedRows
        if (
          remainingRowErrors.length === 0 &&
          rowKey !== undefined &&
          setFixedRows
        ) {
          setFixedRows((prev) => {
            const newSet = new Set(prev);
            newSet.add(rowKey);
            return newSet;
          });
        }

        // Update validation errors if changed
        if (newValidationErrors.length !== validationErrors.length) {
          setValidationErrors(newValidationErrors);
        }

        // Allow next update after short delay
        setTimeout(() => {
          pendingUpdatesRef.current = false;
        }, 100);
      });
    },
    [
      parsedData,
      validationErrors,
      setParsedData,
      setValidationErrors,
      setFixedRows,
    ]
  );

  /**
   * Re-validates duplicate entries after isNightShift change
   * This checks if the duplicate pair is now differentiated
   */
  const revalidateDuplicates = useCallback(
    (updatedParsedData, changedRowIndex) => {
      // Get the changed row
      const changedRow = updatedParsedData[changedRowIndex];
      if (!changedRow || !changedRow.vehicleId || !changedRow.date) return [];

      const dateStr = toLocalDateString(changedRow.date);
      if (!dateStr) return [];
      const groupKey = `${changedRow.vehicleId}_${dateStr}`;

      // Find all rows with same vehicle and date
      const sameVehicleDateRows = updatedParsedData
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => {
          if (!row.vehicleId || !row.date) return false;
          const rowDateStr = toLocalDateString(row.date);
          return (
            row.vehicleId === changedRow.vehicleId && rowDateStr === dateStr
          );
        });

      // Group by shift
      const dayShiftRows = sameVehicleDateRows.filter(
        ({ row }) => !row.isNightShift
      );
      const nightShiftRows = sameVehicleDateRows.filter(
        ({ row }) => row.isNightShift
      );

      const newDuplicateErrors = [];

      // Check for duplicates in day shift
      if (dayShiftRows.length > 1) {
        dayShiftRows.forEach(({ row, index }, groupIndex) => {
          const otherIndices = dayShiftRows
            .filter((_, i) => i !== groupIndex)
            .map((g) => g.index);

          newDuplicateErrors.push({
            rowIndex: index,
            field: "isNightShift",
            isDuplicate: true,
            duplicateGroupKey: groupKey,
            duplicateWithRows: otherIndices,
            message: `Duplicate entry: Vehicle ${row.vehicleName} on ${new Date(
              row.date
            ).toLocaleDateString()} (Day shift). Conflicts with row ${otherIndices
              .map((i) => i + 1)
              .join(", ")}. Set one as Night shift to resolve.`,
          });
        });
      }

      // Check for duplicates in night shift
      if (nightShiftRows.length > 1) {
        nightShiftRows.forEach(({ row, index }, groupIndex) => {
          const otherIndices = nightShiftRows
            .filter((_, i) => i !== groupIndex)
            .map((g) => g.index);

          newDuplicateErrors.push({
            rowIndex: index,
            field: "isNightShift",
            isDuplicate: true,
            duplicateGroupKey: groupKey,
            duplicateWithRows: otherIndices,
            message: `Duplicate entry: Vehicle ${row.vehicleName} on ${new Date(
              row.date
            ).toLocaleDateString()} (Night shift). Conflicts with row ${otherIndices
              .map((i) => i + 1)
              .join(", ")}. Set one as Day shift to resolve.`,
          });
        });
      }

      return {
        newDuplicateErrors,
        affectedRows: sameVehicleDateRows.map((r) => r.index),
        groupKey,
      };
    },
    []
  );

  /**
   * Update data model when row is edited
   */
  const onRowUpdated = useCallback(
    (e) => {
      const dataRowIndex = parsedData.findIndex(
        (item) => item._rowIndex === e.key
      );

      if (dataRowIndex >= 0) {
        // Update the parsed data with the edited values
        const newParsedData = [...parsedData];
        newParsedData[dataRowIndex] = {
          ...newParsedData[dataRowIndex],
          ...e.data,
          _isFixed: true,
        };

        const updatedFields = Object.keys(e.data);
        const isNightShiftChanged = updatedFields.includes("isNightShift");

        // Start with existing validation errors
        let newValidationErrors = [...validationErrors];

        if (isNightShiftChanged) {
          // Re-validate duplicates for this vehicle/date group
          const { newDuplicateErrors, affectedRows, groupKey } =
            revalidateDuplicates(newParsedData, dataRowIndex);

          // Remove old duplicate errors for this group
          newValidationErrors = newValidationErrors.filter((err) => {
            // Keep errors that are not duplicates
            if (!err.isDuplicate) return true;
            // Remove duplicate errors for affected rows in this group
            if (err.duplicateGroupKey === groupKey) return false;
            if (affectedRows.includes(err.rowIndex)) return false;
            return true;
          });

          // Add new duplicate errors (if any still exist after the change)
          newValidationErrors = [...newValidationErrors, ...newDuplicateErrors];

          // If no more duplicate errors for this row, mark as fixed
          const rowStillHasErrors = newDuplicateErrors.some(
            (err) => err.rowIndex === dataRowIndex
          );
          if (!rowStillHasErrors && setFixedRows) {
            setFixedRows((prev) => {
              const newSet = new Set(prev);
              newSet.add(e.key);
              // Also mark any other rows in the group that are now fixed
              affectedRows.forEach((idx) => {
                const rowKey = newParsedData[idx]?._rowIndex;
                if (
                  rowKey !== undefined &&
                  !newDuplicateErrors.some((err) => err.rowIndex === idx)
                ) {
                  newSet.add(rowKey);
                }
              });
              return newSet;
            });
          }
        } else {
          // For non-isNightShift changes, just remove errors for the updated fields
          newValidationErrors = newValidationErrors.filter((err) => {
            if (err.rowIndex !== dataRowIndex) return true;
            if (updatedFields.includes(err.field)) return false;
            return true;
          });

          // Check if all errors for this row are resolved
          const remainingRowErrors = newValidationErrors.filter(
            (err) => err.rowIndex === dataRowIndex
          );

          // If all errors resolved, mark row as fixed
          if (remainingRowErrors.length === 0 && setFixedRows) {
            setFixedRows((prev) => {
              const newSet = new Set(prev);
              newSet.add(e.key);
              return newSet;
            });
          }
        }

        // Update states
        setParsedData(newParsedData);
        setValidationErrors(newValidationErrors);
      }
    },
    [
      parsedData,
      validationErrors,
      setParsedData,
      setValidationErrors,
      setFixedRows,
      revalidateDuplicates,
    ]
  );

  /**
   * Handles page changes
   */
  const onPageChanged = (e) => {
    setCurrentPage(e.component.pageIndex());
  };

  /**
   * Handles page size changes
   */
  const onPageSizeChanged = (e) => {
    setPageSize(e.component.pageSize());
  };

  /**
   * Clears all selected rows
   */
  const clearSelections = useCallback(() => {
    // Clear selection in the UI
    if (dataGridRef.current?.instance) {
      try {
        dataGridRef.current.instance.clearSelection();
      } catch (error) {
        console.error("Error clearing selection in DataGrid", error);
      }
    }

    // Clear selection in state
    setSelectedRows([]);
    setSelectedRowKeys([]);
    // Note: Removed the forced refresh - it was causing unnecessary re-rendering
  }, [setSelectedRows, setSelectedRowKeys, dataGridRef]);

  /**
   * Handles filter value changes
   */
  const onFilterValueChanged = (e) => {
    /* No action needed */
  };

  /**
   * Toggles validation error filter
   */
  const handleToggleValidationFilter = (e) => {
    // Safely access the checked property
    const isChecked = e?.target?.checked ?? false;

    // Set validation visibility
    setShowValidationErrors(isChecked);

    // When enabling validation filter, reset other filters to avoid conflicts
    if (isChecked) {
      setFilterErrorsOnly(true);
      // Clear current selection to avoid confusion
      setTimeout(() => {
        clearSelections();
      }, 10);
    } else {
      setFilterErrorsOnly(false);
      if (showDuplicateErrors) {
        setShowDuplicateErrors(false);
      }
    }

    // Force refresh data grid with slight delay to avoid initialization errors
    if (dataGridRef.current?.instance) {
      setTimeout(() => {
        try {
          dataGridRef.current.instance.refresh();
        } catch (err) {
          console.error("Error refreshing grid:", err);
        }
      }, 50);
    }
  };

  /**
   * Toggles duplicate error filter
   */
  const handleToggleDuplicateFilter = (e) => {
    // Safely access the checked property
    const isChecked = e?.target?.checked ?? false;

    // Set duplicate error visibility
    setShowDuplicateErrors(isChecked);

    if (isChecked) {
      // When showing duplicates, also ensure validation errors are shown
      setShowValidationErrors(true);
      // Enable filtering by errors only
      setFilterErrorsOnly(true);
      // Clear selections to avoid confusion
      setTimeout(() => {
        clearSelections();
      }, 10);

      // Force refresh to apply filters with delay
      if (dataGridRef.current?.instance) {
        setTimeout(() => {
          try {
            dataGridRef.current.instance.refresh();
          } catch (err) {
            console.error("Error refreshing grid:", err);
          }
        }, 50);
      }
    } else if (!showValidationErrors) {
      // If turning off duplicates and validation errors are not shown
      // also turn off the error-only filter
      setFilterErrorsOnly(false);
    }
  };

  /**
   * Validates data for import
   */
  const validateData = (data) => {
    const errors = [];
    // Validation logic will be implemented in the dataProcessing hook
    return errors;
  };

  /**
   * Selects only rows without validation errors
   */
  const selectValidRowsOnly = async () => {
    // Clear current selection
    clearSelections();

    // Create an efficient lookup for validation errors by rowIndex
    const errorRowsMap = {};
    validationErrors.forEach((err) => {
      if (err.rowIndex !== undefined) {
        errorRowsMap[err.rowIndex] = true;
      }
    });

    // Use a more efficient approach for finding valid rows
    const validRowKeys = [];

    // Safety check for filteredData
    if (!filteredData || !Array.isArray(filteredData)) {
      return;
    }

    // Process in chunks to prevent UI freezing
    const CHUNK_SIZE = 500;
    for (let i = 0; i < filteredData.length; i += CHUNK_SIZE) {
      // Process a chunk of the data
      const chunk = filteredData.slice(i, i + CHUNK_SIZE);

      // Find valid rows in this chunk (no validation errors)
      chunk.forEach((row) => {
        if (!row) return; // Skip null or undefined rows

        const dataRowIndex = parsedData.findIndex(
          (item) => item && item._rowIndex === row._rowIndex
        );
        if (!errorRowsMap[dataRowIndex]) {
          validRowKeys.push(row._rowIndex);
        }
      });

      // For very large datasets, give the UI thread a chance to breathe
      if (i > 0 && i % (CHUNK_SIZE * 2) === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Update state with valid row keys
    setSelectedRowKeys(validRowKeys);

    // For better performance, don't eagerly load all row data
    // Just note how many rows are selected
    const validRowCount = validRowKeys.length;

    // Only load the actual row data if the selection is small
    if (validRowCount <= 100) {
      const validRows = filteredData.filter((row) =>
        validRowKeys.includes(row._rowIndex)
      );
      setSelectedRows(validRows);
    } else {
      // For large selections, defer loading the full row data until needed
      // Just set a count placeholder to indicate selection exists
      setSelectedRows({ length: validRowCount, _isLargeSelection: true });
    }

    // Update the DataGrid selection state
    if (dataGridRef.current) {
      try {
        dataGridRef.current.instance.selectRows(validRowKeys, false);
      } catch (error) {
        console.error("Error selecting rows in DataGrid", error);
        // Fallback to setting state only
        setSelectedRowKeys(validRowKeys);
      }
    }
  };

  /**
   * Initializes the grid
   */
  const handleGridInitialized = (e) => {
    // Store grid instance for potential reference
    if (dataGridRef.current) {
      // Additional initialization can be done here if needed
    }
  };

  /**
   * Memoized filtered data based on current filter settings
   * This prevents unnecessary re-renders when the actual data hasn't changed
   */
  const memoizedFilteredData = useMemo(() => {
    if (
      !filterErrorsOnly ||
      !Array.isArray(validationErrors) ||
      validationErrors.length === 0
    ) {
      return filteredData;
    }

    try {
      // Find all row indices with errors
      let relevantErrors = validationErrors;

      // If duplicate filter is on, only show duplicates
      if (showDuplicateErrors) {
        relevantErrors = validationErrors.filter((err) => err.isDuplicate);
      } else {
        // When not filtering duplicates specifically, include all errors EXCEPT duplicates
        // But ALWAYS include backend errors (they're server-side validation failures)
        relevantErrors = validationErrors.filter(
          (err) => err.isBackendError || !err.isDuplicate
        );
      }

      // Create a Set of unique row indices for faster lookup
      const errorRowIndicesSet = new Set(
        relevantErrors
          .filter(
            (err) =>
              err && typeof err.rowIndex === "number" && err.rowIndex >= 0
          )
          .map((err) => err.rowIndex)
      );

      // Return only rows with the relevant errors
      const filtered = filteredData.filter((row) => {
        if (!row) return false;

        const dataRowIndex = parsedData.findIndex(
          (item) => item && item._rowIndex === row._rowIndex
        );

        const hasError = errorRowIndicesSet.has(dataRowIndex);
        return hasError;
      });

      return filtered;
    } catch (err) {
      console.error("Error filtering data:", err);
      return filteredData;
    }
  }, [
    filteredData,
    filterErrorsOnly,
    validationErrors,
    showDuplicateErrors,
    parsedData,
  ]);

  /**
   * Gets filtered data - returns memoized result to prevent unnecessary re-renders
   */
  const getFilteredData = useCallback(() => {
    return memoizedFilteredData;
  }, [memoizedFilteredData]);

  return {
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
    getFilteredData,
  };
};

export default useValidation;
