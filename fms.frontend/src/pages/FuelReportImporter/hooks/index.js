/**
 * File: hooks/index.js
 * Purpose: Central export for all import-related hooks
 *
 * Hook Architecture:
 * - useImportUtils: Facade hook (backward compatible, composes all hooks below)
 * - useFileHandling: File selection, toast messages, site detection
 * - useExcelParsing: Excel file parsing and data mapping
 * - useDataValidation: Data validation logic
 * - useImportSubmission: Import submission and retry logic
 * - useImporterState: Centralized state management for FuelReportImporter
 * - useImportEffects: Centralized useEffect hooks for FuelReportImporter
 * - useImportHandlers: Handler functions for FuelReportImporter
 */

// Main facade hook (backward compatible)
export { default as useImportUtils } from "./useImportUtils";

// Specialized hooks for useImportUtils decomposition
export { default as useFileHandling } from "./useFileHandling";
export { default as useExcelParsing } from "./useExcelParsing";
export { default as useDataValidation } from "./useDataValidation";
export { default as useImportSubmission } from "./useImportSubmission";

// Specialized hooks for FuelReportImporter decomposition
export { default as useImporterState } from "./useImporterState";
export { default as useImportEffects } from "./useImportEffects";
export { default as useImportHandlers } from "./useImportHandlers";

// Additional hooks for data processing and validation
export { default as useDataProcessing } from "./useDataProcessing";
export { default as useValidation } from "./useValidation";
