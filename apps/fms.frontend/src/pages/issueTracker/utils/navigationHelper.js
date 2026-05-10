// Navigation helper for issue tracker operations routes

export const getIssueTrackerRoute = (subPath = '') => {
  const basePath = '/issue-tracker';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/issue-tracker/dashboard') {
    return currentPath === '/issue-tracker' || currentPath === '/issue-tracker/' || currentPath === '/issue-tracker/dashboard';
  }
  return currentPath.startsWith(targetPath);
};

// Navigation groups for organized sidebar
export const navigationGroups = {
  main: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fa-light fa-chart-line',
      path: '/issue-tracker/dashboard',
      badge: null,
    },
    {
      id: 'tickets',
      title: 'Issue Tickets',
      icon: 'fa-light fa-ticket',
      path: '/issue-tracker/tickets',
      badge: null,
      description: 'Manage and track all issue tickets'
    },
    {
      id: 'create',
      title: 'Create Issue',
      icon: 'fa-light fa-plus-circle',
      path: '/issue-tracker/create',
      badge: null,
    }
  ],
  analysis: [
    {
      id: 'reports',
      title: 'Reports',
      icon: 'fa-light fa-chart-bar',
      path: '/issue-tracker/reports',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'fa-light fa-analytics',
      path: '/issue-tracker/analytics',
    },
    {
      id: 'filters',
      title: 'Advanced Filters',
      icon: 'fa-light fa-filter',
      path: '/issue-tracker/filters',
    }
  ],
  configuration: [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'fa-light fa-bell',
      path: '/issue-tracker/notifications',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: '/issue-tracker/settings',
    }
  ]
};
