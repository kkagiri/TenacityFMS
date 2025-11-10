import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import VehicleLayout from "./layout/VehicleLayout";
import VehicleDashboard from "./vehicleDashboard";

// Import vehicle feature pages
import VehicleEdit from "./vehicleEdit";
import VehicleDetails from "./VehicleDetails";
import VehicleConsumptionDetails from "./vehicleConsumptionDetails";
import VehicleFleetPage from "./VehicleFleetPage";
import VehicleTrackingPage from "./VehicleTrackingPage";
import VehicleConsumptionPage from "./VehicleConsumptionPage";
import VehicleConsumptionComparisonPage from "./VehicleConsumptionComparisonPage";
import MaintenanceAlertsPage from "./MaintenanceAlertsPage";
import VehicleReportsPage from "./VehicleReportsPage";
import VehicleSettingsPage from "./VehicleSettingsPage";
// Correct import path for vehicle documents list (was pointing to non-existent maintenance/documents folder)
import VehicleDocumentsList from "./vehicledocuments/VehicleDocumentsList";

const VehicleMain = () => {
  const location = useLocation();

  return (
    <VehicleLayout currentPath={location.pathname}>
      <Routes>
        {/* Dashboard routes */}
        <Route index element={<VehicleDashboard />} />
        <Route path="dashboard" element={<VehicleDashboard />} />
        <Route path="fleet" element={<VehicleFleetPage />} />
        <Route path="tracking" element={<VehicleTrackingPage />} />
        <Route path="consumption" element={<VehicleConsumptionPage />} />
        <Route path="consumption-comparison" element={<VehicleConsumptionComparisonPage />} />
        <Route path="maintenance" element={<MaintenanceAlertsPage />} />
        <Route path="documents" element={<VehicleDocumentsList />} />
        <Route
          path="maintenance/documents"
          element={<VehicleDocumentsList />}
        />
        <Route path="reports" element={<VehicleReportsPage />} />
        <Route path="settings" element={<VehicleSettingsPage />} />

        {/* Vehicle Management Routes */}
        <Route path=":id/details" element={<VehicleDetails />} />
        <Route path=":id/edit" element={<VehicleEdit />} />
        <Route
          path=":id/consumption/:consumptionId/details"
          element={<VehicleConsumptionDetails />}
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={<Navigate to="/vehicles/dashboard" replace />}
        />
      </Routes>
    </VehicleLayout>
  );
};

export default VehicleMain;
