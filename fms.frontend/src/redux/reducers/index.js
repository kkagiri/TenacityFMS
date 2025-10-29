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
import expectedAvgReducer from "./expectedAvgReducer";
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
import realtimeStatusReducer from "./ptsReducers/realtimeStatusReducer";
import deviceConnectionReducer from "./deviceConnectionReducer";
import fuelingEventsReducer from "./fuelingEventsReducer";
import configReducer from "./configReducer";
import ptsAutomationConfigReducer from "./ptsAutomationConfigReducer";
import automatedReconciliationReducer from "./automatedReconciliationReducer";
import fuelReportReducer from "./fuelReportReducer";
import notificationReducer from "./notificationReducer";
import stockManagementReducer from "./stockManagementReducer";
import configurationReducer from "./configurationReducer";
import systemConfigReducer from "./systemConfigReducer";
import vehicleDashboardReducer from "./vehicleDashboardReducer";
import issueTrackerReducer from "./issueTrackerReducer";
import activeAlarmReducer from "./activeAlarmReducer";
import dashboardPreferencesReducer from "./dashboardPreferencesReducer";
import dashboardLayoutReducer from "./dashboardLayoutReducer";
import vehicleDocumentReducer from "./vehicleDocumentReducer";
import providerReducer from "./providerReducer";

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
  vehicleDocument: vehicleDocumentReducer,
  vehicleType: vehicleTypeReducer,
  vehicleManufacturer: vehicleManufacturerReducer,
  vehicleModel: vehicleModelReducer,
  expectedAvg: expectedAvgReducer,
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
  ptsAutomationConfig: ptsAutomationConfigReducer,
  automatedReconciliation: automatedReconciliationReducer,
  fuelReport: fuelReportReducer,
  notification: notificationReducer,
  stockManagement: stockManagementReducer,
  configuration: configurationReducer,
  systemConfig: systemConfigReducer,
  vehicleDashboard: vehicleDashboardReducer,
  issueTracker: issueTrackerReducer,
  activeAlarm: activeAlarmReducer,
  dashboardPreferences: dashboardPreferencesReducer,
  dashboard: dashboardLayoutReducer,
  provider: providerReducer,
});

export default rootReducer;
