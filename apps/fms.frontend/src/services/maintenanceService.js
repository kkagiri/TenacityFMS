/**
 * File: maintenanceService.js
 * Purpose: Compatibility service for legacy maintenance pages.
 * Dependencies: _compat helpers
 * Last Modified: 2026-04-29
 */
import { asyncSuccess } from "../api/_compat";

const maintenanceService = {
    getAllMaintenance: async () => asyncSuccess("maintenanceService", "getAllMaintenance", []),
    getDashboard: async () => asyncSuccess("maintenanceService", "getDashboard", {}),
    getAllSchedules: async () => asyncSuccess("maintenanceService", "getAllSchedules", []),
    createMaintenance: async (payload) => asyncSuccess("maintenanceService", "createMaintenance", { id: Date.now(), ...payload }),
    updateMaintenance: async (id, payload) => asyncSuccess("maintenanceService", "updateMaintenance", { id, ...payload }),
    deleteMaintenance: async (id) => asyncSuccess("maintenanceService", "deleteMaintenance", { id }),
    importMaintenanceRecords: async (records) => asyncSuccess("maintenanceService", "importMaintenanceRecords", records || []),
    createSchedule: async (payload) => asyncSuccess("maintenanceService", "createSchedule", { id: Date.now(), ...payload }),
    updateSchedule: async (id, payload) => asyncSuccess("maintenanceService", "updateSchedule", { id, ...payload }),
};

export default maintenanceService;