import axiosInstance from './../../api/axiosInstance';

export const FETCH_REFILL_SUMMARY_REQUEST = 'FETCH_REFILL_SUMMARY_REQUEST';

export const FETCH_REFILL_SUMMARY_SUCCESS = 'FETCH_REFILL_SUMMARY_SUCCESS';
export const FETCH_REFILL_SUMMARY_FAILURE = 'FETCH_REFILL_SUMMARY_FAILURE'

export const fetchRefillSummary = (startDate, endDate, siteId = null) => async (dispatch) => {
    dispatch({ type: FETCH_REFILL_SUMMARY_REQUEST });

    try {
        let url = '/fuelRefill/summary';
        if (siteId && siteId !== 'all') {
            url = `/fuelRefill/summary/${siteId}`;
        }
        const response = await axiosInstance.get(url, {
            params: { startDate, endDate }
        });
        dispatch({ type: FETCH_REFILL_SUMMARY_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_REFILL_SUMMARY_FAILURE, payload: error.message });
    }
}