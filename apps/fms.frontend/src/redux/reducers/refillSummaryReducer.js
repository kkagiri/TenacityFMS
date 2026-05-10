 import {FETCH_REFILL_SUMMARY_REQUEST,FETCH_REFILL_SUMMARY_SUCCESS, FETCH_REFILL_SUMMARY_FAILURE } from '../actions/refillSummaryActions';

const initialState = {
    refillSummary: [],
    loading: false,
    error: null
}

const refillSummaryReducer = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_REFILL_SUMMARY_REQUEST:
            return { ...state, loading: true };
        case FETCH_REFILL_SUMMARY_SUCCESS:
            return { ...state, refillSummary: action.payload, loading: false };
        case FETCH_REFILL_SUMMARY_FAILURE:
            return { ...state, error: action.payload, loading: false };
        default:
            return state;
    }
};

export default refillSummaryReducer;


