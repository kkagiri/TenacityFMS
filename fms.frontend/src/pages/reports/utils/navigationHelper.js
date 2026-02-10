/**
 * File: navigationHelper.js
 * Purpose: Navigation helper functions for reports routes
 * Dependencies: None
 * Last Modified: 2026-02-09
 *
 * Key Functions:
 * - getReportsRoute(): Builds report paths
 * - isActiveRoute(): Determines active route state for reports sidebar
 */

// Navigation helper functions for reports routes

export const reportsRoutes = {
  // Main
  dashboard: '/reports',

  // Report Engine
  engine: '/reports/engine',
  engineSource: (sourceId) => `/reports/engine/${sourceId}`,

  // Templates
  templates: '/reports/templates',
  templateDesigner: (name) => `/reports/templates/designer/${name}`,

  // Scheduling
  scheduling: '/reports/scheduling',
  scheduleNew: '/reports/scheduling/new',

  // Monitoring
  monitoring: '/reports/monitoring',

  // Data Management
  fuelImporter: '/reports/fuel-importer',
  scheduledEmails: '/reports/scheduled-emails',

  // Report List (grid view of all sources)
  list: '/reports/list',

  // Legacy — kept for backward compatibility
  gallery: '/reports/gallery',
  tankVolumeHistory: '/reports/tank-volume-history',
  consumptionRefills: '/reports/consumption-refills',
  vehicleConsumption: '/reports/vehicle-consumption',
  ptsOffline: '/reports/pts-offline',
};

export const getReportsRoute = (subPath = '') => {
  const basePath = '/reports';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route - CRITICAL for proper active state
export const isActiveRoute = (currentPath, targetPath) => {
  // Remove trailing slashes for consistent comparison
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetPath.replace(/\/+$/, '') || '/';

  // Special handling for dashboard route
  if (normalizedTargetPath === '/reports') {
    return normalizedCurrentPath === '/reports' || normalizedCurrentPath === '/reports/dashboard';
  }

  // For other routes, ensure exact path matching to avoid conflicts
  // Check if the current path starts with the target path and either:
  // 1. They are exactly the same, or
  // 2. The next character after target path is a '/' or query parameter
  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  if (normalizedCurrentPath.startsWith(normalizedTargetPath)) {
    const remainingPath = normalizedCurrentPath.substring(normalizedTargetPath.length);
    return remainingPath.startsWith('/') || remainingPath.startsWith('?');
  }

  return false;
};
