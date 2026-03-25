/**
 * File: index.js
 * Purpose: Barrel exports for all report source definitions
 * Last Modified: 2026-02-12
 */

export { default as vehicleConsumption } from './vehicleConsumption';
export { default as fuelRefill } from './fuelRefill';
export { default as pumpTransaction } from './pumpTransaction';
export { default as delivery } from './delivery';
export { default as deviceOffline } from './deviceOffline';
export { default as ptsDevice } from './ptsDevice';
export { default as tankVolumeHistory } from './tankVolumeHistory';
export { default as consumptionByRefills } from './consumptionByRefills';
export { default as issueTracker } from './issueTracker';
export { default as transactionHistorySummary } from './transactionHistorySummary';
export { default as routeAnalysis } from './routeAnalysis';
export { default as tankLevelDetail } from './tankLevelDetail';
export { default as alarmReport } from './alarmReport';
export { default as storageReceivedVsDispensed } from './storageReceivedVsDispensed';

export {
    getReportSource,
    getAllReportSources,
    getReportSourcesByCategory,
    getCategories,
    registerReportSource,
} from './reportSourceRegistry';
