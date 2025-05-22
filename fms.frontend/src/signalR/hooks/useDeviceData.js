import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSignalR } from "./useSignalR";
import { FuelingUtils } from "../../utils/fuelingUtils";

/**
 * Custom hook to select device-specific data from Redux and SignalR
 * @param {string} deviceId - The ID of the PTS device
 * @returns {Object} - Device data and helper methods
 */
export const useDeviceData = (deviceId) => {
  const {
    connectionState,
    error,
    pumpStatus,
    tankStatus,
    fuelingEvents,
    refreshConnection,
    isConnected,
    isConnecting,
    isReconnecting,
    isPaused,
    isError,
  } = useSignalR();

  // Select relevant data from Redux store
  const { uploadStatus, devicePumps, lastUpdated, isLiveDataEnabled } =
    useSelector((state) => ({
      uploadStatus: state.realtimeStatus.uploadStatus[deviceId],
      devicePumps: state.realtimeStatus.pumps[deviceId],
      lastUpdated: state.realtimeStatus.lastUpdated[deviceId],
      isLiveDataEnabled: state.realtimeStatus.isLiveDataEnabled,
    }));

  // Process pump data using FuelingUtils
  const { pumps, activeFuelingProcesses } = useMemo(() => {
    if (!devicePumps) return { pumps: [], activeFuelingProcesses: [] };
    return FuelingUtils.processPumpData(devicePumps);
  }, [devicePumps]);

  // Helper function to get pump details
  const getPumpDetails = useCallback(
    (pumpId) => {
      return pumps.find((pump) => pump.id === pumpId);
    },
    [pumps]
  );

  // Helper function to get nozzles for a pump
  const getNozzlesForPump = useCallback(
    (pumpId) => {
      const pump = getPumpDetails(pumpId);
      return pump?.nozzles || [];
    },
    [getPumpDetails]
  );

  return {
    // Device-specific data
    uploadStatus,
    devicePumps,
    lastUpdated,
    isLiveDataEnabled,
    pumps,
    activeFuelingProcesses,

    // SignalR-specific data
    connectionState,
    error,
    pumpStatus,
    tankStatus,
    fuelingEvents,
    isConnected,
    isConnecting,
    isReconnecting,
    isPaused,
    isError,

    // Methods
    refreshConnection,
    getPumpDetails,
    getNozzlesForPump,
  };
};

export default useDeviceData;
