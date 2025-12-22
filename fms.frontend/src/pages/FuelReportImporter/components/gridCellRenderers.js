/**
 * File: gridCellRenderers.js
 * Purpose: Cell renderer functions for DataPreview DataGrid
 * Last Modified: 2025-12-16
 */

/**
 * Creates a selection column header renderer with select-all functionality
 * @param {Array} dataSource - Current visible data source
 * @param {Array} selectedRowKeys - Currently selected row keys
 * @param {Function} onSelectionChanged - Callback when selection changes
 * @returns {Function} Header cell renderer
 */
export const createSelectionHeaderRenderer = (
  dataSource,
  selectedRowKeys,
  onSelectionChanged
) => {
  return () => {
    const currentData = dataSource || [];
    const allSelected =
      currentData.length > 0 &&
      currentData.every(
        (row) => row && selectedRowKeys.includes(row._rowIndex)
      );

    return (
      <div className="tw-flex tw-justify-center">
        <input
          type="checkbox"
          className="tw-w-4 tw-h-4"
          checked={allSelected}
          onChange={() => {
            if (allSelected) {
              onSelectionChanged?.({
                selectedRowKeys: [],
                selectedRowsData: [],
              });
            } else {
              const validRows = currentData.filter(
                (row) => row && typeof row._rowIndex !== "undefined"
              );
              const allKeys = validRows.map((row) => row._rowIndex);
              onSelectionChanged?.({
                selectedRowKeys: allKeys,
                selectedRowsData: validRows,
              });
            }
          }}
        />
      </div>
    );
  };
};

/**
 * Creates a selection column cell renderer
 * @param {Array} dataSource - Current visible data source
 * @param {Array} selectedRowKeys - Currently selected row keys
 * @param {Function} onSelectionChanged - Callback when selection changes
 * @returns {Function} Cell renderer
 */
export const createSelectionCellRenderer = (
  dataSource,
  selectedRowKeys,
  onSelectionChanged
) => {
  return (cellData) => {
    const isSelected = selectedRowKeys.includes(cellData.data._rowIndex);

    return (
      <div className="tw-flex tw-justify-center">
        <input
          type="checkbox"
          className="tw-w-4 tw-h-4"
          checked={isSelected}
          onChange={() => {
            const newSelectedKeys = isSelected
              ? selectedRowKeys.filter((key) => key !== cellData.data._rowIndex)
              : [...selectedRowKeys, cellData.data._rowIndex];

            if (onSelectionChanged) {
              const selectedRowsData = [];
              const currentData = dataSource || [];
              for (let i = 0; i < currentData.length; i++) {
                const row = currentData[i];
                if (
                  row &&
                  typeof row._rowIndex !== "undefined" &&
                  newSelectedKeys.includes(row._rowIndex)
                ) {
                  selectedRowsData.push(row);
                }
              }

              onSelectionChanged({
                selectedRowKeys: newSelectedKeys,
                selectedRowsData,
              });
            }
          }}
        />
      </div>
    );
  };
};

/**
 * Creates a status column cell renderer
 * @param {Array} parsedData - Full parsed data array
 * @param {Set} fixedRows - Set of fixed row indices
 * @param {Array} validationErrors - Array of validation errors
 * @param {Function} onValidateData - Callback to trigger validation
 * @returns {Function} Cell renderer
 */
export const createStatusCellRenderer = (
  parsedData,
  fixedRows,
  validationErrors,
  onValidateData
) => {
  return (cellData) => {
    const { data, component, rowIndex } = cellData;
    if (!data) return null;

    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === data._rowIndex
    );

    // Check if this row has been fixed
    const isFixed = fixedRows.has(data._rowIndex) || data._isFixed;

    // Check if this row has any validation error
    const rowErrors = validationErrors.filter(
      (err) => err.rowIndex === dataRowIndex
    );

    // Row is valid (no errors and not previously had errors)
    if (rowErrors.length === 0 && !isFixed) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
          <i className="fa-light fa-check-circle"></i>
          Valid
        </span>
      );
    }

    // Row was fixed (errors were resolved)
    if (rowErrors.length === 0 && isFixed) {
      return (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-bg-emerald-100 tw-text-emerald-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
          <i className="fa-light fa-check-double"></i>
          Fixed
        </span>
      );
    }

    // Determine error type for styling
    const duplicateError = rowErrors.find((err) => err.isDuplicate);
    const isDuplicate = !!duplicateError;
    const duplicateWithRows = duplicateError?.duplicateWithRows || [];
    const errorFields = [...new Set(rowErrors.map((err) => err.field))];

    const handleEditCell = (fieldName) => {
      try {
        const colIndex = component.getVisibleColumnIndex(fieldName);
        if (colIndex >= 0) {
          setTimeout(() => {
            try {
              component.editCell(rowIndex, colIndex);
            } catch (err) {
              console.warn("Could not edit cell:", err);
            }
          }, 50);
        }
      } catch (err) {
        console.warn("Error handling fix click:", err);
      }
    };

    // For duplicates, show which rows conflict
    if (isDuplicate) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
          <span className="tw-text-[10px] tw-text-rose-600 tw-font-medium">
            <i className="fa-light fa-copy tw-mr-1"></i>
            Dup w/ Row {duplicateWithRows.map((i) => i + 1).join(", ")}
          </span>
          <button
            className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-rose-100 tw-text-rose-700 hover:tw-bg-rose-200"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCell("isNightShift");
            }}
            title="Toggle Night Shift to differentiate from duplicate"
          >
            <i className="fa-light fa-moon"></i>
            Set Shift
          </button>
        </div>
      );
    }

    // Check if this is a backend error
    const isBackendError = rowErrors.some((err) => err.isBackendError);
    const editableFields = [
      "vehicleName",
      "locationName",
      "driverName",
      "date",
      "isNightShift",
    ];
    const firstEditableError = errorFields.find((f) =>
      editableFields.includes(f)
    );

    // Backend server errors - show in red
    if (isBackendError) {
      return (
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
          <span className="tw-text-[10px] tw-text-red-600 tw-font-medium">
            <i className="fa-light fa-server tw-mr-1"></i>
            Server Error
          </span>
          <button
            className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-red-100 tw-text-red-700 hover:tw-bg-red-200"
            onClick={(e) => {
              e.stopPropagation();
              if (firstEditableError) {
                handleEditCell(firstEditableError);
              }
            }}
            title={`Click to fix: ${rowErrors
              .map((e) => e.message)
              .join("; ")}`}
          >
            <i className="fa-light fa-edit"></i>
            Fix
          </button>
        </div>
      );
    }

    // Non-duplicate frontend errors
    return (
      <button
        className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium tw-border-0 tw-cursor-pointer tw-transition-all tw-bg-amber-100 tw-text-amber-700 hover:tw-bg-amber-200"
        onClick={(e) => {
          e.stopPropagation();
          if (firstEditableError) {
            handleEditCell(firstEditableError);
          }
        }}
        title={`Click to fix: ${rowErrors.map((e) => e.message).join("; ")}`}
      >
        <i className="fa-light fa-edit"></i>
        Fix ({rowErrors.length})
      </button>
    );
  };
};

/**
 * Creates a night shift column cell renderer with duplicate toggle functionality
 * @param {Array} parsedData - Full parsed data array
 * @param {Array} validationErrors - Array of validation errors
 * @param {Function} onValidateData - Callback to trigger validation
 * @returns {Function} Cell renderer
 */
export const createNightShiftCellRenderer = (
  parsedData,
  validationErrors,
  onValidateData
) => {
  return (cellData) => {
    const { data, component, rowIndex } = cellData;
    if (!data) return null;

    const dataRowIndex = parsedData.findIndex(
      (item) => item._rowIndex === data._rowIndex
    );

    // Check if this row has a duplicate error
    const duplicateError = validationErrors.find(
      (err) => err.rowIndex === dataRowIndex && err.isDuplicate
    );
    const hasDuplicateError = !!duplicateError;

    // If has duplicate error, show toggle button
    if (hasDuplicateError) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
          <button
            className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium tw-border tw-cursor-pointer tw-transition-all ${
              data.isNightShift
                ? "tw-bg-indigo-500 tw-text-white tw-border-indigo-600 hover:tw-bg-indigo-600"
                : "tw-bg-amber-500 tw-text-white tw-border-amber-600 hover:tw-bg-amber-600"
            }`}
            onClick={(e) => {
              e.stopPropagation();

              // Toggle the isNightShift value for current row
              const newValue = !data.isNightShift;
              component.cellValue(rowIndex, "isNightShift", newValue);

              // Find and update the duplicate record to opposite shift
              const currentDate = data.date
                ? new Date(data.date).toDateString()
                : null;
              const currentVehicle = data.vehicleName?.trim().toLowerCase();

              if (currentDate && currentVehicle) {
                // Find all rows with same vehicle and date
                parsedData.forEach((row, idx) => {
                  if (idx === dataRowIndex) return; // Skip current row

                  const rowDate = row.date
                    ? new Date(row.date).toDateString()
                    : null;
                  const rowVehicle = row.vehicleName?.trim().toLowerCase();

                  // If this is the duplicate record (same vehicle, same date)
                  if (
                    rowDate === currentDate &&
                    rowVehicle === currentVehicle
                  ) {
                    // Set it to the opposite shift of what we just set
                    const duplicateRowIndex = component.getRowIndexByKey(row);
                    if (duplicateRowIndex >= 0) {
                      component.cellValue(
                        duplicateRowIndex,
                        "isNightShift",
                        !newValue // Opposite of current row's new value
                      );
                    }
                  }
                });
              }

              // Trigger save and re-validation
              component.saveEditData();

              if (onValidateData) {
                setTimeout(() => {
                  onValidateData();
                }, 100);
              }
            }}
            title={`Click to set as ${
              data.isNightShift ? "Day" : "Night"
            } shift`}
          >
            <i
              className={`fa-light ${
                data.isNightShift ? "fa-sun" : "fa-moon"
              } tw-mr-1`}
            ></i>
            {data.isNightShift ? "→ Day" : "→ Night"}
          </button>
        </div>
      );
    }

    // Normal display
    return (
      <div className="tw-flex tw-items-center tw-justify-center">
        {data.isNightShift ? (
          <span className="tw-bg-indigo-100 tw-text-indigo-800 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
            <i className="fa-light fa-moon tw-mr-1"></i>Night
          </span>
        ) : (
          <span className="tw-bg-amber-50 tw-text-amber-700 tw-px-2 tw-py-0.5 tw-rounded tw-text-xs tw-font-medium">
            <i className="fa-light fa-sun tw-mr-1"></i>Day
          </span>
        )}
      </div>
    );
  };
};
