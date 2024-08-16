import axiosInstance from './../../api/axiosInstance';

// Action Types
export const FETCH_TANK_VOLUME_HISTORY_SUCCESS = 'FETCH_TANK_VOLUME_HISTORY_SUCCESS';
export const FETCH_TANK_VOLUME_HISTORY_FAILURE = 'FETCH_TANK_VOLUME_HISTORY_FAILURE';
export const FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS = 'FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS';
export const FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE = 'FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE';
export const FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS = 'FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS';
export const FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE = 'FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE';

// Action Creators
export const fetchTankVolumeHistory = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/tankvolumehistory');
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_FAILURE, payload: error.message });
  }
};

export const fetchTankVolumeHistoryBySiteId = (startDate,endDate,siteId) => async (dispatch) => { 

  try {
    const response = await axiosInstance.get(`/tankvolumehistory/bySite`, {
      params: { StartDate: startDate, EndDate: endDate, siteId: siteId }
    });
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS, payload: response.data });
  } catch (error) {
    console.error("Error fetching tank volume history:", error);
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE, payload: error.message });
  }

};
 


export const fetchTankVolumeHistoryByTankId = (startDate,endDate, tankId) => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/tankvolumehistory/byTankAndDateRange`, {
      params: { StartDate: startDate, EndDate: endDate, tankId: tankId }
    });
    
    dispatch({ 
      type: FETCH_TANK_VOLUME_HISTORY_BY_ID_SUCCESS, 
      payload: response.data
    });
  } catch (error) {
    console.error("Error fetching tank volume history:", error);
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_BY_ID_FAILURE, payload: error.message });
  }
};

export const fetchTankVolumeHistoryByDateRange = (startDate, endDate) => async (dispatch) => {
  try {
    console.log("Start Date",startDate + " " +"end Date:" +endDate )
    const response = await axiosInstance.get('/tankvolumehistory/byDateRange', {
      params: { StartDate: startDate, EndDate: endDate}
    });
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_TANK_VOLUME_HISTORY_BY_DATE_RANGE_FAILURE, payload: error.message });
  }
};