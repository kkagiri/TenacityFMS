import {
    FETCH_DELIVERIES_SUCCESS,
    FETCH_DELIVERIES_FAILURE,
    CREATE_DELIVERY_SUCCESS,
    CREATE_DELIVERY_FAILURE

} from '../actions/DeliveryActions';

const initialState = {
    deliveries: [],
    loading: false,
    error: null,
};

const DeliveryReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_DELIVERIES_SUCCESS:
            return {
                ...state,
                deliveries: action.payload,
                loading: true,
                error: null,
            };
        case FETCH_DELIVERIES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        case CREATE_DELIVERY_SUCCESS:
            return {
                ...state,
                deliveries: [...state.deliveries, action.payload],
                loading: false,
                error: null,
            };
        case CREATE_DELIVERY_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };
        default:
            return state;
    }
};

export default DeliveryReducer;