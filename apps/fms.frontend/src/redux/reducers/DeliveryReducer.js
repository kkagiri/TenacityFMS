import {
    FETCH_DELIVERIES_REQUEST,
    FETCH_DELIVERIES_SUCCESS,
    FETCH_DELIVERIES_FAILURE,
    CREATE_DELIVERY_REQUEST,
    CREATE_DELIVERY_SUCCESS,
    CREATE_DELIVERY_FAILURE,
    UPDATE_DELIVERY_REQUEST,
    UPDATE_DELIVERY_SUCCESS,
    UPDATE_DELIVERY_FAILURE,
    DELETE_DELIVERY_REQUEST,
    DELETE_DELIVERY_SUCCESS,
    DELETE_DELIVERY_FAILURE,
    CLEAR_DELIVERY_ERROR
} from '../actions/DeliveryActions';

const initialState = {
    deliveries: [],
    loading: false,
    error: null,
};

const DeliveryReducer = (state = initialState, action) => {
    switch (action.type) {
        // Fetch deliveries
        case FETCH_DELIVERIES_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case FETCH_DELIVERIES_SUCCESS:
            return {
                ...state,
                deliveries: action.payload,
                loading: false,
                error: null,
            };
        case FETCH_DELIVERIES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Create delivery
        case CREATE_DELIVERY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case CREATE_DELIVERY_SUCCESS:
            return {
                ...state,
                deliveries: [...state.deliveries, action.payload.data],
                loading: false,
                error: null,
            };
        case CREATE_DELIVERY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Update delivery
        case UPDATE_DELIVERY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case UPDATE_DELIVERY_SUCCESS:
            return {
                ...state,
                // Refresh the list after update (component will re-fetch)
                loading: false,
                error: null,
            };
        case UPDATE_DELIVERY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Delete delivery
        case DELETE_DELIVERY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case DELETE_DELIVERY_SUCCESS:
            return {
                ...state,
                deliveries: state.deliveries.filter(d => d.deliveryId !== action.payload.deliveryId),
                loading: false,
                error: null,
            };
        case DELETE_DELIVERY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        // Clear error
        case CLEAR_DELIVERY_ERROR:
            return {
                ...state,
                error: null,
            };

        default:
            return state;
    }
};

export default DeliveryReducer;