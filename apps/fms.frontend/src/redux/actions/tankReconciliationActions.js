import axiosInstance from './../../api/axiosInstance';



export const FETCH_TANK_RECONCILIATION_SUCCESS = 'FETCH_TANK_RECONCILIATION_SUCCESS';
export const FETCH_TANK_RECONCILIATION_FAILURE = 'FETCH_TANK_RECONCILIATION_FAILURE';
export const FETCH_TANK_RECONCILIATION_BY_SITE_SUCCESS = 'FETCH_TANK_RECONCILIATION_BY_SITE_SUCCESS';
export const FETCH_TANK_RECONCILIATION_BY_SITE_FAILURE = 'FETCH_TANK_RECONCILIATION_BY_SITE_FAILURE';

export const fetchTankReconciliation = (startDate, endDate) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/tankreconciliation?startDate=${startDate}&endDate=${endDate}`);
    dispatch({ type: FETCH_TANK_RECONCILIATION_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_TANK_RECONCILIATION_FAILURE, payload: error.message });
  }
};

export const fetchTankReconciliationBySite = (startDate, endDate, siteId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/tankreconciliation/by-site?startDate=${startDate}&endDate=${endDate}&siteId=${siteId}`);
    dispatch({ type: FETCH_TANK_RECONCILIATION_BY_SITE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_TANK_RECONCILIATION_BY_SITE_FAILURE, payload: error.message });
  }
};
