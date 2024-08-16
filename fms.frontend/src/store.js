import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import roleReducer from './redux/reducers/roleReducer';
import permissionReducer from './redux/reducers/permissionReducer';
import authReducer from './redux/reducers/authReducer';
import userReducer from './redux/reducers/userReducer'; 
import navigationReducer from './redux/reducers/navigationReducer';
import tankReducer from './redux/reducers/tankReducer';
import tankStockReducer from './redux/reducers/tankStockReducer';
import fuelRefillReducer from './redux/reducers/fuelRefillReducer';
import siteReducer from './redux/reducers/siteReducer';
import employeeReducer from './redux/reducers/employeeReducer';
import VehicleReducer from './redux/reducers/vehicleReducer';
import vehicleTypeReducer from './redux/reducers/vehicleTypeReducer';
import vehicleManufacturerReducer from './redux/reducers/vehicleManufacturerReducer';
import vehicleModelReducer from './redux/reducers/vehicleModelsReducer';
import tankReconciliationReducer from './redux/reducers/tankReconciliationReducer';
import consumptionReducer from './redux/reducers/consumptionReducer';
import tankVolumeHistoryReducer from './redux/reducers/tankVolumeHistoryReducer';
import deliveryReducer from './redux/reducers/DeliveryReducer';
import supplierReducer from './redux/reducers/supplierReducer';
 
const rootReducer = combineReducers({
    auth: authReducer,
    role: roleReducer,
    permission: permissionReducer,
    user: userReducer,
    navigation: navigationReducer,
    tank: tankReducer,
    tankStock: tankStockReducer,
    fuelRefill: fuelRefillReducer,
    site: siteReducer,
    employee: employeeReducer,
    vehicle: VehicleReducer,
    vehicleType: vehicleTypeReducer,
    vehicleManufacturer: vehicleManufacturerReducer,
    vehicleModel: vehicleModelReducer,
    tankReconciliation: tankReconciliationReducer,
    consumption: consumptionReducer,
    tankVolumeHistory: tankVolumeHistoryReducer,
    delivery: deliveryReducer,
    supplier: supplierReducer
});

const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk))
);

export default store;
