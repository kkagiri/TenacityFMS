/**
 * File: utils/formatting/index.js
 * Purpose: Data formatting and cleaning utilities
 */

/**
 * Cleans numeric values from various formats (string, number, etc.)
 * @param {*} value - The value to clean
 * @returns {number|null} Cleaned numeric value or null
 */
export const cleanNumericValue = (value) => {
  if (typeof value === "number") return value;
  if (value === undefined || value === null || value === "") return null;
  const strValue = String(value)
    .replace(/[^\d.-]/g, "")
    .replace(/\.{2,}/g, ".");
  if (!strValue) return null;
  const num = parseFloat(strValue);
  return isNaN(num) ? null : num;
};

/**
 * Formats a numeric value for display
 * @param {number|null} value - The value to format
 * @returns {string} Formatted string
 */
export const formatNumericValue = (value) => {
  if (value === 0 || value === 0.0) return "0.00";
  return value === null || value === undefined ? "" : value.toString();
};

/**
 * Formats an Excel date (serial number or Date object) to a JavaScript Date
 * @param {number|Date|string} excelDate - The date to format
 * @returns {Date|null} JavaScript Date object or null
 */
export const formatDate = (excelDate) => {
  if (excelDate === null || excelDate === undefined) return null;

  let date;
  if (typeof excelDate === "number" && excelDate > 0) {
    // Excel serial date number
    date = new Date(Date.UTC(1900, 0, excelDate - 1));
  } else {
    date = new Date(excelDate);
  }

  if (!isNaN(date.getTime())) {
    return date;
  } else {
    return null;
  }
};

/**
 * Converts a date value to ISO date string (YYYY-MM-DD) or returns today's date
 * @param {*} value - Date value to convert
 * @returns {string} ISO date string
 */
export const toIsoDateOrToday = (value) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  const date = formatDate(value);
  if (date) {
    return date.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
