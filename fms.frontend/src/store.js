import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import roleReducer from './reducers/roleReducer';
import permissionReducer from './reducers/permissionReducer';
import authReducer from './reducers/authReducer';
import userReducer from './reducers/userReducer'; 
import navigationReducer from './reducers/navigationReducer';
import tankReducer from './reducers/tankReducer';
import tankStockReducer from './reducers/tankStockReducer';
import fuelRefillReducer from './reducers/fuelRefillReducer';
import siteReducer from './reducers/siteReducer';
import employeeReducer from './reducers/employeeReducer';
import vehicleReducer from './reducers/vehicleReducer';
import vehicleTypeReducer from './reducers/vehicleTypeReducer';
import vehicleManufacturerReducer from './reducers/vehicleManufacturerReducer';
import vehicleModelReducer from './reducers/vehicleModelReducer';
import tankReconciliationReducer from './reducers/tankReconciliationReducer';

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
    vehicle: vehicleReducer,
    vehicleType: vehicleTypeReducer,
    vehicleManufacturer: vehicleManufacturerReducer,
    vehicleModel: vehicleModelReducer,
    tankReconciliation: tankReconciliationReducer
    
});

const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk))
);

export default store;
