import {
    FETCH_FUEL_REFILLS_SUCCESS,
    FETCH_FUEL_REFILLS_FAILURE,
    CREATE_FUEL_REFILL_SUCCESS,
    CREATE_FUEL_REFILL_FAILURE,
    UPDATE_FUEL_REFILL_SUCCESS,
    UPDATE_FUEL_REFILL_FAILURE,
    DELETE_FUEL_REFILL_SUCCESS,
    DELETE_FUEL_REFILL_FAILURE
} from './../actions/fuelRefillAction';

const initialState = {
    fuelRefills: [],
    loading: true,
    error: null,
};

const fuelRefillReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_FUEL_REFILLS_SUCCESS:
            return {
                ...state,
                fuelRefills: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_FUEL_REFILLS_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case CREATE_FUEL_REFILL_SUCCESS:
            return {
                ...state,
                fuelRefills: [...state.fuelRefills, action.payload],
                loading: false,
                error: null,
            };
        case CREATE_FUEL_REFILL_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case UPDATE_FUEL_REFILL_SUCCESS:
            return {
                ...state,
                fuelRefills: state.fuelRefills.map(fuelRefill =>
                    fuelRefill.id === action.payload.id ? action.payload.fuelRefill : fuelRefill
                ),
                loading: false,
                error: null,
            };
        case UPDATE_FUEL_REFILL_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case DELETE_FUEL_REFILL_SUCCESS:
            return {
                ...state,
                fuelRefills: state.fuelRefills.filter(fuelRefill => fuelRefill.id !== action.payload),
                loading: false,
                error: null,
            };
        case DELETE_FUEL_REFILL_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};

export default fuelRefillReducer;
