// Selectors for device-related data from Redux store

import { createSelector } from "@reduxjs/toolkit";

// Base selectors for individual pieces of state
const selectPTSDeviceList = (state) => state.ptsDevice.ptsDeviceList || [];
// Select the live connection statuses map directly
const selectLiveConnectionStatuses = (state) =>
  state.deviceConnections.connectionStatuses || {};
// Keep realtimeStatus for other data like uploadStatusByDevice if needed elsewhere
const selectRealtimeStatus = (state) => state.realtimeStatus;
console.log("selectPTSDeviceList", selectPTSDeviceList);
console.log("selectLiveConnectionStatuses", selectLiveConnectionStatuses);
console.log("selectRealtimeStatus", selectRealtimeStatus);

/**
 * Select all PTS devices combined with their latest live status.
 */
export const selectAllDevices = createSelector(
  [selectPTSDeviceList, selectLiveConnectionStatuses, selectRealtimeStatus],
  (devices, liveStatuses, realtimeStatus) => {
    if (devices.length === 0) {
      console.log("[DeviceSelector] No devices in ptsDeviceList yet");
      return [];
    }

    // Map over the base device list and merge with live status
    return devices.map((device) => {
      const deviceId = device.ptsid;
      const liveStatus = liveStatuses[deviceId]; // Get live status from the dedicated map
      const uploadStatusData = realtimeStatus.uploadStatusByDevice[deviceId]; // Get other realtime data if needed

      let mergedStatus = {
        status: "Disconnected", // Default if not in live map
        connectionType: null,
        lastActivity: null,
        ipAddress: device.ipaddress, // Use DB IP as fallback
        isLoaded: true, // Indicate data has been processed
      };

      if (liveStatus) {
        // If live status exists, use it
        mergedStatus = {
          ...mergedStatus, // Keep isLoaded etc.
          status: liveStatus.status, // Already mapped to string in reducer
          connectionType: liveStatus.connectionType,
          lastActivity: liveStatus.lastActivity,
          ipAddress: liveStatus.ipAddress || device.ipaddress, // Prioritize live IP
        };
      }

      // Log status changes for debugging
      // Note: Comparing mergedStatus.status to device.ConnectionStatus (original DB value) might be misleading now
      if (device.ConnectionStatus !== mergedStatus.status) {
        console.log(
          `[DeviceSelector] Device ${deviceId} status: DB='${device.ConnectionStatus}', Live='${mergedStatus.status}'`
        );
      }

      // Combine base device info, live status, and potentially other realtime data
      return {
        ...device, // Start with base device info from DB list
        ...mergedStatus, // Apply the determined live status info

        // Add other relevant data (examples)
        tanks: device.tanks || 0, // Assuming this comes from initial load
        pumps: device.pumptransactions?.length || 0, // Assuming this comes from initial load
        onlinePumps:
          device.pumptransactions?.filter((p) => p.status !== "offline")
            .length || 0, // Example, refine if needed
        systemStatus: uploadStatusData?.status?.systemStatus || {
          // Example from realtimeStatus
          batteryVoltage: null,
          cpuTemperature: null,
          ptsPowerDownDetected: false,
          sdMounted: true,
          receivedAt: mergedStatus.lastActivity, // Use live activity time
        },
        pendingCommands: device.ptsDevicePendingCommands?.length || 0, // Assuming from initial load
        intankDeliveries: device.intankdeliveries?.length || 0, // Assuming from initial load
      };
    });
  }
);

/**
 * Select dashboard metrics based on device data
 */
export const selectDashboardMetrics = (state) => {
  const devices = selectAllDevices(state);

  // Get fuel refill data from state
  const fuelRefills = state.fuelRefill?.fuelRefills || [];
  const tanks = state.tank?.tanks || [];

  // Calculate total fuel dispensed today from fuel refills
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sum up fuel dispensed today from refills
  const todayRefills = fuelRefills.filter((refill) => {
    const refillDate = new Date(refill.refillDate);
    return refillDate >= today;
  });

  const totalFuelDispensed = todayRefills.reduce(
    (total, refill) => total + (parseFloat(refill.quantity) || 0),
    0
  );

  // Calculate tank metrics
  let totalTankCapacity = 0;
  let totalCurrentVolume = 0;

  tanks.forEach((tank) => {
    totalTankCapacity += parseFloat(tank.capacity) || 0;
    totalCurrentVolume += parseFloat(tank.currentVolume) || 0;
  });

  // Calculate average fuel price from refills (last 30 days)
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);

  const recentRefills = fuelRefills.filter((refill) => {
    const refillDate = new Date(refill.refillDate);
    return refillDate >= lastMonth;
  });

  let avgFuelPrice = 0;
  if (recentRefills.length > 0) {
    const totalPrice = recentRefills.reduce(
      (sum, refill) => sum + (parseFloat(refill.unitPrice) || 0),
      0
    );
    avgFuelPrice = totalPrice / recentRefills.length;
  }

  // Count online pumps from all devices using the merged status
  let onlinePumpsCount = 0;
  let totalPumpsCount = 0;

  devices.forEach((device) => {
    // Assuming device.pumps still reflects the count from the initial DB load
    totalPumpsCount += device.pumps || 0;
    // Recalculate online pumps based on live status? Or is device.onlinePumps already calculated?
    // If relying on initial load: onlinePumpsCount += device.onlinePumps || 0;
    // If we need live pump count, that requires pump status in realtimeStatus state.
    // For now, assume device.onlinePumps is sufficient or needs separate handling.
    onlinePumpsCount += device.onlinePumps || 0;
  });

  // Calculate tank level percentage
  const tankLevelPercentage =
    totalTankCapacity > 0 ? (totalCurrentVolume / totalTankCapacity) * 100 : 0;

  // Format with change indicators (placeholders for now, would be calculated from historical data)
  return {
    fuelDispensed: {
      value: totalFuelDispensed.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
      unit: "L",
      change: calculateChange(totalFuelDispensed, totalFuelDispensed * 0.95), // Placeholder: 5% change
    },
    tankLevels: {
      value: totalCurrentVolume.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }),
      unit: "L",
      change: `${Math.round(tankLevelPercentage)}%`,
    },
    fuelPrice: {
      value: avgFuelPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "$/L",
      change: "0.0%", // Placeholder - would be calculated from historical price data
    },
    onlinePumps: {
      value: onlinePumpsCount.toString(),
      unit: `of ${totalPumpsCount}`,
      change:
        totalPumpsCount > 0
          ? `${Math.round((onlinePumpsCount / totalPumpsCount) * 100)}%`
          : "0%",
    },
  };
};

// Helper function to calculate percent change
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return "0.0%";

  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange >= 0 ? "+" : "";
  return `${sign}${percentChange.toFixed(1)}%`;
};
