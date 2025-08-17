// Navigation helper functions for Active Alarm management routes

export const getActiveAlarmRoute = (subPath = '') => {
  const basePath = '/active-alarms';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

export const activeAlarmRoutes = {
  dashboard: '/active-alarms',
  alarmList: '/active-alarms/list',
  alarmDetails: (id) => `/active-alarms/${id}/details`,
  statistics: '/active-alarms/statistics',
  settings: '/active-alarms/settings',
  reports: '/active-alarms/reports',
  escalation: '/active-alarms/escalation',
  autoProcessing: '/active-alarms/auto-processing',
  createAlarm: '/active-alarms/create',
  bulkActions: '/active-alarms/bulk-actions',
  testGenerator: '/active-alarms/test-generator',
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/active-alarms') {
    return currentPath === '/active-alarms' || currentPath === '/active-alarms/';
  }
  return currentPath.startsWith(targetPath);
};
