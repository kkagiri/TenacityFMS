import { HomePage, Vehicles } from "./pages";
import ConsumptionBasedonRefills from "./pages/consumption/consumptionBasedonRefills";
import VehicleConsumptionDetails from "./report/vehicleConsumptionDetails/vehicleConsumptionDetails";
import VehicleManualRefill from "./pages/manualrefill/manualRefilPage";
import PermissionTreeList from "./components/PermissionTreeList/permissionTreeList";
import Rolepage from "./pages/Role/rolepage";
import unauthorized from "./pages/unauthorized";
import NavigationPage from "./pages/Navigation/NavigationPage";
import EmployeePage from "./pages/employees/employeePage";
import TankStockPage from "./pages/tankStock/tankStockPage";
import DocumentViewer from "./components/reports/DocumentViewer";
import ReportDesignerComponent from "./components/reports/ReportDesigner";
import Tagpage from "./pages/tag/tagPage";
import DeviceDashboard from "./pages/PTSDevice/DeviceDashboard";
import EditPTSDevice from "./pages/PTSDevice/EditPTSDevice";
import ATGDashboard from "./pages/ATG/ATGDashboard";
import FuelingProcess from "./components/fuelingprocess/fuelingprocess";

const resolvedComponents = (pageName) => {
  switch (pageName.toLowerCase()) {
    case "dashboard":
      return HomePage;

    case "vehicles":
      return Vehicles;
    case "tank stock":
      return TankStockPage;
    case "consumption":
      return ConsumptionBasedonRefills;

    case "vehicleConsumptionDetails":
      return VehicleConsumptionDetails;
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
      return ReportDesignerComponent;
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
