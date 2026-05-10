/**
 * File:          appNavigation.js
 * Purpose:       Defines the static web application navigation model and permission filtering.
 * Dependencies:  WEB_APP_PERMISSIONS
 * Last Modified: 2026-04-23
 *
 * Key Exports:
 * - APP_NAVIGATION_MODULES: Shared top-level navigation definitions.
 * - getAccessibleAppNavigation(): Filters modules using current permission state.
 */

import { WEB_APP_PERMISSIONS } from "../constants/webAppPermissions";

export const LEGACY_ADMIN_ACCESS_PERMISSIONS = [
    "_Manage_Users",
    "_Manage_Roles",
    "_Manage_Site",
    "_Manage_ATG",
    "_Manage_NotificationPolicy",
    "_Manage_NotificationGroups",
    "_Manage_NotificationEmailConfig",
    "_Manage_NotificationPreferences",
    "_Manage_LocationValidation",
];

export const APP_NAVIGATION_MODULES = [
    {
        id: 1,
        name: "Dashboard",
        route: "/home",
        icon: "fa-light fa-chart-line",
        color: "#0078d4",
        webAppPermission: WEB_APP_PERMISSIONS.DASHBOARD,
        legacyPermissions: ["_View_Dashboard", "Dashboard Module"],
    },
    {
        id: 2,
        name: "Vehicles",
        route: "/vehicles",
        icon: "fa-light fa-car",
        color: "#107c10",
        webAppPermission: WEB_APP_PERMISSIONS.VEHICLES,
        legacyPermissions: [
            "Vehicle Module",
            "VehicleTrackingModule",
            "VehicleMaintenanceModule",
            "VehicleTransferModule",
            "VehicleHealthModule",
            "GeofenceModule",
            "_Read_Vehicle",
            "_Read_VehicleTracking",
            "_Read_VehicleTrips",
            "_Read_VehicleMaintenance",
            "_Read_VehicleTransfer",
            "_Read_Geofence",
        ],
    },
    {
        id: 3,
        name: "Employees",
        route: "/employees",
        icon: "fa-light fa-users",
        color: "#ff8c00",
        webAppPermission: WEB_APP_PERMISSIONS.EMPLOYEES,
        legacyPermissions: ["Employee Module", "_Read_Employee"],
    },
    {
        id: 4,
        name: "Automatic Fueling",
        route: "/atg",
        icon: "fa-light fa-gas-pump",
        color: "#d13438",
        webAppPermission: WEB_APP_PERMISSIONS.FUELING,
        legacyPermissions: [
            "ATG",
            "FuelRefil",
            "FuelingRuleModule",
            "PTSServiceModule",
            "PushDeviceModule",
            "_Manage_ATG",
            "_Read_PTSDevice",
            "_Read_FuelingRule",
            "_Read_FuelRefill",
        ],
    },
    {
        id: 5,
        name: "Device Issues",
        route: "/issue-tracker",
        icon: "fa-light fa-exclamation-triangle",
        color: "#881798",
        webAppPermission: WEB_APP_PERMISSIONS.ISSUES,
        legacyPermissions: [
            "IssueTracker",
            "IssueManagementV2Module",
            "_Read_Issues",
            "_Manage_Issues",
        ],
    },
    {
        id: 6,
        name: "Reports",
        route: "/reports",
        icon: "fa-light fa-chart-pie",
        color: "#7c3aed",
        webAppPermission: WEB_APP_PERMISSIONS.REPORTS,
        legacyPermissions: [
            "Data Analysis Module",
            "ReportingModule",
            "ReportModule",
            "StockReportModule",
            "TankVolumeHistoryModule",
            "_Read_Reporting",
            "_Generate_Report",
            "_Read_VehicleConsumptionReport",
            "_Read_FuelRefillReport",
            "_Read_TankVolumeHistory",
            "_Read_PTSDevice",
        ],
    },
    {
        id: 7,
        name: "Tank Stock",
        route: "/tankstock",
        icon: "fa-light fa-oil-can",
        color: "#498205",
        webAppPermission: WEB_APP_PERMISSIONS.TANK_STOCK,
        legacyPermissions: [
            "TankStockModule",
            "TankReconciliationModule",
            "FuelAuditModule",
            "DailyTankReconciliationModule",
            "TankVolumeDataCorrectionModule",
            "TankVolumeHistoryModule",
            "_Read_TankStock",
            "_Read_FuelAudit",
            "_Read_TankVolumeHistory",
        ],
    },
    {
        id: 8,
        name: "Admin",
        route: "/admin",
        icon: "fa-light fa-cog",
        color: "#005a70",
        webAppPermission: WEB_APP_PERMISSIONS.ADMIN,
        legacyPermissions: LEGACY_ADMIN_ACCESS_PERMISSIONS,
    },
    {
        id: 10,
        name: "Events",
        route: "/event-expressions",
        icon: "fa-light fa-bell",
        color: "#e74856",
        webAppPermission: WEB_APP_PERMISSIONS.EVENTS,
        legacyPermissions: ["_Read_EventExpression", "_Manage_ATG"],
    },
    {
        id: 11,
        name: "Maintenance",
        route: "/maintenance",
        icon: "fa-light fa-wrench",
        color: "#ea580c",
        webAppPermission: WEB_APP_PERMISSIONS.MAINTENANCE,
        legacyPermissions: [
            "VehicleMaintenanceModule",
            "Vehicle Module",
            "_Read_VehicleMaintenance",
            "_Read_Vehicle",
        ],
    },
];

export const getAccessibleAppNavigation = ({
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
}) => {
    if (!isAuthenticated) {
        return [];
    }

    return APP_NAVIGATION_MODULES.filter((module) => {
        const hasWebAccess =
            typeof hasPermission === "function" && hasPermission(module.webAppPermission);
        const hasLegacyAccess =
            typeof hasAnyPermission === "function" &&
            hasAnyPermission(module.legacyPermissions);

        return hasWebAccess || hasLegacyAccess;
    });
};