// Navigation helper for notification system routes

export const getNotificationRoute = (subPath = '') => {
  const basePath = '/admin/notifications';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

export const notificationRoutes = {
  dashboard: '/admin/notifications',
  policies: '/admin/notifications/policies',
  policyCreate: '/admin/notifications/policies/create',
  policyEdit: (id) => `/admin/notifications/policies/${id}/edit`,
  emailConfig: '/admin/notifications/configuration/email',
  templates: '/admin/notifications/configuration/templates',
  recipients: '/admin/notifications/recipients',
  history: '/admin/notifications/history',
  testing: '/admin/notifications/testing'
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/admin/notifications') {
    return currentPath === '/admin/notifications' || currentPath === '/admin/notifications/';
  }
  return currentPath.startsWith(targetPath);
};
