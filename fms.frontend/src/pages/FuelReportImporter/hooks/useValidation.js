import React, { useState } from 'react';

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
  setShowPopover
}) => {
  // Track the current popover being shown
  const [showPopover, setInternalShowPopover] = useState(null); //Cursor

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
   */
  const cellRender = (cellData) => {
    const { data, column, rowIndex: gridRowIndex } = cellData;
    if (!data) return null;

    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === data._rowIndex
    );

    const fieldName = column.dataField;
    const error = validationErrors.find(
      (err) => err.rowIndex === dataRowIndex && err.field === fieldName
    );

    const isDuplicate =
      error?.isDuplicate ||
      validationErrors.some(
        (err) =>
          err.rowIndex === dataRowIndex &&
          err.message &&
          err.message.includes("Duplicate")
      );

    const cellStyle = error
      ? {
          color: isDuplicate ? "#9f1239" : "#dc2626",
          fontWeight: "bold",
          backgroundColor: isDuplicate ? "rgba(255, 228, 230, 0.7)" : "",
          border: isDuplicate ? "1px solid #be185d" : "",
        }
      : {};

    const errorMessage = error?.message || "";

    let displayValue =
      column.dataType === "date" && data[fieldName]
        ? new Date(data[fieldName]).toLocaleDateString()
        : cellData.displayValue;

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

    const cellId = `cell-${dataRowIndex}-${fieldName}`;

    return (
      <div
        id={cellId}
        style={cellStyle}
        title={errorMessage}
        className={error ? "tw-relative tw-cursor-pointer" : ""}
        onMouseEnter={() => error && handleCellMouseEnter(cellId)}
        onMouseLeave={() => handleCellMouseLeave()}
      >
        {displayValue}
        {error && (
          <span className="tw-absolute tw-right-1 tw-top-1 tw-text-red-500 tw-opacity-80">
            <i
              className={`fa-solid ${
                isDuplicate ? "fa-copy" : "fa-circle-exclamation"
              } tw-text-xs`}
            />
          </span>
        )}
        {showPopover === cellId && error && (
          <ErrorTooltip message={errorMessage} />
        )}
      </div>
    );
  };

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
      //Cursor The repaintRows call caused dxCheckBox initialization issues in virtual scrolling mode. Commented out to prevent E0009.
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
   */
  const onEditorPreparing = (e) => {
    if (e.parentType !== "dataRow" || !e.row?.data) return;

    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === e.row.data._rowIndex
    );
    const hasErrorForField = validationErrors.some(
      (err) => err.rowIndex === dataRowIndex && err.field === e.dataField
    );

    if (!hasErrorForField) {
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
          const gridRowIndex = e.row.rowIndex;
          if (dataRowIndex >= 0) {
            const newParsedData = [...parsedData];
            newParsedData[dataRowIndex].vehicleName = selectedVehicle.hyoungNo;
            newParsedData[dataRowIndex].vehicleId = selectedVehicle.vehicleId;
            setParsedData(newParsedData);
            e.component.cellValue(
              gridRowIndex,
              "vehicleName",
              selectedVehicle.hyoungNo
            );
            e.component.cellValue(
              gridRowIndex,
              "vehicleId",
              selectedVehicle.vehicleId
            );
          }
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
          const gridRowIndex = e.row.rowIndex;
          if (dataRowIndex >= 0) {
            const newParsedData = [...parsedData];
            newParsedData[dataRowIndex].locationName = selectedSite.name;
            newParsedData[dataRowIndex].siteId = selectedSite.id;
            setParsedData(newParsedData);
            e.component.cellValue(
              gridRowIndex,
              "locationName",
              selectedSite.name
            );
            e.component.cellValue(gridRowIndex, "siteId", selectedSite.id);
          }
        }
      };
    } else if (e.dataField === "locationName" && reportType === "km/l") {
      // For km/l reports, locationName should not be editable as it comes from the site dropdown
      e.cancel = true;
    }

    if (e.dataField === "driverName") {
      e.editorName = "dxTextBox";
      e.editorOptions.onValueChanged = (args) => {
        const gridRowIndex = e.row.rowIndex;
        if (dataRowIndex >= 0) {
          const newParsedData = [...parsedData];
          newParsedData[dataRowIndex].driverName = args.value;
          setParsedData(newParsedData);
          e.component.cellValue(gridRowIndex, "driverName", args.value);
        }
      };
    }

    if (e.dataField === "date") {
      e.editorName = "dxDateBox";
      e.editorOptions.type = "date";
      e.editorOptions.displayFormat = "yyyy-MM-dd";
      e.editorOptions.onValueChanged = (args) => {
        const gridRowIndex = e.row.rowIndex;
        if (dataRowIndex >= 0) {
          const newDate = args.value ? new Date(args.value) : null;
          const newParsedData = [...parsedData];
          newParsedData[dataRowIndex].date = newDate;
          setParsedData(newParsedData);
          e.component.cellValue(gridRowIndex, "date", newDate);
        }
      };
    }
  };

  /**
   * Update data model when row is edited
   */
  const onRowUpdated = (e) => {
    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === e.key
    );

    if (dataRowIndex >= 0) {
      const newParsedData = [...parsedData];
      newParsedData[dataRowIndex] = { ...newParsedData[dataRowIndex], ...e.data };
      setParsedData(newParsedData);
    }
  };

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
  const clearSelections = () => {
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

    // Force refresh to update UI elements
    setTimeout(() => {
      if (dataGridRef.current?.instance) {
        dataGridRef.current.instance.refresh();
      }
    }, 50);
  };

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
      }, 10); //Cursor
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
      }, 50); //Cursor
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
      }, 10); //Cursor

      // Force refresh to apply filters with delay
      if (dataGridRef.current?.instance) {
        setTimeout(() => {
          try {
            dataGridRef.current.instance.refresh();
          } catch (err) {
            console.error("Error refreshing grid:", err);
          }
        }, 50); //Cursor
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
   * Gets filtered data based on current filter settings
   */
  const getFilteredData = () => {
    if (!filterErrorsOnly || !Array.isArray(validationErrors) || validationErrors.length === 0) {
      return filteredData;
    }

    try {
      // Find all row indices with errors
      let relevantErrors = validationErrors;

      // If duplicate filter is on, only show duplicates
      if (showDuplicateErrors) {
        relevantErrors = validationErrors.filter((err) => err.isDuplicate);
      }

      // Create a Set of unique row indices for faster lookup
      const errorRowIndicesSet = new Set(
        relevantErrors
          .filter(err => err && typeof err.rowIndex === 'number')
          .map(err => err.rowIndex)
      );

      // Return only rows with the relevant errors
      return filteredData.filter((row) => {
        if (!row) return false;

        const dataRowIndex = parsedData.findIndex(
          (item) => item && item._rowIndex === row._rowIndex
        );

        return errorRowIndicesSet.has(dataRowIndex);
      });
    } catch (err) {
      console.error('Error filtering data:', err);
      return filteredData;
    }
  };

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
    getFilteredData
  };
};

export default useValidation;