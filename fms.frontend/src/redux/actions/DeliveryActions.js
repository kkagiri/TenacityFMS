import axiosInstance from './../../api/axiosInstance';

export const FETCH_DELIVERIES_SUCCESS = 'FETCH_DELIVERIES_SUCCESS';
export const FETCH_DELIVERIES_FAILURE = 'FETCH_DELIVERIES_FAILURE';

export const CREATE_DELIVERY_SUCCESS = 'CREATE_DELIVERY_SUCCESS';
export const CREATE_DELIVERY_FAILURE = 'CREATE_DELIVERY_FAILURE';


export const fetchDeliveries = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery');
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const fetchDeliveriesbyDateRange = (startDate,endDate) => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery/byDateRange?startDate='+startDate+'&endDate='+endDate);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const fetchDeliveriesbyDateRangebySiteId = (startDate,endDate,siteId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/delivery/byDateRangebySite?startDate='+startDate+'&endDate='+endDate + '&siteId='+siteId);
        dispatch({ type: FETCH_DELIVERIES_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_DELIVERIES_FAILURE, payload: error.message });
    }
};

export const createDelivery = (delivery) => async (dispatch) => {

try
{
    const response = await axiosInstance.post('/delivery/create', delivery);

    if(response.data.success)
    {
        dispatch({ type: CREATE_DELIVERY_SUCCESS, payload: response.data.message });
        return response.data;
    }
    else
    {
        dispatch({type: CREATE_DELIVERY_FAILURE, payload: response.data.message});
     return response.message;
    }
}
catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Error Delivery";

    dispatch({ type: CREATE_DELIVERY_FAILURE, payload: errorMessage });

    return {sucess:false, message:errorMessage};
}
};
