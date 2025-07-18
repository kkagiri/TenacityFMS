// Navigation helper functions for vehicle management routes

export const vehicleRoutes = {
  dashboard: '/vehicles',
  fleet: '/vehicles/fleet',
  maintenance: '/vehicles/maintenance',
  consumption: '/vehicles/consumption',
  tracking: '/vehicles/tracking',
  reports: '/vehicles/reports',
  settings: '/vehicles/settings',
  addVehicle: '/vehicles/fleet#vehicleaction'
};

export const getVehicleRoute = (subPath = '') => {
  const basePath = '/vehicles';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

// Helper to get vehicle details route by ID
export const getVehicleDetailsRoute = (vehicleId) => {
  return `/vehicles/${vehicleId}/details`;
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/vehicles') {
    return currentPath === '/vehicles' || currentPath === '/vehicles/';
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
      path: vehicleRoutes.dashboard,
      badge: null,
    },
    {
      id: 'fleet',
      title: 'Fleet Management',
      icon: 'fa-light fa-cars',
      path: vehicleRoutes.fleet,
      badge: null,
      description: 'Manage all vehicles in your fleet'
    },
    {
      id: 'tracking',
      title: 'GPS Tracking',
      icon: 'fa-light fa-location-dot',
      path: vehicleRoutes.tracking,
      badge: 'Live',
    }
  ],
  operations: [
    {
      id: 'consumption',
      title: 'Fuel Consumption',
      icon: 'fa-light fa-gas-pump',
      path: vehicleRoutes.consumption,
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      icon: 'fa-light fa-wrench',
      path: vehicleRoutes.maintenance,
      badge: null,
    },

    {
      id: 'reports',
      title: 'Reports',
      icon: 'fa-light fa-chart-bar',
      path: vehicleRoutes.reports,
    }
  ],
  configuration: [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'fa-light fa-cog',
      path: vehicleRoutes.settings,
    }
  ]
};
