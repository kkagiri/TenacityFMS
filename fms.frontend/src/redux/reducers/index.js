import { combineReducers } from "redux";
import authReducer from "./authReducer";
import permissionReducer from "./permissionReducer";
import roleReducer from "./roleReducer";
import userReducer from "./userReducer";
import navigationReducer from "./navigationReducer";
import tankReducer from "./tankReducer";
import tankStockReducer from "./tankStockReducer";
import fuelRefillReducer from "./fuelRefillReducer";
import siteReducer from "./siteReducer";
import employeeReducer from "./employeeReducer";
import vehicleReducer from "./vehicleReducer";
import vehicleTypeReducer from "./vehicleTypeReducer";
import vehicleManufacturerReducer from "./vehicleManufacturerReducer";
import vehicleModelReducer from "./vehicleModelsReducer";
import tankReconciliationReducer from "./tankReconciliationReducer";
import consumptionReducer from "./consumptionReducer";
import tankVolumeHistoryReducer from "./tankVolumeHistoryReducer";
import deliveryReducer from "./DeliveryReducer";
import supplierReducer from "./supplierReducer";
import refillSummaryReducer from "./refillSummaryReducer";
import tagReducer from "./tagReducer";
import tagMonitoringReducer from "./tagMonitoringReducer";
import ptsDeviceReducer from "./ptsReducers/ptsDeviceReducer";
import fuelingRuleReducer from "./fuelingRuleReducer";
import pumpReducer from "./ptsReducers/pumpReducer";
import atgReducer from "./atgReducer";
import realtimeStatusReducer from "./ptsReducers/realtimeStatusReducer";
import deviceConnectionReducer from "./deviceConnectionReducer";
import fuelingEventsReducer from "./fuelingEventsReducer";
import configReducer from "./configReducer";
import fuelReportReducer from "./fuelReportReducer";
import notificationReducer from "./notificationReducer";

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
  tankReconciliation: tankReconciliationReducer,
  consumption: consumptionReducer,
  tankVolumeHistory: tankVolumeHistoryReducer,
  delivery: deliveryReducer,
  supplier: supplierReducer,
  refillSummary: refillSummaryReducer,
  tag: tagReducer,
  tagMonitoring: tagMonitoringReducer,
  ptsDevice: ptsDeviceReducer,
  fuelingRule: fuelingRuleReducer,
  pump: pumpReducer,
  realtimeStatus: realtimeStatusReducer,
  deviceConnections: deviceConnectionReducer,
  fuelingEvents: fuelingEventsReducer,
  config: configReducer,
  fuelReport: fuelReportReducer,
  notification: notificationReducer,
});

export default rootReducer;
