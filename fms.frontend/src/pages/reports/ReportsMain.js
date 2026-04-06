/**
 * File: ReportsMain.js
 * Purpose: Define routes for the Reports module — JSReport-first architecture
 * Dependencies: react-router-dom, ReportsLayout, report pages
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportsMain: Routes and layout wrapper for reports
 *
 * Report System:
 * - Report Engine: Central orchestrator with source-based parameter forms
 * - Templates: JSReport Handlebars template management & design
 * - Scheduling: Schedule report delivery (who, when, how often)
 * - Monitoring: Track report execution history & performance
 *
 * Legacy routes are kept for backward compatibility but redirect to engine.
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReportsLayout from "./layout/ReportsLayout";
import ReportsDashboard from "./ReportsDashboard";
import ReportListPage from "./ReportListPage";

// ──── NEW JSReport-first Modules ────
import { ReportEngine } from "./engine";
import { TemplateManager, TemplateDesigner } from "./templates";
import { ReportScheduleManager } from "./scheduling";
import { ReportMonitorDashboard } from "./monitoring";

// ──── Data Import (unchanged) ────
import FuelReportImporter from "../FuelReportImporter/FuelReportImporter";
import BatchImportPage from "../FuelReportImporter/components/batch/BatchImportPage";
import ImportManagementPage from "./import-management/ImportManagementPage";

// ──── Legacy / Kept-for-now routes ────
import TankVolumeHistoryReport from "./TankVolumeHistoryReport";
import ConsumptionBasedOnRefills from "./consumption/consumptionBasedonRefills";
import PTSOfflineReport from "./pts/PTSOfflineReport";
import VehicleConsumptionReport from "../vehicles/consumption/reports/VehicleConsumptionReport";
import VehicleConsumptionReportDetails from "../vehicles/consumption/reports/VehicleConsumptionReportDetails";
import WarningLetterListPage from "../vehicles/warningLetters/WarningLetterListPage";
import WarningLetterFormPage from "../vehicles/warningLetters/WarningLetterFormPage";
import WarningLetterPreviewPage from "../vehicles/warningLetters/WarningLetterPreviewPage";

const ReportsMain = () => {
  return (
    <ReportsLayout>
      <Routes>
        {/* ── Dashboard ── */}
        <Route index element={<ReportsDashboard />} />
        <Route path="dashboard" element={<ReportsDashboard />} />

        {/* ── Report List / Gallery (unified — grid + tile toggle) ── */}
        <Route path="list" element={<ReportListPage />} />
        <Route path="all" element={<ReportListPage />} />
        <Route path="gallery" element={<Navigate to="/reports/list?view=gallery" replace />} />

        {/* ── Report Engine (new) ── */}
        <Route path="engine" element={<ReportEngine />} />
        <Route path="engine/:sourceId" element={<ReportEngine />} />

        {/* ── Template Management (new) ── */}
        <Route path="templates" element={<TemplateManager />} />
        <Route path="templates/designer/:templateName" element={<TemplateDesigner />} />

        {/* ── Scheduling (new) ── */}
        <Route path="scheduling" element={<ReportScheduleManager />} />
        <Route path="scheduling/new" element={<ReportScheduleManager />} />

        {/* ── Monitoring (new) ── */}
        <Route path="monitoring" element={<ReportMonitorDashboard />} />

        {/* ── Data Import (unchanged) ── */}
        <Route path="fuel-importer" element={<FuelReportImporter />} />
        <Route path="fuel-importer/batch" element={<BatchImportPage />} />
        <Route path="fuel-importer/*" element={<FuelReportImporter />} />
        <Route path="import-management" element={<ImportManagementPage />} />
        <Route path="scheduled-emails" element={<Navigate to="/reports/scheduling" replace />} />

        {/* ── Legacy routes (kept for backward compat) ── */}
        <Route path="tank-volume-history" element={<TankVolumeHistoryReport />} />
        <Route path="consumption-refills" element={<ConsumptionBasedOnRefills />} />
        <Route path="consumption-refills/*" element={<ConsumptionBasedOnRefills />} />
        <Route path="vehicle-consumption" element={<VehicleConsumptionReport />} />
        <Route path="vehicle-consumption/details/:vehicleId" element={<VehicleConsumptionReportDetails />} />
        <Route path="warning-letters" element={<WarningLetterListPage />} />
        <Route path="warning-letters/new" element={<WarningLetterFormPage />} />
        <Route path="warning-letters/:id/edit" element={<WarningLetterFormPage />} />
        <Route path="warning-letters/:id/preview" element={<WarningLetterPreviewPage />} />
        <Route path="pts-offline" element={<PTSOfflineReport />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/reports/dashboard" replace />} />
      </Routes>
    </ReportsLayout>
  );
};

export default ReportsMain;
