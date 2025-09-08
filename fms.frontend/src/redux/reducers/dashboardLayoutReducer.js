import { DASHBOARD_LAYOUT_ACTIONS } from '../actions/dashboardLayoutActions';

const initialState = {
  loading: false,
  saving: false,
  error: null,
  layout: {
    layoutName: 'Category Grouped Dashboard',
    categoryOrder: [],
    widgetOrder: {},
    widgetSizes: {},
    version: '1.0'
  },
  lastSavedAt: null
};

const dashboardLayoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_SUCCESS:
      console.log('Dashboard Layout Reducer: Layout loaded successfully:', action.payload);
      return {
        ...state,
        loading: false,
        layout: {
          ...state.layout,
          ...action.payload
        },
        error: null
      };

    case DASHBOARD_LAYOUT_ACTIONS.LOAD_LAYOUT_FAILURE:
      console.log('Dashboard Layout Reducer: Layout loading failed:', action.payload);
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case DASHBOARD_LAYOUT_ACTIONS.UPDATE_LAYOUT:
      return {
        ...state,
        layout: {
          ...state.layout,
          ...action.payload
        }
      };

    case DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_REQUEST:
      return {
        ...state,
        saving: true,
        error: null
      };

    case DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_SUCCESS:
      console.log('Dashboard Layout Reducer: Layout saved successfully:', action.payload);
      return {
        ...state,
        saving: false,
        layout: {
          ...state.layout,
          ...action.payload
        },
        lastSavedAt: new Date().toISOString(),
        error: null
      };

    case DASHBOARD_LAYOUT_ACTIONS.SAVE_LAYOUT_FAILURE:
      return {
        ...state,
        saving: false,
        error: action.payload
      };

    case DASHBOARD_LAYOUT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};export default dashboardLayoutReducer;
