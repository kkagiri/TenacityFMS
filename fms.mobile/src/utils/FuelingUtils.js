//Cursor - Mobile adapted FuelingUtils from web frontend
// FuelingUtils.js - Helper functions for the mobile fueling process

const FuelingUtils = {
  // Extract pump status from the UploadStatus message
  // Handles both PascalCase (from Redis cache) and camelCase (from SignalR broadcast)
  handlePumpStatus: (uploadStatus) => {
    // Get Pumps from either case
    const pumpsData = uploadStatus?.Pumps || uploadStatus?.pumps;
    if (!uploadStatus || !pumpsData) return [];

    const availablePumps = [];
    const pumpStatus = pumpsData;

    // Helper to get property with either case
    const getStatus = (obj, pascalName, camelName) =>
      obj?.[pascalName] || obj?.[camelName];
    const getProp = (obj, pascalName, camelName, index) => {
      const arr = obj?.[pascalName] || obj?.[camelName];
      return arr?.[index];
    };

    // Get IdleStatus with either case
    const idleStatus = getStatus(pumpStatus, "IdleStatus", "idleStatus");
    const ids = idleStatus?.Ids || idleStatus?.ids;

    // Process idle pumps
    if (ids) {
      ids.forEach((pumpId, index) => {
        if (!pumpId) return;

        const nozzleUp =
          getProp(idleStatus, "NozzlesUp", "nozzlesUp", index) || 0;
        const lastTransaction =
          getProp(idleStatus, "LastTransactions", "lastTransactions", index) ||
          0;

        availablePumps.push({
          id: pumpId,
          name: `Pump ${pumpId}`,
          status: nozzleUp > 0 ? "nozzleUp" : "idle",
          nozzleUp: nozzleUp,
          lastTransaction: lastTransaction,
          lastVolume:
            getProp(idleStatus, "LastVolumes", "lastVolumes", index) || 0,
          lastAmount:
            getProp(idleStatus, "LastAmounts", "lastAmounts", index) || 0,
          lastPrice:
            getProp(idleStatus, "LastPrices", "lastPrices", index) || 0,
        });
      });
    }

    // Get FillingStatus with either case
    const fillingStatus = getStatus(
      pumpStatus,
      "FillingStatus",
      "fillingStatus"
    );
    const fillingIds = fillingStatus?.Ids || fillingStatus?.ids;

    // Process pumps currently fueling
    if (fillingIds) {
      fillingIds.forEach((pumpId, index) => {
        if (!pumpId) return;

        // Check if pump already exists in our list
        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          // Update existing pump record
          availablePumps[existingPumpIndex].status = "fueling";
          availablePumps[existingPumpIndex].activeNozzle =
            getProp(fillingStatus, "Nozzles", "nozzles", index) || 0;
          availablePumps[existingPumpIndex].currentVolume =
            getProp(fillingStatus, "Volumes", "volumes", index) || 0;
          availablePumps[existingPumpIndex].currentAmount =
            getProp(fillingStatus, "Amounts", "amounts", index) || 0;
          availablePumps[existingPumpIndex].currentTransaction =
            getProp(fillingStatus, "Transactions", "transactions", index) || 0;
        } else {
          // Add new pump record
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "fueling",
            activeNozzle:
              getProp(fillingStatus, "Nozzles", "nozzles", index) || 0,
            currentVolume:
              getProp(fillingStatus, "Volumes", "volumes", index) || 0,
            currentAmount:
              getProp(fillingStatus, "Amounts", "amounts", index) || 0,
            currentTransaction:
              getProp(fillingStatus, "Transactions", "transactions", index) ||
              0,
          });
        }
      });
    }

    // Get EndOfTransactionStatus with either case
    const eotStatus = getStatus(
      pumpStatus,
      "EndOfTransactionStatus",
      "endOfTransactionStatus"
    );
    const eotIds = eotStatus?.Ids || eotStatus?.ids;

    // Process pumps with finished transactions
    if (eotIds) {
      eotIds.forEach((pumpId, index) => {
        if (!pumpId) return;

        const existingPumpIndex = availablePumps.findIndex(
          (p) => p.id === pumpId
        );

        if (existingPumpIndex >= 0) {
          availablePumps[existingPumpIndex].status = "endOfTransaction";
          availablePumps[existingPumpIndex].volume =
            getProp(eotStatus, "Volumes", "volumes", index) || 0;
          availablePumps[existingPumpIndex].amount =
            getProp(eotStatus, "Amounts", "amounts", index) || 0;
          availablePumps[existingPumpIndex].transaction =
            getProp(eotStatus, "Transactions", "transactions", index) || 0;
        } else {
          availablePumps.push({
            id: pumpId,
            name: `Pump ${pumpId}`,
            status: "endOfTransaction",
            volume: getProp(eotStatus, "Volumes", "volumes", index) || 0,
            amount: getProp(eotStatus, "Amounts", "amounts", index) || 0,
            transaction:
              getProp(eotStatus, "Transactions", "transactions", index) || 0,
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
  // Handles both PascalCase and camelCase property names
  getNozzlesForPump: (selectedPumpId, uploadStatus, fuelGrades = []) => {
    // Get Pumps from either case
    const pumpsData = uploadStatus?.Pumps || uploadStatus?.pumps;
    if (!uploadStatus || !pumpsData) return [];

    const pumpStatus = pumpsData;
    const nozzles = [];

    // Helper to get property with either case
    const getStatus = (obj, pascalName, camelName) =>
      obj?.[pascalName] || obj?.[camelName];
    const getProp = (obj, pascalName, camelName, index) => {
      const arr = obj?.[pascalName] || obj?.[camelName];
      return arr?.[index];
    };

    // Try to get nozzle count from fuel grades if available
    let nozzleCount = fuelGrades.length || 2;

    // Create nozzles with fuel grade information
    for (let i = 1; i <= nozzleCount; i++) {
      const fuelGrade = fuelGrades.find((fg) => fg.nozzle === i) ||
        fuelGrades[i - 1] || {
          name: i % 2 === 0 ? "Diesel" : "Petrol",
          price: 3.99,
        };

      nozzles.push({
        id: i,
        name: `Nozzle ${i}`,
        status: "idle",
        fuelType: fuelGrade.name,
        price: fuelGrade.price || 3.99,
        fuelGrade: fuelGrade,
      });
    }

    // Mark active nozzles as busy - handle both cases
    const fillingStatus = getStatus(
      pumpStatus,
      "FillingStatus",
      "fillingStatus"
    );
    const fillingIds = fillingStatus?.Ids || fillingStatus?.ids;

    if (fillingIds) {
      const pumpIndex = fillingIds.findIndex((id) => id === selectedPumpId);

      if (pumpIndex >= 0) {
        const activeNozzle =
          getProp(fillingStatus, "Nozzles", "nozzles", pumpIndex) || 0;

        if (activeNozzle > 0) {
          const nozzleIndex = nozzles.findIndex((n) => n.id === activeNozzle);
          if (nozzleIndex >= 0) {
            nozzles[nozzleIndex].status = "busy";

            const fuelGradeName = getProp(
              fillingStatus,
              "FuelGradeNames",
              "fuelGradeNames",
              pumpIndex
            );
            if (fuelGradeName) {
              nozzles[nozzleIndex].fuelType = fuelGradeName;
            }
          }
        }
      }
    }

    return nozzles;
  },

  // Get fueling data for a specific pump
  // Handles both PascalCase and camelCase property names
  getFuelingData: (pumpId, uploadStatus) => {
    // Get Pumps from either case
    const pumpsData = uploadStatus?.Pumps || uploadStatus?.pumps;
    if (!uploadStatus || !pumpsData) return null;

    const pumpStatus = pumpsData;

    // Helper to get property with either case
    const getStatus = (obj, pascalName, camelName) =>
      obj?.[pascalName] || obj?.[camelName];
    const getProp = (obj, pascalName, camelName, index) => {
      const arr = obj?.[pascalName] || obj?.[camelName];
      return arr?.[index];
    };

    // Check if pump is currently fueling
    const fillingStatus = getStatus(
      pumpStatus,
      "FillingStatus",
      "fillingStatus"
    );
    const fillingIds = fillingStatus?.Ids || fillingStatus?.ids;

    if (fillingIds) {
      const pumpIndex = fillingIds.findIndex((id) => id === pumpId);

      if (pumpIndex >= 0) {
        return {
          status: "fueling",
          volume: getProp(fillingStatus, "Volumes", "volumes", pumpIndex) || 0,
          amount: getProp(fillingStatus, "Amounts", "amounts", pumpIndex) || 0,
          price: getProp(fillingStatus, "Prices", "prices", pumpIndex) || 0,
          nozzle: getProp(fillingStatus, "Nozzles", "nozzles", pumpIndex) || 0,
          transaction:
            getProp(fillingStatus, "Transactions", "transactions", pumpIndex) ||
            0,
          fuelGrade:
            getProp(
              fillingStatus,
              "FuelGradeNames",
              "fuelGradeNames",
              pumpIndex
            ) || "Unknown",
        };
      }
    }

    // Check if pump has completed transaction
    const eotStatus = getStatus(
      pumpStatus,
      "EndOfTransactionStatus",
      "endOfTransactionStatus"
    );
    const eotIds = eotStatus?.Ids || eotStatus?.ids;

    if (eotIds) {
      const pumpIndex = eotIds.findIndex((id) => id === pumpId);

      if (pumpIndex >= 0) {
        return {
          status: "endOfTransaction",
          volume: getProp(eotStatus, "Volumes", "volumes", pumpIndex) || 0,
          amount: getProp(eotStatus, "Amounts", "amounts", pumpIndex) || 0,
          price: getProp(eotStatus, "Prices", "prices", pumpIndex) || 0,
          nozzle: getProp(eotStatus, "Nozzles", "nozzles", pumpIndex) || 0,
          transaction:
            getProp(eotStatus, "Transactions", "transactions", pumpIndex) || 0,
          tag: getProp(eotStatus, "Tags", "tags", pumpIndex) || "",
        };
      }
    }

    return null;
  },

  // Mobile-specific helper for formatting currency
  formatCurrency: (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  // Mobile-specific helper for formatting volume
  formatVolume: (volume, unit = "L") => {
    return `${volume.toFixed(2)} ${unit}`;
  },

  // Validate transaction data
  validateTransactionData: (
    pumpId,
    nozzleId,
    vehicleId,
    tagId,
    authType,
    dose
  ) => {
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
