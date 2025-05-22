import { useMemo } from "react";
import { useSelector } from "react-redux";
// import FuelingUtils from "../components/fuelingprocess/FuelingUtils"; // Cursor: Removed FuelingUtils dependency

/**
 * Custom hook to select device-specific processed data from Redux
 * @param {string} deviceId - The ID of the PTS device
 * @returns {Object} - Processed device data and helper methods
 */
export const useDeviceData = (deviceId) => {
  // Select raw status if needed elsewhere, but primarily use parsed status below
  const rawUploadStatus = useSelector(
    (state) => state.realtimeStatus.uploadStatusByDevice[deviceId]?.status
  );

  // Select the PARSED pump status object for this device
  const devicePumpStatus = useSelector(
    (state) => state.realtimeStatus.devicePumpStatus[deviceId] || {}
  );

  const lastUpdated = useSelector(
    (state) => state.realtimeStatus.uploadStatusByDevice[deviceId]?.receivedAt
  );

  const isLiveDataEnabled = useSelector(
    (state) => state.realtimeStatus.isLiveDataEnabled
  );

  // Derive the list of pump objects from the parsed state
  const pumps = useMemo(() => {
    // Only use pumps that are actually in the device status data //Cursor
    const existingPumps = Object.values(devicePumpStatus).map((pump) => ({
      ...pump,
      // Ensure a name property exists for UI consistency
      name: pump.name || `Pump ${pump.id}`,
    }));

    // Sort by pump ID for consistent display
    return existingPumps.sort((a, b) => a.id - b.id);
  }, [devicePumpStatus]);

  // Derive active fueling processes from the parsed state
  const activeFuelingProcesses = useMemo(() => {
    return Object.values(devicePumpStatus)
      .filter(
        (pump) =>
          pump.status === "fueling" || pump.status === "endOfTransaction"
      )
      .map((pump) => ({
        pumpId: pump.id,
        pumpName: pump.name || `Pump ${pump.id}`,
        nozzleId: pump.activeNozzle || pump.nozzle || pump.nozzleUp || 0, // Best guess for nozzle involved
        // nozzleName: `Nozzle ${pump.activeNozzle || pump.nozzle || pump.nozzleUp || 0}`,
        fuelType: pump.fuelGradeName || "Unknown", // Directly use parsed name if available
        // vehicleReg: '', // This needs to come from UI state, not status
        amount: pump.currentAmount ?? pump.amount ?? 0, // Use fueling amount or EOT amount
        cost: pump.currentAmount ?? pump.amount ?? 0, // Simplification: Assuming cost=amount if price not readily available
        volume: pump.currentVolume ?? pump.volume ?? 0, // Use fueling volume or EOT volume
        status: pump.status, // Include the status ('fueling', 'endOfTransaction')
        transactionId: pump.currentTransaction ?? pump.transaction ?? null,
        tag: pump.tag ?? null,
        key: `${pump.id}-${
          pump.activeNozzle || pump.nozzle || pump.nozzleUp || 0
        }-${pump.currentTransaction ?? pump.transaction ?? "active"}`, // More robust key
      }));
  }, [devicePumpStatus]);

  // Get detailed parsed info for a specific pump
  const getPumpDetails = (pumpId) => {
    return devicePumpStatus[pumpId] || null; // Directly return the parsed data
  };

  // Get nozzle info based on the fuel grades configured for the device //Cursor
  const getNozzlesForPump = (pumpId, uploadStatusOverride) => {
    const pumpData = devicePumpStatus[pumpId];
    if (!pumpData) return [];

    // Allow passing uploadStatus directly or fallback to the one from Redux
    const statusToUse = uploadStatusOverride || rawUploadStatus;

    // Determine number of nozzles from the data
    let nozzleCount = 0;
    let fuelGradesFromStatus = [];
    let readersFromStatus = null; // Cursor: Variable to hold reader data

    if (statusToUse) {
      // Check IdleStatus.NozzlesUp length
      const idleStatus =
        statusToUse.pumps?.idleStatus || statusToUse.pumps?.IdleStatus;
      if (idleStatus?.nozzlesUp || idleStatus?.NozzlesUp) {
        const nozzlesUp = idleStatus.nozzlesUp || idleStatus.NozzlesUp;
        nozzleCount = nozzlesUp?.length || 0;
      }

      // Check from fuel grades if available
      fuelGradesFromStatus = statusToUse.fuelGrades || [];
      if (nozzleCount === 0 && fuelGradesFromStatus.length > 0) {
        nozzleCount = fuelGradesFromStatus.length;
      }

      // Extract reader data //Cursor
      readersFromStatus = statusToUse.readers;
    }

    // Default to 2 if we still couldn't determine (based on user data showing 2 nozzles)
    if (nozzleCount === 0) {
      nozzleCount = 2; //Cursor
    }

    const nozzles = [];

    // Create nozzle objects based on available fuel grades or nozzle count
    for (let i = 1; i <= nozzleCount; i++) {
      // Determine nozzle status
      let status = "idle";
      if (pumpData.status === "fueling" && pumpData.activeNozzle === i) {
        status = "busy";
      } else if (pumpData.status === "nozzleUp" && pumpData.nozzleUp === i) {
        status = "lifted";
      }

      // Get fuel grade name and price if available
      const fuelGrade = fuelGradesFromStatus.find((g) => g.id === i) || null;

      // Find associated reader ID (assuming nozzle ID maps to reader ID) //Cursor
      let readerId = null;
      let readerStatus = "unknown";
      let readerTag = null;
      if (readersFromStatus) {
        const onlineStatus =
          readersFromStatus.OnlineStatus || readersFromStatus.onlineStatus;
        const offlineStatus =
          readersFromStatus.OfflineStatus || readersFromStatus.offlineStatus;

        if (onlineStatus?.ids) {
          const readerIndex = onlineStatus.ids.findIndex((id) => id === i); // Assuming nozzle ID == reader ID
          if (readerIndex !== -1) {
            readerId = i;
            readerStatus = "online";
            readerTag = onlineStatus.tags?.[readerIndex] || null;
          }
        }
        // Check offline only if not found online
        if (readerId === null && offlineStatus?.ids) {
          const readerIndex = offlineStatus.ids.findIndex((id) => id === i);
          if (readerIndex !== -1) {
            readerId = i;
            readerStatus = "offline";
            readerTag = offlineStatus.tags?.[readerIndex] || null;
          }
        }
      }

      nozzles.push({
        id: i,
        name: `Nozzle ${i}`,
        status: status,
        fuelType: fuelGrade?.name || (i % 2 === 0 ? "Diesel" : "Petrol"), // Default fuel type if grade missing
        price: fuelGrade?.price || 0,
        readerId: readerId, // Include reader ID //Cursor
        readerStatus: readerStatus, // Include reader status //Cursor
        readerTag: readerTag, // Include reader tag //Cursor
      });
    }

    return nozzles;
  };

  // Extract fuel grades from raw status if available
  const fuelGrades = useMemo(() => {
    if (!rawUploadStatus?.fuelGrades) return [];

    return rawUploadStatus.fuelGrades.map((grade) => ({
      id: grade.id,
      name: grade.name,
      price: grade.price,
    }));
  }, [rawUploadStatus?.fuelGrades]);

  return {
    rawUploadStatus, // Cursor: Expose raw status object
    devicePumpStatus, // Expose the directly parsed pump status object
    pumps, // Derived array of pump objects
    activeFuelingProcesses, // Derived array of active fueling/EOT processes
    lastUpdated,
    isLiveDataEnabled,
    getPumpDetails,
    getNozzlesForPump,
    fuelGrades, // Cursor: Expose fuel grades
  };
};

export default useDeviceData;
