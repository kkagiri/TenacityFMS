import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TankStockLayout from './layout/TankStockLayout';
import EnhancedTankStockDashboard from './dashboard/EnhancedTankStockDashboard';
import StockAnalytics from './analytics/StockAnalytics';
import StockManagement from './management/StockManagement';
import ReconciliationMissionControl from './reconciliation/ReconciliationMissionControl';
import TankStockSettings from './settings/TankStockSettings';

const TankStockMain = () => {
  return (
    <TankStockLayout>
      <Routes>
        {/* Default route - Enhanced Dashboard */}
        <Route index element={<EnhancedTankStockDashboard />} />
        <Route path="/" element={<EnhancedTankStockDashboard />} />
        <Route path="/dashboard" element={<EnhancedTankStockDashboard />} />

        {/* Feature routes with updated paths */}
        <Route path="/stock-analytics" element={<StockAnalytics />} />
        <Route path="/stock-management" element={<StockManagement />} />
        <Route path="/reconciliation-control" element={<ReconciliationMissionControl />} />
        <Route path="/settings" element={<TankStockSettings />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/tankstock" replace />} />
      </Routes>
    </TankStockLayout>
  );
};

export default TankStockMain;
