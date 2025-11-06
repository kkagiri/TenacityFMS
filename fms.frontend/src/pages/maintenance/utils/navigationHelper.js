// Navigation helper functions for maintenance routes

export const maintenanceRoutes = {
  dashboard: '/maintenance',
  records: '/maintenance/records',
  settings: '/maintenance/settings',
  // Add more routes as needed
};

export const getMaintenanceRoute = (subPath = '') => {
  const basePath = '/maintenance';
  if (!subPath) {
    return basePath;
  }
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route - CRITICAL for proper active state
export const isActiveRoute = (currentPath, targetPath) => {
  // Remove trailing slashes for consistent comparison
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetPath.replace(/\/+$/, '') || '/';

  // Exact match for base paths
  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  // For dashboard - only match exact path or /maintenance/dashboard
  if (normalizedTargetPath === '/maintenance' || normalizedTargetPath === '/maintenance/dashboard') {
    return normalizedCurrentPath === '/maintenance' ||
           normalizedCurrentPath === '/maintenance/dashboard';
  }

  // For other routes - check if current path starts with target path
  // but ensure we don't match partial segments
  if (normalizedCurrentPath.startsWith(normalizedTargetPath + '/') ||
      normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  return false;
};
