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

// Vehicle Consumption Report components
import VehicleConsumptionReport from "./vehicleConsumption/VehicleConsumptionReport";
import VehicleConsumptionDetails from "./vehicleConsumption/VehicleConsumptionDetails";

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
