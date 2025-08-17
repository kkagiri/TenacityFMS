// Navigation helper for notification system routes

export const getNotificationRoute = (subPath = '') => {
  const basePath = '/notifications';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

export const notificationRoutes = {
  dashboard: '/notifications',
  policies: '/notifications/policies',
  policyCreate: '/notifications/policies/create',
  policyEdit: (id) => `/notifications/policies/${id}/edit`,
  emailConfig: '/notifications/configuration/email',
  templates: '/notifications/configuration/templates',
  recipients: '/notifications/recipients',
  preferences: '/notifications/preferences',
  history: '/notifications/history',
  testing: '/notifications/testing'
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/notifications') {
    return currentPath === '/notifications' || currentPath === '/notifications/';
  }
  return currentPath.startsWith(targetPath);
};
