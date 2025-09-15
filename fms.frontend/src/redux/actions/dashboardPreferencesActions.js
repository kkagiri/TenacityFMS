import { DASHBOARD_PREF_TYPES } from '../types/dashboardPreferencesTypes';
import dashboardService from '../../services/dashboardService';

// Thunk: fetch user preferences & templates in parallel (templates first for filtering)
export const loadDashboardInitialization = () => async (dispatch) => {
  dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_REQUEST });
  try {
    const templatesResp = await dashboardService.getTickerTemplates(true);
    if (!templatesResp.success) throw new Error(templatesResp.message || 'Failed to load templates');
    const templates = templatesResp.data || [];
    dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_SUCCESS, payload: templates });
  } catch (err) {
    dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_FAILURE, payload: err.message });
  }

  dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_REQUEST });
  try {
    const prefResp = await dashboardService.getPreferences();
    if (!prefResp.success) throw new Error(prefResp.message || 'Failed to load preferences');
    dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_SUCCESS, payload: prefResp.data });
  } catch (err) {
    dispatch({ type: DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_FAILURE, payload: err.message });
  }
};

export const toggleTicker = (tickerType) => ({
  type: DASHBOARD_PREF_TYPES.TOGGLE_TICKER,
  payload: tickerType
});

export const setTickerOrder = (orderedTypes) => ({
  type: DASHBOARD_PREF_TYPES.SET_TICKER_ORDER,
  payload: orderedTypes
});

export const setSiteFilters = (siteIds) => ({
  type: DASHBOARD_PREF_TYPES.SET_SITE_FILTERS,
  payload: siteIds
});

export const setTankFilters = (tankIds) => ({
  type: DASHBOARD_PREF_TYPES.SET_TANK_FILTERS,
  payload: tankIds
});

export const setVehicleFilters = (vehicleIds) => ({
  type: DASHBOARD_PREF_TYPES.SET_VEHICLE_FILTERS,
  payload: vehicleIds
});

export const setTickerSizes = (sizes) => ({
  type: DASHBOARD_PREF_TYPES.SET_TICKER_SIZES,
  payload: sizes
});

export const setLayoutSettings = (settings) => ({
  type: DASHBOARD_PREF_TYPES.SET_LAYOUT_SETTINGS,
  payload: settings
});

let saveInFlight = null;

export const savePreferences = () => async (dispatch, getState) => {
  const state = getState().dashboardPreferences;
  if (!state) return;
  if (saveInFlight) return; // basic coalescing
  dispatch({ type: DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_REQUEST });
  const preferencesJson = JSON.stringify({
    enabledTickers: state.enabledTickers,
    tickerOrder: state.tickerOrder,
    siteFilters: state.siteFilters,
    tankFilters: state.tankFilters,
    vehicleFilters: state.vehicleFilters,
    tickerSizes: state.tickerSizes,
    layoutSettings: state.layoutSettings
  });
  try {
    saveInFlight = dashboardService.savePreferences({ preferencesJson, version: state.version || '1.0' });
    const resp = await saveInFlight;
    saveInFlight = null;
    if (!resp.success) throw new Error(resp.message || 'Save failed');
    dispatch({ type: DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_SUCCESS, payload: resp.data });
  } catch (err) {
    saveInFlight = null;
    dispatch({ type: DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_FAILURE, payload: err.message });
  }
};

export const clearDashboardError = () => ({ type: DASHBOARD_PREF_TYPES.CLEAR_ERROR });
