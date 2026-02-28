/**
 * File: navigationHelper.js
 * Purpose: Central route constants and active-route matching helpers for admin navigation.
 * Dependencies: None
 * Last Modified: 2026-02-26
 *
 * Key Functions:
 * - adminRoutes: Canonical admin route map.
 * - getAdminRoute(): Utility to build paths under /admin.
 * - isActiveRoute(): Normalized active-path matcher for sidebar state.
 */
// Navigation helper functions for admin operations routes

export const adminRoutes = {
  dashboard: "/admin",
  users: "/admin/users",
  roles: "/admin/roles",
  permissions: "/admin/permissions",
  navigation: "/admin/navigation",
  taskManagement: "/admin/task-management",
  tags: "/admin/tags",
  sites: "/admin/sites",
  tanks: "/admin/tanks",
  ptsdevice: "/admin/ptsdevice",
  ptsconfig: "/admin/ptsconfig",
  configuration: "/admin/configuration",
  systemconfig: "/admin/systemconfig",
  ptsService: "/admin/pts-service",
  notification: "/admin/notification",
  notificationDashboard: "/admin/notification",
  notificationHistory: "/admin/notification/history",
  notificationEmailSettings: "/admin/notification/configuration/email",
  notificationCategories: "/admin/notification/categories",
  notificationAlertThresholds: "/admin/notification/alert-configuration",
  providers: "/admin/providers",
  logs: "/admin/logs",
  expectedAverages: "/admin/expected-averages",
  checkupTemplates: "/admin/checkup-templates",
  fuelingRules: "/admin/fueling-rules",
  fuelingRulesRulesets: "/admin/fueling-rules/rulesets",
  fuelingRulesAssignments: "/admin/fueling-rules/assignments",
  fuelingRulesLocationGeofence: "/admin/fueling-rules/location-geofence",
  fuelingRulesSimulator: "/admin/fueling-rules/simulator",
  locationValidation: "/admin/location-validation",
};

export const getAdminRoute = (subPath = "") => {
  const basePath = "/admin";
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  // Remove trailing slashes for consistent comparison
  const normalizedCurrentPath = currentPath.replace(/\/+$/, "") || "/";
  const normalizedTargetPath = targetPath.replace(/\/+$/, "") || "/";

  // Special handling for dashboard route
  if (normalizedTargetPath === "/admin") {
    return (
      normalizedCurrentPath === "/admin" ||
      normalizedCurrentPath === "/admin/dashboard"
    );
  }

  // For other routes, ensure exact path matching to avoid conflicts
  // Check if the current path starts with the target path and either:
  // 1. They are exactly the same, or
  // 2. The next character after target path is a '/' or query parameter
  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  if (normalizedCurrentPath.startsWith(normalizedTargetPath)) {
    const remainingPath = normalizedCurrentPath.substring(
      normalizedTargetPath.length
    );
    return remainingPath.startsWith("/") || remainingPath.startsWith("?");
  }

  return false;
};
