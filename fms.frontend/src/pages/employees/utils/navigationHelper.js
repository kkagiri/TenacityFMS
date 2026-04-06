/**
 * File: navigationHelper.js
 * Purpose: Defines route helpers and sidebar navigation metadata for employee module pages.
 * Dependencies: None.
 * Last Modified: 2026-02-16
 *
 * Key Exports:
 * - employeeRoutes: Canonical route map for employee module pages.
 * - isActiveRoute(): Utility for determining active sidebar links.
 * - navigationGroups: Grouped sidebar items with icons and labels.
 */

export const employeeRoutes = {
  dashboard: "/employees/dashboard",
  list: "/employees/list",
  consumptionHistory: "/employees/consumption-history",
  warningLetters: "/employees/warning-letters",
};

export const getEmployeeDetailsRoute = (employeeId) =>
  `/employees/${employeeId}/details`;

export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === employeeRoutes.dashboard) {
    return (
      currentPath === "/employees" ||
      currentPath === "/employees/" ||
      currentPath === employeeRoutes.dashboard
    );
  }

  return currentPath.startsWith(targetPath);
};

export const navigationGroups = {
  main: [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "fa-light fa-chart-pie",
      path: employeeRoutes.dashboard,
    },
    {
      id: "list",
      title: "Employee List",
      icon: "fa-light fa-users",
      path: employeeRoutes.list,
    },
  ],
  history: [
    {
      id: "consumption-history",
      title: "Consumption History",
      icon: "fa-light fa-gas-pump",
      path: employeeRoutes.consumptionHistory,
    },
    {
      id: "warning-letters",
      title: "Warning Letters",
      icon: "fa-light fa-triangle-exclamation",
      path: employeeRoutes.warningLetters,
    },
  ],
};
