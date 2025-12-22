/**
 * Fuel Report Importer Module
 *
 * This module provides two main import modes:
 *
 * 1. SingleFileImporter (FuelReportImporter) - For importing one file at a time
 *    - Detailed preview and editing
 *    - Row-level validation
 *    - Manual site and date selection
 *    - Components in ./components/single/
 *
 * 2. BatchImportPage - For importing multiple files at once
 *    - Batch file selection
 *    - Parallel processing
 *    - SignalR progress tracking
 *    - Components in ./components/batch/
 *
 * Shared Components (./components/):
 * - ImportResultDialog: Result display dialog
 * - ImportCalendarPopup: Calendar view for import history
 */

// Main importer components
export { default as SingleFileImporter } from "./FuelReportImporter";
export { default as FuelReportImporter } from "./FuelReportImporter"; // Backward compatibility
export { default as BatchImportPage } from "./components/batch/BatchImportPage";

// Hooks
export {
  useImportUtils,
  useFileHandling,
  useExcelParsing,
  useDataValidation,
  useImportSubmission,
  useDataProcessing,
  useValidation,
  useImporterState,
  useImportEffects,
  useImportHandlers,
} from "./hooks";

// Utilities
export {
  cleanNumericValue,
  formatNumericValue,
  formatDate,
  toIsoDateOrToday,
  formatFileSize,
  detectSiteFromFilename,
  detectMonthFromFilename,
  getColumnValue,
  findVehicleByName,
  findVehicleById,
  findSiteByName,
  findSiteById,
} from "./utils";
