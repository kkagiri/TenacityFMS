/**
 * File: ReportsMain.js
 * Purpose: Define routes for the Reports module
 * Dependencies: react-router-dom, ReportsLayout, report pages
 * Last Modified: 2026-01-19
 *
 * Key Components:
 * - ReportsMain: Routes and layout wrapper for reports
 *
 * Report System:
 * - JsReport: Modern report engine with Handlebars templates
 * - DevExtreme: Legacy reports (gallery, tank volume history)
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReportsLayout from "./layout/ReportsLayout";
import ReportsDashboard from "./ReportsDashboard";
import ReportGallery from "./ReportGallery";
import TankVolumeHistoryReport from "./TankVolumeHistoryReport";
import ReportScheduleSettings from "./ReportScheduleSettings";

// Import existing report components
import FuelReportImporter from "../FuelReportImporter/FuelReportImporter";
import BatchImportPage from "../FuelReportImporter/components/batch/BatchImportPage";
import ConsumptionBasedOnRefills from "./consumption/consumptionBasedonRefills";
import PTSOfflineReport from "./pts/PTSOfflineReport";

// Vehicle Consumption Report components (moved to vehicles module)
import VehicleConsumptionReport from "../vehicles/consumption/reports/VehicleConsumptionReport";
import VehicleConsumptionReportDetails from "../vehicles/consumption/reports/VehicleConsumptionReportDetails";

// JsReport components - Modern report engine
import { JsReportDesigner, JsReportViewer, JsReportTemplateManager } from "./jsreport";

// Legacy Report Designer redirect (deprecated - use JsReport instead)
import ReportDesignerRedirect from "./ReportDesignerRedirect";

const ReportsMain = () => {
  return (
    <ReportsLayout>
      <Routes>
        {/* Default dashboard route */}
        <Route index element={<ReportsDashboard />} />
        <Route path="dashboard" element={<ReportsDashboard />} />

        {/* DevExtreme Reports (Legacy) */}
        <Route path="gallery" element={<ReportGallery />} />
        <Route
          path="tank-volume-history"
          element={<TankVolumeHistoryReport />}
        />

        {/* JsReport - Modern Report Engine */}
        <Route path="templates" element={<JsReportTemplateManager />} />
        <Route path="viewer" element={<JsReportViewer />} />
        <Route path="viewer/:reportType" element={<JsReportViewer />} />
        <Route path="designer" element={<JsReportDesigner />} />
        <Route path="designer/:templateName" element={<JsReportDesigner />} />

        {/* Legacy Report Designer Routes - redirects to standalone ASP.NET Core app */}
        <Route path="legacy-designer" element={<ReportDesignerRedirect />} />
        <Route path="legacy-designer/:reportName" element={<ReportDesignerRedirect />} />

        {/* Data Import Routes */}
        <Route path="fuel-importer" element={<FuelReportImporter />} />
        <Route path="fuel-importer/batch" element={<BatchImportPage />} />
        <Route path="fuel-importer/*" element={<FuelReportImporter />} />
        <Route path="scheduled-emails" element={<ReportScheduleSettings />} />

        {/* Consumption Reports Routes */}
        <Route
          path="consumption-refills"
          element={<ConsumptionBasedOnRefills />}
        />
        <Route
          path="consumption-refills/*"
          element={<ConsumptionBasedOnRefills />}
        />

        {/* Vehicle Consumption Report Routes */}
        <Route
          path="vehicle-consumption"
          element={<VehicleConsumptionReport />}
        />
        <Route
          path="vehicle-consumption/details/:vehicleId"
          element={<VehicleConsumptionReportDetails />}
        />

        {/* PTS Reports Routes */}
        <Route path="pts-offline" element={<PTSOfflineReport />} />

        {/* Fallback route */}
        <Route
          path="*"
          element={<Navigate to="/reports/dashboard" replace />}
        />
      </Routes>
    </ReportsLayout>
  );
};

export default ReportsMain;
