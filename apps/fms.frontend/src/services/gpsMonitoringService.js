import notify from 'devextreme/ui/notify';
import issueTrackerService from '../issueTrackerService';

/**
 * GPS Monitoring Service
 * Monitors GPS data and triggers issue creation when anomalies are detected
 */
class GPSMonitoringService {
  constructor() {
    this.monitoringInterval = null;
    this.vehicleGpsCache = new Map(); // Cache for vehicle GPS data
    this.alertThresholds = {
      signalLossMinutes: 30, // Trigger alert after 30 minutes of signal loss
      speedAnomalyThreshold: 120, // Trigger alert for speeds over 120 km/h
      geofenceViolation: true, // Monitor geofence violations
      engineIdleTime: 60 // Trigger alert after 60 minutes of idle time
    };
    this.isMonitoring = false;
  }

  /**
   * Start GPS monitoring
   * @param {number} intervalSeconds - Monitoring interval in seconds (default: 60)
   */
  startMonitoring(intervalSeconds = 60) {
    if (this.isMonitoring) {
      console.log('GPS monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkGPSData();
    }, intervalSeconds * 1000);

    console.log(`GPS monitoring started with ${intervalSeconds}s interval`);

    notify({
      message: 'GPS monitoring service started',
      type: 'info',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });
  }

  /**
   * Stop GPS monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('GPS monitoring stopped');
  }

  /**
   * Check GPS data for all vehicles
   */
  async checkGPSData() {
    try {
      // In a real implementation, this would fetch from your GPS/fleet management API
      const gpsData = await this.fetchGPSData();

      for (const vehicleData of gpsData) {
        await this.analyzeVehicleData(vehicleData);
      }
    } catch (error) {
      console.error('Error checking GPS data:', error);
    }
  }

  /**
   * Fetch GPS data from fleet management system
   * This is a mock implementation - replace with actual API calls
   */
  async fetchGPSData() {
    // Mock GPS data - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            vehicleId: 1,
            vehicleName: 'Truck 001',
            latitude: 40.7128,
            longitude: -74.0060,
            speed: 0,
            lastUpdate: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
            engineStatus: 'idle',
            fuelLevel: 75,
            isInGeofence: true,
            address: '123 Main St, New York, NY'
          },
          {
            vehicleId: 2,
            vehicleName: 'Van 002',
            latitude: 40.7589,
            longitude: -73.9851,
            speed: 130, // Speed anomaly
            lastUpdate: new Date(),
            engineStatus: 'running',
            fuelLevel: 25, // Low fuel
            isInGeofence: true,
            address: '456 Broadway, New York, NY'
          },
          {
            vehicleId: 3,
            vehicleName: 'Truck 003',
            latitude: 40.7831,
            longitude: -73.9712,
            speed: 0,
            lastUpdate: new Date(Date.now() - 65 * 60 * 1000), // 65 minutes ago - signal loss
            engineStatus: 'unknown',
            fuelLevel: 50,
            isInGeofence: false, // Geofence violation
            address: 'Unknown Location'
          }
        ]);
      }, 1000);
    });
  }

  /**
   * Analyze individual vehicle data for anomalies
   */
  async analyzeVehicleData(vehicleData) {
    const { vehicleId } = vehicleData;
    const previousData = this.vehicleGpsCache.get(vehicleId);

    // Update cache
    this.vehicleGpsCache.set(vehicleId, vehicleData);

    // Check for signal loss
    if (this.hasSignalLoss(vehicleData)) {
      await this.triggerSignalLossIssue(vehicleData);
    }

    // Check for speed anomalies
    if (this.hasSpeedAnomaly(vehicleData)) {
      await this.triggerSpeedAnomalyIssue(vehicleData);
    }

    // Check for geofence violations
    if (this.hasGeofenceViolation(vehicleData)) {
      await this.triggerGeofenceViolationIssue(vehicleData);
    }

    // Check for low fuel
    if (this.hasLowFuel(vehicleData)) {
      await this.triggerLowFuelIssue(vehicleData);
    }

    // Check for extended idle time
    if (this.hasExtendedIdle(vehicleData, previousData)) {
      await this.triggerExtendedIdleIssue(vehicleData);
    }
  }

  /**
   * Check if vehicle has signal loss
   */
  hasSignalLoss(vehicleData) {
    const minutesSinceLastUpdate = (Date.now() - new Date(vehicleData.lastUpdate).getTime()) / (1000 * 60);
    return minutesSinceLastUpdate > this.alertThresholds.signalLossMinutes;
  }

  /**
   * Check if vehicle has speed anomaly
   */
  hasSpeedAnomaly(vehicleData) {
    return vehicleData.speed > this.alertThresholds.speedAnomalyThreshold;
  }

  /**
   * Check if vehicle has geofence violation
   */
  hasGeofenceViolation(vehicleData) {
    return !vehicleData.isInGeofence;
  }

  /**
   * Check if vehicle has low fuel
   */
  hasLowFuel(vehicleData) {
    return vehicleData.fuelLevel < 20; // Less than 20%
  }

  /**
   * Check if vehicle has been idle for extended time
   */
  hasExtendedIdle(vehicleData, previousData) {
    return vehicleData.engineStatus === 'idle' &&
           vehicleData.speed === 0 &&
           previousData &&
           previousData.engineStatus === 'idle';
  }

  /**
   * Trigger signal loss issue
   */
  async triggerSignalLossIssue(vehicleData) {
    const minutesSinceLastUpdate = Math.floor((Date.now() - new Date(vehicleData.lastUpdate).getTime()) / (1000 * 60));

    const issueData = {
      problemTitle: `GPS Signal Lost - ${vehicleData.vehicleName}`,
      problemDescription: `Vehicle ${vehicleData.vehicleName} has not reported GPS data for ${minutesSinceLastUpdate} minutes. Last known location: ${vehicleData.address}`,
      categoryName: 'GPS/Tracking',
      priorityName: 'High',
      statusName: 'Open',
      vehicleId: vehicleData.vehicleId,
      vehicleName: vehicleData.vehicleName,
      gpsLatitude: vehicleData.latitude,
      gpsLongitude: vehicleData.longitude,
      gpsAddress: vehicleData.address,
      gpsTimestamp: vehicleData.lastUpdate,
      isUrgent: true,
      notes: `Automated issue created due to GPS signal loss. Threshold: ${this.alertThresholds.signalLossMinutes} minutes.`
    };

    await this.createAutomatedIssue(issueData, 'GPS Signal Loss');
  }

  /**
   * Trigger speed anomaly issue
   */
  async triggerSpeedAnomalyIssue(vehicleData) {
    const issueData = {
      problemTitle: `Speed Violation - ${vehicleData.vehicleName}`,
      problemDescription: `Vehicle ${vehicleData.vehicleName} is traveling at ${vehicleData.speed} km/h, which exceeds the maximum allowed speed of ${this.alertThresholds.speedAnomalyThreshold} km/h.`,
      categoryName: 'Safety',
      priorityName: 'Critical',
      statusName: 'Open',
      vehicleId: vehicleData.vehicleId,
      vehicleName: vehicleData.vehicleName,
      gpsLatitude: vehicleData.latitude,
      gpsLongitude: vehicleData.longitude,
      gpsAddress: vehicleData.address,
      gpsTimestamp: new Date(),
      isUrgent: true,
      notes: `Automated issue created due to speed violation. Current speed: ${vehicleData.speed} km/h`
    };

    await this.createAutomatedIssue(issueData, 'Speed Violation');
  }

  /**
   * Trigger geofence violation issue
   */
  async triggerGeofenceViolationIssue(vehicleData) {
    const issueData = {
      problemTitle: `Geofence Violation - ${vehicleData.vehicleName}`,
      problemDescription: `Vehicle ${vehicleData.vehicleName} has left the designated operational area. Current location: ${vehicleData.address}`,
      categoryName: 'Security',
      priorityName: 'High',
      statusName: 'Open',
      vehicleId: vehicleData.vehicleId,
      vehicleName: vehicleData.vehicleName,
      gpsLatitude: vehicleData.latitude,
      gpsLongitude: vehicleData.longitude,
      gpsAddress: vehicleData.address,
      gpsTimestamp: new Date(),
      isUrgent: true,
      notes: 'Automated issue created due to geofence violation.'
    };

    await this.createAutomatedIssue(issueData, 'Geofence Violation');
  }

  /**
   * Trigger low fuel issue
   */
  async triggerLowFuelIssue(vehicleData) {
    const issueData = {
      problemTitle: `Low Fuel Alert - ${vehicleData.vehicleName}`,
      problemDescription: `Vehicle ${vehicleData.vehicleName} has low fuel level at ${vehicleData.fuelLevel}%. Immediate refueling required.`,
      categoryName: 'Maintenance',
      priorityName: 'Medium',
      statusName: 'Open',
      vehicleId: vehicleData.vehicleId,
      vehicleName: vehicleData.vehicleName,
      gpsLatitude: vehicleData.latitude,
      gpsLongitude: vehicleData.longitude,
      gpsAddress: vehicleData.address,
      gpsTimestamp: new Date(),
      isUrgent: false,
      notes: `Automated issue created due to low fuel. Current level: ${vehicleData.fuelLevel}%`
    };

    await this.createAutomatedIssue(issueData, 'Low Fuel Alert');
  }

  /**
   * Trigger extended idle issue
   */
  async triggerExtendedIdleIssue(vehicleData) {
    const issueData = {
      problemTitle: `Extended Idle Time - ${vehicleData.vehicleName}`,
      problemDescription: `Vehicle ${vehicleData.vehicleName} has been idle for an extended period. Location: ${vehicleData.address}`,
      categoryName: 'Operations',
      priorityName: 'Low',
      statusName: 'Open',
      vehicleId: vehicleData.vehicleId,
      vehicleName: vehicleData.vehicleName,
      gpsLatitude: vehicleData.latitude,
      gpsLongitude: vehicleData.longitude,
      gpsAddress: vehicleData.address,
      gpsTimestamp: new Date(),
      isUrgent: false,
      notes: `Automated issue created due to extended idle time. Threshold: ${this.alertThresholds.engineIdleTime} minutes.`
    };

    await this.createAutomatedIssue(issueData, 'Extended Idle Time');
  }

  /**
   * Create automated issue
   */
  async createAutomatedIssue(issueData, alertType) {
    try {
      // Check if similar issue already exists to avoid duplicates
      const existingIssues = await issueTrackerService.getIssues({
        vehicleId: issueData.vehicleId,
        status: 'Open',
        category: issueData.categoryName
      });

      // If there's already an open issue for this vehicle and category, don't create duplicate
      if (existingIssues && existingIssues.length > 0) {
        console.log(`Skipping duplicate ${alertType} issue for vehicle ${issueData.vehicleName}`);
        return;
      }

      const createdIssue = await issueTrackerService.createIssue(issueData);

      console.log(`Automated issue created: ${alertType} for ${issueData.vehicleName}`);

      notify({
        message: `${alertType}: Issue created for ${issueData.vehicleName}`,
        type: 'warning',
        displayTime: 5000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });

      return createdIssue;
    } catch (error) {
      console.error(`Error creating automated ${alertType} issue:`, error);
    }
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    console.log('GPS monitoring thresholds updated:', this.alertThresholds);
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      vehicleCount: this.vehicleGpsCache.size,
      thresholds: this.alertThresholds,
      lastCheck: new Date()
    };
  }
}

// Create singleton instance
const gpsMonitoringService = new GPSMonitoringService();

export default gpsMonitoringService;
