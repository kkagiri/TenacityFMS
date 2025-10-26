import {
  FETCH_VEHICLES_SUCCESS,
  FETCH_VEHICLES_FAILURE,
  UPDATE_VEHICLES_SUCCESS,
  UPDATE_VEHICLES_FAILURE,
  CREATE_VEHICLE_SUCCESS,
  CREATE_VEHICLE_FAILURE,
  // Vehicle History Actions
  FETCH_VEHICLE_CONSUMPTION_HISTORY_SUCCESS,
  FETCH_VEHICLE_CONSUMPTION_HISTORY_FAILURE,
  FETCH_VEHICLE_FUELING_HISTORY_SUCCESS,
  FETCH_VEHICLE_FUELING_HISTORY_FAILURE,
  FETCH_VEHICLE_MAINTENANCE_HISTORY_SUCCESS,
  FETCH_VEHICLE_MAINTENANCE_HISTORY_FAILURE,
  ADD_MAINTENANCE_RECORD_SUCCESS,
  ADD_MAINTENANCE_RECORD_FAILURE,
  // New action types for consumption history state management
  FETCH_VEHICLE_CONSUMPTION_HISTORY_REQUEST,
  CLEAR_VEHICLE_CONSUMPTION_HISTORY,
  // Vehicle Schedule Actions
  FETCH_VEHICLE_SCHEDULES_SUCCESS,
  FETCH_VEHICLE_SCHEDULES_FAILURE,
  ADD_VEHICLE_SCHEDULE_SUCCESS,
  ADD_VEHICLE_SCHEDULE_FAILURE,
  UPDATE_VEHICLE_SCHEDULE_SUCCESS,
  UPDATE_VEHICLE_SCHEDULE_FAILURE,
  DELETE_VEHICLE_SCHEDULE_SUCCESS,
  DELETE_VEHICLE_SCHEDULE_FAILURE,
} from "../actions/vehicleActions";

const initialState = {
  vehicles: [],
  loading: true,
  error: null,
  // Vehicle history data
  consumptionHistory: [],
  fuelingHistory: [],
  maintenanceHistory: [],
  // Vehicle schedules data
  schedules: [],
  // Loading states for different operations
  loadingStates: {
    consumptionHistory: false,
    fuelingHistory: false,
    maintenanceHistory: false,
    schedules: false,
  },
  // Error states for different operations
  errors: {
    consumptionHistory: null,
    fuelingHistory: null,
    maintenanceHistory: null,
    schedules: null,
  },
  consumptionHistoryLoading: false,
  consumptionHistoryError: null,
};

const VehicleReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_VEHICLES_SUCCESS:
      return {
        ...state,
        vehicles: [...action.payload],
        loading: false,
        error: null,
      };
    case FETCH_VEHICLES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case UPDATE_VEHICLES_SUCCESS:
      // Get the updated vehicle from the payload
      const updatedVehicle = action.payload[0];

      // Create a new array with the updated vehicle
      const updatedVehicles = state.vehicles.map((vehicle) => {
        if (vehicle.vehicleId === updatedVehicle.vehicleId) {
          // Create a new object for the updated vehicle
          return {
            ...vehicle,
            workingSiteId: updatedVehicle.workingSiteId || null,
            // Copy all other properties from the updated vehicle
            ...Object.fromEntries(
              Object.entries(updatedVehicle).filter(
                ([key]) => key !== "vehicleId" && key !== "workingSiteId"
              )
            ),
          };
        }
        // Return a new object for unchanged vehicles
        return { ...vehicle };
      });

      return {
        ...state,
        vehicles: updatedVehicles,
        loading: false,
        error: null,
      };
      case FETCH_VEHICLE_CONSUMPTION_HISTORY_REQUEST:
  return {
    ...state,
    consumptionHistoryLoading: true,
    consumptionHistoryError: null,
  };

case CLEAR_VEHICLE_CONSUMPTION_HISTORY:
  return {
    ...state,
    consumptionHistory: [],
    consumptionHistoryLoading: false,
    consumptionHistoryError: null,
  };

    case UPDATE_VEHICLES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CREATE_VEHICLE_SUCCESS:
      return {
        ...state,
        vehicles: [action.payload, ...state.vehicles],
        loading: false,
        error: null,
      };
    case CREATE_VEHICLE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // =============================================================================
    // VEHICLE CONSUMPTION HISTORY CASES
    // =============================================================================
    case FETCH_VEHICLE_CONSUMPTION_HISTORY_SUCCESS:
      return {
        ...state,
        consumptionHistory: action.payload,
        consumptionHistoryLoading: false,
        consumptionHistoryError: null,
        loadingStates: {
          ...state.loadingStates,
          consumptionHistory: false,
        },
        errors: {
          ...state.errors,
          consumptionHistory: null,
        },
      };
    case FETCH_VEHICLE_CONSUMPTION_HISTORY_FAILURE:
      return {
        ...state,
        consumptionHistory: [],
        consumptionHistoryLoading: false,
        consumptionHistoryError: action.payload,
        loadingStates: {
          ...state.loadingStates,
          consumptionHistory: false,
        },
        errors: {
          ...state.errors,
          consumptionHistory: action.payload,
        },
      };

    // =============================================================================
    // VEHICLE FUELING HISTORY CASES
    // =============================================================================
    case FETCH_VEHICLE_FUELING_HISTORY_SUCCESS:
      return {
        ...state,
        fuelingHistory: action.payload,
        loadingStates: {
          ...state.loadingStates,
          fuelingHistory: false,
        },
        errors: {
          ...state.errors,
          fuelingHistory: null,
        },
      };
    case FETCH_VEHICLE_FUELING_HISTORY_FAILURE:
      return {
        ...state,
        fuelingHistory: [],
        loadingStates: {
          ...state.loadingStates,
          fuelingHistory: false,
        },
        errors: {
          ...state.errors,
          fuelingHistory: action.payload,
        },
      };

    // =============================================================================
    // VEHICLE MAINTENANCE HISTORY CASES
    // =============================================================================
    case FETCH_VEHICLE_MAINTENANCE_HISTORY_SUCCESS:
      return {
        ...state,
        maintenanceHistory: action.payload,
        loadingStates: {
          ...state.loadingStates,
          maintenanceHistory: false,
        },
        errors: {
          ...state.errors,
          maintenanceHistory: null,
        },
      };
    case FETCH_VEHICLE_MAINTENANCE_HISTORY_FAILURE:
      return {
        ...state,
        maintenanceHistory: [],
        loadingStates: {
          ...state.loadingStates,
          maintenanceHistory: false,
        },
        errors: {
          ...state.errors,
          maintenanceHistory: action.payload,
        },
      };
    case ADD_MAINTENANCE_RECORD_SUCCESS:
      return {
        ...state,
        maintenanceHistory: [action.payload, ...state.maintenanceHistory],
        loadingStates: {
          ...state.loadingStates,
          maintenanceHistory: false,
        },
        errors: {
          ...state.errors,
          maintenanceHistory: null,
        },
      };
    case ADD_MAINTENANCE_RECORD_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          maintenanceHistory: false,
        },
        errors: {
          ...state.errors,
          maintenanceHistory: action.payload,
        },
      };

    // =============================================================================
    // VEHICLE SCHEDULES CASES
    // =============================================================================
    case FETCH_VEHICLE_SCHEDULES_SUCCESS:
      return {
        ...state,
        schedules: action.payload,
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: null,
        },
      };
    case FETCH_VEHICLE_SCHEDULES_FAILURE:
      return {
        ...state,
        schedules: [],
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: action.payload,
        },
      };
    case ADD_VEHICLE_SCHEDULE_SUCCESS:
      return {
        ...state,
        schedules: [action.payload, ...state.schedules],
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: null,
        },
      };
    case ADD_VEHICLE_SCHEDULE_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: action.payload,
        },
      };
    case UPDATE_VEHICLE_SCHEDULE_SUCCESS:
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: null,
        },
      };
    case UPDATE_VEHICLE_SCHEDULE_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: action.payload,
        },
      };
    case DELETE_VEHICLE_SCHEDULE_SUCCESS:
      return {
        ...state,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload),
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: null,
        },
      };
    case DELETE_VEHICLE_SCHEDULE_FAILURE:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          schedules: false,
        },
        errors: {
          ...state.errors,
          schedules: action.payload,
        },
      };

    default:
      return state;
  }
};

export default VehicleReducer;
