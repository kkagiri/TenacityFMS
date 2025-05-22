// FuelingUtils.js - Helper functions for the fueling process

//cluade utility functions for fueling process

const FuelingUtils = {
  // Extract pump status from the UploadStatus message
  handlePumpStatus: (uploadStatus) => {
    if (!uploadStatus || !uploadStatus.Pumps) return [];

    const availablePumps = [];
    const pumpStatus = uploadStatus.Pumps;

    // Process idle pumps
    if (pumpStatus.IdleStatus?.Ids) {
      pumpStatus.IdleStatus.Ids.forEach((pumpId, index) => {
        if (!pumpId) return;

        const nozzleUp = pumpStatus.IdleStatus.NozzlesUp?.[index] || 0;
        const lastTransaction =
          pumpStatus.IdleStatus.LastTransactions?.[index] || 0;

        availablePumps.push({
          id: pumpId,
          name: `Pump ${pumpId}`,
          status: nozzleUp > 0 ? "nozzleUp" : "idle",
          nozzleUp: nozzleUp,
          lastTransaction: lastTransaction,
          lastVolume: pumpStatus.IdleStatus.LastVolumes?.[index] || 0,
          lastAmount: pumpStatus.IdleStatus.LastAmounts?.[index] || 0,
          lastPrice: pumpStatus.IdleStatus.LastPrices?.[index] || 0,
        });
      });
    }

    // Process pumps currently fueling
    if (pumpStatus.FillingStatus?.Ids) {
      pumpStatus.FillingStatus.Ids.forEach((pumpId, index) => {
        if (!pumpId) return;

        // Check if pump already exists in our list
        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          // Update existing pump record
          availablePumps[existingPumpIndex].status = "fueling";
          availablePumps[existingPumpIndex].activeNozzle =
            pumpStatus.FillingStatus.Nozzles?.[index] || 0;
          availablePumps[existingPumpIndex].currentVolume =
            pumpStatus.FillingStatus.Volumes?.[index] || 0;
          availablePumps[existingPumpIndex].currentAmount =
            pumpStatus.FillingStatus.Amounts?.[index] || 0;
          availablePumps[existingPumpIndex].currentTransaction =
            pumpStatus.FillingStatus.Transactions?.[index] || 0;
        } else {
          // Add new pump record
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "fueling",
            activeNozzle: pumpStatus.FillingStatus.Nozzles?.[index] || 0,
            currentVolume: pumpStatus.FillingStatus.Volumes?.[index] || 0,
            currentAmount: pumpStatus.FillingStatus.Amounts?.[index] || 0,
            currentTransaction:
              pumpStatus.FillingStatus.Transactions?.[index] || 0,
          });
        }
      });
    }

    // Process pumps with finished transactions
    if (pumpStatus.EndOfTransactionStatus?.Ids) {
      pumpStatus.EndOfTransactionStatus.Ids.forEach((pumpId, index) => {
        if (!pumpId) return;

        // Similarly update or add to the pumps array
        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          availablePumps[existingPumpIndex].status = "endOfTransaction";
          // Update other transaction details
        } else {
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "endOfTransaction",
            // Include transaction details
          });
        }
      });
    }

    // Process offline pumps
    if (pumpStatus.OfflineStatus?.Ids) {
      pumpStatus.OfflineStatus.Ids.forEach((pumpId) => {
        if (!pumpId) return;

        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          availablePumps[existingPumpIndex].status = "offline";
        } else {
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "offline",
          });
        }
      });
    }

    return availablePumps;
  },

  // For a selected pump, extract nozzle information
  getNozzlesForPump: (selectedPumpId, uploadStatus) => {
    if (!uploadStatus || !uploadStatus.Pumps) return [];

    const pumpStatus = uploadStatus.Pumps;
    const nozzles = [];

    // First determine how many nozzles this pump has (use maximum info available)
    // Default to 2 if we can't determine
    let nozzleCount = 2;

    // Try to determine better nozzle count from available data
    if (pumpStatus.IdleStatus?.Ids?.includes(selectedPumpId)) {
      const pumpIndex = pumpStatus.IdleStatus.Ids.findIndex(
        (id) => id === selectedPumpId
      );
      // If we have actual data about this pump, use it to determine nozzle count
      if (pumpIndex >= 0 && Array.isArray(pumpStatus.IdleStatus.NozzlesUp)) {
        nozzleCount = Math.max(
          nozzleCount,
          pumpStatus.IdleStatus.NozzlesUp.length
        );
      }
    }

    // Also check FillingStatus for nozzle count info
    if (pumpStatus.FillingStatus?.Ids?.includes(selectedPumpId)) {
      const pumpIndex = pumpStatus.FillingStatus.Ids.findIndex(
        (id) => id === selectedPumpId
      );
      if (pumpIndex >= 0 && Array.isArray(pumpStatus.FillingStatus.Nozzles)) {
        const fillingNozzle = pumpStatus.FillingStatus.Nozzles[pumpIndex];
        // Make sure nozzleCount is at least as large as the highest nozzle number
        nozzleCount = Math.max(nozzleCount, fillingNozzle || 0);
      }
    }

    // Now create all nozzles as idle by default
    for (let i = 1; i <= nozzleCount; i++) {
      nozzles.push({
        id: i,
        name: `Nozzle ${i}`,
        status: "idle", // Default all to idle
        fuelType: i % 2 === 0 ? "Diesel" : "Petrol", // This would come from configuration
      });
    }

    // Then mark any nozzles that are actively fueling as busy
    if (pumpStatus.FillingStatus?.Ids) {
      const pumpIndex = pumpStatus.FillingStatus.Ids.findIndex(
        (id) => id === selectedPumpId
      );

      if (pumpIndex >= 0) {
        const activeNozzle = pumpStatus.FillingStatus.Nozzles?.[pumpIndex] || 0;

        if (activeNozzle > 0) {
          // Find and update the status of the active nozzle
          const nozzleIndex = nozzles.findIndex((n) => n.id === activeNozzle);
          if (nozzleIndex >= 0) {
            nozzles[nozzleIndex].status = "busy";

            // Also update fuel type if available from FillingStatus
            if (pumpStatus.FillingStatus.FuelGradeNames?.[pumpIndex]) {
              nozzles[nozzleIndex].fuelType =
                pumpStatus.FillingStatus.FuelGradeNames[pumpIndex];
            }
          }
        }
      }
    }

    return nozzles;
  },

  // Get fueling data for a specific pump
  getFuelingData: (pumpId, uploadStatus) => {
    if (!uploadStatus || !uploadStatus.Pumps) return null;

    const pumpStatus = uploadStatus.Pumps;

    // Check if pump is fueling
    if (pumpStatus.FillingStatus?.Ids) {
      const pumpIndex = pumpStatus.FillingStatus.Ids.findIndex(
        (id) => id === pumpId
      );

      if (pumpIndex >= 0) {
        return {
          status: "fueling",
          nozzle: pumpStatus.FillingStatus.Nozzles?.[pumpIndex] || 0,
          transaction: pumpStatus.FillingStatus.Transactions?.[pumpIndex] || 0,
          volume: pumpStatus.FillingStatus.Volumes?.[pumpIndex] || 0,
          amount: pumpStatus.FillingStatus.Amounts?.[pumpIndex] || 0,
          price: pumpStatus.FillingStatus.Prices?.[pumpIndex] || 0,
          fuelGradeId: pumpStatus.FillingStatus.FuelGradeIds?.[pumpIndex] || 0,
          fuelGradeName:
            pumpStatus.FillingStatus.FuelGradeNames?.[pumpIndex] || "",
          tag: pumpStatus.FillingStatus.Tags?.[pumpIndex] || "",
        };
      }
    }

    // Check if pump has ended transaction
    if (pumpStatus.EndOfTransactionStatus?.Ids) {
      const pumpIndex = pumpStatus.EndOfTransactionStatus.Ids.findIndex(
        (id) => id === pumpId
      );

      if (pumpIndex >= 0) {
        return {
          status: "endOfTransaction",
          nozzle: pumpStatus.EndOfTransactionStatus.Nozzles?.[pumpIndex] || 0,
          transaction:
            pumpStatus.EndOfTransactionStatus.Transactions?.[pumpIndex] || 0,
          volume: pumpStatus.EndOfTransactionStatus.Volumes?.[pumpIndex] || 0,
          amount: pumpStatus.EndOfTransactionStatus.Amounts?.[pumpIndex] || 0,
          price: pumpStatus.EndOfTransactionStatus.Prices?.[pumpIndex] || 0,
          fuelGradeId:
            pumpStatus.EndOfTransactionStatus.FuelGradeIds?.[pumpIndex] || 0,
          fuelGradeName:
            pumpStatus.EndOfTransactionStatus.FuelGradeNames?.[pumpIndex] || "",
          tag: pumpStatus.EndOfTransactionStatus.Tags?.[pumpIndex] || "",
        };
      }
    }

    // Check idle status for nozzle up
    if (pumpStatus.IdleStatus?.Ids) {
      const pumpIndex = pumpStatus.IdleStatus.Ids.findIndex(
        (id) => id === pumpId
      );

      if (pumpIndex >= 0) {
        const nozzleUp = pumpStatus.IdleStatus.NozzlesUp?.[pumpIndex] || 0;

        return {
          status: nozzleUp > 0 ? "nozzleUp" : "idle",
          nozzle: nozzleUp,
          lastTransaction:
            pumpStatus.IdleStatus.LastTransactions?.[pumpIndex] || 0,
          lastVolume: pumpStatus.IdleStatus.LastVolumes?.[pumpIndex] || 0,
          lastAmount: pumpStatus.IdleStatus.LastAmounts?.[pumpIndex] || 0,
        };
      }
    }

    // Check if pump is offline
    if (pumpStatus.OfflineStatus?.Ids) {
      if (pumpStatus.OfflineStatus.Ids.includes(pumpId)) {
        return {
          status: "offline",
        };
      }
    }

    return null; // Pump not found in any status
  },

  // Collect active fueling processes from upload status
  getActiveFuelingProcesses: (uploadStatus) => {
    const activeFuelingProcesses = [];

    if (uploadStatus?.Pumps?.FillingStatus?.Ids) {
      uploadStatus.Pumps.FillingStatus.Ids.forEach((pumpId, index) => {
        if (!pumpId) return;

        const nozzle = uploadStatus.Pumps.FillingStatus.Nozzles?.[index] || 0;
        const processKey = `${pumpId}-${nozzle}`;

        activeFuelingProcesses.push({
          key: processKey,
          pumpId: pumpId,
          pumpName: `Pump ${pumpId}`,
          nozzleId: nozzle,
          nozzleName: `Nozzle ${nozzle}`,
          amount: uploadStatus.Pumps.FillingStatus.Volumes?.[index] || 0,
          cost: uploadStatus.Pumps.FillingStatus.Amounts?.[index] || 0,
          fuelType:
            uploadStatus.Pumps.FillingStatus.FuelGradeNames?.[index] ||
            "Unknown",
          transaction:
            uploadStatus.Pumps.FillingStatus.Transactions?.[index] || 0,
          tag: uploadStatus.Pumps.FillingStatus.Tags?.[index] || "",
        });
      });
    }

    return activeFuelingProcesses;
  },
};

export default FuelingUtils;
