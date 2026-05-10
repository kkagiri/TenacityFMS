// Navigation helper for notification system routes
// Base path is now /admin/notification (moved under admin module)

export const NOTIFICATION_BASE_PATH = '/admin/notification';

export const getNotificationRoute = (subPath = '') => {
  if (!subPath) return NOTIFICATION_BASE_PATH;
  return `${NOTIFICATION_BASE_PATH}/${subPath}`;
};

export const notificationRoutes = {
  dashboard: NOTIFICATION_BASE_PATH,
  policies: `${NOTIFICATION_BASE_PATH}/policies`,
  policyCreate: `${NOTIFICATION_BASE_PATH}/policies/create`,
  policyEdit: (id) => `${NOTIFICATION_BASE_PATH}/policies/${id}/edit`,
  categories: `${NOTIFICATION_BASE_PATH}/categories`,
  emailConfig: `${NOTIFICATION_BASE_PATH}/configuration/email`,
  templates: `${NOTIFICATION_BASE_PATH}/configuration/templates`,
  recipients: `${NOTIFICATION_BASE_PATH}/recipients`,
  preferences: `${NOTIFICATION_BASE_PATH}/preferences`,
  history: `${NOTIFICATION_BASE_PATH}/history`,
  testing: `${NOTIFICATION_BASE_PATH}/testing`,
  alertConfiguration: `${NOTIFICATION_BASE_PATH}/alert-configuration`
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === NOTIFICATION_BASE_PATH) {
    return currentPath === NOTIFICATION_BASE_PATH || currentPath === NOTIFICATION_BASE_PATH + '/';
  }
  return currentPath.startsWith(targetPath);
};
