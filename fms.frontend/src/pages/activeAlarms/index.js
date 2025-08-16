// Main export for Active Alarms module
export { default } from './ActiveAlarmMain';
export { default as ActiveAlarmMain } from './ActiveAlarmMain';

// Export shared components for external use
export { AlarmCard } from './components/shared';
export { default as AlarmQuickStats } from './components/QuickStats/AlarmQuickStats';

// Export dashboard
export { default as ActiveAlarmDashboard } from './dashboard/ActiveAlarmDashboard';

// Export utility functions
export { activeAlarmRoutes, getActiveAlarmRoute, isActiveRoute } from './utils/navigationHelper';
