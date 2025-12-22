/**
 * File: useDataValidation.js
 * Purpose: Hook for data validation logic
 * Extracted from: useImportUtils.js
 */

/**
 * Hook for data validation functionality
 */
const useDataValidation = ({
  sites,
  vehicles,
  reportType,
  selectedSite,
  parsedData,
}) => {
  /**
   * Validates the parsed data and returns an array of validation errors
   */
  const validateData = (dataToValidate = null) => {
    const data = dataToValidate || parsedData;
    if (!data || data.length === 0) return [];

    const errors = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      const rowNumber = row._rowIndex !== undefined ? row._rowIndex + 1 : index + 1;

      // Common validations for all report types
      if (!row.vehicleName || row.vehicleName.trim() === "") {
        rowErrors.push("Vehicle name is empty");
      } else if (row.vehicleId === 0) {
        rowErrors.push(`Vehicle "${row.vehicleName}" not found in system`);
      }

      // Check if the vehicle exists in the vehicles list
      if (row.vehicleName && row.vehicleName.trim() !== "") {
        const vehicleExists = vehicles.some(
          (v) =>
            v.hyoungNo &&
            v.hyoungNo.toLowerCase().trim() ===
              row.vehicleName.toLowerCase().trim()
        );
        if (!vehicleExists) {
          rowErrors.push(`Vehicle "${row.vehicleName}" not found in database`);
        }
      }

      // Date validation
      if (!row.date) {
        rowErrors.push("Date is missing");
      }

      // Report-type specific validations
      if (reportType === "km/l") {
        // KM/L specific validations
        if (row.siteId === 0 && selectedSite) {
          row.siteId = parseInt(selectedSite);
        }

        if (row.siteId === 0) {
          rowErrors.push("Site is not selected");
        }

        // Validate numeric fields
        if (row.totalDistance !== undefined && isNaN(row.totalDistance)) {
          rowErrors.push("Total distance is not a valid number");
        }

        if (row.totalFuel !== undefined && isNaN(row.totalFuel)) {
          rowErrors.push("Total fuel is not a valid number");
        }

        if (row.fuelEfficiency !== undefined && isNaN(row.fuelEfficiency)) {
          rowErrors.push("Fuel efficiency is not a valid number");
        }
      } else if (reportType === "l/hr") {
        // L/HR specific validations
        if (row.siteId === 0 && row.locationName) {
          const siteMatch = sites.find(
            (s) =>
              s.name &&
              s.name.toLowerCase().trim() ===
                row.locationName.toLowerCase().trim()
          );
          if (siteMatch) {
            row.siteId = siteMatch.id;
          }
        }

        if (row.siteId === 0) {
          rowErrors.push(
            `Site "${row.locationName || "unknown"}" not found in system`
          );
        }

        // Validate engine hours
        if (row.engHours !== undefined && isNaN(row.engHours)) {
          rowErrors.push("Engine hours is not a valid number");
        }

        if (row.totalFuel !== undefined && isNaN(row.totalFuel)) {
          rowErrors.push("Total fuel is not a valid number");
        }

        if (row.fuelEfficiency !== undefined && isNaN(row.fuelEfficiency)) {
          rowErrors.push("Fuel efficiency is not a valid number");
        }
      }

      // Add errors for this row
      if (rowErrors.length > 0) {
        errors.push({
          rowIndex: index,
          rowNumber: rowNumber,
          vehicleName: row.vehicleName || "Unknown",
          errors: rowErrors,
        });
      }
    });

    return errors;
  };

  /**
   * Checks if any of the selected rows have validation errors
   */
  const selectedRowsHaveErrors = (selectedKeys) => {
    if (!selectedKeys || selectedKeys.length === 0) return false;
    if (!parsedData || parsedData.length === 0) return false;

    const errors = validateData();
    const errorRowIndices = new Set(errors.map((e) => e.rowIndex));

    return selectedKeys.some((key) => errorRowIndices.has(key));
  };

  /**
   * Returns the count of selected rows that have validation errors
   */
  const countSelectedRowsErrors = (selectedKeys) => {
    if (!selectedKeys || selectedKeys.length === 0) return 0;
    if (!parsedData || parsedData.length === 0) return 0;

    const errors = validateData();
    const errorRowIndices = new Set(errors.map((e) => e.rowIndex));

    return selectedKeys.filter((key) => errorRowIndices.has(key)).length;
  };

  /**
   * Gets validation errors for specific rows
   */
  const getRowErrors = (rowIndex) => {
    const errors = validateData();
    const rowError = errors.find((e) => e.rowIndex === rowIndex);
    return rowError ? rowError.errors : [];
  };

  /**
   * Checks if a specific row has errors
   */
  const rowHasErrors = (rowIndex) => {
    const errors = validateData();
    return errors.some((e) => e.rowIndex === rowIndex);
  };

  return {
    validateData,
    selectedRowsHaveErrors,
    countSelectedRowsErrors,
    getRowErrors,
    rowHasErrors,
  };
};

export default useDataValidation;
