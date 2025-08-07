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
  notifications: '/admin/notifications'
};

export const getAdminRoute = (subPath = '') => {
  const basePath = '/admin';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/admin/dashboard') {
    return currentPath === '/admin' || currentPath === '/admin/' || currentPath === '/admin/dashboard';
  }
  return currentPath.startsWith(targetPath);
};


