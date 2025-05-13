import {
  FETCH_VEHICLES_SUCCESS,
  FETCH_VEHICLES_FAILURE,
  UPDATE_VEHICLES_SUCCESS,
  UPDATE_VEHICLES_FAILURE,
} from "../actions/vehicleActions";

const initialState = {
  vehicles: [],
  loading: true,
  error: null,
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
    case UPDATE_VEHICLES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default VehicleReducer;
