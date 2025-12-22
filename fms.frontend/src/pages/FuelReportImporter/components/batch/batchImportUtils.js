/**
 * File: batchImportUtils.js
 * Purpose: Utility functions for batch import operations
 * Last Modified: 2025-12-16
 *
 * NOTE: Core utilities have been consolidated into ../utils/
 * This file re-exports them for backward compatibility and adds batch-specific functions.
 */

// Import utilities locally for use in mapping functions below
import { getColumnValue } from "../../utils/parsing";

// Re-export consolidated utilities for backward compatibility
export { formatFileSize, cleanNumericValue } from "../../utils/formatting";

export {
  detectSiteFromFilename,
  detectMonthFromFilename,
  getColumnValue,
} from "../../utils/parsing";

export { findVehicleByName, findSiteByName } from "../../utils/lookup";

/**
 * Map Excel row data to km/l report format
 * @param {Object} row - Excel row data
 * @param {number} index - Row index
 * @param {Function} findVehicle - Function to find vehicle by name
 * @param {Object} fileData - File metadata
 * @param {Array} sites - Available sites
 * @returns {Object} Mapped data object
 */
export const mapKmLReportRow = (row, index, findVehicle, fileData, sites) => {
  // Use flexible column matching
  const vehicleName = getColumnValue(row, [
    "Vehicle Name",
    "Vehicle",
    "VEHICLE",
    "Hyoung No",
    "Reg#",
  ]);
  const vehicle = findVehicle(vehicleName);
  const site = sites.find((s) => s.id === fileData.siteId);

  const rawDateValue = getColumnValue(row, [
    "Date",
    "date",
    "DATE",
    "Date (dd/mm/yyyy)",
    "Date (DD/MM/YYYY)",
  ]);
  const dateValue = rawDateValue ? new Date(rawDateValue) : null;

  const shiftValue = getColumnValue(row, [
    "Shift",
    "shift",
    "SHIFT",
    "Day/Night",
  ]);

  return {
    date: dateValue,
    vehicleName: vehicleName,
    vehicleId: vehicle?.vehicleId || null,
    siteId: fileData.siteId,
    siteName: site?.name || "",
    driverName: getColumnValue(row, ["Driver", "Driver Name", "driver name"]),
    totalDistance:
      parseFloat(
        getColumnValue(row, [
          "Km Covered",
          "Total Distance",
          "Total Distance (GPS)",
          "km covered",
          "total distance",
        ])
      ) || 0,
    totalFuel:
      parseFloat(
        getColumnValue(row, ["Fuel", "Total Fuel", "fuel", "total fuel"])
      ) || 0,
    fuelEfficiency:
      parseFloat(
        getColumnValue(row, ["Km/ Litre", "Fuel Efficiency", "km/l", "Km/L"])
      ) || 0,
    maxSpeed: parseFloat(getColumnValue(row, ["Max Speed", "max speed"])) || 0,
    avgSpeed:
      parseFloat(
        getColumnValue(row, ["Avg Speed", "Average Speed", "avg speed"])
      ) || 0,
    comment: getColumnValue(row, [
      "Comment",
      "Comments",
      "comment",
      "comments",
    ]),
    isNightShift: (shiftValue || "").toLowerCase().includes("night"),
    isKmperLiter: true,
    engHours: 0,
    workingExpectedAverage:
      parseFloat(
        getColumnValue(row, [
          "Expected Average",
          "Expected Fuel Avg (km/l)",
          "expected average",
        ])
      ) || 0,
    fuelLost: parseFloat(getColumnValue(row, ["Fuel Lost", "fuel lost"])) || 0,
    _rowIndex: index,
    skipDuplicates: fileData.duplicateHandling === "skip",
  };
};

/**
 * Map Excel row data to l/hr report format
 * @param {Object} row - Excel row data
 * @param {number} index - Row index
 * @param {Function} findVehicle - Function to find vehicle by name
 * @param {Object} fileData - File metadata
 * @param {Array} sites - Available sites
 * @returns {Object} Mapped data object
 */
export const mapLHrReportRow = (row, index, findVehicle, fileData, sites) => {
  // Use flexible column matching to handle typos, newlines, etc.
  const vehicleName = getColumnValue(row, [
    "Vehicle Name",
    "Vehice Name",
    "vehice name",
    "Vehicle",
    "VEHICLE",
    "Hyoung No",
    "Reg#",
  ]);
  const vehicle = findVehicle(vehicleName);
  const site = sites.find((s) => s.id === fileData.siteId);

  // Date with multiple column name variants
  const rawDateValue = getColumnValue(row, [
    "Date",
    "date",
    "DATE",
    "Date (dd/mm/yyyy)",
    "Date (DD/MM/YYYY)",
  ]);
  const dateValue = rawDateValue ? new Date(rawDateValue) : null;

  const commentText = getColumnValue(row, [
    "Comments",
    "Comment",
    "comments",
    "comment",
  ]);
  const shiftValue = getColumnValue(row, [
    "Shift",
    "shift",
    "SHIFT",
    "Day/Night",
    "Day / Night",
  ]);
  const isNightShift =
    (shiftValue || "").toLowerCase().includes("night") ||
    (commentText || "").toLowerCase().includes("night");

  return {
    date: dateValue,
    vehicleName: vehicleName,
    vehicleId: vehicle?.vehicleId || null,
    siteId: fileData.siteId,
    siteName: site?.name || "",
    // Driver name with typo variants
    driverName: getColumnValue(row, [
      "Driver",
      "Driver Name",
      "driver name",
      "Empoyee No",
      "Employee No",
      "empoyee no",
    ]),
    // Engine hours with typo variants
    engHours:
      parseFloat(
        getColumnValue(row, [
          "Working Hrs",
          "Runtime Eng hrs",
          "Engine Hours",
          "working hrs",
          "runtime eng hrs",
        ])
      ) || 0,
    // Total fuel with typo variants (lowercase "Total fuel")
    totalFuel:
      parseFloat(
        getColumnValue(row, ["Total fuel", "Total Fuel", "Fuel", "total fuel"])
      ) || 0,
    // Fuel efficiency with typo variants ("Fue Eff (/hr)" from L/Hr template)
    fuelEfficiency:
      parseFloat(
        getColumnValue(row, [
          "Fuel Eff (l/hr)",
          "Ltr/Hr",
          "Fuel Efficiency",
          "Fue Eff (/hr)",
          "fue eff (/hr)",
          "fuel eff (l/hr)",
        ])
      ) || 0,
    workingExpectedAverage:
      parseFloat(
        getColumnValue(row, [
          "Expected Fuel Eff",
          "Expected Average",
          "expected fuel eff",
        ])
      ) || 0,
    fuelLost:
      parseFloat(
        getColumnValue(row, ["Fuel lost", "Fuel Lost", "fuel lost"])
      ) || 0,
    // Flow meter columns with variants
    flowMeterEngineHrs:
      parseFloat(
        getColumnValue(row, [
          "Flow meter Eng Hrs",
          "Flow Meter Engine Hrs",
          "flow meter eng hrs",
        ])
      ) || 0,
    flowMeterFuelUsed:
      parseFloat(
        getColumnValue(row, [
          "Flow meter Total fuel",
          "Flow Meter Fuel Used",
          "flow meter total fuel",
        ])
      ) || 0,
    flowMeterEffiency:
      parseFloat(
        getColumnValue(row, [
          "Flow meter Fuel eff",
          "Flow Meter Efficiency",
          "flow meter fuel eff",
        ])
      ) || 0,
    flowMeterFuelLost:
      parseFloat(
        getColumnValue(row, [
          "Flow meter Fuel lost",
          "Flow Meter Fuel Lost",
          "flow meter fuel lost",
        ])
      ) || 0,
    excessWorkingHrsCost:
      parseFloat(
        getColumnValue(row, [
          "Excessive Hours (10)",
          "Excess Working Hrs Cost",
          "excessive hours (10)",
        ])
      ) || 0,
    totalDistance:
      parseFloat(getColumnValue(row, ["Total Distance", "total distance"])) ||
      0,
    comment: commentText,
    isNightShift: isNightShift,
    isKmperLiter: false,
    maxSpeed: 0,
    avgSpeed: 0,
    _rowIndex: index,
    skipDuplicates: fileData.duplicateHandling === "skip",
  };
};

/**
 * Normalize a date value to a consistent string format for comparison
 * @param {*} dateValue - Date value (Date object, string, etc.)
 * @returns {string} Normalized date string (YYYY-MM-DD) or empty string
 */
const normalizeDateForComparison = (dateValue) => {
  if (!dateValue) return "";

  try {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue).trim().toLowerCase();

    // Format as YYYY-MM-DD for consistent comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return String(dateValue).trim().toLowerCase();
  }
};

/**
 * Normalize shift value for comparison
 * @param {*} shiftValue - Shift value (boolean, string, etc.)
 * @returns {string} Normalized shift string ("night" or "day")
 */
const normalizeShiftForComparison = (shiftValue) => {
  if (shiftValue === true) return "night";
  if (shiftValue === false) return "day";
  if (!shiftValue) return "day";

  const strValue = String(shiftValue).toLowerCase().trim();
  return strValue.includes("night") ? "night" : "day";
};

/**
 * Create a duplicate key for a row
 * @param {Object} row - Row data
 * @returns {string} Duplicate key
 */
export const createDuplicateKey = (row) => {
  const vehicleName = (row.vehicleName || row._vehicleName || "")
    .toString()
    .trim()
    .toLowerCase();
  const dateStr = normalizeDateForComparison(row.date || row._dateValue);
  const shiftStr = normalizeShiftForComparison(
    row.isNightShift ?? row._shiftValue
  );

  return `${vehicleName}|${dateStr}|${shiftStr}`;
};

/**
 * Shared validation function for batch import data
 * Used by both BatchImportPage.js and BatchFilePreviewPopup.js
 * @param {Array} data - Parsed data array
 * @param {string} reportType - Report type ("km/l" or "l/hr")
 * @param {Array} vehicles - Available vehicles list for vehicle ID lookup
 * @param {Object} options - Additional options
 * @param {boolean} options.returnObjects - If true, return error objects; if false, return error strings
 * @returns {Array} Array of validation errors
 */
export const validateBatchImportData = (
  data,
  reportType,
  vehicles = [],
  options = {}
) => {
  const { returnObjects = true } = options;
  const errors = [];

  // First pass: validate each row
  data.forEach((row, index) => {
    const vehicleName = row.vehicleName || row._vehicleName || "";
    const dateValue = row.date || row._dateValue;
    const vehicleId = row.vehicleId;

    // Vehicle name validation
    if (!vehicleName) {
      if (returnObjects) {
        errors.push({
          rowIndex: index,
          field: "vehicleName",
          message: `Row ${index + 1}: Vehicle name is required`,
          isDuplicate: false,
        });
      } else {
        errors.push(`Row ${index + 1}: Missing vehicle name`);
      }
    } else if (!vehicleId && vehicles.length > 0) {
      // Check if vehicle exists in system
      const matchedVehicle = vehicles.find(
        (v) =>
          v.hyoungNo?.toLowerCase() === vehicleName.toLowerCase() ||
          v.registrationNo?.toLowerCase() === vehicleName.toLowerCase() ||
          v.name?.toLowerCase() === vehicleName.toLowerCase()
      );
      if (!matchedVehicle) {
        if (returnObjects) {
          errors.push({
            rowIndex: index,
            field: "vehicleName",
            message: `Row ${
              index + 1
            }: Vehicle "${vehicleName}" not found in system`,
            isDuplicate: false,
          });
        } else {
          errors.push(
            `Row ${index + 1}: Vehicle "${vehicleName}" not found in system`
          );
        }
      }
    }

    // Date validation
    if (!dateValue) {
      if (returnObjects) {
        errors.push({
          rowIndex: index,
          field: "date",
          message: `Row ${index + 1}: Date is required`,
          isDuplicate: false,
        });
      } else {
        errors.push(`Row ${index + 1}: Missing date`);
      }
    } else {
      const dateObj =
        dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(dateObj.getTime())) {
        if (returnObjects) {
          errors.push({
            rowIndex: index,
            field: "date",
            message: `Row ${index + 1}: Invalid date format`,
            isDuplicate: false,
          });
        } else {
          errors.push(`Row ${index + 1}: Invalid date format`);
        }
      }
    }

    // L/Hr specific validations
    if (reportType === "l/hr") {
      const locationName = row.locationName || row.siteName;
      const siteId = row.siteId;
      if (!locationName && !siteId) {
        if (returnObjects) {
          errors.push({
            rowIndex: index,
            field: "locationName",
            message: `Row ${index + 1}: Location is required for l/hr reports`,
            isDuplicate: false,
          });
        } else {
          errors.push(
            `Row ${index + 1}: Location is required for l/hr reports`
          );
        }
      }
    }
  });

  // Second pass: check for duplicates within the file
  const seen = new Map();
  data.forEach((row, index) => {
    const vehicleName = row.vehicleName || row._vehicleName || "";
    const dateValue = row.date || row._dateValue;

    // Only check duplicates if vehicle and date are present
    if (vehicleName && dateValue) {
      const key = createDuplicateKey(row);

      if (seen.has(key)) {
        const firstRowIndex = seen.get(key);
        const shiftStr = normalizeShiftForComparison(
          row.isNightShift ?? row._shiftValue
        );
        const dateStr = normalizeDateForComparison(dateValue);

        if (returnObjects) {
          errors.push({
            rowIndex: index,
            field: "vehicleName",
            message: `Row ${
              index + 1
            }: Duplicate entry - same vehicle "${vehicleName}", date "${dateStr}", and shift "${shiftStr}" as Row ${
              firstRowIndex + 1
            }`,
            isDuplicate: true,
          });
        } else {
          errors.push(
            `Row ${
              index + 1
            }: Duplicate entry - same vehicle "${vehicleName}", date "${dateStr}", and shift "${shiftStr}" as Row ${
              firstRowIndex + 1
            }`
          );
        }
      } else {
        seen.set(key, index);
      }
    }
  });

  return errors;
};
