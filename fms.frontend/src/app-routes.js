import { HomePage, Vehicles } from './pages';
import ConsumptionBasedonRefills from './pages/consumption/consumptionBasedonRefills';
import VehicleConsumptionDetails from './report/vehicleConsumptionDetails/vehicleConsumptionDetails';
import VehicleConsumptionReportDesigner from './components/reports/vehicleConsumptionReportDesigner';
import VehicleConsumptionReportViewer from './components/reports/vehicleConsumptionReportViewer';
import VehicleManualRefill from './pages/manualrefill/manualRefilPage';
import PermissionTreeList from './components/PermissionTreeList/permissionTreeList';
import Rolepage from './pages/Role/rolepage';
import unauthorized from './pages/unauthorized';
import NavigationPage from './pages/Navigation/NavigationPage';
import EmployeePage from './pages/employees/employeePage';
import TankStockPage from './pages/tankStock/tankStockPage';
const resolvedComponents =(pageName) => {
  switch(pageName.toLowerCase())

  {    

     case 'dashboard':
       return HomePage;
       
     case 'vehicles':
       return Vehicles;
       case 'tank stock':
        return TankStockPage;
     case 'consumption':
      console.log("Returning ConsumptionBasedonRefills component"); // Add this lineS
       return ConsumptionBasedonRefills;

     case 'vehicleConsumptionDetails':
       return VehicleConsumptionDetails;
     case 'vehicleConsumptionReportDesigner':
       return VehicleConsumptionReportDesigner;
     case 'vehicleConsumptionReportViewer':
       return VehicleConsumptionReportViewer;
     case 'manual refill': 
       return VehicleManualRefill;
     case 'employees':
        return EmployeePage;
     case 'roles':
       return Rolepage;
     case 'permissions':
       return PermissionTreeList;
       case 'navigations':
        return NavigationPage;
     
     case 'unauthorized':
       return unauthorized;
     default:
       return ()=><div className='content-block'> <
        div style={{textAlign:'center',margin:'20px'}}>
        <h1>Page not found</h1>
        <h5> The page you requested was not found. </h5>
        </div>
        </div>; //404 page
  }
 };

  export default resolvedComponents;







// const routes = [

//   {
//     path: '/home',
//     element: HomePage
//   },

//   {
//     path: '/vehicles',
//     element: withRoleProtection(Vehicles, ['Admin', 'poweruser'])
//   }
//   ,
//   {
//     path: '/ManualRefill',
//     element:withRoleProtection(VehicleManualRefill , ['Admin', 'poweruser','user'])
//   },
//   {
//     path: '/admin/Roles',
//     element: Rolepage
//   }
//   ,
//   {
//     path: '/vehicleConsumption',
//     element: vehicleConsumption
//   },
//   {
//     path: '/vehicleConsumptionDetails/:id',
//     element: VehicleConsumptionDetails
//   },
//   {
//     path: '/vehicleConsumptionReportDesigner',
//     element: VehicleConsumptionReportDesigner
//   },
//   {
//     path: '/vehicleConsumptionReportViewer',
//     element: VehicleConsumptionReportViewer
//   }
//   ,
//   {
//     path: '/permissiontree',
//     element: PermissionTreeList
//   },
//   {
//     path: '/unauthorized',
//     element: unauthorized
//   }

// ];

// export default routes.map(route => {
//   return {
//     ...route,
//     element: withNavigationWatcher(route.element, route.path)
//   };
// });
