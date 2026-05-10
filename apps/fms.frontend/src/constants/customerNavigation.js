/**
 * File:          customerNavigation.js
 * Purpose:       Shared Customer ViewMode route and navigation allowlist.
 * Dependencies:  None
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - isCustomerRouteAllowed(): Checks whether a path belongs to the Customer portal surface.
 */

export const CUSTOMER_ROUTE_PREFIXES = [
    "/home",
    "/dashboard",
    "/vehicles",
    "/my-transactions",
    "/reports",
    "/my-users",
    "/profile",
    "/my-notifications",
    "/change-password-required",
    "/unauthorized",
];

export const CUSTOMER_NAVIGATION_ITEMS = [
    {
        id: "customer-dashboard",
        text: "Dashboard",
        path: "/home",
        icon: "fa-light fa-gauge-high",
    },
    {
        id: "customer-vehicles",
        text: "My Vehicles",
        path: "/vehicles",
        icon: "fa-light fa-cars",
    },
    {
        id: "customer-transactions",
        text: "My Transactions",
        path: "/my-transactions",
        icon: "fa-light fa-receipt",
    },
    {
        id: "customer-reports",
        text: "My Reports",
        path: "/reports",
        icon: "fa-light fa-chart-line",
    },
    {
        id: "customer-users",
        text: "My Users",
        path: "/my-users",
        icon: "fa-light fa-users",
    },
    {
        id: "customer-profile",
        text: "Profile",
        path: "/profile",
        icon: "fa-light fa-user",
    },
];

export const isCustomerRouteAllowed = (path) => {
    if (!path) {
        return false;
    }

    return CUSTOMER_ROUTE_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    );
};