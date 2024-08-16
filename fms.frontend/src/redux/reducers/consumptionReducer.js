import {
    FETCH_CONSUMPTION_SUCCESS,
    FETCH_CONSUMPTION_FAILURE,
    FETCH_VEHICLE_REFILLS_REQUEST ,
    FETCH_VEHICLE_REFILLS_FAILURE,
} from '../actions/consumptionActions';

const initialState = {
    consumption: [],
    vehicleRefills: [],
    loading: false,
    error: null,
};

const consumptionReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CONSUMPTION_SUCCESS:
            return { ...state, consumption: action.payload, loading: false, error: null };
        case FETCH_CONSUMPTION_FAILURE:
            return { ...state, loading: false, error: action.payload };
        case FETCH_VEHICLE_REFILLS_REQUEST:
            return { ...state, vehicleRefills: action.payload, loading: false, error: null };
        case FETCH_VEHICLE_REFILLS_FAILURE:
            return { ...state, loading: false, error: action.payload };
            
        default:
            return state;
    }
};

export default consumptionReducer;