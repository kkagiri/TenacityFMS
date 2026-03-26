/**
 * File: navigationHelper.js
 * Purpose: Centralizes vehicle-module routes and sidebar navigation metadata.
 * Dependencies: Vehicle module route structure.
 * Last Modified: 2026-03-25
 */

export const vehicleRoutes = {
  dashboard: '/vehicles',
  fleet: '/vehicles/fleet',
  geofenceManagement: '/vehicles/geofencemanagement',
  trips: '/vehicles/trips',
  tripSettings: '/vehicles/trips/settings',
  tripClusterPreview: '/vehicles/trips/cluster-preview',
  maintenance: '/vehicles/maintenance',
  consumption: '/vehicles/consumption',
  consumptionComparison: '/vehicles/consumption-comparison',
  tracking: '/vehicles/tracking',
  reports: '/vehicles/reports',
  documents: '/vehicles/documents',
  transfers: '/vehicles/transfers',
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

  if (targetPath === vehicleRoutes.trips) {
    return currentPath === vehicleRoutes.trips || currentPath.startsWith(`${vehicleRoutes.trips}/`);
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
      permissionAny: ['_Read_Vehicle'],
      description: 'Manage all vehicles in your fleet'
    },
    {
      id: 'tracking',
      title: 'GPS Tracking',
      icon: 'fa-light fa-location-dot',
      path: vehicleRoutes.tracking,
      badge: 'Live',
      permissionAny: ['_Read_VehicleTracking', '_Read_Vehicle'],
    },
    {
      id: 'geofence-management',
      title: 'Geofence Management',
      icon: 'fa-light fa-map-location-dot',
      path: vehicleRoutes.geofenceManagement,
      permissionAny: ['_Read_Geofence', '_Read_VehicleTracking', '_Read_Vehicle'],
      description: 'Manage fleet geofences, fueling route validation, and trip classification boundaries'
    }
  ],
  operations: [
    {
      id: 'trips',
      title: 'Trip Management',
      icon: 'fa-light fa-route',
      path: vehicleRoutes.trips,
      badge: 'New',
      permissionAny: ['_Read_VehicleTrips', '_Read_Vehicle'],
      description: 'Review persisted trip groups and detection modes',
      children: [
        {
          id: 'trip-settings',
          title: 'Trip Settings',
          icon: 'fa-light fa-sliders',
          path: vehicleRoutes.tripSettings,
          permissionAny: ['_Read_VehicleTrips', '_Edit_VehicleTrips', '_Read_Vehicle', '_Edit_Vehicle'],
          description: 'Control realtime trip execution settings'
        },
        {
          id: 'trip-cluster-preview',
          title: 'Cluster Preview',
          icon: 'fa-light fa-chart-scatter-bubble',
          path: vehicleRoutes.tripClusterPreview,
          permissionAny: ['_Read_VehicleTrips', '_Read_Vehicle'],
          description: 'Preview cluster detection with timeline and speed analytics'
        }
      ]
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      icon: 'fa-light fa-wrench',
      path: vehicleRoutes.maintenance,
      badge: null,
      permissionAny: ['_Read_VehicleMaintenance', '_Read_Vehicle'],
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: 'fa-light fa-file-lines',
      path: vehicleRoutes.documents,
      permissionAny: ['_Read_VehicleDocuments', '_Read_Vehicle'],
    },
    {
      id: 'transfers',
      title: 'Vehicle Transfers',
      icon: 'fa-light fa-truck-arrow-right',
      path: vehicleRoutes.transfers,
      permissionAny: ['_Read_VehicleTransfer', '_Create_VehicleTransfer', '_Manage_VehicleTransfer'],
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
