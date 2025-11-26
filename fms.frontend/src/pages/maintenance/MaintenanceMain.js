import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import MaintenanceLayout from './layout/MaintenanceLayout';
import MaintenanceDashboard from './dashboard/MaintenanceDashboard';

// Import maintenance feature pages
import MaintenanceList from './list/MaintenanceList';
import MaintenanceSettings from './settings/MaintenanceSettings';
import OdometerReconciliation from './reconciliation/OdometerReconciliation';

const MaintenanceMain = () => {
  const location = useLocation();

  return (
    <MaintenanceLayout currentPath={location.pathname}>
      <Routes>
        {/* Default route - Dashboard */}
        <Route index element={<MaintenanceDashboard />} />

        {/* Dashboard route - explicit */}
        <Route path="/dashboard" element={<MaintenanceDashboard />} />
        <Route path="/dashboard/*" element={<MaintenanceDashboard />} />

        {/* Maintenance Records List */}
        <Route path="/records" element={<MaintenanceList />} />
        <Route path="/records/*" element={<MaintenanceList />} />

        {/* Odometer Reconciliation */}
        <Route path="/reconciliation" element={<OdometerReconciliation />} />
        <Route path="/reconciliation/*" element={<OdometerReconciliation />} />

        {/* Maintenance Settings */}
        <Route path="/settings" element={<MaintenanceSettings />} />
        <Route path="/settings/*" element={<MaintenanceSettings />} />

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    </MaintenanceLayout>
  );
};

export default MaintenanceMain;
