//Cursor - Mock PTS data generator for testing without live devices
// Based on UploadStatus.cs structure from backend

/**
 * Generates mock UploadStatus data structure matching backend PTS format
 * Creates 2 pumps: one busy (fueling), one free (idle)
 * Free pump has 1 diesel nozzle
 */
export const generateMockPTSData = (ptsId = "MOCK-PTS-001") => {
  const now = new Date();

  return {
    ConfigurationId: `config-${ptsId}`,
    DateTime: now.toISOString(),
    FirmwareDateTime: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    StartupSeconds: 3600, // 1 hour uptime
    BatteryVoltage: 1250, // 12.5V (in 0.01V units)
    CpuTemperature: 45, // 45°C
    PtsPowerDownDetected: false,
    SdMounted: true,

    // Pump Status - Matches backend UploadStatus format
    // Arrays of status data: IdleStatus, FillingStatus, EndOfTransactionStatus
    Pumps: {
      Count: 2,
      // Idle pumps (Pump 1 - FREE with diesel nozzle)
      IdleStatus: {
        Ids: [1], // Pump 1 is idle
        NozzlesUp: [0], // No nozzle up
        LastTransactions: [0],
        LastVolumes: [0],
        LastAmounts: [0],
        LastPrices: [24.5],
      },
      // Pumps currently fueling (Pump 2 - BUSY)
      FillingStatus: {
        Ids: [2], // Pump 2 is fueling
        Nozzles: [1], // Nozzle 1
        Volumes: [45.5], // Current volume
        Amounts: [1023.75], // Current amount
        Transactions: [12001], // Transaction ID
      },
      // Finished transactions (none currently)
      EndOfTransactionStatus: {
        Ids: [],
        Volumes: [],
        Amounts: [],
        Transactions: [],
      },
      // Nozzle configuration per pump
      NozzleConfig: {
        1: [
          // Pump 1 nozzles
          {
            Number: 1,
            FuelGradeId: 1,
            FuelGradeName: "Diesel",
            Price: 24.5,
          },
        ],
        2: [
          // Pump 2 nozzles
          {
            Number: 1,
            FuelGradeId: 2,
            FuelGradeName: "Petrol 95",
            Price: 22.5,
          },
          {
            Number: 2,
            FuelGradeId: 3,
            FuelGradeName: "Petrol 98",
            Price: 25.0,
          },
        ],
      },
    },

    // Probe/Tank Status - Matches backend format
    Probes: {
      Count: 3,
      Ids: [1, 2, 3],
      ProductIds: [1, 2, 3],
      ProductNames: ["Diesel", "Petrol 95", "Petrol 98"],
      Volumes: [25000, 18500, 12000], // liters
      Heights: [1850, 1420, 980], // mm
      Temperatures: [22, 23, 23], // °C
      Waters: [0, 0, 0], // mm water
      Capacities: [50000, 40000, 30000],
      Statuses: [0, 0, 0], // 0 = Normal
    },

    // RFID Readers Status - Matches backend format
    Readers: {
      Count: 2,
      Ids: [1, 2],
      Statuses: [1, 1], // 1 = Online
      LastTags: [null, null],
      LastReadTimes: [null, null],
    },

    // Fuel Grades/Products
    FuelGrades: [
      {
        Id: 1,
        Name: "Diesel",
        Nozzle: 1,
        Price: 24.5,
        FuelType: "Diesel",
        Color: "#FFD700", // Gold
      },
      {
        Id: 2,
        Name: "Petrol 95",
        Nozzle: 1,
        Price: 22.5,
        FuelType: "Petrol",
        Color: "#32CD32", // Green
      },
      {
        Id: 3,
        Name: "Petrol 98",
        Nozzle: 2,
        Price: 25.0,
        FuelType: "Petrol",
        Color: "#FF6347", // Red
      },
    ],
  };
};

/**
 * Helper function to move pump between status arrays
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump number
 * @param {string} fromStatus - Source status (idle/filling/endOfTransaction)
 * @param {string} toStatus - Target status
 * @param {object} statusData - Additional data for the new status
 */
const movePumpStatus = (
  currentData,
  pumpNumber,
  fromStatus,
  toStatus,
  statusData = {}
) => {
  const pumps = currentData.Pumps;

  // Remove from old status
  if (fromStatus === "idle") {
    const idx = pumps.IdleStatus.Ids.indexOf(pumpNumber);
    if (idx >= 0) {
      pumps.IdleStatus.Ids.splice(idx, 1);
      pumps.IdleStatus.NozzlesUp.splice(idx, 1);
      pumps.IdleStatus.LastTransactions.splice(idx, 1);
      pumps.IdleStatus.LastVolumes.splice(idx, 1);
      pumps.IdleStatus.LastAmounts.splice(idx, 1);
      pumps.IdleStatus.LastPrices.splice(idx, 1);
    }
  } else if (fromStatus === "filling") {
    const idx = pumps.FillingStatus.Ids.indexOf(pumpNumber);
    if (idx >= 0) {
      pumps.FillingStatus.Ids.splice(idx, 1);
      pumps.FillingStatus.Nozzles.splice(idx, 1);
      pumps.FillingStatus.Volumes.splice(idx, 1);
      pumps.FillingStatus.Amounts.splice(idx, 1);
      pumps.FillingStatus.Transactions.splice(idx, 1);
    }
  } else if (fromStatus === "endOfTransaction") {
    const idx = pumps.EndOfTransactionStatus.Ids.indexOf(pumpNumber);
    if (idx >= 0) {
      pumps.EndOfTransactionStatus.Ids.splice(idx, 1);
      pumps.EndOfTransactionStatus.Volumes.splice(idx, 1);
      pumps.EndOfTransactionStatus.Amounts.splice(idx, 1);
      pumps.EndOfTransactionStatus.Transactions.splice(idx, 1);
    }
  }

  // Add to new status
  if (toStatus === "idle") {
    pumps.IdleStatus.Ids.push(pumpNumber);
    pumps.IdleStatus.NozzlesUp.push(statusData.nozzleUp || 0);
    pumps.IdleStatus.LastTransactions.push(statusData.lastTransaction || 0);
    pumps.IdleStatus.LastVolumes.push(statusData.lastVolume || 0);
    pumps.IdleStatus.LastAmounts.push(statusData.lastAmount || 0);
    pumps.IdleStatus.LastPrices.push(statusData.lastPrice || 24.5);
  } else if (toStatus === "filling") {
    pumps.FillingStatus.Ids.push(pumpNumber);
    pumps.FillingStatus.Nozzles.push(statusData.nozzle || 1);
    pumps.FillingStatus.Volumes.push(statusData.volume || 0);
    pumps.FillingStatus.Amounts.push(statusData.amount || 0);
    pumps.FillingStatus.Transactions.push(statusData.transaction || Date.now());
  } else if (toStatus === "endOfTransaction") {
    pumps.EndOfTransactionStatus.Ids.push(pumpNumber);
    pumps.EndOfTransactionStatus.Volumes.push(statusData.volume || 0);
    pumps.EndOfTransactionStatus.Amounts.push(statusData.amount || 0);
    pumps.EndOfTransactionStatus.Transactions.push(
      statusData.transaction || Date.now()
    );
  }

  return currentData;
};

/**
 * Simulate pump authorization (moves from idle to authorized - stays in idle with nozzleUp)
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump to authorize
 * @param {number} nozzleNumber - Nozzle to authorize
 * @param {number} dose - Dose amount (optional)
 */
export const mockAuthorizePump = (
  currentData,
  pumpNumber,
  nozzleNumber,
  dose = null
) => {
  // In real system, authorized pumps show as idle with nozzle up indicator
  const idx = currentData.Pumps.IdleStatus.Ids.indexOf(pumpNumber);
  if (idx >= 0) {
    currentData.Pumps.IdleStatus.NozzlesUp[idx] = nozzleNumber;
  }
  console.log(`[MOCK] Authorized Pump ${pumpNumber}, Nozzle ${nozzleNumber}`);
  return currentData;
};

/**
 * Simulate pump starting fueling (moves from idle to filling)
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump that started fueling
 * @param {number} nozzleNumber - Active nozzle
 */
export const mockStartFueling = (currentData, pumpNumber, nozzleNumber = 1) => {
  return movePumpStatus(currentData, pumpNumber, "idle", "filling", {
    nozzle: nozzleNumber,
    volume: 0,
    amount: 0,
    transaction: Date.now(),
  });
};

/**
 * Simulate pump fueling progress (update filling status)
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump in fueling
 * @param {number} volume - Current volume
 * @param {number} amount - Current amount
 */
export const mockFuelingProgress = (
  currentData,
  pumpNumber,
  volume,
  amount
) => {
  const idx = currentData.Pumps.FillingStatus.Ids.indexOf(pumpNumber);
  if (idx >= 0) {
    currentData.Pumps.FillingStatus.Volumes[idx] = volume;
    currentData.Pumps.FillingStatus.Amounts[idx] = amount;
  }
  return currentData;
};

/**
 * Simulate pump end of transaction (moves from filling to endOfTransaction)
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump that finished
 */
export const mockEndTransaction = (currentData, pumpNumber) => {
  const idx = currentData.Pumps.FillingStatus.Ids.indexOf(pumpNumber);
  if (idx >= 0) {
    const volume = currentData.Pumps.FillingStatus.Volumes[idx];
    const amount = currentData.Pumps.FillingStatus.Amounts[idx];
    const transaction = currentData.Pumps.FillingStatus.Transactions[idx];

    return movePumpStatus(
      currentData,
      pumpNumber,
      "filling",
      "endOfTransaction",
      {
        volume,
        amount,
        transaction,
      }
    );
  }
  return currentData;
};

/**
 * Simulate pump reset to idle (moves from endOfTransaction to idle)
 * @param {object} currentData - Current mock data
 * @param {number} pumpNumber - Pump to reset
 */
export const mockResetPump = (currentData, pumpNumber) => {
  const idx = currentData.Pumps.EndOfTransactionStatus.Ids.indexOf(pumpNumber);
  if (idx >= 0) {
    const volume = currentData.Pumps.EndOfTransactionStatus.Volumes[idx];
    const amount = currentData.Pumps.EndOfTransactionStatus.Amounts[idx];

    return movePumpStatus(currentData, pumpNumber, "endOfTransaction", "idle", {
      lastVolume: volume,
      lastAmount: amount,
      nozzleUp: 0,
    });
  }
  return currentData;
};

export default {
  generateMockPTSData,
  movePumpStatus,
  mockAuthorizePump,
  mockStartFueling,
  mockFuelingProgress,
  mockEndTransaction,
  mockResetPump,
};
