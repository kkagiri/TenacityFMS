import {
  RECEIVE_UPLOAD_STATUS_UPDATE,
  PROBE_STATUS_UPDATE,
  READER_STATUS_UPDATE,
  TOGGLE_LIVE_DATA,
  SET_UPDATE_FREQUENCY,
  UPDATE_FUELING_CONTEXTS,
} from "../../actions/ptsActions/realtimeStatusActions";

const initialState = {
  devices: {},
  isLoading: true,
  isLiveDataEnabled: true,
  updateFrequency: 30, // default 30 seconds
  uploadStatusByDevice: {}, // Store full raw upload status data by device ID
  devicePumpStatus: {}, // Parsed pump status organized by device and pump ID
  deviceProbeStatus: {}, // Parsed probe status organized by device and probe ID
  deviceReaderStatus: {}, // Parsed reader status organized by device and reader ID
  // Enhanced: Fueling contexts for active pumps (mode, vehicle, tank, fueled by)
  deviceFuelingContexts: {}, // deviceId -> { pumpId -> fuelingContext }
  lastUpdated: null,
};

const realtimeStatusReducer = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_UPLOAD_STATUS_UPDATE: {
      const { deviceId, status: rawStatus } = action.payload;
      const timestamp = new Date().toISOString();

      // --- Start Parsing Logic ---
      let updatedPumpStatusForDevice = {};
      if (rawStatus?.pumps) {
        const pumpData = {};

        // Handle different casing for status objects from PTS (IdleStatus vs idleStatus) //Cursor
        const pumpsObj = rawStatus.pumps;

        // Process idle pumps - handle both casing versions
        const idleStatus = pumpsObj.IdleStatus || pumpsObj.idleStatus;
        if (idleStatus?.ids || idleStatus?.Ids) {
          const ids = idleStatus.ids || idleStatus.Ids || [];
          const nozzlesUp = idleStatus.nozzlesUp || idleStatus.NozzlesUp || [];
          const lastTransactions =
            idleStatus.lastTransactions || idleStatus.LastTransactions || [];
          const lastVolumes =
            idleStatus.lastVolumes || idleStatus.LastVolumes || [];
          const lastAmounts =
            idleStatus.lastAmounts || idleStatus.LastAmounts || [];
          const lastPrices =
            idleStatus.lastPrices || idleStatus.LastPrices || [];
          const tags = idleStatus.tags || idleStatus.Tags || [];

          ids.forEach((pumpId, index) => {
            if (pumpId !== null && pumpId !== undefined) {
              const nozzleUp = nozzlesUp[index] ?? 0;
              pumpData[pumpId] = {
                id: pumpId,
                status: nozzleUp > 0 ? "nozzleUp" : "idle",
                nozzleUp: nozzleUp,
                lastTransaction: lastTransactions[index] ?? 0,
                lastVolume: lastVolumes[index] ?? 0,
                lastAmount: lastAmounts[index] ?? 0,
                lastPrice: lastPrices[index] ?? 0,
                tag: tags[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }

        // Process fueling pumps - handle both casing versions
        const fillingStatus = pumpsObj.FillingStatus || pumpsObj.fillingStatus;
        if (fillingStatus?.ids || fillingStatus?.Ids) {
          const ids = fillingStatus.ids || fillingStatus.Ids || [];
          const nozzles = fillingStatus.nozzles || fillingStatus.Nozzles || [];
          const volumes = fillingStatus.volumes || fillingStatus.Volumes || [];
          const amounts = fillingStatus.amounts || fillingStatus.Amounts || [];
          const prices = fillingStatus.prices || fillingStatus.Prices || [];
          const transactions =
            fillingStatus.transactions || fillingStatus.Transactions || [];
          const fuelGradeIds =
            fillingStatus.fuelGradeIds || fillingStatus.FuelGradeIds || [];
          const fuelGradeNames =
            fillingStatus.fuelGradeNames || fillingStatus.FuelGradeNames || [];
          const tags = fillingStatus.tags || fillingStatus.Tags || [];

          ids.forEach((pumpId, index) => {
            if (pumpId !== null && pumpId !== undefined) {
              pumpData[pumpId] = {
                id: pumpId,
                status: "fueling",
                activeNozzle: nozzles[index] ?? 0,
                currentVolume: volumes[index] ?? 0,
                currentAmount: amounts[index] ?? 0,
                currentPrice: prices[index] ?? 0,
                currentTransaction: transactions[index] ?? 0,
                fuelGradeId: fuelGradeIds[index] ?? 0,
                fuelGradeName: fuelGradeNames[index] ?? "",
                tag: tags[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }

        // Process end of transaction - handle both casing versions
        const eotStatus =
          pumpsObj.EndOfTransactionStatus || pumpsObj.endOfTransactionStatus;
        if (eotStatus?.ids || eotStatus?.Ids) {
          const ids = eotStatus.ids || eotStatus.Ids || [];
          const nozzles = eotStatus.nozzles || eotStatus.Nozzles || [];
          const transactions =
            eotStatus.transactions || eotStatus.Transactions || [];
          const volumes = eotStatus.volumes || eotStatus.Volumes || [];
          const amounts = eotStatus.amounts || eotStatus.Amounts || [];
          const prices = eotStatus.prices || eotStatus.Prices || [];
          const tags = eotStatus.tags || eotStatus.Tags || [];

          ids.forEach((pumpId, index) => {
            if (pumpId !== null && pumpId !== undefined) {
              pumpData[pumpId] = {
                id: pumpId,
                status: "endOfTransaction",
                nozzle: nozzles?.[index] ?? 0,
                transaction: transactions?.[index] ?? 0,
                volume: volumes?.[index] ?? 0,
                amount: amounts?.[index] ?? 0,
                price: prices?.[index] ?? 0,
                tag: tags?.[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }

        // Process offline pumps - handle both casing versions
        const offlineStatus = pumpsObj.OfflineStatus || pumpsObj.offlineStatus;
        if (offlineStatus?.ids || offlineStatus?.Ids) {
          const ids = offlineStatus.ids || offlineStatus.Ids || [];
          ids.forEach((pumpId) => {
            if (pumpId !== null && pumpId !== undefined) {
              pumpData[pumpId] = {
                id: pumpId,
                status: "offline",
                updatedAt: timestamp,
              };
            }
          });
        }

        updatedPumpStatusForDevice = pumpData;
      }
      // --- End Parsing Logic ---

      // --- Start Probe Parsing Logic ---
      let updatedProbeStatusForDevice = {
        ...(state.deviceProbeStatus[deviceId] || {}),
      };

      if (rawStatus?.probes) {
        const probesObj = rawStatus.probes;

        // Handle online probes - with case insensitivity
        const onlineStatus = probesObj.OnlineStatus || probesObj.onlineStatus;
        if (onlineStatus?.ids || onlineStatus?.Ids) {
          const ids = onlineStatus.ids || onlineStatus.Ids || [];
          const errors = onlineStatus.errors || onlineStatus.Errors || [];
          const criticalHighAlarms =
            onlineStatus.criticalHighProductAlarms ||
            onlineStatus.CriticalHighProductAlarms ||
            [];
          const highAlarms =
            onlineStatus.highProductAlarms ||
            onlineStatus.HighProductAlarms ||
            [];
          const lowAlarms =
            onlineStatus.lowProductAlarms ||
            onlineStatus.LowProductAlarms ||
            [];
          const criticalLowAlarms =
            onlineStatus.criticalLowProductAlarms ||
            onlineStatus.CriticalLowProductAlarms ||
            [];
          const highWaterAlarms =
            onlineStatus.highWaterAlarms || onlineStatus.HighWaterAlarms || [];
          const tankLeakageAlarms =
            onlineStatus.tankLeakageAlarms ||
            onlineStatus.TankLeakageAlarms ||
            [];
          const measurements =
            onlineStatus.measurements || onlineStatus.Measurements || [];

          ids.forEach((probeId, index) => {
            if (probeId !== null && probeId !== undefined) {
              updatedProbeStatusForDevice[probeId] = {
                id: probeId,
                status: "online",
                error: errors?.[index] ?? null,
                alarms: {
                  // Grouping alarms
                  criticalHighProduct: criticalHighAlarms?.includes(probeId),
                  highProduct: highAlarms?.includes(probeId),
                  lowProduct: lowAlarms?.includes(probeId),
                  criticalLowProduct: criticalLowAlarms?.includes(probeId),
                  highWater: highWaterAlarms?.includes(probeId),
                  tankLeakage: tankLeakageAlarms?.includes(probeId),
                },
                measurements: measurements?.[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }

        // Handle offline probes - with case insensitivity
        const offlineStatus =
          probesObj.OfflineStatus || probesObj.offlineStatus;
        if (offlineStatus?.ids || offlineStatus?.Ids) {
          const ids = offlineStatus.ids || offlineStatus.Ids || [];
          ids.forEach((probeId) => {
            if (probeId !== null && probeId !== undefined) {
              updatedProbeStatusForDevice[probeId] = {
                id: probeId,
                status: "offline",
                updatedAt: timestamp,
              };
            }
          });
        }
      }
      // --- End Probe Parsing Logic ---

      // --- Start Reader Parsing Logic ---
      let updatedReaderStatusForDevice = {
        ...(state.deviceReaderStatus[deviceId] || {}),
      };

      if (rawStatus?.readers) {
        const readersObj = rawStatus.readers;

        // Handle online readers - with case insensitivity
        const onlineStatus = readersObj.OnlineStatus || readersObj.onlineStatus;
        if (onlineStatus?.ids || onlineStatus?.Ids) {
          const ids = onlineStatus.ids || onlineStatus.Ids || [];
          const tags = onlineStatus.tags || onlineStatus.Tags || [];
          const errors = onlineStatus.errors || onlineStatus.Errors || [];

          ids.forEach((readerId, index) => {
            if (readerId !== null && readerId !== undefined) {
              updatedReaderStatusForDevice[readerId] = {
                id: readerId,
                status: "online",
                tag: tags?.[index] ?? null,
                error: errors?.[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }

        // Handle offline readers - with case insensitivity
        const offlineStatus =
          readersObj.OfflineStatus || readersObj.offlineStatus;
        if (offlineStatus?.ids || offlineStatus?.Ids) {
          const ids = offlineStatus.ids || offlineStatus.Ids || [];
          const tags = offlineStatus.tags || offlineStatus.Tags || [];

          ids.forEach((readerId, index) => {
            if (readerId !== null && readerId !== undefined) {
              updatedReaderStatusForDevice[readerId] = {
                id: readerId,
                status: "offline",
                tag: tags?.[index] ?? null,
                updatedAt: timestamp,
              };
            }
          });
        }
      }
      // --- End Reader Parsing Logic ---

      return {
        ...state,
        uploadStatusByDevice: {
          ...state.uploadStatusByDevice,
          [deviceId]: {
            deviceId,
            status: rawStatus, // Keep raw status
            receivedAt: timestamp,
          },
        },
        devicePumpStatus: {
          ...state.devicePumpStatus,
          [deviceId]: updatedPumpStatusForDevice,
        },
        deviceProbeStatus: {
          ...state.deviceProbeStatus,
          [deviceId]: updatedProbeStatusForDevice,
        },
        deviceReaderStatus: {
          ...state.deviceReaderStatus,
          [deviceId]: updatedReaderStatusForDevice,
        },
        lastUpdated: timestamp,
        isLoading: false,
      };
    }

    case PROBE_STATUS_UPDATE:
      const {
        deviceId: probeDeviceId,
        probeId,
        status: probeStatus,
        measurements,
      } = action.payload;
      return {
        ...state,
        deviceProbeStatus: {
          ...state.deviceProbeStatus,
          [probeDeviceId]: {
            ...(state.deviceProbeStatus[probeDeviceId] || {}), // Ensure device entry exists
            [probeId]: {
              status: probeStatus,
              measurements,
              lastUpdated: new Date().toISOString(),
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      };

    case READER_STATUS_UPDATE:
      const {
        deviceId: readerDeviceId,
        readerId,
        status: readerStatus,
        tag,
      } = action.payload;
      return {
        ...state,
        deviceReaderStatus: {
          ...state.deviceReaderStatus,
          [readerDeviceId]: {
            ...(state.deviceReaderStatus[readerDeviceId] || {}), // Ensure device entry exists
            [readerId]: {
              status: readerStatus,
              tag: tag, // Add tag info if available
              lastUpdated: new Date().toISOString(),
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      };

    case TOGGLE_LIVE_DATA:
      return {
        ...state,
        isLiveDataEnabled: !state.isLiveDataEnabled,
      };

    case SET_UPDATE_FREQUENCY:
      return {
        ...state,
        updateFrequency: action.payload,
      };

    case UPDATE_FUELING_CONTEXTS: {
      const { deviceId, fuelingContexts } = action.payload;
      const timestamp = new Date().toISOString();

      // Build updated contexts for this device
      const updatedContexts = {
        ...(state.deviceFuelingContexts[deviceId] || {}),
      };

      if (fuelingContexts && Array.isArray(fuelingContexts)) {
        fuelingContexts.forEach((context) => {
          if (context.pumpId) {
            updatedContexts[context.pumpId] = {
              ...context,
              lastUpdated: timestamp,
            };
          }
        });
      }

      return {
        ...state,
        deviceFuelingContexts: {
          ...state.deviceFuelingContexts,
          [deviceId]: updatedContexts,
        },
        lastUpdated: timestamp,
      };
    }

    default:
      return state;
  }
};

export default realtimeStatusReducer;
