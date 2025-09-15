import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ReportsLayout from './layout/ReportsLayout';
import ReportsDashboard from './ReportsDashboard';

// Import existing report components
import FuelReportImporter from '../FuelReportImporter/FuelReportImporter';
import ConsumptionBasedOnRefills from './consumption/consumptionBasedonRefills';

const ReportsMain = () => {
  const location = useLocation();

  return (
    <ReportsLayout currentPath={location.pathname}>
      <Routes>
        {/* Default dashboard route */}
        <Route index element={<ReportsDashboard />} />
        <Route path="dashboard" element={<ReportsDashboard />} />

        {/* Data Import Routes */}
        <Route path="fuel-importer" element={<FuelReportImporter />} />
        <Route path="fuel-importer/*" element={<FuelReportImporter />} />

        {/* Consumption Reports Routes */}
        <Route path="consumption-refills" element={<ConsumptionBasedOnRefills />} />
        <Route path="consumption-refills/*" element={<ConsumptionBasedOnRefills />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/reports/dashboard" replace />} />
      </Routes>
    </ReportsLayout>
  );
};

export default ReportsMain;
