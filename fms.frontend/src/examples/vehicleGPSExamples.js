/**
 * Usage Examples for Vehicle GPS Tracking Service
 *
 * This file demonstrates how to use the vehicle GPS tracking service
 * in both Dispatch and Maintenance modules
 */

import vehicleGPSTrackingService from '../services/vehicleGPSTrackingService';

// =============================================================================
// DISPATCH MODULE USAGE EXAMPLES
// =============================================================================

/**
 * Example 1: Get vehicle location for dispatch tracking
 */
export const DispatchExamples = {

  // Get single vehicle location
  async getVehicleLocationForDispatch(vehicleId) {
    try {
      const response = await vehicleGPSTrackingService.getVehicleLocation(vehicleId);

      if (response.isSuccess) {
        const location = response.data;

        console.log('Vehicle Location:', {
          vehicleId: location.vehicleId,
          vehicleName: location.vehicleName,
          position: `${location.latitude}, ${location.longitude}`,
          speed: `${location.speed || 0} km/h`,
          status: location.isOnline ? 'Online' : 'Offline',
          isMoving: location.isMoving,
          lastUpdate: location.lastUpdated
        });

        return location;
      } else {
        console.error('Failed to get vehicle location:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error in dispatch location fetch:', error.message);
      return null;
    }
  },

  // Get all vehicle locations for fleet overview
  async getFleetStatusForDispatch() {
    try {
      const response = await vehicleGPSTrackingService.getAllVehicleLocations(false, true);

      if (response.isSuccess) {
        const vehicles = response.data;

        const fleetStatus = {
          totalVehicles: vehicles.length,
          onlineVehicles: vehicles.filter(v => v.isOnline).length,
          inTransitVehicles: vehicles.filter(v => v.isMoving).length,
          parkedVehicles: vehicles.filter(v => v.isOnline && !v.isMoving).length,
          offlineVehicles: vehicles.filter(v => !v.isOnline).length
        };

        console.log('Fleet Status:', fleetStatus);
        return { fleetStatus, vehicles };
      }

      return null;
    } catch (error) {
      console.error('Error getting fleet status:', error.message);
      return null;
    }
  },

  // Check if vehicle is available for dispatch
  async isVehicleAvailableForDispatch(vehicleId) {
    try {
      const location = await this.getVehicleLocationForDispatch(vehicleId);

      if (location) {
        const isAvailable = location.isOnline && !location.isMoving;

        return {
          vehicleId,
          isAvailable,
          status: location.isOnline ? 'Online' : 'Offline',
          isMoving: location.isMoving,
          location: vehicleGPSTrackingService.formatLocation(location),
          lastUpdate: location.lastUpdated
        };
      }

      return { vehicleId, isAvailable: false, status: 'Unknown' };
    } catch (error) {
      console.error('Error checking vehicle availability:', error.message);
      return { vehicleId, isAvailable: false, status: 'Error' };
    }
  }
};

// =============================================================================
// MAINTENANCE MODULE USAGE EXAMPLES
// =============================================================================

/**
 * Example 2: Get vehicle odometer for maintenance scheduling
 */
export const MaintenanceExamples = {

  // Get vehicle odometer reading
  async getVehicleOdometerForMaintenance(vehicleId) {
    try {
      const response = await vehicleGPSTrackingService.getVehicleOdometer(vehicleId);

      if (response.isSuccess) {
        const odometer = response.data;

        console.log('Vehicle Odometer:', {
          vehicleId: odometer.vehicleId,
          vehicleName: odometer.vehicleName,
          currentReading: `${odometer.currentOdometer} ${odometer.unit}`,
          totalDistance: `${odometer.totalDistance} ${odometer.unit}`,
          lastUpdate: odometer.lastUpdated
        });

        return odometer;
      } else {
        console.error('Failed to get odometer reading:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error getting odometer reading:', error.message);
      return null;
    }
  },

  // Check if vehicle needs maintenance based on odometer
  async checkMaintenanceRequired(vehicleId, maintenanceIntervalKm = 10000) {
    try {
      const odometer = await this.getVehicleOdometerForMaintenance(vehicleId);

      if (odometer) {
        const kmSinceLastMaintenance = odometer.currentOdometer % maintenanceIntervalKm;
        const kmUntilMaintenance = maintenanceIntervalKm - kmSinceLastMaintenance;

        const maintenanceStatus = {
          vehicleId,
          vehicleName: odometer.vehicleName,
          currentOdometer: odometer.currentOdometer,
          maintenanceInterval: maintenanceIntervalKm,
          kmSinceLastMaintenance,
          kmUntilMaintenance,
          maintenanceRequired: kmUntilMaintenance <= 1000, // Within 1000km
          maintenanceUrgent: kmUntilMaintenance <= 500,    // Within 500km
          lastOdometerUpdate: odometer.lastUpdated
        };

        console.log('Maintenance Status:', maintenanceStatus);
        return maintenanceStatus;
      }

      return null;
    } catch (error) {
      console.error('Error checking maintenance requirements:', error.message);
      return null;
    }
  },

  // Get maintenance overview for all GPS-enabled vehicles
  async getMaintenanceOverview() {
    try {
      const response = await vehicleGPSTrackingService.getAllVehicleLocations(false, true);

      if (response.isSuccess) {
        const vehicles = response.data;
        const maintenanceOverview = [];

        for (const vehicle of vehicles) {
          try {
            const maintenanceStatus = await this.checkMaintenanceRequired(vehicle.vehicleId);
            if (maintenanceStatus) {
              maintenanceOverview.push(maintenanceStatus);
            }
          } catch (error) {
            console.warn(`Could not get maintenance status for vehicle ${vehicle.vehicleId}`);
          }
        }

        const summary = {
          totalVehicles: maintenanceOverview.length,
          requireMaintenance: maintenanceOverview.filter(v => v.maintenanceRequired).length,
          urgentMaintenance: maintenanceOverview.filter(v => v.maintenanceUrgent).length,
          vehicles: maintenanceOverview
        };

        console.log('Maintenance Overview:', summary);
        return summary;
      }

      return null;
    } catch (error) {
      console.error('Error getting maintenance overview:', error.message);
      return null;
    }
  }
};

// =============================================================================
// SHARED UTILITIES
// =============================================================================

/**
 * Shared utilities for both modules
 */
export const SharedUtilities = {

  // Test GPS connection
  async testGPSConnection() {
    try {
      const response = await vehicleGPSTrackingService.getConnectionStatus();

      console.log('GPS Connection Status:', {
        isConnected: response.isConnected,
        message: response.message,
        timestamp: response.timestamp
      });

      return response;
    } catch (error) {
      console.error('Error testing GPS connection:', error.message);
      return { isConnected: false, message: 'Connection test failed' };
    }
  },

  // Get GPS summary for dashboard
  async getGPSSummary() {
    try {
      const response = await vehicleGPSTrackingService.getGPSVehiclesSummary();

      if (response.success) {
        console.log('GPS Summary:', response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error getting GPS summary:', error.message);
      return null;
    }
  },

  // Batch check vehicle trackability
  async checkVehiclesTrackable(vehicleIds) {
    const results = [];

    for (const vehicleId of vehicleIds) {
      try {
        const isTrackable = await vehicleGPSTrackingService.isVehicleTrackable(vehicleId);
        results.push({ vehicleId, isTrackable });
      } catch (error) {
        results.push({ vehicleId, isTrackable: false, error: error.message });
      }
    }

    console.log('Vehicle Trackability Results:', results);
    return results;
  }
};

// =============================================================================
// USAGE IN REACT COMPONENTS
// =============================================================================

/**
 * Example React component usage
 */
export const ReactComponentExamples = {

  // For Dispatch Component
  dispatchComponent: `
    import React, { useState, useEffect } from 'react';
    import { DispatchExamples } from './vehicleGPSExamples';

    const DispatchPage = () => {
      const [fleetStatus, setFleetStatus] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        loadFleetStatus();
      }, []);

      const loadFleetStatus = async () => {
        setLoading(true);
        try {
          const data = await DispatchExamples.getFleetStatusForDispatch();
          setFleetStatus(data);
        } catch (error) {
          console.error('Error loading fleet status:', error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h2>Fleet Status</h2>
          {loading ? (
            <div>Loading...</div>
          ) : fleetStatus ? (
            <div>
              <p>Total Vehicles: {fleetStatus.fleetStatus.totalVehicles}</p>
              <p>Online: {fleetStatus.fleetStatus.onlineVehicles}</p>
              <p>In Transit: {fleetStatus.fleetStatus.inTransitVehicles}</p>
              <p>Parked: {fleetStatus.fleetStatus.parkedVehicles}</p>
            </div>
          ) : (
            <div>Failed to load fleet data</div>
          )}
        </div>
      );
    };
  `,

  // For Maintenance Component
  maintenanceComponent: `
    import React, { useState, useEffect } from 'react';
    import { MaintenanceExamples } from './vehicleGPSExamples';

    const MaintenancePage = () => {
      const [maintenanceOverview, setMaintenanceOverview] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        loadMaintenanceOverview();
      }, []);

      const loadMaintenanceOverview = async () => {
        setLoading(true);
        try {
          const data = await MaintenanceExamples.getMaintenanceOverview();
          setMaintenanceOverview(data);
        } catch (error) {
          console.error('Error loading maintenance overview:', error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div>
          <h2>Maintenance Overview</h2>
          {loading ? (
            <div>Loading...</div>
          ) : maintenanceOverview ? (
            <div>
              <p>Total Vehicles: {maintenanceOverview.totalVehicles}</p>
              <p>Require Maintenance: {maintenanceOverview.requireMaintenance}</p>
              <p>Urgent Maintenance: {maintenanceOverview.urgentMaintenance}</p>
            </div>
          ) : (
            <div>Failed to load maintenance data</div>
          )}
        </div>
      );
    };
  `
};
