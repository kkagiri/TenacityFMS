import {
  AUTHORIZE_PUMP_REQUEST,
  AUTHORIZE_PUMP_SUCCESS,
  AUTHORIZE_PUMP_FAILURE,
  GET_PUMP_STATE_REQUEST,
  GET_PUMP_STATE_SUCCESS,
  GET_PUMP_STATE_FAILURE,
  STOP_PUMP_REQUEST,
  STOP_PUMP_SUCCESS,
  STOP_PUMP_FAILURE,
  CLOSE_TRANSACTION_REQUEST,
  CLOSE_TRANSACTION_SUCCESS,
  CLOSE_TRANSACTION_FAILURE,
  UPDATE_PUMP_STATUS,
  UPDATE_NOZZLE_STATE,
  UPDATE_FILLING_STATUS,
  UPDATE_PUMP_TRANSACTION_COMPLETED,
  RECEIVE_UPLOAD_STATUS_UPDATE,
} from "../../actions/ptsActions/ptsTypes";

const initialState = {
  loading: false,
  error: null,
  pumps: {}, // Organized by deviceId -> pumpId
  activeFuelingProcesses: [],
  lastUploadStatus: null,
};

const pumpReducer = (state = initialState, action) => {
  switch (action.type) {
    // Loading states for API calls
    case AUTHORIZE_PUMP_REQUEST:
    case GET_PUMP_STATE_REQUEST:
    case STOP_PUMP_REQUEST:
    case CLOSE_TRANSACTION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    // Error states for API calls
    case AUTHORIZE_PUMP_FAILURE:
    case GET_PUMP_STATE_FAILURE:
    case STOP_PUMP_FAILURE:
    case CLOSE_TRANSACTION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Success states for API calls
    case AUTHORIZE_PUMP_SUCCESS:
      return {
        ...state,
        loading: false,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              isAuthorized: true,
              transaction: action.payload.data?.transaction,
              lastCommand: "authorize",
              lastCommandTime: new Date().toISOString(),
            },
          },
        },
      };

    case GET_PUMP_STATE_SUCCESS:
      return {
        ...state,
        loading: false,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              ...action.payload.data,
              lastUpdated: new Date().toISOString(),
            },
          },
        },
      };

    case STOP_PUMP_SUCCESS:
      return {
        ...state,
        loading: false,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              lastCommand: "stop",
              lastCommandTime: new Date().toISOString(),
            },
          },
        },
      };

    case CLOSE_TRANSACTION_SUCCESS:
      return {
        ...state,
        loading: false,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              lastCommand: "closeTransaction",
              lastCommandTime: new Date().toISOString(),
              isTransactionClosed: true,
            },
          },
        },
      };

    // Real-time update handling
    case RECEIVE_UPLOAD_STATUS_UPDATE:
      const { deviceId, status } = action.payload;

      // Process the upload status to extract all pump information
      let updatedPumps = { ...state.pumps };

      // Process active fueling processes from upload status
      let activeFuelingProcesses = [];

      // Process idle pumps
      if (status?.pumps?.IdleStatus?.Ids) {
        status.pumps.IdleStatus.Ids.forEach((pumpId, index) => {
          if (!pumpId) return;

          updatedPumps = {
            ...updatedPumps,
            [deviceId]: {
              ...updatedPumps[deviceId],
              [pumpId]: {
                ...updatedPumps[deviceId]?.[pumpId],
                status: "idle",
                nozzleUp: status.pumps.IdleStatus.NozzlesUp?.[index] || 0,
                lastTransaction:
                  status.pumps.IdleStatus.LastTransactions?.[index] || 0,
                lastVolume: status.pumps.IdleStatus.LastVolumes?.[index] || 0,
                lastAmount: status.pumps.IdleStatus.LastAmounts?.[index] || 0,
                lastPrice: status.pumps.IdleStatus.LastPrices?.[index] || 0,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        });
      }

      // Process filling pumps
      if (status?.pumps?.FillingStatus?.Ids) {
        status.pumps.FillingStatus.Ids.forEach((pumpId, index) => {
          if (!pumpId) return;

          const transactionDetails = {
            nozzle: status.pumps.FillingStatus.Nozzles?.[index] || 0,
            transaction: status.pumps.FillingStatus.Transactions?.[index] || 0,
            volume: status.pumps.FillingStatus.Volumes?.[index] || 0,
            amount: status.pumps.FillingStatus.Amounts?.[index] || 0,
            price: status.pumps.FillingStatus.Prices?.[index] || 0,
            fuelGradeId: status.pumps.FillingStatus.FuelGradeIds?.[index] || 0,
            fuelGradeName:
              status.pumps.FillingStatus.FuelGradeNames?.[index] || "",
          };

          // Update pump state
          updatedPumps = {
            ...updatedPumps,
            [deviceId]: {
              ...updatedPumps[deviceId],
              [pumpId]: {
                ...updatedPumps[deviceId]?.[pumpId],
                status: "filling",
                ...transactionDetails,
                lastUpdated: new Date().toISOString(),
              },
            },
          };

          // Add to active fueling processes
          activeFuelingProcesses.push({
            deviceId,
            pumpId,
            pumpName: `Pump ${pumpId}`,
            nozzleId: transactionDetails.nozzle,
            nozzleName: `Nozzle ${transactionDetails.nozzle}`,
            volume: transactionDetails.volume,
            amount: transactionDetails.amount,
            price: transactionDetails.price,
            fuelGradeId: transactionDetails.fuelGradeId,
            fuelGradeName: transactionDetails.fuelGradeName,
            transaction: transactionDetails.transaction,
            key: `${deviceId}-${pumpId}-${transactionDetails.nozzle}`,
            lastUpdated: new Date().toISOString(),
          });
        });
      }

      // Process end of transaction pumps
      if (status?.pumps?.EndOfTransactionStatus?.Ids) {
        status.pumps.EndOfTransactionStatus.Ids.forEach((pumpId, index) => {
          if (!pumpId) return;

          const transactionDetails = {
            nozzle: status.pumps.EndOfTransactionStatus.Nozzles?.[index] || 0,
            transaction:
              status.pumps.EndOfTransactionStatus.Transactions?.[index] || 0,
            volume: status.pumps.EndOfTransactionStatus.Volumes?.[index] || 0,
            amount: status.pumps.EndOfTransactionStatus.Amounts?.[index] || 0,
            price: status.pumps.EndOfTransactionStatus.Prices?.[index] || 0,
            fuelGradeId:
              status.pumps.EndOfTransactionStatus.FuelGradeIds?.[index] || 0,
            fuelGradeName:
              status.pumps.EndOfTransactionStatus.FuelGradeNames?.[index] || "",
          };

          // Update pump state
          updatedPumps = {
            ...updatedPumps,
            [deviceId]: {
              ...updatedPumps[deviceId],
              [pumpId]: {
                ...updatedPumps[deviceId]?.[pumpId],
                status: "endOfTransaction",
                ...transactionDetails,
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        });
      }

      // Process offline pumps
      if (status?.pumps?.OfflineStatus?.Ids) {
        status.pumps.OfflineStatus.Ids.forEach((pumpId) => {
          if (!pumpId) return;

          updatedPumps = {
            ...updatedPumps,
            [deviceId]: {
              ...updatedPumps[deviceId],
              [pumpId]: {
                ...updatedPumps[deviceId]?.[pumpId],
                status: "offline",
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        });
      }

      return {
        ...state,
        pumps: updatedPumps,
        activeFuelingProcesses,
        lastUploadStatus: {
          deviceId,
          status,
          timestamp: new Date().toISOString(),
        },
      };

    // Individual update handlers
    case UPDATE_PUMP_STATUS:
      return {
        ...state,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              status: action.payload.status,
              lastUpdated: new Date().toISOString(),
            },
          },
        },
      };

    case UPDATE_NOZZLE_STATE:
      return {
        ...state,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              nozzleUp: action.payload.nozzleNumber,
              lastUpdated: new Date().toISOString(),
            },
          },
        },
      };

    case UPDATE_FILLING_STATUS:
      return {
        ...state,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              ...action.payload.transactionDetails,
              status: "filling",
              lastUpdated: new Date().toISOString(),
            },
          },
        },
      };

    case UPDATE_PUMP_TRANSACTION_COMPLETED:
      return {
        ...state,
        pumps: {
          ...state.pumps,
          [action.payload.deviceId]: {
            ...state.pumps[action.payload.deviceId],
            [action.payload.pumpId]: {
              ...state.pumps[action.payload.deviceId]?.[action.payload.pumpId],
              status: "completed",
              lastUpdated: new Date().toISOString(),
            },
          },
        },
      };

    default:
      return state;
  }
};

export default pumpReducer;
