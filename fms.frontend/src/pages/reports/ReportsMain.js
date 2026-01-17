/**
 * File: ReportsMain.js
 * Purpose: Define routes for the Reports module
 * Dependencies: react-router-dom, ReportsLayout, report pages
 * Last Modified: 2026-01-17
 *
 * Key Components:
 * - ReportsMain: Routes and layout wrapper for reports
 */

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReportsLayout from "./layout/ReportsLayout";
import ReportsDashboard from "./ReportsDashboard";
import ReportGallery from "./ReportGallery";
import TankVolumeHistoryReport from "./TankVolumeHistoryReport";

// Import existing report components
import FuelReportImporter from "../FuelReportImporter/FuelReportImporter";
import BatchImportPage from "../FuelReportImporter/components/batch/BatchImportPage";
import ConsumptionBasedOnRefills from "./consumption/consumptionBasedonRefills";
import PTSOfflineReport from "./pts/PTSOfflineReport";

// Vehicle Consumption Report components
import VehicleConsumptionReport from "./vehicleConsumption/VehicleConsumptionReport";
import VehicleConsumptionDetails from "./vehicleConsumption/VehicleConsumptionDetails";

// DevExtreme Report Viewer and Designer components
import DevExtremeReportViewer from "./DevExtremeReportViewer";
import DevExtremeReportDesigner from "./DevExtremeReportDesigner";

const ReportsMain = () => {
  return (
    <ReportsLayout>
      <Routes>
        {/* Default dashboard route */}
        <Route index element={<ReportsDashboard />} />
        <Route path="dashboard" element={<ReportsDashboard />} />

        {/* DevExtreme Reports */}
        <Route path="gallery" element={<ReportGallery />} />
        <Route
          path="tank-volume-history"
          element={<TankVolumeHistoryReport />}
        />

        {/* DevExtreme Report Viewer Routes */}
        <Route path="viewer/:reportName" element={<DevExtremeReportViewer />} />

        {/* DevExtreme Report Designer Routes */}
        <Route path="designer" element={<DevExtremeReportDesigner />} />
        <Route path="designer/:reportName" element={<DevExtremeReportDesigner />} />

        {/* Data Import Routes */}
        <Route path="fuel-importer" element={<FuelReportImporter />} />
        <Route path="fuel-importer/batch" element={<BatchImportPage />} />
        <Route path="fuel-importer/*" element={<FuelReportImporter />} />

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
          element={<VehicleConsumptionDetails />}
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
