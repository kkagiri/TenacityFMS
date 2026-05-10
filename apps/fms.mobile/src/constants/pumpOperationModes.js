/**
 * Pump Operation Mode Constants
 * Provides strong typing for "vehicle" and "transfer" modes
 * Must match backend constants: FMS.Application.Common.Constants.PumpOperationMode
 */
export const PUMP_OPERATION_MODES = {
  // Vehicle fueling mode - dispense to a vehicle
  VEHICLE: "vehicle",

  // Tank transfer mode - transfer between storage tanks
  TRANSFER: "transfer",

  // Unknown or uninitialized mode
  UNKNOWN: "unknown",
};

// Display names for UI
export const PUMP_MODE_DISPLAY_NAMES = {
  [PUMP_OPERATION_MODES.VEHICLE]: "Vehicle Fueling",
  [PUMP_OPERATION_MODES.TRANSFER]: "Tank Transfer",
  [PUMP_OPERATION_MODES.UNKNOWN]: "Unknown Mode",
};

// Backend mode constants (capitalized as sent from API)
export const BACKEND_PUMP_MODES = {
  VEHICLE: "Vehicle",
  TRANSFER: "Transfer",
  UNKNOWN: "Unknown",
};

// Backend display names
export const BACKEND_MODE_DISPLAY_NAMES = {
  [BACKEND_PUMP_MODES.VEHICLE]: "Vehicle Fueling",
  [BACKEND_PUMP_MODES.TRANSFER]: "Tank Transfer",
  [BACKEND_PUMP_MODES.UNKNOWN]: "Unknown Mode",
};

/**
 * Validates if a mode string is valid
 */
export const isValidMode = (mode) => {
  const lowercaseMode = mode?.toLowerCase();
  return Object.values(PUMP_OPERATION_MODES).includes(lowercaseMode);
};

/**
 * Validates backend mode (capitalized)
 */
export const isValidBackendMode = (mode) => {
  return Object.values(BACKEND_PUMP_MODES).includes(mode);
};

/**
 * Converts lowercase frontend mode to backend format (capitalized)
 */
export const normalizeToBackendMode = (mode) => {
  const normalized = mode?.toLowerCase();
  switch (normalized) {
    case PUMP_OPERATION_MODES.VEHICLE:
      return BACKEND_PUMP_MODES.VEHICLE;
    case PUMP_OPERATION_MODES.TRANSFER:
      return BACKEND_PUMP_MODES.TRANSFER;
    default:
      return BACKEND_PUMP_MODES.UNKNOWN;
  }
};

/**
 * Converts backend mode (capitalized) to frontend format (lowercase)
 */
export const normalizeTofrontendMode = (mode) => {
  switch (mode) {
    case BACKEND_PUMP_MODES.VEHICLE:
      return PUMP_OPERATION_MODES.VEHICLE;
    case BACKEND_PUMP_MODES.TRANSFER:
      return PUMP_OPERATION_MODES.TRANSFER;
    default:
      return PUMP_OPERATION_MODES.UNKNOWN;
  }
};

/**
 * Gets display name for the mode
 */
export const getDisplayName = (mode) => {
  const normalized = mode?.toLowerCase();
  return PUMP_MODE_DISPLAY_NAMES[normalized] || PUMP_MODE_DISPLAY_NAMES[PUMP_OPERATION_MODES.UNKNOWN];
};

/**
 * Gets display name for backend mode
 */
export const getBackendDisplayName = (mode) => {
  return BACKEND_MODE_DISPLAY_NAMES[mode] || BACKEND_MODE_DISPLAY_NAMES[BACKEND_PUMP_MODES.UNKNOWN];
};

/**
 * Checks if mode is vehicle mode
 */
export const isVehicleMode = (mode) => {
  return mode?.toLowerCase() === PUMP_OPERATION_MODES.VEHICLE;
};

/**
 * Checks if mode is transfer mode
 */
export const isTransferMode = (mode) => {
  return mode?.toLowerCase() === PUMP_OPERATION_MODES.TRANSFER;
};

/**
 * Checks if backend mode is transfer mode (capitalized)
 */
export const isBackendTransferMode = (mode) => {
  return mode === BACKEND_PUMP_MODES.TRANSFER;
};

/**
 * Checks if backend mode is vehicle mode (capitalized)
 */
export const isBackendVehicleMode = (mode) => {
  return mode === BACKEND_PUMP_MODES.VEHICLE;
};
