import {
    FETCH_CONSUMPTION_SUMMARY_REQUEST,
    FETCH_CONSUMPTION_SUMMARY_SUCCESS,
    FETCH_CONSUMPTION_SUMMARY_FAILURE,
    CLEAR_CONSUMPTION_SUMMARY,
    FETCH_VEHICLE_CONSUMPTION_DETAIL_REQUEST,
    FETCH_VEHICLE_CONSUMPTION_DETAIL_SUCCESS,
    FETCH_VEHICLE_CONSUMPTION_DETAIL_FAILURE,
    CLEAR_VEHICLE_CONSUMPTION_DETAIL
} from '../actions/consumptionSummaryActions';

const initialState = {
    // Summary data
    summaryData: null,
    loading: false,
    error: null,

    // Vehicle detail data
    vehicleDetail: null,
    detailLoading: false,
    detailError: null
};

const consumptionSummaryReducer = (state = initialState, action) => {
    switch (action.type) {
        // Summary actions
        case FETCH_CONSUMPTION_SUMMARY_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };

        case FETCH_CONSUMPTION_SUMMARY_SUCCESS:
            return {
                ...state,
                loading: false,
                summaryData: action.payload,
                error: null
            };

        case FETCH_CONSUMPTION_SUMMARY_FAILURE:
            return {
                ...state,
                loading: false,
                summaryData: null,
                error: action.payload
            };

        case CLEAR_CONSUMPTION_SUMMARY:
            return {
                ...state,
                summaryData: null,
                loading: false,
                error: null
            };

        // Vehicle detail actions
        case FETCH_VEHICLE_CONSUMPTION_DETAIL_REQUEST:
            return {
                ...state,
                detailLoading: true,
                detailError: null
            };

        case FETCH_VEHICLE_CONSUMPTION_DETAIL_SUCCESS:
            return {
                ...state,
                detailLoading: false,
                vehicleDetail: action.payload,
                detailError: null
            };

        case FETCH_VEHICLE_CONSUMPTION_DETAIL_FAILURE:
            return {
                ...state,
                detailLoading: false,
                vehicleDetail: null,
                detailError: action.payload
            };

        case CLEAR_VEHICLE_CONSUMPTION_DETAIL:
            return {
                ...state,
                vehicleDetail: null,
                detailLoading: false,
                detailError: null
            };

        default:
            return state;
    }
};

export default consumptionSummaryReducer;
