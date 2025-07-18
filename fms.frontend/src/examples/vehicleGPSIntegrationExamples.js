/**
 * Vehicle GPS Integration Examples for FMS Modules
 * Shows how to integrate vehicleGPSTrackingService into existing FMS pages
 */

import vehicleGPSTrackingService from '../services/vehicleGPSTrackingService';
import { notify } from 'devextreme/ui/notify';

/**
 * DISPATCH MODULE INTEGRATION EXAMPLES
 */
export class DispatchModuleIntegration {

  /**
   * Get vehicle location for dispatch assignment
   * Use in dispatch/vehicle assignment pages
   */
  static async getVehicleForDispatch(vehicleId) {
    try {
      const response = await vehicleGPSTrackingService.getVehicleLocation(vehicleId);

      if (response.isSuccess && response.data) {
        const location = response.data;

        return {
          vehicleId: location.vehicleId,
          vehicleName: location.vehicleName,
          numberPlate: location.numberPlate,
          isAvailable: location.isOnline && !location.isMoving,
          currentLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || 'Address not available'
          },
          lastSeen: location.lastUpdated,
          status: location.status,
          speed: location.speed || 0,
          canBeDispatched: location.hasGPSInstalled && location.isOnline
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting vehicle for dispatch:', error);
      notify(`Failed to get vehicle location: ${error.message}`, 'error', 3000);
      return null;
    }
  }

  /**
   * Get all available vehicles for dispatch
   * Use in dispatch dashboard/vehicle selection
   */
  static async getAvailableVehiclesForDispatch() {
    try {
      const response = await vehicleGPSTrackingService.getAllVehicleLocations(true, true); // Online and GPS-enabled only

      if (response.isSuccess && response.data) {
        return response.data
          .filter(vehicle => vehicle.isOnline && !vehicle.isMoving) // Available vehicles
          .map(vehicle => ({
            vehicleId: vehicle.vehicleId,
            vehicleName: vehicle.vehicleName,
            numberPlate: vehicle.numberPlate,
            location: vehicleGPSTrackingService.formatLocation(vehicle),
            lastUpdated: vehicle.lastUpdated,
            status: vehicle.status,
            distanceFromBase: null // Calculate if you have base coordinates
          }))
          .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)); // Most recent first
      }

      return [];
    } catch (error) {
      console.error('Error getting available vehicles:', error);
      notify('Failed to load available vehicles', 'error', 3000);
      return [];
    }
  }

  /**
   * Check if vehicle can be dispatched to a location
   * Use before creating dispatch orders
   */
  static async canDispatchVehicle(vehicleId, destinationLat, destinationLon) {
    try {
      const vehicle = await this.getVehicleForDispatch(vehicleId);

      if (!vehicle || !vehicle.canBeDispatched) {
        return {
          canDispatch: false,
          reason: 'Vehicle is not available or does not have GPS'
        };
      }

      // Calculate distance to destination
      const distance = vehicleGPSTrackingService.calculateDistance(
        vehicle.currentLocation.latitude,
        vehicle.currentLocation.longitude,
        destinationLat,
        destinationLon
      );

      return {
        canDispatch: true,
        vehicle: vehicle,
        estimatedDistance: distance,
        estimatedTravelTime: Math.round((distance / 40) * 60) // Assuming 40 km/h average speed
      };

    } catch (error) {
      console.error('Error checking dispatch capability:', error);
      return {
        canDispatch: false,
        reason: 'Unable to verify vehicle status'
      };
    }
  }
}

/**
 * MAINTENANCE MODULE INTEGRATION EXAMPLES
 */
export class MaintenanceModuleIntegration {

  /**
   * Get vehicle odometer for maintenance scheduling
   * Use in maintenance planning pages
   */
  static async getVehicleMaintenanceData(vehicleId) {
    try {
      const response = await vehicleGPSTrackingService.getVehicleOdometer(vehicleId);

      if (response.isSuccess && response.data) {
        const odometer = response.data;

        return {
          vehicleId: odometer.vehicleId,
          vehicleName: odometer.vehicleName,
          numberPlate: odometer.numberPlate,
          currentOdometer: odometer.currentOdometer,
          totalDistance: odometer.totalDistance,
          lastUpdated: odometer.lastUpdated,
          unit: odometer.unit,
          hasGPS: odometer.hasGPSInstalled,
          // Add maintenance calculation logic here
          maintenanceInfo: this.calculateMaintenanceStatus(odometer.currentOdometer)
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting vehicle maintenance data:', error);
      notify(`Failed to get odometer data: ${error.message}`, 'error', 3000);
      return null;
    }
  }

  /**
   * Calculate maintenance status based on odometer reading
   */
  static calculateMaintenanceStatus(currentOdometer) {
    // Example maintenance intervals (customize based on your requirements)
    const maintenanceIntervals = {
      oilChange: 5000,
      tireRotation: 10000,
      majorService: 20000
    };

    const nextOilChange = Math.ceil(currentOdometer / maintenanceIntervals.oilChange) * maintenanceIntervals.oilChange;
    const nextTireRotation = Math.ceil(currentOdometer / maintenanceIntervals.tireRotation) * maintenanceIntervals.tireRotation;
    const nextMajorService = Math.ceil(currentOdometer / maintenanceIntervals.majorService) * maintenanceIntervals.majorService;

    return {
      nextOilChange: {
        dueAt: nextOilChange,
        remaining: nextOilChange - currentOdometer,
        isOverdue: currentOdometer >= nextOilChange
      },
      nextTireRotation: {
        dueAt: nextTireRotation,
        remaining: nextTireRotation - currentOdometer,
        isOverdue: currentOdometer >= nextTireRotation
      },
      nextMajorService: {
        dueAt: nextMajorService,
        remaining: nextMajorService - currentOdometer,
        isOverdue: currentOdometer >= nextMajorService
      }
    };
  }

  /**
   * Get fleet maintenance overview
   * Use in maintenance dashboard
   */
  static async getFleetMaintenanceOverview() {
    try {
      const response = await vehicleGPSTrackingService.getAllVehicleLocations(false, true); // All GPS vehicles

      if (response.isSuccess && response.data) {
        const maintenancePromises = response.data.map(async (vehicle) => {
          const maintenanceData = await this.getVehicleMaintenanceData(vehicle.vehicleId);
          return maintenanceData;
        });

        const maintenanceData = await Promise.all(maintenancePromises);

        return maintenanceData
          .filter(data => data !== null)
          .map(data => ({
            ...data,
            priority: this.getMaintenancePriority(data.maintenanceInfo)
          }))
          .sort((a, b) => b.priority - a.priority); // High priority first
      }

      return [];
    } catch (error) {
      console.error('Error getting fleet maintenance overview:', error);
      notify('Failed to load fleet maintenance data', 'error', 3000);
      return [];
    }
  }

  /**
   * Calculate maintenance priority (1-5, 5 being highest)
   */
  static getMaintenancePriority(maintenanceInfo) {
    if (!maintenanceInfo) return 1;

    let priority = 1;

    if (maintenanceInfo.nextOilChange.isOverdue) priority = Math.max(priority, 4);
    if (maintenanceInfo.nextTireRotation.isOverdue) priority = Math.max(priority, 3);
    if (maintenanceInfo.nextMajorService.isOverdue) priority = Math.max(priority, 5);

    // Check if maintenance is due soon (within 500 km)
    if (maintenanceInfo.nextOilChange.remaining < 500) priority = Math.max(priority, 3);
    if (maintenanceInfo.nextMajorService.remaining < 1000) priority = Math.max(priority, 4);

    return priority;
  }
}

/**
 * SHARED UTILITIES FOR BOTH MODULES
 */
export class SharedGPSUtilities {

  /**
   * Check GPS system health
   * Use in system status pages
   */
  static async checkGPSSystemHealth() {
    try {
      const response = await vehicleGPSTrackingService.getConnectionStatus();

      return {
        isConnected: response.isSuccess && response.data,
        message: response.isSuccess ? 'GPS system is operational' : 'GPS system is offline',
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Error checking GPS system health:', error);
      return {
        isConnected: false,
        message: 'Failed to check GPS system status',
        lastChecked: new Date()
      };
    }
  }

  /**
   * Get GPS vehicles summary for dashboard
   */
  static async getGPSSummaryForDashboard() {
    try {
      const response = await vehicleGPSTrackingService.getGPSVehiclesSummary();

      if (response.isSuccess && response.data) {
        return response.data;
      }

      // Fallback: calculate summary from all vehicles
      const allVehiclesResponse = await vehicleGPSTrackingService.getAllVehicleLocations();

      if (allVehiclesResponse.isSuccess && allVehiclesResponse.data) {
        const vehicles = allVehiclesResponse.data;

        return {
          totalGPSVehicles: vehicles.length,
          onlineVehicles: vehicles.filter(v => v.isOnline).length,
          offlineVehicles: vehicles.filter(v => !v.isOnline).length,
          movingVehicles: vehicles.filter(v => v.isMoving).length,
          idleVehicles: vehicles.filter(v => v.isOnline && !v.isMoving).length
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting GPS summary:', error);
      return null;
    }
  }

  /**
   * Format vehicle data for display in DevExtreme grids
   */
  static formatVehicleForGrid(vehicle) {
    return {
      vehicleId: vehicle.vehicleId,
      vehicleName: vehicle.vehicleName,
      numberPlate: vehicle.numberPlate,
      status: vehicle.status,
      location: vehicleGPSTrackingService.formatLocation(vehicle),
      speed: vehicle.speed ? `${vehicle.speed.toFixed(1)} km/h` : 'N/A',
      lastUpdated: vehicle.lastUpdated,
      isOnline: vehicle.isOnline,
      isMoving: vehicle.isMoving
    };
  }
}

/**
 * ERROR HANDLING UTILITIES
 */
export class GPSErrorHandler {

  /**
   * Handle GPS service errors consistently across the application
   */
  static handleGPSError(error, context = '') {
    console.error(`GPS Error ${context}:`, error);

    if (error.message.includes('Network error')) {
      notify('GPS service is temporarily unavailable', 'warning', 5000);
      return 'NETWORK_ERROR';
    } else if (error.message.includes('404')) {
      notify('Vehicle not found or GPS not configured', 'error', 3000);
      return 'VEHICLE_NOT_FOUND';
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      notify('GPS service authentication failed', 'error', 3000);
      return 'AUTH_ERROR';
    } else {
      notify(`GPS service error: ${error.message}`, 'error', 4000);
      return 'GENERAL_ERROR';
    }
  }

  /**
   * Show GPS status notification
   */
  static showGPSStatus(isConnected) {
    if (isConnected) {
      notify('GPS system is connected and operational', 'success', 2000);
    } else {
      notify('GPS system is offline - some features may not work', 'warning', 5000);
    }
  }
}
