import { HomePage, Vehicles } from './pages';
import vehicleConsumption from './report/vehicleConsumptionList/vehicleConsumptionList';
import VehicleConsumptionDetails from './report/vehicleConsumptionDetails/vehicleConsumptionDetails';
import VehicleConsumptionReportDesigner from './components/reports/vehicleConsumptionReportDesigner';
import VehicleConsumptionReportViewer from './components/reports/vehicleConsumptionReportViewer';
import VehicleManualRefill from './pages/manualrefill/manualRefilPage';
import PermissionTreeList from './components/PermissionTreeList/permissionTreeList';
import Rolepage from './pages/Role/rolepage';
import unauthorized from './pages/unauthorized';
import NavigationPage from './pages/Navigation/NavigationPage';

const resolvedComponents =(pageName) => {
  switch(pageName.toLowerCase())
  {    
     case 'dashboard':
       return HomePage;
     case 'vehicles':
       return Vehicles;
     case 'consumption':
       return vehicleConsumption;
     case 'vehicleConsumptionDetails':
       return VehicleConsumptionDetails;
     case 'vehicleConsumptionReportDesigner':
       return VehicleConsumptionReportDesigner;
     case 'vehicleConsumptionReportViewer':
       return VehicleConsumptionReportViewer;
     case 'manual refill':
       return VehicleManualRefill;
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
