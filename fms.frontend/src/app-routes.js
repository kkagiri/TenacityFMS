import { HomePage } from "./pages";
import ConsumptionBasedonRefills from "./pages/reports/consumption/consumptionBasedonRefills";
import FuelReportImporter from "./pages/FuelReportImporter/FuelReportImporter";
import VehicleManualRefill from "./pages/manualrefill/manualRefilPage";
import unauthorized from "./pages/unauthorized";
import EmployeePage from "./pages/employees/employeePage";
//Cursor - New tank stock main entry point for Phase 1 redesign
import { TankStockMain} from "./pages/tankStock";
import EditPTSDevice from "./pages/PTSDevice/EditPTSDevice";
import ATGDashboard from "./pages/ATG/ATGDashboard";
import UserDetailsPage from "./pages/user/userDetailsPage";
import UserActivitiesPage from "./pages/user/userActivitiesPage";
import UserSitesPage from "./pages/user/userSitesPage";
import UserActivityDashboard from "./pages/user/userActivityDashboard";
import UserEditPage from "./pages/user/userEditPage";
import AutomatedReconciliationSystem from "./pages/automatedReconciliation/AutomatedReconciliationSystem";
import TaskManagement from "./pages/taskManagement";
//Cursor - Mission Control enhanced versions
import EnhancedAutomatedReconciliationSystem from "./pages/automatedReconciliation/EnhancedAutomatedReconciliationSystem";
// Import the new notification system pages
import NotificationSystem from "./pages/notifications";
// Import the new admin main entry point
import AdminMain from "./pages/admin/AdminMain";
// Import the new vehicle main entry point
import VehicleMain from "./pages/vehicles/VehicleMain";
// Import individual vehicle components
import VehicleDashboard from "./pages/vehicles/vehicleDashboard";
import MaintenanceAlertsPage from "./pages/vehicles/MaintenanceAlertsPage";
import VehicleEdit from "./pages/vehicles/vehicleEdit";
// Import Issue Tracker components
import IssueTrackerPage from "./pages/issueTracker/IssueTrackerPage";
import IssueTrackerMain from "./pages/issueTracker/IssueTrackerMain";
// Import Active Alarm components
import ActiveAlarmMain from "./pages/activeAlarms/ActiveAlarmMain";
// Import Reports main entry point
import ReportsMain from "./pages/reports/ReportsMain";

const resolvedComponents = (pageName) => {
  switch (pageName.toLowerCase()) {

   case "dashboard":
      return HomePage;

     case "task management":
      return TaskManagement;
    case "vehicles":
      return VehicleMain;
    case "tank stock":
      return TankStockMain;
    case "admin":
      return AdminMain;
    case "reports":
      return ReportsMain;
    case "active-alarms":
      return ActiveAlarmMain;
    case "issue-tracker":
      return IssueTrackerMain;

    case "consumption":
      return ConsumptionBasedonRefills;
      case "notifications":
          return NotificationSystem;


    case "Fuel Report Importer":
      return FuelReportImporter;
    case "manual refill":
      return VehicleManualRefill;
    case "employees":
      return EmployeePage;
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
    case "user-sites":
      return UserSitesPage;
    case "activity-dashboard":
      return UserActivityDashboard;
    case "user-edit":
      return UserEditPage;
    case "vehicle-dashboard":
      return VehicleDashboard;
    case "vehicle-edit":
      return VehicleEdit;
    case "maintenance-alerts":
      return MaintenanceAlertsPage;
    case "automated-reconciliation":
      return AutomatedReconciliationSystem;
    case "reconciliation-mission-control":
      return EnhancedAutomatedReconciliationSystem;

    case "issue tracker":
      return IssueTrackerMain;
    case "device issues":
    case "issue-tracker":
    case "issues":
      return IssueTrackerPage;

    case "active-alarms":
      return ActiveAlarmMain;

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
