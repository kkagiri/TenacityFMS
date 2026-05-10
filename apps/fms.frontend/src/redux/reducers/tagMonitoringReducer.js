//Cursor
const initialState = {
  configs: [],
  logs: [],
  loading: false,
};

export default function tagMonitoringReducer(state = initialState, action) {
  switch (action.type) {
    case "TAG_CONFIGS_LOADING":
      return { ...state, loading: true };
    case "TAG_CONFIGS_SUCCESS":
      return { ...state, configs: action.payload, loading: false };
    case "TAG_LOGS_LOADING":
      return { ...state, loading: true };
    case "TAG_LOGS_SUCCESS":
      return { ...state, logs: action.payload, loading: false };
    default:
      return state;
  }
}
