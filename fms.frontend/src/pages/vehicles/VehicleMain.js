import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import VehicleLayout from "./layout/VehicleLayout";

// Dashboard
import VehicleDashboard from "./dashboard/VehicleDashboard";

// Fleet
import VehicleFleetPage from "./fleet/VehicleFleetPage";

// Details
import VehicleDetails from "./details/VehicleDetails";

// Consumption
import VehicleConsumptionPage from "./consumption/VehicleConsumptionPage";
import VehicleConsumptionDetails from "./consumption/VehicleConsumptionDetails";
import VehicleConsumptionComparisonPage from "./consumption/comparison/VehicleConsumptionComparisonPage";

// Tracking
import VehicleTrackingPage from "./tracking/VehicleTrackingPage";

// Maintenance
import MaintenanceAlertsPage from "./maintenance/MaintenanceAlertsPage";

// Documents
import VehicleDocumentsList from "./documents/VehicleDocumentsList";

// Transfers
import VehicleTransferListPage from "./transfers/VehicleTransferListPage";

// Reports
import VehicleReportsPage from "./reports/VehicleReportsPage";

// Settings
import VehicleSettingsPage from "./settings/VehicleSettingsPage";

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
        <Route path="transfers" element={<VehicleTransferListPage />} />
        <Route path="reports" element={<VehicleReportsPage />} />
        <Route path="settings" element={<VehicleSettingsPage />} />

        {/* Vehicle Management Routes */}
        <Route path=":id/details" element={<VehicleDetails />} />
        <Route path=":id/edit" element={<VehicleDetails />} />
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
