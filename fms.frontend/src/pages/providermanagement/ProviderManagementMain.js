import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProviderManagementLayout from "./layout/ProviderManagementLayout";
import ProviderDashboard from "./dashboard/ProviderDashboard";
import ProviderConfiguration from "./configuration/ProviderConfiguration";
import VehicleAssignments from "./assignments/VehicleAssignments";

/**
 * Provider Management Main Component
 * Phase 7: Admin UI for GPS tracking provider management
 */
const ProviderManagementMain = () => {
  return (
    <ProviderManagementLayout>
      <Routes>
        <Route index element={<ProviderDashboard />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="configuration" element={<ProviderConfiguration />} />
        <Route path="assignments" element={<VehicleAssignments />} />
        <Route
          path="*"
          element={<Navigate to="/admin/providers" replace />}
        />
      </Routes>
    </ProviderManagementLayout>
  );
};

export default ProviderManagementMain;
