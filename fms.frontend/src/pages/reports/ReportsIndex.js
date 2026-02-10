/**
 * File: ReportsIndex.js
 * Purpose: Barrel exports for the Reports module
 * Last Modified: 2026-02-09
 */

export { default as ReportsMain } from './ReportsMain';
export { default as ReportsDashboard } from './ReportsDashboard';

// ── New JSReport-first modules ──
export { ReportEngine, ReportParameterForm, ReportFormatSelector, ReportOutputViewer } from './engine';
export { TemplateManager, TemplateDesigner } from './templates';
export { ReportScheduleManager, ReportScheduleForm } from './scheduling';
export { ReportMonitorDashboard, ReportExecutionLog } from './monitoring';
export { getReportSource, getAllReportSources, getReportSourcesByCategory, getCategories } from './sources';

// ── Legacy (kept for backward compat) ──
export { default as ReportGallery } from './ReportGallery';
export { default as TankVolumeHistoryReport } from './TankVolumeHistoryReport';
