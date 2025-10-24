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
import VehicleMaintenancePage from "./VehicleMaintenancePage";
import VehicleReportsPage from "./VehicleReportsPage";
import VehicleSettingsPage from "./VehicleSettingsPage";
import VehicleDocumentsList from "./maintenance/documents/VehicleDocumentsList";

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
        <Route path="maintenance" element={<VehicleMaintenancePage />} />
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
