import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FuelDataComparisonDashboard from './dashboard/FuelDataComparisonDashboard';

/**
 * FuelDataComparisonMain - Main routing component for Fuel Data Comparison sub-module
 *
 * This component handles internal routing for the fuel data comparison feature.
 * It integrates with TankStock's StockFilterContext for filtering capabilities.
 *
 * Routes:
 * - / or /dashboard -> FuelDataComparisonDashboard (main comparison view)
 *
 * @returns {JSX.Element} Fuel Data Comparison routing component
 */
const FuelDataComparisonMain = () => {
  return (
    <Routes>
      {/* Default route - Comparison Dashboard */}
      <Route index element={<FuelDataComparisonDashboard />} />
      <Route path="/" element={<FuelDataComparisonDashboard />} />
      <Route path="/dashboard" element={<FuelDataComparisonDashboard />} />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/tankstock/fueldatacomparison" replace />} />
    </Routes>
  );
};

export default FuelDataComparisonMain;
