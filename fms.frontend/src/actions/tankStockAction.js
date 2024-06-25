import axiosInstance from '../api/axiosInstance';

export const FETCH_TANK_STOCKS_SUCCESS = 'FETCH_TANK_STOCKS_SUCCESS';
export const FETCH_TANK_STOCKS_FAILURE = 'FETCH_TANK_STOCKS_FAILURE';
export const CREATE_TANK_STOCK_SUCCESS = 'CREATE_TANK_STOCK_SUCCESS';
export const CREATE_TANK_STOCK_FAILURE = 'CREATE_TANK_STOCK_FAILURE';
export const UPDATE_TANK_STOCK_SUCCESS = 'UPDATE_TANK_STOCK_SUCCESS';
export const UPDATE_TANK_STOCK_FAILURE = 'UPDATE_TANK_STOCK_FAILURE';
export const DELETE_TANK_STOCK_SUCCESS = 'DELETE_TANK_STOCK_SUCCESS';
export const DELETE_TANK_STOCK_FAILURE = 'DELETE_TANK_STOCK_FAILURE';

export const fetchTankStocks = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/tankstock');
        dispatch({ type: FETCH_TANK_STOCKS_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: FETCH_TANK_STOCKS_FAILURE, payload: error.message });
    }
};

export const createTankStock = (tankStock) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/tankstock', tankStock);
        dispatch({ type: CREATE_TANK_STOCK_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: CREATE_TANK_STOCK_FAILURE, payload: error.message });
    }
};

export const updateTankStock = (id, tankStock) => async (dispatch) => {
    try {
        await axiosInstance.put(`/tankstock/${id}`, tankStock);
        dispatch({ type: UPDATE_TANK_STOCK_SUCCESS, payload: { id, tankStock } });
    } catch (error) {
        dispatch({ type: UPDATE_TANK_STOCK_FAILURE, payload: error.message });
    }
};

export const deleteTankStock = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/tankstock/${id}`);
        dispatch({ type: DELETE_TANK_STOCK_SUCCESS, payload: id });
    } catch (error) {
        dispatch({ type: DELETE_TANK_STOCK_FAILURE, payload: error.message });
    }
};
