import { useState, useEffect, useCallback } from 'react';
import vehicleTrackingService from '../services/vehicleGPSTrackingService';

export const useVehicleTracking = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trackHistory, setTrackHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveTrackingActive, setLiveTrackingActive] = useState(false);

  // Load all vehicles with GPS status
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vehiclesWithGPS = await vehicleTrackingService.getAllVehiclesWithGPSStatus();
      setVehicles(vehiclesWithGPS);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error('Error loading vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get specific vehicle location
  const getVehicleLocation = useCallback(async (vehicleId) => {
    try {
      const location = await vehicleTrackingService.getVehicleLocation(vehicleId);
      return location;
    } catch (err) {
      setError(`Failed to get location for vehicle ${vehicleId}`);
      throw err;
    }
  }, []);

  // Get vehicle track history
  const getTrackHistory = useCallback(async (vehicleId, fromDate, toDate) => {
    setLoading(true);
    setError(null);

    try {
      const history = await vehicleTrackingService.getVehicleTrackHistory(vehicleId, fromDate, toDate);
      setTrackHistory(history);
      return history;
    } catch (err) {
      setError('Failed to load track history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Start live tracking for selected vehicle
  const startLiveTracking = useCallback((vehicleId) => {
    if (liveTrackingActive) return;

    const trackingInterval = vehicleTrackingService.startLiveTracking(
      vehicleId,
      (location) => {
        setVehicles(prevVehicles =>
          prevVehicles.map(vehicle =>
            vehicle.vehicleId === vehicleId
              ? { ...vehicle, gpsData: location }
              : vehicle
          )
        );

        if (selectedVehicle && selectedVehicle.vehicleId === vehicleId) {
          setSelectedVehicle(prev => ({
            ...prev,
            gpsData: location
          }));
        }
      },
      5000 // Update every 5 seconds
    );

    setLiveTrackingActive(trackingInterval);
  }, [liveTrackingActive, selectedVehicle]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    if (liveTrackingActive) {
      vehicleTrackingService.stopLiveTracking(liveTrackingActive);
      setLiveTrackingActive(false);
    }
  }, [liveTrackingActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveTrackingActive) {
        vehicleTrackingService.stopLiveTracking(liveTrackingActive);
      }
    };
  }, [liveTrackingActive]);

  return {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    trackHistory,
    loading,
    error,
    liveTrackingActive: !!liveTrackingActive,
    loadVehicles,
    getVehicleLocation,
    getTrackHistory,
    startLiveTracking,
    stopLiveTracking
  };
};