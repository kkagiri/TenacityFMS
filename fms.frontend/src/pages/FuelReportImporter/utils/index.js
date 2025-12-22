/**
 * File: index.js
 * Purpose: Central export for all FuelReportImporter utilities
 *
 * Folder Structure:
 *   utils/
 *   ├── formatting/  - Data formatting and cleaning (cleanNumericValue, formatDate, etc.)
 *   ├── parsing/     - File parsing and detection (detectSiteFromFilename, getColumnValue, etc.)
 *   ├── lookup/      - Entity lookup functions (findVehicleByName, findSiteById, etc.)
 *   └── index.js     - Central re-export (this file)
 */

// Formatting utilities
export {
  cleanNumericValue,
  formatNumericValue,
  formatDate,
  toIsoDateOrToday,
  formatFileSize,
} from "./formatting";

// Parsing utilities
export {
  detectSiteFromFilename,
  detectMonthFromFilename,
  getColumnValue,
} from "./parsing";

// Lookup utilities
export {
  findVehicleByName,
  findVehicleById,
  findSiteByName,
  findSiteById,
} from "./lookup";
