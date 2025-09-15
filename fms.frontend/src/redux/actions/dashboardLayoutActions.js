import dashboardService from '../../services/dashboardService';

// Action Types
export const DASHBOARD_LAYOUT_ACTIONS = {
  LOAD_LAYOUT_REQUEST: 'DASHBOARD_LAYOUT/LOAD_LAYOUT_REQUEST',
  LOAD_LAYOUT_SUCCESS: 'DASHBOARD_LAYOUT/LOAD_LAYOUT_SUCCESS',
  LOAD_LAYOUT_FAILURE: 'DASHBOARD_LAYOUT/LOAD_LAYOUT_FAILURE',
  UPDATE_LAYOUT: 'DASHBOARD_LAYOUT/UPDATE_LAYOUT',
  SAVE_LAYOUT_REQUEST: 'DASHBOARD_LAYOUT/SAVE_LAYOUT_REQUEST',
  SAVE_LAYOUT_SUCCESS: 'DASHBOARD_LAYOUT/SAVE_LAYOUT_SUCCESS',
  SAVE_LAYOUT_FAILURE: 'DASHBOARD_LAYOUT/SAVE_LAYOUT_FAILURE',
  CLEAR_ERROR: 'DASHBOARD_LAYOUT/CLEAR_ERROR'
};

// Action Creators
export const loadDashboardLayout = () => async (dispatch) => {
  dispatch({ type: DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_REQUEST });

  try {
    const result = await dashboardService.getDashboardLayout();

    if (result.success && result.data) {
      dispatch({
        type: DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_SUCCESS,
        payload: result.data
      });
    } else if (result && result.layoutName !== undefined) {
      // Handle direct response format (API returns layout data directly)
      dispatch({
        type: DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_SUCCESS,
        payload: result
      });
    } else {
      throw new Error(result?.message || 'Failed to load dashboard layout - invalid response format');
    }
  } catch (error) {
    console.error('Redux Action: Failed to load dashboard layout:', error);
    dispatch({
      type: DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_FAILURE,
      payload: error.message || 'Failed to load dashboard layout'
    });
  }
};export const updateDashboardLayout = (layoutData) => ({
  type: DASHBOARD_LAYOUT_ACTIONS.UPDATE_LAYOUT,
  payload: layoutData
});

export const saveDashboardLayout = (layoutData) => async (dispatch) => {
  dispatch({ type: DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_REQUEST });

  try {
    const result = await dashboardService.saveDashboardLayout(layoutData);

    if (result.success) {
      dispatch({
        type: DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_SUCCESS,
        payload: layoutData
      });
    } else {
      throw new Error(result.message || 'Failed to save dashboard layout');
    }
  } catch (error) {
    console.error('Redux Action: Failed to save dashboard layout:', error);
    dispatch({
      type: DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_FAILURE,
      payload: error.message || 'Failed to save dashboard layout'
    });
  }
};export const clearDashboardLayoutError = () => ({
  type: DASHBOARD_LAYOUT_ACTIONS.CLEAR_ERROR
});
