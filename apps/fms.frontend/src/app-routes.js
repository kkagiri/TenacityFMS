/**
 * File: app-routes.js
 * Purpose: Maps navigation page names to React page modules.
 * Dependencies: Page module entry components across frontend domains.
 * Last Modified: 2026-02-16
 *
 * Key Functions:
 * - resolvedComponents(pageName): Resolves dynamic route component by page label.
 */

import { HomePage } from "./pages";
import ConsumptionBasedonRefills from "./pages/reports/consumption/consumptionBasedonRefills";
import VehicleManualRefill from "./pages/manualrefill/manualRefilPage";
import unauthorized from "./pages/unauthorized";
import EmployeeMain from "./pages/employees/EmployeeMain";
//Cursor - New tank stock main entry point for Phase 1 redesign
import { TankStockMain } from "./pages/tankStock";
import EditPTSDevice from "./pages/PTSDevice/EditPTSDevice";
import ATGDashboard from "./pages/ATG/ATGDashboard";
import UserDetailsPage from "./pages/user/userDetailsPage";
import UserActivitiesPage from "./pages/user/userActivitiesPage";
import UserActivityDashboard from "./pages/user/userActivityDashboard";
import AutomatedReconciliationSystem from "./pages/automatedReconciliation/AutomatedReconciliationSystem";
//Cursor - Mission Control enhanced versions
import EnhancedAutomatedReconciliationSystem from "./pages/automatedReconciliation/EnhancedAutomatedReconciliationSystem";
// Import the new notification system pages
import NotificationSystem from "./pages/notifications";
// Import user-facing notification center
import NotificationCenterPage from "./pages/notificationCenter/NotificationCenterPage";
// Import the new admin main entry point
import AdminMain from "./pages/admin/AdminMain";
// Import the new vehicle main entry point
import VehicleMain from "./pages/vehicles/VehicleMain";
// Import individual vehicle components
import VehicleDashboard from "./pages/vehicles/dashboard/VehicleDashboard";
import MaintenanceAlertsPage from "./pages/vehicles/maintenance/MaintenanceAlertsPage";
import VehicleDetails from "./pages/vehicles/details/VehicleDetails";
// Import Issue Tracker components
import IssueTrackerMain from "./pages/issueTracker/IssueTrackerMain";
// Import Event Expressions management
import EventExpressionsMain from "./pages/eventExpressions";
// Import Reports main entry point
import ReportsMain from "./pages/reports/ReportsMain";
// Import Provider Management main entry point (Phase 7)
import ProviderManagementMain from "./pages/providermanagement/ProviderManagementMain";
// Import Maintenance main entry point
import { MaintenanceMain } from "./pages/maintenance";
// Import PTS Device Terminal Test Page (isolated testing)
import PTSDeviceTerminalTestPage from "./pages/PTSDevice/PTSDeviceTerminalTestPage";

const resolvedComponents = (pageName) => {
  switch (pageName.toLowerCase()) {
    case "dashboard":
      return HomePage;

    case "vehicles":
      return VehicleMain;
    case "tank stock":
      return TankStockMain;
    case "admin":
      return AdminMain;
    case "pts-terminal-test":
      return PTSDeviceTerminalTestPage;
    case "reports":
      return ReportsMain;
    case "maintenance":
      return MaintenanceMain;
    case "event-expressions":
      return EventExpressionsMain;
    case "issue-tracker":
    case "issue tracker":
      return IssueTrackerMain;
    case "provider management":
    case "providermanagement":
      return ProviderManagementMain;

    case "consumption":
      return ConsumptionBasedonRefills;
    case "notifications":
      return NotificationSystem;

    case "notification-center":
    case "my-notifications":
      return NotificationCenterPage;

    case "Fuel Report Importer":
      return null;
    case "manual refill":
      return VehicleManualRefill;
    case "employees":
      return EmployeeMain;
    case "automatic fueling":
      return ATGDashboard;
    case "atg":
      return ATGDashboard;
    case "edit-pts-device":
      return EditPTSDevice;
    case "user-details":
      return UserDetailsPage;
    case "user-activities":
      return UserActivitiesPage;
    case "activity-dashboard":
      return UserActivityDashboard;
    case "vehicle-dashboard":
      return VehicleDashboard;
    case "vehicle-edit":
      return VehicleDetails;
    case "maintenance-alerts":
      return MaintenanceAlertsPage;
    case "automated-reconciliation":
      return AutomatedReconciliationSystem;
    case "reconciliation-mission-control":
      return EnhancedAutomatedReconciliationSystem;

    case "unauthorized":
      return unauthorized;
    default:
      return () => (
        <div className="content-block">
          {" "}
          <div style={{ textAlign: "center", margin: "20px" }}>
            <h1>Page not found</h1>
            <h5> The page you requested was not found. </h5>
          </div>
        </div>
      ); //404 page
  }
};

export default resolvedComponents;
