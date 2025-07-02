import { HomePage, Vehicles } from "./pages";
import ConsumptionBasedonRefills from "./pages/consumption/consumptionBasedonRefills";
import FuelReportImporter from "./pages/FuelReportImporter/FuelReportImporter";
import VehicleManualRefill from "./pages/manualrefill/manualRefilPage";
import PermissionTreeList from "./components/PermissionTreeList/permissionTreeList";
import Rolepage from "./pages/Role/rolepage";
import unauthorized from "./pages/unauthorized";
import NavigationPage from "./pages/Navigation/NavigationPage";
import EmployeePage from "./pages/employees/employeePage";
import TankStockPage from "./pages/tankStock/tankStockPage";
//Cursor - New tank stock page imports for Phase 1 redesign
import TankStockDashboard from "./pages/tankStock/dashboard/TankStockDashboard";
import StockAnalytics from "./pages/tankStock/analytics/StockAnalytics";
import StockManagement from "./pages/tankStock/management/StockManagement";
import DocumentViewer from "./components/reports/DocumentViewer";
import ReportDesignerComponent from "./components/reports/ReportDesigner";
import Tagpage from "./pages/tag/tagPage";
import DeviceDashboard from "./pages/PTSDevice/DeviceDashboard";
import EditPTSDevice from "./pages/PTSDevice/EditPTSDevice";
import ATGDashboard from "./pages/ATG/ATGDashboard";
import FuelingProcess from "./components/fuelingprocess/fuelingprocess";
import TailwindExample from "./components/TailwindExample";
import UserPage from "./pages/user/userPage";
import UserDetailsPage from "./pages/user/userDetailsPage";
import UserActivitiesPage from "./pages/user/userActivitiesPage";
import UserSitesPage from "./pages/user/userSitesPage";
import UserActivityDashboard from "./pages/user/userActivityDashboard";
import UserEditPage from "./pages/user/userEditPage";
import TankPage from "./pages/tank/tankPage";
import SitePage from "./pages/site/sitePage";
import PTSAutomationConfigPage from "./pages/PTSAutomationConfig/PTSAutomationConfigPage";
import AutomatedReconciliationSystem from "./pages/automatedReconciliation/AutomatedReconciliationSystem";
import TaskManagement from "./pages/taskManagement";
//Cursor - Mission Control enhanced versions
import EnhancedTankStockDashboard from "./pages/tankStock/dashboard/EnhancedTankStockDashboard";
import EnhancedAutomatedReconciliationSystem from "./pages/automatedReconciliation/EnhancedAutomatedReconciliationSystem";
// Import the new notification system pages
import NotificationSystem from "./pages/notifications";

const resolvedComponents = (pageName) => {
  switch (pageName.toLowerCase()) {

   case "dashboard":
      return HomePage;

     case "task management":
      return TaskManagement;
    case "vehicles":
      return Vehicles;
    case "tanks":
      return TankPage;
    case "sites":
      return SitePage;
    case "tank stock":
     return TankStockPage;
    //Cursor - New tank stock page routes for Phase 1 redesign
    case "tank stock dashboard":
      return EnhancedTankStockDashboard;
    // case "tank operations control":
    //   return EnhancedTankStockDashboard;
    case "stock analytics":
      return StockAnalytics;
    case "stock management":
      return StockManagement;
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
    case "roles":
      return Rolepage;
    case "permissions":
      return PermissionTreeList;
    case "navigations":
      return NavigationPage;
    case "reports":
      return FuelReportImporter;
    case "tags":
      return Tagpage;
    case "automatic fueling":
      return ATGDashboard;
    case "ptsdevice":
      return DeviceDashboard; // windsurf comment
    case "atg":
      return ATGDashboard;
    case "edit-pts-device":
      return EditPTSDevice;
    case "users":
      return UserPage;
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
    case "site":
      return SitePage;
      case "ptsautomationconfig": //Cursor - PTS Automation Configuration page component
      return PTSAutomationConfigPage;
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
