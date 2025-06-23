//Cursor - Mobile adapted FuelingUtils from web frontend
// FuelingUtils.js - Helper functions for the mobile fueling process

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

        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          availablePumps[existingPumpIndex].status = "endOfTransaction";
          availablePumps[existingPumpIndex].volume =
            pumpStatus.EndOfTransactionStatus.Volumes?.[index] || 0;
          availablePumps[existingPumpIndex].amount =
            pumpStatus.EndOfTransactionStatus.Amounts?.[index] || 0;
          availablePumps[existingPumpIndex].transaction =
            pumpStatus.EndOfTransactionStatus.Transactions?.[index] || 0;
        } else {
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "endOfTransaction",
            volume: pumpStatus.EndOfTransactionStatus.Volumes?.[index] || 0,
            amount: pumpStatus.EndOfTransactionStatus.Amounts?.[index] || 0,
            transaction: pumpStatus.EndOfTransactionStatus.Transactions?.[index] || 0,
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
  getNozzlesForPump: (selectedPumpId, uploadStatus, fuelGrades = []) => {
    if (!uploadStatus || !uploadStatus.Pumps) return [];

    const pumpStatus = uploadStatus.Pumps;
    const nozzles = [];

    // Try to get nozzle count from fuel grades if available
    let nozzleCount = fuelGrades.length || 2;

    // Create nozzles with fuel grade information
    for (let i = 1; i <= nozzleCount; i++) {
      const fuelGrade = fuelGrades.find(fg => fg.nozzle === i) ||
        fuelGrades[i - 1] ||
        { name: i % 2 === 0 ? "Diesel" : "Petrol", price: 3.99 };

      nozzles.push({
        id: i,
        name: `Nozzle ${i}`,
        status: "idle",
        fuelType: fuelGrade.name,
        price: fuelGrade.price || 3.99,
        fuelGrade: fuelGrade,
      });
    }

    // Mark active nozzles as busy
    if (pumpStatus.FillingStatus?.Ids) {
      const pumpIndex = pumpStatus.FillingStatus.Ids.findIndex(
        (id) => id === selectedPumpId
      );

      if (pumpIndex >= 0) {
        const activeNozzle = pumpStatus.FillingStatus.Nozzles?.[pumpIndex] || 0;

        if (activeNozzle > 0) {
          const nozzleIndex = nozzles.findIndex((n) => n.id === activeNozzle);
          if (nozzleIndex >= 0) {
            nozzles[nozzleIndex].status = "busy";

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

    // Check if pump is currently fueling
    if (pumpStatus.FillingStatus?.Ids) {
      const pumpIndex = pumpStatus.FillingStatus.Ids.findIndex(
        (id) => id === pumpId
      );

      if (pumpIndex >= 0) {
        return {
          status: "fueling",
          volume: pumpStatus.FillingStatus.Volumes?.[pumpIndex] || 0,
          amount: pumpStatus.FillingStatus.Amounts?.[pumpIndex] || 0,
          price: pumpStatus.FillingStatus.Prices?.[pumpIndex] || 0,
          nozzle: pumpStatus.FillingStatus.Nozzles?.[pumpIndex] || 0,
          transaction: pumpStatus.FillingStatus.Transactions?.[pumpIndex] || 0,
          fuelGrade: pumpStatus.FillingStatus.FuelGradeNames?.[pumpIndex] || "Unknown",
        };
      }
    }

    // Check if pump has completed transaction
    if (pumpStatus.EndOfTransactionStatus?.Ids) {
      const pumpIndex = pumpStatus.EndOfTransactionStatus.Ids.findIndex(
        (id) => id === pumpId
      );

      if (pumpIndex >= 0) {
        return {
          status: "endOfTransaction",
          volume: pumpStatus.EndOfTransactionStatus.Volumes?.[pumpIndex] || 0,
          amount: pumpStatus.EndOfTransactionStatus.Amounts?.[pumpIndex] || 0,
          price: pumpStatus.EndOfTransactionStatus.Prices?.[pumpIndex] || 0,
          nozzle: pumpStatus.EndOfTransactionStatus.Nozzles?.[pumpIndex] || 0,
          transaction: pumpStatus.EndOfTransactionStatus.Transactions?.[pumpIndex] || 0,
          tag: pumpStatus.EndOfTransactionStatus.Tags?.[pumpIndex] || "",
        };
      }
    }

    return null;
  },

  // Mobile-specific helper for formatting currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Mobile-specific helper for formatting volume
  formatVolume: (volume, unit = 'L') => {
    return `${volume.toFixed(2)} ${unit}`;
  },

  // Validate transaction data
  validateTransactionData: (pumpId, nozzleId, vehicleId, tagId, authType, dose) => {
    const errors = [];

    if (!pumpId || pumpId <= 0) {
      errors.push("Please select a valid pump");
    }

    if (!nozzleId || nozzleId <= 0) {
      errors.push("Please select a valid nozzle");
    }

    if (!vehicleId && !tagId) {
      errors.push("Please select a vehicle or scan a tag");
    }

    if (authType === "Volume" && (!dose || dose <= 0)) {
      errors.push("Please enter a valid volume amount");
    }

    if (authType === "Amount" && (!dose || dose <= 0)) {
      errors.push("Please enter a valid amount");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Get pump status color for UI
  getPumpStatusColor: (status) => {
    switch (status) {
      case "idle":
        return "#10B981"; // Green
      case "nozzleUp":
        return "#F59E0B"; // Yellow
      case "fueling":
        return "#3B82F6"; // Blue
      case "endOfTransaction":
        return "#8B5CF6"; // Purple
      case "offline":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  },

  // Get pump status icon
  getPumpStatusIcon: (status) => {
    switch (status) {
      case "idle":
        return "check-circle";
      case "nozzleUp":
        return "exclamation-triangle";
      case "fueling":
        return "play-circle";
      case "endOfTransaction":
        return "stop-circle";
      case "offline":
        return "times-circle";
      default:
        return "question-circle";
    }
  },
};

export default FuelingUtils;