// Navigation helper functions for admin operations routes

export const adminRoutes = {
  dashboard: '/admin',
  users: '/admin/users',
  roles: '/admin/roles',
  permissions: '/admin/permissions',
  navigation: '/admin/navigation',
  tags: '/admin/tags',
  sites: '/admin/sites',
  tanks: '/admin/tanks',
  ptsdevice: '/admin/ptsdevice',
  ptsconfig: '/admin/ptsconfig',
  configuration: '/admin/configuration',
  systemconfig: '/admin/systemconfig',
  ptsService: '/admin/pts-service',
  notifications: '/admin/notifications',
  providers: '/admin/providers'
};

export const getAdminRoute = (subPath = '') => {
  const basePath = '/admin';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  // Remove trailing slashes for consistent comparison
  const normalizedCurrentPath = currentPath.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetPath.replace(/\/+$/, '') || '/';

  // Special handling for dashboard route
  if (normalizedTargetPath === '/admin') {
    return normalizedCurrentPath === '/admin' || normalizedCurrentPath === '/admin/dashboard';
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


