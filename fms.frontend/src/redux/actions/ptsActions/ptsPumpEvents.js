import {
  NOZZLE_STATE_CHANGE,
  UPLOADSTATUS_TAG_READ,
  FILLING_STATUS_UPDATE,
  PUMP_TRANSACTION_COMPLETED,
  PUMP_OFFLINE,
} from "../types";

export const nozzleStateChange = (nozzleState) => ({
  type: NOZZLE_STATE_CHANGE,
  payload: nozzleState,
});

export const uploadStatusTagRead = (uploadStatus) => ({
  type: UPLOADSTATUS_TAG_READ,
  payload: uploadStatus,
});

export const fillingStatusUpdate = (fillingStatus) => ({
  type: FILLING_STATUS_UPDATE,
  payload: fillingStatus,
});

export const pumpTransactionCompleted = (pumpTransaction) => ({
  type: PUMP_TRANSACTION_COMPLETED,
  payload: pumpTransaction,
});

export const pumpOffline = (pumpOffline) => ({
  type: PUMP_OFFLINE,
  payload: pumpOffline,
});
