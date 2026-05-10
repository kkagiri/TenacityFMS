import { DASHBOARD_PREF_TYPES } from '../types/dashboardPreferencesTypes';

const initialState = {
  loading: {
    templates: false,
    preferences: false,
    save: false
  },
  error: null,
  templates: [], // backend provided templates (already filtered by role / permissions)
  preferencesRaw: null, // last DTO from backend
  enabledTickers: [],
  tickerOrder: [],
  siteFilters: [], // array of selected site IDs (strings or numbers depending on backend)
  tankFilters: [],
  vehicleFilters: [],
  tickerSizes: {}, // { tickerType: 'full'|'half'|'quarter'|'auto' }
  layoutSettings: {
    compactMode: false,
    responsiveLayout: true
  },
  version: '1.0',
  dirty: false,
  lastSavedAt: null
};

export default function dashboardPreferencesReducer(state = initialState, action) {
  switch (action.type) {
    case DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_REQUEST:
      return { ...state, loading: { ...state.loading, templates: true }, error: null };
    case DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_SUCCESS: {
      const templates = action.payload || [];
      // If we have no preferences yet, initialize enabledTickers and order to all enabled templates
      if (!state.preferencesRaw) {
        const initialEnabled = templates.filter(t => t.isEnabled).map(t => t.tickerType);
        return {
          ...state,
          templates,
          enabledTickers: initialEnabled,
          tickerOrder: initialEnabled,
          loading: { ...state.loading, templates: false }
        };
      }
      return { ...state, templates, loading: { ...state.loading, templates: false } };
    }
    case DASHBOARD_PREF_TYPES.FETCH_TEMPLATES_FAILURE:
      return { ...state, loading: { ...state.loading, templates: false }, error: action.payload };

    case DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_REQUEST:
      return { ...state, loading: { ...state.loading, preferences: true }, error: null };
    case DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_SUCCESS: {
      const dto = action.payload;
      let enabledTickers = state.enabledTickers;
      let tickerOrder = state.tickerOrder;
      let tickerSizes = state.tickerSizes;
      let layoutSettings = state.layoutSettings;
      try {
        if (dto?.preferencesJson) {
          const parsed = JSON.parse(dto.preferencesJson);
          enabledTickers = parsed.enabledTickers || enabledTickers;
          tickerOrder = parsed.tickerOrder || tickerOrder;
          tickerSizes = parsed.tickerSizes || tickerSizes;
          layoutSettings = { ...layoutSettings, ...(parsed.layoutSettings || {}) };
          // Backward compatible: if siteFilters not present keep empty
          if (Array.isArray(parsed.siteFilters)) state = { ...state, siteFilters: parsed.siteFilters };
          if (Array.isArray(parsed.tankFilters)) state = { ...state, tankFilters: parsed.tankFilters };
            if (Array.isArray(parsed.vehicleFilters)) state = { ...state, vehicleFilters: parsed.vehicleFilters };
        }
      } catch { /* ignore parse errors */ }
      return {
        ...state,
        preferencesRaw: dto,
        enabledTickers,
        tickerOrder,
        tickerSizes,
        layoutSettings,
        version: dto?.version || state.version,
        loading: { ...state.loading, preferences: false }
      };
    }
    case DASHBOARD_PREF_TYPES.FETCH_PREFERENCES_FAILURE:
      return { ...state, loading: { ...state.loading, preferences: false }, error: action.payload };

    case DASHBOARD_PREF_TYPES.TOGGLE_TICKER: {
      const ticker = action.payload;
      const isEnabled = state.enabledTickers.includes(ticker);
      const enabledTickers = isEnabled ? state.enabledTickers.filter(t => t !== ticker) : [...state.enabledTickers, ticker];
      const tickerOrder = isEnabled ? state.tickerOrder.filter(t => t !== ticker) : (state.tickerOrder.includes(ticker) ? state.tickerOrder : [...state.tickerOrder, ticker]);
      return { ...state, enabledTickers, tickerOrder, dirty: true };
    }
    case DASHBOARD_PREF_TYPES.SET_TICKER_ORDER:
      return { ...state, tickerOrder: action.payload, dirty: true };
    case DASHBOARD_PREF_TYPES.SET_SITE_FILTERS: {
      const next = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, siteFilters: next, dirty: true };
    }
    case DASHBOARD_PREF_TYPES.SET_TANK_FILTERS: {
      const next = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, tankFilters: next, dirty: true };
    }
    case DASHBOARD_PREF_TYPES.SET_VEHICLE_FILTERS: {
      const next = Array.isArray(action.payload) ? action.payload : [];
      return { ...state, vehicleFilters: next, dirty: true };
    }
    case DASHBOARD_PREF_TYPES.SET_TICKER_SIZES: {
      const sizes = action.payload || {};
      return { ...state, tickerSizes: { ...state.tickerSizes, ...sizes }, dirty: true };
    }
    case DASHBOARD_PREF_TYPES.SET_LAYOUT_SETTINGS: {
      const settings = action.payload || {};
      return { ...state, layoutSettings: { ...state.layoutSettings, ...settings }, dirty: true };
    }

    case DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_REQUEST:
      return { ...state, loading: { ...state.loading, save: true }, error: null };
    case DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_SUCCESS: {
      const dto = action.payload;
      return { ...state, loading: { ...state.loading, save: false }, dirty: false, preferencesRaw: dto, lastSavedAt: new Date().toISOString(), version: dto?.version || state.version };
    }
    case DASHBOARD_PREF_TYPES.SAVE_PREFERENCES_FAILURE:
      return { ...state, loading: { ...state.loading, save: false }, error: action.payload };

    case DASHBOARD_PREF_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
}
